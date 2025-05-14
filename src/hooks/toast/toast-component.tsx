
import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle,
} from "@radix-ui/react-toast";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";
import { ToastProps } from "./types";

// Toast variant styling
export const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive: "destructive group border-destructive bg-destructive text-destructive-foreground",
        success: "border-green-500 bg-green-50 text-green-900 dark:bg-green-900 dark:text-green-50 dark:border-green-500"
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// Toast component
export const ToastComponent = React.forwardRef<
  React.ElementRef<typeof Toast>,
  React.ComponentPropsWithoutRef<typeof Toast> & ToastProps
>(({ className, variant, title, description, action, ...props }, ref) => {
  return (
    <Toast
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      <div className="grid gap-1">
        {title && <ToastTitle className="text-sm font-semibold">{title}</ToastTitle>}
        {description && (
          <ToastDescription className="text-sm opacity-90">
            {description}
          </ToastDescription>
        )}
      </div>
      {action}
      <ToastClose className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600">
        <X className="h-4 w-4" />
      </ToastClose>
    </Toast>
  );
});

ToastComponent.displayName = "Toast";

// Export the Toaster component from the use-toast.tsx file
export { Toaster } from "./use-toast";

