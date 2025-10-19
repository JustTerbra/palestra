import React, { useState, useEffect } from 'react';
import { DailyLog, FoodItem, Meal, MealType, NutritionGoals } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import Button from './common/Button';
import Card from './common/Card';
import Modal from './common/Modal';
import Input from './common/Input';
import { PlusIcon, TrashIcon, BarcodeIcon, SparklesIcon, LoaderIcon, EditIcon } from './common/Icons';
import { getNutritionInfo } from '../services/geminiService';
import { motion } from 'framer-motion';
import BarcodeScanner from './BarcodeScanner';

const MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

const NutritionTracker: React.FC = () => {
  const [dailyLogs, setDailyLogs] = useLocalStorage<DailyLog[]>('dailyLogs', []);
  const [goals, setGoals] = useLocalStorage<NutritionGoals>('nutritionGoals', { calories: 2000, protein: 150, carbs: 250, fat: 60, waterGoal: 3000 });
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

  const handleLogWater = (amount: number) => {
    setDailyLogs(prevLogs => {
      const logsCopy = [...prevLogs];
      let logForToday = logsCopy.find(log => log.date === today);
      if (!logForToday) {
        logForToday = { date: today, meals: [], waterIntake: 0 };
        logsCopy.unshift(logForToday);
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
        }
        let meal = logForToday.meals.find(m => m.name === currentMealType);
        if (!meal) {
          meal = { id: Date.now().toString(), name: currentMealType, items: [] };
          logForToday.meals.push(meal);
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
    } catch(error) {
        alert("Failed to analyze nutrition. Please try again.");
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

  const MacroProgress = ({ label, value, goal, colorClass, gradient }: { label: string, value: number, goal: number, colorClass: string, gradient: string }) => {
      const percentage = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
      return (
        <div className="text-center">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path className="text-slate-700/50" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <motion.path className={colorClass}
                        strokeWidth="3"
                        strokeDasharray="100, 100"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        style={{ pathLength: 0, rotate: -90, transformOrigin: 'center' }}
                        animate={{ pathLength: percentage / 100 }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                         />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-bold text-lg sm:text-xl leading-none">{Math.round(value)}</span>
                    <span className="text-xs text-gray-400">g</span>
                </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 mt-2 font-semibold">{label}</p>
            <p className="text-[10px] sm:text-xs text-gray-500">{Math.round(goal)}g goal</p>
        </div>
      )
  };

  return (
    <div>
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold">Nutrition Tracker</h1>
        <Button onClick={() => setIsScannerOpen(true)}>
            <BarcodeIcon className="mr-2 h-5 w-5"/>
            Scan Product
        </Button>
      </div>
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Today's Summary</h2>
          <Button variant="secondary" onClick={() => setIsGoalsModalOpen(true)}>Edit Goals</Button>
        </div>
        <div className="flex flex-col items-center gap-6">
          <div className="text-center">
            <p className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-violet-400 to-purple-400">{Math.round(totals.calories)}</p>
            <p className="text-gray-400">/{goals.calories} kcal</p>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-4 overflow-hidden border border-slate-600/50">
            <motion.div 
              className="bg-gradient-to-r from-violet-500 to-purple-500 h-full rounded-full" 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((totals.calories / goals.calories) * 100, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 w-full pt-4">
            <MacroProgress label="Protein" value={totals.protein} goal={goals.protein} colorClass="stroke-sky-500" gradient="from-sky-500 to-cyan-400"/>
            <MacroProgress label="Carbs" value={totals.carbs} goal={goals.carbs} colorClass="stroke-amber-500" gradient="from-amber-500 to-yellow-400"/>
            <MacroProgress label="Fat" value={totals.fat} goal={goals.fat} colorClass="stroke-rose-500" gradient="from-rose-500 to-red-400"/>
          </div>
        </div>
        
        <div className="mt-8 border-t border-slate-700/50 pt-6">
          <h3 className="text-lg font-semibold text-center mb-3">Water Intake</h3>
          <div className="text-center">
            <p className="text-sky-400 text-3xl font-bold">{todaysWater}</p>
            <p className="text-gray-400">/{goals.waterGoal} ml</p>
          </div>
           <div className="w-full bg-slate-700/50 rounded-full h-4 my-3 overflow-hidden border border-slate-600/50">
            <motion.div 
              className="bg-sky-500 h-full rounded-full" 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((todaysWater / goals.waterGoal) * 100, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-center gap-2 mt-4">
            <Button variant="secondary" className="!py-1.5 !px-3 bg-sky-800/50 hover:bg-sky-700/50" onClick={() => handleLogWater(250)}>+250ml</Button>
            <Button variant="secondary" className="!py-1.5 !px-3 bg-sky-800/50 hover:bg-sky-700/50" onClick={() => handleLogWater(500)}>+500ml</Button>
            <Button variant="secondary" className="!py-1.5 !px-3 bg-sky-800/50 hover:bg-sky-700/50" onClick={() => handleLogWater(750)}>+750ml</Button>
          </div>
        </div>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        {MEAL_TYPES.map(mealType => (
          <Card key={mealType}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">{mealType}</h3>
              <Button variant="secondary" className="h-8 w-8 p-0" onClick={() => openFoodModal(mealType)}><PlusIcon className="mx-auto h-5 w-5" /></Button>
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {(todaysLog?.meals.find(m => m.name === mealType)?.items || []).map(item => (
                <li key={item.id} className="flex justify-between items-center bg-slate-900/40 p-2 sm:p-3 rounded-md">
                    <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.calories}kcal &bull; {item.protein}p &bull; {item.carbs}c &bull; {item.fat}f</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="tertiary" className="p-0 h-7 w-7 !shadow-none" onClick={() => openEditModal(mealType, item)}>
                          <EditIcon className="h-4 w-4 mx-auto" />
                      </Button>
                      <Button variant="danger" className="p-0 h-7 w-7 !shadow-none" onClick={() => handleRemoveFood(mealType, item.id)}>
                        <TrashIcon className="h-4 w-4 mx-auto" />
                      </Button>
                    </div>
                </li>
              ))}
               {(todaysLog?.meals.find(m => m.name === mealType)?.items || []).length === 0 && (
                <p className="text-gray-500 text-center py-4 text-xs">No food logged for this meal.</p>
               )}
            </ul>
          </Card>
        ))}
      </div>
      
      <BarcodeScanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScanned={handleBarcodeScanned} 
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Add to ${currentMealType}`}>
        <div className="space-y-4">
          <Input 
            label="Food Description" 
            placeholder="e.g., '2 eggs and a slice of toast'"
            value={currentItem.name} 
            onChange={e => setCurrentItem(p => ({ ...p, name: e.target.value }))} 
          />
           <Button onClick={handleAiAnalyze} className="w-full" variant="secondary" disabled={isLoadingAi || !currentItem.name}>
             {isLoadingAi ? <LoaderIcon className="h-5 w-5"/> : <><SparklesIcon className="h-5 w-5 mr-2"/>Analyze with Gemini AI</>}
          </Button>
          {aiAnalyzedItems.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-700">
                <h4 className="font-semibold text-gray-300">AI Breakdown:</h4>
                <ul className="space-y-1 text-sm max-h-32 overflow-y-auto p-1">
                    {aiAnalyzedItems.map(item => (
                        <li key={item.id} className="bg-slate-700/50 p-2 rounded-md">
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-xs text-gray-400">{item.calories}kcal &bull; {item.protein}p &bull; {item.carbs}c &bull; {item.fat}f</p>
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
    </div>
  );
};

export default NutritionTracker;