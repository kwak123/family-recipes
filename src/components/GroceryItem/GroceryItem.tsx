import { GroceryItem as GroceryItemType } from '@/lib/types';
import styles from './GroceryItem.module.scss';

interface GroceryItemProps {
  item: GroceryItemType;
}

export default function GroceryItem({ item }: GroceryItemProps) {
  return (
    <li className={styles.item}>
      <span className={styles.name}>{item.name}</span>
      <span className={styles.quantity}>
        {item.totalQuantity} {item.unit}
      </span>
    </li>
  );
}
