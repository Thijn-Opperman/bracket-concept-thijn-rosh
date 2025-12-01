'use client';

import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  // Lazy load environment variables - only on client side
  if (typeof window === 'undefined') {
    throw new Error('createClient can only be called on the client side');
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn(
      "Supabase variabelen ontbreken. Voeg NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY toe aan je environment."
    );
    // Don't throw - allow app to work without Supabase (optional feature)
    // Return a dummy client that will fail gracefully
  throw new Error(
    "Supabase variabelen ontbreken. Voeg NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY toe aan je environment."
  );
}

  return createBrowserClient(url, key);
};