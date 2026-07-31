import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Validates an inbound affiliate postback (PRD sec. 9.3/9.4 step "validar
 * o segredo"). Expects:
 *  - header `X-Webhook-Key`: identifies which affiliate_configurations row
 *    to use (config.webhook_key) — lets us support future houses without
 *    guessing which secret to try.
 *  - header `X-Webhook-Signature`: hex HMAC-SHA256 of the raw request body
 *    using config.webhook_secret, so the payload can't be forged even if
 *    the webhook_key leaks.
 */
export function verifyWebhookSignature(rawBody: string, secret: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(signatureHeader, "hex");

  if (expectedBuffer.length !== providedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, providedBuffer);
}
