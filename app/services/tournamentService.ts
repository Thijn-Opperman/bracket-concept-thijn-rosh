'use client';

/**
 * Service voor tournament operaties met Supabase
 */

import { createClient } from '@/lib/supabase/client';
import type { BracketSettings } from '@/app/types/bracket';
import {
  transformSettingsToTournament,
  transformTournamentToSettings,
  type SupabaseTournament,
} from '@/app/utils/supabaseTransformers';

function getSupabase() {
  return createClient();
}

export async function createTournament(settings: BracketSettings): Promise<string> {
  const tournamentData = transformSettingsToTournament(settings);
  
  // Remove empty id field if it exists (we want database to generate it)
  const { id, ...dataToInsert } = tournamentData;
  
  console.log('Creating tournament with data:', dataToInsert);
  
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tournaments')
    .insert(dataToInsert)
    .select('id')
    .single();

  if (error) {
    console.error('Error creating tournament:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    const errorMessage = error.message || error.details || error.hint || JSON.stringify(error);
    throw new Error(`Failed to create tournament: ${errorMessage} (Code: ${error.code || 'unknown'})`);
  }

  if (!data || !data.id) {
    throw new Error('Tournament created but no ID returned');
  }

  return data.id;
}

export async function getTournament(tournamentId: string): Promise<BracketSettings | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', tournamentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Error fetching tournament:', error);
    throw new Error(`Failed to fetch tournament: ${error.message}`);
  }

  return transformTournamentToSettings(data as SupabaseTournament);
}

export async function updateTournament(
  tournamentId: string,
  settings: Partial<BracketSettings>
): Promise<void> {
  const supabase = getSupabase();
  const currentData = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', tournamentId)
    .single();

  if (currentData.error) {
    throw new Error(`Tournament not found: ${currentData.error.message}`);
  }

  const currentSettings = transformTournamentToSettings(
    currentData.data as SupabaseTournament
  );
  const updatedSettings = { ...currentSettings, ...settings };
  const tournamentData = transformSettingsToTournament(updatedSettings, tournamentId);

  const supabase2 = getSupabase();
  const { error } = await supabase2
    .from('tournaments')
    .update({
      ...tournamentData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tournamentId);

  if (error) {
    console.error('Error updating tournament:', error);
    throw new Error(`Failed to update tournament: ${error.message}`);
  }
}

export async function deleteTournament(tournamentId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('tournaments')
    .delete()
    .eq('id', tournamentId);

  if (error) {
    console.error('Error deleting tournament:', error);
    throw new Error(`Failed to delete tournament: ${error.message}`);
  }
}


