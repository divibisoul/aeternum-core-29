/**
 * Hook para usar o Projeto Clareira
 */

import { useState, useEffect, useCallback } from 'react';
import { ProjetoClareira, ClareiraBridge, type SystemMetrics } from '@/core/neural';

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

    ClareiraBridge.install();

    // Atualizar métricas periodicamente
    const interval = setInterval(() => {
      setMetrics(ProjetoClareira.getMetrics());
      setRunning(ProjetoClareira.running);
    }, 2000);

    return () => {
      clearInterval(interval);
      void Promise.resolve(ClareiraBridge.uninstall());
    };
  }, []);

  const injectStimulus = useCallback((data: string, criticality = 0.5) => {
    return ProjetoClareira.injectStimulus(data, criticality);
  }, []);

  const ingestPacket = useCallback((packet: Parameters<typeof ClareiraBridge.ingest>[0]) => ClareiraBridge.ingest(packet), []);

  const requestDecision = useCallback(async (action: string, context = 'general') => {
    return ProjetoClareira.requestDecision(action, context);
  }, []);

  return {
    metrics,
    running,
    status: ProjetoClareira.getStatus(),
    injectStimulus,
    requestDecision,
    ingestPacket,
    clareiraMetrics: ClareiraBridge.metrics(),
  };
}
