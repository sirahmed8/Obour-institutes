
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
    // Auth
    'login': 'Login',
    'logout': 'Logout',
    'sign_in': 'Sign In',
    
    // Navigation
    'student_view': 'Student View',
    'admin_hub': 'Admin Hub',
    'owner_hub': 'Owner Hub',
    'home': 'Home',
    
    // Home Page
    'welcome': 'Welcome, Future Leader',
    'academic_catalog': 'Your Gateway to Knowledge',
    'welcome_back': 'Welcome back,',
    'explore_subjects': 'Explore your path to success',
    'get_started': 'Start Learning',
    'course': 'Course',
    'explore_resources': 'Access Resources',
    'no_courses_match': 'No courses found',
    
    // Search & Sort
    'search': 'Search subjects...',
    'search_placeholder': 'Find a course or professor...',
    'sort_by': 'Sort By',
    'newest_first': 'Newest First',
    'oldest_first': 'Oldest First',
    'name_az': 'Name (A-Z)',
    'name_za': 'Name (Z-A)',
    
    // Settings
    'theme': 'Appearance',
    'language': 'Language',
    'notifications': 'Push Notifications',
    'email_updates': 'Email Updates',
    
    // Content
    'subjects': 'Academic Subjects',
    'view_resources': 'View Resources',
    'important_announcement': 'Announcement',
    
    // Admin
    'add_member': 'Add New Member',
    'email_placeholder': 'Enter email address',
    'role': 'Role',
    'viewer': 'Viewer',
    'editor': 'Editor',
    'owner': 'Owner',
    'active_team': 'Active Team Members',
    
    // Actions
    'save': 'Save Changes',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'no_matches': 'No results found',
    
    // Footer
    'social_media': 'Social Media',
    'all_rights': 'All rights reserved'
  },
  ar: {
    // Auth
    'login': 'دخول',
    'logout': 'خروج',
    'sign_in': 'تسجيل الدخول',
    
    // Navigation
    'student_view': 'عرض الطالب',
    'admin_hub': 'لوحة التحكم',
    'owner_hub': 'لوحة المالك',
    'home': 'الرئيسية',
    
    // Home Page
    'welcome': 'مرحباً، قائد المستقبل',
    'academic_catalog': 'بوابتك للمعرفة والنجاح',
    'welcome_back': 'أهلاً بعودتك،',
    'explore_subjects': 'اكتشف طريقك للنجاح',
    'get_started': 'ابدأ التعلم',
    'course': 'مادة',
    'explore_resources': 'تصفح المصادر',
    'no_courses_match': 'لا توجد نتائج بحث',
    
    // Search & Sort
    'search': 'ابحث عن المواد...',
    'search_placeholder': 'ابحث عن مادة أو أستاذ...',
    'sort_by': 'ترتيب حسب',
    'newest_first': 'الأحدث أولاً',
    'oldest_first': 'الأقدم أولاً',
    'name_az': 'الاسم (أ-ي)',
    'name_za': 'الاسم (ي-أ)',
    
    // Settings
    'theme': 'المظهر',
    'language': 'اللغة',
    'notifications': 'تنبيهات المتصفح',
    'email_updates': 'نشرة البريد',
    
    // Content
    'subjects': 'المواد الدراسية',
    'view_resources': 'عرض المصادر',
    'important_announcement': 'إعلان هام',
    
    // Admin
    'add_member': 'إضافة عضو جديد',
    'email_placeholder': 'أدخل البريد الإلكتروني',
    'role': 'الصلاحية',
    'viewer': 'مشاهد',
    'editor': 'محرر',
    'owner': 'مالك',
    'active_team': 'أعضاء الفريق الحاليين',
    
    // Actions
    'save': 'حفظ التغييرات',
    'cancel': 'إلغاء',
    'delete': 'حذف',
    'no_matches': 'لا توجد نتائج مطابقة',
    
    // Footer
    'social_media': 'وسائل التواصل',
    'all_rights': 'جميع الحقوق محفوظة'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved) return saved;

    // Check device language
    const deviceLang = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'en';
    if (deviceLang.startsWith('ar')) return 'ar';
    
    return 'en';
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
