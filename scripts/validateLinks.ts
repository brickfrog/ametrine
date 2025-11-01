import { getCollection } from 'astro:content';
import * as path from 'node:path';

/**
 * Validates all wikilinks in the vault to ensure they point to existing notes
 * Run with: bun run scripts/validateLinks.ts
 */

interface BrokenLink {
  sourceFile: string;
  targetSlug: string;
  lineContext?: string;
}

async function validateLinks() {
  console.log('🔍 Validating wikilinks...\n');

  try {
    // Get all notes from the vault collection
    const notes = await getCollection('vault');

    // Build a set of all valid slugs
    const validSlugs = new Set(notes.map((note) => note.slug));

    console.log(`📝 Found ${notes.length} notes in vault`);
    console.log(`🔗 Checking links...\n`);

    const brokenLinks: BrokenLink[] = [];
    let totalLinksChecked = 0;

    // Check each note's links
    for (const note of notes) {
      const links = note.data.links || [];

      for (const link of links) {
        totalLinksChecked++;

        // Check if the linked slug exists
        if (!validSlugs.has(link)) {
          brokenLinks.push({
            sourceFile: note.slug,
            targetSlug: link,
          });
        }
      }
    }

    // Report results
    if (brokenLinks.length === 0) {
      console.log('✅ All links are valid!');
      console.log(`   Checked ${totalLinksChecked} links across ${notes.length} notes\n`);
      process.exit(0);
    } else {
      console.error(`❌ Found ${brokenLinks.length} broken link(s):\n`);

      // Group by source file for cleaner output
      const bySource = new Map<string, string[]>();
      for (const broken of brokenLinks) {
        const targets = bySource.get(broken.sourceFile) || [];
        targets.push(broken.targetSlug);
        bySource.set(broken.sourceFile, targets);
      }

      for (const [source, targets] of bySource) {
        console.error(`   ${source}:`);
        for (const target of targets) {
          console.error(`      → [[${target}]] (not found)`);
        }
        console.error('');
      }

      console.error(`Total: ${brokenLinks.length} broken links in ${bySource.size} files\n`);
      console.error('💡 Tip: Check these wikilinks and either:');
      console.error('   1. Fix the link to point to an existing note');
      console.error('   2. Create the missing note');
      console.error('   3. Remove the link if it\'s no longer needed\n');

      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error validating links:', error);
    process.exit(1);
  }
}

validateLinks();
