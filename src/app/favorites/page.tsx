'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RecipeCard from '@/components/RecipeCard/RecipeCard';
import GroceryItem from '@/components/GroceryItem/GroceryItem';
import { Recipe, GroceryItem as GroceryItemType } from '@/lib/types';
import styles from './page.module.scss';

type Tab = 'recipes' | 'ingredients';

export default function Favorites() {
  const [activeTab, setActiveTab] = useState<Tab>('recipes');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<GroceryItemType[]>([]);
  const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<string[]>([]);
  const [favoriteIngredients, setFavoriteIngredients] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      // Fetch favorite recipe IDs
      const favRecipesRes = await fetch('/api/favorites/recipes');
      const favRecipesData = await favRecipesRes.json();
      const favoriteIds = favRecipesData.favoriteRecipeIds || [];
      setFavoriteRecipeIds(favoriteIds);

      // Fetch favorite ingredient names
      const favIngredientsRes = await fetch('/api/favorites/ingredients');
      const favIngredientsData = await favIngredientsRes.json();
      setFavoriteIngredients(favIngredientsData.favoriteIngredients || []);

      // Fetch all recipes to filter favorites
      const recipesRes = await fetch('/api/recipes');
      const recipesData = await recipesRes.json();
      const favoriteRecipes = recipesData.filter((recipe: Recipe) =>
        favoriteIds.includes(recipe.id)
      );
      setRecipes(favoriteRecipes);

      // Create ingredient items from favorite ingredient names
      const ingredientItems: GroceryItemType[] = favIngredientsData.favoriteIngredients.map(
        (name: string) => ({
          name,
          totalQuantity: 0,
          unit: ''
        })
      );
      setIngredients(ingredientItems);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavoriteRecipe = async (recipeId: string) => {
    const isFavorited = favoriteRecipeIds.includes(recipeId);
    try {
      const response = await fetch('/api/favorites/recipes', {
        method: isFavorited ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId })
      });
      const data = await response.json();
      setFavoriteRecipeIds(data.favoriteRecipeIds || []);

      // Remove from list if unfavorited
      if (isFavorited) {
        setRecipes(recipes.filter(r => r.id !== recipeId));
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleToggleFavoriteIngredient = async (ingredientName: string) => {
    const normalizedName = ingredientName.toLowerCase().trim();
    const isFavorited = favoriteIngredients.includes(normalizedName);
    try {
      const response = await fetch('/api/favorites/ingredients', {
        method: isFavorited ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredient: ingredientName })
      });
      const data = await response.json();
      setFavoriteIngredients(data.favoriteIngredients || []);

      // Remove from list if unfavorited
      if (isFavorited) {
        setIngredients(ingredients.filter(i => i.name.toLowerCase().trim() !== normalizedName));
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>My Favorites</h1>
          <Link href="/" className={styles.homeLink}>
            ← Back to Home
          </Link>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'recipes' ? styles.active : ''}`}
            onClick={() => setActiveTab('recipes')}
          >
            Recipes ({recipes.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'ingredients' ? styles.active : ''}`}
            onClick={() => setActiveTab('ingredients')}
          >
            Ingredients ({ingredients.length})
          </button>
        </div>

        {loading && <p className={styles.loading}>Loading...</p>}

        {!loading && activeTab === 'recipes' && (
          <>
            {recipes.length > 0 && (
              <div className={styles.recipesGrid}>
                {recipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onAction={() => {}}
                    actionLabel=""
                    isFavorited={true}
                    onFavoriteToggle={handleToggleFavoriteRecipe}
                  />
                ))}
              </div>
            )}
            {recipes.length === 0 && (
              <div className={styles.emptyState}>
                <p>No favorite recipes yet.</p>
                <p>Click the star icon on any recipe card to add it to your favorites.</p>
                <Link href="/" className={styles.ctaLink}>
                  Browse Recipes
                </Link>
              </div>
            )}
          </>
        )}

        {!loading && activeTab === 'ingredients' && (
          <>
            {ingredients.length > 0 && (
              <div className={styles.ingredientsList}>
                <p className={styles.itemCount}>
                  {ingredients.length} {ingredients.length === 1 ? 'ingredient' : 'ingredients'}
                </p>
                <ul className={styles.list}>
                  {ingredients.map((item, index) => (
                    <li key={`${item.name}-${index}`} className={styles.ingredientItem}>
                      <span className={styles.ingredientName}>{item.name}</span>
                      <button
                        className={styles.removeButton}
                        onClick={() => handleToggleFavoriteIngredient(item.name)}
                        aria-label="Remove from favorites"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {ingredients.length === 0 && (
              <div className={styles.emptyState}>
                <p>No favorite ingredients yet.</p>
                <p>Click the star icon on any ingredient in the grocery list to add it to your favorites.</p>
                <Link href="/grocery-list" className={styles.ctaLink}>
                  View Grocery List
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
