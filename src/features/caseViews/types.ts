import type { PersonId, PlaceId } from '../../data/types';

export type AppView = 'investigation' | 'timeline' | 'actors' | 'locations';

export type Selection =
  | { type: 'event'; id: string }
  | { type: 'person'; id: PersonId }
  | { type: 'place'; id: PlaceId };
