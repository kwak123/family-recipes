'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import styles from './Nav.module.scss';

export default function Nav() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo} onClick={closeMenu}>
          Family Recipes
        </Link>

        {/* Mobile-only: avatar or sign-in button in the top bar */}
        <div className={styles.mobileTopActions}>
          {status === 'authenticated' && session?.user?.image && (
            <Image
              src={session.user.image}
              alt={session.user.name || 'User'}
              width={32}
              height={32}
              className={styles.mobileAvatar}
            />
          )}
          {status === 'unauthenticated' && (
            <Link href="/auth/signin" className={styles.mobileSignInButton} onClick={closeMenu}>
              Sign In
            </Link>
          )}
        </div>

        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(prev => !prev)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className={`${styles.bar} ${menuOpen ? styles.barTop : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.barMid : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.barBot : ''}`} />
        </button>

        <div className={`${styles.menuWrapper} ${menuOpen ? styles.menuOpen : ''}`}>
          <ul className={styles.links} onClick={closeMenu}>
            <li><Link href="/">Find Recipes</Link></li>
            <li><Link href="/my-homes">My Homes</Link></li>
            <li><Link href="/week-plan">Meal Plan</Link></li>
            <li><Link href="/grocery-list">Grocery List</Link></li>
            <li><Link href="/favorites">Favorites</Link></li>
            <li><Link href="/invite">Invite</Link></li>
          </ul>

          <div className={styles.userSection}>
            {status === 'loading' && (
              <span className={styles.loading}>Authenticating...</span>
            )}

            {status === 'unauthenticated' && (
              <Link href="/auth/signin" className={styles.signInButton} onClick={closeMenu}>
                Sign In
              </Link>
            )}

            {status === 'authenticated' && session?.user && (
              <div className={styles.userMenu}>
                {session.user.image && (
                  // eslint-disable-next-line @next/next/no-img-element
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
      </div>
    </nav>
  );
}
