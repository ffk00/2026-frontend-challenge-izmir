// Single source of truth for form IDs and their qid -> field mappings.
// If Jotform schema changes, only this file should need touching.

export const FORMS = {
  checkins: {
    id: '261134527667966',
    fields: {
      fullName: '1',
      location: '2',
      coords: '3',
      timestamp: '4',
      note: '5',
    },
  },
  messages: {
    id: '261133651963962',
    fields: {
      from: '1',
      to: '2',
      message: '3',
      timestamp: '4',
    },
  },
  sightings: {
    id: '261133720555956',
    fields: {
      personName: '1',
      seenWith: '2',
      location: '3',
      coords: '4',
      timestamp: '5',
      note: '6',
    },
  },
  notes: {
    id: '261134449238963',
    fields: {
      fullName: '1',
      note: '2',
      timestamp: '3',
    },
  },
  tips: {
    id: '261134430330946',
    fields: {
      suspectName: '1',
      location: '2',
      coords: '3',
      timestamp: '4',
      tip: '5',
      confidence: '6',
    },
  },
} as const;

// Keys come from .env.local and ship with the bundle — fine for this hackathon.
const rawKeys = import.meta.env.VITE_JOTFORM_KEYS ?? '';
export const API_KEYS: string[] = rawKeys
  .split(',')
  .map((k: string) => k.trim())
  .filter(Boolean);

if (API_KEYS.length === 0) {
  console.warn('No Jotform API keys found. Set VITE_JOTFORM_KEYS in .env.local');
}
