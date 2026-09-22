import { dispatchToNative, type BridgeCompletion } from '../../../lib/soul-mesh/SoulHybridBridge';

export type ClareiraAndroidCapability =
  | 'clareira.android.snapshot'
  | 'clareira.android.brightness'
  | 'clareira.android.kill_background'
  | 'clareira.android.wifi_panel'
  | 'clareira.android.bluetooth_request'
  | 'clareira.android.airplane_settings';

export class ClareiraAndroidBridge {
  readonly version = '1.0.0';

  snapshot(timeoutMs = 5000): Promise<BridgeCompletion> {
    return this.dispatch('clareira.android.snapshot', {}, timeoutMs);
  }

  setBrightness(percent: number, timeoutMs = 5000): Promise<BridgeCompletion> {
    if (!Number.isInteger(percent) || percent < 1 || percent > 100) {
      return Promise.reject(new Error('BRIGHTNESS_PERCENT_INVALID'));
    }
    return this.dispatch('clareira.android.brightness', { percent }, timeoutMs);
  }

  killBackground(packageName: string, timeoutMs = 5000): Promise<BridgeCompletion> {
    if (!packageName.trim()) {
      return Promise.reject(new Error('PACKAGE_NAME_REQUIRED'));
    }
    return this.dispatch(
      'clareira.android.kill_background',
      { packageName: packageName.trim() },
      timeoutMs,
    );
  }

  openWifiPanel(timeoutMs = 5000): Promise<BridgeCompletion> {
    return this.dispatch('clareira.android.wifi_panel', {}, timeoutMs);
  }

  requestBluetoothEnable(timeoutMs = 5000): Promise<BridgeCompletion> {
    return this.dispatch('clareira.android.bluetooth_request', {}, timeoutMs);
  }

  openAirplaneSettings(timeoutMs = 5000): Promise<BridgeCompletion> {
    return this.dispatch('clareira.android.airplane_settings', {}, timeoutMs);
  }

  private dispatch(
    capability: ClareiraAndroidCapability,
    payload: Record<string, unknown>,
    timeoutMs: number,
  ): Promise<BridgeCompletion> {
    return dispatchToNative(
      {
        target: 'N01',
        capability,
        payload,
        transport: 'WEBVIEW_BRIDGE',
      },
      timeoutMs,
    );
  }
}
