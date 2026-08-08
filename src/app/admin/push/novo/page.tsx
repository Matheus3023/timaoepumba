import { redirect } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push/fcm";
import { canWrite, requireAdminSection } from "@/lib/admin/access";
import { logAudit } from "@/lib/admin/audit";
import { resolveSegmentUserIds } from "@/lib/segments/evaluate";
import { evaluateContactEligibility, type PushCategory } from "@/lib/communication/eligibility";
import type { SegmentCondition } from "@/lib/segments/types";

async function createAndSendCampaign(formData: FormData) {
  "use server";

  const access = await requireAdminSection("push");
  if (!canWrite(access, "push")) redirect("/admin/push");
  const admin = createAdminSupabaseClient();
  const category = String(formData.get("category") ?? "content") as PushCategory;
  const title = String(formData.get("title") ?? "");
  const message = String(formData.get("message") ?? "");
  const internalLink = String(formData.get("internal_link") ?? "") || null;
  const segmentId = String(formData.get("segment_id") ?? "") || null;

  const { data: campaign } = await admin
    .from("push_campaigns")
    .insert({
      internal_name: String(formData.get("internal_name") ?? title),
      category,
      segment_id: segmentId,
      title,
      message,
      internal_link: internalLink,
      status: "sending",
    })
    .select("id")
    .single();

  if (!campaign) redirect("/admin/push");

  let candidateIds: string[];
  if (segmentId) {
    const { data: segment } = await admin.from("crm_segments").select("definition").eq("id", segmentId).maybeSingle();
    candidateIds = await resolveSegmentUserIds((segment?.definition as SegmentCondition[]) ?? []);
  } else {
    candidateIds = await resolveSegmentUserIds([]);
  }

  // Motor de elegibilidade (PRD sec. 14): checa restricao, consentimento,
  // horario permitido e limite de frequencia antes de cada envio — em vez
  // de so filtrar opt-out como antes, cada usuario passa por essa
  // avaliacao individualmente e a supressao fica registrada com o motivo.
  let sentCount = 0;
  await Promise.all(
    candidateIds.map(async (userId) => {
      const eligibility = await evaluateContactEligibility(userId, category);
      if (!eligibility.eligible) {
        await admin.from("push_deliveries").insert({
          push_campaign_id: campaign.id,
          user_id: userId,
          status: "failed",
          failure_reason: eligibility.reason,
        });
        return;
      }

      const result = await sendPushToUser(userId, { title, body: message, link: internalLink ?? undefined });
      if (result.sent > 0) sentCount += 1;
      await admin.from("push_deliveries").insert({
        push_campaign_id: campaign.id,
        user_id: userId,
        status: result.sent > 0 ? "sent" : "failed",
        sent_at: result.sent > 0 ? new Date().toISOString() : null,
        failure_reason: result.sent > 0 ? null : "no_active_subscription_or_send_failed",
      });
    })
  );

  await admin.from("push_campaigns").update({ status: "sent" }).eq("id", campaign.id);
  await logAudit({
    actorId: access.adminId,
    action: "push_campaign_sent",
    entityType: "push_campaign",
    entityId: campaign.id,
    metadata: { category, segment_id: segmentId, candidates: candidateIds.length, sent: sentCount },
  });

  redirect("/admin/push");
}

export default async function NewPushCampaignPage() {
  const access = await requireAdminSection("push");
  if (!canWrite(access, "push")) redirect("/admin/push");

  const admin = createAdminSupabaseClient();
  const { data: segments } = await admin.from("crm_segments").select("id, name").order("name");

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-white">Nova campanha de push</h1>
      <p className="text-sm text-secondary">
        Cada destinatario passa pelo motor de elegibilidade (restricao, consentimento, horario permitido e limite de
        frequencia) antes do envio.
      </p>

      <form action={createAndSendCampaign} className="mt-4 flex flex-col gap-3">
        <input name="internal_name" placeholder="Nome interno" required className="input" />

        <select name="category" defaultValue="content" className="input">
          <option value="transactional">Transacional</option>
          <option value="content">Conteúdo</option>
          <option value="community">Comunidade</option>
          <option value="promotional">Promocional</option>
        </select>

        <label className="flex flex-col gap-1 text-sm text-body">
          Segmento (deixe vazio para todos os usuarios ativos)
          <select name="segment_id" defaultValue="" className="input">
            <option value="">Todos os usuários ativos</option>
            {segments?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <input name="title" placeholder="Título da notificação" required className="input" />
        <textarea name="message" placeholder="Mensagem" required rows={3} className="input" />
        <input name="internal_link" placeholder="Link interno (ex: /analises/123)" className="input" />

        <button type="submit" className="btn-primary mt-2 self-start px-6">
          Enviar agora
        </button>
      </form>
    </div>
  );
}
