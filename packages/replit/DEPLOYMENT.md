# GitHub Pages Deployment Guide

This project is configured for GitHub Pages deployment with SPA (Single Page Application) routing support.

## How it works

The routing issue you experienced is common with SPAs on GitHub Pages. When you refresh a page like `/dex` or `/analytics`, GitHub Pages tries to find a physical file at that path and returns a 404 since it doesn't exist.

## Solution implemented

1. **404.html**: Redirects any 404 errors back to `index.html` with route information preserved
2. **index.html**: Contains a script that detects redirected routes and restores the correct URL
3. **Auto-detection**: Automatically detects if you're using a project site (`username.github.io/repo-name`) or user site (`username.github.io`)

## Deployment steps

1. Build the project for production:
   ```bash
   yarn build:github
   ```

2. Deploy the `dist` folder to GitHub Pages

3. Enable GitHub Pages in your repository settings:
   - Go to Settings > Pages
   - Select "Deploy from a branch"
   - Choose "main" branch and "/dist" folder (or upload the dist contents to your gh-pages branch)

## Testing

After deployment:
- ✅ Homepage should work: `https://yourusername.github.io/yourrepo/`
- ✅ Direct routes should work: `https://yourusername.github.io/yourrepo/dex`
- ✅ Refreshing on any page should work
- ✅ Browser back/forward buttons should work

## Configuration

If auto-detection doesn't work for your setup, you can manually adjust the `pathSegmentsToKeep` value in `public/404.html`:

- For project sites (`username.github.io/repo-name`): `pathSegmentsToKeep = 1`
- For user sites (`username.github.io`) or custom domains: `pathSegmentsToKeep = 0`

## Files modified

- `public/404.html` - GitHub Pages SPA redirect handler
- `index.html` - Route restoration script
- `vite.config.js` - Ensure 404.html is included in build
- `package.json` - Added `build:github` script
