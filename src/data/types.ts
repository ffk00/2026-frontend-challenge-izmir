// Shape Jotform actually returns inside `content[]`.
export type RawAnswer = {
  name?: string;
  text?: string;
  type?: string;
  answer?: string;
};

export type RawSubmission = {
  id: string;
  form_id: string;
  created_at: string;
  answers: Record<string, RawAnswer>;
};

export type EventKind = 'checkin' | 'message' | 'sighting' | 'note' | 'tip';

export type Event = {
  id: string;
  kind: EventKind;
  at: Date;                       // story-time, parsed from the form's timestamp field
  apiAt: Date;                    // when Jotform recorded the row, kept for debugging
  actors: string[];               // raw name strings; resolution comes later
  place?: string;
  coords?: [number, number];
  text: string;
  confidence?: 'low' | 'medium' | 'high';
  source: RawSubmission;          // untouched original — useful for "show source" UX
};

export type LoadStats = {
  fetched: Record<EventKind, number>;
  dropped: Record<EventKind, number>;
};

export type PersonId = `person:${number}`;
export type PlaceId = `place:${number}`;

export type ResolvedPerson = {
  id: PersonId;
  name: string;
  aliases: string[];
  normalizedAliases: string[];
  eventIds: string[];
};

export type ResolvedPlace = {
  id: PlaceId;
  name: string;
  aliases: string[];
  normalizedAliases: string[];
  coords?: [number, number];
  eventIds: string[];
};

export type ResolvedEvent = {
  eventId: string;
  actorIds: PersonId[];
  placeId?: PlaceId;
};

export type CaseResolution = {
  people: ResolvedPerson[];
  places: ResolvedPlace[];
  peopleById: Record<PersonId, ResolvedPerson>;
  placesById: Record<PlaceId, ResolvedPlace>;
  events: Record<string, ResolvedEvent>;
  personIdByName: Record<string, PersonId>;
  placeIdByName: Record<string, PlaceId>;
};

export type CaseFile = {
  events: Event[];
  resolution: CaseResolution;
  stats: LoadStats;
  fetchedAt: Date;
};
