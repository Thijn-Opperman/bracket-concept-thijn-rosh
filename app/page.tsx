'use client';

import BracketContainer from '@/app/components/BracketContainer';
import { useBracketStore } from '@/app/store/bracketStore';
import { useSyncExternalStore } from 'react';

export default function Home() {
  const { settings } = useBracketStore();
  const isHydrated = useSyncExternalStore(
    (callback) => {
      const unsub = useBracketStore.persist.onFinishHydration(callback);
      if (useBracketStore.persist.hasHydrated()) {
        callback();
      }
      return () => {
        unsub?.();
      };
    },
    () => useBracketStore.persist.hasHydrated(),
    () => true
  );

  // Use default background color if not hydrated yet
  const backgroundColor = isHydrated ? settings.backgroundColor : '#111827';

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor,
        color: '#F2F1EF',
      }}
    >
      <BracketContainer />
    </div>
  );
}
