import { Recipe } from '@/lib/types';
import styles from './RecipeCard.module.scss';

interface RecipeCardProps {
  recipe: Recipe;
  onAction: (recipeId: string) => void;
  actionLabel: string;
  actionStyle?: 'primary' | 'danger';
  isInPlan?: boolean;
  isFavorited?: boolean;
  actionPending?: boolean;
  onFavoriteToggle?: (recipeId: string) => void;
  onViewRecipe?: (recipe: Recipe) => void;
}

export default function RecipeCard({
  recipe,
  onAction,
  actionLabel,
  actionStyle = 'primary',
  isInPlan = false,
  isFavorited = false,
  actionPending = false,
  onFavoriteToggle,
  onViewRecipe
}: RecipeCardProps) {
  return (
    <div className={`${styles.card} ${isInPlan ? styles.inPlan : ''}`}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h3>{recipe.name}</h3>
          <div className={styles.meta}>
            <span>{recipe.cookTimeMinutes} min</span>
            <span>{recipe.servings} servings</span>
          </div>
        </div>
        {onFavoriteToggle && (
          <button
            className={`${styles.favoriteButton} ${isFavorited ? styles.favorited : ''}`}
            onClick={() => onFavoriteToggle(recipe.id)}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorited ? '★' : '☆'}
          </button>
        )}
      </div>

      <p className={styles.description}>{recipe.description}</p>

      <div className={styles.tags}>
        {recipe.tags.map(tag => (
          <span key={tag} className={styles.tag}>
            {tag}
          </span>
        ))}
      </div>

      <div className={styles.actions}>
        {onViewRecipe && (
          <button
            className={styles.viewButton}
            onClick={() => onViewRecipe(recipe)}
          >
            View Recipe
          </button>
        )}
        {isInPlan ? (
          <button className={`${styles.button} ${styles.inPlanButton}`} disabled>
            In Meal Plan
          </button>
        ) : (
          actionLabel && (
            <button
              className={`${styles.button} ${styles[actionStyle]}`}
              onClick={() => onAction(recipe.id)}
              disabled={actionPending}
            >
              {actionPending ? <span className={styles.spinner} /> : actionLabel}
            </button>
          )
        )}
      </div>
    </div>
  );
}
