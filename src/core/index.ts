/**
 * Barrel do core Aeternum.
 * NÃO reexporta o EventBus real do N01 (para evitar colisão de nomes).
 * Expõe apenas os artefatos do Aeternum.
 */
export { nervoVago } from './eventBus';
export { wormhole } from './wormholeRegistry';
export { HortaCore, hortaCore } from './hortaCore';
export type { ModuleSignature } from './wormholeRegistry';
export { NeuralCoordinates } from './neuralCoordinates';
export { HortaCoreContinuityBridge } from './HortaCoreContinuityBridge';
export { recoveredAeternumRuntime } from '../../lib/aeternum/RecoveredAeternumRuntime';
export type { Coordinates } from './neuralCoordinates';

// Bootstrap explícito: importar './core' no App inicializa o GenesisModule.
export { genesisModule } from './GenesisModule';
