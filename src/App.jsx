// ============================================================
// ARSENAL FC QUIZ v5
// Modern, clean, sporty -- light/dark mode
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts'
import { useAudio } from './audio'
import {
  ALL_QUESTIONS, CATEGORIES, TRAITORS, ARSENAL_STATS,
  getRating, getSessionQuestions, checkAnswer, RATINGS,
} from './data'

// ── Theme hook ───────────────────────────────────────────────
function useTheme() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [dark])
  return { dark, toggle: () => setDark(d => !d) }
}

// ── CSS var helper ───────────────────────────────────────────
const v = name => `var(--${name})`

// ── Shared components ────────────────────────────────────────
const Btn = ({ children, onClick, variant = 'primary', full = false,
  disabled = false, size = 'md', onHover, style = {} }) => {
  const styles = {
    primary: {
      background: v('red'), color: '#fff',
      border: 'none', boxShadow: `0 4px 20px var(--red-dim)`,
    },
    secondary: {
      background: v('surface'), color: v('text'),
      border: `1px solid ${v('border-2')}`,
    },
    ghost: {
      background: 'transparent', color: v('text-2'),
      border: `1px solid ${v('border')}`,
    },
    gold: {
      background: v('gold'), color: '#fff',
      border: 'none', boxShadow: `0 4px 20px var(--gold-dim)`,
    },
    danger: {
      background: 'transparent', color: v('red'),
      border: `1px solid var(--red)`,
    },
  }
  const pad = size === 'sm' ? '8px 16px' : size === 'lg' ? '16px 32px' : '11px 22px'
  const fs = size === 'sm' ? 13 : size === 'lg' ? 16 : 14
  return (
    <motion.button
      onClick={onClick} disabled={disabled}
      onHoverStart={onHover}
      whileHover={!disabled ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.98, y: 0 } : {}}
      style={{
        padding: pad, fontSize: fs, fontWeight: 600,
        fontFamily: 'Inter, sans-serif', borderRadius: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        width: full ? '100%' : undefined,
        letterSpacing: 0.2,
        transition: 'box-shadow 0.2s',
        ...styles[variant],
        ...style,
      }}>
      {children}
    </motion.button>
  )
}

const Card = ({ children, style = {}, onClick, hover = false }) => (
  <motion.div
    onClick={onClick}
    whileHover={hover ? { y: -2, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' } : {}}
    style={{
      background: v('surface'), border: `1px solid ${v('border')}`,
      borderRadius: 16, boxShadow: v('shadow-sm'),
      ...style,
    }}>
    {children}
  </motion.div>
)

const Label = ({ children, color }) => (
  <span style={{
    display: 'inline-block', padding: '3px 10px', borderRadius: 20,
    fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    background: color ? `${color}18` : v('bg-3'),
    color: color || v('text-3'),
    border: `1px solid ${color ? `${color}33` : v('border')}`,
  }}>{children}</span>
)

const Divider = () => (
  <div style={{ height: 1, background: v('border'), margin: '8px 0' }}/>
)

// ── Progress ring ────────────────────────────────────────────
const Ring = ({ pct, size = 80, stroke = 6, color = 'var(--red)' }) => {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="var(--border)" strokeWidth={stroke}/>
      <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        style={{ strokeDasharray: circ }}/>
    </svg>
  )
}

// ── Animated number ──────────────────────────────────────────
function Counter({ to, duration = 1.2 }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let current = 0
    const step = to / (duration * 60)
    const t = setInterval(() => {
      current += step
      if (current >= to) { setVal(to); clearInterval(t) }
      else setVal(Math.floor(current))
    }, 1000/60)
    return () => clearInterval(t)
  }, [to])
  return <>{val}</>
}

// ── Background ───────────────────────────────────────────────
const Bg = () => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
    background: 'var(--bg)', transition: 'background 0.3s' }}/>
)

