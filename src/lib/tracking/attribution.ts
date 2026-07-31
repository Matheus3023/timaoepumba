export interface AttributionSnapshot {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  campaign_id?: string;
  adset_id?: string;
  ad_id?: string;
  fbclid?: string;
  fbc?: string;
  fbp?: string;
  gclid?: string;
  ttclid?: string;
  entry_page?: string;
  captured_at: string;
}

export const ATTRIBUTION_QUERY_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "campaign_id",
  "adset_id",
  "ad_id",
  "fbclid",
  "gclid",
  "ttclid",
] as const;

/**
 * Reads attribution-relevant query params from a URL's search params.
 * Returns undefined if none of the tracked params are present, so callers
 * can distinguish "no campaign info on this request" from an empty object.
 */
export function extractAttributionFromSearchParams(
  searchParams: URLSearchParams
): AttributionSnapshot | undefined {
  const snapshot: AttributionSnapshot = { captured_at: new Date().toISOString() };
  let found = false;

  for (const key of ATTRIBUTION_QUERY_PARAMS) {
    const value = searchParams.get(key);
    if (value) {
      snapshot[key] = value;
      found = true;
    }
  }

  return found ? snapshot : undefined;
}
