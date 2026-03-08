'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Recipe, Household } from '@/lib/types';

interface RecipesContextValue {
  recipes: Recipe[];
  setRecipes: (recipes: Recipe[]) => void;
  appendRecipe: (recipe: Recipe) => void;
  preferences: string;
  setPreferences: (prefs: string) => void;
  currentHomeId: string | null;
  setCurrentHomeId: (id: string | null) => void;
  homes: Household[];
}

const RecipesContext = createContext<RecipesContextValue | null>(null);

export function RecipesProvider({ children }: { children: ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [preferences, setPreferences] = useState('');
  const [currentHomeId, setCurrentHomeId] = useState<string | null>(null);
  const [homes, setHomes] = useState<Household[]>([]);

  useEffect(() => {
    fetch('/api/homes')
      .then(res => res.json())
      .then(data => {
        if (data.homes) {
          setHomes(data.homes);
        }
        if (data.currentHomeId) {
          setCurrentHomeId(data.currentHomeId);
        } else if (data.homes && data.homes.length > 0) {
          setCurrentHomeId(data.homes[0].id);
        }
      })
      .catch(console.error);

    const handleHouseholdChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ homeId: string }>;
      setCurrentHomeId(customEvent.detail.homeId);
    };

    window.addEventListener('householdChanged', handleHouseholdChanged);
    return () => window.removeEventListener('householdChanged', handleHouseholdChanged);
  }, []);

  function appendRecipe(recipe: Recipe) {
    setRecipes(prev => [...prev, recipe]);
  }

  return (
    <RecipesContext.Provider value={{ recipes, setRecipes, appendRecipe, preferences, setPreferences, currentHomeId, setCurrentHomeId, homes }}>
      {children}
    </RecipesContext.Provider>
  );
}

export function useRecipes() {
  const ctx = useContext(RecipesContext);
  if (!ctx) throw new Error('useRecipes must be used within RecipesProvider');
  return ctx;
}
