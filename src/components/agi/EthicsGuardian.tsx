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
  const [violations, setViolations] = useState<EthicsViolation[]>([]);
  const [audits, setAudits] = useState(0);
  const [principles, setPrinciples] = useState<string[]>([]);

  useEffect(() => {
    const refresh = () => {
      const ethics = AeternumAGI.getInstance().ethicalOptimizer;
      const metrics = ethics.getMetrics();
      setOverall(metrics.auditMetrics.avgScore);
      setAudits(metrics.auditMetrics.audits ?? 0);
      setPrinciples(ethics.ethicalCore.getPrinciples());

      const history = ethics.auditSystem.getHistory();
      setViolations(
        history
          .flatMap(a => a.ethicalViolations.map(v => ({
            type: "ÉTICA",
            severity: a.riskAssessment === "critical" ? "high" : a.riskAssessment === "high" ? "medium" : "low",
            description: v,
            timestamp: a.timestamp,
          })))
          .slice(-4)
          .reverse()
      );
    };
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, []);

  const status = overall === null
    ? { label: "NÃO MENSURÁVEL", color: "bg-muted text-muted-foreground", Icon: AlertTriangle }
    : overall >= 0.95
      ? { label: "OBSERVADO", color: "bg-emerald-500/20 text-emerald-400", Icon: CheckCircle }
      : overall >= 0.7
        ? { label: "DEGRADADO", color: "bg-amber-500/20 text-amber-400", Icon: Shield }
        : { label: "CRÍTICO", color: "bg-destructive/20 text-destructive", Icon: AlertTriangle };

  return (
    <Card className="h-full border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Shield className="w-4 h-4 text-primary" />
          Guardian Ético (evidência de auditoria)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge className={status.color}>
            <status.Icon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
          <span className="text-xl font-bold font-mono">
            {overall === null ? "NÃO MENSURÁVEL" : `${(overall * 100).toFixed(1)}%`}
          </span>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] text-muted-foreground">Princípios registrados: {principles.length}</div>
          {overall !== null && <Progress value={overall * 100} className="h-1.5" />}
          <div className="text-[10px] text-muted-foreground font-mono">Auditorias observadas: {audits}</div>
        </div>

        <div className="space-y-2">
          {principles.slice(0, 7).map(principle => (
            <div key={principle} className="flex items-center justify-between text-[10px]">
              <span>{principle.replace(/_/g, " ")}</span>
              <span className="font-mono text-muted-foreground">{overall === null ? "NÃO MENSURÁVEL" : "COBERTURA GLOBAL"}</span>
            </div>
          ))}
        </div>

        {violations.length > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] font-medium">Eventos reais de auditoria:</div>
            {violations.slice(0, 2).map((v, i) => (
              <div key={i} className="p-1.5 bg-muted/30 rounded text-[10px] flex justify-between gap-2">
                <span>{v.description}</span>
                <Badge variant="outline" className="text-[9px] h-4">{v.severity}</Badge>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-border/30 text-[10px] text-muted-foreground font-mono">
          <div>Fonte: ContinuousAuditSystem</div>
        </div>
      </CardContent>
    </Card>
  );
}
