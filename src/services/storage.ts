
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
const VAPID_KEY = "BBqchIqmDT58_kPTz1Im15GZsvQuHH58TUQKJhusKeQEG1ZOq3Z4eo5aLGfEevdoKM7HHEg3sueJS3K-CjMwOIY";

export const DBService = {
  // --- REALTIME PRESENCE (Active Users) ---
  trackPresence: () => {
    const connectedRef = ref(database, ".info/connected");
    const listRef = ref(database, "presence");
    
    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        const con = push(listRef);
        onDisconnect(con).remove();
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
      callback(snap.size);
    });
  },

  // --- CLOUDINARY HELPERS ---
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
        console.warn("Messaging is not initialized.");
        return null;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        return token;
      } else {
        console.warn("Notification permission ignored/default.");
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

  updateSettings: async (settings: SystemSettings, addToHistory = false): Promise<void> => {
    const updateData: any = { ...settings };
    await setDoc(doc(db, 'settings', 'global'), updateData, { merge: true });
  },

  sendBroadcast: async (subject: string, message: string) => {
      // Legacy support - sends to notification center
      await DBService.sendNotification(subject, message);
  },

  sendNotification: async (title: string, body: string, link = '/', type = 'announcement') => {
      const timestamp = new Date().toISOString();
      await addDoc(collection(db, 'notifications'), {
          title,
          body,
          subjectName: 'System Alert',
          link,
          type,
          createdAt: timestamp,
          readBy: []
      });
  },

  sendEmail: async (subject: string, html: string) => {
      // Writes to 'mail' collection for Firebase Extension to pick up
      await addDoc(collection(db, 'mail'), {
          to: 'noreply@obour.edu', // Broadcast usually implies bcc to all, but for extension payload structure:
          message: {
            subject: subject,
            html: html,
          },
          // In a real app with "Trigger Email" extension, this prompts the email sending
          delivery: {
              startTime: new Date()
          }
      });
  },

  getSystemApiKey: async (keyName: string): Promise<string | null> => {
    const envKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
    if (keyName === 'gemini' && envKey) return envKey;
    
    try {
      const docRef = doc(db, 'settings', 'api_keys');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) return docSnap.data()[keyName] || null;
    } catch (e) { console.error(e); }
    return null;
  },

  saveSystemApiKey: async (keyName: string, value: string): Promise<void> => {
    await setDoc(doc(db, 'settings', 'api_keys'), { [keyName]: value }, { merge: true });
  },

  // --- Logging & Analytics ---
  logActivity: async (userId: string, userEmail: string, action: string, details: string) => {
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

  getSystemLogs: async (limitCount = 100): Promise<Log[]> => {
    const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Log));
  },

  clearSystemLogs: async (): Promise<void> => {
      const q = query(collection(db, 'logs'), limit(500));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
  },

  getAnalyticsLogs: async (): Promise<Log[]> => {
    const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(2000));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Log));
  },

  resetAnalytics: async (): Promise<void> => {
    const q = query(
      collection(db, 'logs'), 
      where('action', 'in', ['VIEW_SUBJECT', 'DOWNLOAD_RESOURCE', 'VIEW_FILE'])
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  },

  // --- Subjects ---
  getSubjects: async (): Promise<Subject[]> => {
    const q = query(collection(db, 'subjects'), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id, 
            name: data.name,
            profName: data.profName || data.professorName || '',
            color: data.color || 'bg-indigo-100',
            icon: data.icon || 'BookOpen',
            orderIndex: data.orderIndex || 0
        } as Subject
    });
  },

  getSubject: async (id: string): Promise<Subject | null> => {
      const docRef = doc(db, 'subjects', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
          const data = snap.data();
          return { 
              id: snap.id, 
              name: data.name,
              profName: data.profName || data.professorName || '',
              color: data.color || 'bg-indigo-100',
              icon: data.icon || 'BookOpen',
              orderIndex: data.orderIndex || 0
          } as Subject;
      }
      return null;
  },

  subscribeToSubjects: (callback: (subjects: Subject[]) => void) => {
    const q = query(collection(db, 'subjects'), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const subjects = snapshot.docs.map(doc => {
        const data = doc.data() as any;
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
    return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Resource));
  },

  subscribeToResources: (subjectId: string, callback: (resources: Resource[]) => void) => {
    const q = query(collection(db, 'resources'), where('subjectId', '==', subjectId), orderBy('orderIndex', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const resources = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Resource));
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
    const docRef = await addDoc(collection(db, 'resources'), {
      ...resource,
      dateAdded: timestamp,
      orderIndex: Date.now() 
    });

    // Fetch Subject Name for clearer notification
    let subjectName = 'New Update';
    const sub = await DBService.getSubjects();
    const found = sub.find(s => s.id === resource.subjectId);
    if (found) subjectName = found.name;

    // Trigger Notification
    await DBService.sendNotification(
        `New Resource: ${subjectName}`, 
        resource.title, 
        `/subject/${resource.subjectId}?highlight=${docRef.id}`, // Deep Link
        'file'
    );
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
      const resources = resSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Resource));
      
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
  addAdmin: async (email: string, role: UserRole, permissions?: any): Promise<void> => {
    await setDoc(doc(db, 'admins', email), {
      email,
      role,
      addedAt: new Date().toISOString(),
      permissions
    });
  },

  updateAdminRole: async (email: string, role: UserRole): Promise<void> => {
    await updateDoc(doc(db, 'admins', email), { role });
  },

  removeAdmin: async (email: string): Promise<void> => {
    await deleteDoc(doc(db, 'admins', email));
  },

  // --- System Errors ---
  reportError: async (errorMsg: string, context?: string) => {
      try {
          await addDoc(collection(db, 'system_errors'), {
              error: errorMsg,
              context: context || 'General',
              timestamp: new Date().toISOString(),
              resolved: false
          });
      } catch (e) {
         console.error("Self-reporting failed", e);
      }
  },

  getSystemErrors: async () => {
      try {
          const q = query(collection(db, 'system_errors'), orderBy('timestamp', 'desc'), limit(50));
          const snapshot = await getDocs(q);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) {
          console.error(e);
          return [];
      }
  },

  resolveError: async (id: string) => {
      await setDoc(doc(db, 'system_errors', id), { resolved: true }, { merge: true });
  },

  // --- Team Management ---
  getAdmins: async (): Promise<AdminProfile[]> => {
    const snapshot = await getDocs(collection(db, 'admins'));
    return snapshot.docs.map(doc => doc.data() as AdminProfile);
  },

  // --- Inbox / Admin Chat ---
  sendInboxMessage: async (userId: string, userEmail: string, message: string, attachments: {url: string, type: string}[] = []) => {
      await addDoc(collection(db, 'inbox'), {
          userId,
          userEmail,
          message,
          attachments,
          timestamp: new Date().toISOString(),
          read: false,
          archived: false
      });
  },

  replyToUser: async (userId: string, message: string, originalMessageId?: string) => {
      // Create a notification for the user
      await addDoc(collection(db, 'notifications'), {
          title: 'Admin Reply',
          body: message,
          link: '/#chatbot', // Direct them to chatbot
          type: 'message',
          recipientId: userId, // Targeted notification
          relatedMessageId: originalMessageId,
          createdAt: new Date().toISOString(),
          read: false
      });

      // Also mark original message as replied (optional but good for UI)
      if (originalMessageId) {
          try {
              await updateDoc(doc(db, 'inbox', originalMessageId), { replied: true });
          } catch(e) { console.error("Failed to mark replied", e); }
      }
  }
};
