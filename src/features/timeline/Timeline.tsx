import { useMemo } from 'react';
import { useCase } from '../../store/caseStore';
import type { CaseResolution, Event, EventKind } from '../../data/types';
import { KindIcon } from './KindIcon';
import { EventBody } from './EventBody';
import styles from './timeline.module.css';

const KIND_LABEL: Record<EventKind, string> = {
  checkin: 'check-in',
  message: 'message',
  sighting: 'sighting',
  note: 'note',
  tip: 'tip',
};

const EMPTY_EVENTS: Event[] = [];

type Props = {
  events?: Event[];
  resolution?: CaseResolution;
  selectedEventId?: string | null;
  compact?: boolean;
  onEventSelect?: (eventId: string) => void;
};

function formatTime(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function Timeline({
  events: providedEvents,
  resolution: providedResolution,
  selectedEventId,
  compact = false,
  onEventSelect,
}: Props = {}) {
  const { caseFile } = useCase();
  const events = providedEvents ?? caseFile?.events ?? EMPTY_EVENTS;
  const resolution = providedResolution ?? caseFile?.resolution;

  // Group by day so the chronological structure is readable.
  const days = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const e of events) {
      const k = e.at.toDateString();
      const list = map.get(k);
      if (list) list.push(e); else map.set(k, [e]);
    }
    return [...map.entries()];
  }, [events]);

  if (events.length === 0) {
    return <div className={styles.empty}>No events in the case file.</div>;
  }

  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : ''}`}>
      {days.map(([dayKey, list]) => (
        <section key={dayKey} className={styles.day}>
          <div className={styles.dayHeader}>{formatDate(list[0].at)}</div>
          <ol className={styles.list}>
            {list.map((e) => (
              <li
                key={e.id}
                className={`${styles.row} ${selectedEventId === e.id ? styles.selected : ''}`}
                data-kind={e.kind}
                tabIndex={onEventSelect ? 0 : undefined}
                role={onEventSelect ? 'button' : undefined}
                onClick={() => onEventSelect?.(e.id)}
                onKeyDown={(event) => {
                  if (!onEventSelect) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onEventSelect(e.id);
                  }
                }}
              >
                <div className={styles.time}>{formatTime(e.at)}</div>
                <div className={styles.kindCell} title={KIND_LABEL[e.kind]}>
                  <KindIcon kind={e.kind} />
                </div>
                <EventBody event={e} resolution={resolution} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
