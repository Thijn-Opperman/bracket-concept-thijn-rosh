'use client';

/**
 * Service voor match operaties met Supabase
 */

import { createClient } from '@/lib/supabase/client';
import type { Match, MatchDetails } from '@/app/types/bracket';
import {
  buildMatchFromSupabase,
  transformSupabaseToMatchDetails,
  type SupabaseMatch,
  type SupabaseMatchDetails,
  type SupabaseMatchMediaLink,
  type SupabaseMatchSponsor,
} from '@/app/utils/supabaseTransformers';
import { getTeam } from './teamService';

function getSupabase() {
  return createClient();
}

export async function updateMatch(
  matchId: string,
  updates: {
    teamAId?: string | null;
    teamBId?: string | null;
    teamAScore?: number;
    teamBScore?: number;
    winnerIndex?: number;
    startTime?: string;
    court?: string;
  }
): Promise<void> {
  const updateData: Partial<SupabaseMatch> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.teamAId !== undefined) updateData.team_a_id = updates.teamAId;
  if (updates.teamBId !== undefined) updateData.team_b_id = updates.teamBId;
  if (updates.teamAScore !== undefined) updateData.team_a_score = updates.teamAScore;
  if (updates.teamBScore !== undefined) updateData.team_b_score = updates.teamBScore;
  if (updates.winnerIndex !== undefined) updateData.winner_index = updates.winnerIndex;
  if (updates.startTime !== undefined) updateData.start_time = updates.startTime || null;
  if (updates.court !== undefined) updateData.court = updates.court || null;

  const supabase = getSupabase();
  const { error } = await supabase
    .from('matches')
    .update(updateData)
    .eq('id', matchId);

  if (error) {
    console.error('Error updating match:', error);
    throw new Error(`Failed to update match: ${error.message}`);
  }
}

export async function updateMatchDetails(
  matchId: string,
  details: Partial<MatchDetails>
): Promise<void> {
  // Check if match_details already exists
  const supabase = getSupabase();
  const { data: existingDetails } = await supabase
    .from('match_details')
    .select('*')
    .eq('match_id', matchId)
    .single();

  const detailsData: Partial<SupabaseMatchDetails> = {
    match_id: matchId,
    updated_at: new Date().toISOString(),
  };

  if (details.title !== undefined) detailsData.title = details.title;
  if (details.subtitle !== undefined) detailsData.subtitle = details.subtitle || null;
  if (details.description !== undefined) detailsData.description = details.description || null;
  if (details.featuredPlayers !== undefined) detailsData.featured_players = details.featuredPlayers || null;
  if (details.hashtags !== undefined) detailsData.hashtags = details.hashtags || null;
  if (details.prizeInfo !== undefined) detailsData.prize_info = details.prizeInfo || null;
  if (details.scheduleNote !== undefined) detailsData.schedule_note = details.scheduleNote || null;
  if (details.highlightColor !== undefined) detailsData.highlight_color = details.highlightColor || null;

  if (existingDetails) {
    // Update existing
    const supabase2 = getSupabase();
    const { error } = await supabase2
      .from('match_details')
      .update(detailsData)
      .eq('match_id', matchId);

    if (error) {
      console.error('Error updating match details:', error);
      throw new Error(`Failed to update match details: ${error.message}`);
    }
  } else {
    // Create new - title is required
    if (!details.title) {
      throw new Error('Title is required when creating match details');
    }
    detailsData.title = details.title;

    const supabase3 = getSupabase();
    const { error } = await supabase3
      .from('match_details')
      .insert(detailsData);

    if (error) {
      console.error('Error creating match details:', error);
      throw new Error(`Failed to create match details: ${error.message}`);
    }
  }

  // Update media links if provided
  if (details.streams !== undefined) {
    // Delete existing
    const supabase4 = getSupabase();
    await supabase4.from('match_media_links').delete().eq('match_id', matchId);

    // Insert new
    if (details.streams.length > 0) {
      const mediaLinksData = details.streams.map((stream) => ({
        match_id: matchId,
        platform: stream.platform,
        url: stream.url,
        label: stream.label || null,
      }));

      const { error: linksError } = await supabase4
        .from('match_media_links')
        .insert(mediaLinksData);

      if (linksError) {
        console.error('Error updating media links:', linksError);
      }
    }
  }

  // Update sponsors if provided
  if (details.sponsors !== undefined) {
    // Delete existing
    const supabase5 = getSupabase();
    await supabase5.from('match_sponsors').delete().eq('match_id', matchId);

    // Insert new
    if (details.sponsors.length > 0) {
      const sponsorsData = details.sponsors.map((sponsor) => ({
        match_id: matchId,
        name: sponsor.name,
        url: sponsor.url || null,
        logo: sponsor.logo || null,
      }));

      const { error: sponsorsError } = await supabase5
        .from('match_sponsors')
        .insert(sponsorsData);

      if (sponsorsError) {
        console.error('Error updating sponsors:', sponsorsError);
      }
    }
  }
}

export async function getMatch(matchId: string): Promise<Match | null> {
  const supabase = getSupabase();
  const { data: matchData, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (matchError) {
    if (matchError.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching match:', matchError);
    throw new Error(`Failed to fetch match: ${matchError.message}`);
  }

  const match = matchData as SupabaseMatch;

  // Fetch teams
  const teamA = match.team_a_id ? await getTeam(match.team_a_id) : null;
  const teamB = match.team_b_id ? await getTeam(match.team_b_id) : null;

  // Fetch details
  const supabase2 = getSupabase();
  const { data: detailsData } = await supabase2
    .from('match_details')
    .select('*')
    .eq('match_id', matchId)
    .single();

  // Fetch media links
  const supabase3 = getSupabase();
  const { data: mediaLinksData } = await supabase3
    .from('match_media_links')
    .select('*')
    .eq('match_id', matchId);

  // Fetch sponsors
  const supabase4 = getSupabase();
  const { data: sponsorsData } = await supabase4
    .from('match_sponsors')
    .select('*')
    .eq('match_id', matchId);

  const details = detailsData
    ? transformSupabaseToMatchDetails(
        detailsData as SupabaseMatchDetails,
        (mediaLinksData || []) as SupabaseMatchMediaLink[],
        (sponsorsData || []) as SupabaseMatchSponsor[]
      )
    : undefined;

  return buildMatchFromSupabase(match, teamA, teamB, details);
}






