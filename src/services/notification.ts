
import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { messaging } from './firebase';

const VAPID_KEY = "BBqchIqmDT58_kPTz1Im15GZsvQuHH58TUQKJhusKeQEG1Z0q3Z4eo5aLGfEevdoKM7HHEg3sueJS3K-CjMw0IY";

export const NotificationService = {
  /**
   * Checks if notifications are supported and permitted.
   */
  getPermissionState: (): NotificationPermission | 'unsupported' => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  },

  /**
   * Requests permission and retrieves the FCM token.
   */
  requestPermission: async (): Promise<string | null> => {
    if (!messaging) {
      console.warn("Messaging not supported in this environment.");
      return null;
    }

    try {
      // 1. If already denied, asking again usually throws error or returns denied immediately.
      // We return null so the UI can handle the "Instruction Manual" logic.
      if (Notification.permission === 'denied') {
        console.warn("Notification permission is blocked by browser.");
        return null;
      }

      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        console.log("FCM Token Generated:", token);
        return token;
      } else {
        console.warn("Notification permission denied/dismissed.");
        return null;
      }
    } catch (error) {
      console.error("Notification Error:", error);
      return null;
    }
  },

  /**
   * Listen for foreground messages.
   */
  onMessageListener: (): Promise<MessagePayload> => {
    return new Promise((resolve) => {
      if (messaging) {
        onMessage(messaging, (payload) => {
          resolve(payload);
        });
      }
    });
  }
};
