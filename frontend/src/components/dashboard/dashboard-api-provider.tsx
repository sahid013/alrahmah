'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { DashboardApi } from '@/lib/dashboard/api';
import { createLocalDashboardApi } from '@/lib/dashboard/local-api';

const DashboardApiContext = createContext<DashboardApi | null>(null);

/**
 * Provides the dashboard data source. THE single swap point: replace
 * `createLocalDashboardApi()` with the Supabase / backend implementation of `DashboardApi`.
 */
export function DashboardApiProvider({ children }: { children: ReactNode }) {
  const [api] = useState(createLocalDashboardApi);
  return <DashboardApiContext.Provider value={api}>{children}</DashboardApiContext.Provider>;
}

export function useDashboardApi(): DashboardApi {
  const api = useContext(DashboardApiContext);
  if (!api) throw new Error('useDashboardApi must be used inside <DashboardApiProvider>');
  return api;
}

/**
 * Load data from the API with loading/error state and a `reload` function. `deps` are the
 * values the request depends on (JSON-serialisable); it re-runs when they change.
 */
export function useDashboardQuery<T>(load: (api: DashboardApi) => Promise<T>, deps: unknown[]) {
  const api = useDashboardApi();
  const [tick, setTick] = useState(0);
  const request = `${JSON.stringify(deps)}#${tick}`;
  const [result, setResult] = useState<{ request: string; data?: T; error?: Error }>();
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    let cancelled = false;
    loadRef
      .current(api)
      .then((data) => !cancelled && setResult({ request, data }))
      .catch(
        (e: unknown) =>
          !cancelled &&
          setResult({ request, error: e instanceof Error ? e : new Error(String(e)) }),
      );
    return () => {
      cancelled = true;
    };
  }, [api, request]);

  return {
    /** Last loaded data (kept while a refresh is in flight, so screens don't flash empty). */
    data: result?.data,
    error: result?.request === request ? result.error : undefined,
    loading: result?.request !== request,
    reload: useCallback(() => setTick((t) => t + 1), []),
  };
}
