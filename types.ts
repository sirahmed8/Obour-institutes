import { Book, Code, Calculator, Beaker, Globe, Briefcase, Music, Cpu, Database, PenTool, Layout, Server, Shield, FileText, Atom } from 'lucide-react';

// --- RBAC & Users ---
export type UserRole = 'super_admin' | 'editor' | 'viewer';

export interface AdminProfile {
  email: string;
  role: UserRole;
  addedAt: string;
}

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role?: UserRole; // Optional, only exists if they are an admin
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
  action: 'LOGIN' | 'VIEW_SUBJECT' | 'DOWNLOAD_RESOURCE' | 'CREATE_SUBJECT' | 'DELETE_ITEM' | 'UPDATE_SETTINGS' | 'ADD_ADMIN' | 'REORDER' | 'CLEAR_LOGS';
  details: string;
  timestamp: string;
}

export interface SystemSettings {
  announcement: string;
  showAnnouncement: boolean;
  chatbotMode?: 'online' | 'offline'; // New: Toggle between AI API and offline mode
}

// --- Visuals ---
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
  'Atom': Atom
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
];