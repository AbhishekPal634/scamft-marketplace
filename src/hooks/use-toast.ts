
import { useToast as useToastOriginal, type ToastProps, type ToastActionElement } from "../components/ui/toast";

// Create a toast function that can be used throughout the app
export const toast = (props: ToastProps) => {
  const { toast } = useToastOriginal();
  return toast(props);
};

// Re-export the hook to avoid circular references
export const useToast = useToastOriginal;

export type {
  ToastActionElement,
  ToastProps,
};
