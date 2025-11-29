/**
 * Ametrine Configuration
 * Mirrors Quartz's configuration structure for digital garden features
 */

export type Analytics =
  | null
  | {
      provider: "plausible";
      host?: string;
    }
  | {
      provider: "google";
      tagId: string;
    }
  | {
      provider: "umami";
      websiteId: string;
      host?: string;
    }
  | {
      provider: "goatcounter";
      websiteId: string;
      host?: string;
      scriptSrc?: string;
    }
  | {
      provider: "posthog";
      apiKey: string;
      host?: string;
    }
  | {
      provider: "vercel";
    };

export interface Theme {
  typography: {
    header: string;
    body: string;
    code: string;
  };
  colors: {
    lightMode: {
      light: string;
      lightgray: string;
      gray: string;
      darkgray: string;
      dark: string;
      secondary: string;
      tertiary: string;
      highlight: string;
      textHighlight: string;
    };
    darkMode: {
      light: string;
      lightgray: string;
      gray: string;
      darkgray: string;
      dark: string;
      secondary: string;
      tertiary: string;
      highlight: string;
      textHighlight: string;
    };
  };
}

export interface FooterLinks {
  github?: string;
  twitter?: string;
  [key: string]: string | undefined;
}

export interface FooterConfig {
  /** Copyright text - use {year} and {siteName} as placeholders */
  copyright?: string;
  /** Social and other links */
  links?: FooterLinks;
}

export interface MetadataFieldConfig {
  /** The frontmatter field key */
  key: string;
  /** Display label */
  label: string;
  /** Lucide icon name (optional) */
  icon?: string;
  /** Field format type */
  format?: "date" | "text" | "list" | "number" | "computed";
  /** Custom hide condition */
  hide?: (value: any) => boolean;
}

export interface MetadataConfig {
  /** Show metadata section */
  show: boolean;
  /** Field configurations to display */
  fields: MetadataFieldConfig[];
  /** Date format (using date-fns format) */
  dateFormat: string;
}

export interface PopoverConfig {
  /** Enable/disable popovers */
  enable: boolean;
  /** Hover delay in milliseconds before showing preview */
  hoverDelay: number;
  /** Default panel dimensions */
  defaultSize: { width: number; height: number };
  /** Minimum panel dimensions */
  minSize: { width: number; height: number };
  /** Show full page content vs just metadata excerpt */
  showFullContent: boolean;
  /** Cache fetched content */
  cacheContent: boolean;
}

export interface OgImageConfig {
  /** Enable/disable OG image generation */
  enable: boolean;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** Color scheme to use (from theme) */
  colorScheme: "lightMode" | "darkMode";
  /** Only generate for notes in these paths (e.g., ['blog/', 'articles/']) */
  includePaths?: string[];
  /** Skip notes in these paths (e.g., ['private/', 'drafts/']) */
  excludePaths?: string[];
}

export interface BreadcrumbsConfig {
  /** Symbol between breadcrumb segments */
  spacerSymbol: string;
  /** Name of the root/home breadcrumb */
  rootName: string;
  /** Whether to resolve folder names from index file titles */
  resolveFrontmatterTitle: boolean;
  /** Whether to show the current page in breadcrumbs */
  showCurrentPage: boolean;
  /** Whether to hide breadcrumbs on the root index page */
  hideOnRoot: boolean;
}

export interface CitationsConfig {
  /** Enable/disable citations processing */
  enable: boolean;
  /** Path to bibliography file (Bibtex, CSL-JSON, or CFF) */
  bibliographyFile: string;
  /** Hide the generated bibliography section */
  suppressBibliography: boolean;
  /** Make citations clickable links to bibliography entries */
  linkCitations: boolean;
  /** Citation style: apa, mla, chicago, vancouver, harvard1, or custom CSL file path */
  csl: string;
}

export interface GfmConfig {
  /** Enable smart typography (smart quotes, em-dashes, etc.) */
  enableSmartyPants: boolean;
  /** Add anchor links to headings */
  linkHeadings: boolean;
}

export type PrivateMode = "draft" | "publish";

export interface PrivatePagesConfig {
  /**
   * Private pages mode:
   * - 'draft': Pages are public by default. Add 'draft: true' to hide pages.
   * - 'publish': Pages are private by default. Add 'publish: true' to show pages.
   */
  mode: PrivateMode;
}

