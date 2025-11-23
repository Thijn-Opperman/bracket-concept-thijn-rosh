'use client';

import { useBracketStore } from '@/app/store/bracketStore';
import { motion } from 'framer-motion';
import type { Round } from '@/app/types/bracket';

export default function BracketOverview() {
  const { getActiveBracket, settings, setSelectedMatch } = useBracketStore();
  const activeBracket = getActiveBracket();
  const rounds = activeBracket?.rounds ?? [];

  if (rounds.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-white/60">Geen bracket beschikbaar</p>
      </div>
    );
  }

  // Display rounds from left to right (first round on left, finals on right)
  return (
    <div className="overflow-x-auto pb-4">
      <div 
        className="inline-flex gap-12 min-w-full justify-start"
        style={{ 
          minWidth: `${rounds.length * 300}px`,
        }}
      >
        {rounds.map((round, roundIndex) => {
          return (
            <RoundColumn
              key={round.name}
              round={round}
              roundIndex={roundIndex}
              displayIndex={roundIndex}
              isLastRound={roundIndex === rounds.length - 1}
              settings={settings}
              setSelectedMatch={setSelectedMatch}
            />
          );
        })}
      </div>
    </div>
  );
}

function RoundColumn({
  round,
  roundIndex,
  displayIndex,
  isLastRound,
  settings,
  setSelectedMatch,
}: {
  round: Round;
  roundIndex: number;
  displayIndex: number;
  isLastRound: boolean;
  settings: any;
  setSelectedMatch: (id: string | null) => void;
}) {
  
  return (
    <div className="flex flex-col justify-center min-w-[240px]">
      <div className="mb-4 text-center">
        <p className="text-xs uppercase tracking-widest text-white/50 mb-1">
          {round.name}
        </p>
        <div className="h-px w-full bg-white/10 mt-2" />
      </div>
      
      <div className="flex flex-col gap-4">
        {round.matches.map((match, matchIndex) => {
          const teamA = match.teams[0];
          const teamB = match.teams[1];
          const isCompleted = match.winnerIndex !== undefined;
          const winner = isCompleted && match.winnerIndex !== undefined 
            ? match.teams[match.winnerIndex] 
            : null;

          return (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: matchIndex * 0.1 }}
              className="relative"
            >
              <div
                className="group rounded-xl border-2 p-3 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg relative"
                style={{
                  borderColor: isCompleted 
                    ? settings.primaryColor 
                    : '#2D3E5A',
                  backgroundColor: isCompleted 
                    ? `${settings.primaryColor}15` 
                    : '#0B1220',
                }}
                onClick={() => setSelectedMatch(match.id)}
                onMouseEnter={(e) => {
                  if (!isCompleted) {
                    e.currentTarget.style.borderColor = settings.primaryColor;
                    e.currentTarget.style.backgroundColor = `${settings.primaryColor}10`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCompleted) {
                    e.currentTarget.style.borderColor = '#2D3E5A';
                    e.currentTarget.style.backgroundColor = '#0B1220';
                  }
                }}
              >
                {/* Click indicator */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      backgroundColor: settings.primaryColor,
                      color: '#FFFFFF',
                    }}
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    Details
                  </div>
                </div>
                {/* Team A */}
                <div
                  className={`rounded-lg p-2 mb-2 transition-all ${
                    winner?.id === teamA?.id
                      ? 'bg-[#10b981]/20 border border-[#10b981]/50'
                      : 'bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {teamA?.logo && (
                      <img
                        src={teamA.logo}
                        alt={teamA.name}
                        className="h-6 w-6 rounded object-contain"
                      />
                    )}
                    <span
                      className={`text-sm font-semibold flex-1 truncate ${
                        winner?.id === teamA?.id
                          ? 'text-[#10b981]'
                          : 'text-white/90'
                      }`}
                    >
                      {teamA?.name ?? 'TBD'}
                    </span>
                    {match.teams[0]?.score !== undefined && (
                      <span className="text-xs font-bold text-white/70">
                        {match.teams[0].score}
                      </span>
                    )}
                  </div>
                </div>

                {/* VS separator */}
                <div className="flex items-center justify-center py-1">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="px-2 text-[10px] uppercase tracking-widest text-white/40">
                    vs
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                {/* Team B */}
                <div
                  className={`rounded-lg p-2 transition-all ${
                    winner?.id === teamB?.id
                      ? 'bg-[#10b981]/20 border border-[#10b981]/50'
                      : 'bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {teamB?.logo && (
                      <img
                        src={teamB.logo}
                        alt={teamB.name}
                        className="h-6 w-6 rounded object-contain"
                      />
                    )}
                    <span
                      className={`text-sm font-semibold flex-1 truncate ${
                        winner?.id === teamB?.id
                          ? 'text-[#10b981]'
                          : 'text-white/90'
                      }`}
                    >
                      {teamB?.name ?? 'TBD'}
                    </span>
                    {match.teams[1]?.score !== undefined && (
                      <span className="text-xs font-bold text-white/70">
                        {match.teams[1].score}
                      </span>
                    )}
                  </div>
                </div>

                {/* Match info */}
                <div className="mt-2 pt-2 border-t border-white/10">
                  {(match.startTime || match.court) && (
                    <div className="flex items-center justify-between text-[10px] text-white/50 mb-1">
                      {match.startTime && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {match.startTime}
                        </span>
                      )}
                      {match.court && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          {match.court}
                        </span>
                      )}
                    </div>
                  )}
                  {/* Click hint */}
                  <div className="flex items-center justify-center gap-1 text-[9px] text-white/40 group-hover:text-white/70 transition-colors">
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    <span className="uppercase tracking-wider">Klik voor details</span>
                  </div>
                </div>
              </div>

              {/* Connection lines to next round (if not last round) */}
              {!isLastRound && (
                <>
                  <div className="absolute right-[-48px] top-1/2 w-12 h-px bg-white/20" />
                  {matchIndex % 2 === 0 && (
                    <div className="absolute right-[-48px] top-1/2 w-px bg-white/20" style={{ height: 'calc(100% + 1rem)', top: '50%' }} />
                  )}
                </>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

