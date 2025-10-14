import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Return the current session's access token (or null)
export async function getAccessToken() {
  const { data } = await supa.auth.getSession();
  return data?.session?.access_token || null;
}

export function onAuth(callback) {
  // fires immediately with current session + on changes
  supa.auth.getSession().then(({ data }) => callback(data?.session || null));
  return supa.auth.onAuthStateChange((_event, session) => callback(session));
}

// Username is optional at signup; we store it in user_metadata for now
export async function signUpWithPassword({ email, password, username }) {
  const { data, error } = await supa.auth.signUp({
    email,
    password,
    options: { data: username ? { username } : {} }
  });
  if (error) throw error;
  return data;
}

export async function signInWithPassword({ email, password }) {
  const { data, error } = await supa.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supa.auth.signOut();
  if (error) throw error;
}