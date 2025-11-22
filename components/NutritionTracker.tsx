
import React, { useState } from 'react';
import { DailyLog, FoodItem, Meal, MealType, NutritionGoals } from '../types';
import { useUserData } from '../hooks/useUserData';
import Button from './common/Button';
import Card from './common/Card';
import Modal from './common/Modal';
import Input from './common/Input';
import { PlusIcon, TrashIcon, BarcodeIcon, SparklesIcon, LoaderIcon, EditIcon } from './common/Icons';
import { getNutritionInfo } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import BarcodeScanner from './BarcodeScanner';

const MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

interface NutritionTrackerProps {
    userId: string | undefined;
}

const NutritionTracker: React.FC<NutritionTrackerProps> = ({ userId }) => {
  const [dailyLogs, setDailyLogs, loadingLogs] = useUserData<DailyLog[]>('dailyLogs', [], userId);
  const [goals, setGoals, loadingGoals] = useUserData<NutritionGoals>('nutritionGoals', { calories: 2000, protein: 150, carbs: 250, fat: 60, waterGoal: 3000 }, userId);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [currentItem, setCurrentItem] = useState<Partial<FoodItem> & { name: string }>({ name: '' });
  const [currentMealType, setCurrentMealType] = useState<MealType>('Breakfast');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiAnalyzedItems, setAiAnalyzedItems] = useState<FoodItem[]>([]);
  const [itemToEdit, setItemToEdit] = useState<{ mealType: MealType; item: FoodItem } | null>(null);

  const today = new Date().toISOString().split('T')[0];
  let todaysLog = dailyLogs.find(log => log.date === today);
  const todaysWater = todaysLog?.waterIntake || 0;

  // ... logic functions same as before ...
  const handleLogWater = (amount: number) => {
    setDailyLogs(prevLogs => {
      const logsCopy = [...prevLogs];
      let logForToday = logsCopy.find(log => log.date === today);
      if (!logForToday) {
        logForToday = { date: today, meals: [], waterIntake: 0 };
        logsCopy.unshift(logForToday);
      } else {
        const index = logsCopy.indexOf(logForToday);
        logForToday = { ...logForToday };
        logsCopy[index] = logForToday;
      }
      logForToday.waterIntake = (logForToday.waterIntake || 0) + amount;
      return logsCopy;
    });
  };

  const addItemsToLog = (itemsToAdd: FoodItem[]) => {
      if (itemsToAdd.length === 0) return;
      setDailyLogs(prevLogs => {
        const logsCopy = [...prevLogs];
        let logForToday = logsCopy.find(log => log.date === today);
        if (!logForToday) {
          logForToday = { date: today, meals: [] };
          logsCopy.unshift(logForToday);
        } else {
           const index = logsCopy.indexOf(logForToday);
           logForToday = { ...logForToday, meals: [...logForToday.meals] };
           logsCopy[index] = logForToday;
        }

        let meal = logForToday.meals.find(m => m.name === currentMealType);
        if (!meal) {
          meal = { id: Date.now().toString(), name: currentMealType, items: [] };
          logForToday.meals.push(meal);
        } else {
           const mealIndex = logForToday.meals.indexOf(meal);
           meal = { ...meal, items: [...meal.items] };
           logForToday.meals[mealIndex] = meal;
        }
        meal.items.push(...itemsToAdd);
        return logsCopy;
      });
  }

  const handleAddFood = () => {
    let itemsToAdd: FoodItem[] = [];
    if (aiAnalyzedItems.length > 0) {
      itemsToAdd = aiAnalyzedItems;
    } else {
      const { id = Date.now().toString(), name, calories = 0, protein = 0, carbs = 0, fat = 0 } = currentItem;
      if (!name) return;
      itemsToAdd.push({ id, name, calories, protein, carbs, fat });
    }
    addItemsToLog(itemsToAdd);
    setIsModalOpen(false);
    setCurrentItem({ name: '' });
    setAiAnalyzedItems([]);
  };
  
  const handleRemoveFood = (mealType: MealType, itemId: string) => {
     setDailyLogs(prevLogs => {
      const logsCopy = JSON.parse(JSON.stringify(prevLogs)); // Deep copy
      let logForToday = logsCopy.find((log: DailyLog) => log.date === today);
      if (!logForToday) return prevLogs;
      let meal = logForToday.meals.find((m: Meal) => m.name === mealType);
      if (!meal) return prevLogs;
      meal.items = meal.items.filter((item: FoodItem) => item.id !== itemId);
      return logsCopy;
    });
  };
  
  const openEditModal = (mealType: MealType, item: FoodItem) => {
    setItemToEdit({ mealType, item: { ...item } });
    setIsEditModalOpen(true);
  };

  const handleUpdateFoodItem = () => {
    if (!itemToEdit) return;
    const { mealType, item } = itemToEdit;
    setDailyLogs(prevLogs => {
      const logsCopy = JSON.parse(JSON.stringify(prevLogs));
      const logForToday = logsCopy.find((log: DailyLog) => log.date === today);
      if (!logForToday) return prevLogs;
      const meal = logForToday.meals.find((m: Meal) => m.name === mealType);
      if (!meal) return prevLogs;
      const itemIndex = meal.items.findIndex((i: FoodItem) => i.id === item.id);
      if (itemIndex > -1) {
        meal.items[itemIndex] = item;
      }
      return logsCopy;
    });
    setIsEditModalOpen(false);
    setItemToEdit(null);
  };

  const handleAiAnalyze = async () => {
    if (!currentItem.name) return;
    setIsLoadingAi(true);
    setAiAnalyzedItems([]);
    try {
        const nutritionData = await getNutritionInfo(currentItem.name);
        const itemsWithIds = nutritionData.items.map((item: Omit<FoodItem, 'id'>) => ({
            ...item,
            id: `${Date.now()}-${item.name}-${Math.random()}`
        }));
        setAiAnalyzedItems(itemsWithIds);
        setCurrentItem(prev => ({...prev, ...nutritionData.total}));
    } catch(error: any) {
        console.error("AI nutrition analysis error:", error);
        alert(`Failed to analyze nutrition: ${error?.message || 'Unknown error'}`);
    } finally {
        setIsLoadingAi(false);
    }
  };

  const openFoodModal = (mealType: MealType) => {
    setCurrentMealType(mealType);
    setCurrentItem({ name: '' });
    setAiAnalyzedItems([]);
    setIsModalOpen(true);
  };
  
  const handleBarcodeScanned = (foodItem: FoodItem) => {
    addItemsToLog([foodItem]);
    setIsScannerOpen(false);
  };


  const totals = (todaysLog?.meals || []).reduce((acc, meal) => {
    meal.items.forEach(item => {
      acc.calories += item.calories;
      acc.protein += item.protein;
      acc.carbs += item.carbs;
      acc.fat += item.fat;
    });
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const MacroProgress = ({ label, value, goal, color, gradient }: { label: string, value: number, goal: number, color: string, gradient: string }) => {
      const percentage = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
      return (
        <div className="text-center group relative">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto transform group-hover:scale-110 transition-transform duration-300">
                {/* Glow Effect */}
                <div className={`absolute inset-0 rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity ${gradient.replace('from-', 'bg-')}`} />
                
                <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 36 36">
                    <path className="text-slate-800" strokeWidth="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <motion.path 
                        className={color}
                        strokeWidth="4"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        strokeDasharray="100, 100"
                        style={{ pathLength: 0 }}
                        animate={{ pathLength: percentage / 100 }}
                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                     />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <span className="font-bold text-lg sm:text-xl leading-none text-white drop-shadow-md">{Math.round(value)}</span>
                    <span className="text-[10px] text-gray-400">/ {goal}g</span>
                </div>
            </div>
            <p className="text-sm font-bold text-gray-300 mt-3 tracking-wider uppercase">{label}</p>
        </div>
      )
  };

  if (loadingLogs || loadingGoals) return <div className="flex justify-center py-20"><LoaderIcon className="h-10 w-10 text-violet-500" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-2">
        <h1 className="text-3xl sm:text-4xl font-bold font-righteous">Nutrition Tracker</h1>
        <Button onClick={() => setIsScannerOpen(true)} className="shadow-lg shadow-violet-500/20">
            <BarcodeIcon className="mr-2 h-5 w-5"/>
            Scan Product
        </Button>
      </div>
      
      <Card enableTilt className="overflow-visible !bg-slate-900/60 border-slate-700/60">
        <div className="flex justify-between items-center mb-8 relative z-10">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2"><SparklesIcon className="text-yellow-400 h-6 w-6" /> Today's Fuel</h2>
          <Button variant="secondary" onClick={() => setIsGoalsModalOpen(true)} className="text-xs px-3 py-1">Adjust Goals</Button>
        </div>
        
        <div className="flex flex-col items-center gap-8 relative z-10">
          <div className="text-center relative">
            <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="relative z-10"
            >
                <p className="text-6xl sm:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 tracking-tighter drop-shadow-2xl">
                    {Math.round(totals.calories)}
                </p>
                <p className="text-gray-400 font-medium mt-1 uppercase tracking-widest text-sm">kcal consumed</p>
            </motion.div>
            
            {/* Background Glow */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-violet-600/20 blur-[60px] rounded-full pointer-events-none"></div>
          </div>

          <div className="w-full max-w-2xl space-y-1">
             <div className="flex justify-between text-xs text-gray-400 px-1">
                 <span>0%</span>
                 <span>Target: {goals.calories}</span>
             </div>
             <div className="w-full bg-slate-800 rounded-full h-6 overflow-hidden border border-slate-700 shadow-inner relative group">
                <motion.div 
                className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-purple-600 h-full rounded-full relative overflow-hidden" 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((totals.calories / goals.calories) * 100, 100)}%` }}
                transition={{ duration: 1.2, ease: 'circOut' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                    <motion.div 
                        className="absolute inset-0 bg-white/30 skew-x-12 blur-md w-20 h-full"
                        animate={{ x: ["-100%", "600%"] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                    />
                </motion.div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 sm:gap-12 w-full pt-6 border-t border-slate-800/50">
            <MacroProgress label="Protein" value={totals.protein} goal={goals.protein} color="stroke-sky-400" gradient="from-sky-500"/>
            <MacroProgress label="Carbs" value={totals.carbs} goal={goals.carbs} color="stroke-amber-400" gradient="from-amber-500"/>
            <MacroProgress label="Fat" value={totals.fat} goal={goals.fat} color="stroke-rose-400" gradient="from-rose-500"/>
          </div>
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden border-0 bg-transparent shadow-none">
           <div className="bg-gradient-to-r from-sky-900/40 to-blue-900/40 border border-sky-500/30 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-sky-500/20 blur-3xl rounded-full" />
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
                    <div className="flex items-center gap-4">
                         <div className="bg-sky-500/20 p-3 rounded-full ring-1 ring-sky-500/50">
                             <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                                 <LoaderIcon className="h-6 w-6 text-sky-300" />
                             </motion.div>
                         </div>
                         <div>
                             <h3 className="text-lg font-bold text-white">Hydration Level</h3>
                             <div className="flex items-baseline gap-1">
                                 <span className="text-2xl font-bold text-sky-300">{todaysWater}</span>
                                 <span className="text-sm text-gray-400">/ {goals.waterGoal} ml</span>
                             </div>
                         </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" className="bg-sky-950/50 hover:bg-sky-900 border-sky-800/50" onClick={() => handleLogWater(250)}>+250ml</Button>
                        <Button variant="secondary" className="bg-sky-950/50 hover:bg-sky-900 border-sky-800/50" onClick={() => handleLogWater(500)}>+500ml</Button>
                    </div>
                </div>
                 <div className="w-full bg-sky-950/50 rounded-full h-2 mt-4 overflow-hidden">
                    <motion.div 
                        className="bg-sky-400 h-full rounded-full shadow-[0_0_10px_rgba(56,189,248,0.6)]" 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((todaysWater / goals.waterGoal) * 100, 100)}%` }}
                    />
                </div>
           </div>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        {MEAL_TYPES.map((mealType, idx) => (
          <motion.div 
            key={mealType}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="h-full hover:border-slate-500/50 transition-colors duration-300">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700/50">
                <h3 className="text-lg font-bold text-violet-200">{mealType}</h3>
                <Button variant="secondary" className="h-8 w-8 p-0 rounded-full hover:bg-violet-600 hover:text-white transition-colors" onClick={() => openFoodModal(mealType)}>
                    <PlusIcon className="mx-auto h-5 w-5" />
                </Button>
                </div>
                <ul className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {(todaysLog?.meals.find(m => m.name === mealType)?.items || []).map(item => (
                        <motion.li 
                            key={item.id} 
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex justify-between items-center bg-slate-900/60 p-3 rounded-xl border border-slate-800 hover:border-slate-600 transition-colors group"
                        >
                            <div>
                                <p className="font-semibold text-gray-200">{item.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5 font-mono">
                                    <span className="text-violet-300">{item.calories}kcal</span> &bull; 
                                    <span className="text-sky-300 ml-1">{item.protein}p</span> &bull; 
                                    <span className="text-amber-300 ml-1">{item.carbs}c</span> &bull; 
                                    <span className="text-rose-300 ml-1">{item.fat}f</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="tertiary" className="p-1.5 h-8 w-8 hover:bg-slate-700 rounded-full" onClick={() => openEditModal(mealType, item)}>
                                    <EditIcon className="h-4 w-4" />
                                </Button>
                                <Button variant="danger" className="p-1.5 h-8 w-8 rounded-full" onClick={() => handleRemoveFood(mealType, item.id)}>
                                    <TrashIcon className="h-4 w-4" />
                                </Button>
                            </div>
                        </motion.li>
                    ))}
                </AnimatePresence>
                {(todaysLog?.meals.find(m => m.name === mealType)?.items || []).length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-slate-800 rounded-xl">
                        <p className="text-gray-600 text-xs font-medium">Empty Plate</p>
                        <Button variant="tertiary" onClick={() => openFoodModal(mealType)} className="mt-2 text-xs text-violet-400 hover:text-violet-300">
                            + Add Food
                        </Button>
                    </div>
                )}
                </ul>
            </Card>
          </motion.div>
        ))}
      </div>
      
      <BarcodeScanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScanned={handleBarcodeScanned} 
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Add to ${currentMealType}`}>
        {/* Same Modal Content */}
        <div className="space-y-4">
          <Input 
            label="Food Description" 
            placeholder="e.g., '2 eggs and a slice of toast'"
            value={currentItem.name} 
            onChange={e => setCurrentItem(p => ({ ...p, name: e.target.value }))} 
          />
           <Button onClick={handleAiAnalyze} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50" disabled={isLoadingAi || !currentItem.name}>
             {isLoadingAi ? <LoaderIcon className="h-5 w-5"/> : <><SparklesIcon className="h-5 w-5 mr-2"/>Analyze with Gemini AI</>}
          </Button>
          {aiAnalyzedItems.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-700">
                <h4 className="font-semibold text-gray-300">AI Breakdown:</h4>
                <ul className="space-y-1 text-sm max-h-32 overflow-y-auto p-1">
                    {aiAnalyzedItems.map(item => (
                        <li key={item.id} className="bg-slate-700/50 p-2 rounded-md flex justify-between">
                            <span className="font-semibold">{item.name}</span>
                            <span className="text-xs text-gray-400">{item.calories}kcal</span>
                        </li>
                    ))}
                </ul>
            </div>
          )}
          <p className="text-center text-sm text-gray-500 !mt-2">
            {aiAnalyzedItems.length > 0 ? "Totals from AI are shown below. You can adjust them." : "Or enter details manually:"}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Calories" type="number" value={currentItem.calories ?? ''} onChange={e => { setCurrentItem(p => ({ ...p, calories: parseInt(e.target.value) || 0 })); setAiAnalyzedItems([]); }} />
            <Input label="Protein (g)" type="number" value={currentItem.protein ?? ''} onChange={e => { setCurrentItem(p => ({ ...p, protein: parseInt(e.target.value) || 0 })); setAiAnalyzedItems([]); }} />
            <Input label="Carbs (g)" type="number" value={currentItem.carbs ?? ''} onChange={e => { setCurrentItem(p => ({ ...p, carbs: parseInt(e.target.value) || 0 })); setAiAnalyzedItems([]); }} />
            <Input label="Fat (g)" type="number" value={currentItem.fat ?? ''} onChange={e => { setCurrentItem(p => ({ ...p, fat: parseInt(e.target.value) || 0 })); setAiAnalyzedItems([]); }} />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddFood}>
              {aiAnalyzedItems.length > 0 ? `Add ${aiAnalyzedItems.length} Items` : 'Add Food'}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Edit Modal & Goals Modal remain largely the same logic, maybe wrapped in AnimatePresence in parent */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Food Item">
        {itemToEdit && (
          <div className="space-y-4">
            <Input
              label="Food Name"
              value={itemToEdit.item.name}
              onChange={e => setItemToEdit(prev => prev ? { ...prev, item: { ...prev.item, name: e.target.value } } : null)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Calories" type="number"
                value={itemToEdit.item.calories}
                onChange={e => setItemToEdit(prev => prev ? { ...prev, item: { ...prev.item, calories: parseInt(e.target.value) || 0 } } : null)}
              />
              <Input
                label="Protein (g)" type="number"
                value={itemToEdit.item.protein}
                onChange={e => setItemToEdit(prev => prev ? { ...prev, item: { ...prev.item, protein: parseInt(e.target.value) || 0 } } : null)}
              />
              <Input
                label="Carbs (g)" type="number"
                value={itemToEdit.item.carbs}
                onChange={e => setItemToEdit(prev => prev ? { ...prev, item: { ...prev.item, carbs: parseInt(e.target.value) || 0 } } : null)}
              />
              <Input
                label="Fat (g)" type="number"
                value={itemToEdit.item.fat}
                onChange={e => setItemToEdit(prev => prev ? { ...prev, item: { ...prev.item, fat: parseInt(e.target.value) || 0 } } : null)}
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateFoodItem}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isGoalsModalOpen} onClose={() => setIsGoalsModalOpen(false)} title="Set Nutrition Goals">
        <div className="space-y-4">
            <Input label="Calories" type="number" value={goals.calories} onChange={e => setGoals(g => ({...g, calories: parseInt(e.target.value) || 0}))} />
            <Input label="Protein (g)" type="number" value={goals.protein} onChange={e => setGoals(g => ({...g, protein: parseInt(e.target.value) || 0}))} />
            <Input label="Carbs (g)" type="number" value={goals.carbs} onChange={e => setGoals(g => ({...g, carbs: parseInt(e.target.value) || 0}))} />
            <Input label="Fat (g)" type="number" value={goals.fat} onChange={e => setGoals(g => ({...g, fat: parseInt(e.target.value) || 0}))} />
            <Input label="Water Goal (ml)" type="number" value={goals.waterGoal} onChange={e => setGoals(g => ({...g, waterGoal: parseInt(e.target.value) || 0}))} />
             <div className="flex justify-end mt-4">
                <Button onClick={() => setIsGoalsModalOpen(false)}>Save Goals</Button>
             </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default NutritionTracker;
