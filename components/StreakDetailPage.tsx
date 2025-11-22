
import React from 'react';
import { calculateStreak } from '../utils/dateHelpers';
import Card from './common/Card';
import Button from './common/Button';
import Calendar from './common/Calendar';
import { ArrowLeftIcon, TrendingUpIcon, SparklesIcon } from './common/Icons';
import { motion } from 'framer-motion';

interface StreakDetailPageProps {
  title: string;
  icon: React.ReactNode;
  dates: string[];
  markerColor: string;
  gradient: string;
  onBack: () => void;
}

const getNextMilestone = (current: number) => {
    const milestones = [3, 7, 14, 30, 60, 90, 100, 365];
    return milestones.find(m => m > current) || (current + 50);
};

const StatCard: React.FC<{ label: string; value: React.ReactNode; gradient: string; subtext?: string }> = ({ label, value, gradient, subtext }) => (
  <div className="relative bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 overflow-hidden group hover:border-slate-600 transition-colors">
    <p className="text-sm font-medium text-gray-400 mb-1">{label}</p>
    <div className={`text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br ${gradient}`}>
        {value}
    </div>
    {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
  </div>
);

const calculateConsistency = (dates: string[]) => {
    if (dates.length === 0) return 0;
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    const uniqueDates = new Set(dates.map(d => d.split('T')[0]));
    let count = 0;
    
    // Iterate last 30 days
    for(let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
        const isoDate = d.toISOString().split('T')[0];
        if (uniqueDates.has(isoDate)) count++;
    }
    
    return Math.round((count / 30) * 100);
};

const StreakDetailPage: React.FC<StreakDetailPageProps> = ({ title, icon, dates, markerColor, gradient, onBack }) => {
  const { current, longest } = calculateStreak(dates);
  const consistency = calculateConsistency(dates);
  const markedDates = dates.map(date => ({ date, color: markerColor }));
  
  const nextMilestone = getNextMilestone(current);
  const progressToMilestone = Math.min((current / nextMilestone) * 100, 100);

  const containerVariants = {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: { staggerChildren: 0.1 } },
    exit: { opacity: 0, x: -30 },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="max-w-4xl mx-auto">
      <motion.div variants={itemVariants} className="flex items-center gap-4 mb-8">
        <Button variant="tertiary" onClick={onBack} className="!p-2 rounded-full bg-slate-800/50 hover:bg-slate-700">
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
             <div className={`p-2 rounded-xl bg-gradient-to-br ${gradient} bg-opacity-20`}>
                <div className="bg-black/40 p-2 rounded-lg">
                  {icon}
                </div>
             </div>
             <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Stats */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
               {/* Milestone Progress */}
              <Card className="!p-6 bg-gradient-to-r from-slate-900 to-slate-800/50 border-slate-700/50">
                 <div className="flex justify-between items-end mb-2">
                     <div>
                         <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                             <SparklesIcon className="h-5 w-5 text-yellow-400"/> Next Milestone
                         </h3>
                         <p className="text-gray-400 text-sm">You're doing great! Keep it up.</p>
                     </div>
                     <div className="text-right">
                         <span className="text-2xl font-bold text-white">{nextMilestone - current}</span>
                         <span className="text-sm text-gray-400 ml-1">days left</span>
                     </div>
                 </div>
                 <div className="w-full bg-slate-900/50 rounded-full h-4 border border-slate-700">
                     <motion.div 
                        className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progressToMilestone}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                     />
                 </div>
                 <div className="flex justify-between text-xs text-gray-500 mt-2 font-mono">
                     <span>{current} Days</span>
                     <span>{nextMilestone} Days</span>
                 </div>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Current Streak" value={current} gradient={gradient} subtext="Keep the flame alive!" />
                <StatCard label="Longest Streak" value={longest} gradient="from-gray-200 to-gray-400" subtext="All-time best" />
                <StatCard label="30-Day Consistency" value={`${consistency}%`} gradient="from-emerald-400 to-green-500" subtext="Active days" />
              </div>
          </motion.div>

          {/* Right Column: Calendar */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
              <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-4 h-full">
                  <h3 className="font-semibold text-gray-300 mb-4 flex items-center gap-2">
                      <TrendingUpIcon className="h-5 w-5" /> History
                  </h3>
                  <Calendar markedDates={markedDates} className="!bg-transparent !border-none !p-0 !max-w-full" />
              </div>
          </motion.div>
      </div>
    </motion.div>
  );
};

export default StreakDetailPage;
