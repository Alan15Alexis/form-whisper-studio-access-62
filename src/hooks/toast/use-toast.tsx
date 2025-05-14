
import * as React from "react";
import {
  ToastProvider as ToastProviderPrimitive,
  ToastViewport,
  Toast as ToastPrimitive,
  type ToastActionElement as ToastActionElementType,
} from "@radix-ui/react-toast";
import { ToastComponent } from "./toast-component";
import {
  dispatch,
  addToRemoveQueue,
  genId,
  toastTimeouts,
  listeners,
  memoryState,
} from "./toast-store";
import { Toast, ToastContextState } from "./types";

// Create context for toast
const ToastContext = React.createContext<{
  toasts: Toast[];
  toast: (props: Omit<Toast, "id">) => {
    id: string;
    dismiss: () => void;
    update: (props: Partial<Omit<Toast, "id">>) => void;
  };
  dismiss: (toastId: string) => void;
}>({
  toasts: [],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toast: () => ({
    id: "",
    dismiss: () => null,
    update: () => null,
  }),
  dismiss: () => null,
});

// Provider component
export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = React.useState<ToastContextState>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return (
    <ToastContext.Provider
      value={{
        toasts: state.toasts,
        toast: (props) => {
          const id = genId();
          const update = (props: Partial<Omit<Toast, "id">>) =>
            dispatch({
              type: "UPDATE_TOAST",
              toast: { ...props },
              toastId: id,
            });

          const dismiss = () => dispatch({ type: "REMOVE_TOAST", toastId: id });

          dispatch({
            type: "ADD_TOAST",
            toast: {
              ...props,
              id,
              onOpenChange: (open) => {
                if (!open) dismiss();
              },
            },
          });

          return {
            id,
            dismiss,
            update,
          };
        },
        dismiss: (toastId: string) => dispatch({ type: "REMOVE_TOAST", toastId }),
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

// Hook for using toast
export const useToast = () => {
  const { toasts, toast, dismiss } = React.useContext(ToastContext);

  return React.useMemo(
    () => ({
      toasts,
      toast: (props: {
        title?: React.ReactNode;
        description?: React.ReactNode;
        action?: React.ReactNode;
        variant?: "default" | "destructive";
        className?: string;
        onOpenChange?: (open: boolean) => void;
      }) => toast(props),
      dismiss: (toastId?: string) => {
        if (toastId) {
          dismiss(toastId);
          if (toastTimeouts.has(toastId)) {
            clearTimeout(toastTimeouts.get(toastId));
            toastTimeouts.delete(toastId);
          }
        } else {
          dispatch({ type: "REMOVE_TOAST", toastId: "all" });

          // Clear all timeouts
          for (const [toastId, timeout] of toastTimeouts.entries()) {
            clearTimeout(timeout);
            toastTimeouts.delete(toastId);
          }
        }
      },
    }),
    [toasts, toast, dismiss]
  );
};

// Toast function to create toasts
export function toast(props: { 
  title?: React.ReactNode; 
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  className?: string;
  onOpenChange?: (open: boolean) => void;
}) {
  const id = genId();

  const update = (props: Partial<Omit<Toast, "id">>) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props },
      toastId: id,
    });

  const dismiss = () => dispatch({ type: "REMOVE_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

// Toast UI components
export const Toaster = React.forwardRef<
  React.ElementRef<typeof ToastProviderPrimitive>,
  React.ComponentPropsWithoutRef<typeof ToastProviderPrimitive>
>(({ ...props }, ref) => {
  const { toasts } = useToast();

  return (
    <ToastProviderPrimitive ref={ref} {...props}>
      {toasts.map(({ id, title, description, action, ...props }) => {
        return (
          <ToastComponent
            key={id}
            {...props}
            title={title}
            description={description}
            action={action}
          />
        );
      })}
      <ToastViewport />
    </ToastProviderPrimitive>
  );
});

Toaster.displayName = "Toaster";
