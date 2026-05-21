# Family Activity Scheduler - Deployment Guide

## Vercel Deployment

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project" and import your repository
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click "Deploy"

## Supabase Setup Checklist

- [ ] Create Supabase project
- [ ] Run SUPABASE_SETUP.sql in SQL editor
- [ ] Enable email authentication in Auth settings
- [ ] Copy project URL and anon key
- [ ] Add to environment variables

## PWA Installation

### iOS
1. Open app in Safari
2. Tap Share button
3. Select "Add to Home Screen"

### Android
1. Open app in Chrome
2. Tap menu (three dots)
3. Select "Install app"

### Desktop
1. Open app in browser
2. Click install icon in address bar

## Post-Deployment

- [ ] Test authentication
- [ ] Test kid creation and sharing
- [ ] Test activity creation and export
- [ ] Test notes and tags
- [ ] Test PWA installation
- [ ] Test on mobile devices
