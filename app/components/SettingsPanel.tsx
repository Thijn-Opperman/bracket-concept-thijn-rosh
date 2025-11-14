'use client';

import { useBracketStore } from '@/app/store/bracketStore';
import type { AnimationSpeed, BracketType } from '@/app/types/bracket';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function SettingsPanel() {
  const { settings, setSettings, resetBracket } = useBracketStore();
  const [isOpen, setIsOpen] = useState(true);


  const animationSpeeds: { value: AnimationSpeed; label: string }[] = [
    { value: 'slow', label: 'Traag' },
    { value: 'normal', label: 'Normaal' },
    { value: 'fast', label: 'Snel' },
  ];

  const bracketTypes: { 
    value: BracketType; 
    label: string; 
    description: string; 
    icon: string;
    features: string[];
  }[] = [
    { 
      value: 'single-elimination', 
      label: 'Single Elimination',
      description: 'Winnaar gaat door, verliezer is uit. Eén misstap en je ligt eruit.',
      icon: '⚔️',
      features: ['Eén verlies = uitgeschakeld', 'Snelle toernooien', 'Klassieke bracket structuur']
    },
    { 
      value: 'double-elimination', 
      label: 'Double Elimination',
      description: 'Tweede kansen bestaan. Verliezers gaan naar de losers bracket.',
      icon: '🔄',
      features: ['Tweede kans voor verliezers', 'Losers bracket', 'Meer wedstrijden']
    },
    { 
      value: 'round-robin', 
      label: 'Round Robin',
      description: 'Iedereen speelt tegen iedereen. Consistentie beslist de winnaar.',
      icon: '🎯',
      features: ['Alle teams spelen elkaar', 'Meeste punten wint', 'Eerlijkste competitie']
    },
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
        className="fixed left-4 top-4 z-50 rounded-lg p-3 backdrop-blur-md lg:hidden"
        style={{ backgroundColor: '#1A2335', borderColor: '#2D3E5A' }}
        aria-label="Toggle settings"
      >
        <svg
          className="h-6 w-6"
          style={{ color: '#F2F1EF' }}
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
            className="fixed left-0 top-0 z-40 h-full w-72 overflow-y-auto border-r p-4 backdrop-blur-md sm:w-80 sm:p-6 lg:relative lg:z-auto lg:h-auto lg:border-r"
            style={{
              borderColor: '#2D3E5A',
              backgroundColor: '#1A2335',
            }}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold" style={{ color: '#F2F1EF' }}>Instellingen</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="lg:hidden"
                aria-label="Close settings"
              >
                <svg
                  className="h-6 w-6"
          style={{ color: '#F2F1EF' }}
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
                <label className="mb-4 block text-sm font-medium" style={{ color: '#F2F1EF' }}>
                  Bracket Type
                </label>
                <div className="space-y-3">
                  {bracketTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setSettings({ bracketType: type.value })}
                      className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                        settings.bracketType === type.value
                          ? 'border-[#482CFF] bg-[#482CFF]/20 shadow-lg shadow-[#482CFF]/20'
                          : 'border-[#2D3E5A] bg-[#1A2335] hover:border-[#482CFF]/50 hover:bg-[#1A2335]/80'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{type.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold" style={{ color: '#F2F1EF' }}>{type.label}</h3>
                            {settings.bracketType === type.value && (
                              <div className="h-2 w-2 rounded-full bg-[#482CFF]" />
                            )}
                          </div>
                          <p className="text-xs mb-2" style={{ color: '#F2F1EF', opacity: 0.8 }}>{type.description}</p>
                          <ul className="space-y-1">
                            {type.features.map((feature, idx) => (
                              <li key={idx} className="text-xs flex items-center gap-2" style={{ color: '#F2F1EF', opacity: 0.7 }}>
                                <span className="text-[#482CFF]">•</span>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Teams */}
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: '#F2F1EF' }}>
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
                <div className="mt-1 flex justify-between text-xs" style={{ color: '#F2F1EF', opacity: 0.7 }}>
                  <span>4</span>
                  <span>32</span>
                </div>
              </div>

              {/* Primary Color */}
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: '#F2F1EF' }}>
                  Primaire Kleur
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) =>
                      setSettings({ primaryColor: e.target.value })
                    }
                    className="h-10 w-20 cursor-pointer rounded-lg border"
                    style={{ borderColor: '#2D3E5A' }}
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) =>
                      setSettings({ primaryColor: e.target.value })
                    }
                    className="flex-1 rounded-lg border px-4 py-2 focus:outline-none"
                    style={{
                      borderColor: '#2D3E5A',
                      backgroundColor: '#111827',
                      color: '#F2F1EF',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#482CFF'}
                    onBlur={(e) => e.target.style.borderColor = '#2D3E5A'}
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: '#F2F1EF' }}>
                  Secundaire Kleur
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) =>
                      setSettings({ secondaryColor: e.target.value })
                    }
                    className="h-10 w-20 cursor-pointer rounded-lg border"
                    style={{ borderColor: '#2D3E5A' }}
                  />
                  <input
                    type="text"
                    value={settings.secondaryColor}
                    onChange={(e) =>
                      setSettings({ secondaryColor: e.target.value })
                    }
                    className="flex-1 rounded-lg border px-4 py-2 focus:outline-none"
                    style={{
                      borderColor: '#2D3E5A',
                      backgroundColor: '#111827',
                      color: '#F2F1EF',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#482CFF'}
                    onBlur={(e) => e.target.style.borderColor = '#2D3E5A'}
                  />
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: '#F2F1EF' }}>
                  Achtergrond Kleur
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.backgroundColor}
                    onChange={(e) =>
                      setSettings({ backgroundColor: e.target.value })
                    }
                    className="h-10 w-20 cursor-pointer rounded-lg border"
                    style={{ borderColor: '#2D3E5A' }}
                  />
                  <input
                    type="text"
                    value={settings.backgroundColor}
                    onChange={(e) =>
                      setSettings({ backgroundColor: e.target.value })
                    }
                    className="flex-1 rounded-lg border px-4 py-2 focus:outline-none"
                    style={{
                      borderColor: '#2D3E5A',
                      backgroundColor: '#111827',
                      color: '#F2F1EF',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#482CFF'}
                    onBlur={(e) => e.target.style.borderColor = '#2D3E5A'}
                  />
                </div>
              </div>

              {/* Animation Speed */}
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: '#F2F1EF' }}>
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
                          ? 'border-[#482CFF] bg-[#482CFF]/20'
                          : 'border-[#2D3E5A] bg-[#1A2335] hover:border-[#482CFF]/50'
                      }`}
                      style={{
                        color: '#F2F1EF',
                      }}
                    >
                      {speed.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: '#F2F1EF' }}>
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
                  <span className="text-sm font-medium" style={{ color: '#F2F1EF' }}>
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
                  <span className="text-sm font-medium" style={{ color: '#F2F1EF' }}>
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

