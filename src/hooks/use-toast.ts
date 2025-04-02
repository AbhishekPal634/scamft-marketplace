import * as React from "react"
import { toast as sonnerToast, type Toast } from "sonner"
import type { ToastActionElement, ToastProps } from "../components/ui/toast"

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000;

type ToastState = {
  toasts: Array<ToastProps & { id: string }>
}

// Implementing the toast functionality directly
export const useToast = () => {
  const [toasts, setToasts] = React.useState<Array<ToastProps & { id: string }>>([]);

  const toast = React.useCallback(
    ({ ...props }: ToastProps) => {
      const id = props.id || Math.random().toString(36).substring(2, 9);
      
      setToasts((prev) => {
        // If we already have this toast, update it
        if (prev.some((t) => t.id === id)) {
          return prev.map((t) => (t.id === id ? { ...t, ...props, id } : t));
        }
        
        // Otherwise, add the new toast, ensuring we don't exceed the limit
        const newToasts = [...prev, { ...props, id }];
        return newToasts.slice(-TOAST_LIMIT);
      });

      return id;
    },
    []
  );

  const dismiss = React.useCallback((toastId?: string) => {
    setToasts((prev) => 
      prev.filter((toast) => {
        if (toastId) {
          return toast.id !== toastId;
        }
        return true;
      })
    );
  }, []);

  const update = React.useCallback(
    (props: Partial<ToastProps> & { id: string }) => {
      if (!props.id) return;
      
      setToasts((prev) =>
        prev.map((t) => (t.id === props.id ? { ...t, ...props } : t))
      );
    },
    []
  );

  return {
    toast,
    dismiss,
    update,
    toasts,
  };
};

// Provide a standalone toast function for convenience
export const toast = (props: ToastProps) => {
  sonnerToast(props.title as string, {
    description: props.description,
    action: props.action,
    className: props.className,
    ...props
  });
  
  return props.id || '';
};

export type { ToastActionElement, ToastProps };
