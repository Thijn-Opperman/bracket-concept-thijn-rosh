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
  ViewMode,
} from '@/app/types/bracket';
import { generateBracket } from '@/app/utils/bracketGenerator';
import * as supabaseSync from '@/app/services/supabaseSync';

const defaultSettings: BracketSettings = {
  bracketType: 'single-elimination',
  numTeams: 8,
  primaryColor: '#482CFF', // helder paars/blauw
  secondaryColor: '#420AB2', // donker paars/blauw
  backgroundColor: '#111827', // donkere achtergrond
  bracketStyle: 'modern',
  theme: 'sporty',
  tournamentSeries: 'Grand Arena Series',
  tournamentTitle: 'Ultimate Bracket Showdown',
  tournamentDescription: 'Winner takes all. Eén misstap en je ligt eruit.',
};

interface BracketStore extends BracketState {
  setSettings: (settings: Partial<BracketSettings>) => void;
  setWinner: (matchId: string, winnerIndex: number) => void;
  setTeamScore: (matchId: string, teamIndex: number, score: number) => void;
  setMatchTeam: (matchId: string, teamIndex: number, teamId: string | null) => void;
  initializeBracket: (teams: Team[]) => Promise<void>;
  resetBracket: () => Promise<void>;
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
  toggleShowHistory: () => void;
  setViewMode: (mode: ViewMode) => void;
  // Supabase functions
  setTournamentId: (tournamentId: string | null) => void;
  loadFromSupabase: (tournamentId: string) => Promise<boolean>;
  createTournamentInSupabase: () => Promise<string | null>;
  syncToSupabase: () => Promise<void>;
}

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
      // Start with empty teams array - users must add teams manually
      const initialTeams: Team[] = [];
      const initialBrackets = initialTeams.length > 0 
        ? generateBracket(initialTeams, defaultSettings.bracketType)
        : [];

      return {
        brackets: initialBrackets,
        activeBracketId: initialBrackets[0]?.id ?? null,
        teams: initialTeams,
        settings: defaultSettings,
        selectedMatchId: null,
        showHistory: false,
        viewMode: 'live' as ViewMode,
        isAdminMode: false,
        tournamentId: null,
        isSyncing: false,
        setSettings: async (newSettings) => {
          const currentSettings = get().settings;
          const updatedSettings = { ...currentSettings, ...newSettings };
          const { tournamentId } = get();
          
          // If bracketType changed, regenerate bracket with existing teams
          if (newSettings.bracketType !== undefined) {
            const teams = get().teams;
            const bracketType = newSettings.bracketType ?? currentSettings.bracketType;
            
            // Only generate bracket if there are teams
            const newBrackets = teams.length > 0 
              ? generateBracket(teams, bracketType)
              : [];
            
            set({
              settings: updatedSettings,
              brackets: newBrackets,
              activeBracketId: newBrackets[0]?.id ?? null,
              selectedMatchId: null,
            });

            // Sync to Supabase if tournamentId exists
            if (tournamentId && teams.length > 0) {
              try {
                await supabaseSync.syncSettingsToSupabase(tournamentId, updatedSettings);
                if (newBrackets.length > 0) {
                  await supabaseSync.generateAndSyncBracketsToSupabase(
                    tournamentId,
                    teams,
                    bracketType
                  );
                }
              } catch (error) {
                console.error('Error syncing settings to Supabase:', error);
              }
            }
          } else {
            set({ settings: updatedSettings });
            
            // Sync to Supabase if tournamentId exists
            if (tournamentId) {
              try {
                await supabaseSync.syncSettingsToSupabase(tournamentId, updatedSettings);
              } catch (error) {
                console.error('Error syncing settings to Supabase:', error);
              }
            }
          }
        },
        setWinner: async (matchId, winnerIndex) => {
          const { tournamentId } = get();
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

          // Sync to Supabase if tournamentId exists
          if (tournamentId) {
            try {
              // Sync the current match
              const updatedMatch = updatedBrackets[foundBracketIndex]?.rounds[matchRoundIndex]?.matches[matchIndex];
              if (updatedMatch) {
                await supabaseSync.syncMatchToSupabase(matchId, {
                  teamAId: updatedMatch.teams[0]?.id || null,
                  teamBId: updatedMatch.teams[1]?.id || null,
                  teamAScore: updatedMatch.teams[0]?.score,
                  teamBScore: updatedMatch.teams[1]?.score,
                  winnerIndex: updatedMatch.winnerIndex,
                });
              }

              // Also sync the next match if winner was propagated
              if (matchRoundIndex < updatedBrackets[foundBracketIndex]?.rounds.length - 1) {
                const nextRound = updatedBrackets[foundBracketIndex]?.rounds[matchRoundIndex + 1];
                const nextMatchIndex = Math.floor(matchIndex / 2);
                const nextMatch = nextRound?.matches[nextMatchIndex];
                if (nextMatch) {
                  await supabaseSync.syncMatchToSupabase(nextMatch.id, {
                    teamAId: nextMatch.teams[0]?.id || null,
                    teamBId: nextMatch.teams[1]?.id || null,
                    teamAScore: nextMatch.teams[0]?.score,
                    teamBScore: nextMatch.teams[1]?.score,
                    winnerIndex: nextMatch.winnerIndex,
                  });
                }
              }
            } catch (error) {
              console.error('Error syncing winner to Supabase:', error);
            }
          }
        },
        setTeamScore: async (matchId, teamIndex, score) => {
          const { tournamentId } = get();
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

          // Sync to Supabase if tournamentId exists
          if (tournamentId) {
            try {
              const match = get().getMatchById(matchId);
              if (match) {
                await supabaseSync.syncMatchToSupabase(matchId, {
                  teamAId: match.teams[0]?.id || null,
                  teamBId: match.teams[1]?.id || null,
                  teamAScore: match.teams[0]?.score,
                  teamBScore: match.teams[1]?.score,
                });
              }
            } catch (error) {
              console.error('Error syncing match to Supabase:', error);
            }
          }
        },
        setMatchTeam: async (matchId, teamIndex, teamId) => {
          const { tournamentId } = get();
          const { brackets, teams } = get();
          const teamToAssign = teamId ? teams.find((t) => t.id === teamId) ?? null : null;
          
          const updatedBrackets = brackets.map((bracket) => ({
            ...bracket,
            rounds: bracket.rounds.map((round) => ({
              ...round,
              matches: round.matches.map((match) => {
                if (match.id === matchId) {
                  const newTeams: [Team | null, Team | null] = [...match.teams];
                  // Preserve score if team already exists in slot
                  const existingScore = newTeams[teamIndex]?.score;
                  newTeams[teamIndex] = teamToAssign
                    ? { ...teamToAssign, score: existingScore }
                    : null;
                  // Clear winner if team is removed
                  const updatedWinnerIndex =
                    match.winnerIndex === teamIndex && !teamToAssign
                      ? undefined
                      : match.winnerIndex;
                  return { ...match, teams: newTeams, winnerIndex: updatedWinnerIndex };
                }
                return match;
              }),
            })),
          }));
          set({ brackets: updatedBrackets });

          // Sync to Supabase if tournamentId exists
          if (tournamentId) {
            try {
              const match = get().getMatchById(matchId);
              if (match) {
                await supabaseSync.syncMatchToSupabase(matchId, {
                  teamAId: match.teams[0]?.id || null,
                  teamBId: match.teams[1]?.id || null,
                  teamAScore: match.teams[0]?.score,
                  teamBScore: match.teams[1]?.score,
                  winnerIndex: match.winnerIndex,
                });
              }
            } catch (error) {
              console.error('Error syncing match to Supabase:', error);
            }
          }
        },
        initializeBracket: async (teams) => {
          const { tournamentId, settings } = get();
          const brackets = generateBracket(teams, settings.bracketType);
          set({ 
            teams, 
            brackets, 
            activeBracketId: brackets[0]?.id ?? null,
            selectedMatchId: null 
          });

          // Sync to Supabase if tournamentId exists
          if (tournamentId && teams.length > 0) {
            try {
              // Sync teams first
              for (const team of teams) {
                await supabaseSync.syncTeamToSupabase(tournamentId, team, true);
              }
              // Then sync brackets
              await supabaseSync.generateAndSyncBracketsToSupabase(
                tournamentId,
                teams,
                settings.bracketType
              );
            } catch (error) {
              console.error('Error syncing initialized bracket to Supabase:', error);
            }
          }
        },
        resetBracket: async () => {
          const { tournamentId, settings, teams } = get();
          // Reset bracket with existing teams (don't generate new teams)
          const brackets = teams.length > 0 
            ? generateBracket(teams, settings.bracketType)
            : [];
          set({ 
            brackets, 
            activeBracketId: brackets[0]?.id ?? null,
            selectedMatchId: null 
          });

          // Sync to Supabase if tournamentId exists
          if (tournamentId && teams.length > 0) {
            try {
              await supabaseSync.generateAndSyncBracketsToSupabase(
                tournamentId,
                teams,
                settings.bracketType
              );
            } catch (error) {
              console.error('Error syncing reset bracket to Supabase:', error);
            }
          }
        },
        addTeam: async (team) => {
          const { tournamentId } = get();
          set((state) => {
            const updatedTeams = [...state.teams, team];
            const updatedSettings = {
              ...state.settings,
              numTeams: updatedTeams.length,
            };
            // Only generate bracket if there are teams
            const newBrackets = updatedTeams.length > 0
              ? generateBracket(updatedTeams, updatedSettings.bracketType)
              : [];
            return {
              teams: updatedTeams,
              settings: updatedSettings,
              brackets: newBrackets,
              activeBracketId: newBrackets[0]?.id ?? null,
              selectedMatchId: null,
            };
          });

          // Sync to Supabase if tournamentId exists
          if (tournamentId) {
            try {
              console.log('Syncing team to Supabase...', { teamId: team.id, tournamentId });
              const generatedTeamId = await supabaseSync.syncTeamToSupabase(tournamentId, team, true);
              console.log('✅ Team synced successfully with ID:', generatedTeamId);
              
              // Update team ID if Supabase generated a new one
              if (generatedTeamId && generatedTeamId !== team.id) {
                const { teams } = get();
                const updatedTeams = teams.map(t => 
                  t.id === team.id ? { ...t, id: generatedTeamId } : t
                );
                set({ teams: updatedTeams });
                console.log('✅ Team ID updated to:', generatedTeamId);
              }
              
              const { teams: currentTeams, settings } = get();
              if (currentTeams.length > 0) {
                console.log('Generating brackets...');
                await supabaseSync.generateAndSyncBracketsToSupabase(
                  tournamentId,
                  currentTeams,
                  settings.bracketType
                );
                console.log('✅ Brackets generated');
              }
            } catch (error: unknown) {
              console.error('❌ Error syncing team to Supabase:', error);
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              const errorStack = error instanceof Error ? error.stack : undefined;
              console.error('Error details:', errorMessage, errorStack);
              // Show error to user
              alert(`Error syncing team to Supabase: ${errorMessage}. Check console for details.`);
            }
          } else {
            console.warn('⚠️ No tournamentId set, team not synced to Supabase');
          }
        },
        removeTeam: async (teamId) => {
          const { tournamentId } = get();
          set((state) => {
            const updatedTeams = state.teams.filter((t) => t.id !== teamId);
            const updatedSettings = {
              ...state.settings,
              numTeams: updatedTeams.length,
            };
            // Only generate bracket if there are teams
            const newBrackets = updatedTeams.length > 0
              ? generateBracket(updatedTeams, updatedSettings.bracketType)
              : [];
            return {
              teams: updatedTeams,
              settings: updatedSettings,
              brackets: newBrackets,
              activeBracketId: newBrackets[0]?.id ?? null,
              selectedMatchId: null,
            };
          });

          // Sync to Supabase if tournamentId exists
          if (tournamentId) {
            try {
              await supabaseSync.deleteTeamFromSupabase(teamId);
              const { teams, settings } = get();
              if (teams.length > 0) {
                await supabaseSync.generateAndSyncBracketsToSupabase(
                  tournamentId,
                  teams,
                  settings.bracketType
                );
              }
            } catch (error) {
              console.error('Error deleting team from Supabase:', error);
            }
          }
        },
        updateTeam: async (teamId, updates) => {
          const { tournamentId } = get();
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

          // Sync to Supabase if tournamentId exists
          if (tournamentId) {
            try {
              const updatedTeam = get().teams.find((t) => t.id === teamId);
              if (updatedTeam) {
                // Sync the team
                await supabaseSync.syncTeamToSupabase(tournamentId, updatedTeam, false);
                
                // Also sync all matches that contain this team (team data might have changed)
                const { brackets: currentBrackets } = get();
                for (const bracket of currentBrackets) {
                  for (const round of bracket.rounds) {
                    for (const match of round.matches) {
                      if (match.teams[0]?.id === teamId || match.teams[1]?.id === teamId) {
                        await supabaseSync.syncMatchToSupabase(match.id, {
                          teamAId: match.teams[0]?.id || null,
                          teamBId: match.teams[1]?.id || null,
                          teamAScore: match.teams[0]?.score,
                          teamBScore: match.teams[1]?.score,
                          winnerIndex: match.winnerIndex,
                        });
                      }
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error syncing team to Supabase:', error);
            }
          }
        },
        updateMatchDetails: async (matchId, updates) => {
          const { tournamentId } = get();
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

          // Sync to Supabase if tournamentId exists
          if (tournamentId) {
            try {
              const match = get().getMatchById(matchId);
              if (match) {
                await supabaseSync.syncMatchToSupabase(matchId, {
                  startTime: match.startTime,
                  court: match.court,
                  details: match.details,
                });
              }
            } catch (error) {
              console.error('Error syncing match details to Supabase:', error);
            }
          }
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
        toggleShowHistory: () => {
          set((state) => ({ showHistory: !state.showHistory }));
        },
        setViewMode: (mode) => {
          set({ viewMode: mode });
        },
        // Supabase functions
        setTournamentId: (tournamentId) => {
          set({ tournamentId });
        },
        loadFromSupabase: async (tournamentId) => {
          set({ isSyncing: true });
          try {
            const data = await supabaseSync.loadTournamentFromSupabase(tournamentId);
            if (data) {
              set({
                settings: data.settings,
                teams: data.teams,
                brackets: data.brackets,
                activeBracketId: data.brackets[0]?.id ?? null,
                tournamentId,
                isSyncing: false,
              });
              return true;
            }
            set({ isSyncing: false });
            return false;
          } catch (error) {
            console.error('Error loading from Supabase:', error);
            set({ isSyncing: false });
            return false;
          }
        },
        createTournamentInSupabase: async () => {
          const { settings } = get();
          set({ isSyncing: true });
          try {
            const tournamentId = await supabaseSync.createTournamentInSupabase(settings);
            if (tournamentId) {
              set({ tournamentId, isSyncing: false });
              return tournamentId;
            }
            set({ isSyncing: false });
            return null;
          } catch (error) {
            console.error('Error creating tournament in Supabase:', error);
            set({ isSyncing: false });
            return null;
          }
        },
        syncToSupabase: async () => {
          const { tournamentId, settings, teams, brackets } = get();
          if (!tournamentId) return;

          set({ isSyncing: true });
          try {
            // Sync settings
            await supabaseSync.syncSettingsToSupabase(tournamentId, settings);

            // Sync teams (simplified - in production you'd want to track which teams changed)
            // For now, we'll just ensure all teams exist
            for (const team of teams) {
              await supabaseSync.syncTeamToSupabase(tournamentId, team, false);
            }

            // Sync matches (simplified - in production you'd track changes)
            // This is a basic implementation - you might want to optimize this
            for (const bracket of brackets) {
              for (const round of bracket.rounds) {
                for (const match of round.matches) {
                  await supabaseSync.syncMatchToSupabase(match.id, {
                    teamAId: match.teams[0]?.id || null,
                    teamBId: match.teams[1]?.id || null,
                    teamAScore: match.teams[0]?.score,
                    teamBScore: match.teams[1]?.score,
                    winnerIndex: match.winnerIndex,
                    startTime: match.startTime,
                    court: match.court,
                    details: match.details,
                  });
                }
              }
            }

            set({ isSyncing: false });
          } catch (error) {
            console.error('Error syncing to Supabase:', error);
            set({ isSyncing: false });
          }
        },
      };
    },
    {
      name: 'bracket-storage',
    }
  )
);
