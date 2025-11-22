
import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { XIcon } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const modalVariants: Variants = {
    hidden: { opacity: 0, y: -30, scale: 0.98 },
    visible: { 
      opacity: 1, y: 0, scale: 1,
      transition: { type: 'spring', damping: 20, stiffness: 200 } 
    },
    exit: { 
      opacity: 0, y: -30, scale: 0.98,
      transition: { duration: 0.2 }
    },
  };
  
  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-lg'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={backdropVariants}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            className={`relative bg-slate-900/70 border border-slate-700 rounded-2xl shadow-2xl shadow-black/40 w-full ${sizeClasses[size]} flex flex-col max-h-full`}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-slate-700/80 flex justify-between items-center flex-shrink-0">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-slate-700/50"
                aria-label="Close modal"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto flex-1">
              {children}
            </div>
            {footer && (
              <div className="p-4 sm:p-5 border-t border-slate-700/80 flex justify-end gap-3 flex-shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
