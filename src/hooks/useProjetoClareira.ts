/**
 * Hook para usar o Projeto Clareira
 */

import { useState, useEffect, useCallback } from 'react';
import { ProjetoClareira, type SystemMetrics } from '@/core/neural';

export function useProjetoClareira() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    // Inicializar e iniciar
    if (!ProjetoClareira.initialized) {
      ProjetoClareira.initialize();
    }
    
    if (!ProjetoClareira.running) {
      ProjetoClareira.start();
    }
    
    setRunning(ProjetoClareira.running);

    const handleDeviceState = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail || typeof detail !== 'object') return;
      ProjetoClareira.updateDeviceState(detail);
    };

    window.addEventListener('soul:device-state', handleDeviceState);

    // Atualizar métricas periodicamente
    const interval = setInterval(async () => {
      setMetrics(ProjetoClareira.getMetrics());
      setRunning(ProjetoClareira.running);
      try {
        await ProjetoClareira.syncStateToSara();
        await ProjetoClareira.pullVagalCommandsFromSara();
      } catch {
        // SARA remains external; local Clareira continues operating on transport failure.
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('soul:device-state', handleDeviceState);
    };
  }, []);

  const injectStimulus = useCallback((data: string, criticality = 0.5) => {
    return ProjetoClareira.injectStimulus(data, criticality);
  }, []);

  const requestDecision = useCallback(async (action: string, context = 'general') => {
    return ProjetoClareira.requestDecision(action, context);
  }, []);

  return {
    metrics,
    running,
    status: ProjetoClareira.getStatus(),
    injectStimulus,
    requestDecision,
  };
}
