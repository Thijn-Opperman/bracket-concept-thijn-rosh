'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  BracketSettings,
  BracketState,
  Team,
  Match,
  MatchDetails,
  Round,
  BracketType,
  BracketGroup,
} from '@/app/types/bracket';
import { generateBracket } from '@/app/utils/bracketGenerator';

const defaultSettings: BracketSettings = {
  bracketType: 'single-elimination',
  numTeams: 8,
  primaryColor: '#482CFF', // helder paars/blauw
  secondaryColor: '#420AB2', // donker paars/blauw
  backgroundColor: '#111827', // donkere achtergrond
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
  updateMatchDetails: (
    matchId: string,
    updates: {
      startTime?: string;
      court?: string;
      details?: Partial<MatchDetails>;
    }
  ) => void;
  setSelectedMatch: (matchId: string | null) => void;
  getMatchById: (matchId: string) => Match | undefined;
  setActiveBracket: (bracketId: string) => void;
  getActiveBracket: () => BracketGroup | undefined;
  setAdminMode: (value: boolean) => void;
}

const generateInitialTeams = (count: number): Team[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `team-${i + 1}`,
    name: `Team ${String.fromCharCode(65 + i)}`,
    countryCode: ['NL', 'BE', 'DE', 'FR'][i % 4],
    motto: 'Ready to compete',
    score: undefined,
    players: [
      {
        id: `team-${i + 1}-player-1`,
        name: `Captain ${String.fromCharCode(65 + i)}`,
        role: 'Captain',
        countryCode: ['NL', 'BE', 'DE', 'FR'][i % 4],
      },
      {
        id: `team-${i + 1}-player-2`,
        name: `Striker ${String.fromCharCode(65 + i)}`,
        role: 'MVP',
        countryCode: ['NL', 'BE', 'DE', 'FR'][(i + 1) % 4],
      },
    ],
  }));
};

const mergeTeamIntoMatchSlot = (
  slot: Team | null,
  updatedTeam: Team
): Team | null => {
  if (!slot) return slot;
  if (slot.id !== updatedTeam.id) return slot;
  return {
    ...updatedTeam,
    score: slot.score,
  };
};

