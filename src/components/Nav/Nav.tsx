'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import styles from './Nav.module.scss';

export default function Nav() {
  const { data: session, status } = useSession();

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          Family Recipes
        </Link>
        <ul className={styles.links}>
          <li>
            <Link href="/">Find Recipes</Link>
          </li>
          <li>
            <Link href="/my-homes">My Homes</Link>
          </li>
          <li>
            <Link href="/week-plan">Week Plan</Link>
          </li>
          <li>
            <Link href="/grocery-list">Grocery List</Link>
          </li>
          <li>
            <Link href="/favorites">Favorites</Link>
          </li>
        </ul>

        <div className={styles.userSection}>
          {status === 'loading' && (
            <span className={styles.loading}>Loading...</span>
          )}

          {status === 'unauthenticated' && (
            <Link href="/auth/signin" className={styles.signInButton}>
              Sign In
            </Link>
          )}

          {status === 'authenticated' && session?.user && (
            <div className={styles.userMenu}>
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className={styles.userImage}
                />
              )}
              <span className={styles.userName}>{session.user.name}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className={styles.signOutButton}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
