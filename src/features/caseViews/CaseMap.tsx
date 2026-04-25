import { useEffect, useMemo } from 'react';
import { divIcon, type LatLngTuple } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { CaseFile, Event, PlaceId, ResolvedPlace } from '../../data/types';
import styles from './caseViews.module.css';

type MarkerData = {
  place: ResolvedPlace;
  events: Event[];
  position: LatLngTuple;
};

type Props = {
  caseFile: CaseFile;
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
  onOpenPlace: (placeId: PlaceId) => void;
};

const IZMIR_FALLBACK_CENTER: LatLngTuple = [38.4237, 27.1428];

function buildMarkers(caseFile: CaseFile): MarkerData[] {
  const byId = new Map(caseFile.events.map((event) => [event.id, event]));

  return caseFile.resolution.places
    .filter((place) => place.coords)
    .map((place) => {
      const events = place.eventIds
        .map((id) => byId.get(id))
        .filter((event): event is Event => Boolean(event))
        .sort((a, b) => a.at.getTime() - b.at.getTime());

      return {
        place,
        events,
        position: place.coords! as LatLngTuple,
      };
    });
}

function MapViewport({ markers }: { markers: MarkerData[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) {
      map.setView(IZMIR_FALLBACK_CENTER, 12);
      return;
    }

    if (markers.length === 1) {
      map.setView(markers[0].position, 14);
      return;
    }

    const bounds: LatLngTuple[] = markers.map((marker) => marker.position);
    map.fitBounds(bounds, {
      animate: false,
      padding: [48, 48],
      maxZoom: 15,
    });
  }, [map, markers]);

  return null;
}

function markerIcon(count: number, active: boolean) {
  return divIcon({
    className: `${styles.leafletPin} ${active ? styles.leafletPinActive : ''}`,
    html: `<span class="${styles.pinDot}"></span><span class="${styles.pinCount}">${count}</span>`,
    iconSize: [34, 30],
    iconAnchor: [17, 15],
    popupAnchor: [0, -14],
  });
}

export function CaseMap({ caseFile, selectedEventId, onSelectEvent, onOpenPlace }: Props) {
  const markers = useMemo(() => buildMarkers(caseFile), [caseFile]);
  const locatedEventIds = useMemo(
    () => new Set(markers.flatMap((marker) => marker.events.map((event) => event.id))),
    [markers],
  );
  const unlocatedCount = caseFile.events.length - locatedEventIds.size;

  return (
    <section className={styles.mapPanel} aria-label="Event map">
      <MapContainer
        className={styles.leafletMap}
        center={IZMIR_FALLBACK_CENTER}
        zoom={12}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewport markers={markers} />
        {markers.map((marker) => {
          const active = marker.events.some((event) => event.id === selectedEventId);
          const firstEvent = marker.events[0];

          return (
            <Marker
              key={marker.place.id}
              position={marker.position}
              icon={markerIcon(marker.events.length, active)}
              eventHandlers={{
                click: () => {
                  if (firstEvent) onSelectEvent(firstEvent.id);
                  onOpenPlace(marker.place.id);
                },
              }}
            >
              <Popup>
                <div className={styles.mapPopup}>
                  <strong>{marker.place.name}</strong>
                  <span>{marker.events.length} event{marker.events.length === 1 ? '' : 's'}</span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <div className={styles.mapLegend}>
        <span>{markers.length} places</span>
        <span>{locatedEventIds.size} mapped events</span>
        {unlocatedCount > 0 && <span>{unlocatedCount} without coordinates</span>}
      </div>
    </section>
  );
}
