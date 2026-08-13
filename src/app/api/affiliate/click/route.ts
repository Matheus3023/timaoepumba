import { NextResponse, type NextRequest } from "next/server";
import { LEAD_ID_COOKIE } from "@/lib/tracking/leadId";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { buildAffiliateUrl } from "@/lib/affiliate/linkBuilder";
import { logTimelineEvent } from "@/lib/crm/timeline";
import { moveUserToStage } from "@/lib/crm/pipeline";
import { trackServerEvent } from "@/lib/tracking/events";

/**
 * Redirect endpoint do botão "Criar minha conta na Bateu".
 *
 * NÃO exige sessão: no modelo espelho quem clica em "criar conta" normalmente
 * ainda NÃO tem conta no app (nem na casa). Monta a URL de afiliado com o
 * Lead ID como `afp` e manda o navegador para o cadastro da casa. A
 * atribuição real volta pelo postback com esse mesmo `afp` — o clique no DB é
 * só telemetria.
 *
 * Se houver sessão (usuário já provisionado voltando a clicar), aproveita
 * para mover o CRM; sem sessão, registra o clique só pelo lead_id.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const leadId = request.cookies.get(LEAD_ID_COOKIE)?.value;
  if (!leadId) {
    // Sem lead_id não há como atribuir. Isso não deveria acontecer (o
    // middleware seta para todo visitante), mas se acontecer manda para a
    // tela de login em vez de deixar o botão morto.
    return NextResponse.redirect(new URL("/entrar?affiliate_error=missing_lead_id", request.url));
  }

  const admin = createAdminSupabaseClient();
  const { data: config } = await admin
    .from("affiliate_configurations")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!config) {
    return NextResponse.redirect(new URL("/entrar?affiliate_error=not_configured", request.url));
  }

  const generatedUrl = buildAffiliateUrl(config, leadId);

  // Telemetria best-effort: nunca segura o redirect. O cadastro na casa é o
  // que importa; se um log falhar, o usuário não pode ficar preso aqui.
  const tarefas: PromiseLike<unknown>[] = [
    admin.from("affiliate_clicks").insert({
      user_id: user?.id ?? null,
      lead_id: leadId,
      affiliate_configuration_id: config.id,
      generated_url: generatedUrl,
    }),
    trackServerEvent({ eventName: "SportsbookLinkClicked", leadId, userId: user?.id }),
  ];
  if (user) {
    tarefas.push(
      moveUserToStage(user.id, "Clicou na casa"),
      logTimelineEvent({
        userId: user.id,
        eventType: "affiliate_click",
        description: "Clicou no cadastro da casa parceira",
      }),
      admin.from("automation_runs").insert({
        automation_key: "affiliate_clicked",
        user_id: user.id,
        status: "success",
        details: { affiliate_configuration_id: config.id },
      })
    );
  }
  await Promise.allSettled(tarefas);

  return NextResponse.redirect(generatedUrl);
}