export const useBracketStore = create<BracketStore>()(
  persist(
    (set, get) => {
      const initialTeams = generateInitialTeams(defaultSettings.numTeams);
      const initialBrackets = generateBracket(
        initialTeams,
        defaultSettings.bracketType
      );

      return {
        brackets: initialBrackets,
        activeBracketId: initialBrackets[0]?.id ?? null,
        teams: initialTeams,
        settings: defaultSettings,
        selectedMatchId: null,
        isAdminMode: false,
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
            
            const newBrackets = generateBracket(updatedTeams, bracketType);
            set({
              settings: updatedSettings,
              teams: updatedTeams,
              brackets: newBrackets,
              activeBracketId: newBrackets[0]?.id ?? null,
              selectedMatchId: null,
            });
          } else {
            set({ settings: updatedSettings });
          }
        },
        setWinner: (matchId, winnerIndex) => {
          const { brackets } = get();
          
          // Find the match in all brackets
          let foundBracketIndex = -1;
          let matchRoundIndex = -1;
          let matchIndex = -1;
          let match: Match | null = null;
          
          for (let bIdx = 0; bIdx < brackets.length; bIdx++) {
            const bracket = brackets[bIdx];
            for (let i = 0; i < bracket.rounds.length; i++) {
              const idx = bracket.rounds[i].matches.findIndex(m => m.id === matchId);
              if (idx !== -1) {
                foundBracketIndex = bIdx;
                matchRoundIndex = i;
                matchIndex = idx;
                match = bracket.rounds[i].matches[idx];
                break;
              }
            }
            if (foundBracketIndex !== -1) break;
          }
          
          if (!match || foundBracketIndex === -1 || matchRoundIndex === -1) return;
          
          const winner = match.teams[winnerIndex];
          if (!winner) return;
          
          // Update the match with winner
          const updatedBrackets = brackets.map((bracket, bIdx) => {
            if (bIdx === foundBracketIndex) {
              const updatedRounds = bracket.rounds.map((round, roundIdx) => {
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
                  return {
                    ...bracket,
                    rounds: updatedRounds.map((round, roundIdx) => {
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
                    }),
                  };
                }
              }
              
              return {
                ...bracket,
                rounds: updatedRounds,
              };
            }
            return bracket;
          });
          
          set({ brackets: updatedBrackets });
        },
        setTeamScore: (matchId, teamIndex, score) => {
          const { brackets } = get();
          const updatedBrackets = brackets.map((bracket) => ({
            ...bracket,
            rounds: bracket.rounds.map((round) => ({
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
            })),
          }));
          set({ brackets: updatedBrackets });
        },
        initializeBracket: (teams) => {
          const { settings } = get();
          const brackets = generateBracket(teams, settings.bracketType);
          set({ 
            teams, 
            brackets, 
            activeBracketId: brackets[0]?.id ?? null,
            selectedMatchId: null 
          });
        },
        resetBracket: () => {
          const { settings } = get();
          const teams = generateInitialTeams(settings.numTeams);
          const brackets = generateBracket(teams, settings.bracketType);
          set({ 
            teams, 
            brackets, 
            activeBracketId: brackets[0]?.id ?? null,
            selectedMatchId: null 
          });
        },
        addTeam: (team) => {
          set((state) => {
            const updatedTeams = [...state.teams, team];
            const updatedSettings = {
              ...state.settings,
              numTeams: updatedTeams.length,
            };
            const newBrackets = generateBracket(
              updatedTeams,
              updatedSettings.bracketType
            );
            return {
              teams: updatedTeams,
              settings: updatedSettings,
              brackets: newBrackets,
              activeBracketId: newBrackets[0]?.id ?? null,
              selectedMatchId: null,
            };
          });
        },
        removeTeam: (teamId) => {
          set((state) => {
            const updatedTeams = state.teams.filter((t) => t.id !== teamId);
            const hasTeams = updatedTeams.length > 0;
            const safeTeams = hasTeams ? updatedTeams : generateInitialTeams(4);
            const updatedSettings = {
              ...state.settings,
              numTeams: hasTeams ? updatedTeams.length : 4,
            };
            const newBrackets = generateBracket(
              safeTeams,
              updatedSettings.bracketType
            );
            return {
              teams: safeTeams,
              settings: updatedSettings,
              brackets: newBrackets,
              activeBracketId: newBrackets[0]?.id ?? null,
              selectedMatchId: null,
            };
          });
        },
        updateTeam: (teamId, updates) => {
          set((state) => {
            const updatedTeams = state.teams.map((team) =>
              team.id === teamId ? { ...team, ...updates } : team
            );
            const latestTeam = updatedTeams.find((team) => team.id === teamId);
            if (!latestTeam) {
              return { teams: updatedTeams };
            }
            const updatedBrackets = state.brackets.map((bracket) => ({
              ...bracket,
              rounds: bracket.rounds.map((round) => ({
                ...round,
                    matches: round.matches.map((match) => ({
                      ...match,
                      teams: [
                        mergeTeamIntoMatchSlot(match.teams[0], latestTeam),
                        mergeTeamIntoMatchSlot(match.teams[1], latestTeam),
                      ] as [Team | null, Team | null],
                    })),
              })),
            }));
            return {
              teams: updatedTeams,
              brackets: updatedBrackets,
            };
          });
        },
        updateMatchDetails: (matchId, updates) => {
          set((state) => ({
            brackets: state.brackets.map((bracket) => ({
              ...bracket,
              rounds: bracket.rounds.map((round) => ({
                ...round,
                matches: round.matches.map((match) => {
                  if (match.id !== matchId) return match;

                  let mergedDetails: MatchDetails | undefined;
                  if (updates.details) {
                    const baseDetails: MatchDetails =
                      match.details ?? {
                        title: round.name || match.id.toUpperCase(),
                      };
                    mergedDetails = {
                      ...baseDetails,
                      ...updates.details,
                    };
                    if (!mergedDetails.title) {
                      mergedDetails.title = baseDetails.title;
                    }
                  }

                  return {
                    ...match,
                    ...(updates.startTime !== undefined && {
                      startTime: updates.startTime,
                    }),
                    ...(updates.court !== undefined && {
                      court: updates.court,
                    }),
                    ...(mergedDetails && {
                      details: mergedDetails,
                    }),
                  };
                }),
              })),
            })),
          }));
        },
        setSelectedMatch: (matchId) => {
          set({ selectedMatchId: matchId });
        },
        getMatchById: (matchId) => {
          const { brackets } = get();
          for (const bracket of brackets) {
            for (const round of bracket.rounds) {
              const found = round.matches.find((match) => match.id === matchId);
              if (found) {
                return found;
              }
            }
          }
          return undefined;
        },
        setActiveBracket: (bracketId) => {
          set({ activeBracketId: bracketId });
        },
        getActiveBracket: () => {
          const { brackets, activeBracketId } = get();
          return brackets.find(b => b.id === activeBracketId);
        },
        setAdminMode: (value) => {
          set({ isAdminMode: value });
        },
      };
    },
    {
      name: 'bracket-storage',
    }
  )
);


