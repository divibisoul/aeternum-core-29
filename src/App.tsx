/**
 * AETERNUM - App Chassis
 * 
 * The App component acts purely as a chassis.
 * It does NOT know about modules directly - they are loaded via the Registry.
 * Zero changes needed here when adding new modules.
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
import { useGlobalStore, selectIsAuthenticated } from '@/stores/globalStore';
import '@fontsource/jetbrains-mono/300.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/700.css';

const queryClient = new QueryClient();

function AeternumCore() {
  const [systemReady, setSystemReady] = useState(false);
  const isAuthenticated = useGlobalStore(selectIsAuthenticated);

  // Initialize module registry on mount
  useEffect(() => {
    const init = async () => {
      await ModuleRegistry.initialize();
      
      // Auto-activate first module if none active
      const modules = ModuleRegistry.getAll();
      if (modules.length > 0 && !ModuleRegistry.getActiveId()) {
        ModuleRegistry.activate(modules[0].metadata.id);
      }
      
      setSystemReady(true);
    };
    init();
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
            Carregando módulos...
          </p>
        </div>
      </div>
    );
  }

  return <MainLayout />;
}

const App = () => (
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