// ── Nav bar ──────────────────────────────────────────────────
function NavBar({ dark, onTheme, muted, onMute, onInit, onBack, showBack, play }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 480, zIndex: 100,
      background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      {showBack ? (
        <motion.button onClick={() => { play('back'); onBack() }}
          whileHover={{ x: -2 }} whileTap={{ scale: 0.95 }}
          style={{ background: 'none', border: 'none', color: 'var(--text-2)',
            fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0' }}>
          <span style={{ fontSize: 16 }}>←</span> Back
        </motion.button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: 'var(--red)', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚽</div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15,
            color: 'var(--red)', letterSpacing: 0.5 }}>Arsenal FC Quiz</span>
        </div>
      )}
      <div style={{ flex: 1 }}/>
      <motion.button onClick={() => { onInit(); onMute(); play('click') }}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
        style={{ background: 'var(--bg-3)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '6px 10px', color: 'var(--text-2)', fontSize: 14 }}>
        {muted ? '🔇' : '🔊'}
      </motion.button>
      <motion.button onClick={() => { onTheme(); play('click') }}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
        style={{ background: 'var(--bg-3)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '6px 10px', fontSize: 14 }}>
        {dark ? '☀️' : '🌙'}
      </motion.button>
    </div>
  )
}

// ── Page transition ──────────────────────────────────────────
const pageAnim = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
}

// ════════════════════════════════════════════════════════════
// WELCOME SCREEN
// ════════════════════════════════════════════════════════════
function WelcomeScreen({ go, play }) {
  return (
    <div style={{ minHeight: '100vh', padding: '76px 20px 100px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>

      {/* Hero */}
      <motion.div style={{ textAlign: 'center' }} {...pageAnim}>
        <motion.div style={{ fontSize: 72, display: 'block', marginBottom: 16 }}
          animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          ⚽
        </motion.div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 38,
          color: 'var(--text)', letterSpacing: -0.5, lineHeight: 1.1, marginBottom: 8 }}>
          Arsenal FC<br/>
          <span style={{ color: 'var(--red)' }}>Quiz Championship</span>
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-3)', fontWeight: 500 }}>
          7 categories · 100+ questions · Season 2024/25
        </p>
      </motion.div>

      {/* Stats pills */}
      <motion.div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        {[['15', 'Questions per session'], ['7', 'Categories'], ['10', 'Rating tiers'], ['1', 'VAR lifeline']].map(([n, l]) => (
          <div key={l} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '10px 16px', textAlign: 'center', minWidth: 80 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22,
              color: 'var(--red)' }}>{n}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </motion.div>

      {/* CTAs */}
      <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 12,
        width: '100%', maxWidth: 340 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
        <Btn size="lg" full onClick={() => { play('click'); go('categories') }} onHover={() => play('hover')}>
          ⚽ Kick Off
        </Btn>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Btn variant="secondary" full onClick={() => { play('click'); go('stats') }} onHover={() => play('hover')}>
            📊 Stats
          </Btn>
          <Btn variant="secondary" full onClick={() => { play('click'); go('howtoplay') }} onHover={() => play('hover')}>
            ? How To Play
          </Btn>
        </div>
      </motion.div>

      {/* Ticker */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'hidden',
        background: 'var(--red)', padding: '7px 0' }}>
        <div className="ticker" style={{ whiteSpace: 'nowrap', display: 'inline-block',
          fontSize: 12, fontWeight: 600, color: 'white', opacity: 0.9 }}>
          &nbsp;&nbsp;⚽ ARSENAL FC &nbsp;·&nbsp; THE INVINCIBLES &nbsp;·&nbsp; 49 UNBEATEN &nbsp;·&nbsp; THIERRY HENRY 228 GOALS &nbsp;·&nbsp; BERGKAMP &nbsp;·&nbsp; COYG! &nbsp;·&nbsp; #WEAREARSENAL &nbsp;·&nbsp; NORTH LONDON IS RED &nbsp;·&nbsp;
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// HOW TO PLAY
// ════════════════════════════════════════════════════════════
function HowToPlayScreen({ play }) {
  const steps = [
    { icon: '🎯', title: 'Pick a Category', body: 'Choose from 7 categories or play All Categories for a mixed session. Each game is 15 questions.' },
    { icon: '❓', title: 'Two Question Types', body: 'Multiple Choice -- tap the correct answer. Fill-In -- type the keyword (don\'t worry about spelling, just get the key word right!).' },
    { icon: '⏱️', title: '30-Second Timer', body: 'Each question has 30 seconds. Answer faster for bonus points on top of the base 100pts. Timer turns red when urgent.' },
    { icon: '📺', title: 'VAR Lifeline', body: 'One VAR check per game. Use it on a Multiple Choice question to eliminate two wrong answers. Choose wisely.' },
    { icon: '🔥', title: 'Build Streaks', body: 'Consecutive correct answers build a streak -- 3+ in a row triggers a bonus fanfare.' },
    { icon: '🏆', title: 'Earn Your Title', body: 'Score 95%+ and you reach ARSENE WENGER tier. There are 10 tiers from "Sold to Spurs" all the way to the top.' },
    { icon: '📸', title: 'Share Your Result', body: 'Download your result card as a JPG directly to your phone -- ready to share on Instagram Story or WhatsApp.' },
  ]
  return (
    <div style={{ padding: '72px 20px 30px' }}>
      <motion.div {...pageAnim}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 28,
          color: 'var(--text)', marginBottom: 4 }}>How To Play</h2>
        <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 24 }}>Everything you need to know</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {steps.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}>
              <Card style={{ padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{s.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{s.body}</div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
        {/* Rating tiers */}
        <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16,
          marginTop: 28, marginBottom: 12, color: 'var(--text)' }}>10 Rating Tiers</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {RATINGS.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 14px', borderRadius: 10,
              background: `${r.color}0f`, border: `1px solid ${r.color}22` }}>
              <span style={{ fontSize: 16 }}>{r.emoji}</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: r.color }}>{r.title}</span>
              </div>
              <Label color={r.color}>{r.min}%+</Label>
              <Label color={r.color}>{r.rank}</Label>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// CATEGORIES SCREEN
