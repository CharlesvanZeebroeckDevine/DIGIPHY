import { createContext, useContext } from 'react'

export const AudioContext = createContext(null)

export function useAudio() {
    const ctx = useContext(AudioContext)
    if (!ctx) throw new Error('useAudio must be used within <AudioProvider>')
    return ctx
}


