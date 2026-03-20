import { useRef, useState, useCallback } from 'react'

function tone(ctx, freq, type, dur, vol, delay = 0) {
  if (!ctx || ctx.state === 'closed') return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay)
    gain.gain.setValueAtTime(vol, ctx.currentTime + delay)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur)
    osc.start(ctx.currentTime + delay)
    osc.stop(ctx.currentTime + delay + dur + 0.02)
  } catch(e) {}
}

// Modern clean SFX - no pixel sounds
export const SFX = {
  hover: ctx => tone(ctx, 660, 'sine', 0.04, 0.05),
  click: ctx => {
    tone(ctx, 523, 'sine', 0.06, 0.1)
    tone(ctx, 784, 'sine', 0.04, 0.08, 0.05)
  },
  back: ctx => tone(ctx, 440, 'sine', 0.08, 0.08),
  select: ctx => {
    tone(ctx, 440, 'sine', 0.05, 0.1)
    tone(ctx, 523, 'sine', 0.05, 0.1, 0.06)
  },
  whistle: ctx => {
    // Referee-style modern whistle
    tone(ctx, 1200, 'sine', 0.15, 0.35)
    tone(ctx, 1500, 'sine', 0.08, 0.12, 0.04)
    tone(ctx, 1200, 'sine', 0.12, 0.25, 0.28)
    tone(ctx, 1200, 'sine', 0.10, 0.22, 0.52)
  },
  correct: ctx => {
    // Clean fanfare
    const notes = [523, 659, 784, 1047]
    notes.forEach((f, i) => tone(ctx, f, 'sine', 0.15, 0.22, i * 0.1))
    // Subtle crowd roar simulation
    for (let i = 0; i < 4; i++) {
      tone(ctx, 180 + i * 40, 'triangle', 0.2, 0.06, 0.4 + i * 0.04)
    }
  },
  wrong: ctx => {
    tone(ctx, 220, 'triangle', 0.2, 0.3)
    tone(ctx, 165, 'triangle', 0.15, 0.25, 0.12)
  },
  var: ctx => {
    // Modern tech sound
    for (let i = 0; i < 8; i++) {
      tone(ctx, 400 + i * 80, 'sine', 0.05, 0.12, i * 0.06)
    }
    tone(ctx, 880, 'sine', 0.12, 0.2, 0.55)
  },
  fullTime: ctx => {
    // Three clean long whistles
    ;[0, 0.5, 1.0].forEach(d => {
      tone(ctx, 1200, 'sine', 0.35, 0.4, d)
      tone(ctx, 1500, 'sine', 0.2, 0.25, d + 0.05)
    })
  },
  alarm: ctx => {
    // Traitor alert - dramatic but modern
    for (let i = 0; i < 12; i++) {
      tone(ctx, i % 2 === 0 ? 784 : 523, 'sine', 0.1, 0.4, i * 0.11)
    }
  },
  streak: ctx => {
    ;[523, 659, 784, 880, 1047].forEach((f, i) => tone(ctx, f, 'sine', 0.1, 0.18, i * 0.08))
  },
  reveal: ctx => {
    tone(ctx, 523, 'sine', 0.1, 0.18)
    tone(ctx, 659, 'sine', 0.08, 0.15, 0.08)
    tone(ctx, 784, 'sine', 0.07, 0.14, 0.16)
    tone(ctx, 1047, 'sine', 0.12, 0.25, 0.24)
  },
  levelUp: ctx => {
    const seq = [523, 587, 659, 698, 784, 880, 987, 1047]
    seq.forEach((f, i) => tone(ctx, f, 'sine', 0.09, 0.2, i * 0.07))
  },
}

