import type { CSSProperties } from 'react';
import type { CaseFile, Event, PlaceId, ResolvedPlace } from '../../data/types';
import styles from './caseViews.module.css';

type Marker = {
  place: ResolvedPlace;
  events: Event[];
  x: number;
  y: number;
};

type Props = {
  caseFile: CaseFile;
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
  onOpenPlace: (placeId: PlaceId) => void;
};

function eventTime(event: Event): number {
  return event.at.getTime();
}

function markerStyle(marker: Marker): CSSProperties {
  return {
    '--x': `${marker.x}%`,
    '--y': `${marker.y}%`,
  } as CSSProperties;
}

function buildMarkers(caseFile: CaseFile): Marker[] {
  const places = caseFile.resolution.places.filter((place) => place.coords);
  if (places.length === 0) return [];

  const lats = places.map((place) => place.coords![0]);
  const lngs = places.map((place) => place.coords![1]);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);

  if (minLat === maxLat) {
    minLat -= 0.01;
    maxLat += 0.01;
  }

  if (minLng === maxLng) {
    minLng -= 0.01;
    maxLng += 0.01;
  }

  const byId = new Map(caseFile.events.map((event) => [event.id, event]));

  return places.map((place) => {
    const events = place.eventIds
      .map((id) => byId.get(id))
      .filter((event): event is Event => Boolean(event))
      .sort((a, b) => eventTime(a) - eventTime(b));
    const [lat, lng] = place.coords!;
    return {
      place,
      events,
      x: ((lng - minLng) / (maxLng - minLng)) * 86 + 7,
      y: (1 - (lat - minLat) / (maxLat - minLat)) * 76 + 12,
    };
  });
}

export function CaseMap({ caseFile, selectedEventId, onSelectEvent, onOpenPlace }: Props) {
  const markers = buildMarkers(caseFile);
  const locatedEventIds = new Set(markers.flatMap((marker) => marker.events.map((event) => event.id)));
  const unlocatedCount = caseFile.events.length - locatedEventIds.size;

  if (markers.length === 0) {
    return (
      <section className={styles.mapPanel}>
        <div className={styles.mapEmpty}>No coordinates found in the loaded case file.</div>
      </section>
    );
  }

  return (
    <section className={styles.mapPanel} aria-label="Event map">
      <div className={styles.mapGrid} aria-hidden="true" />
      <div className={styles.mapLabel}>Resolved location clusters</div>
      {markers.map((marker) => {
        const active = marker.events.some((event) => event.id === selectedEventId);
        const firstEvent = marker.events[0];
        return (
          <button
            key={marker.place.id}
            type="button"
            className={`${styles.mapPin} ${active ? styles.mapPinActive : ''}`}
            style={markerStyle(marker)}
            title={`${marker.place.name}: ${marker.events.length} event${marker.events.length === 1 ? '' : 's'}`}
            onClick={() => {
              if (firstEvent) onSelectEvent(firstEvent.id);
              onOpenPlace(marker.place.id);
            }}
          >
            <span className={styles.pinDot} />
            <span className={styles.pinCount}>{marker.events.length}</span>
          </button>
        );
      })}
      <div className={styles.mapLegend}>
        <span>{markers.length} places</span>
        <span>{locatedEventIds.size} mapped events</span>
        {unlocatedCount > 0 && <span>{unlocatedCount} without coordinates</span>}
      </div>
    </section>
  );
}
