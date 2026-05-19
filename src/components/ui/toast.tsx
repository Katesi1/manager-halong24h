'use client';

import { Toaster, toast } from 'sonner';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          duration: 5000,
          style: {
            fontFamily: 'var(--font-sans)',
            borderRadius: '12px',
          },
        }}
      />
    </>
  );
}

/** Hook tương thích cũ — gọi sonner toast bên dưới */
export function useToast() {
  return {
    show: (message: string, variant: 'success' | 'error' | 'info' | 'warning' = 'info') => {
      if (variant === 'success') toast.success(message);
      else if (variant === 'error') toast.error(message);
      else if (variant === 'warning') toast.warning(message);
      else toast(message);
    },
  };
}

export { toast };
