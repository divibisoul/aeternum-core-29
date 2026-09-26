/**
 * Barrel do core Aeternum.
 * NÃO reexporta o EventBus real do N01 (para evitar colisão de nomes).
 * Expõe apenas os artefatos do Aeternum.
 */
export { nervoVago } from './eventBus';
export { hortaCore } from './hortaCore';
export { wormhole } from './wormholeRegistry';
export type { ModuleSignature } from './wormholeRegistry';
export { NeuralCoordinates } from './neuralCoordinates';
export type { Coordinates } from './neuralCoordinates';

// Bootstrap explícito: importar './core' no App inicializa o GenesisModule.
export { genesisModule } from './GenesisModule';
