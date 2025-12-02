-- ============================================
-- SUPABASE DATABASE SCHEMA VOOR BRACKET APP
-- ============================================
-- Kopieer dit hele bestand en plak het in de Supabase SQL Editor
-- Klik daarna op "Run" om alle tabellen aan te maken

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABEL 1: tournaments (Toernooi instellingen)
-- ============================================
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  bracket_type TEXT NOT NULL CHECK (bracket_type IN ('single-elimination', 'double-elimination')),
  primary_color TEXT NOT NULL DEFAULT '#482CFF',
  secondary_color TEXT NOT NULL DEFAULT '#420AB2',
  background_color TEXT NOT NULL DEFAULT '#111827',
  bracket_style TEXT NOT NULL DEFAULT 'modern' CHECK (bracket_style IN ('classic', 'modern', 'playful')),
  theme TEXT NOT NULL DEFAULT 'sporty' CHECK (theme IN ('retro', 'futuristic', 'sporty')),
  tournament_series TEXT,
  tournament_title TEXT,
  tournament_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABEL 2: teams (Teams)
-- ============================================
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo TEXT,
  country_code TEXT,
  coach TEXT,
  founded TEXT,
  motto TEXT,
  twitch_link TEXT,
  branding_logo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, name) -- Voorkom dubbele teamnamen per toernooi
);

-- ============================================
-- TABEL 3: players (Spelers)
-- ============================================
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  number TEXT,
  country_code TEXT,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABEL 4: brackets (Bracket groepen)
-- ============================================
CREATE TABLE brackets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Bijv. "Hoofdbracket", "Winners Bracket", "Losers Bracket"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABEL 5: rounds (Rondes)
-- ============================================
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bracket_id UUID NOT NULL REFERENCES brackets(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Bijv. "Finale", "Halve Finales"
  round_index INTEGER NOT NULL, -- Volgorde van de ronde (0 = eerste ronde)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bracket_id, round_index) -- Voorkom dubbele round_index per bracket
);

-- ============================================
-- TABEL 6: matches (Wedstrijden)
-- ============================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  match_index INTEGER NOT NULL, -- Positie binnen de ronde
  team_a_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  team_b_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  team_a_score INTEGER,
  team_b_score INTEGER,
  winner_index INTEGER CHECK (winner_index IN (0, 1)), -- 0 = team_a, 1 = team_b
  start_time TEXT, -- Bijv. "14:30"
  court TEXT, -- Bijv. "Main Arena"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(round_id, match_index) -- Voorkom dubbele match_index per ronde
);

-- ============================================
-- TABEL 7: match_details (Wedstrijd details)
-- ============================================
CREATE TABLE match_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  featured_players TEXT[], -- Array van speler namen
  hashtags TEXT[], -- Array van hashtags
  prize_info TEXT,
  schedule_note TEXT,
  highlight_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABEL 8: match_media_links (Stream links)
-- ============================================
CREATE TABLE match_media_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitch', 'youtube', 'facebook', 'tiktok', 'instagram', 'x', 'website')),
  url TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABEL 9: match_sponsors (Sponsors per match)
-- ============================================
CREATE TABLE match_sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT,
  logo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES voor betere performance
-- ============================================
CREATE INDEX idx_teams_tournament_id ON teams(tournament_id);
CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_brackets_tournament_id ON brackets(tournament_id);
CREATE INDEX idx_rounds_bracket_id ON rounds(bracket_id);
CREATE INDEX idx_matches_round_id ON matches(round_id);
CREATE INDEX idx_matches_team_a_id ON matches(team_a_id);
CREATE INDEX idx_matches_team_b_id ON matches(team_b_id);
CREATE INDEX idx_match_details_match_id ON match_details(match_id);
CREATE INDEX idx_match_media_links_match_id ON match_media_links(match_id);
CREATE INDEX idx_match_sponsors_match_id ON match_sponsors(match_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) Policies
-- ============================================
-- Voor nu: alle data is publiek leesbaar en schrijfbaar
-- Later kun je dit aanpassen voor authenticatie

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_media_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_sponsors ENABLE ROW LEVEL SECURITY;

-- Policy: Iedereen kan alles lezen
CREATE POLICY "Allow public read access" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON teams FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON brackets FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON rounds FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON matches FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON match_details FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON match_media_links FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON match_sponsors FOR SELECT USING (true);

-- Policy: Iedereen kan alles schrijven (voor nu)
CREATE POLICY "Allow public insert access" ON tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access" ON teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access" ON brackets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access" ON rounds FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access" ON match_details FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access" ON match_media_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access" ON match_sponsors FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON tournaments FOR UPDATE USING (true);
CREATE POLICY "Allow public update access" ON teams FOR UPDATE USING (true);
CREATE POLICY "Allow public update access" ON players FOR UPDATE USING (true);
CREATE POLICY "Allow public update access" ON brackets FOR UPDATE USING (true);
CREATE POLICY "Allow public update access" ON rounds FOR UPDATE USING (true);
CREATE POLICY "Allow public update access" ON matches FOR UPDATE USING (true);
CREATE POLICY "Allow public update access" ON match_details FOR UPDATE USING (true);
CREATE POLICY "Allow public update access" ON match_media_links FOR UPDATE USING (true);
CREATE POLICY "Allow public update access" ON match_sponsors FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access" ON tournaments FOR DELETE USING (true);
CREATE POLICY "Allow public delete access" ON teams FOR DELETE USING (true);
CREATE POLICY "Allow public delete access" ON players FOR DELETE USING (true);
CREATE POLICY "Allow public delete access" ON brackets FOR DELETE USING (true);
CREATE POLICY "Allow public delete access" ON rounds FOR DELETE USING (true);
CREATE POLICY "Allow public delete access" ON matches FOR DELETE USING (true);
CREATE POLICY "Allow public delete access" ON match_details FOR DELETE USING (true);
CREATE POLICY "Allow public delete access" ON match_media_links FOR DELETE USING (true);
CREATE POLICY "Allow public delete access" ON match_sponsors FOR DELETE USING (true);


