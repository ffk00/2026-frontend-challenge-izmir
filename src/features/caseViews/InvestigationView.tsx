import type { CaseFile, PlaceId } from '../../data/types';
import { Timeline } from '../timeline/Timeline';
import { CaseMap } from './CaseMap';
import styles from './caseViews.module.css';

type Props = {
  caseFile: CaseFile;
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
  onOpenPlace: (placeId: PlaceId) => void;
};

export function InvestigationView({ caseFile, selectedEventId, onSelectEvent, onOpenPlace }: Props) {
  return (
    <div className={styles.investigation}>
      <CaseMap
        caseFile={caseFile}
        selectedEventId={selectedEventId}
        onSelectEvent={onSelectEvent}
        onOpenPlace={onOpenPlace}
      />
      <aside className={styles.timelineRail} aria-label="Case timeline">
        <div className={styles.railHeader}>
          <div>
            <h2>Timeline</h2>
            <p>{caseFile.events.length} events, sorted by story time</p>
          </div>
        </div>
        <Timeline
          events={caseFile.events}
          resolution={caseFile.resolution}
          selectedEventId={selectedEventId}
          compact
          onEventSelect={onSelectEvent}
        />
      </aside>
    </div>
  );
}
