
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Search, Lock, FileText, Calendar, Type, ArrowUpDown, Clock } from 'lucide-react';
import { DBService } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { Subject, Resource } from '../types';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { ResourceCard } from '../components/features/ResourceCard';
import { ListSkeleton } from '../components/ui/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomSelect } from '../components/ui/CustomSelect';
import { toast } from 'react-hot-toast';

type SortOption = 'date_desc' | 'date_asc' | 'name_asc' | 'type';

export const SubjectView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  
  const { currentUser, login, canDelete } = useAuth();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');
  const [activeHighlight, setActiveHighlight] = useState<string | null>(highlightId);

  useEffect(() => {
    const fetchSubject = async () => {
        if (id) {
             const allSubjects = await DBService.getSubjects();
             const foundSubject = allSubjects.find((s) => s.id === id);
             setSubject(foundSubject || null);
        }
    };
    fetchSubject();
    
    if (id) {
        const unsubscribe = DBService.subscribeToResources(id, (data) => {
            setResources(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }
  }, [id]);

  // Handle Highlight Logic
  useEffect(() => {
      if (highlightId && !loading && resources.length > 0) {
          setActiveHighlight(highlightId);
          // Scroll to element
          const el = document.getElementById(`resource-${highlightId}`);
          if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Remove highlight after 5s
              setTimeout(() => setActiveHighlight(null), 5000);
          }
      }
  }, [highlightId, loading, resources]);

  const filteredAndSortedResources = useMemo(() => {
    let res = resources.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()));
    
    switch (sortOption) {
        case 'date_desc':
            return res.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
        case 'date_asc':
            return res.sort((a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime());
        case 'name_asc':
            return res.sort((a, b) => a.title.localeCompare(b.title));
        case 'type':
            return res.sort((a, b) => a.type.localeCompare(b.type));
        default:
            return res;
    }
  }, [resources, searchQuery, sortOption]);

  const handleDeleteResource = async () => {
    if (!deleteId) return;
    await toast.promise(
      DBService.deleteResource(deleteId),
      { loading: 'Deleting...', success: 'Deleted', error: 'Failed' }
    );
    setDeleteId(null);
  };

  const handleResourceClick = (r: Resource) => {
      if (currentUser) {
          DBService.logActivity(
              currentUser.uid, 
              currentUser.email || 'unknown', 
              'VIEW_FILE', 
              `Opened resource: ${r.title}`
          );
      }
  };

  if (!currentUser) return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in zoom-in duration-500">
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-6 shadow-inner"><Lock className="h-12 w-12 text-gray-400" /></div>
          <h2 className="text-3xl font-bold dark:text-white mb-3">Restricted Access</h2>
          <p className="text-gray-500 mb-8">Please sign in to access lecture materials.</p>
          <button onClick={() => login()} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg">Sign In with Google</button>
      </div>
  );

  if (loading) return <div className="max-w-7xl mx-auto py-10 px-4"><ListSkeleton /></div>;

  if (!subject) return <div className="text-center py-20 text-gray-500">Subject not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <ConfirmationModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={handleDeleteResource} 
        title="Delete Resource" 
        message="This cannot be undone." 
      />

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 mb-6">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Subjects
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100 dark:border-gray-700">
          <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">{subject.name}</h1>
              <div className="flex items-center gap-3">
                 <span className={`px-3 py-1 rounded-full text-sm font-bold bg-opacity-20 ${subject.color} text-gray-700 dark:text-gray-200`}>
                     Dr. {subject.profName}
                 </span>
                 <span className="text-sm text-gray-400">{filteredAndSortedResources.length} Resources</span>
              </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
             <div className="relative flex-grow sm:w-64">
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="w-full pl-10 pr-4 py-3 bg-white text-gray-900 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white shadow-sm transition-all placeholder-gray-400" 
                />
             </div>
             
             <div className="w-full sm:w-48">
                 <CustomSelect 
                    value={sortOption}
                    onChange={(val) => setSortOption(val as SortOption)}
                    options={[
                        { value: 'date_desc', label: 'Newest First', icon: <Clock size={14}/> },
                        { value: 'date_asc', label: 'Oldest First', icon: <Calendar size={14}/> },
                        { value: 'name_asc', label: 'Name (A-Z)', icon: <Type size={14}/> },
                        { value: 'type', label: 'Type', icon: <ArrowUpDown size={14}/> },
                    ]}
                 />
             </div>
          </div>
        </div>
      </motion.div>

      <div className="space-y-4">
        {filteredAndSortedResources.length === 0 ? (
            <div className="p-16 text-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                <FileText className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold dark:text-white">No Resources Found</h3>
            </div>
        ) : (
            <AnimatePresence mode='popLayout'>
                {filteredAndSortedResources.map((resource) => (
                    <div 
                        key={resource.id} 
                        id={`resource-${resource.id}`} 
                        className={`rounded-2xl transition-all duration-700 ${activeHighlight === resource.id ? 'highlight-resource' : ''}`}
                    >
                        <ResourceCard 
                            resource={resource} 
                            canDelete={canDelete} 
                            onDeleteClick={setDeleteId} 
                            onDownloadClick={handleResourceClick} 
                        />
                    </div>
                ))}
            </AnimatePresence>
        )}
      </div>
    </div>
  );
};
