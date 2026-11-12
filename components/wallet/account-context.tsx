'use client';

import { createContext, useContext } from 'react';
import type { QozmoWalletController } from '@/components/dashboard/quantum-wallet';

export type QozmoAccountContext = QozmoWalletController & {
  openUnlock: () => void;
  openReceive: () => void;
  openBackup: () => void;
};
export const AccountContext = createContext<QozmoAccountContext | null>(null);
export const useOptionalQozmoAccount = () => useContext(AccountContext);
export function useQozmoAccount() {
  const account = useOptionalQozmoAccount();
  if (!account) throw new Error('Open the Qozmo account workspace first.');
  return account;
}
