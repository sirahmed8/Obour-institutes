type ToastType = 'success' | 'error' | 'info';

export interface ToastEvent {
  id: string;
  message: string;
  type: ToastType;
}

// Simple Event Emitter
class ToastManager {
  private listeners: ((toast: ToastEvent) => void)[] = [];

  subscribe(listener: (toast: ToastEvent) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(message: string, type: ToastType) {
    const id = Math.random().toString(36).substring(2, 9);
    const event: ToastEvent = { id, message, type };
    this.listeners.forEach(l => l(event));
  }
}

export const toastManager = new ToastManager();

export const toast = {
  success: (msg: string) => toastManager.notify(msg, 'success'),
  error: (msg: string) => toastManager.notify(msg, 'error'),
  info: (msg: string) => toastManager.notify(msg, 'info'),
};