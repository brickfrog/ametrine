/**
 * Spacing constants used throughout the application
 * Extract magic numbers to named constants for maintainability
 */

// Link Preview Panel
export const LINK_PREVIEW = {
  VIEWPORT_PADDING: 8,
  PANEL_MARGIN: 12,
  MIN_WIDTH: 320,
  MIN_HEIGHT: 240,
  DEFAULT_WIDTH: 560,
  DEFAULT_HEIGHT: 380,
  MINIMIZED_WIDTH: 200,
} as const;

// Marginalia
export const MARGINALIA = {
  NOTE_GAP: 8,
  ESTIMATED_LINE_HEIGHT: 20,
  ESTIMATED_CHARS_PER_LINE: 50,
  BASE_PADDING: 16,
  COLUMN_WIDTH: 240,
  MAX_CONTENT_WIDTH: 900,
} as const;

// Explorer
export const EXPLORER = {
  FOLDER_INDENT: 6,
  FOLDER_ICON_MARGIN: 5,
  FOLDER_BORDER_PADDING: 0.8, // rem
  MOBILE_COLLAPSED_HEIGHT: 34,
  MOBILE_PADDING: 5,
} as const;

// OG Image Template
export const OG_IMAGE = {
  PADDING: 60,
  HEADER_GAP: 16,
  HEADER_MARGIN_BOTTOM: 40,
  LOGO_SIZE: 48,
  LOGO_BORDER_RADIUS: 8,
  SITE_NAME_SIZE: 28,
  TITLE_SIZE_LONG: 48,
  TITLE_SIZE_SHORT: 64,
  TITLE_LENGTH_THRESHOLD: 40,
  TITLE_MARGIN_BOTTOM: 24,
  DESCRIPTION_SIZE: 24,
  DESCRIPTION_MAX_LENGTH: 180,
  FOOTER_GAP: 24,
  FOOTER_SIZE: 20,
  FOOTER_MARGIN_TOP: 40,
  ACCENT_BAR_HEIGHT: 8,
} as const;

// General UI
export const UI = {
  BORDER_RADIUS_SM: 2,
  BORDER_RADIUS_MD: 4,
  BORDER_RADIUS_LG: 8,
  BUTTON_SIZE_SM: 24,
  BUTTON_SIZE_MD: 36,
  ICON_SIZE_SM: 16,
  ICON_SIZE_MD: 18,
  ICON_SIZE_LG: 24,
} as const;

// Table of Contents
export const TOC = {
  DEPTH_INDENT: 0.75, // rem
  SCROLL_THRESHOLD: 100, // px from top to consider heading "active"
  SCROLL_MARGIN: 2, // rem for anchor link scroll offset
} as const;

// Graph
export const GRAPH = {
  LOCAL_HEIGHT: 250, // px - fixed height for local graph embed
  LOCAL_WIDTH_FALLBACK: 600, // px - fallback if container has no width
  GLOBAL_WIDTH_FALLBACK: 800, // px - fallback for global modal
  GLOBAL_HEIGHT_PERCENT: 0.8, // vh multiplier for modal height
  GLOBAL_WIDTH_VW: 80, // vw for modal width
  GLOBAL_HEIGHT_VW: 80, // vh for modal height
  GLOBAL_WIDTH_VW_MOBILE: 90, // vw for modal on mobile
  GLOBAL_HEIGHT_VW_MOBILE: 90, // vh for modal on mobile
  NODE_RADIUS: 6, // px
  NODE_RADIUS_CURRENT: 10, // px for current page node
  NODE_STROKE_WIDTH: 2, // px
  NODE_STROKE_WIDTH_CURRENT: 3, // px for current page
  LINK_DISTANCE: 100, // force simulation link distance
  CHARGE_STRENGTH: -300, // force simulation repulsion
  COLLISION_RADIUS: 30, // force simulation collision
  ICON_SIZE: 24, // px
  ICON_PADDING: 0.2, // rem
  ICON_MARGIN: 0.3, // rem
  BORDER_RADIUS: 4, // px
} as const;

// Timing
export const TIMING = {
  MARGINALIA_RENDER_DELAY: 100,
  LINK_PREVIEW_HOVER_DELAY: 300,
  ANIMATION_DURATION: 200,
  TRANSITION_DURATION: 300,
} as const;
