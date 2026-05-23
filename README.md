# Family Activity Scheduler PWA

A Progressive Web App for parents to manage kids' school activities, homework, and projects with scheduling, reminders, and multi-parent collaboration.

## Features

- **Kids Management**: Add, edit, and delete kids with ages
- **Activity Scheduling**: Create activities with due dates and times
- **Multi-Kid Support**: Assign activities to one or multiple kids
- **Notes & Tags**: Add notes to activities and organize with color-coded tags
- **Calendar Export**: Export activities to Apple Calendar (ICS format)
- **Multi-Parent Collaboration**: Share kids with other parents via email
- **PWA Support**: Install as a native app on iOS, Android, and desktop
- **Real-time Sync**: All changes sync instantly across devices

## Setup

### Prerequisites
- Node.js 18+
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL from `SUPABASE_SETUP.sql` in your Supabase SQL editor
   - Copy your project URL and anon key

4. Configure environment:
   ```bash
   cp .env.local.example .env.local
   ```
   Update `.env.local` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

6. Build for production:
   ```bash
   npm run build
   ```

## Usage

### Adding Kids
1. Go to the "Kids" tab
2. Click "Add Kid"
3. Enter name and age
4. Click "Add"

### Creating Activities
1. Go to the "Activities" tab
2. Click "Add Activity"
3. Fill in title, description, date, and time
4. Select kids to assign
5. Optionally add tags
6. Click "Add"

### Sharing with Other Parents
1. Go to the "Kids" tab
2. Click "Share" on a kid's card
3. Enter the parent's email
4. Click "Share"

### Adding Notes
1. Go to the "Activities" tab
2. Click "Show Notes" on an activity
3. Type a note and click "Add"

### Exporting to Calendar
1. Go to the "Activities" tab
2. Click "Export to Calendar"
3. Open the downloaded ICS file in Apple Calendar

## Database Schema

- **kids**: Stores kid information
- **user_kids**: Manages multi-parent access to kids
- **activities**: Stores activity/schedule information
- **activity_kids**: Links activities to kids
- **notes**: Stores notes for activities
- **tags**: Stores user-defined tags
- **activity_tags**: Links tags to activities

All tables have Row Level Security (RLS) enabled for data privacy.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **PWA**: vite-plugin-pwa
- **Deployment**: Vercel (recommended)

## Running E2E tests

To run Playwright E2E tests locally:

```bash
npx playwright test
```

To run a specific test file:

```bash
npx playwright test e2e/home.spec.ts
```

### Debugging tips
- Use `npx playwright test --debug` to launch the Playwright inspector.
- Add `test.only(...)` to focus on a single test.
- Use `console.log` in your tests for debugging output.

## Deployment (Firebase Hosting)

This project includes CI workflows to deploy the `testProject` PWA to Firebase Hosting. The workflows expect certain GitHub repository secrets to be configured so the build has access to runtime configuration and the Firebase service account.

Required GitHub secrets (set in repository Settings → Secrets → Actions):
- FIREBASE_SERVICE_ACCOUNT_FAMILY_ACTIVITY_SCHEDULER — JSON service account used by the Firebase Hosting Action
- VITE_SUPABASE_URL — Supabase project URL (Vite env)
- VITE_SUPABASE_ANON_KEY — Supabase anon/public key (Vite env)
- VITE_FCM_VAPID_KEY — (optional) FCM VAPID key for push notifications
- VITE_FIREBASE_STORAGE — (optional) 'true' or 'false' for profile photo storage in Firebase
- VITE_SUPER_ADMIN_EMAIL — (optional) email treated as super-admin client-side

How the workflows work
- Pull requests: `testProject/.github/workflows/firebase-hosting-pull-request.yml` builds and deploys a preview channel using the provided Firebase service account.
- Merge to main: `testProject/.github/workflows/firebase-hosting-merge.yml` builds and deploys to the live channel.

Notes and recommendations
- The CI injects Vite env vars at build time by writing `.env.production` inside `testProject/` before running `npm run build`. Ensure the required secrets are present.
- Create a Firebase service account with at least the **Firebase Hosting Admin** role and add the JSON as `FIREBASE_SERVICE_ACCOUNT_FAMILY_ACTIVITY_SCHEDULER`.
- Keep service account keys out of the repository and rotate/revoke them regularly.
- To manually deploy from local machine, use Firebase CLI:

```bash
# login and target your project
firebase login
firebase use --add
# build and deploy
cd testProject
npm ci
npm run build
firebase deploy --only hosting
```

## License

MIT
