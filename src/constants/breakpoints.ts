/**
 * Breakpoint constants for responsive design
 * These align with Tailwind's default breakpoints where possible
 * Custom breakpoints should be added to tailwind.config.mjs
 */

export const BREAKPOINTS = {
  // Standard Tailwind breakpoints (reference)
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  "2XL": 1536,

  // Custom breakpoints for specific features
  MARGINALIA_MOBILE: 1279, // Below this: inline refs only
  MARGINALIA_DESKTOP: 1280, // Above this: side notes
  MARGINALIA_COLUMN: 1640, // Above this: dedicated column layout

  // Explorer
  EXPLORER_MOBILE: 1023,
  EXPLORER_DESKTOP: 1024,
} as const;

/**
 * Media query helpers
 */
export const mediaQueries = {
  mobile: `(max-width: ${BREAKPOINTS.LG - 1}px)`,
  desktop: `(min-width: ${BREAKPOINTS.LG}px)`,
  marginaliaMobile: `(max-width: ${BREAKPOINTS.MARGINALIA_MOBILE}px)`,
  marginaliaDesktop: `(min-width: ${BREAKPOINTS.MARGINALIA_DESKTOP}px)`,
  marginaliaColumn: `(min-width: ${BREAKPOINTS.MARGINALIA_COLUMN}px)`,
} as const;
