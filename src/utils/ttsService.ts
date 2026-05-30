class TTSService {
  private worker: Worker | null = null;
  private audioCtx: AudioContext | null = null;
  public ready: boolean = false;
  
  constructor() {
    // Client-side only
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    this.worker = new Worker(new URL('../workers/tts.worker.ts', import.meta.url), { type: 'module' });
    
    this.worker.onmessage = (e) => {
      if (e.data.type === 'ready') {
        this.ready = true;
        console.log('[TTSService] ONNX model loaded and worker ready.');
      } else if (e.data.type === 'audio') {
        this.playAudioBuffer(e.data.audio);
      } else if (e.data.type === 'error') {
        console.error('[TTSService] Worker error:', e.data.error);
      }
    };
    
    this.worker.postMessage({ type: 'init' });
  }

  private ensureAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  private speakPromises: Array<(value: void | PromiseLike<void>) => void> = [];

  public speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.ready || !this.worker) {
        console.warn('[TTSService] Not ready yet.');
        resolve();
        return;
      }
      this.ensureAudioContext();
      console.log(`[TTSService] Synthesizing: "${text}"`);
      this.speakPromises.push(resolve);
      this.worker.postMessage({ type: 'speak', text });
    });
  }

  private playAudioBuffer(float32Array: Float32Array) {
    this.ensureAudioContext();
    if (!this.audioCtx) {
      this.resolveNextPromise();
      return;
    }

    const buffer = this.audioCtx.createBuffer(1, float32Array.length, 44100);
    buffer.copyToChannel(float32Array as any, 0);
    
    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioCtx.destination);
    source.onended = () => {
      this.resolveNextPromise();
    };
    source.start();
  }

  private resolveNextPromise() {
    const resolve = this.speakPromises.shift();
    if (resolve) resolve();
  }
}

export const ttsService = new TTSService();

