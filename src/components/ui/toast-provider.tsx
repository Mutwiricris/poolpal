"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Toaster, toast as sonnerToast } from "sonner";

// Create a context for toast
export const ToastContext = React.createContext({
  toast: (message: string, options?: any) => {},
  success: (message: string, options?: any) => {},
  error: (message: string, options?: any) => {},
  info: (message: string, options?: any) => {},
  warning: (message: string, options?: any) => {}
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  // Create a wrapper function that safely handles different toast arguments
  const safeToast = useCallback((message: string | { title?: string; description?: string }, options?: any) => {
    if (typeof message === 'string') {
      sonnerToast(message, options);
    } else if (message && typeof message === 'object') {
      const { title, description } = message;
      if (title && description) {
        sonnerToast(
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-sm text-gray-500">{description}</div>
          </div>,
          options
        );
      } else if (title) {
        sonnerToast(title, options);
      } else if (description) {
        sonnerToast(description, options);
      }
    }
  }, []);

  // Create specialized toast functions
  const success = useCallback((message: any, options?: any) => {
    safeToast(message, { ...options, type: 'success' });
  }, [safeToast]);

  const error = useCallback((message: any, options?: any) => {
    safeToast(message, { ...options, type: 'error' });
  }, [safeToast]);

  const info = useCallback((message: any, options?: any) => {
    safeToast(message, { ...options, type: 'info' });
  }, [safeToast]);

  const warning = useCallback((message: any, options?: any) => {
    safeToast(message, { ...options, type: 'warning' });
  }, [safeToast]);

  return (
    <ToastContext.Provider value={{ toast: safeToast, success, error, info, warning }}>
      {children}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: { 
            background: 'white', 
            color: 'black',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          },
          className: 'rounded-md',
          descriptionClassName: 'text-gray-500 text-sm mt-1'
        }}
      />
    </ToastContext.Provider>
  );
}

// Hook to use toast
export const useToast = () => {
  return React.useContext(ToastContext);
};
