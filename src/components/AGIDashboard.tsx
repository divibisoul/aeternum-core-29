/**
 * AGI Dashboard - Painel de Monitoramento Completo (11 motores)
 * 
 * Integra: ConsciousnessMonitor, CausalReasoningEngine, QuantumBridge, EthicsGuardian
 * + NIP, QuantumNeural, Connectivity
 * Posicionado como sidebar tab, não como floating panel
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain, Zap, Shield, Atom, GitBranch,
  Eye, TrendingUp, Cpu, ChevronDown, ChevronUp,
  HelpCircle, Network, Wifi
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
      <div className="fixed bottom-4 left-4 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="bg-card/90 backdrop-blur-sm border-border/50 shadow-lg gap-2"
        >
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-xs font-mono">
            AGI {metrics?.overall?.activeSubsystems ?? 0}/{metrics?.overall?.subsystems ?? 11}
          </span>
          <ChevronUp className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 w-[min(90vw,700px)] max-h-[60vh]">
      <Card className="bg-card/95 backdrop-blur-md border-border/50 shadow-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Brain className="w-4 h-4 text-primary" />
              Aeternum AGI
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
            <div className="flex items-center gap-2 text-[10px] font-mono mt-1 flex-wrap">
              <span className="text-emerald-400">
                <Eye className="w-3 h-3 inline mr-0.5" />Ψ:{metrics.consciousness?.isRunning ? 'ON' : 'OFF'}
              </span>
              <span className="text-sky-400">
                G:{((metrics.godelMeta?.selfAwareness ?? 0) * 100).toFixed(0)}%
              </span>
              <span className="text-violet-400">
                D:{((metrics.darwin?.avgFitness ?? 0) * 100).toFixed(0)}%
              </span>
              <span className="text-amber-400">
                L:{((metrics.lattice?.globalFitness ?? 0) * 100).toFixed(0)}%
              </span>
              <span className="text-primary">
                Ε:{((metrics.ethics?.auditMetrics?.avgScore ?? 0) * 100).toFixed(0)}%
              </span>
              <span className="text-orange-400">
                NIP:{metrics.nip?.saudeEpistemologica ?? '?'}
              </span>
              <span className="text-cyan-400">
                Q:{((metrics.quantumNeural?.quantum?.coherence ?? 0) * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-3">
          <ScrollArea className="max-h-[45vh]">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 h-8">
                <TabsTrigger value="overview" className="text-[10px]">Motores</TabsTrigger>
                <TabsTrigger value="consciousness" className="text-[10px]">Ψ</TabsTrigger>
                <TabsTrigger value="quantum" className="text-[10px]">Quântico</TabsTrigger>
                <TabsTrigger value="ethics" className="text-[10px]">Ética</TabsTrigger>
                <TabsTrigger value="nip" className="text-[10px]">NIP</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* All 11 engines status */}
                  <Card className="border-border/30 bg-card/50">
                    <CardContent className="p-3 space-y-1.5">
                      <div className="text-xs font-medium flex items-center gap-2">
                        <Cpu className="w-3 h-3 text-primary" /> 11 Motores AGI
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
                        { name: 'NIP', status: metrics?.nip !== undefined, metric: null, label: metrics?.nip?.saudeEpistemologica },
                        { name: 'QuantumNeural', status: metrics?.quantumNeural?.initialized, metric: metrics?.quantumNeural?.quantum?.coherence },
                        { name: 'Connectivity', status: metrics?.connectivity !== undefined, metric: metrics?.connectivity?.reliability },
                      ].map((engine, i) => (
                        <div key={i} className="flex items-center justify-between text-[10px]">
                          <span className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${engine.status ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />
                            {engine.name}
                          </span>
                          <span className="font-mono text-primary">
                            {engine.label ?? (engine.metric != null ? `${(engine.metric * 100).toFixed(0)}%` : '')}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Gödel + Darwin */}
                  <div className="space-y-3">
                    <Card className="border-border/30 bg-card/50">
                      <CardContent className="p-3 space-y-1.5">
                        <div className="text-xs font-medium flex items-center gap-2">
                          <Zap className="w-3 h-3 text-amber-400" /> Gödel Meta-Cognição
                        </div>
                        {metrics?.godelMeta && (
                          <div className="space-y-1">
                            {[
                              { label: 'Auto-Consciência', value: metrics.godelMeta.selfAwareness },
                              { label: 'Introspecção', value: metrics.godelMeta.introspectionDepth },
                              { label: 'Modelagem', value: metrics.godelMeta.modelingAccuracy },
                            ].map((m, i) => (
                              <div key={i} className="space-y-0.5">
                                <div className="flex justify-between text-[10px]">
                                  <span>{m.label}</span>
                                  <span className="font-mono">{(m.value * 100).toFixed(0)}%</span>
                                </div>
                                <Progress value={m.value * 100} className="h-1" />
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-border/30 bg-card/50">
                      <CardContent className="p-3">
                        <div className="text-xs font-medium flex items-center gap-2 mb-2">
                          <TrendingUp className="w-3 h-3 text-emerald-400" /> Darwin
                        </div>
                        {metrics?.darwin && (
                          <div className="grid grid-cols-2 gap-1 text-[10px]">
                            <div>
                              <span className="text-muted-foreground">Gen</span>
                              <div className="font-mono font-bold">{metrics.darwin.generation}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Pop</span>
                              <div className="font-mono font-bold">{metrics.darwin.populationSize}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Avg</span>
                              <div className="font-mono font-bold text-emerald-400">{(metrics.darwin.avgFitness * 100).toFixed(0)}%</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Best</span>
                              <div className="font-mono font-bold text-primary">{(metrics.darwin.bestFitness * 100).toFixed(0)}%</div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Connectivity + Quantum Summary */}
                  <Card className="border-border/30 bg-card/50">
                    <CardContent className="p-3 space-y-2">
                      <div className="text-xs font-medium flex items-center gap-2">
                        <Network className="w-3 h-3 text-cyan-400" /> Mesh & Quantum
                      </div>
                      {metrics?.connectivity && (
                        <div className="space-y-1 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Mesh Nodes</span>
                            <span className="font-mono">{metrics.connectivity.meshNodes}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Avg Latency</span>
                            <span className="font-mono">{metrics.connectivity.avgLatency.toFixed(1)}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Reliability</span>
                            <span className="font-mono text-emerald-400">{(metrics.connectivity.reliability * 100).toFixed(2)}%</span>
                          </div>
                        </div>
                      )}
                      {metrics?.quantumNeural && (
                        <div className="space-y-1 text-[10px] pt-1 border-t border-border/30">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Q-Coherence</span>
                            <span className="font-mono text-cyan-400">{(metrics.quantumNeural.quantum.coherence * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Q-Fidelity</span>
                            <span className="font-mono">{(metrics.quantumNeural.quantum.fidelity * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Entangled</span>
                            <span className="font-mono">{metrics.quantumNeural.quantum.entangledNodes} nodes</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Neural Signals</span>
                            <span className="font-mono">{metrics.quantumNeural.neural.signalCount}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Safety */}
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

              <TabsContent value="nip" className="mt-3">
                <NIPDashboard metrics={metrics?.nip} agi={AeternumAGI.getInstance()} />
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// NIP-specific dashboard
function NIPDashboard({ metrics, agi }: { metrics: any; agi: any }) {
  const [duvidas, setDuvidas] = useState<any[]>([]);
  const [rupturas, setRupturas] = useState<any[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDuvidas(agi.nip.getDuvidasAtivas());
      setRupturas(agi.nip.getHistoricoRupturas());
    }, 3000);
    return () => clearInterval(interval);
  }, [agi]);

  return (
    <div className="space-y-3">
      <Card className="border-border/30 bg-card/50">
        <CardContent className="p-3 space-y-2">
          <div className="text-xs font-medium flex items-center gap-2">
            <HelpCircle className="w-3 h-3 text-orange-400" /> Núcleo de Incerteza Produtiva
          </div>
          {metrics && (
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saúde Epistemológica</span>
                <Badge className={
                  metrics.saudeEpistemologica === 'saudavel' ? 'bg-emerald-500/20 text-emerald-400' :
                  metrics.saudeEpistemologica === 'rigida' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-red-500/20 text-red-400'
                }>
                  {metrics.saudeEpistemologica}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dúvidas Ativas</span>
                <span className="font-mono">{metrics.totalDuvidasAtivas}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rupturas Epistêmicas</span>
                <span className="font-mono text-orange-400">{metrics.totalRupturasEpistemicas}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa Incerteza</span>
                <span className="font-mono">{(metrics.taxaIncertezaAtual * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Certeza Residual Média</span>
                <span className="font-mono">{(metrics.mediaCertezaResidual * 100).toFixed(1)}%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent ruptures */}
      {rupturas.length > 0 && (
        <Card className="border-border/30 bg-card/50">
          <CardContent className="p-3 space-y-1.5">
            <div className="text-xs font-medium">Últimas Rupturas Epistêmicas</div>
            {rupturas.slice(-5).reverse().map((r, i) => (
              <div key={i} className="text-[10px] p-1.5 bg-muted/20 rounded border border-border/20">
                <div className="text-orange-400 truncate">{r.motivoRuptura}</div>
                <div className="text-muted-foreground mt-0.5">
                  Certeza: {(r.certezaAnterior * 100).toFixed(0)}% → {(r.novaCerteza * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active doubts */}
      {duvidas.length > 0 && (
        <Card className="border-border/30 bg-card/50">
          <CardContent className="p-3 space-y-1.5">
            <div className="text-xs font-medium">Dúvidas Ativas ({duvidas.length})</div>
            {duvidas.slice(0, 5).map((d, i) => (
              <div key={i} className="text-[10px] p-1.5 bg-muted/20 rounded border border-border/20">
                <div className="truncate">{d.proposicao}</div>
                <div className="text-muted-foreground">
                  Certeza: {(d.nivelCerteza * 100).toFixed(0)}% | Questionamentos: {d.contadorQuestionamento}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
