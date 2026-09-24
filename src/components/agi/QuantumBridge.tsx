import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Atom, AlertTriangle } from "lucide-react";
import { AeternumAGI } from "@/core/agi";

export function QuantumBridge() {
  const [state, setState] = useState(() => AeternumAGI.getInstance().quantumNeural.getInterfaceStatus().quantum);

  useEffect(() => {
    const refresh = () => {
      setState(AeternumAGI.getInstance().quantumNeural.getInterfaceStatus().quantum);
    };
    refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, []);

  const available = state.physicalBackendConfigured && state.stateSource === "PHYSICAL_BACKEND";
  const label = available ? "BACKEND FÍSICO OBSERVADO" : "BACKEND QUÂNTICO NÃO DISPONÍVEL";

  return (
    <Card className="h-full border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Atom className="w-4 h-4 text-primary" />
          Ponte Quântica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={available ? "text-emerald-400" : "text-yellow-400"}>
            {available ? <Atom className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
            {label}
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">
            {available ? "OBSERVADO" : "NÃO MENSURÁVEL"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] text-muted-foreground">Fidelidade</div>
            <div className="text-lg font-bold font-mono">
              {available ? (state.fidelity * 100).toFixed(2) + "%" : "NÃO MENSURÁVEL"}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">Taxa de Erro</div>
            <div className="text-lg font-bold font-mono">
              {available ? (state.errorRate * 100).toFixed(3) + "%" : "NÃO MENSURÁVEL"}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">Emaranhamento</div>
            <div className="text-lg font-bold font-mono">
              {available ? (state.entangled ? "ATIVO" : "INATIVO") : "NÃO DISPONÍVEL"}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">Fonte do estado</div>
            <div className="text-lg font-bold font-mono">
              {state.stateSource}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border/30 text-[10px] text-muted-foreground font-mono">
          <div>Backend físico: {state.physicalBackendConfigured ? "CONFIGURADO" : "NÃO CONFIGURADO"}</div>
          <div>Última observação: {state.observedAt > 0 ? new Date(state.observedAt).toLocaleTimeString() : "NÃO MENSURÁVEL"}</div>
        </div>
      </CardContent>
    </Card>
  );
}
