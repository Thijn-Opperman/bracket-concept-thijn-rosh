import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('❌ Supabase environment variables missing!');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', url ? '✅' : '❌ Missing');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', key ? '✅' : '❌ Missing');
    throw new Error('Supabase environment variables are not set. Check your .env.local file.');
  }

  try {
    return createBrowserClient(url, key);
  } catch (error) {
    console.error('❌ Error creating Supabase client:', error);
    throw error;
  }
}
