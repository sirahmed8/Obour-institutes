import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, ArrowUp, ArrowDown, BookOpen, Loader2, X, Check, Save, AlertCircle } from 'lucide-react';
import { Subject, ICON_MAP, COLOR_PALETTE } from '../../../types';
import { DBService } from '../../../services/storage';
import { useAuth } from '../../../context/AuthContext';
import { ConfirmationModal } from '../../ui/ConfirmationModal';
import { toast } from 'react-hot-toast';

import { Tooltip } from '../../ui/Tooltip';

interface SubjectManagerProps {
  subjects: Subject[];
  onRefresh: () => void;
}

const SubjectForm = ({ 
    values, 
    setValues, 
    onSubmit, 
    onCancel, 
    submitLabel, 
    isSubmitting 
  }: any) => (
    <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Subject Name</label>
            <input 
                value={values.name} 
                onChange={e => setValues({...values, name: e.target.value})} 
                placeholder="e.g. Computer Science" 
                className="w-full p-4 rounded-2xl border border-gray-200 dark:bg-gray-900/50 dark:border-gray-600 bg-white text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/20 transition-all font-bold" 
                required 
            />
        </div>
        <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Instructor</label>
            <input 
                value={values.profName} 
                onChange={e => setValues({...values, profName: e.target.value})} 
                placeholder="e.g. Dr. Ahmed" 
                className="w-full p-4 rounded-2xl border border-gray-200 dark:bg-gray-900/50 dark:border-gray-600 bg-white text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/20 transition-all font-bold" 
                required 
            />
        </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
        <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-3 tracking-widest">Color Theme</label>
            <div className="flex flex-wrap gap-2.5 bg-gray-50 dark:bg-gray-900/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
            {COLOR_PALETTE.map(c => (
                <button 
                key={c.name} 
                type="button" 
                onClick={() => setValues({...values, color: c.class})} 
                className={`w-8 h-8 rounded-full ${c.class} transition-all ${values.color === c.class ? 'ring-4 ring-indigo-500/30 scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100'}`} 
                title={c.name}
                />
            ))}
            </div>
        </div>
        <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-3 tracking-widest">Icon</label>
            <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-700 custom-scrollbar">
            {Object.keys(ICON_MAP).map(k => {
                const I = ICON_MAP[k];
                return (
                <button 
                    key={k} 
                    type="button" 
                    onClick={() => setValues({...values, icon: k})} 
                    className={`p-2 rounded-xl flex justify-center items-center transition-all ${values.icon === k ? 'bg-indigo-600 text-white shadow-md scale-110' : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 hover:text-indigo-600'}`}
                >
                    <I size={20} />
                </button>
                );
            })}
            </div>
        </div>
        </div>
        
        <div className="flex gap-4 pt-2">
            {onCancel && (
                <button type="button" onClick={onCancel} className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl font-black transition-all hover:bg-gray-200">
                    CANCEL
                </button>
            )}
            <button 
                disabled={isSubmitting}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 flex justify-center items-center font-black transition-all"
            >
                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : submitLabel}
            </button>
        </div>
    </form>
  );

