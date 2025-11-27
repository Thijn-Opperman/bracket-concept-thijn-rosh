'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useBracketStore } from '@/app/store/bracketStore';
import type { Team } from '@/app/types/bracket';

interface TeamSlotProps {
  team: Team | null;
  isWinner?: boolean;
}

export default function TeamSlot({
  team,
  isWinner = false,
}: TeamSlotProps) {
  const { settings } = useBracketStore();
  const animationDuration = 0.15; // Fast animations

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
      className="group relative flex h-12 items-center justify-between rounded-lg border px-3 transition-all cursor-default"
      style={{
        borderColor: isWinner ? settings.primaryColor : '#2D3E5A',
        backgroundColor: isWinner
          ? `${settings.primaryColor}20`
          : '#1A2335',
      }}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {team.logo && (
          <Image
            src={team.logo}
            alt={team.name}
            width={24}
            height={24}
            unoptimized
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
        <div
          className="min-w-[3rem] rounded-md border border-white/10 px-3 py-1 text-center text-sm font-bold text-white"
          style={{ backgroundColor: '#0F172A' }}
        >
          {team.score ?? '—'}
        </div>
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

