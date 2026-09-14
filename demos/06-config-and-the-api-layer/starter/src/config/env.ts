/**
 * The single source of truth for configuration. Right now it reads one
 * variable with a silent fallback — Lab 1.1 makes it validate, coerce, and
 * fail LOUDLY when a deploy is misconfigured.
 */
// TODO(lab-1.1): required()/optional()/asNumber()/asBoolean() helpers; a frozen, validated `env` object with a typed shape
export const env = {
  api: { baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'https://dummyjson.com' },
};
