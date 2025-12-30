import { motion } from 'framer-motion';

export const Switch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors duration-300 ${
      checked ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
    }`}
  >
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 700, damping: 30 }}
      className={`bg-white w-5 h-5 rounded-full shadow-md ${checked ? 'translate-x-5' : 'translate-x-0'}`}
    />
  </button>
);
