'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useBracketStore } from '@/app/store/bracketStore';
import MatchCard from './MatchCard';
import MatchDetailsPanel from './MatchDetailsPanel';
import { useMemo, useState } from 'react';

export default function BracketContainer() {
  const { brackets, activeBracketId, settings, teams, selectedMatchId, setActiveBracket, getActiveBracket } = useBracketStore();
  const activeBracket = getActiveBracket();
  const rounds = activeBracket?.rounds ?? [];
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

  const roundSummaries = useMemo(
    () =>
      rounds.map((round, index) => {
        const total = round.matches.length;
        const completed = round.matches.filter(
          (match) => match.winnerIndex !== undefined
        ).length;
        const status =
          completed === 0
            ? 'upcoming'
            : completed === total
              ? 'complete'
              : 'in-progress';

        return {
          id: round.name,
          name: round.name,
          completed,
          total,
          status,
          completionPct: total === 0 ? 0 : Math.round((completed / total) * 100),
          roundIndex: index,
        };
      }),
    [rounds]
  );

  const [focusedRoundIndex, setFocusedRoundIndex] = useState<number | null>(null);
  const indexedRounds = useMemo(
    () => rounds.map((round, index) => ({ round, roundIndex: index })),
    [rounds]
  );

  const displayedRounds =
    focusedRoundIndex !== null
      ? indexedRounds.filter(({ roundIndex }) => roundIndex === focusedRoundIndex)
      : indexedRounds;

  const toggleRoundFocus = (roundIndex: number) => {
    setFocusedRoundIndex((current) =>
      current === roundIndex ? null : roundIndex
    );
  };

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

        {roundSummaries.length > 0 && (
          <section
            className="rounded-3xl border p-4 sm:p-6"
            style={{
              borderColor: '#2D3E5A',
              backgroundColor: '#0F172A80',
            }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.35em]" style={{ color: '#F2F1EF', opacity: 0.6 }}>
                  Bracket flow
                </p>
                <h3 className="text-lg font-semibold" style={{ color: '#F2F1EF' }}>
                  Ronde voortgang
                </h3>
              </div>

              <div
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"
                style={{ color: '#F2F1EF', opacity: 0.8 }}
              >
                <span className="inline-flex h-2 w-2 rounded-full bg-[#10b981]" />
                Afgerond
                <span className="inline-flex h-2 w-2 rounded-full bg-[#facc15]" />
                Live
                <span className="inline-flex h-2 w-2 rounded-full bg-[#f87171]" />
                Komend
              </div>
            </div>

            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {roundSummaries.map((round) => {
                const isActive = focusedRoundIndex === round.roundIndex;

                return (
                <article
                  key={round.id}
                  className={`min-w-[220px] flex-1 rounded-2xl border p-4 transition-all ${
                    isActive ? 'ring-2 ring-offset-2 ring-offset-transparent' : ''
                  }`}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleRoundFocus(round.roundIndex)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggleRoundFocus(round.roundIndex);
                    }
                  }}
                  style={{
                    borderColor: '#2D3E5A',
                    backgroundColor: isActive ? '#13213C' : '#0B1220',
                    color: '#F2F1EF',
                  }}
                >
                  <div className="flex items-center justify-between text-xs uppercase tracking-widest">
                    <span>{round.name}</span>
                    <span
                      className="flex items-center gap-1 text-[10px]"
                      style={{
                        color:
                          round.status === 'complete'
                            ? '#10b981'
                            : round.status === 'in-progress'
                              ? '#fcd34d'
                              : '#f87171',
                      }}
                    >
                      <span className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor:
                            round.status === 'complete'
                              ? '#10b981'
                              : round.status === 'in-progress'
                                ? '#fcd34d'
                                : '#f87171',
                        }}
                      />
                      {round.status === 'complete' && 'Klaar'}
                      {round.status === 'in-progress' && 'Live'}
                      {round.status === 'upcoming' && 'Komend'}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${round.completionPct}%`,
                        backgroundImage: `linear-gradient(90deg, ${settings.primaryColor}, ${settings.secondaryColor})`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-sm" style={{ color: '#F2F1EF', opacity: 0.7 }}>
                    {round.completed}/{round.total} wedstrijden
                  </p>
                </article>
              )})}
            </div>
          </section>
        )}

        {focusedRoundIndex !== null && rounds[focusedRoundIndex] && (
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm"
            style={{
              borderColor: '#2D3E5A',
              backgroundColor: '#0F172A',
              color: '#F2F1EF',
            }}
          >
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.4em]" style={{ opacity: 0.6 }}>
                Focus modus
              </p>
              <p className="text-base font-semibold">
                {rounds[focusedRoundIndex]?.name}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFocusedRoundIndex(null)}
              className="rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-widest transition"
              style={{
                borderColor: '#2D3E5A',
                backgroundColor: '#1A2335',
                color: '#F2F1EF',
              }}
            >
              Toon volledige bracket
            </button>
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
          
          {brackets.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {brackets.map((bracket) => (
                <button
                  key={bracket.id}
                  onClick={() => setActiveBracket(bracket.id)}
                  className={`rounded-lg border-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                    activeBracketId === bracket.id
                      ? 'border-[#482CFF] bg-[#482CFF]/20 shadow-lg shadow-[#482CFF]/20'
                      : 'border-[#2D3E5A] bg-[#1A2335] hover:border-[#482CFF]/50'
                  }`}
                  style={{
                    color: '#F2F1EF',
                  }}
                >
                  {bracket.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bracket Container */}
        <section
          id="bracket-container"
          className="rounded-3xl border p-3 sm:p-4"
          style={{
            borderColor: '#2D3E5A',
            backgroundColor: settings.bracketStyle === 'playful'
              ? `${settings.backgroundColor}90`
              : '#0B1220',
          }}
        >
          {/* Desktop & tablet columns */}
          <div className="hidden gap-6 lg:grid lg:grid-flow-col lg:auto-cols-[minmax(280px,1fr)]">
            <AnimatePresence mode="popLayout">
              {displayedRounds.map(({ round, roundIndex }) => {
                const matchesCompleted = round.matches.filter(
                  (match) => match.winnerIndex !== undefined
                ).length;

                return (
                  <motion.div
                    key={`desktop-${round.name}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: speedMap[settings.animationSpeed] }}
                    className="relative flex h-full flex-col rounded-3xl border-2 p-4 shadow-xl shadow-black/20"
                    style={{
                      borderColor: '#2D3E5A',
                      background: `linear-gradient(145deg, rgba(26,35,53,0.95) 0%, ${settings.backgroundColor} 100%)`,
                    }}
                  >
                    <header className="mb-4 border-b pb-3" style={{ borderColor: '#2D3E5A' }}>
                      <p className="text-xs uppercase tracking-[0.35em]" style={{ color: '#F2F1EF', opacity: 0.6 }}>
                        Ronde {roundIndex + 1}
                      </p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <h2
                          className="text-2xl font-bold uppercase tracking-wider"
                          style={{
                            color: settings.primaryColor,
                          }}
                        >
                          {round.name}
                        </h2>
                        <span
                          className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                          style={{
                            color: settings.secondaryColor,
                            backgroundColor: '#1F2C45',
                          }}
                        >
                          {matchesCompleted}/{round.matches.length}
                        </span>
                      </div>
                    </header>

                    <div className="flex-1 space-y-4 overflow-visible">
                      {round.matches.map((match) => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          roundIndex={roundIndex}
                        />
                      ))}
                    </div>

                    {roundIndex < rounds.length - 1 && (
                      <div className="pointer-events-none absolute right-[-18px] top-16 hidden xl:block">
                        <div className="h-10 w-10 rounded-full border border-dashed border-white/10" />
                        <div className="mx-auto h-16 w-px bg-white/10" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Mobile stacked rounds */}
          <div className="flex flex-col gap-3 lg:hidden">
            {displayedRounds.map(({ round, roundIndex }) => {
              const matchesCompleted = round.matches.filter(
                (match) => match.winnerIndex !== undefined
              ).length;

              return (
                <details
                  key={`mobile-${round.name}`}
                  className="group rounded-2xl border p-4"
                  style={{
                    borderColor: '#2D3E5A',
                    backgroundColor: '#0F172A',
                  }}
                  open={roundIndex === 0}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.35em]" style={{ color: '#F2F1EF', opacity: 0.6 }}>
                        Ronde {roundIndex + 1}
                      </p>
                      <h3 className="text-xl font-semibold" style={{ color: '#F2F1EF' }}>
                        {round.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest" style={{ color: '#F2F1EF' }}>
                      <span>{matchesCompleted}/{round.matches.length}</span>
                      <svg
                        className="h-4 w-4 transition-transform group-open:rotate-180"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </summary>

                  <div className="mt-4 space-y-3">
                    {round.matches.map((match) => (
                      <MatchCard
                        key={`mobile-${match.id}`}
                        match={match}
                        roundIndex={roundIndex}
                      />
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        </section>
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
