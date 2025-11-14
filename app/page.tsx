'use client';

import SettingsPanel from '@/app/components/SettingsPanel';
import BracketContainer from '@/app/components/BracketContainer';
import { useBracketStore } from '@/app/store/bracketStore';
import { useEffect } from 'react';

export default function Home() {
  const { settings } = useBracketStore();

  useEffect(() => {
    // Apply dark mode to document
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  return (
    <div
      className="flex min-h-screen"
      style={{
        backgroundColor: settings.backgroundColor,
        color: '#F2F1EF',
      }}
    >
      <SettingsPanel />
      <BracketContainer />
    </div>
  );
}
