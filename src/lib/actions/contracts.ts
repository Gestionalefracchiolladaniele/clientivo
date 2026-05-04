'use server';

import { createClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getContracts() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('contracts')
    .select('*, clients(name, company)')
    .eq('account_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getContract(id: string) {
  await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('contracts')
    .select('*, clients(name, company, email, phone), contract_items(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createContract(formData: {
  client_id: string;
  title: string;
  status?: 'active' | 'expired' | 'cancelled' | 'draft';
  start_date: string;
  end_date?: string;
  total_value?: number;
  notes?: string;
}) {
  const user = await requireAuth();
  const supabase = await createClient();
  const { error } = await supabase.from('contracts').insert({
    account_id: user.id,
    client_id: formData.client_id,
    title: formData.title,
    status: formData.status ?? 'draft',
    start_date: formData.start_date,
    end_date: formData.end_date || null,
    total_value: formData.total_value ?? 0,
    notes: formData.notes || null,
  });
  if (error) throw error;
  revalidatePath('/app/onedigit/contratti');
}

export async function updateContract(id: string, formData: {
  client_id?: string;
  title?: string;
  status?: 'active' | 'expired' | 'cancelled' | 'draft';
  start_date?: string;
  end_date?: string;
  total_value?: number;
  notes?: string;
}) {
  await requireAuth();
  const supabase = await createClient();
  const { error } = await supabase.from('contracts').update({
    client_id: formData.client_id,
    title: formData.title,
    status: formData.status,
    start_date: formData.start_date,
    end_date: formData.end_date || null,
    total_value: formData.total_value,
    notes: formData.notes || null,
  }).eq('id', id);
  if (error) throw error;
  revalidatePath('/app/onedigit/contratti');
}

export async function deleteContract(id: string) {
  await requireAuth();
  const supabase = await createClient();
  const { error } = await supabase.from('contracts').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/app/onedigit/contratti');
}
