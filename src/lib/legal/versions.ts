/**
 * Current accepted versions of legal documents. Bump these when the terms
 * or privacy policy change; consents.version stores whichever version a
 * user accepted, and users.terms_accepted_version/privacy_accepted_version
 * caches the latest one for quick lookups (PRD sec. 25).
 */
export const TERMS_VERSION = "1.0.0";
export const PRIVACY_VERSION = "1.0.0";

export const MINIMUM_AGE = 18;

export function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}
