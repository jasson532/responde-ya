import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from 'modules/shared/store';

export interface Toast {
  id: string;
  tone: 'success' | 'error' | 'info';
  message: string;
}

export interface UiState {
  isSidebarOpen: boolean;
  activeModal: string | null;
  toasts: Toast[];
}

const initialState: UiState = {
  isSidebarOpen: false,
  activeModal: null,
  toasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    closeSidebar(state) {
      state.isSidebarOpen = false;
    },
    openModal(state, action: PayloadAction<string>) {
      state.activeModal = action.payload;
    },
    closeModal(state) {
      state.activeModal = null;
    },
    pushToast(state, action: PayloadAction<Toast>) {
      state.toasts.push(action.payload);
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
  },
});

export const {
  toggleSidebar,
  closeSidebar,
  openModal,
  closeModal,
  pushToast,
  dismissToast,
} = uiSlice.actions;

export const selectIsSidebarOpen = (state: RootState): boolean => state.ui.isSidebarOpen;
export const selectActiveModal = (state: RootState): string | null => state.ui.activeModal;
export const selectToasts = (state: RootState): Toast[] => state.ui.toasts;

export default uiSlice.reducer;
