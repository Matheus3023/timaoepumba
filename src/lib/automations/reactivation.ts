import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { logTimelineEvent } from "@/lib/crm/timeline";
import { moveUserToStage } from "@/lib/crm/pipeline";
import { sendPushToUser } from "@/lib/push/fcm";

/** Tag names seeded in supabase/migrations/0004_moderation.sql. */
const REACTIVATION_TAGS = {
  d3: "Reativacao D3",
  d7: "Reativacao D7",
  d15: "Reativacao D15",
} as const;

async function getTagId(name: string): Promise<string | null> {
  const admin = createAdminSupabaseClient();
  const { data } = await admin.from("crm_tags").select("id").eq("name", name).maybeSingle();
  return data?.id ?? null;
}

async function tagUser(userId: string, tagId: string) {
  const admin = createAdminSupabaseClient();
  await admin.from("crm_user_tags").upsert({ user_id: userId, tag_id: tagId }, { onConflict: "user_id,tag_id" });
}

async function userHasTag(userId: string, tagId: string): Promise<boolean> {
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("crm_user_tags")
    .select("user_id")
    .eq("user_id", userId)
    .eq("tag_id", tagId)
    .maybeSingle();
  return Boolean(data);
}

/**
 * Called whenever we see fresh activity from a logged-in user (session
 * flush — see /api/tracking/session). Stops the reactivation automation
 * the moment the user comes back (PRD sec. 19.5 "a automacao devera ser
 * interrompida quando o usuario voltar"): clears the D3/D7/D15 tags and
 * moves them out of "Em reativacao" so the next inactivity window can
 * retrigger cleanly.
 */
export async function markUserActive(userId: string) {
  const admin = createAdminSupabaseClient();

  const now = new Date().toISOString();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("last_seen_at")
    .eq("user_id", userId)
    .maybeSingle();

  await admin.from("user_profiles").update({ last_seen_at: now }).eq("user_id", userId);

  // Cheap early-exit: if they were already seen in the last day, they were
  // never far enough into an inactivity window to need cleanup.
  if (profile?.last_seen_at && Date.now() - new Date(profile.last_seen_at).getTime() < 24 * 60 * 60 * 1000) {
    return;
  }

  const tagIds = (
    await admin.from("crm_tags").select("id").in("name", Object.values(REACTIVATION_TAGS))
  ).data?.map((t) => t.id);

  if (tagIds?.length) {
    await admin.from("crm_user_tags").delete().eq("user_id", userId).in("tag_id", tagIds);
  }

  const { data: status } = await admin.from("crm_user_status").select("stage_id").eq("user_id", userId).maybeSingle();
  const stageName = status?.stage_id
    ? (await admin.from("crm_stages").select("name").eq("id", status.stage_id).maybeSingle()).data?.name
    : null;

  if (stageName === "Em reativacao") {
    await moveUserToStage(userId, "Usuario ativo");
    await logTimelineEvent({ userId, eventType: "user_reactivated", description: "Usuario reativado (voltou a acessar)" });
  }
}

interface RunSummary {
  d3: number;
  d7: number;
  d15: number;
}

/**
 * Batch job (PRD sec. 19.5). Meant to be triggered on a schedule (n8n,
 * Vercel Cron, etc.) via POST /api/automations/run-inactivity. Finds users
 * who just crossed the 3/7/15-day inactivity threshold and haven't been
 * tagged for that threshold yet, and applies the configured action.
 */
export async function runInactivityAutomation(): Promise<RunSummary> {
  const admin = createAdminSupabaseClient();
  const summary: RunSummary = { d3: 0, d7: 0, d15: 0 };

  const [d3Tag, d7Tag, d15Tag] = await Promise.all([
    getTagId(REACTIVATION_TAGS.d3),
    getTagId(REACTIVATION_TAGS.d7),
    getTagId(REACTIVATION_TAGS.d15),
  ]);
  if (!d3Tag || !d7Tag || !d15Tag) return summary;

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const { data: candidates } = await admin
    .from("user_profiles")
    .select("user_id, last_seen_at")
    .not("last_seen_at", "is", null)
    .lt("last_seen_at", new Date(now - 3 * dayMs).toISOString());

  for (const candidate of candidates ?? []) {
    const inactiveDays = Math.floor((now - new Date(candidate.last_seen_at as string).getTime()) / dayMs);

    if (inactiveDays >= 15 && !(await userHasTag(candidate.user_id, d15Tag))) {
      await tagUser(candidate.user_id, d15Tag);
      await admin
        .from("user_profiles")
        .update({
          alert_preferences: {
            new_analysis: false,
            match_start: false,
            live_goals: false,
            community_news: false,
            account_updates: true,
          },
        })
        .eq("user_id", candidate.user_id);
      await logTimelineEvent({
        userId: candidate.user_id,
        eventType: "reactivation_d15",
        description: "Inativo ha 15 dias — frequencia de comunicacao reduzida",
      });
      await admin.from("automation_runs").insert({ automation_key: "inactivity_d15", user_id: candidate.user_id, status: "success" });
      summary.d15 += 1;
    } else if (inactiveDays >= 7 && !(await userHasTag(candidate.user_id, d7Tag))) {
      await tagUser(candidate.user_id, d7Tag);
      await moveUserToStage(candidate.user_id, "Em reativacao");
      await logTimelineEvent({
        userId: candidate.user_id,
        eventType: "reactivation_d7",
        description: "Inativo ha 7 dias — entrou no segmento de reativacao",
      });
      await sendPushToUser(candidate.user_id, {
        title: "Sentimos sua falta!",
        body: "Os jogos e analises de hoje estao te esperando.",
        link: "/home",
      });
      await admin.from("automation_runs").insert({ automation_key: "inactivity_d7", user_id: candidate.user_id, status: "success" });
      summary.d7 += 1;
    } else if (inactiveDays >= 3 && !(await userHasTag(candidate.user_id, d3Tag))) {
      await tagUser(candidate.user_id, d3Tag);
      await logTimelineEvent({
        userId: candidate.user_id,
        eventType: "reactivation_d3",
        description: "Inativo ha 3 dias — enviado conteudo relevante",
      });
      await sendPushToUser(candidate.user_id, {
        title: "Novidades esperando por voce",
        body: "Confira as ultimas analises e os jogos de hoje.",
        link: "/home",
      });
      await admin.from("automation_runs").insert({ automation_key: "inactivity_d3", user_id: candidate.user_id, status: "success" });
      summary.d3 += 1;
    }
  }

  return summary;
}
