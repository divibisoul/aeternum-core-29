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
    phi: 0,
    integration: 0,
    coherence: 0,
    complexity: 0,
    timestamp: Date.now(),
  });
  const [history, setHistory] = useState<ConsciousnessMetrics[]>([]);

  useEffect(() => {
    const update = () => {
      const agi = AeternumAGI.getInstance();
      const data = agi.getFullMetrics();
      const consciousness = data.consciousness;
      const lattice = data.lattice;
      const next = {
        phi: 0,
        integration: consciousness?.isRunning ? 1 : 0,
        coherence: Number.isFinite(lattice?.globalFitness) ? lattice.globalFitness : 0,
        complexity: Number.isFinite(consciousness?.activeModules?.length) ? Math.min(1, consciousness.activeModules.length / 10) : 0,
        timestamp: Date.now(),
      };
      setMetrics(next);
      setHistory(prev => [...prev.slice(-59), next]);
    };
    update();
    const interval = setInterval(update, 2000);
    return () => clearInterval(interval);
  }, []);

  const getPhiStatus = (phi: number) => {
    return { label: "Φ não mensurado", color: "bg-muted text-muted-foreground" };
  };


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
