'use client';

import { useCallback } from 'react';
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

/**
 * Hook tương thích cũ — gọi sonner toast bên dưới.
 *
 * `show` được memoize (`useCallback` deps rỗng) vì `toast` của sonner là
 * singleton ổn định. QUAN TRỌNG: nhiều component đưa `show` vào deps của
 * `useEffect` (kèm `router.refresh()`); nếu `show` đổi ref mỗi render sẽ gây
 * vòng lặp effect vô hạn → spam toast + spam request → 429 Too Many Requests.
 */
export function useToast() {
  const show = useCallback(
    (
      message: string,
      variant: 'success' | 'error' | 'info' | 'warning' = 'info',
    ) => {
      if (variant === 'success') toast.success(message);
      else if (variant === 'error') toast.error(message);
      else if (variant === 'warning') toast.warning(message);
      else toast(message);
    },
    [],
  );
  return { show };
}

export { toast };
