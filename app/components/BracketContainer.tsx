'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useBracketStore } from '@/app/store/bracketStore';
import MatchCard from './MatchCard';
import MatchDetailsPanel from './MatchDetailsPanel';
import {
  exportBracketAsImage,
  exportBracketAsPDF,
} from '@/app/utils/exportUtils';
import { useMemo, useState } from 'react';

export default function BracketContainer() {
  const { rounds, settings, teams, selectedMatchId } = useBracketStore();
  const [isExporting, setIsExporting] = useState(false);
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

  const handleExportImage = async () => {
    setIsExporting(true);
    try {
      await exportBracketAsImage('bracket-container', 'png');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export mislukt. Probeer het opnieuw.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportBracketAsPDF('bracket-container');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export mislukt. Probeer het opnieuw.');
    } finally {
      setIsExporting(false);
    }
  };

  const getThemeStyles = () => {
    switch (settings.theme) {
      case 'retro':
        return {
          background: `linear-gradient(135deg, ${settings.backgroundColor} 0%, #1a1a2e 100%)`,
          fontFamily: 'monospace',
        };
      case 'futuristic':
        return {
          background: `linear-gradient(135deg, ${settings.backgroundColor} 0%, #0a0a1a 100%)`,
          fontFamily: 'sans-serif',
        };
      case 'sporty':
        return {
          background: `linear-gradient(135deg, ${settings.backgroundColor} 0%, #1a1a1a 100%)`,
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
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-6 sm:p-8">
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
                <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/80 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                      Volgende wedstrijd
                    </p>
                    <p className="text-base font-semibold text-white">
                      {upcomingMatch.teams[0]?.name ?? 'TBD'}{' '}
                      <span className="text-white/40">vs</span>{' '}
                      {upcomingMatch.teams[1]?.name ?? 'TBD'}
                    </p>
                    <p className="text-xs text-white/60">
                      {upcomingMatch.startTime ?? 'Tijd TBD'} ·{' '}
                      {upcomingMatch.court ?? 'Locatie TBD'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:border-white/40 hover:bg-white/20"
                  >
                    Bekijk de bracket
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </button>
                </div>
              )}
          </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-white/20 bg-black/40 p-4 shadow-lg shadow-black/30 sm:flex-row sm:p-5">
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

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/40">
            <div
              className="h-2 w-12 rounded-full"
              style={{
                backgroundImage: `linear-gradient(90deg, ${settings.primaryColor}, ${settings.secondaryColor})`,
              }}
            />
            Live bracket overview
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportImage}
              disabled={isExporting}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:border-white/40 hover:bg-white/20 disabled:opacity-50"
            >
              {isExporting ? 'Exporteren...' : 'Export PNG'}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:border-white/40 hover:bg-white/20 disabled:opacity-50"
            >
              {isExporting ? 'Exporteren...' : 'Export PDF'}
            </button>
          </div>
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
                  className={`flex-1 min-w-[280px] ${
                    settings.bracketStyle === 'classic'
                      ? 'rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6'
                      : ''
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h2
                      className="text-lg font-semibold uppercase tracking-wide"
                      style={{ color: settings.primaryColor }}
                    >
                      {round.name}
                    </h2>
                    <span className="text-xs text-white/60">
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
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4 text-center"
                    >
                      <div
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs"
                        style={{
                          backgroundColor: `${settings.secondaryColor}20`,
                          color: settings.secondaryColor,
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
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                        <span>Winnaar gaat door</span>
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
    <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
      <p className="text-xs uppercase tracking-[0.35em] text-white/40">
        {label}
      </p>
      <p
        className="mt-2 text-2xl font-bold sm:text-3xl"
        style={{ color: accent }}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-white/60">{description}</p>
    </div>
  );
}
