import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastProps {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
}

interface ToastContextType {
  success: (title: string, message?: string, options?: any) => void;
  error: (title: string, message?: string, options?: any) => void;
  warning: (title: string, message?: string, options?: any) => void;
  info: (title: string, message?: string, options?: any) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastCount = 0;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (variant: ToastVariant, title: string, message?: string, options?: any) => {
    const id = `toast-${++toastCount}`;
    setToasts((prev) => {
      const newToasts = [...prev, { id, variant, title, message, ...options }];
      if (newToasts.length > 5) return newToasts.slice(1);
      return newToasts;
    });

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const api = {
    success: (t: string, m?: string, o?: any) => addToast("success", t, m, o),
    error: (t: string, m?: string, o?: any) => addToast("error", t, m, o),
    warning: (t: string, m?: string, o?: any) => addToast("warning", t, m, o),
    info: (t: string, m?: string, o?: any) => addToast("info", t, m, o),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

const ToastItem: React.FC<{ toast: ToastProps; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Keep it here unless user hovers? Simplified version here.
  }, []);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(onDismiss, 200);
  };

  const variants = {
    success: { icon: CheckCircle, color: "var(--status-success)" },
    error: { icon: AlertCircle, color: "var(--status-danger)" },
    warning: { icon: AlertTriangle, color: "var(--status-warning)" },
    info: { icon: Info, color: "var(--status-info)" },
  };

  const { icon: Icon, color } = variants[toast.variant];

  return (
    <div
      className={`w-[320px] bg-[var(--bg-elevated)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] p-3 pointer-events-auto flex items-start gap-3 transition-all duration-200 border border-[var(--border-subtle)] ${
        isLeaving ? "translate-x-[120%] opacity-0" : "animate-toast-enter"
      }`}
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color }} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-[var(--text-primary)]">{toast.title}</div>
        {toast.message && (
          <div className="text-[12px] text-[var(--text-secondary)] mt-1 leading-[1.4]">{toast.message}</div>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="text-[12px] font-medium text-[var(--text-primary)] mt-2 hover:underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button onClick={handleDismiss} className="text-[var(--text-tertiary)] hover:text-white mt-0.5">
        <X className="w-4 h-4" />
      </button>

      <style>{`
        @keyframes toast-enter {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-toast-enter { animation: toast-enter 250ms cubic-bezier(0.175, 0.885, 0.32, 1.275); }
      `}</style>
    </div>
  );
};
