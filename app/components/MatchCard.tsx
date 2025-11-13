'use client';

import { motion } from 'framer-motion';
import type { Match } from '@/app/types/bracket';
import TeamSlot from './TeamSlot';
import { useBracketStore } from '@/app/store/bracketStore';
import confetti from 'canvas-confetti';

interface MatchCardProps {
  match: Match;
  roundIndex: number;
}

export default function MatchCard({ match, roundIndex }: MatchCardProps) {
  const { settings, setWinner } = useBracketStore();
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

  const getStyleClasses = () => {
    switch (settings.bracketStyle) {
      case 'classic':
        return 'border-2 border-white/20 bg-gradient-to-br from-white/5 to-white/10';
      case 'modern':
        return 'border border-white/10 bg-white/5 backdrop-blur-sm';
      case 'playful':
        return 'border-2 border-dashed border-white/20 bg-gradient-to-br from-white/10 to-white/5 shadow-lg';
      default:
        return 'border border-white/10 bg-white/5';
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

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: speedMap[settings.animationSpeed] }}
      className={`rounded-xl p-4 ${getStyleClasses()} ${getThemeClasses()}`}
      style={{
        borderColor: match.winnerIndex !== undefined ? settings.primaryColor : undefined,
      }}
    >
      <div className="mb-3 flex items-center justify-between text-xs text-white/60">
        <span className="rounded-full bg-white/10 px-2 py-1 font-semibold text-white/80">
          {match.id.toUpperCase()}
        </span>
        {match.startTime && (
          <span className="text-white/60">{match.startTime}</span>
        )}
        {match.court && (
          <span className="text-white/60">{match.court}</span>
        )}
      </div>

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
          className="mt-3 text-center text-xs font-semibold"
          style={{ color: settings.primaryColor }}
        >
          Winnaar: {match.teams[match.winnerIndex]?.name}
        </motion.div>
      )}
    </motion.article>
  );
}

