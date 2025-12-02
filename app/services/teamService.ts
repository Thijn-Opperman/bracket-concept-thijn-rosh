'use client';

/**
 * Service voor team operaties met Supabase
 */

import { createClient } from '@/lib/supabase/client';
import type { Team, Player } from '@/app/types/bracket';
import {
  transformTeamToSupabase,
  transformPlayerToSupabase,
  transformSupabaseToTeam,
  transformSupabaseToPlayer,
  type SupabaseTeam,
  type SupabasePlayer,
} from '@/app/utils/supabaseTransformers';

function getSupabase() {
  return createClient();
}

export async function createTeam(team: Team, tournamentId: string): Promise<string> {
  // First verify tournament exists
  const supabaseClient = getSupabase();
  const { data: tournament, error: tournamentError } = await supabaseClient
    .from('tournaments')
    .select('id')
    .eq('id', tournamentId)
    .single();

  if (tournamentError || !tournament) {
    console.error('❌ Tournament not found in database!');
    console.error('Looking for tournament ID:', tournamentId);
    console.error('Error:', tournamentError);
    
    // Try to list all tournaments to help debug
    const supabaseDebug = getSupabase();
    const { data: allTournaments } = await supabaseDebug
      .from('tournaments')
      .select('id, name');
    console.error('Available tournaments in database:', allTournaments);
    
    throw new Error(`Tournament with ID ${tournamentId} does not exist in database. ${tournamentError?.message || 'Not found'}. Available tournaments: ${allTournaments?.length || 0}`);
  }
  
  console.log('✅ Tournament verified:', tournament.id);

  const teamData = transformTeamToSupabase(team, tournamentId);
  
  // Remove id field - let Supabase generate UUID
  // We'll update the team with the generated ID after creation
  const { id, ...dataToInsert } = teamData;
  
  console.log('Creating team with data:', dataToInsert);
  console.log('Tournament ID (verified):', tournamentId);
  console.log('Original team ID (will be replaced):', id);
  
  const supabaseInsert = getSupabase();
  const { data, error } = await supabaseInsert
    .from('teams')
    .insert(dataToInsert)
    .select('id')
    .single();

  if (error) {
    console.error('Error creating team:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    const errorMessage = error.message || error.details || error.hint || JSON.stringify(error);
    throw new Error(`Failed to create team: ${errorMessage} (Code: ${error.code || 'unknown'})`);
  }

  if (!data || !data.id) {
    throw new Error('Team created but no ID returned');
  }

  // Create players if they exist
  if (team.players && team.players.length > 0) {
    const playersData = team.players.map((player) =>
      transformPlayerToSupabase(player, data.id)
    );
    
    const supabasePlayers = getSupabase();
    const { error: playersError } = await supabasePlayers
      .from('players')
      .insert(playersData);

    if (playersError) {
      console.error('Error creating players:', playersError);
      // Don't throw - team was created successfully
    }
  }

  return data.id;
}

export async function getTeam(teamId: string): Promise<Team | null> {
  const supabase = getSupabase();
  const { data: teamData, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single();

  if (teamError) {
    if (teamError.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching team:', teamError);
    throw new Error(`Failed to fetch team: ${teamError.message}`);
  }

  // Fetch players
  const supabaseClient = getSupabase();
  const { data: playersData } = await supabaseClient
    .from('players')
    .select('*')
    .eq('team_id', teamId);

  return transformSupabaseToTeam(
    teamData as SupabaseTeam,
    (playersData || []) as SupabasePlayer[]
  );
}

export async function getTeamsByTournament(tournamentId: string): Promise<Team[]> {
  const supabase = getSupabase();
  const { data: teamsData, error: teamsError } = await supabase
    .from('teams')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('name');

  if (teamsError) {
    console.error('Error fetching teams:', teamsError);
    throw new Error(`Failed to fetch teams: ${teamsError.message}`);
  }

  if (!teamsData || teamsData.length === 0) {
    return [];
  }

  // Fetch all players for all teams
  const teamIds = teamsData.map((t) => t.id);
  const supabaseClient = getSupabase();
  const { data: playersData } = await supabaseClient
    .from('players')
    .select('*')
    .in('team_id', teamIds);

  // Group players by team_id
  const playersByTeam = new Map<string, SupabasePlayer[]>();
  (playersData || []).forEach((player) => {
    const teamId = (player as SupabasePlayer).team_id;
    if (!playersByTeam.has(teamId)) {
      playersByTeam.set(teamId, []);
    }
    playersByTeam.get(teamId)!.push(player as SupabasePlayer);
  });

  // Transform teams with their players
  return teamsData.map((team) =>
    transformSupabaseToTeam(
      team as SupabaseTeam,
      playersByTeam.get(team.id) || []
    )
  );
}

export async function updateTeam(teamId: string, updates: Partial<Team>): Promise<void> {
  // First get tournament_id from database
  const supabaseFetch = getSupabase();
  const { data: existingTeam, error: fetchError } = await supabaseFetch
    .from('teams')
    .select('tournament_id')
    .eq('id', teamId)
    .single();

  if (fetchError || !existingTeam) {
    console.error('Error fetching team for update:', fetchError);
    throw new Error(`Team not found: ${fetchError?.message || 'Not found'}`);
  }

  // Get current team to merge updates
  const currentTeam = await getTeam(teamId);
  if (!currentTeam) {
    throw new Error('Team not found');
  }

  const updatedTeam = { ...currentTeam, ...updates };

  // Update team - use tournament_id from database
  const teamData = transformTeamToSupabase(updatedTeam, existingTeam.tournament_id);
  
  // Remove id from update data (we're updating by id, not setting it)
  const { id, ...dataToUpdate } = teamData;

  console.log('Updating team:', { teamId, tournamentId: existingTeam.tournament_id });
  console.log('Update data:', dataToUpdate);

  const supabaseUpdate = getSupabase();
  const { error: teamError } = await supabaseUpdate
    .from('teams')
    .update({
      ...dataToUpdate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', teamId);

  if (teamError) {
    console.error('Error updating team:', teamError);
    console.error('Error details:', JSON.stringify(teamError, null, 2));
    const errorMessage = teamError.message || teamError.details || teamError.hint || JSON.stringify(teamError);
    throw new Error(`Failed to update team: ${errorMessage} (Code: ${teamError.code || 'unknown'})`);
  }
  
  console.log('✅ Team updated successfully');

  // Update players if provided
  if (updates.players !== undefined) {
    // Delete existing players
    const supabasePlayers = getSupabase();
    await supabasePlayers.from('players').delete().eq('team_id', teamId);

    // Insert new players
    if (updates.players.length > 0) {
      const playersData = updates.players.map((player) =>
        transformPlayerToSupabase(player, teamId)
      );
      
      const { error: playersError } = await supabasePlayers
        .from('players')
        .insert(playersData);

      if (playersError) {
        console.error('Error updating players:', playersError);
      }
    }
  }
}

export async function deleteTeam(teamId: string): Promise<void> {
  // Players will be deleted automatically due to CASCADE
  const supabaseDelete = getSupabase();
  const { error } = await supabaseDelete
    .from('teams')
    .delete()
    .eq('id', teamId);

  if (error) {
    console.error('Error deleting team:', error);
    throw new Error(`Failed to delete team: ${error.message}`);
  }
}






