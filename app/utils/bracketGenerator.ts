import type { Team, Round, Match, BracketType } from '@/app/types/bracket';

export function generateBracket(teams: Team[], type: BracketType): Round[] {
  switch (type) {
    case 'single-elimination':
      return generateSingleElimination(teams);
    case 'double-elimination':
      return generateDoubleElimination(teams);
    case 'round-robin':
      return generateRoundRobin(teams);
    default:
      return generateSingleElimination(teams);
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
      matches.push({
        id: `r${roundIndex}-m${i / 2}`,
        roundIndex,
        matchIndex: i / 2,
        teams: [currentTeams[i], currentTeams[i + 1] || null],
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

function generateDoubleElimination(teams: Team[]): Round[] {
  // Start with single elimination
  const winnersBracket = generateSingleElimination(teams);
  
  // Create losers bracket (simplified - full double elimination is complex)
  const losersRounds: Round[] = [];
  
  // For now, return winners bracket with a note that losers bracket would be added
  // Full double elimination implementation would require tracking losers from each round
  return winnersBracket;
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
        matches.push({
          id: `rr-r${round}-m${match}`,
          roundIndex: round,
          matchIndex: match,
          teams: pairing,
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

