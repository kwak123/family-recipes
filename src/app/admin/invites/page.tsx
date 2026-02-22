'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.scss';

interface Invite {
  id: string;
  email: string;
  invitedBy: string;
  invitedAt: string;
  status: string;
  inviterName?: string;
}

export default function AdminInvitesPage() {
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');

  useEffect(() => {
    loadInvites();
  }, []);

  async function loadInvites() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/admin/invites');

      if (response.status === 403) {
        router.push('/');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load invites');
      }

      const data = await response.json();
      setInvites(data);
    } catch (err) {
      console.error('Error loading invites:', err);
      setError('Failed to load invites');
    } finally {
      setLoading(false);
    }
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

      const response = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invite');
      }

      setSendSuccess(`Invite sent to ${email}`);
      setEmail('');
      loadInvites();
    } catch (err) {
      console.error('Error sending invite:', err);
      setSendError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setSending(false);
    }
  }

  async function handleRevokeInvite(inviteEmail: string) {
    if (!confirm(`Revoke invite for ${inviteEmail}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/invites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail })
      });

      if (!response.ok) {
        throw new Error('Failed to revoke invite');
      }

      loadInvites();
    } catch (err) {
      console.error('Error revoking invite:', err);
      alert('Failed to revoke invite');
    }
  }

  function formatDate(isoString: string) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Manage User Invites</h1>
        <button onClick={() => router.push('/')} className={styles.backButton}>
          Back to Home
        </button>
      </div>

      <div className={styles.content}>
        {/* Send Invite Form */}
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Send New Invite</h2>
          <form onSubmit={handleSendInvite} className={styles.form}>
            <div className={styles.inputGroup}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className={styles.input}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending}
                className={styles.submitButton}
              >
                {sending ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
            {sendError && <p className={styles.errorMessage}>{sendError}</p>}
            {sendSuccess && <p className={styles.successMessage}>{sendSuccess}</p>}
          </form>
        </div>

        {/* Pending Invites List */}
        <div className={styles.invitesCard}>
          <h2 className={styles.invitesTitle}>Pending Invites</h2>

          {loading && <p className={styles.loadingText}>Loading invites...</p>}
          {error && <p className={styles.errorMessage}>{error}</p>}

          {!loading && !error && invites.length === 0 && (
            <p className={styles.emptyText}>No pending invites</p>
          )}

          {!loading && !error && invites.length > 0 && (
            <div className={styles.invitesList}>
              {invites.map((invite) => (
                <div key={invite.id} className={styles.inviteItem}>
                  <div className={styles.inviteInfo}>
                    <div className={styles.inviteEmail}>{invite.email}</div>
                    <div className={styles.inviteMeta}>
                      Invited by {invite.inviterName} on {formatDate(invite.invitedAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevokeInvite(invite.email)}
                    className={styles.revokeButton}
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
