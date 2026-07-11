"use client";
import { create } from "zustand";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";
type ToastItem = { id: number; type: ToastType; message: string };

const useToastStore = create<{ toasts: ToastItem[]; add: (t: ToastItem) => void; remove: (id: number) => void }>((set) => ({
  toasts: [],
  add: (t) => set((s) => ({ toasts: [...s.toasts, t] })),
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

let counter = 0;
export function toast(type: ToastType, message: string) {
  const id = ++counter;
  useToastStore.getState().add({ id, type, message });
  setTimeout(() => useToastStore.getState().remove(id), 4000);
}

const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
const colors = { success: "text-accent", error: "text-error", info: "text-primary" };

export function Toaster() {
  const { toasts, remove } = useToastStore();
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className="bg-card border border-border rounded-card shadow-hover p-4 flex items-start gap-3"
            >
              <Icon className={`h-5 w-5 shrink-0 ${colors[t.type]}`} />
              <p className="text-sm flex-1">{t.message}</p>
              <button onClick={() => remove(t.id)} aria-label="Dismiss">
                <X className="h-4 w-4 text-txt-secondary" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
