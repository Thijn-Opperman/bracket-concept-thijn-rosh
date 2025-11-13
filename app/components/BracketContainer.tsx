'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useBracketStore } from '@/app/store/bracketStore';
import MatchCard from './MatchCard';
import { exportBracketAsImage, exportBracketAsPDF } from '@/app/utils/exportUtils';
import { useState } from 'react';

export default function BracketContainer() {
  const { rounds, settings } = useBracketStore();
  const [isExporting, setIsExporting] = useState(false);
  const speedMap = {
    slow: 0.6,
    normal: 0.3,
    fast: 0.15,
  };

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
      className="flex-1 overflow-auto p-4 lg:p-8"
      style={getThemeStyles()}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header with Export Buttons */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
              Tournament Bracket
            </h1>
            <p className="mt-2 text-sm text-white/70 sm:text-base">
              {settings.bracketType === 'single-elimination' && 'Single Elimination'}
              {settings.bracketType === 'double-elimination' && 'Double Elimination'}
              {settings.bracketType === 'round-robin' && 'Round Robin'}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportImage}
              disabled={isExporting}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50 sm:px-4 sm:text-sm"
            >
              {isExporting ? 'Exporteren...' : 'PNG'}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50 sm:px-4 sm:text-sm"
            >
              {isExporting ? 'Exporteren...' : 'PDF'}
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
    </div>
  );
}

