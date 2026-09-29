import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, ShieldCheck, Brain } from "lucide-react";
import { AeternumAGI } from "@/core/agi";

type VerifiedCognitiveState = {
  modelingAccuracy: number;
  selfAwareness: number;
  epistemologicalHealth: string;
  activeSubsystems: number;
  totalSubsystems: number;
};

function readVerifiedState(): VerifiedCognitiveState {
  const agi = AeternumAGI.getInstance();
  const metrics = agi.getFullMetrics();

  return {
    modelingAccuracy: metrics.godelMeta.modelingAccuracy,
    selfAwareness: metrics.godelMeta.selfAwareness,
    epistemologicalHealth: metrics.nip.saudeEpistemologica,
    activeSubsystems: metrics.overall.activeSubsystems,
    totalSubsystems: metrics.overall.subsystems,
  };
}

/**
 * CausalReasoningEngine dashboard surface.
 *
 * This component deliberately exposes only measurements returned by the live
 * Aeternum runtime. It does not synthesize causal accuracy, causal strength,
 * path counts, interventions, or counterfactual counts in the UI.
 *
 * A dedicated causal execution engine is not proven by the current repository
 * surface, so causal-specific metrics remain explicitly unavailable rather
 * than being represented by random or hardcoded telemetry.
 */
export function CausalReasoningEngine() {
  const [state, setState] = useState<VerifiedCognitiveState>(() => readVerifiedState());

  useEffect(() => {
    const update = () => {
      try {
        setState(readVerifiedState());
      } catch {
        // Preserve the last verified state when the runtime is temporarily unavailable.
      }
    };

    const interval = setInterval(update, 2500);
    return () => clearInterval(interval);
  }, []);

  const healthy = state.epistemologicalHealth === "saudavel";
  const coverage = state.totalSubsystems > 0
    ? (state.activeSubsystems / state.totalSubsystems) * 100
    : 0;

  return (
    <Card className="h-full border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <GitBranch className="w-4 h-4" />
          Motor de Raciocínio Causal — Estado Verificável
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant={healthy ? "default" : "secondary"}>
            <ShieldCheck className="mr-1 h-3 w-3" />
            {healthy ? "Epistemologicamente estável" : state.epistemologicalHealth}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {state.activeSubsystems}/{state.totalSubsystems} subsistemas ativos
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] text-muted-foreground">Acurácia de modelagem</div>
            <div className="text-lg font-bold font-mono">
              {(state.modelingAccuracy * 100).toFixed(1)}%
            </div>
          </div>

          <div>
            <div className="text-[10px] text-muted-foreground">Auto-modelagem</div>
            <div className="text-lg font-bold font-mono">
              {(state.selfAwareness * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <Brain className="w-3 h-3" />
              Cobertura operacional observada
            </span>
            <span className="font-mono">{coverage.toFixed(1)}%</span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.max(0, Math.min(100, coverage))}%` }}
            />
          </div>
        </div>

        <div className="rounded-md border border-border/40 p-3 text-[11px] text-muted-foreground">
          <div className="font-medium text-foreground">Limite de evidência causal</div>
          <p className="mt-1">
            O runtime atual não expõe um executor causal autônomo verificável nesta
            superfície. Portanto, precisão causal, força causal, caminhos causais,
            intervenções e contrafactuais não são inventados nem estimados visualmente.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
