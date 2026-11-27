import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export interface ClientAuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthResponse {
  authenticated?: boolean;
  user?: ClientAuthUser | null;
  error?: { message?: string };
  message?: string;
}

export interface AuthState {
  user: ClientAuthUser | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  error: string | null;
  generation: number;
}

interface SessionCheckResult {
  user: ClientAuthUser | null;
  generation: number;
}

const initialState: AuthState = {
  user: null,
  status: 'loading',
  error: null,
  generation: 0,
};

async function readResponse(response: Response): Promise<AuthResponse> {
  return response.json().catch(() => ({}));
}

function getErrorMessage(data: AuthResponse, fallback: string): string {
  return data.error?.message ?? data.message ?? fallback;
}

export const loadCurrentUser = createAsyncThunk<
  SessionCheckResult,
  number,
  { rejectValue: { message: string; generation: number } }
>(
  'auth/loadCurrentUser',
  async (generation, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = await readResponse(response);
      if (!response.ok) return rejectWithValue({ message: getErrorMessage(data, 'Could not check your session.'), generation });
      return { user: data.authenticated && data.user ? data.user : null, generation };
    } catch {
      return rejectWithValue({ message: 'Could not check your session.', generation });
    }
  }
);

export const loginUser = createAsyncThunk<
  ClientAuthUser,
  { email: string; password: string },
  { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await readResponse(response);
    if (!response.ok || !data.user) return rejectWithValue(getErrorMessage(data, 'Unable to sign in.'));
    return data.user;
  } catch {
    return rejectWithValue('Unable to sign in right now. Please try again.');
  }
});

export const registerUser = createAsyncThunk<
  ClientAuthUser,
  { name: string; email: string; password: string },
  { rejectValue: string }
>('auth/register', async (credentials, { rejectWithValue }) => {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await readResponse(response);
    if (!response.ok || !data.user) return rejectWithValue(getErrorMessage(data, 'Unable to create your account.'));
    return data.user;
  } catch {
    return rejectWithValue('Unable to register right now. Please try again.');
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // Clear client auth state even if the network is unavailable.
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadCurrentUser.fulfilled, (state, action) => {
        if (action.payload.generation !== state.generation) return;
        state.user = action.payload.user;
        state.status = action.payload.user ? 'authenticated' : 'unauthenticated';
        state.error = null;
      })
      .addCase(loadCurrentUser.rejected, (state, action) => {
        if (action.payload?.generation !== state.generation) return;
        // A failed network check is not proof that the session has ended.
        if (state.user) state.status = 'authenticated';
        else state.status = 'loading';
      })
      .addCase(loginUser.pending, (state) => {
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.generation += 1;
        state.user = action.payload;
        state.status = 'authenticated';
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = state.user ? 'authenticated' : 'unauthenticated';
        state.error = action.payload ?? 'Unable to sign in.';
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.generation += 1;
        state.user = action.payload;
        state.status = 'authenticated';
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = state.user ? 'authenticated' : 'unauthenticated';
        state.error = action.payload ?? 'Unable to create your account.';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.generation += 1;
        state.user = null;
        state.status = 'unauthenticated';
        state.error = null;
      });
  },
});

export default authSlice.reducer;
