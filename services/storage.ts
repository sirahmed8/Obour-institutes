import { db, messaging, database } from './firebase';
import { getToken } from 'firebase/messaging';
import { ref, onValue, onDisconnect, set, push, remove, serverTimestamp as rtdbTimestamp } from 'firebase/database';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  setDoc,
  updateDoc,
  limit,
  writeBatch,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import { Subject, Resource, Log, SystemSettings, ResourceType, AdminProfile, UserRole } from '../types';

// CLOUDINARY CONFIGURATION
const CLOUDINARY_CLOUD_NAME = "dfvh4jcsh";
const CLOUDINARY_UPLOAD_PRESET = "ml_default";

// FCM VAPID KEY
// Using the key provided to fix "messaging not available" errors
const VAPID_KEY = "BBqchIqmDT58_kPTz1Im15GZsvQuHH58TUQKJhusKeQEG1ZOq3Z4eo5aLGfEevdoKM7HHEg3sueJS3K-CjMwOIY";

export const DBService = {
  // --- REALTIME PRESENCE (Active Users) ---
  trackPresence: () => {
    // Reference to the special '.info/connected' path in Realtime DB
    const connectedRef = ref(database, ".info/connected");
    const listRef = ref(database, "presence");
    
    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // We're connected (or reconnected)!
        const con = push(listRef);
        
        // When I disconnect, remove this device
        onDisconnect(con).remove();
        
        // Add this device to my connections list
        set(con, {
          online: true,
          timestamp: rtdbTimestamp()
        });
      }
    });
  },

  subscribeToActiveUsers: (callback: (count: number) => void) => {
    const listRef = ref(database, "presence");
    return onValue(listRef, (snap) => {
      // The number of children in 'presence' is the number of active tabs/users
      callback(snap.size);
    });
  },

  // --- CLOUDINARY HELPERS ---
  
  /**
   * Returns the raw URL for downloading.
   */
  getDownloadUrl: (url: string): string => {
    return url; 
  },

  getThumbnailUrl: (url: string, type: ResourceType): string => {
    if (!url || !url.includes('cloudinary.com')) return url;
    
    if (type === ResourceType.PDF) {
      return url
        .replace('/upload/', '/upload/w_400,pg_1/')
        .replace(/\.pdf$/i, '.jpg');
    }
    
    return url.replace('/upload/', '/upload/w_400/');
  },

  // --- NOTIFICATIONS (FCM) ---
  requestNotificationPermission: async (): Promise<string | null> => {
    if (!messaging) {
        console.warn("Messaging is not initialized. (Not supported in this browser/environment)");
        return null;
    }

    try {
      // Request permission - browser will handle duplicate requests (returning current status)
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        console.log("FCM Token Generated:", token);
        return token;
      } else if (permission === 'denied') {
        console.warn("Notification permission denied by user.");
        return null;
      } else {
        console.log("Notification permission ignored/default.");
        return null;
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return null;
    }
  },

  // --- Settings ---
  getSettings: async (): Promise<SystemSettings> => {
    const docRef = doc(db, 'settings', 'global');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data() as SystemSettings;
    return { announcement: '', showAnnouncement: false };
  },

  updateSettings: async (settings: SystemSettings): Promise<void> => {
    await setDoc(doc(db, 'settings', 'global'), settings);
  },

  // --- Logging & Analytics ---
  logActivity: async (userId: string, userEmail: string, action: Log['action'], details: string) => {
    try {
      await addDoc(collection(db, 'logs'), {
        userId,
        userEmail,
        action,
        details,
        timestamp: new Date().toISOString()
      });
    } catch (e) { console.error("Log error", e); }
  },

  getLogs: async (limitCount = 100): Promise<Log[]> => {
    const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Log));
  },

  getAnalyticsLogs: async (): Promise<Log[]> => {
    const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(2000));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Log));
  },

  resetAnalytics: async (): Promise<void> => {
    const q = query(
      collection(db, 'logs'), 
      where('action', 'in', ['VIEW_SUBJECT', 'DOWNLOAD_RESOURCE'])
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  },

  clearLogs: async (): Promise<void> => {
    const q = query(collection(db, 'logs'), limit(500));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  },

  // --- Subjects ---
  getSubjects: async (): Promise<Subject[]> => {
    const q = query(collection(db, 'subjects'), orderBy('orderIndex', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id, 
            ...data,
            profName: data.profName || data.professorName || ''
        } as Subject
    });
  },

  subscribeToSubjects: (callback: (subjects: Subject[]) => void) => {
    const q = query(collection(db, 'subjects'), orderBy('orderIndex', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const subjects = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id, 
            ...data,
            profName: data.profName || data.professorName || ''
        } as Subject
      });
      callback(subjects);
    });
  },

  addSubject: async (name: string, profName: string, icon: string, color: string): Promise<void> => {
    const q = query(collection(db, 'subjects'), orderBy('orderIndex', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    let newIndex = 0;
    if (!snapshot.empty) newIndex = snapshot.docs[0].data().orderIndex + 1;

    await addDoc(collection(db, 'subjects'), { name, profName, icon, color, orderIndex: newIndex });
  },

  updateSubject: async (id: string, name: string, profName: string, icon: string, color: string): Promise<void> => {
    const subjectRef = doc(db, 'subjects', id);
    await updateDoc(subjectRef, { name, profName, icon, color });
  },

  swapSubjects: async (subjectA: Subject, subjectB: Subject): Promise<void> => {
    const batch = writeBatch(db);
    batch.update(doc(db, 'subjects', subjectA.id), { orderIndex: subjectB.orderIndex });
    batch.update(doc(db, 'subjects', subjectB.id), { orderIndex: subjectA.orderIndex });
    await batch.commit();
  },

  deleteSubject: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'subjects', id));
  },

  // --- Resources ---
  getResources: async (subjectId?: string): Promise<Resource[]> => {
    let q;
    if (subjectId) {
      q = query(collection(db, 'resources'), where('subjectId', '==', subjectId), orderBy('orderIndex', 'desc'));
    } else {
      q = query(collection(db, 'resources'), orderBy('dateAdded', 'desc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Resource));
  },

  subscribeToResources: (subjectId: string, callback: (resources: Resource[]) => void) => {
    const q = query(collection(db, 'resources'), where('subjectId', '==', subjectId), orderBy('orderIndex', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const resources = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Resource));
      callback(resources);
    });
  },

  // --- CLOUDINARY UPLOAD ---
  uploadFile: async (file: File): Promise<{ url: string; tags: string[]; format: string }> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", "obour_resources"); 

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Cloudinary upload failed");
      }

      const data = await response.json();
      
      return { 
        url: data.secure_url, 
        tags: data.tags || [], 
        format: data.format
      }; 
    } catch (error: any) {
      console.error("Upload Error:", error);
      throw new Error(`Upload Failed: ${error.message}`);
    }
  },

  addResource: async (resource: Omit<Resource, 'id' | 'dateAdded' | 'orderIndex'>): Promise<void> => {
    const timestamp = new Date().toISOString();
    await addDoc(collection(db, 'resources'), {
      ...resource,
      dateAdded: timestamp,
      orderIndex: Date.now() 
    });
  },

  updateResource: async (id: string, title: string, description: string): Promise<void> => {
    const resourceRef = doc(db, 'resources', id);
    await updateDoc(resourceRef, { title, description });
  },

  deleteResource: async (id: string): Promise<void> => {
    const docRef = doc(db, 'resources', id);
    await deleteDoc(docRef);
  },

  // --- AI Context ---
  getAllDataForAI: async (): Promise<string> => {
      const subjects = await DBService.getSubjects();
      const q = query(collection(db, 'resources'), limit(200)); 
      const resSnap = await getDocs(q);
      const resources = resSnap.docs.map(d => d.data() as Resource);
      
      let context = "CURRICULUM DATA:\n";
      subjects.forEach(sub => {
          context += `\nSUBJECT: ${sub.name} (Prof: ${sub.profName})\n`;
          const subResources = resources.filter(r => r.subjectId === sub.id);
          if (subResources.length > 0) {
              subResources.forEach(r => context += `  - ${r.title}: ${r.description}\n`);
          }
      });
      return context;
  },

  // --- Team Management ---
  addAdmin: async (email: string, role: UserRole): Promise<void> => {
    await setDoc(doc(db, 'admins', email), {
      email,
      role,
      addedAt: new Date().toISOString()
    });
  },

  updateAdminRole: async (email: string, role: UserRole): Promise<void> => {
    await updateDoc(doc(db, 'admins', email), { role });
  },

  removeAdmin: async (email: string): Promise<void> => {
    await deleteDoc(doc(db, 'admins', email));
  },

  getAdmins: async (): Promise<AdminProfile[]> => {
    const snapshot = await getDocs(collection(db, 'admins'));
    return snapshot.docs.map(doc => doc.data() as AdminProfile);
  }
};