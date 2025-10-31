/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        header: ['Schibsted Grotesk', 'sans-serif'],
        body: ['Source Sans Pro', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        theme: {
          light: 'var(--color-light)',
          lightgray: 'var(--color-lightgray)',
          gray: 'var(--color-gray)',
          darkgray: 'var(--color-darkgray)',
          dark: 'var(--color-dark)',
          secondary: 'var(--color-secondary)',
          tertiary: 'var(--color-tertiary)',
          highlight: 'var(--color-highlight)',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            // Base text settings
            color: 'var(--color-dark)',
            maxWidth: 'none',
            lineHeight: '1.7',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',

            // Headers - flush left, clear hierarchy, proper spacing
            'h1, h2, h3, h4, h5, h6': {
              color: 'var(--color-dark)',
              fontWeight: '600',
              lineHeight: '1.3',
              marginLeft: '0',
              paddingLeft: '0',
              textIndent: '0',
            },

            // H1: Top-level sections
            h1: {
              fontSize: '2.25em',
              fontWeight: '700',
              marginTop: '0',
              marginBottom: '0.75em',
              borderBottom: 'none',
              paddingBottom: '0',
            },

            // H2: Major sections
            h2: {
              fontSize: '1.75em',
              fontWeight: '600',
              marginTop: '2em',
              marginBottom: '0.75em',
              borderBottom: 'none',
              paddingBottom: '0',
            },

            // H3: Subsections
            h3: {
              fontSize: '1.4em',
              fontWeight: '600',
              marginTop: '1.75em',
              marginBottom: '0.65em',
            },

            // H4: Minor headings
            h4: {
              fontSize: '1.2em',
              fontWeight: '600',
              marginTop: '1.5em',
              marginBottom: '0.6em',
            },

            // H5, H6: Small headings
            h5: {
              fontSize: '1.1em',
              fontWeight: '600',
              marginTop: '1.5em',
              marginBottom: '0.5em',
            },
            h6: {
              fontSize: '1em',
              fontWeight: '600',
              marginTop: '1.5em',
              marginBottom: '0.5em',
              color: 'var(--color-darkgray)',
            },

            // Paragraphs - moderate spacing
            p: {
              marginTop: '1.25em',
              marginBottom: '1.25em',
              lineHeight: '1.7',
            },

            // First paragraph after heading - reduce top margin
            'h1 + p, h2 + p, h3 + p, h4 + p, h5 + p, h6 + p': {
              marginTop: '0.5em',
            },

            // Lists - aligned with body text
            'ul, ol': {
              marginTop: '1.5em',
              marginBottom: '1.5em',
              paddingLeft: '1.5em',
            },

            'ul > li, ol > li': {
              marginTop: '0.5em',
              marginBottom: '0.5em',
              paddingLeft: '0.25em',
            },

            // Nested lists
            'ul > li > ul, ul > li > ol, ol > li > ul, ol > li > ol': {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },

            // List markers
            'ul > li::marker': {
              color: 'var(--color-darkgray)',
            },
            'ol > li::marker': {
              color: 'var(--color-darkgray)',
              fontWeight: '500',
            },

            // Code blocks - proper spacing and alignment
            pre: {
              marginTop: '1.75em',
              marginBottom: '1.75em',
              paddingTop: '1em',
              paddingBottom: '1em',
              paddingLeft: '1.25em',
              paddingRight: '1.25em',
              borderRadius: '0.375rem',
              lineHeight: '1.6',
              overflowX: 'auto',
              maxWidth: '100%',
            },

            // Inline code
            code: {
              fontWeight: '500',
              fontSize: '0.9em',
              padding: '0.15em 0.35em',
              borderRadius: '0.25rem',
              backgroundColor: 'var(--color-lightgray)',
              color: 'var(--color-dark)',
            },

            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },

            // Blockquotes - Tufte-style epigraphs
            blockquote: {
              fontWeight: '400',
              fontStyle: 'italic',
              color: 'var(--color-darkgray)',
              borderLeftWidth: '0',
              quotes: 'none',
              marginTop: '2em',
              marginBottom: '2em',
              marginLeft: 'auto',
              marginRight: 'auto',
              maxWidth: '90%',
              textAlign: 'center',
              paddingLeft: '0',
              paddingRight: '0',
            },

            'blockquote p': {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },

            'blockquote p:first-of-type::before': {
              content: '""',
            },
            'blockquote p:last-of-type::after': {
              content: '""',
            },

            // Citation/attribution styling
            'blockquote footer': {
              marginTop: '0.75em',
              fontSize: '0.875em',
              fontStyle: 'normal',
              color: 'var(--color-darkgray)',
            },

            'blockquote footer::before': {
              content: '"— "',
            },

            'blockquote cite': {
              fontStyle: 'normal',
            },

            // Horizontal rules - section breaks
            hr: {
              marginTop: '3em',
              marginBottom: '3em',
              borderColor: 'var(--color-gray)',
              borderTopWidth: '1px',
            },

            // Links
            a: {
              color: 'var(--color-secondary)',
              textDecoration: 'underline',
              fontWeight: '500',
              textDecorationColor: 'var(--color-gray)',
            },
            'a:hover': {
              color: 'var(--color-tertiary)',
            },

            // Strong and emphasis
            strong: {
              color: 'var(--color-dark)',
              fontWeight: '600',
            },
            em: {
              color: 'var(--color-dark)',
              fontStyle: 'italic',
            },

            // Images and figures
            img: {
              marginTop: '2em',
              marginBottom: '2em',
              borderRadius: '0.5rem',
            },
            figure: {
              marginTop: '2em',
              marginBottom: '2em',
            },
            figcaption: {
              marginTop: '0.75em',
              fontSize: '0.9em',
              color: 'var(--color-darkgray)',
              textAlign: 'center',
            },
          },
        },
        lg: {
          css: {
            fontSize: '1.125rem',
            lineHeight: '1.75',

            h1: {
              fontSize: '2.5em',
              marginTop: '0',
              marginBottom: '0.8em',
            },
            h2: {
              fontSize: '1.875em',
              marginTop: '2em',
              marginBottom: '0.75em',
            },
            h3: {
              fontSize: '1.5em',
              marginTop: '1.75em',
              marginBottom: '0.65em',
            },
            h4: {
              fontSize: '1.25em',
              marginTop: '1.5em',
              marginBottom: '0.6em',
            },

            p: {
              marginTop: '1.3em',
              marginBottom: '1.3em',
            },

            'ul, ol': {
              marginTop: '1.6em',
              marginBottom: '1.6em',
            },

            pre: {
              marginTop: '2em',
              marginBottom: '2em',
              paddingTop: '1.25em',
              paddingBottom: '1.25em',
              paddingLeft: '1.5em',
              paddingRight: '1.5em',
            },

            blockquote: {
              marginTop: '2.5em',
              marginBottom: '2.5em',
              paddingLeft: '0',
              paddingRight: '0',
            },
          },
        },
        invert: {
          css: {
            '--tw-prose-body': 'var(--color-dark)',
            '--tw-prose-headings': 'var(--color-dark)',
            '--tw-prose-links': 'var(--color-secondary)',
            '--tw-prose-bold': 'var(--color-dark)',
            '--tw-prose-quotes': 'var(--color-darkgray)',
            '--tw-prose-code': 'var(--color-dark)',
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
