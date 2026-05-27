import { useState, useEffect, useCallback, useRef } from 'react';

interface ToastState {
  msg: string;
  id: number;
  leaving: boolean;
}

let globalShowToast: ((msg: string) => void) | null = null;

export function useToastTrigger() {
  return useCallback((msg: string) => {
    globalShowToast?.(msg);
  }, []);
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const counterRef = useRef(0);

  useEffect(() => {
    globalShowToast = (msg: string) => {
      const id = ++counterRef.current;
      setToasts(prev => [...prev, { msg, id, leaving: false }]);
      setTimeout(() => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
        }, 300);
      }, 2600);
    };
    return () => { globalShowToast = null; };
  }, []);

  return (
    <div style={{ position: 'fixed', bottom: '1.4rem', right: '1.4rem', zIndex: 999, display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
      {toasts.map(t => (
        <div key={t.id} className={`bl-toast${t.leaving ? ' leaving' : ''}`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
