/**
 * MAIN LAYOUT - Soul GPU / Hybrid Cockpit
 *
 * The right panel is the user-facing control surface for the hybrid fabric.
 * It can switch between local AGI telemetry and the Soul Pilot Cockpit.
 */

import { Suspense, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Telemetry } from './Telemetry';
import { AGIActivePanel } from '@/components/AGIActivePanel';
import { SoulPilotCockpit } from '@/components/SoulPilotCockpit';
import { useModuleRegistry } from '@/core/ModuleRegistry';
import { ModuleErrorBoundary } from '@/core/ErrorBoundary';
import { Loader2, PanelRightOpen, PanelRightClose, Radio, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        <h1 className="font-display text-3xl font-bold text-foreground neon-text-subtle mb-3">Welcome to Aeternum</h1>
        <p className="text-muted-foreground mb-6">Your modular Super AGI command center. Select a module from the sidebar to begin.</p>
      </div>
    </div>
  );
}

export function MainLayout() {
  const { modules, activeId } = useModuleRegistry();
  const activeModule = modules.find(m => m.metadata.id === activeId);
  const [panelVisible, setPanelVisible] = useState(true);
  const [panelMode, setPanelMode] = useState<'pilot' | 'agi'>('pilot');

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Telemetry />
        <div className="flex flex-1 overflow-hidden">
          <main className="relative flex-1 overflow-hidden min-w-0">
            <AnimatePresence mode="wait">
              {activeModule ? (
                <motion.div key={activeModule.metadata.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="h-full">
                  <ModuleErrorBoundary moduleId={activeModule.metadata.id} moduleName={activeModule.metadata.name}>
                    <Suspense fallback={<ModuleLoader />}>
                      <activeModule.Component isActive={true} moduleId={activeModule.metadata.id} />
                    </Suspense>
                  </ModuleErrorBoundary>
                </motion.div>
              ) : (
                <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                  <WelcomeScreen />
                </motion.div>
              )}
            </AnimatePresence>
            {!panelVisible && (
              <Button variant="outline" size="sm" onClick={() => setPanelVisible(true)} className="absolute top-2 right-2 z-10 bg-card/80 backdrop-blur-sm gap-1">
                <PanelRightOpen className="h-3.5 w-3.5" />
                <span className="text-[10px]">COCKPIT</span>
              </Button>
            )}
          </main>

          {panelVisible && (
            <aside className="w-80 border-l border-border/30 bg-card/30 backdrop-blur-sm flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-2 py-2 border-b border-border/30">
                <div className="flex gap-1">
                  <Button variant={panelMode === 'pilot' ? 'secondary' : 'ghost'} size="sm" onClick={() => setPanelMode('pilot')} className="h-7 px-2 text-[9px] gap-1">
                    <Radio className="h-3 w-3" /> PILOT
                  </Button>
                  <Button variant={panelMode === 'agi' ? 'secondary' : 'ghost'} size="sm" onClick={() => setPanelMode('agi')} className="h-7 px-2 text-[9px] gap-1">
                    <Brain className="h-3 w-3" /> AGI
                  </Button>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setPanelVisible(false)} className="h-6 w-6 p-0">
                  <PanelRightClose className="h-3.5 w-3.5" />
                </Button>
              </div>
              {panelMode === 'pilot' ? <SoulPilotCockpit /> : <AGIActivePanel />}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
