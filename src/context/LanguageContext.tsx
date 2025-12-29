
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'login': 'Login',
    'logout': 'Logout',
    'student_view': 'Student View',
    'admin_hub': 'Admin Hub',
    'owner_hub': 'Owner Hub',
    'search': 'Search subjects...',
    'home': 'Home',
    'theme': 'Appearance',
    'language': 'Language',
    'welcome': 'Welcome to',
    'subjects': 'Academic Subjects',
    'view_resources': 'View Resources',
    'sign_in': 'Sign In',
    'important_announcement': 'Announcement',
    'add_member': 'Add New Member',
    'email_placeholder': 'Enter email address',
    'role': 'Role',
    'viewer': 'Viewer',
    'editor': 'Editor',
    'owner': 'Owner',
    'active_team': 'Active Team Members',
    'notifications': 'Push Notifications',
    'email_updates': 'Email Updates',
    'no_matches': 'No results found',
    'save': 'Save Changes',
    'cancel': 'Cancel',
    'delete': 'Delete'
  },
  ar: {
    'login': 'دخول',
    'logout': 'خروج',
    'student_view': 'عرض الطالب',
    'admin_hub': 'لوحة التحكم',
    'owner_hub': 'لوحة المالك',
    'search': 'ابحث عن المواد...',
    'home': 'الرئيسية',
    'theme': 'المظهر',
    'language': 'اللغة',
    'welcome': 'مرحباً بكم في',
    'subjects': 'المواد الدراسية',
    'view_resources': 'عرض المصادر',
    'sign_in': 'تسجيل الدخول',
    'important_announcement': 'إعلان هام',
    'add_member': 'إضافة عضو جديد',
    'email_placeholder': 'أدخل البريد الإلكتروني',
    'role': 'الصلاحية',
    'viewer': 'مشاهد',
    'editor': 'محرر',
    'owner': 'مالك',
    'active_team': 'أعضاء الفريق الحاليين',
    'notifications': 'تنبيهات المتصفح',
    'email_updates': 'نشرة البريد',
    'no_matches': 'لا توجد نتائج مطابقة',
    'save': 'حفظ التغييرات',
    'cancel': 'إلغاء',
    'delete': 'حذف'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'ar';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  useEffect(() => {
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => translations[language][key] || key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir: language === 'ar' ? 'rtl' : 'ltr' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
