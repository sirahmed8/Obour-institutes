
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider, db } from '../services/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { DBService } from '../services/storage';
import { UserRole, AdminProfile, AdminPermissions } from '../types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  role: UserRole | null;
  permissions: AdminPermissions;
  canEdit: boolean; // Legacy/Shorthand for subject editing
  canDelete: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPER_ADMIN_EMAIL = 'a7medorabe7@gmail.com';

const DEFAULT_PERMISSIONS: AdminPermissions = {
  canCreateBanner: false,
  canSendEmails: false,
  canSendNotifications: false,
  canUploadResources: false,
  canEditSubjects: false
};

const FULL_PERMISSIONS: AdminPermissions = {
  canCreateBanner: true,
  canSendEmails: true,
  canSendNotifications: true,
  canUploadResources: true,
  canEditSubjects: true
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<AdminPermissions>(DEFAULT_PERMISSIONS);

  const fetchUserRoleAndPermissions = async (user: User): Promise<{ role: UserRole | null, perms: AdminPermissions }> => {
    if (user.email === SUPER_ADMIN_EMAIL) return { role: 'super_admin', perms: FULL_PERMISSIONS };

    try {
      const adminDoc = await getDoc(doc(db, 'admins', user.email!));
      if (adminDoc.exists()) {
        const data = adminDoc.data() as AdminProfile;
        // Mapping "editor" to "admin" for legacy support if DB has old data
        const userRole = (data.role as string) === 'editor' ? 'admin' : data.role;
        
        let perms = DEFAULT_PERMISSIONS;
        if (userRole === 'super_admin') {
           perms = FULL_PERMISSIONS;
        } else if (userRole === 'admin') {
           // If admin has specific permissions, use them, otherwise default to all-false or some logic
           // If migrating from 'editor', maybe we want to give them some defaults? 
           // For now, respect what's in DB, if allowed.
           if (data.permissions) {
               perms = data.permissions;
           } else if ((data.role as string) === 'editor') {
               // Legacy editors get full edit rights by default during migration
               perms = { ...DEFAULT_PERMISSIONS, canEditSubjects: true, canUploadResources: true };
           }
        }
        
        if (userRole) return { role: userRole, perms };
      }
    } catch (error) {
      console.error("Error fetching admin role:", error);
    }
    return { role: null, perms: DEFAULT_PERMISSIONS };
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
    setPermissions(DEFAULT_PERMISSIONS);
    setCurrentUser(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const { role, perms } = await fetchUserRoleAndPermissions(user);
        setRole(role);
        setPermissions(perms);
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setRole(null);
        setPermissions(DEFAULT_PERMISSIONS);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = role !== null;
  // Dynamic permission checks
  const canEdit = role === 'super_admin' || permissions.canEditSubjects; 
  const canDelete = role === 'super_admin';

  return (
    <AuthContext.Provider value={{ currentUser, loading, isAdmin, role, permissions, canEdit, canDelete, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
