/**
 * Setup script for Ametrine template
 *
 * This script helps you configure your new Ametrine site.
 * Run with: bun run setup
 */

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  Ametrine Setup Checklist                    ║
╚══════════════════════════════════════════════════════════════╝

Welcome! Here's what you need to configure:

📝 1. Update Site Information (src/config.ts)
   - pageTitle: "Ametrine"
   - defaultDescription: "A digital garden built with Ametrine"
   - baseUrl: "https://brickfrog.github.io/ametrine"
   - basePath: "/ametrine" (use "/" for root domain)

👤 2. Update Author Information (src/config.ts)
   - footer.links.github: "https://github.com/brickfrog/ametrine"
   - (Add your own social links)

🖼️  3. Replace Logo
   - Replace public/ametrine.png with your logo
   - Update config.logo if you use a different filename

🗑️  4. Clean Up Demo Content (optional)
   - Delete files in src/content/vault/
   - Keep index.md and modify it for your homepage

🚀 5. Deployment Configuration
   For GitHub Pages with custom path:
   - Set basePath: "/your-repo-name" in src/config.ts
   - Set baseUrl: "https://username.github.io/your-repo-name"

   For root domain:
   - Set basePath: "/" in src/config.ts
   - Set baseUrl: "https://yourdomain.com"

   For Netlify/Vercel:
   - Config files already included (netlify.toml, vercel.json)
   - Just push to your repo and connect the service

📦 6. Install Dependencies
   Run: bun install

🧪 7. Test Your Site
   Run: bun run dev
   Visit: http://localhost:4321

🎉 Ready to build!
   Run: bun run build

Need help? Check the documentation in your vault:
- Quick Start Guide: [[quick-start]]
- Configuration Guide: [[configuration-guide]]
- Deployment Guide: [[deployment-guide]]
`);

console.log("\n✨ Happy gardening! ✨\n");
