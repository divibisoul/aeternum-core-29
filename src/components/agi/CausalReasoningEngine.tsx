import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GitBranch, Target, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { AeternumAGI } from "@/core/agi";

interface CausalData {
  time: string;
  accuracy: number;
  strength: number;
}

export function CausalReasoningEngine() {
  const [inferenceAccuracy, setInferenceAccuracy] = useState(0.94);
  const [causalStrength, setCausalStrength] = useState(0.87);
  const [counterfactuals, setCounterfactuals] = useState(156);
  const [interventions, setInterventions] = useState(23);
  const [pathsDiscovered, setPathsDiscovered] = useState(1247);
  const [activeInferences, setActiveInferences] = useState(12);
  const [causalData, setCausalData] = useState<CausalData[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const agi = AeternumAGI.getInstance();
      const godelState = agi.godelAgent.getMetaCognitionState();

      const newAccuracy = Math.max(0.8, Math.min(0.99, inferenceAccuracy + (Math.random() - 0.5) * 0.02));
      const newStrength = Math.max(0.7, Math.min(0.95, godelState.modelingAccuracy + (Math.random() - 0.5) * 0.03));

      setInferenceAccuracy(newAccuracy);
      setCausalStrength(newStrength);
      setCounterfactuals(prev => prev + Math.floor(Math.random() * 5));
      setInterventions(prev => Math.random() < 0.3 ? prev + 1 : prev);
      setPathsDiscovered(prev => prev + Math.floor(Math.random() * 8));
      setActiveInferences(prev => Math.max(5, Math.min(25, prev + Math.floor((Math.random() - 0.5) * 6))));

      setCausalData(prev => [...prev.slice(-19), {
        time: new Date().toLocaleTimeString([], { minute: "2-digit", second: "2-digit" }),
        accuracy: newAccuracy * 100,
        strength: newStrength * 100,
      }]);
    }, 2500);

    return () => clearInterval(interval);
  }, [inferenceAccuracy]);

  const status = inferenceAccuracy >= 0.9 && causalStrength >= 0.85
    ? { label: "Optimal", color: "bg-emerald-500/20 text-emerald-400" }
    : inferenceAccuracy >= 0.85
    ? { label: "Stable", color: "bg-amber-500/20 text-amber-400" }
    : { label: "Adjusting", color: "bg-sky-500/20 text-sky-400" };

  return (
    <Card className="h-full border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <GitBranch className="w-4 h-4 text-primary" />
          Motor de Raciocínio Causal (Π)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge className={status.color}>{status.label}</Badge>
          <span className="text-xs text-muted-foreground">{activeInferences} inferências</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] text-muted-foreground">Precisão</div>
            <div className="text-lg font-bold text-emerald-500 font-mono">{(inferenceAccuracy * 100).toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">Força Causal</div>
            <div className="text-lg font-bold text-sky-500 font-mono">{(causalStrength * 100).toFixed(1)}%</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5"><Target className="w-3 h-3" /> Contrafactuais</span>
              <span className="font-mono">{counterfactuals}</span>
            </div>
            <Progress value={(counterfactuals % 100)} className="h-1.5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> Intervenções</span>
              <span className="font-mono">{interventions}</span>
            </div>
            <Progress value={(interventions * 4) % 100} className="h-1.5" />
          </div>
        </div>

        {causalData.length > 3 && (
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={causalData}>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={[70, 100]} />
                <Line type="monotone" dataKey="accuracy" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="strength" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="pt-2 border-t border-border/30 text-[10px] text-muted-foreground font-mono">
          <div>Caminhos causais: {pathsDiscovered.toLocaleString()}</div>
        </div>
      </CardContent>
    </Card>
  );
}
