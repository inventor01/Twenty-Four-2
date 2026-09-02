// Meditative sound engine using Web Audio API and haptic vibration feedback

export type ChimeType = 'start' | 'pause' | 'resume' | 'interval' | 'finish' | 'reflect' | 'mood' | 'goal' | 'chime';

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public hapticsEnabled: boolean = true;

  constructor() {
    // Lazy init on first user interaction
    const savedSound = localStorage.getItem('twentyfour_sound_enabled');
    if (savedSound !== null) {
      this.enabled = savedSound === 'true';
    }
    const savedHaptics = localStorage.getItem('twentyfour_haptics_enabled');
    if (savedHaptics !== null) {
      this.hapticsEnabled = savedHaptics === 'true';
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setEnabled(val: boolean): void {
    this.enabled = val;
    localStorage.setItem('twentyfour_sound_enabled', String(this.enabled));
  }

  public toggleSound(val?: boolean): boolean {
    this.enabled = val !== undefined ? val : !this.enabled;
    localStorage.setItem('twentyfour_sound_enabled', String(this.enabled));
    if (this.enabled) {
      this.playChime('start');
    }
    return this.enabled;
  }

  public toggleHaptics(val?: boolean): boolean {
    this.hapticsEnabled = val !== undefined ? val : !this.hapticsEnabled;
    localStorage.setItem('twentyfour_haptics_enabled', String(this.hapticsEnabled));
    if (this.hapticsEnabled) {
      this.vibrate('light');
    }
    return this.hapticsEnabled;
  }

  /** Soft Tibetan singing bowl / meditative harmonic chime */
  public playChime(type: ChimeType = 'chime'): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (type === 'start' || type === 'chime') {
        // Warm rising gentle harmonic (432Hz & 648Hz)
        this.createTone(ctx, 432, now, 1.8, 0.12, 'sine');
        this.createTone(ctx, 648, now + 0.05, 1.4, 0.06, 'sine');
      } else if (type === 'pause') {
        // Soft descending warm tone
        this.createTone(ctx, 432, now, 0.8, 0.08, 'sine');
        this.createTone(ctx, 360, now + 0.08, 0.9, 0.06, 'sine');
      } else if (type === 'resume') {
        // Gentle re-centering chime
        this.createTone(ctx, 360, now, 0.8, 0.08, 'sine');
        this.createTone(ctx, 432, now + 0.08, 1.2, 0.09, 'sine');
      } else if (type === 'interval') {
        // Meditative mindfulness bell for Pomodoro interval switch (528Hz Solfeggio frequency + 792Hz)
        this.createTone(ctx, 528, now, 2.5, 0.15, 'sine');
        this.createTone(ctx, 792, now + 0.1, 2.0, 0.08, 'sine');
        this.createTone(ctx, 1056, now + 0.2, 1.5, 0.04, 'sine');
      } else if (type === 'mood') {
        // Sparkling melodic chord for mood vibe shift (Solfeggio 639Hz & 852Hz)
        this.createTone(ctx, 639, now, 1.6, 0.10, 'sine');
        this.createTone(ctx, 852, now + 0.08, 1.8, 0.07, 'sine');
        this.createTone(ctx, 1024, now + 0.16, 2.0, 0.04, 'sine');
      } else if (type === 'goal') {
        // Harmonious accomplishment chime (528Hz -> 660Hz -> 792Hz)
        this.createTone(ctx, 528, now, 2.0, 0.12, 'sine');
        this.createTone(ctx, 660, now + 0.1, 2.2, 0.09, 'sine');
        this.createTone(ctx, 792, now + 0.2, 2.6, 0.06, 'sine');
      } else if (type === 'finish' || type === 'reflect') {
        // Resonant deep singing bowl (216Hz, 432Hz, 864Hz)
        this.createTone(ctx, 216, now, 3.2, 0.18, 'sine');
        this.createTone(ctx, 432, now + 0.06, 2.8, 0.12, 'sine');
        this.createTone(ctx, 648, now + 0.12, 2.2, 0.06, 'sine');
        this.createTone(ctx, 864, now + 0.18, 1.8, 0.03, 'sine');
      }
    } catch (e) {
      console.warn('Audio playback not permitted yet:', e);
    }
  }

  private createTone(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    gainLevel: number,
    type: OscillatorType = 'sine'
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    // Soft attack & exponential decay envelope for acoustic-like bowl timbre
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(gainLevel, startTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  /** Soft tactile feedback */
  public vibrate(pattern: 'light' | 'medium' | 'success' | 'interval'): void {
    if (!this.hapticsEnabled || typeof window === 'undefined' || !navigator.vibrate) return;
    try {
      if (pattern === 'light') {
        navigator.vibrate(10);
      } else if (pattern === 'medium') {
        navigator.vibrate(25);
      } else if (pattern === 'interval') {
        navigator.vibrate([20, 50, 30]);
      } else if (pattern === 'success') {
        navigator.vibrate([15, 40, 20, 40, 30]);
      }
    } catch {
      // Ignore vibration errors
    }
  }
}

export const soundEngine = new SoundEngine();
