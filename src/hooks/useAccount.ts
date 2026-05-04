'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';
import { useEffectiveAccountId } from './useEffectiveAccountId';
import type { Account } from '@/lib/types';

export function useAccount() {
  const { data: accountId } = useEffectiveAccountId();
  const supabase = createClient();

  return useQuery<Account | null>({
    queryKey: ['account', accountId],
    queryFn: async () => {
      if (!accountId) return null;
      const { data } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .single();
      return data;
    },
    enabled: !!accountId,
  });
}
