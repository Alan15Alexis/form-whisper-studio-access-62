
import * as React from "react";
import { useState, useEffect } from "react";
import { toastStore } from "./toast-store";
import { type ToastProps, type Toast } from "./types";

const TOAST_REMOVE_DELAY = 5000; // 5 segundos

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return toastStore.subscribe((state) => {
      setToasts(state.toasts);
    });
  }, []);

  function toast(props: ToastProps) {
    const id = crypto.randomUUID();
    const update = (props: ToastProps) =>
      toastStore.setState((state) => ({
        toasts: state.toasts.map((toast) =>
          toast.id === id ? { ...toast, ...props } : toast
        ),
      }));
    const dismiss = () =>
      toastStore.setState((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      }));
    
    toastStore.setState((state) => ({
      toasts: [
        ...state.toasts,
        { ...props, id, dismiss, update },
      ],
    }));

    // Auto dismiss después de 5 segundos
    setTimeout(() => {
      dismiss();
    }, TOAST_REMOVE_DELAY);

    return {
      id,
      dismiss,
      update,
    };
  }

  return {
    toast,
    toasts,
    dismiss: (id: string) =>
      toastStore.setState((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      })),
  };
};

export function toast(props: ToastProps) {
  const id = crypto.randomUUID();
  const update = (props: ToastProps) =>
    toastStore.setState((state) => ({
      toasts: state.toasts.map((toast) =>
        toast.id === id ? { ...toast, ...props } : toast
      ),
    }));
  const dismiss = () =>
    toastStore.setState((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));

  toastStore.setState((state) => ({
    toasts: [...state.toasts, { ...props, id, dismiss, update }],
  }));

  // Auto dismiss después de 5 segundos
  setTimeout(() => {
    dismiss();
  }, TOAST_REMOVE_DELAY);

  return {
    id,
    dismiss,
    update,
  };
}

export const Toaster = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return toastStore.subscribe((state) => {
      setToasts(state.toasts);
    });
  }, []);

  const handleDragStart = (e: React.DragEvent, toastId: string) => {
    e.dataTransfer.setData('text/plain', toastId);
  };

  const handleDragEnd = (e: React.DragEvent, toastId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dragDistance = Math.abs(e.clientX - rect.left);
    
    // Si se arrastra más de 100px, quitar el toast
    if (dragDistance > 100) {
      toastStore.setState((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== toastId),
      }));
    }
  };

  return (
    <div
      className={`fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] ${
        toasts.length === 0 ? 'pointer-events-none' : ''
      }`}
    >
      {toasts.map(({ id, title, description, action, variant, ...props }) => (
        <div
          key={id}
          draggable
          onDragStart={(e) => handleDragStart(e, id)}
          onDragEnd={(e) => handleDragEnd(e, id)}
          className={`group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all cursor-grab active:cursor-grabbing data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full ${
            variant === 'destructive' 
              ? 'border-red-500 bg-red-50 text-red-900 dark:bg-red-900 dark:text-red-50' 
              : variant === 'success'
              ? 'border-green-500 bg-green-50 text-green-900 dark:bg-green-900 dark:text-green-50'
              : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'
          }`}
        >
          <div className="grid gap-1">
            {title && <div className="text-sm font-semibold">{title}</div>}
            {description && (
              <div className="text-sm opacity-90">{description}</div>
            )}
          </div>
          {action}
          <button
            className="absolute right-2 top-2 rounded-md p-1 text-slate-950/50 opacity-0 transition-opacity hover:text-slate-950 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 dark:text-slate-50/50 dark:hover:text-slate-50"
            onClick={() => {
              toastStore.setState((state) => ({
                toasts: state.toasts.filter((toast) => toast.id !== id),
              }));
            }}
          >
            <span className="sr-only">Close</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18" />
              <path d="M6 6L18 18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

export const ToastProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
};
