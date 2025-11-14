import type {
  Team,
  Round,
  Match,
  BracketType,
  MatchDetails,
  BracketGroup,
} from '@/app/types/bracket';

export function generateBracket(teams: Team[], type: BracketType): BracketGroup[] {
  switch (type) {
    case 'single-elimination':
      return [{
        id: 'main',
        name: 'Hoofdbracket',
        rounds: generateSingleElimination(teams),
      }];
    case 'double-elimination':
      return generateDoubleElimination(teams);
    case 'round-robin':
      return [{
        id: 'main',
        name: 'Hoofdbracket',
        rounds: generateRoundRobin(teams),
      }];
    default:
      return [{
        id: 'main',
        name: 'Hoofdbracket',
        rounds: generateSingleElimination(teams),
      }];
  }
}

function generateSingleElimination(teams: Team[]): Round[] {
  const rounds: Round[] = [];
  let currentTeams: (Team | null)[] = [...teams];
  let roundIndex = 0;
  
  // Calculate number of rounds needed
  const numRounds = Math.ceil(Math.log2(teams.length));
  
  // Pad teams to power of 2 if needed
  const paddedLength = Math.pow(2, numRounds);
  while (currentTeams.length < paddedLength) {
    currentTeams.push({
      id: `bye-${currentTeams.length}`,
      name: 'Bye',
      score: undefined,
    });
  }
  
  // Generate all rounds
  while (currentTeams.length > 1) {
    const matches: Match[] = [];
    const roundName = getRoundName(currentTeams.length, rounds.length);
    
    for (let i = 0; i < currentTeams.length; i += 2) {
      const startTime = getMatchStartTime(roundIndex, i / 2);
      const court = getCourtName(roundIndex, i / 2);
      matches.push({
        id: `r${roundIndex}-m${i / 2}`,
        roundIndex,
        matchIndex: i / 2,
        teams: [currentTeams[i], currentTeams[i + 1] || null],
        startTime,
        court,
        details: createDefaultMatchDetails({
          matchId: `r${roundIndex}-m${i / 2}`,
          roundName,
          startTime,
          court,
          teamA: currentTeams[i],
          teamB: currentTeams[i + 1] || null,
        }),
      });
    }
    
    rounds.push({
      name: roundName,
      matches,
    });
    
    // Prepare teams for next round (will be null initially, filled when winners are selected)
    const nextRoundTeamCount = Math.ceil(currentTeams.length / 2);
    currentTeams = Array.from({ length: nextRoundTeamCount }, () => null);
    roundIndex++;
  }
  
  return rounds;
}

function generateDoubleElimination(teams: Team[]): BracketGroup[] {
  // Generate winners bracket
  const winnersRounds = generateSingleElimination(teams);
  
  // Generate losers bracket
  // Losers bracket has a different structure - teams that lose go here
  const numRounds = Math.ceil(Math.log2(teams.length));
  const losersRounds: Round[] = [];
  
  // Losers bracket typically has 2*(n-1) rounds where n is number of teams
  // Simplified version: create rounds for losers
  for (let i = 0; i < numRounds * 2 - 1; i++) {
    const roundName = i === 0 ? 'Losers Ronde 1' : 
                     i === numRounds * 2 - 2 ? 'Losers Finale' :
                     `Losers Ronde ${i + 1}`;
    
    // Calculate number of matches for this losers round
    // This is simplified - real double elimination is more complex
    const matchesPerRound = Math.max(1, Math.floor(teams.length / Math.pow(2, Math.floor(i / 2) + 1)));
    
    const matches: Match[] = [];
    for (let j = 0; j < matchesPerRound; j++) {
      const startTime = getMatchStartTime(i, j);
      const court = getCourtName(i, j);
      matches.push({
        id: `losers-r${i}-m${j}`,
        roundIndex: i,
        matchIndex: j,
        teams: [null, null], // Will be filled when teams lose
        startTime,
        court,
        details: createDefaultMatchDetails({
          matchId: `losers-r${i}-m${j}`,
          roundName,
          startTime,
          court,
          teamA: null,
          teamB: null,
        }),
      });
    }
    
    if (matches.length > 0) {
      losersRounds.push({
        name: roundName,
        matches,
      });
    }
  }
  
  return [
    {
      id: 'winners',
      name: 'Winners Bracket',
      rounds: winnersRounds,
    },
    {
      id: 'losers',
      name: 'Losers Bracket',
      rounds: losersRounds,
    },
  ];
}

