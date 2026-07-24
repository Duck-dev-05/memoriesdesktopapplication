// Web Audio API Copyright-Free Ambient Sound Synthesizer
// Generates relaxing, copyright-free ambient piano/chimes progression dynamically in browser.

class AmbientSynthesizer {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private timer: any = null;
  private masterGain: GainNode | null = null;

  private chords = [
    [261.63, 329.63, 392.00, 493.88], // Cmaj7
    [220.00, 261.63, 329.63, 392.00], // Am7
    [174.61, 220.00, 261.63, 349.23], // Fmaj7
    [196.00, 246.94, 293.66, 349.23], // G7
  ];

  public start(volume: number = 0.5) {
    if (this.isPlaying) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(volume * 0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.isPlaying = true;

      let chordIndex = 0;
      const playNextChord = () => {
        if (!this.isPlaying || !this.ctx || !this.masterGain) return;
        
        const notes = this.chords[chordIndex % this.chords.length];
        notes.forEach((freq, idx) => {
          setTimeout(() => {
            if (!this.isPlaying || !this.ctx || !this.masterGain) return;
            try {
              const osc = this.ctx.createOscillator();
              const gain = this.ctx.createGain();
              
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

              const now = this.ctx.currentTime;
              gain.gain.setValueAtTime(0.001, now);
              gain.gain.exponentialRampToValueAtTime(0.12, now + 0.8);
              gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

              osc.connect(gain);
              gain.connect(this.masterGain!);

              osc.start(now);
              osc.stop(now + 4.6);
            } catch (e) {
              console.error(e);
            }
          }, idx * 350);
        });

        chordIndex++;
        this.timer = setTimeout(playNextChord, 4500);
      };

      playNextChord();
    } catch (e) {
      console.error("Failed to start Ambient Synthesizer", e);
    }
  }

  public setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(volume * 0.3, this.ctx.currentTime);
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.timer) clearTimeout(this.timer);
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {}
      this.ctx = null;
    }
  }
}

export const ambientSynth = new AmbientSynthesizer();
