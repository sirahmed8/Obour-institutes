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
  role: UserRole | null; // The specific role (super_admin, editor, viewer)
  canEdit: boolean;      // Helper: true if super_admin or editor
  canDelete: boolean;    // Helper: true if super_admin only
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Safety net: Hardcoded Super Admin to prevent lockout if DB is empty
const SUPER_ADMIN_EMAIL = 'a7medorabe7@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);

  const fetchUserRole = async (user: User): Promise<UserRole | null> => {
    // 1. Check Hardcoded Super Admin
    if (user.email === SUPER_ADMIN_EMAIL) return 'super_admin';

    // 2. Check Firestore 'admins' collection
    try {
      const adminDoc = await getDoc(doc(db, 'admins', user.email!));
      if (adminDoc.exists()) {
        const data = adminDoc.data() as AdminProfile;
        return data.role || 'viewer';
      }
    } catch (error) {
      console.error("Error fetching admin role:", error);
    }
    return null; // Not an admin
  };

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Update Public User Record
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        lastLogin: serverTimestamp(),
      }, { merge: true });

      // Log the session
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
        // User is signed in
        const userRole = await fetchUserRole(user);
        setRole(userRole);
        setCurrentUser(user);
      } else {
        // User is signed out
        setCurrentUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Derived Permissions
  const isAdmin = role !== null;
  const canEdit = role === 'super_admin' || role === 'editor';
  const canDelete = role === 'super_admin';

  const value = {
    currentUser,
    loading,
    isAdmin,
    role,
    canEdit,
    canDelete,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};