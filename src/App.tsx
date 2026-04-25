import { useEffect, useState } from 'react';
import { CaseProvider, useCase } from './store/caseStore';
import { LoadingScreen } from './components/LoadingScreen';
import { BriefingModal } from './features/briefing/BriefingModal';
import { Timeline } from './features/timeline/Timeline';
import { InvestigationView } from './features/caseViews/InvestigationView';
import { ActorsView, LocationsView } from './features/caseViews/DirectoryViews';
import { EntityPanel } from './features/caseViews/EntityPanel';
import type { AppView, Selection } from './features/caseViews/types';
import { GlobalSearch } from './features/search/GlobalSearch';
import podoMark from './assets/brand/saving_podo_header.png';
import './App.css';

const NAV_ITEMS: { id: AppView; label: string }[] = [
  { id: 'investigation', label: 'Investigation' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'actors', label: 'Actors' },
  { id: 'locations', label: 'Locations' },
];

function CaseShell() {
  const { status, caseFile, error, reload } = useCase();
  const [briefingDismissed, setBriefingDismissed] = useState(false);
  const [view, setView] = useState<AppView>('investigation');
  const [selection, setSelection] = useState<Selection | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelection(null);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (status === 'loading' || status === 'idle') {
    return <LoadingScreen />;
  }

  if (status === 'error') {
    return (
      <div className="error">
        <h2>Couldn't load the case file.</h2>
        <p>{error}</p>
        <button className="retry" onClick={reload}>Retry</button>
      </div>
    );
  }

  const file = caseFile!;
  const fetchedTotal = Object.values(file.stats.fetched).reduce((a, b) => a + b, 0);
  const droppedTotal = Object.values(file.stats.dropped).reduce((a, b) => a + b, 0);

  function selectEvent(eventId: string) {
    setSelectedEventId(eventId);
    setSelection({ type: 'event', id: eventId });
  }

  function selectFromSearch(nextSelection: Selection) {
    setSelection(nextSelection);
    if (nextSelection.type === 'event') {
      setSelectedEventId(nextSelection.id);
      setView('investigation');
    }
    if (nextSelection.type === 'person') setView('actors');
    if (nextSelection.type === 'place') setView('locations');
  }

  return (
    <>
      {!briefingDismissed && (
        <BriefingModal
          totalEvents={file.events.length}
          onDismiss={() => setBriefingDismissed(true)}
        />
      )}
      <header className="topbar">
        <div className="brand">
          <img className="brandMark" src={podoMark} alt="" />
          <div>
            <div className="brandName">Saving Podo</div>
            <div className="brandSub">Detective platform</div>
          </div>
        </div>
        <nav className="primaryNav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={view === item.id ? 'active' : ''}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <GlobalSearch caseFile={file} onSelect={selectFromSearch} />
        <div className="stats">
          <span className="eventsStat">{file.events.length} events</span>
          <button
            type="button"
            className="statsInfo"
            title="Loaded events after dropped invalid rows"
            aria-label="Loaded events after dropped invalid rows"
            aria-expanded={statsOpen}
            onClick={() => setStatsOpen((open) => !open)}
          >
            i
          </button>
          {statsOpen && (
            <div className="statsPopover">
              <div><strong>{fetchedTotal}</strong> fetched</div>
              <div><strong>{droppedTotal}</strong> dropped</div>
            </div>
          )}
        </div>
      </header>
      <main className="main">
        {view === 'investigation' && (
          <InvestigationView
            caseFile={file}
            selectedEventId={selectedEventId}
            onSelectEvent={selectEvent}
            onOpenPlace={(id) => setSelection({ type: 'place', id })}
          />
        )}
        {view === 'timeline' && (
          <Timeline
            events={file.events}
            resolution={file.resolution}
            selectedEventId={selectedEventId}
            onEventSelect={selectEvent}
          />
        )}
        {view === 'actors' && (
          <ActorsView caseFile={file} onOpenPerson={(id) => setSelection({ type: 'person', id })} />
        )}
        {view === 'locations' && (
          <LocationsView caseFile={file} onOpenPlace={(id) => setSelection({ type: 'place', id })} />
        )}
      </main>
      <EntityPanel
        caseFile={file}
        selection={selection}
        onClose={() => setSelection(null)}
        onSelectEvent={selectEvent}
        onOpenPerson={(id) => setSelection({ type: 'person', id })}
        onOpenPlace={(id) => setSelection({ type: 'place', id })}
      />
    </>
  );
}

export default function App() {
  return (
    <CaseProvider>
      <CaseShell />
    </CaseProvider>
  );
}
