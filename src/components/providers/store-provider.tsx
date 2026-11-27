'use client';

import { useRef, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Provider } from 'react-redux';
import { makeStore, type AppStore } from '@/lib/store';
import type { ClientAuthUser } from '@/lib/store/auth-slice';

const AuthBootstrap = dynamic(
  () => import('@/components/providers/auth-bootstrap').then((module) => module.AuthBootstrap),
  { ssr: false }
);

export function StoreProvider({ children, initialUser }: { children: ReactNode; initialUser: ClientAuthUser | null }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) storeRef.current = makeStore(initialUser);

  return (
    <Provider store={storeRef.current}>
      <AuthBootstrap />
      {children}
    </Provider>
  );
}
