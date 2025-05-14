
import * as React from "react";
import type { ToastActionElement } from "@/components/ui/toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider as ToastProviderUI,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

// Define the toast context
type ToastProps = React.ComponentPropsWithoutRef<typeof Toast> & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

interface ToastOptions {
  title?: string;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: "default" | "destructive";
  duration?: number;
}

type ToastContextType = {
  toast: (options: ToastOptions) => void;
  dismiss: (toastId?: string) => void;
  toasts: ToastProps[];
};

const ToastContext = React.createContext<ToastContextType | null>(null);

export function useToast() {
  const context = React.useContext(ToastContext);
  
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  
  return context;
}

// Simple toast function for direct usage
export function toast(options: ToastOptions) {
  try {
    const { toast } = useToast();
    toast(options as any);
  } catch (error) {
    console.error("Error using toast:", error);
    // Fallback just logs to console if no provider
    console.log("Toast (fallback):", options);
  }
}

// Create a ToastProvider that can be used to wrap the application
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const toast = React.useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = {
      id,
      ...options,
    };

    setToasts((prevToasts) => [...prevToasts, newToast as ToastProps]);
    
    return id;
  }, []);

  const dismiss = React.useCallback((toastId?: string) => {
    setToasts((prevToasts) => 
      toastId 
        ? prevToasts.filter((toast) => toast.id !== toastId)
        : []
    );
  }, []);

  const contextValue = React.useMemo(
    () => ({ toast, dismiss, toasts }),
    [toast, dismiss, toasts]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
}
