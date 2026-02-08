'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './page.module.scss';

interface Home {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  memberIds: string[];
}

interface User {
  id: string;
  currentHomeId?: string;
}

export default function MyHomesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [homes, setHomes] = useState<Home[]>([]);
  const [filteredHomes, setFilteredHomes] = useState<Home[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingHome, setIsAddingHome] = useState(false);
  const [newHomeName, setNewHomeName] = useState('');
  const [currentHomeId, setCurrentHomeId] = useState<string | undefined>();
  const [invites, setInvites] = useState<Home[]>([]);
  const [isViewingInvites, setIsViewingInvites] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteHomeId, setInviteHomeId] = useState<string>('');
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchHomes();
      fetchInvites();
    }
  }, [session]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredHomes(homes);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredHomes(
        homes.filter(home => home.name.toLowerCase().includes(query))
      );
    }
  }, [searchQuery, homes]);

  async function fetchHomes() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/homes');
      if (!response.ok) {
        throw new Error('Failed to fetch homes');
      }
      const data = await response.json();
      setHomes(data.homes || []);
      setFilteredHomes(data.homes || []);
      setCurrentHomeId(data.currentHomeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function fetchInvites() {
    try {
      const response = await fetch('/api/homes/invites');
      if (!response.ok) {
        throw new Error('Failed to fetch invites');
      }
      const data = await response.json();
      setInvites(data.invites || []);
    } catch (err) {
      console.error('Error fetching invites:', err);
    }
  }

  async function handleAddHome(e: React.FormEvent) {
    e.preventDefault();
    if (!newHomeName.trim()) return;

    try {
      const response = await fetch('/api/homes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newHomeName.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to create home');
      }

      const data = await response.json();
      setHomes([...homes, data.home]);
      setNewHomeName('');
      setIsAddingHome(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create home');
    }
  }

  async function handleSelectHome(homeId: string) {
    try {
      const response = await fetch('/api/homes/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeId })
      });

      if (!response.ok) {
        throw new Error('Failed to select home');
      }

      setCurrentHomeId(homeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select home');
    }
  }

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteHomeId) return;

    try {
      const response = await fetch(`/api/homes/${inviteHomeId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send invite');
        return;
      }

      alert(data.message);
      setInviteEmail('');
      setIsInviting(false);
      setInviteHomeId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    }
  }

  async function handleAcceptInvite(homeId: string) {
    try {
      const response = await fetch('/api/homes/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeId })
      });

      if (!response.ok) {
        throw new Error('Failed to accept invite');
      }

      // Refresh homes and invites
      await fetchHomes();
      await fetchInvites();
      setIsViewingInvites(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite');
    }
  }

  async function handleDeclineInvite(homeId: string) {
    try {
      const response = await fetch('/api/homes/invites/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeId })
      });

      if (!response.ok) {
        throw new Error('Failed to decline invite');
      }

      // Refresh invites
      await fetchInvites();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline invite');
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1>My Homes</h1>
            <p className={styles.subtitle}>A home is required to use the rest of the features</p>
          </div>
          <button
            onClick={() => setIsViewingInvites(true)}
            className={styles.viewInvitesButton}
          >
            View Invites {invites.length > 0 && `(${invites.length})`}
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Search homes by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchBar}
        />
        <button
          onClick={() => setIsAddingHome(true)}
          className={styles.addButton}
        >
          Add Home
        </button>
      </div>

      {isAddingHome && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Add New Home</h2>
            <form onSubmit={handleAddHome}>
              <input
                type="text"
                placeholder="Home name"
                value={newHomeName}
                onChange={(e) => setNewHomeName(e.target.value)}
                className={styles.input}
                autoFocus
              />
              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitButton}>
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingHome(false);
                    setNewHomeName('');
                  }}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isInviting && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Invite User to Home</h2>
            <form onSubmit={handleSendInvite}>
              <input
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className={styles.input}
                autoFocus
              />
              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitButton}>
                  Send Invite
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsInviting(false);
                    setInviteEmail('');
                    setInviteHomeId('');
                  }}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewingInvites && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Home Invites</h2>
            {invites.length === 0 ? (
              <p className={styles.emptyInvites}>You have no pending invites</p>
            ) : (
              <div className={styles.invitesList}>
                {invites.map((invite) => (
                  <div key={invite.id} className={styles.inviteCard}>
                    <div className={styles.inviteInfo}>
                      <h3>{invite.name}</h3>
                      <p className={styles.inviteDetails}>
                        {invite.memberIds.length} member{invite.memberIds.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className={styles.inviteActions}>
                      <button
                        onClick={() => handleAcceptInvite(invite.id)}
                        className={styles.acceptButton}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineInvite(invite.id)}
                        className={styles.declineButton}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => setIsViewingInvites(false)}
                className={styles.cancelButton}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.homesList}>
        {filteredHomes.length === 0 ? (
          <div className={styles.emptyState}>
            {searchQuery ? (
              <p>No homes found matching "{searchQuery}"</p>
            ) : (
              <p>No homes yet. Click "Add Home" to get started!</p>
            )}
          </div>
        ) : (
          filteredHomes.map((home) => (
            <div
              key={home.id}
              className={`${styles.homeCard} ${currentHomeId === home.id ? styles.selectedHome : ''}`}
            >
              <div className={styles.homeInfo}>
                <h3>
                  {home.name}
                  {currentHomeId === home.id && (
                    <span className={styles.selectedBadge}>Current</span>
                  )}
                </h3>
                <p className={styles.homeDetails}>
                  {home.memberIds.length} member{home.memberIds.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className={styles.homeActions}>
                <button
                  onClick={() => {
                    setInviteHomeId(home.id);
                    setIsInviting(true);
                  }}
                  className={styles.inviteButton}
                >
                  Invite
                </button>
                <button
                  onClick={() => handleSelectHome(home.id)}
                  className={styles.selectButton}
                  disabled={currentHomeId === home.id}
                >
                  {currentHomeId === home.id ? 'Selected' : 'Select'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
