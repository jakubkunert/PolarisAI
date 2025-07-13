import React, { useState, useEffect, useCallback } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const toastVariants = cva(
  'fixed bottom-4 right-4 z-50 flex items-center space-x-2 rounded-lg px-4 py-3 shadow-lg transition-all duration-300 transform',
  {
    variants: {
      variant: {
        default: 'bg-white text-gray-900 border border-gray-200',
        success: 'bg-green-50 text-green-800 border border-green-200',
        error: 'bg-red-50 text-red-800 border border-red-200',
        warning: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
      },
      state: {
        visible: 'translate-y-0 opacity-100',
        hidden: 'translate-y-full opacity-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      state: 'hidden',
    },
  }
);

interface ToastProps extends VariantProps<typeof toastVariants> {
  message: string;
  visible: boolean;
  onClose?: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  visible,
  variant,
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (visible && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, onClose, duration]);

  return (
    <div
      className={cn(
        toastVariants({
          variant,
          state: visible ? 'visible' : 'hidden',
        })
      )}
    >
      <div className="w-2 h-2 bg-current rounded-full"></div>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

export const useToast = () => {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    message: string;
    variant?: 'default' | 'success' | 'error' | 'warning';
    visible: boolean;
  }>>([]);

    const showToast = useCallback((
    message: string,
    variant: 'default' | 'success' | 'error' | 'warning' = 'default'
  ) => {
    const id = Date.now().toString();
    const toast = { id, message, variant, visible: true };

    setToasts(prev => [...prev, toast]);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.map(t =>
        t.id === id ? { ...t, visible: false } : t
      ));
    }, 3000);

    // Remove from array after animation completes
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3300);
  }, []);

    const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.map(t =>
      t.id === id ? { ...t, visible: false } : t
    ));
  }, []);

  const ToastContainer = useCallback(() => (
    <>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          variant={toast.variant}
          visible={toast.visible}
          onClose={() => hideToast(toast.id)}
        />
      ))}
    </>
  ), [toasts, hideToast]);

  return { showToast, ToastContainer };
};
