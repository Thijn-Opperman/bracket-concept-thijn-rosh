type Team = {
  name: string;
  score?: number;
};

type Match = {
  id: string;
  teams: [Team, Team];
  start?: string;
  court?: string;
};

type Round = {
  name: string;
  matches: Match[];
};

const rounds: Round[] = [
  {
    name: "Kwartfinales",
    matches: [
      {
        id: "qf-1",
        teams: [
          { name: "Team Alpha", score: 2 },
          { name: "Team Delta", score: 0 },
        ],
        start: "12:00",
        court: "Court 1",
      },
      {
        id: "qf-2",
        teams: [
          { name: "Team Nimbus", score: 3 },
          { name: "Team Echo", score: 1 },
        ],
        start: "12:45",
        court: "Court 2",
      },
      {
        id: "qf-3",
        teams: [
          { name: "Team Zenith", score: 1 },
          { name: "Team Horizon", score: 2 },
        ],
        start: "13:30",
        court: "Court 3",
      },
      {
        id: "qf-4",
        teams: [
          { name: "Team Atlas", score: 0 },
          { name: "Team Nova", score: 2 },
        ],
        start: "14:15",
        court: "Court 4",
      },
    ],
  },
  {
    name: "Halve Finales",
    matches: [
      {
        id: "sf-1",
        teams: [
          { name: "Team Alpha", score: 1 },
          { name: "Team Nimbus", score: 2 },
        ],
        start: "15:00",
        court: "Court A",
      },
      {
        id: "sf-2",
        teams: [
          { name: "Team Horizon", score: 0 },
          { name: "Team Nova", score: 2 },
        ],
        start: "15:45",
        court: "Court B",
      },
    ],
  },
  {
    name: "Finale",
    matches: [
      {
        id: "final",
        teams: [
          { name: "Team Nimbus", score: 1 },
          { name: "Team Nova", score: 3 },
        ],
        start: "17:00",
        court: "Center Court",
      },
    ],
  },
  {
    name: "3e plaats",
    matches: [
      {
        id: "bronze",
        teams: [
          { name: "Team Alpha", score: 2 },
          { name: "Team Horizon", score: 1 },
        ],
        start: "16:00",
        court: "Court C",
      },
    ],
  },
];

function getWinnerIndex(match: Match) {
  const [teamA, teamB] = match.teams;
  if (teamA.score === undefined || teamB.score === undefined) return undefined;
  if (teamA.score === teamB.score) return undefined;
  return teamA.score > teamB.score ? 0 : 1;
}

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 py-16 text-zinc-100">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6">
        <header className="flex flex-col gap-4 text-center sm:text-left">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-300/80">
            Bracket Concept
          </p>
          <h1 className="text-4xl font-semibold sm:text-5xl">
            City League Invitational 2025
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-zinc-300 sm:mx-0">
            Volg de voortgang van de teams door de rondes heen. Scores worden
            live bijgewerkt zodra wedstijden zijn afgerond.
          </p>
        </header>

        <section className="overflow-x-auto">
          <div className="flex min-w-[720px] gap-10 pb-6">
            {rounds.map((round, roundIndex) => (
              <div
                key={round.name}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
                    {round.name}
                  </h2>
                  <span className="text-xs text-zinc-400">
                    {round.matches.length}{" "}
                    {round.matches.length === 1 ? "wedstrijd" : "wedstrijden"}
                  </span>
                </div>
                <div className="flex flex-col gap-6">
                  {round.matches.map((match) => {
                    const winnerIndex = getWinnerIndex(match);
                    return (
                      <article
                        key={match.id}
                        className="rounded-xl border border-white/10 bg-black/30 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5"
                      >
                        <div className="mb-3 flex items-center gap-3 text-xs text-zinc-400">
                          <span className="rounded-full bg-zinc-800 px-2 py-1 font-semibold text-zinc-100">
                            {match.id.toUpperCase()}
                          </span>
                          {match.start && <span>{match.start} uur</span>}
                          {match.court && (
                            <>
                              <span className="text-zinc-700">•</span>
                              <span>{match.court}</span>
                            </>
                          )}
                        </div>
                        <div className="flex flex-col gap-3">
                          {match.teams.map((team, idx) => {
                            const isWinner = winnerIndex === idx;
                            return (
                              <div
                                key={team.name}
                                className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                                  isWinner
                                    ? "bg-emerald-500/10 text-emerald-200"
                                    : "bg-white/5 text-zinc-100"
                                }`}
                              >
                                <span className="truncate font-medium">
                                  {team.name}
                                </span>
                                {team.score !== undefined ? (
                                  <span
                                    className={`ml-4 flex h-7 w-9 items-center justify-center rounded-md text-sm font-semibold ${
                                      isWinner ? "bg-emerald-500/30" : "bg-black/60"
                                    }`}
                                  >
                                    {team.score}
                                  </span>
                                ) : (
                                  <span className="ml-4 text-xs text-zinc-400">
                                    —
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </article>
                    );
                  })}
                </div>
                {roundIndex < rounds.length - 1 && (
                  <div className="mt-6 text-xs text-zinc-500">
                    Winnaar gaat door naar{" "}
                    <span className="font-semibold text-zinc-300">
                      {rounds[roundIndex + 1]?.name.toLowerCase()}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
