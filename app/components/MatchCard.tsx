'use client';

import { motion } from 'framer-motion';
import type { Match } from '@/app/types/bracket';
import TeamSlot from './TeamSlot';
import { useBracketStore } from '@/app/store/bracketStore';
import type { MouseEvent } from 'react';
import { useMemo } from 'react';

interface MatchCardProps {
  match: Match;
  roundIndex: number;
}

export default function MatchCard({ match, roundIndex }: MatchCardProps) {
  const { settings, setSelectedMatch, getActiveBracket } = useBracketStore();
  const activeBracket = getActiveBracket();
  const rounds = activeBracket?.rounds ?? [];
  
  // Find the next match for the winner
  const nextMatch = useMemo(() => {
    if (match.winnerIndex === undefined || roundIndex >= rounds.length - 1) {
      return null;
    }
    
    const nextRound = rounds[roundIndex + 1];
    if (!nextRound) return null;
    
    // Calculate which match in the next round this winner goes to
    const nextMatchIndex = Math.floor(match.matchIndex / 2);
    const nextMatch = nextRound.matches[nextMatchIndex];
    
    if (!nextMatch) return null;
    
    // Find which opponent the winner will face
    const winnerSlot = match.matchIndex % 2;
    const opponentSlot = winnerSlot === 0 ? 1 : 0;
    const opponent = nextMatch.teams[opponentSlot];
    
    return {
      match: nextMatch,
      opponent: opponent,
      opponentSlot: opponentSlot,
    };
  }, [match, roundIndex, rounds]);
  const speedMap = {
    slow: 0.6,
    normal: 0.3,
    fast: 0.15,
  };

  const openDetails = (event?: MouseEvent<HTMLElement>) => {
    event?.stopPropagation();
    setSelectedMatch(match.id);
  };

  const getStyleClasses = () => {
    switch (settings.bracketStyle) {
      case 'classic':
        return 'border-2 backdrop-blur-sm';
      case 'modern':
        return 'border backdrop-blur-sm';
      case 'playful':
        return 'border-2 border-dashed shadow-lg shadow-black/40';
      default:
        return 'border';
    }
  };

  const getStyleColors = () => {
    switch (settings.bracketStyle) {
      case 'classic':
        return {
          borderColor: '#2D3E5A',
          background: `linear-gradient(135deg, #1A2335 0%, #111827 100%)`,
        };
      case 'modern':
        return {
          borderColor: '#2D3E5A',
          background: `linear-gradient(135deg, rgba(26, 35, 53, 0.8) 0%, rgba(17, 24, 39, 0.6) 100%)`,
        };
      case 'playful':
        return {
          borderColor: '#2D3E5A',
          background: `linear-gradient(135deg, #1A2335 0%, #2D3E5A 100%)`,
        };
      default:
        return {
          borderColor: '#2D3E5A',
          backgroundColor: '#1A2335',
        };
    }
  };

  const getThemeClasses = () => {
    switch (settings.theme) {
      case 'retro':
        return 'font-mono';
      case 'futuristic':
        return 'font-sans';
      case 'sporty':
        return 'font-bold';
      default:
        return '';
    }
  };

  const accentColor = match.details?.highlightColor ?? settings.secondaryColor;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: speedMap[settings.animationSpeed] }}
      className={`relative overflow-hidden rounded-2xl p-5 shadow-xl shadow-black/20 transition-all duration-300 ${getStyleClasses()} ${getThemeClasses()} ${
        match.winnerIndex !== undefined 
          ? 'ring-2 ring-offset-2 ring-offset-transparent' 
          : 'hover:shadow-2xl hover:shadow-black/30'
      }`}
      style={{
        ...getStyleColors(),
        ...(match.winnerIndex !== undefined && {
          borderColor: settings.primaryColor,
          ringColor: settings.primaryColor,
        }),
      }}
      onClick={openDetails}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openDetails();
        }
      }}
    >
      <motion.div
        layout
        className="absolute inset-x-0 top-0 h-1.5"
        style={{
          backgroundImage: `linear-gradient(90deg, ${settings.primaryColor}, ${accentColor})`,
        }}
      />
      {match.winnerIndex !== undefined && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2"
        >
          <div 
            className="flex h-8 w-8 items-center justify-center rounded-full shadow-lg"
            style={{
              backgroundColor: settings.primaryColor,
            }}
          >
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </motion.div>
      )}
      <div className="mb-4 flex items-start justify-between gap-3 text-xs" style={{ color: '#F2F1EF', opacity: 0.8 }}>
        <div className="space-y-1">
          <span 
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold tracking-wide"
            style={{ 
              backgroundColor: '#2D3E5A',
              color: '#F2F1EF',
            }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accentColor }} />
            {match.id.toUpperCase()}
          </span>
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-widest" style={{ color: '#F2F1EF', opacity: 0.6 }}>
            <span>{match.details?.title ?? `Ronde ${roundIndex + 1}`}</span>
            {match.startTime && (
              <>
                <span style={{ color: '#F2F1EF', opacity: 0.3 }}>•</span>
                <span>{match.startTime}</span>
              </>
            )}
            {match.court && (
              <>
                <span style={{ color: '#F2F1EF', opacity: 0.3 }}>•</span>
                <span>{match.court}</span>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={(event) => openDetails(event)}
          className="flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-widest transition"
          style={{
            borderColor: '#2D3E5A',
            backgroundColor: '#1A2335',
            color: '#F2F1EF',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#482CFF';
            e.currentTarget.style.backgroundColor = '#2D3E5A';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#2D3E5A';
            e.currentTarget.style.backgroundColor = '#1A2335';
          }}
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6m0 6h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Info
        </button>
      </div>

      {match.details?.subtitle && (
        <div 
          className="mb-4 rounded-xl border p-3 text-center text-sm"
          style={{
            borderColor: '#2D3E5A',
            backgroundColor: '#1A2335',
            color: '#F2F1EF',
            opacity: 0.9,
          }}
        >
          {match.details.subtitle}
        </div>
      )}

      <div className="space-y-2">
        <TeamSlot
          team={match.teams[0]}
          matchId={match.id}
          teamIndex={0}
          isWinner={match.winnerIndex === 0}
        />
        
        <div className="relative flex items-center justify-center py-2">
          <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <span 
            className="relative rounded-full border-2 px-4 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur-sm"
            style={{
              borderColor: settings.secondaryColor,
              backgroundColor: `${settings.secondaryColor}20`,
              color: settings.secondaryColor,
            }}
          >
            VS
          </span>
        </div>
        
        <TeamSlot
          team={match.teams[1]}
          matchId={match.id}
          teamIndex={1}
          isWinner={match.winnerIndex === 1}
        />
      </div>

      {match.winnerIndex !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 space-y-3"
        >
          <div className="rounded-xl border-2 px-4 py-3 text-center"
            style={{ 
              borderColor: settings.primaryColor,
              backgroundColor: `${settings.primaryColor}15`,
            }}
          >
            <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#F2F1EF', opacity: 0.7 }}>
              Winnaar
            </div>
            <div className="flex items-center justify-center gap-2">
              <div 
                className="text-base font-bold"
                style={{ color: settings.primaryColor }}
              >
                {match.teams[match.winnerIndex]?.name}
              </div>
              {match.teams[match.winnerIndex]?.score !== undefined && (
                <span 
                  className="text-sm font-bold rounded-full px-2 py-0.5"
                  style={{ 
                    backgroundColor: settings.primaryColor,
                    color: 'white'
                  }}
                >
                  {match.teams[match.winnerIndex]?.score}
                </span>
              )}
            </div>
            {(match.teams[0]?.score !== undefined || match.teams[1]?.score !== undefined) && (
              <div className="mt-2 text-xs" style={{ color: '#F2F1EF', opacity: 0.7 }}>
                {match.teams[0]?.score ?? 0} - {match.teams[1]?.score ?? 0}
              </div>
            )}
          </div>
          
          {nextMatch && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border-2 px-4 py-3"
              style={{ 
                borderColor: settings.secondaryColor,
                backgroundColor: `${settings.secondaryColor}20`,
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: settings.secondaryColor }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
                <span 
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: settings.secondaryColor }}
                >
                  Volgende tegenstander
                </span>
              </div>
              {nextMatch.opponent ? (
                <div className="text-center">
                  <div 
                    className="text-lg font-bold mb-1"
                    style={{ color: settings.secondaryColor }}
                  >
                    {nextMatch.opponent.name}
                  </div>
                  <div className="text-xs" style={{ color: '#F2F1EF', opacity: 0.7 }}>
                    in {rounds[roundIndex + 1]?.name}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div 
                    className="text-sm font-semibold"
                    style={{ color: settings.secondaryColor }}
                  >
                    Wacht op tegenstander
                  </div>
                  <div className="text-xs mt-1" style={{ color: '#F2F1EF', opacity: 0.7 }}>
                    in {rounds[roundIndex + 1]?.name}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          background: `radial-gradient(circle at 20% 20%, ${settings.primaryColor}20 0%, transparent 60%), radial-gradient(circle at 80% 30%, ${accentColor}25 0%, transparent 55%), radial-gradient(circle at 50% 80%, ${settings.secondaryColor}15 0%, transparent 60%)`,
        }}
      />
    </motion.article>
  );
}

