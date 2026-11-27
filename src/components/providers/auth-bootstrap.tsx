'use client';

import { useEffect, useRef } from 'react';
import { loadCurrentUser } from '@/lib/store/auth-slice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';

export function AuthBootstrap() {
  const dispatch = useAppDispatch();
  const generation = useAppSelector((state) => state.auth.generation);
  const authStatus = useAppSelector((state) => state.auth.status);
  const checkingRef = useRef(false);

  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    const checkSession = () => {
      if (checkingRef.current || typeof window === 'undefined') return;
      checkingRef.current = true;
      void dispatch(loadCurrentUser(generation)).finally(() => {
        checkingRef.current = false;
      });
    };
    checkSession();
    const interval = window.setInterval(checkSession, 10 * 60 * 1000);
    window.addEventListener('focus', checkSession);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', checkSession);
    };
  }, [authStatus, dispatch, generation]);

  return null;
}
