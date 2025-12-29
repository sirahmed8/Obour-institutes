import { getToken } from 'firebase/messaging';
import { messaging } from './firebase';

const VAPID_KEY = "BBqchIqmDT58_kPTz1Im15GZsvQuHH58TUQKJhusKeQEG1Z0q3Z4eo5aLGfEeVdoKM7HHEg3sueJS3K-CjMw0IY";

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
   * Handles re-requests gracefully.
   */
  requestPermission: async (): Promise<string | null> => {
    if (!messaging) {
      console.warn("Messaging not supported.");
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        console.log("FCM Token:", token);
        return token;
      } else {
        console.warn("Notification permission denied.");
        return null;
      }
    } catch (error) {
      console.error("Notification Error:", error);
      return null;
    }
  }
};