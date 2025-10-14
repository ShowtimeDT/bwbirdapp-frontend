import { createClient } from '@supabase/supabase-js';

export const supa = createClient(
  import.meta.env.VITE_SUPABASE_URL, 
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export async function getAccessToken() {
  const { data } = await supa.auth.getSession();
  return data?.session?.access_token || null;
}

export async function signInWithEmail(email) {
  const { data, error } = await supa.auth.signInWithOtp({ email });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supa.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supa.auth.getUser();
  return user;
}
