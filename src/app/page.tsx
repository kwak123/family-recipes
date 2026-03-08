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

  const [favoriteIngredientNames, setFavoriteIngredientNames] = useState<string[]>([]);

  const [excludeIngredients, setExcludeIngredients] = useState<string[]>([]);
  const [showExcludeModal, setShowExcludeModal] = useState(false);
  const [excludeInput, setExcludeInput] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('family-recipes-excluded-ingredients');
    if (saved) {
      try { setExcludeIngredients(JSON.parse(saved)); } catch {}
    }
  }, []);

  const handleAddExcluded = () => {
    const trimmed = excludeInput.trim().toLowerCase();
    if (!trimmed || excludeIngredients.includes(trimmed)) {
      setExcludeInput('');
      return;
    }
    const next = [...excludeIngredients, trimmed];
    setExcludeIngredients(next);
    localStorage.setItem('family-recipes-excluded-ingredients', JSON.stringify(next));
    setExcludeInput('');
  };

  const handleRemoveExcluded = (ingredient: string) => {
    const next = excludeIngredients.filter(i => i !== ingredient);
    setExcludeIngredients(next);
    localStorage.setItem('family-recipes-excluded-ingredients', JSON.stringify(next));
  };

  useEffect(() => {
    fetchMealPlanAndTags();
    fetchFavorites();
    fetchGroceryIngredients();
    fetchFavoriteIngredients();
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

  const fetchFavoriteIngredients = async () => {
    try {
      const response = await fetch('/api/favorites/ingredients');
      const data = await response.json();
      setFavoriteIngredientNames(data.favoriteIngredients || []);
    } catch {
      // non-critical
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
          excludeIngredients: excludeIngredients.length > 0 ? excludeIngredients : undefined,
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

          <button
            className={`${styles.excludeChip} ${excludeIngredients.length > 0 ? styles.excludeChipActive : ''}`}
            onClick={() => setShowExcludeModal(true)}
          >
            {excludeIngredients.length > 0
              ? `Excluding ${excludeIngredients.length} ingredient${excludeIngredients.length !== 1 ? 's' : ''}`
              : 'Exclude ingredients'}
          </button>
        </div>

        {showIngredientsModal && (
          <div className={styles.modalOverlay} onClick={() => setShowIngredientsModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Filter by Ingredients</h3>
                <button className={styles.modalClose} onClick={() => setShowIngredientsModal(false)}>✕</button>
              </div>
              <div className={styles.tagGrid}>
                {groceryIngredients.map((item) => {
                  const isFav = favoriteIngredientNames.includes(item.toLowerCase().trim());
                  return (
                    <button
                      key={item}
                      className={`${styles.tagChip} ${selectedIngredients.has(item) ? styles.tagChipSelected : ''}`}
                      onClick={() => toggleIngredient(item)}
                    >
                      {isFav ? (
                        <svg className={styles.chipStarIcon} width="11" height="11" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ) : (
                        <svg className={styles.chipCheckIcon} width="11" height="11" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {item}
                    </button>
                  );
                })}
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

      {showExcludeModal && (
        <div className={styles.modalOverlay} onClick={() => setShowExcludeModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Exclude Ingredients</h3>
              <button className={styles.modalClose} onClick={() => setShowExcludeModal(false)}>✕</button>
            </div>
            <p className={styles.excludeSubtitle}>Recipes won&apos;t use these ingredients.</p>
            <div className={styles.excludeInputRow}>
              <input
                className={styles.excludeInput}
                type="text"
                placeholder="e.g. peanuts, gluten..."
                value={excludeInput}
                onChange={(e) => setExcludeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddExcluded()}
                autoFocus
              />
              <button
                className={styles.excludeAddButton}
                onClick={handleAddExcluded}
                disabled={!excludeInput.trim()}
              >
                Add
              </button>
            </div>
            {excludeIngredients.length > 0 ? (
              <ul className={styles.excludeList}>
                {excludeIngredients.map((ing) => (
                  <li key={ing} className={styles.excludeListItem}>
                    <span>{ing}</span>
                    <button
                      className={styles.excludeTrashButton}
                      onClick={() => handleRemoveExcluded(ing)}
                      aria-label={`Remove ${ing}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.excludeEmpty}>No ingredients excluded yet.</p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
