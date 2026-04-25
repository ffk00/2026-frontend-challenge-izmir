import type { CaseFile, Event, PersonId, PlaceId } from '../../data/types';
import { Chip } from '../../components/Chip';
import { KindIcon } from '../timeline/KindIcon';
import type { Selection } from './types';
import styles from './caseViews.module.css';

type Props = {
  caseFile: CaseFile;
  selection: Selection | null;
  onClose: () => void;
  onSelectEvent: (eventId: string) => void;
  onOpenPerson: (personId: PersonId) => void;
  onOpenPlace: (placeId: PlaceId) => void;
};

const KIND_COPY: Record<Event['kind'], string> = {
  checkin: 'Check-in',
  message: 'Message',
  sighting: 'Sighting',
  note: 'Note',
  tip: 'Anonymous tip',
};

function formatTime(date: Date): string {
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getEvent(caseFile: CaseFile, eventId: string): Event | undefined {
  return caseFile.events.find((event) => event.id === eventId);
}

function EventList({
  caseFile,
  eventIds,
  onSelectEvent,
}: {
  caseFile: CaseFile;
  eventIds: string[];
  onSelectEvent: (eventId: string) => void;
}) {
  const events = eventIds
    .map((id) => getEvent(caseFile, id))
    .filter((event): event is Event => Boolean(event))
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  return (
    <ol className={styles.panelEventList}>
      {events.map((event) => (
        <li key={event.id}>
          <button type="button" onClick={() => onSelectEvent(event.id)}>
            <span>{formatTime(event.at)}</span>
            <span>{KIND_COPY[event.kind]}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

export function EntityPanel({
  caseFile,
  selection,
  onClose,
  onSelectEvent,
  onOpenPerson,
  onOpenPlace,
}: Props) {
  if (!selection) return null;

  const event = selection.type === 'event' ? getEvent(caseFile, selection.id) : undefined;
  const person = selection.type === 'person' ? caseFile.resolution.peopleById[selection.id] : undefined;
  const place = selection.type === 'place' ? caseFile.resolution.placesById[selection.id] : undefined;

  return (
    <aside className={styles.panel} aria-label="Selected case detail">
      <div className={styles.panelTop}>
        <div>
          <div className={styles.panelKicker}>{selection.type}</div>
          <h2>{event ? KIND_COPY[event.kind] : person?.name ?? place?.name ?? 'Unknown'}</h2>
        </div>
        <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Close panel">
          X
        </button>
      </div>

      {event && (
        <div className={styles.panelBody}>
          <div className={styles.eventMeta}>
            <KindIcon kind={event.kind} />
            <span>{formatTime(event.at)}</span>
            {event.confidence && <span>{event.confidence} confidence</span>}
          </div>
          <p className={styles.panelQuote}>{event.text || 'No note text provided.'}</p>
          <div className={styles.panelSection}>
            <h3>Actors</h3>
            <div className={styles.inlineList}>
              {caseFile.resolution.events[event.id]?.actorIds.map((id) => {
                const actor = caseFile.resolution.peopleById[id];
                return actor ? (
                  <button key={id} type="button" onClick={() => onOpenPerson(id)}>
                    <Chip name={actor.name} toneKey={actor.id} />
                  </button>
                ) : null;
              })}
            </div>
          </div>
          {caseFile.resolution.events[event.id]?.placeId && (
            <div className={styles.panelSection}>
              <h3>Location</h3>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => onOpenPlace(caseFile.resolution.events[event.id].placeId!)}
              >
                {caseFile.resolution.placesById[caseFile.resolution.events[event.id].placeId!]?.name}
              </button>
            </div>
          )}
          {!event.coords && <div className={styles.mutedFlag}>No coordinates on this event.</div>}
        </div>
      )}

      {person && (
        <div className={styles.panelBody}>
          <div className={styles.identityLine}>
            <Chip name={person.name} toneKey={person.id} />
            <span>{person.eventIds.length} events</span>
          </div>
          <div className={styles.panelSection}>
            <h3>Aliases</h3>
            <p>{person.aliases.length ? person.aliases.join(', ') : 'No aliases detected.'}</p>
          </div>
          <div className={styles.panelSection}>
            <h3>Events</h3>
            <EventList caseFile={caseFile} eventIds={person.eventIds} onSelectEvent={onSelectEvent} />
          </div>
        </div>
      )}

      {place && (
        <div className={styles.panelBody}>
          <div className={styles.identityLine}>
            <strong>{place.name}</strong>
            <span>{place.eventIds.length} events</span>
          </div>
          {place.coords && (
            <div className={styles.coords}>
              {place.coords[0].toFixed(5)}, {place.coords[1].toFixed(5)}
            </div>
          )}
          <div className={styles.panelSection}>
            <h3>Aliases</h3>
            <p>{place.aliases.length ? place.aliases.join(', ') : 'No aliases detected.'}</p>
          </div>
          <div className={styles.panelSection}>
            <h3>Events</h3>
            <EventList caseFile={caseFile} eventIds={place.eventIds} onSelectEvent={onSelectEvent} />
          </div>
        </div>
      )}
    </aside>
  );
}
