'use client';

/**
 * Helper functies om de store te syncen met Supabase
 */

import * as tournamentService from './tournamentService';
import * as teamService from './teamService';
import * as matchService from './matchService';
import * as bracketService from './bracketService';
import type { BracketSettings, Team, BracketGroup } from '@/app/types/bracket';

/**
 * Laad volledige tournament data uit Supabase
 */
export async function loadTournamentFromSupabase(tournamentId: string): Promise<{
  settings: BracketSettings;
  teams: Team[];
  brackets: BracketGroup[];
} | null> {
  try {
    const [settings, teams, brackets] = await Promise.all([
      tournamentService.getTournament(tournamentId),
      teamService.getTeamsByTournament(tournamentId),
      bracketService.getBracketsByTournament(tournamentId),
    ]);

    if (!settings) {
      return null;
    }

    return {
      settings,
      teams,
      brackets,
    };
  } catch (error) {
    console.error('Error loading tournament from Supabase:', error);
    return null;
  }
}

/**
 * Maak een nieuw tournament aan in Supabase
 */
export async function createTournamentInSupabase(
  settings: BracketSettings
): Promise<string | null> {
  try {
    return await tournamentService.createTournament(settings);
  } catch (error) {
    console.error('Error creating tournament in Supabase:', error);
    return null;
  }
}

/**
 * Sync settings naar Supabase
 */
export async function syncSettingsToSupabase(
  tournamentId: string,
  settings: Partial<BracketSettings>
): Promise<boolean> {
  try {
    await tournamentService.updateTournament(tournamentId, settings);
    return true;
  } catch (error) {
    console.error('Error syncing settings to Supabase:', error);
    return false;
  }
}

/**
 * Sync team naar Supabase
 */
export async function syncTeamToSupabase(
  tournamentId: string,
  team: Team,
  isNew: boolean
): Promise<string | null> {
  try {
    console.log('Syncing team to Supabase:', { teamId: team.id, teamName: team.name, tournamentId, isNew });
    if (isNew) {
      const teamId = await teamService.createTeam(team, tournamentId);
      console.log('✅ Team created in Supabase with ID:', teamId);
      return teamId; // Return the generated ID
    } else {
      await teamService.updateTeam(team.id, team);
      console.log('✅ Team updated in Supabase');
      return team.id;
    }
  } catch (error: unknown) {
    console.error('❌ Error syncing team to Supabase:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error message:', errorMessage);
    console.error('Error stack:', errorStack);
    // Re-throw so we can see the error in the UI
    throw error;
  }
}

/**
 * Verwijder team uit Supabase
 */
export async function deleteTeamFromSupabase(teamId: string): Promise<boolean> {
  try {
    await teamService.deleteTeam(teamId);
    return true;
  } catch (error) {
    console.error('Error deleting team from Supabase:', error);
    return false;
  }
}

/**
 * Sync match naar Supabase
 */
export async function syncMatchToSupabase(
  matchId: string,
  updates: {
    teamAId?: string | null;
    teamBId?: string | null;
    teamAScore?: number;
    teamBScore?: number;
    winnerIndex?: number;
    startTime?: string;
    court?: string;
    details?: Partial<import('@/app/types/bracket').MatchDetails>;
  }
): Promise<boolean> {
  try {
    await matchService.updateMatch(matchId, {
      teamAId: updates.teamAId,
      teamBId: updates.teamBId,
      teamAScore: updates.teamAScore,
      teamBScore: updates.teamBScore,
      winnerIndex: updates.winnerIndex,
      startTime: updates.startTime,
      court: updates.court,
    });

    if (updates.details) {
      await matchService.updateMatchDetails(matchId, updates.details);
    }

    return true;
  } catch (error) {
    console.error('Error syncing match to Supabase:', error);
    return false;
  }
}

/**
 * Genereer en sync brackets naar Supabase
 */
export async function generateAndSyncBracketsToSupabase(
  tournamentId: string,
  teams: Team[],
  bracketType: 'single-elimination' | 'double-elimination'
): Promise<BracketGroup[] | null> {
  try {
    return await bracketService.generateAndSaveBrackets(
      tournamentId,
      teams.map((t) => ({ id: t.id, name: t.name })),
      bracketType
    );
  } catch (error) {
    console.error('Error generating brackets in Supabase:', error);
    return null;
  }
}






