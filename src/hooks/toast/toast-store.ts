
import { create } from 'zustand';
import { Toast } from './types';

interface ToastStore {
  toasts: Toast[];
}

export const toastStore = create<ToastStore>(() => ({
  toasts: [],
}));
