'use client';

import { motion } from 'framer-motion';
import { useBracketStore } from '@/app/store/bracketStore';
import type { Team } from '@/app/types/bracket';
import type { ChangeEvent, MouseEvent } from 'react';

interface TeamSlotProps {
  team: Team | null;
  matchId: string;
  teamIndex: number;
  isWinner?: boolean;
  isClickable?: boolean;
  onSelect?: () => void;
}

export default function TeamSlot({
  team,
  matchId,
  teamIndex,
  isWinner = false,
  isClickable = true,
  onSelect,
}: TeamSlotProps) {
  const { setTeamScore, setWinner, settings } = useBracketStore();
  const speedMap = {
    slow: 0.6,
    normal: 0.3,
    fast: 0.15,
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (!team || !isClickable) return;
    setWinner(matchId, teamIndex);
    onSelect?.();
  };

  const handleScoreChange = (e: ChangeEvent<HTMLInputElement>) => {
    const score = parseInt(e.target.value) || 0;
    setTeamScore(matchId, teamIndex, score);
  };

  if (!team) {
    return (
      <div className="flex h-12 items-center rounded-lg border border-dashed border-white/10 bg-white/5 px-3 text-sm text-white/40">
        <span>—</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: speedMap[settings.animationSpeed] }}
      whileHover={isClickable ? { scale: 1.02 } : {}}
      whileTap={isClickable ? { scale: 0.98 } : {}}
      onClick={handleClick}
      className={`group relative flex h-12 cursor-pointer items-center justify-between rounded-lg border px-3 transition-all ${
        isWinner
          ? 'border-white/40 bg-white/10 shadow-lg'
          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
      } ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
      style={{
        borderColor: isWinner ? settings.primaryColor : undefined,
        backgroundColor: isWinner
          ? `${settings.primaryColor}20`
          : undefined,
      }}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {team.logo && (
          <img
            src={team.logo}
            alt={team.name}
            className="h-6 w-6 rounded-full object-cover"
          />
        )}
        <span
          className={`truncate font-medium ${
            isWinner ? 'text-white' : 'text-white/90'
          }`}
        >
          {team.name}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          value={team.score ?? ''}
          onChange={handleScoreChange}
          onClick={(e) => e.stopPropagation()}
          placeholder="0"
          className="h-7 w-12 rounded border border-white/20 bg-black/30 px-2 text-center text-sm text-white focus:border-white/40 focus:outline-none"
        />
        {isWinner && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex h-5 w-5 items-center justify-center rounded-full"
            style={{ backgroundColor: settings.primaryColor }}
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
          </motion.div>
        )}
      </div>

      {isClickable && !isWinner && (
        <motion.div
          className="absolute inset-0 rounded-lg"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${settings.secondaryColor}20 100%)`,
          }}
        />
      )}
    </motion.div>
  );
}

