import React from 'react';
import { motion } from 'framer-motion';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  disableHoverEffect?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', disableHoverEffect = false, ...props }) => {
  return (
    <motion.div
      whileHover={!disableHoverEffect ? { scale: 1.02, transition: { type: 'spring', stiffness: 300 } } : {}}
      className={`relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 p-4 sm:p-6 overflow-hidden ${className}`}
      {...props}
    >
      <div className="absolute -inset-px rounded-2xl border-2 border-transparent hover:border-violet-500/50 transition-colors duration-300 pointer-events-none"></div>
      {children}
    </motion.div>
  );
};

export default Card;