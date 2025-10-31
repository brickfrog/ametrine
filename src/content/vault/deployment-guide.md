---
title: Deployment Guide
description: Build and deploy your Ametrine digital garden
tags: [guide, deployment, hosting]
date: 2025-10-30
---

# Deployment Guide

Learn how to build and deploy your Ametrine digital garden to production.

## Prerequisites

Before deploying, make sure:
1. Your site works locally (`bun run dev`)
2. You've set `baseUrl` in `src/config.ts`
3. All your content is committed to git

## Building for Production

### 1. Set Base URL

Edit `src/config.ts`:

```typescript
export const config: SiteConfig = {
  baseUrl: "https://your-domain.com",  // Your production URL
  // ... other config
}
```

This is required for:
- RSS feed generation
- OG image absolute URLs
- Proper sitemap URLs

### 2. Run the Build

```bash
bun run build
```

This command:
1. Generates static HTML pages
2. Creates the content index
3. Generates OG images {{If enabled in config}}
4. Builds the search index
5. Outputs everything to `dist/`

> [!tip] Build Time
> First build may take longer due to OG image generation. Subsequent builds are faster thanks to caching.

### 3. Preview the Build

Test the production build locally:

```bash
bun run preview
```

Visit `http://localhost:4321` to verify everything works.

## Deployment Platforms

Choose your preferred hosting platform. All support automatic deployments from Git.

### Netlify

**Recommended for beginners** - Free tier, automatic HTTPS, great performance.

#### Via Netlify UI

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [netlify.com](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your Git repository
5. Configure build settings:
   - **Build command**: `bun run build` or `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: 18 or higher
6. Click "Deploy site"

#### Via netlify.toml

Add `netlify.toml` to your project root:

```toml
[build]
  command = "bun run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18.14.1"
```

Then:
1. Push to GitHub
2. Import project on Netlify
3. Auto-deploy on every push

### Vercel

**Excellent for Next.js developers** - Zero config, edge network, great DX.

#### Via Vercel UI

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com)
3. Click "Add New" → "Project"
4. Import your repository
5. Vercel auto-detects Astro
6. Click "Deploy"

#### Via vercel.json

Add `vercel.json` to your project root:

```json
{
  "buildCommand": "bun run build",
  "outputDirectory": "dist",
  "framework": "astro"
}
```

### GitHub Pages

**Free hosting for public repos** - Perfect if your site is already on GitHub.

#### Setup

1. Install the GitHub Pages adapter:

```bash
bun add @astrojs/github-pages
```

2. Update `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://username.github.io',
  base: '/repo-name',  // If using project pages
  // ... other config
});
```

3. Update `src/config.ts`:

```typescript
baseUrl: "https://username.github.io/repo-name"
```

4. Add GitHub Actions workflow (`.github/workflows/deploy.yml`):

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run build
      - uses: actions/upload-pages-artifact@v2
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v2
        id: deployment
```

5. Enable GitHub Pages in repo settings:
   - Go to Settings → Pages
   - Source: GitHub Actions

### Cloudflare Pages

**Fast edge network** - Great performance, generous free tier.

#### Setup

1. Push your code to GitHub/GitLab
2. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
3. Click "Create a project"
4. Connect your Git repository
5. Configure build:
   - **Build command**: `bun run build`
   - **Build output directory**: `dist`
   - **Environment variable**: `NODE_VERSION = 18`
6. Click "Save and Deploy"

#### Via Wrangler

For CLI deployment:

```bash
npm install -g wrangler
wrangler pages project create my-garden
bun run build
wrangler pages publish dist
```

### Custom Server (VPS/Docker)

For advanced users who want full control.

#### Using Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json bun.lockb ./
RUN npm install -g bun && bun install
COPY . .
RUN bun run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:

```bash
docker build -t my-garden .
docker run -p 80:80 my-garden
```

#### Using Nginx

Build locally and transfer `dist/` to your server:

```bash
bun run build
rsync -avz dist/ user@server:/var/www/html/
```

Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Environment Variables

