import { glob } from "fast-glob";
import { stat, readdir } from "node:fs/promises";
import { join } from "node:path";

/**
 * Build sanity checks inspired by Gwern's sync.sh validation
 * Validates build output to ensure everything was generated correctly
 * Run with: bun run scripts/validate-build.ts
 */

interface BuildStats {
  totalFiles: number;
  totalSize: number;
  htmlFiles: number;
  assetFiles: number;
  criticalFilesMissing: string[];
}

interface BuildConfig {
  distDir: string;
  maxFiles: number;
  maxSizeGB: number;
  warnSizeIncreasePercent: number;
  criticalFiles: string[];
}

const defaultConfig: BuildConfig = {
  distDir: "dist",
  maxFiles: 50000,
  maxSizeGB: 5,
  warnSizeIncreasePercent: 20,
  criticalFiles: [
    "index.html",
    "sitemap-0.xml",
    "rss.xml",
    "404.html",
    "validate-links.json",
  ],
};

class BuildValidator {
  private config: BuildConfig;
  private errors: string[] = [];
  private warnings: string[] = [];

  constructor(config: Partial<BuildConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private addError(message: string) {
    this.errors.push(message);
  }

  private addWarning(message: string) {
    this.warnings.push(message);
  }

  /**
   * Get directory size recursively
   */
  private async getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;

    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        if (entry.isDirectory()) {
          totalSize += await this.getDirectorySize(fullPath);
        } else if (entry.isFile()) {
          const stats = await stat(fullPath);
          totalSize += stats.size;
        }
      }
    } catch (error) {
      this.addWarning(`Could not read directory: ${dirPath}`);
    }

    return totalSize;
  }

  /**
   * Format bytes to human-readable size
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Check if critical files exist
   */
  private async checkCriticalFiles(): Promise<string[]> {
    const missing: string[] = [];

    for (const file of this.config.criticalFiles) {
      const filePath = join(this.config.distDir, file);
      try {
        await stat(filePath);
      } catch {
        missing.push(file);
      }
    }

    return missing;
  }

  /**
   * Gather build statistics
   */
  private async gatherStats(): Promise<BuildStats> {
    // Count files
    const allFiles = await glob(`${this.config.distDir}/**/*`, {
      onlyFiles: true,
    });
    const htmlFiles = await glob(`${this.config.distDir}/**/*.html`);
    const assetFiles = await glob(
      `${this.config.distDir}/**/*.{js,css,png,jpg,jpeg,gif,svg,webp,woff,woff2,ttf}`
    );

    // Get total size
    const totalSize = await this.getDirectorySize(this.config.distDir);

    // Check critical files
    const criticalFilesMissing = await this.checkCriticalFiles();

    return {
      totalFiles: allFiles.length,
      totalSize,
      htmlFiles: htmlFiles.length,
      assetFiles: assetFiles.length,
      criticalFilesMissing,
    };
  }

  /**
   * Validate build statistics
   */
  private validateStats(stats: BuildStats) {
    // Check total file count
    if (stats.totalFiles === 0) {
      this.addError("No files found in dist directory - build may have failed");
    } else if (stats.totalFiles > this.config.maxFiles) {
      this.addError(
        `Too many files generated: ${stats.totalFiles} > ${this.config.maxFiles}`
      );
    }

    // Check total size
    const maxSizeBytes = this.config.maxSizeGB * 1024 * 1024 * 1024;
    if (stats.totalSize > maxSizeBytes) {
      this.addError(
        `Build size too large: ${this.formatBytes(stats.totalSize)} > ${this.config.maxSizeGB}GB`
      );
    }

    // Check critical files
    if (stats.criticalFilesMissing.length > 0) {
      this.addError(
        `Missing critical files: ${stats.criticalFilesMissing.join(", ")}`
      );
    }

    // Sanity check: should have some HTML files
    if (stats.htmlFiles === 0) {
      this.addError("No HTML files generated - build likely failed");
    }

    // Warn if no assets
    if (stats.assetFiles === 0) {
      this.addWarning("No asset files (JS/CSS/images) found - this is unusual");
    }

    // Check for reasonable ratios
    if (stats.htmlFiles > 0 && stats.assetFiles === 0) {
      this.addWarning("HTML files exist but no assets - possible build issue");
    }
  }

  /**
   * Run all validations
   */
  async validate(): Promise<{ stats: BuildStats; hasErrors: boolean }> {
    console.log("🔍 Validating build output...\n");

    try {
      // Check if dist directory exists
      try {
        await stat(this.config.distDir);
      } catch {
        this.addError(`Build directory not found: ${this.config.distDir}`);
        return { stats: this.getEmptyStats(), hasErrors: true };
      }

      // Gather statistics
      const stats = await this.gatherStats();

      // Validate statistics
      this.validateStats(stats);

      return { stats, hasErrors: this.errors.length > 0 };
    } catch (error) {
      this.addError(`Validation failed: ${error}`);
      return { stats: this.getEmptyStats(), hasErrors: true };
    }
  }

  /**
   * Get empty stats for error cases
   */
  private getEmptyStats(): BuildStats {
    return {
      totalFiles: 0,
      totalSize: 0,
      htmlFiles: 0,
      assetFiles: 0,
      criticalFilesMissing: this.config.criticalFiles,
    };
  }

  /**
   * Print results
   */
  printResults(stats: BuildStats) {
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log("✅ Build validation passed!\n");
      console.log("📊 Build Statistics:");
      console.log(`   Total files: ${stats.totalFiles.toLocaleString()}`);
      console.log(`   HTML pages: ${stats.htmlFiles.toLocaleString()}`);
      console.log(`   Asset files: ${stats.assetFiles.toLocaleString()}`);
      console.log(`   Total size: ${this.formatBytes(stats.totalSize)}`);
      console.log(`   Critical files: All present ✓\n`);
      return;
    }

    // Print statistics first
    console.log("📊 Build Statistics:");
    console.log(`   Total files: ${stats.totalFiles.toLocaleString()}`);
    console.log(`   HTML pages: ${stats.htmlFiles.toLocaleString()}`);
    console.log(`   Asset files: ${stats.assetFiles.toLocaleString()}`);
    console.log(`   Total size: ${this.formatBytes(stats.totalSize)}`);

    if (stats.criticalFilesMissing.length > 0) {
      console.log(
        `   Critical files missing: ${stats.criticalFilesMissing.length}`
      );
    } else {
      console.log(`   Critical files: All present ✓`);
    }
    console.log("");

    // Print errors
    if (this.errors.length > 0) {
      console.error(`❌ Found ${this.errors.length} error(s):\n`);
      for (const error of this.errors) {
        console.error(`   • ${error}`);
      }
      console.error("");
    }

    // Print warnings
    if (this.warnings.length > 0) {
      console.warn(`⚠️  Found ${this.warnings.length} warning(s):\n`);
      for (const warning of this.warnings) {
        console.warn(`   • ${warning}`);
      }
      console.warn("");
    }

    if (this.errors.length > 0) {
      console.error("💡 Tip: Build validation failed");
      console.error("   Check the errors above and rebuild\n");
    }
  }

  /**
   * Get validation results
   */
  getResults() {
    return {
      errors: this.errors,
      warnings: this.warnings,
      hasErrors: this.errors.length > 0,
      hasWarnings: this.warnings.length > 0,
    };
  }
}

async function main() {
  const validator = new BuildValidator();
  const { stats } = await validator.validate();
  validator.printResults(stats);

  const { hasErrors } = validator.getResults();
  process.exit(hasErrors ? 1 : 0);
}

main();
