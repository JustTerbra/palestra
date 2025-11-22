
import React, { useState } from 'react';
import { useUserData } from '../hooks/useUserData';
import { Workout, DailyLog, NutritionGoals, AppView } from '../types';
import Calendar from './common/Calendar';
import Card from './common/Card';
import Button from './common/Button';
import { ArrowLeftIcon, DumbbellIcon, AppleIcon, WaterDropIcon, ArrowRightIcon, LoaderIcon, SparklesIcon } from './common/Icons';
import StreakDetailPage from './StreakDetailPage';
import { AnimatePresence, motion } from 'framer-motion';
import { calculateStreak } from '../utils/dateHelpers';

type DetailView = 'overview' | 'workout' | 'nutrition' | 'water';

interface StreaksPageProps {
    setView: (view: AppView) => void;
    userId: string | undefined;
}

const getNextMilestone = (current: number) => {
    const milestones = [3, 7, 14, 30, 60, 90, 100, 365];
    return milestones.find(m => m > current) || (current + 50);
};

const StreakSummaryCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    currentStreak: number;
    colorClass: string;
    onClick: () => void;
}> = ({ title, icon, currentStreak, colorClass, onClick }) => {
    const nextMilestone = getNextMilestone(currentStreak);
    const progress = Math.min((currentStreak / nextMilestone) * 100, 100);

    return (
        <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 cursor-pointer relative overflow-hidden group"
            onClick={onClick}
        >
            <div className={`absolute top-0 left-0 w-1 h-full ${colorClass}`} />
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-slate-900/50 text-gray-200 group-hover:text-white transition-colors`}>
                        {icon}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-200">{title}</h3>
                        <p className="text-xs text-gray-500">Next Goal: {nextMilestone} Days</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-bold text-white">{currentStreak}</span>
                    <span className="text-xs text-gray-400 block uppercase tracking-wider">Days</span>
                </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-700/30 rounded-full h-1.5 overflow-hidden">
                <motion.div 
                    className={`h-full rounded-full ${colorClass.replace('bg-', '') === 'bg-violet-500' ? 'bg-violet-500' : colorClass.replace('bg-', '') === 'bg-rose-500' ? 'bg-rose-500' : 'bg-sky-500'}`}
                    style={{ backgroundColor: 'currentColor' }} // fallback
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />
            </div>
            <div className="mt-2 flex justify-end">
                 <ArrowRightIcon className="h-4 w-4 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
        </motion.div>
    );
}


const StreaksPage: React.FC<StreaksPageProps> = ({ setView, userId }) => {
    const [workouts, , loadingWorkouts] = useUserData<Workout[]>('workouts', [], userId);
    const [dailyLogs, , loadingLogs] = useUserData<DailyLog[]>('dailyLogs', [], userId);
    const [goals, , loadingGoals] = useUserData<NutritionGoals>('nutritionGoals', { calories: 2000, protein: 150, carbs: 250, fat: 60, waterGoal: 3000 }, userId);
    const [detailView, setDetailView] = useState<DetailView>('overview');

    if (loadingWorkouts || loadingLogs || loadingGoals) {
        return <div className="flex justify-center py-20"><LoaderIcon className="h-10 w-10 text-violet-500" /></div>;
    }

    // Prepare dates
    const workoutDatesRaw = workouts.map(w => w.date.split('T')[0]);
    const workoutDates = workoutDatesRaw.map(date => ({ date, color: '#8b5cf6' }));
    
    const nutritionDatesRaw = dailyLogs.filter(log => {
        const totalCalories = log.meals.reduce((total, meal) => 
            total + meal.items.reduce((mealTotal, item) => mealTotal + item.calories, 0), 0);
        return totalCalories >= goals.calories * 0.9 && totalCalories <= goals.calories * 1.1;
    }).map(log => log.date);
    const nutritionDates = nutritionDatesRaw.map(date => ({ date, color: '#f43f5e' }));
    
    const waterDatesRaw = dailyLogs.filter(log => (log.waterIntake || 0) >= goals.waterGoal).map(log => log.date);
    const waterDates = waterDatesRaw.map(date => ({ date, color: '#38bdf8' }));

    const allMarkedDates = [...workoutDates, ...nutritionDates, ...waterDates];

    // Calculate Streaks
    const workoutStreak = calculateStreak(workoutDatesRaw).current;
    const nutritionStreak = calculateStreak(nutritionDatesRaw).current;
    const waterStreak = calculateStreak(waterDatesRaw).current;

    const containerVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0, transition: { staggerChildren: 0.05 } },
        exit: { opacity: 0, x: 20 },
    };
    
    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
    };

    const renderOverview = () => (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <motion.div variants={itemVariants}>
                    <h1 className="text-3xl font-bold font-righteous bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Streaks Overview</h1>
                    <p className="text-gray-400 text-sm mt-1">Consistency is the key to progress.</p>
                </motion.div>
                <motion.div variants={itemVariants}>
                    <Button variant="tertiary" onClick={() => setView('DASHBOARD')}>
                        <ArrowLeftIcon className="h-5 w-5 mr-2" />
                        Dashboard
                    </Button>
                </motion.div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
                <motion.div variants={itemVariants} className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-300 flex items-center gap-2">
                        <SparklesIcon className="h-5 w-5 text-yellow-500" /> Current Status
                    </h2>
                    <StreakSummaryCard 
                        title="Workout Streak" 
                        icon={<DumbbellIcon className="h-5 w-5 text-violet-400" />}
                        currentStreak={workoutStreak}
                        colorClass="bg-violet-500"
                        onClick={() => setDetailView('workout')}
                    />
                    <StreakSummaryCard 
                        title="Nutrition Streak" 
                        icon={<AppleIcon className="h-5 w-5 text-rose-400" />}
                        currentStreak={nutritionStreak}
                        colorClass="bg-rose-500"
                        onClick={() => setDetailView('nutrition')}
                    />
                    <StreakSummaryCard 
                        title="Water Streak" 
                        icon={<WaterDropIcon className="h-5 w-5 text-sky-400" />}
                        currentStreak={waterStreak}
                        colorClass="bg-sky-500"
                        onClick={() => setDetailView('water')}
                    />
                </motion.div>

                <motion.div variants={itemVariants}>
                    <h2 className="text-lg font-semibold text-gray-300 mb-4">Calendar View</h2>
                    <Card className="!p-0 overflow-hidden bg-slate-900/30">
                        <div className="p-4">
                             <Calendar markedDates={allMarkedDates} />
                        </div>
                        <div className="bg-slate-800/50 p-3 text-xs text-gray-400 flex justify-center gap-4 border-t border-slate-700/50">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-violet-500"/> Workout</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"/> Nutrition</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-sky-500"/> Water</div>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
    
    const renderDetailView = () => {
        switch (detailView) {
            case 'workout':
                return <StreakDetailPage
                    title="Workout Streak"
                    icon={<DumbbellIcon className="text-violet-300 h-8 w-8" />}
                    dates={workoutDatesRaw}
                    markerColor="#8b5cf6"
                    gradient="from-violet-400 to-purple-400"
                    onBack={() => setDetailView('overview')}
                />;
            case 'nutrition':
                 return <StreakDetailPage
                    title="Nutrition Streak"
                    icon={<AppleIcon className="text-rose-300 h-8 w-8" />}
                    dates={nutritionDatesRaw}
                    markerColor="#f43f5e"
                    gradient="from-rose-400 to-red-400"
                    onBack={() => setDetailView('overview')}
                />;
            case 'water':
                 return <StreakDetailPage
                    title="Water Streak"
                    icon={<WaterDropIcon className="text-sky-300 h-8 w-8" />}
                    dates={waterDatesRaw}
                    markerColor="#38bdf8"
                    gradient="from-sky-400 to-blue-400"
                    onBack={() => setDetailView('overview')}
                />;
            default:
                return null;
        }
    };

    return (
        <AnimatePresence mode="wait">
            {detailView === 'overview' ? (
                <motion.div key="overview">
                    {renderOverview()}
                </motion.div>
            ) : (
                <motion.div key={detailView}>
                    {renderDetailView()}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default StreaksPage;
