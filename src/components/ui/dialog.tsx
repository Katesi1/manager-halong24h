'use client';

import * as RDialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = RDialog.Root;
export const DialogTrigger = RDialog.Trigger;
export const DialogClose = RDialog.Close;

interface DialogContentProps {
  open?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function DialogContent({ open, className, children }: DialogContentProps) {
  return (
    <AnimatePresence>
      {open && (
        <RDialog.Portal forceMount>
          <RDialog.Overlay asChild>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />
          </RDialog.Overlay>
          <RDialog.Content asChild>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-ink-200 focus:outline-none',
                className,
              )}
            >
              {children}
              <RDialog.Close asChild>
                <button
                  type="button"
                  aria-label="Đóng"
                  className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full hover:bg-cream-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </RDialog.Close>
            </motion.div>
          </RDialog.Content>
        </RDialog.Portal>
      )}
    </AnimatePresence>
  );
}

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <RDialog.Title className={cn('font-display text-2xl font-semibold tracking-tight text-navy-900', className)}>
      {children}
    </RDialog.Title>
  );
}

export function DialogDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <RDialog.Description className={cn('mt-2 text-sm text-ink-700', className)}>
      {children}
    </RDialog.Description>
  );
}
