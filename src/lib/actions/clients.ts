'use server';

import { createClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getClients() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('account_id', user.id)
    .order('name');
  if (error) throw error;
  return data;
}

export async function createClient_action(formData: {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
}) {
  const user = await requireAuth();
  const supabase = await createClient();
  const { error } = await supabase.from('clients').insert({
    account_id: user.id,
    name: formData.name,
    email: formData.email || null,
    phone: formData.phone || null,
    company: formData.company || null,
    address: formData.address || null,
    notes: formData.notes || null,
  });
  if (error) throw error;
  revalidatePath('/app/onedigit/clienti');
}

export async function updateClient(id: string, formData: {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
}) {
  await requireAuth();
  const supabase = await createClient();
  const { error } = await supabase.from('clients').update({
    name: formData.name,
    email: formData.email || null,
    phone: formData.phone || null,
    company: formData.company || null,
    address: formData.address || null,
    notes: formData.notes || null,
  }).eq('id', id);
  if (error) throw error;
  revalidatePath('/app/onedigit/clienti');
}

export async function deleteClient(id: string) {
  await requireAuth();
  const supabase = await createClient();
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/app/onedigit/clienti');
}
