'use client';

import styles from './LoadingScreen.module.scss';

export default function LoadingScreen() {
  return (
    <div className={styles.container}>
      <div className={styles.spinner}>
        <div className={styles.spinnerCircle}></div>
      </div>
      <p className={styles.text}>Loading...</p>
    </div>
  );
}
