import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { clsx } from 'clsx';

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed bottom-20 right-4 z-[100] flex flex-col gap-2 md:bottom-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx(
            'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[250px] max-w-sm',
            'toast-enter border',
            toast.type === 'success' && 'bg-green-900/90 border-green-700 text-green-100',
            toast.type === 'error' && 'bg-red-900/90 border-red-700 text-red-100',
            toast.type === 'info' && 'bg-blue-900/90 border-blue-700 text-blue-100',
          )}
        >
          {toast.type === 'success' && <CheckCircle size={18} className="shrink-0" />}
          {toast.type === 'error' && <XCircle size={18} className="shrink-0" />}
          {toast.type === 'info' && <Info size={18} className="shrink-0" />}
          <span className="text-sm flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="opacity-70 hover:opacity-100 shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
