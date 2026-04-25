import { FORMS } from './forms';
import { fetchAllSubmissions } from './jotform';
import {
  toCheckin,
  toMessage,
  toNote,
  toSighting,
  toTip,
} from './normalize';
import { resolveCase } from './resolve';
import type { CaseFile, Event, EventKind, RawSubmission } from './types';

type Mapper = (r: RawSubmission) => Event | null;

const SOURCES: { kind: EventKind; formId: string; map: Mapper }[] = [
  { kind: 'checkin',  formId: FORMS.checkins.id,  map: toCheckin  },
  { kind: 'message',  formId: FORMS.messages.id,  map: toMessage  },
  { kind: 'sighting', formId: FORMS.sightings.id, map: toSighting },
  { kind: 'note',     formId: FORMS.notes.id,     map: toNote     },
  { kind: 'tip',      formId: FORMS.tips.id,      map: toTip      },
];

export async function loadCase(): Promise<CaseFile> {
  const fetched: Record<EventKind, number> = {
    checkin: 0, message: 0, sighting: 0, note: 0, tip: 0,
  };
  const dropped: Record<EventKind, number> = {
    checkin: 0, message: 0, sighting: 0, note: 0, tip: 0,
  };

  // Five forms in parallel — one failure rejects the whole load so the UI can show retry.
  const buckets = await Promise.all(
    SOURCES.map(async ({ kind, formId, map }) => {
      const rows = await fetchAllSubmissions(formId);
      fetched[kind] = rows.length;
      const events: Event[] = [];
      for (const r of rows) {
        const e = map(r);
        if (e) events.push(e);
        else dropped[kind]++;
      }
      return events;
    }),
  );

  // Dedupe by id in case Jotform pagination overlaps.
  const byId = new Map<string, Event>();
  for (const list of buckets) for (const e of list) byId.set(e.id, e);

  const events = [...byId.values()].sort((a, b) => a.at.getTime() - b.at.getTime());
  const resolution = resolveCase(events);

  return {
    events,
    resolution,
    stats: { fetched, dropped },
    fetchedAt: new Date(),
  };
}
