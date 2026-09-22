/**
 * SIDEBAR - Module Navigation
 * 
 * HUD-style sidebar for navigating between modules.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useModuleRegistry } from '@/core/ModuleRegistry';
import { useGlobalStore } from '@/stores/globalStore';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { modules, activeId, activate } = useModuleRegistry();
  const { sidebarOpen, setSidebarOpen } = useGlobalStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 240 : 64 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex h-full flex-col border-r border-border/30 bg-sidebar/50 backdrop-blur-xl"
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-border/30 px-4">
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-primary shadow-neon" />
              </div>
              <span className="font-display text-lg font-bold text-primary neon-text-subtle">
                AETERNUM
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Modules List */}
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {modules.map((module) => {
            const Icon = module.metadata.icon;
            const isActive = activeId === module.metadata.id;

            return (
              <button
                key={module.metadata.id}
                onClick={() => activate(module.metadata.id)}
                className={cn(
                  "relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200",
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-neon"
                    transition={{ duration: 0.2 }}
                  />
                )}

                <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />

                <AnimatePresence mode="wait">
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="truncate text-sm font-medium"
                    >
                      {module.metadata.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer - Version */}
      <div className="border-t border-border/30 p-3">
        <AnimatePresence mode="wait">
          {sidebarOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-xs text-muted-foreground"
            >
              <span className="font-mono">v1.0.0</span>
              <span className="mx-2 text-border">|</span>
              <span className="text-primary">BUILD</span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center"
            >
              <div className="h-2 w-2 rounded-full bg-primary shadow-neon animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
