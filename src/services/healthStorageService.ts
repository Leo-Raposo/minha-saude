import { INITIAL_HEALTH_DATA } from '../data/mockHealthData';
import { HealthState } from '../types/health';

const STORAGE_KEY = 'minha-saude:v2:health-db';
const DB_SCHEMA_VERSION = 2;

interface PersistedHealthDb {
  version: number;
  updatedAt: string;
  data: HealthState;
}

/**
 * Local simulated database layer backed by localStorage (schema v2).
 * Structured with versioned envelope + JSON export/import so it can later be
 * swapped for Supabase / IndexedDB / SQLite with zero UI changes.
 */
export const healthStorageService = {
  load(): HealthState {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return INITIAL_HEALTH_DATA;

      const parsed = JSON.parse(raw) as PersistedHealthDb;
      const data = parsed?.data;

      if (
        !parsed ||
        parsed.version !== DB_SCHEMA_VERSION ||
        !data ||
        !Array.isArray(data.biomarkers) ||
        !Array.isArray(data.bioimpedanceHistory) ||
        data.bioimpedanceHistory.length === 0
      ) {
        return INITIAL_HEALTH_DATA;
      }

      return {
        ...data,
        scaleHistory:
          Array.isArray(data.scaleHistory) && data.scaleHistory.length > 0
            ? data.scaleHistory
            : INITIAL_HEALTH_DATA.scaleHistory,
      };
    } catch {
      return INITIAL_HEALTH_DATA;
    }
  },

  save(state: HealthState): void {
    try {
      const envelope: PersistedHealthDb = {
        version: DB_SCHEMA_VERSION,
        updatedAt: new Date().toISOString(),
        data: state,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    } catch {
      // Ignore quota errors in restricted environments
    }
  },

  exportJson(state: HealthState): string {
    const envelope: PersistedHealthDb = {
      version: DB_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      data: state,
    };
    return JSON.stringify(envelope, null, 2);
  },

  reset(): HealthState {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    return INITIAL_HEALTH_DATA;
  },
};
