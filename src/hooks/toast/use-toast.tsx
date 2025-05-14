
import * as React from "react";
import {
  ToastProvider as ToastProviderPrimitive,
  ToastViewport,
} from "@radix-ui/react-toast";
import { Toast, ToastContextState } from "./types";
import { 
  addToRemoveQueue, 
  dispatch, 
  genId, 
  initialState, 
  listeners, 
  memoryState 
} from "./toast-store";
import { ToastComponent } from "./toast-component";

// Toast hook
export function useToast() {
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

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "REMOVE_TOAST", toastId: toastId || "all" }),
  };
}

// Toast function to create toasts
export function toast(props: Omit<Toast, "id">) {
  const id = genId();

  const update = (props: Partial<Omit<Toast, "id">>) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: props,
      toastId: id,
    });

  const dismiss = () => dispatch({ type: "REMOVE_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      onOpenChange: (open: boolean) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

// Toast Provider
export const ToastProvider = ToastProviderPrimitive;

// Toaster component
type ToasterProps = React.ComponentPropsWithoutRef<typeof ToastViewport>;

export const Toaster = ({ ...props }: ToasterProps) => {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <ToastComponent
          key={id}
          title={title}
          description={description}
          action={action}
          {...props}
        />
      ))}
      <ToastViewport className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]" />
    </ToastProvider>
  );
};
