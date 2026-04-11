/**
 * SYSTEM DASHBOARD - Painel Completo de Métricas do Sistema
 * 
 * Mostra TODAS as funcionalidades implementadas:
 * - Projeto Clareira (Neural)
 * - Arquitetura Quadrangular
 * - ConscienciaAlgoritmica (3 Camadas)
 * - PerformanceMonitor
 */

import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Brain, Cpu, Database, Shield, Zap, Radio, Settings2,
  Thermometer, BatteryCharging, Network, Sparkles, ChevronUp, ChevronDown,
  Layers, FlaskConical, BookOpen, Scale
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjetoClareira, type SystemMetrics } from '@/core/neural';
import { ConscienciaAlgoritmicaInstance } from '@/core/layers/ConscienciaAlgoritmica';
import { TechnicalLayer } from '@/core/layers/TechnicalLayer';
import { SymbolicLayer } from '@/core/layers/SymbolicLayer';
import { PhilosophicalLayer } from '@/core/layers/PhilosophicalLayer';
import { PerformanceMonitor, type PerformanceMetrics } from '@/lib/monitoring/PerformanceMonitor';
import { HighPerformanceProcessor } from '@/lib/optimization/DataProcessor';

// Status indicator component
const StatusIndicator = memo(function StatusIndicator({ 
  status, 
  label,
  pulse = false 
}: { 
  status: 'online' | 'processing' | 'warning' | 'offline';
  label: string;
  pulse?: boolean;
}) {
  const colors = {
    online: 'bg-green-500',
    processing: 'bg-blue-500',
    warning: 'bg-yellow-500',
    offline: 'bg-red-500',
  };
  
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn(
        "h-2 w-2 rounded-full",
        colors[status],
        pulse && "animate-pulse"
      )} />
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
});

// Metric row component
const MetricRow = memo(function MetricRow({
  icon: Icon,
  label,
  value,
  unit,
  status = 'good'
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  unit?: string;
  status?: 'good' | 'warning' | 'critical';
}) {
  const statusColors = {
    good: 'text-green-400',
    warning: 'text-yellow-400',
    critical: 'text-red-400',
  };
  
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn("font-mono text-sm font-medium", statusColors[status])}>
          {value}
        </span>
        {unit && <span className="text-[10px] text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
});

// Section component
const Section = memo(function Section({
  icon: Icon,
  title,
  children,
  status,
  color = 'primary'
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  status?: 'online' | 'processing' | 'warning' | 'offline';
  color?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", `text-${color}`)} />
          <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
        </div>
        {status && (
          <span className={cn(
            "text-[10px] font-medium px-2 py-0.5 rounded-full",
            status === 'online' && "bg-green-500/20 text-green-400",
            status === 'processing' && "bg-blue-500/20 text-blue-400 animate-pulse",
            status === 'warning' && "bg-yellow-500/20 text-yellow-400",
            status === 'offline' && "bg-red-500/20 text-red-400"
          )}>
            {status.toUpperCase()}
          </span>
        )}
      </div>
      <div className="bg-card/50 rounded-lg border border-border/30 p-3">
        {children}
      </div>
    </div>
  );
});

