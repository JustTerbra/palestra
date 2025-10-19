
export interface ExerciseSet {
  reps: number;
  weight: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: ExerciseSet[];
}

export interface Workout {
  id: string;
  date: string; // ISO string
  exercises: Exercise[];
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

export interface Meal {
  id: string;
  name: MealType;
  items: FoodItem[];
}

export interface DailyLog {
  date: string; // ISO string for YYYY-MM-DD
  meals: Meal[];
  waterIntake?: number; // in ml
}

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterGoal: number; // in ml
}

export type AppView = 'DASHBOARD' | 'EXERCISE' | 'NUTRITION' | 'STREAKS';

export interface User {
    username: string;
    password?: string; // Password is required for creation, but we don't need to pass it around everywhere
}