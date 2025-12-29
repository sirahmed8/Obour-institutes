import { useEffect, useState } from 'react';
import { ref, onValue, onDisconnect, set, push, serverTimestamp } from 'firebase/database';
import { database } from '../services/firebase';

export const usePresence = () => {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    // 1. Reference to the special Firebase connection state
    const connectedRef = ref(database, '.info/connected');
    const presenceListRef = ref(database, 'presence');

    // 2. Handle Connection State
    const unsubscribeConnected = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // We are connected. Create a reference for this user in the 'presence' list.
        const userRef = push(presenceListRef);

        // When we disconnect, remove this reference.
        onDisconnect(userRef).remove();

        // Set the reference to true to mark us as online.
        set(userRef, {
          online: true,
          timestamp: serverTimestamp()
        });
      }
    });

    // 3. Listen for changes in the total count of online users
    const unsubscribeList = onValue(presenceListRef, (snap) => {
      setOnlineCount(snap.size);
    });

    return () => {
      unsubscribeConnected();
      unsubscribeList();
    };
  }, []);

  return onlineCount;
};