export interface MarginaliaConfig {
  /** Enable/disable marginalia parsing */
  enable: boolean;
  /** Max width for reader mode content area (in pixels) */
  readerModeMaxWidth: number;
}

export interface TagsConfig {
  /** Enable/disable tags display */
  enable: boolean;
  /** Show tags in right sidebar */
  showInSidebar: boolean;
  /** Show tags inline with page metadata/frontmatter */
  showWithMetadata: boolean;
}

export interface LinksAndContextConfig {
  /** Enable/disable the links and context mega-section */
  enable: boolean;
  /** Show external links section */
  showExternalLinks: boolean;
  /** Show related notes section */
  showRelated: boolean;
  /** Maximum number of related notes to show */
  relatedLimit: number;
  /** Fetch OpenGraph metadata for external links (slower builds) */
  fetchMetadata: boolean;
}

export interface RecentNotesConfig {
  /** Enable/disable recent notes section */
  enable: boolean;
  /** Title for the recent notes section */
  title: string;
  /** Maximum number of recent notes to show */
  limit: number;
  /** Show tags in recent notes */
  showTags: boolean;
  /** Show recent notes on pages */
  showOnPages: boolean;
  /** Show recent notes on homepage */
  showOnHomepage: boolean;
  /** Link to a page showing all notes */
  linkToMore: boolean;
}

export interface FeaturesConfig {
  /** Enable/disable base pages (.base files) */
  enableBases: boolean;
  /** Enable/disable image pages */
  enableImages: boolean;
  /** Enable/disable canvas pages (.canvas files) */
  enableCanvas: boolean;
}

export interface SiteConfig {
  /** Site title */
  pageTitle: string;
  /** Optional title suffix */
  pageTitleSuffix?: string;
  /** Default description for pages without one */
  defaultDescription?: string;
  /** Logo image path */
  logo?: string;
  /** Logo alt text */
  logoAlt?: string;
  /** Show logo image in sidebar header */
  showSidebarLogo?: boolean;
  /** Render title as ASCII art in sidebar header */
  renderTitleAsAscii?: boolean;
  /** ASCII art content for title (used when renderTitleAsAscii is true) */
  asciiArt?: string;
  /** Name of the vault directory in src/content/ */
  vaultName?: string;
  /** Enable single-page-app style navigation */
  enableSPA: boolean;
  /** Enable Wikipedia-style link popovers */
  enablePopovers: boolean;
  /** Analytics configuration */
  analytics: Analytics;
  /** Locale for dates and UI */
  locale: string;
  /** Base URL for absolute links (sitemaps, RSS, etc) */
  baseUrl?: string;
  /** Base path for deployment (e.g., "/repo-name" for GitHub Pages, "/" for root) */
  basePath?: string;
  /** Glob patterns to ignore */
  ignorePatterns: string[];
  /** Default date type: created, modified, or published */
  defaultDateType: "created" | "modified" | "published";
  /** Theme configuration */
  theme: Theme;
  /** Footer configuration */
  footer?: FooterConfig;
  /** Metadata display configuration */
  metadata?: MetadataConfig;
  /** Popover configuration */
  popover?: PopoverConfig;
  /** OG image configuration */
  ogImage?: OgImageConfig;
  /** Breadcrumbs configuration */
  breadcrumbs?: BreadcrumbsConfig;
  /** Citations configuration */
  citations?: CitationsConfig;
  /** GitHub Flavored Markdown configuration */
  gfm?: GfmConfig;
  /** Private pages configuration */
  privatePages?: PrivatePagesConfig;
  /** Marginalia configuration */
  marginalia?: MarginaliaConfig;
  /** Tags configuration */
  tags?: TagsConfig;
  /** Links and Context configuration */
  linksAndContext?: LinksAndContextConfig;
  /** Recent notes configuration */
  recentNotes?: RecentNotesConfig;
  /** Feature toggles configuration */
  features?: FeaturesConfig;
}

