/**
 * Music for the 31st Night page.
 *
 * Plays the track uploaded in the admin when there is one. Without a track, or
 * if the track cannot play, it falls back to a loop synthesised in the browser,
 * so the page never ships someone else's recording: lounge house for the
 * masquerade, electro swing for the Gatsby ball.
 *
 * Browsers only allow sound after a click, so `start()` must be called from one.
 * `level()` reads the low end of whatever is playing, for the beat-reactive glow.
 */

export type PartyMusicStyle = 'house' | 'swing';

const BPM: Record<PartyMusicStyle, number> = { house: 118, swing: 124 };
const LOOKAHEAD = 0.15;

// House: A minor, F, C, G, one bar each.
const CHORDS = [
    [57, 60, 64],
    [53, 57, 60],
    [48, 52, 55],
    [55, 59, 62],
];
const ARP_STEPS = [0, 3, 6, 8, 11, 14];
const ARP_NOTES = [0, 1, 2, 1, 2, 0];
const BASS_STEPS = new Set([0, 6, 10]);
const BELL_STEPS = [0, 6, 12];

// Swing: a minor-key walk over eight bars, Am6 Am6 Dm6 Dm6 E7 E7 Am6 E7.
// Each chord is the bass root, its third above the root, and a piano voicing.
const SWING_CHORDS: { root: number; third: number; keys: number[] }[] = [
    { root: 45, third: 3, keys: [57, 60, 64, 66] },
    { root: 45, third: 3, keys: [57, 60, 64, 66] },
    { root: 50, third: 3, keys: [53, 57, 59, 62] },
    { root: 50, third: 3, keys: [53, 57, 59, 62] },
    { root: 40, third: 4, keys: [52, 56, 59, 62] },
    { root: 40, third: 4, keys: [52, 56, 59, 62] },
    { root: 45, third: 3, keys: [57, 60, 64, 66] },
    { root: 40, third: 4, keys: [52, 56, 59, 62] },
];
/** How late each 16th of a beat lands when swung, as a share of the beat. */
const SWING_DELAY = [0, 1 / 12, 1 / 6, 1 / 12];

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
    /** One 16th note, in seconds. */
    private stepLength: number;

    constructor(private trackUrl: string, private style: PartyMusicStyle = 'house') {
        this.stepLength = 60 / BPM[style] / 4;
    }

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
        this.fadeTo(0.7, 2);
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
        wet.connect(this.master);

        this.nextTime = ctx.currentTime + 0.1;
        this.step = 0;
        this.timer = window.setInterval(() => this.schedule(), 25);
    }

    private schedule() {
        const ctx = this.ctx;
        if (!ctx || ctx.state !== 'running') return;
        const loop = this.style === 'swing' ? 16 * SWING_CHORDS.length : 64;
        while (this.nextTime < ctx.currentTime + LOOKAHEAD) {
            if (this.style === 'swing') this.playSwingStep(this.step, this.nextTime);
            else this.playStep(this.step, this.nextTime);
            this.nextTime += this.stepLength;
            this.step = (this.step + 1) % loop;
        }
    }

    private playStep(step: number, t: number) {
        const STEP = this.stepLength;
        const inBar = step % 16;
        const bar = Math.floor(step / 16);
        const chord = CHORDS[bar];

        if (inBar % 4 === 0) this.kick(t);
        if (inBar === 4 || inBar === 12) this.noiseHit(t, 'bandpass', 1600, 0.28, 0.16, true);
        if (inBar % 4 === 2) this.noiseHit(t, 'highpass', 7500, 0.11, 0.06);
        else if (inBar % 2 === 1) this.noiseHit(t, 'highpass', 7500, 0.035, 0.03);

        if (BASS_STEPS.has(inBar)) this.bass(hz(chord[0] - 24), t, inBar === 0 ? 0.42 : 0.3);
        if (inBar === 14) this.bass(hz(chord[0] - 12), t, 0.2);

        if (inBar === 0) chord.forEach((note) => this.pad(hz(note), t, STEP * 16));
        const arp = ARP_STEPS.indexOf(inBar);
        if (arp >= 0) this.tone(hz(chord[ARP_NOTES[arp]] + 12), t, 0.07, 0.24, 'triangle');
        // New Year bells every other bar.
        const bell = BELL_STEPS.indexOf(inBar);
        if (bar % 2 === 0 && bell >= 0) {
            this.tone(hz(chord[bell] + 24), t, 0.022, 1.3, 'sine');
            this.tone(hz(chord[bell] + 24) * 2.76, t, 0.008, 0.6, 'sine');
        }
    }

    /** Electro swing: four-on-the-floor under a walking bass, Charleston piano and a little brass. */
    private playSwingStep(step: number, start: number) {
        const inBar = step % 16;
        const bar = Math.floor(step / 16);
        const chord = SWING_CHORDS[bar];
        const next = SWING_CHORDS[(bar + 1) % SWING_CHORDS.length];
        const beat = this.stepLength * 4;
        const t = start + SWING_DELAY[inBar % 4] * beat;

        if (inBar % 4 === 0) this.kick(t, 0.7);
        if (inBar === 4 || inBar === 12) {
            // A clap: three quick hits smeared together, then the room.
            for (const d of [0, 0.011, 0.023]) this.noiseHit(t + d, 'bandpass', 1400, 0.16, 0.07, d === 0.023);
        }
        if (inBar % 4 === 2) this.noiseHit(t, 'highpass', 7000, 0.1, 0.09);
        else if (inBar % 4 === 0) this.noiseHit(t, 'highpass', 9000, 0.04, 0.025);

        // Walking bass: root, third, fifth, then a half step into the next chord.
        if (inBar % 4 === 0) {
            const walk = [chord.root, chord.root + chord.third, chord.root + 7, next.root - 1];
            this.pluck(hz(walk[inBar / 4]), t, inBar === 0 ? 0.5 : 0.4);
        }

        // Charleston: on the one, and on the and of two.
        if (inBar === 0 || inBar === 6) chord.keys.forEach((note) => this.piano(hz(note), t, inBar === 0 ? 0.05 : 0.04));

        // Brass answers every other bar, leading into the next chord.
        if (bar % 2 === 1 && (inBar === 10 || inBar === 14)) {
            next.keys.forEach((note) => this.brass(hz(note + 12), t, inBar === 14 ? 0.3 : 0.16));
        }

        // A little gramophone crackle.
        if (Math.random() < 0.3) this.noiseHit(t + Math.random() * this.stepLength, 'highpass', 3200, 0.025, 0.004);
    }

    private env(t: number, peak: number, attack: number, decay: number) {
        const g = this.ctx!.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak, t + attack);
        g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
        return g;
    }

    private kick(t: number, peak = 0.9) {
        const ctx = this.ctx!;
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(130, t);
        osc.frequency.exponentialRampToValueAtTime(42, t + 0.14);
        const g = this.env(t, peak, 0.003, 0.32);
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

    private tone(freq: number, t: number, peak: number, decay: number, type: OscillatorType) {
        const ctx = this.ctx!;
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        const g = this.env(t, peak, 0.004, decay);
        osc.connect(g).connect(this.master!);
        if (this.reverb) g.connect(this.reverb);
        osc.start(t);
        osc.stop(t + decay + 0.05);
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

    /** An upright-bass pluck: a soft triangle with a sine underneath. */
    private pluck(freq: number, t: number, peak: number) {
        const ctx = this.ctx!;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, t);
        filter.frequency.exponentialRampToValueAtTime(260, t + 0.3);
        const g = this.env(t, peak, 0.006, 0.42);
        filter.connect(g).connect(this.master!);
        for (const [type, mult] of [['triangle', 1], ['sine', 0.5]] as const) {
            const osc = ctx.createOscillator();
            osc.type = type;
            osc.frequency.value = freq * mult;
            osc.connect(filter);
            osc.start(t);
            osc.stop(t + 0.5);
        }
    }

    /** A bright, short piano note built from a few partials. */
    private piano(freq: number, t: number, peak: number) {
        const ctx = this.ctx!;
        const g = this.env(t, peak, 0.003, 0.55);
        g.connect(this.master!);
        if (this.reverb) g.connect(this.reverb);
        for (const [mult, gain] of [[1, 1], [2, 0.45], [3, 0.18], [4.02, 0.08]]) {
            const osc = ctx.createOscillator();
            osc.frequency.value = freq * mult;
            const level = ctx.createGain();
            level.gain.value = gain;
            osc.connect(level).connect(g);
            osc.start(t);
            osc.stop(t + 0.62);
        }
    }

    /** A brass stab: detuned saws through a filter that opens and closes. */
    private brass(freq: number, t: number, length: number) {
        const ctx = this.ctx!;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = 3;
        filter.frequency.setValueAtTime(500, t);
        filter.frequency.exponentialRampToValueAtTime(2600, t + 0.06);
        filter.frequency.exponentialRampToValueAtTime(700, t + length);
        const g = this.env(t, 0.03, 0.03, length);
        filter.connect(g);
        g.connect(this.master!);
        if (this.reverb) g.connect(this.reverb);
        for (const detune of [-9, 0, 9]) {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            osc.detune.value = detune;
            osc.connect(filter);
            osc.start(t);
            osc.stop(t + length + 0.1);
        }
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
}
