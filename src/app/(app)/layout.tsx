import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { syncCommunityMembership } from "@/lib/entitlements/rules";
import { needsRegistration } from "@/lib/entitlements/levels";
import { BottomNav } from "@/components/app/BottomNav";
import { FloatingDepositButton } from "@/components/app/FloatingDepositButton";
import { PageTransition } from "@/components/app/PageTransition";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sem sessão do app, a porta é a conta da Bateu (/entrar), não a tela de
  // login antiga — que não existe mais. Era aí que o usuário se perdia.
  if (!user) {
    redirect("/entrar");
  }

  const [{ data: profile }, { data: appUser }] = await Promise.all([
    supabase.from("user_profiles").select("onboarding_completed").eq("user_id", user.id).maybeSingle(),
    supabase.from("users").select("access_level").eq("id", user.id).maybeSingle(),
  ]);

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  // Porta de entrada: sem cadastro na casa parceira, o app inteiro fica
  // fechado. Fica DEPOIS do onboarding de proposito — o usuario precisa ter
  // conta aqui (e portanto lead_id) antes de ser mandado para a casa, senao
  // nao ha a quem atribuir o cadastro quando o postback voltar.
  // Sem conta na casa liberada, o app fica fechado. O usuario entra com a
  // conta da casa em /entrar; um login valido promove e libera. /entrar tem
  // tambem o caminho de criar conta na casa para quem ainda nao tem.
  if (needsRegistration(appUser?.access_level)) {
    redirect("/entrar");
  }

  // Self-heals community room membership on every app page view (not just
  // /comunidade) so it's never dependent on the signup hook or a one-time
  // migration backfill having run for this specific account — cheap
  // (upsert, no-op if already a member).
  if (appUser) {
    await syncCommunityMembership(user.id, appUser.access_level);
  }

  return (
    <div className="flex min-h-dvh flex-col overscroll-y-none pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <div className="flex-1">
        <PageTransition>{children}</PageTransition>
      </div>
      <FloatingDepositButton />
      <BottomNav />
    </div>
  );
}
