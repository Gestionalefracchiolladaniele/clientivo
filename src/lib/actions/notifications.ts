'use server';

import { createClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { getEffectiveAccountId } from '@/lib/actions/account';

export async function getNotifications() {
  await requireAuth();
  const accountId = await getEffectiveAccountId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

export async function getUnreadCount() {
  await requireAuth();
  const accountId = await getEffectiveAccountId();
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', accountId)
    .eq('is_read', false);
  if (error) throw error;
  return count ?? 0;
}

export async function markAsRead(id: string) {
  await requireAuth();
  const supabase = await createClient();
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);
  if (error) throw error;
  revalidatePath('/app');
}

export async function markAllAsRead() {
  await requireAuth();
  const accountId = await getEffectiveAccountId();
  const supabase = await createClient();
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('account_id', accountId)
    .eq('is_read', false);
  if (error) throw error;
  revalidatePath('/app');
}
