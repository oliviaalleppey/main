/**
 * Music for the 31st Night page.
 *
 * Plays the track uploaded in the admin when there is one. Without a track, or
 * if the track cannot play, it falls back to a lounge-house loop synthesised in
 * the browser, so the page never ships someone else's recording.
 *
 * Entering with sound plays a one-bar build-up while the curtains open, then a
 * hit as they finish; the loop (or the uploaded track) starts on that hit.
 *
 * Browsers only allow sound after a click, so `start()` must be called from one.
 * `level()` reads the low end of whatever is playing, for the beat-reactive glow.
 */

const BPM = 118;
const BEAT = 60 / BPM;
const STEP = BEAT / 4; // one 16th note, in seconds
const LOOKAHEAD = 0.15;

/** One bar. The curtains take exactly this long, so the beat drops as they finish opening. */
export const INTRO_SECONDS = BEAT * 4;

export type PartyFx = 'launch' | 'boom' | 'smoke' | 'clink' | 'switch' | 'ping';

// A minor, F, C, G: one bar each.
const CHORDS = [
    [57, 60, 64],
    [53, 57, 60],
    [48, 52, 55],
    [55, 59, 62],
];
const ARP_STEPS = [0, 3, 6, 8, 11, 14];
const ARP_NOTES = [0, 1, 2, 1, 2, 0];
const BASS_STEPS = new Set([0, 6, 10]);
const BELL_STEPS = new Set([0, 6, 12]);
const PENTATONIC = [81, 84, 86, 88, 91, 93];

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

export class PartyMusic {
    private ctx: AudioContext | null = null;
    private master: GainNode | null = null;
    private analyser: AnalyserNode | null = null;
    private bins: Uint8Array<ArrayBuffer> | null = null;
    private audio: HTMLAudioElement | null = null;
    private trackGain: GainNode | null = null;
    private noise: AudioBuffer | null = null;
    private reverb: ConvolverNode | null = null;
    private timer: number | null = null;
    private nextTime = 0;
    private step = 0;
    private lastBoom = 0;

    /** True while the synthesised loop is playing, so visuals can follow its bars. */
    synced = false;
    /** Called at the start of every bar of the synthesised loop. */
    onBar?: (bar: number) => void;

    constructor(private trackUrl: string) {}

    /**
     * Starts the sound. With `intro`, a build-up plays first and the music
     * drops after it. Returns the seconds until the drop, as heard.
     */
    async start(intro = false): Promise<number> {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        this.ctx = ctx;

        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.75;
        this.bins = new Uint8Array(this.analyser.frequencyBinCount);

        this.master = ctx.createGain();
        this.master.gain.value = 0.75;
        this.master.connect(this.analyser);
        this.analyser.connect(ctx.destination);

        await ctx.resume();
        this.buildRoom();

        const t0 = ctx.currentTime + 0.05;
        const drop = intro ? t0 + INTRO_SECONDS : t0;
        if (intro) {
            this.riser(t0, INTRO_SECONDS);
            this.hit(drop);
        }

        if (this.trackUrl) {
            // play() has to happen now, inside the click; the track stays silent until the drop.
            void this.playTrack(drop).then((ok) => {
                if (!ok) this.startSynth(Math.max(drop, ctx.currentTime + 0.05));
            });
        } else {
            this.startSynth(drop);
        }

        const latency = (ctx as AudioContext & { outputLatency?: number }).outputLatency || ctx.baseLatency || 0;
        return Math.max(0, drop - ctx.currentTime + latency);
    }

    pause() {
        this.audio?.pause();
        void this.ctx?.suspend();
    }

    resume() {
        void this.ctx?.resume();
        void this.audio?.play().catch(() => undefined);
    }

    stop() {
        if (this.timer !== null) window.clearInterval(this.timer);
        this.timer = null;
        this.audio?.pause();
        this.audio = null;
        void this.ctx?.close();
        this.ctx = null;
    }

