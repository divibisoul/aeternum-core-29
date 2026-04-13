/**
 * AETERNUM - App Chassis (QUADRANGULAR ARCHITECTURE + 13 AGI ENGINES)
 * 
 * Integrates the 4-sided architecture + 13 continuous foreground AGI engines.
 * All engines run in FIRST-PRIORITY CONTINUOUS mode.
 */

import { useEffect, useState, useCallback } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppErrorBoundary } from '@/core/ErrorBoundary';
import { ModuleRegistry } from '@/core/ModuleRegistry';
import { useEventBus } from '@/core/EventBus';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { MainLayout } from '@/components/layout/MainLayout';
import { AGIDashboard } from '@/components/AGIDashboard';
import { SystemDashboard } from '@/components/SystemDashboard';
import { SystemStatusIndicator } from '@/components/SystemStatusIndicator';
import { useGlobalStore, selectIsAuthenticated } from '@/stores/globalStore';
import { ProjetoClareira } from '@/core/neural';
import { ConscienciaAlgoritmicaInstance } from '@/core/layers/ConscienciaAlgoritmica';
import { AeternumAGI } from '@/core/agi';
import { toast } from 'sonner';
import '@fontsource/jetbrains-mono/300.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/700.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function AeternumCore() {
  const [systemReady, setSystemReady] = useState(false);
  const [initStage, setInitStage] = useState<string>('');
  const isAuthenticated = useGlobalStore(selectIsAuthenticated);

  const initializeSystems = useCallback(async () => {
    try {
      console.log('[Aeternum] Inicializando 13 motores de primeiro plano...');
      
      // Stage 1: Neural System
      setInitStage('Inicializando sistema neural...');
      if (!ProjetoClareira.initialized) ProjetoClareira.initialize();
      if (!ProjetoClareira.running) ProjetoClareira.start();
      await new Promise(r => setTimeout(r, 100));
      
      // Stage 2: Consciência Algorítmica
      setInitStage('Ativando consciência algorítmica...');
      const experienciaInicial = Array(10).fill(null).map(() => Math.random());
      const resultado = ConscienciaAlgoritmicaInstance.processar(experienciaInicial, 'inicialização');
      console.log('[Aeternum] ConscienciaAlgoritmica - Coerência:', resultado.metricas.coerenciaMedia.toFixed(3));
      await new Promise(r => setTimeout(r, 100));
      
      // Stage 3: AeternumAGI (13 engines, continuous foreground)
      setInitStage('Inicializando 13 motores AGI...');
      const agi = AeternumAGI.getInstance();
      agi.initialize();
      agi.start();
      console.log('[Aeternum] AeternumAGI - 13 motores de primeiro plano contínuo ativos');
      await new Promise(r => setTimeout(r, 100));
      
      // Stage 4: Module Registry
      setInitStage('Carregando módulos...');
      await ModuleRegistry.initialize();
      const modules = ModuleRegistry.getAll();
      if (modules.length > 0 && !ModuleRegistry.getActiveId()) {
        ModuleRegistry.activate(modules[0].metadata.id);
      }
      await new Promise(r => setTimeout(r, 100));
      
      // Stage 5: Validation
      setInitStage('Validando integridade...');
      const testResult = ConscienciaAlgoritmicaInstance.testarSistemaCompleto();
      const agiMetrics = agi.getFullMetrics();
      const saiicMetrics = agi.saiic.getMetrics();
      
      if (testResult.sucesso) {
        toast.success(
          `13 motores online | Coerência: ${(testResult.coerenciaMedia * 100).toFixed(1)}% | ` +
          `AGI: ${agiMetrics.overall.activeSubsystems}/${agiMetrics.overall.subsystems} | ` +
          `SAIIC: ${(saiicMetrics.overallIntegrity * 100).toFixed(0)}%`
        );
      } else {
        toast.warning('Sistemas parcialmente ativos');
      }
      
      setSystemReady(true);
      console.log('[Aeternum] Todos os 13 sistemas de primeiro plano prontos');
      
    } catch (error) {
      console.error('[Aeternum] Erro na inicialização:', error);
      toast.error('Erro ao inicializar sistemas');
      setSystemReady(true);
    }
  }, []);

  useEffect(() => {
    initializeSystems();
    return () => {
      ProjetoClareira.stop();
      AeternumAGI.getInstance().stop();
    };
  }, [initializeSystems]);

  useEventBus('system:ready', ({ modules }) => {
    console.log(`[Aeternum] System ready with ${modules.length} modules`);
  }, []);

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => {}} />;
  }

  if (!systemReady) {
    const agi = AeternumAGI.getInstance();
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative text-center z-10">
          <div className="relative mx-auto h-24 w-24 mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-primary/50 animate-pulse" />
            <div className="absolute inset-4 rounded-full border-2 border-primary animate-spin" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-primary shadow-[0_0_30px_hsl(var(--primary))]" />
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-foreground mb-2 font-mono">AETERNUM</h2>
          <p className="text-sm text-primary font-mono mb-4">{initStage}</p>
          
          <div className="flex justify-center gap-3 text-[10px] text-muted-foreground flex-wrap max-w-md">
            <span className={ProjetoClareira.initialized ? 'text-green-400' : ''}>● Neural</span>
            <span className={ConscienciaAlgoritmicaInstance.getMetrics().processamentosTotal > 0 ? 'text-green-400' : ''}>● Cognitive</span>
            <span className={agi.initialized ? 'text-green-400' : ''}>● AGI</span>
            <span className={agi.saiic.isRunning ? 'text-green-400' : ''}>● SAIIC</span>
            <span className={agi.resourceManager.isRunning ? 'text-green-400' : ''}>● Resources</span>
            <span className={ModuleRegistry.isInitialized() ? 'text-green-400' : ''}>● Modules</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <MainLayout />
      <SystemStatusIndicator />
      <SystemDashboard />
      <AGIDashboard />
    </>
  );
}

const App = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster position="bottom-right" theme="dark" richColors />
        <AuthProvider>
          <AeternumCore />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
