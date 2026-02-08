'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import GroceryItem from '@/components/GroceryItem/GroceryItem';
import { GroceryItem as GroceryItemType } from '@/lib/types';
import styles from './page.module.scss';

export default function GroceryList() {
  const [items, setItems] = useState<GroceryItemType[]>([]);
  const [favoriteIngredients, setFavoriteIngredients] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroceryList();
    fetchFavorites();
  }, []);

  const fetchGroceryList = async () => {
    try {
      const response = await fetch('/api/grocery-list');
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch grocery list:', error);
    } finally {
      setLoading(false);
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
          <Link href="/week-plan" className={styles.backLink}>
            ← Back to Week Plan
          </Link>
        </div>

        {loading && <p className={styles.loading}>Loading...</p>}

        {!loading && items.length > 0 && (
          <div className={styles.listSection}>
            <p className={styles.itemCount}>
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
            <ul className={styles.list}>
              {items.map((item, index) => (
                <GroceryItem
                  key={`${item.name}-${index}`}
                  item={item}
                  isFavorited={favoriteIngredients.includes(item.name.toLowerCase().trim())}
                  onFavoriteToggle={handleToggleFavorite}
                />
              ))}
            </ul>
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className={styles.emptyState}>
            <p>No items in your grocery list yet.</p>
            <p>Add recipes to your week plan to generate a grocery list.</p>
            <Link href="/" className={styles.homeLink}>
              Generate Recipes
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
