export type Team = {
  id: string;
  name: string;
  logo?: string;
  score?: number;
};

export type Match = {
  id: string;
  roundIndex: number;
  matchIndex: number;
  teams: [Team | null, Team | null];
  winnerIndex?: number;
  startTime?: string;
  court?: string;
};

export type Round = {
  name: string;
  matches: Match[];
};

export type BracketType = 'single-elimination' | 'double-elimination' | 'round-robin';

export type BracketStyle = 'classic' | 'modern' | 'playful';

export type Theme = 'retro' | 'futuristic' | 'sporty';

export type AnimationSpeed = 'slow' | 'normal' | 'fast';

export type BracketSettings = {
  bracketType: BracketType;
  numTeams: number;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  bracketStyle: BracketStyle;
  theme: Theme;
  animationSpeed: AnimationSpeed;
  darkMode: boolean;
  enableSounds: boolean;
  enableConfetti: boolean;
};

export type BracketState = {
  rounds: Round[];
  teams: Team[];
  settings: BracketSettings;
};

