import React from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { AppView, DailyLog, NutritionGoals, Workout } from '../types';
import Card from './common/Card';
import StreaksTracker from './StreaksTracker';
import { DumbbellIcon, AppleIcon, ArrowRightIcon } from './common/Icons';
import { motion } from 'framer-motion';

interface DashboardProps {
    setView: (view: AppView) => void;
    currentUser: string;
}

const AnimatedProgressBar: React.FC<{ value: number; total: number; gradient: string }> = ({ value, total, gradient }) => {
  const percentage = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div className="w-full bg-slate-700/50 rounded-full h-5 overflow-hidden shadow-inner border border-slate-600/50">
      <motion.div
        className={`h-full rounded-full ${gradient}`}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
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
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
};


const Dashboard: React.FC<DashboardProps> = ({ setView, currentUser }) => {
  const [workouts] = useLocalStorage<Workout[]>('workouts', []);
  const [dailyLogs] = useLocalStorage<DailyLog[]>('dailyLogs', []);
  const [goals] = useLocalStorage<NutritionGoals>('nutritionGoals', { calories: 2000, protein: 150, carbs: 250, fat: 60, waterGoal: 3000 });
  
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-400 font-righteous">
            Welcome Back, {currentUser}!
        </h1>
        <p className="text-gray-400 mt-2 text-md sm:text-lg">Here's a summary of your progress today.</p>
      </div>

      <StreaksTracker workouts={workouts} dailyLogs={dailyLogs} goals={goals} setView={setView} />

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="cursor-pointer group" onClick={() => setView('EXERCISE')}>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <DumbbellIcon className="text-violet-400 h-8 w-8" />
                  <h2 className="text-2xl font-bold">Exercise</h2>
                </div>
                {latestWorkout ? (
                  <div>
                    <p className="text-gray-400">Last workout: <span className="font-semibold text-gray-300">{new Date(latestWorkout.date).toLocaleDateString()}</span></p>
                    <p className="text-gray-400 mt-1">{latestWorkout.exercises.length} exercises performed.</p>
                    <ul className="list-disc list-inside mt-2 text-gray-300 space-y-1 text-sm sm:text-base">
                      {latestWorkout.exercises.slice(0, 3).map(ex => <li key={ex.id}>{ex.name}</li>)}
                      {latestWorkout.exercises.length > 3 && <li>...and more</li>}
                    </ul>
                  </div>
                ) : (
                  <p className="text-gray-400">No workouts logged yet. Let's get started!</p>
                )}
              </div>
              <div className="text-violet-400 transition-transform group-hover:translate-x-1 duration-300">
                <ArrowRightIcon className="h-6 w-6"/>
              </div>
            </div>
        </Card>

        <Card className="cursor-pointer group" onClick={() => setView('NUTRITION')}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                    <AppleIcon className="text-violet-400 h-8 w-8" />
                    <h2 className="text-2xl font-bold">Nutrition</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                        <p className="text-gray-400 text-sm">Today's Calorie Intake:</p>
                        <p className="text-lg font-semibold">{todaysCalories} / {goals.calories} <span className="text-sm font-normal text-gray-400">kcal</span></p>
                    </div>
                    <AnimatedProgressBar value={todaysCalories} total={goals.calories} gradient="bg-gradient-to-r from-violet-500 to-purple-500" />
                  </div>

                  <div className="pt-2 space-y-3">
                    <MiniMacroBar label="Protein" value={todaysMacros.protein} total={goals.protein} gradient="bg-gradient-to-r from-sky-500 to-cyan-400"/>
                    <MiniMacroBar label="Carbs" value={todaysMacros.carbs} total={goals.carbs} gradient="bg-gradient-to-r from-amber-500 to-yellow-400"/>
                    <MiniMacroBar label="Fat" value={todaysMacros.fat} total={goals.fat} gradient="bg-gradient-to-r from-rose-500 to-red-400"/>
                  </div>
                </div>
              </div>
              <div className="text-violet-400 transition-transform group-hover:translate-x-1 duration-300 ml-4">
                <ArrowRightIcon className="h-6 w-6"/>
              </div>
            </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;