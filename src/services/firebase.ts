import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';
import { getDatabase } from 'firebase/database';

// Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDSJeoNeXeGF8OegC5xp2AHQ2qmUWjq_OE",
  authDomain: "obour-institutes-a607d.firebaseapp.com",
  projectId: "obour-institutes-a607d",
  storageBucket: "obour-institutes-a607d.firebasestorage.app",
  messagingSenderId: "761134603194",
  appId: "1:761134603194:web:dddcd24031105654935b83",
  measurementId: "G-M6ETHD5FLV",
  databaseURL: "https://obour-institutes-a607d-default-rtdb.firebaseio.com/"
};

// Initialize App
const app = initializeApp(firebaseConfig);

// Export Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const database = getDatabase(app);

// Initialize Messaging safely (Client-side only check)
let msg = null;
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    msg = getMessaging(app);
  }
} catch (error) {
  console.warn("Firebase Messaging not supported in this environment.", error);
}
export const messaging = msg;

export const googleProvider = new GoogleAuthProvider();