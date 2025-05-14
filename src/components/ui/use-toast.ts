
import { useToast } from "@radix-ui/react-toast";

// Re-export the hook from Radix UI
export { useToast };

// Re-export other types used by the toast system
export type {
  Toast,
  ToastActionElement,
  ToastProps
} from "@/components/ui/toast";
