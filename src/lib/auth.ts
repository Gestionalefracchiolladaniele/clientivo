import { createClient } from './supabase-server';
import { redirect } from 'next/navigation';

export async function getSession() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) redirect('/auth/login');
  return user;
}

export async function getAccount() {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', user.id)
    .single();
  return data;
}
