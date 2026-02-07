'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RecipeCard from '@/components/RecipeCard/RecipeCard';
import { Recipe } from '@/lib/types';
import styles from './page.module.scss';

export default function WeekPlan() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeekPlan();
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

  const handleRemove = async (recipeId: string) => {
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
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Week Plan</h1>
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
              />
            ))}
          </div>
        )}

        {!loading && recipes.length === 0 && (
          <div className={styles.emptyState}>
            <p>No recipes in your week plan yet.</p>
            <Link href="/" className={styles.homeLink}>
              Generate Recipes
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
