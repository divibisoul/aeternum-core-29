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
  const [status, setStatus] = useState({ measurementAvailable: false, coherence: 0, fidelity: 0, errorRate: 0, entangledNodes: 0 });
  const [quantumData, setQuantumData] = useState<Array<{ time: string; fidelity: number; coherence: number }>>([]);

  useEffect(() => {
    const update = () => {
      const quantum = AeternumAGI.getInstance().quantumNeural.getInterfaceStatus().quantum;
      setStatus({ measurementAvailable: quantum.measurementAvailable, coherence: quantum.coherence, fidelity: quantum.fidelity, errorRate: quantum.errorRate, entangledNodes: quantum.entangledNodes });
      if (quantum.measurementAvailable) {
        setQuantumData(prev => [...prev.slice(-19), { time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }), fidelity: quantum.fidelity * 100, coherence: quantum.coherence * 100 }]);
      } else {
        setQuantumData([]);
      }
    };
    update();
    const interval = setInterval(update, 1800);
    return () => clearInterval(interval);
  }, []);

  const statusView = status.measurementAvailable
    ? status.fidelity >= 0.98 && status.errorRate <= 0.002
      ? { label: 'Observação quântica disponível', Icon: Atom }
      : { label: 'Observação quântica degradada', Icon: AlertTriangle }
    : { label: 'Backend quântico não disponível', Icon: AlertTriangle };

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
          <Badge variant="outline">
            <statusView.Icon className="w-3 h-3 mr-1" />
            {statusView.label}
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">{status.measurementAvailable ? status.entangledNodes + " nós observados" : "sem medição"}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><div className="text-[10px] text-muted-foreground">Fidelidade observada</div><div className="text-lg font-bold font-mono">{status.measurementAvailable ? (status.fidelity * 100).toFixed(2) + "%" : "—"}</div></div>
          <div><div className="text-[10px] text-muted-foreground">Erro observado</div><div className="text-lg font-bold font-mono">{status.measurementAvailable ? (status.errorRate * 100).toFixed(3) + "%" : "—"}</div></div>
          <div><div className="text-[10px] text-muted-foreground">Coerência observada</div><div className="text-lg font-bold font-mono">{status.measurementAvailable ? (status.coherence * 100).toFixed(1) + "%" : "—"}</div></div>
          <div><div className="text-[10px] text-muted-foreground">Nós entrelaçados</div><div className="text-lg font-bold font-mono">{status.measurementAvailable ? status.entangledNodes : "—"}</div></div>
        </div>

        {quantumData.length > 3 && (
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={quantumData}>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={[0, 100]} />
                <Line type="monotone" dataKey="fidelity" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="coherence" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="pt-2 border-t border-border/30 text-[10px] text-muted-foreground font-mono">
          <div>Operações quânticas: {status.measurementAvailable ? "observadas pelo backend" : "não mensurável"}</div>
        </div>
      </CardContent>
    </Card>
  );
}