function generateRoundRobin(teams: Team[]): Round[] {
  const rounds: Round[] = [];
  const numTeams = teams.length;
  
  // Round-robin: each team plays every other team once
  // For even number of teams: (n-1) rounds, n/2 matches per round
  // For odd number of teams: n rounds, (n-1)/2 matches per round
  
  const numRounds = numTeams % 2 === 0 ? numTeams - 1 : numTeams;
  const matchesPerRound = Math.floor(numTeams / 2);
  
  // Generate all possible pairings
  const allPairings: [Team, Team][] = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      allPairings.push([teams[i], teams[j]]);
    }
  }
  
  // Distribute pairings across rounds (simplified algorithm)
  for (let round = 0; round < numRounds; round++) {
    const matches: Match[] = [];
    const usedTeams = new Set<string>();
    
    for (let match = 0; match < matchesPerRound; match++) {
      const pairing = allPairings.find(
        ([a, b]) => !usedTeams.has(a.id) && !usedTeams.has(b.id)
      );
      
      if (pairing) {
        const startTime = getMatchStartTime(round, match);
        const court = getCourtName(round, match);
        matches.push({
          id: `rr-r${round}-m${match}`,
          roundIndex: round,
          matchIndex: match,
          teams: pairing,
          startTime,
          court,
          details: createDefaultMatchDetails({
            matchId: `rr-r${round}-m${match}`,
            roundName: `Ronde ${round + 1}`,
            startTime,
            court,
            teamA: pairing[0],
            teamB: pairing[1],
          }),
        });
        usedTeams.add(pairing[0].id);
        usedTeams.add(pairing[1].id);
      }
    }
    
    if (matches.length > 0) {
      rounds.push({
        name: `Ronde ${round + 1}`,
        matches,
      });
    }
  }
  
  return rounds;
}

function getRoundName(numTeams: number, roundIndex: number): string {
  if (numTeams === 2) return 'Finale';
  if (numTeams === 4) return 'Halve Finales';
  if (numTeams === 8) return 'Kwartfinales';
  if (numTeams === 16) return 'Achtste Finales';
  if (numTeams === 32) return 'Zestiende Finales';
  
  // Generic names
  const roundNames = [
    'Finale',
    'Halve Finales',
    'Kwartfinales',
    'Achtste Finales',
    'Zestiende Finales',
  ];
  
  return roundNames[roundIndex] || `Ronde ${roundIndex + 1}`;
}

function getMatchStartTime(roundIndex: number, matchIndex: number): string {
  const baseHour = 13; // 13:00 tournament start
  const minutesPerMatch = 45;
  const totalMinutes = roundIndex * 120 + matchIndex * minutesPerMatch;
  const hour = Math.floor(baseHour + totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

function getCourtName(roundIndex: number, matchIndex: number): string {
  const courts = ['Main Arena', 'Side Stage', 'Velocity Hall', 'Legends Dome'];
  const index = (roundIndex + matchIndex) % courts.length;
  return courts[index];
}

function createDefaultMatchDetails({
  matchId,
  roundName,
  startTime,
  court,
  teamA,
  teamB,
}: {
  matchId: string;
  roundName: string;
  startTime?: string;
  court?: string;
  teamA: Team | null;
  teamB: Team | null;
}): MatchDetails {
  const teamAName = formatTeamName(teamA);
  const teamBName = formatTeamName(teamB);
  const matchup = `${teamAName} vs ${teamBName}`;

  const baseHashtags = ['#BracketShowdown', '#RoadToGlory'];
  const customTags = [teamAName, teamBName]
    .filter((name) => name !== 'TBD')
    .map((name) => `#${slugify(name)}`);
  const hashtags = Array.from(new Set([...baseHashtags, ...customTags]));

  const highlight = teamA?.countryCode || teamB?.countryCode ? '#f97316' : undefined;

  return {
    title: roundName,
    subtitle: matchup,
    description: `Live coverage van ${matchup}. Volg de spanning vanuit ${court ?? 'de arena'} om ${startTime ?? 'onbekende tijd'}.`,
    featuredPlayers: createFeaturedPlayers(teamA, teamB),
    streams: createDefaultStreams(teamAName, teamBName),
    hashtags,
    prizeInfo: 'Winnaar gaat door naar de volgende ronde en komt dichter bij de hoofdtrofee.',
    scheduleNote: startTime ? `Check in 15 minuten voor ${startTime} voor pre-game analyses.` : undefined,
    highlightColor: highlight,
    sponsors: [
      { name: 'Pulse Energy Drink', url: 'https://pulsegaming.com' },
      { name: 'StreamZone', url: 'https://streamzone.gg' },
    ],
  };
}

function formatTeamName(team: Team | null): string {
  if (!team) return 'TBD';
  if (team.name.toLowerCase() === 'bye') return 'Automatische winst';
  return team.name;
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/\s+/g, '')
    .slice(0, 15);
}

function createDefaultStreams(teamAName: string, teamBName: string) {
  const toHandle = (name: string) =>
    slugify(name).toLowerCase() || 'mainbroadcast';

  const handles = [teamAName, teamBName]
    .filter((name) => name !== 'TBD' && name !== 'Automatische winst')
    .map((name) => toHandle(name));

  const primaryHandle = handles[0] ?? 'mainstage';
  const secondaryHandle = handles[1] ?? 'altstream';

  return [
    {
      platform: 'twitch' as const,
      url: `https://twitch.tv/${primaryHandle}`,
      label: 'Live op Twitch',
    },
    {
      platform: 'youtube' as const,
      url: `https://youtube.com/@${secondaryHandle}`,
      label: 'Replay op YouTube',
    },
    {
      platform: 'x' as const,
      url: `https://x.com/${primaryHandle}`,
      label: 'Live updates op X',
    },
  ];
}

function createFeaturedPlayers(teamA: Team | null, teamB: Team | null): string[] | undefined {
  const players: string[] = [];

  if (teamA) {
    players.push(`${teamA.name} • Captain`);
  }
  if (teamB) {
    players.push(`${teamB.name} • MVP`);
  }

  return players.length > 0 ? players : undefined;
}