// Default configuration
export const config: SiteConfig = {
  pageTitle: "Ametrine",
  pageTitleSuffix: "",
  defaultDescription: "A digital garden built with Ametrine",
  logo: "ametrine.png",
  logoAlt: "Ametrine",
  showSidebarLogo: true,
  renderTitleAsAscii: true,
  asciiArt: `  ___                 _        _
 / _ \\               | |      (_)
/ /_\\ \\_ __ ___   ___| |_ _ __ _ _ __   ___
|  _  | '_ \` _ \\ / _ \\ __| '__| | '_ \\ / _ \\
| | | | | | | | |  __/ |_| |  | | | | |  __/
\\_| |_/_| |_| |_|\\___|\\__|_|  |_|_| |_|\\___|`,
  vaultName: "Ametrine",
  enableSPA: true,
  enablePopovers: true,
  analytics: null,
  locale: "en-US",
  baseUrl: "https://brickfrog.github.io/ametrine",
  basePath: "/ametrine",
  ignorePatterns: ["private", "templates", ".obsidian"],
  defaultDateType: "modified",
  footer: {
    copyright: "© {year} {siteName}",
    links: {
      github: "https://github.com/brickfrog/ametrine",
    },
  },
  metadata: {
    show: true,
    dateFormat: "MMMM d, yyyy",
    fields: [
      { key: "date", label: "Published", icon: "Calendar", format: "date" },
      { key: "updated", label: "Updated", icon: "RefreshCw", format: "date" },
      { key: "author", label: "Author", icon: "User", format: "text" },
      {
        key: "readingTime",
        label: "Reading time",
        icon: "Clock",
        format: "computed",
      },
      {
        key: "wordCount",
        label: "Word count",
        icon: "Hash",
        format: "computed",
      },
    ],
  },
  popover: {
    enable: true,
    hoverDelay: 600,
    defaultSize: { width: 560, height: 380 },
    minSize: { width: 320, height: 240 },
    showFullContent: true,
    cacheContent: true,
  },
  ogImage: {
    enable: true,
    width: 1200,
    height: 630,
    colorScheme: "darkMode",
  },
  breadcrumbs: {
    spacerSymbol: "❯",
    rootName: "Home",
    resolveFrontmatterTitle: true,
    showCurrentPage: true,
    hideOnRoot: true,
  },
  citations: {
    enable: false,
    bibliographyFile: "", // Dynamically constructed below
    suppressBibliography: true,
    linkCitations: false,
    csl: "apa",
  },
  gfm: {
    enableSmartyPants: true,
    linkHeadings: true,
  },
  privatePages: {
    mode: "draft",
  },
  recentNotes: {
    enable: true,
    title: "Recent Notes",
    limit: 5,
    showTags: true,
    showOnPages: true,
    showOnHomepage: false,
    linkToMore: false,
  },
  marginalia: {
    enable: true,
    readerModeMaxWidth: 900,
  },
  tags: {
    enable: true,
    showInSidebar: false,
    showWithMetadata: true,
  },
  linksAndContext: {
    enable: true,
    showExternalLinks: true,
    showRelated: true,
    relatedLimit: 10,
    fetchMetadata: true,
  },
  theme: {
    typography: {
      header: "Schibsted Grotesk",
      body: "Source Sans Pro",
      code: "IBM Plex Mono",
    },
    colors: {
      lightMode: {
        light: "#faf8f8",
        lightgray: "#e5e5e5",
        gray: "#b8b8b8",
        darkgray: "#4e4e4e",
        dark: "#2b2b2b",
        secondary: "#8B6914",
        tertiary: "#9d7420",
        highlight: "rgba(139, 105, 20, 0.15)",
        textHighlight: "#8B691488",
      },
      darkMode: {
        light: "#1a1625",
        lightgray: "#2d2640",
        gray: "#6b5f7a",
        darkgray: "#c9b8d4",
        dark: "#e8e0f0",
        secondary: "#9d7bd8",
        tertiary: "#c084fc",
        highlight: "rgba(157, 123, 216, 0.15)",
        textHighlight: "#c084fc88",
      },
    },
  },
  features: {
    enableBases: true,
    enableImages: true,
    enableCanvas: true,
  },
};

// Construct dynamic paths based on vaultName
if (config.citations) {
  config.citations.bibliographyFile = `./src/content/${config.vaultName}/bibliography.bib`;
}

export default config;
