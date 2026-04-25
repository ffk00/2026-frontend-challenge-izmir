import { API_KEYS } from './forms';
import type { RawSubmission } from './types';

const BASE = 'https://api.jotform.com';
const PAGE_SIZE = 1000;          // Jotform's hard cap
const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;

// Round-robin so no single key takes the whole load.
let keyCursor = 0;
function nextKey(): string {
  if (API_KEYS.length === 0) throw new Error('No Jotform API keys configured');
  const k = API_KEYS[keyCursor % API_KEYS.length];
  keyCursor++;
  return k;
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

// Retries only on network errors and 5xx/429 — not on 4xx-other (those are bugs, not flakes).
async function fetchPage(formId: string, offset: number): Promise<RawSubmission[]> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const key = nextKey();
    const url = `${BASE}/form/${formId}/submissions?apiKey=${key}&limit=${PAGE_SIZE}&offset=${offset}`;
    try {
      const res = await fetchWithTimeout(url);
      if (res.ok) {
        const json = await res.json();
        return (json.content ?? []) as RawSubmission[];
      }
      if (res.status >= 500 || res.status === 429) {
        lastErr = new Error(`Jotform ${res.status} on ${formId}`);
      } else {
        throw new Error(`Jotform ${res.status} on ${formId}`);
      }
    } catch (e) {
      lastErr = e;
    }
    // Backoff: 200ms, 600ms, 1.8s
    await new Promise((r) => setTimeout(r, 200 * Math.pow(3, attempt)));
  }
  throw lastErr ?? new Error('Unknown fetch failure');
}

// Pulls every page until the API returns a short page.
export async function fetchAllSubmissions(formId: string): Promise<RawSubmission[]> {
  const all: RawSubmission[] = [];
  let offset = 0;
  while (true) {
    const page = await fetchPage(formId, offset);
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}
