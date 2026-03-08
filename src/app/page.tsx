'use client';

import { useState, useEffect } from 'react';
import RecipeCard from '@/components/RecipeCard/RecipeCard';
import RecipeModal from '@/components/RecipeModal/RecipeModal';
import DevPurge from '@/components/DevPurge/DevPurge';
import { useRecipes } from '@/context/RecipesContext';
import { Recipe } from '@/lib/types';
import styles from './page.module.scss';

export default function Home() {
  const { recipes, setRecipes, appendRecipe, preferences, setPreferences } = useRecipes();
  const [weekPlanIds, setWeekPlanIds] = useState<string[]>([]);
  const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<string[]>([]);
  const [pendingMealPlanIds, setPendingMealPlanIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    fetchWeekPlan();
    fetchFavorites();
  }, []);

  const fetchWeekPlan = async () => {
    try {
      const response = await fetch('/api/week-plan');
      const data = await response.json();
      const ids = (data.recipes || []).map((wr: { recipeId: string }) => wr.recipeId);
      setWeekPlanIds(ids);
    } catch (error) {
      console.error('Failed to fetch week plan:', error);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites/recipes');
      const data = await response.json();
      setFavoriteRecipeIds(data.favoriteRecipeIds || []);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
  };

  const stream = async (append: boolean) => {
    if (!append) setRecipes([]);
    setLoading(true);
    try {
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to generate recipes');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const data = JSON.parse(trimmed);
            if (data.error) {
              console.error('Stream error:', data.error);
            } else {
              appendRecipe(data);
            }
          } catch {
            // incomplete line
          }
        }
      }
    } catch (error) {
      console.error('Failed to generate recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToMealPlan = async (recipeId: string) => {
    setPendingMealPlanIds(prev => new Set(prev).add(recipeId));
    try {
      const response = await fetch('/api/week-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId })
      });
      const data = await response.json();
      const ids = (data.recipes || []).map((wr: { recipeId: string }) => wr.recipeId);
      setWeekPlanIds(ids);
    } catch (error) {
      console.error('Failed to add recipe:', error);
    } finally {
      setPendingMealPlanIds(prev => { const next = new Set(prev); next.delete(recipeId); return next; });
    }
  };

  const handleToggleFavorite = async (recipeId: string) => {
    const isFavorited = favoriteRecipeIds.includes(recipeId);
    try {
      const response = await fetch('/api/favorites/recipes', {
        method: isFavorited ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId })
      });
      const data = await response.json();
      setFavoriteRecipeIds(data.favoriteRecipeIds || []);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const showGrid = recipes.length > 0 || loading;

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1>Generate Recipes</h1>

        <div className={styles.inputSection}>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g. vegetarian, quick meals, Italian"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading) stream(false);
            }}
          />
          <button
            className={styles.generateButton}
            onClick={() => stream(false)}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Recipes'}
          </button>
        </div>

        {showGrid && (
          <div className={styles.recipesGrid}>
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onAction={handleAddToMealPlan}
                actionLabel="Add to Meal Plan"
                actionStyle="primary"
                isInPlan={weekPlanIds.includes(recipe.id)}
                actionPending={pendingMealPlanIds.has(recipe.id)}
                isFavorited={favoriteRecipeIds.includes(recipe.id)}
                onFavoriteToggle={handleToggleFavorite}
                onViewRecipe={setSelectedRecipe}
              />
            ))}
            {loading && <div className={styles.skeletonCard} aria-hidden />}
          </div>
        )}

        {!showGrid && (
          <p className={styles.emptyState}>
            Enter your preferences and click Generate to see recipe suggestions.
          </p>
        )}

        {recipes.length > 0 && !loading && (
          <div className={styles.loadMoreSection}>
            <button
              className={styles.loadMoreButton}
              onClick={() => stream(true)}
            >
              Load More
            </button>
          </div>
        )}

        {process.env.NODE_ENV === 'development' && <DevPurge />}
      </div>

      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </main>
  );
}
