import "server-only";

const DAY_MS = 86400000;

function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
  return `${d.getUTCFullYear()}-S${String(weekNo).padStart(2, "0")}`;
}

export interface RetentionReport {
  dau: number;
  wau: number;
  mau: number;
  retention: { days: number; retained: number; eligible: number; pct: string }[];
  cohorts: { week: string; total: number; activeLast7d: number }[];
}

/**
 * Computed from users.created_at + user_profiles.last_seen_at only — there
 * is no per-day activity history table yet, so this approximates DAU/WAU/MAU
 * and "retention" as "still had activity N+ days after signup" rather than
 * a precise daily cohort curve. Good enough to spot trends, not a replacement
 * for a real event-based retention pipeline.
 */
export function computeRetentionReport(
  users: { id: string; created_at: string }[],
  profiles: { user_id: string; last_seen_at: string | null }[]
): RetentionReport {
  const now = Date.now();
  const lastSeenByUser = new Map(profiles.map((p) => [p.user_id, p.last_seen_at]));

  const activeCount = (windowDays: number) =>
    profiles.filter((p) => p.last_seen_at && now - new Date(p.last_seen_at).getTime() <= windowDays * DAY_MS).length;

  const retention = [1, 3, 7, 14, 30].map((days) => {
    const eligibleUsers = users.filter((u) => now - new Date(u.created_at).getTime() >= days * DAY_MS);
    const retained = eligibleUsers.filter((u) => {
      const lastSeen = lastSeenByUser.get(u.id);
      if (!lastSeen) return false;
      return new Date(lastSeen).getTime() - new Date(u.created_at).getTime() >= days * DAY_MS;
    });
    return {
      days,
      retained: retained.length,
      eligible: eligibleUsers.length,
      pct: eligibleUsers.length > 0 ? `${((retained.length / eligibleUsers.length) * 100).toFixed(1)}%` : "—",
    };
  });

  const cohortMap = new Map<string, { total: number; activeLast7d: number }>();
  for (const u of users) {
    const key = isoWeekKey(new Date(u.created_at));
    const entry = cohortMap.get(key) ?? { total: 0, activeLast7d: 0 };
    entry.total += 1;
    const lastSeen = lastSeenByUser.get(u.id);
    if (lastSeen && now - new Date(lastSeen).getTime() <= 7 * DAY_MS) entry.activeLast7d += 1;
    cohortMap.set(key, entry);
  }
  const cohorts = [...cohortMap.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 12)
    .map(([week, data]) => ({ week, ...data }));

  return { dau: activeCount(1), wau: activeCount(7), mau: activeCount(30), retention, cohorts };
}
