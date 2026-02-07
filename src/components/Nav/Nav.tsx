import Link from 'next/link';
import styles from './Nav.module.scss';

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          Family Recipes
        </Link>
        <ul className={styles.links}>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/week-plan">Week Plan</Link>
          </li>
          <li>
            <Link href="/grocery-list">Grocery List</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