export const SubjectManager: React.FC<SubjectManagerProps> = ({ subjects = [], onRefresh }) => {
  const { currentUser } = useAuth();
  
  const [name, setName] = useState('');
  const [profName, setProfName] = useState('');
  const [icon, setIcon] = useState('Book');
  const [color, setColor] = useState(COLOR_PALETTE[0].class);
  const [isCreating, setIsCreating] = useState(false);

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
      toast.error("Network error creating subject");
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
      toast.success("Changes Saved");
      onRefresh();
    } catch (error) { 
        toast.error("Failed to update");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await DBService.deleteSubject(deleteId);
      setDeleteId(null);
      toast.success("Deleted");
      onRefresh();
    } catch (error) { 
        toast.error("Delete failed");
    }
  };

  const handleSwap = async (subA: Subject, subB: Subject) => {
    try {
        await DBService.swapSubjects(subA, subB);
        onRefresh();
    } catch (e) {
        // Silent failure for minor UX tweaks
    }
  };

  return (
    <div className="space-y-8">
      <ConfirmationModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={handleDelete}
        title="Delete Subject"
        message="Are you sure? Metadata for this subject will be permanently removed."
      />

      <motion.div 
        layout
        className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700"
      >
        <h3 className="text-xl font-black mb-8 flex items-center dark:text-white">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-xl mr-3 text-indigo-600">
             <Plus size={24} /> 
          </div>
          Create Subject
        </h3>
        <SubjectForm 
            values={{ name, profName, icon, color }} 
            setValues={(v: any) => { setName(v.name); setProfName(v.profName); setIcon(v.icon); setColor(v.color); }}
            onSubmit={handleCreate}
            submitLabel="PUBLISH SUBJECT"
            isSubmitting={isCreating}
        />
      </motion.div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4 px-2">
            <BookOpen size={18} className="text-gray-400"/>
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Live Curriculum</h3>
        </div>
        
        {subjects.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-gray-400 font-bold">No subjects yet. Create the first one above.</p>
            </div>
        ) : (
            <div className="grid gap-4">
                <AnimatePresence mode="popLayout">
                {subjects.map((sub, idx) => (
                    <motion.div 
                    layout 
                    key={sub.id} 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`bg-white dark:bg-gray-800 rounded-[2rem] border overflow-hidden transition-all ${editingSubject?.id === sub.id ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-gray-100 dark:border-gray-700 hover:shadow-xl'}`}
                    >
                    <motion.div layout="position">
                        <AnimatePresence mode="wait">
                        {editingSubject?.id === sub.id ? (
                            <motion.div 
                                key="edit"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-8"
                            >
                                <div className="flex justify-between items-center mb-8">
                                    <h4 className="font-black text-indigo-600 flex items-center gap-2">
                                        <Pencil size={20}/> EDITING MODE
                                    </h4>
                                    <button onClick={() => setEditingSubject(null)} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 dark:text-gray-200 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"><X size={20}/></button>
                                </div>
                                <SubjectForm 
                                    values={editingSubject}
                                    setValues={setEditingSubject}
                                    onSubmit={handleUpdate}
                                    onCancel={() => setEditingSubject(null)}
                                    submitLabel="SAVE CHANGES"
                                />
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="view"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-5">
                                    <div className={`p-5 rounded-[1.5rem] ${sub.color} bg-opacity-20 text-indigo-600 dark:text-indigo-400 shadow-inner`}>
                                    {React.createElement(ICON_MAP[sub.icon] || BookOpen, { size: 32 })}
                                    </div>
                                    <div>
                                    <h4 className="font-black text-xl text-gray-900 dark:text-white leading-none mb-1">{sub.name}</h4>
                                    <p className="text-sm font-bold text-gray-400">Instructor: {sub.profName}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-2xl self-start md:self-auto">
                                    <Tooltip content="Move Up">
                                        <button onClick={() => handleSwap(sub, subjects[idx - 1])} disabled={idx === 0} className="p-3 text-gray-400 hover:text-indigo-600 disabled:opacity-20 transition-all"><ArrowUp size={20} /></button>
                                    </Tooltip>
                                    <Tooltip content="Move Down">
                                        <button onClick={() => handleSwap(sub, subjects[idx + 1])} disabled={idx === subjects.length - 1} className="p-3 text-gray-400 hover:text-indigo-600 disabled:opacity-20 transition-all"><ArrowDown size={20} /></button>
                                    </Tooltip>
                                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                                    <Tooltip content="Edit Subject">
                                        <button onClick={() => setEditingSubject(sub)} className="p-3 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"><Pencil size={20} /></button>
                                    </Tooltip>
                                    <Tooltip content="Delete Subject (Permanent)">
                                        <button onClick={() => setDeleteId(sub.id)} className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={20} /></button>
                                    </Tooltip>
                                </div>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </motion.div>
                    </motion.div>
                ))}
                </AnimatePresence>
            </div>
        )}
      </div>
    </div>
  );
};