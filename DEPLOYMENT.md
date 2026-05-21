# Deployment Guide

## GitHub Pages Setup

### Step 1: Create GitHub Actions Workflow
1. Go to your repo: https://github.com/arzel0007/family-activity-scheduler
2. Click **Actions** tab
3. Click **New workflow** → **set up a workflow yourself**
4. Name: `deploy.yml`
5. Paste this content:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

6. Click **Commit changes**

### Step 2: Configure GitHub Pages
1. Go to repo **Settings** → **Pages**
2. Set **Source** to **GitHub Actions**
3. Save

### Step 3: Deploy
1. Go to **Actions** tab
2. Click **Deploy to GitHub Pages** workflow
3. Click **Run workflow** → **Run workflow**
4. Wait for build to complete (~2-3 minutes)
5. Your app will be live at: `https://arzel0007.github.io/family-activity-scheduler/`

## Local Testing Before Deploy

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Preview production build
npm run preview
# Open http://localhost:4173
```

## Lighthouse Audit

1. Build the app: `npm run build`
2. Preview: `npm run preview`
3. Open Chrome DevTools (F12)
4. Go to **Lighthouse** tab
5. Click **Analyze page load**
6. Target: Performance 90+, Accessibility 90+, Best Practices 90+, SEO 90+

## Manual Testing

Follow checklist in `TESTING.md`:
- Core features (add/edit/delete kids & activities)
- Notifications, recurring activities, templates
- Search, filtering, history, bulk operations
- Dark mode, keyboard shortcuts, export/import
- Offline support, loading states
- Responsive design, accessibility

## Post-Deployment

1. Test live app at GitHub Pages URL
2. Verify PWA install prompt appears
3. Test offline mode (DevTools → Network → Offline)
4. Check console for errors
5. Monitor Firebase logs for notification issues

## Troubleshooting

**Build fails:**
- Check Node version: `node --version` (should be 18+)
- Clear cache: `npm ci && npm run build`

**App not deploying:**
- Verify GitHub Actions workflow ran successfully
- Check Pages settings: Source should be "GitHub Actions"

**Notifications not working:**
- Add FCM VAPID key to `.env.local`: `VITE_FCM_VAPID_KEY=your_key`
- Deploy Cloud Function for sending notifications

**Offline not working:**
- Check service worker registered: DevTools → Application → Service Workers
- Verify IndexedDB: DevTools → Application → IndexedDB
