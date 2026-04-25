import { levenshtein, levenshteinSimilarity } from './levenshtein';
import type {
  CaseResolution,
  Event,
  PersonId,
  PlaceId,
  ResolvedEvent,
  ResolvedPerson,
  ResolvedPlace,
} from './types';

const NAME_SIMILARITY = 0.82;
const PLACE_NAME_SIMILARITY = 0.86;
const PLACE_CLUSTER_METERS = 125;

type AliasStats = {
  value: string;
  normalized: string;
  count: number;
  firstSeenAt: number;
};

type PersonCluster = {
  id: PersonId;
  aliases: Map<string, AliasStats>;
  eventIds: Set<string>;
};

type PlaceCluster = {
  id: PlaceId;
  aliases: Map<string, AliasStats>;
  eventIds: Set<string>;
  coords: [number, number][];
};

const TURKISH_ASCII: Record<string, string> = {
  '\u00e7': 'c',
  '\u011f': 'g',
  '\u0131': 'i',
  '\u00f6': 'o',
  '\u015f': 's',
  '\u00fc': 'u',
};

export function normalizeEntityText(value: string): string {
  return value
    .trim()
    .normalize('NFKC')
    .toLocaleLowerCase('tr-TR')
    .replace(/[\u00e7\u011f\u0131\u00f6\u015f\u00fc]/g, (char) => TURKISH_ASCII[char] ?? char)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[''`\u00b4]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sameEntityName(a: string, b: string): boolean {
  if (a === b) return true;
  const max = Math.max(a.length, b.length);
  if (max < 4) return false;

  const distance = levenshtein(a, b);
  const allowedDistance = Math.max(1, Math.floor(max * 0.18));
  return distance <= allowedDistance && levenshteinSimilarity(a, b) >= NAME_SIMILARITY;
}

function samePlaceName(a: string, b: string): boolean {
  if (a === b) return true;
  const max = Math.max(a.length, b.length);
  if (max < 5) return false;
  return levenshteinSimilarity(a, b) >= PLACE_NAME_SIMILARITY;
}

function canonicalAlias(aliases: Iterable<AliasStats>): AliasStats {
  return [...aliases].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    if (a.firstSeenAt !== b.firstSeenAt) return a.firstSeenAt - b.firstSeenAt;
    return a.value.localeCompare(b.value);
  })[0];
}

function orderedAliases(aliases: Iterable<AliasStats>, canonical: string): string[] {
  return [...aliases]
    .filter((alias) => alias.value !== canonical)
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      if (a.firstSeenAt !== b.firstSeenAt) return a.firstSeenAt - b.firstSeenAt;
      return a.value.localeCompare(b.value);
    })
    .map((alias) => alias.value);
}

function upsertAlias(
  aliases: Map<string, AliasStats>,
  value: string,
  firstSeenAt: number,
): AliasStats {
  const normalized = normalizeEntityText(value);
  const existing = aliases.get(normalized);
  if (existing) {
    existing.count += 1;
    if (firstSeenAt < existing.firstSeenAt) existing.firstSeenAt = firstSeenAt;
    return existing;
  }

  const stats: AliasStats = {
    value: value.trim(),
    normalized,
    count: 1,
    firstSeenAt,
  };
  aliases.set(normalized, stats);
  return stats;
}

function findPersonCluster(clusters: PersonCluster[], normalized: string): PersonCluster | undefined {
  return clusters.find((cluster) =>
    [...cluster.aliases.values()].some((alias) => sameEntityName(alias.normalized, normalized)),
  );
}

function distanceMeters(a: [number, number], b: [number, number]): number {
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const earthRadiusMeters = 6_371_000;
  const dLat = toRadians(b[0] - a[0]);
  const dLng = toRadians(b[1] - a[1]);
  const lat1 = toRadians(a[0]);
  const lat2 = toRadians(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(h));
}

function meanCoords(coords: [number, number][]): [number, number] | undefined {
  if (coords.length === 0) return undefined;
  const sum = coords.reduce<[number, number]>(
    (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]],
    [0, 0],
  );
  return [sum[0] / coords.length, sum[1] / coords.length];
}

function findPlaceCluster(
  clusters: PlaceCluster[],
  normalized: string,
  coords: [number, number] | undefined,
): PlaceCluster | undefined {
  return clusters.find((cluster) => {
    if (coords && cluster.coords.some((existing) => distanceMeters(existing, coords) <= PLACE_CLUSTER_METERS)) {
      return true;
    }

    return [...cluster.aliases.values()].some((alias) => samePlaceName(alias.normalized, normalized));
  });
}

function toResolvedPerson(cluster: PersonCluster): ResolvedPerson {
  const canonical = canonicalAlias(cluster.aliases.values());
  return {
    id: cluster.id,
    name: canonical.value,
    aliases: orderedAliases(cluster.aliases.values(), canonical.value),
    normalizedAliases: [...cluster.aliases.values()].map((alias) => alias.normalized).sort(),
    eventIds: [...cluster.eventIds],
  };
}

function toResolvedPlace(cluster: PlaceCluster): ResolvedPlace {
  const canonical = canonicalAlias(cluster.aliases.values());
  return {
    id: cluster.id,
    name: canonical.value,
    aliases: orderedAliases(cluster.aliases.values(), canonical.value),
    normalizedAliases: [...cluster.aliases.values()].map((alias) => alias.normalized).sort(),
    coords: meanCoords(cluster.coords),
    eventIds: [...cluster.eventIds],
  };
}

export function resolveCase(events: Event[]): CaseResolution {
  const personClusters: PersonCluster[] = [];
  const placeClusters: PlaceCluster[] = [];
  const resolvedEvents: Record<string, ResolvedEvent> = {};

  for (const event of events) {
    const at = event.at.getTime();
    const actorIds = event.actors.flatMap((actor) => {
      const normalized = normalizeEntityText(actor);
      if (!normalized) return [];

      let cluster = findPersonCluster(personClusters, normalized);
      if (!cluster) {
        cluster = {
          id: `person:${personClusters.length + 1}`,
          aliases: new Map(),
          eventIds: new Set(),
        };
        personClusters.push(cluster);
      }

      upsertAlias(cluster.aliases, actor, at);
      cluster.eventIds.add(event.id);
      return [cluster.id];
    });

    let placeId: PlaceId | undefined;
    if (event.place) {
      const normalized = normalizeEntityText(event.place);
      if (normalized) {
        let cluster = findPlaceCluster(placeClusters, normalized, event.coords);
        if (!cluster) {
          cluster = {
            id: `place:${placeClusters.length + 1}`,
            aliases: new Map(),
            eventIds: new Set(),
            coords: [],
          };
          placeClusters.push(cluster);
        }

        upsertAlias(cluster.aliases, event.place, at);
        cluster.eventIds.add(event.id);
        if (event.coords) cluster.coords.push(event.coords);
        placeId = cluster.id;
      }
    }

    resolvedEvents[event.id] = {
      eventId: event.id,
      actorIds,
      placeId,
    };
  }

  const people = personClusters.map(toResolvedPerson);
  const places = placeClusters.map(toResolvedPlace);
  const peopleById = Object.fromEntries(people.map((person) => [person.id, person]));
  const placesById = Object.fromEntries(places.map((place) => [place.id, place]));
  const personIdByName: Record<string, PersonId> = {};
  const placeIdByName: Record<string, PlaceId> = {};

  for (const person of people) {
    for (const alias of person.normalizedAliases) personIdByName[alias] = person.id;
  }

  for (const place of places) {
    for (const alias of place.normalizedAliases) placeIdByName[alias] = place.id;
  }

  return {
    people,
    places,
    peopleById,
    placesById,
    events: resolvedEvents,
    personIdByName,
    placeIdByName,
  };
}
