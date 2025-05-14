
import { Toast, ToastProps, ToastActionElement } from "@/components/ui/toast";

// Export the toast types from the UI component
export type {
  Toast,
  ToastActionElement,
  ToastProps
} from "@/components/ui/toast";

// Re-export the hook and toast function from the hooks implementation
export { useToast, toast } from "@/hooks/use-toast";

