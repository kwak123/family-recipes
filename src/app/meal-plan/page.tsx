'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RecipeCard from '@/components/RecipeCard/RecipeCard';
import RecipeModal from '@/components/RecipeModal/RecipeModal';
import { Recipe, FittedIngredient } from '@/lib/types';
import { useRecipes } from '@/context/RecipesContext';
import styles from './page.module.scss';

export default function MealPlan() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingRemoveIds, setPendingRemoveIds] = useState<Set<string>>(new Set());
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [simplifiedRecipes, setSimplifiedRecipes] = useState<Recipe[]>([]);
  const [showSimplifyModal, setShowSimplifyModal] = useState(false);
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [showExcludeModal, setShowExcludeModal] = useState(false);
  const [excludeInput, setExcludeInput] = useState('');
  const [isAddingExcluded, setIsAddingExcluded] = useState(false);
  const [removingIngredient, setRemovingIngredient] = useState<string | null>(null);

  const { currentHomeId } = useRecipes();

  // Import state
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedRecipe, setImportedRecipe] = useState<Recipe | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPhase, setImportPhase] = useState<'preview' | 'fitting' | 'fit-result' | 'adding'>('preview');
  const [fittedIngredients, setFittedIngredients] = useState<FittedIngredient[]>([]);
  const [ingredientChoices, setIngredientChoices] = useState<boolean[]>([]);

  useEffect(() => {
    fetchMealPlan();
    fetchFavorites();
    fetchExcludeIngredients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentHomeId]);

  const fetchExcludeIngredients = async () => {
    if (!currentHomeId) return;
    try {
      const response = await fetch(`/api/homes/${currentHomeId}/excluded-ingredients`);
      const data = await response.json();
      setExcludedIngredients(data.excludedIngredients || []);
    } catch (error) {
      console.error('Failed to fetch excluded ingredients:', error);
    }
  };

  const fetchMealPlan = async () => {
    try {
      const response = await fetch('/api/meal-plan');
      const data = await response.json();
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
      const response = await fetch('/api/meal-plan', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId })
      });
      const data = await response.json();
      const recipeList = (data.recipes || []).map((wr: any) => wr.recipe).filter(Boolean);
      setRecipes(recipeList);
    } catch (error) {
      console.error('Failed to remove recipe:', error);
    } finally {
      setPendingRemoveIds(prev => { const next = new Set(prev); next.delete(recipeId); return next; });
    }
  };

  const handleAddExcluded = async (e?: React.FormEvent) => {
    console.log('excluded', currentHomeId);
    if (e) e.preventDefault();
    if (!currentHomeId) return;
    const trimmed = excludeInput.trim().toLowerCase();
    if (!trimmed || excludedIngredients.includes(trimmed)) {
      setExcludeInput('');
      return;
    }
    
    setIsAddingExcluded(true);
    try {
      const response = await fetch(`/api/homes/${currentHomeId}/excluded-ingredients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredient: trimmed })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setExcludedIngredients(data.excludedIngredients || []);
      setExcludeInput('');
    } catch (error) {
      console.error('Failed to add excluded ingredient:', error);
    } finally {
      setIsAddingExcluded(false);
    }
  };

  const handleRemoveExcluded = async (ingredient: string) => {
    if (!currentHomeId) return;
    
    setRemovingIngredient(ingredient);
    try {
      const response = await fetch(`/api/homes/${currentHomeId}/excluded-ingredients`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredient })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setExcludedIngredients(data.excludedIngredients || []);
    } catch (error) {
      console.error('Failed to remove excluded ingredient:', error);
    } finally {
      setRemovingIngredient(null);
    }
  };

  const handleSimplify = async () => {
    if (!recipes.length) return;
    setIsSimplifying(true);
    try {
      const response = await fetch('/api/meal-plan/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipes, excludedIngredients: excludedIngredients.length ? excludedIngredients : undefined })
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
      const response = await fetch('/api/meal-plan/simplify', {
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

  // Import handlers
  const handleImport = async () => {
    if (!importUrl.trim()) return;
    setIsImporting(true);
    setImportError(null);
    try {
      const response = await fetch('/api/recipes/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setImportError(data.error || 'Failed to import recipe');
        return;
      }
      setImportedRecipe(data.recipe);
      setImportPhase('preview');
      setFittedIngredients([]);
      setIngredientChoices([]);
      setShowImportModal(true);
    } catch {
      setImportError('Failed to import recipe');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFitMealPlan = async () => {
    if (!importedRecipe) return;
    setImportPhase('fitting');
    try {
      const response = await fetch('/api/recipes/fit-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe: importedRecipe, mealPlanRecipes: recipes }),
      });
      const data = await response.json();
      const fitted: FittedIngredient[] = data.fittedIngredients || [];
      setFittedIngredients(fitted);
      setIngredientChoices(fitted.map(fi => fi.converted && fi.suggested !== null));
      setImportPhase('fit-result');
    } catch {
      setImportPhase('preview');
    }
  };

  const handleToggleIngredientChoice = (idx: number) => {
    setIngredientChoices(prev => prev.map((v, i) => (i === idx ? !v : v)));
  };

  const handleAddImported = async (directAdd = false) => {
    if (!importedRecipe) return;
    setImportPhase('adding');

    let finalRecipe = importedRecipe;
    if (!directAdd && fittedIngredients.length > 0) {
      const finalIngredients = fittedIngredients.map((fi, i) =>
        ingredientChoices[i] && fi.suggested ? fi.suggested : fi.original
      );
      finalRecipe = { ...importedRecipe, ingredients: finalIngredients };
    }

    try {
      const response = await fetch('/api/meal-plan/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe: finalRecipe }),
      });
      if (!response.ok) {
        const data = await response.json();
        console.error('Import failed:', data.error);
        setImportPhase(directAdd ? 'preview' : 'fit-result');
        return;
      }
      const data = await response.json();
      const recipeList = (data.recipes || []).map((wr: any) => wr.recipe).filter(Boolean);
      setRecipes(recipeList);
      setShowImportModal(false);
      setImportUrl('');
      setImportedRecipe(null);
    } catch {
      setImportPhase(directAdd ? 'preview' : 'fit-result');
    }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportedRecipe(null);
    setFittedIngredients([]);
    setIngredientChoices([]);
    setImportPhase('preview');
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Meal Plan</h1>
          <div className={styles.headerActions}>
            <button
              className={styles.excludeButton}
              onClick={() => setShowExcludeModal(true)}
            >
              {excludedIngredients.length > 0
                ? `Exclude ${excludedIngredients.length} ingredient${excludedIngredients.length !== 1 ? 's' : ''}`
                : 'Exclude Ingredients'}
            </button>
            {recipes.length > 0 && (
              <>
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
              </>
            )}
          </div>
        </div>

        <div className={styles.importBar}>
          <input
            className={styles.importInput}
            type="url"
            placeholder="Paste a recipe URL to import..."
            value={importUrl}
            onChange={e => { setImportUrl(e.target.value); setImportError(null); }}
            onKeyDown={e => e.key === 'Enter' && handleImport()}
            disabled={isImporting}
          />
          <button
            className={styles.importButton}
            onClick={handleImport}
            disabled={isImporting || !importUrl.trim()}
          >
            {isImporting ? 'Importing...' : 'Import Recipe'}
          </button>
        </div>
        {importError && <p className={styles.importError}>{importError}</p>}

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

      {showExcludeModal && (
        <div className={styles.excludeBackdrop} onClick={() => setShowExcludeModal(false)}>
          <div className={styles.excludeModal} onClick={e => e.stopPropagation()}>
            <div className={styles.excludeModalHeader}>
              <h2>Exclude Ingredients</h2>
              <button className={styles.simplifyCloseButton} onClick={() => setShowExcludeModal(false)}>✕</button>
            </div>
            <p className={styles.excludeModalSubtitle}>
              These ingredients will be avoided when simplifying your meal plan.
            </p>
            <form 
              className={styles.excludeInputRow}
              onSubmit={handleAddExcluded}
            >
              <input
                className={styles.excludeInput}
                type="text"
                placeholder="Add ingredient to exclude..."
                value={excludeInput}
                onChange={e => setExcludeInput(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className={styles.excludeAddButton}
                disabled={!excludeInput.trim() || isAddingExcluded}
              >
                {isAddingExcluded ? '...' : 'Add'}
              </button>
            </form>
            {excludedIngredients.length > 0 && (
              <div className={styles.excludedTags}>
                {excludedIngredients.map(ing => (
                  <span key={ing} className={styles.excludedTag}>
                    {ing}
                    <button
                      className={styles.excludedTagRemove}
                      onClick={() => handleRemoveExcluded(ing)}
                      aria-label={`Remove ${ing}`}
                      disabled={removingIngredient === ing}
                    >
                      {removingIngredient === ing ? '...' : '✕'}
                    </button>
                  </span>
                ))}
              </div>
            )}
            {excludedIngredients.length === 0 && (
              <p className={styles.excludeEmpty}>No ingredients excluded yet.</p>
            )}
          </div>
        </div>
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

      {showImportModal && importedRecipe && (
        <div className={styles.importBackdrop} onClick={closeImportModal}>
          <div className={styles.importModal} onClick={e => e.stopPropagation()}>
            <div className={styles.importModalHeader}>
              <div>
                <h2>{importedRecipe.name}</h2>
                <p className={styles.importModalSubtitle}>{importedRecipe.description}</p>
              </div>
              <button className={styles.simplifyCloseButton} onClick={closeImportModal}>✕</button>
            </div>

            {importPhase === 'preview' && (
              <div className={styles.importPhasePreview}>
                {importedRecipe.tags.length > 0 && (
                  <div className={styles.importTags}>
                    {importedRecipe.tags.map(tag => (
                      <span key={tag} className={styles.importTag}>{tag}</span>
                    ))}
                  </div>
                )}
                <div className={styles.importMeta}>
                  <span>{importedRecipe.cookTimeMinutes} min</span>
                  <span>·</span>
                  <span>{importedRecipe.servings} servings</span>
                </div>
                <div className={styles.importSection}>
                  <h3>Ingredients</h3>
                  <ul className={styles.importIngredients}>
                    {importedRecipe.ingredients.map((ing, i) => (
                      <li key={i}>{ing.quantity} {ing.unit} {ing.name}</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.importSection}>
                  <h3>Instructions</h3>
                  <ol className={styles.importInstructions}>
                    {importedRecipe.instructions.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
                <div className={styles.importActions}>
                  {recipes.length > 0 && (
                    <button className={styles.fitButton} onClick={handleFitMealPlan}>
                      Fit My Meal Plan
                    </button>
                  )}
                  <button
                    className={styles.importCommitButton}
                    onClick={() => handleAddImported(true)}
                  >
                    Add Directly
                  </button>
                </div>
              </div>
            )}

            {importPhase === 'fitting' && (
              <div className={styles.importPhaseFitting}>
                <div className={styles.importSpinner} />
                <p>Analyzing ingredients against your meal plan...</p>
              </div>
            )}

            {importPhase === 'fit-result' && (
              <div className={styles.importPhaseResult}>
                <p className={styles.fitResultNote}>
                  Toggle each ingredient to use the suggested substitute (already in your meal plan) or keep the original.
                </p>
                <table className={styles.fitTable}>
                  <thead>
                    <tr>
                      <th>Original</th>
                      <th></th>
                      <th>Suggested</th>
                      <th>Use</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fittedIngredients.map((fi, i) => (
                      <tr
                        key={i}
                        className={
                          fi.converted && fi.suggested
                            ? styles.fitRowConverted
                            : styles.fitRowNoChange
                        }
                      >
                        <td>{fi.original.quantity} {fi.original.unit} {fi.original.name}</td>
                        <td className={styles.fitArrow}>→</td>
                        <td>
                          {fi.suggested
                            ? `${fi.suggested.quantity} ${fi.suggested.unit} ${fi.suggested.name}`
                            : <span className={styles.fitNoSuggestion}>—</span>}
                          {fi.reason && <span className={styles.fitReason}>{fi.reason}</span>}
                        </td>
                        <td>
                          {fi.converted && fi.suggested ? (
                            <button
                              className={`${styles.fitToggle} ${ingredientChoices[i] ? styles.fitToggleOn : ''}`}
                              onClick={() => handleToggleIngredientChoice(i)}
                              title={ingredientChoices[i] ? 'Using suggested' : 'Using original'}
                            >
                              {ingredientChoices[i] ? 'Suggested' : 'Original'}
                            </button>
                          ) : (
                            <span className={styles.fitKeep}>Keep</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className={styles.importActions}>
                  <button className={styles.simplifyDismissButton} onClick={() => setImportPhase('preview')}>
                    ← Back
                  </button>
                  <button
                    className={styles.importCommitButton}
                    onClick={() => handleAddImported(false)}
                  >
                    Add to Meal Plan
                  </button>
                </div>
              </div>
            )}

            {importPhase === 'adding' && (
              <div className={styles.importPhaseFitting}>
                <div className={styles.importSpinner} />
                <p>Adding recipe to your meal plan...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
