// Basic, US-friendly normalization without extra deps.
// If you want true international parsing later, we can swap to libphonenumber-js.

export function normalizePhoneToE164(input: string, defaultCountry = "US"): string | null {
  if (!input) return null;

  const raw = input.trim();

  // If already looks like E.164 (+ followed by 8–15 digits), accept.
  if (/^\+\d{8,15}$/.test(raw)) return raw;

  // Strip all non-digits.
  const digits = raw.replace(/\D+/g, "");
  if (!digits) return null;

  // US heuristics (defaultCountry === US)
  if (defaultCountry === "US") {
    // 10 digits → assume +1
    if (/^\d{10}$/.test(digits)) return `+1${digits}`;
    // 11 digits starting with 1 → +1##########
    if (/^1\d{10}$/.test(digits)) return `+${digits}`;
  }

  // Fallback: if it starts with a country code you expect (e.g. 44…), allow manual + prefix next time.
  return null;
}

export function formatPhoneForDisplay(e164: string): string {
  // Only format +1########## nicely; otherwise show raw E.164.
  const m = /^\+1(\d{10})$/.exec(e164 || "");
  if (!m) return e164 || "";
  const d = m[1];
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
}
