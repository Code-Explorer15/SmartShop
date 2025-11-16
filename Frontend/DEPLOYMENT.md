# Netlify Deployment Guide

This guide will help you deploy the SmartShop application to Netlify.

## Prerequisites

- GitHub account
- Netlify account (free tier works)
- Node.js installed locally (for testing builds)

## Deployment Steps

### Option 1: Deploy via GitHub (Recommended)

1. **Push to GitHub:**
   ```bash
   cd Frontend
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Connect to Netlify:**
   - Go to [Netlify](https://www.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select your repository
   - Netlify will automatically detect the settings from `netlify.toml`

3. **Build Settings (Auto-detected):**
   - Build command: `npm run build`
   - Publish directory: `dist/smartshop`
   - Node version: 18

4. **Deploy:**
   - Click "Deploy site"
   - Netlify will build and deploy your application
   - You'll get a URL like: `https://your-app-name.netlify.app`

### Option 2: Manual Deploy

1. **Build locally:**
   ```bash
   cd Frontend
   npm install
   npm run build
   ```

2. **Deploy:**
   - Go to Netlify dashboard
   - Drag and drop the `dist/smartshop` folder
   - Your site will be live!

## Important Files

- `netlify.toml` - Netlify configuration file
- `src/_redirects` - SPA routing redirects (copied to dist during build)
- `angular.json` - Angular build configuration

## Features Configured

✅ SPA routing support (all routes redirect to index.html)
✅ Production build optimization
✅ Mobile responsive design
✅ Proper asset handling

## Testing

After deployment, test:
- [ ] Application loads correctly
- [ ] Login page works
- [ ] Navigation works (no 404 errors on refresh)
- [ ] Mobile view displays properly
- [ ] All images and assets load

## Troubleshooting

- **404 errors on refresh:** Ensure `_redirects` file is in the dist folder
- **Build fails:** Check Node version (should be 18+)
- **Assets not loading:** Verify assets are in `src/assets` folder

## Support

For issues, check:
- Netlify build logs
- Browser console for errors
- Network tab for failed requests

