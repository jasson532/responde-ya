import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { LoadingStatus, UserRole } from 'modules/shared/types/common.types';
import { toErrorMessage } from 'modules/shared/utils/errors';
import type { RootState } from 'modules/shared/store';
import * as authService from 'modules/auth/services/auth.service';
import type { AuthSession, AuthUser, LoginCredentials } from 'modules/auth/types/auth.types';

export interface AuthState {
  user: AuthUser | null;
  status: LoadingStatus;
  /** Hasta que no termine `bootstrapSession` no sabemos si hay sesion. */
  isBootstrapped: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: LoadingStatus.Idle,
  isBootstrapped: false,
  error: null,
};

export const loginUser = createAsyncThunk<
  AuthSession,
  LoginCredentials,
  { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    return await authService.login(credentials);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error, 'No pudimos iniciar tu sesion.'));
  }
});

export const logoutUser = createAsyncThunk<void, void>('auth/logout', async () => {
  await authService.logout();
});

/** Rehidrata la sesion al arrancar la app. Nunca rechaza: sin sesion = anonimo. */
export const bootstrapSession = createAsyncThunk<AuthSession | null, void>(
  'auth/bootstrapSession',
  async () => authService.restoreSession().catch(() => null),
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = LoadingStatus.Pending;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<AuthSession>) => {
        state.status = LoadingStatus.Succeeded;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = LoadingStatus.Failed;
        state.user = null;
        state.error = action.payload ?? 'No pudimos iniciar tu sesion.';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.status = LoadingStatus.Idle;
        state.error = null;
      })
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        state.user = action.payload?.user ?? null;
        state.isBootstrapped = true;
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.user = null;
        state.isBootstrapped = true;
      });
  },
});

export const { clearAuthError } = authSlice.actions;

// --- Selectores ---
export const selectAuthUser = (state: RootState): AuthUser | null => state.auth.user;
export const selectIsAuthenticated = (state: RootState): boolean => state.auth.user !== null;
export const selectIsAdmin = (state: RootState): boolean =>
  state.auth.user?.role === UserRole.Admin;
export const selectAuthStatus = (state: RootState): LoadingStatus => state.auth.status;
export const selectAuthError = (state: RootState): string | null => state.auth.error;
export const selectIsAuthBootstrapped = (state: RootState): boolean =>
  state.auth.isBootstrapped;

export default authSlice.reducer;
