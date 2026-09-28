// ============================================================================
// ServiceFlow — Shared Constants
// ============================================================================

/** Default platform configuration values (fallback if DB config is unavailable) */
export const PLATFORM_DEFAULTS = {
  /** Hours before a service request expires */
  REQUEST_EXPIRY_HOURS: 24,

  /** Hours a technician has to respond to a match */
  MATCH_RESPONSE_HOURS: 2,

  /** Maximum number of technicians notified per request */
  MAX_TECHNICIANS_PER_REQUEST: 20,

  /** Whether verification is required to receive requests */
  VERIFICATION_REQUIRED: true,

  /** Maximum images per service request */
  MAX_REQUEST_IMAGES: 5,

  /** Maximum images per phase in a service */
  MAX_SERVICE_IMAGES_PER_PHASE: 5,
} as const;

/** Default currency for the platform (Colombia) */
export const DEFAULT_CURRENCY = 'COP';

/** Default country code */
export const DEFAULT_COUNTRY = 'CO';

/** Default language */
export const DEFAULT_LANGUAGE = 'es';

/** Password hash salt rounds (bcrypt) */
export const BCRYPT_SALT_ROUNDS = 12;

/** Minimum rating score */
export const MIN_RATING = 1;

/** Maximum rating score */
export const MAX_RATING = 5;
