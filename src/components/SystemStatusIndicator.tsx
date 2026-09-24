/**
 * SYSTEM STATUS INDICATOR
 * 
 * Indicador visual global de status do sistema.
 * Mostra claramente quando os sistemas estão ativos e processando.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, Layers, Activity, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ProjetoClareira, type SystemMetrics } from '@/core/neural';
import { ConscienciaAlgoritmicaInstance } from '@/core/layers/ConscienciaAlgoritmica';
import { cn } from '@/lib/utils';

interface SystemStatus {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  processing: boolean;
  metric?: string;
  color: string;
}

export function SystemStatusIndicator() {
  const [systems, setSystems] = useState<SystemStatus[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [allSystemsReady, setAllSystemsReady] = useState(false);

  useEffect(() => {
    const updateSystems = () => {
      const neuralMetrics = ProjetoClareira.running ? ProjetoClareira.getMetrics() : null;
      const conscienciaMetrics = ConscienciaAlgoritmicaInstance.getMetrics();

      const updatedSystems: SystemStatus[] = [
        {
          name: 'Projeto Clareira',
          icon: Brain,
          active: ProjetoClareira.running,
          processing: neuralMetrics?.turboActive || false,
          metric: neuralMetrics ? `${neuralMetrics.activeNodes} nós` : 'offline',
          color: 'purple',
        },
        {
          name: 'ConscienciaAlgoritmica',
          icon: Layers,
          active: conscienciaMetrics.processamentosTotal > 0,
          processing: false,
          metric: `${(conscienciaMetrics.coerenciaMedia * 100).toFixed(0)}% coerência`,
          color: 'orange',
        },
        {
          name: 'Arquitetura Quadrangular',
          icon: Activity,
          active: false,
          processing: false,
          metric: 'NÃO MENSURÁVEL',
          color: 'blue',
        },
      ];

      setSystems(updatedSystems);
      setAllSystemsReady(updatedSystems.length > 0 && updatedSystems.every(s => s.active));
    };

    updateSystems();
    const interval = setInterval(updateSystems, 2000);

    return () => clearInterval(interval);
  }, []);

  const activeCount = systems.filter(s => s.active).length;
  const processingCount = systems.filter(s => s.processing).length;

  return (
    <div className="fixed top-2 right-4 z-40">
      {/* Main indicator button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-md transition-all duration-300",
          allSystemsReady 
            ? "bg-green-500/20 border-green-500/50 hover:bg-green-500/30" 
            : "bg-yellow-500/20 border-yellow-500/50 hover:bg-yellow-500/30"
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {allSystemsReady ? (
          <CheckCircle2 className="h-4 w-4 text-green-400" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-yellow-400 animate-pulse" />
        )}
        <span className={cn(
          "text-xs font-mono font-medium",
          allSystemsReady ? "text-green-400" : "text-yellow-400"
        )}>
          {activeCount}/{systems.length} SISTEMAS
        </span>
        {processingCount > 0 && (
          <Zap className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
        )}
      </motion.button>

      {/* Expanded panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="mt-2 bg-card/95 backdrop-blur-xl border border-border/50 rounded-lg shadow-xl overflow-hidden"
          >
            <div className="p-3 space-y-2">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                Status dos Sistemas
              </div>
              
              {systems.map((system, index) => {
                const Icon = system.icon;
                return (
                  <motion.div
                    key={system.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg border",
                      system.active 
                        ? system.color === 'purple' 
                          ? "bg-purple-500/10 border-purple-500/30"
                          : system.color === 'orange'
                          ? "bg-orange-500/10 border-orange-500/30"
                          : "bg-blue-500/10 border-blue-500/30"
                        : "bg-muted/30 border-muted"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        system.active 
                          ? system.processing 
                            ? system.color === 'purple' ? "bg-purple-400 animate-pulse" : system.color === 'orange' ? "bg-orange-400 animate-pulse" : "bg-blue-400 animate-pulse"
                            : system.color === 'purple' ? "bg-purple-400" : system.color === 'orange' ? "bg-orange-400" : "bg-blue-400"
                          : "bg-muted-foreground"
                      )} />
                      <Icon className={cn(
                        "h-3.5 w-3.5",
                        system.active 
                          ? system.color === 'purple' ? "text-purple-400" : system.color === 'orange' ? "text-orange-400" : "text-blue-400"
                          : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "text-xs",
                        system.active ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {system.name}
                      </span>
                    </div>
                    <span className={cn(
                      "text-[10px] font-mono",
                      system.active 
                        ? system.color === 'purple' ? "text-purple-400" : system.color === 'orange' ? "text-orange-400" : "text-blue-400"
                        : "text-muted-foreground"
                    )}>
                      {system.metric}
                    </span>
                  </motion.div>
                );
              })}

              {/* Quick stats */}
              <div className="pt-2 mt-2 border-t border-border/30 flex justify-between text-[10px]">
                <span className="text-muted-foreground">Processamentos</span>
                <span className="font-mono text-primary">
                  {ConscienciaAlgoritmicaInstance.getMetrics().processamentosTotal}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SystemStatusIndicator;
