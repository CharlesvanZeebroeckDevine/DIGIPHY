import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AudioManager } from './AudioManager'
import { DEFAULT_VOLUME } from './sounds'
import { AudioContext } from './AudioContext'

export function AudioProvider({ children }) {
  const [muted, setMutedState] = useState(false)
  const [soundVolumes, setSoundVolumesState] = useState(() => {
    // Keep `sounds.js` as the single source of truth for the default mix.
    // (LocalStorage persistence was overriding this and made it seem like volume values “don’t work”.)
    return {
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
  })

  const lastClickAtRef = useRef(0)

  useEffect(() => {
    AudioManager.init()
    AudioManager.preloadAll()
  }, [])

  useEffect(() => {
    AudioManager.setSoundVolumes(soundVolumes)
  }, [soundVolumes])

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
      void AudioManager.play('click', { volume: 1 })
    }

    window.addEventListener('pointerdown', onPointerDownCapture, { capture: true })
    return () => window.removeEventListener('pointerdown', onPointerDownCapture, { capture: true })
  }, [])

  const api = useMemo(() => {
    return {
      muted,
      soundVolumes,
      setMuted: (v) => setMutedState(Boolean(v)),
      setSoundVolumes: (next) =>
        setSoundVolumesState((prev) => ({ ...prev, ...(typeof next === 'function' ? next(prev) : next) })),
      setSoundVolume: (name, value) =>
        setSoundVolumesState((prev) => ({ ...prev, [name]: value })),
      unlock: async () => {
        const ok = await AudioManager.unlock()
        if (ok) AudioManager.startBackgroundOnce()
        return ok
      },
      play: async (name, opts) => await AudioManager.play(name, opts),
    }
  }, [muted, soundVolumes])

  return <AudioContext.Provider value={api}>{children}</AudioContext.Provider>
}


