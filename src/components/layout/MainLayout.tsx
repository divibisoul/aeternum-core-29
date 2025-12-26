/**
 * MAIN LAYOUT
 * 
 * The primary layout structure for the Aeternum interface.
 */

import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Telemetry } from './Telemetry';
import { useModuleRegistry } from '@/core/ModuleRegistry';
import { ModuleErrorBoundary } from '@/core/ErrorBoundary';
import { Loader2 } from 'lucide-react';

function ModuleLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Loading module...</p>
      </div>
    </div>
  );
}

function WelcomeScreen() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="text-center max-w-lg">
        <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-primary/20 flex items-center justify-center">
          <div className="h-10 w-10 rounded-full bg-primary shadow-neon animate-pulse" />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground neon-text-subtle mb-3">
          Welcome to Aeternum
        </h1>
        <p className="text-muted-foreground mb-6">
          Your modular Super AGI command center. Select a module from the sidebar to begin.
        </p>
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="glass rounded-lg p-4">
            <div className="text-xs text-primary font-medium mb-1">CHAT ENGINE</div>
            <div className="text-xs text-muted-foreground">Multi-persona AI orchestration</div>
          </div>
          <div className="glass rounded-lg p-4">
            <div className="text-xs text-primary font-medium mb-1">SETTINGS</div>
            <div className="text-xs text-muted-foreground">Configure API keys & preferences</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MainLayout() {
  const { modules, activeId } = useModuleRegistry();
  const activeModule = modules.find(m => m.metadata.id === activeId);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Telemetry Bar */}
        <Telemetry />

        {/* Module Content Area */}
        <main className="relative flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeModule ? (
              <motion.div
                key={activeModule.metadata.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <ModuleErrorBoundary
                  moduleId={activeModule.metadata.id}
                  moduleName={activeModule.metadata.name}
                >
                  <Suspense fallback={<ModuleLoader />}>
                    <activeModule.Component
                      isActive={true}
                      moduleId={activeModule.metadata.id}
                    />
                  </Suspense>
                </ModuleErrorBoundary>
              </motion.div>
            ) : (
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <WelcomeScreen />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
