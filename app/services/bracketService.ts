'use client';

/**
 * Service voor bracket operaties met Supabase
 * Dit is de hoofdservice die alles samenvoegt
 */

import { createClient } from '@/lib/supabase/client';
import type { BracketGroup, Round, Match } from '@/app/types/bracket';
import { generateBracket } from '@/app/utils/bracketGenerator';
import { getTeamsByTournament } from './teamService';
import { getMatch } from './matchService';
import {
  buildMatchFromSupabase,
  transformSupabaseToMatchDetails,
  type SupabaseBracket,
  type SupabaseRound,
  type SupabaseMatch,
  type SupabaseMatchDetails,
  type SupabaseMatchMediaLink,
  type SupabaseMatchSponsor,
} from '@/app/utils/supabaseTransformers';

function getSupabase() {
  return createClient();
}

/**
 * Haal volledige bracket structuur op voor een tournament
 */
export async function getBracketsByTournament(
  tournamentId: string
): Promise<BracketGroup[]> {
  // Fetch brackets
  const supabase = getSupabase();
  const { data: bracketsData, error: bracketsError } = await supabase
    .from('brackets')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('name');

  if (bracketsError) {
    console.error('Error fetching brackets:', bracketsError);
    throw new Error(`Failed to fetch brackets: ${bracketsError.message}`);
  }

  if (!bracketsData || bracketsData.length === 0) {
    return [];
  }

  // Fetch all rounds for all brackets
  const bracketIds = bracketsData.map((b) => b.id);
  const supabase2 = getSupabase();
  const { data: roundsData } = await supabase2
    .from('rounds')
    .select('*')
    .in('bracket_id', bracketIds)
    .order('round_index');

  // Fetch all matches for all rounds
  const roundIds = (roundsData || []).map((r) => r.id);
  const supabase3 = getSupabase();
  const { data: matchesData } = await supabase3
    .from('matches')
    .select('*')
    .in('round_id', roundIds)
    .order('match_index');

  // Fetch all match details, media links, and sponsors
  const matchIds = (matchesData || []).map((m) => m.id);
  
  const supabase4 = getSupabase();
  const [detailsData, mediaLinksData, sponsorsData] = await Promise.all([
    matchIds.length > 0
      ? supabase4.from('match_details').select('*').in('match_id', matchIds)
      : { data: [] },
    matchIds.length > 0
      ? supabase4.from('match_media_links').select('*').in('match_id', matchIds)
      : { data: [] },
    matchIds.length > 0
      ? supabase4.from('match_sponsors').select('*').in('match_id', matchIds)
      : { data: [] },
  ]);

  // Fetch all teams
  const teams = await getTeamsByTournament(tournamentId);
  const teamsMap = new Map(teams.map((t) => [t.id, t]));

  // Group data by bracket/round/match
  const roundsByBracket = new Map<string, SupabaseRound[]>();
  (roundsData || []).forEach((round) => {
    const bracketId = (round as SupabaseRound).bracket_id;
    if (!roundsByBracket.has(bracketId)) {
      roundsByBracket.set(bracketId, []);
    }
    roundsByBracket.get(bracketId)!.push(round as SupabaseRound);
  });

  const matchesByRound = new Map<string, SupabaseMatch[]>();
  (matchesData || []).forEach((match) => {
    const roundId = (match as SupabaseMatch).round_id;
    if (!matchesByRound.has(roundId)) {
      matchesByRound.set(roundId, []);
    }
    matchesByRound.get(roundId)!.push(match as SupabaseMatch);
  });

  const detailsByMatch = new Map<string, SupabaseMatchDetails>();
  (detailsData.data || []).forEach((detail) => {
    detailsByMatch.set((detail as SupabaseMatchDetails).match_id, detail as SupabaseMatchDetails);
  });

  const mediaLinksByMatch = new Map<string, SupabaseMatchMediaLink[]>();
  (mediaLinksData.data || []).forEach((link) => {
    const matchId = (link as SupabaseMatchMediaLink).match_id;
    if (!mediaLinksByMatch.has(matchId)) {
      mediaLinksByMatch.set(matchId, []);
    }
    mediaLinksByMatch.get(matchId)!.push(link as SupabaseMatchMediaLink);
  });

  const sponsorsByMatch = new Map<string, SupabaseMatchSponsor[]>();
  (sponsorsData.data || []).forEach((sponsor) => {
    const matchId = (sponsor as SupabaseMatchSponsor).match_id;
    if (!sponsorsByMatch.has(matchId)) {
      sponsorsByMatch.set(matchId, []);
    }
    sponsorsByMatch.get(matchId)!.push(sponsor as SupabaseMatchSponsor);
  });

  // Build bracket structure
  const brackets: BracketGroup[] = bracketsData.map((bracket) => {
    const rounds = (roundsByBracket.get(bracket.id) || [])
      .sort((a, b) => a.round_index - b.round_index)
      .map((round): Round => {
        const matches = (matchesByRound.get(round.id) || [])
          .sort((a, b) => a.match_index - b.match_index)
          .map((match): Match => {
            const teamA = match.team_a_id ? teamsMap.get(match.team_a_id) || null : null;
            const teamB = match.team_b_id ? teamsMap.get(match.team_b_id) || null : null;

            const details = detailsByMatch.get(match.id)
              ? transformSupabaseToMatchDetails(
                  detailsByMatch.get(match.id)!,
                  mediaLinksByMatch.get(match.id) || [],
                  sponsorsByMatch.get(match.id) || []
                )
              : undefined;

            return buildMatchFromSupabase(match, teamA, teamB, details);
          });

        return {
          name: round.name,
          matches,
        };
      });

    return {
      id: bracket.id,
      name: bracket.name,
      rounds,
    };
  });

  return brackets;
}

