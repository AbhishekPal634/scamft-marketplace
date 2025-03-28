
import {
  Toast,
  ToastActionElement,
  ToastProps,
} from "../components/ui/toast";

// Import the hook directly from the source
import { useToast as useToastOriginal } from "../components/ui/toast";
import { Toaster } from "../components/ui/toaster";

// Create a toast function that can be used throughout the app
export const toast = useToastOriginal().toast;

// Re-export the hook to avoid circular references
export const useToast = useToastOriginal;

export type {
  Toast,
  ToastActionElement,
  ToastProps,
};
