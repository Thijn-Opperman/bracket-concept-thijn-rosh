'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useBracketStore } from '@/app/store/bracketStore';
import MatchCard from './MatchCard';
import MatchDetailsPanel from './MatchDetailsPanel';
import { useMemo } from 'react';

export default function BracketContainer() {
  const { rounds, settings, teams, selectedMatchId } = useBracketStore();
  const speedMap = {
    slow: 0.6,
    normal: 0.3,
    fast: 0.15,
  };

  const { totalMatches, completedMatches, upcomingMatch } = useMemo(() => {
    const matches = rounds.flatMap((round) => round.matches);
    const total = matches.length;
    const completed = matches.filter((match) => match.winnerIndex !== undefined)
      .length;
    const upcoming = matches.find((match) => match.winnerIndex === undefined);

    return {
      totalMatches: total,
      completedMatches: completed,
      upcomingMatch: upcoming,
    };
  }, [rounds]);

  const getThemeStyles = () => {
    switch (settings.theme) {
      case 'retro':
        return {
          background: `linear-gradient(135deg, ${settings.backgroundColor} 0%, #1A2335 100%)`,
          fontFamily: 'monospace',
        };
      case 'futuristic':
        return {
          background: `linear-gradient(135deg, ${settings.backgroundColor} 0%, #1A2335 100%)`,
          fontFamily: 'sans-serif',
        };
      case 'sporty':
        return {
          background: `linear-gradient(135deg, ${settings.backgroundColor} 0%, #1A2335 100%)`,
          fontFamily: 'Arial, sans-serif',
        };
      default:
        return {
          background: settings.backgroundColor,
        };
    }
  };

  return (
    <div
      className="relative flex-1 overflow-auto p-4 lg:p-8"
      style={getThemeStyles()}
    >
      <div className="mx-auto max-w-7xl space-y-8">
        <div 
          className="relative overflow-hidden rounded-3xl border p-6 sm:p-8"
          style={{
            borderColor: '#2D3E5A',
            backgroundColor: '#1A2335',
          }}
        >
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background: `radial-gradient(circle at 10% 20%, ${settings.primaryColor}40 0%, transparent 55%), radial-gradient(circle at 90% 20%, ${settings.secondaryColor}35 0%, transparent 50%), radial-gradient(circle at 50% 80%, ${settings.secondaryColor}25 0%, transparent 55%)`,
            }}
          />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-4">
              <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                Grand Arena Series
            </p>
              <h1 className="text-3xl font-bold text-white sm:text-5xl">
                Ultimate Bracket Showdown
              </h1>
              <p className="text-sm text-white/70 sm:text-base">
                {settings.bracketType === 'single-elimination' &&
                  'Winner takes all. Eén misstap en je ligt eruit.'}
                {settings.bracketType === 'double-elimination' &&
                  'Tweede kansen bestaan. Vecht je terug door de losers bracket.'}
                {settings.bracketType === 'round-robin' &&
                  'Iedereen speelt tegen iedereen. Consistentie beslist.'}
              </p>
              {upcomingMatch && (
                <div 
                  className="rounded-2xl border p-4 text-sm"
                  style={{
                    borderColor: '#2D3E5A',
                    backgroundColor: '#1A2335',
                    color: '#F2F1EF',
                  }}
                >
                  <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: '#F2F1EF', opacity: 0.6 }}>
                    Volgende wedstrijd
                  </p>
                  <p className="text-base font-semibold" style={{ color: '#F2F1EF' }}>
                    {upcomingMatch.teams[0]?.name ?? 'TBD'}{' '}
                    <span style={{ color: '#F2F1EF', opacity: 0.5 }}>vs</span>{' '}
                    {upcomingMatch.teams[1]?.name ?? 'TBD'}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#F2F1EF', opacity: 0.7 }}>
                    {upcomingMatch.startTime ?? 'Tijd TBD'} ·{' '}
                    {upcomingMatch.court ?? 'Locatie TBD'}
                  </p>
                </div>
              )}
          </div>

            <div 
              className="flex flex-col gap-3 rounded-2xl border p-4 shadow-lg shadow-black/30 sm:flex-row sm:p-5"
              style={{
                borderColor: '#2D3E5A',
                backgroundColor: '#1A2335',
              }}
            >
              <StatCard
                label="Teams"
                value={teams.length}
                accent={settings.primaryColor}
                description="Strijders in het toernooi"
              />
              <StatCard
                label="Matches"
                value={`${completedMatches}/${totalMatches}`}
                accent={settings.secondaryColor}
                description="Afgeronde wedstrijden"
              />
              <StatCard
                label="Winnaar"
                value={
                  rounds[rounds.length - 1]?.matches[0]?.teams[
                    rounds[rounds.length - 1]?.matches[0]?.winnerIndex ?? -1
                  ]?.name ?? 'N.N.B.'
                }
                accent="#fcd34d"
                description="Wordt live bijgewerkt"
              />
            </div>
          </div>
        </div>

        <div 
          className="flex items-center gap-3 text-xs uppercase tracking-[0.3em]"
          style={{ color: '#F2F1EF' }}
        >
          <div
            className="h-2 w-12 rounded-full"
            style={{
              backgroundImage: `linear-gradient(90deg, ${settings.primaryColor}, ${settings.secondaryColor})`,
            }}
          />
          Live bracket overview
        </div>

        {/* Bracket Container */}
        <div
          id="bracket-container"
          className={`overflow-x-auto ${
            settings.bracketStyle === 'playful' ? 'rounded-2xl p-2 sm:p-4' : ''
          }`}
          style={{
            backgroundColor: settings.bracketStyle === 'playful' 
              ? `${settings.backgroundColor}80` 
              : 'transparent',
          }}
        >
          <div
            className={`flex gap-4 sm:gap-6 ${
              settings.bracketStyle === 'classic' 
                ? 'min-w-max flex-col sm:flex-row' 
                : 'flex-col sm:flex-row sm:flex-wrap'
            }`}
          >
            <AnimatePresence mode="popLayout">
              {rounds.map((round, roundIndex) => (
                <motion.div
                  key={round.name}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: speedMap[settings.animationSpeed] }}
                  className={`flex-1 min-w-[280px] transition-all duration-300 ${
                    settings.bracketStyle === 'classic'
                      ? 'rounded-2xl border-2 p-4 sm:p-6 shadow-xl shadow-black/20'
                      : 'rounded-xl'
                  }`}
                  style={settings.bracketStyle === 'classic' ? {
                    borderColor: '#2D3E5A',
                    background: `linear-gradient(135deg, #1A2335 0%, ${settings.backgroundColor} 100%)`,
                  } : {}}
                >
                  <div 
                    className="mb-6 flex items-center justify-between border-b pb-3"
                    style={{ borderColor: '#2D3E5A' }}
                  >
                    <h2
                      className="text-xl font-bold uppercase tracking-wider drop-shadow-lg"
                      style={{ 
                        color: settings.primaryColor,
                        textShadow: `0 0 20px ${settings.primaryColor}40`
                      }}
                    >
                      {round.name}
                    </h2>
                    <span 
                      className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                      style={{ 
                        color: settings.secondaryColor,
                        backgroundColor: '#2D3E5A',
                      }}
                    >
                      {round.matches.length}{' '}
                      {round.matches.length === 1 ? 'wedstrijd' : 'wedstrijden'}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {round.matches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        roundIndex={roundIndex}
                      />
                    ))}
                  </div>

                  {roundIndex < rounds.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mt-6 text-center"
                    >
                      <div
                        className="inline-flex items-center gap-3 rounded-full border-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider shadow-lg"
                        style={{
                          borderColor: settings.secondaryColor,
                          backgroundColor: `${settings.secondaryColor}15`,
                          color: settings.secondaryColor,
                        }}
                      >
                        <svg
                          className="h-5 w-5 animate-pulse"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                        <span>Winnaar gaat door naar volgende ronde</span>
                        <svg
                          className="h-5 w-5 animate-pulse"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <MatchDetailsPanel />

      {/* Ambient glow when details open */}
      {selectedMatchId && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 bg-black/60 backdrop-blur-xl"
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  accent,
}: {
  label: string;
  value: string | number;
  description: string;
  accent: string;
}) {
  return (
    <div 
      className="flex-1 rounded-2xl border p-4"
      style={{
        borderColor: '#2D3E5A',
        backgroundColor: '#1A2335',
        color: '#F2F1EF',
      }}
    >
      <p className="text-xs uppercase tracking-[0.35em]" style={{ color: '#F2F1EF', opacity: 0.6 }}>
        {label}
      </p>
      <p
        className="mt-2 text-2xl font-bold sm:text-3xl"
        style={{ color: accent }}
      >
        {value}
      </p>
      <p className="mt-1 text-xs" style={{ color: '#F2F1EF', opacity: 0.7 }}>{description}</p>
    </div>
  );
}
