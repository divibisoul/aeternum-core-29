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

    // Atualizar métricas periodicamente
    const interval = setInterval(async () => {
      setMetrics(ProjetoClareira.getMetrics());
      setRunning(ProjetoClareira.running);
      try {
        await ProjetoClareira.syncStateToSara();
        await ProjetoClareira.dispatchVagalCommandToSara('NC-001', 'resume', {}, 0.1);
      } catch {
        // SARA is an external dependency; local Clareira continues operating.
      }
    }, 2000);

    return () => {
      clearInterval(interval);
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
