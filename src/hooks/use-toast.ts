
import { Toaster as Sonner } from "sonner";
import { createContext, useContext } from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const ToastContext = createContext<{
  toast: (props: ToastProps) => void;
  dismiss: (toastId?: string) => void;
} | null>(null);

interface ToastOptions {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: "default" | "destructive";
  duration?: number;
}

export function useToast() {
  const context = useContext(ToastContext);
  
  if (!context) {
    // Create fallback functions if no context is found
    const toast = (options: ToastOptions) => {
      console.log("Toast fallback:", options);
    };
    
    const dismiss = (toastId?: string) => {
      console.log("Dismiss toast fallback:", toastId);
    };
    
    return {
      toast,
      dismiss,
      toasts: [],
    };
  }
  
  return {
    ...context,
    toasts: [], // Simulate the toasts array for compatibility
  };
}

// Simple toast function for direct usage
export function toast(options: ToastOptions) {
  const { toast } = useToast();
  toast(options);
}

// Create a ToastProvider that can be used to wrap the application
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toasts: ToastProps[] = [];
  
  const toast = (props: ToastProps) => {
    console.log("Toast:", props);
    // In a real implementation, this would add a toast to the UI
  };
  
  const dismiss = (toastId?: string) => {
    console.log("Dismiss toast:", toastId);
    // In a real implementation, this would remove a toast from the UI
  };
  
  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}
