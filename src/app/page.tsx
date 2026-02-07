'use client';

import { useState, useEffect } from 'react';
import RecipeCard from '@/components/RecipeCard/RecipeCard';
import { Recipe } from '@/lib/types';
import styles from './page.module.scss';

export default function Home() {
  const [preferences, setPreferences] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [weekPlanIds, setWeekPlanIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch current week plan on mount
  useEffect(() => {
    fetchWeekPlan();
  }, []);

  const fetchWeekPlan = async () => {
    try {
      const response = await fetch('/api/week-plan');
      const data = await response.json();
      setWeekPlanIds(data.recipeIds || []);
    } catch (error) {
      console.error('Failed to fetch week plan:', error);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
      });
      const data = await response.json();
      setRecipes(data);
    } catch (error) {
      console.error('Failed to generate recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWeekPlan = async (recipeId: string) => {
    try {
      const response = await fetch('/api/week-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId })
      });
      const data = await response.json();
      setWeekPlanIds(data.recipeIds || []);
    } catch (error) {
      console.error('Failed to add recipe:', error);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1>Generate Weekly Recipes</h1>

        <div className={styles.inputSection}>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g. vegetarian, quick meals, Italian"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
          />
          <button
            className={styles.generateButton}
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Recipes'}
          </button>
        </div>

        {recipes.length > 0 && (
          <div className={styles.recipesGrid}>
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onAction={handleAddToWeekPlan}
                actionLabel="Add to Week Plan"
                actionStyle="primary"
                isInPlan={weekPlanIds.includes(recipe.id)}
              />
            ))}
          </div>
        )}

        {recipes.length === 0 && !loading && (
          <p className={styles.emptyState}>
            Enter your preferences and click Generate to see recipe suggestions.
          </p>
        )}
      </div>
    </main>
  );
}