// ════════════════════════════════════════════════════════════
function CategoriesScreen({ go, setMode, play }) {
  const [name, setName] = useState('')
  const [jersey, setJersey] = useState('7')
  const [traitor, setTraitor] = useState(false)

  const checkName = v => {
    setName(v)
    if (TRAITORS.some(t => v.toLowerCase().includes(t))) {
      play('alarm'); setTraitor(true); setTimeout(() => setTraitor(false), 3000)
    }
  }

  return (
    <div style={{ padding: '72px 20px 30px' }}>
      <motion.div {...pageAnim}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 28,
          color: 'var(--text)', marginBottom: 4 }}>Select Mode</h2>
        <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 24 }}>
          Enter your details and pick a category
        </p>

        {/* Traitor alert */}
        <AnimatePresence>
          {traitor && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ background: 'var(--red-light)', border: '1px solid var(--red)',
                borderRadius: 10, padding: '10px 14px', marginBottom: 16, textAlign: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>
                ⚠️ Traitor detected -- RED CARD!
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Name + jersey */}
        <Card style={{ padding: '16px', marginBottom: 16 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
              letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Player Name</div>
            <input value={name} onChange={e => checkName(e.target.value)} maxLength={14}
              placeholder="Enter your name..."
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border-2)',
                color: 'var(--text)', padding: '11px 14px', borderRadius: 10,
                fontSize: 14, fontWeight: 500, transition: 'border-color 0.2s',
                boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = 'var(--red)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-2)'}/>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
              Psst... try typing a traitor's name 👀
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
              letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Jersey Number</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['7','8','9','10','11','14'].map(n => (
                <motion.button key={n} onClick={() => { setJersey(n); play('click') }}
                  whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                  style={{ width: 42, height: 42, borderRadius: 10,
                    background: jersey === n ? 'var(--red)' : 'var(--bg-3)',
                    border: `2px solid ${jersey === n ? 'var(--red)' : 'var(--border)'}`,
                    color: jersey === n ? 'white' : 'var(--text-2)',
                    fontWeight: 700, fontSize: 15,
                    boxShadow: jersey === n ? 'var(--shadow-red)' : 'none',
                    transition: 'all 0.15s' }}>
                  {n}
                </motion.button>
              ))}
            </div>
          </div>
        </Card>

        {/* Category list */}
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
          letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
          Choose Category
        </div>

        {/* All Categories */}
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={() => { if (!name.trim()) return; play('whistle'); setMode({ name, jersey, cat: 'all' }); go('game') }}
          style={{ background: name.trim() ? 'var(--red)' : 'var(--bg-3)',
            borderRadius: 14, padding: '16px 18px', marginBottom: 10, cursor: name.trim() ? 'pointer' : 'not-allowed',
            border: '2px solid transparent', opacity: name.trim() ? 1 : 0.5,
            boxShadow: name.trim() ? 'var(--shadow-red)' : 'none', transition: 'all 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>⚽</span>
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16,
                color: name.trim() ? 'white' : 'var(--text)' }}>All Categories</div>
              <div style={{ fontSize: 12, color: name.trim() ? 'rgba(255,255,255,0.75)' : 'var(--text-3)', marginTop: 2 }}>
                15 random questions from all 7 categories
              </div>
            </div>
          </div>
        </motion.div>

        {/* Individual categories */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {CATEGORIES.map(cat => (
            <motion.div key={cat.id}
              whileHover={name.trim() ? { scale: 1.02, y: -2 } : {}}
              whileTap={name.trim() ? { scale: 0.98 } : {}}
              onClick={() => { if (!name.trim()) return; play('select'); setMode({ name, jersey, cat: cat.id }); go('game') }}
              style={{ background: 'var(--bg-2)', borderRadius: 14, padding: '14px 14px',
                cursor: name.trim() ? 'pointer' : 'not-allowed',
                border: `1px solid var(--border)`,
                opacity: name.trim() ? 1 : 0.5, transition: 'all 0.2s' }}>
              <span style={{ fontSize: 20, display: 'block', marginBottom: 6 }}>{cat.emoji}</span>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{cat.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3, lineHeight: 1.4 }}>{cat.desc}</div>
              <div style={{ marginTop: 8 }}>
                <Label color={cat.color}>
                  {ALL_QUESTIONS.filter(q => q.category === cat.id).length} Qs
                </Label>
              </div>
            </motion.div>
          ))}
        </div>

        {!name.trim() && (
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--red)',
            marginTop: 14, fontWeight: 600 }}>
            ↑ Enter your name to pick a category
          </p>
        )}
      </motion.div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// GAME SCREEN
