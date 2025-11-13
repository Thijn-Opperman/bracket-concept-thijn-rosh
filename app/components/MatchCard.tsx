'use client';

import { motion } from 'framer-motion';
import type { Match } from '@/app/types/bracket';
import TeamSlot from './TeamSlot';
import { useBracketStore } from '@/app/store/bracketStore';
import confetti from 'canvas-confetti';
import type { MouseEvent } from 'react';

interface MatchCardProps {
  match: Match;
  roundIndex: number;
}

export default function MatchCard({ match, roundIndex }: MatchCardProps) {
  const { settings, setWinner, setSelectedMatch } = useBracketStore();
  const speedMap = {
    slow: 0.6,
    normal: 0.3,
    fast: 0.15,
  };

  const handleWinnerSelect = (teamIndex: number) => {
    setWinner(match.id, teamIndex);
    
    if (settings.enableConfetti) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: [settings.primaryColor, settings.secondaryColor],
      });
    }

    if (settings.enableSounds) {
      // Simple sound effect using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  };

  const openDetails = (event?: MouseEvent<HTMLElement>) => {
    event?.stopPropagation();
    setSelectedMatch(match.id);
  };

  const getStyleClasses = () => {
    switch (settings.bracketStyle) {
      case 'classic':
        return 'border-2 border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-transparent';
      case 'modern':
        return 'border border-white/10 bg-gradient-to-br from-white/10/40 to-white/5 backdrop-blur-sm';
      case 'playful':
        return 'border-2 border-dashed border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 shadow-lg shadow-black/40';
      default:
        return 'border border-white/10 bg-white/10';
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
      className={`relative overflow-hidden rounded-2xl p-5 shadow-xl shadow-black/20 ${getStyleClasses()} ${getThemeClasses()}`}
      style={{
        borderColor: match.winnerIndex !== undefined ? settings.primaryColor : undefined,
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
      <div className="mb-4 flex items-start justify-between gap-3 text-xs text-white/70">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-semibold tracking-wide text-white">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accentColor }} />
            {match.id.toUpperCase()}
          </span>
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-widest text-white/50">
            <span>{match.details?.title ?? `Ronde ${roundIndex + 1}`}</span>
            {match.startTime && (
              <>
                <span className="text-white/20">•</span>
                <span>{match.startTime}</span>
              </>
            )}
            {match.court && (
              <>
                <span className="text-white/20">•</span>
                <span>{match.court}</span>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={(event) => openDetails(event)}
          className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/80 transition hover:border-white/40 hover:bg-white/20"
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
        <div className="mb-4 rounded-xl border border-white/10 bg-white/10 p-3 text-center text-sm text-white/80">
          {match.details.subtitle}
        </div>
      )}

      <div className="space-y-2">
        <TeamSlot
          team={match.teams[0]}
          matchId={match.id}
          teamIndex={0}
          isWinner={match.winnerIndex === 0}
          isClickable={match.winnerIndex === undefined && match.teams[0] !== null}
          onSelect={() => handleWinnerSelect(0)}
        />
        
        <div className="flex items-center justify-center py-1">
          <span className="text-xs text-white/40">VS</span>
        </div>
        
        <TeamSlot
          team={match.teams[1]}
          matchId={match.id}
          teamIndex={1}
          isWinner={match.winnerIndex === 1}
          isClickable={match.winnerIndex === undefined && match.teams[1] !== null}
          onSelect={() => handleWinnerSelect(1)}
        />
      </div>

      {match.winnerIndex !== undefined && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 rounded-full bg-white/10 px-4 py-2 text-center text-xs font-semibold tracking-widest uppercase"
          style={{ color: settings.primaryColor }}
        >
          Winnaar: {match.teams[match.winnerIndex]?.name}
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

