import { useEffect, useMemo, useState } from 'react';

type HeartbeatState = 'ONLINE' | 'STALE' | 'BLOCKED' | 'ERROR';

export interface HeartbeatNucleus {
  id: string;
  state: HeartbeatState;
  lastHeartbeatMs: number;
  latencyMs: number | null;
  capabilities: string[];
  metrics: Record<string, number | string | boolean | null>;
}

export interface HeartbeatAggregate {
  type: 'heartbeat.aggregate';
  timestamp: number;
  nuclei: HeartbeatNucleus[];
}

interface EngineeringPanelProps {
  websocketUrl?: string;
}

export function EngineeringPanel({ websocketUrl = '' }: EngineeringPanelProps) {
  const [aggregate, setAggregate] = useState<HeartbeatAggregate | null>(null);
  const [state, setState] = useState<HeartbeatState>('BLOCKED');
  const [ageMs, setAgeMs] = useState(0);

  useEffect(() => {
    if (!websocketUrl.trim()) {
      setState('BLOCKED');
      setAggregate(null);
      return;
    }

    const socket = new WebSocket(websocketUrl);
    const onOpen = () => setState('ONLINE');
    const onMessage = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as HeartbeatAggregate;
        if (payload.type !== 'heartbeat.aggregate' || !Array.isArray(payload.nuclei)) {
          setState('ERROR');
          return;
        }
        setAggregate(payload);
        setState('ONLINE');
      } catch {
        setState('ERROR');
      }
    };
    const onError = () => setState('ERROR');
    const onClose = () => {
      if (state !== 'ERROR') setState('STALE');
    };

    socket.addEventListener('open', onOpen);
    socket.addEventListener('message', onMessage);
    socket.addEventListener('error', onError);
    socket.addEventListener('close', onClose);

    return () => {
      socket.removeEventListener('open', onOpen);
      socket.removeEventListener('message', onMessage);
      socket.removeEventListener('error', onError);
      socket.removeEventListener('close', onClose);
      socket.close();
    };
  }, [websocketUrl]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setAgeMs(aggregate ? Math.max(0, Date.now() - aggregate.timestamp) : 0);
    }, 100);
    return () => window.clearInterval(timer);
  }, [aggregate]);

  const active = useMemo(
    () => aggregate?.nuclei.filter(n => n.state === 'ONLINE').length ?? 0,
    [aggregate],
  );

  return (
    <section aria-label="Engineering Panel" className="space-y-3 rounded-lg border p-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Engineering Panel</h2>
          <p className="text-xs text-muted-foreground">
            Fonte: heartbeat.aggregate via WebSocket
          </p>
        </div>
        <span className="text-xs font-mono">{state}</span>
      </header>

      {aggregate ? (
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span>Último aggregate</span>
            <span className="font-mono">{ageMs}ms</span>
          </div>
          <div className="flex justify-between">
            <span>Núcleos ONLINE</span>
            <span className="font-mono">{active}/{aggregate.nuclei.length}</span>
          </div>
          {aggregate.nuclei.map(nucleus => (
            <div key={nucleus.id} className="rounded border p-2">
              <div className="flex justify-between">
                <span>{nucleus.id}</span>
                <span>{nucleus.state}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>latência</span>
                <span className="font-mono">
                  {nucleus.latencyMs === null ? 'UNMEASURABLE' : nucleus.latencyMs + 'ms'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded border border-dashed p-3 text-xs">
          Métricas reais não disponíveis: configure um endpoint WebSocket que publique
          <code className="mx-1">heartbeat.aggregate</code>.
          Nenhum valor sintético é exibido.
        </div>
      )}
    </section>
  );
}
