/**
 * ELEVADOR - Dynamic Module Registry
 * 
 * Handles auto-discovery, lazy loading, and lifecycle management of modules.
 * Modules are isolated in /capabilities/* and register themselves.
 */

import { EventBus } from './EventBus';
import type { ComponentType, ReactNode } from 'react';

export interface ModulePermission {
  id: string;
  name: string;
  description: string;
}

export interface ModuleMetadata {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  version: string;
  author?: string;
  permissions: ModulePermission[];
  category: 'core' | 'communication' | 'analysis' | 'tools' | 'settings';
  priority?: number; // Lower = higher priority in ordering
}

export interface ModuleDefinition {
  metadata: ModuleMetadata;
  Component: ComponentType<ModuleComponentProps>;
  onMount?: () => void | Promise<void>;
  onUnmount?: () => void | Promise<void>;
}

export interface ModuleComponentProps {
  isActive: boolean;
  moduleId: string;
}

interface RegisteredModule {
  definition: ModuleDefinition;
  loaded: boolean;
  error?: string;
}

class ModuleRegistryImpl {
  private modules = new Map<string, RegisteredModule>();
  private activeModuleId: string | null = null;
  private initialized = false;

  /**
   * Register a module
   */
  register(definition: ModuleDefinition): void {
    const { id, name } = definition.metadata;

    if (this.modules.has(id)) {
      console.warn(`[ModuleRegistry] Module ${id} already registered, skipping.`);
      return;
    }

    this.modules.set(id, {
      definition,
      loaded: false,
    });

    EventBus.emit('module:registered', { id, name });
    console.log(`[ModuleRegistry] Registered module: ${name} (${id})`);
  }

  /**
   * Unregister a module
   */
  unregister(id: string): void {
    const module = this.modules.get(id);
    if (!module) return;

    // Call unmount hook if exists
    if (module.definition.onUnmount) {
      module.definition.onUnmount();
    }

    this.modules.delete(id);
    EventBus.emit('module:unregistered', { id });

    if (this.activeModuleId === id) {
      this.activeModuleId = null;
    }
  }

  /**
   * Get a registered module by ID
   */
  get(id: string): ModuleDefinition | undefined {
    return this.modules.get(id)?.definition;
  }

  /**
   * Get all registered modules
   */
  getAll(): ModuleDefinition[] {
    return Array.from(this.modules.values())
      .map(m => m.definition)
      .sort((a, b) => (a.metadata.priority ?? 100) - (b.metadata.priority ?? 100));
  }

  /**
   * Get modules by category
   */
  getByCategory(category: ModuleMetadata['category']): ModuleDefinition[] {
    return this.getAll().filter(m => m.metadata.category === category);
  }

  /**
   * Set the active module
   */
  async activate(id: string): Promise<void> {
    const module = this.modules.get(id);
    if (!module) {
      console.warn(`[ModuleRegistry] Module ${id} not found`);
      return;
    }

    // Deactivate current module
    if (this.activeModuleId && this.activeModuleId !== id) {
      EventBus.emit('module:deactivated', { id: this.activeModuleId });
    }

    this.activeModuleId = id;

    // Call mount hook if first time
    if (!module.loaded && module.definition.onMount) {
      try {
        await module.definition.onMount();
        module.loaded = true;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Mount failed';
        module.error = errorMsg;
        EventBus.emit('module:error', { id, error: errorMsg });
        return;
      }
    }

    EventBus.emit('module:activated', { id });
  }

  /**
   * Get the active module ID
   */
  getActiveId(): string | null {
    return this.activeModuleId;
  }

  /**
   * Check if a module is active
   */
  isActive(id: string): boolean {
    return this.activeModuleId === id;
  }

  /**
   * Initialize the registry (called once at app start)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Auto-discover and load modules from /capabilities
    await this.discoverModules();

    this.initialized = true;
    EventBus.emit('system:ready', { 
      modules: Array.from(this.modules.keys()) 
    });
  }

  /**
   * Auto-discover modules using Vite's import.meta.glob
   */
  private async discoverModules(): Promise<void> {
    try {
      // Dynamic import of all module index files
      const moduleFiles = import.meta.glob('../capabilities/*/index.ts');
      
      const loadPromises = Object.entries(moduleFiles).map(async ([path, loader]) => {
        try {
          const module = await loader() as { default: ModuleDefinition };
          if (module.default) {
            this.register(module.default);
          }
        } catch (error) {
          console.error(`[ModuleRegistry] Failed to load module from ${path}:`, error);
        }
      });

      await Promise.allSettled(loadPromises);
    } catch (error) {
      console.error('[ModuleRegistry] Module discovery failed:', error);
    }
  }

  /**
   * Get module count
   */
  count(): number {
    return this.modules.size;
  }

  /**
   * Check if registry is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Singleton instance
export const ModuleRegistry = new ModuleRegistryImpl();

// React hook for accessing registry
import { useState, useEffect, useCallback } from 'react';

export function useModuleRegistry() {
  const [modules, setModules] = useState<ModuleDefinition[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const updateModules = () => {
      setModules(ModuleRegistry.getAll());
      setActiveId(ModuleRegistry.getActiveId());
    };

    // Initial state
    updateModules();

    // Subscribe to changes
    const unsub1 = EventBus.on('module:registered', updateModules);
    const unsub2 = EventBus.on('module:unregistered', updateModules);
    const unsub3 = EventBus.on('module:activated', () => setActiveId(ModuleRegistry.getActiveId()));
    const unsub4 = EventBus.on('module:deactivated', () => setActiveId(ModuleRegistry.getActiveId()));

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    };
  }, []);

  const activate = useCallback((id: string) => {
    ModuleRegistry.activate(id);
  }, []);

  return { modules, activeId, activate };
}
