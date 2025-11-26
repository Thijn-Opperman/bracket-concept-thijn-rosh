'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useBracketStore } from '@/app/store/bracketStore';
import MatchCard from './MatchCard';
import MatchDetailsPanel from './MatchDetailsPanel';
import BracketOverview from './BracketOverview';
import { useEffect, useMemo, useState } from 'react';

function useStoreHydrationReady() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const unsub = useBracketStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    if (useBracketStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }

    return () => {
      unsub?.();
    };
  }, []);

  return hasHydrated;
}

export default function BracketContainer() {
  const { brackets, activeBracketId, settings, teams, selectedMatchId, setActiveBracket, getActiveBracket, viewMode, setViewMode } = useBracketStore();
  const activeBracket = getActiveBracket();
  const rounds = activeBracket?.rounds ?? [];
  const animationDuration = 0.15; // Fast animations
  const isHydrated = useStoreHydrationReady();

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

  // Filter matches based on viewMode
  const filteredRounds = useMemo(() => {
    return indexedRounds.map(({ round, roundIndex }) => {
      let filteredMatches = round.matches;
      
      switch (viewMode) {
        case 'completed':
          // Only show completed matches
          filteredMatches = round.matches.filter(match => match.winnerIndex !== undefined);
          break;
        case 'scheduled':
          // Only show scheduled matches (have startTime and no winner)
          filteredMatches = round.matches.filter(match => 
            match.startTime && match.winnerIndex === undefined
          );
          break;
        case 'draws':
          // Show all matches for bracket overview
          filteredMatches = round.matches;
          break;
        case 'live':
        default:
          // Show only matches without winner (default/live view)
          filteredMatches = round.matches.filter(match => match.winnerIndex === undefined);
          break;
      }
      
      return {
        round: {
          ...round,
          matches: filteredMatches
        },
        roundIndex
      };
    }).filter(({ round }) => round.matches.length > 0); // Remove rounds with no visible matches
  }, [indexedRounds, viewMode]);

  const displayedRounds =
    focusedRoundIndex !== null
      ? filteredRounds.filter(({ roundIndex }) => roundIndex === focusedRoundIndex)
      : filteredRounds;

  // Get all completed matches
  const historyMatches = useMemo(() => {
    return rounds.flatMap((round, roundIndex) =>
      round.matches
        .filter(match => match.winnerIndex !== undefined)
        .map(match => ({ match, roundIndex, roundName: round.name }))
    );
  }, [rounds]);

  // Get all scheduled matches
  const scheduledMatches = useMemo(() => {
    return rounds.flatMap((round, roundIndex) =>
      round.matches
        .filter(match => match.startTime && match.winnerIndex === undefined)
        .map(match => ({ match, roundIndex, roundName: round.name }))
    );
  }, [rounds]);

  const toggleRoundFocus = (roundIndex: number) => {
    setFocusedRoundIndex((current) =>
      current === roundIndex ? null : roundIndex
    );
  };

  const getThemeStyles = () => {
    switch (settings.theme) {
      case 'retro':
        return {
          backgroundColor: settings.backgroundColor,
          fontFamily: 'monospace',
        };
      case 'futuristic':
        return {
          backgroundColor: settings.backgroundColor,
          fontFamily: 'sans-serif',
        };
      case 'sporty':
        return {
          backgroundColor: settings.backgroundColor,
          fontFamily: 'Arial, sans-serif',
        };
      default:
        return {
          backgroundColor: settings.backgroundColor,
        };
    }
  };

  if (!isHydrated) {
    return (
      <div
        className="relative flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8"
        style={getThemeStyles()}
      >
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-48 rounded-3xl border border-white/10 bg-white/5 animate-pulse" />
          <div className="h-72 rounded-3xl border border-white/10 bg-white/5 animate-pulse" />
          <div className="h-96 rounded-3xl border border-white/10 bg-white/5 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8"
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
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-4">
              <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                {settings.tournamentSeries || 'Grand Arena Series'}
            </p>
              <h1 className="text-3xl font-bold text-white sm:text-5xl">
                {settings.tournamentTitle || 'Ultimate Bracket Showdown'}
              </h1>
              <p className="text-sm text-white/70 sm:text-base">
                {settings.tournamentDescription ??
                  (settings.bracketType === 'single-elimination'
                    ? 'Winner takes all. Eén misstap en je ligt eruit.'
                    : 'Tweede kansen bestaan. Vecht je terug door de losers bracket.')}
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
                <span className="inline-flex h-2 w-2 rounded-full bg-[#9ca3af]" />
                Afgerond
                <span className="inline-flex h-2 w-2 rounded-full bg-[#ef4444]" />
                Live
                <span className="inline-flex h-2 w-2 rounded-full bg-[#10b981]" />
                Komend
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 overflow-x-hidden">
              {roundSummaries.map((round) => {
                const isActive = focusedRoundIndex === round.roundIndex;

                return (
                <article
                  key={round.id}
                  className="min-w-[140px] flex-1 rounded-xl border p-3 transition-all"
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
                    borderColor: isActive ? settings.primaryColor : '#2D3E5A',
                    background:
                      isActive
                        ? 'linear-gradient(135deg, rgba(72,44,255,0.2), rgba(20,27,44,0.95))'
                        : '#0B1220',
                    color: '#F2F1EF',
                    boxShadow: isActive
                      ? '0 0 0 1px rgba(72,44,255,0.4), 0 12px 30px rgba(0,0,0,0.35)'
                      : '0 6px 18px rgba(0,0,0,0.25)',
                  }}
                >
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider">
                    <span className="truncate">{round.name}</span>
                    <span
                      className="ml-1 flex items-center gap-1 text-[9px] flex-shrink-0"
                      style={{
                        color:
                          round.status === 'complete'
                            ? '#9ca3af'
                            : round.status === 'in-progress'
                              ? '#ef4444'
                              : '#10b981',
                      }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor:
                            round.status === 'complete'
                              ? '#9ca3af'
                              : round.status === 'in-progress'
                                ? '#ef4444'
                                : '#10b981',
                        }}
                      />
                      {round.status === 'complete' && 'Klaar'}
                      {round.status === 'in-progress' && 'Live'}
                      {round.status === 'upcoming' && 'Komend'}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${round.completionPct}%`,
                        backgroundColor: settings.primaryColor,
                      }}
                    />
                  </div>
                  <p className="mt-1.5 text-[10px]" style={{ color: '#F2F1EF', opacity: 0.7 }}>
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
                backgroundColor: settings.primaryColor,
              }}
            />
            Live bracket overview
          </div>
          
          <div className="flex gap-2 flex-wrap items-center">
            <button
              type="button"
              onClick={() => setViewMode('live')}
              className={`rounded-lg border-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
                viewMode === 'live'
                  ? 'border-[#482CFF] bg-[#482CFF]/20 shadow-lg shadow-[#482CFF]/20'
                  : 'border-[#2D3E5A] bg-[#1A2335] hover:border-[#482CFF]/50'
              }`}
              style={{
                color: '#F2F1EF',
              }}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Live
            </button>
            
            {historyMatches.length > 0 && (
              <button
                type="button"
                onClick={() => setViewMode('completed')}
                className={`rounded-lg border-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  viewMode === 'completed'
                    ? 'border-[#482CFF] bg-[#482CFF]/20 shadow-lg shadow-[#482CFF]/20'
                    : 'border-[#2D3E5A] bg-[#1A2335] hover:border-[#482CFF]/50'
                }`}
                style={{
                  color: '#F2F1EF',
                }}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Completed ({historyMatches.length})
              </button>
            )}
            
            <button
              type="button"
              onClick={() => setViewMode('scheduled')}
              className={`rounded-lg border-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
                viewMode === 'scheduled'
                  ? 'border-[#482CFF] bg-[#482CFF]/20 shadow-lg shadow-[#482CFF]/20'
                  : 'border-[#2D3E5A] bg-[#1A2335] hover:border-[#482CFF]/50'
              }`}
              style={{
                color: '#F2F1EF',
              }}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Scheduled {scheduledMatches.length > 0 && `(${scheduledMatches.length})`}
            </button>
            
            <button
              type="button"
              onClick={() => setViewMode('draws')}
              className={`rounded-lg border-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
                viewMode === 'draws'
                  ? 'border-[#482CFF] bg-[#482CFF]/20 shadow-lg shadow-[#482CFF]/20'
                  : 'border-[#2D3E5A] bg-[#1A2335] hover:border-[#482CFF]/50'
              }`}
              style={{
                color: '#F2F1EF',
              }}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A2 2 0 013 15.382V5.618a2 2 0 011.553-1.954l5-1.111a2 2 0 011.106 0l5 1.111A2 2 0 0117 5.618v9.764a2 2 0 01-1.553 1.954L9 20z"
                />
              </svg>
              Draws
            </button>
            
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
        </div>

        {/* Bracket Container */}
        {teams.length === 0 ? (
          <section
            id="bracket-container"
            className="rounded-3xl border p-8 sm:p-12"
            style={{
              borderColor: '#2D3E5A',
              backgroundColor: '#1A2335',
            }}
          >
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-12">
              <svg
                className="h-16 w-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: settings.primaryColor, opacity: 0.5 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h2 className="text-2xl font-bold" style={{ color: '#F2F1EF' }}>
                Nog geen teams toegevoegd
              </h2>
              <p className="text-sm max-w-md" style={{ color: '#F2F1EF', opacity: 0.7 }}>
                Voeg teams toe via de admin pagina om een bracket te genereren. Ga naar <span className="font-semibold" style={{ color: settings.primaryColor }}>/admin</span> om te beginnen.
              </p>
            </div>
          </section>
        ) : viewMode === 'draws' ? (
          <section
            id="bracket-container"
            className="rounded-3xl border p-6 sm:p-8"
            style={{
              borderColor: '#2D3E5A',
              backgroundColor: settings.bracketStyle === 'playful'
                ? `${settings.backgroundColor}90`
                : '#0B1220',
            }}
          >
            <BracketOverview />
          </section>
        ) : (
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
            <div className="hidden gap-6 lg:grid lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
                    transition={{ duration: animationDuration }}
                    className="relative flex h-full flex-col rounded-3xl border-2 p-4 shadow-xl shadow-black/20"
                    style={{
                      borderColor: '#2D3E5A',
                      backgroundColor: '#1A2335',
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
        )}

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
