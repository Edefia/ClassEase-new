import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, Info, CheckCircle, X } from 'lucide-react';

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useConfirm() {
  const [dialog, setDialog] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialog({
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure you want to proceed?',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'danger', // 'danger' | 'warning' | 'info' | 'success'
      });
    });
  }, []);

  const handleConfirm = () => {
    resolveRef.current?.(true);
    setDialog(null);
  };

  const handleCancel = () => {
    resolveRef.current?.(false);
    setDialog(null);
  };

  const Dialog = () => (
    <ConfirmDialog
      open={!!dialog}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      {...(dialog || {})}
    />
  );

  return { confirm, ConfirmDialog: Dialog };
}

// ─── Visual Component ─────────────────────────────────────────────────────────
const VARIANTS = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
    confirmBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    borderTop: 'border-t-red-500',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    confirmBg: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400',
    borderTop: 'border-t-amber-500',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    confirmBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    borderTop: 'border-t-blue-500',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    confirmBg: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
    borderTop: 'border-t-emerald-500',
  },
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) {
  const v = VARIANTS[variant] || VARIANTS.danger;
  const Icon = v.icon;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border-t-4 ${v.borderTop}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${v.iconBg}`}>
                  <Icon className={`w-6 h-6 ${v.iconColor}`} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="text-base font-bold text-gray-900 leading-snug mb-1">
                    {title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {message}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm ${v.confirmBg}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ConfirmDialog;
