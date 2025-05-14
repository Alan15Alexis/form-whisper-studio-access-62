
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

const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Auto dismiss toasts after timeout
    const timers = toasts.map((toast) => {
      const duration = toast.duration || TOAST_TIMEOUT;
      return setTimeout(() => {
        setToasts((prevToasts) => prevToasts.filter((t) => t.id !== toast.id));
      }, duration);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [toasts]);

  const toast = ({
    title,
    description,
    variant = "default",
    action,
    duration = TOAST_TIMEOUT,
  }: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
    action?: ToastActionElement;
    duration?: number;
  }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, title, description, variant, action, duration }]);
    return id;
  };

  const dismiss = (toastId?: string) => {
    setToasts((prevToasts) => 
      toastId 
        ? prevToasts.filter((t) => t.id !== toastId) 
        : []
    );
  };

  return { toast, dismiss, toasts };
};

// Export a singleton instance for global use
const { toast, dismiss, toasts } = useToast();

export { useToast, toast, dismiss, toasts };
export type { Toast };
