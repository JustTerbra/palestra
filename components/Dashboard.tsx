
import React from 'react';
import { useUserData } from '../hooks/useUserData';
import { AppView, DailyLog, NutritionGoals, Workout } from '../types';
import Card from './common/Card';
import StreaksTracker from './StreaksTracker';
import { DumbbellIcon, AppleIcon, ArrowRightIcon, LoaderIcon } from './common/Icons';
import { motion } from 'framer-motion';

interface DashboardProps {
    setView: (view: AppView) => void;
    currentUser: string;
    userId: string | undefined;
}

const AnimatedProgressBar: React.FC<{ value: number; total: number; gradient: string }> = ({ value, total, gradient }) => {
  const percentage = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div className="w-full bg-slate-700/50 rounded-full h-5 overflow-hidden shadow-inner border border-slate-600/50 relative">
      <motion.div
        className={`h-full rounded-full ${gradient} relative overflow-hidden`}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1.5, type: "spring", bounce: 0.2 }}
      >
        {/* Shimmer effect */}
        <motion.div 
            className="absolute top-0 left-0 bottom-0 w-20 bg-white/30 skew-x-12 blur-md"
            animate={{ x: ["-100%", "500%"] }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        />
      </motion.div>
    </div>
  );
};

const MiniMacroBar: React.FC<{ label: string; value: number; total: number; gradient: string }> = ({ label, value, total, gradient }) => {
  const percentage = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-baseline text-xs mb-1">
        <span className="font-semibold text-gray-300">{label}</span>
        <span className="text-gray-400">{Math.round(value)}<span className="text-gray-500">/{total}g</span></span>
      </div>
      <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${gradient}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};


const Dashboard: React.FC<DashboardProps> = ({ setView, currentUser, userId }) => {
  const [workouts, , loadingWorkouts] = useUserData<Workout[]>('workouts', [], userId);
  const [dailyLogs, , loadingLogs] = useUserData<DailyLog[]>('dailyLogs', [], userId);
  const [goals, , loadingGoals] = useUserData<NutritionGoals>('nutritionGoals', { calories: 2000, protein: 150, carbs: 250, fat: 60, waterGoal: 3000 }, userId);
  
  if (loadingWorkouts || loadingLogs || loadingGoals) {
      return <div className="flex justify-center py-20"><LoaderIcon className="h-10 w-10 text-violet-500" /></div>;
  }

  const today = new Date().toISOString().split('T')[0];
  const todaysLog = dailyLogs.find(log => log.date === today);

  const todaysCalories = todaysLog?.meals.reduce((total, meal) => 
    total + meal.items.reduce((mealTotal, item) => mealTotal + item.calories, 0), 0) || 0;
    
  const todaysMacros = todaysLog?.meals.reduce((acc, meal) => {
    meal.items.forEach(item => {
        acc.protein += item.protein;
        acc.carbs += item.carbs;
        acc.fat += item.fat;
    });
    return acc;
  }, { protein: 0, carbs: 0, fat: 0 }) || { protein: 0, carbs: 0, fat: 0 };

  const latestWorkout = workouts.length > 0 ? workouts[0] : null;

  const containerVariants = {
      hidden: { opacity: 0 },
      show: {
          opacity: 1,
          transition: {
              staggerChildren: 0.1
          }
      }
  };
  
  const itemVariants = {
      hidden: { y: 20, opacity: 0 },
      show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
        className="space-y-8 perspective-1000"
        variants={containerVariants}
        initial="hidden"
        animate="show"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-200 to-gray-500 font-righteous drop-shadow-lg">
            Welcome Back, {currentUser}!
        </h1>
        <p className="text-gray-400 mt-2 text-md sm:text-lg border-l-4 border-violet-500 pl-3">Here's a summary of your progress today.</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <StreaksTracker workouts={workouts} dailyLogs={dailyLogs} goals={goals} setView={setView} />
      </motion.div>

      <motion.div className="grid md:grid-cols-2 gap-6" variants={itemVariants}>
        <Card className="cursor-pointer group hover:shadow-violet-900/20" onClick={() => setView('EXERCISE')} enableTilt>
            <div className="flex justify-between items-start h-full">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-violet-500/20 rounded-xl shadow-inner shadow-violet-500/30 backdrop-blur-sm">
                    <DumbbellIcon className="text-violet-300 h-8 w-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Exercise</h2>
                </div>
                
                <div className="flex-grow">
                    {latestWorkout ? (
                    <div className="space-y-3">
                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                            <p className="text-gray-400 text-xs uppercase tracking-wide font-bold">Last Session</p>
                            <p className="font-righteous text-xl text-violet-200">{new Date(latestWorkout.date).toLocaleDateString(undefined, { weekday: 'long' })}</p>
                            <p className="text-gray-400 text-sm">{new Date(latestWorkout.date).toLocaleDateString()}</p>
                        </div>
                        <div className="px-1">
                            <p className="text-gray-300 text-sm font-medium mb-1">{latestWorkout.exercises.length} Exercises Completed:</p>
                            <ul className="space-y-1">
                                {latestWorkout.exercises.slice(0, 3).map(ex => (
                                    <li key={ex.id} className="text-gray-400 text-sm flex items-center">
                                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mr-2"></span>
                                        {ex.name}
                                    </li>
                                ))}
                                {latestWorkout.exercises.length > 3 && <li className="text-xs text-gray-500 italic pl-3.5">...and more</li>}
                            </ul>
                        </div>
                    </div>
                    ) : (
                    <div className="h-full flex flex-col justify-center">
                        <p className="text-gray-400 italic">No workouts logged yet.</p>
                        <p className="text-violet-400 text-sm mt-1 font-semibold">Start your journey today!</p>
                    </div>
                    )}
                </div>
              </div>
              
              <div className="bg-slate-800 p-2 rounded-full text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-all duration-300 shadow-lg">
                <ArrowRightIcon className="h-6 w-6 transform group-hover:translate-x-0.5 transition-transform"/>
              </div>
            </div>
        </Card>

        <Card className="cursor-pointer group hover:shadow-rose-900/20" onClick={() => setView('NUTRITION')} enableTilt>
            <div className="flex justify-between items-start h-full">
              <div className="flex-1 flex flex-col h-full">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-rose-500/20 rounded-xl shadow-inner shadow-rose-500/30 backdrop-blur-sm">
                        <AppleIcon className="text-rose-300 h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Nutrition</h2>
                </div>
                
                <div className="space-y-5 flex-grow">
                  <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-700/30">
                    <div className="flex justify-between items-baseline mb-2">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wide">Calories</p>
                        <p className="text-lg font-righteous text-white">{todaysCalories} <span className="text-sm font-sans text-gray-500">/ {goals.calories}</span></p>
                    </div>
                    <AnimatedProgressBar value={todaysCalories} total={goals.calories} gradient="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500" />
                  </div>

                  <div className="space-y-3 px-1">
                    <MiniMacroBar label="Protein" value={todaysMacros.protein} total={goals.protein} gradient="bg-gradient-to-r from-sky-500 to-cyan-400"/>
                    <MiniMacroBar label="Carbs" value={todaysMacros.carbs} total={goals.carbs} gradient="bg-gradient-to-r from-amber-500 to-yellow-400"/>
                    <MiniMacroBar label="Fat" value={todaysMacros.fat} total={goals.fat} gradient="bg-gradient-to-r from-rose-500 to-red-400"/>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800 p-2 rounded-full text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300 shadow-lg ml-4">
                <ArrowRightIcon className="h-6 w-6 transform group-hover:translate-x-0.5 transition-transform"/>
              </div>
            </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