Some platforms require environment variables:

### Node Version

```bash
NODE_VERSION=18.14.1
```

### Build Command Override

```bash
BUILD_COMMAND="bun run build"
```

### Custom Base Path

```bash
BASE_PATH="/my-garden"
```

Set these in your platform's dashboard or deployment configuration.

## Post-Deployment Checklist

After deploying, verify:

- [ ] Homepage loads correctly
- [ ] Wikilinks work and navigate properly
- [ ] Graph visualization renders
- [ ] Search functionality works (Cmd/Ctrl+K)
- [ ] Dark mode toggle functions
- [ ] Images and assets load
- [ ] RSS feed is accessible (`/rss.xml`)
- [ ] OG images generate for social sharing
- [ ] Mobile responsive design works
- [ ] Analytics tracking (if enabled)

## Continuous Deployment

Set up automatic deployments:

### Netlify/Vercel/Cloudflare

These platforms automatically deploy when you push to your main branch. No additional setup needed!

### GitHub Actions

The workflow above runs on every push to `main`. Customize the trigger:

```yaml
on:
  push:
    branches: [ main, develop ]  # Multiple branches
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
```

## Custom Domains

### Netlify

1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Follow DNS configuration instructions

### Vercel

1. Go to Project settings → Domains
2. Add your domain
3. Configure DNS records

### GitHub Pages

1. Go to Settings → Pages
2. Add custom domain
3. Configure DNS:
   - A record: `185.199.108.153`
   - CNAME: `username.github.io`

> [!warning] HTTPS
> Wait 24-48 hours for SSL certificates to provision after adding a custom domain.

## Performance Optimization

### Enable Compression

Most platforms enable gzip/brotli automatically. Verify with:

```bash
curl -H "Accept-Encoding: gzip" -I https://your-site.com
```

### CDN Configuration

Platforms like Netlify, Vercel, and Cloudflare include CDN by default. No extra setup needed.

### Image Optimization

Ametrine uses Astro's built-in image optimization. To further optimize:

1. Use WebP format for images
2. Compress before uploading
3. Use appropriate dimensions

## Troubleshooting

### Build Fails

**Check Node version**: Must be 18.14.1 or higher

```bash
node --version
```

**Check for errors**:

```bash
bun run build --verbose
```

### Routes Not Working (404s)

**For SPAs**: Ensure your platform redirects all routes to `index.html`

Netlify:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Vercel: (automatic)

### Images Not Loading

**Check paths**: All image paths should be relative to `public/`

```markdown
![Logo](/logo.png)  # ✓ Correct
![Logo](logo.png)   # ✗ Wrong
```

### OG Images Not Generating

**Verify config**:
```typescript
ogImage: {
  enable: true,
  // ...
}
```

**Check baseUrl is set**:
```typescript
baseUrl: "https://your-domain.com"
```

### Search Not Working

Search requires the content index. Verify `/static/contentIndex.json` exists in `dist/`.

## Monitoring

### Uptime Monitoring

Use services like:
- [UptimeRobot](https://uptimerobot.com) (free)
- [Pingdom](https://pingdom.com)
- [Better Uptime](https://betteruptime.com)

### Analytics

See [[Configuration Guide#Analytics Integration]] for setup instructions.

### Error Tracking

For production error monitoring:
- [Sentry](https://sentry.io)
- [LogRocket](https://logrocket.com)
- [Rollbar](https://rollbar.com)

## Updating Your Site

To update content:

1. Edit markdown files locally
2. Test with `bun run dev`
3. Commit and push to Git
4. Platform auto-deploys {{If CI/CD is configured}}

To update Ametrine template:

```bash
# Fetch latest template changes
git remote add template https://github.com/brickfrog/ametrine
git fetch template
git merge template/main
```

## Next Steps

Now that your site is deployed:

- Share your garden on social media
- Add more notes and build your knowledge base
- Customize the [[Configuration Guide|configuration]]
- Monitor analytics and engagement
- Join the Ametrine community

Happy gardening!
