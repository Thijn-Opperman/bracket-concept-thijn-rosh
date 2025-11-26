# 📚 Complete Documentatie - Bracket Tournament Applicatie

## 📋 Inhoudsopgave

1. [Project Overzicht](#project-overzicht)
2. [Supabase Setup](#supabase-setup)
3. [Database Structuur](#database-structuur)
4. [Gebruik & Implementatie](#gebruik--implementatie)
5. [Testen](#testen)
6. [Troubleshooting](#troubleshooting)
7. [Project Structuur](#project-structuur)

---

## 🎯 Project Overzicht

### Wat is dit project?
Een moderne bracket tournament applicatie gebouwd met Next.js, React, TypeScript en Supabase. De applicatie ondersteunt single-elimination en double-elimination brackets met volledige team- en matchbeheer.

### Technologie Stack
- **Framework**: Next.js 16.0.1
- **UI**: React 19.2.0 met Tailwind CSS
- **State Management**: Zustand met localStorage persistence
- **Database**: Supabase (PostgreSQL)
- **Animations**: Framer Motion
- **Type Safety**: TypeScript

### Belangrijkste Features
- ✅ Tournament beheer (single/double elimination)
- ✅ Team beheer met spelers
- ✅ Match beheer met scores en winnaars
- ✅ Real-time bracket visualisatie
- ✅ Admin interface voor beheer
- ✅ Supabase integratie voor cloud opslag
- ✅ Automatische data syncing

---

## 🚀 Supabase Setup

### Stap 1: Supabase Project Aanmaken

1. **Account aanmaken**
   - Ga naar [supabase.com](https://supabase.com)
   - Klik op "Start your project" of "Sign up"
   - Maak een account aan (gebruik GitHub voor snelle setup)

2. **Nieuw project aanmaken**
   - Klik op "New Project"
   - Vul in:
     - **Organization**: Kies of maak een nieuwe organization
     - **Name**: `bracket-tournament` (of een andere naam)
     - **Database Password**: Genereer een sterk wachtwoord (bewaar dit!)
     - **Region**: Kies de dichtstbijzijnde regio (bijv. `West EU (Ireland)`)
     - **Pricing Plan**: Free tier is voldoende voor ontwikkeling
   - Klik op "Create new project"
   - Wacht 2-3 minuten tot het project is aangemaakt

### Stap 2: API Keys Ophalen

1. **Project Settings**
   - In je Supabase dashboard, klik op het **⚙️ Settings** icoon (links onderin)
   - Ga naar **API** in het menu

2. **Keys kopiëren**
   Je ziet hier:
   - **Project URL**: Bijv. `https://xxxxx.supabase.co`
   - **anon public key**: Een lange string die begint met `eyJ...`
   - **service_role key**: (Niet nodig voor nu, maar bewaar veilig)

3. **Environment Variables Aanmaken**
   Maak een `.env.local` bestand in de root van je project:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **⚠️ Belangrijk**: 
   - Voeg `.env.local` toe aan je `.gitignore` (niet committen!)
   - Vervang de `xxxxx` met je echte project URL en key
   - Herstart je development server na het toevoegen van env vars

### Stap 3: Database Schema Aanmaken

1. **SQL Editor Openen**
   - In Supabase dashboard, klik op **SQL Editor** (links menu)
   - Klik op **New Query**

2. **SQL Script Uitvoeren**
   - Open het bestand `supabase-schema.sql` in je project
   - Kopieer ALLES uit dit bestand
   - Plak het in de Supabase SQL Editor
   - Klik op **Run** (of druk Cmd+Enter / Ctrl+Enter)
   - Wacht enkele seconden tot het script is uitgevoerd

3. **Verificatie**
   - Ga naar **Table Editor** in het Supabase dashboard
   - Je zou nu 9 tabellen moeten zien:
     - `tournaments`
     - `teams`
     - `players`
     - `brackets`
     - `rounds`
     - `matches`
     - `match_details`
     - `match_media_links`
     - `match_sponsors`

### Stap 4: Packages Installeren

De benodigde packages zijn al geïnstalleerd:
- `@supabase/supabase-js` - Supabase JavaScript client
- `@supabase/ssr` - Supabase SSR support voor Next.js

Als je ze nog moet installeren:
```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

## 🗄️ Database Structuur

### Relatie Diagram

```
tournaments (1)
    │
    ├── teams (many)
    │       │
    │       └── players (many)
    │
    └── brackets (many)
            │
            └── rounds (many)
                    │
                    └── matches (many)
                            │
                            ├── team_a_id → teams (FK)
                            ├── team_b_id → teams (FK)
                            │
                            ├── match_details (1:1)
                            │       │
                            │       ├── match_media_links (many)
                            │       └── match_sponsors (many)
```

### Tabel Overzicht

#### 1. `tournaments`
Hoofdtoernooi configuratie en instellingen.

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| `id` | UUID | Unieke identifier (auto-generated) |
| `name` | TEXT | Toernooi naam |
| `bracket_type` | TEXT | 'single-elimination' of 'double-elimination' |
| `primary_color` | TEXT | Hex kleur code |
| `secondary_color` | TEXT | Hex kleur code |
| `background_color` | TEXT | Hex kleur code |
| `bracket_style` | TEXT | 'classic', 'modern', of 'playful' |
| `theme` | TEXT | 'retro', 'futuristic', of 'sporty' |
| `tournament_series` | TEXT | Serie naam |
| `tournament_title` | TEXT | Titel |
| `tournament_description` | TEXT | Beschrijving |

**Mapt naar**: `BracketSettings` in TypeScript

#### 2. `teams`
Teams die deelnemen aan het toernooi.

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| `id` | UUID | Unieke identifier (auto-generated) |
| `tournament_id` | UUID (FK) | Referentie naar tournament |
| `name` | TEXT | Team naam (uniek per tournament) |
| `logo` | TEXT | URL of base64 logo |
| `country_code` | TEXT | Landcode (bijv. "NL") |
| `coach` | TEXT | Coach naam |
| `motto` | TEXT | Team motto |
| `twitch_link` | TEXT | Twitch URL |

**Mapt naar**: `Team` in TypeScript

#### 3. `players`
Spelers binnen een team.

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| `id` | UUID | Unieke identifier |
| `team_id` | UUID (FK) | Referentie naar team |
| `name` | TEXT | Speler naam |
| `role` | TEXT | Rol (bijv. "Captain") |
| `number` | TEXT | Rugnummer |
| `country_code` | TEXT | Landcode |

**Mapt naar**: `Player` in TypeScript

#### 4. `brackets`
Bracket groepen (bijv. "Hoofdbracket", "Winners Bracket", "Losers Bracket").

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| `id` | UUID | Unieke identifier |
| `tournament_id` | UUID (FK) | Referentie naar tournament |
| `name` | TEXT | Bracket naam |

**Mapt naar**: `BracketGroup` in TypeScript

#### 5. `rounds`
Rondes binnen een bracket.

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| `id` | UUID | Unieke identifier |
| `bracket_id` | UUID (FK) | Referentie naar bracket |
| `name` | TEXT | Ronde naam (bijv. "Finale") |
| `round_index` | INTEGER | Volgorde (0 = eerste ronde) |

**Mapt naar**: `Round` in TypeScript

#### 6. `matches`
Individuele wedstrijden.

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| `id` | UUID | Unieke identifier |
| `round_id` | UUID (FK) | Referentie naar round |
| `match_index` | INTEGER | Positie binnen de ronde |
| `team_a_id` | UUID (FK) | Team A (kan NULL zijn) |
| `team_b_id` | UUID (FK) | Team B (kan NULL zijn) |
| `team_a_score` | INTEGER | Score team A |
| `team_b_score` | INTEGER | Score team B |
| `winner_index` | INTEGER | 0 = team_a, 1 = team_b |
| `start_time` | TEXT | Starttijd (bijv. "14:30") |
| `court` | TEXT | Locatie (bijv. "Main Arena") |

**Mapt naar**: `Match` in TypeScript

#### 7. `match_details`
Extra informatie over een match.

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| `id` | UUID | Unieke identifier |
| `match_id` | UUID (FK) | Referentie naar match (1:1) |
| `title` | TEXT | Match titel |
| `subtitle` | TEXT | Subtitel |
| `description` | TEXT | Beschrijving |
| `featured_players` | TEXT[] | Array van speler namen |
| `hashtags` | TEXT[] | Array van hashtags |
| `prize_info` | TEXT | Prijzen informatie |
| `highlight_color` | TEXT | Highlight kleur |

**Mapt naar**: `MatchDetails` in TypeScript

#### 8. `match_media_links`
Stream links en social media links per match.

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| `id` | UUID | Unieke identifier |
| `match_id` | UUID (FK) | Referentie naar match |
| `platform` | TEXT | 'twitch', 'youtube', 'facebook', etc. |
| `url` | TEXT | URL |
| `label` | TEXT | Optionele label |

**Mapt naar**: `MatchMediaLink[]` in TypeScript

#### 9. `match_sponsors`
Sponsors per match.

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| `id` | UUID | Unieke identifier |
| `match_id` | UUID (FK) | Referentie naar match |
| `name` | TEXT | Sponsor naam |
| `url` | TEXT | Sponsor URL |
| `logo` | TEXT | Sponsor logo URL |

**Mapt naar**: `MatchSponsor[]` in TypeScript

---

## 💻 Gebruik & Implementatie

### Wat is er geïmplementeerd?

#### 1. Service Layer (`app/services/`)
- **`tournamentService.ts`** - Tournament CRUD operaties
- **`teamService.ts`** - Team CRUD operaties
- **`matchService.ts`** - Match CRUD operaties
- **`bracketService.ts`** - Bracket structuur operaties
- **`supabaseSync.ts`** - Helper functies voor syncing

#### 2. Data Transformers (`app/utils/supabaseTransformers.ts`)
Functies om data te transformeren tussen app types en Supabase database types.

#### 3. Store Uitbreiding (`app/store/bracketStore.ts`)
- Nieuwe state: `tournamentId` en `isSyncing`
- Nieuwe functies voor Supabase integratie
- Automatische syncing naar Supabase wanneer `tournamentId` is ingesteld
- localStorage blijft werken als fallback

### Hoe te gebruiken

#### Optie 1: Nieuw Tournament Aanmaken

```typescript
import { useBracketStore } from '@/app/store/bracketStore';

const { createTournamentInSupabase, setTournamentId } = useBracketStore();

// Maak tournament aan in Supabase
const tournamentId = await createTournamentInSupabase();

if (tournamentId) {
  // Zet tournament ID in store (activeert automatische syncing)
  setTournamentId(tournamentId);
  console.log('Tournament aangemaakt:', tournamentId);
}
```

#### Optie 2: Bestaand Tournament Laden

```typescript
const { loadFromSupabase } = useBracketStore();

// Laad tournament data uit Supabase
const success = await loadFromSupabase('jouw-tournament-id');

if (success) {
  console.log('Tournament geladen!');
  // Tournament ID wordt automatisch gezet
}
```

#### Optie 3: Automatische Syncing

Wanneer je een `tournamentId` hebt ingesteld, worden alle wijzigingen automatisch naar Supabase gesynct:

```typescript
const { tournamentId, addTeam, setSettings, setWinner } = useBracketStore();

// Als tournamentId is ingesteld, worden wijzigingen automatisch gesynct
await addTeam({
  id: 'temp-id', // Wordt vervangen door UUID
  name: 'Team Alpha',
  countryCode: 'NL'
});
// Team wordt automatisch naar Supabase gesynct!

await setSettings({ tournamentTitle: 'New Title' });
// Settings worden automatisch naar Supabase gesynct!
```

### Store Functies Overzicht

#### Nieuwe Supabase Functies

| Functie | Beschrijving |
|---------|--------------|
| `setTournamentId(tournamentId)` | Zet het tournament ID (activeert Supabase syncing) |
| `loadFromSupabase(tournamentId)` | Laad volledige tournament data uit Supabase |
| `createTournamentInSupabase()` | Maak nieuw tournament aan in Supabase |
| `syncToSupabase()` | Handmatig sync alle data naar Supabase |

#### Bestaande Functies (nu met Supabase support)

Deze functies syncen automatisch naar Supabase als `tournamentId` is ingesteld:

- `setSettings()` - Sync settings
- `addTeam()` - Sync team + regenereer brackets
- `removeTeam()` - Verwijder team + regenereer brackets
- `updateTeam()` - Sync team updates
- `setWinner()` - Sync match winner
- `setTeamScore()` - Sync scores
- `setMatchTeam()` - Sync team assignments
- `updateMatchDetails()` - Sync match details

### Data Flow

**Wanneer je een wijziging maakt:**
1. **Local State Update** - Zustand store wordt direct bijgewerkt (UI reageert direct)
2. **Supabase Sync** - Als `tournamentId` bestaat, wordt data naar Supabase gesynct (achtergrond)
3. **Error Handling** - Als sync faalt, wordt error gelogd maar local state blijft intact

**Wanneer je data laadt:**
1. **Supabase Query** - Data wordt opgehaald uit Supabase
2. **Transform** - Data wordt getransformeerd naar app types
3. **Store Update** - Store wordt bijgewerkt met nieuwe data

---

## 🧪 Testen

### Snelle Test via Test Pagina

1. **Start development server**
   ```bash
   npm run dev
   ```

2. **Open test pagina**
   - Ga naar: `http://localhost:3000/test`
   - Klik op "Test Supabase"

3. **Controleer resultaat**
   - ✅ Groen resultaat = werkt
   - ❌ Rode error = check browser console (F12)

### Test via Browser Console

1. **Open admin pagina**
   - Ga naar: `http://localhost:3000/admin`
   - Open browser console (F12)

2. **Voer test script uit**

```javascript
(async () => {
  console.log('🧪 Testing Supabase...');
  
  const { useBracketStore } = await import('@/app/store/bracketStore');
  const store = useBracketStore.getState();
  
  // Maak tournament aan
  const tournamentId = await store.createTournamentInSupabase();
  console.log('✅ Tournament ID:', tournamentId);
  
  if (tournamentId) {
    store.setTournamentId(tournamentId);
    
    // Voeg team toe
    await store.addTeam({
      id: 'test-1',
      name: 'Test Team',
      countryCode: 'NL'
    });
    console.log('✅ Team toegevoegd!');
    console.log('📊 Check Supabase Dashboard!');
  }
})();
```

### Verificatie in Supabase Dashboard

1. **Ga naar Supabase Dashboard**
   - Open [supabase.com/dashboard](https://supabase.com/dashboard)
   - Klik op je project

2. **Ga naar Table Editor**
   - Klik op "Table Editor" in het linkermenu

3. **Controleer tabellen:**
   - `tournaments` → Je tournament staat erin
   - `teams` → Je teams staan erin
   - `brackets` → Brackets zijn aangemaakt (als je teams hebt)
   - `rounds` → Rondes zijn aangemaakt
   - `matches` → Matches zijn aangemaakt

### Test Checklist

- [ ] Tournament kan worden aangemaakt
- [ ] Teams kunnen worden toegevoegd
- [ ] Data verschijnt in Supabase Dashboard
- [ ] Data kan worden geladen uit Supabase
- [ ] Wijzigingen worden automatisch gesynct
- [ ] Geen errors in browser console

---

## 🐛 Troubleshooting

### Error: "Failed to create tournament"

**Mogelijke oorzaken:**
- Environment variables niet correct ingesteld
- Supabase project niet actief
- SQL script niet uitgevoerd

**Oplossing:**
1. Controleer `.env.local` bestand
2. Herstart development server
3. Controleer of Supabase project actief is
4. Controleer of tabellen zijn aangemaakt

### Error: "relation does not exist"

**Oorzaak:** SQL script niet uitgevoerd

**Oplossing:**
1. Ga naar Supabase Dashboard > SQL Editor
2. Kopieer en plak `supabase-schema.sql`
3. Klik op Run
4. Controleer of alle tabellen zijn aangemaakt

### Error: "permission denied"

**Oorzaak:** Row Level Security policies niet correct

**Oplossing:**
1. Ga naar Supabase Dashboard > SQL Editor
2. Controleer of RLS policies zijn aangemaakt
3. Voer het SQL script opnieuw uit

### Error: "foreign key constraint violation"

**Oorzaak:** Tournament bestaat niet in database

**Oplossing:**
1. Controleer of tournament is aangemaakt
2. Check Supabase Dashboard > Table Editor > tournaments
3. Zorg dat `tournamentId` correct is ingesteld voordat je teams toevoegt

### Error: "connection failed" / Error Code -102

**Oorzaak:** Supabase URL niet bereikbaar

**Oplossing:**
1. Controleer of Supabase project actief is
2. Controleer of URL correct is in `.env.local`
3. Check of project niet gepauzeerd is in dashboard

### Data wordt niet gesynct

**Oorzaak:** `tournamentId` niet ingesteld

**Oplossing:**
```javascript
// In browser console:
const store = useBracketStore.getState();
console.log('Tournament ID:', store.tournamentId);

// Als null, zet het:
store.setTournamentId('jouw-tournament-id');
```

### Teams worden niet opgeslagen

**Oorzaak:** Tournament ID niet gekoppeld aan team

**Oplossing:**
1. Controleer of `tournamentId` is ingesteld voordat je teams toevoegt
2. Controleer in Supabase of `tournament_id` veld is ingevuld in teams tabel
3. Check browser console voor errors

---

## 📁 Project Structuur

```
bracket-concept-thijn-rosh/
├── app/
│   ├── admin/
│   │   └── page.tsx              # Admin interface voor beheer
│   ├── components/
│   │   ├── BracketContainer.tsx  # Hoofd bracket component
│   │   ├── BracketOverview.tsx   # Bracket overzicht
│   │   ├── MatchCard.tsx         # Match card component
│   │   ├── MatchDetailsPanel.tsx # Match details panel
│   │   └── TeamSlot.tsx          # Team slot component
│   ├── services/                 # Supabase service layer
│   │   ├── tournamentService.ts  # Tournament operaties
│   │   ├── teamService.ts        # Team operaties
│   │   ├── matchService.ts       # Match operaties
│   │   ├── bracketService.ts     # Bracket operaties
│   │   └── supabaseSync.ts       # Sync helpers
│   ├── store/
│   │   └── bracketStore.ts       # Zustand store met Supabase integratie
│   ├── types/
│   │   └── bracket.ts            # TypeScript types
│   ├── utils/
│   │   ├── bracketGenerator.ts   # Bracket generatie logica
│   │   ├── colorUtils.ts         # Kleur utilities
│   │   └── supabaseTransformers.ts # Data transformatie
│   ├── test/
│   │   └── page.tsx              # Test pagina voor Supabase
│   ├── page.tsx                  # Hoofdpagina
│   └── layout.tsx                # Root layout
├── lib/
│   └── supabase/
│       ├── client.ts             # Supabase client (browser)
│       └── server.ts             # Supabase client (server)
├── supabase-schema.sql           # Database schema SQL script
├── .env.local                    # Environment variables (niet in git)
└── DOCUMENTATIE.md               # Deze documentatie
```

### Belangrijke Bestanden

#### Configuratie
- **`.env.local`** - Supabase credentials (niet committen!)
- **`supabase-schema.sql`** - Database schema
- **`package.json`** - Dependencies

#### Core Logic
- **`app/store/bracketStore.ts`** - State management met Supabase
- **`app/utils/bracketGenerator.ts`** - Bracket generatie
- **`app/services/`** - Supabase service layer

#### UI Components
- **`app/components/BracketContainer.tsx`** - Hoofd bracket view
- **`app/admin/page.tsx`** - Admin interface

---

## 🔄 Data Mapping

### Huidige Zustand Store → Supabase Tabellen

| Zustand Store Data | Supabase Tabel | Opmerkingen |
|-------------------|----------------|-------------|
| `settings` | `tournaments` | Alle tournament instellingen |
| `teams[]` | `teams` + `players` | Teams met hun spelers |
| `brackets[]` | `brackets` | Bracket groepen (main, winners, losers) |
| `brackets[].rounds[]` | `rounds` | Rondes binnen een bracket |
| `rounds[].matches[]` | `matches` | Wedstrijden binnen een ronde |
| `matches[].teams[0/1]` | `matches.team_a_id` / `matches.team_b_id` | Team referenties |
| `matches[].details` | `match_details` + `match_media_links` + `match_sponsors` | Match details, streams, sponsors |

### Belangrijke Verschillen

1. **IDs**
   - **Nu**: Strings zoals `"team-1234567890"`
   - **Supabase**: UUIDs zoals `"550e8400-e29b-41d4-a716-446655440000"`

2. **Nested Data**
   - **Nu**: Alles is genest in één object (brackets → rounds → matches)
   - **Supabase**: Relational database met foreign keys

3. **Teams in Matches**
   - **Nu**: Volledige team objecten in `match.teams[0]` en `match.teams[1]`
   - **Supabase**: Alleen referenties (`team_a_id`, `team_b_id`) + aparte scores

---

## ⚙️ Configuratie

### Environment Variables

Maak `.env.local` aan in de root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://jouw-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=je-anon-key-hier
```

**Hoe je deze krijgt:**
1. Ga naar Supabase Dashboard
2. Settings > API
3. Kopieer "Project URL" en "anon public" key

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🎯 Belangrijke Opmerkingen

### Security
- **RLS Policies**: Momenteel is alles publiek. Voor productie moet je:
  - Authenticatie toevoegen
  - Policies aanpassen zodat alleen admins kunnen schrijven
  - Publiek kan alleen lezen

### Performance
- **Indexes**: Zijn al toegevoegd voor snelle queries
- **Relations**: Foreign keys zorgen voor data integriteit

### Data Types
- **UUID**: Alle IDs zijn UUIDs (niet strings zoals nu)
- **Arrays**: `featured_players` en `hashtags` zijn PostgreSQL arrays
- **JSON**: Complexe data kan als JSONB opgeslagen worden indien nodig

### Hybride Aanpak
- De store gebruikt localStorage als fallback
- Als er geen `tournamentId` is, werkt alles zoals voorheen
- Supabase syncing gebeurt alleen wanneer `tournamentId` is ingesteld

---

## 📝 Volgende Stappen (Optioneel)

1. **Real-time Updates**
   - Supabase Realtime gebruiken voor live updates
   - Zodat meerdere gebruikers tegelijk kunnen werken

2. **Authenticatie**
   - User authenticatie toevoegen
   - Meerdere tournaments per gebruiker

3. **Data Migratie**
   - Bestaande localStorage data migreren naar Supabase

4. **Production Ready**
   - RLS policies aanpassen voor productie
   - Error handling verbeteren
   - Loading states toevoegen

---

## 🆘 Handige Links

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Next.js Documentation](https://nextjs.org/docs)

---

## ✅ Checklist voor Nieuwe Setup

- [ ] Supabase project aangemaakt
- [ ] Environment variables ingesteld (`.env.local`)
- [ ] SQL script uitgevoerd (alle tabellen aangemaakt)
- [ ] Development server gestart
- [ ] Test pagina werkt (`/test`)
- [ ] Tournament kan worden aangemaakt
- [ ] Teams kunnen worden toegevoegd
- [ ] Data verschijnt in Supabase Dashboard

---

## 📊 Data Sync Overzicht

### ✅ Wat wordt opgeslagen in Supabase

**Alle data wijzigingen worden automatisch gesynct naar Supabase wanneer `tournamentId` is ingesteld:**

- ✅ Tournament settings → `tournaments` tabel
- ✅ Teams + Players → `teams` + `players` tabellen
- ✅ Brackets + Rounds + Matches → `brackets` + `rounds` + `matches` tabellen
- ✅ Match details → `match_details` + `match_media_links` + `match_sponsors` tabellen

### ❌ Wat wordt NIET opgeslagen

**UI State (alleen lokaal in Zustand store):**
- `activeBracketId`, `selectedMatchId`, `showHistory`, `viewMode` → Alleen localStorage
- `isSyncing`, `tournamentId` → Runtime state, niet opgeslagen

**Berekende velden:**
- `settings.numTeams` → Wordt berekend uit `teams.length`
- `matches[].roundIndex` → Wordt geïnferreerd via `rounds.round_index`

### 🔄 Sync Gedrag

**Automatische Syncing:**
- Wanneer `tournamentId` is ingesteld: Alle wijzigingen worden automatisch naar Supabase gesynct
- Wanneer `tournamentId` NIET is ingesteld: Geen syncing, alleen localStorage

**Alle store acties die data wijzigen worden gesynct:**
- ✅ `setSettings()` → Tournament settings
- ✅ `addTeam()` → Teams + Brackets
- ✅ `updateTeam()` → Team + Matches (ook matches met dat team)
- ✅ `removeTeam()` → Teams verwijderd + Brackets geregenereerd
- ✅ `setWinner()` → Match + Volgende match (winner propagatie)
- ✅ `setTeamScore()` → Match scores
- ✅ `setMatchTeam()` → Match teams
- ✅ `updateMatchDetails()` → Match details
- ✅ `initializeBracket()` → Teams + Brackets
- ✅ `resetBracket()` → Brackets geregenereerd

### 🔍 Foreign Key Constraints

Alle foreign keys zijn correct gekoppeld:
- `teams.tournament_id` → `tournaments.id` ✅
- `players.team_id` → `teams.id` ✅
- `brackets.tournament_id` → `tournaments.id` ✅
- `rounds.bracket_id` → `brackets.id` ✅
- `matches.round_id` → `rounds.id` ✅
- `matches.team_a_id` / `team_b_id` → `teams.id` ✅ (kan NULL zijn)
- `match_details.match_id` → `matches.id` ✅
- `match_media_links.match_id` → `matches.id` ✅
- `match_sponsors.match_id` → `matches.id` ✅

### 📋 Recente Fixes

**Fix 1: `setWinner()` - Volgende Match Sync**
- Probleem: Volgende match werd niet gesynct bij winner propagatie
- Oplossing: Nu wordt ook de volgende match gesynct ✅

**Fix 2: `updateTeam()` - Match Updates Sync**
- Probleem: Matches met geüpdatete team werden niet gesynct
- Oplossing: Nu worden alle matches met dat team ook gesynct ✅

**Fix 3: `initializeBracket()` & `resetBracket()` Sync**
- Probleem: Deze functies werden niet naar Supabase gesynct
- Oplossing: Sync toegevoegd ✅

---

**Succes met je bracket applicatie! 🎉**

Voor vragen of problemen, check de Troubleshooting sectie of de browser console voor errors.

