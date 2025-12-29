
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider, db } from '../services/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { DBService } from '../services/storage';
import { UserRole, AdminProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  role: UserRole | null;
  canEdit: boolean;
  canDelete: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPER_ADMIN_EMAIL = 'a7medorabe7@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);

  const fetchUserRole = async (user: User): Promise<UserRole | null> => {
    if (user.email === SUPER_ADMIN_EMAIL) return 'super_admin';

    try {
      const adminDoc = await getDoc(doc(db, 'admins', user.email!));
      if (adminDoc.exists()) {
        const data = adminDoc.data() as AdminProfile;
        return data.role || 'viewer';
      }
    } catch (error) {
      console.error("Error fetching admin role:", error);
    }
    return null;
  };

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        lastLogin: serverTimestamp(),
      }, { merge: true });

      await DBService.logActivity(
        user.uid, 
        user.email || 'unknown', 
        'LOGIN', 
        'User logged in via Google'
      );

    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setRole(null);
    setCurrentUser(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRole = await fetchUserRole(user);
        setRole(userRole);
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = role !== null;
  const canEdit = role === 'super_admin' || role === 'editor';
  const canDelete = role === 'super_admin';

  return (
    <AuthContext.Provider value={{ currentUser, loading, isAdmin, role, canEdit, canDelete, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
