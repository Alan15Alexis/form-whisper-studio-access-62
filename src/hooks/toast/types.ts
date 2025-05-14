
import * as React from "react";

export type ToastActionElementType = React.ReactElement<{
  altText: string;
  onClick: () => void;
}>;

export interface Toast {
  id: string;
  title?: string;
  description?: React.ReactNode;
  action?: ToastActionElementType;
  dismiss: () => void;
  update: (props: ToastProps) => void;
  variant?: "default" | "destructive" | "success";
}

export interface ToastProps {
  title?: string;
  description?: React.ReactNode;
  action?: ToastActionElementType;
  variant?: "default" | "destructive" | "success";
}
