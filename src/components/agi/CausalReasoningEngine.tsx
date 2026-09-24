import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GitBranch, Target, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { AeternumAGI } from "@/core/agi";

interface CausalData { time: string; accuracy: number | null; strength: number | null; }

export function CausalReasoningEngine() {
  const [modelingAccuracy, setModelingAccuracy] = useState<number | null>(null);
  const [causalData, setCausalData] = useState<CausalData[]>([]);

  useEffect(() => {
    const refresh = () => {
      const value = AeternumAGI.getInstance().godelAgent.getMetaCognitionState().modelingAccuracy;
      const observed = Number.isFinite(value) ? value : null;
      setModelingAccuracy(observed);
      setCausalData(prev => [...prev.slice(-19), { time: new Date().toLocaleTimeString([], { minute: "2-digit", second: "2-digit" }), accuracy: observed === null ? null : observed * 100, strength: null }]);
    };
    refresh();
    const interval = setInterval(refresh, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="h-full border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm"><GitBranch className="w-4 h-4 text-primary" />Motor de Raciocínio Causal (interface preservada)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline">MOTOR CAUSAL NÃO REGISTRADO</Badge>
          <span className="text-xs text-muted-foreground">Inferências causais: NÃO MENSURÁVEL</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><div className="text-[10px] text-muted-foreground">Modelagem observada (Gödel)</div><div className="text-lg font-bold text-emerald-500 font-mono">{modelingAccuracy === null ? "NÃO MENSURÁVEL" : `${(modelingAccuracy * 100).toFixed(1)}%`}</div></div>
          <div><div className="text-[10px] text-muted-foreground">Força causal</div><div className="text-lg font-bold text-sky-500 font-mono">NÃO MENSURÁVEL</div></div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1.5"><Target className="w-3 h-3" />Contrafactuais</span><span className="font-mono">NÃO MENSURÁVEL</span></div>
          <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1.5"><Zap className="w-3 h-3" />Intervenções</span><span className="font-mono">NÃO MENSURÁVEL</span></div>
        </div>
        {modelingAccuracy !== null && <Progress value={modelingAccuracy * 100} className="h-1.5" />}
        {causalData.length > 3 && <div className="h-24"><ResponsiveContainer width="100%" height="100%"><LineChart data={causalData}><XAxis dataKey="time" hide /><YAxis hide domain={[0, 100]} /><Line type="monotone" dataKey="accuracy" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>}
        <div className="pt-2 border-t border-border/30 text-[10px] text-muted-foreground font-mono"><div>Caminhos causais: NÃO MENSURÁVEL</div><div>Fonte: GodelAgent.modelingAccuracy; motor causal próprio não localizado</div></div>
      </CardContent>
    </Card>
  );
}
