import type { SiteConfig } from "../config";
import { OG_IMAGE } from "../constants/spacing";

export interface OgImageProps {
  title: string;
  description?: string;
  date?: string;
  author?: string;
  readingTime?: number;
  config: SiteConfig;
  logo?: string;
}

export function OgImageTemplate({
  title,
  description,
  date,
  author,
  readingTime,
  config,
  logo,
}: OgImageProps) {
  const { theme, ogImage, pageTitle } = config;
  const colorScheme = ogImage?.colorScheme || "darkMode";
  const colors = theme.colors[colorScheme];

  // Adjust font size based on title length
  const titleFontSize =
    title.length > OG_IMAGE.TITLE_LENGTH_THRESHOLD
      ? OG_IMAGE.TITLE_SIZE_LONG
      : OG_IMAGE.TITLE_SIZE_SHORT;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: colors.light,
        padding: `${OG_IMAGE.PADDING}px`,
        fontFamily: theme.typography.body,
      }}
    >
      {/* Header with logo and site name */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: `${OG_IMAGE.HEADER_GAP}px`,
          marginBottom: `${OG_IMAGE.HEADER_MARGIN_BOTTOM}px`,
        }}
      >
        {logo && (
          <img
            src={logo}
            width={OG_IMAGE.LOGO_SIZE}
            height={OG_IMAGE.LOGO_SIZE}
            alt=""
            style={{ borderRadius: `${OG_IMAGE.LOGO_BORDER_RADIUS}px` }}
          />
        )}
        <div
          style={{
            fontSize: OG_IMAGE.SITE_NAME_SIZE,
            fontWeight: 600,
            color: colors.dark,
            fontFamily: theme.typography.header,
          }}
        >
          {pageTitle}
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: titleFontSize,
          fontWeight: 700,
          color: colors.dark,
          lineHeight: 1.2,
          marginBottom: `${OG_IMAGE.TITLE_MARGIN_BOTTOM}px`,
          fontFamily: theme.typography.header,
          display: "flex",
          flexWrap: "wrap",
        }}
      >
        {title}
      </div>

      {/* Description */}
      {description && (
        <div
          style={{
            fontSize: OG_IMAGE.DESCRIPTION_SIZE,
            color: colors.darkgray,
            lineHeight: 1.5,
            marginBottom: "auto",
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          {description.slice(0, OG_IMAGE.DESCRIPTION_MAX_LENGTH)}
          {description.length > OG_IMAGE.DESCRIPTION_MAX_LENGTH ? "..." : ""}
        </div>
      )}

      {/* Footer metadata */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: `${OG_IMAGE.FOOTER_GAP}px`,
          fontSize: OG_IMAGE.FOOTER_SIZE,
          color: colors.gray,
          marginTop: `${OG_IMAGE.FOOTER_MARGIN_TOP}px`,
        }}
      >
        {author && <span>{author}</span>}
        {author && (date || readingTime) && <span>·</span>}
        {date && <span>{date}</span>}
        {date && readingTime && <span>·</span>}
        {readingTime && <span>{readingTime} min read</span>}
      </div>

      {/* Accent bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: OG_IMAGE.ACCENT_BAR_HEIGHT,
          background: `linear-gradient(90deg, ${colors.secondary}, ${colors.tertiary})`,
        }}
      />
    </div>
  );
}
