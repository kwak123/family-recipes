'use client';

import { useEffect } from 'react';
import { Recipe } from '@/lib/types';
import styles from './RecipeModal.module.scss';

interface RecipeModalProps {
  recipe: Recipe;
  onClose: () => void;
}

export default function RecipeModal({ recipe, onClose }: RecipeModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent background scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={recipe.name}
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close recipe"
        >
          ×
        </button>

        <div className={styles.header}>
          <h2 className={styles.title}>{recipe.name}</h2>
          <div className={styles.meta}>
            <span className={styles.metaItem}>{recipe.cookTimeMinutes} min</span>
            <span className={styles.metaItem}>{recipe.servings} servings</span>
          </div>
          <p className={styles.description}>{recipe.description}</p>
          {recipe.tags.length > 0 && (
            <div className={styles.tags}>
              {recipe.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className={styles.body}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Ingredients</h3>
            <ul className={styles.ingredientList}>
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className={styles.ingredientItem}>
                  <span className={styles.ingredientQty}>
                    {ingredient.quantity} {ingredient.unit}
                  </span>
                  <span className={styles.ingredientName}>{ingredient.name}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Instructions</h3>
            <ol className={styles.instructionList}>
              {recipe.instructions.map((step, index) => (
                <li key={index} className={styles.instructionItem}>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
