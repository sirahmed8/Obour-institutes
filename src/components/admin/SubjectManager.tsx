import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, ArrowUp, ArrowDown, BookOpen, Loader2, X, Check, Save } from 'lucide-react';
import { Subject, ICON_MAP, COLOR_PALETTE } from '../../types';
import { DBService } from '../../services/storage';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmationModal } from '../ConfirmationModal';
import { toast } from '../../services/toaster';

interface SubjectManagerProps {
  subjects: Subject[];
  onRefresh: () => void;
}

export const SubjectManager: React.FC<SubjectManagerProps> = ({ subjects, onRefresh }) => {
  const { currentUser } = useAuth();
  
  // Creation State
  const [name, setName] = useState('');
  const [profName, setProfName] = useState('');
  const [icon, setIcon] = useState('Book');
  const [color, setColor] = useState(COLOR_PALETTE[0].class);
  const [isCreating, setIsCreating] = useState(false);

  // Edit/Delete State
  // We store the FULL subject object being edited
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await DBService.addSubject(name, profName, icon, color);
      if (currentUser) {
        await DBService.logActivity(currentUser.uid, currentUser.email || 'Admin', 'CREATE_SUBJECT', `Created subject: ${name}`);
      }
      setName('');
      setProfName('');
      toast.success("Subject Created");
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create subject");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    try {
      await DBService.updateSubject(
        editingSubject.id, 
        editingSubject.name, 
        editingSubject.profName, 
        editingSubject.icon, 
        editingSubject.color
      );
      setEditingSubject(null);
      toast.success("Subject Updated");
      onRefresh();
    } catch (error) { 
        console.error(error);
        toast.error("Update Failed");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await DBService.deleteSubject(deleteId);
      setDeleteId(null);
      toast.success("Subject Deleted");
      onRefresh();
    } catch (error) { 
        console.error(error); 
        toast.error("Delete Failed");
    }
  };

  const handleSwap = async (subA: Subject, subB: Subject) => {
    await DBService.swapSubjects(subA, subB);
    onRefresh();
  };

  // Reusable Form Component for Consistency
  const SubjectForm = ({ 
    values, 
    setValues, 
    onSubmit, 
    onCancel, 
    submitLabel, 
    isSubmitting 
  }: { 
    values: { name: string, profName: string, icon: string, color: string },
    setValues: (v: any) => void,
    onSubmit: (e: React.FormEvent) => void,
    onCancel?: () => void,
    submitLabel: React.ReactNode,
    isSubmitting?: boolean
  }) => (
    <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Subject Name</label>
            <input 
                value={values.name} 
                onChange={e => setValues({...values, name: e.target.value})} 
                placeholder="e.g. Data Structures" 
                className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all" 
                required 
            />
        </div>
        <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Instructor</label>
            <input 
                value={values.profName} 
                onChange={e => setValues({...values, profName: e.target.value})} 
                placeholder="e.g. Dr. Ahmed" 
                className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all" 
                required 
            />
        </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Color Theme</label>
            <div className="flex flex-wrap gap-2 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
            {COLOR_PALETTE.map(c => (
                <button 
                key={c.name} 
                type="button" 
                onClick={() => setValues({...values, color: c.class})} 
                className={`w-8 h-8 rounded-full ${c.class} transition-all ${values.color === c.class ? 'ring-2 ring-offset-2 ring-gray-400 scale-110 shadow-md' : 'hover:scale-105 opacity-70 hover:opacity-100'}`} 
                title={c.name}
                />
            ))}
            </div>
        </div>
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Icon</label>
            <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 custom-scrollbar">
            {Object.keys(ICON_MAP).map(k => {
                const I = ICON_MAP[k];
                return (
                <button 
                    key={k} 
                    type="button" 
                    onClick={() => setValues({...values, icon: k})} 
                    className={`p-2 rounded-lg flex justify-center items-center transition-all ${values.icon === k ? 'bg-white dark:bg-gray-600 text-indigo-600 shadow-md ring-1 ring-indigo-100' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                    title={k}
                >
                    <I size={18} />
                </button>
                );
            })}
            </div>
        </div>
        </div>
        
        <div className="flex gap-3">
            {onCancel && (
                <button type="button" onClick={onCancel} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">
                    Cancel
                </button>
            )}
            <button 
                disabled={isSubmitting}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 flex justify-center items-center font-bold transition-all active:scale-95"
            >
                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : submitLabel}
            </button>
        </div>
    </form>
  );

  return (
    <div className="space-y-8">
      <ConfirmationModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={handleDelete}
        title="Delete Subject"
        message="Are you sure? This will delete the subject metadata. Linked resources will remain in the database but become orphaned (safe delete)."
      />

      {/* --- CREATE SECTION --- */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700"
      >
        <h3 className="text-xl font-bold mb-6 flex items-center dark:text-white">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg mr-3 text-indigo-600">
             <Plus size={20} /> 
          </div>
          Create New Subject
        </h3>
        <SubjectForm 
            values={{ name, profName, icon, color }} 
            setValues={(v) => { setName(v.name); setProfName(v.profName); setIcon(v.icon); setColor(v.color); }}
            onSubmit={handleCreate}
            submitLabel="Create Subject"
            isSubmitting={isCreating}
        />
      </motion.div>

      {/* --- LIST SECTION --- */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4 px-2">
            <BookOpen size={18} className="text-gray-400"/>
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Manage Subjects</h3>
        </div>
        
        <AnimatePresence mode="popLayout">
          {subjects.map((sub, idx) => (
            <motion.div 
              key={sub.id} 
              layout
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border ${editingSubject?.id === sub.id ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-100 dark:border-gray-700'} overflow-hidden transition-all`}
            >
              {editingSubject?.id === sub.id ? (
                // --- EDIT MODE (Full Form) ---
                <div className="p-6 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                            <Pencil size={16}/> Editing: {sub.name}
                        </h4>
                        <button onClick={() => setEditingSubject(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                    </div>
                    <SubjectForm 
                        values={editingSubject}
                        setValues={setEditingSubject}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditingSubject(null)}
                        submitLabel={<><Save size={18} className="mr-2"/> Save Changes</>}
                    />
                </div>
              ) : (
                // --- VIEW MODE ---
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-xl ${sub.color} bg-opacity-20 text-indigo-600 dark:text-indigo-400 shadow-inner`}>
                      {React.createElement(ICON_MAP[sub.icon] || BookOpen, { size: 24 })}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white">{sub.name}</h4>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Dr. {sub.profName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/30 p-1.5 rounded-xl self-start md:self-auto">
                    <button 
                      onClick={() => handleSwap(sub, subjects[idx - 1])} 
                      disabled={idx === 0} 
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-gray-600 rounded-lg disabled:opacity-30 transition-all"
                      title="Move Up"
                    >
                      <ArrowUp size={18} />
                    </button>
                    <button 
                      onClick={() => handleSwap(sub, subjects[idx + 1])} 
                      disabled={idx === subjects.length - 1} 
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-gray-600 rounded-lg disabled:opacity-30 transition-all"
                      title="Move Down"
                    >
                      <ArrowDown size={18} />
                    </button>
                    <div className="h-5 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setEditingSubject(sub)} 
                      className="p-2 text-blue-500 hover:text-white hover:bg-blue-500 rounded-lg transition-all"
                      title="Edit Subject"
                    >
                      <Pencil size={18} />
                    </motion.button>
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setDeleteId(sub.id)} 
                      className="p-2 text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-all"
                      title="Delete Subject"
                    >
                      <Trash2 size={18} />
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};