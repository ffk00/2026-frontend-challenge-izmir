import type { EventKind } from '../../data/types';

// Tiny inline SVGs — five icons, one per event kind. Avoids pulling an icon library.
export function KindIcon({ kind }: { kind: EventKind }) {
  switch (kind) {
    case 'checkin':
      return (
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="M8 1.5c-2.5 0-4.5 2-4.5 4.5 0 3.3 4.5 8.5 4.5 8.5s4.5-5.2 4.5-8.5c0-2.5-2-4.5-4.5-4.5Zm0 6.2a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4Z" fill="currentColor"/>
        </svg>
      );
    case 'message':
      return (
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v6A1.5 1.5 0 0 1 12.5 11H6.7l-3.1 2.6c-.4.3-1 0-1-.5V3.5Z" fill="currentColor"/>
        </svg>
      );
    case 'sighting':
      return (
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="M8 3.2c-3.2 0-5.7 2.5-6.7 4.8 1 2.3 3.5 4.8 6.7 4.8s5.7-2.5 6.7-4.8c-1-2.3-3.5-4.8-6.7-4.8Zm0 7.6a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6Zm0-1.6a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z" fill="currentColor"/>
        </svg>
      );
    case 'note':
      return (
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="M3 2.5A1.5 1.5 0 0 1 4.5 1h5.3L13 4.2v9.3A1.5 1.5 0 0 1 11.5 15h-7A1.5 1.5 0 0 1 3 13.5v-11Zm3 5h4v1H6v-1Zm0 2.5h4v1H6v-1Z" fill="currentColor"/>
        </svg>
      );
    case 'tip':
      return (
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="M8 1.5 1 14h14L8 1.5ZM7.3 6.5h1.4v3.5H7.3V6.5Zm0 4.6h1.4v1.4H7.3v-1.4Z" fill="currentColor"/>
        </svg>
      );
  }
}
