import React, { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Workout, DailyLog, NutritionGoals, AppView } from '../types';
import Calendar from './common/Calendar';
import Card from './common/Card';
import Button from './common/Button';
import { ArrowLeftIcon, DumbbellIcon, AppleIcon, WaterDropIcon, ArrowRightIcon } from './common/Icons';
import StreakDetailPage from './StreakDetailPage';
import { AnimatePresence, motion } from 'framer-motion';

type DetailView = 'overview' | 'workout' | 'nutrition' | 'water';

interface StreaksPageProps {
    setView: (view: AppView) => void;
}

const StreaksPage: React.FC<StreaksPageProps> = ({ setView }) => {
    const [workouts] = useLocalStorage<Workout[]>('workouts', []);
    const [dailyLogs] = useLocalStorage<DailyLog[]>('dailyLogs', []);
    const [goals] = useLocalStorage<NutritionGoals>('nutritionGoals', { calories: 2000, protein: 150, carbs: 250, fat: 60, waterGoal: 3000 });
    const [detailView, setDetailView] = useState<DetailView>('overview');

    // Prepare dates for calendar markers
    const workoutDates = workouts.map(w => ({ date: w.date.split('T')[0], color: '#8b5cf6' }));
    const nutritionDates = dailyLogs.filter(log => {
        const totalCalories = log.meals.reduce((total, meal) => 
            total + meal.items.reduce((mealTotal, item) => mealTotal + item.calories, 0), 0);
        return totalCalories >= goals.calories * 0.9 && totalCalories <= goals.calories * 1.1;
    }).map(log => ({ date: log.date, color: '#f43f5e' }));
    const waterDates = dailyLogs.filter(log => (log.waterIntake || 0) >= goals.waterGoal)
        .map(log => ({ date: log.date, color: '#38bdf8' }));

    const allMarkedDates = [...workoutDates, ...nutritionDates, ...waterDates];

    const containerVariants = {
        hidden: { opacity: 0, x: -30 },
        visible: { opacity: 1, x: 0, transition: { staggerChildren: 0.1 } },
        exit: { opacity: 0, x: 30 },
    };
    
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    const renderOverview = () => (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit">
            <motion.div variants={itemVariants}>
                <Button variant="tertiary" onClick={() => setView('DASHBOARD')} className="mb-4">
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    Back to Dashboard
                </Button>
            </motion.div>
            <motion.h1 variants={itemVariants} className="text-3xl font-bold mb-6">Streaks Calendar</motion.h1>
            <motion.div variants={itemVariants}>
                 <Calendar markedDates={allMarkedDates} />
            </motion.div>

            <motion.div variants={itemVariants} className="mt-6">
                <h2 className="text-xl font-semibold mb-4">View Details</h2>
                <div className="space-y-4">
                    <Card onClick={() => setDetailView('workout')} className="cursor-pointer group">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <DumbbellIcon className="h-6 w-6 text-violet-400" />
                                <span className="font-semibold">Workout Streak</span>
                            </div>
                            <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Card>
                    <Card onClick={() => setDetailView('nutrition')} className="cursor-pointer group">
                         <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <AppleIcon className="h-6 w-6 text-rose-400" />
                                <span className="font-semibold">Nutrition Streak</span>
                            </div>
                            <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Card>
                    <Card onClick={() => setDetailView('water')} className="cursor-pointer group">
                         <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <WaterDropIcon className="h-6 w-6 text-sky-400" />
                                <span className="font-semibold">Water Goal Streak</span>
                            </div>
                            <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Card>
                </div>
            </motion.div>
        </motion.div>
    );
    
    const renderDetailView = () => {
        switch (detailView) {
            case 'workout':
                return <StreakDetailPage
                    title="Workout Streak"
                    icon={<DumbbellIcon className="text-violet-300 h-6 w-6" />}
                    dates={workoutDates.map(d => d.date)}
                    markerColor="#8b5cf6"
                    gradient="bg-gradient-to-r from-violet-400 to-purple-400"
                    onBack={() => setDetailView('overview')}
                />;
            case 'nutrition':
                 return <StreakDetailPage
                    title="Nutrition Streak"
                    icon={<AppleIcon className="text-rose-300 h-6 w-6" />}
                    dates={nutritionDates.map(d => d.date)}
                    markerColor="#f43f5e"
                    gradient="bg-gradient-to-r from-rose-400 to-red-400"
                    onBack={() => setDetailView('overview')}
                />;
            case 'water':
                 return <StreakDetailPage
                    title="Water Goal Streak"
                    icon={<WaterDropIcon className="text-sky-300 h-6 w-6" />}
                    dates={waterDates.map(d => d.date)}
                    markerColor="#38bdf8"
                    gradient="bg-gradient-to-r from-sky-400 to-blue-400"
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
