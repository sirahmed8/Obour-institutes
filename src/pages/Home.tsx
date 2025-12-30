import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Library, Search, BookOpen, GraduationCap, Sparkles, ChevronDown, User, ArrowDownUp, Clock, Check } from 'lucide-react';
import { DBService } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { Subject, ICON_MAP } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Banner } from '../components/features/Banner';
import { CustomSelect } from '../components/ui/CustomSelect';

const SubjectCard: React.FC<{ subject: Subject }> = ({ subject }) => {
  const IconComponent = ICON_MAP[subject.icon] || Library;
  const { t } = useLanguage();

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Link to={`/subject/${subject.id}`} className="group relative flex flex-col h-full bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className={`h-3 w-full ${subject.color}`} />
        <div className="p-8 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-6">
            <div className={`p-4 rounded-2xl ${subject.color} bg-opacity-10 dark:bg-opacity-20`}>
              <IconComponent className={`h-10 w-10 ${subject.color.replace('bg-', 'text-')}`} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded-full border border-gray-100 dark:border-gray-700">{t('course')}</span>
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors mb-2 leading-tight">
            {subject.name}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2 mb-8">
            <GraduationCap size={16} className="text-indigo-500" /> Prof. {subject.profName}
          </p>
          <div className="mt-auto flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-bold group-hover:gap-3 transition-all">
            <span>{t('explore_resources')}</span>
            <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

type SortOption = 'newest' | 'oldest' | 'name_az' | 'name_za';

export const Home: React.FC = () => {
  const { currentUser, login } = useAuth();
  const { t, language } = useLanguage();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('name_az');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const unsub = DBService.subscribeToSubjects((data) => {
      setSubjects(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const sortedAndFilteredSubjects = useMemo(() => {
    let result = subjects.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.profName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (sortOption) {
      case 'newest':
        result = [...result].sort((a, b) => (b.orderIndex || 0) - (a.orderIndex || 0));
        break;
      case 'oldest':
        result = [...result].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        break;
      case 'name_az':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name, language));
        break;
      case 'name_za':
        result = [...result].sort((a, b) => b.name.localeCompare(a.name, language));
        break;
    }

    return result;
  }, [searchQuery, subjects, sortOption, language]);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: t('newest_first') },
    { value: 'oldest', label: t('oldest_first') },
    { value: 'name_az', label: t('name_az') },
    { value: 'name_za', label: t('name_za') },
  ];

  if (!currentUser) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 text-center">
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="bg-white dark:bg-gray-800 p-12 rounded-[3rem] shadow-2xl mb-12 border border-indigo-50 dark:border-gray-700 relative overflow-hidden"
        >
          <img src="/obour-logo.png" alt="Obour Institutes" className="h-40 w-auto mx-auto mb-8" />
          <h1 className="text-5xl font-black text-gray-900 dark:text-white sm:text-7xl mb-6 tracking-tight">
            Obour <span className="text-indigo-600">Institutes</span>
          </h1>
          <p className="max-w-xl mx-auto text-xl text-gray-500 dark:text-gray-400 mb-10 leading-relaxed font-medium">
            {language === 'ar' 
              ? 'منصة النخبة للتميز الأكاديمي. الوصول الفوري لملاحظات المحاضرات والمواد الدراسية عالية الجودة.'
              : 'The elite hub for academic excellence. Access high-quality lecture notes, study guides, and course materials instantly.'
            }
          </p>
          <button 
            onClick={() => login()} 
            className="px-10 py-5 bg-indigo-600 text-white text-xl font-bold rounded-full hover:bg-indigo-700 shadow-2xl shadow-indigo-500/40 transform hover:scale-105 transition-all flex items-center gap-3 mx-auto"
          >
            <Sparkles size={24} /> {t('get_started')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Banner />
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight leading-tight">
            {language === 'ar' ? (
                <>
                  {t('academic_catalog').split(' ')[0]} <span className="text-indigo-600 underline decoration-indigo-200">{t('academic_catalog').split(' ').slice(1).join(' ')}</span>
                </>
            ) : (
                <>
                  {t('academic_catalog').split(' ')[0]} <span className="text-indigo-600 underline decoration-indigo-200">{t('academic_catalog').split(' ').slice(1).join(' ') || 'Catalog'}</span>
                </>
            )}
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
            {t('welcome_back')}{language === 'ar' ? '،' : ','} <span className="text-gray-900 dark:text-white font-bold">{currentUser.displayName?.split(' ')[0] || 'Student'}</span>. {t('explore_subjects')}.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
             <div className="relative group flex-1 md:w-80">
                <Search className="absolute start-4 top-4 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder={t('search_placeholder')} 
                  className="w-full ps-12 pe-6 py-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-base outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Sort Dropdown */}
              <div className="md:w-64 z-20 shrink-0"> 
               <CustomSelect
                  value={sortOption}
                  onChange={(val) => setSortOption(val as SortOption)}
                  options={[
                      { value: 'name_az', label: 'Name (A-Z)', icon: <ArrowDownUp size={16}/> },
                      { value: 'name_za', label: 'Name (Z-A)', icon: <ArrowDownUp size={16}/> },
                      { value: 'date_new', label: 'Newest First', icon: <Clock size={16}/> },
                      { value: 'date_old', label: 'Oldest First', icon: <Clock size={16}/> }
                  ]}
                  placeholder="Sort By..."
                  className="w-full"
               />
            </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-72 bg-gray-200 dark:bg-gray-800 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
        >
          {sortedAndFilteredSubjects.map(sub => <SubjectCard key={sub.id} subject={sub} />)}
          {sortedAndFilteredSubjects.length === 0 && (
            <div className="col-span-full py-20 text-center bg-gray-100 dark:bg-gray-800/50 rounded-4xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <Library size={64} className="mx-auto mb-6 text-gray-300" />
                <h3 className="text-2xl font-bold text-gray-500">{t('no_courses_match')}</h3>
            </div>
          )}
        </motion.div>
      )}
    </div>
    </>
  );
};
