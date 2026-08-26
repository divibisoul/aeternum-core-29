import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Brain, Network, RefreshCw, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type Nucleus = 'N01' | 'N02' | 'N03' | 'N04' | 'N05' | 'N06';
type ProbeState = 'LOCAL' | 'READY' | 'OFFLINE' | 'UNCONFIGURED';

type Runtime = {
  nucleus: Nucleus;
  endpoint?: string;
  state: ProbeState;
  capabilities: string[];
  latencyMs?: number;
};

const nuclei: Nucleus[] = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06'];

function endpointFor(nucleus: Nucleus): string | undefined {
  if (nucleus === 'N01') return undefined;
  return import.meta.env[`VITE_SOUL_${nucleus}_ENDPOINT`];
}

async function probe(nucleus: Nucleus): Promise<Runtime> {
  const endpoint = endpointFor(nucleus);
  if (nucleus === 'N01') return { nucleus, state: 'LOCAL', capabilities: [] };
  if (!endpoint) return { nucleus, state: 'UNCONFIGURED', capabilities: [] };

  const started = performance.now();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);
  try {
    const id = crypto.randomUUID();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        protocol: 'soul-mesh/1', id, correlationId: id,
        source: 'N01', target: nucleus, kind: 'request',
        capability: 'mesh.capabilities', payload: {},
        timestamp: new Date().toISOString(), channelId: `${nucleus}.IN.N01`,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.proof !== 'EXECUTED') {
      return { nucleus, endpoint, state: 'OFFLINE', capabilities: [], latencyMs: Math.round(performance.now() - started) };
    }
    return {
      nucleus, endpoint, state: 'READY',
      capabilities: Array.isArray(data?.payload?.capabilities) ? data.payload.capabilities : [],
      latencyMs: Math.round(performance.now() - started),
    };
  } catch {
    return { nucleus, endpoint, state: 'OFFLINE', capabilities: [], latencyMs: Math.round(performance.now() - started) };
  } finally {
    window.clearTimeout(timeout);
  }
}

export function SoulPilotCockpit() {
  const [runtimes, setRuntimes] = useState<Runtime[]>([]);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const results = await Promise.all(nuclei.map(probe));
      setRuntimes(results);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const totals = useMemo(() => ({
    ready: runtimes.filter(r => r.state === 'READY' || r.state === 'LOCAL').length,
    capabilities: runtimes.reduce((sum, r) => sum + r.capabilities.length, 0),
  }), [runtimes]);

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs flex items-center gap-2 font-mono">
              <Brain className="h-4 w-4 text-primary" /> SOUL PILOT / GPU COCKPIT
              <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={() => void refresh()} disabled={busy}>
                <RefreshCw className={cn('h-3.5 w-3.5', busy && 'animate-spin')} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 grid grid-cols-2 gap-2 text-[9px] font-mono">
            <div className="glass rounded p-2"><Network className="h-3 w-3 inline mr-1" />60 directional channels</div>
            <div className="glass rounded p-2"><Zap className="h-3 w-3 inline mr-1" />{totals.capabilities} discovered capabilities</div>
            <div className="glass rounded p-2"><Activity className="h-3 w-3 inline mr-1" />{totals.ready}/6 runtime reachable</div>
            <div className="glass rounded p-2">Pilot: affinity + parallel dispatch</div>
          </CardContent>
        </Card>

        {nuclei.map(nucleus => {
          const runtime = runtimes.find(r => r.nucleus === nucleus);
          const state = runtime?.state ?? 'UNCONFIGURED';
          const positive = state === 'READY' || state === 'LOCAL';
          return (
            <Card key={nucleus} className="border-border/30 bg-card/50">
              <CardContent className="p-2.5">
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className={cn('h-2 w-2 rounded-full', positive ? 'bg-emerald-400' : state === 'OFFLINE' ? 'bg-red-400' : 'bg-amber-400')} />
                  <strong>{nucleus}</strong>
                  <Badge variant="outline" className="ml-auto text-[8px]">{state}</Badge>
                  {runtime?.latencyMs != null && <span className="text-muted-foreground">{runtime.latencyMs}ms</span>}
                </div>
                <div className="mt-2 text-[9px] text-muted-foreground break-all">
                  {runtime?.endpoint ?? (nucleus === 'N01' ? 'APK / local hybrid gateway' : 'endpoint not configured')}
                </div>
                {runtime?.capabilities.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {runtime.capabilities.map(cap => <Badge key={cap} variant="secondary" className="text-[8px]">{cap}</Badge>)}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}

        <div className="text-[8px] text-muted-foreground font-mono leading-relaxed">
          READY means a live capability-discovery response was received. LOCAL means N01 is the APK gateway. UNCONFIGURED/OFFLINE are not treated as connected. The cockpit never promotes source-code presence to live connectivity.
        </div>
      </div>
    </ScrollArea>
  );
}
