/**
 * LADO 3: COMUNICAÇÃO - Hooks Otimizados
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { HighPerformanceProcessor } from '@/lib/optimization/DataProcessor';
import { PerformanceMonitor } from '@/lib/monitoring/PerformanceMonitor';

interface QueryOptions {
  staleTime?: number;
  gcTime?: number;
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
}

/**
 * Hook otimizado para queries genéricas
 */
export function useOptimizedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options: QueryOptions = {}
) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const startTime = Date.now();
      const cached = queryClient.getQueryData<T>(queryKey);
      
      if (cached) {
        queryFn().then(freshData => {
          queryClient.setQueryData(queryKey, freshData);
        }).catch(() => {});
        return cached;
      }
      
      const result = await queryFn();
      PerformanceMonitor.recordLatency(Date.now() - startTime);
      return result;
    },
    staleTime: options.staleTime ?? 60 * 1000,
    gcTime: options.gcTime ?? 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
    enabled: options.enabled ?? true,
  });
}

/**
 * Hook para mutation otimizada
 */
export function useOptimizedMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    invalidateKeys?: string[][];
  } = {}
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
      HighPerformanceProcessor.invalidateCache(/supabase:/);
      options.onSuccess?.(data);
    },
    onError: options.onError,
  });
}

/**
 * Hook para estado memoizado
 */
export function useMemoizedState<T>(initialValue: T) {
  const [state, setState] = useState(initialValue);
  
  const setMemoizedState = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setState(prev => {
        const next = typeof updater === 'function' 
          ? (updater as (prev: T) => T)(prev)
          : updater;
        
        if (HighPerformanceProcessor.deepEqual(prev, next)) {
          return prev;
        }
        return next;
      });
    },
    []
  );
  
  const memoizedValue = useMemo(() => state, [state]);
  
  return [memoizedValue, setMemoizedState] as const;
}
