export const LEAD_ID_COOKIE = "lead_id";
export const FIRST_TOUCH_COOKIE = "attr_first_touch";
export const LAST_TOUCH_COOKIE = "attr_last_touch";

/**
 * Generates a Lead ID in the format used throughout the PRD (usr_xxxxxxxx).
 * This identifier is created on first visit and follows the user through
 * the entire journey (account creation, affiliate subid, FTD attribution).
 */
export function generateLeadId(): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2) + Date.now().toString(36);

  return `usr_${random.slice(0, 12)}`;
}
