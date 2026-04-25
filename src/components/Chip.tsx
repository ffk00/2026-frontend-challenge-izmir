import type { CSSProperties, MouseEventHandler } from 'react';
import { hueFor } from '../lib/colorHash';
import styles from './Chip.module.css';

type Props = {
  name: string;
  toneKey?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  title?: string;
};

// One pill per person. Color is derived from the name so the same person looks
// the same everywhere — even before resolution merges spellings.
export function Chip({ name, toneKey, onClick, title }: Props) {
  const hue = hueFor((toneKey ?? name).toLowerCase());
  const style: CSSProperties = {
    '--chip-hue': hue,
  } as CSSProperties;

  const content = (
    <>
      <span className={`${styles.dot} personChipDot`} aria-hidden="true" />
      <span className={styles.label}>{name || '?'}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={`${styles.chip} personChip`}
        style={style}
        onClick={onClick}
        title={title ?? name}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={`${styles.chip} personChip`} style={style} title={title ?? name}>
      {content}
    </span>
  );
}
