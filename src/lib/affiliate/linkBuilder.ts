import type { AffiliateConfigurationRow } from "@/types/database";

/**
 * Builds the affiliate registration URL with the dynamic subid parameter
 * (PRD sec. 9.1). The parameter name itself is configurable per house
 * (subid, sub_id, click_id, aff_sub, external_id, ...), never hardcoded.
 */
export function buildAffiliateUrl(config: AffiliateConfigurationRow, leadId: string): string {
  const url = new URL(config.registration_url);
  url.searchParams.set(config.subid_parameter, leadId);
  return url.toString();
}
