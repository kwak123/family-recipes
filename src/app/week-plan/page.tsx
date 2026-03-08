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
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [simplifiedRecipes, setSimplifiedRecipes] = useState<Recipe[]>([]);
  const [showSimplifyModal, setShowSimplifyModal] = useState(false);

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

  const handleSimplify = async () => {
    if (!recipes.length) return;
    setIsSimplifying(true);
    try {
      const response = await fetch('/api/week-plan/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipes })
      });
      const data = await response.json();
      setSimplifiedRecipes(data.recipes || []);
      setShowSimplifyModal(true);
    } catch (error) {
      console.error('Failed to simplify:', error);
    } finally {
      setIsSimplifying(false);
    }
  };

  const handleCommitSimplified = async () => {
    if (!simplifiedRecipes.length) return;
    setIsCommitting(true);
    try {
      const response = await fetch('/api/week-plan/simplify', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipes: simplifiedRecipes })
      });
      if (!response.ok) throw new Error('Failed to commit');
      const data = await response.json();
      setRecipes(data.recipes || simplifiedRecipes);
      setShowSimplifyModal(false);
      setSimplifiedRecipes([]);
    } catch (error) {
      console.error('Failed to commit simplified:', error);
    } finally {
      setIsCommitting(false);
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
            <div className={styles.headerActions}>
              <button
                className={styles.simplifyButton}
                onClick={handleSimplify}
                disabled={isSimplifying}
              >
                {isSimplifying ? 'Simplifying...' : 'Preview Simplified'}
              </button>
              <Link href="/grocery-list" className={styles.groceryLink}>
                View Grocery List →
              </Link>
            </div>
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

      {showSimplifyModal && (
        <div className={styles.simplifyBackdrop} onClick={() => setShowSimplifyModal(false)}>
          <div className={styles.simplifyModal} onClick={e => e.stopPropagation()}>
            <div className={styles.simplifyModalHeader}>
              <div>
                <h2>Simplified Meal Plan Preview</h2>
                <p className={styles.simplifyModalSubtitle}>
                  Remixed to reduce unique ingredients — no changes made yet.
                </p>
              </div>
              <button className={styles.simplifyCloseButton} onClick={() => setShowSimplifyModal(false)}>✕</button>
            </div>
            <div className={styles.simplifyGrid}>
              {simplifiedRecipes.map((recipe, i) => {
                const original = recipes.find(r => r.id === recipe.id) || recipes[i];
                const saved = original ? original.ingredients.length - recipe.ingredients.length : 0;
                return (
                  <div key={recipe.id} className={styles.simplifyCard}>
                    <div className={styles.simplifyCardHeader}>
                      <h3>{recipe.name}</h3>
                      {saved > 0 && (
                        <span className={styles.simplifyBadge}>−{saved} ingredient{saved !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <p className={styles.simplifyDescription}>{recipe.description}</p>
                    <ul className={styles.simplifyIngredients}>
                      {recipe.ingredients.map((ing, j) => (
                        <li key={j}>{ing.quantity} {ing.unit} {ing.name}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            <div className={styles.simplifyModalFooter}>
              <p className={styles.simplifyFooterNote}>
                Committing will update your recipes and regenerate the grocery list.
              </p>
              <div className={styles.simplifyFooterActions}>
                <button className={styles.simplifyDismissButton} onClick={() => setShowSimplifyModal(false)}>
                  Dismiss
                </button>
                <button
                  className={styles.simplifyCommitButton}
                  onClick={handleCommitSimplified}
                  disabled={isCommitting}
                >
                  {isCommitting ? 'Applying...' : 'Commit to Meal Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
