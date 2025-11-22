'use client';

import { motion } from 'framer-motion';
import { useBracketStore } from '@/app/store/bracketStore';
import type { Team } from '@/app/types/bracket';
import type { ChangeEvent, MouseEvent, CSSProperties } from 'react';

interface TeamSlotProps {
  team: Team | null;
  matchId: string;
  teamIndex: number;
  isWinner?: boolean;
}

export default function TeamSlot({
  team,
  matchId,
  teamIndex,
  isWinner = false,
}: TeamSlotProps) {
  const { settings, setWinner, setTeamScore, isAdminMode } = useBracketStore();
  const animationDuration = 0.15; // Fast animations

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!isAdminMode) return;
    event.stopPropagation();
    if (!team) return;
    setWinner(matchId, teamIndex);
  };

  const handleScoreChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isAdminMode) return;
    const value = event.target.value;
    const parsed = value === '' ? 0 : Math.max(0, parseInt(value, 10) || 0);
    setTeamScore(matchId, teamIndex, parsed);
  };

  if (!team) {
    return (
      <div 
        className="flex h-12 items-center rounded-lg border border-dashed px-3 text-sm"
        style={{
          borderColor: '#2D3E5A',
          backgroundColor: '#1A2335',
          color: '#F2F1EF',
          opacity: 0.5,
        }}
      >
        <span>—</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: animationDuration }}
      onClick={handleClick}
      className={`group relative flex h-12 items-center justify-between rounded-lg border px-3 transition-all ${
        isAdminMode && team ? 'cursor-pointer' : 'cursor-default'
      }`}
      style={{
        borderColor: isWinner ? settings.primaryColor : '#2D3E5A',
        backgroundColor: isWinner
          ? `${settings.primaryColor}20`
          : '#1A2335',
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
          className="truncate font-medium"
          style={{ color: '#F2F1EF' }}
        >
          {team.name}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {isAdminMode ? (
          <input
            type="number"
            min="0"
            max="999"
            value={team.score ?? ''}
            onChange={handleScoreChange}
            onClick={(event) => event.stopPropagation()}
            onFocus={(event) => event.stopPropagation()}
            placeholder="0"
            className="h-8 w-16 rounded-lg border-2 px-2 text-center text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-transparent"
            style={
              {
                borderColor: '#2D3E5A',
                backgroundColor: '#111827',
                color: '#F2F1EF',
                '--tw-ring-color': settings.secondaryColor,
              } as CSSProperties & Record<string, string>
            }
          />
        ) : (
          <div
            className="min-w-[3rem] rounded-md border border-white/10 px-3 py-1 text-center text-sm font-bold text-white"
            style={{ backgroundColor: '#0F172A' }}
          >
            {team.score ?? '—'}
          </div>
        )}
        {isWinner && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex h-6 w-6 items-center justify-center rounded-full shadow-lg"
            style={{ backgroundColor: settings.primaryColor }}
          >
            <svg
              className="h-4 w-4 text-white"
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
    </motion.div>
  );
}

