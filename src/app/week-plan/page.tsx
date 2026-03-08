'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RecipeCard from '@/components/RecipeCard/RecipeCard';
import RecipeModal from '@/components/RecipeModal/RecipeModal';
import { Recipe } from '@/lib/types';
import styles from './page.module.scss';

export default function WeekPlan() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingRemoveIds, setPendingRemoveIds] = useState<Set<string>>(new Set());
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    fetchWeekPlan();
    fetchFavorites();
  }, []);

  const fetchWeekPlan = async () => {
    try {
      const response = await fetch('/api/week-plan');
      const data = await response.json();
      // Extract recipe objects from the new structure
      const recipeList = (data.recipes || []).map((wr: any) => wr.recipe).filter(Boolean);
      setRecipes(recipeList);
    } catch (error) {
      console.error('Failed to fetch week plan:', error);
    } finally {
      setLoading(false);
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

  const handleRemove = async (recipeId: string) => {
    setPendingRemoveIds(prev => new Set(prev).add(recipeId));
    try {
      const response = await fetch('/api/week-plan', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId })
      });
      const data = await response.json();
      // Extract recipe objects from the new structure
      const recipeList = (data.recipes || []).map((wr: any) => wr.recipe).filter(Boolean);
      setRecipes(recipeList);
    } catch (error) {
      console.error('Failed to remove recipe:', error);
    } finally {
      setPendingRemoveIds(prev => { const next = new Set(prev); next.delete(recipeId); return next; });
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

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Meal Plan</h1>
          {recipes.length > 0 && (
            <Link href="/grocery-list" className={styles.groceryLink}>
              View Grocery List →
            </Link>
          )}
        </div>

        {loading && <p className={styles.loading}>Loading...</p>}

        {!loading && recipes.length > 0 && (
          <div className={styles.recipesGrid}>
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onAction={handleRemove}
                actionLabel="Remove"
                actionStyle="danger"
                actionPending={pendingRemoveIds.has(recipe.id)}
                isFavorited={favoriteRecipeIds.includes(recipe.id)}
                onFavoriteToggle={handleToggleFavorite}
                onViewRecipe={setSelectedRecipe}
              />
            ))}
          </div>
        )}

        {!loading && recipes.length === 0 && (
          <div className={styles.emptyState}>
            <p>No recipes in your meal plan yet.</p>
            <Link href="/" className={styles.homeLink}>
              Generate Recipes
            </Link>
          </div>
        )}
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
