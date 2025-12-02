# Bracket Concept

Een Next.js App Router-project voor het ontwerpen, beheren en presenteren van esports-toernooibrackets. De publieke ervaring levert een cinematografische bracketweergave met animaties, meerdere modes en detailpanelen; `/admin` bevat de complete beheerconsole voor teams, matches, styling en metadata.

---

## Inhoudsopgave

1. [Feature highlights](#feature-highlights)
2. [Tech stack](#tech-stack)
3. [Projectstructuur](#projectstructuur)
4. [Benodigdheden](#benodigdheden)
5. [Quick start](#quick-start)
6. [Beschikbare scripts](#beschikbare-scripts)
7. [Publieke & admin flow](#publieke--admin-flow)
8. [Architectuur en state](#architectuur-en-state)
9. [Environment & configuratie](#environment--configuratie)
10. [Kwaliteitscontrole](#kwaliteitscontrole)
11. [Deployment](#deployment)
12. [Known limitations & roadmap](#known-limitations--roadmap)
13. [Submission checklist](#submission-checklist)
14. [Contributie](#contributie)
15. [Licentie](#licentie)

---

## Feature highlights

- **Realtime bracket experience**
  - Hero-statistieken, ronde-overzichten en statusbolletjes (grijs = afgerond, rood = live, blauw = komend).
  - View-modi: live, completed, scheduled en draws (`BracketOverview` toont de volledige tree).
  - Framer Motion-animaties, hover states en focusmodus per ronde.
  - `MatchCard` bevat expand/collapse, scorebadges en hints naar “volgende match”.
  - `MatchDetailsPanel` schuift contextueel in, toont streams, sponsors, hashtags en spelers en sluit met Escape/backdrop.

- **Volledig admin-portaal (`/admin`)**
  - Onboarding header met tellingen (teams, brackets, rondes) en snelkoppeling terug naar de publieke bracket.
  - Toernooi-info: pas serie, titel en beschrijving aan.
  - Bracket settings: single/double elimination, primaire/secundaire/background kleuren via `ColorPickerField`.
  - **Supabase Database Sync**: maak tournaments aan, laad bestaande tournaments, of schakel tussen lokaal (localStorage) en Supabase-opslag. Alle wijzigingen worden automatisch gesynct wanneer een tournament actief is.
  - **Lokale logo opslag**: upload team logo's en branding logo's direct vanuit de browser. Bestanden worden opgeslagen als data URLs (base64) in de Zustand store en localStorage. Ondersteunt JPEG, PNG, GIF, WebP, SVG (max 5MB). Je kunt ook gewoon een URL invoeren.
  - Teambeheer: zoeken/filteren, dubbele naamdetectie, spelersoverzicht, modals voor CRUD-acties en matchgeschiedenis per team.
  - Matchbeheer: kies bracket/ronde/match, valideer dat teams niet dubbel voorkomen, stel scores, winnaars en metadata (tijd, court, beschrijving, prizeInfo, schedule notes) in.
  - Consistente UX via custom form helpers (`Field`, `TextAreaField`, `SelectField`, ...).

- **State management via Zustand + persist + Supabase sync**
  - Centrale store (`app/store/bracketStore.ts`) bewaart teams, brackets, settings, geselecteerde match en view state.
  - Persist middleware slaat state lokaal op (`localStorage`), `useSyncExternalStore` voorkomt hydration flash.
  - **Automatische Supabase sync**: wanneer `tournamentId` is ingesteld, worden alle wijzigingen (teams, matches, settings) automatisch naar Supabase gesynct.
  - Acties zoals `setWinner` pushen winnaars automatisch door naar volgende rondes en syncen naar Supabase:

    ```ts
    setWinner: (matchId, winnerIndex) => {
      const { brackets } = get();
      // ...zoek match...
      const winner = match?.teams[winnerIndex];
      if (!winner) return;
      const updatedBrackets = brackets.map((bracket, bIdx) => {
        if (bIdx !== foundBracketIndex) return bracket;
        const updatedRounds = bracket.rounds.map((round, roundIdx) => {
          if (roundIdx !== matchRoundIndex) return round;
          return {
            ...round,
            matches: round.matches.map((m, mIdx) =>
              mIdx === matchIndex ? { ...m, winnerIndex } : m
            ),
          };
        });
        // ...bubble winnaar naar volgende ronde...
        return { ...bracket, rounds: updatedRounds };
      });
      set({ brackets: updatedBrackets });
    },
    ```

- **Automatische bracketgeneratie (`app/utils/bracketGenerator.ts`)**
  - Ondersteunt single- en eenvoudige double-elimination.
  - Vult byes aan tot een macht van twee, genereert standaard `MatchDetails` (streams, hashtags, sponsors) en distribueert starttijden/courts.

- **Volledige Supabase-integratie**
  - Persistente database opslag voor tournaments, teams, brackets, matches en details.
  - Automatische synchronisatie: alle wijzigingen worden real-time gesynct naar Supabase wanneer een tournament actief is.
  - Service-laag: `app/services/` bevat volledige CRUD-operaties voor tournaments, teams, brackets en matches.
  - Admin-interface: maak nieuwe tournaments aan, laad bestaande tournaments, of schakel tussen lokaal en Supabase-opslag.
  - Database schema: `supabase-schema.sql` bevat het complete schema met RLS policies.
  - Transformers: `app/utils/supabaseTransformers.ts` converteert tussen app types en Supabase database types.

---

## Tech stack

- Next.js 16 (App Router) + React 19
- TypeScript 5 (strict)
- Tailwind CSS 4 via `@tailwindcss/postcss`
- Zustand 5 (`persist` + `useSyncExternalStore`)
- Framer Motion 12
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Utilities: `canvas-confetti`, `color-contrast-checker`, `html-to-image`, `jspdf`

---

## Projectstructuur

```
app/
  layout.tsx             # App Router rootlayout
  globals.css            # Tailwind v4 + custom styles
  favicon.ico
  page.tsx               # Publieke bracket experience
  admin/page.tsx         # Volledige admin console + Supabase management
  components/
    BracketContainer.tsx
    BracketOverview.tsx
    MatchCard.tsx
    MatchDetailsPanel.tsx
    TeamSlot.tsx
  services/              # Supabase service laag
    bracketService.ts    # Bracket CRUD operaties
    matchService.ts      # Match CRUD operaties
    storageService.ts    # Lokale file opslag (data URLs)
    supabaseSync.ts      # Store synchronisatie helpers
    teamService.ts       # Team CRUD operaties
    tournamentService.ts # Tournament CRUD operaties
  store/
    bracketStore.ts      # Zustand store + persist + Supabase sync
  types/
    bracket.ts           # Core type definities
  utils/
    bracketGenerator.ts  # Bracket generator + defaults
    colorUtils.ts        # Kleurhelpers & contrast checks
    supabaseTransformers.ts # Type transformers App ↔ Supabase
lib/
  supabase/
    client.ts            # Browser client helper
    server.ts            # SSR client helper
supabase/
  migrations/            # Database migrations (optioneel)
supabase-schema.sql      # Volledig database schema voor Supabase
public/
  ...                    # Assets / placeholders voor branding
eslint.config.mjs
next.config.ts
postcss.config.mjs
tsconfig.json
package.json
```

---

## Benodigdheden

- Node.js 20 LTS (of hoger compatibel met Next.js 16)
- npm 10+
- Een Supabase-project voor persistente database opslag (aanbevolen, maar optioneel - app werkt ook lokaal)
- Moderne browser met `localStorage` support (voor lokale state backup)

---

## Quick start

```bash
git clone https://github.com/thijnopperman/bracket-concept-thijn-rosh.git
cd bracket-concept-thijn-rosh
npm install
npm run dev
```

Open `http://localhost:3000/` voor de publieke bracket en `http://localhost:3000/admin` voor beheer.

**Supabase setup (optioneel maar aanbevolen):**
1. Maak een `.env.local` met de Supabase-variabelen (zie [Environment & configuratie](#environment--configuratie)).
2. Open Supabase dashboard en voer `supabase-schema.sql` uit in de SQL Editor om alle database tabellen aan te maken.
3. Ga naar `/admin` en klik op "Nieuw Tournament Aanmaken" om Supabase sync te activeren.
4. Vanaf dat moment worden alle wijzigingen automatisch opgeslagen in Supabase.
5. Logo's worden altijd lokaal opgeslagen (data URLs in localStorage), ongeacht of Supabase is geconfigureerd.

> Tailwind v4 loopt via PostCSS; er is geen aparte `tailwind.config.js` nodig.

---

## Beschikbare scripts

| Command        | Beschrijving                                                   |
|----------------|----------------------------------------------------------------|
| `npm run dev`  | Start Next.js dev-server (localhost:3000).                     |
| `npm run build`| Productiebuild + TypeScript checks.                            |
| `npm run start`| Start de gecompileerde productieversie.                        |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript rules).             |

---

## Publieke & admin flow

1. Start de dev-server (`npm run dev`).
2. Publieke pagina (`/`):
   - Wissel tussen live/completed/scheduled/draws.
   - Gebruik hover/focus om detailpanelen te openen.
3. Admin (`/admin`):
   - **Supabase setup**: maak een nieuw tournament aan of laad een bestaand tournament via ID.
   - Maak teams aan (upload logo's of gebruik URL's, spelers, socials) - wordt automatisch naar Supabase gesynct als tournament actief is.
   - Logo's worden lokaal opgeslagen als data URLs (base64) in localStorage.
   - Kies bracket/ronde/match, wijs teams toe, stel scores en metadata in.
   - Markeer winnaars en zie ze automatisch doorstromen (wordt gesynct naar Supabase).
   - Pas kleuren en toernooi-info aan om direct live feedback te zien (wordt gesynct naar Supabase).
4. State wordt automatisch opgeslagen:
   - **Lokaal**: altijd in `localStorage` (inclusief logo's als data URLs).
   - **Supabase**: automatisch wanneer een tournament actief is (via `tournamentId`). Logo's worden als data URLs opgeslagen in de database.

---

## Architectuur en state

- UI-componenten zijn opgesplitst per functie (`BracketContainer`, `MatchCard`, `MatchDetailsPanel`, `TeamSlot`).
- `bracketStore` bewaakt alle business logica: bracketstructuur, matchvalidaties, kleurthema's en view state.
- `bracketGenerator` bouwt standaard data op basis van teams en settings.
- **Supabase service laag**: volledige CRUD-operaties via `app/services/`:
  - `tournamentService.ts`: tournament instellingen
  - `teamService.ts`: teams en spelers
  - `matchService.ts`: matches en match details
  - `bracketService.ts`: bracket structuur
  - `storageService.ts`: converteert bestanden naar data URLs (base64) voor lokale opslag
  - `supabaseSync.ts`: synchronisatie helpers tussen store en Supabase
- **Automatische sync**: wanneer `tournamentId` is ingesteld, worden alle store-acties automatisch naar Supabase gesynct.
- **Dual storage**: state wordt zowel lokaal (`localStorage`) als in Supabase opgeslagen voor robuustheid. Logo's worden altijd lokaal opgeslagen als data URLs.

---

## Environment & configuratie

Plaats de volgende variables in `.env.local` (en hostingplatform):

| Variabele                       | Beschrijving                           |
|---------------------------------|----------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`      | Basis-URL van je Supabase-project.     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key voor Supabase clients. |

**Database setup:**
1. Maak een nieuw Supabase project op [supabase.com](https://supabase.com).
2. Ga naar SQL Editor en kopieer de inhoud van `supabase-schema.sql`.
3. Voer het SQL-script uit om alle tabellen, indexes en RLS policies aan te maken.
4. Kopieer je project URL en anon key naar `.env.local`.

> **Let op**: De app werkt ook zonder Supabase (alleen lokaal via localStorage). Supabase is optioneel maar aanbevolen voor productie gebruik.

Zodra een variabele ontbreekt, werken de Supabase-functies niet maar crasht de app niet. Je kunt gewoon lokaal werken.

---

## Kwaliteitscontrole

- ESLint 9 (`npm run lint`) draait met Next.js core-web-vitals en TypeScript rules.
- `npm run build` voert automatisch TypeScript checks uit.
- Gebruik `npm run lint -- --fix` om formattering/kleine issues te herstellen.

> Let op: binnen sandbox-omgevingen kan `npm run lint` extra permissies vereisen omdat ESLint modules zoals `path-key` moet openen.

---

## Deployment

1. Zorg dat `.env`-variabelen ook in je hostingplatform staan.
2. Draai `npm run build` lokaal om te valideren dat alles compileert.
3. Deploy naar Vercel (aanbevolen) of elke Node-platform die Next.js 16 ondersteunt.
4. Start productie met `npm run start`. Zowel `/` als `/admin` worden statisch geprerend en hydrateren daarna.

---

## Known limitations & roadmap

- **Opslag**: Data wordt zowel lokaal (`localStorage`) als in Supabase opgeslagen. Supabase sync is alleen actief wanneer een `tournamentId` is ingesteld via de admin interface.
- **Logo opslag**: Logo's worden opgeslagen als data URLs (base64) in localStorage en Supabase. Dit betekent dat ze ongeveer 33% groter zijn dan het originele bestand. Bij veel/grote logo's kan localStorage vol raken (meestal ~5-10MB limiet). Voor productie met veel teams zou je kunnen overwegen om weer naar Supabase Storage of een andere oplossing te gaan.
- Double elimination is een vereenvoudigde losers-bracket, niet 1:1 met officiële circuits.
- Geen auth/ACL: `/admin` is voor demo-doeleinden publiek. In productie zou je authenticatie moeten toevoegen.
- Geen productiescreenshots of assets meegeleverd; voeg eigen branding toe voor showcases.
- Supabase sync is optioneel: de app werkt volledig standalone met localStorage als Supabase niet is geconfigureerd.

---

## Submission checklist

- [ ] `.env.local` bevat geldige Supabase keys (optioneel - app werkt ook zonder).
- [ ] `npm install` + `npm run build` draaien zonder fouten.
- [ ] `npm run lint` is uitgevoerd (lokaal, buiten sandbox indien nodig).
- [ ] Minimaal één teams- en bracketconfiguratie getest in `/admin`.
- [ ] Supabase database schema is aangemaakt (als je Supabase gebruikt) - voer `supabase-schema.sql` uit.
- [ ] Supabase sync is getest: maak een tournament aan en controleer of data wordt opgeslagen.
- [ ] Logo upload is getest: upload een logo en controleer dat deze wordt opgeslagen en getoond.
- [ ] Documentatie (dit bestand) is up-to-date en meegestuurd.
- [ ] Optionele screenshots of demo-video toegevoegd aan `public/` of je inleverplatform.

---

## Contributie

1. Fork & clone.
2. `npm install && npm run lint`.
3. Voeg features/tests toe; documenteer wijzigingen in deze README.
4. Open een pull request met context, screenshots en testresultaten.

---

## Licentie

Er is geen licentiebestand opgenomen; ga uit van “All rights reserved” tenzij anders overeengekomen met de auteur.
