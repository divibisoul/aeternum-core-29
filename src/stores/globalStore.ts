/**
 * GLOBAL STATE STORE
 * 
 * Zustand store with persistence and undo/redo support.
 * Single source of truth for app-wide state.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';

export interface TelemetryState {
  latencyMs: number;
  tokensPerSecond: number;
  activeModules: number;
  memoryUsage: number;
  uptime: number;
  lastUpdated: number;
}

export interface ApiKeyState {
  provider: string;
  configured: boolean;
  lastValidated?: number;
}

export interface GlobalState {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // API Keys state
  apiKeys: ApiKeyState[];
  hasRequiredApiKeys: boolean;

  // Active session
  currentSessionId: string | null;

  // Telemetry
  telemetry: TelemetryState;

  // UI state
  sidebarOpen: boolean;
  activeModuleId: string | null;

  // Theme
  theme: 'dark' | 'light';

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setApiKeys: (keys: ApiKeyState[]) => void;
  addApiKey: (key: ApiKeyState) => void;
  removeApiKey: (provider: string) => void;
  setCurrentSessionId: (id: string | null) => void;
  updateTelemetry: (data: Partial<TelemetryState>) => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveModuleId: (id: string | null) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  reset: () => void;
}

const initialTelemetry: TelemetryState = {
  latencyMs: 0,
  tokensPerSecond: 0,
  activeModules: 0,
  memoryUsage: 0,
  uptime: 0,
  lastUpdated: Date.now(),
};

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  apiKeys: [],
  hasRequiredApiKeys: false,
  currentSessionId: null,
  telemetry: initialTelemetry,
  sidebarOpen: true,
  activeModuleId: null,
  theme: 'dark' as const,
};

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false,
      }),

      setLoading: (isLoading) => set({ isLoading }),

      setApiKeys: (apiKeys) => set({ 
        apiKeys,
        hasRequiredApiKeys: apiKeys.some(k => k.provider === 'openai' && k.configured),
      }),

      addApiKey: (key) => {
        const existing = get().apiKeys.filter(k => k.provider !== key.provider);
        const apiKeys = [...existing, key];
        set({ 
          apiKeys,
          hasRequiredApiKeys: apiKeys.some(k => k.provider === 'openai' && k.configured),
        });
      },

      removeApiKey: (provider) => {
        const apiKeys = get().apiKeys.filter(k => k.provider !== provider);
        set({ 
          apiKeys,
          hasRequiredApiKeys: apiKeys.some(k => k.provider === 'openai' && k.configured),
        });
      },

      setCurrentSessionId: (currentSessionId) => set({ currentSessionId }),

      updateTelemetry: (data) => set((state) => ({
        telemetry: {
          ...state.telemetry,
          ...data,
          lastUpdated: Date.now(),
        },
      })),

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      setActiveModuleId: (activeModuleId) => set({ activeModuleId }),

      setTheme: (theme) => set({ theme }),

      reset: () => set(initialState),
    }),
    {
      name: 'aeternum-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        // Don't persist sensitive data
      }),
    }
  )
);

// Selectors for optimized re-renders
export const selectUser = (state: GlobalState) => state.user;
export const selectIsAuthenticated = (state: GlobalState) => state.isAuthenticated;
export const selectIsLoading = (state: GlobalState) => state.isLoading;
export const selectApiKeys = (state: GlobalState) => state.apiKeys;
export const selectHasRequiredApiKeys = (state: GlobalState) => state.hasRequiredApiKeys;
export const selectTelemetry = (state: GlobalState) => state.telemetry;
export const selectActiveModuleId = (state: GlobalState) => state.activeModuleId;
