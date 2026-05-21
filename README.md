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

## License

MIT
