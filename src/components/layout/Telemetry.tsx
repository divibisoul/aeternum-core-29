/**
 * TELEMETRY DISPLAY
 * 
 * Real-time system metrics in HUD style.
 * Agora integrado com métricas reais do ProjetoClareira e sistemas neurais.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, Clock, Zap, Box, Brain, Thermometer, Radio } from 'lucide-react';
import { useGlobalStore, selectTelemetry } from '@/stores/globalStore';
import { useModuleRegistry } from '@/core/ModuleRegistry';
import { ProjetoClareira, type SystemMetrics } from '@/core/neural';
import { ConscienciaAlgoritmicaInstance } from '@/core/layers/ConscienciaAlgoritmica';
import { PerformanceMonitor, type PerformanceMetrics } from '@/lib/monitoring/PerformanceMonitor';
import { cn } from '@/lib/utils';

interface MetricProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  unit?: string;
  status?: 'normal' | 'warning' | 'critical' | 'active';
  pulse?: boolean;
}

function Metric({ icon: Icon, label, value, unit, status = 'normal', pulse = false }: MetricProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn(
        "h-3.5 w-3.5",
        status === 'normal' && "text-primary",
        status === 'warning' && "text-yellow-400",
        status === 'critical' && "text-destructive",
        status === 'active' && "text-green-400",
        pulse && "animate-pulse"
      )} />
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className={cn(
        "font-mono text-xs tabular-nums",
        status === 'normal' && "text-foreground",
        status === 'warning' && "text-yellow-400",
        status === 'critical' && "text-destructive",
        status === 'active' && "text-green-400"
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
  const [neuralMetrics, setNeuralMetrics] = useState<SystemMetrics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [conscienciaActive, setConscienciaActive] = useState(false);

  // Update uptime every second
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setUptime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update neural and performance metrics
  useEffect(() => {
    // Start performance monitor
    PerformanceMonitor.start(setPerformanceMetrics);

    const metricsInterval = setInterval(() => {
      // Neural system metrics
      if (ProjetoClareira.running) {
        setNeuralMetrics(ProjetoClareira.getMetrics());
      }

      // Check if ConscienciaAlgoritmica is active
      const conscienciaMetrics = ConscienciaAlgoritmicaInstance.getMetrics();
      setConscienciaActive(conscienciaMetrics.processamentosTotal > 0);
    }, 1000);

    return () => {
      clearInterval(metricsInterval);
      PerformanceMonitor.stop();
    };
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

  const getStressStatus = (stress: number): 'normal' | 'warning' | 'critical' => {
    if (stress > 3) return 'critical';
    if (stress > 1.5) return 'warning';
    return 'normal';
  };

  const systemLevel = neuralMetrics 
    ? Math.min(5, Math.max(1, Math.round((1 - neuralMetrics.globalStress / 5) * 5)))
    : 4;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-12 items-center justify-between border-b border-border/30 bg-card/50 px-4 backdrop-blur-md"
    >
      {/* Left metrics - Core System */}
      <div className="flex items-center gap-5">
        <Metric
          icon={Clock}
          label="Uptime"
          value={formatUptime(uptime)}
        />
        <Metric
          icon={Activity}
          label="Latency"
          value={performanceMetrics?.latency || telemetry.latencyMs}
          unit="ms"
          status={getLatencyStatus(performanceMetrics?.latency || telemetry.latencyMs)}
        />
        <Metric
          icon={Zap}
          label="FPS"
          value={performanceMetrics?.fps?.toFixed(0) || '60'}
          status={performanceMetrics && performanceMetrics.fps < 50 ? 'warning' : 'normal'}
        />
      </div>

      {/* Center - AGI + Neural Status (always active, no toggle) */}
      <div className="flex items-center gap-3">
        {/* AGI 17 engines */}
        <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-primary/10 border border-primary/30">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[10px] text-primary">AGI:17/17</span>
        </div>

        {/* Neural */}
        <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-primary/10 border border-primary/30">
          <div className={cn(
            "h-2 w-2 rounded-full",
            ProjetoClareira.running ? "bg-emerald-500" : "bg-red-500",
            neuralMetrics?.turboActive && "animate-pulse bg-purple-500"
          )} />
          <span className="font-mono text-[10px] text-primary">
            {neuralMetrics?.turboActive ? '⚡TURBO' : ProjetoClareira.running ? 'NEURAL' : 'N/OFF'}
          </span>
        </div>

        {/* 3-Layer */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/30">
          <Brain className={cn("h-3 w-3", conscienciaActive ? "text-orange-400" : "text-muted-foreground")} />
          <span className={cn("font-mono text-[10px]", conscienciaActive ? "text-orange-400" : "text-muted-foreground")}>
            3L:{conscienciaActive ? 'ON' : 'IDLE'}
          </span>
        </div>
      </div>

      {/* Right metrics - Neural Details */}
      <div className="flex items-center gap-5">
        <Metric
          icon={Brain}
          label="Nodes"
          value={neuralMetrics ? `${neuralMetrics.activeNodes}/${neuralMetrics.totalNodes}` : '0/0'}
          status={neuralMetrics && neuralMetrics.activeNodes > 0 ? 'active' : 'normal'}
        />
        <Metric
          icon={Thermometer}
          label="Stress"
          value={neuralMetrics?.globalStress.toFixed(2) || '0.00'}
          status={getStressStatus(neuralMetrics?.globalStress || 0)}
        />
        <Metric
          icon={Cpu}
          label="Memory"
          value={performanceMetrics?.memoryMB?.toFixed(0) || '0'}
          unit="MB"
          status={performanceMetrics && performanceMetrics.memoryMB > 500 ? 'warning' : 'normal'}
        />
        <Metric
          icon={Box}
          label="Modules"
          value={modules.length}
        />
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">SYS</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-3 w-1 rounded-sm transition-colors duration-300",
                  i <= systemLevel ? "bg-primary shadow-[0_0_4px_hsl(var(--primary))]" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
