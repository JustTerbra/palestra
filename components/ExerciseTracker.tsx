import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Workout, Exercise, ExerciseSet } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import Button from './common/Button';
import Card from './common/Card';
import Modal from './common/Modal';
import Input from './common/Input';
// FIX: DumbbellIcon was not imported, causing a 'Cannot find name' error.
import { PlusIcon, TrashIcon, XIcon, SparklesIcon, LoaderIcon, EditIcon, ChevronDownIcon, TrendingUpIcon, DumbbellIcon } from './common/Icons';
import { generateWorkoutSuggestion } from '../services/geminiService';

const calculateTotalVolume = (workout: Workout) => {
  return workout.exercises.reduce((total, ex) => {
    const exerciseTotal = ex.sets.reduce((exTotal, set) => exTotal + (set.reps * set.weight), 0);
    return total + exerciseTotal;
  }, 0);
};

const ExerciseTracker: React.FC = () => {
  const [workouts, setWorkouts] = useLocalStorage<Workout[]>('workouts', []);
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
    setCurrentWorkout(JSON.parse(JSON.stringify(workout))); // Deep copy to avoid direct mutation
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
        // Sort by date descending
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
    } catch (error) {
        alert("Failed to generate workout. Please try again.");
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold">Exercise Log</h1>
        <Button onClick={openNewWorkoutModal}>
          <PlusIcon className="inline-block mr-2 h-5 w-5" />
          Log Workout
        </Button>
      </div>
      
      <div className="space-y-4">
        {workouts.length > 0 ? workouts.map(workout => (
          <Card key={workout.id}>
            <div className="flex justify-between items-start cursor-pointer" onClick={() => setExpandedWorkoutId(prev => prev === workout.id ? null : workout.id)}>
              <div>
                <h2 className="text-xl font-semibold text-violet-400">{new Date(workout.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
                  <span>{workout.exercises.length} exercises</span>
                  <span className="flex items-center gap-1"><TrendingUpIcon className="h-4 w-4 text-gray-500"/> Volume: {calculateTotalVolume(workout)} kg</span>
                </div>
              </div>
              <motion.div animate={{ rotate: expandedWorkoutId === workout.id ? 180 : 0 }}>
                <ChevronDownIcon className="h-6 w-6 text-gray-400"/>
              </motion.div>
            </div>
            <AnimatePresence>
            {expandedWorkoutId === workout.id && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="border-t border-slate-700/50"
              >
                <div className="pt-4">
                  <ul className="space-y-2">
                    {workout.exercises.map(ex => (
                      <li key={ex.id} className="text-gray-300 text-sm sm:text-base">
                        <span className="font-bold">{ex.name}:</span>
                        <span className="text-gray-400 ml-2">{ex.sets.map(s => `${s.reps}x${s.weight}kg`).join(', ')}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2 mt-4">
                    <Button variant="secondary" onClick={(e) => { e.stopPropagation(); openEditWorkoutModal(workout); }} className="!text-sm !py-1 !px-3"><EditIcon className="h-4 w-4 mr-1"/> Edit</Button>
                    <Button variant="danger" onClick={(e) => { e.stopPropagation(); handleDeleteWorkout(workout.id); }} className="!text-sm !py-1 !px-3"><TrashIcon className="h-4 w-4 mr-1"/> Delete</Button>
                  </div>
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </Card>
        )) : (
          <Card>
            <div className="text-center py-12">
              <DumbbellIcon className="mx-auto h-12 w-12 text-gray-600"/>
              <h3 className="mt-4 text-xl font-semibold">No Workouts Logged</h3>
              <p className="mt-1 text-gray-400">Time to get active! Log your first workout to see it here.</p>
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
            <Card className="bg-slate-800/50 flex-shrink-0">
                <h3 className="font-semibold mb-2 text-violet-300 flex items-center gap-2"><SparklesIcon className="h-5 w-5"/>Get AI Suggestions</h3>
                <div className="flex gap-2">
                    <Input 
                      placeholder="e.g., 'A quick chest and triceps workout'" 
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      disabled={isLoadingAi}
                    />
                    <Button onClick={handleAiGenerate} disabled={isLoadingAi || !aiPrompt} className="w-32">
                      {isLoadingAi ? <LoaderIcon className="h-5 w-5"/> : 'Generate'}
                    </Button>
                </div>
            </Card>

            <div className="space-y-3 overflow-y-auto pr-2 flex-1">
              {currentWorkout.exercises.map((ex, exIndex) => (
                <Card key={ex.id} className="!p-3 bg-slate-900/40" disableHoverEffect>
                  <div className="flex justify-between items-center mb-3">
                    <Input 
                      placeholder="Exercise Name" 
                      value={ex.name} 
                      onChange={(e) => updateExercise(exIndex, 'name', e.target.value)} 
                      className="font-bold text-lg bg-transparent border-0 focus:ring-0 p-0 !shadow-none"
                    />
                    <Button variant="tertiary" onClick={() => removeExercise(exIndex)} className="p-1 h-8 w-8 !shadow-none text-gray-400 hover:text-red-400 hover:bg-red-500/10"><TrashIcon className="h-5 w-5"/></Button>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_1fr_40px] sm:grid-cols-[auto_1fr_1fr_40px] items-center gap-2 text-xs text-gray-400 px-2">
                        <span className="hidden sm:inline-block font-semibold w-6 text-center">Set</span>
                        <span className="font-semibold">Reps</span>
                        <span className="font-semibold">Weight (kg)</span>
                        <span></span>
                    </div>
                    {ex.sets.map((set, setIndex) => (
                      <div key={setIndex} className="grid grid-cols-[1fr_1fr_40px] sm:grid-cols-[auto_1fr_1fr_40px] items-center gap-2 bg-slate-800/30 p-2 rounded-lg">
                        <span className="font-bold text-gray-400 w-6 text-center text-sm hidden sm:inline-block">{setIndex + 1}</span>
                        <Input type="number" placeholder="Reps" value={set.reps} onChange={e => updateSet(exIndex, setIndex, 'reps', parseInt(e.target.value) || 0)} className="py-1.5 px-2" />
                        <Input type="number" placeholder="Weight" value={set.weight} onChange={e => updateSet(exIndex, setIndex, 'weight', parseInt(e.target.value) || 0)} className="py-1.5 px-2" />
                        <button onClick={() => removeSet(exIndex, setIndex)} className="text-gray-500 hover:text-red-400 disabled:opacity-50 disabled:hover:text-gray-500 p-1.5 rounded-full hover:bg-slate-700 transition-colors flex justify-center items-center h-8 w-8" disabled={ex.sets.length <= 1}>
                            <XIcon className="h-5 w-5"/>
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button variant="secondary" onClick={() => addSet(exIndex)} className="mt-3 text-sm py-1 px-3">Add Set</Button>
                </Card>
              ))}
              <Button onClick={addExercise} className="w-full" variant="secondary">
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