'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import GroceryItem from '@/components/GroceryItem/GroceryItem';
import { GroceryItem as GroceryItemType } from '@/lib/types';
import { useRecipes } from '@/context/RecipesContext';
import styles from './page.module.scss';

export default function GroceryList() {
  const [items, setItems] = useState<GroceryItemType[]>([]);
  const [favoriteIngredients, setFavoriteIngredients] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const { currentHomeId } = useRecipes();

  // Re-fetch whenever the current home changes
  useEffect(() => {
    setItems([]);
    setFavoriteIngredients([]);
    setLoading(true);

    fetchGroceryList();
    fetchFavorites();
  }, [currentHomeId]);

  const fetchGroceryList = async () => {
    try {
      const response = await fetch('/api/grocery-list');
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch grocery list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChecked = async (itemName: string, checked: boolean) => {
    setItems(prev => prev.map(i => i.name === itemName ? { ...i, checkedOff: checked } : i));
    try {
      const response = await fetch('/api/grocery-list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemName, checked })
      });
      if (response.ok) {
        const updated = await response.json();
        if (Array.isArray(updated)) setItems(updated);
      }
    } catch {
      setItems(prev => prev.map(i => i.name === itemName ? { ...i, checkedOff: !checked } : i));
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites/ingredients');
      const data = await response.json();
      setFavoriteIngredients(data.favoriteIngredients || []);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
  };

  const handleToggleFavorite = async (ingredientName: string) => {
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
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Grocery List</h1>
          <Link href="/meal-plan" className={styles.backLink}>
            ← Back to Meal Plan
          </Link>
        </div>

        {loading && <p className={styles.loading}>Loading...</p>}

        {!loading && items.length > 0 && (
          <div className={styles.listSection}>
            <p className={styles.itemCount}>
              {(() => {
                const unchecked = items.filter(i => !i.checkedOff).length;
                return unchecked < items.length
                  ? `${unchecked} of ${items.length} items remaining`
                  : `${items.length} ${items.length === 1 ? 'item' : 'items'}`;
              })()}
            </p>
            <ul className={styles.list}>
              {[...items].sort((a, b) => (a.checkedOff ? 1 : 0) - (b.checkedOff ? 1 : 0)).map((item, index) => (
                <GroceryItem
                  key={`${item.name}-${index}`}
                  item={item}
                  isFavorited={favoriteIngredients.includes(item.name.toLowerCase().trim())}
                  onFavoriteToggle={handleToggleFavorite}
                  onCheckToggle={handleToggleChecked}
                />
              ))}
            </ul>
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className={styles.emptyState}>
            <p>No items in your grocery list yet.</p>
            <p>Add recipes to your meal plan to generate a grocery list.</p>
            <Link href="/" className={styles.homeLink}>
              Generate Recipes
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
