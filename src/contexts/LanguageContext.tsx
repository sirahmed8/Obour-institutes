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
    'admin_portal': 'Admin Portal',
    'student_view': 'Student View',
    'search_placeholder': 'Search subjects...',
    'home': 'Home',
    'theme': 'Theme',
    'language': 'Language',
    'welcome': 'Welcome',
    'subjects': 'Subjects',
    'resources': 'Resources',
    'sign_in': 'Sign In',
    'profile': 'Profile',
    'settings': 'Settings',
    'search': 'Search'
  },
  ar: {
    'login': 'تسجيل الدخول',
    'logout': 'تسجيل الخروج',
    'admin_portal': 'بوابة المشرف',
    'student_view': 'عرض الطالب',
    'search_placeholder': 'ابحث عن المواد...',
    'home': 'الرئيسية',
    'theme': 'المظهر',
    'language': 'اللغة',
    'welcome': 'مرحباً',
    'subjects': 'المواد',
    'resources': 'المصادر',
    'sign_in': 'دخول',
    'profile': 'الملف الشخصي',
    'settings': 'الإعدادات',
    'search': 'بحث'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    // Sync document attributes on mount/change
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    // Normalize key to lowercase for lookup
    const lowerKey = key.toLowerCase();
    const text = translations[language][lowerKey];
    return text || key; 
  };

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