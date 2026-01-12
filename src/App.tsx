/**
 * AETERNUM - App Chassis (QUADRANGULAR ARCHITECTURE)
 * 
 * The App component acts purely as a chassis.
 * Integrates the 4-sided architecture:
 * - ESTABILIDADE: Error Boundaries, Zod validation
 * - PERFORMANCE: Cache, parallel processing
 * - COMUNICAÇÃO: Optimized state, memoization
 * - OTIMIZAÇÃO: Performance monitoring
 * 
 * Also integrates:
 * - Projeto Clareira (Neural Bio-Inspired System)
 * - ConscienciaAlgoritmica (3-Layer Cognitive Architecture)
 */

import { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppErrorBoundary } from '@/core/ErrorBoundary';
import { ModuleRegistry } from '@/core/ModuleRegistry';
import { useEventBus } from '@/core/EventBus';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { MainLayout } from '@/components/layout/MainLayout';
import { SystemDashboard } from '@/components/SystemDashboard';
import { useGlobalStore, selectIsAuthenticated } from '@/stores/globalStore';
import { ProjetoClareira } from '@/core/neural';
import { ConscienciaAlgoritmicaInstance } from '@/core/layers/ConscienciaAlgoritmica';
import '@fontsource/jetbrains-mono/300.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/700.css';

// LADO 2: PERFORMANCE - Query Client otimizado
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minuto
      gcTime: 5 * 60 * 1000, // 5 minutos
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function AeternumCore() {
  const [systemReady, setSystemReady] = useState(false);
  const isAuthenticated = useGlobalStore(selectIsAuthenticated);

  // Initialize all systems on mount
  useEffect(() => {
    const init = async () => {
      console.log('[Aeternum] Inicializando sistemas...');
      
      // 1. Initialize Projeto Clareira (Neural System)
      if (!ProjetoClareira.initialized) {
        ProjetoClareira.initialize();
        console.log('[Aeternum] Projeto Clareira inicializado');
      }
      if (!ProjetoClareira.running) {
        ProjetoClareira.start();
        console.log('[Aeternum] Projeto Clareira iniciado');
      }
      
      // 2. Run initial test of ConscienciaAlgoritmica to activate all layers
      const experienciaInicial = Array(10).fill(null).map(() => Math.random());
      ConscienciaAlgoritmicaInstance.processar(experienciaInicial, 'inicialização');
      console.log('[Aeternum] ConscienciaAlgoritmica ativada');
      
      // 3. Initialize Module Registry
      await ModuleRegistry.initialize();
      
      // Auto-activate first module if none active
      const modules = ModuleRegistry.getAll();
      if (modules.length > 0 && !ModuleRegistry.getActiveId()) {
        ModuleRegistry.activate(modules[0].metadata.id);
      }
      
      setSystemReady(true);
      console.log('[Aeternum] Todos os sistemas prontos');
    };
    init();
    
    return () => {
      // Cleanup on unmount
      ProjetoClareira.stop();
    };
  }, []);

  // Listen for system ready event
  useEventBus('system:ready', ({ modules }) => {
    console.log(`[Aeternum] System ready with ${modules.length} modules`);
  }, []);

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => {}} />;
  }

  // Show loading while initializing
  if (!systemReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground font-mono">
            Inicializando sistemas neurais...
          </p>
          <p className="mt-2 text-xs text-muted-foreground/60 font-mono">
            Projeto Clareira • ConscienciaAlgoritmica • Arquitetura Quadrangular
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <MainLayout />
      {/* System Dashboard - Shows all metrics */}
      <SystemDashboard />
    </>
  );
}

const App = () => (
  // LADO 1: ESTABILIDADE - Error Boundary
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster position="bottom-right" theme="dark" />
        <AuthProvider>
          <AeternumCore />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
