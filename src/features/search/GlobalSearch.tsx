import { useMemo, useState } from 'react';
import { levenshteinSimilarity } from '../../data/levenshtein';
import { normalizeEntityText } from '../../data/resolve';
import type { CaseFile, Event, PersonId, PlaceId } from '../../data/types';
import type { Selection } from '../caseViews/types';
import styles from './search.module.css';

type Result =
  | { type: 'person'; id: PersonId; title: string; detail: string; score: number }
  | { type: 'place'; id: PlaceId; title: string; detail: string; score: number }
  | { type: 'event'; id: string; title: string; detail: string; score: number };

type Props = {
  caseFile: CaseFile;
  onSelect: (selection: Selection) => void;
};

function eventLabel(event: Event): string {
  return `${event.kind} / ${event.at.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function scoreText(query: string, values: string[]): number {
  let best = 0;
  for (const value of values) {
    const normalized = normalizeEntityText(value);
    if (!normalized) continue;
    if (normalized.includes(query)) best = Math.max(best, 1);
    for (const token of normalized.split(' ')) {
      best = Math.max(best, levenshteinSimilarity(query, token) * 0.86);
    }
    best = Math.max(best, levenshteinSimilarity(query, normalized) * 0.92);
  }
  return best;
}

function buildResults(caseFile: CaseFile, rawQuery: string): Result[] {
  const query = normalizeEntityText(rawQuery);
  if (query.length < 2) return [];

  const people = caseFile.resolution.people.map((person): Result => ({
    type: 'person',
    id: person.id,
    title: person.name,
    detail: `${person.eventIds.length} events${person.aliases.length ? ` / ${person.aliases.join(', ')}` : ''}`,
    score: scoreText(query, [person.name, ...person.aliases, ...person.normalizedAliases]),
  }));

  const places = caseFile.resolution.places.map((place): Result => ({
    type: 'place',
    id: place.id,
    title: place.name,
    detail: `${place.eventIds.length} events${place.aliases.length ? ` / ${place.aliases.join(', ')}` : ''}`,
    score: scoreText(query, [place.name, ...place.aliases, ...place.normalizedAliases]),
  }));

  const events = caseFile.events.map((event): Result => ({
    type: 'event',
    id: event.id,
    title: eventLabel(event),
    detail: event.text || event.actors.join(', ') || event.place || 'No text',
    score: scoreText(query, [
      event.kind,
      event.text,
      event.place ?? '',
      event.confidence ?? '',
      ...event.actors,
    ]),
  }));

  return [...people, ...places, ...events]
    .filter((result) => result.score >= 0.72)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

export function GlobalSearch({ caseFile, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const results = useMemo(() => buildResults(caseFile, query), [caseFile, query]);
  const open = focused && query.trim().length >= 2;

  function choose(result: Result) {
    setQuery('');
    setFocused(false);
    onSelect({ type: result.type, id: result.id } as Selection);
  }

  return (
    <div className={styles.search}>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setQuery('');
            setFocused(false);
          }
          if (event.key === 'Enter' && results[0]) {
            choose(results[0]);
          }
        }}
        placeholder="Search people, aliases, places, events"
        aria-label="Search case file"
      />
      {open && (
        <div className={styles.results}>
          {results.length === 0 ? (
            <div className={styles.empty}>No matches</div>
          ) : (
            results.map((result) => (
              <button
                key={`${result.type}:${result.id}`}
                type="button"
                className={styles.result}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(result)}
              >
                <span className={styles.resultType}>{result.type}</span>
                <span>
                  <strong>{result.title}</strong>
                  <small>{result.detail}</small>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
