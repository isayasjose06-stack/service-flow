'use client';
import { create } from 'zustand';
import { X } from 'lucide-react';

type ToastType = 'default' | 'success' | 'error' | 'warning';

interface Toast {
  id: string;
  title?: string;
  description: string;
  type?: ToastType;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const useToast = () => {
  const addToast = useToastStore((state) => state.addToast);
  return {
    toast: (props: Omit<Toast, 'id'>) => addToast(props),
  };
};

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`relative flex flex-col gap-1 p-4 rounded-lg shadow-lg text-sm text-white ${
            t.type === 'error'
              ? 'bg-red-600'
              : t.type === 'success'
              ? 'bg-green-600'
              : t.type === 'warning'
              ? 'bg-yellow-600'
              : 'bg-gray-800'
          }`}
        >
          {t.title && <h3 className="font-semibold">{t.title}</h3>}
          <p className="opacity-90">{t.description}</p>
          <button
            onClick={() => removeToast(t.id)}
            className="absolute top-2 right-2 p-1 opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
