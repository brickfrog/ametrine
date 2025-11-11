import { glob } from 'fast-glob';
import { readFile } from 'node:fs/promises';
import { slugify, slugifyPath, resetSlugger } from '../src/utils/slugify';

/**
 * Validates all wikilinks in the vault to ensure they point to existing notes
 * and that anchor links point to actual headings
 * Run with: bun run scripts/validateLinks.ts
 */

interface BrokenLink {
  sourceFile: string;
  targetSlug: string;
  anchor?: string;
  lineContext?: string;
  type: 'missing-page' | 'missing-anchor';
}

interface Note {
  slug: string;
  filePath: string;
}

/**
 * Extract headings from markdown content and convert them to URL-safe IDs
 */
function extractHeadings(content: string): Set<string> {
  resetSlugger(); // Reset for fresh heading slugs
  const headings = new Set<string>();

  // Split content into lines
  const lines = content.split('\n');
  let inCodeBlock = false;

  for (const line of lines) {
    // Track code blocks
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // Skip lines in code blocks
    if (inCodeBlock) continue;

    // Match markdown headings (# through ######)
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const headingText = match[2].trim();
      const slug = slugify(headingText);
      headings.add(slug);
    }
  }

  return headings;
}

/**
 * Parse wikilinks from markdown to extract anchors
 * Skips wikilinks inside code blocks and inline code
 */
function parseWikilinksWithAnchors(content: string): Array<{ slug: string; anchor?: string }> {
  const links: Array<{ slug: string; anchor?: string }> = [];
  const lines = content.split('\n');
  let inCodeBlock = false;

  for (const line of lines) {
    // Track code blocks
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // Skip lines in code blocks
    if (inCodeBlock) continue;

    // Remove inline code before parsing wikilinks
    const lineWithoutInlineCode = line.replace(/`[^`]+`/g, '');

    // Parse wikilinks from this line
    const wikilinkRegex = /\[\[([^\]|#]+)?(#[^\]|]+)?(\|[^\]]+)?\]\]/g;
    let match;
    while ((match = wikilinkRegex.exec(lineWithoutInlineCode)) !== null) {
      const pageName = match[1]?.trim();
      const anchor = match[2]?.trim().slice(1); // Remove the # prefix

      if (pageName) {
        // Slugify the page name (same way wikilinks plugin does)
        const slug = slugifyPath(pageName);

        links.push({ slug, anchor });
      }
    }
  }

  return links;
}

/**
 * Convert file path to slug
 * src/content/vault/foo.md -> foo
 * src/content/vault/nested/bar.md -> nested/bar
 */
function pathToSlug(filePath: string): string {
  return filePath
    .replace('src/content/vault/', '')
    .replace(/\.md$/, '');
}

async function validateLinks() {
  console.log('🔍 Validating wikilinks and anchors...\n');

  try {
    // Find all markdown files in the vault
    const files = await glob('src/content/vault/**/*.md');

    // Build notes array with slugs
    const notes: Note[] = files.map(filePath => ({
      slug: pathToSlug(filePath),
      filePath,
    }));

    // Build a set of all valid slugs
    const validSlugs = new Set(notes.map((note) => note.slug));

    // Build a map of slug -> headings
    const headingsMap = new Map<string, Set<string>>();
    for (const note of notes) {
      try {
        const content = await readFile(note.filePath, 'utf-8');
        const headings = extractHeadings(content);
        headingsMap.set(note.slug, headings);
      } catch (error) {
        console.warn(`⚠️  Could not read file for heading extraction: ${note.filePath}`);
      }
    }

    console.log(`📝 Found ${notes.length} notes in vault`);
    console.log(`🔗 Checking links and anchors...\n`);

    const brokenLinks: BrokenLink[] = [];
    let totalLinksChecked = 0;
    let totalAnchorsChecked = 0;

    // Check each note's wikilinks
    for (const note of notes) {
      try {
        const content = await readFile(note.filePath, 'utf-8');
        const wikilinks = parseWikilinksWithAnchors(content);

        for (const link of wikilinks) {
          totalLinksChecked++;

          // Check if the linked slug exists
          if (!validSlugs.has(link.slug)) {
            brokenLinks.push({
              sourceFile: note.slug,
              targetSlug: link.slug,
              anchor: link.anchor,
              type: 'missing-page',
            });
            continue;
          }

          // If there's an anchor, check if that heading exists
          if (link.anchor) {
            totalAnchorsChecked++;
            const targetHeadings = headingsMap.get(link.slug);

            if (targetHeadings && !targetHeadings.has(link.anchor)) {
              brokenLinks.push({
                sourceFile: note.slug,
                targetSlug: link.slug,
                anchor: link.anchor,
                type: 'missing-anchor',
              });
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️  Could not validate links in: ${note.filePath}`);
      }
    }

    // Report results
    if (brokenLinks.length === 0) {
      console.log('✅ All links and anchors are valid!');
      console.log(`   Checked ${totalLinksChecked} links (${totalAnchorsChecked} with anchors) across ${notes.length} notes\n`);
      process.exit(0);
    } else {
      const missingPages = brokenLinks.filter((l) => l.type === 'missing-page');
      const missingAnchors = brokenLinks.filter((l) => l.type === 'missing-anchor');

      console.error(`❌ Found ${brokenLinks.length} broken link(s):\n`);

      if (missingPages.length > 0) {
        console.error(`  Missing Pages (${missingPages.length}):\n`);

        // Group by source file for cleaner output
        const bySource = new Map<string, BrokenLink[]>();
        for (const broken of missingPages) {
          const items = bySource.get(broken.sourceFile) || [];
          items.push(broken);
          bySource.set(broken.sourceFile, items);
        }

        for (const [source, items] of bySource) {
          console.error(`   ${source}:`);
          for (const item of items) {
            const linkText = item.anchor ? `[[${item.targetSlug}#${item.anchor}]]` : `[[${item.targetSlug}]]`;
            console.error(`      → ${linkText} (page not found)`);
          }
          console.error('');
        }
      }

      if (missingAnchors.length > 0) {
        console.error(`  Missing Anchors (${missingAnchors.length}):\n`);

        // Group by source file for cleaner output
        const bySource = new Map<string, BrokenLink[]>();
        for (const broken of missingAnchors) {
          const items = bySource.get(broken.sourceFile) || [];
          items.push(broken);
          bySource.set(broken.sourceFile, items);
        }

        for (const [source, items] of bySource) {
          console.error(`   ${source}:`);
          for (const item of items) {
            console.error(`      → [[${item.targetSlug}#${item.anchor}]] (heading not found in ${item.targetSlug})`);
          }
          console.error('');
        }
      }

      console.error(`Total: ${brokenLinks.length} broken links in ${new Set(brokenLinks.map((l) => l.sourceFile)).size} files\n`);
      console.error('💡 Tip: For missing pages:');
      console.error('   1. Fix the link to point to an existing note');
      console.error('   2. Create the missing note');
      console.error('   3. Remove the link if it\'s no longer needed\n');
      console.error('💡 Tip: For missing anchors:');
      console.error('   1. Check the heading spelling in the target page');
      console.error('   2. Update the link to use the correct heading');
      console.error('   3. Add the heading to the target page if needed\n');

      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error validating links:', error);
    process.exit(1);
  }
}

validateLinks();
