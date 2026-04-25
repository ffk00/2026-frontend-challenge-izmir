import type { CaseFile, Event, PersonId, PlaceId, ResolvedPerson } from '../../data/types';
import { Chip } from '../../components/Chip';
import { KindIcon } from '../timeline/KindIcon';
import type { Selection } from './types';
import styles from './caseViews.module.css';

type Props = {
  caseFile: CaseFile;
  selection: Selection | null;
  onClose: () => void;
  onSelectEvent: (eventId: string) => void;
  onOpenPerson: (personId: PersonId) => void;
  onOpenPlace: (placeId: PlaceId) => void;
};

const KIND_COPY: Record<Event['kind'], string> = {
  checkin: 'Check-in',
  message: 'Message',
  sighting: 'Sighting',
  note: 'Note',
  tip: 'Anonymous tip',
};

function formatTime(date: Date): string {
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMessageDay(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getEvent(caseFile: CaseFile, eventId: string): Event | undefined {
  return caseFile.events.find((event) => event.id === eventId);
}

function conversationKey(actorIds: PersonId[]): string | null {
  if (actorIds.length < 2) return null;
  return [...actorIds.slice(0, 2)].sort().join('|');
}

function getConversationEvents(caseFile: CaseFile, selectedEvent: Event): Event[] {
  if (selectedEvent.kind !== 'message') return [selectedEvent];
  const selectedKey = conversationKey(caseFile.resolution.events[selectedEvent.id]?.actorIds ?? []);
  if (!selectedKey) return [selectedEvent];

  return caseFile.events
    .filter((event) => {
      if (event.kind !== 'message') return false;
      return conversationKey(caseFile.resolution.events[event.id]?.actorIds ?? []) === selectedKey;
    })
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}

function EventList({
  caseFile,
  eventIds,
  onSelectEvent,
}: {
  caseFile: CaseFile;
  eventIds: string[];
  onSelectEvent: (eventId: string) => void;
}) {
  const events = eventIds
    .map((id) => getEvent(caseFile, id))
    .filter((event): event is Event => Boolean(event))
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  return (
    <ol className={styles.panelEventList}>
      {events.map((event) => (
        <li key={event.id}>
          <button type="button" onClick={() => onSelectEvent(event.id)}>
            <span>{formatTime(event.at)}</span>
            <span>{KIND_COPY[event.kind]}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function ConversationThread({
  caseFile,
  selectedEvent,
  eventActors,
  onOpenPerson,
}: {
  caseFile: CaseFile;
  selectedEvent: Event;
  eventActors: ResolvedPerson[];
  onOpenPerson: (personId: PersonId) => void;
}) {
  const messages = getConversationEvents(caseFile, selectedEvent);
  return (
    <div className={styles.messageThread} aria-label="Message transcript">
      {messages.map((message, index) => {
        const day = formatMessageDay(message.at);
        const previous = messages[index - 1];
        const showDay = !previous || day !== formatMessageDay(previous.at);

        const actorIds = caseFile.resolution.events[message.id]?.actorIds ?? [];
        const sender = actorIds[0] ? caseFile.resolution.peopleById[actorIds[0]] : undefined;
        const receiver = actorIds[1] ? caseFile.resolution.peopleById[actorIds[1]] : undefined;
        const selected = message.id === selectedEvent.id;

        return (
          <div key={message.id} className={styles.messageGroup}>
            {showDay && <div className={styles.messageDayPill}>{day}</div>}
            <div className={`${styles.messageBubbleRow} ${selected ? styles.messageSelected : ''}`}>
              <button
                type="button"
                className={styles.messageAvatar}
                onClick={() => sender && onOpenPerson(sender.id)}
                disabled={!sender}
                aria-label={sender ? `Open ${sender.name}` : 'Unknown sender'}
              >
                {(sender?.name ?? message.actors[0] ?? '?').slice(0, 1)}
              </button>
              <div className={styles.messageStack}>
                <div className={styles.messageBubble}>
                  <p>{message.text || 'No message text provided.'}</p>
                </div>
                <div className={styles.messageBubbleMeta}>
                  <span>
                    {sender?.name ?? message.actors[0] ?? 'Unknown'}
                    {receiver && ` to ${receiver.name}`}
                  </span>
                  <span>{formatMessageTime(message.at)}</span>
                  {selected && <span>Selected</span>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {messages.length === 1 && eventActors.length < 2 && (
        <div className={styles.messageMuted}>No linked conversation found for this message.</div>
      )}
    </div>
  );
}

export function EntityPanel({
  caseFile,
  selection,
  onClose,
  onSelectEvent,
  onOpenPerson,
  onOpenPlace,
}: Props) {
  if (!selection) return null;

  const event = selection.type === 'event' ? getEvent(caseFile, selection.id) : undefined;
  const person = selection.type === 'person' ? caseFile.resolution.peopleById[selection.id] : undefined;
  const place = selection.type === 'place' ? caseFile.resolution.placesById[selection.id] : undefined;
  const resolvedEvent = event ? caseFile.resolution.events[event.id] : undefined;
  const eventActors = resolvedEvent?.actorIds
    .map((id) => caseFile.resolution.peopleById[id])
    .filter((actor): actor is ResolvedPerson => Boolean(actor)) ?? [];
  const eventPlace = resolvedEvent?.placeId
    ? caseFile.resolution.placesById[resolvedEvent.placeId]
    : undefined;

  return (
    <aside className={styles.panel} aria-label="Selected case detail">
      <div className={styles.panelTop}>
        <div>
          <div className={styles.panelKicker}>{selection.type}</div>
          <h2>{event ? KIND_COPY[event.kind] : person?.name ?? place?.name ?? 'Unknown'}</h2>
        </div>
        <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Close panel">
          X
        </button>
      </div>

      {event && (
        <div className={styles.panelBody}>
          {event.kind === 'message' ? (
            <div className={styles.messageApp}>
              <div className={styles.messageAppBar}>
                <div className={styles.messageConversation}>
                  {eventActors.length > 0 ? (
                    eventActors.map((actor) => (
                      <button key={actor.id} type="button" onClick={() => onOpenPerson(actor.id)}>
                        <Chip name={actor.name} toneKey={actor.id} />
                      </button>
                    ))
                  ) : (
                    <span className={styles.messageMuted}>Unknown participants</span>
                  )}
                </div>
                <span>{formatMessageDay(event.at)}</span>
              </div>

              <ConversationThread
                caseFile={caseFile}
                selectedEvent={event}
                eventActors={eventActors}
                onOpenPerson={onOpenPerson}
              />

              <div className={styles.messageFooter}>
                <KindIcon kind={event.kind} />
                <span>{formatTime(event.at)}</span>
                {event.confidence && <span>{event.confidence} confidence</span>}
              </div>

              {eventPlace && (
                <button
                  type="button"
                  className={styles.messageLocation}
                  onClick={() => onOpenPlace(eventPlace.id)}
                >
                  <span>Location</span>
                  <strong>{eventPlace.name}</strong>
                </button>
              )}

              {!event.coords && <div className={styles.mutedFlag}>No coordinates on this event.</div>}
            </div>
          ) : (
            <>
              <div className={styles.eventMeta}>
                <KindIcon kind={event.kind} />
                <span>{formatTime(event.at)}</span>
                {event.confidence && <span>{event.confidence} confidence</span>}
              </div>
              <p className={styles.panelQuote}>{event.text || 'No note text provided.'}</p>
              <div className={styles.panelSection}>
                <h3>Actors</h3>
                <div className={styles.inlineList}>
                  {eventActors.map((actor) => (
                    <button key={actor.id} type="button" onClick={() => onOpenPerson(actor.id)}>
                      <Chip name={actor.name} toneKey={actor.id} />
                    </button>
                  ))}
                </div>
              </div>
              {eventPlace && (
                <div className={styles.panelSection}>
                  <h3>Location</h3>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => onOpenPlace(eventPlace.id)}
                  >
                    {eventPlace.name}
                  </button>
                </div>
              )}
              {!event.coords && <div className={styles.mutedFlag}>No coordinates on this event.</div>}
            </>
          )}
        </div>
      )}

      {person && (
        <div className={styles.panelBody}>
          <div className={styles.identityLine}>
            <Chip name={person.name} toneKey={person.id} />
            <span>{person.eventIds.length} events</span>
          </div>
          <div className={styles.panelSection}>
            <h3>Aliases</h3>
            <p>{person.aliases.length ? person.aliases.join(', ') : 'No aliases detected.'}</p>
          </div>
          <div className={styles.panelSection}>
            <h3>Events</h3>
            <EventList caseFile={caseFile} eventIds={person.eventIds} onSelectEvent={onSelectEvent} />
          </div>
        </div>
      )}

      {place && (
        <div className={styles.panelBody}>
          <div className={styles.identityLine}>
            <strong>{place.name}</strong>
            <span>{place.eventIds.length} events</span>
          </div>
          {place.coords && (
            <div className={styles.coords}>
              {place.coords[0].toFixed(5)}, {place.coords[1].toFixed(5)}
            </div>
          )}
          <div className={styles.panelSection}>
            <h3>Aliases</h3>
            <p>{place.aliases.length ? place.aliases.join(', ') : 'No aliases detected.'}</p>
          </div>
          <div className={styles.panelSection}>
            <h3>Events</h3>
            <EventList caseFile={caseFile} eventIds={place.eventIds} onSelectEvent={onSelectEvent} />
          </div>
        </div>
      )}
    </aside>
  );
}
