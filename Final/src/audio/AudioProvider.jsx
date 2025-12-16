import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AudioManager } from './AudioManager'
import { DEFAULT_VOLUMES } from './sounds'
import { AudioContext } from './AudioContext'

export function AudioProvider({ children }) {
  const [muted, setMutedState] = useState(false)
  const [volumes, setVolumesState] = useState(() => {
    try {
      const raw = localStorage.getItem('digiphy:audioVolumes')
      return raw ? { ...DEFAULT_VOLUMES, ...JSON.parse(raw) } : { ...DEFAULT_VOLUMES }
    } catch {
      return { ...DEFAULT_VOLUMES }
    }
  })

  const lastClickAtRef = useRef(0)

  useEffect(() => {
    AudioManager.init()
    AudioManager.preloadAll()
  }, [])

  useEffect(() => {
    AudioManager.setVolumes(volumes)
    try {
      localStorage.setItem('digiphy:audioVolumes', JSON.stringify(volumes))
    } catch {
      // ignore
    }
  }, [volumes])

  useEffect(() => {
    AudioManager.setMuted(muted)
  }, [muted])

  // Global click: must trigger even when pointer events are disabled on layers.
  useEffect(() => {
    const onPointerDownCapture = async () => {
      const now = performance.now()
      if (now - lastClickAtRef.current < 90) return
      lastClickAtRef.current = now

      if (!AudioManager.unlocked) {
        const ok = await AudioManager.unlock()
        if (ok) AudioManager.startBackgroundOnce()
      }

      // Click SFX should still fire even if unlocked already.
      void AudioManager.play('click', { bus: 'ui', volume: 1 })
    }

    window.addEventListener('pointerdown', onPointerDownCapture, { capture: true })
    return () => window.removeEventListener('pointerdown', onPointerDownCapture, { capture: true })
  }, [])

  const api = useMemo(() => {
    return {
      muted,
      volumes,
      setMuted: (v) => setMutedState(Boolean(v)),
      setVolumes: (next) => setVolumesState((prev) => ({ ...prev, ...(typeof next === 'function' ? next(prev) : next) })),
      unlock: async () => {
        const ok = await AudioManager.unlock()
        if (ok) AudioManager.startBackgroundOnce()
        return ok
      },
      play: async (name, opts) => await AudioManager.play(name, opts),
    }
  }, [muted, volumes])

  return <AudioContext.Provider value={api}>{children}</AudioContext.Provider>
}


