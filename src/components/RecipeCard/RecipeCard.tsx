import { useState } from 'react';
import { Recipe } from '@/lib/types';
import styles from './RecipeCard.module.scss';

interface RecipeCardProps {
  recipe: Recipe;
  onAction: (recipeId: string) => void;
  actionLabel: string;
  actionStyle?: 'primary' | 'danger';
  isInPlan?: boolean;
  isFavorited?: boolean;
  onFavoriteToggle?: (recipeId: string) => void;
}

export default function RecipeCard({
  recipe,
  onAction,
  actionLabel,
  actionStyle = 'primary',
  isInPlan = false,
  isFavorited = false,
  onFavoriteToggle
}: RecipeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`${styles.card} ${isInPlan ? styles.inPlan : ''} ${isExpanded ? styles.expanded : ''}`}>
      {onFavoriteToggle && (
        <button
          className={`${styles.favoriteButton} ${isFavorited ? styles.favorited : ''}`}
          onClick={() => onFavoriteToggle(recipe.id)}
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorited ? '★' : '☆'}
        </button>
      )}
      <div className={styles.header}>
        <h3>{recipe.name}</h3>
        <div className={styles.meta}>
          <span>{recipe.cookTimeMinutes} min</span>
          <span>{recipe.servings} servings</span>
        </div>
      </div>

      <p className={styles.description}>{recipe.description}</p>

      <div className={styles.tags}>
        {recipe.tags.map(tag => (
          <span key={tag} className={styles.tag}>
            {tag}
          </span>
        ))}
      </div>

      {isExpanded && (
        <div className={styles.details}>
          <div className={styles.ingredients}>
            <h4>Ingredients</h4>
            <ul>
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index}>
                  {ingredient.quantity} {ingredient.unit} {ingredient.name}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.instructions}>
            <h4>Instructions</h4>
            <ol>
              {recipe.instructions.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <button
          className={styles.expandButton}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▲ Hide Details' : '▼ Show Recipe'}
        </button>
        {actionLabel && (
          <button
            className={`${styles.button} ${styles[actionStyle]}`}
            onClick={() => onAction(recipe.id)}
          >
            {actionLabel}
          </button>
        )}
      </div>

      {isInPlan && <div className={styles.badge}>In Week Plan</div>}
    </div>
  );
}
