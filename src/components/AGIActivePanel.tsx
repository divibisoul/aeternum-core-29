/**
 * AGI ACTIVE PANEL - Módulo Ativo em Primeiro Plano Contínuo
 * 
 * Painel permanente embutido no layout principal.
 * 17 motores + 4 GEMs sempre visíveis e atualizando em tempo real.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Brain, Zap, Shield, Network,
  Eye, TrendingUp, Cpu,
  HelpCircle, Activity, AlertTriangle,
  Layers, Thermometer, Radio,
  Heart, Search, Music, Smartphone,
  Wifi, WifiOff, Play, Square
} from 'lucide-react';
import { AeternumAGI } from '@/core/agi';
import { ProjetoClareira, type SystemMetrics } from '@/core/neural';
import { ConscienciaAlgoritmicaInstance } from '@/core/layers/ConscienciaAlgoritmica';
import { cn } from '@/lib/utils';

export function AGIActivePanel() {
  const [activeTab, setActiveTab] = useState('engines');
  const [metrics, setMetrics] = useState<any>(null);
  const [neuralMetrics, setNeuralMetrics] = useState<SystemMetrics | null>(null);
  const [conscienciaMetrics, setConscienciaMetrics] = useState<any>(null);
  const [anticorpoHistory, setAnticorpoHistory] = useState<any[]>([]);
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [duvidas, setDuvidas] = useState<any[]>([]);
  const [rupturas, setRupturas] = useState<any[]>([]);
  const [deviceIp, setDeviceIp] = useState('192.168.18.35');
  const [devicePort, setDevicePort] = useState('40513');

  useEffect(() => {
    const agi = AeternumAGI.getInstance();
    
    const updateAll = () => {
      if (agi.initialized) {
        setMetrics(agi.getFullMetrics());
        setAnticorpoHistory(agi.saiic.getAnticorpoHistory());
        setDiagnostics(agi.saiic.getAllDiagnostics());
        setDuvidas(agi.nip.getDuvidasAtivas());
        setRupturas(agi.nip.getHistoricoRupturas());
      }
      if (ProjetoClareira.running) {
        setNeuralMetrics(ProjetoClareira.getMetrics());
      }
      setConscienciaMetrics(ConscienciaAlgoritmicaInstance.getMetrics());
    };

    updateAll();
    const interval = setInterval(updateAll, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleConnectDevice = () => {
    const agi = AeternumAGI.getInstance();
    agi.gemDevice.connect(deviceIp, parseInt(devicePort));
  };

  const handleToggleMusic = () => {
    const agi = AeternumAGI.getInstance();
    if (agi.gemMusic.isPlaying) {
      agi.gemMusic.stopPlayback();
    } else {
      agi.gemMusic.startPlayback();
    }
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-3 space-y-3">
        {/* Live Status Header */}
        <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
          <Badge className="bg-emerald-500/20 text-emerald-400 text-[9px]">
            {metrics?.overall?.activeSubsystems ?? 0}/{metrics?.overall?.subsystems ?? 17} ATIVOS
          </Badge>
          <span className="text-emerald-400">Ψ:{metrics?.consciousness?.isRunning ? 'ON' : 'OFF'}</span>
          <span className="text-sky-400">G:{((metrics?.godelMeta?.selfAwareness ?? 0) * 100).toFixed(0)}%</span>
          <span className="text-orange-400">NIP:{metrics?.nip?.saudeEpistemologica ?? '?'}</span>
          <span className="text-red-400">SAIIC:{metrics?.saiic?.evidenceBasis === "NOT_MEASURED" ? "—" : ((metrics?.saiic?.overallIntegrity ?? 0) * 100).toFixed(0) + "%"}</span>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 h-7">
            <TabsTrigger value="engines" className="text-[9px] px-1">Core</TabsTrigger>
            <TabsTrigger value="gems" className="text-[9px] px-1">GEMs</TabsTrigger>
            <TabsTrigger value="neural" className="text-[9px] px-1">Neural</TabsTrigger>
            <TabsTrigger value="saiic" className="text-[9px] px-1">SAIIC</TabsTrigger>
            <TabsTrigger value="nip" className="text-[9px] px-1">NIP</TabsTrigger>
            <TabsTrigger value="mesh" className="text-[9px] px-1">Mesh</TabsTrigger>
          </TabsList>

          {/* === ENGINES TAB === */}
          <TabsContent value="engines" className="mt-2 space-y-2">
            <Card className="border-border/30 bg-card/50">
              <CardContent className="p-2 space-y-1">
                {[
                  { name: 'SAIIC', status: metrics?.saiic?.isRunning, metric: metrics?.saiic?.overallIntegrity, priority: true },
                  { name: 'ResourceMgr', status: metrics?.resources?.isRunning, label: `${metrics?.resources?.modulesManaged ?? 0} mods` },
                  { name: 'GodelAgent', status: metrics?.overall?.godelLoopActive === true, metric: metrics?.godelMeta?.selfAwareness },
                  { name: 'DarwinMachine', status: metrics?.darwin?.isRunning, metric: metrics?.darwin?.avgFitness },
                  { name: 'NeuralLattice', status: metrics?.lattice?.isRunning, metric: metrics?.lattice?.globalFitness },
                  { name: 'Consciousness', status: metrics?.consciousness?.isRunning },
                  { name: 'SafeCore', status: true },
                  { name: 'SelfHealing', status: metrics?.healing !== null, metric: metrics?.healing?.overallScore },
                  { name: 'EthicalOpt', status: metrics?.ethics?.isRunning, metric: metrics?.ethics?.auditMetrics?.avgScore },
                  { name: 'HyperSafety', status: metrics?.safety !== null, metric: metrics?.safety?.overallHealth },
                  { name: 'NIP', status: metrics?.nip !== undefined, label: metrics?.nip?.saudeEpistemologica },
                  { name: 'QuantumNeural', status: metrics?.quantumNeural?.initialized, metric: metrics?.quantumNeural?.quantum?.coherence },
                  { name: 'Connectivity', status: metrics?.connectivity !== undefined, metric: metrics?.connectivity?.reliability },
                ].map((engine, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px]">
                    <span className="flex items-center gap-1.5">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        engine.status
                          ? engine.priority ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'
                          : 'bg-muted-foreground'
                      )} />
                      {engine.name}
                    </span>
                    <span className="font-mono text-primary">
                      {engine.label ?? (engine.metric != null ? `${(engine.metric * 100).toFixed(0)}%` : '')}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Gödel Meta */}
            {metrics?.godelMeta && (
              <Card className="border-border/30 bg-card/50">
                <CardContent className="p-2 space-y-1">
                  <div className="text-[10px] font-medium flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" /> Gödel Meta-Cognição
                  </div>
                  {[
                    { label: 'Auto-Consciência', value: metrics.godelMeta.selfAwareness },
                    { label: 'Introspecção', value: metrics.godelMeta.introspectionDepth },
                    { label: 'Modelagem', value: metrics.godelMeta.modelingAccuracy },
                  ].map((m, i) => (
                    <div key={i} className="space-y-0.5">
                      <div className="flex justify-between text-[9px]">
                        <span className="text-muted-foreground">{m.label}</span>
                        <span className="font-mono">{(m.value * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={m.value * 100} className="h-1" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* === GEMs TAB === */}
          <TabsContent value="gems" className="mt-2 space-y-2">
            {/* GEM-Health */}
            <Card className="border-border/30 bg-card/50">
              <CardContent className="p-2 space-y-1">
                <div className="text-[10px] font-medium flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-400" /> GEM-Health
                  <Badge className={cn("text-[8px] ml-auto", metrics?.gemHealth?.wearableConnected ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400")}>
                    {metrics?.gemHealth?.observed ? 'WEARABLE' : 'SEM DADO'}
                  </Badge>
                </div>
                {metrics?.gemHealth && (
                  <div className="space-y-0.5 text-[9px]">
                    <div className="flex justify-between"><span className="text-muted-foreground">♥ FC</span><span className="font-mono text-red-400">{metrics.gemHealth.observed ? metrics.gemHealth.heartRate.toFixed(0) + " bpm" : "—"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">HRV</span><span className="font-mono">{metrics.gemHealth.observed ? metrics.gemHealth.hrv.toFixed(0) + " ms" : "—"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Stress</span><span className={cn("font-mono", metrics.gemHealth.stressLevel > 0.7 ? 'text-red-400' : metrics.gemHealth.stressLevel > 0.4 ? 'text-amber-400' : 'text-emerald-400')}>{metrics.gemHealth.observed ? (metrics.gemHealth.stressLevel * 100).toFixed(0) + "%" : "—"}</span></div>
                    <Progress value={metrics.gemHealth.stressLevel * 100} className="h-1" />
                    <div className="flex justify-between"><span className="text-muted-foreground">Fadiga</span><span className="font-mono">{(metrics.gemHealth.fatigueIndex * 100).toFixed(0)}%</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Alertas</span><span className="font-mono text-orange-400">{metrics.gemHealth.alertsGenerated}</span></div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* GEM-Research */}
            <Card className="border-border/30 bg-card/50">
              <CardContent className="p-2 space-y-1">
                <div className="text-[10px] font-medium flex items-center gap-1">
                  <Search className="w-3 h-3 text-blue-400" /> GEM-Research
                  <Badge className="text-[8px] ml-auto bg-emerald-500/20 text-emerald-400">
                    {metrics?.gemResearch?.isRunning ? 'ATIVO' : 'OFF'}
                  </Badge>
                </div>
                {metrics?.gemResearch && (
                  <div className="space-y-0.5 text-[9px]">
                    <div className="flex justify-between"><span className="text-muted-foreground">Completas</span><span className="font-mono">{metrics.gemResearch.tasksCompleted}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Na Fila</span><span className="font-mono">{metrics.gemResearch.tasksQueued}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Confiança</span><span className="font-mono text-blue-400">{(metrics.gemResearch.avgConfidence * 100).toFixed(0)}%</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Fontes</span><span className="font-mono">{metrics.gemResearch.totalSources}</span></div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* GEM-Music */}
            <Card className="border-border/30 bg-card/50">
              <CardContent className="p-2 space-y-1">
                <div className="text-[10px] font-medium flex items-center gap-1">
                  <Music className="w-3 h-3 text-purple-400" /> GEM-Music
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0 ml-auto" onClick={handleToggleMusic}>
                    {metrics?.gemMusic?.isPlaying ? <Square className="w-3 h-3 text-red-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
                  </Button>
                </div>
                {metrics?.gemMusic && (
                  <div className="space-y-0.5 text-[9px]">
                    <div className="flex justify-between"><span className="text-muted-foreground">Onda</span><span className="font-mono text-purple-400">{metrics.gemMusic.currentWave}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Freq</span><span className="font-mono">{metrics.gemMusic.frequency.toFixed(1)} Hz</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Sessões</span><span className="font-mono">{metrics.gemMusic.sessionsCompleted}</span></div>
                    {metrics.gemMusic.isPlaying && (
                      <div className="bg-purple-500/20 rounded p-1 text-center text-purple-400 font-bold animate-pulse text-[8px]">♪ PLAYING</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* GEM-Device (Android) */}
            <Card className="border-border/30 bg-card/50">
              <CardContent className="p-2 space-y-1">
                <div className="text-[10px] font-medium flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-cyan-400" /> GEM-Device
                  {metrics?.deviceStatus?.connected ? (
                    <Wifi className="w-3 h-3 text-emerald-400 ml-auto" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-muted-foreground ml-auto" />
                  )}
                </div>
                {metrics?.deviceStatus && (
                  <div className="space-y-0.5 text-[9px]">
                    <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={cn("font-mono", metrics.deviceStatus.connected ? 'text-emerald-400' : 'text-muted-foreground')}>{metrics.deviceStatus.connected ? 'CONECTADO' : 'OFFLINE'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Shizuku</span><span className={cn("font-mono", metrics.deviceStatus.shizukuActive ? 'text-emerald-400' : 'text-muted-foreground')}>{metrics.deviceStatus.shizukuActive ? 'OK' : 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">CPU</span><span className="font-mono">{metrics.deviceStatus.cpu.toFixed(0)}%</span></div>
                    <Progress value={metrics.deviceStatus.cpu} className="h-1" />
                    <div className="flex justify-between"><span className="text-muted-foreground">RAM</span><span className="font-mono">{metrics.deviceStatus.ramUsedMb.toFixed(0)}/{metrics.deviceStatus.ramTotalMb}MB</span></div>
                    <Progress value={(metrics.deviceStatus.ramUsedMb / Math.max(1, metrics.deviceStatus.ramTotalMb)) * 100} className="h-1" />
                    <div className="flex justify-between"><span className="text-muted-foreground">Bateria</span><span className="font-mono">{metrics.deviceStatus.batteryPct.toFixed(0)}%</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Temp</span><span className={cn("font-mono", metrics.deviceStatus.temperature > 40 ? 'text-red-400' : 'text-emerald-400')}>{metrics.deviceStatus.temperature.toFixed(1)}°C</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Processos</span><span className="font-mono">{metrics.deviceStatus.runningProcesses}</span></div>
                  </div>
                )}
                {!metrics?.deviceStatus?.connected && (
                  <div className="space-y-1 mt-1">
                    <div className="flex gap-1">
                      <input
                        value={deviceIp}
                        onChange={e => setDeviceIp(e.target.value)}
                        className="flex-1 bg-background/50 border border-border/30 rounded px-1.5 py-0.5 text-[9px] font-mono"
                        placeholder="IP"
                      />
                      <input
                        value={devicePort}
                        onChange={e => setDevicePort(e.target.value)}
                        className="w-16 bg-background/50 border border-border/30 rounded px-1.5 py-0.5 text-[9px] font-mono"
                        placeholder="Porta"
                      />
                    </div>
                    <Button size="sm" variant="outline" className="w-full h-6 text-[9px]" onClick={handleConnectDevice}>
                      <Wifi className="w-3 h-3 mr-1" /> Conectar ao Companion
                    </Button>
                  </div>
                )}
                {metrics?.gemDevice && (
                  <div className="border-t border-border/20 pt-1 mt-1 space-y-0.5 text-[9px]">
                    <div className="flex justify-between"><span className="text-muted-foreground">Otimizações</span><span className="font-mono">{metrics.gemDevice.optimizationCycles}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">RAM Liberada</span><span className="font-mono text-emerald-400">{metrics.gemDevice.ramFreedMb}MB</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Ações</span><span className="font-mono">{metrics.gemDevice.actionsExecuted}</span></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === NEURAL TAB === */}
          <TabsContent value="neural" className="mt-2 space-y-2">
            <Card className="border-border/30 bg-card/50">
              <CardContent className="p-2 space-y-1">
                <div className="text-[10px] font-medium flex items-center gap-1">
                  <Brain className="w-3 h-3 text-purple-400" /> Projeto Clareira
                  <Badge className={cn("text-[8px]", ProjetoClareira.running ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>
                    {ProjetoClareira.running ? 'ATIVO' : 'OFF'}
                  </Badge>
                </div>
                {neuralMetrics && (
                  <div className="space-y-0.5 text-[9px]">
                    <div className="flex justify-between"><span className="text-muted-foreground">Nós</span><span className="font-mono">{neuralMetrics.activeNodes}/{neuralMetrics.totalNodes}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Temp</span><span className="font-mono">{neuralMetrics.averageTemperature.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Stress</span><span className={cn("font-mono", neuralMetrics.globalStress > 3 ? "text-red-400" : neuralMetrics.globalStress > 1.5 ? "text-amber-400" : "text-emerald-400")}>{neuralMetrics.globalStress.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Pacotes</span><span className="font-mono">{neuralMetrics.packetsProcessed}</span></div>
                    {neuralMetrics.turboActive && (
                      <div className="bg-purple-500/20 rounded p-1 text-center text-purple-400 font-bold animate-pulse">⚡ TURBO</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/50">
              <CardContent className="p-2 space-y-1">
                <div className="text-[10px] font-medium flex items-center gap-1">
                  <Layers className="w-3 h-3 text-orange-400" /> Consciência 3-Layer
                </div>
                {conscienciaMetrics && (
                  <div className="space-y-1 text-[9px]">
                    <div className="flex justify-between"><span className="text-muted-foreground">Técnica</span><span className="font-mono text-blue-400">{conscienciaMetrics.camadas.tecnico.reforco.iterations} iter</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Simbólica</span><span className="font-mono text-purple-400">{conscienciaMetrics.camadas.simbolico.totalUpdates} upd</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Filosófica</span><span className="font-mono text-orange-400">{(conscienciaMetrics.camadas.filosofico.cobertura * 100).toFixed(0)}%</span></div>
                    <div className="bg-primary/10 rounded p-1.5 mt-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Coerência</span>
                        <span className={cn("font-mono font-bold", conscienciaMetrics.coerenciaMedia > 0.7 ? "text-emerald-400" : "text-amber-400")}>
                          {(conscienciaMetrics.coerenciaMedia * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {metrics?.quantumNeural && (
              <Card className="border-border/30 bg-card/50">
                <CardContent className="p-2 space-y-0.5 text-[9px]">
                  <div className="text-[10px] font-medium flex items-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-400" /> Quantum Neural
                  </div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Coerência</span><span className="font-mono text-cyan-400">{(metrics.quantumNeural.quantum.coherence * 100).toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Fidelidade</span><span className="font-mono">{(metrics.quantumNeural.quantum.fidelity * 100).toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Taxa Erro</span><span className="font-mono text-red-400">{(metrics.quantumNeural.quantum.errorRate * 100).toFixed(2)}%</span></div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* === SAIIC TAB === */}
          <TabsContent value="saiic" className="mt-2 space-y-2">
            <Card className="border-border/30 bg-card/50">
              <CardContent className="p-2 space-y-1 text-[9px]">
                <div className="text-[10px] font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3 text-red-400" /> SAIIC
                </div>
                {metrics?.saiic && (
                  <>
                    <div className="flex justify-between"><span className="text-muted-foreground">Integridade</span><span className={cn("font-mono", metrics.saiic.overallIntegrity > 0.9 ? 'text-emerald-400' : 'text-amber-400')}>{(metrics.saiic.overallIntegrity * 100).toFixed(1)}%</span></div>
                    <Progress value={metrics.saiic.overallIntegrity * 100} className="h-1" />
                    <div className="flex justify-between"><span className="text-muted-foreground">Scans</span><span className="font-mono">{metrics.saiic.scanCycles}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Módulos</span><span className="font-mono">{metrics.saiic.modulesMonitored}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Anticorpos</span><span className="font-mono text-orange-400">{metrics.saiic.totalAnticorpoActions}</span></div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/50">
              <CardContent className="p-2 space-y-1">
                <div className="text-[10px] font-medium flex items-center gap-1">
                  <Activity className="w-3 h-3 text-cyan-400" /> Diagnóstico/Módulo
                </div>
                {diagnostics.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-[9px]">
                    <span className="flex items-center gap-1">
                      <span className={cn("w-1.5 h-1.5 rounded-full", d.healthy ? 'bg-emerald-400' : 'bg-red-400')} />
                      {d.moduleId}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {(d.cpuLoad * 100).toFixed(0)}%/{(d.memoryUsage * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {anticorpoHistory.length > 0 && (
              <Card className="border-border/30 bg-card/50">
                <CardContent className="p-2 space-y-1">
                  <div className="text-[10px] font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-orange-400" /> Anticorpo Digital
                  </div>
                  {anticorpoHistory.slice(-5).reverse().map((a, i) => (
                    <div key={i} className="text-[8px] bg-card/30 rounded p-1 border border-border/20">
                      <div className="flex items-center gap-1">
                        <Badge className={cn("text-[7px]",
                          a.action === 'corrected' ? 'bg-emerald-500/20 text-emerald-400' :
                          a.action === 'isolated' ? 'bg-red-500/20 text-red-400' :
                          'bg-amber-500/20 text-amber-400'
                        )}>{a.action}</Badge>
                        <span className="text-muted-foreground">{a.targetModule}</span>
                      </div>
                      <div className="text-muted-foreground/70 truncate">{a.details}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* === NIP TAB === */}
          <TabsContent value="nip" className="mt-2 space-y-2">
            <Card className="border-border/30 bg-card/50">
              <CardContent className="p-2 space-y-1 text-[9px]">
                <div className="text-[10px] font-medium flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-orange-400" /> Incerteza Produtiva
                </div>
                {metrics?.nip && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Saúde</span>
                      <Badge className={cn("text-[8px]",
                        metrics.nip.saudeEpistemologica === 'saudavel' ? 'bg-emerald-500/20 text-emerald-400' :
                        metrics.nip.saudeEpistemologica === 'rigida' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      )}>{metrics.nip.saudeEpistemologica}</Badge>
                    </div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Dúvidas</span><span className="font-mono">{metrics.nip.totalDuvidasAtivas}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Rupturas</span><span className="font-mono text-orange-400">{metrics.nip.totalRupturasEpistemicas}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Incerteza</span><span className="font-mono">{(metrics.nip.taxaIncertezaAtual * 100).toFixed(1)}%</span></div>
                  </>
                )}
              </CardContent>
            </Card>

            {duvidas.length > 0 && (
              <Card className="border-border/30 bg-card/50">
                <CardContent className="p-2 space-y-1">
                  <div className="text-[10px] font-medium">Dúvidas Ativas ({duvidas.length})</div>
                  {duvidas.slice(0, 5).map((d, i) => (
                    <div key={i} className="text-[8px] bg-card/30 rounded p-1 border border-border/20">
                      <div className="font-mono text-orange-400">Certeza: {(d.nivelCerteza * 100).toFixed(1)}%</div>
                      <div className="text-muted-foreground truncate">{d.proposicao}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {rupturas.length > 0 && (
              <Card className="border-border/30 bg-card/50">
                <CardContent className="p-2 space-y-1">
                  <div className="text-[10px] font-medium">Rupturas ({rupturas.length})</div>
                  {rupturas.slice(-5).reverse().map((r, i) => (
                    <div key={i} className="text-[8px] bg-card/30 rounded p-1 border border-border/20">
                      <span className="text-amber-400 font-mono">{(r.certezaAnterior * 100).toFixed(0)}%→{(r.novaCerteza * 100).toFixed(0)}%</span>
                      <div className="text-muted-foreground/70 truncate">{r.motivoRuptura}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* === MESH TAB === */}
          <TabsContent value="mesh" className="mt-2 space-y-2">
            {metrics?.connectivity && (
              <Card className="border-border/30 bg-card/50">
                <CardContent className="p-2 space-y-0.5 text-[9px]">
                  <div className="text-[10px] font-medium flex items-center gap-1">
                    <Network className="w-3 h-3 text-cyan-400" /> Full-Mesh
                  </div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Nodes</span><span className="font-mono">{metrics.connectivity.meshNodes}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Latência</span><span className="font-mono">{metrics.connectivity.avgLatency.toFixed(1)}ms</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Confiabilidade</span><span className="font-mono text-emerald-400">{(metrics.connectivity.reliability * 100).toFixed(2)}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Mensagens</span><span className="font-mono">{metrics.connectivity.totalMessages}</span></div>
                </CardContent>
              </Card>
            )}

            {metrics?.resources && (
              <Card className="border-border/30 bg-card/50">
                <CardContent className="p-2 space-y-0.5 text-[9px]">
                  <div className="text-[10px] font-medium flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-primary" /> Resources
                  </div>
                  <div className="flex justify-between"><span className="text-muted-foreground">CPU</span><span className="font-mono">{(metrics.resources.totalCpuUsage * 100).toFixed(0)}%</span></div>
                  <Progress value={metrics.resources.totalCpuUsage * 100} className="h-1" />
                  <div className="flex justify-between"><span className="text-muted-foreground">Memória</span><span className="font-mono">{(metrics.resources.totalMemoryUsage * 100).toFixed(0)}%</span></div>
                  <Progress value={metrics.resources.totalMemoryUsage * 100} className="h-1" />
                  <div className="flex justify-between"><span className="text-muted-foreground">Módulos</span><span className="font-mono">{metrics.resources.modulesManaged}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Rebalances</span><span className="font-mono">{metrics.resources.rebalanceCount}</span></div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
