import styles from './briefing.module.css';
import poster from '../../assets/brand/podo_poster.png';

type Props = {
  onDismiss: () => void;
  totalEvents: number;
};

export function BriefingModal({ onDismiss, totalEvents }: Props) {
  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.card}>
        <div className={styles.posterWrap}>
          <img className={styles.poster} src={poster} alt="" />
        </div>
        <div className={styles.content}>
          <div className={styles.eyebrow}>CASE FILE / IZMIR / 14 MAY 2026</div>
          <h1 className={styles.title}>Saving Podo</h1>
          <p className={styles.body}>
            Podo was last seen near Alsancak Kordon on the evening of 14 May 2026.
            Since then: silence. We pulled every checkin, message, sighting, note,
            and anonymous tip we could find: {totalEvents} entries in all.
          </p>
          <p className={styles.body}>
            The data is messy. Names are misspelled. Tips contradict each other.
            Your job is to follow the truth through the noise.
          </p>
          <button className={styles.cta} onClick={onDismiss}>
            Open the case
          </button>
        </div>
      </div>
    </div>
  );
}