/**
 * Genereer en sla bracket structuur op in database
 */
export async function generateAndSaveBrackets(
  tournamentId: string,
  teams: Array<{ id: string; name: string }>,
  bracketType: 'single-elimination' | 'double-elimination'
): Promise<BracketGroup[]> {
  // Generate bracket structure using existing generator
  const generatedBrackets = generateBracket(
    teams.map((t) => ({ ...t, score: undefined })),
    bracketType
  );

  // Delete existing brackets for this tournament
  const supabase = getSupabase();
  await supabase.from('brackets').delete().eq('tournament_id', tournamentId);

  // Save brackets to database
  for (const bracket of generatedBrackets) {
    // Create bracket
      const supabase2 = getSupabase();
      const { data: bracketData, error: bracketError } = await supabase2
      .from('brackets')
      .insert({
        tournament_id: tournamentId,
        name: bracket.name,
      })
      .select('id')
      .single();

    if (bracketError) {
      console.error('Error creating bracket:', bracketError);
      continue;
    }

    const bracketId = bracketData.id;

    // Create rounds
    for (let roundIndex = 0; roundIndex < bracket.rounds.length; roundIndex++) {
      const round = bracket.rounds[roundIndex];
      
      const supabase3 = getSupabase();
      const { data: roundData, error: roundError } = await supabase3
        .from('rounds')
        .insert({
          bracket_id: bracketId,
          name: round.name,
          round_index: roundIndex,
        })
        .select('id')
        .single();

      if (roundError) {
        console.error('Error creating round:', roundError);
        continue;
      }

      const roundId = roundData.id;

      // Create matches
      for (let matchIndex = 0; matchIndex < round.matches.length; matchIndex++) {
        const match = round.matches[matchIndex];
        
        const supabase4 = getSupabase();
        const { error: matchError } = await supabase4
          .from('matches')
          .insert({
            round_id: roundId,
            match_index: matchIndex,
            team_a_id: match.teams[0]?.id || null,
            team_b_id: match.teams[1]?.id || null,
            start_time: match.startTime || null,
            court: match.court || null,
          });

        if (matchError) {
          console.error('Error creating match:', matchError);
        }
      }
    }
  }

  // Return the generated brackets (they now have database IDs)
  return await getBracketsByTournament(tournamentId);
}

