
import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, TargetAndTransition, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  disableHoverEffect?: boolean;
  enableTilt?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', disableHoverEffect = false, enableTilt = false, ...props }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  // 3D Tilt Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring physics for smooth return
  const mouseX = useSpring(x, { stiffness: 500, damping: 30 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 30 });

  // Transform mouse position to rotation
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [7, -7]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-7, 7]);
  
  // Shine effect
  const shineX = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]);
  const shineY = useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || !enableTilt) return;
    
    const rect = ref.current.getBoundingClientRect();
    
    const width = rect.width;
    const height = rect.height;
    
    const mouseXVal = e.clientX - rect.left;
    const mouseYVal = e.clientY - rect.top;
    
    const xPct = mouseXVal / width - 0.5;
    const yPct = mouseYVal / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    if (!enableTilt) return;
    x.set(0);
    y.set(0);
  };

  // Base hover animation if tilt is not enabled
  const hoverAnimation: TargetAndTransition = !disableHoverEffect && !enableTilt ? { 
    y: -5,
    scale: 1.01, 
    transition: { type: 'spring', stiffness: 300 } 
  } : {};

  return (
    <motion.div
      ref={ref}
      whileHover={hoverAnimation}
      style={{
        rotateX: enableTilt ? rotateX : 0,
        rotateY: enableTilt ? rotateY : 0,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 p-4 sm:p-6 overflow-hidden ${className}`}
      {...props}
    >
      {enableTilt && (
        <div 
            style={{
                transform: "translateZ(20px)",
            }}
            className="absolute inset-0 pointer-events-none z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        >
             <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-sky-500/10 blur-xl" />
        </div>
      )}
      
      {/* Border Gradient */}
      <div className="absolute -inset-px rounded-2xl border-2 border-transparent hover:border-violet-500/30 transition-colors duration-300 pointer-events-none"></div>
      
      {/* Shine Element for Tilt Cards */}
      {enableTilt && (
         <motion.div 
            className="absolute inset-0 z-10 pointer-events-none"
            style={{
                background: `radial-gradient(circle at ${shineX} ${shineY}, rgba(255,255,255,0.1) 0%, transparent 80%)`
            }}
         />
      )}

      {/* Content Wrapper to ensure Z-index above effects */}
      <div className="relative z-20" style={{ transform: enableTilt ? "translateZ(30px)" : "none" }}>
        {children}
      </div>
    </motion.div>
  );
};

export default Card;
