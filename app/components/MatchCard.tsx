'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Match } from '@/app/types/bracket';
import { useBracketStore } from '@/app/store/bracketStore';
import type { MouseEvent } from 'react';
import { useMemo, useState, useEffect } from 'react';

interface MatchCardProps {
  match: Match;
  roundIndex: number;
}

const hexToRgba = (hex: string, alpha = 1) => {
  let sanitized = hex.replace('#', '');
  if (sanitized.length === 3) {
    sanitized = sanitized
      .split('')
      .map((char) => char + char)
      .join('');
  }
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function MatchCard({ match, roundIndex }: MatchCardProps) {
  const { settings, setSelectedMatch, getActiveBracket } = useBracketStore();
  const activeBracket = getActiveBracket();
  const rounds = activeBracket?.rounds ?? [];
  
  // Automatisch uitklappen als wedstrijd een winnaar heeft (recent afgerond)
  const shouldInitiallyExpand = match.winnerIndex !== undefined;
  const [isExpanded, setIsExpanded] = useState(shouldInitiallyExpand);
  
  // Update expanded state when match becomes completed
  useEffect(() => {
    if (match.winnerIndex !== undefined) {
      setIsExpanded(true);
    }
  }, [match.winnerIndex]);
  
  // Find the next match for the winner (or for both teams if no winner yet)
  const nextMatch = useMemo(() => {
    if (roundIndex >= rounds.length - 1) {
      return null;
    }
    
    const nextRound = rounds[roundIndex + 1];
    if (!nextRound) return null;
    
    // Calculate which match in the next round this match's winner goes to
    const nextMatchIndex = Math.floor(match.matchIndex / 2);
    const nextMatch = nextRound.matches[nextMatchIndex];
    
    if (!nextMatch) return null;
    
    // If there's a winner, show next match for winner
    if (match.winnerIndex !== undefined) {
      const winnerSlot = match.matchIndex % 2;
      const opponentSlot = winnerSlot === 0 ? 1 : 0;
      const opponent = nextMatch.teams[opponentSlot];
      
      return {
        match: nextMatch,
        opponent: opponent,
        opponentSlot: opponentSlot,
        winner: match.teams[match.winnerIndex],
      };
    }
    
    // If no winner yet, still show the next match info
    return {
      match: nextMatch,
      opponent: null,
      opponentSlot: null,
      winner: null,
    };
  }, [match, roundIndex, rounds]);
  
  // Get potential next match info for both teams (if match not finished)
  const potentialNextMatches = useMemo(() => {
    if (match.winnerIndex !== undefined || roundIndex >= rounds.length - 1) {
      return null;
    }
    
    const nextRound = rounds[roundIndex + 1];
    if (!nextRound) return null;
    
    const nextMatchIndex = Math.floor(match.matchIndex / 2);
    const nextMatch = nextRound.matches[nextMatchIndex];
    
    if (!nextMatch) return null;
    
    return {
      match: nextMatch,
      team0: match.teams[0],
      team1: match.teams[1],
    };
  }, [match, roundIndex, rounds]);
  const animationDuration = 0.15; // Fast animations

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

  const getCardVisuals = () => {
    const baseBackground = settings.backgroundColor ?? '#0F172A';
    const secondary = settings.secondaryColor ?? '#2D3E5A';
    const primary = settings.primaryColor ?? '#482CFF';

    return {
      borderColor: hexToRgba(secondary, 0.5),
      background: `linear-gradient(135deg, ${hexToRgba(baseBackground, 0.9)}, ${hexToRgba(
        secondary,
        0.25
      )})`,
      boxShadow:
        match.winnerIndex !== undefined
          ? `0 0 0 1px ${hexToRgba(primary, 0.7)}, 0 18px 40px rgba(0,0,0,0.45)`
          : '0 14px 28px rgba(3,7,18,0.45)',
      accentBorder: hexToRgba(primary, 0.7),
      accentFill: hexToRgba(primary, 0.15),
    };
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

  const toggleExpand = (event?: React.MouseEvent | React.KeyboardEvent) => {
    event?.stopPropagation();
    event?.preventDefault();
    setIsExpanded(!isExpanded);
  };

  const visuals = getCardVisuals();

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: animationDuration }}
      className={`relative overflow-hidden rounded-2xl shadow-xl shadow-black/20 transition-all duration-300 ${getStyleClasses()} ${getThemeClasses()} ${
        match.winnerIndex !== undefined 
          ? '' 
          : 'hover:shadow-2xl hover:shadow-black/30'
      }`}
      style={{
        borderColor: visuals.borderColor,
        background: visuals.background,
        boxShadow: visuals.boxShadow,
      }}
    >
      <motion.div
        layout
        className="absolute inset-x-0 top-0 h-1.5"
        style={{
          backgroundColor: match.winnerIndex !== undefined ? visuals.accentBorder : settings.primaryColor,
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
      
      {/* Collapsed/Summary View */}
      <div 
        className="p-3 cursor-pointer hover:opacity-90 transition-opacity"
        onClick={toggleExpand}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            toggleExpand(event);
          }
        }}
      >
        <div className="flex flex-col gap-3 w-full">
          {/* Top row - Time, Court, and Actions */}
          <div className="flex items-center justify-between gap-3">
            {/* Time and Court */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {match.startTime && (
                <span 
                  className="inline-flex items-center gap-0.5 text-[10px] font-medium flex-shrink-0"
                  style={{ color: settings.secondaryColor }}
                >
                  <svg
                    className="h-2.5 w-2.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {match.startTime}
                </span>
              )}
              {match.court && (
                <span 
                  className="text-[10px] flex-shrink-0"
                  style={{ color: '#F2F1EF', opacity: 0.6 }}
                >
                  • {match.court}
                </span>
              )}
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openDetails(event);
                }}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition"
                style={{
                  borderColor: '#2D3E5A',
                  backgroundColor: '#1A2335',
                  color: '#F2F1EF',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = settings.primaryColor;
                  e.currentTarget.style.backgroundColor = `${settings.primaryColor}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#2D3E5A';
                  e.currentTarget.style.backgroundColor = '#1A2335';
                }}
                title="Bekijk details"
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Details</span>
              </button>
              <motion.button
                type="button"
                onClick={toggleExpand}
                className="flex items-center justify-center rounded-full border p-1.5 transition"
                style={{
                  borderColor: '#2D3E5A',
                  backgroundColor: '#1A2335',
                  color: '#F2F1EF',
                }}
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
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
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </motion.button>
            </div>
          </div>

          {/* Teams - Full width layout */}
          <div className="flex items-center justify-between gap-3 w-full">
            {/* Team 1 */}
            <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
              {match.teams[0]?.logo && (
                <img
                  src={match.teams[0].logo}
                  alt={match.teams[0]?.name ?? 'Team logo'}
                  className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                />
              )}
              <div 
                className={`min-w-0 text-base font-bold leading-snug break-words ${match.winnerIndex === 0 ? '' : 'opacity-70'}`}
                style={{ 
                  color: match.winnerIndex === 0 ? settings.primaryColor : '#F2F1EF',
                  wordBreak: 'break-word',
                }}
              >
                {match.teams[0]?.name ?? 'TBD'}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {match.winnerIndex === 0 && (
                  <div 
                    className="flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0"
                    style={{ backgroundColor: settings.primaryColor }}
                    title="Winnaar"
                  >
                    <svg
                      className="h-3 w-3 text-white"
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
                )}
                {(match.teams[0]?.score !== undefined && match.teams[0].score !== null) && (
                  <div
                    className={`rounded-md border px-2.5 py-1 text-sm font-bold flex-shrink-0 ${
                      match.winnerIndex === 0 
                        ? '' 
                        : 'opacity-60'
                    }`}
                    style={{
                      borderColor: match.winnerIndex === 0 ? visuals.accentBorder : '#2D3E5A',
                      backgroundColor:
                        match.winnerIndex === 0 ? visuals.accentFill : '#0F172A',
                      color: match.winnerIndex === 0 ? settings.primaryColor : '#F2F1EF',
                    }}
                  >
                    {match.teams[0].score}
                  </div>
                )}
              </div>
            </div>
            
            {/* VS separator */}
            <span 
              className="text-sm font-semibold flex-shrink-0 px-2"
              style={{ color: '#F2F1EF', opacity: 0.5 }}
            >
              vs
            </span>
            
            {/* Team 2 */}
            <div className="flex-1 min-w-0 flex items-center gap-2 justify-end flex-wrap">
              {match.teams[1]?.logo && (
                <img
                  src={match.teams[1].logo}
                  alt={match.teams[1]?.name ?? 'Team logo'}
                  className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                />
              )}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {(match.teams[1]?.score !== undefined && match.teams[1].score !== null) && (
                  <div
                    className={`rounded-md border px-2.5 py-1 text-sm font-bold flex-shrink-0 ${
                      match.winnerIndex === 1 
                        ? '' 
                        : 'opacity-60'
                    }`}
                    style={{
                      borderColor: match.winnerIndex === 1 ? visuals.accentBorder : '#2D3E5A',
                      backgroundColor:
                        match.winnerIndex === 1 ? visuals.accentFill : '#0F172A',
                      color: match.winnerIndex === 1 ? settings.primaryColor : '#F2F1EF',
                    }}
                  >
                    {match.teams[1].score}
                  </div>
                )}
                {match.winnerIndex === 1 && (
                  <div 
                    className="flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0"
                    style={{ backgroundColor: settings.primaryColor }}
                    title="Winnaar"
                  >
                    <svg
                      className="h-3 w-3 text-white"
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
                )}
              </div>
              <div 
                className={`min-w-0 text-base font-bold leading-snug text-right break-words ${match.winnerIndex === 1 ? '' : 'opacity-70'}`}
                style={{ 
                  color: match.winnerIndex === 1 ? settings.primaryColor : '#F2F1EF',
                  wordBreak: 'break-word',
                }}
              >
                {match.teams[1]?.name ?? 'TBD'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded/Detailed View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 space-y-4 border-t" style={{ borderColor: '#2D3E5A' }} onClick={(e) => e.stopPropagation()}>
              {/* Prize Info */}
              {match.details?.prizeInfo && (
                <div 
                  className="rounded-xl border-2 p-4"
                  style={{
                    borderColor: settings.primaryColor,
                    backgroundColor: `${settings.primaryColor}10`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: settings.primaryColor }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: settings.primaryColor }}>
                      Te Verdienen Prijzen
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#F2F1EF', opacity: 0.9 }}>
                    {match.details.prizeInfo}
                  </p>
                </div>
              )}

              {/* Next Match */}
              {nextMatch && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-xl border-2 p-4"
                  style={{ 
                    borderColor: settings.secondaryColor,
                    backgroundColor: `${settings.secondaryColor}20`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <svg
                      className="h-5 w-5"
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
                      className="text-sm font-semibold uppercase tracking-widest"
                      style={{ color: settings.secondaryColor }}
                    >
                      {match.winnerIndex !== undefined ? 'Volgende Match' : 'Volgende Match (bij winst)'}
                    </span>
                  </div>
                  
                  {match.winnerIndex !== undefined ? (
                    // Match finished - show next match for winner
                    <>
                      {nextMatch.opponent ? (
                        <div className="space-y-2">
                          <div className="text-xs mb-2" style={{ color: '#F2F1EF', opacity: 0.6 }}>
                            Winnaar speelt tegen:
                          </div>
                          <div 
                            className="text-lg font-bold"
                            style={{ color: settings.secondaryColor }}
                          >
                            {nextMatch.opponent.name}
                          </div>
                          <div className="text-xs" style={{ color: '#F2F1EF', opacity: 0.7 }}>
                            in {rounds[roundIndex + 1]?.name}
                          </div>
                          {nextMatch.match.startTime && (
                            <div className="text-xs flex items-center gap-1.5 mt-2" style={{ color: '#F2F1EF', opacity: 0.7 }}>
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
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {nextMatch.match.startTime}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div 
                            className="text-base font-semibold"
                            style={{ color: settings.secondaryColor }}
                          >
                            Wacht op tegenstander
                          </div>
                          <div className="text-xs" style={{ color: '#F2F1EF', opacity: 0.7 }}>
                            in {rounds[roundIndex + 1]?.name}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    // Match not finished - show next match info for both teams
                    potentialNextMatches && (
                      <div className="space-y-3">
                        {/* Determine which slot the winner goes to */}
                        {(() => {
                          const winnerSlot = match.matchIndex % 2;
                          const opponentSlot = winnerSlot === 0 ? 1 : 0;
                          return (
                            <>
                              <div className="space-y-2">
                                {potentialNextMatches.match.teams[opponentSlot] ? (
                                  <>
                                    <div className="text-sm font-bold" style={{ color: settings.secondaryColor }}>
                                      Tegen {potentialNextMatches.match.teams[opponentSlot].name}
                                    </div>
                                    <div className="text-xs" style={{ color: '#F2F1EF', opacity: 0.7 }}>
                                      in {rounds[roundIndex + 1]?.name}
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-xs" style={{ color: '#F2F1EF', opacity: 0.7 }}>
                                    Wacht op tegenstander in {rounds[roundIndex + 1]?.name}
                                  </div>
                                )}
                              </div>
                            </>
                          );
                        })()}
                        {potentialNextMatches.match.startTime && (
                          <div className="text-xs flex items-center gap-1.5 pt-2 border-t" style={{ borderColor: '#2D3E5A', color: '#F2F1EF', opacity: 0.7 }}>
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
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Volgende match: {potentialNextMatches.match.startTime}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.article>
  );
}

