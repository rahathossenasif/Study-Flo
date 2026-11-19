import { AmbientSoundId } from '../types/studyflow';

/**
 * Studio-warm procedural Web Audio API soundscape engine.
 * 100% offline, zero external audio assets, stereo noise buffers, gentle fade-in,
 * warm filtering, and musical Lo-Fi / Ambient Piano synthesis.
 */
class FocusSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sceneGain: GainNode | null = null;
  private activeNodes: AudioNode[] = [];
  private activeIntervals: number[] = [];
  private activeTimeouts: number[] = [];
  private currentSound: AmbientSoundId = 'none';
  private volume = 0.55;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setVolume(nextVolume: number) {
    this.volume = Math.max(0, Math.min(1, nextVolume));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.08);
    }
  }

  public stop() {
    this.activeIntervals.forEach((id) => window.clearInterval(id));
    this.activeIntervals = [];
    this.activeTimeouts.forEach((id) => window.clearTimeout(id));
    this.activeTimeouts = [];

    this.activeNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          (node as AudioScheduledSourceNode).stop();
        }
        node.disconnect();
      } catch {
        // Ignore already-stopped nodes
      }
    });
    this.activeNodes = [];
    if (this.sceneGain) {
      try {
        this.sceneGain.disconnect();
      } catch {
        // Ignore
      }
      this.sceneGain = null;
    }
    this.currentSound = 'none';
  }

  public play(sound: AmbientSoundId) {
    if (sound === 'none') {
      this.stop();
      return;
    }
    if (this.currentSound === sound && this.activeNodes.length > 0) {
      return;
    }

    this.stop();
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    this.currentSound = sound;

    // Dedicated scene gain with soft fade-in to prevent pops/clicks
    const sceneGain = ctx.createGain();
    sceneGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    sceneGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.45);
    sceneGain.connect(this.masterGain);
    this.sceneGain = sceneGain;

    switch (sound) {
      case 'rain':
        this.startRain(ctx, sceneGain);
        break;
      case 'lofi':
        this.startLoFiChill(ctx, sceneGain);
        break;
      case 'cafe':
        this.startCafe(ctx, sceneGain);
        break;
      case 'forest':
        this.startForest(ctx, sceneGain);
        break;
      case 'ocean':
        this.startOcean(ctx, sceneGain);
        break;
      case 'fireplace':
        this.startFireplace(ctx, sceneGain);
        break;
      case 'piano':
        this.startAmbientPiano(ctx, sceneGain);
        break;
      case 'night':
        this.startNightCalm(ctx, sceneGain);
        break;
    }
  }

  /**
   * Generates a 6-second seamless stereo pink or brown noise buffer with crossfaded loop edges.
   */
  private createStereoNoiseBuffer(ctx: AudioContext, type: 'pink' | 'brown'): AudioBuffer {
    const durationSec = 6;
    const length = ctx.sampleRate * durationSec;
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    const fadeSamples = Math.floor(ctx.sampleRate * 0.25);

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      if (type === 'brown') {
        let lastOut = 0;
        for (let i = 0; i < length; i++) {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + 0.018 * white) / 1.018;
          data[i] = Math.max(-1, Math.min(1, lastOut * 3.1));
        }
      } else {
        let b0 = 0,
          b1 = 0,
          b2 = 0,
          b3 = 0,
          b4 = 0,
          b5 = 0,
          b6 = 0;
        for (let i = 0; i < length; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.969 * b2 + white * 0.153852;
          b3 = 0.8665 * b3 + white * 0.3104856;
          b4 = 0.55 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.016898;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.085;
          b6 = white * 0.115926;
        }
      }

      // Seamless loop crossfade between tail and head
      for (let i = 0; i < fadeSamples; i++) {
        const t = i / fadeSamples;
        const tailIdx = length - fadeSamples + i;
        data[i] = data[i] * t + data[tailIdx] * (1 - t);
      }
    }
    return buffer;
  }

  /**
   * Warm stereo echo/reverb bus for musical soundscapes (Lo-Fi & Ambient Piano).
   */
  private createWarmSpaceBus(ctx: AudioContext, dest: AudioNode, wetAmount = 0.32): GainNode {
    const input = ctx.createGain();
    input.connect(dest);

    const delayL = ctx.createDelay(1.0);
    delayL.delayTime.value = 0.34;
    const delayR = ctx.createDelay(1.0);
    delayR.delayTime.value = 0.47;

    const fbL = ctx.createGain();
    fbL.gain.value = 0.32;
    const fbR = ctx.createGain();
    fbR.gain.value = 0.3;

    const damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = 1600;

    const wetGain = ctx.createGain();
    wetGain.gain.value = wetAmount;

    input.connect(damp);
    damp.connect(delayL);
    damp.connect(delayR);

    delayL.connect(fbL);
    fbL.connect(delayR);
    delayR.connect(fbR);
    fbR.connect(delayL);

    delayL.connect(wetGain);
    delayR.connect(wetGain);
    wetGain.connect(dest);

    this.activeNodes.push(input, delayL, delayR, fbL, fbR, damp, wetGain);
    return input;
  }

  /**
   * Plays a warm Rhodes-style felt/electric piano note.
   */
  private triggerWarmRhodesNote(
    ctx: AudioContext,
    dest: AudioNode,
    freq: number,
    startTime: number,
    durationSec: number,
    peakGain: number
  ) {
    // Fundamental sine + gentle warm triangle harmonic
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(freq, startTime);
    // Tiny Rhodes bell overtone (2x freq, very soft & fast decay)
    osc2.frequency.setValueAtTime(freq * 2, startTime);
    osc2.detune.setValueAtTime(3.5, startTime);

    const env1 = ctx.createGain();
    env1.gain.setValueAtTime(0.0001, startTime);
    env1.gain.linearRampToValueAtTime(peakGain, startTime + 0.035);
    env1.gain.exponentialRampToValueAtTime(peakGain * 0.45, startTime + durationSec * 0.45);
    env1.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

    const env2 = ctx.createGain();
    env2.gain.setValueAtTime(0.0001, startTime);
    env2.gain.linearRampToValueAtTime(peakGain * 0.14, startTime + 0.015);
    env2.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.min(0.6, durationSec * 0.35));

    osc1.connect(env1);
    osc2.connect(env2);
    env1.connect(dest);
    env2.connect(dest);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + durationSec + 0.06);
    osc2.stop(startTime + durationSec + 0.06);
  }

  // 1. SOFT RAIN — Warm stereo rainfall + gentle low wash + delicate droplet ambience
  private startRain(ctx: AudioContext, dest: GainNode) {
    const pinkBuf = this.createStereoNoiseBuffer(ctx, 'pink');
    const brownBuf = this.createStereoNoiseBuffer(ctx, 'brown');

    // Main steady rainfall layer
    const rainSrc = ctx.createBufferSource();
    rainSrc.buffer = pinkBuf;
    rainSrc.loop = true;

    const rainHp = ctx.createBiquadFilter();
    rainHp.type = 'highpass';
    rainHp.frequency.value = 180;

    const rainLp = ctx.createBiquadFilter();
    rainLp.type = 'lowpass';
    rainLp.frequency.value = 1650;

    const rainGain = ctx.createGain();
    rainGain.gain.value = 0.46;

    rainSrc.connect(rainHp);
    rainHp.connect(rainLp);
    rainLp.connect(rainGain);
    rainGain.connect(dest);

    // Warm distant rain wash (cozy low body)
    const washSrc = ctx.createBufferSource();
    washSrc.buffer = brownBuf;
    washSrc.loop = true;

    const washLp = ctx.createBiquadFilter();
    washLp.type = 'lowpass';
    washLp.frequency.value = 260;

    const washGain = ctx.createGain();
    washGain.gain.value = 0.34;

    washSrc.connect(washLp);
    washLp.connect(washGain);
    washGain.connect(dest);

    // Subtle organic shower intensity modulation
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 220;
    lfo.connect(lfoGain);
    lfoGain.connect(rainLp.frequency);

    rainSrc.start();
    washSrc.start();
    lfo.start();

    this.activeNodes.push(
      rainSrc,
      rainHp,
      rainLp,
      rainGain,
      washSrc,
      washLp,
      washGain,
      lfo,
      lfoGain
    );
  }

  // 2. LO-FI CHILL BEATS — Warm Rhodes jazz progression + soft chillhop beat + faint vinyl warmth
  private startLoFiChill(ctx: AudioContext, dest: GainNode) {
    // Master cozy tape lowpass filter
    const tapeFilter = ctx.createBiquadFilter();
    tapeFilter.type = 'lowpass';
    tapeFilter.frequency.value = 1750;
    tapeFilter.Q.value = 0.5;
    tapeFilter.connect(dest);

    const spaceBus = this.createWarmSpaceBus(ctx, tapeFilter, 0.34);

    // Subtle warm vinyl hiss bed
    const vinylSrc = ctx.createBufferSource();
    vinylSrc.buffer = this.createStereoNoiseBuffer(ctx, 'pink');
    vinylSrc.loop = true;

    const vinylBp = ctx.createBiquadFilter();
    vinylBp.type = 'bandpass';
    vinylBp.frequency.value = 1900;
    vinylBp.Q.value = 0.9;

    const vinylGain = ctx.createGain();
    vinylGain.gain.value = 0.022;

    vinylSrc.connect(vinylBp);
    vinylBp.connect(vinylGain);
    vinylGain.connect(tapeFilter);
    vinylSrc.start();

    // Lush jazzy lo-fi chord progression (Fmaj9 -> Em7 -> Dm9 -> Cmaj9)
    const progression = [
      { bass: 87.31, chord: [174.61, 220.0, 261.63, 329.63, 392.0], melody: [523.25, 440.0] },
      { bass: 82.41, chord: [164.81, 196.0, 246.94, 293.66, 392.0], melody: [493.88, 392.0] },
      { bass: 73.42, chord: [146.83, 174.61, 220.0, 261.63, 329.63], melody: [440.0, 329.63] },
      { bass: 65.41, chord: [130.81, 164.81, 196.0, 246.94, 293.66], melody: [392.0, 329.63] },
    ];

    const noiseShotBuf = this.createStereoNoiseBuffer(ctx, 'pink');

    const playSoftKick = (t: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(118, t);
      osc.frequency.exponentialRampToValueAtTime(44, t + 0.13);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.24, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      osc.connect(g);
      g.connect(tapeFilter);
      osc.start(t);
      osc.stop(t + 0.3);
    };

    const playSoftSnare = (t: number) => {
      const src = ctx.createBufferSource();
      src.buffer = noiseShotBuf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1100;
      bp.Q.value = 0.8;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.075, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      src.connect(bp);
      bp.connect(g);
      g.connect(tapeFilter);
      src.start(t, Math.random() * 2, 0.18);
    };

    const playSoftHat = (t: number, accent: boolean) => {
      const src = ctx.createBufferSource();
      src.buffer = noiseShotBuf;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 4200;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(accent ? 0.028 : 0.016, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      src.connect(hp);
      hp.connect(g);
      g.connect(dest);
      src.start(t, Math.random() * 2, 0.07);
    };

    // 70 BPM => 1 eighth-note step = 428ms; 1 bar (8 eighth notes) = 3424ms
    const stepMs = 428;
    let step = 0;

    const runStep = () => {
      const now = ctx.currentTime + 0.02;
      const bar = Math.floor(step / 8) % progression.length;
      const beatInBar = step % 8;
      const current = progression[bar];

      // Strummed Rhodes chord on beat 1 (step 0) and gentle restrike on step 5
      if (beatInBar === 0) {
        current.chord.forEach((freq, idx) => {
          this.triggerWarmRhodesNote(ctx, spaceBus, freq, now + idx * 0.032, 3.1, 0.075);
        });
        // Warm round bass note
        this.triggerWarmRhodesNote(ctx, tapeFilter, current.bass, now, 2.8, 0.16);
      } else if (beatInBar === 5) {
        // Gentle chord echo
        current.chord.slice(1, 4).forEach((freq, idx) => {
          this.triggerWarmRhodesNote(ctx, spaceBus, freq, now + idx * 0.025, 1.3, 0.042);
        });
      }

      // Delicate top melody sparkle on step 3 and step 7
      if (beatInBar === 3) {
        this.triggerWarmRhodesNote(ctx, spaceBus, current.melody[0], now, 1.6, 0.055);
      } else if (beatInBar === 7 && bar % 2 === 1) {
        this.triggerWarmRhodesNote(ctx, spaceBus, current.melody[1], now, 1.4, 0.048);
      }

      // Mellow lo-fi drum groove (laid-back boom-bap)
      if (beatInBar === 0 || beatInBar === 4) {
        playSoftKick(now);
      }
      if (beatInBar === 2 || beatInBar === 6) {
        playSoftSnare(now + 0.015); // slight swing
      }
      playSoftHat(now + (beatInBar % 2 === 1 ? 0.025 : 0), beatInBar % 2 === 0);

      step += 1;
    };

    runStep();
    const intervalId = window.setInterval(runStep, stepMs);
    this.activeIntervals.push(intervalId);
    this.activeNodes.push(tapeFilter, vinylSrc, vinylBp, vinylGain);
  }

  // 3. COZY CAFE — Warm muffled coffeehouse murmur + gentle room air
  private startCafe(ctx: AudioContext, dest: GainNode) {
    const brownSrc = ctx.createBufferSource();
    brownSrc.buffer = this.createStereoNoiseBuffer(ctx, 'brown');
    brownSrc.loop = true;

    const bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = 'bandpass';
    bodyFilter.frequency.value = 340;
    bodyFilter.Q.value = 0.65;

    const bodyGain = ctx.createGain();
    bodyGain.gain.value = 0.52;

    const pinkSrc = ctx.createBufferSource();
    pinkSrc.buffer = this.createStereoNoiseBuffer(ctx, 'pink');
    pinkSrc.loop = true;

    const murmurFilter = ctx.createBiquadFilter();
    murmurFilter.type = 'bandpass';
    murmurFilter.frequency.value = 780;
    murmurFilter.Q.value = 1.2;

    const murmurGain = ctx.createGain();
    murmurGain.gain.value = 0.14;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.16;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.06;
    lfo.connect(lfoGain);
    lfoGain.connect(murmurGain.gain);

    brownSrc.connect(bodyFilter);
    bodyFilter.connect(bodyGain);
    bodyGain.connect(dest);

    pinkSrc.connect(murmurFilter);
    murmurFilter.connect(murmurGain);
    murmurGain.connect(dest);

    brownSrc.start();
    pinkSrc.start();
    lfo.start();

    this.activeNodes.push(
      brownSrc,
      bodyFilter,
      bodyGain,
      pinkSrc,
      murmurFilter,
      murmurGain,
      lfo,
      lfoGain
    );
  }

  // 4. PINE FOREST — Stereo breathing pine breeze + occasional soft distant flute-like bird chirps
  private startForest(ctx: AudioContext, dest: GainNode) {
    const windSrc = ctx.createBufferSource();
    windSrc.buffer = this.createStereoNoiseBuffer(ctx, 'pink');
    windSrc.loop = true;

    const windBp = ctx.createBiquadFilter();
    windBp.type = 'bandpass';
    windBp.frequency.value = 540;
    windBp.Q.value = 1.1;

    const windLp = ctx.createBiquadFilter();
    windLp.type = 'lowpass';
    windLp.frequency.value = 1300;

    const windGain = ctx.createGain();
    windGain.gain.value = 0.36;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 190;
    lfo.connect(lfoGain);
    lfoGain.connect(windBp.frequency);

    windSrc.connect(windBp);
    windBp.connect(windLp);
    windLp.connect(windGain);
    windGain.connect(dest);

    windSrc.start();
    lfo.start();

    // Soft distant harmonic bird calls every 4.5–8s
    const spaceBus = this.createWarmSpaceBus(ctx, dest, 0.45);
    const birdMotifs = [
      [1567.98, 1760.0],
      [1318.51, 1567.98, 1318.51],
      [1760.0, 2093.0],
    ];

    const scheduleBird = () => {
      const delayMs = 4200 + Math.random() * 4800;
      const tid = window.setTimeout(() => {
        if (this.currentSound !== 'forest') return;
        const motif = birdMotifs[Math.floor(Math.random() * birdMotifs.length)];
        const now = ctx.currentTime + 0.05;
        motif.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          const t = now + idx * 0.16;
          osc.frequency.setValueAtTime(freq * 0.94, t);
          osc.frequency.exponentialRampToValueAtTime(freq, t + 0.07);
          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(0.026, t + 0.03);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
          osc.connect(g);
          g.connect(spaceBus);
          osc.start(t);
          osc.stop(t + 0.25);
        });
        scheduleBird();
      }, delayMs);
      this.activeTimeouts.push(tid);
    };
    scheduleBird();

    this.activeNodes.push(windSrc, windBp, windLp, windGain, lfo, lfoGain);
  }

  // 5. OCEAN WAVES — Deep rhythmic rolling surf swell
  private startOcean(ctx: AudioContext, dest: GainNode) {
    const brownSrc = ctx.createBufferSource();
    brownSrc.buffer = this.createStereoNoiseBuffer(ctx, 'brown');
    brownSrc.loop = true;

    const pinkSrc = ctx.createBufferSource();
    pinkSrc.buffer = this.createStereoNoiseBuffer(ctx, 'pink');
    pinkSrc.loop = true;

    const surfFilter = ctx.createBiquadFilter();
    surfFilter.type = 'lowpass';
    surfFilter.frequency.value = 520;

    const surfGain = ctx.createGain();
    surfGain.gain.value = 0.44;

    const foamFilter = ctx.createBiquadFilter();
    foamFilter.type = 'bandpass';
    foamFilter.frequency.value = 900;
    foamFilter.Q.value = 0.6;

    const foamGain = ctx.createGain();
    foamGain.gain.value = 0.16;

    // Slow 10.5s ocean wave swell LFO
    const waveLfo = ctx.createOscillator();
    waveLfo.type = 'sine';
    waveLfo.frequency.value = 0.095;

    const filterSweep = ctx.createGain();
    filterSweep.gain.value = 340;
    waveLfo.connect(filterSweep);
    filterSweep.connect(surfFilter.frequency);

    const ampSweep = ctx.createGain();
    ampSweep.gain.value = 0.14;
    waveLfo.connect(ampSweep);
    ampSweep.connect(foamGain.gain);

    brownSrc.connect(surfFilter);
    surfFilter.connect(surfGain);
    surfGain.connect(dest);

    pinkSrc.connect(foamFilter);
    foamFilter.connect(foamGain);
    foamGain.connect(dest);

    brownSrc.start();
    pinkSrc.start();
    waveLfo.start();

    this.activeNodes.push(
      brownSrc,
      pinkSrc,
      surfFilter,
      surfGain,
      foamFilter,
      foamGain,
      waveLfo,
      filterSweep,
      ampSweep
    );
  }

  // 6. FIREPLACE — Cozy hearth warmth + gentle organic wood crackles
  private startFireplace(ctx: AudioContext, dest: GainNode) {
    const brownSrc = ctx.createBufferSource();
    brownSrc.buffer = this.createStereoNoiseBuffer(ctx, 'brown');
    brownSrc.loop = true;

    const rumbleLp = ctx.createBiquadFilter();
    rumbleLp.type = 'lowpass';
    rumbleLp.frequency.value = 175;

    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.56;

    const flickerLfo = ctx.createOscillator();
    flickerLfo.frequency.value = 0.45;
    const flickerGain = ctx.createGain();
    flickerGain.gain.value = 0.08;
    flickerLfo.connect(flickerGain);
    flickerGain.connect(rumbleGain.gain);

    brownSrc.connect(rumbleLp);
    rumbleLp.connect(rumbleGain);
    rumbleGain.connect(dest);
    brownSrc.start();
    flickerLfo.start();

    // Gentle organic crackling pops
    const crackleBuf = this.createStereoNoiseBuffer(ctx, 'pink');
    const triggerCrackle = () => {
      const delayMs = 220 + Math.random() * 880;
      const tid = window.setTimeout(() => {
        if (this.currentSound !== 'fireplace') return;
        const now = ctx.currentTime + 0.01;
        const src = ctx.createBufferSource();
        src.buffer = crackleBuf;

        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1400 + Math.random() * 2400;
        bp.Q.value = 2.2;

        const g = ctx.createGain();
        const peak = 0.04 + Math.random() * 0.09;
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(peak, now + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.03 + Math.random() * 0.04);

        src.connect(bp);
        bp.connect(g);
        g.connect(dest);
        src.start(now, Math.random() * 3, 0.09);
        triggerCrackle();
      }, delayMs);
      this.activeTimeouts.push(tid);
    };
    triggerCrackle();

    this.activeNodes.push(brownSrc, rumbleLp, rumbleGain, flickerLfo, flickerGain);
  }

  // 7. AMBIENT PIANO — Meditative felt piano arpeggios in Cmaj9 / Am9 with dreamy echo
  private startAmbientPiano(ctx: AudioContext, dest: GainNode) {
    const warmLp = ctx.createBiquadFilter();
    warmLp.type = 'lowpass';
    warmLp.frequency.value = 2200;
    warmLp.connect(dest);

    const spaceBus = this.createWarmSpaceBus(ctx, warmLp, 0.48);

    // Gentle calm pentatonic melody phrases
    const phrases = [
      [261.63, 329.63, 392.0, 493.88, 523.25, 392.0],
      [220.0, 261.63, 329.63, 392.0, 440.0, 329.63],
      [174.61, 220.0, 261.63, 329.63, 392.0, 329.63],
      [196.0, 246.94, 293.66, 392.0, 440.0, 293.66],
    ];

    let phraseIdx = 0;
    let noteIdx = 0;

    const playNext = () => {
      const now = ctx.currentTime + 0.02;
      const phrase = phrases[phraseIdx];
      const freq = phrase[noteIdx];

      // Soft root pad on start of each phrase
      if (noteIdx === 0) {
        this.triggerWarmRhodesNote(ctx, spaceBus, freq / 2, now, 5.2, 0.09);
      }
      this.triggerWarmRhodesNote(ctx, spaceBus, freq, now, 3.2, 0.095);

      noteIdx += 1;
      if (noteIdx >= phrase.length) {
        noteIdx = 0;
        phraseIdx = (phraseIdx + 1) % phrases.length;
      }
    };

    playNext();
    const intervalId = window.setInterval(playNext, 1150);
    this.activeIntervals.push(intervalId);
    this.activeNodes.push(warmLp);
  }

  // 8. NIGHT CALM — Peaceful late-night breeze + delicate distant cricket pulse
  private startNightCalm(ctx: AudioContext, dest: GainNode) {
    const breezeSrc = ctx.createBufferSource();
    breezeSrc.buffer = this.createStereoNoiseBuffer(ctx, 'brown');
    breezeSrc.loop = true;

    const breezeLp = ctx.createBiquadFilter();
    breezeLp.type = 'lowpass';
    breezeLp.frequency.value = 320;

    const breezeGain = ctx.createGain();
    breezeGain.gain.value = 0.28;

    breezeSrc.connect(breezeLp);
    breezeLp.connect(breezeGain);
    breezeGain.connect(dest);
    breezeSrc.start();

    // Soft distant cricket shimmer (warm high harmonic sine gently pulsed)
    const cricketOsc = ctx.createOscillator();
    cricketOsc.type = 'sine';
    cricketOsc.frequency.value = 3850;

    const pulseLfo = ctx.createOscillator();
    pulseLfo.type = 'sine';
    pulseLfo.frequency.value = 3.2;

    const cricketAmp = ctx.createGain();
    cricketAmp.gain.value = 0.008;

    const pulseScale = ctx.createGain();
    pulseScale.gain.value = 0.007;

    const masterCricketGate = ctx.createGain();
    masterCricketGate.gain.value = 0.7;

    const slowLfo = ctx.createOscillator();
    slowLfo.frequency.value = 0.22;
    const slowScale = ctx.createGain();
    slowScale.gain.value = 0.3;

    pulseLfo.connect(pulseScale);
    pulseScale.connect(cricketAmp.gain);

    slowLfo.connect(slowScale);
    slowScale.connect(masterCricketGate.gain);

    cricketOsc.connect(cricketAmp);
    cricketAmp.connect(masterCricketGate);
    masterCricketGate.connect(dest);

    cricketOsc.start();
    pulseLfo.start();
    slowLfo.start();

    this.activeNodes.push(
      breezeSrc,
      breezeLp,
      breezeGain,
      cricketOsc,
      pulseLfo,
      cricketAmp,
      pulseScale,
      masterCricketGate,
      slowLfo,
      slowScale
    );
  }

  public playCompletionChime() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const now = ctx.currentTime;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.16, now + i * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.7);
    });
  }
}

export const soundEngine = new FocusSoundEngine();
