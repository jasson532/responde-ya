import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from 'modules/auth';
import { contentReducer } from 'modules/content';
import uiReducer from './slices/uiSlice';

/**
 * Unico lugar de la app que conoce los reducers de todos los modulos.
 * Ver steering `estructura-proyecto`: es la excepcion a la regla de
 * no-dependencia entre modulos.
 */
export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    content: contentReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