// ════════════════════════════════════════════════════════════
function GameScreen({ mode, onEnd, play }) {
  const qsRef = useRef(getSessionQuestions(mode.cat))
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [log, setLog] = useState([])
  const [selected, setSelected] = useState(null)
  const [fill, setFill] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [timeLeft, setTimeLeft] = useState(30)
  const [varUsed, setVarUsed] = useState(false)
  const [varActive, setVarActive] = useState(false)
  const [elim, setElim] = useState([])
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const timerRef = useRef(null)
  const fillRef = useRef(null)

  const q = qsRef.current[idx]
  const total = qsRef.current.length
  const OPTS = ['A', 'B', 'C', 'D']

  useEffect(() => {
    if (feedback) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); resolve(-1, ''); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [idx, feedback])

  useEffect(() => {
    if (q?.type === 'fill' && !feedback) setTimeout(() => fillRef.current?.focus(), 250)
  }, [idx, q])

  const resolve = useCallback((optIdx, fillVal) => {
    if (feedback) return
    clearInterval(timerRef.current)
    const correct = q.type === 'mcq'
      ? optIdx === q.correct
      : checkAnswer(fillVal, q.answer)

    const bonus = Math.floor(timeLeft * 3)
    const pts = correct ? 100 + bonus : 0

    if (correct) {
      play('correct')
      setScore(s => s + pts)
      const ns = streak + 1; setStreak(ns)
      setMaxStreak(ms => Math.max(ms, ns))
      if (ns >= 3) play('streak')
    } else {
      play('wrong'); setStreak(0)
    }

    setSelected(optIdx)
    setFeedback(correct ? 'correct' : 'wrong')
    setLog(l => [...l, { correct, pts, time: 30 - timeLeft, cat: q.category }])

    setTimeout(() => {
      setFeedback(null); setSelected(null)
      setFill(''); setElim([]); setVarActive(false)
      if (idx < total - 1) {
        setIdx(i => i + 1); setTimeLeft(30)
      } else {
        play('fullTime')
        const finalScore = correct ? score + pts : score
        const finalLog = [...log, { correct, pts, time: 30 - timeLeft, cat: q.category }]
        setTimeout(() => onEnd({
          score: finalScore, log: finalLog,
          maxStreak: Math.max(maxStreak, correct ? streak + 1 : streak),
          mode, questions: qsRef.current,
        }), 600)
      }
    }, 2600)
  }, [feedback, q, timeLeft, streak, maxStreak, idx, total, score, log, play, onEnd, mode])

  const doVAR = () => {
    if (varUsed || feedback || q.type !== 'mcq') return
    play('var'); setVarUsed(true); setVarActive(true)
    const w = [0,1,2,3].filter(i => i !== q.correct).sort(() => Math.random()-0.5).slice(0,2)
    setTimeout(() => setElim(w), 800)
  }

  const pct = timeLeft / 30
  const tColor = pct > 0.6 ? '#16A34A' : pct > 0.3 ? '#D97706' : '#E8010A'
  const cat = CATEGORIES.find(c => c.id === q.category)

  return (
    <div style={{ minHeight: '100vh', padding: '58px 16px 24px',
      display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* HUD */}
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <Card style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>
              {mode.name.toUpperCase()}
            </div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20,
              color: 'var(--text)' }}>
              <Counter to={score}/>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)' }}>
              {idx + 1} / {total}
            </div>
            <AnimatePresence>
              {streak >= 2 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#F59E0B' }}>
                    🔥 ×{streak}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Label color={cat?.color}>{cat?.emoji} {cat?.label}</Label>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
              {q.type === 'fill' ? '✍️ Fill in' : '◉ Choice'}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Timer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <motion.span animate={pct <= 0.3 ? { scale: [1,1.1,1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ fontSize: 13, fontWeight: 700, color: tColor, minWidth: 28 }}>
          {timeLeft}s
        </motion.span>
        <div style={{ flex: 1, height: 6, background: 'var(--bg-3)', borderRadius: 3, overflow: 'hidden' }}>
          <motion.div animate={{ width: `${pct * 100}%` }} transition={{ duration: 0.3 }}
            style={{ height: '100%', borderRadius: 3, background: tColor, transition: 'background 0.5s' }}/>
        </div>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 3 }}>
        {qsRef.current.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2,
            background: i < idx ? (log[i]?.correct ? '#16A34A' : '#E8010A')
              : i === idx ? '#F59E0B' : 'var(--bg-3)' }}/>
        ))}
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          exit={{ x: -24, opacity: 0 }} transition={{ duration: 0.2 }}>
          <Card style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: cat?.color,
              letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
              {cat?.emoji} {cat?.label}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', lineHeight: 1.6 }}>
              {q.question}
            </div>
            {q.type === 'fill' && !feedback && (
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
                Hint: {q.hint}
              </div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* MCQ Options */}
      {q.type === 'mcq' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.options.map((opt, i) => {
            const isElim = elim.includes(i)
            const isCorrect = feedback && i === q.correct
            const isWrong = feedback && selected === i && i !== q.correct
            return (
              <motion.button key={`${idx}-${i}`}
                onClick={() => { if (!feedback && !isElim) { play('click'); resolve(i, '') } }}
                onMouseEnter={() => { if (!feedback && !isElim) play('hover') }}
                disabled={!!feedback || isElim}
                initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: isElim ? 0.2 : 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={!feedback && !isElim ? { x: 4 } : {}}
                style={{
                  background: isCorrect ? 'var(--green-light)' : isWrong ? 'var(--red-dim)' : 'var(--bg-2)',
                  border: `1px solid ${isCorrect ? 'var(--green)' : isWrong ? 'var(--red)' : 'var(--border)'}`,
                  borderRadius: 12, padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  textAlign: 'left', cursor: feedback || isElim ? 'default' : 'pointer',
                  opacity: isElim ? 0.18 : 1,
                  textDecoration: isElim ? 'line-through' : 'none',
                  transition: 'all 0.15s',
                }}>
                <span style={{
                  width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                  background: isCorrect ? 'var(--green)' : isWrong ? 'var(--red)' : 'var(--bg-3)',
                  border: `1px solid ${isCorrect ? 'var(--green)' : isWrong ? 'var(--red)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800,
                  color: isCorrect || isWrong ? 'white' : 'var(--text-3)',
                }}>{OPTS[i]}</span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{opt}</span>
                {isCorrect && <span style={{ color: 'var(--green)', fontWeight: 800 }}>✓</span>}
                {isWrong && <span style={{ color: 'var(--red)', fontWeight: 800 }}>✗</span>}
              </motion.button>
            )
          })}
        </div>
      )}

      {/* Fill-in */}
      {q.type === 'fill' && (
        <div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input ref={fillRef} value={fill}
              onChange={e => setFill(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && fill.trim() && !feedback) { play('click'); resolve(0, fill) } }}
              disabled={!!feedback} placeholder="Type your answer..."
              style={{ flex: 1, background: 'var(--bg-2)',
                border: `1px solid ${feedback ? (feedback === 'correct' ? 'var(--green)' : 'var(--red)') : 'var(--border-2)'}`,
                color: 'var(--text)', padding: '12px 14px', borderRadius: 10, fontSize: 14,
                fontWeight: 500, transition: 'border-color 0.2s' }}
              onFocus={e => { if (!feedback) e.target.style.borderColor = 'var(--red)' }}
              onBlur={e => { if (!feedback) e.target.style.borderColor = 'var(--border-2)' }}/>
            <Btn disabled={!fill.trim() || !!feedback}
              onClick={() => { play('click'); resolve(0, fill) }}>
              Go
            </Btn>
          </div>
          <AnimatePresence>
            {feedback && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: 8, padding: '10px 14px', borderRadius: 10,
                  background: feedback === 'correct' ? 'var(--green-light)' : 'var(--red-dim)',
                  border: `1px solid ${feedback === 'correct' ? 'var(--green)' : 'var(--red)'}` }}>
                <span style={{ fontSize: 13, fontWeight: 700,
                  color: feedback === 'correct' ? 'var(--green)' : 'var(--red)' }}>
                  {feedback === 'correct' ? '✓ Correct!' : `✗ Answer: ${q.answer?.toUpperCase()}`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Trivia */}
      <AnimatePresence>
        {feedback && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#3B82F6',
              letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Did you know?</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>{q.trivia}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VAR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto' }}>
        <motion.button onClick={!varUsed && !feedback && q.type === 'mcq' ? doVAR : undefined}
          whileHover={!varUsed && q.type === 'mcq' ? { scale: 1.04 } : {}}
          style={{ background: varUsed ? 'var(--bg-3)' : 'var(--gold-light)',
            border: `1px solid ${varUsed ? 'var(--border)' : 'var(--gold)'}`,
            borderRadius: 10, padding: '8px 14px', cursor: varUsed || q.type !== 'mcq' ? 'not-allowed' : 'pointer',
            opacity: varUsed ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.15s' }}>
          <motion.span animate={varActive ? { rotate: [0,360] } : {}} transition={{ duration: 1, repeat: Infinity }}>
            📺
          </motion.span>
          <span style={{ fontSize: 13, fontWeight: 700, color: varUsed ? 'var(--text-3)' : 'var(--gold)' }}>
            {varUsed ? 'VAR used' : 'Use VAR'}
          </span>
        </motion.button>
        {q.type === 'fill' && (
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>VAR: multiple choice only</span>
        )}
      </div>

      {/* GOAL / NO GOAL flash */}
      <AnimatePresence>
        {feedback && (
          <motion.div style={{ position: 'fixed', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', zIndex: 300 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 24 }}
              style={{ padding: '20px 44px', borderRadius: 16, textAlign: 'center',
                background: feedback === 'correct' ? 'var(--green-light)' : 'var(--red-light)',
                border: `2px solid ${feedback === 'correct' ? 'var(--green)' : 'var(--red)'}`,
                boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 28,
                color: feedback === 'correct' ? 'var(--green)' : 'var(--red)' }}>
                {feedback === 'correct' ? '⚽ GOAL!' : '❌ No Goal'}
              </div>
              {feedback === 'correct' && (
                <div style={{ fontSize: 14, fontWeight: 700,
                  color: 'var(--green)', marginTop: 4 }}>
                  +{100 + Math.floor(timeLeft * 3)} pts
                  {streak >= 2 ? ` · 🔥 ×${streak + 1} streak` : ''}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// RESULTS SCREEN
// ════════════════════════════════════════════════════════════
function ResultsScreen({ result, go, play, dark }) {
  const { score, log, maxStreak, mode, questions } = result
  const correct = log.filter(l => l.correct).length
  const total = questions.length
  const maxScore = total * 130
  const rating = getRating(score, maxScore)
  const pct = Math.round((score / maxScore) * 100)
  const [showShare, setShowShare] = useState(false)

  const radarData = [
    { stat: 'Score',   val: pct },
    { stat: 'Speed',   val: Math.max(10, 100 - Math.round((log.reduce((s,l) => s+(l.time||15),0)/Math.max(1,log.length))*3)) },
    { stat: 'Streak',  val: Math.round((maxStreak/total)*100) },
    { stat: 'Correct', val: Math.round((correct/total)*100) },
    { stat: 'Bonus',   val: Math.min(100, Math.round((score - correct*100) / Math.max(1, correct*30) * 100)) },
    { stat: 'Rank',    val: rating.stars * 20 },
  ]

  // Category breakdown
  const catBreakdown = CATEGORIES.map(cat => {
    const qs = questions.filter(q => q.category === cat.id)
    if (!qs.length) return null
    const hits = qs.filter(q => { const qi = questions.indexOf(q); return log[qi]?.correct }).length
    return { ...cat, hits, total: qs.length, pct: Math.round((hits/qs.length)*100) }
  }).filter(Boolean)

  return (
    <div style={{ padding: '70px 16px 30px' }}>
      <motion.div {...pageAnim} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Full time heading */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
            letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Full Time</div>
          <motion.h1 animate={{ opacity: [1, 0.8, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
            style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 34,
              color: rating.color, lineHeight: 1.1, marginBottom: 6 }}>
            {rating.emoji} {rating.title}
          </motion.h1>
          <div style={{ fontSize: 14, fontWeight: 700, color: rating.color,
            letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
            {rating.subtitle}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-2)', maxWidth: 320, margin: '0 auto', lineHeight: 1.6 }}>
            {rating.desc}
          </div>
        </div>

        {/* Score card */}
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ width: 52, height: 52, background: 'var(--red)', borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-red)', flexShrink: 0 }}>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 20,
                color: 'white' }}>{mode.jersey}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                {mode.name.toUpperCase()}
              </div>
              <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                {Array.from({length:5}).map((_,i) => (
                  <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    style={{ fontSize: 14, color: i < rating.stars ? '#F59E0B' : 'var(--border-2)' }}>★</motion.span>
                ))}
              </div>
            </div>
            <div style={{ background: `${rating.color}18`, border: `2px solid ${rating.color}33`,
              borderRadius: 10, width: 44, height: 44, display: 'flex',
              alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 18,
                color: rating.color }}>{rating.rank}</span>
            </div>
          </div>

          {/* Big score */}
          <div style={{ textAlign: 'center', padding: '16px 0',
            borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
              letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Total Score</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 52,
              color: 'var(--text)', lineHeight: 1 }}>
              <Counter to={score}/>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>{pct}% accuracy</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { l: 'Correct', v: `${correct}/${total}`, c: 'var(--green)' },
              { l: 'Streak', v: `×${maxStreak}`, c: 'var(--red)' },
              { l: 'Rank', v: rating.rank, c: rating.color },
            ].map(s => (
              <div key={s.l} style={{ background: 'var(--bg-3)', borderRadius: 10,
                padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
                  textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.l}</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20,
                  color: s.c, marginTop: 3 }}>{s.v}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Progress ring + radar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12 }}>
          <Card style={{ padding: '16px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ position: 'relative', display: 'flex',
              alignItems: 'center', justifyContent: 'center' }}>
              <Ring pct={pct} size={88} stroke={7} color={rating.color}/>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900,
                  fontSize: 18, color: 'var(--text)' }}>{pct}%</div>
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
              textTransform: 'uppercase', letterSpacing: 0.5 }}>Accuracy</div>
          </Card>
          <Card style={{ padding: '12px 8px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
              textTransform: 'uppercase', letterSpacing: 0.5, paddingLeft: 6, marginBottom: 4 }}>IQ Radar</div>
            <div style={{ height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 8, right: 20, bottom: 8, left: 20 }}>
                  <PolarGrid stroke="var(--border)" strokeDasharray="3 3"/>
                  <PolarAngleAxis dataKey="stat" tick={{ fill: 'var(--text-3)', fontSize: 9, fontWeight: 600 }}/>
                  <Radar dataKey="val" stroke="var(--red)" fill="var(--red)" fillOpacity={0.2} strokeWidth={2}
                    dot={{ fill: 'var(--red)', r: 2 }}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Category breakdown */}
        {catBreakdown.length > 0 && (
          <Card style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)',
              marginBottom: 12 }}>Category Breakdown</div>
            {catBreakdown.map((cat, i) => (
              <motion.div key={cat.id} style={{ marginBottom: 10 }}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.07 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
                    {cat.emoji} {cat.label}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: cat.color }}>
                    {cat.hits}/{cat.total}
                  </span>
                </div>
                <div style={{ height: 7, background: 'var(--bg-3)', borderRadius: 4, overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }}
                    animate={{ width: `${cat.pct}%` }}
                    transition={{ duration: 0.7, delay: 0.35 + i * 0.07, ease: 'easeOut' }}
                    style={{ height: '100%', borderRadius: 4, background: cat.color, opacity: 0.8 }}/>
                </div>
              </motion.div>
            ))}
          </Card>
        )}

        {/* Q-by-Q */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8 }}>
            Match Report
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {questions.map((_, i) => (
              <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.5 + i * 0.03 }}
                style={{ width: 28, height: 28, borderRadius: 8,
                  background: log[i]?.correct ? '#DCFCE7' : '#FEE2E2',
                  border: `1px solid ${log[i]?.correct ? '#16A34A44' : '#E8010A44'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700,
                  color: log[i]?.correct ? '#16A34A' : '#E8010A' }}>{i+1}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn onClick={() => { play('click'); go('categories') }} onHover={() => play('hover')}>
            🔄 Rematch
          </Btn>
          <Btn variant="gold" onClick={() => { play('reveal'); setShowShare(true) }}
            onHover={() => play('hover')}>
            📥 Download Card
          </Btn>
          <Btn variant="ghost" onClick={() => { play('click'); go('welcome') }}
            onHover={() => play('hover')}>
            🏠 Menu
          </Btn>
        </div>
      </motion.div>

      {/* Share modal */}
      <AnimatePresence>
        {showShare && (
          <ShareModal result={result} rating={rating} pct={pct} correct={correct}
            dark={dark} onClose={() => setShowShare(false)} play={play}/>
        )}
      </AnimatePresence>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// SHARE MODAL -- Clean Instagram Story JPG download
// ════════════════════════════════════════════════════════════
function ShareModal({ result, rating, pct, correct, dark, onClose, play }) {
  const { score, log, maxStreak, mode, questions } = result
  const total = questions.length
  const cardRef = useRef(null)
  const [downloading, setDownloading] = useState(false)

  const downloadCard = async () => {
    setDownloading(true)
    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, useCORS: true, allowTaint: true,
        backgroundColor: null, logging: false,
      })
      const link = document.createElement('a')
      link.download = `arsenal-quiz-${mode.name.toLowerCase()}-${rating.rank}.jpg`
      link.href = canvas.toDataURL('image/jpeg', 0.92)
      link.click()
    } catch(e) {
      console.error('Download failed:', e)
      alert('Download failed. Please try screenshotting manually.')
    }
    setDownloading(false)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.75)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: 20, backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
        marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
        Instagram Story Card
      </div>

      {/* The card -- 9:16 ratio */}
      <div ref={cardRef} style={{
        width: 270, height: 480, borderRadius: 20, overflow: 'hidden',
        position: 'relative', flexShrink: 0,
        background: 'linear-gradient(160deg, #0a0005 0%, #1c0008 35%, #080012 65%, #000a15 100%)',
      }}>
        {/* Glow effects */}
        <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
          width: '140%', height: '60%', borderRadius: '50%',
          background: `radial-gradient(ellipse, ${rating.color}30 0%, transparent 70%)`,
          pointerEvents: 'none' }}/>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, height: '100%', padding: '22px 20px',
          display: 'flex', flexDirection: 'column' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
            <div style={{ width: 22, height: 22, background: '#E8010A', borderRadius: 5,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>⚽</div>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 10,
              color: '#E8010A', letterSpacing: 2, textTransform: 'uppercase' }}>Arsenal FC Quiz</span>
          </div>
          <div style={{ height: 1, background: 'rgba(232,1,10,0.3)', marginBottom: 18 }}/>

          {/* Rating */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 44 }}>{rating.emoji}</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 26,
              color: rating.color, lineHeight: 1.1 }}>{rating.title}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: rating.color,
              letterSpacing: 2, textTransform: 'uppercase' }}>{rating.subtitle}</div>
            <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
              {Array.from({length:5}).map((_,i) => (
                <span key={i} style={{ fontSize: 14,
                  color: i < rating.stars ? '#F59E0B' : 'rgba(255,255,255,0.1)' }}>★</span>
              ))}
            </div>
          </div>

          {/* Player card */}
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '10px 12px', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 30, height: 30, background: '#E8010A', borderRadius: 7,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 13, color: 'white' }}>
                {mode.jersey}
              </div>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 13, color: 'white' }}>
                {mode.name.toUpperCase()}
              </span>
              <div style={{ marginLeft: 'auto', background: `${rating.color}25`,
                border: `1px solid ${rating.color}44`, borderRadius: 6,
                width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 13, color: rating.color }}>
                {rating.rank}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, textAlign: 'center' }}>
              {[
                { l: 'SCORE', v: score, c: '#F59E0B' },
                { l: 'CORRECT', v: `${correct}/${total}`, c: '#22C55E' },
                { l: 'STREAK', v: `×${maxStreak}`, c: '#E8010A' },
              ].map(s => (
                <div key={s.l}>
                  <div style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
                    letterSpacing: 0.5 }}>{s.l}</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900,
                    fontSize: 13, color: s.c, marginTop: 1 }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Q dots */}
          <div style={{ display: 'flex', gap: 2.5, justifyContent: 'center', marginBottom: 10 }}>
            {questions.map((_, i) => (
              <div key={i} style={{ width: 9, height: 9, borderRadius: 2.5,
                background: log[i]?.correct ? '#22C55E' : '#E8010A',
                opacity: log[i]?.correct ? 1 : 0.7 }}/>
            ))}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 8 }}>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>arsenal-quiz.vercel.app</div>
            <div style={{ fontSize: 8, color: '#E8010A', marginTop: 2, fontWeight: 700 }}>#COYG #WeAreArsenal</div>
          </div>
        </div>
      </div>

      {/* Download buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <motion.button onClick={downloadCard} disabled={downloading}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          style={{ padding: '11px 22px', borderRadius: 10, fontFamily: 'Inter,sans-serif',
            fontWeight: 700, fontSize: 14, background: '#E8010A', color: 'white',
            border: 'none', cursor: downloading ? 'wait' : 'pointer', opacity: downloading ? 0.7 : 1 }}>
          {downloading ? '⏳ Preparing...' : '📥 Download JPG'}
        </motion.button>
        <motion.button onClick={onClose} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          style={{ padding: '11px 22px', borderRadius: 10, fontFamily: 'Inter,sans-serif',
            fontWeight: 700, fontSize: 14, background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }}>
          Close
        </motion.button>
      </div>

      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8, textAlign: 'center' }}>
        Perfect for Instagram Stories (9:16 ratio)
      </div>
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════
// STATS / INFOGRAPHICS SCREEN
// ════════════════════════════════════════════════════════════
function StatsScreen({ play }) {
  const [tab, setTab] = useState('trophies')
  const S = ARSENAL_STATS
  const tabs = [
    { id: 'trophies', label: 'Trophies', emoji: '🏆' },
    { id: 'scorers',  label: 'Scorers',  emoji: '⚽' },
    { id: 'squad',    label: 'Squad',    emoji: '👕' },
    { id: 'records',  label: 'Records',  emoji: '📋' },
    { id: 'managers', label: 'Managers', emoji: '🧠' },
  ]

  return (
    <div style={{ padding: '72px 16px 30px' }}>
      <motion.div {...pageAnim}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 28,
          color: 'var(--text)', marginBottom: 2 }}>Arsenal Stats</h2>
        <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 16 }}>
          Founded {S.founded} · {S.trophies.total} Trophies · {S.stadium.name}
        </p>
        <Divider/>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '12px 0',
          scrollbarWidth: 'none', WebkitScrollbarWidth: 'none' }}>
          {tabs.map(t => (
            <motion.button key={t.id} onClick={() => { setTab(t.id); play('click') }}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{ padding: '8px 14px', borderRadius: 20, whiteSpace: 'nowrap',
                background: tab === t.id ? 'var(--red)' : 'var(--bg-2)',
                border: `1px solid ${tab === t.id ? 'var(--red)' : 'var(--border)'}`,
                color: tab === t.id ? 'white' : 'var(--text-2)',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5 }}>
              <span>{t.emoji}</span> {t.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'trophies' && (
            <motion.div key="trophies" {...pageAnim}>
              <Card style={{ padding: '20px', textAlign: 'center', marginBottom: 12,
                background: 'linear-gradient(135deg, var(--red-dim), var(--gold-dim))' }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 60,
                  color: 'var(--text)' }}>{S.trophies.total}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)',
                  textTransform: 'uppercase', letterSpacing: 1 }}>Total Trophies</div>
              </Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {S.trophies.list.map((t, i) => (
                  <motion.div key={t.name} initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                    <Card style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 20 }}>{t.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{t.years}</div>
                        <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 2,
                          marginTop: 5, overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, t.count * 5)}%` }}
                            transition={{ duration: 0.7, delay: i * 0.06, ease: 'easeOut' }}
                            style={{ height: '100%', background: 'var(--red)', borderRadius: 2 }}/>
                        </div>
                      </div>
                      <div style={{ background: 'var(--red-dim)', borderRadius: 8, width: 34, height: 34,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, color: 'var(--red)' }}>
                        {t.count}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === 'scorers' && (
            <motion.div key="scorers" {...pageAnim} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)',
                textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>All-Time Top Scorers</div>
              {S.topScorers.map((p, i) => (
                <motion.div key={p.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}>
                  <Card style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 30, height: 30, background: i < 3 ? 'var(--red)' : 'var(--bg-3)',
                      borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 14,
                      color: i < 3 ? 'white' : 'var(--text-2)', flexShrink: 0 }}>{i+1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{p.years}</div>
                      <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 2,
                        marginTop: 5, overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }}
                          animate={{ width: `${(p.goals / 228) * 100}%` }}
                          transition={{ duration: 0.7, delay: i * 0.07, ease: 'easeOut' }}
                          style={{ height: '100%', borderRadius: 2,
                            background: i === 0 ? '#F59E0B' : 'var(--red)' }}/>
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 22,
                      color: i === 0 ? '#F59E0B' : 'var(--red)' }}>{p.goals}</div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {tab === 'squad' && (
            <motion.div key="squad" {...pageAnim}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)',
                textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Current Squad 2024/25</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {S.currentSquad.map((p, i) => (
                  <motion.div key={p.name} initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                    <Card style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, background: 'var(--red)', borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 13, color: 'white' }}>
                        {p.no}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text)', lineHeight: 1.3 }}>
                          {p.name}
                        </div>
                        <div style={{ display: 'flex', gap: 5, marginTop: 3, alignItems: 'center' }}>
                          <Label color="var(--red)">{p.pos}</Label>
                          <span style={{ fontSize: 14 }}>{p.flag}</span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === 'records' && (
            <motion.div key="records" {...pageAnim} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {S.records.map((r, i) => (
                <motion.div key={r.label} initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                  <Card style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
                      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{r.label}</div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800,
                      fontSize: 22, color: 'var(--text)' }}>{r.value}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{r.detail}</div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {tab === 'managers' && (
            <motion.div key="managers" {...pageAnim} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {S.managers.map((m, i) => (
                <motion.div key={m.name} initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                  <Card style={{ padding: '14px 16px',
                    border: m.name === 'Arsene Wenger' ? '1px solid var(--red-dim)' :
                      m.name === 'Mikel Arteta' ? '1px solid rgba(59,130,246,0.2)' : '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16,
                        color: m.name === 'Arsene Wenger' ? 'var(--red)' :
                          m.name === 'Mikel Arteta' ? '#3B82F6' : 'var(--text)' }}>
                        {m.name}
                      </div>
                      <Label>{m.years}</Label>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{m.honors}</div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// APP ROOT
// ════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState('welcome')
  const [mode, setMode] = useState(null)
  const [result, setResult] = useState(null)
  const { dark, toggle: toggleTheme } = useTheme()
  const { init, play, toggleMute, muted, ready } = useAudio()

  const doInit = () => { if (!ready) init() }
  const safePlay = s => { doInit(); play(s) }

  const go = s => setScreen(s)
  const back = () => {
    const map = { categories: 'welcome', howtoplay: 'welcome', stats: 'welcome',
      game: 'categories', results: 'categories' }
    setScreen(map[screen] || 'welcome')
  }
  const showBack = ['categories','howtoplay','stats','game','results'].includes(screen)

  return (
    <div onClick={doInit} style={{ minHeight: '100vh', maxWidth: 480, margin: '0 auto',
      position: 'relative', overflow: 'hidden', background: 'var(--bg)' }}>
      <Bg/>
      <NavBar dark={dark} onTheme={toggleTheme} muted={muted} onMute={toggleMute}
        onInit={doInit} play={safePlay} showBack={showBack} onBack={back}/>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {screen === 'welcome' && (
            <motion.div key="welcome" {...pageAnim}>
              <WelcomeScreen go={go} play={safePlay}/>
            </motion.div>
          )}
          {screen === 'howtoplay' && (
            <motion.div key="htp" {...pageAnim}>
              <HowToPlayScreen play={safePlay}/>
            </motion.div>
          )}
          {screen === 'categories' && (
            <motion.div key="cats" {...pageAnim}>
              <CategoriesScreen go={go} setMode={setMode} play={safePlay}/>
            </motion.div>
          )}
          {screen === 'game' && mode && (
            <motion.div key={`game-${mode.cat}-${Date.now()}`} {...pageAnim}>
              <GameScreen mode={mode} onEnd={r => { setResult(r); go('results') }} play={safePlay}/>
            </motion.div>
          )}
          {screen === 'results' && result && (
            <motion.div key="results" {...pageAnim}>
              <ResultsScreen result={result} go={go} play={safePlay} dark={dark}/>
            </motion.div>
          )}
          {screen === 'stats' && (
            <motion.div key="stats" {...pageAnim}>
              <StatsScreen play={safePlay}/>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
