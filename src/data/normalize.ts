import { FORMS } from './forms';
import type { Event, RawSubmission } from './types';

// "38.4360,27.1435" — also tolerates spaces and ; separators just in case.
export function parseCoords(s: string | undefined): [number, number] | undefined {
  if (!s) return;
  const m = s.match(/(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)/);
  if (!m) return;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (!isFinite(lat) || !isFinite(lng)) return;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
  return [lat, lng];
}

// "DD-MM-YYYY HH:mm" — the format Jotform stores inside the answer field.
export function parseStoryTime(s: string | undefined): Date | undefined {
  if (!s) return;
  const m = s.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!m) return;
  const d = new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]);
  return isNaN(d.getTime()) ? undefined : d;
}

function ans(r: RawSubmission, qid: string): string {
  return r.answers?.[qid]?.answer?.trim() ?? '';
}

function apiDate(s: string): Date {
  const d = new Date(s.replace(' ', 'T'));
  return isNaN(d.getTime()) ? new Date(0) : d;
}

function normConfidence(s: string): Event['confidence'] | undefined {
  const v = s.toLowerCase();
  if (v === 'low' || v === 'medium' || v === 'high') return v;
  return undefined;
}

// Each mapper returns null for rows we can't trust (no usable timestamp, etc.).
// Filtering happens in loadCase so we can count drops.

export function toCheckin(r: RawSubmission): Event | null {
  const f = FORMS.checkins.fields;
  const at = parseStoryTime(ans(r, f.timestamp));
  if (!at) return null;
  return {
    id: r.id,
    kind: 'checkin',
    at,
    apiAt: apiDate(r.created_at),
    actors: [ans(r, f.fullName)].filter(Boolean),
    place: ans(r, f.location) || undefined,
    coords: parseCoords(ans(r, f.coords)),
    text: ans(r, f.note),
    source: r,
  };
}

export function toMessage(r: RawSubmission): Event | null {
  const f = FORMS.messages.fields;
  const at = parseStoryTime(ans(r, f.timestamp));
  if (!at) return null;
  return {
    id: r.id,
    kind: 'message',
    at,
    apiAt: apiDate(r.created_at),
    actors: [ans(r, f.from), ans(r, f.to)].filter(Boolean),
    text: ans(r, f.message),
    source: r,
  };
}

export function toSighting(r: RawSubmission): Event | null {
  const f = FORMS.sightings.fields;
  const at = parseStoryTime(ans(r, f.timestamp));
  if (!at) return null;
  return {
    id: r.id,
    kind: 'sighting',
    at,
    apiAt: apiDate(r.created_at),
    actors: [ans(r, f.personName), ans(r, f.seenWith)].filter(Boolean),
    place: ans(r, f.location) || undefined,
    coords: parseCoords(ans(r, f.coords)),
    text: ans(r, f.note),
    source: r,
  };
}

export function toNote(r: RawSubmission): Event | null {
  const f = FORMS.notes.fields;
  const at = parseStoryTime(ans(r, f.timestamp));
  if (!at) return null;
  return {
    id: r.id,
    kind: 'note',
    at,
    apiAt: apiDate(r.created_at),
    actors: [ans(r, f.fullName)].filter(Boolean),
    text: ans(r, f.note),
    source: r,
  };
}

// Tips are anonymous, so the suspect is the actor we surface — that way profiles can
// show "tips about this person" without us inventing a separate concept.
export function toTip(r: RawSubmission): Event | null {
  const f = FORMS.tips.fields;
  const at = parseStoryTime(ans(r, f.timestamp));
  if (!at) return null;
  return {
    id: r.id,
    kind: 'tip',
    at,
    apiAt: apiDate(r.created_at),
    actors: [ans(r, f.suspectName)].filter(Boolean),
    place: ans(r, f.location) || undefined,
    coords: parseCoords(ans(r, f.coords)),
    text: ans(r, f.tip),
    confidence: normConfidence(ans(r, f.confidence)),
    source: r,
  };
}
