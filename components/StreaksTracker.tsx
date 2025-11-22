import React from 'react';
import { Workout, DailyLog, NutritionGoals, AppView } from '../types';
import Card from './common/Card';
import { DumbbellIcon, FlameIcon, AppleIcon, WaterDropIcon, ArrowRightIcon } from './common/Icons';
import { motion } from 'framer-motion';
import { calculateStreak } from '../utils/dateHelpers';

interface StreaksTrackerProps {
  workouts: Workout[];
  dailyLogs: DailyLog[];
  goals: NutritionGoals;
  setView: (view: AppView) => void;
}

const StreakCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    currentStreak: number;
    longestStreak: number;
    gradient: string;
    glowColor: string;
    variants: any;
}> = ({ icon, title, currentStreak, longestStreak, gradient, glowColor, variants }) => {
    const isActive = currentStreak > 0;

    return (
        <motion.div variants={variants} className="flex-1">
            <Card className="relative text-center bg-slate-900/50 overflow-hidden h-full flex flex-col justify-between p-3 sm:p-4" disableHoverEffect>
                {/* Glow Effect */}
                <motion.div
                    className="absolute inset-0 w-full h-full"
                    style={{
                        background: `radial-gradient(circle at center, ${glowColor}60 0%, transparent 60%)`,
                        filter: 'blur(40px)',
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                        opacity: isActive ? [0.6, 1, 0.6] : 0, 
                        scale: isActive ? 1 : 0.8 
                    }}
                    transition={{
                        duration: 3,
                        repeat: isActive ? Infinity : 0,
                        ease: 'easeInOut',
                    }}
                />

                <div className="relative z-10">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <motion.div
                            className="relative p-3 rounded-full bg-slate-800/50"
                            animate={{
                                scale: isActive ? [1, 1.05, 1] : 1,
                            }}
                            transition={{
                                duration: 2,
                                repeat: isActive ? Infinity : 0,
                                ease: "easeInOut"
                            }}
                        >
                            {icon}
                        </motion.div>
                        <h3 className="font-semibold text-base sm:text-lg text-gray-200">{title}</h3>
                    </div>
                    <motion.p
                        key={currentStreak}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className={`text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b ${gradient}`}
                    >
                        {currentStreak}
                    </motion.p>
                    <p className="text-xs sm:text-sm text-gray-400">day streak</p>
                </div>
                <div className="relative z-10 mt-2">
                     <p className="text-xs text-gray-500">Longest: {longestStreak} days</p>
                </div>
            </Card>
        </motion.div>
    );
};

const StreaksTracker: React.FC<StreaksTrackerProps> = ({ workouts, dailyLogs, goals, setView }) => {
  const workoutDates: string[] = Array.from(new Set(workouts.map(w => w.date.split('T')[0])));
  const nutritionDates: string[] = Array.from(new Set(dailyLogs.filter(log => {
    const totalCalories = log.meals.reduce((total, meal) => 
      total + meal.items.reduce((mealTotal, item) => mealTotal + item.calories, 0), 0);
    return totalCalories >= goals.calories * 0.9 && totalCalories <= goals.calories * 1.1;
  }).map(log => log.date)));
  
  const waterDates: string[] = Array.from(new Set(dailyLogs.filter(log => (log.waterIntake || 0) >= goals.waterGoal).map(log => log.date)));

  const workoutStreak = calculateStreak(workoutDates);
  const nutritionStreak = calculateStreak(nutritionDates);
  const waterStreak = calculateStreak(waterDates);
  
  const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
          opacity: 1,
          transition: {
              staggerChildren: 0.2,
              delayChildren: 0.1,
          }
      }
  };

  const itemVariants = {
      hidden: { y: 20, opacity: 0 },
      visible: { y: 0, opacity: 1 }
  };


  return (
    <Card className="group cursor-pointer" onClick={() => setView('STREAKS')}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
            <FlameIcon className="text-violet-400 mr-3 h-7 w-7"/>
            <h2 className="text-2xl font-bold">Your Streaks</h2>
        </div>
        <ArrowRightIcon className="h-6 w-6 text-gray-400 group-hover:text-violet-300 group-hover:translate-x-1 transition-all duration-300" />
      </div>
      <motion.div 
        className="flex flex-col sm:flex-row gap-2 sm:gap-4 pointer-events-none"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <StreakCard 
            variants={itemVariants}
            icon={<DumbbellIcon className="text-violet-300 h-6 w-6 relative z-10" />} 
            title="Workout"
            currentStreak={workoutStreak.current}
            longestStreak={workoutStreak.longest}
            gradient="from-violet-300 to-purple-400"
            glowColor="#8b5cf6"
        />
        <StreakCard 
            variants={itemVariants}
            icon={<AppleIcon className="text-rose-300 h-6 w-6 relative z-10" />} 
            title="Nutrition Goal"
            currentStreak={nutritionStreak.current}
            longestStreak={nutritionStreak.longest}
            gradient="from-rose-300 to-red-400"
            glowColor="#f43f5e"
        />
        <StreakCard 
            variants={itemVariants}
            icon={<WaterDropIcon className="text-sky-300 h-6 w-6 relative z-10" />} 
            title="Water Goal"
            currentStreak={waterStreak.current}
            longestStreak={waterStreak.longest}
            gradient="from-sky-300 to-blue-400"
            glowColor="#38bdf8"
        />
      </motion.div>
    </Card>
  );
};

export default StreaksTracker;