import { DEFAULT_VOLUMES, SOUND_BUS, SOUND_FILES } from './sounds'

// A small WebAudio manager (singleton-friendly) for mixing + low-latency SFX.
class AudioManagerImpl {
    constructor() {
        this._ctx = null
        this._buffers = new Map()
        this._loading = new Map()

        this._masterGain = null
        this._busGains = new Map() // name -> GainNode
        this._loopSources = new Map() // soundName -> { source, gain }

        this._muted = false
        this._volumes = { ...DEFAULT_VOLUMES }
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
        this._masterGain.gain.value = this._muted ? 0 : this._volumes.master
        this._masterGain.connect(this._ctx.destination)

            // Buses
            ;['music', 'ui', 'car'].forEach((bus) => {
                const g = this._ctx.createGain()
                g.gain.value = this._volumes[bus] ?? 1
                g.connect(this._masterGain)
                this._busGains.set(bus, g)
            })
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
            this._masterGain.gain.value = this._muted ? 0 : this._volumes.master
        }
    }

    setVolumes(next) {
        this._volumes = { ...this._volumes, ...(next || {}) }
        if (this._masterGain) this._masterGain.gain.value = this._muted ? 0 : this._volumes.master
        for (const [bus, gainNode] of this._busGains.entries()) {
            if (typeof this._volumes[bus] === 'number') gainNode.gain.value = this._volumes[bus]
        }
    }

    getVolumes() {
        return { ...this._volumes }
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

    _getBusGain(busName) {
        this.init()
        return this._busGains.get(busName) || this._masterGain
    }

    async play(name, opts = {}) {
        if (!this._ctx) this.init()
        if (!this._unlocked) return null

        const buf = await this.load(name)
        if (!buf) return null

        const bus = opts.bus || SOUND_BUS[name] || 'ui'
        const volume = typeof opts.volume === 'number' ? opts.volume : 1
        const playbackRate = typeof opts.playbackRate === 'number' ? opts.playbackRate : 1

        const src = this._ctx.createBufferSource()
        src.buffer = buf
        src.playbackRate.value = playbackRate

        const g = this._ctx.createGain()
        g.gain.value = volume

        src.connect(g)
        g.connect(this._getBusGain(bus))
        src.start(0)
        return src
    }

    async loop(name, opts = {}) {
        if (!this._ctx) this.init()
        if (!this._unlocked) return null

        if (this._loopSources.has(name)) return this._loopSources.get(name)

        const buf = await this.load(name)
        if (!buf) return null

        const bus = opts.bus || SOUND_BUS[name] || 'music'
        const volume = typeof opts.volume === 'number' ? opts.volume : 1

        const src = this._ctx.createBufferSource()
        src.buffer = buf
        src.loop = true

        const g = this._ctx.createGain()
        g.gain.value = volume

        src.connect(g)
        g.connect(this._getBusGain(bus))
        src.start(0)

        const entry = { source: src, gain: g }
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


