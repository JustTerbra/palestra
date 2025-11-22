
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Workout, Exercise, ExerciseSet } from '../types';
import { useUserData } from '../hooks/useUserData';
import Button from './common/Button';
import Card from './common/Card';
import Modal from './common/Modal';
import Input from './common/Input';
import { PlusIcon, TrashIcon, XIcon, SparklesIcon, LoaderIcon, EditIcon, ChevronDownIcon, TrendingUpIcon, DumbbellIcon, MinusIcon } from './common/Icons';
import { generateWorkoutSuggestion } from '../services/geminiService';

const calculateTotalVolume = (workout: Workout) => {
  return workout.exercises.reduce((total, ex) => {
    const exerciseTotal = ex.sets.reduce((exTotal, set) => exTotal + (set.reps * set.weight), 0);
    return total + exerciseTotal;
  }, 0);
};

interface ExerciseTrackerProps {
    userId: string | undefined;
}

const StepperInput: React.FC<{ 
  value: number; 
  onChange: (val: number) => void; 
  step?: number; 
  min?: number;
  placeholder?: string;
}> = ({ value, onChange, step = 1, min = 0, placeholder }) => {
  const handleIncrement = () => onChange(Number((value + step).toFixed(2)));
  const handleDecrement = () => onChange(Math.max(min, Number((value - step).toFixed(2))));
  
  return (
    <div className="flex items-center h-9 bg-slate-900/50 rounded-lg border border-slate-700/50 overflow-hidden focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/50 transition-all shadow-sm group hover:border-slate-600">
      <button 
        type="button"
        onClick={handleDecrement}
        className="w-8 h-full flex items-center justify-center bg-slate-800/40 text-gray-400 hover:text-white hover:bg-slate-700 transition-colors active:bg-slate-600 border-r border-slate-700/30"
        tabIndex={-1}
      >
        <MinusIcon className="h-3 w-3" />
      </button>
      <input 
        type="number" 
        value={value === 0 ? '' : value} 
        placeholder={placeholder || '0'}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full h-full bg-transparent text-center text-sm font-medium text-gray-100 focus:outline-none appearance-none px-1 placeholder:text-gray-600"
        step={step}
      />
      <button 
        type="button"
        onClick={handleIncrement}
        className="w-8 h-full flex items-center justify-center bg-slate-800/40 text-gray-400 hover:text-white hover:bg-slate-700 transition-colors active:bg-slate-600 border-l border-slate-700/30"
        tabIndex={-1}
      >
        <PlusIcon className="h-3 w-3" />
      </button>
    </div>
  );
};

