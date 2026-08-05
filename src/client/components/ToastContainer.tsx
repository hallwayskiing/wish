import React from 'react';

export interface ToastMessage {
  id: string;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  return (
    <div className="toast-container" id="toastContainer" role="status" aria-live="polite" aria-atomic="false">
      {toasts.map(toast => (
        <div key={toast.id} className="toast" role="status">
          {toast.message}
        </div>
      ))}
    </div>
  );
};
