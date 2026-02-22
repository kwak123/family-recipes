import { signOut } from '@/lib/auth';
import styles from './page.module.scss';

export default function NotAllowedPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Access Restricted</h1>
        <p className={styles.message}>
          This app is invite-only. Please contact an administrator to request access.
        </p>
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/auth/signin' });
          }}
        >
          <button type="submit" className={styles.signOutButton}>
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
