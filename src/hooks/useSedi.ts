'use client';

import { useAccount } from './useAccount';

export function useSedi(): string[] {
  const { data: account } = useAccount();
  return account?.sedi ?? [];
}
