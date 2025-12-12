# Bracket Concept

A Next.js bracket management system for esports tournaments. The public view shows a clean bracket with live updates, animations, and match details. The admin panel lets you manage teams, matches, scores, and tournament settings.

> **Note:** This bracket is part of the [RoshProject](https://github.com/Jasper-van-Tilborg/roshproject) - a tournament website builder. Check out the [live demo](https://roshproject.vercel.app) to see the full editor.

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Project Structure](#project-structure)
5. [Architecture](#architecture)
6. [Database Setup](#database-setup)
7. [Configuration](#configuration)
8. [Usage Guide](#usage-guide)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)
11. [Limitations & Future Improvements](#limitations--future-improvements)
12. [Credits](#credits)

## Features

### Public Bracket View (`/`)

The public bracket provides a clean, animated view of the tournament:

**Hero Section:**
- Tournament name, series, and description
- Statistics: number of teams, completed matches, current winner
- Next match preview with time and location

**Round Progress Overview:**
- Visual progress indicators for each round
- Status colors: gray (completed), red (live/in-progress), blue (upcoming)
- Clickable rounds to focus on specific rounds
- Progress bars showing completion percentage

**View Modes:**
- **Live**: Shows only matches without a winner (default)
- **Completed**: Shows finished matches
- **Scheduled**: Shows matches with start times but no winner yet
- **Draws**: Full bracket tree view showing all matches

**Match Cards:**
- Expandable/collapsible match information
- Team logos and names
- Scores display
- Winner indicators
- Start time and location
- Next match preview
- Prize pool information

**Match Details Panel:**
- Slides in from the right when clicking a match
- Shows team information (logos, names, country codes, coaches, mottos)
- Player lists (first 5 players with "more" indicator)
- Livestream links (Twitch, YouTube, Facebook, TikTok, Instagram, X)
- Hashtags
- Sponsors/partners
- Prize information
- Closes with ESC key or backdrop click

**Responsive Design:**
- Desktop: Grid layout with multiple columns
- Mobile: Stacked layout with expand/collapse per round
- Smooth animations with Framer Motion

### Admin Panel (`/admin`)

Complete management interface for tournament content:

**Tournament Configuration:**
- Series name, title, and description
- Bracket type selection (single/double elimination)
- Color customization (primary, secondary, background) with contrast validation

**Supabase Database Sync:**
- Create new tournaments (generates unique ID, enables auto-sync)
- Load existing tournaments by ID
- Manual sync button
- Disconnect option to work locally only
- All changes automatically sync to Supabase when a tournament is active

**Team Management:**
- Add/edit/delete teams
- Logo upload (JPEG, PNG, GIF, WebP, SVG, max 5MB) or URL input
- Branding logo upload (separate from team logo)
- Team information: name (required, unique), country code, coach, motto, Twitch link
- Player management: add/remove players with name, role, jersey number, country code
- Team search/filter (when more than 3 teams)
- Match history per team
- Duplicate name detection

**Match Management:**
- Select bracket/round/match via dropdowns
- Assign teams to match slots (validates teams can't play against themselves)
- Enter scores for each team
- Mark winners (automatically propagates to next round)
- Match metadata: start time, location, title, subtitle, description, schedule notes, prize info

**Help Modal:**
- Comprehensive guide explaining all features
- Accessible via question mark button in header
- Organized by feature sections

## Tech Stack

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Styling via PostCSS
- **Zustand 5** - State management with persist middleware
- **Framer Motion 12** - Animations
- **Supabase** - PostgreSQL database (`@supabase/ssr`, `@supabase/supabase-js`)
- **Utilities**: `canvas-confetti`, `color-contrast-checker`, `html-to-image`, `jspdf`

## Getting Started

### Prerequisites

- Node.js 20 LTS or higher
- npm 10+
- A Supabase project (optional, but recommended for production)
- Modern browser with localStorage support

### Installation

```bash
git clone https://github.com/thijnopperman/bracket-concept-thijn-rosh.git
cd bracket-concept-thijn-rosh
npm install
npm run dev
```

Visit `http://localhost:3000` for the public bracket and `http://localhost:3000/admin` for the admin panel.

### Quick Start Without Supabase

The app works completely standalone using localStorage. Just start the dev server and begin adding teams in the admin panel. All data will be stored locally in your browser.

## Project Structure

```
app/
  page.tsx                    # Public bracket view
  admin/
    page.tsx                  # Admin panel
  components/
    BracketContainer.tsx      # Main bracket container with hero, rounds, view modes
    BracketOverview.tsx       # Full bracket tree view (Draws mode)
    MatchCard.tsx             # Individual match card component
    MatchDetailsPanel.tsx     # Slide-in detail panel
    TeamSlot.tsx              # Team slot component
  services/                   # Supabase service layer
    bracketService.ts         # Bracket CRUD operations
    matchService.ts           # Match CRUD operations
    storageService.ts         # Local file storage (data URLs)
    supabaseSync.ts           # Store synchronization helpers
    teamService.ts            # Team CRUD operations
    tournamentService.ts      # Tournament CRUD operations
  store/
    bracketStore.ts           # Zustand store with persist + Supabase sync
  types/
    bracket.ts                # TypeScript type definitions
  utils/
    bracketGenerator.ts       # Bracket generation algorithm
    colorUtils.ts             # Color helpers & contrast checks
    supabaseTransformers.ts   # Type transformers App ↔ Supabase
lib/
  supabase/
    client.ts                 # Browser client helper
    server.ts                 # SSR client helper
supabase/
  migrations/                 # Database migrations (optional)
supabase-schema.sql           # Complete database schema
```

## Architecture

### State Management

The app uses Zustand for state management with localStorage persistence:

- **Central Store** (`app/store/bracketStore.ts`): Manages all application state
  - `brackets`: Array of bracket groups
  - `teams`: Array of teams
  - `settings`: Tournament settings (type, colors, theme)
  - `selectedMatchId`: Currently selected match for detail panel
  - `viewMode`: Current view mode (live/completed/scheduled/draws)
  - `tournamentId`: Active Supabase tournament ID (null = local only)

- **Persistence**: All state automatically saved to localStorage
- **Supabase Sync**: When `tournamentId` is set, all mutations automatically sync to Supabase
- **Hydration**: Uses `useSyncExternalStore` to prevent flash of incorrect data

### Bracket Generation

The bracket generator (`app/utils/bracketGenerator.ts`) automatically creates bracket structures:

- **Single Elimination**: Standard bracket tree
- **Double Elimination**: Winners bracket + simplified losers bracket
- Automatically fills "byes" to power of 2
- Generates default match details (streams, hashtags, sponsors)
- Distributes start times and courts

### Service Layer

All database operations are handled through service functions:

- `tournamentService.ts`: Tournament CRUD
- `teamService.ts`: Team and player management
- `matchService.ts`: Match and match details
- `bracketService.ts`: Bracket structure operations
- `storageService.ts`: Converts files to data URLs for local storage
- `supabaseSync.ts`: Synchronization helpers between store and Supabase

### Data Flow

1. User makes change in admin panel
2. Zustand store updates
3. State persists to localStorage
4. If `tournamentId` is set, change syncs to Supabase
5. Public view updates automatically

### Logo Storage

Logos are stored as data URLs (base64) in:
- localStorage (always)
- Supabase database (when tournament is active)

**Limitations:**
- Data URLs are ~33% larger than original files
- localStorage has ~5-10MB limit
- For production with many teams, consider Supabase Storage

## Database Setup

### Supabase Configuration

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Open SQL Editor and run the contents of `supabase-schema.sql`

   This creates:
   - `tournaments` table
   - `teams` table
   - `players` table
   - `brackets` table
   - `rounds` table
   - `matches` table
   - `match_details` table
   - `match_media_links` table
   - `match_sponsors` table
   - Indexes for performance
   - Row Level Security (RLS) policies (currently public)

3. Copy your project URL and anon key

4. Create `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. Restart the dev server

### Database Schema Overview

**Tournaments:**
- Basic tournament info (name, description, dates, location)
- Theme colors
- Generated code (if integrated with RoshProject)
- Status (draft/published)

**Teams:**
- Team information (name, country code, coach, motto)
- Logo and branding logo (as data URLs)
- Twitch link

**Players:**
- Player information (name, role, jersey number, country code)
- Linked to teams

**Brackets, Rounds, Matches:**
- Hierarchical structure: Tournament → Brackets → Rounds → Matches
- Match details include scores, winners, start times, locations

**Match Details:**
- Title, subtitle, description
- Featured players
- Prize information
- Schedule notes

**Match Media Links:**
- Stream links (Twitch, YouTube, etc.)
- Platform type and URL

**Match Sponsors:**
- Sponsor names and links

## Configuration

### Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Note:** The app works without these variables (localStorage only). Supabase is optional but recommended for production.

### TypeScript Configuration

The project uses strict TypeScript. The `tsconfig.json` is configured for Next.js 15 with:
- Strict mode enabled
- Path aliases (`@/*` for root directory)
- JSX preserve (Next.js handles JSX transformation)

### ESLint Configuration

ESLint is configured with Next.js core-web-vitals and TypeScript rules. The config uses the flat config format compatible with ESLint 9.

## Usage Guide

### Creating a Tournament

1. Go to `/admin`
2. Fill in tournament info (series name, title, description)
3. Select bracket type (single/double elimination)
4. (Optional) Click "Create New Tournament" to enable Supabase sync
5. Add teams using "Add Team" button
6. Assign teams to matches
7. Enter scores and mark winners

### Managing Teams

**Adding a Team:**
1. Click "Add Team" in admin panel
2. Enter team name (required, must be unique)
3. Optionally add: country code, coach, motto, Twitch link
4. Upload logo (file or URL)
5. Upload branding logo (optional)
6. Click "Create Team"

**Editing a Team:**
1. Click the settings icon on a team card
2. Modify team information
3. Add/remove players
4. View/edit match history
5. Click "Save"

**Adding Players:**
1. Open team edit modal
2. Click "Add Player"
3. Fill in player details (name, role, jersey number, country code)
4. Players are automatically saved with the team

### Managing Matches

1. Select bracket, round, and match from dropdowns
2. Assign teams to Team 1 and Team 2 slots
3. Enter scores
4. Click "Mark Winner" on the winning team
5. Winner automatically moves to next round

**Match Metadata:**
- Edit match details in the team edit modal
- Set start time, location, title, subtitle, description
- Add schedule notes and prize information

### Customizing Colors

1. Go to admin panel
2. Scroll to "Bracket Colors" section
3. Use color pickers or enter hex codes
4. Changes are live - see them immediately in the public view
5. Contrast warnings help ensure readability

### View Modes

**Public Bracket:**
- **Live**: Default view showing active matches
- **Completed**: View finished matches
- **Scheduled**: View upcoming scheduled matches
- **Draws**: Full bracket tree overview

Switch between modes using the buttons above the bracket.

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

Vercel automatically detects Next.js and configures build settings.

### Other Platforms

The app can be deployed to any platform supporting Next.js 15:
- Netlify
- Railway
- Self-hosted Node.js server

Make sure to:
- Set environment variables
- Run `npm run build` successfully
- Configure Node.js 20+ runtime

### Build Process

```bash
npm run build
```

This will:
- Compile TypeScript
- Run ESLint
- Generate static pages where possible
- Create optimized production build

### Production Checklist

- [ ] Environment variables configured
- [ ] Supabase database schema created (if using Supabase)
- [ ] Build completes without errors
- [ ] Test admin panel functionality
- [ ] Test public bracket view
- [ ] Verify Supabase sync (if enabled)
- [ ] Test on mobile devices
- [ ] Check browser console for errors

## Troubleshooting

### Build Errors

**ESLint errors:**
- Run `npm run lint` to see specific issues
- Most can be auto-fixed with `npm run lint -- --fix`
- Check for unescaped entities in JSX (use `&quot;` instead of `"`)

**TypeScript errors:**
- Ensure all types are properly imported
- Check `tsconfig.json` paths are correct
- Verify Next.js types are installed

### Runtime Issues

**State not persisting:**
- Check browser localStorage is enabled
- Clear localStorage and reload if data seems corrupted
- Check browser console for errors

**Supabase sync not working:**
- Verify environment variables are set correctly
- Check Supabase project is active
- Verify database schema is created
- Check browser console for API errors
- Ensure tournament ID is set in admin panel

**Logo upload fails:**
- Check file size (max 5MB)
- Verify file type (JPEG, PNG, GIF, WebP, SVG)
- Check browser console for errors
- Try using URL instead of file upload

**Bracket not generating:**
- Ensure at least one team is added
- Check browser console for errors
- Verify bracket type is selected

### Performance Issues

**Slow loading:**
- Check number of teams (many teams = larger state)
- Logo sizes (large logos increase localStorage usage)
- Consider using Supabase Storage for logos in production

**localStorage full:**
- Reduce number of teams
- Use smaller logo files
- Consider Supabase Storage for logos
- Clear old tournament data

## Limitations & Future Improvements

### Current Limitations

- **Double Elimination**: Simplified version, not exactly like official tournament circuits
- **Authentication**: Admin panel is public (add auth for production use)
- **Logo Storage**: Uses localStorage (limited to ~5-10MB)
- **Offline Sync**: No conflict resolution for concurrent edits
- **Real-time Updates**: No live updates between multiple users (Supabase Realtime could be added)

### Recommended Improvements for Production

1. **Authentication**: Add Supabase Auth or NextAuth to protect admin panel
2. **Logo Storage**: Migrate to Supabase Storage or Cloudinary
3. **Real-time Updates**: Implement Supabase Realtime for live bracket updates
4. **Export Functionality**: Add PDF/PNG export of bracket
5. **Email Notifications**: Notify users of match updates
6. **Tournament Templates**: Pre-configured tournament setups
7. **Multi-language Support**: Internationalization
8. **Advanced Bracket Types**: Swiss system, Round Robin
9. **Conflict Resolution**: Handle concurrent edits
10. **Analytics**: Track bracket views and engagement

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (includes TypeScript and ESLint checks)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Credits

**Thijn Opperman** - All components, design, and UI/UX implementation
- All React components (`BracketContainer`, `BracketOverview`, `MatchCard`, `MatchDetailsPanel`, `TeamSlot`)
- Complete UI/UX design and styling
- Admin interface design and functionality
- Bracket visualization and animations
- Help modal and user experience

### Related Projects

This bracket is part of the **RoshProject** - a larger tournament website builder platform.

**Repository:** [https://github.com/Jasper-van-Tilborg/roshproject](https://github.com/Jasper-van-Tilborg/roshproject)  
**Live Demo:** [https://roshproject.vercel.app](https://roshproject.vercel.app)

The RoshProject includes:
- **AI Live Editor**: AI-powered website generation via Claude API
- **Custom Live Editor**: Visual drag-and-drop builder for tournament websites
- **Tournament Management Dashboard**: Manage multiple tournaments
- **Bracket Component**: This bracket application integrated into the platform

For full credits of all contributors to the RoshProject, see the [RoshProject README](https://github.com/Jasper-van-Tilborg/roshproject).

## License

No license file included - assume "All rights reserved" unless otherwise agreed with the author.
