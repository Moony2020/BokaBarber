'use client';

import styles from './loading.module.css';

export default function Loading() {
  return (
    <section className={styles.loadingPage} aria-live="polite" aria-busy="true">
      <div className={styles.loadingState}>
        <div className={styles.spinnerPremium} />
        <p>Laddar sidan...</p>
      </div>
    </section>
  );
}
