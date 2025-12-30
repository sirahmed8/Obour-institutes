
import { Book, Code, Calculator, Beaker, Globe, Briefcase, Music, Cpu, Database, PenTool, Layout, Server, Shield, FileText, Atom, Cloud, Smartphone, Wifi, Terminal, Grid, BarChart, Layers } from 'lucide-react';

// --- RBAC & Users ---
// 'super_admin' is the top-level owner with all permissions
export type UserRole = 'super_admin' | 'admin' | 'viewer';

export interface AdminPermissions {
  canCreateBanner: boolean;
  canSendEmails: boolean;
  canSendNotifications: boolean;
  canUploadResources: boolean;
  canEditSubjects: boolean;
}

export interface AdminProfile {
  email: string;
  role: UserRole;
  addedAt: string;
  permissions?: AdminPermissions; // Only for 'admin' role
}

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role?: UserRole;
  newsletterSubscribed?: boolean; // New Field for Email Preferences
}

// --- Content ---
export interface Subject {
  id: string;
  name: string;
  profName: string;
  color: string;
  icon: string;
  orderIndex: number;
}

export enum ResourceType {
  PDF = 'PDF',
  LINK = 'LINK',
}

export interface Resource {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  type: ResourceType;
  url: string;
  dateAdded: string;
  orderIndex: number;
}

// --- System & Logs ---
export interface Log {
  id: string;
  userId: string;
  userEmail: string;
  action: string; // Dynamic string for flexibility
  details: string;
  timestamp: string;
}

export interface SystemSettings {
  announcement: string;
  showAnnouncement: boolean;
  bannerType?: 'info' | 'warning' | 'success' | 'announcement';
  apiBaseUrl?: string;
  bannerHistory?: { text: string, date: string }[];
  chatbotMode?: 'online' | 'offline'; // Toggle between AI API and offline mode
}

export const ICON_MAP: { [key: string]: any } = {
  'Book': Book,
  'Code': Code,
  'Math': Calculator,
  'Science': Beaker,
  'Globe': Globe,
  'Business': Briefcase,
  'Arts': Music,
  'Hardware': Cpu,
  'Database': Database,
  'Design': PenTool,
  'Web': Layout,
  'Server': Server,
  'Security': Shield,
  'File': FileText,
  'Atom': Atom,
  'Cloud': Cloud,
  'Mobile': Smartphone,
  'Network': Wifi,
  'Terminal': Terminal,
  'Grid': Grid,
  'Chart': BarChart,
  'Layers': Layers
};

export const COLOR_PALETTE = [
  { name: 'Indigo', class: 'bg-indigo-500' },
  { name: 'Emerald', class: 'bg-emerald-500' },
  { name: 'Rose', class: 'bg-rose-500' },
  { name: 'Amber', class: 'bg-amber-500' },
  { name: 'Sky', class: 'bg-sky-500' },
  { name: 'Violet', class: 'bg-violet-500' },
  { name: 'Slate', class: 'bg-slate-500' },
  { name: 'Orange', class: 'bg-orange-500' },
  { name: 'Red', class: 'bg-red-500' },
  { name: 'Pink', class: 'bg-pink-500' },
  { name: 'Cyan', class: 'bg-cyan-500' },
  { name: 'Teal', class: 'bg-teal-500' },
  { name: 'Lime', class: 'bg-lime-500' },
  { name: 'Fuchsia', class: 'bg-fuchsia-500' },
];

// --- Chat & Support ---
export interface Message {
  id: string;
  text: string;
  senderId: string; // 'admin' or userId
  senderEmail?: string;
  timestamp: any;
  status: 'sent' | 'delivered' | 'seen';
  type: 'text' | 'file' | 'audio' | 'image';
  fileUrl?: string; // For attachments
  reactions?: Record<string, string>; // { userId: '👍' }
  isDeleted?: boolean;
  replyTo?: { id: string; text: string; sender: string } | null;
}

export interface Conversation {
  id: string; // userId
  userEmail: string;
  displayName?: string;
  photoURL?: string; // Cached profile pic
  lastMessage: string;
  lastMessageTimestamp: any;
  unreadCount: number; // For admin
  userUnreadCount?: number; // For user
  isArchived?: boolean;
}
