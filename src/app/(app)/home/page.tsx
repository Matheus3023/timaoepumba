import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSportsDataProvider } from "@/lib/sports";
import { CACHE_TTL_SECONDS, getOrSetCache, sportsCacheKey, sportsDayKey } from "@/lib/sports/cache";
import { accessLevelSatisfies } from "@/lib/entitlements/rules";
import { HomeView } from "@/components/app/HomeView";
import { formatStaleAge } from "@/lib/sports/staleness";
import { loadCompetitionPriority, sortMatchesForDisplay } from "@/lib/sports/curation";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: appUser }, { data: analyses }] = await Promise.all([
    supabase.from("users").select("full_name, access_level").eq("id", user!.id).single(),
    supabase
      .from("analyses")
      .select("id, title, summary, risk_level, min_access_level")
      .eq("status", "published")
      .order("publish_at", { ascending: false })
      .limit(3),
  ]);

  const provider = getSportsDataProvider();
  const { data: todayMatches, staleSince } = await getOrSetCache(
    sportsCacheKey("matches", sportsDayKey()),
    CACHE_TTL_SECONDS.todayMatches,
    () => provider.getTodayMatches()
  );

  // A resposta do provedor vem em ordem alfabetica de torneio, entao sem
  // isto a Home abriria com uma copa africana em vez do Brasileirao.
  const { available, priority } = await loadCompetitionPriority();
  const curatedMatches = sortMatchesForDisplay(todayMatches, priority, available);

  const accessLevel = appUser?.access_level ?? "APP_USER";
  const registrationDone = accessLevel !== "APP_USER" && accessLevel !== "VISITOR";
  const communityUnlocked = accessLevelSatisfies(accessLevel, "REGISTERED_USER");
  const ftdDone = accessLevelSatisfies(accessLevel, "FTD_USER");

  return (
    <HomeView
      firstName={appUser?.full_name?.split(" ")[0] ?? "torcedor"}
      registrationDone={registrationDone}
      communityUnlocked={communityUnlocked}
      ftdDone={ftdDone}
      todayMatches={curatedMatches}
      matchesStaleAge={formatStaleAge(staleSince)}
      analyses={analyses ?? []}
    />
  );
}
