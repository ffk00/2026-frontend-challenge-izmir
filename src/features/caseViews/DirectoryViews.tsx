import type { CaseFile, PersonId, PlaceId } from '../../data/types';
import { Chip } from '../../components/Chip';
import styles from './caseViews.module.css';

type ActorsProps = {
  caseFile: CaseFile;
  onOpenPerson: (personId: PersonId) => void;
};

type LocationsProps = {
  caseFile: CaseFile;
  onOpenPlace: (placeId: PlaceId) => void;
};

export function ActorsView({ caseFile, onOpenPerson }: ActorsProps) {
  const people = [...caseFile.resolution.people].sort((a, b) => b.eventIds.length - a.eventIds.length);

  return (
    <section className={styles.directory}>
      <div className={styles.sectionHeader}>
        <h2>Actors</h2>
        <p>Resolved names, aliases, and event counts from the loaded forms.</p>
      </div>
      <div className={styles.cardGrid}>
        {people.map((person) => (
          <button
            key={person.id}
            type="button"
            className={styles.entityCard}
            onClick={() => onOpenPerson(person.id)}
          >
            <div className={styles.entityCardTop}>
              <Chip name={person.name} toneKey={person.id} />
              <span>{person.eventIds.length} events</span>
            </div>
            <p>{person.aliases.length > 0 ? `Also known as ${person.aliases.join(', ')}` : 'No aliases detected'}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

export function LocationsView({ caseFile, onOpenPlace }: LocationsProps) {
  const places = [...caseFile.resolution.places].sort((a, b) => b.eventIds.length - a.eventIds.length);

  return (
    <section className={styles.directory}>
      <div className={styles.sectionHeader}>
        <h2>Locations</h2>
        <p>Coordinate-clustered places and the events connected to them.</p>
      </div>
      <div className={styles.cardGrid}>
        {places.map((place) => (
          <button
            key={place.id}
            type="button"
            className={styles.entityCard}
            onClick={() => onOpenPlace(place.id)}
          >
            <div className={styles.entityCardTop}>
              <strong>{place.name}</strong>
              <span>{place.eventIds.length} events</span>
            </div>
            <p>{place.aliases.length > 0 ? `Also called ${place.aliases.join(', ')}` : 'No aliases detected'}</p>
            {place.coords && (
              <p className={styles.coords}>
                {place.coords[0].toFixed(5)}, {place.coords[1].toFixed(5)}
              </p>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
