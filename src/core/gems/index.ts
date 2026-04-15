/**
 * GEMs - Generalized Emergent Modules
 * 
 * Módulos especializados com loops ativos de primeiro plano:
 * - GEM-Health: Monitoramento de saúde contínuo
 * - GEM-Research: Pesquisa autônoma
 * - GEM-Music: Composição de frequências binaurais
 * - GEM-Device: Gerenciamento Android (Shizuku/ADB)
 */

export { GEMHealth } from './GEMHealth';
export { GEMResearch } from './GEMResearch';
export { GEMMusic } from './GEMMusic';
export { GEMDevice } from './GEMDevice';

export type { HealthMetrics } from './GEMHealth';
export type { ResearchMetrics, ResearchTask } from './GEMResearch';
export type { MusicMetrics, BrainwaveType } from './GEMMusic';
export type { DeviceMetrics, DeviceStatus, DeviceAction } from './GEMDevice';
