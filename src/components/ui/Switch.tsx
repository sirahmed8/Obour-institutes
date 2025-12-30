import { motion } from 'framer-motion';

export const Switch = ({ checked, onChange, disabled }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) => (
  <button
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    type="button"
    className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors duration-300 ${
      checked ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 700, damping: 30 }}
      className={`bg-white w-5 h-5 rounded-full shadow-md ${checked ? 'translate-x-6' : 'translate-x-0'}`}
    />
  </button>
);
