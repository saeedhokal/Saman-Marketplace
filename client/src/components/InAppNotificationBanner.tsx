import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  body: string;
}

let showNotificationCallback: ((notification: { title: string; body: string }) => void) | null = null;

export function showInAppNotification(title: string, body: string) {
  if (showNotificationCallback) {
    showNotificationCallback({ title, body });
  }
}

export function InAppNotificationBanner() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: { title: string; body: string }) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, ...notification }]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  useEffect(() => {
    showNotificationCallback = addNotification;
    return () => {
      showNotificationCallback = null;
    };
  }, [addNotification]);

  return (
    <div 
      className="fixed left-0 right-0 z-[9999] pointer-events-none flex flex-col items-center px-4 gap-2"
      style={{
        top: 'max(env(safe-area-inset-top, 20px), 20px)',
        paddingTop: '8px'
      }}
    >
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 25 
            }}
            className="pointer-events-auto w-full max-w-sm"
          >
            <div 
              className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-[20px] shadow-2xl border border-white/20 dark:border-zinc-700/50 overflow-hidden"
              style={{
                boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)'
              }}
            >
              <div className="flex items-start gap-3 p-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {notification.title}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-0.5">
                    {notification.body}
                  </p>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  data-testid="button-close-notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
                className="h-1 bg-gradient-to-r from-amber-500 to-orange-600"
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
