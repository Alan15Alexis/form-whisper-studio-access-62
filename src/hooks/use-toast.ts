
import { Toast, ToastActionElement, ToastProps } from "@/components/ui/toast";
import { useToast as useToastUI } from "@/components/ui/use-toast";

export type { Toast, ToastActionElement, ToastProps };

export function useToast() {
  return useToastUI();
}

type ToastFunction = (props: ToastProps) => void;

export const toast: ToastFunction = (props) => {
  // Get the singleton toast instance and call it
  const { toast: toastFn } = useToastUI();
  if (toastFn) {
    return toastFn(props);
  }
};
