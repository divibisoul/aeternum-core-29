/**
 * AGI Dashboard - Painel de Monitoramento Completo
 * Integra: ConsciousnessMonitor, CausalReasoningEngine, QuantumBridge, EthicsGuardian
 * + Métricas de todos os 8 motores AGI em tempo real
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Brain, Zap, Shield, Atom, GitBranch,
  Eye, TrendingUp, Cpu, ChevronDown, ChevronUp
} from 'lucide-react';
import { AeternumAGI } from '@/core/agi';
import { ConsciousnessMonitor } from '@/components/agi/ConsciousnessMonitor';
import { CausalReasoningEngine } from '@/components/agi/CausalReasoningEngine';
import { QuantumBridge } from '@/components/agi/QuantumBridge';
import { EthicsGuardian } from '@/components/agi/EthicsGuardian';

export function AGIDashboard() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const agi = AeternumAGI.getInstance();
    
    const interval = setInterval(() => {
      if (agi.initialized) {
        setMetrics(agi.getFullMetrics());
      }
    }, 2000);

    if (agi.initialized) {
      setMetrics(agi.getFullMetrics());
    }

    return () => clearInterval(interval);
  }, []);

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 left-4 z-[100]">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="bg-card/90 backdrop-blur-sm border-border/50 shadow-lg gap-2"
        >
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-xs font-mono">
            AGI {metrics?.overall?.activeSubsystems ?? 0}/8
          </span>
          <ChevronUp className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-[100] w-[calc(100vw-2rem)] max-w-4xl max-h-[80vh] overflow-hidden">
      <Card className="bg-card/95 backdrop-blur-md border-border/50 shadow-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Brain className="w-4 h-4 text-primary" />
              Aeternum AGI - Painel de Controle
              {metrics && (
                <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">
                  {metrics.overall.activeSubsystems}/{metrics.overall.subsystems} ONLINE
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          {metrics && (
            <div className="flex items-center gap-3 text-[10px] font-mono mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-emerald-400">
                <Eye className="w-3 h-3" /> Consciousness: {metrics.consciousness?.isRunning ? 'ON' : 'OFF'}
              </span>
              <span className="flex items-center gap-1 text-sky-400">
                <GitBranch className="w-3 h-3" /> Gödel: {((metrics.godelMeta?.selfAwareness ?? 0) * 100).toFixed(0)}%
              </span>
              <span className="flex items-center gap-1 text-violet-400">
                <TrendingUp className="w-3 h-3" /> Darwin: {((metrics.darwin?.avgFitness ?? 0) * 100).toFixed(0)}%
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <Atom className="w-3 h-3" /> Lattice: {((metrics.lattice?.globalFitness ?? 0) * 100).toFixed(0)}%
              </span>
              <span className="flex items-center gap-1 text-primary">
                <Shield className="w-3 h-3" /> Ethics: {((metrics.ethics?.auditMetrics?.avgScore ?? 0) * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-3 overflow-y-auto max-h-[60vh]">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 h-8">
              <TabsTrigger value="overview" className="text-xs">Visão Geral</TabsTrigger>
              <TabsTrigger value="consciousness" className="text-xs">Consciência</TabsTrigger>
              <TabsTrigger value="quantum" className="text-xs">Quântico</TabsTrigger>
              <TabsTrigger value="ethics" className="text-xs">Ética</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card className="border-border/30 bg-card/50">
                  <CardContent className="p-3 space-y-2">
                    <div className="text-xs font-medium flex items-center gap-2">
                      <Cpu className="w-3 h-3 text-primary" /> Motores AGI
                    </div>
                    {[
                      { name: 'GodelAgent', status: true, metric: metrics?.godelMeta?.selfAwareness },
                      { name: 'DarwinMachine', status: metrics?.darwin?.isRunning, metric: metrics?.darwin?.avgFitness },
                      { name: 'NeuralLattice', status: metrics?.lattice?.isRunning, metric: metrics?.lattice?.globalFitness },
                      { name: 'Consciousness', status: metrics?.consciousness?.isRunning, metric: null },
                      { name: 'SafeCore', status: true, metric: null },
                      { name: 'SelfHealing', status: metrics?.healing !== null, metric: metrics?.healing?.overallScore },
                      { name: 'EthicalOptimizer', status: metrics?.ethics?.isRunning, metric: metrics?.ethics?.auditMetrics?.avgScore },
                      { name: 'HyperSafety', status: metrics?.safety !== null, metric: metrics?.safety?.overallHealth },
                    ].map((engine, i) => (
                      <div key={i} className="flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${engine.status ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />
                          {engine.name}
                        </span>
                        {engine.metric != null && (
                          <span className="font-mono text-primary">{(engine.metric * 100).toFixed(0)}%</span>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-border/30 bg-card/50">
                  <CardContent className="p-3 space-y-2">
                    <div className="text-xs font-medium flex items-center gap-2">
                      <Zap className="w-3 h-3 text-amber-400" /> Gödel Agent - Meta-Cognição
                    </div>
                    {metrics?.godelMeta && (
                      <div className="space-y-1.5">
                        {[
                          { label: 'Auto-Consciência', value: metrics.godelMeta.selfAwareness },
                          { label: 'Profundidade Introspecção', value: metrics.godelMeta.introspectionDepth },
                          { label: 'Precisão Modelagem', value: metrics.godelMeta.modelingAccuracy },
                          { label: 'Capacidade Melhoria', value: metrics.godelMeta.improvementCapacity },
                        ].map((m, i) => (
                          <div key={i} className="space-y-0.5">
                            <div className="flex justify-between text-[10px]">
                              <span>{m.label}</span>
                              <span className="font-mono">{(m.value * 100).toFixed(1)}%</span>
                            </div>
                            <Progress value={m.value * 100} className="h-1" />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/30 bg-card/50">
                  <CardContent className="p-3 space-y-2">
                    <div className="text-xs font-medium flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-emerald-400" /> Darwin Machine
                    </div>
                    {metrics?.darwin && (
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-muted-foreground">Geração</span>
                          <div className="font-mono font-bold">{metrics.darwin.generation}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">População</span>
                          <div className="font-mono font-bold">{metrics.darwin.populationSize}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fitness Médio</span>
                          <div className="font-mono font-bold text-emerald-400">{(metrics.darwin.avgFitness * 100).toFixed(1)}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Melhor Fitness</span>
                          <div className="font-mono font-bold text-primary">{(metrics.darwin.bestFitness * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/30 bg-card/50">
                  <CardContent className="p-3 space-y-2">
                    <div className="text-xs font-medium flex items-center gap-2">
                      <Shield className="w-3 h-3 text-sky-400" /> Hyper Safety
                    </div>
                    {metrics?.safety && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px]">
                          <span>Saúde Geral</span>
                          <span className="font-mono text-emerald-400">{(metrics.safety.overallHealth * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={metrics.safety.overallHealth * 100} className="h-1.5" />
                        <div className="text-[10px] text-muted-foreground">
                          Status: {metrics.safety.status}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="consciousness" className="mt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ConsciousnessMonitor />
                <CausalReasoningEngine />
              </div>
            </TabsContent>

            <TabsContent value="quantum" className="mt-3">
              <QuantumBridge />
            </TabsContent>

            <TabsContent value="ethics" className="mt-3">
              <EthicsGuardian />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
