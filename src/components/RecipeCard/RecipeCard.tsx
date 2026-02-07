import { Recipe } from '@/lib/types';
import styles from './RecipeCard.module.scss';

interface RecipeCardProps {
  recipe: Recipe;
  onAction: (recipeId: string) => void;
  actionLabel: string;
  actionStyle?: 'primary' | 'danger';
  isInPlan?: boolean;
}

export default function RecipeCard({
  recipe,
  onAction,
  actionLabel,
  actionStyle = 'primary',
  isInPlan = false
}: RecipeCardProps) {
  return (
    <div className={`${styles.card} ${isInPlan ? styles.inPlan : ''}`}>
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

      <button
        className={`${styles.button} ${styles[actionStyle]}`}
        onClick={() => onAction(recipe.id)}
      >
        {actionLabel}
      </button>

      {isInPlan && <div className={styles.badge}>In Week Plan</div>}
    </div>
  );
}
