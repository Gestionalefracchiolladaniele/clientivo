'use client';

import { useQuery } from '@tanstack/react-query';
import { getEffectiveAccountId } from '@/lib/actions/account';

/**
 * Hook che restituisce l'account_id corretto per l'utente corrente.
 * Per un owner è il proprio user.id; per un dipendente è l'account_id dell'owner.
 * Usato nelle query lato client al posto di user.id per filtrare su account_id.
 */
export function useEffectiveAccountId() {
  return useQuery({
    queryKey: ['effective-account-id'],
    queryFn: () => getEffectiveAccountId(),
    staleTime: Infinity,
  });
}
