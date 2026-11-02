import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from 'modules/auth';
import { contentReducer } from 'modules/content';
import dynamicReducer from 'modules/dynamic-content/store/dynamicSlice';
import uiReducer from './slices/uiSlice';

/**
 * Único lugar de la app que conoce los reducers de todos los módulos.
 * Ver steering `estructura-proyecto`: es la excepcion a la regla de
 * no-dependencia entre módulos.
 */
export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    content: contentReducer,
    dynamic: dynamicReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
