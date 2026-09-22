import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { AeternumAGI } from "@/core/agi";

interface EthicsViolation {
  type: string;
  severity: "low" | "medium" | "high";
  description: string;
  timestamp: number;
}

export function EthicsGuardian() {
  const [overall, setOverall] = useState<number | null>(null);
  const [violationsCount, setViolationsCount] = useState(0);
  const [decisionsProcessed, setDecisionsProcessed] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      const metrics = AeternumAGI.getInstance().ethicalOptimizer.getMetrics();
      const audit = metrics.auditMetrics;
      setOverall(Number.isFinite(audit.avgScore) ? Math.max(0, Math.min(1, audit.avgScore)) : null);
      setViolationsCount(Number.isFinite(audit.violations) ? audit.violations : 0);
      setDecisionsProcessed(Number.isFinite(audit.successRate) ? undefined : undefined);
    };
    update();
    const interval = setInterval(update, 3000);
    return () => clearInterval(interval);
  }, []);


  const status = overall === null
    ? { label: "Não mensurável", Icon: AlertTriangle }
    : overall >= 0.95
    ? { label: "Conforme", Icon: CheckCircle }
    : overall >= 0.9
    ? { label: "Requer acompanhamento", Icon: Shield }
    : { label: "Requer revisão", Icon: AlertTriangle };

  const dimensions = [
    "Autonomia", "Beneficência", "Não-Maleficência", "Justiça",
    "Explicabilidade", "Privacidade", "Equidade",
  ];

  return (
    <Card className="h-full border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Shield className="w-4 h-4 text-primary" />
          Guardian Ético 7D (EU AI Act)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline">
            <status.Icon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
          <span className="text-xl font-bold font-mono">{overall === null ? "—" : (overall * 100).toFixed(1) + "%"}</span>
        </div>

        <div className="space-y-2">
          {dimensions.map(label => (
            <div key={label} className="space-y-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span>{label}</span>
                <span className="font-mono">não medido separadamente</span>
              </div>
              <Progress value={0} className="h-1" />
            </div>
          ))}
        </div>

        {violationsCount > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] font-medium">Eventos:</div>
            {Array.from({ length: Math.min(2, violationsCount) }).map((v, i) => (
              <div key={i} className="p-1.5 bg-muted/30 rounded text-[10px] flex justify-between">
                <span>violação ética registrada</span>
                <Badge variant="outline" className="text-[9px] h-4">observada</Badge>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-border/30 text-[10px] text-muted-foreground font-mono">
          <div>Auditorias registradas: {violationsCount + (overall !== null ? 1 : 0)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
