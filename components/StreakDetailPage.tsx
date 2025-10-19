import React from 'react';
import { calculateStreak } from '../utils/dateHelpers';
import Card from './common/Card';
import Button from './common/Button';
import Calendar from './common/Calendar';
import { ArrowLeftIcon } from './common/Icons';
import { motion } from 'framer-motion';

interface StreakDetailPageProps {
  title: string;
  icon: React.ReactNode;
  dates: string[];
  markerColor: string;
  gradient: string;
  onBack: () => void;
}

const StatCard: React.FC<{ label: string; value: React.ReactNode; gradient: string }> = ({ label, value, gradient }) => (
  <Card className="text-center !p-4">
    <p className="text-sm text-gray-400">{label}</p>
    <p className={`text-4xl font-bold bg-clip-text text-transparent ${gradient}`}>{value}</p>
  </Card>
);

const StreakDetailPage: React.FC<StreakDetailPageProps> = ({ title, icon, dates, markerColor, gradient, onBack }) => {
  const { current, longest } = calculateStreak(dates);

  const markedDates = dates.map(date => ({ date, color: markerColor }));

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
    <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit">
      <motion.div variants={itemVariants}>
        <Button variant="tertiary" onClick={onBack} className="mb-4">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Streaks Overview
        </Button>
      </motion.div>
      <motion.div variants={itemVariants} className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-slate-800/50 rounded-lg">
          {icon}
        </div>
        <h1 className="text-3xl font-bold">{title}</h1>
      </motion.div>
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 mb-6">
        <StatCard label="Current Streak" value={`${current} Days`} gradient={gradient} />
        <StatCard label="Longest Streak" value={`${longest} Days`} gradient={gradient} />
      </motion.div>
      <motion.div variants={itemVariants}>
        <Calendar markedDates={markedDates} />
      </motion.div>
    </motion.div>
  );
};

export default StreakDetailPage;
