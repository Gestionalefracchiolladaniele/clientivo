'use server';

import { createClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getPackages() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('account_id', user.id)
    .order('name');
  if (error) throw error;
  return data;
}

export async function createPackage(formData: {
  name: string;
  description?: string;
  price: number;
  duration_months?: number;
  is_active?: boolean;
}) {
  const user = await requireAuth();
  const supabase = await createClient();
  const { error } = await supabase.from('packages').insert({
    account_id: user.id,
    name: formData.name,
    description: formData.description || null,
    price: formData.price,
    duration_months: formData.duration_months || null,
    is_active: formData.is_active ?? true,
  });
  if (error) throw error;
  revalidatePath('/app/onedigit/pacchetti');
}

export async function updatePackage(id: string, formData: {
  name?: string;
  description?: string;
  price?: number;
  duration_months?: number;
  is_active?: boolean;
}) {
  await requireAuth();
  const supabase = await createClient();
  const { error } = await supabase.from('packages').update({
    name: formData.name,
    description: formData.description || null,
    price: formData.price,
    duration_months: formData.duration_months || null,
    is_active: formData.is_active,
  }).eq('id', id);
  if (error) throw error;
  revalidatePath('/app/onedigit/pacchetti');
}

export async function deletePackage(id: string) {
  await requireAuth();
  const supabase = await createClient();
  const { error } = await supabase.from('packages').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/app/onedigit/pacchetti');
}