const ExerciseTracker: React.FC<ExerciseTrackerProps> = ({ userId }) => {
  const [workouts, setWorkouts, loading] = useUserData<Workout[]>('workouts', [], userId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

  const openNewWorkoutModal = () => {
    setCurrentWorkout({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      exercises: [],
    });
    setAiPrompt('');
    setIsModalOpen(true);
  };

  const openEditWorkoutModal = (workout: Workout) => {
    setCurrentWorkout(JSON.parse(JSON.stringify(workout)));
    setAiPrompt('');
    setIsModalOpen(true);
  };
  
  const handleDeleteWorkout = (workoutId: string) => {
    if (window.confirm("Are you sure you want to delete this workout? This action cannot be undone.")) {
      setWorkouts(prev => prev.filter(w => w.id !== workoutId));
    }
  };

  const handleSaveWorkout = () => {
    if (currentWorkout && currentWorkout.exercises.length > 0) {
      const existingIndex = workouts.findIndex(w => w.id === currentWorkout.id);
      if (existingIndex > -1) {
        const updatedWorkouts = [...workouts];
        updatedWorkouts[existingIndex] = currentWorkout;
        setWorkouts(updatedWorkouts);
      } else {
        setWorkouts(prev => [...prev, currentWorkout].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    }
    setIsModalOpen(false);
    setCurrentWorkout(null);
  };

  const addExercise = () => {
    setCurrentWorkout(prev => prev ? {
      ...prev,
      exercises: [...prev.exercises, { id: Date.now().toString(), name: '', sets: [{ reps: 8, weight: 20 }] }]
    } : null);
  };

  const updateExercise = (exIndex: number, field: 'name', value: string) => {
    setCurrentWorkout(prev => {
      if (!prev) return null;
      const newExercises = [...prev.exercises];
      newExercises[exIndex] = { ...newExercises[exIndex], [field]: value };
      return { ...prev, exercises: newExercises };
    });
  };

  const removeExercise = (exIndex: number) => {
    setCurrentWorkout(prev => prev ? {
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== exIndex)
    } : null);
  };

  const addSet = (exIndex: number) => {
    setCurrentWorkout(prev => {
      if (!prev) return null;
      const newExercises = [...prev.exercises];
      const lastSet = newExercises[exIndex].sets[newExercises[exIndex].sets.length-1] || {reps: 0, weight: 0};
      newExercises[exIndex].sets.push({ ...lastSet });
      return { ...prev, exercises: newExercises };
    });
  };

  const updateSet = (exIndex: number, setIndex: number, field: 'reps' | 'weight', value: number) => {
    setCurrentWorkout(prev => {
      if (!prev) return null;
      const newExercises = [...prev.exercises];
      newExercises[exIndex].sets[setIndex] = { ...newExercises[exIndex].sets[setIndex], [field]: value };
      return { ...prev, exercises: newExercises };
    });
  };

  const removeSet = (exIndex: number, setIndex: number) => {
     setCurrentWorkout(prev => {
        if (!prev || prev.exercises[exIndex].sets.length <= 1) return prev;
        const newExercises = [...prev.exercises];
        newExercises[exIndex].sets = newExercises[exIndex].sets.filter((_, i) => i !== setIndex);
        return { ...prev, exercises: newExercises };
    });
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setIsLoadingAi(true);
    try {
        const suggestions = await generateWorkoutSuggestion(aiPrompt);
        const newExercises: Exercise[] = suggestions.map((s: any) => ({
            id: Date.now().toString() + s.name,
            name: s.name,
            sets: Array(s.sets || 3).fill(null).map(() => ({ reps: parseInt(s.reps.split('-')[0]) || 8, weight: 0 }))
        }));
        setCurrentWorkout(prev => prev ? {...prev, exercises: [...prev.exercises, ...newExercises]} : null);
    } catch (error: any) {
        console.error("AI generation error:", error);
        alert(`Failed to generate workout: ${error?.message || 'Unknown error'}`);
    } finally {
        setIsLoadingAi(false);
    }
  }

  const modalFooter = (
    <>
      <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
      <Button onClick={handleSaveWorkout} disabled={!currentWorkout || currentWorkout.exercises.length === 0}>Save Workout</Button>
    </>
  );

  if (loading) return <div className="flex justify-center py-20"><LoaderIcon className="h-10 w-10 text-violet-500" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">Exercise Log</h1>
            <p className="text-gray-400 text-sm mt-1">Track your strength journey</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={openNewWorkoutModal} className="shadow-lg shadow-violet-500/30 bg-gradient-to-r from-violet-600 to-purple-600 border border-violet-400/20">
            <PlusIcon className="inline-block mr-2 h-5 w-5" />
            Log Workout
            </Button>
        </motion.div>
      </div>
      
      <div className="relative space-y-8 pl-4 sm:pl-6">
        {/* Timeline Line */}
        {workouts.length > 0 && (
            <div className="absolute left-4 sm:left-6 top-4 bottom-0 w-0.5 bg-gradient-to-b from-violet-500/50 via-slate-700/30 to-transparent -ml-[1px]" />
        )}

        {workouts.length > 0 ? workouts.map((workout, idx) => (
          <motion.div 
            key={workout.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative"
          >
            {/* Timeline Dot */}
            <div className="absolute left-[-20px] sm:left-[-28px] top-6 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-black border-2 border-violet-500 z-10 shadow-[0_0_10px_rgba(139,92,246,0.5)]" />

            <Card className={`transition-all duration-300 ${expandedWorkoutId === workout.id ? 'bg-slate-800/80 ring-1 ring-violet-500/50' : 'hover:bg-slate-800/60'}`}>
              <div className="flex justify-between items-start cursor-pointer" onClick={() => setExpandedWorkoutId(prev => prev === workout.id ? null : workout.id)}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                     <h2 className="text-lg sm:text-xl font-bold text-white">{new Date(workout.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</h2>
                     {idx === 0 && <span className="text-[10px] font-bold bg-violet-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Latest</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-400">
                    <span className="flex items-center gap-1.5"><DumbbellIcon className="h-4 w-4 text-violet-400"/> {workout.exercises.length} exercises</span>
                    <span className="flex items-center gap-1.5"><TrendingUpIcon className="h-4 w-4 text-emerald-400"/> Vol: {calculateTotalVolume(workout).toLocaleString()} kg</span>
                  </div>
                </div>
                <motion.div 
                    animate={{ rotate: expandedWorkoutId === workout.id ? 180 : 0 }}
                    className="p-1 rounded-full bg-white/5"
                >
                  <ChevronDownIcon className="h-5 w-5 text-gray-400"/>
                </motion.div>
              </div>

              <AnimatePresence>
                {expandedWorkoutId === workout.id && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                >
                    <div className="pt-6 mt-2 border-t border-slate-700/50">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {workout.exercises.map(ex => (
                        <div key={ex.id} className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/30">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-violet-200 text-sm">{ex.name}</span>
                                <span className="text-xs text-gray-500 bg-black/30 px-1.5 py-0.5 rounded">{ex.sets.length} sets</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {ex.sets.map((s, i) => (
                                    <div key={i} className="text-xs bg-slate-800/80 text-gray-300 px-2 py-1 rounded-md border border-slate-700">
                                        <span className="font-mono text-white">{s.weight}</span>kg x <span className="font-mono text-white">{s.reps}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        ))}
                    </div>
                    <div className="flex gap-3 mt-6 justify-end">
                        <Button variant="secondary" onClick={(e) => { e.stopPropagation(); openEditWorkoutModal(workout); }} className="text-sm py-1.5"><EditIcon className="h-4 w-4 mr-2"/> Edit Workout</Button>
                        <Button variant="danger" onClick={(e) => { e.stopPropagation(); handleDeleteWorkout(workout.id); }} className="text-sm py-1.5"><TrashIcon className="h-4 w-4 mr-2"/> Delete</Button>
                    </div>
                    </div>
                </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        )) : (
          <Card>
            <div className="text-center py-16">
              <div className="bg-slate-800/50 p-4 rounded-full inline-block mb-4">
                 <DumbbellIcon className="h-12 w-12 text-gray-500"/>
              </div>
              <h3 className="text-xl font-semibold text-white">No Workouts Logged</h3>
              <p className="mt-2 text-gray-400 max-w-xs mx-auto">Every journey begins with a single lift. Log your first workout today!</p>
              <Button onClick={openNewWorkoutModal} className="mt-6">Start Logging</Button>
            </div>
          </Card>
        )}
      </div>

      {currentWorkout && (
        <Modal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            title={workouts.some(w => w.id === currentWorkout.id) ? "Edit Workout" : "Log a New Workout"} 
            size="lg"
            footer={modalFooter}
        >
          <div className="flex flex-col gap-4 max-h-[85vh]">
            <div className="bg-slate-800/30 p-4 rounded-xl border border-violet-500/20">
                <h3 className="font-semibold mb-3 text-violet-300 flex items-center gap-2 text-sm uppercase tracking-wide"><SparklesIcon className="h-4 w-4"/> AI Workout Builder</h3>
                <div className="flex gap-2">
                    <Input 
                      placeholder="e.g., 'High volume chest day'" 
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      disabled={isLoadingAi}
                      className="!bg-slate-900"
                    />
                    <Button onClick={handleAiGenerate} disabled={isLoadingAi || !aiPrompt} className="w-28 shrink-0">
                      {isLoadingAi ? <LoaderIcon className="h-5 w-5"/> : 'Generate'}
                    </Button>
                </div>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1 flex-1 custom-scrollbar">
              {currentWorkout.exercises.map((ex, exIndex) => (
                <div key={ex.id} className="p-4 bg-slate-900/40 rounded-xl border border-slate-700/50 group hover:border-slate-600 transition-colors">
                  <div className="flex justify-between items-center mb-4">
                    <Input 
                      placeholder="Exercise Name" 
                      value={ex.name} 
                      onChange={(e) => updateExercise(exIndex, 'name', e.target.value)} 
                      className="font-bold text-lg bg-transparent border-0 border-b border-transparent focus:border-violet-500 focus:ring-0 p-0 px-1 !shadow-none rounded-none placeholder:text-gray-600"
                    />
                    <Button variant="tertiary" onClick={() => removeExercise(exIndex)} className="p-1.5 h-8 w-8 hover:bg-red-500/10 hover:text-red-400"><TrashIcon className="h-5 w-5"/></Button>
                  </div>
                  
                  <div className="space-y-2">
                     {/* Header */}
                    <div className="grid grid-cols-[24px_1fr_1fr_32px] gap-3 px-2 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <span className="text-center">#</span>
                        <span>Reps</span>
                        <span>Weight (kg)</span>
                        <span></span>
                    </div>
                    
                    {ex.sets.map((set, setIndex) => (
                      <div key={setIndex} className="grid grid-cols-[24px_1fr_1fr_32px] items-center gap-3 bg-slate-800/30 p-1.5 rounded-lg border border-transparent hover:border-slate-700 transition-colors">
                        <span className="text-gray-500 text-xs text-center font-mono">{setIndex + 1}</span>
                        <StepperInput 
                            value={set.reps} 
                            onChange={val => updateSet(exIndex, setIndex, 'reps', val)}
                            step={1}
                            placeholder="0"
                        />
                        <StepperInput 
                            value={set.weight} 
                            onChange={val => updateSet(exIndex, setIndex, 'weight', val)} 
                            step={2.5}
                            placeholder="0"
                        />
                        <button onClick={() => removeSet(exIndex, setIndex)} className="text-gray-500 hover:text-red-400 flex justify-center items-center h-8 w-8 rounded-full hover:bg-slate-800" disabled={ex.sets.length <= 1}>
                            <XIcon className="h-4 w-4"/>
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button variant="secondary" onClick={() => addSet(exIndex)} className="mt-4 w-full text-xs py-1.5 border-slate-700 bg-slate-800/50 hover:bg-slate-700">Add Set</Button>
                </div>
              ))}
              
              <Button onClick={addExercise} className="w-full py-3 border-2 border-dashed border-slate-700 bg-transparent hover:bg-slate-800 text-gray-400 hover:text-white" variant="tertiary">
                <PlusIcon className="inline-block h-5 w-5 mr-1" /> Add Exercise
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ExerciseTracker;