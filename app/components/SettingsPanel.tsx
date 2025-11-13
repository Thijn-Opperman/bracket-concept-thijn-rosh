'use client';

import { useBracketStore } from '@/app/store/bracketStore';
import type { BracketStyle, Theme, AnimationSpeed, BracketType } from '@/app/types/bracket';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function SettingsPanel() {
  const { settings, setSettings, resetBracket } = useBracketStore();
  const [isOpen, setIsOpen] = useState(true);

  const bracketStyles: { value: BracketStyle; label: string }[] = [
    { value: 'classic', label: 'Klassiek' },
    { value: 'modern', label: 'Modern' },
    { value: 'playful', label: 'Speels' },
  ];

  const themes: { value: Theme; label: string }[] = [
    { value: 'retro', label: 'Retro' },
    { value: 'futuristic', label: 'Futuristisch' },
    { value: 'sporty', label: 'Sportief' },
  ];

  const animationSpeeds: { value: AnimationSpeed; label: string }[] = [
    { value: 'slow', label: 'Traag' },
    { value: 'normal', label: 'Normaal' },
    { value: 'fast', label: 'Snel' },
  ];

  const bracketTypes: { value: BracketType; label: string }[] = [
    { value: 'single-elimination', label: 'Single Elimination' },
    { value: 'double-elimination', label: 'Double Elimination' },
    { value: 'round-robin', label: 'Round Robin' },
  ];

  const speedMap = {
    slow: 0.6,
    normal: 0.3,
    fast: 0.15,
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-white/10 p-3 backdrop-blur-md lg:hidden"
        aria-label="Toggle settings"
      >
        <svg
          className="h-6 w-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -400 }}
            animate={{ x: 0 }}
            exit={{ x: -400 }}
            transition={{ duration: speedMap[settings.animationSpeed] }}
            className="fixed left-0 top-0 z-40 h-full w-72 overflow-y-auto border-r border-white/10 bg-black/90 p-4 backdrop-blur-md sm:w-80 sm:p-6 lg:relative lg:z-auto lg:h-auto lg:border-r lg:border-white/10"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Instellingen</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="lg:hidden"
                aria-label="Close settings"
              >
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Bracket Type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Bracket Type
                </label>
                <select
                  value={settings.bracketType}
                  onChange={(e) =>
                    setSettings({ bracketType: e.target.value as BracketType })
                  }
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white focus:border-white/40 focus:outline-none"
                >
                  {bracketTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Number of Teams */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Aantal Teams: {settings.numTeams}
                </label>
                <input
                  type="range"
                  min="4"
                  max="32"
                  step="2"
                  value={settings.numTeams}
                  onChange={(e) =>
                    setSettings({ numTeams: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
                <div className="mt-1 flex justify-between text-xs text-white/60">
                  <span>4</span>
                  <span>32</span>
                </div>
              </div>

              {/* Primary Color */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Primaire Kleur
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) =>
                      setSettings({ primaryColor: e.target.value })
                    }
                    className="h-10 w-20 cursor-pointer rounded-lg border border-white/20"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) =>
                      setSettings({ primaryColor: e.target.value })
                    }
                    className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white focus:border-white/40 focus:outline-none"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Secundaire Kleur
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) =>
                      setSettings({ secondaryColor: e.target.value })
                    }
                    className="h-10 w-20 cursor-pointer rounded-lg border border-white/20"
                  />
                  <input
                    type="text"
                    value={settings.secondaryColor}
                    onChange={(e) =>
                      setSettings({ secondaryColor: e.target.value })
                    }
                    className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white focus:border-white/40 focus:outline-none"
                  />
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Achtergrond Kleur
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.backgroundColor}
                    onChange={(e) =>
                      setSettings({ backgroundColor: e.target.value })
                    }
                    className="h-10 w-20 cursor-pointer rounded-lg border border-white/20"
                  />
                  <input
                    type="text"
                    value={settings.backgroundColor}
                    onChange={(e) =>
                      setSettings({ backgroundColor: e.target.value })
                    }
                    className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white focus:border-white/40 focus:outline-none"
                  />
                </div>
              </div>

              {/* Bracket Style */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Bracket Stijl
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {bracketStyles.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => setSettings({ bracketStyle: style.value })}
                      className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                        settings.bracketStyle === style.value
                          ? 'border-white/40 bg-white/10 text-white'
                          : 'border-white/20 bg-white/5 text-white/70 hover:border-white/30'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Thema
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {themes.map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => setSettings({ theme: theme.value })}
                      className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                        settings.theme === theme.value
                          ? 'border-white/40 bg-white/10 text-white'
                          : 'border-white/20 bg-white/5 text-white/70 hover:border-white/30'
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Animation Speed */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Animatie Snelheid
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {animationSpeeds.map((speed) => (
                    <button
                      key={speed.value}
                      onClick={() =>
                        setSettings({ animationSpeed: speed.value })
                      }
                      className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                        settings.animationSpeed === speed.value
                          ? 'border-white/40 bg-white/10 text-white'
                          : 'border-white/20 bg-white/5 text-white/70 hover:border-white/30'
                      }`}
                    >
                      {speed.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">
                    Donkere Modus
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.darkMode}
                    onChange={(e) =>
                      setSettings({ darkMode: e.target.checked })
                    }
                    className="h-5 w-5 cursor-pointer rounded"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">
                    Confetti Effect
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.enableConfetti}
                    onChange={(e) =>
                      setSettings({ enableConfetti: e.target.checked })
                    }
                    className="h-5 w-5 cursor-pointer rounded"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">
                    Geluidseffecten
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.enableSounds}
                    onChange={(e) =>
                      setSettings({ enableSounds: e.target.checked })
                    }
                    className="h-5 w-5 cursor-pointer rounded"
                  />
                </label>
              </div>

              {/* Reset Button */}
              <button
                onClick={resetBracket}
                className="w-full rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20"
              >
                Reset Bracket
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