export function SystemDashboard() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [neuralMetrics, setNeuralMetrics] = useState<SystemMetrics | null>(null);
  const [conscienciaMetrics, setConscienciaMetrics] = useState<ReturnType<typeof ConscienciaAlgoritmicaInstance.getMetrics> | null>(null);
  const [cacheMetrics, setCacheMetrics] = useState({ size: 0, hitRate: 0 });
  const [testResult, setTestResult] = useState<{ sucesso: boolean; coerencia: number } | null>(null);

  // Initialize and update metrics
  useEffect(() => {
    // Initialize ProjetoClareira if needed
    if (!ProjetoClareira.initialized) {
      ProjetoClareira.initialize();
    }
    if (!ProjetoClareira.running) {
      ProjetoClareira.start();
    }

    // Start performance monitoring
    PerformanceMonitor.start(setPerformanceMetrics);

    // Update metrics periodically
    const metricsInterval = setInterval(() => {
      // Neural metrics
      if (ProjetoClareira.running) {
        setNeuralMetrics(ProjetoClareira.getMetrics());
      }
      
      // ConscienciaAlgoritmica metrics
      setConscienciaMetrics(ConscienciaAlgoritmicaInstance.getMetrics());
      
      // Cache metrics
      setCacheMetrics(HighPerformanceProcessor.getCacheMetrics());
    }, 2000);

    return () => {
      clearInterval(metricsInterval);
      PerformanceMonitor.stop();
    };
  }, []);

  // Run system test
  const runSystemTest = useCallback(() => {
    console.log('[SystemDashboard] Executando teste do sistema...');
    const result = ConscienciaAlgoritmicaInstance.testarSistemaCompleto();
    setTestResult({ sucesso: result.sucesso, coerencia: result.coerenciaMedia });
  }, []);

  // Get stress status
  const getStressStatus = (stress: number): 'good' | 'warning' | 'critical' => {
    if (stress < 1) return 'good';
    if (stress < 3) return 'warning';
    return 'critical';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed top-20 right-4 z-[90] w-72"
    >
      <div className="bg-card/98 backdrop-blur-xl border border-border/50 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors border-b border-border/30"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Sistema Aeternum</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusIndicator 
              status={neuralMetrics?.turboActive ? 'processing' : 'online'} 
              label={neuralMetrics?.turboActive ? 'TURBO' : 'ONLINE'}
              pulse={neuralMetrics?.turboActive}
            />
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="max-h-[70vh] overflow-y-auto"
            >
              <div className="p-4 space-y-4">
                
                {/* PROJETO CLAREIRA - Neural System */}
                <Section 
                  icon={Brain} 
                  title="Projeto Clareira" 
                  status={ProjetoClareira.running ? 'online' : 'offline'}
                  color="purple-400"
                >
                  {neuralMetrics ? (
                    <div className="space-y-1">
                      <MetricRow 
                        icon={Cpu} 
                        label="Nós Ativos" 
                        value={`${neuralMetrics.activeNodes}/${neuralMetrics.totalNodes}`}
                        status="good"
                      />
                      <MetricRow 
                        icon={Thermometer} 
                        label="Temperatura Média" 
                        value={neuralMetrics.averageTemperature.toFixed(2)}
                        status={neuralMetrics.averageTemperature > 0.7 ? 'warning' : 'good'}
                      />
                      <MetricRow 
                        icon={Activity} 
                        label="Stress Global" 
                        value={neuralMetrics.globalStress.toFixed(2)}
                        status={getStressStatus(neuralMetrics.globalStress)}
                      />
                      <MetricRow 
                        icon={BatteryCharging} 
                        label="Carga Média" 
                        value={(neuralMetrics.averageLoad * 100).toFixed(0)}
                        unit="%"
                        status="good"
                      />
                      <MetricRow 
                        icon={Network} 
                        label="Pacotes Processados" 
                        value={neuralMetrics.packetsProcessed}
                        status="good"
                      />
                      {neuralMetrics.turboActive && (
                        <div className="mt-2 bg-purple-500/20 rounded-lg p-2 text-center">
                          <span className="text-purple-400 text-xs font-bold animate-pulse">
                            ⚡ MODO TURBO ATIVO ⚡
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-xs text-muted-foreground py-4">
                      Carregando métricas neurais...
                    </div>
                  )}
                </Section>

                {/* ARQUITETURA QUADRANGULAR */}
                <Section 
                  icon={Shield} 
                  title="Arquitetura Quadrangular" 
                  status="online"
                  color="blue-400"
                >
                  <div className="grid grid-cols-2 gap-2">
                    {/* Estabilidade */}
                    <div className="bg-green-500/10 rounded-lg p-2 text-center">
                      <Shield className="h-4 w-4 mx-auto text-green-400 mb-1" />
                      <div className="text-[10px] text-muted-foreground">Estabilidade</div>
                      <div className="text-xs font-mono font-bold text-green-400">
                        {performanceMetrics?.fps || 60} FPS
                      </div>
                    </div>
                    
                    {/* Performance */}
                    <div className="bg-yellow-500/10 rounded-lg p-2 text-center">
                      <Zap className="h-4 w-4 mx-auto text-yellow-400 mb-1" />
                      <div className="text-[10px] text-muted-foreground">Performance</div>
                      <div className="text-xs font-mono font-bold text-yellow-400">
                        {performanceMetrics?.latency || '<1'}ms
                      </div>
                    </div>
                    
                    {/* Comunicação */}
                    <div className="bg-blue-500/10 rounded-lg p-2 text-center">
                      <Radio className="h-4 w-4 mx-auto text-blue-400 mb-1" />
                      <div className="text-[10px] text-muted-foreground">Comunicação</div>
                      <div className="text-xs font-mono font-bold text-blue-400">
                        {cacheMetrics.hitRate}% Hit
                      </div>
                    </div>
                    
                    {/* Otimização */}
                    <div className="bg-purple-500/10 rounded-lg p-2 text-center">
                      <Settings2 className="h-4 w-4 mx-auto text-purple-400 mb-1" />
                      <div className="text-[10px] text-muted-foreground">Otimização</div>
                      <div className="text-xs font-mono font-bold text-purple-400">
                        {performanceMetrics?.memoryMB || 0}MB
                      </div>
                    </div>
                  </div>
                </Section>

                {/* CONSCIÊNCIA ALGORÍTMICA - 3 Camadas */}
                <Section 
                  icon={Layers} 
                  title="Consciência Algorítmica" 
                  status={conscienciaMetrics && conscienciaMetrics.processamentosTotal > 0 ? 'online' : 'warning'}
                  color="orange-400"
                >
                  {conscienciaMetrics ? (
                    <div className="space-y-2">
                      {/* Camada Técnica */}
                      <div className="flex items-center justify-between py-1 border-b border-border/20">
                        <div className="flex items-center gap-2">
                          <FlaskConical className="h-3.5 w-3.5 text-blue-400" />
                          <span className="text-xs">Técnica (NNs)</span>
                        </div>
                        <span className="text-xs font-mono text-green-400">
                          {conscienciaMetrics.camadas.tecnico.reforco.iterations} iter
                        </span>
                      </div>
                      
                      {/* Camada Simbólica */}
                      <div className="flex items-center justify-between py-1 border-b border-border/20">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                          <span className="text-xs">Simbólica (Quantum)</span>
                        </div>
                        <span className="text-xs font-mono text-green-400">
                          {conscienciaMetrics.camadas.simbolico.totalUpdates} updates
                        </span>
                      </div>
                      
                      {/* Camada Filosófica */}
                      <div className="flex items-center justify-between py-1 border-b border-border/20">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-3.5 w-3.5 text-orange-400" />
                          <span className="text-xs">Filosófica (Ética)</span>
                        </div>
                        <span className="text-xs font-mono text-green-400">
                          {(conscienciaMetrics.camadas.filosofico.cobertura * 100).toFixed(0)}%
                        </span>
                      </div>
                      
                      {/* Coerência Média */}
                      <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg p-2 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Coerência Média</span>
                          <span className={cn(
                            "text-sm font-mono font-bold",
                            conscienciaMetrics.coerenciaMedia > 0.7 ? "text-green-400" : "text-yellow-400"
                          )}>
                            {(conscienciaMetrics.coerenciaMedia * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Processamentos */}
                      <div className="text-center text-[10px] text-muted-foreground pt-1">
                        {conscienciaMetrics.processamentosTotal} processamentos realizados
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-xs text-muted-foreground py-4">
                      Carregando métricas cognitivas...
                    </div>
                  )}
                </Section>

                {/* Test System Button */}
                <button
                  onClick={runSystemTest}
                  className="w-full py-2 px-4 bg-primary/20 hover:bg-primary/30 rounded-lg transition-colors text-sm font-medium text-primary flex items-center justify-center gap-2"
                >
                  <Scale className="h-4 w-4" />
                  Testar Sistema Completo
                </button>
                
                {/* Test Result */}
                {testResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "rounded-lg p-3 text-center",
                      testResult.sucesso ? "bg-green-500/20" : "bg-red-500/20"
                    )}
                  >
                    <div className={cn(
                      "text-sm font-bold",
                      testResult.sucesso ? "text-green-400" : "text-red-400"
                    )}>
                      {testResult.sucesso ? "✓ TESTE APROVADO" : "✗ TESTE REPROVADO"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Coerência: {(testResult.coerencia * 100).toFixed(1)}%
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default SystemDashboard;
