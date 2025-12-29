
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Library, Search, BookOpen, GraduationCap, Sparkles } from 'lucide-react';
import { DBService } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { Subject, ICON_MAP } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

// Fix: Explicitly type SubjectCard as React.FC to ensure reserved props like 'key' are correctly handled by the JSX compiler
const SubjectCard: React.FC<{ subject: Subject }> = ({ subject }) => {
  const IconComponent = ICON_MAP[subject.icon] || Library;

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
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded-full border border-gray-100 dark:border-gray-700">Course</span>
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors mb-2 leading-tight">
            {subject.name}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2 mb-8">
            <ProjectorIcon size={16} className="text-indigo-500" /> Prof. {subject.profName}
          </p>
          <div className="mt-auto flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-bold group-hover:gap-3 transition-all">
            <span>Explore Resources</span>
            <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

// Helper for graduation cap which was missing in imports or being renamed
const ProjectorIcon = GraduationCap;

export const Home: React.FC = () => {
  const { currentUser, login } = useAuth();
  const { t } = useLanguage();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsub = DBService.subscribeToSubjects((data) => {
      setSubjects(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.profName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, subjects]);

  if (!currentUser) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 text-center">
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="bg-white dark:bg-gray-800 p-12 rounded-[3rem] shadow-2xl mb-12 border border-indigo-50 dark:border-gray-700 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10"><BookOpen size={120}/></div>
          <img src="/obour-logo.png" alt="Obour Institutes" className="h-40 w-auto mx-auto mb-8" />
          <h1 className="text-5xl font-black text-gray-900 dark:text-white sm:text-7xl mb-6 tracking-tight">
            Obour <span className="text-indigo-600">Institutes</span>
          </h1>
          <p className="max-w-xl mx-auto text-xl text-gray-500 dark:text-gray-400 mb-10 leading-relaxed font-medium">
            The elite hub for academic excellence. Access high-quality lecture notes, study guides, and course materials instantly.
          </p>
          <button 
            onClick={() => login()} 
            className="px-10 py-5 bg-indigo-600 text-white text-xl font-bold rounded-full hover:bg-indigo-700 shadow-2xl shadow-indigo-500/40 transform hover:scale-105 transition-all flex items-center gap-3 mx-auto"
          >
            <Sparkles size={24} /> Get Started Now
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
            Academic <span className="text-indigo-600 underline decoration-indigo-200">Catalog</span>
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">
            Welcome back, <span className="text-gray-900 dark:text-white font-bold">{currentUser.displayName?.split(' ')[0]}</span>. Explore your subjects below.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
             <div className="relative group flex-1 md:w-80">
                <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Find a course or professor..." 
                  className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-base outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative shrink-0">
                  <div className="h-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-4 flex items-center gap-3 shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                          <BookOpen size={18} />
                      </div>
                      <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sort By</span>
                          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Newest First</span>
                      </div>
                      <ArrowRight className="rotate-90 ml-2 text-gray-400" size={16} />
                  </div>
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
          {filteredSubjects.map(sub => <SubjectCard key={sub.id} subject={sub} />)}
          {filteredSubjects.length === 0 && (
            <div className="col-span-full py-20 text-center bg-gray-100 dark:bg-gray-800/50 rounded-4xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <Library size={64} className="mx-auto mb-6 text-gray-300" />
                <h3 className="text-2xl font-bold text-gray-500">No courses match your search</h3>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
