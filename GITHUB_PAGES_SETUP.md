# GitHub Pages Deployment Setup

This repository is configured to automatically deploy the Replit app (`packages/replit/`) to GitHub Pages on every push to the main branch.

## Setup Instructions

To enable GitHub Pages deployment for this repository:

1. **Go to your GitHub repository settings**
   - Navigate to `https://github.com/intuition-box/Oracle-Lend/settings`

2. **Enable GitHub Pages**
   - Scroll down to the "Pages" section in the left sidebar
   - Click on "Pages"

3. **Configure the source**
   - Under "Source", select "GitHub Actions"
   - This will allow the workflow to deploy to GitHub Pages

4. **Verify permissions**
   - The workflow already includes the necessary permissions:
     ```yaml
     permissions:
       contents: read
       pages: write
       id-token: write
     ```

## How it works

- The workflow is triggered on every push to the `main` branch
- It builds the Vite app in `packages/replit/` with production settings
- The built files are deployed to GitHub Pages
- Your app will be available at: `https://intuition-box.github.io/Oracle-Lend/`

## Workflow Details

The deployment workflow (`deploy-replit.yml`) does the following:

1. **Build Job**:
   - Checks out the code
   - Sets up Node.js 18
   - Installs dependencies (both root and replit-specific)
   - Builds the Vite app with `NODE_ENV=production`
   - Uploads the build artifacts

2. **Deploy Job**:
   - Deploys the built files to GitHub Pages
   - Runs only after the build job succeeds

## Local Testing

To test the build locally before pushing:

```bash
cd packages/replit
npm run build:github
```

This will create a `dist/` folder with the production build that matches what will be deployed to GitHub Pages.

## Configuration

The Vite configuration automatically sets the correct base path for GitHub Pages:
- Development: `/` (for local development)
- Production: `/Oracle-Lend/` (for GitHub Pages)

This is configured in `packages/replit/vite.config.js`:
```javascript
base: process.env.NODE_ENV === 'production' ? '/Oracle-Lend/' : '/'
```
