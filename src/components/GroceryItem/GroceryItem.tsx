import { GroceryItem as GroceryItemType } from '@/lib/types';
import styles from './GroceryItem.module.scss';

interface GroceryItemProps {
  item: GroceryItemType;
  isFavorited?: boolean;
  onFavoriteToggle?: (ingredientName: string) => void;
}

export default function GroceryItem({ item, isFavorited = false, onFavoriteToggle }: GroceryItemProps) {
  return (
    <li className={styles.item}>
      <span className={styles.name}>{item.name}</span>
      <div className={styles.actions}>
        <span className={styles.quantity}>
          {item.totalQuantity} {item.unit}
        </span>
        {onFavoriteToggle && (
          <button
            className={`${styles.favoriteButton} ${isFavorited ? styles.favorited : ''}`}
            onClick={() => onFavoriteToggle(item.name)}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorited ? '★' : '☆'}
          </button>
        )}
      </div>
    </li>
  );
}
