import { Chip } from '../../components/Chip';
import type { CaseResolution, Event, ResolvedPerson, ResolvedPlace } from '../../data/types';
import styles from './timeline.module.css';

type Props = {
  event: Event;
  resolution?: CaseResolution;
};

function actorAt(
  event: Event,
  resolution: CaseResolution | undefined,
  index: number,
): ResolvedPerson | undefined {
  const id = resolution?.events[event.id]?.actorIds[index];
  return id ? resolution?.peopleById[id] : undefined;
}

function placeFor(event: Event, resolution: CaseResolution | undefined): ResolvedPlace | undefined {
  const id = resolution?.events[event.id]?.placeId;
  return id ? resolution?.placesById[id] : undefined;
}

function ActorChip({
  fallback,
  person,
}: {
  fallback: string | undefined;
  person: ResolvedPerson | undefined;
}) {
  const name = person?.name ?? fallback ?? '?';
  const aliases = person?.aliases.length ? `Also known as ${person.aliases.join(', ')}` : undefined;
  return <Chip name={name} toneKey={person?.id} title={aliases ?? name} />;
}

function Place({
  fallback,
  place,
}: {
  fallback: string | undefined;
  place: ResolvedPlace | undefined;
}) {
  return (
    <span className={styles.place} title={place?.aliases.join(', ')}>
      {place?.name ?? fallback}
    </span>
  );
}

// Renders the per-kind body for a timeline row. Same chip primitive everywhere,
// only the connective tissue between chips changes.
export function EventBody({ event, resolution }: Props) {
  const [a, b] = event.actors;
  const actorA = actorAt(event, resolution, 0);
  const actorB = actorAt(event, resolution, 1);
  const place = placeFor(event, resolution);

  switch (event.kind) {
    case 'message':
      return (
        <div className={styles.body}>
          <ActorChip fallback={a} person={actorA} />
          <span className={styles.connector}>-&gt;</span>
          <ActorChip fallback={b} person={actorB} />
          {event.text && <span className={styles.quote}>"{event.text}"</span>}
        </div>
      );

    case 'checkin':
      return (
        <div className={styles.body}>
          <ActorChip fallback={a} person={actorA} />
          <span className={styles.connector}>checked in at</span>
          {event.place && <Place fallback={event.place} place={place} />}
          {event.text && <span className={styles.quote}>- "{event.text}"</span>}
        </div>
      );

    case 'sighting':
      return (
        <div className={styles.body}>
          <ActorChip fallback={a} person={actorA} />
          <span className={styles.connector}>seen with</span>
          <ActorChip fallback={b} person={actorB} />
          {event.place && (
            <>
              <span className={styles.connector}>at</span>
              <Place fallback={event.place} place={place} />
            </>
          )}
          {event.text && <span className={styles.quote}>- "{event.text}"</span>}
        </div>
      );

    case 'note':
      return (
        <div className={styles.body}>
          <ActorChip fallback={a} person={actorA} />
          <span className={styles.connector}>wrote</span>
          <span className={styles.quote}>"{event.text}"</span>
        </div>
      );

    case 'tip':
      return (
        <div className={styles.body}>
          {event.confidence && (
            <span className={`${styles.confidence} ${styles[`conf_${event.confidence}`]}`}>
              {event.confidence}
            </span>
          )}
          <span className={styles.connector}>tip about</span>
          <ActorChip fallback={a} person={actorA} />
          {event.place && (
            <>
              <span className={styles.connector}>at</span>
              <Place fallback={event.place} place={place} />
            </>
          )}
          {event.text && <span className={styles.quote}>- "{event.text}"</span>}
        </div>
      );
  }
}
