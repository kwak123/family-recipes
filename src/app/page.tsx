'use client';

import { useState, useEffect } from 'react';
import RecipeCard from '@/components/RecipeCard/RecipeCard';
import RecipeModal from '@/components/RecipeModal/RecipeModal';
import DevPurge from '@/components/DevPurge/DevPurge';
import { useRecipes } from '@/context/RecipesContext';
import { Recipe } from '@/lib/types';
import styles from './page.module.scss';

function FunnelIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L13 9.414V15a1 1 0 01-.447.894l-4 2.5A1 1 0 017 17.5v-8.086L3.293 5.707A1 1 0 013 5V3z" clipRule="evenodd" />
    </svg>
  );
}

export default function Home() {
  const { recipes, setRecipes, appendRecipe, preferences, setPreferences } = useRecipes();
  const [mealPlanIds, setMealPlanIds] = useState<string[]>([]);
  const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<string[]>([]);
  const [groceryIngredients, setGroceryIngredients] = useState<string[]>([]);
  const [pendingMealPlanIds, setPendingMealPlanIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  const [useGrocery, setUseGrocery] = useState(false);
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);
  const [loadingIngredients, setLoadingIngredients] = useState(true);

  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [useTags, setUseTags] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [loadingTags, setLoadingTags] = useState(true);

  useEffect(() => {
    fetchMealPlanAndTags();
    fetchFavorites();
    fetchGroceryIngredients();
  }, []);

  const fetchMealPlanAndTags = async () => {
    try {
      const wpResponse = await fetch('/api/meal-plan');
      const wpData = await wpResponse.json();
      const ids = (wpData.recipes || []).map((wr: { recipeId: string }) => wr.recipeId);
      setMealPlanIds(ids);

      if (ids.length > 0) {
        const recipeResponse = await fetch('/api/recipes');
        const recipes: Recipe[] = await recipeResponse.json();
        if (Array.isArray(recipes)) {
          const mealPlanRecipes = recipes.filter((r) => ids.includes(r.id));
          const tags = Array.from(new Set(mealPlanRecipes.flatMap((r) => r.tags))).sort();
          setAvailableTags(tags);
        }
      }
    } catch (error) {
      console.error('Failed to fetch meal plan:', error);
    } finally {
      setLoadingTags(false);
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

  const fetchGroceryIngredients = async () => {
    try {
      const response = await fetch('/api/grocery-list');
      const data = await response.json();
      if (Array.isArray(data)) {
        setGroceryIngredients(data.map((item: { name: string }) => item.name));
      }
    } catch {
      // non-critical — just skip
    } finally {
      setLoadingIngredients(false);
    }
  };


  const toggleIngredient = (item: string) => {
    setSelectedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const stream = async (append: boolean) => {
    if (!append) setRecipes([]);
    setLoading(true);
    try {
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences,
          groceryIngredients: useGrocery && selectedIngredients.size > 0 ? Array.from(selectedIngredients) : undefined,
          selectedTags: useTags && selectedTags.size > 0 ? Array.from(selectedTags) : undefined,
        })
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
      const response = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId })
      });
      const data = await response.json();
      const ids = (data.recipes || []).map((wr: { recipeId: string }) => wr.recipeId);
      setMealPlanIds(ids);
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

        <div className={styles.filtersRow}>
          {loadingIngredients ? (
            <div className={styles.filterChipLoading}>
              <span className={styles.filterSpinner} />
              Ingredients
            </div>
          ) : groceryIngredients.length > 0 && (
            <div className={styles.filterChip}>
              {selectedIngredients.size > 0 && (
                <label className={styles.filterCheckboxLabel}>
                  <input
                    type="checkbox"
                    checked={useGrocery}
                    onChange={(e) => setUseGrocery(e.target.checked)}
                  />
                  Use {selectedIngredients.size} ingredient{selectedIngredients.size !== 1 ? 's' : ''}
                </label>
              )}
              <button
                className={`${styles.funnelButton} ${selectedIngredients.size === 0 ? styles.funnelButtonWithLabel : ''}`}
                onClick={() => setShowIngredientsModal(true)}
                aria-label="Select ingredients"
              >
                <FunnelIcon />
                {selectedIngredients.size === 0 && <span>Filter by ingredients</span>}
              </button>
            </div>
          )}

          {loadingTags ? (
            <div className={styles.filterChipLoading}>
              <span className={styles.filterSpinner} />
              Tags
            </div>
          ) : availableTags.length > 0 && (
            <div className={styles.filterChip}>
              {selectedTags.size > 0 && (
                <label className={styles.filterCheckboxLabel}>
                  <input
                    type="checkbox"
                    checked={useTags}
                    onChange={(e) => setUseTags(e.target.checked)}
                  />
                  Use {selectedTags.size} tag{selectedTags.size !== 1 ? 's' : ''}
                </label>
              )}
              <button
                className={`${styles.funnelButton} ${selectedTags.size === 0 ? styles.funnelButtonWithLabel : ''}`}
                onClick={() => setShowTagsModal(true)}
                aria-label="Select tags"
              >
                <FunnelIcon />
                {selectedTags.size === 0 && <span>Filter by tags</span>}
              </button>
            </div>
          )}
        </div>

        {showIngredientsModal && (
          <div className={styles.modalOverlay} onClick={() => setShowIngredientsModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Filter by Ingredients</h3>
                <button className={styles.modalClose} onClick={() => setShowIngredientsModal(false)}>✕</button>
              </div>
              <div className={styles.tagGrid}>
                {groceryIngredients.map((item) => (
                  <button
                    key={item}
                    className={`${styles.tagChip} ${selectedIngredients.has(item) ? styles.tagChipSelected : ''}`}
                    onClick={() => toggleIngredient(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              {selectedIngredients.size > 0 && (
                <button className={styles.clearTags} onClick={() => setSelectedIngredients(new Set())}>
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}

        {showTagsModal && (
          <div className={styles.modalOverlay} onClick={() => setShowTagsModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Filter by Tags</h3>
                <button className={styles.modalClose} onClick={() => setShowTagsModal(false)}>✕</button>
              </div>
              <div className={styles.tagGrid}>
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    className={`${styles.tagChip} ${selectedTags.has(tag) ? styles.tagChipSelected : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {selectedTags.size > 0 && (
                <button className={styles.clearTags} onClick={() => setSelectedTags(new Set())}>
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}

        {showGrid && (
          <div className={styles.recipesGrid}>
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onAction={handleAddToMealPlan}
                actionLabel="Add to Meal Plan"
                actionStyle="primary"
                isInPlan={mealPlanIds.includes(recipe.id)}
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
