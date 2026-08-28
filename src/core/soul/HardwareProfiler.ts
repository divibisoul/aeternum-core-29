export type LocalBackend = 'webgpu' | 'wasm' | 'cpu';

export interface HardwareProfile {
  backend: LocalBackend;
  webgpu: boolean;
  deviceMemoryGb: number | null;
  hardwareConcurrency: number | null;
  reason: string;
}

export function profileBrowserHardware(): HardwareProfile {
  if (typeof navigator === 'undefined') return { backend: 'cpu', webgpu: false, deviceMemoryGb: null, hardwareConcurrency: null, reason: 'non-browser runtime' };
  const nav = navigator as Navigator & { deviceMemory?: number; gpu?: unknown };
  const webgpu = Boolean(nav.gpu);
  const deviceMemoryGb = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null;
  const hardwareConcurrency = typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : null;
  if (webgpu) return { backend: 'webgpu', webgpu: true, deviceMemoryGb, hardwareConcurrency, reason: 'WebGPU is exposed by the browser' };
  if ((hardwareConcurrency ?? 0) >= 4) return { backend: 'wasm', webgpu: false, deviceMemoryGb, hardwareConcurrency, reason: 'WebGPU unavailable; WASM is the portable local fallback' };
  return { backend: 'cpu', webgpu: false, deviceMemoryGb, hardwareConcurrency, reason: 'conservative CPU fallback' };
}
