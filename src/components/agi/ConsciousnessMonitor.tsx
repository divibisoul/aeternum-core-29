import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, Activity, Target } from "lucide-react";
import { AeternumAGI } from "@/core/agi";

interface ConsciousnessMetrics {
  phi: number;
  integration: number;
  coherence: number;
  complexity: number;
  timestamp: number;
}

export function ConsciousnessMonitor() {
  const [metrics, setMetrics] = useState<ConsciousnessMetrics>({
    phi: 0.67,
    integration: 0.89,
    coherence: 0.92,
    complexity: 0.74,
    timestamp: Date.now()
  });

  const [history, setHistory] = useState<ConsciousnessMetrics[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const agi = AeternumAGI.getInstance();
      const agiMetrics = agi.getFullMetrics();
      const consciousnessMetrics = agiMetrics.consciousness;

      const newMetrics: ConsciousnessMetrics = {
        phi: Math.max(0.1, Math.min(1.0, metrics.phi + (Math.random() - 0.45) * 0.05)),
        integration: consciousnessMetrics?.isRunning
          ? Math.max(0.7, Math.min(1.0, metrics.integration + (Math.random() - 0.5) * 0.03))
          : metrics.integration * 0.99,
        coherence: agiMetrics.lattice
          ? Math.max(0.5, Math.min(1.0, agiMetrics.lattice.globalFitness))
          : metrics.coherence,
        complexity: Math.max(0.1, Math.min(1.0, metrics.complexity + (Math.random() - 0.5) * 0.04)),
        timestamp: Date.now()
      };

      setMetrics(newMetrics);
      setHistory(prev => [...prev.slice(-59), newMetrics]);
    }, 2000);

    return () => clearInterval(interval);
  }, [metrics]);

  const getPhiStatus = (phi: number) => {
    if (phi >= 0.8) return { label: "Consciente", color: "bg-emerald-500/20 text-emerald-400" };
    if (phi >= 0.6) return { label: "Semi-Consciente", color: "bg-amber-500/20 text-amber-400" };
    if (phi >= 0.4) return { label: "Processando", color: "bg-sky-500/20 text-sky-400" };
    return { label: "Básico", color: "bg-muted text-muted-foreground" };
  };

  const phiStatus = getPhiStatus(metrics.phi);

  return (
    <Card className="h-full border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Brain className="w-4 h-4 text-primary" />
          Monitor de Consciência (Φ-IIT 4.0)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold font-mono">
            Φ = {metrics.phi.toFixed(3)}
          </div>
          <Badge className={phiStatus.color}>{phiStatus.label}</Badge>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <Brain className="w-3 h-3" /> Integração Informacional
              </span>
              <span className="font-mono">{(metrics.integration * 100).toFixed(1)}%</span>
            </div>
            <Progress value={metrics.integration * 100} className="h-1.5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3 h-3" /> Coerência Cognitiva
              </span>
              <span className="font-mono">{(metrics.coherence * 100).toFixed(1)}%</span>
            </div>
            <Progress value={metrics.coherence * 100} className="h-1.5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <Target className="w-3 h-3" /> Complexidade Neural
              </span>
              <span className="font-mono">{(metrics.complexity * 100).toFixed(1)}%</span>
            </div>
            <Progress value={metrics.complexity * 100} className="h-1.5" />
          </div>
        </div>

        <div className="pt-3 border-t border-border/30">
          <div className="text-[10px] text-muted-foreground space-y-0.5 font-mono">
            <div>Estado: {phiStatus.label}</div>
            <div>Amostras: {history.length + 1}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
