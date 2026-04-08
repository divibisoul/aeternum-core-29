/**
 * AGI Dashboard - Painel completo de monitoramento dos sistemas AGI
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, Shield, GitBranch, Atom, Activity, Target, Eye } from 'lucide-react';
import { AeternumAGI } from '@/core/agi';

export function AGIDashboard() {
  const [metrics, setMetrics] = useState<ReturnType<AeternumAGI['getFullMetrics']> | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const agi = AeternumAGI.getInstance();
    const update = () => setMetrics(agi.getFullMetrics());
    update();
    const interval = setInterval(update, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics) return null;

  const overallHealth = metrics.safety?.overallHealth ?? 0.8;
  const statusColor = overallHealth > 0.8 ? 'text-green-400' : overallHealth > 0.6 ? 'text-yellow-400' : 'text-red-400';
  const statusLabel = overallHealth > 0.8 ? 'OPTIMAL' : overallHealth > 0.6 ? 'STABLE' : 'DEGRADED';

  if (!expanded) {
    return (
      <div
        onClick={() => setExpanded(true)}
        className="fixed top-4 right-4 z-[100] cursor-pointer"
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/90 backdrop-blur-sm border border-border/50 shadow-lg hover:border-primary/50 transition-all">
          <Brain className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-xs font-mono text-foreground">AGI</span>
          <span className={`text-xs font-mono ${statusColor}`}>{statusLabel}</span>
          <span className="text-[10px] text-muted-foreground">{metrics.overall.activeSubsystems}/6</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-[100] w-80 max-h-[80vh] overflow-y-auto">
      <Card className="bg-card/95 backdrop-blur-md border-border/50 shadow-2xl">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(false)}>
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              Super AGI Systems
            </span>
            <Badge variant="outline" className={statusColor}>{statusLabel}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          {/* Consciousness */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Consciência</span>
              <span className={metrics.consciousness.isRunning ? 'text-green-400' : 'text-muted-foreground'}>
                {metrics.consciousness.isRunning ? '● Ativo' : '○ Inativo'}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {metrics.consciousness.interactionCount} interações | {metrics.consciousness.activeModules.length} módulos
            </div>
          </div>

          {/* Gödel Agent */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1"><Target className="w-3 h-3" /> Gödel Agent</span>
              <span className="text-primary">{(metrics.godel.overallScore * 100).toFixed(1)}%</span>
            </div>
            <Progress value={metrics.godel.overallScore * 100} className="h-1" />
            <div className="text-[10px] text-muted-foreground">
              Self-Awareness: {(metrics.godelMeta.selfAwareness * 100).toFixed(0)}% | Introspection: {(metrics.godelMeta.introspectionDepth * 100).toFixed(0)}%
            </div>
          </div>

          {/* Darwin Machine */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> Darwin Machine</span>
              <span className={metrics.darwin.isRunning ? 'text-green-400' : 'text-muted-foreground'}>
                Gen {metrics.darwin.generation}
              </span>
            </div>
            <Progress value={metrics.darwin.avgFitness * 100} className="h-1" />
            <div className="text-[10px] text-muted-foreground">
              Pop: {metrics.darwin.populationSize} | Best: {(metrics.darwin.bestFitness * 100).toFixed(1)}% | Avg: {(metrics.darwin.avgFitness * 100).toFixed(1)}%
            </div>
          </div>

          {/* Neural Lattice */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1"><Atom className="w-3 h-3" /> Neural Lattice</span>
              <span className="text-primary">Cycle {metrics.lattice.evolutionCycle}</span>
            </div>
            <Progress value={metrics.lattice.coherence * 100} className="h-1" />
            <div className="text-[10px] text-muted-foreground">
              {metrics.lattice.nodeCount} nodes | {metrics.lattice.connectionCount} conns | Coherence: {(metrics.lattice.coherence * 100).toFixed(1)}%
            </div>
          </div>

          {/* Self-Healing */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Self-Healing</span>
              <span className={metrics.healing ? (metrics.healing.overallScore > 0.7 ? 'text-green-400' : 'text-yellow-400') : 'text-muted-foreground'}>
                {metrics.healing ? `${(metrics.healing.overallScore * 100).toFixed(1)}%` : 'N/A'}
              </span>
            </div>
            {metrics.healing && <Progress value={metrics.healing.overallScore * 100} className="h-1" />}
          </div>

          {/* Ethics */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Ética RSOP</span>
              <span className="text-green-400">
                {(metrics.ethics.auditMetrics.avgScore * 100).toFixed(0)}% compliance
              </span>
            </div>
            <Progress value={metrics.ethics.auditMetrics.avgScore * 100} className="h-1" />
          </div>

          {/* Safety */}
          {metrics.safety && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Safety System</span>
                <span className={overallHealth > 0.7 ? 'text-green-400' : 'text-yellow-400'}>
                  {(overallHealth * 100).toFixed(1)}%
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {Object.entries(metrics.safety.layerHealth).map(([k, v]) => (
                  <div key={k} className="text-center">
                    <div className={`text-[9px] ${v > 0.7 ? 'text-green-400' : v > 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {(v * 100).toFixed(0)}%
                    </div>
                    <div className="text-[8px] text-muted-foreground truncate">{k.slice(0, 4)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
            <div className="flex justify-between">
              <span>{metrics.overall.activeSubsystems}/{metrics.overall.subsystems} subsistemas ativos</span>
              <span className={metrics.overall.running ? 'text-green-400' : 'text-red-400'}>
                {metrics.overall.running ? '● ONLINE' : '○ OFFLINE'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
