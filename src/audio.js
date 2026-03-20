import { useRef, useState, useCallback } from 'react'

// Low-level tone generator
function tone(ctx, freq, type, dur, vol, delay = 0) {
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay)
    gain.gain.setValueAtTime(vol, ctx.currentTime + delay)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur)
    osc.start(ctx.currentTime + delay)
    osc.stop(ctx.currentTime + delay + dur + 0.01)
  } catch(e) {}
}

// Modern hit with 8-bit layer
function modernHit(ctx, freq, dur, vol, delay = 0) {
  tone(ctx, freq, 'sine', dur, vol, delay)
  tone(ctx, freq * 2, 'square', dur * 0.5, vol * 0.15, delay)
}

export const SFX = {
  // UI interactions - clean modern clicks
  hover: ctx => tone(ctx, 880, 'sine', 0.04, 0.06),
  click: ctx => { tone(ctx, 660, 'sine', 0.06, 0.12); tone(ctx, 880, 'sine', 0.04, 0.08, 0.05) },
  back: ctx => tone(ctx, 440, 'sine', 0.08, 0.1),
  navigate: ctx => { tone(ctx, 523, 'sine', 0.06, 0.12); tone(ctx, 659, 'sine', 0.06, 0.1, 0.06) },

  // Whistle - kick off
  whistle: ctx => {
    tone(ctx, 1318, 'sine', 0.22, 0.4)
    tone(ctx, 1760, 'sine', 0.12, 0.2, 0.04)
    tone(ctx, 1318, 'sine', 0.18, 0.35, 0.35)
    tone(ctx, 1318, 'sine', 0.18, 0.35, 0.65)
  },

  // Correct - modern fanfare + 8bit coin
  correct: ctx => {
    // 8-bit coin collect
    tone(ctx, 987, 'square', 0.06, 0.2)
    tone(ctx, 1318, 'square', 0.08, 0.2, 0.06)
    // Modern fanfare
    ;[0, 0.12, 0.24, 0.38].forEach((d, i) => {
      const notes = [523, 659, 784, 1047]
      modernHit(ctx, notes[i], 0.18, 0.25, d)
    })
  },

  // Wrong - modern thud + 8bit buzz
  wrong: ctx => {
    tone(ctx, 196, 'sawtooth', 0.22, 0.35)
    tone(ctx, 147, 'sawtooth', 0.18, 0.28, 0.08)
    tone(ctx, 110, 'square', 0.12, 0.2, 0.18)
  },

  // VAR - computing / dial-up nostalgia
  var: ctx => {
    for (let i = 0; i < 12; i++) {
      tone(ctx, 300 + i * 100, 'sawtooth', 0.06, 0.15, i * 0.07)
    }
    tone(ctx, 880, 'sine', 0.15, 0.25, 0.9)
    tone(ctx, 1108, 'sine', 0.15, 0.2, 1.05)
  },

  // Full time - three big whistles
  fullTime: ctx => {
    ;[0, 0.6, 1.2].forEach(d => {
      tone(ctx, 1318, 'sine', 0.4, 0.5, d)
      tone(ctx, 1760, 'sine', 0.3, 0.3, d + 0.06)
    })
  },

  // Traitor alarm
  alarm: ctx => {
    for (let i = 0; i < 18; i++) {
      tone(ctx, i % 2 === 0 ? 880 : 587, 'sawtooth', 0.11, 0.5, i * 0.12)
    }
    tone(ctx, 110, 'square', 0.4, 0.5, 0)
  },

  // Level up / streak
  streak: ctx => {
    ;[523, 659, 784, 1047, 1319].forEach((f, i) => {
      modernHit(ctx, f, 0.1, 0.22, i * 0.09)
    })
  },

  // Reveal card
  reveal: ctx => {
    tone(ctx, 440, 'sine', 0.12, 0.2)
    tone(ctx, 880, 'sine', 0.1, 0.18, 0.1)
    tone(ctx, 1108, 'sine', 0.08, 0.15, 0.18)
  },
}

// --- BGM: Modern electronic + 8-bit blend ---
function startBGM(ctx, masterGain) {
  // Melody - 8-bit square wave layer
  const melody = [
    { f: 659, d: 0.2 }, { f: 784, d: 0.2 }, { f: 880, d: 0.2 }, { f: 1047, d: 0.4 },
    { f: 880, d: 0.2 }, { f: 784, d: 0.2 }, { f: 659, d: 0.4 },
    { f: 587, d: 0.2 }, { f: 659, d: 0.2 }, { f: 784, d: 0.2 }, { f: 880, d: 0.4 },
    { f: 1047, d: 0.2 }, { f: 880, d: 0.2 }, { f: 784, d: 0.6 },
  ]
  // Bass - triangle
  const bass = [
    { f: 131, d: 0.8 }, { f: 98, d: 0.8 }, { f: 110, d: 0.8 }, { f: 131, d: 0.8 },
    { f: 131, d: 0.8 }, { f: 98, d: 0.8 }, { f: 110, d: 1.2 },
  ]

  let sched = ctx.currentTime
  const melodyDur = melody.reduce((s, n) => s + n.d, 0)

  const scheduleLoop = () => {
    if (ctx.state === 'closed') return
    let t = sched
    melody.forEach(n => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.connect(g); g.connect(masterGain)
      osc.type = 'square'
      osc.frequency.value = n.f
      g.gain.setValueAtTime(0.35, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + n.d - 0.01)
      osc.start(t); osc.stop(t + n.d)
      t += n.d
    })
    let bt = sched
    bass.forEach(n => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.connect(g); g.connect(masterGain)
      osc.type = 'triangle'
      osc.frequency.value = n.f
      g.gain.setValueAtTime(0.22, bt)
      g.gain.exponentialRampToValueAtTime(0.001, bt + n.d - 0.02)
      osc.start(bt); osc.stop(bt + n.d)
      bt += n.d
    })
    sched += melodyDur
  }

  scheduleLoop()
  return setInterval(() => {
    if (sched - ctx.currentTime < 2) scheduleLoop()
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
      gain.gain.value = 0.07
      gain.connect(ctx.destination)
      ctxRef.current = ctx
      gainRef.current = gain
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
      if (gainRef.current) gainRef.current.gain.value = next ? 0 : 0.07
      return next
    })
  }, [])

  return { init, play, toggleMute, muted, ready }
}
