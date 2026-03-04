'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './page.module.scss';

export default function InvitePage() {
  const { status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return null;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      setSendError('Email is required');
      return;
    }

    try {
      setSending(true);
      setSendError('');
      setSendSuccess('');

      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invite');
      }

      setSendSuccess(`Invite sent to ${email.trim()}`);
      setEmail('');
    } catch (err) {
      console.error('Error sending invite:', err);
      setSendError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Invite Someone</h1>
      <p className={styles.subtitle}>
        Enter the email address of someone you&apos;d like to invite to Family Recipes.
        They&apos;ll be able to sign in once invited.
      </p>

      <div className={styles.card}>
        <form onSubmit={handleSendInvite} className={styles.form}>
          <div>
            <label htmlFor="invite-email" className={styles.label}>
              Email address
            </label>
            <div className={styles.inputRow}>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="friend@example.com"
                className={styles.input}
                disabled={sending}
                autoFocus
              />
              <button
                type="submit"
                disabled={sending}
                className={styles.submitButton}
              >
                {sending ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </div>

          {sendError && <p className={styles.errorMessage}>{sendError}</p>}
          {sendSuccess && <p className={styles.successMessage}>{sendSuccess}</p>}
        </form>
      </div>
    </div>
  );
}
