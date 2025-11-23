'use client';

import BracketContainer from '@/app/components/BracketContainer';
import { useBracketStore } from '@/app/store/bracketStore';

export default function Home() {
  const { settings } = useBracketStore();

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: settings.backgroundColor,
        color: '#F2F1EF',
      }}
    >
      <BracketContainer />
    </div>
  );
}
