'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  BracketSettings,
  BracketState,
  Team,
  Match,
  Round,
  BracketType,
} from '@/app/types/bracket';
import { generateBracket } from '@/app/utils/bracketGenerator';

const defaultSettings: BracketSettings = {
  bracketType: 'single-elimination',
  numTeams: 8,
  primaryColor: '#10b981', // emerald-500
  secondaryColor: '#3b82f6', // blue-500
  backgroundColor: '#0f172a', // slate-900
  bracketStyle: 'modern',
  theme: 'sporty',
  animationSpeed: 'normal',
  darkMode: true,
  enableSounds: false,
  enableConfetti: true,
};

interface BracketStore extends BracketState {
  setSettings: (settings: Partial<BracketSettings>) => void;
  setWinner: (matchId: string, winnerIndex: number) => void;
  setTeamScore: (matchId: string, teamIndex: number, score: number) => void;
  initializeBracket: (teams: Team[]) => void;
  resetBracket: () => void;
  addTeam: (team: Team) => void;
  removeTeam: (teamId: string) => void;
  updateTeam: (teamId: string, updates: Partial<Team>) => void;
}

const generateInitialTeams = (count: number): Team[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `team-${i + 1}`,
    name: `Team ${String.fromCharCode(65 + i)}`,
    score: undefined,
  }));
};

export const useBracketStore = create<BracketStore>()(
  persist(
    (set, get) => {
      const initialTeams = generateInitialTeams(defaultSettings.numTeams);
      const initialBracket = generateBracket(
        initialTeams,
        defaultSettings.bracketType
      );

      return {
        rounds: initialBracket,
        teams: initialTeams,
        settings: defaultSettings,
        setSettings: (newSettings) => {
          const currentSettings = get().settings;
          const updatedSettings = { ...currentSettings, ...newSettings };
          
          // If numTeams or bracketType changed, regenerate bracket
          if (
            newSettings.numTeams !== undefined ||
            newSettings.bracketType !== undefined
          ) {
            const teams = get().teams;
            const numTeams = newSettings.numTeams ?? currentSettings.numTeams;
            const bracketType = newSettings.bracketType ?? currentSettings.bracketType;
            
            // Adjust teams if needed
            let updatedTeams = teams;
            if (newSettings.numTeams !== undefined && newSettings.numTeams !== teams.length) {
              if (newSettings.numTeams > teams.length) {
                // Add new teams
                const newTeams = generateInitialTeams(newSettings.numTeams - teams.length);
                updatedTeams = [...teams, ...newTeams.map((t, i) => ({
                  ...t,
                  id: `team-${teams.length + i + 1}`,
                  name: `Team ${String.fromCharCode(65 + teams.length + i)}`,
                }))];
              } else {
                // Remove teams
                updatedTeams = teams.slice(0, newSettings.numTeams);
              }
            }
            
            const newBracket = generateBracket(updatedTeams, bracketType);
            set({
              settings: updatedSettings,
              teams: updatedTeams,
              rounds: newBracket,
            });
          } else {
            set({ settings: updatedSettings });
          }
        },
        setWinner: (matchId, winnerIndex) => {
          const { rounds } = get();
          
          // Find the match and its round
          let matchRoundIndex = -1;
          let matchIndex = -1;
          let match: Match | null = null;
          
          for (let i = 0; i < rounds.length; i++) {
            const idx = rounds[i].matches.findIndex(m => m.id === matchId);
            if (idx !== -1) {
              matchRoundIndex = i;
              matchIndex = idx;
              match = rounds[i].matches[idx];
              break;
            }
          }
          
          if (!match || matchRoundIndex === -1) return;
          
          const winner = match.teams[winnerIndex];
          if (!winner) return;
          
          // Update the match with winner
          const updatedRounds = rounds.map((round, roundIdx) => {
            if (roundIdx === matchRoundIndex) {
              return {
                ...round,
                matches: round.matches.map((m, mIdx) => {
                  if (mIdx === matchIndex) {
                    return { ...m, winnerIndex };
                  }
                  return m;
                }),
              };
            }
            return round;
          });
          
          // Propagate winner to next round if exists
          if (matchRoundIndex < updatedRounds.length - 1) {
            const nextRound = updatedRounds[matchRoundIndex + 1];
            const nextMatchIndex = Math.floor(matchIndex / 2);
            const slotIndex = matchIndex % 2;
            
            if (nextRound && nextRound.matches[nextMatchIndex]) {
              const finalRounds = updatedRounds.map((round, roundIdx) => {
                if (roundIdx === matchRoundIndex + 1) {
                  return {
                    ...round,
                    matches: round.matches.map((m, mIdx) => {
                      if (mIdx === nextMatchIndex) {
                        const newTeams: [Team | null, Team | null] = [...m.teams];
                        newTeams[slotIndex] = { ...winner, score: undefined };
                        return { ...m, teams: newTeams };
                      }
                      return m;
                    }),
                  };
                }
                return round;
              });
              
              set({ rounds: finalRounds });
              return;
            }
          }
          
          set({ rounds: updatedRounds });
        },
        setTeamScore: (matchId, teamIndex, score) => {
          const { rounds } = get();
          const newRounds = rounds.map((round) => ({
            ...round,
            matches: round.matches.map((match) => {
              if (match.id === matchId) {
                const newTeams: [Team | null, Team | null] = [...match.teams];
                if (newTeams[teamIndex]) {
                  newTeams[teamIndex] = {
                    ...newTeams[teamIndex]!,
                    score,
                  };
                }
                return { ...match, teams: newTeams };
              }
              return match;
            }),
          }));
          set({ rounds: newRounds });
        },
        initializeBracket: (teams) => {
          const { settings } = get();
          const bracket = generateBracket(teams, settings.bracketType);
          set({ teams, rounds: bracket });
        },
        resetBracket: () => {
          const { settings } = get();
          const teams = generateInitialTeams(settings.numTeams);
          const bracket = generateBracket(teams, settings.bracketType);
          set({ teams, rounds: bracket });
        },
        addTeam: (team) => {
          const { teams } = get();
          set({ teams: [...teams, team] });
        },
        removeTeam: (teamId) => {
          const { teams } = get();
          set({ teams: teams.filter((t) => t.id !== teamId) });
        },
        updateTeam: (teamId, updates) => {
          const { teams } = get();
          set({
            teams: teams.map((t) => (t.id === teamId ? { ...t, ...updates } : t)),
          });
        },
      };
    },
    {
      name: 'bracket-storage',
    }
  )
);