    /** 0..1, how hard the low end is hitting right now. */
    level(): number {
        if (!this.analyser || !this.bins || this.ctx?.state !== 'running') return 0;
        this.analyser.getByteFrequencyData(this.bins);
        let sum = 0;
        for (let i = 0; i < 6; i++) sum += this.bins[i];
        return Math.min(1, sum / (6 * 255));
    }

    /** Sound effects for the page's toys. Silent while the music is paused. */
    fx(kind: PartyFx, seconds = 0.7) {
        const ctx = this.ctx;
        if (!ctx || ctx.state !== 'running' || !this.noise) return;
        const t = ctx.currentTime + 0.01;

        switch (kind) {
            case 'launch': {
                // A rising whistle with a little hiss.
                const osc = ctx.createOscillator();
                osc.frequency.setValueAtTime(650, t);
                osc.frequency.exponentialRampToValueAtTime(1900, t + seconds);
                const g = ctx.createGain();
                g.gain.setValueAtTime(0.0001, t);
                g.gain.exponentialRampToValueAtTime(0.025, t + 0.08);
                g.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
                osc.connect(g).connect(this.master!);
                osc.start(t);
                osc.stop(t + seconds + 0.05);
                this.noiseHit(t, 'highpass', 3500, 0.015, seconds);
                break;
            }
            case 'boom': {
                if (t - this.lastBoom < 0.12) return;
                this.lastBoom = t;
                this.noiseHit(t, 'lowpass', 800, 0.3, 0.9, true);
                this.drop(t, 75, 30, 0.35, 0.5);
                for (let i = 0; i < 5; i++) {
                    this.noiseHit(t + 0.15 + Math.random() * 0.5, 'highpass', 5000, 0.04, 0.03);
                }
                break;
            }
            case 'smoke':
                this.sweep(t, 2600, 500, 0.16, 1.8);
                break;
            case 'clink':
                [2350, 3520, 5150].forEach((f, i) => this.tone(f, t, 0.08 / (i + 1), 1.1, 'sine', true));
                [2490, 3710].forEach((f) => this.tone(f, t + 0.07, 0.04, 0.8, 'sine', true));
                break;
            case 'switch':
                this.noiseHit(t, 'highpass', 4000, 0.18, 0.03);
                this.sweep(t, 300, 4000, 0.05, 0.5);
                break;
            case 'ping':
                this.tone(hz(PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)]), t, 0.06, 0.6, 'sine', true);
                break;
        }
    }

    private async playTrack(drop: number): Promise<boolean> {
        const ctx = this.ctx;
        if (!ctx || !this.master) return false;
        try {
            const audio = new Audio();
            audio.crossOrigin = 'anonymous';
            audio.loop = true;
            audio.src = this.trackUrl;
            this.trackGain = ctx.createGain();
            this.trackGain.gain.value = 0;
            ctx.createMediaElementSource(audio).connect(this.trackGain).connect(this.master);
            await audio.play();
            this.audio = audio;
            // Start the track from the top on the drop, and bring it in.
            const at = Math.max(drop, ctx.currentTime);
            window.setTimeout(() => { audio.currentTime = 0; }, (at - ctx.currentTime) * 1000);
            this.trackGain.gain.setValueAtTime(0, at);
            this.trackGain.gain.linearRampToValueAtTime(1.15, at + 0.35);
            return true;
        } catch {
            return false;
        }
    }

    // ── Shared pieces ───────────────────────────────────────

    private buildRoom() {
        const ctx = this.ctx!;
        this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const data = this.noise.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

        // A short generated room, so the pads, plucks and bells sit in a space.
        const length = Math.floor(ctx.sampleRate * 2.4);
        const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
        for (let c = 0; c < 2; c++) {
            const ch = impulse.getChannelData(c);
            for (let i = 0; i < length; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
        }
        this.reverb = ctx.createConvolver();
        this.reverb.buffer = impulse;
        const wet = ctx.createGain();
        wet.gain.value = 0.35;
        this.reverb.connect(wet);
        wet.connect(this.master!);
    }

    private env(t: number, peak: number, attack: number, decay: number) {
        const g = this.ctx!.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak, t + attack);
        g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
        return g;
    }

    private tone(freq: number, t: number, peak: number, decay: number, type: OscillatorType, toReverb = false) {
        const ctx = this.ctx!;
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        const g = this.env(t, peak, 0.004, decay);
        osc.connect(g).connect(this.master!);
        if (toReverb && this.reverb) g.connect(this.reverb);
        osc.start(t);
        osc.stop(t + decay + 0.05);
    }

    /** A pitch drop, for kicks and booms. */
    private drop(t: number, from: number, to: number, peak: number, decay: number) {
        const ctx = this.ctx!;
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(from, t);
        osc.frequency.exponentialRampToValueAtTime(to, t + (decay < 0.5 ? 0.14 : 0.5));
        const g = this.env(t, peak, 0.003, decay);
        osc.connect(g).connect(this.master!);
        osc.start(t);
        osc.stop(t + decay + 0.1);
    }

    private noiseHit(t: number, type: BiquadFilterType, freq: number, peak: number, decay: number, toReverb = false) {
        const ctx = this.ctx!;
        const src = ctx.createBufferSource();
        src.buffer = this.noise;
        src.loop = decay > 0.9;
        const filter = ctx.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = freq;
        const g = this.env(t, peak, 0.002, decay);
        src.connect(filter).connect(g).connect(this.master!);
        if (toReverb && this.reverb) g.connect(this.reverb);
        src.start(t);
        src.stop(t + decay + 0.05);
    }

    /** Filtered noise whose pitch slides, for whooshes and the smoke machine. */
    private sweep(t: number, from: number, to: number, peak: number, length: number) {
        const ctx = this.ctx!;
        const src = ctx.createBufferSource();
        src.buffer = this.noise;
        src.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 1.1;
        filter.frequency.setValueAtTime(from, t);
        filter.frequency.exponentialRampToValueAtTime(to, t + length);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak, t + Math.min(0.15, length / 3));
        g.gain.exponentialRampToValueAtTime(0.0001, t + length);
        src.connect(filter).connect(g).connect(this.master!);
        src.start(t);
        src.stop(t + length + 0.05);
    }

    // ── The build-up and the hit ────────────────────────────

    private riser(t: number, length: number) {
        const ctx = this.ctx!;

        // Noise sweeping up, louder as the curtains part.
        const src = ctx.createBufferSource();
        src.buffer = this.noise;
        src.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 1.4;
        filter.frequency.setValueAtTime(300, t);
        filter.frequency.exponentialRampToValueAtTime(7500, t + length);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.2, t + length - 0.02);
        g.gain.linearRampToValueAtTime(0.0001, t + length + 0.02);
        src.connect(filter).connect(g).connect(this.master!);
        g.connect(this.reverb!);
        src.start(t);
        src.stop(t + length + 0.05);

        // A snare roll that speeds up: eighths, then sixteenths, then thirty-seconds.
        for (let at = t; at < t + length - 0.01;) {
            const k = (at - t) / length;
            this.noiseHit(at, 'bandpass', 1800, 0.04 + k * 0.24, 0.09, true);
            at += k < 0.5 ? BEAT / 2 : k < 0.75 ? BEAT / 4 : BEAT / 8;
        }

        // A rising tone underneath.
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.exponentialRampToValueAtTime(440, t + length);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(400, t);
        lp.frequency.exponentialRampToValueAtTime(4000, t + length);
        const og = ctx.createGain();
        og.gain.setValueAtTime(0.0001, t);
        og.gain.exponentialRampToValueAtTime(0.05, t + length - 0.02);
        og.gain.linearRampToValueAtTime(0.0001, t + length + 0.02);
        osc.connect(lp).connect(og).connect(this.master!);
        osc.start(t);
        osc.stop(t + length + 0.05);
    }

    private hit(t: number) {
        const ctx = this.ctx!;
        this.drop(t, 95, 32, 1, 1.4);
        this.noiseHit(t, 'highpass', 4500, 0.3, 2.4, true);

        // A wide A minor chord, brassy at first and then mellowing.
        for (const note of [45, 57, 64, 69, 72, 76]) {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = hz(note);
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(3200, t);
            filter.frequency.exponentialRampToValueAtTime(600, t + 0.7);
            const g = this.env(t, 0.05, 0.01, 1.4);
            osc.connect(filter).connect(g).connect(this.master!);
            g.connect(this.reverb!);
            osc.start(t);
            osc.stop(t + 1.5);
        }

        // New Year bells over the top.
        [81, 84, 88, 93].forEach((note, i) => this.bell(hz(note), t + 0.05 + i * 0.09, 0.05));
    }

    // ── Synthesised loop ────────────────────────────────────

    private startSynth(at: number) {
        if (!this.ctx || !this.master) return;
        this.nextTime = at;
        this.step = 0;
        this.synced = true;
        this.timer = window.setInterval(() => this.schedule(), 25);
    }

    private schedule() {
        const ctx = this.ctx;
        if (!ctx || ctx.state !== 'running') return;
        while (this.nextTime < ctx.currentTime + LOOKAHEAD) {
            this.playStep(this.step, this.nextTime);
            if (this.step % 16 === 0 && this.onBar) {
                const bar = this.step / 16;
                window.setTimeout(() => this.onBar?.(bar), Math.max(0, (this.nextTime - ctx.currentTime) * 1000));
            }
            this.nextTime += STEP;
            this.step = (this.step + 1) % 64;
        }
    }

    private playStep(step: number, t: number) {
        const inBar = step % 16;
        const bar = Math.floor(step / 16);
        const chord = CHORDS[bar];

        if (inBar % 4 === 0) this.drop(t, 130, 42, 0.9, 0.32);
        if (inBar === 4 || inBar === 12) this.noiseHit(t, 'bandpass', 1600, 0.28, 0.16, true);
        if (inBar % 4 === 2) this.noiseHit(t, 'highpass', 7500, 0.11, 0.06);
        else if (inBar % 2 === 1) this.noiseHit(t, 'highpass', 7500, 0.035, 0.03);

        if (BASS_STEPS.has(inBar)) this.bass(hz(chord[0] - 24), t, inBar === 0 ? 0.42 : 0.3);
        if (inBar === 14) this.bass(hz(chord[0] - 12), t, 0.2);

        if (inBar === 0) chord.forEach((note) => this.pad(hz(note), t, STEP * 16));
        const arp = ARP_STEPS.indexOf(inBar);
        if (arp >= 0) this.tone(hz(chord[ARP_NOTES[arp]] + 12), t, 0.07, 0.24, 'triangle', true);
        if (bar % 2 === 0 && BELL_STEPS.has(inBar)) this.bell(hz(chord[[0, 1, 2][[0, 6, 12].indexOf(inBar)]] + 24), t, 0.022);
    }

    private bass(freq: number, t: number, peak: number) {
        const ctx = this.ctx!;
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(520, t);
        filter.frequency.exponentialRampToValueAtTime(180, t + 0.25);
        const g = this.env(t, peak, 0.008, 0.3);
        osc.connect(filter).connect(g).connect(this.master!);
        osc.start(t);
        osc.stop(t + 0.4);
    }

    private pad(freq: number, t: number, length: number) {
        const ctx = this.ctx!;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1100;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.045, t + 0.6);
        g.gain.setValueAtTime(0.045, t + length - 0.4);
        g.gain.exponentialRampToValueAtTime(0.0001, t + length);
        filter.connect(g);
        g.connect(this.master!);
        if (this.reverb) g.connect(this.reverb);
        for (const detune of [-7, 7]) {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            osc.detune.value = detune;
            osc.connect(filter);
            osc.start(t);
            osc.stop(t + length + 0.05);
        }
    }

    /** A bell: a pure tone plus the out-of-tune overtone that makes it ring. */
    private bell(freq: number, t: number, peak: number) {
        this.tone(freq, t, peak, 1.3, 'sine', true);
        this.tone(freq * 2.76, t, peak * 0.35, 0.6, 'sine', true);
    }
}
