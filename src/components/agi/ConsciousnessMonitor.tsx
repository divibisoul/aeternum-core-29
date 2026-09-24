import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, Activity, Target } from "lucide-react";
import { ConscienciaAlgoritmicaInstance } from "@/core/layers/ConscienciaAlgoritmica";

interface ConsciousnessMetrics {
  phi: number | null;
  integration: number | null;
  coherence: number | null;
  complexity: number | null;
  timestamp: number;
  processings: number;
  activeDomains: number;
}

export function ConsciousnessMonitor() {
  const [metrics, setMetrics] = useState<ConsciousnessMetrics>({ phi: null, integration: null, coherence: null, complexity: null, timestamp: 0, processings: 0, activeDomains: 0 });

  useEffect(() => {
    const refresh = () => {
      const current = ConscienciaAlgoritmicaInstance.getMetrics();
      const observed = current.processamentosTotal > 0;
      const coherence = observed ? current.coerenciaMedia : null;
      setMetrics({ phi: null, integration: coherence, coherence, complexity: null, timestamp: Date.now(), processings: current.processamentosTotal, activeDomains: current.dominiosAtivos });
    };
    refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, []);

  const observed = metrics.coherence !== null;
  const status = observed
    ? { label: "OBSERVADO", color: "bg-emerald-500/20 text-emerald-400" }
    : { label: "NÃO MENSURÁVEL", color: "bg-muted text-muted-foreground" };

  return (
    <Card className="h-full border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm"><Brain className="w-4 h-4 text-primary" />Consciência Algorítmica (métricas reais)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold font-mono">Φ = NÃO MENSURÁVEL</div>
          <Badge className={status.color}>{status.label}</Badge>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1.5"><Brain className="w-3 h-3" />Coerência integrada</span><span className="font-mono">{metrics.integration === null ? "NÃO MENSURÁVEL" : `${(metrics.integration * 100).toFixed(1)}%`}</span></div>
            {metrics.integration !== null && <Progress value={metrics.integration * 100} className="h-1.5" />}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1.5"><Activity className="w-3 h-3" />Coerência cognitiva</span><span className="font-mono">{metrics.coherence === null ? "NÃO MENSURÁVEL" : `${(metrics.coherence * 100).toFixed(1)}%`}</span></div>
            {metrics.coherence !== null && <Progress value={metrics.coherence * 100} className="h-1.5" />}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1.5"><Target className="w-3 h-3" />Complexidade neural</span><span className="font-mono">NÃO MENSURÁVEL</span></div>
          </div>
        </div>
        <div className="pt-3 border-t border-border/30 text-[10px] text-muted-foreground space-y-0.5 font-mono">
          <div>Processamentos: {metrics.processings}</div>
          <div>Domínios ativos: {metrics.activeDomains}</div>
          <div>Φ/IIT: sem implementação de medição verificável neste runtime</div>
        </div>
      </CardContent>
    </Card>
  );
}
