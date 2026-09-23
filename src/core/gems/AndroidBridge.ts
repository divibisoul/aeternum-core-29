/**
 * Android Bridge - Arquitetura de comunicação WebSocket
 * para companion app Android com Shizuku + ADB Wi-Fi
 * 
 * Protocolo de mensagens:
 * - Web → Android: comandos de otimização, shell, status
 * - Android → Web: métricas, resultados, eventos
 * 
 * O companion app Android deve implementar:
 * 1. WebSocket server no dispositivo
 * 2. Shizuku API para comandos privilegiados
 * 3. ADB Wi-Fi como fallback
 */

export interface AndroidBridgeConfig {
  ip: string;
  port: number;
  autoReconnect: boolean;
  reconnectIntervalMs: number;
  shizukuPreferred: boolean;
}

export interface ShizukuStatus {
  installed: boolean;
  running: boolean;
  permissionGranted: boolean;
  apiVersion: number;
}

export interface AdbWifiStatus {
  enabled: boolean;
  ip: string;
  port: number;
  paired: boolean;
  connectedDevices: string[];
}

/**
 * Protocol messages for Web ↔ Android communication
 */
export type WebToAndroidMessage =
  | { type: 'status_request' }
  | { type: 'shizuku_check' }
  | { type: 'adb_check' }
  | { type: 'execute_action'; action: string; target?: string; command?: string; actionId: string }
  | { type: 'shell_command'; command: string; useShizuku: boolean }
  | { type: 'install_app'; apkPath: string }
  | { type: 'uninstall_app'; packageName: string }
  | { type: 'grant_permission'; packageName: string; permission: string }
  | { type: 'start_logcat'; filter?: string }
  | { type: 'stop_logcat' }
  | { type: 'settings_put'; namespace: 'global' | 'system' | 'secure'; key: string; value: string };

export type AndroidToWebMessage =
  | { type: 'status_update'; cpu: number; ramUsedMb: number; ramTotalMb: number; batteryPct: number; temperature: number; runningProcesses: number }
  | { type: 'shizuku_status'; active: boolean; apiVersion: number }
  | { type: 'adb_status'; active: boolean; ip: string; port: number }
  | { type: 'action_result'; actionId: string; success: boolean; result: string; ramFreedMb?: number; cpuReductionPct?: number }
  | { type: 'shell_output'; output: string; exitCode: number }
  | { type: 'logcat_line'; line: string; level: string; tag: string }
  | { type: 'error'; message: string; code: string };

/**
 * Default configuration for POCO C85 (from user's screenshots)
 */
export const DEFAULT_BRIDGE_CONFIG: AndroidBridgeConfig = {
  // Endpoint must be supplied by the actual connected device/session.
  // No device-specific IP is embedded as a runtime default.
  ip: '',
  port: 0,
  autoReconnect: true,
  reconnectIntervalMs: 5000,
  shizukuPreferred: true,
};

/**
 * Whitelist of critical Android packages that must NEVER be disabled/stopped
 */
export const ANDROID_CRITICAL_PACKAGES = [
  'com.android.systemui',
  'com.google.android.gms',
  'android',
  'com.android.phone',
  'com.android.settings',
  'com.android.providers.settings',
  'com.android.providers.contacts',
  'com.android.providers.telephony',
  'com.android.providers.media',
  'com.android.inputmethod.latin',
  'rikka.shizuku',
] as const;

/**
 * Validates if a package is safe to act upon
 */
export function isPackageSafe(packageName: string): boolean {
  return !ANDROID_CRITICAL_PACKAGES.includes(packageName as any);
}

/**
 * Generates shell commands for common optimization actions
 */
export function generateOptimizationCommands(action: string, target?: string): string[] {
  if (target && !isPackageSafe(target)) {
    return [`echo "BLOCKED: ${target} is a critical package"`];
  }

  switch (action) {
    case 'force_stop':
      return target ? [`am force-stop ${target}`] : [];
    case 'clear_cache':
      return target ? [`pm clear --cache-only ${target}`] : [];
    case 'freeze':
      return target ? [`pm disable-user --user 0 ${target}`] : [];
    case 'unfreeze':
      return target ? [`pm enable ${target}`] : [];
    case 'memory_dump':
      return ['dumpsys meminfo'];
    case 'cpu_dump':
      return ['top -n 1 -b'];
    case 'battery_stats':
      return ['dumpsys battery'];
    case 'network_stats':
      return ['dumpsys netstats'];
    case 'wifi_toggle':
      return ['svc wifi enable'];
    default:
      return [];
  }
}
