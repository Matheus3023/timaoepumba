import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { syncCommunityMembership } from "@/lib/entitlements/rules";
import { BottomNav } from "@/components/app/BottomNav";
import { PageTransition } from "@/components/app/PageTransition";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: appUser }] = await Promise.all([
    supabase.from("user_profiles").select("onboarding_completed").eq("user_id", user.id).maybeSingle(),
    supabase.from("users").select("access_level").eq("id", user.id).maybeSingle(),
  ]);

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
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
      <BottomNav />
    </div>
  );
}
