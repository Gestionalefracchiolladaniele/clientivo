'use server';

import { createClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getQuotes() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('quotes')
    .select('*, clients(name, company)')
    .eq('account_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getQuote(id: string) {
  await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('quotes')
    .select('*, clients(name, company, email, address), quote_items(* ), quote_templates(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createQuote(formData: {
  title: string;
  client_id?: string;
  template_id?: string;
  status?: 'draft' | 'sent' | 'accepted' | 'rejected';
  valid_until?: string;
  notes?: string;
}) {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase.from('quotes').insert({
    account_id: user.id,
    title: formData.title,
    client_id: formData.client_id || null,
    template_id: formData.template_id || null,
    status: formData.status ?? 'draft',
    valid_until: formData.valid_until || null,
    notes: formData.notes || null,
    total_amount: 0,
  }).select().single();
  if (error) throw error;
  revalidatePath('/app/quotebuilder');
  return data;
}

export async function updateQuote(id: string, formData: {
  title?: string;
  client_id?: string;
  template_id?: string;
  status?: 'draft' | 'sent' | 'accepted' | 'rejected';
  valid_until?: string;
  notes?: string;
  total_amount?: number;
}) {
  await requireAuth();
  const supabase = await createClient();
  const { error } = await supabase.from('quotes').update({
    title: formData.title,
    client_id: formData.client_id || null,
    template_id: formData.template_id || null,
    status: formData.status,
    valid_until: formData.valid_until || null,
    notes: formData.notes || null,
    total_amount: formData.total_amount,
  }).eq('id', id);
  if (error) throw error;
  revalidatePath('/app/quotebuilder');
  revalidatePath(`/app/quotebuilder/${id}`);
}

export async function deleteQuote(id: string) {
  await requireAuth();
  const supabase = await createClient();
  const { error } = await supabase.from('quotes').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/app/quotebuilder');
}

export async function upsertQuoteItems(quoteId: string, items: {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  sort_order: number;
}[]) {
  await requireAuth();
  const supabase = await createClient();

  await supabase.from('quote_items').delete().eq('quote_id', quoteId);

  if (items.length > 0) {
    const { error } = await supabase.from('quote_items').insert(
      items.map(item => ({
        quote_id: quoteId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        sort_order: item.sort_order,
      }))
    );
    if (error) throw error;
  }

  const total = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  await supabase.from('quotes').update({ total_amount: total }).eq('id', quoteId);

  revalidatePath(`/app/quotebuilder/${quoteId}`);
}

export async function getTemplates() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('quote_templates')
    .select('*')
    .eq('account_id', user.id)
    .order('name');
  if (error) throw error;
  return data;
}

export async function createTemplate(formData: {
  name: string;
  html_content: string;
  is_default?: boolean;
}) {
  const user = await requireAuth();
  const supabase = await createClient();
  const { error } = await supabase.from('quote_templates').insert({
    account_id: user.id,
    name: formData.name,
    html_content: formData.html_content,
    is_default: formData.is_default ?? false,
  });
  if (error) throw error;
  revalidatePath('/app/quotebuilder/templates');
}

export async function deleteTemplate(id: string) {
  await requireAuth();
  const supabase = await createClient();
  const { error } = await supabase.from('quote_templates').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/app/quotebuilder/templates');
}
