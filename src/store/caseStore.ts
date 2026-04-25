import { createContext, createElement, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { loadCase } from '../data/loadCase';
import type { CaseFile } from '../data/types';

type Status = 'idle' | 'loading' | 'ready' | 'error';

type CaseState = {
  status: Status;
  caseFile: CaseFile | null;
  error: string | null;
  reload: () => void;
};

const Ctx = createContext<CaseState | null>(null);

export function CaseProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [caseFile, setCaseFile] = useState<CaseFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadCase()
      .then((file) => {
        if (cancelled) return;
        setCaseFile(file);
        setStatus('ready');
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setStatus('error');
      });
    return () => { cancelled = true; };
  }, [tick]);

  const value: CaseState = {
    status,
    caseFile,
    error,
    reload: () => {
      setStatus('loading');
      setError(null);
      setTick((n) => n + 1);
    },
  };
  return createElement(Ctx.Provider, { value }, children);
}

export function useCase(): CaseState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCase must be used inside <CaseProvider>');
  return v;
}
