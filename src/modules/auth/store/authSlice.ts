import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { LoadingStatus, UserRole } from 'modules/shared/types/common.types';
import { toErrorMessage } from 'modules/shared/utils/errors';
import type { RootState } from 'modules/shared/store';
import * as authService from 'modules/auth/services/auth.service';
import type { AuthSession, AuthUser, LoginCredentials } from 'modules/auth/types/auth.types';

export interface AuthState {
  /**
   * Rol efectivo del visitante y unica fuente de verdad sobre permisos.
   * Arranca en `User`: sin credenciales ya se puede leer todo el contenido.
   * Pasa a `Admin` solo tras un login correcto.
   */
  role: UserRole;
  /** Datos del administrador autenticado. `null` mientras el visitante es anonimo. */
  admin: AuthUser | null;
  /** Estado del intento de login. */
  status: LoadingStatus;
  /**
   * `true` cuando ya se intento rehidratar una sesion de admin guardada.
   * Los guards de admin deben esperar a esto; el contenido publico no.
   */
  isBootstrapped: boolean;
  error: string | null;
}

const initialState: AuthState = {
  role: UserRole.User,
  admin: null,
  status: LoadingStatus.Idle,
  isBootstrapped: false,
  error: null,
};

/** Login de administrador. Es el unico rol que se autentica. */
export const loginAdmin = createAsyncThunk<AuthSession, LoginCredentials, { rejectValue: string }>(
  'auth/loginAdmin',
  async (credentials, { rejectWithValue }) => {
    try {
      return await authService.login(credentials);
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, 'No pudimos verificar tus datos.'));
    }
  },
);

/** Cierra la sesion de admin. El visitante vuelve a rol `User`, no se queda fuera. */
export const logoutAdmin = createAsyncThunk<void, void>('auth/logoutAdmin', async () => {
  await authService.logout();
});

/** Rehidrata la sesion de admin al arrancar. Nunca rechaza: sin sesion = anonimo. */
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
      .addCase(loginAdmin.pending, (state) => {
        state.status = LoadingStatus.Pending;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action: PayloadAction<AuthSession>) => {
        state.status = LoadingStatus.Succeeded;
        state.role = action.payload.user.role;
        state.admin = action.payload.user;
        state.error = null;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.status = LoadingStatus.Failed;
        state.role = UserRole.User;
        state.admin = null;
        state.error = action.payload ?? 'No pudimos verificar tus datos.';
      })
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.role = UserRole.User;
        state.admin = null;
        state.status = LoadingStatus.Idle;
        state.error = null;
      })
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        const restored = action.payload;
        state.role = restored?.user.role ?? UserRole.User;
        state.admin = restored?.user ?? null;
        state.isBootstrapped = true;
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.role = UserRole.User;
        state.admin = null;
        state.isBootstrapped = true;
      });
  },
});

export const { clearAuthError } = authSlice.actions;

// ---------------------------------------------------------------------------
// Selectores
// ---------------------------------------------------------------------------

/** Rol efectivo del visitante. */
export const selectRole = (state: RootState): UserRole => state.auth.role;

/**
 * EL FLAG DE ADMIN. Es lo que consultan los guards y la interfaz para decidir
 * si se muestran las acciones de escritura:
 *
 *   const isAdmin = useAppSelector(selectIsAdmin);
 *
 * Se deriva de `role` en vez de guardarse como booleano aparte: dos campos
 * para el mismo hecho se desincronizan en cuanto alguien actualice solo uno.
 */
export const selectIsAdmin = (state: RootState): boolean =>
  state.auth.role === UserRole.Admin;

/** Datos del admin autenticado, o `null` si el visitante es anonimo. */
export const selectAdminUser = (state: RootState): AuthUser | null => state.auth.admin;

export const selectAuthStatus = (state: RootState): LoadingStatus => state.auth.status;
export const selectAuthError = (state: RootState): string | null => state.auth.error;
export const selectIsAuthBootstrapped = (state: RootState): boolean =>
  state.auth.isBootstrapped;

export default authSlice.reducer;
