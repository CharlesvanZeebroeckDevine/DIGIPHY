import { DEFAULT_VOLUME, SOUND_FILES } from './sounds'

// A small WebAudio manager (singleton-friendly) for mixing + low-latency SFX.
class AudioManagerImpl {
    constructor() {
        this._ctx = null
        this._buffers = new Map()
        this._loading = new Map()

        this._masterGain = null
        this._loopSources = new Map() // soundName -> { source, gain }

        this._muted = false
        this._soundVolumes = {
            background: DEFAULT_VOLUME.background,
            carswitch: DEFAULT_VOLUME.carswitch,
            greenled: DEFAULT_VOLUME.greenled,
            click: DEFAULT_VOLUME.click,
            hover: DEFAULT_VOLUME.hover,
            hoverout: DEFAULT_VOLUME.hoverout,
            posterhover: DEFAULT_VOLUME.posterhover,
            swoosh1: DEFAULT_VOLUME.swoosh1,
            swoosh2: DEFAULT_VOLUME.swoosh2,
            swoosh3: DEFAULT_VOLUME.swoosh3,
            swoosh4: DEFAULT_VOLUME.swoosh4,
        }
        this._unlocked = false
        this._backgroundStarted = false
    }

    get unlocked() {
        return this._unlocked
    }

    init() {
        if (this._ctx) return
        const Ctx = window.AudioContext || window.webkitAudioContext
        this._ctx = new Ctx()

        this._masterGain = this._ctx.createGain()
        this._masterGain.gain.value = this._muted ? 0 : 1
        this._masterGain.connect(this._ctx.destination)
    }

    async unlock() {
        this.init()
        if (!this._ctx) return false

        if (this._ctx.state !== 'running') {
            try {
                await this._ctx.resume()
            } catch {
                return false
            }
        }

        // Some browsers require a sound to be started to fully “unlock”.
        // We do a near-silent click (0-length buffer) once.
        if (!this._unlocked) {
            const b = this._ctx.createBuffer(1, 1, this._ctx.sampleRate)
            const src = this._ctx.createBufferSource()
            src.buffer = b
            src.connect(this._masterGain)
            src.start(0)
            src.stop(0)
        }

        this._unlocked = true
        return true
    }

    setMuted(muted) {
        this._muted = Boolean(muted)
        if (this._masterGain) {
            this._masterGain.gain.value = this._muted ? 0 : 1
        }
    }

    setSoundVolumes(next) {
        this._soundVolumes = { ...this._soundVolumes, ...(next || {}) }

        // Update looped sounds (e.g. background) immediately
        for (const [name, entry] of this._loopSources.entries()) {
            const perSound = typeof this._soundVolumes[name] === 'number' ? this._soundVolumes[name] : 1
            const base = typeof entry.baseVolume === 'number' ? entry.baseVolume : 1
            if (entry?.gain?.gain) entry.gain.gain.value = base * perSound
        }
    }

    getSoundVolumes() {
        return { ...this._soundVolumes }
    }

    async _fetchDecode(url) {
        this.init()
        const res = await fetch(url)
        const arr = await res.arrayBuffer()
        return await this._ctx.decodeAudioData(arr)
    }

    async load(name) {
        if (this._buffers.has(name)) return this._buffers.get(name)
        if (this._loading.has(name)) return await this._loading.get(name)

        const url = SOUND_FILES[name]
        if (!url) return null

        const p = this._fetchDecode(url)
            .then((buf) => {
                this._buffers.set(name, buf)
                this._loading.delete(name)
                return buf
            })
            .catch(() => {
                this._loading.delete(name)
                return null
            })

        this._loading.set(name, p)
        return await p
    }

    preloadAll() {
        // Preload without requiring unlock.
        // (decodeAudioData works even while suspended in most browsers; if it fails, we’ll lazy-load later)
        Object.keys(SOUND_FILES).forEach((k) => void this.load(k))
    }

    async play(name, opts = {}) {
        if (!this._ctx) this.init()
        if (!this._unlocked) return null

        const buf = await this.load(name)
        if (!buf) return null

        const volume = typeof opts.volume === 'number' ? opts.volume : 1
        const perSound = typeof this._soundVolumes[name] === 'number' ? this._soundVolumes[name] : 1
        const playbackRate = typeof opts.playbackRate === 'number' ? opts.playbackRate : 1

        const src = this._ctx.createBufferSource()
        src.buffer = buf
        src.playbackRate.value = playbackRate

        const g = this._ctx.createGain()
        g.gain.value = volume * perSound

        src.connect(g)
        g.connect(this._masterGain)
        src.start(0)
        return src
    }

    async loop(name, opts = {}) {
        if (!this._ctx) this.init()
        if (!this._unlocked) return null

        if (this._loopSources.has(name)) return this._loopSources.get(name)

        const buf = await this.load(name)
        if (!buf) return null

        const volume = typeof opts.volume === 'number' ? opts.volume : 1
        const perSound = typeof this._soundVolumes[name] === 'number' ? this._soundVolumes[name] : 1

        const src = this._ctx.createBufferSource()
        src.buffer = buf
        src.loop = true

        const g = this._ctx.createGain()
        g.gain.value = volume * perSound

        src.connect(g)
        g.connect(this._masterGain)
        src.start(0)

        const entry = { source: src, gain: g, baseVolume: volume }
        this._loopSources.set(name, entry)
        return entry
    }

    startBackgroundOnce() {
        if (this._backgroundStarted) return
        this._backgroundStarted = true
        void this.loop('background', { bus: 'music', volume: 1 })
    }
}

export const AudioManager = new AudioManagerImpl()


