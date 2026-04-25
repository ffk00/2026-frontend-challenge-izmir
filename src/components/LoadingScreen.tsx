import styles from './LoadingScreen.module.css';

export function LoadingScreen({ label = 'Building case file…' }: { label?: string }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.dot} />
      <div className={styles.label}>{label}</div>
    </div>
  );
}
