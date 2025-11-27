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
  - Hero-statistieken, ronde-overzichten en statusbolletjes (grijs = afgerond, rood = live, groen = komend).
  - View-modi: live, completed, scheduled en draws (`BracketOverview` toont de volledige tree).
  - Framer Motion-animaties, hover states en focusmodus per ronde.
  - `MatchCard` bevat expand/collapse, scorebadges en hints naar “volgende match”.
  - `MatchDetailsPanel` schuift contextueel in, toont streams, sponsors, hashtags en spelers en sluit met Escape/backdrop.

- **Volledig admin-portaal (`/admin`)**
  - Onboarding header met tellingen (teams, brackets, rondes) en snelkoppeling terug naar de publieke bracket.
  - Toernooi-info: pas serie, titel en beschrijving aan.
  - Bracket settings: single/double elimination, primaire/secundaire/background kleuren via `ColorPickerField`.
  - Teambeheer: zoeken/filteren, dubbele naamdetectie, spelersoverzicht, modals voor CRUD-acties en matchgeschiedenis per team.
  - Matchbeheer: kies bracket/ronde/match, valideer dat teams niet dubbel voorkomen, stel scores, winnaars en metadata (tijd, court, beschrijving, prizeInfo, schedule notes) in.
  - Consistente UX via custom form helpers (`Field`, `TextAreaField`, `SelectField`, ...).

- **State management via Zustand + persist**
  - Centrale store (`app/store/bracketStore.ts`) bewaart teams, brackets, settings, geselecteerde match en view state.
  - Persist middleware slaat state lokaal op (`localStorage`), `useSyncExternalStore` voorkomt hydration flash.
  - Acties zoals `setWinner` pushen winnaars automatisch door naar volgende rondes:

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

- **Supabase-ready**
  - `lib/supabase/client.ts` en `lib/supabase/server.ts` maken SSR/browser-clients aan en valideren env vars vroeg zodat builds niet stil falen.

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
  page.tsx               # Publieke bracket-landing
  admin/page.tsx         # Admin console + helper componenten
  components/            # Bracket UI (MatchCard, TeamSlot, etc.)
  store/bracketStore.ts  # Zustand store + logica
  types/bracket.ts       # Type definities
  utils/                 # Bracket generator & kleurhelpers
lib/supabase/            # SSR en browser Supabase-clients
public/                  # Placeholder assets
eslint.config.mjs        # Next + TypeScript rules
next.config.ts           # App Router config
postcss.config.mjs       # Tailwind v4 pipeline
tsconfig.json            # Strict compiler & path aliases
```

---

## Benodigdheden

- Node.js 20 LTS (of hoger compatibel met Next.js 16)
- npm 10+
- Een Supabase-project als je echte persistente data wilt (optioneel)
- Moderne browser met `localStorage` support (voor admin state)

---

## Quick start

```bash
git clone https://github.com/thijnopperman/bracket-concept-thijn-rosh.git
cd bracket-concept-thijn-rosh
npm install
npm run dev
```

Open `http://localhost:3000/` voor de publieke bracket en `http://localhost:3000/admin` voor beheer.

Maak (optioneel) een `.env.local` met de Supabase-variabelen uit de [Environment & configuratie](#environment--configuratie) sectie.

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
   - Maak teams aan (logo, spelers, socials).
   - Kies bracket/ronde/match, wijs teams toe, stel scores en metadata in.
   - Markeer winnaars en zie ze automatisch doorstromen.
   - Pas kleuren en toernooi-info aan om direct live feedback te zien.
4. State wordt automatisch opgeslagen in `localStorage` zodat refreshes veilig zijn.

---

## Architectuur en state

- UI-componenten zijn opgesplitst per functie (`BracketContainer`, `MatchCard`, `MatchDetailsPanel`, `TeamSlot`).
- `bracketStore` bewaakt alle business logica: bracketstructuur, matchvalidaties, kleurthema's en view state.
- `bracketGenerator` bouwt standaard data op basis van teams en settings.
- Supabase-clients zijn voorbereid voor toekomstige persistente opslag; momenteel draait alles client-side.

---

## Environment & configuratie

Plaats de volgende variables in `.env.local` (en hostingplatform):

| Variabele                       | Beschrijving                           |
|---------------------------------|----------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`      | Basis-URL van je Supabase-project.     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key voor Supabase clients. |

Zodra een variabele ontbreekt, gooien de helpers een duidelijke fout tijdens build of runtime.

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

- Client-side persistence only: alle data leeft in `localStorage`.
- Double elimination is een vereenvoudigde losers-bracket, niet 1:1 met officiële circuits.
- Geen auth/ACL: `/admin` is voor demo-doeleinden publiek.
- Geen productiescreenshots of assets meegeleverd; voeg eigen branding toe voor showcases.

---

## Submission checklist

- [ ] `.env.local` bevat geldige Supabase keys (of mock waarden).
- [ ] `npm install` + `npm run build` draaien zonder fouten.
- [ ] `npm run lint` is uitgevoerd (lokaal, buiten sandbox indien nodig).
- [ ] Minimaal één teams- en bracketconfiguratie getest in `/admin`.
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
