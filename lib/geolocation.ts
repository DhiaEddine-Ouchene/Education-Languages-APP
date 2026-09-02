/**
 * Detect if user is in Algeria based on IP geolocation
 * Uses Vercel's built-in geolocation headers
 */
export function isAlgerianUser(headers: Headers): boolean {
  // Check Vercel geolocation header
  const country = headers.get("x-vercel-ip-country");

  if (country === "DZ") {
    return true;
  }

  // Fallback: check other common geolocation headers
  const cfCountry = headers.get("cf-ipcountry");
  if (cfCountry === "DZ") {
    return true;
  }

  return false;
}

/**
 * Get country code from request headers
 */
export function getCountryCode(headers: Headers): string | null {
  return headers.get("x-vercel-ip-country") || headers.get("cf-ipcountry");
}
