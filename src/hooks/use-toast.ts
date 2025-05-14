
import { Toaster } from "@/components/ui/toaster";
import { Toast, useToast as useToastOriginal } from "@/components/ui/toast";

export const ToastContainer = Toaster;
export const toast = Toast;
export const useToast = useToastOriginal;
