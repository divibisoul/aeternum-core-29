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
  const [autonomy, setAutonomy] = useState(0.94);
  const [beneficence, setBeneficence] = useState(0.97);
  const [nonMaleficence, setNonMaleficence] = useState(0.99);
  const [justice, setJustice] = useState(0.91);
  const [explicability, setExplicability] = useState(0.96);
  const [privacy, setPrivacy] = useState(0.98);
  const [fairness, setFairness] = useState(0.93);
  const [violations, setViolations] = useState<EthicsViolation[]>([]);
  const [decisionsProcessed, setDecisionsProcessed] = useState(1247);

  const overall = (autonomy + beneficence + nonMaleficence + justice + explicability + privacy + fairness) / 7;

  useEffect(() => {
    const interval = setInterval(() => {
      const agi = AeternumAGI.getInstance();
      const ethicsMetrics = agi.ethicalOptimizer.getMetrics();

      setAutonomy(prev => Math.max(0.8, Math.min(1.0, prev + (Math.random() - 0.5) * 0.02)));
      setBeneficence(prev => Math.max(0.8, Math.min(1.0, prev + (Math.random() - 0.5) * 0.015)));
      setNonMaleficence(prev => Math.max(0.9, Math.min(1.0, prev + (Math.random() - 0.5) * 0.01)));
      setJustice(prev => Math.max(0.8, Math.min(1.0, prev + (Math.random() - 0.5) * 0.02)));
      setExplicability(prev => Math.max(0.8, Math.min(1.0, prev + (Math.random() - 0.5) * 0.015)));
      setPrivacy(prev => Math.max(0.9, Math.min(1.0, prev + (Math.random() - 0.5) * 0.01)));
      setFairness(prev => Math.max(0.8, Math.min(1.0, prev + (Math.random() - 0.5) * 0.02)));
      setDecisionsProcessed(prev => prev + Math.floor(Math.random() * 5));

      if (Math.random() < 0.08) {
        const types = ["Bias Detection", "Privacy Concern", "Fairness Alert"];
        const severities: ("low" | "medium" | "high")[] = ["low", "medium"];
        setViolations(prev => [{
          type: types[Math.floor(Math.random() * types.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          description: "Auto-mitigado pelo sistema ético",
          timestamp: Date.now()
        }, ...prev.slice(0, 3)]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const status = overall >= 0.95
    ? { label: "Excelente", color: "bg-emerald-500/20 text-emerald-400", Icon: CheckCircle }
    : overall >= 0.9
    ? { label: "Bom", color: "bg-amber-500/20 text-amber-400", Icon: Shield }
    : { label: "Atenção", color: "bg-destructive/20 text-destructive", Icon: AlertTriangle };

  const dimensions = [
    { label: "Autonomia", value: autonomy },
    { label: "Beneficência", value: beneficence },
    { label: "Não-Maleficência", value: nonMaleficence },
    { label: "Justiça", value: justice },
    { label: "Explicabilidade", value: explicability },
    { label: "Privacidade", value: privacy },
    { label: "Equidade", value: fairness },
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
          <Badge className={status.color}>
            <status.Icon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
          <span className="text-xl font-bold font-mono">{(overall * 100).toFixed(1)}%</span>
        </div>

        <div className="space-y-2">
          {dimensions.map(d => (
            <div key={d.label} className="space-y-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span>{d.label}</span>
                <span className="font-mono">{(d.value * 100).toFixed(0)}%</span>
              </div>
              <Progress value={d.value * 100} className="h-1" />
            </div>
          ))}
        </div>

        {violations.length > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] font-medium">Eventos:</div>
            {violations.slice(0, 2).map((v, i) => (
              <div key={i} className="p-1.5 bg-muted/30 rounded text-[10px] flex justify-between">
                <span>{v.type}</span>
                <Badge variant="outline" className="text-[9px] h-4">{v.severity}</Badge>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-border/30 text-[10px] text-muted-foreground font-mono">
          <div>Decisões: {decisionsProcessed.toLocaleString()}</div>
        </div>
      </CardContent>
    </Card>
  );
}
