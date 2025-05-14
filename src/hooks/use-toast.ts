
import { useState, useEffect, type ReactNode } from "react";

const TOAST_TIMEOUT = 5000;

type ToastProps = {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
};

type ToastActionElement = React.ReactElement<{
  altText: string;
}>;

export type Toast = ToastProps & {
  action?: ToastActionElement;
};

// Create a simple store to manage toast state outside of React's lifecycle
type ToastStore = {
  toasts: Toast[];
  listeners: Set<(toasts: Toast[]) => void>;
  addToast: (toast: Omit<Toast, "id">) => string;
  dismiss: (toastId?: string) => void;
};

// Create a singleton toast store that can be used anywhere
const toastStore: ToastStore = {
  toasts: [],
  listeners: new Set(),

  addToast(toast) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    
    this.toasts = [...this.toasts, newToast];
    this.listeners.forEach(listener => listener(this.toasts));
    
    // Auto dismiss
    const duration = toast.duration || TOAST_TIMEOUT;
    setTimeout(() => {
      this.dismiss(id);
    }, duration);
    
    return id;
  },
  
  dismiss(toastId?) {
    this.toasts = toastId 
      ? this.toasts.filter(t => t.id !== toastId)
      : [];
    this.listeners.forEach(listener => listener(this.toasts));
  }
};

// Export a convenience function for adding toasts
export const toast = (props: {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: ToastActionElement;
  duration?: number;
}) => toastStore.addToast(props);

// Export a convenience function for dismissing toasts
export const dismiss = (toastId?: string) => toastStore.dismiss(toastId);

// This is the React hook that components can use to access toast state
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(toastStore.toasts);
  
  useEffect(() => {
    // This function will be called whenever the toast store changes
    const listener = (newToasts: Toast[]) => {
      setToasts([...newToasts]);
    };
    
    // Register this component as a listener
    toastStore.listeners.add(listener);
    
    // Clean up when component unmounts
    return () => {
      toastStore.listeners.delete(listener);
    };
  }, []);
  
  return {
    toast: (props: {
      title: string;
      description?: string;
      variant?: "default" | "destructive";
      action?: ToastActionElement;
      duration?: number;
    }) => toastStore.addToast(props),
    dismiss: (toastId?: string) => toastStore.dismiss(toastId),
    toasts
  };
}