// North London Forever inspired 8-bit chiptune
// Original melody reimagined as a chiptune in a new key/arrangement
function startBGM(ctx, masterGain) {
  // Inspired by marching band anthems - upbeat, victorious feel
  // Melody in G major
  const melody = [
    // Phrase 1 - triumphant opening
    { f: 784, d: 0.2 },{ f: 784, d: 0.1 },{ f: 880, d: 0.2 },{ f: 784, d: 0.2 },
    { f: 1047, d: 0.4 },{ f: 988, d: 0.2 },{ f: 784, d: 0.2 },
    // Phrase 2
    { f: 880, d: 0.2 },{ f: 880, d: 0.1 },{ f: 988, d: 0.2 },{ f: 880, d: 0.2 },
    { f: 784, d: 0.4 },{ f: 659, d: 0.2 },{ f: 784, d: 0.2 },
    // Phrase 3 - build
    { f: 659, d: 0.2 },{ f: 698, d: 0.2 },{ f: 784, d: 0.2 },{ f: 880, d: 0.2 },
    { f: 988, d: 0.2 },{ f: 1047, d: 0.2 },{ f: 1175, d: 0.4 },
    // Phrase 4 - resolve
    { f: 1047, d: 0.2 },{ f: 988, d: 0.2 },{ f: 880, d: 0.2 },{ f: 784, d: 0.2 },
    { f: 698, d: 0.2 },{ f: 659, d: 0.2 },{ f: 784, d: 0.6 },
  ]
  const bass = [
    { f: 196, d: 0.6 },{ f: 147, d: 0.6 },{ f: 165, d: 0.6 },{ f: 196, d: 0.6 },
    { f: 196, d: 0.6 },{ f: 147, d: 0.6 },{ f: 165, d: 0.6 },{ f: 196, d: 0.6 },
  ]
  const totalDur = melody.reduce((s, n) => s + n.d, 0)
  let sched = ctx.currentTime

  const loop = () => {
    if (ctx.state === 'closed') return
    let t = sched

    // Melody - bright square wave
    melody.forEach(n => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(masterGain)
      o.type = 'square'
      o.frequency.value = n.f
      g.gain.setValueAtTime(0.28, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + n.d - 0.01)
      o.start(t); o.stop(t + n.d)
      t += n.d
    })

    // Harmony layer (triangle, quieter, slightly behind)
    let ht = sched
    melody.forEach(n => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(masterGain)
      o.type = 'triangle'
      o.frequency.value = n.f * 0.75 // 5th below
      g.gain.setValueAtTime(0.1, ht)
      g.gain.exponentialRampToValueAtTime(0.001, ht + n.d - 0.01)
      o.start(ht); o.stop(ht + n.d)
      ht += n.d
    })

    // Bass
    let bt = sched
    bass.forEach(n => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(masterGain)
      o.type = 'triangle'
      o.frequency.value = n.f
      g.gain.setValueAtTime(0.18, bt)
      g.gain.exponentialRampToValueAtTime(0.001, bt + n.d - 0.02)
      o.start(bt); o.stop(bt + n.d)
      bt += n.d
    })

    sched += totalDur
  }

  loop()
  return setInterval(() => {
    if (sched - ctx.currentTime < 2) loop()
  }, 500)
}

export function useAudio() {
  const ctxRef = useRef(null)
  const gainRef = useRef(null)
  const bgmRef = useRef(null)
  const [muted, setMuted] = useState(false)
  const [ready, setReady] = useState(false)

  const init = useCallback(() => {
    if (ready) return
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const gain = ctx.createGain()
      gain.gain.value = 0.06
      gain.connect(ctx.destination)
      ctxRef.current = ctx; gainRef.current = gain
      setReady(true)
      bgmRef.current = startBGM(ctx, gain)
    } catch(e) {}
  }, [ready])

  const play = useCallback((name) => {
    if (muted || !ctxRef.current || !SFX[name]) return
    try {
      if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
      SFX[name](ctxRef.current)
    } catch(e) {}
  }, [muted])

  const toggleMute = useCallback(() => {
    setMuted(m => {
      const next = !m
      if (gainRef.current) gainRef.current.gain.value = next ? 0 : 0.06
      return next
    })
  }, [])

  return { init, play, toggleMute, muted, ready }
}
