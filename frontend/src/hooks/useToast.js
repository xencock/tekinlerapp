import toast from 'react-hot-toast';

// Modern ve kullanıcı dostu toast mesajları için özel hook
export const useToast = () => {
  // Başarı mesajları için özelleştirilmiş toast
  const success = (message, options = {}) => {
    return toast.success(message, {
      duration: 3000,
      position: 'top-right',
      onClick: (toast) => toast.dismiss(),
      style: {
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        color: '#ffffff',
        padding: '16px 20px',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.4), 0 0 0 1px rgba(16, 185, 129, 0.2)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        fontSize: '14px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        userSelect: 'none',
        animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      iconTheme: {
        primary: '#ffffff',
        secondary: '#10b981',
      },
      ...options,
    });
  };

  // Hata mesajları için özelleştirilmiş toast
  const error = (message, options = {}) => {
    return toast.error(message, {
      duration: 4500,
      position: 'top-right',
      onClick: (toast) => toast.dismiss(),
      style: {
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        color: '#ffffff',
        padding: '16px 20px',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.4), 0 0 0 1px rgba(239, 68, 68, 0.2)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        fontSize: '14px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        userSelect: 'none',
        animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      iconTheme: {
        primary: '#ffffff',
        secondary: '#ef4444',
      },
      ...options,
    });
  };

  // Bilgi mesajları için özelleştirilmiş toast
  const info = (message, options = {}) => {
    return toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: '💡',
      onClick: (toast) => toast.dismiss(),
      style: {
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(37, 99, 235, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        color: '#ffffff',
        padding: '16px 20px',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.2)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        fontSize: '14px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        userSelect: 'none',
        animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      ...options,
    });
  };

  // Uyarı mesajları için özelleştirilmiş toast
  const warning = (message, options = {}) => {
    return toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: '⚠️',
      onClick: (toast) => toast.dismiss(),
      style: {
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.95) 0%, rgba(217, 119, 6, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        color: '#ffffff',
        padding: '16px 20px',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(245, 158, 11, 0.4), 0 0 0 1px rgba(245, 158, 11, 0.2)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        fontSize: '14px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        userSelect: 'none',
        animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      ...options,
    });
  };

  // Yükleme mesajları için özelleştirilmiş toast
  const loading = (message, options = {}) => {
    return toast.loading(message, {
      position: 'top-right',
      onClick: (toast) => toast.dismiss(),
      style: {
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.95) 0%, rgba(139, 92, 246, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        color: '#ffffff',
        padding: '16px 20px',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.2)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        fontSize: '14px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        userSelect: 'none',
        animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      iconTheme: {
        primary: '#ffffff',
        secondary: '#6366f1',
      },
      ...options,
    });
  };

  // Promise tabanlı toast (async işlemler için)
  const promise = (promise, messages, options = {}) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'Yükleniyor...',
        success: messages.success || 'Başarılı!',
        error: messages.error || 'Hata oluştu!',
      },
      {
        position: 'top-right',
        style: {
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          fontSize: '14px',
          fontWeight: '500',
          padding: '16px 20px',
        },
        success: {
          style: {
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)',
            color: '#ffffff',
            boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.4), 0 0 0 1px rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#10b981',
          },
        },
        error: {
          style: {
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%)',
            color: '#ffffff',
            boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.4), 0 0 0 1px rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#ef4444',
          },
        },
        loading: {
          style: {
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.95) 0%, rgba(139, 92, 246, 0.95) 100%)',
            color: '#ffffff',
            boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.2)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#6366f1',
          },
        },
        ...options,
      }
    );
  };

  // Toast'ı kapat
  const dismiss = (toastId) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  };

  return {
    success,
    error,
    info,
    warning,
    loading,
    promise,
    dismiss,
  };
};

// Kısa kullanım için direkt export'lar
export const showSuccess = (message, options) => useToast().success(message, options);
export const showError = (message, options) => useToast().error(message, options);
export const showInfo = (message, options) => useToast().info(message, options);
export const showWarning = (message, options) => useToast().warning(message, options);
export const showLoading = (message, options) => useToast().loading(message, options);
