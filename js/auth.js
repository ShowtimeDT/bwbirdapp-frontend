// Uses Supabase JS via CDN ESM. Exposes a single client and helpers.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function getAccessToken() {
  const { data } = await supa.auth.getSession();
  return data?.session?.access_token || null;
}

// Minimal helpers for UI
export async function signInWithEmail(email) {
  return supa.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
}
export async function signOut() { return supa.auth.signOut(); }
export function onAuth(cb) { return supa.auth.onAuthStateChange((_e, session) => cb(session)); }