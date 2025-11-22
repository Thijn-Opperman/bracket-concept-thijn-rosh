'use client';

import SettingsPanel from '@/app/components/SettingsPanel';
import BracketContainer from '@/app/components/BracketContainer';
import { useBracketStore } from '@/app/store/bracketStore';

export default function Home() {
  const { settings } = useBracketStore();

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
