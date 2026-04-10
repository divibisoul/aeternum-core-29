import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Atom, Zap, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { AeternumAGI } from "@/core/agi";

interface QuantumDataPoint {
  time: string;
  fidelity: number;
  entanglement: number;
}

export function QuantumBridge() {
  const [entanglement, setEntanglement] = useState(0.94);
  const [decoherence, setDecoherence] = useState(0.23);
  const [fidelity, setFidelity] = useState(0.987);
  const [errorRate, setErrorRate] = useState(0.001);
  const [operations, setOperations] = useState(1247);
  const [quantumData, setQuantumData] = useState<QuantumDataPoint[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const agi = AeternumAGI.getInstance();
      const latticeMetrics = agi.neuralLattice.getMetrics();

      const newFidelity = Math.max(0.95, Math.min(0.999, fidelity + (Math.random() - 0.5) * 0.003));
      const newEntanglement = Math.max(0.7, Math.min(1.0, latticeMetrics.globalFitness + (Math.random() - 0.3) * 0.02));

      setEntanglement(newEntanglement);
      setDecoherence(Math.max(0.1, Math.min(0.5, decoherence + (Math.random() - 0.5) * 0.05)));
      setFidelity(newFidelity);
      setErrorRate(Math.max(0.0001, Math.min(0.01, errorRate + (Math.random() - 0.5) * 0.0005)));
      setOperations(prev => prev + Math.floor(Math.random() * 50));

      setQuantumData(prev => [...prev.slice(-19), {
        time: new Date().toLocaleTimeString([], { minute: "2-digit", second: "2-digit" }),
        fidelity: newFidelity * 100,
        entanglement: newEntanglement * 100,
      }]);
    }, 1800);

    return () => clearInterval(interval);
  }, [fidelity, decoherence, errorRate]);

  const status = fidelity >= 0.98 && errorRate <= 0.002
    ? { label: "Quantum Optimal", color: "bg-emerald-500/20 text-emerald-400", Icon: Atom }
    : fidelity >= 0.96
    ? { label: "Quantum Stable", color: "bg-amber-500/20 text-amber-400", Icon: Zap }
    : { label: "Quantum Degraded", color: "bg-destructive/20 text-destructive", Icon: AlertTriangle };

  return (
    <Card className="h-full border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Atom className="w-4 h-4 text-primary" />
          Ponte Quântica (127q)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge className={status.color}>
            <status.Icon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">127 Qubits</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] text-muted-foreground">Fidelidade</div>
            <div className="text-lg font-bold text-emerald-500 font-mono">{(fidelity * 100).toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">Taxa de Erro</div>
            <div className="text-lg font-bold text-destructive font-mono">{(errorRate * 100).toFixed(3)}%</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">Emaranhamento</div>
            <div className="text-lg font-bold text-sky-500 font-mono">{(entanglement * 100).toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">Decoerência</div>
            <div className="text-lg font-bold text-amber-500 font-mono">{(decoherence * 100).toFixed(1)}%</div>
          </div>
        </div>

        {quantumData.length > 3 && (
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={quantumData}>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={[70, 100]} />
                <Line type="monotone" dataKey="fidelity" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="entanglement" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="pt-2 border-t border-border/30 text-[10px] text-muted-foreground font-mono">
          <div>Operações: {operations.toLocaleString()}</div>
        </div>
      </CardContent>
    </Card>
  );
}
