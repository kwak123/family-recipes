'use client';

import { useState } from 'react';
import styles from './DevPurge.module.scss';

export default function DevPurge() {
  const [stats, setStats] = useState<any>(null);
  const [purging, setPurging] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dev/purge');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handlePurge = async () => {
    if (!confirm('⚠️ This will delete ALL data. Are you sure?')) {
      return;
    }

    setPurging(true);
    try {
      const response = await fetch('/api/dev/purge', {
        method: 'POST'
      });
      const data = await response.json();
      setStats(data.stats);
      alert('✅ Database purged successfully!');

      // Reload the page to reset state
      window.location.reload();
    } catch (error) {
      console.error('Failed to purge:', error);
      alert('❌ Failed to purge database');
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>🔧 DEV TOOLS</h3>
        <button
          onClick={fetchStats}
          className={styles.statsButton}
        >
          Show Stats
        </button>
      </div>

      {stats && (
        <div className={styles.stats}>
          <p>Households: {stats.households}</p>
          <p>Recipes: {stats.recipes}</p>
          <p>Week Plans: {stats.weekPlans}</p>
        </div>
      )}

      <button
        onClick={handlePurge}
        disabled={purging}
        className={styles.purgeButton}
      >
        {purging ? 'Purging...' : '🗑️ PURGE DATABASE'}
      </button>

      <p className={styles.warning}>
        ⚠️ DEV ONLY: Deletes all households, recipes, and week plans
      </p>
    </div>
  );
}
