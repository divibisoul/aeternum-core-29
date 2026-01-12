/**
 * QUADRANGULAR METRICS COMPONENT
 * 
 * Visualiza as 4 dimensões da arquitetura:
 * - Estabilidade
 * - Performance
 * - Comunicação
 * - Otimização
 */

import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Zap, Radio, Settings2,
  ChevronDown, ChevronUp,
  Activity, Database, Cpu, MemoryStick
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PerformanceMonitor, type PerformanceMetrics } from '@/lib/monitoring/PerformanceMonitor';
import { HighPerformanceProcessor } from '@/lib/optimization/DataProcessor';
import { ProjetoClareira } from '@/core/neural';

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  unit?: string;
  status: 'good' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
}

const MetricCard = memo(function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  unit, 
  status,
  trend 
}: MetricCardProps) {
  const statusColors = {
    good: 'text-green-400 bg-green-500/10 border-green-500/30',
    warning: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  };

  return (
    <div className={cn(
      "flex items-center gap-2 rounded-lg border px-3 py-2 transition-all",
      statusColors[status]
    )}>
      <Icon className="h-4 w-4" />
      <div className="flex-1">
        <div className="text-[10px] text-muted-foreground">{label}</div>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-sm font-semibold">{value}</span>
          {unit && <span className="text-[10px] text-muted-foreground">{unit}</span>}
          {trend && (
            <span className={cn(
              "ml-1",
              trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-muted-foreground'
            )}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

export function QuadrangularMetrics() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [cacheMetrics, setCacheMetrics] = useState({ size: 0, hitRate: 0 });
  const [neuralStatus, setNeuralStatus] = useState({ 
    active: false, 
    stress: 0, 
    turbo: false,
    nodes: 0 
  });

  useEffect(() => {
    // Iniciar PerformanceMonitor
    PerformanceMonitor.start((newMetrics) => {
      setMetrics(newMetrics);
    });

    // Atualizar cache metrics
    const cacheInterval = setInterval(() => {
      setCacheMetrics(HighPerformanceProcessor.getCacheMetrics());
    }, 2000);

    // Atualizar status neural
    const neuralInterval = setInterval(() => {
      if (ProjetoClareira.running) {
        const status = ProjetoClareira.getStatus();
        setNeuralStatus({
          active: status.running,
          stress: status.homeostasis.globalStress,
          turbo: status.homeostasis.turboActive,
          nodes: status.homeostasis.activeNodes,
        });
      }
    }, 1000);

    return () => {
      PerformanceMonitor.stop();
      clearInterval(cacheInterval);
      clearInterval(neuralInterval);
    };
  }, []);

  const getStatus = (value: number, thresholds: { good: number; warning: number }): 'good' | 'warning' | 'critical' => {
    if (value >= thresholds.good) return 'good';
    if (value >= thresholds.warning) return 'warning';
    return 'critical';
  };

  const getFpsStatus = (fps: number): 'good' | 'warning' | 'critical' => {
    if (fps >= 55) return 'good';
    if (fps >= 40) return 'warning';
    return 'critical';
  };

  const getMemoryStatus = (mb: number): 'good' | 'warning' | 'critical' => {
    if (mb < 100) return 'good';
    if (mb < 200) return 'warning';
    return 'critical';
  };

  const getStressStatus = (stress: number): 'good' | 'warning' | 'critical' => {
    if (stress < 30) return 'good';
    if (stress < 60) return 'warning';
    return 'critical';
  };

  if (!metrics) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <div className="bg-card/95 backdrop-blur-md border border-border/50 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className={cn(
                "h-2 w-2 rounded-full",
                getFpsStatus(metrics.fps) === 'good' ? 'bg-green-500' : 
                getFpsStatus(metrics.fps) === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              )} />
              <div className={cn(
                "h-2 w-2 rounded-full",
                getMemoryStatus(metrics.memoryMB) === 'good' ? 'bg-green-500' : 
                getMemoryStatus(metrics.memoryMB) === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              )} />
              <div className={cn(
                "h-2 w-2 rounded-full",
                getStatus(cacheMetrics.hitRate, { good: 70, warning: 50 }) === 'good' ? 'bg-green-500' : 
                getStatus(cacheMetrics.hitRate, { good: 70, warning: 50 }) === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              )} />
              <div className={cn(
                "h-2 w-2 rounded-full",
                neuralStatus.turbo ? 'bg-purple-500 animate-pulse' :
                getStressStatus(neuralStatus.stress) === 'good' ? 'bg-green-500' : 
                getStressStatus(neuralStatus.stress) === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              )} />
            </div>
            <span className="text-xs font-medium text-muted-foreground">QUADRANGULAR</span>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-mono">{metrics.fps} FPS</span>
            <span className="font-mono">{metrics.memoryMB}MB</span>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </div>
        </button>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-border/50"
            >
              <div className="p-3 space-y-3">
                {/* Row 1: Estabilidade & Performance */}
                <div className="grid grid-cols-2 gap-2">
                  {/* ESTABILIDADE */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary uppercase">
                      <Shield className="h-3 w-3" />
                      Estabilidade
                    </div>
                    <MetricCard
                      icon={Activity}
                      label="FPS"
                      value={metrics.fps}
                      status={getFpsStatus(metrics.fps)}
                      trend={metrics.fps > 55 ? 'stable' : metrics.fps > 40 ? 'down' : 'down'}
                    />
                  </div>

                  {/* PERFORMANCE */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-secondary uppercase">
                      <Zap className="h-3 w-3" />
                      Performance
                    </div>
                    <MetricCard
                      icon={Cpu}
                      label="Latência"
                      value={metrics.latency || '<1'}
                      unit="ms"
                      status={metrics.latency < 100 ? 'good' : metrics.latency < 200 ? 'warning' : 'critical'}
                    />
                  </div>
                </div>

                {/* Row 2: Comunicação & Otimização */}
                <div className="grid grid-cols-2 gap-2">
                  {/* COMUNICAÇÃO */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-accent-foreground uppercase">
                      <Radio className="h-3 w-3" />
                      Comunicação
                    </div>
                    <MetricCard
                      icon={Database}
                      label="Cache Hit"
                      value={cacheMetrics.hitRate}
                      unit="%"
                      status={getStatus(cacheMetrics.hitRate, { good: 70, warning: 50 })}
                    />
                  </div>

                  {/* OTIMIZAÇÃO */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase">
                      <Settings2 className="h-3 w-3" />
                      Otimização
                    </div>
                    <MetricCard
                      icon={MemoryStick}
                      label="Memória"
                      value={metrics.memoryMB}
                      unit="MB"
                      status={getMemoryStatus(metrics.memoryMB)}
                    />
                  </div>
                </div>

                {/* Neural Status */}
                <div className="pt-2 border-t border-border/30">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Neural:</span>
                      <span className={cn(
                        "font-mono",
                        neuralStatus.active ? 'text-green-400' : 'text-muted-foreground'
                      )}>
                        {neuralStatus.active ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">
                        Nós: <span className="font-mono text-foreground">{neuralStatus.nodes}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Stress: <span className={cn(
                          "font-mono",
                          getStressStatus(neuralStatus.stress) === 'good' ? 'text-green-400' :
                          getStressStatus(neuralStatus.stress) === 'warning' ? 'text-yellow-400' : 'text-red-400'
                        )}>{neuralStatus.stress.toFixed(1)}</span>
                      </span>
                      {neuralStatus.turbo && (
                        <span className="text-purple-400 font-semibold animate-pulse">⚡ TURBO</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default QuadrangularMetrics;
