/**
 * Music for the 31st Night page.
 *
 * Plays the track uploaded in the admin when there is one. Without a track, or
 * if the track cannot play, it falls back to a lounge-house loop synthesised in
 * the browser, so the page never ships someone else's recording.
 *
 * Browsers only allow sound after a click, so `start()` must be called from one.
 * `level()` reads the low end of whatever is playing, for the beat-reactive glow.
 */

const BPM = 118;
const STEP = 60 / BPM / 4; // one 16th note, in seconds
const LOOKAHEAD = 0.15;

// A minor, F, C, G: one bar each.
const CHORDS = [
    [57, 60, 64],
    [53, 57, 60],
    [48, 52, 55],
    [55, 59, 62],
];
const ARP_STEPS = new Set([0, 3, 6, 8, 11, 14]);
const BASS_STEPS = new Set([0, 6, 10]);

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

export class PartyMusic {
    private ctx: AudioContext | null = null;
    private master: GainNode | null = null;
    private analyser: AnalyserNode | null = null;
    private bins: Uint8Array<ArrayBuffer> | null = null;
    private audio: HTMLAudioElement | null = null;
    private noise: AudioBuffer | null = null;
    private reverb: ConvolverNode | null = null;
    private timer: number | null = null;
    private nextTime = 0;
    private step = 0;

    constructor(private trackUrl: string) {}

    async start(): Promise<void> {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        this.ctx = ctx;

        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.75;
        this.bins = new Uint8Array(this.analyser.frequencyBinCount);

        this.master = ctx.createGain();
        this.master.gain.value = 0;
        this.master.connect(this.analyser);
        this.analyser.connect(ctx.destination);

        await ctx.resume();

        if (this.trackUrl && (await this.playTrack())) {
            this.fadeTo(0.9, 1.5);
            return;
        }
        this.startSynth();
        this.fadeTo(0.7, 2.5);
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

    private fadeTo(value: number, seconds: number) {
        if (!this.ctx || !this.master) return;
        const now = this.ctx.currentTime;
        this.master.gain.cancelScheduledValues(now);
        this.master.gain.setValueAtTime(this.master.gain.value, now);
        this.master.gain.linearRampToValueAtTime(value, now + seconds);
    }

    private async playTrack(): Promise<boolean> {
        if (!this.ctx || !this.master) return false;
        try {
            const audio = new Audio();
            audio.crossOrigin = 'anonymous';
            audio.loop = true;
            audio.src = this.trackUrl;
            this.ctx.createMediaElementSource(audio).connect(this.master);
            await audio.play();
            this.audio = audio;
            return true;
        } catch {
            return false;
        }
    }

    // ── Synthesised loop ────────────────────────────────────

    private startSynth() {
        const ctx = this.ctx;
        if (!ctx || !this.master) return;

        this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const data = this.noise.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

        // A short generated room, so the pads and plucks sit in a space.
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
        wet.connect(this.master);

        this.nextTime = ctx.currentTime + 0.1;
        this.step = 0;
        this.timer = window.setInterval(() => this.schedule(), 25);
    }

    private schedule() {
        const ctx = this.ctx;
        if (!ctx || ctx.state !== 'running') return;
        while (this.nextTime < ctx.currentTime + LOOKAHEAD) {
            this.playStep(this.step, this.nextTime);
            this.nextTime += STEP;
            this.step = (this.step + 1) % 64;
        }
    }

    private playStep(step: number, t: number) {
        const inBar = step % 16;
        const chord = CHORDS[Math.floor(step / 16)];

        if (inBar % 4 === 0) this.kick(t);
        if (inBar === 4 || inBar === 12) this.clap(t);
        if (inBar % 4 === 2) this.hat(t, 0.11, 0.06);
        else if (inBar % 2 === 1) this.hat(t, 0.035, 0.03);

        if (BASS_STEPS.has(inBar)) this.bass(hz(chord[0] - 24), t, inBar === 0 ? 0.42 : 0.3);
        if (inBar === 14) this.bass(hz(chord[0] - 12), t, 0.2);

        if (inBar === 0) chord.forEach((note) => this.pad(hz(note), t, STEP * 16));
        if (ARP_STEPS.has(inBar)) {
            const note = chord[[0, 1, 2, 1, 2, 0][[...ARP_STEPS].indexOf(inBar)]] + 12;
            this.pluck(hz(note), t);
        }
    }

    private env(t: number, peak: number, attack: number, decay: number) {
        const g = this.ctx!.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak, t + attack);
        g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
        return g;
    }

    private kick(t: number) {
        const ctx = this.ctx!;
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(130, t);
        osc.frequency.exponentialRampToValueAtTime(42, t + 0.14);
        const g = this.env(t, 0.9, 0.003, 0.32);
        osc.connect(g).connect(this.master!);
        osc.start(t);
        osc.stop(t + 0.4);
    }

    private noiseHit(t: number, type: BiquadFilterType, freq: number, peak: number, decay: number, toReverb = false) {
        const ctx = this.ctx!;
        const src = ctx.createBufferSource();
        src.buffer = this.noise;
        const filter = ctx.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = freq;
        const g = this.env(t, peak, 0.002, decay);
        src.connect(filter).connect(g).connect(this.master!);
        if (toReverb && this.reverb) g.connect(this.reverb);
        src.start(t);
        src.stop(t + decay + 0.05);
    }

    private clap(t: number) {
        this.noiseHit(t, 'bandpass', 1600, 0.28, 0.16, true);
    }

    private hat(t: number, peak: number, decay: number) {
        this.noiseHit(t, 'highpass', 7500, peak, decay);
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

    private pluck(freq: number, t: number) {
        const ctx = this.ctx!;
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const g = this.env(t, 0.07, 0.004, 0.24);
        osc.connect(g).connect(this.master!);
        if (this.reverb) g.connect(this.reverb);
        osc.start(t);
        osc.stop(t + 0.3);
    }
}
