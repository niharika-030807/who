// Modern Sound Manager supporting custom MP3 audio assets and Web Audio synth fallbacks

const SOUND_ASSETS = {
  roleReveal: '/sounds/among-us-role-reveal-sound.mp3',
  gameStart: '/sounds/chalo.mp3',
  dramatic: '/sounds/dun-dun-dun-sound-effect-brass_8nFBccR.mp3',
  fah: '/sounds/fahhhhhhhhhhhhhh.mp3',
  fail: '/sounds/spongebob-fail.mp3',
  huh: '/sounds/huh_37bAoRo.mp3'
};

class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.audioPool = {};
    this.initAudioPool();
  }

  initAudioPool() {
    if (typeof window === 'undefined') return;
    try {
      Object.entries(SOUND_ASSETS).forEach(([key, src]) => {
        const audio = new Audio(src);
        audio.preload = 'auto';
        this.audioPool[key] = audio;
      });
    } catch (e) {
      console.warn('Audio pool initialization warning:', e);
    }
  }

  initSynth() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play an audio file with volume control and clone node for rapid overlap
  playFile(key, volume = 0.85) {
    if (!this.enabled || typeof window === 'undefined') return;

    try {
      const src = SOUND_ASSETS[key];
      if (!src) return;

      const audio = new Audio(src);
      audio.volume = Math.max(0, Math.min(1, volume));
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Autoplay policy or user hasn't interacted yet
          console.warn(`Audio playback for ${key} was prevented:`, err);
        });
      }
      return audio;
    } catch (err) {
      console.warn(`Audio error playing ${key}:`, err);
    }
  }

  // 1. Role Reveal: Among Us iconic reveal sound
  playRoleReveal() {
    this.playFile('roleReveal', 0.9);
    this.playFlip(); // Layered flip chime
  }

  // 2. Game Start: "Chalo!"
  playGameStart() {
    this.playFile('gameStart', 0.9);
  }

  // 3. Dramatic Reveal / Voting / Accusation: "Dun Dun Dunnn"
  playDramatic() {
    this.playFile('dramatic', 0.85);
  }

  // 4. Fail / Elimination / Wrong Guess: SpongeBob Fail
  playFail() {
    this.playFile('fail', 0.85);
  }

  // 5. Fah reaction / Tie / Buzzer: "Fahhhhhhhhh"
  playFah() {
    this.playFile('fah', 0.85);
  }

  // 6. Civilian Eliminated: "HUH?!" meme sound effect (audible to everyone)
  playHuh() {
    this.playFile('huh', 0.95);
  }

  // Synth Fallback: Card flip whoosh
  playFlip() {
    if (!this.enabled) return;
    this.initSynth();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(780, t + 0.12);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.15);
    } catch (e) {}
  }

  // Turn chime ding
  playTurnDing() {
    if (!this.enabled) return;
    this.initSynth();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, t); // D5
      osc.frequency.setValueAtTime(880, t + 0.08); // A5

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.35);
    } catch (e) {}
  }

  // Vote cast click / punch
  playVote() {
    if (!this.enabled) return;
    this.initSynth();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'square';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.1);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.12);
    } catch (e) {}
  }

  // Victory fanfare
  playWin() {
    if (!this.enabled) return;
    this.initSynth();
    if (!this.ctx) return;

    try {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime + i * 0.1;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.35);
      });
    } catch (e) {}
  }

  toggleMute() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

export const sound = new SoundManager();
