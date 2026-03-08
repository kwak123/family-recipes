import { GroceryItem as GroceryItemType } from '@/lib/types';
import styles from './GroceryItem.module.scss';

interface GroceryItemProps {
  item: GroceryItemType;
  isFavorited?: boolean;
  onFavoriteToggle?: (ingredientName: string) => void;
  onCheckToggle?: (itemName: string, checked: boolean) => void;
}

export default function GroceryItem({ item, isFavorited = false, onFavoriteToggle, onCheckToggle }: GroceryItemProps) {
  return (
    <li className={`${styles.item} ${item.checkedOff ? styles.checked : ''}`}>
      <div className={styles.left}>
        {onCheckToggle && (
          <button
            className={`${styles.checkButton} ${item.checkedOff ? styles.checkButtonChecked : ''}`}
            onClick={() => onCheckToggle(item.name, !item.checkedOff)}
            aria-label={item.checkedOff ? 'Mark as needed' : 'Mark as collected'}
          >
            {item.checkedOff ? '✓' : ''}
          </button>
        )}
        <span className={styles.name}>{item.name}</span>
      </div>
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
