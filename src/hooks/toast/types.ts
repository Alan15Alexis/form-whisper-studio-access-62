
import * as React from "react";
import { ToastAction } from "@radix-ui/react-toast";

export interface ToastProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

export interface Toast {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  onOpenChange?: (open: boolean) => void;
}

export type ToastActionElementType = React.ReactElement<typeof ToastAction>;

export type ToastActionProps = {
  altText?: string;
  action: ToastActionElementType;
};

export interface ToastContextState {
  toasts: Toast[];
}

export enum ActionType {
  AddToast,
  RemoveToast,
  UpdateToast,
}

export type Action =
  | {
      type: "ADD_TOAST";
      toast: Toast;
    }
  | {
      type: "REMOVE_TOAST";
      toastId: string;
    }
  | {
      type: "UPDATE_TOAST";
      toast: Partial<Toast>;
      toastId: string;
    };
