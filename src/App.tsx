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
import { EventBus, useEventBus } from '@/core/EventBus';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ApiKeySetup } from '@/components/auth/ApiKeySetup';
import { MainLayout } from '@/components/layout/MainLayout';
import { useGlobalStore, selectHasRequiredApiKeys } from '@/stores/globalStore';
import '@fontsource/jetbrains-mono/300.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/700.css';

const queryClient = new QueryClient();

function AeternumCore() {
  const [systemReady, setSystemReady] = useState(false);
  const [showApiSetup, setShowApiSetup] = useState(true);
  const hasApiKeys = useGlobalStore(selectHasRequiredApiKeys);

  // Initialize module registry on mount
  useEffect(() => {
    const init = async () => {
      await ModuleRegistry.initialize();
      
      // Auto-activate first module if none active
      const modules = ModuleRegistry.getAll();
      if (modules.length > 0 && !ModuleRegistry.getActiveId()) {
        ModuleRegistry.activate(modules[0].metadata.id);
      }
    };
    init();
  }, []);

  // Listen for system init event
  useEventBus('system:init', () => {
    setSystemReady(true);
    setShowApiSetup(false);
  }, []);

  // Listen for system ready event
  useEventBus('system:ready', ({ modules }) => {
    console.log(`[Aeternum] System ready with ${modules.length} modules`);
  }, []);

  // Skip API setup if already has keys
  useEffect(() => {
    if (hasApiKeys) {
      setShowApiSetup(false);
      setSystemReady(true);
    }
  }, [hasApiKeys]);

  // Show API setup if not configured
  if (showApiSetup && !systemReady) {
    return <ApiKeySetup />;
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
