import type { LanguageCode } from '../types';

export class AudioSystem {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private currentAudioSource: AudioBufferSourceNode | null = null;
  private isSynthesizing = false;
  private recognition: any = null;
  private onVolumeChangeCallback?: (vol: number) => void;
  private animFrameId?: number;

  constructor() {
    // Lazily initialize on first user gesture
  }

  private initAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256;
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setVolumeCallback(cb: (vol: number) => void) {
    this.onVolumeChangeCallback = cb;
  }

  // Play audio from Gemini TTS Base64 WAV
  public async playGeminiWav(base64Wav: string): Promise<void> {
    this.stopSpeaking();
    this.initAudioContext();
    if (!this.audioCtx || !this.analyser) return;

    try {
      const binaryString = window.atob(base64Wav);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const audioBuffer = await this.audioCtx.decodeAudioData(bytes.buffer);
      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);

      this.currentAudioSource = source;
      this.isSynthesizing = true;
      this.startAnalyserLoop();

      return new Promise<void>((resolve) => {
        source.onended = () => {
          this.isSynthesizing = false;
          this.stopAnalyserLoop();
          resolve();
        };
        source.start(0);
      });
    } catch (err) {
      console.error('Failed to play Gemini WAV audio:', err);
      this.isSynthesizing = false;
      this.stopAnalyserLoop();
    }
  }

  // Fallback / Instant Web Speech API TTS
  public speakWebSpeech(
    text: string,
    options: {
      pitch?: number;
      rate?: number;
      language?: LanguageCode;
      onStart?: () => void;
      onEnd?: () => void;
    } = {}
  ): void {
    if (!('speechSynthesis' in window)) {
      console.warn('Web Speech Synthesis not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Suara anak kecil wanita: pitch tinggi (1.55 - 1.7) dan ritme manis ceria
    utterance.pitch = options.pitch ?? 1.6;
    utterance.rate = options.rate ?? 1.1;

    // Language mapping
    const lang = options.language || 'id-slang';
    if (lang === 'en') utterance.lang = 'en-US';
    else if (lang === 'ja') utterance.lang = 'ja-JP';
    else utterance.lang = 'id-ID';

    // Prioritize female Indonesian voice
    const voices = window.speechSynthesis.getVoices();
    const idVoices = voices.filter((v) => v.lang.includes('id') || v.lang.includes('ID'));
    const femaleIdVoice = idVoices.find((v) => {
      const name = v.name.toLowerCase();
      return name.includes('female') || name.includes('wanita') || name.includes('gadis') || name.includes('putri') || name.includes('siti') || name.includes('google');
    });

    if (femaleIdVoice) {
      utterance.voice = femaleIdVoice;
    } else if (idVoices.length > 0) {
      utterance.voice = idVoices[0];
    }

    utterance.onstart = () => {
      this.isSynthesizing = true;
      options.onStart?.();
      this.startSimulatedMouthLoop();
    };

    utterance.onend = () => {
      this.isSynthesizing = false;
      this.stopAnalyserLoop();
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      this.isSynthesizing = false;
      this.stopAnalyserLoop();
      options.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    if (this.currentAudioSource) {
      try {
        this.currentAudioSource.stop();
      } catch {}
      this.currentAudioSource = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSynthesizing = false;
    this.stopAnalyserLoop();
  }

  // Real-time loop calculating audio loudness from Web Audio Analyser
  private startAnalyserLoop(): void {
    this.stopAnalyserLoop();
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const update = () => {
      if (!this.isSynthesizing || !this.analyser) {
        this.onVolumeChangeCallback?.(0);
        return;
      }
      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const normalizedVol = Math.min(1.0, avg / 128); // 0 to 1
      this.onVolumeChangeCallback?.(normalizedVol);

      this.animFrameId = requestAnimationFrame(update);
    };

    this.animFrameId = requestAnimationFrame(update);
  }

  // Simulated phonetic mouth pulsing for Web Speech API
  private startSimulatedMouthLoop(): void {
    this.stopAnalyserLoop();
    let step = 0;

    const update = () => {
      if (!this.isSynthesizing) {
        this.onVolumeChangeCallback?.(0);
        return;
      }
      step += 0.35;
      const simulatedVol = (Math.sin(step) * 0.5 + 0.5) * (0.4 + Math.random() * 0.6);
      this.onVolumeChangeCallback?.(simulatedVol);

      this.animFrameId = requestAnimationFrame(update);
    };

    this.animFrameId = requestAnimationFrame(update);
  }

  private stopAnalyserLoop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = undefined;
    }
    this.onVolumeChangeCallback?.(0);
  }

  // Microphone Speech Recognition
  public initSpeechRecognition(
    lang: LanguageCode = 'id-slang',
    onResult: (text: string, isFinal: boolean) => void,
    onError: (err: any) => void
  ): { start: () => void; stop: () => void } {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      onError(new Error('Browser ini tidak mendukung Speech Recognition API. Gunakan Chrome/Edge.'));
      return { start: () => {}, stop: () => {} };
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = true;

    if (lang === 'en') recognition.lang = 'en-US';
    else if (lang === 'ja') recognition.lang = 'ja-JP';
    else recognition.lang = 'id-ID';

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      onResult(final || interim, !!final);
    };

    recognition.onerror = (e: any) => {
      onError(e);
    };

    return {
      start: () => {
        try {
          recognition.start();
        } catch {}
      },
      stop: () => {
        try {
          recognition.stop();
        } catch {}
      },
    };
  }
}

export const globalAudioSystem = new AudioSystem();
