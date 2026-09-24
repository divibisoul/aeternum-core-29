/**
 * AGI Dashboard - Painel de Monitoramento Completo (13 motores)
 * 
 * Integra: ConsciousnessMonitor, CausalReasoningEngine, QuantumBridge, EthicsGuardian
 * + NIP, QuantumNeural, Connectivity, SAIIC, ResourceManager
 * 
 * Posicionado para NÃO cobrir o input do chat.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain, Zap, Shield, Network,
  Eye, TrendingUp, Cpu, ChevronDown, ChevronUp,
  HelpCircle, Activity, AlertTriangle, Wrench
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
      if (agi.initialized) setMetrics(agi.getFullMetrics());
    }, 2000);
    if (agi.initialized) setMetrics(agi.getFullMetrics());
    return () => clearInterval(interval);
  }, []);

  if (!isExpanded) {
    return (
      <div className="fixed top-14 left-[72px] z-30">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="bg-card/90 backdrop-blur-sm border-border/50 shadow-lg gap-2"
        >
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-xs font-mono">
            AGI {metrics?.overall?.activeSubsystems ?? 0}/{metrics?.overall?.subsystems ?? 13}
          </span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-14 left-[72px] z-30 w-[min(85vw,700px)] max-h-[70vh]">
      <Card className="bg-card/95 backdrop-blur-md border-border/50 shadow-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Brain className="w-4 h-4 text-primary" />
              Aeternum AGI
              {metrics && (
                <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">
                  {metrics.overall.activeSubsystems}/{metrics.overall.subsystems} LOOPS ATIVOS
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>

          {metrics && (
            <div className="flex items-center gap-2 text-[10px] font-mono mt-1 flex-wrap">
              <span className="text-emerald-400">
                <Eye className="w-3 h-3 inline mr-0.5" />Ψ:{metrics.consciousness?.isRunning ? 'ON' : 'OFF'}
              </span>
              <span className="text-sky-400">G:{((metrics.godelMeta?.selfAwareness ?? 0) * 100).toFixed(0)}%</span>
              <span className="text-violet-400">D:{((metrics.darwin?.avgFitness ?? 0) * 100).toFixed(0)}%</span>
              <span className="text-amber-400">L:{((metrics.lattice?.globalFitness ?? 0) * 100).toFixed(0)}%</span>
              <span className="text-primary">Ε:{((metrics.ethics?.auditMetrics?.avgScore ?? 0) * 100).toFixed(0)}%</span>
              <span className="text-orange-400">NIP:{metrics.nip?.saudeEpistemologica ?? '?'}</span>
              <span className="text-cyan-400">Q:{((metrics.quantumNeural?.quantum?.coherence ?? 0) * 100).toFixed(0)}%</span>
              <span className="text-red-400">SAIIC:{((metrics.saiic?.overallIntegrity ?? 0) * 100).toFixed(0)}%</span>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-3">
          <ScrollArea className="max-h-[55vh]">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-6 h-8">
                <TabsTrigger value="overview" className="text-[10px]">Motores</TabsTrigger>
                <TabsTrigger value="saiic" className="text-[10px]">SAIIC</TabsTrigger>
                <TabsTrigger value="consciousness" className="text-[10px]">Ψ</TabsTrigger>
                <TabsTrigger value="quantum" className="text-[10px]">Quântico</TabsTrigger>
                <TabsTrigger value="ethics" className="text-[10px]">Ética</TabsTrigger>
                <TabsTrigger value="nip" className="text-[10px]">NIP</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* All 13 engines */}
                  <Card className="border-border/30 bg-card/50">
                    <CardContent className="p-3 space-y-1.5">
                      <div className="text-xs font-medium flex items-center gap-2">
                        <Cpu className="w-3 h-3 text-primary" /> 13 Motores AGI
                      </div>
                      {[
                        { name: 'SAIIC', status: metrics?.saiic?.isRunning, metric: metrics?.saiic?.overallIntegrity, priority: true },
                        { name: 'ResourceMgr', status: metrics?.resources?.isRunning, metric: null, label: `${metrics?.resources?.modulesManaged ?? 0} mods` },
                        { name: 'GodelAgent', status: Boolean(metrics?.godelMeta), metric: metrics?.godelMeta?.selfAwareness },
                        { name: 'DarwinMachine', status: metrics?.darwin?.isRunning, metric: metrics?.darwin?.avgFitness },
                        { name: 'NeuralLattice', status: metrics?.lattice?.isRunning, metric: metrics?.lattice?.globalFitness },
                        { name: 'Consciousness', status: metrics?.consciousness?.isRunning, metric: null },
                        { name: 'SafeCore', status: Boolean(metrics?.overall?.initialized), metric: null },
                        { name: 'SelfHealing', status: metrics?.healing?.observedModules > 0, metric: metrics?.healing?.overallScore },
                        { name: 'EthicalOpt', status: metrics?.ethics?.isRunning, metric: metrics?.ethics?.auditMetrics?.avgScore },
                        { name: 'HyperSafety', status: metrics?.safety !== null, metric: metrics?.safety?.overallHealth },
                        { name: 'NIP', status: metrics?.nip !== undefined, metric: null, label: metrics?.nip?.saudeEpistemologica },
                        { name: 'QuantumNeural', status: metrics?.quantumNeural?.initialized, metric: metrics?.quantumNeural?.quantum?.coherence },
                        { name: 'Connectivity', status: metrics?.connectivity !== undefined, metric: metrics?.connectivity?.reliability },
                      ].map((engine, i) => (
                        <div key={i} className="flex items-center justify-between text-[10px]">
                          <span className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${engine.status ? engine.priority ? 'bg-red-400 animate-pulse' : 'bg-emerald-400' : 'bg-muted-foreground'}`} />
                            {engine.name}
                          </span>
                          <span className="font-mono text-primary">
                            {engine.label ?? (engine.metric != null ? `${(engine.metric * 100).toFixed(0)}%` : '')}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <div className="space-y-3">
                    {/* Gödel + Darwin */}
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
                            <div><span className="text-muted-foreground">Gen</span><div className="font-mono font-bold">{metrics.darwin.generation}</div></div>
                            <div><span className="text-muted-foreground">Pop</span><div className="font-mono font-bold">{metrics.darwin.populationSize}</div></div>
                            <div><span className="text-muted-foreground">Avg</span><div className="font-mono font-bold text-emerald-400">{(metrics.darwin.avgFitness * 100).toFixed(0)}%</div></div>
                            <div><span className="text-muted-foreground">Best</span><div className="font-mono font-bold text-primary">{(metrics.darwin.bestFitness * 100).toFixed(0)}%</div></div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Connectivity + Resources */}
                  <Card className="border-border/30 bg-card/50">
                    <CardContent className="p-3 space-y-2">
                      <div className="text-xs font-medium flex items-center gap-2">
                        <Network className="w-3 h-3 text-cyan-400" /> Mesh & Resources
                      </div>
                      {metrics?.connectivity && (
                        <div className="space-y-1 text-[10px]">
                          <div className="flex justify-between"><span className="text-muted-foreground">Mesh Nodes</span><span className="font-mono">{metrics.connectivity.meshNodes}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Avg Latency</span><span className="font-mono">{metrics.connectivity.avgLatency > 0 ? metrics.connectivity.avgLatency.toFixed(1) + 'ms' : 'NÃO MENSURÁVEL'}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Reliability</span><span className="font-mono text-emerald-400">{metrics.connectivity.reliabilitySource === 'OBSERVED' ? (metrics.connectivity.reliability * 100).toFixed(2) + '%' : 'NÃO MENSURÁVEL'}</span></div>
                        </div>
                      )}
                      {metrics?.resources && (
                        <div className="space-y-1 text-[10px] pt-1 border-t border-border/30">
                          <div className="flex justify-between"><span className="text-muted-foreground">CPU Usage</span><span className="font-mono">{(metrics.resources.totalCpuUsage * 100).toFixed(0)}%</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Memory</span><span className="font-mono">{(metrics.resources.totalMemoryUsage * 100).toFixed(0)}%</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Quantum Slice</span><span className="font-mono">{metrics.resources.avgQuantumSliceMs.toFixed(0)}ms</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Rebalances</span><span className="font-mono">{metrics.resources.rebalanceCount}</span></div>
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
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* SAIIC Tab - NEW */}
              <TabsContent value="saiic" className="mt-3">
                <SAIICDashboard metrics={metrics?.saiic} agi={AeternumAGI.getInstance()} />
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

// SAIIC Dashboard
function SAIICDashboard({ metrics, agi }: { metrics: any; agi: any }) {
  const [anticorpoHistory, setAnticorpoHistory] = useState<any[]>([]);
  const [diagnostics, setDiagnostics] = useState<any[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnticorpoHistory(agi.saiic.getAnticorpoHistory());
      setDiagnostics(agi.saiic.getAllDiagnostics());
    }, 2000);
    return () => clearInterval(interval);
  }, [agi]);

  return (
    <div className="space-y-3">
      <Card className="border-border/30 bg-card/50">
        <CardContent className="p-3 space-y-2">
          <div className="text-xs font-medium flex items-center gap-2">
            <Shield className="w-3 h-3 text-red-400" /> SAIIC - Auto-Integridade
          </div>
          {metrics && (
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Integridade Geral</span>
                <span className={`font-mono ${metrics.overallIntegrity === null ? 'text-muted-foreground' : metrics.overallIntegrity > 0.9 ? 'text-emerald-400' : metrics.overallIntegrity > 0.7 ? 'text-amber-400' : 'text-red-400'}`}>
                  {metrics.overallIntegrity === null ? 'NÃO MENSURÁVEL' : (metrics.overallIntegrity * 100).toFixed(1) + '%'}
                </span>
              </div>
              {metrics.overallIntegrity !== null && <Progress value={metrics.overallIntegrity * 100} className="h-1.5" />}
              <div className="flex justify-between"><span className="text-muted-foreground">Ciclos de Scan</span><span className="font-mono">{metrics.scanCycles}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Módulos Monitorados</span><span className="font-mono">{metrics.modulesMonitored}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Ações Anticorpo</span><span className="font-mono text-orange-400">{metrics.totalAnticorpoActions}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Módulos Isolados</span><span className="font-mono">{metrics.isolatedModules}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Loops Detectados</span><span className="font-mono text-red-400">{metrics.loopsDetected}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Inconsistências Resolvidas</span><span className="font-mono text-emerald-400">{metrics.inconsistenciesResolved}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Scan Latency</span><span className="font-mono">{metrics.avgScanLatencyMs.toFixed(2)}ms</span></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Module Diagnostics */}
      <Card className="border-border/30 bg-card/50">
        <CardContent className="p-3 space-y-2">
          <div className="text-xs font-medium flex items-center gap-2">
            <Activity className="w-3 h-3 text-cyan-400" /> Diagnóstico por Módulo
          </div>
          <div className="space-y-1">
            {diagnostics.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${d.healthy ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  {d.moduleId}
                </span>
                <span className="font-mono text-muted-foreground">
                  CPU:{(d.cpuLoad * 100).toFixed(0)}% MEM:{(d.memoryUsage * 100).toFixed(0)}% ERR:{(d.errorRate * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Anticorpo History */}
      {anticorpoHistory.length > 0 && (
        <Card className="border-border/30 bg-card/50">
          <CardContent className="p-3 space-y-2">
            <div className="text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-3 h-3 text-orange-400" /> Anticorpo Digital (últimas ações)
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {anticorpoHistory.slice(-5).reverse().map((a, i) => (
                <div key={i} className="text-[9px] bg-card/30 rounded p-1.5 border border-border/20">
                  <div className="flex items-center gap-1">
                    <Badge className={`text-[8px] ${a.action === 'corrected' ? 'bg-emerald-500/20 text-emerald-400' : a.action === 'isolated' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {a.action}
                    </Badge>
                    <span className="text-muted-foreground">{a.targetModule}</span>
                    <span className="text-muted-foreground/50">{a.anomalyType}</span>
                  </div>
                  <div className="text-muted-foreground/70 mt-0.5">{a.details}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// NIP Dashboard
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
                }>{metrics.saudeEpistemologica}</Badge>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Dúvidas Ativas</span><span className="font-mono">{metrics.totalDuvidasAtivas}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Rupturas Epistêmicas</span><span className="font-mono text-orange-400">{metrics.totalRupturasEpistemicas}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Taxa Incerteza</span><span className="font-mono">{(metrics.taxaIncertezaAtual * 100).toFixed(1)}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Certeza Residual</span><span className="font-mono">{(metrics.mediaCertezaResidual * 100).toFixed(1)}%</span></div>
            </div>
          )}
        </CardContent>
      </Card>

      {duvidas.length > 0 && (
        <Card className="border-border/30 bg-card/50">
          <CardContent className="p-3 space-y-2">
            <div className="text-xs font-medium">Dúvidas Ativas ({duvidas.length})</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {duvidas.slice(0, 5).map((d, i) => (
                <div key={i} className="text-[9px] bg-card/30 rounded p-1.5 border border-border/20">
                  <div className="font-mono text-orange-400 mb-0.5">Certeza: {(d.nivelCerteza * 100).toFixed(1)}%</div>
                  <div className="text-muted-foreground truncate">{d.proposicao}</div>
                  <div className="text-muted-foreground/50">{d.evidenciasContrarias.length} contra-evidência(s)</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {rupturas.length > 0 && (
        <Card className="border-border/30 bg-card/50">
          <CardContent className="p-3 space-y-2">
            <div className="text-xs font-medium">Rupturas Epistêmicas ({rupturas.length})</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {rupturas.slice(-5).reverse().map((r, i) => (
                <div key={i} className="text-[9px] bg-card/30 rounded p-1.5 border border-border/20">
                  <div className="flex items-center gap-1">
                    <span className="text-amber-400 font-mono">{(r.certezaAnterior * 100).toFixed(0)}%→{(r.novaCerteza * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-muted-foreground/70 truncate">{r.motivoRuptura}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
