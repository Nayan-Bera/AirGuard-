import { configureStore } from '@reduxjs/toolkit';
import authReducer, { type ClientAuthUser } from '@/lib/store/auth-slice';

export function makeStore(initialUser: ClientAuthUser | null = null) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: initialUser,
        status: initialUser ? 'authenticated' as const : 'unauthenticated' as const,
        error: null,
        generation: 0,
      },
    },
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
