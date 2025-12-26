/**
 * TELEMETRY DISPLAY
 * 
 * Real-time system metrics in HUD style.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, Clock, Zap, Box } from 'lucide-react';
import { useGlobalStore, selectTelemetry } from '@/stores/globalStore';
import { useModuleRegistry } from '@/core/ModuleRegistry';
import { cn } from '@/lib/utils';

interface MetricProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  unit?: string;
  status?: 'normal' | 'warning' | 'critical';
}

function Metric({ icon: Icon, label, value, unit, status = 'normal' }: MetricProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn(
        "h-3.5 w-3.5",
        status === 'normal' && "text-primary",
        status === 'warning' && "text-neon-orange",
        status === 'critical' && "text-destructive"
      )} />
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className={cn(
        "font-mono text-xs tabular-nums",
        status === 'normal' && "text-foreground",
        status === 'warning' && "text-neon-orange",
        status === 'critical' && "text-destructive"
      )}>
        {value}{unit && <span className="text-muted-foreground ml-0.5">{unit}</span>}
      </span>
    </div>
  );
}

export function Telemetry() {
  const telemetry = useGlobalStore(selectTelemetry);
  const { modules } = useModuleRegistry();
  const [uptime, setUptime] = useState(0);

  // Update uptime every second
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setUptime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getLatencyStatus = (ms: number): 'normal' | 'warning' | 'critical' => {
    if (ms > 2000) return 'critical';
    if (ms > 1000) return 'warning';
    return 'normal';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-10 items-center justify-between border-b border-border/30 bg-card/30 px-4 backdrop-blur-sm"
    >
      {/* Left metrics */}
      <div className="flex items-center gap-6">
        <Metric
          icon={Clock}
          label="Uptime"
          value={formatUptime(uptime)}
        />
        <Metric
          icon={Activity}
          label="Latency"
          value={telemetry.latencyMs}
          unit="ms"
          status={getLatencyStatus(telemetry.latencyMs)}
        />
        <Metric
          icon={Zap}
          label="Tokens/s"
          value={telemetry.tokensPerSecond.toFixed(1)}
        />
      </div>

      {/* Center - Status */}
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-primary shadow-neon animate-pulse" />
        <span className="font-mono text-xs text-primary">SYSTEM ONLINE</span>
      </div>

      {/* Right metrics */}
      <div className="flex items-center gap-6">
        <Metric
          icon={Box}
          label="Modules"
          value={modules.length}
        />
        <Metric
          icon={Cpu}
          label="Memory"
          value={`${telemetry.memoryUsage.toFixed(0)}`}
          unit="MB"
          status={telemetry.memoryUsage > 500 ? 'warning' : 'normal'}
        />
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">SYS</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-3 w-1 rounded-sm",
                  i <= 4 ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
