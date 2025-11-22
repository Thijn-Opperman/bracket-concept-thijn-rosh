export type Player = {
  id: string;
  name: string;
  role?: string;
  number?: string;
  countryCode?: string;
  avatar?: string;
};

export type Team = {
  id: string;
  name: string;
  logo?: string;
  score?: number;
  countryCode?: string;
  coach?: string;
  founded?: string;
  motto?: string;
  players?: Player[];
  twitchLink?: string;
  brandingLogo?: string;
};

export type MatchMediaLink = {
  platform:
    | 'twitch'
    | 'youtube'
    | 'facebook'
    | 'tiktok'
    | 'instagram'
    | 'x'
    | 'website';
  url: string;
  label?: string;
};

export type MatchSponsor = {
  name: string;
  url?: string;
  logo?: string;
};

export type MatchDetails = {
  title: string;
  subtitle?: string;
  description?: string;
  featuredPlayers?: string[];
  streams?: MatchMediaLink[];
  hashtags?: string[];
  prizeInfo?: string;
  scheduleNote?: string;
  highlightColor?: string;
  sponsors?: MatchSponsor[];
};

export type Match = {
  id: string;
  roundIndex: number;
  matchIndex: number;
  teams: [Team | null, Team | null];
  winnerIndex?: number;
  startTime?: string;
  court?: string;
  details?: MatchDetails;
};

export type Round = {
  name: string;
  matches: Match[];
};

export type BracketType = 'single-elimination' | 'double-elimination' | 'round-robin';

export type BracketStyle = 'classic' | 'modern' | 'playful';

export type Theme = 'retro' | 'futuristic' | 'sporty';

export type BracketSettings = {
  bracketType: BracketType;
  numTeams: number;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  bracketStyle: BracketStyle;
  theme: Theme;
};

export type BracketGroup = {
  id: string;
  name: string;
  rounds: Round[];
};

export type BracketState = {
  brackets: BracketGroup[];
  activeBracketId: string | null;
  teams: Team[];
  settings: BracketSettings;
  selectedMatchId: string | null;
  isAdminMode: boolean;
  showHistory: boolean;
};

