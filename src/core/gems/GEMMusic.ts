/**
 * GEM-Music: Módulo Ativo de Composição Musical Adaptativa
 * 
 * Loop contínuo de primeiro plano que:
 * - Gera frequências binaurais (theta, alpha, beta, gamma)
 * - Adapta baseado em métricas de saúde do GEM-Health
 * - Sintetiza em tempo real via Web Audio API
 */

export type BrainwaveType = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';

export interface MusicMetrics {
  isRunning: boolean;
  isPlaying: boolean;
  currentWave: BrainwaveType;
  frequency: number;
  carrierFreq: number;
  volume: number;
  sessionsCompleted: number;
  totalPlaytimeMs: number;
  cyclesCompleted: number;
}

const WAVE_FREQUENCIES: Record<BrainwaveType, { min: number; max: number; desc: string }> = {
  delta: { min: 0.5, max: 4, desc: 'Sono profundo' },
  theta: { min: 4, max: 8, desc: 'Meditação/criatividade' },
  alpha: { min: 8, max: 13, desc: 'Relaxamento focado' },
  beta: { min: 13, max: 30, desc: 'Foco ativo' },
  gamma: { min: 30, max: 50, desc: 'Processamento elevado' },
};

export class GEMMusic {
  private _running = false;
  private _playing = false;
  private _interval: ReturnType<typeof setInterval> | null = null;
  private _audioContext: AudioContext | null = null;
  private _oscillatorL: OscillatorNode | null = null;
  private _oscillatorR: OscillatorNode | null = null;
  private _gainNode: GainNode | null = null;
  private _currentWave: BrainwaveType = 'alpha';
  private _frequency = 10;
  private _carrierFreq = 200;
  private _volume = 0.3;
  private _sessionsCompleted = 0;
  private _totalPlaytimeMs = 0;
  private _playStartTime = 0;
  private _cyclesCompleted = 0;

  get isRunning() { return this._running; }
  get isPlaying() { return this._playing; }

  start(intervalMs = 8000): void {
    if (this._running) return;
    this._running = true;
    console.log('[GEM-Music] Iniciando compositor adaptativo contínuo');
    this._interval = setInterval(() => this.cycle(), intervalMs);
  }

  stop(): void {
    this.stopPlayback();
    if (this._interval) clearInterval(this._interval);
    this._interval = null;
    this._running = false;
  }

  /**
   * Adapt waveform based on health metrics
   */
  adaptToHealth(stressLevel: number, fatigueIndex: number): void {
    if (stressLevel > 0.7) {
      this._currentWave = 'theta';
    } else if (fatigueIndex > 0.6) {
      this._currentWave = 'beta';
    } else if (stressLevel < 0.3 && fatigueIndex < 0.3) {
      this._currentWave = 'gamma';
    } else {
      this._currentWave = 'alpha';
    }

    const range = WAVE_FREQUENCIES[this._currentWave];
    this._frequency = range.min + Math.random() * (range.max - range.min);

    if (this._playing) this.updateOscillators();
  }

  startPlayback(): void {
    if (this._playing) return;
    try {
      this._audioContext = new AudioContext();
      this._gainNode = this._audioContext.createGain();
      this._gainNode.gain.value = this._volume;
      this._gainNode.connect(this._audioContext.destination);

      // Left channel
      this._oscillatorL = this._audioContext.createOscillator();
      this._oscillatorL.type = 'sine';
      this._oscillatorL.frequency.value = this._carrierFreq;

      // Right channel with binaural offset
      this._oscillatorR = this._audioContext.createOscillator();
      this._oscillatorR.type = 'sine';
      this._oscillatorR.frequency.value = this._carrierFreq + this._frequency;

      this._oscillatorL.connect(this._gainNode);
      this._oscillatorR.connect(this._gainNode);
      this._oscillatorL.start();
      this._oscillatorR.start();

      this._playing = true;
      this._playStartTime = Date.now();
    } catch (e) {
      console.warn('[GEM-Music] Web Audio not available:', e);
    }
  }

  stopPlayback(): void {
    if (!this._playing) return;
    try {
      this._oscillatorL?.stop();
      this._oscillatorR?.stop();
      this._audioContext?.close();
    } catch {}
    this._oscillatorL = null;
    this._oscillatorR = null;
    this._audioContext = null;
    this._gainNode = null;
    this._playing = false;
    this._totalPlaytimeMs += Date.now() - this._playStartTime;
    this._sessionsCompleted++;
  }

  setVolume(v: number): void {
    this._volume = Math.max(0, Math.min(1, v));
    if (this._gainNode) this._gainNode.gain.value = this._volume;
  }

  setWave(wave: BrainwaveType): void {
    this._currentWave = wave;
    const range = WAVE_FREQUENCIES[wave];
    this._frequency = (range.min + range.max) / 2;
    if (this._playing) this.updateOscillators();
  }

  private updateOscillators(): void {
    if (this._oscillatorL) this._oscillatorL.frequency.value = this._carrierFreq;
    if (this._oscillatorR) this._oscillatorR.frequency.value = this._carrierFreq + this._frequency;
  }

  private cycle(): void {
    this._cyclesCompleted++;
    // Subtle frequency drift for naturalistic feel
    if (this._playing) {
      const range = WAVE_FREQUENCIES[this._currentWave];
      this._frequency += (Math.random() - 0.5) * 0.5;
      this._frequency = Math.max(range.min, Math.min(range.max, this._frequency));
      this.updateOscillators();
    }
  }

  getMetrics(): MusicMetrics {
    return {
      isRunning: this._running,
      isPlaying: this._playing,
      currentWave: this._currentWave,
      frequency: this._frequency,
      carrierFreq: this._carrierFreq,
      volume: this._volume,
      sessionsCompleted: this._sessionsCompleted,
      totalPlaytimeMs: this._totalPlaytimeMs + (this._playing ? Date.now() - this._playStartTime : 0),
      cyclesCompleted: this._cyclesCompleted,
    };
  }

  static getWaveInfo(): Record<BrainwaveType, { min: number; max: number; desc: string }> {
    return WAVE_FREQUENCIES;
  }
}
