import type { CaseFile, PersonId, PlaceId } from '../../data/types';
import { Chip } from '../../components/Chip';
import { usePagination } from '../../hooks/usePagination';
import styles from './caseViews.module.css';

type ActorsProps = {
  caseFile: CaseFile;
  onOpenPerson: (personId: PersonId) => void;
};

type LocationsProps = {
  caseFile: CaseFile;
  onOpenPlace: (placeId: PlaceId) => void;
};

const PAGE_SIZE = 24;

function PaginationControls({
  label,
  total,
  start,
  end,
  page,
  pageCount,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: {
  label: string;
  total: number;
  start: number;
  end: number;
  page: number;
  pageCount: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (total <= PAGE_SIZE) return null;

  return (
    <div className={styles.pagination} aria-label={`${label} pagination`}>
      <span>
        Showing {start + 1}-{end} of {total}
      </span>
      <div className={styles.paginationControls}>
        <button type="button" onClick={onPrev} disabled={!canPrev}>Prev</button>
        <span>Page {page} / {pageCount}</span>
        <button type="button" onClick={onNext} disabled={!canNext}>Next</button>
      </div>
    </div>
  );
}

export function ActorsView({ caseFile, onOpenPerson }: ActorsProps) {
  const people = [...caseFile.resolution.people].sort((a, b) => b.eventIds.length - a.eventIds.length);
  const pagination = usePagination(people, PAGE_SIZE);

  return (
    <section className={styles.directory}>
      <header className={styles.sectionHeader}>
        <div className={styles.sectionHeaderTop}>
          <h2>Actors</h2>
          <span className={styles.sectionCount}>{people.length}</span>
        </div>
        <p>Resolved names, aliases, and event counts from the loaded forms.</p>
      </header>
      <div className={styles.cardGrid}>
        {pagination.pageItems.map((person) => (
          <button
            key={person.id}
            type="button"
            className={styles.entityCard}
            onClick={() => onOpenPerson(person.id)}
          >
            <div className={styles.entityCardTop}>
              <span className={styles.actorName}>
                <Chip name={person.name} toneKey={person.id} />
              </span>
              <span className={styles.eventBadge}>{person.eventIds.length} events</span>
            </div>
            <p className={styles.entityMeta}>
              {person.aliases.length > 0
                ? `Also known as ${person.aliases.join(', ')}`
                : 'No aliases detected'}
            </p>
            <span className={styles.cardArrow} aria-hidden="true">→</span>
          </button>
        ))}
      </div>
      <PaginationControls
        label="Actors"
        total={people.length}
        start={pagination.start}
        end={pagination.end}
        page={pagination.page}
        pageCount={pagination.pageCount}
        canPrev={pagination.canPrev}
        canNext={pagination.canNext}
        onPrev={pagination.prev}
        onNext={pagination.next}
      />
    </section>
  );
}

export function LocationsView({ caseFile, onOpenPlace }: LocationsProps) {
  const places = [...caseFile.resolution.places].sort((a, b) => b.eventIds.length - a.eventIds.length);
  const pagination = usePagination(places, PAGE_SIZE);

  return (
    <section className={styles.directory}>
      <header className={styles.sectionHeader}>
        <div className={styles.sectionHeaderTop}>
          <h2>Locations</h2>
          <span className={styles.sectionCount}>{places.length}</span>
        </div>
        <p>Coordinate-clustered places and the events connected to them.</p>
      </header>
      <div className={styles.cardGrid}>
        {pagination.pageItems.map((place) => (
          <button
            key={place.id}
            type="button"
            className={styles.entityCard}
            onClick={() => onOpenPlace(place.id)}
          >
            <div className={styles.entityCardTop}>
              <strong className={styles.placeName}>{place.name}</strong>
              <span className={styles.eventBadge}>{place.eventIds.length} events</span>
            </div>
            <p className={styles.entityMeta}>
              {place.aliases.length > 0
                ? `Also called ${place.aliases.join(', ')}`
                : 'No aliases detected'}
            </p>
            {place.coords && (
              <p className={styles.coords}>
                <span className={styles.coordsLabel}>Geo</span>
                {place.coords[0].toFixed(5)}, {place.coords[1].toFixed(5)}
              </p>
            )}
            <span className={styles.cardArrow} aria-hidden="true">→</span>
          </button>
        ))}
      </div>
      <PaginationControls
        label="Locations"
        total={places.length}
        start={pagination.start}
        end={pagination.end}
        page={pagination.page}
        pageCount={pagination.pageCount}
        canPrev={pagination.canPrev}
        canNext={pagination.canNext}
        onPrev={pagination.prev}
        onNext={pagination.next}
      />
    </section>
  );
}
