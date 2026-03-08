'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Recipe } from '@/lib/types';

interface RecipesContextValue {
  recipes: Recipe[];
  setRecipes: (recipes: Recipe[]) => void;
  appendRecipe: (recipe: Recipe) => void;
  preferences: string;
  setPreferences: (prefs: string) => void;
}

const RecipesContext = createContext<RecipesContextValue | null>(null);

export function RecipesProvider({ children }: { children: ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [preferences, setPreferences] = useState('');

  function appendRecipe(recipe: Recipe) {
    setRecipes(prev => [...prev, recipe]);
  }

  return (
    <RecipesContext.Provider value={{ recipes, setRecipes, appendRecipe, preferences, setPreferences }}>
      {children}
    </RecipesContext.Provider>
  );
}

export function useRecipes() {
  const ctx = useContext(RecipesContext);
  if (!ctx) throw new Error('useRecipes must be used within RecipesProvider');
  return ctx;
}
