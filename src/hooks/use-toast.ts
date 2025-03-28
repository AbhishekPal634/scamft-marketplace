
import {
  Toast,
  ToastActionElement,
  ToastProps,
  useToast as useToastOriginal
} from "../components/ui/toast";

// Create a toast function that can be used throughout the app
export const toast = (props: ToastProps) => {
  return useToastOriginal().toast(props);
};

// Re-export the hook to avoid circular references
export const useToast = useToastOriginal;

export type {
  Toast,
  ToastActionElement,
  ToastProps,
};
