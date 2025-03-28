
import {
  Toast,
  ToastActionElement,
  ToastProps,
} from "../components/ui/toast";

import {
  useToast as useToastOriginal,
  toast as toastOriginal
} from "@/components/ui/toaster";

// Re-export with new names to avoid circular references
export const useToast = useToastOriginal;
export const toast = toastOriginal;

export type {
  Toast,
  ToastActionElement,
  ToastProps,
};
