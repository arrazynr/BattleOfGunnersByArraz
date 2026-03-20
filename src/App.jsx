import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, Tooltip } from 'recharts'
import { useAudio } from './audio'
import { ALL_QUESTIONS, MODES, TRAITORS, ARSENAL_STATS, getRating, getQuestions, checkAnswer } from './data'

// ─── Design tokens ───────────────────────────────────────────
const C = {
  red: '#EF0107', redDark: '#AA0005', redGlow: '#EF010733',
  gold: '#C8A000', goldLight: '#FFD700', goldGlow: '#C8A00033',
  navy: '#080810', navy2: '#0d0d1a', navy3: '#121220',
  blue: '#3B82F6', cyan: '#06B6D4',
  white: '#ffffff', dim: '#44445a',
}

const wenger = { primary: C.red, secondary: C.gold, bg: '#0f0508', accent: '#FF4444', label: 'WENGER ERA' }
const arteta = { primary: C.blue, secondary: C.cyan, bg: '#05080f', accent: '#60A5FA', label: 'ARTETA ERA' }
const getTheme = modeId => modeId === 'arteta' ? arteta : wenger

// ─── Micro components ────────────────────────────────────────
const T = ({ children, size = 16, weight = 700, color = 'white', style = {}, className = '' }) => (
  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: size, fontWeight: weight, color, letterSpacing: 0.5, ...style }} className={className}>
    {children}
  </span>
)
const Pixel = ({ children, size = 10, color = 'white', style = {} }) => (
  <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: size, color, lineHeight: 1.6, ...style }}>{children}</span>
)
const Divider = ({ color = C.red, style = {} }) => (
  <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, ...style }}/>
)
const Badge = ({ children, color = C.red }) => (
  <span style={{ background: `${color}22`, border: `1px solid ${color}44`, color, borderRadius: 2,
    padding: '2px 8px', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
    {children}
  </span>
)

// ─── Primary button ──────────────────────────────────────────
function Btn({ children, onClick, color = C.red, ghost = false, disabled = false, full = false, size = 'md', onHover }) {
  const pad = size === 'sm' ? '8px 16px' : size === 'lg' ? '16px 32px' : '12px 24px'
  const fs = size === 'sm' ? 13 : size === 'lg' ? 18 : 15
  return (
    <motion.button onClick={onClick} disabled={disabled} onHoverStart={onHover}
      whileHover={!disabled ? { scale: 1.03, y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.97, y: 1 } : {}}
      style={{
        padding: pad, fontSize: fs, fontFamily: "'Barlow Condensed',sans-serif",
        fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase',
        background: ghost ? 'transparent' : `linear-gradient(135deg, ${color}, ${color}cc)`,
        color: ghost ? color : 'white',
        border: `2px solid ${color}${ghost ? '66' : 'aa'}`,
        borderRadius: 3, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1, width: full ? '100%' : undefined,
        boxShadow: ghost ? 'none' : `0 4px 20px ${color}44`,
        transition: 'box-shadow 0.2s',
      }}>
      {children}
    </motion.button>
  )
}

// ─── Card container ──────────────────────────────────────────
function Card({ children, color = '#ffffff11', border = '#ffffff0a', style = {}, className = '' }) {
  return (
    <div style={{ background: color, border: `1px solid ${border}`, borderRadius: 6,
      backdropFilter: 'blur(12px)', ...style }} className={className}>
      {children}
    </div>
  )
}

// ─── Speaker icon ────────────────────────────────────────────
const Speaker = ({ muted, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    {muted ? <><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></> : <><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>}
  </svg>
)

// ─── Animated counter ────────────────────────────────────────
function Counter({ to, duration = 1.2 }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let start = 0
    const step = to / (duration * 60)
    const t = setInterval(() => {
      start += step
      if (start >= to) { setV(to); clearInterval(t) }
      else setV(Math.floor(start))
    }, 1000 / 60)
    return () => clearInterval(t)
  }, [to])
  return <>{v}</>
}

// ─── Screen transitions ──────────────────────────────────────
const slide = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
}

// ─── BACKGROUND ──────────────────────────────────────────────
function Background({ theme }) {
  const primary = theme?.primary || C.red
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', background: theme?.bg || '#080810' }}>
      <div style={{ position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 80% 50% at 50% -10%, ${primary}18 0%, transparent 70%)` }}/>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 220,
        background: `linear-gradient(0deg, ${primary}08, transparent)` }}/>
      {[...Array(20)].map((_, i) => (
        <motion.div key={i}
          animate={{ opacity: [0.6, 0.15, 0.6] }}
          transition={{ duration: 2 + (i % 5) * 0.5, repeat: Infinity, delay: i * 0.12 }}
          style={{ position: 'absolute',
            left: `${(i * 37 + 5) % 100}%`, top: `${(i * 23 + 3) % 55}%`,
            width: i % 7 === 0 ? 3 : 2, height: i % 7 === 0 ? 3 : 2,
            background: 'white', borderRadius: '50%', pointerEvents: 'none' }}/>
      ))}
      <div style={{ position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)',
        backgroundSize: '32px 32px', pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,0.5) 100%)',
        pointerEvents: 'none' }}/>
    </div>
  )
}

// ─── NAVBAR ──────────────────────────────────────────────────
function NavBar({ muted, onMute, onInit, theme, showBack, onBack, play }) {
  const p = theme?.primary || C.red
  return (
    <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 480, zIndex: 200,
      background: 'rgba(5,5,15,0.96)', borderBottom: `2px solid ${p}44`,
      backdropFilter: 'blur(16px)', padding: '10px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      {showBack ? (
        <motion.button onClick={() => { play('back'); onBack() }}
          whileHover={{ x: -2 }} whileTap={{ scale: 0.95 }}
          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer',
            fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 4 }}>
          ← BACK
        </motion.button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, background: p, borderRadius: 1 }}/>
          <T size={13} weight={900} color={p} style={{ letterSpacing: 2 }}>ARSENAL FC</T>
        </div>
      )}
      <motion.button onClick={() => { onInit(); onMute(); play('click') }}
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        style={{ background: 'none', border: `1px solid #ffffff18`, borderRadius: 4,
          padding: '5px 8px', color: '#888', cursor: 'pointer' }}>
        <Speaker muted={muted} size={16}/>
      </motion.button>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// SCREEN: WELCOME
// ════════════════════════════════════════════════════════════
function WelcomeScreen({ nav }) {
  const { play, setScreen } = nav
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '60px 20px 80px', gap: 24 }}>

      {/* Hero */}
      <motion.div style={{ textAlign: 'center' }} {...slide}>
        <motion.div style={{ display: 'inline-block', marginBottom: 16 }}
          animate={{ filter: [`drop-shadow(0 0 10px ${C.red}88)`, `drop-shadow(0 0 30px ${C.red}cc)`, `drop-shadow(0 0 10px ${C.red}88)`] }}
          transition={{ duration: 3, repeat: Infinity }}>
          <div style={{ fontSize: 64 }}>⚽</div>
        </motion.div>
        <div>
          <T size={42} weight={900} color={C.red} style={{ display: 'block', letterSpacing: 3,
            textShadow: `0 0 40px ${C.red}66` }}>ARSENAL FC</T>
          <T size={18} weight={700} color={C.gold} style={{ display: 'block', letterSpacing: 4, marginTop: 2 }}>
            QUIZ CHAMPIONSHIP
          </T>
          <Pixel size={7} color="#444" style={{ display: 'block', marginTop: 6 }}>SEASON 2024/25</Pixel>
        </div>
      </motion.div>

      <Divider color={C.red} style={{ width: '100%', maxWidth: 360 }}/>

      {/* Mode quick preview */}
      <motion.div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', maxWidth: 380 }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        {[
          { icon: '🔴', label: 'WENGER ERA', sub: '1996-2018', color: C.red },
          { icon: '🔵', label: 'ARTETA ERA', sub: '2019-Now', color: C.blue },
          { icon: '⚽', label: 'ALL CATEGORIES', sub: '15 Questions', color: C.gold },
          { icon: '📊', label: 'ARSENAL STATS', sub: 'Infographics', color: '#888' },
        ].map((m, i) => (
          <motion.div key={i} whileHover={{ scale: 1.03, borderColor: m.color }}
            style={{ background: `${m.color}0d`, border: `1px solid ${m.color}22`,
              borderRadius: 6, padding: '12px 14px', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => { play('click'); m.label === 'ARSENAL STATS' ? setScreen('infographics') : setScreen('setup') }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</div>
            <T size={12} weight={800} color={m.color} style={{ display: 'block' }}>{m.label}</T>
            <T size={11} weight={500} color="#555" style={{ display: 'block', marginTop: 2 }}>{m.sub}</T>
          </motion.div>
        ))}
      </motion.div>

      {/* CTAs */}
      <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
        <Btn size="lg" full color={C.red} onClick={() => { play('click'); setScreen('setup') }}
          onHover={() => play('hover')}>
          ▶ KICK OFF
        </Btn>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn full ghost color={C.gold} onClick={() => { play('click'); setScreen('howtoplay') }}
            onHover={() => play('hover')}>
            ? HOW TO PLAY
          </Btn>
          <Btn full ghost color="#888" onClick={() => { play('click'); setScreen('infographics') }}
            onHover={() => play('hover')}>
            📊 STATS
          </Btn>
        </div>
      </motion.div>

      {/* Ticker */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
        background: C.red, overflow: 'hidden', padding: '5px 0' }}>
        <div className="ticker" style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>
          <T size={11} weight={700} color="white">
            &nbsp;&nbsp;⚽ ARSENAL FC &nbsp;·&nbsp; THE INVINCIBLES &nbsp;·&nbsp; 49 UNBEATEN &nbsp;·&nbsp; THIERRY HENRY 228 GOALS &nbsp;·&nbsp; BERGKAMP &nbsp;·&nbsp; EMIRATES STADIUM &nbsp;·&nbsp; COYG! &nbsp;·&nbsp; #WEAREARSENAL &nbsp;·&nbsp;
          </T>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// SCREEN: HOW TO PLAY
// ════════════════════════════════════════════════════════════
function HowToPlayScreen({ nav }) {
  const { play, setScreen } = nav
  const steps = [
    { icon: '🎮', title: 'PICK YOUR MODE', desc: 'Choose All Categories, a specific topic, or enter an Era — Wenger (1996-2018) or Arteta (2019-now) — each with unique themes.' },
    { icon: '❓', title: 'ANSWER QUESTIONS', desc: '15 questions per session. Mix of Multiple Choice (tap the answer) and Fill-In (type the keyword). Case insensitive — just get the key word right!' },
    { icon: '⏱', title: '30-SECOND TIMER', desc: 'Each question has 30 seconds. Answer faster = more bonus points on top of the base 100pts. Timer turns red when urgent!' },
    { icon: '📺', title: 'VAR LIFELINE', desc: 'One VAR check per game. Use it on a multiple choice question to eliminate two wrong answers. Only works on MCQ questions.' },
    { icon: '🔥', title: 'BUILD STREAKS', desc: 'Answer consecutive questions correctly to build a streak. Streak bonus multiplies your points. On fire = bigger score!' },
    { icon: '🏆', title: 'EARN YOUR TITLE', desc: 'Get rated from NON-LEAGUE TRIALIST up to THE INVINCIBLE. Score 90%+ and you\'ll reach the legendary tier. COYG!' },
  ]
  return (
    <div style={{ minHeight: '100vh', padding: '70px 20px 30px' }}>
      <motion.div {...slide}>
        <T size={32} weight={900} color={C.red} style={{ display: 'block', marginBottom: 4 }}>HOW TO PLAY</T>
        <T size={13} weight={500} color="#555" style={{ display: 'block', marginBottom: 20 }}>EVERYTHING YOU NEED TO KNOW</T>
        <Divider color={C.red} style={{ marginBottom: 24 }}/>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {steps.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}>
              <Card style={{ padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}
                color="#0d0d1a" border="#ffffff0a">
                <div style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{s.icon}</div>
                <div>
                  <T size={14} weight={800} color={C.red} style={{ display: 'block', marginBottom: 4 }}>{s.title}</T>
                  <T size={13} weight={400} color="#888" style={{ display: 'block', lineHeight: 1.6 }}>{s.desc}</T>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
        <div style={{ marginTop: 20 }}>
          <T size={13} weight={700} color={C.gold} style={{ display: 'block', marginBottom: 12 }}>RATING TIERS:</T>
          {[
            ['🏆', 'THE INVINCIBLE', '90%+', C.goldLight],
            ['👑', 'KING HENRY', '75%+', C.red],
            ['🏟️', 'SPIRIT OF HIGHBURY', '55%+', '#FF8C00'],
            ['🌱', 'HALE END HOPEFUL', '35%+', '#888'],
            ['😬', 'NON-LEAGUE TRIALIST', '0%+', '#555'],
          ].map(([icon, label, pct, color], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '6px 10px',
              background: `${color}0d`, border: `1px solid ${color}22`, borderRadius: 4 }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <T size={13} weight={800} color={color} style={{ flex: 1 }}>{label}</T>
              <Badge color={color}>{pct}</Badge>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24 }}>
          <Btn full color={C.red} onClick={() => { play('click'); setScreen('setup') }}>
            START PLAYING
          </Btn>
        </div>
      </motion.div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// SCREEN: SETUP
// ════════════════════════════════════════════════════════════
function SetupScreen({ nav }) {
  const { play, setScreen, setPlayer } = nav
  const [name, setName] = useState('')
  const [jersey, setJersey] = useState('7')
  const [mode, setMode] = useState('all')
  const [traitor, setTraitor] = useState(false)

  const checkName = v => {
    setName(v)
    if (TRAITORS.some(t => v.toLowerCase().includes(t))) {
      play('alarm'); setTraitor(true); setTimeout(() => setTraitor(false), 3000)
    }
  }

  const selectedMode = MODES.find(m => m.id === mode) || MODES[0]
  const theme = getTheme(mode)

  return (
    <div style={{ minHeight: '100vh', padding: '70px 20px 30px' }}>
      <motion.div {...slide}>
        <T size={32} weight={900} color={C.red} style={{ display: 'block', marginBottom: 4 }}>SQUAD SETUP</T>
        <T size={13} weight={500} color="#555" style={{ display: 'block', marginBottom: 20 }}>REGISTER BEFORE KICK OFF</T>
        <Divider color={C.red} style={{ marginBottom: 20 }}/>

        {/* Traitor alert */}
        <AnimatePresence>
          {traitor && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ background: '#1a0000', border: `1px solid ${C.red}`, borderRadius: 4,
                padding: '10px 14px', marginBottom: 14, textAlign: 'center' }}>
              <T size={13} weight={800} color={C.red}>⚠ TRAITOR DETECTED — RED CARD!</T>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Name */}
        <div style={{ marginBottom: 20 }}>
          <T size={11} weight={700} color={C.gold} style={{ display: 'block', marginBottom: 8, letterSpacing: 2 }}>PLAYER NAME</T>
          <input value={name} onChange={e => checkName(e.target.value)} maxLength={14}
            placeholder="Enter your name..."
            style={{ width: '100%', background: '#0a0a14', border: '1px solid #ffffff14',
              color: 'white', padding: '12px 14px', borderRadius: 4, fontSize: 15,
              fontFamily: "'Barlow',sans-serif", fontWeight: 600, outline: 'none',
              boxSizing: 'border-box', transition: 'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor = C.red + '88'}
            onBlur={e => e.target.style.borderColor = '#ffffff14'}/>
          <T size={11} color="#333" style={{ display: 'block', marginTop: 5 }}>
            Psst... try typing a traitor's name
          </T>
        </div>

        {/* Jersey */}
        <div style={{ marginBottom: 20 }}>
          <T size={11} weight={700} color={C.gold} style={{ display: 'block', marginBottom: 8, letterSpacing: 2 }}>JERSEY NUMBER</T>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['7','8','9','10','11','14'].map(n => (
              <motion.button key={n} onClick={() => { setJersey(n); play('click') }}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                style={{ width: 44, height: 44, background: jersey === n ? C.red : '#0a0a14',
                  border: `1px solid ${jersey === n ? C.red : '#ffffff14'}`,
                  color: 'white', fontFamily: "'Barlow Condensed',sans-serif",
                  fontWeight: 800, fontSize: 16, cursor: 'pointer', borderRadius: 4,
                  boxShadow: jersey === n ? `0 4px 16px ${C.red}44` : 'none', transition: 'all 0.15s' }}>
                {n}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Mode select */}
        <div style={{ marginBottom: 24 }}>
          <T size={11} weight={700} color={C.gold} style={{ display: 'block', marginBottom: 8, letterSpacing: 2 }}>GAME MODE</T>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Era modes - featured */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {MODES.filter(m => m.era).map(m => (
                <motion.button key={m.id} onClick={() => { setMode(m.id); play('click') }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{ padding: '14px 12px', background: mode === m.id ? `${m.color}22` : '#0a0a14',
                    border: `2px solid ${mode === m.id ? m.color : '#ffffff0a'}`,
                    borderRadius: 6, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    boxShadow: mode === m.id ? `0 4px 20px ${m.color}33` : 'none' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</div>
                  <T size={13} weight={800} color={mode === m.id ? m.color : '#888'} style={{ display: 'block' }}>{m.label}</T>
                  <T size={11} weight={500} color="#444" style={{ display: 'block', marginTop: 2 }}>{m.sub}</T>
                </motion.button>
              ))}
            </div>
            {/* Category modes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {MODES.filter(m => !m.era).map(m => (
                <motion.button key={m.id} onClick={() => { setMode(m.id); play('click') }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{ padding: '10px 8px', background: mode === m.id ? `${m.color}1a` : '#0a0a14',
                    border: `1px solid ${mode === m.id ? m.color : '#ffffff0a'}`,
                    borderRadius: 4, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 16, marginBottom: 3 }}>{m.icon}</div>
                  <T size={10} weight={700} color={mode === m.id ? m.color : '#555'}>{m.label}</T>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <Btn full size="lg" color={selectedMode.color} disabled={!name.trim()}
          onClick={() => { play('whistle'); setPlayer({ name, jersey, mode }); setTimeout(() => setScreen('game'), 200) }}
          onHover={() => play('hover')}>
          ⚽ KICK OFF
        </Btn>
      </motion.div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// SCREEN: GAME
// ════════════════════════════════════════════════════════════
function GameScreen({ nav, player }) {
  const { play, setScreen, setResult } = nav
  const theme = getTheme(player.mode)
  const qsRef = useRef(getQuestions(player.mode))
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
  const p = theme.primary

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
    if (q?.type === 'fill' && !feedback) setTimeout(() => fillRef.current?.focus(), 300)
  }, [idx, q])

  const resolve = useCallback((optIdx, fillVal) => {
    if (feedback) return
    clearInterval(timerRef.current)
    const correct = q.type === 'mcq' ? optIdx === q.correct : checkAnswer(fillVal, q.answer)
    const bonus = Math.floor(timeLeft * 3)
    const pts = correct ? 100 + bonus : 0

    if (correct) {
      play('correct')
      setScore(s => s + pts)
      const ns = streak + 1
      setStreak(ns); setMaxStreak(ms => Math.max(ms, ns))
      if (ns >= 3) play('streak')
    } else {
      play('wrong'); setStreak(0)
    }

    setSelected(optIdx)
    setFeedback(correct ? 'correct' : 'wrong')
    setLog(l => [...l, { correct, pts, time: 30 - timeLeft, category: q.category }])

    setTimeout(() => {
      setFeedback(null); setSelected(null)
      setFill(''); setElim([]); setVarActive(false)
      if (idx < total - 1) {
        setIdx(i => i + 1); setTimeLeft(30)
      } else {
        play('fullTime')
        const finalScore = correct ? score + pts : score
        const finalLog = [...log, { correct, pts, time: 30 - timeLeft, category: q.category }]
        setTimeout(() => {
          setResult({ score: finalScore, log: finalLog, maxStreak: Math.max(maxStreak, correct ? streak + 1 : streak), player, questions: qsRef.current })
          setScreen('results')
        }, 500)
      }
    }, 2400)
  }, [feedback, q, timeLeft, streak, maxStreak, idx, total, score, log, play])

  const doVAR = () => {
    if (varUsed || feedback || q.type !== 'mcq') return
    play('var'); setVarUsed(true); setVarActive(true)
    const w = [0,1,2,3].filter(i => i !== q.correct).sort(() => Math.random()-0.5).slice(0,2)
    setTimeout(() => setElim(w), 900)
  }

  const pct = timeLeft / 30
  const tColor = pct > 0.6 ? '#44DD44' : pct > 0.3 ? '#FFAA00' : C.red
  const OPTS = ['A','B','C','D']

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column',
      padding: '56px 16px 20px', gap: 10 }}>

      {/* HUD */}
      <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{ background: '#0a0a18', border: `1px solid ${p}33`, borderRadius: 6,
          padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <T size={11} weight={800} color={p}>{player.name.toUpperCase()}</T>
          <T size={18} weight={900} color="white" style={{ display: 'block', lineHeight: 1.2 }}>
            <Counter to={score}/>
          </T>
        </div>
        <div style={{ textAlign: 'center' }}>
          <T size={11} color="#444">Q {idx+1} / {total}</T>
          <AnimatePresence>
            {streak >= 2 && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: [1,1.15,1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                style={{ marginTop: 2 }}>
                <T size={12} weight={800} color={C.goldLight}>🔥 ×{streak}</T>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Badge color={p}>{q.category.toUpperCase()}</Badge>
          <T size={11} color="#444" style={{ display: 'block', marginTop: 4 }}>
            {q.type === 'fill' ? '✍ FILL-IN' : '◉ CHOICE'}
          </T>
        </div>
      </motion.div>

      {/* Timer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <motion.div animate={pct <= 0.3 ? { scale: [1,1.12,1] } : {}} transition={{ duration: 0.5, repeat: Infinity }}>
          <T size={13} weight={800} color={tColor} style={{ minWidth: 28 }}>{timeLeft}s</T>
        </motion.div>
        <div style={{ flex: 1, height: 6, background: '#0a0a14', borderRadius: 3, overflow: 'hidden' }}>
          <motion.div animate={{ width: `${(timeLeft/30)*100}%` }} transition={{ duration: 0.3 }}
            style={{ height: '100%', background: `linear-gradient(90deg, ${tColor}88, ${tColor})`,
              borderRadius: 3, transition: 'background 0.5s' }}/>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 3 }}>
        {qsRef.current.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2,
            background: i < idx ? (log[i]?.correct ? '#00AA00' : C.red) : i === idx ? C.goldLight : '#111' }}/>
        ))}
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.2 }}
          style={{ background: '#0a0a18', border: `1px solid ${C.gold}33`, borderRadius: 6,
            padding: '16px 16px', boxShadow: `0 4px 24px ${C.gold}11` }}>
          <T size={11} weight={700} color={C.gold} style={{ display: 'block', marginBottom: 8, letterSpacing: 2 }}>
            {q.category.toUpperCase()}
          </T>
          <T size={16} weight={600} color="white" style={{ display: 'block', lineHeight: 1.6,
            fontFamily: "'Barlow',sans-serif" }}>
            {q.question}
          </T>
          {q.type === 'fill' && !feedback && (
            <T size={12} color="#444" style={{ display: 'block', marginTop: 8 }}>
              Hint: {q.hint}
            </T>
          )}
        </motion.div>
      </AnimatePresence>

      {/* MCQ options */}
      {q.type === 'mcq' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.options.map((opt, i) => {
            const isElim = elim.includes(i)
            const isCorrect = feedback && i === q.correct
            const isWrong = feedback && selected === i && i !== q.correct
            return (
              <motion.button key={`${idx}-${i}`}
                onClick={() => { if (!feedback && !isElim) { play('click'); resolve(i,'') } }}
                onMouseEnter={() => { if (!feedback && !isElim) play('hover') }}
                disabled={!!feedback || isElim}
                initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: isElim ? 0.2 : 1 }}
                transition={{ delay: i * 0.055 }}
                whileHover={!feedback && !isElim ? { x: 5, borderColor: p } : {}}
                style={{
                  background: isCorrect ? '#00330088' : isWrong ? '#33000088' : '#0a0a18',
                  border: `1px solid ${isCorrect ? '#00FF00' : isWrong ? '#FF4444' : '#ffffff0f'}`,
                  borderRadius: 5, padding: '12px 14px', cursor: feedback || isElim ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                  opacity: isElim ? 0.18 : 1, textDecoration: isElim ? 'line-through' : 'none',
                  transition: 'border-color 0.15s, background 0.15s',
                }}>
                <span style={{ width: 24, height: 24, background: isCorrect ? '#00FF0022' : isWrong ? '#FF000022' : `${p}22`,
                  border: `1px solid ${isCorrect ? '#00FF0066' : isWrong ? '#FF444466' : `${p}44`}`,
                  borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0 }}>
                  <T size={11} weight={800} color={isCorrect ? '#00FF00' : isWrong ? '#FF4444' : p}>{OPTS[i]}</T>
                </span>
                <T size={14} weight={500} color={isElim ? '#333' : 'white'} style={{ flex: 1, textAlign: 'left',
                  fontFamily: "'Barlow',sans-serif", fontWeight: 500 }}>{opt}</T>
                {isCorrect && <span style={{ color: '#00FF00', fontSize: 16 }}>✓</span>}
                {isWrong && <span style={{ color: '#FF4444', fontSize: 16 }}>✗</span>}
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
              style={{ flex: 1, background: '#0a0a14',
                border: `1px solid ${feedback ? (feedback === 'correct' ? '#00FF00' : '#FF4444') : '#ffffff14'}`,
                color: 'white', padding: '12px 14px', borderRadius: 4,
                fontFamily: "'Barlow',sans-serif", fontSize: 15, fontWeight: 500, outline: 'none',
                transition: 'border-color 0.2s' }}
              onFocus={e => { if (!feedback) e.target.style.borderColor = `${p}66` }}
              onBlur={e => { if (!feedback) e.target.style.borderColor = '#ffffff14' }}/>
            <Btn color={p} disabled={!fill.trim() || !!feedback}
              onClick={() => { play('click'); resolve(0, fill) }}>
              GO
            </Btn>
          </div>
          <AnimatePresence>
            {feedback && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: 8, padding: '8px 12px', borderRadius: 4,
                  background: feedback === 'correct' ? '#00330055' : '#33000055',
                  border: `1px solid ${feedback === 'correct' ? '#00AA00' : '#AA0000'}` }}>
                <T size={13} weight={700} color={feedback === 'correct' ? '#44FF44' : '#FF6666'}>
                  {feedback === 'correct' ? '✓ CORRECT!' : `✗ ANSWER: ${q.answer?.toUpperCase()}`}
                </T>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Trivia reveal */}
      <AnimatePresence>
        {feedback && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: '#08081a', border: '1px solid #4488FF22', borderRadius: 5, padding: '12px 14px' }}>
            <T size={11} weight={700} color="#4488FF" style={{ display: 'block', marginBottom: 6, letterSpacing: 1 }}>
              📖 DID YOU KNOW?
            </T>
            <T size={13} weight={400} color="#666" style={{ display: 'block', lineHeight: 1.7,
              fontFamily: "'Barlow',sans-serif" }}>{q.trivia}</T>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VAR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto' }}>
        <motion.button onClick={!varUsed && !feedback && q.type === 'mcq' ? doVAR : undefined}
          whileHover={!varUsed && q.type === 'mcq' ? { scale: 1.06 } : {}}
          style={{ background: varUsed ? '#0a0a14' : `${C.gold}11`,
            border: `1px solid ${varUsed ? '#ffffff0a' : C.gold + '44'}`, borderRadius: 5,
            padding: '8px 14px', cursor: varUsed || q.type !== 'mcq' ? 'not-allowed' : 'pointer',
            opacity: varUsed ? 0.3 : 1, display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.15s' }}>
          <motion.span animate={varActive ? { rotate: [0,360] } : {}} transition={{ duration: 1, repeat: Infinity }}>
            📺
          </motion.span>
          <T size={12} weight={700} color={varUsed ? '#333' : C.gold}>
            {varUsed ? 'VAR USED' : 'USE VAR'}
          </T>
        </motion.button>
        {q.type === 'fill' && <T size={11} color="#333">VAR: MCQ only</T>}
      </div>

      {/* GOAL / NO GOAL overlay */}
      <AnimatePresence>
        {feedback && (
          <motion.div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', pointerEvents: 'none', zIndex: 300 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              style={{ background: feedback === 'correct' ? 'rgba(0,20,0,0.96)' : 'rgba(20,0,0,0.96)',
                border: `3px solid ${feedback === 'correct' ? '#00FF00' : '#FF3333'}`,
                borderRadius: 8, padding: '24px 48px', textAlign: 'center',
                boxShadow: `0 0 60px ${feedback === 'correct' ? '#00FF0033' : '#FF000033'}` }}>
              <T size={32} weight={900} color={feedback === 'correct' ? '#00FF00' : '#FF4444'}
                style={{ display: 'block', fontFamily: "'Barlow Condensed',sans-serif",
                  textShadow: `0 0 24px currentColor` }}>
                {feedback === 'correct' ? '⚽ GOAL!' : '❌ NO GOAL'}
              </T>
              {feedback === 'correct' && (
                <T size={15} weight={700} color="#88FF88" style={{ display: 'block', marginTop: 6 }}>
                  +{100 + Math.floor(timeLeft * 3)} PTS
                  {streak >= 2 ? ` · 🔥 ×${streak + 1} STREAK` : ''}
                </T>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// SCREEN: RESULTS
// ════════════════════════════════════════════════════════════
function ResultsScreen({ nav, player, result }) {
  const { play, setScreen } = nav
  const { score, log, maxStreak, questions } = result
  const correct = log.filter(l => l.correct).length
  const total = questions.length
  const maxScore = total * 130
  const rating = getRating(score, maxScore)
  const pct = Math.round((score / maxScore) * 100)
  const theme = getTheme(player.mode)
  const [shareVisible, setShareVisible] = useState(false)

  const catData = ['history','legends','trophies','invincibles','modern','wenger','arteta']
    .map(cat => {
      const qs = questions.filter(q => q.category === cat)
      if (!qs.length) return null
      const hits = qs.filter(q => { const qi = questions.indexOf(q); return log[qi]?.correct }).length
      return { cat: cat.slice(0,5).toUpperCase(), hits, total: qs.length, pct: Math.round((hits/qs.length)*100) }
    }).filter(Boolean)

  const radarData = [
    { stat: 'SCORE',   val: pct },
    { stat: 'SPEED',   val: Math.max(10, 100 - Math.round((log.reduce((s,l) => s+(l.time||15),0)/Math.max(1,log.length))*3)) },
    { stat: 'STREAK',  val: Math.round((maxStreak/total)*100) },
    { stat: 'CORRECT', val: Math.round((correct/total)*100) },
    { stat: 'BONUS',   val: Math.min(100, Math.round((score - correct*100)/Math.max(1,correct*30)*100)) },
    { stat: 'RATING',  val: rating.stars * 20 },
  ]

  return (
    <div style={{ minHeight: '100vh', padding: '68px 16px 30px' }}>
      <motion.div {...slide} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Full Time header */}
        <div style={{ textAlign: 'center' }}>
          <T size={11} weight={700} color="#444" style={{ letterSpacing: 4, display: 'block' }}>◉ FULL TIME ◉</T>
          <motion.div animate={{ opacity: [1, 0.7, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <T size={38} weight={900} color={rating.color}
              style={{ display: 'block', lineHeight: 1.1, textShadow: `0 0 40px ${rating.glow}` }}>
              {rating.emoji} {rating.title}
            </T>
          </motion.div>
          <T size={14} weight={700} color={rating.color} style={{ display: 'block', marginTop: 4, letterSpacing: 2 }}>
            {rating.subtitle}
          </T>
        </div>

        {/* Rating desc */}
        <Card style={{ padding: '12px 16px', border: `1px solid ${rating.color}33`,
          background: `${rating.color}0a`, textAlign: 'center' }}>
          <T size={14} weight={400} color="#888" style={{ lineHeight: 1.7, fontFamily: "'Barlow',sans-serif" }}>
            {rating.desc}
          </T>
        </Card>

        {/* Score card */}
        <Card style={{ padding: 20, border: `1px solid ${C.red}33`,
          boxShadow: `0 8px 32px ${C.red}11` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ width: 56, height: 56, background: C.red,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${C.gold}`, borderRadius: 6, flexShrink: 0,
              boxShadow: `0 4px 16px ${C.red}44` }}>
              <T size={22} weight={900}>{player.jersey}</T>
            </div>
            <div style={{ flex: 1 }}>
              <T size={16} weight={800}>{player.name.toUpperCase()}</T>
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                {Array.from({length:5}).map((_,i) => (
                  <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ delay: 0.4+i*0.1 }}
                    style={{ fontSize: 14, color: i < rating.stars ? C.goldLight : '#222' }}>★</motion.span>
                ))}
              </div>
            </div>
            <div style={{ background: `${rating.color}22`, border: `1px solid ${rating.color}44`,
              borderRadius: 6, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <T size={24} weight={900} color={rating.color}>{rating.rank}</T>
            </div>
          </div>

          {/* Big score */}
          <div style={{ textAlign: 'center', padding: '14px 0', borderTop: '1px solid #ffffff08',
            borderBottom: '1px solid #ffffff08', marginBottom: 14 }}>
            <T size={11} color="#333" style={{ display: 'block', letterSpacing: 2, marginBottom: 4 }}>TOTAL SCORE</T>
            <T size={48} weight={900} color={C.goldLight}
              style={{ display: 'block', textShadow: `0 0 30px ${C.goldLight}66` }}>
              <Counter to={score}/>
            </T>
            <T size={12} color="#444" style={{ display: 'block', marginTop: 2 }}>{pct}% ACCURACY</T>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'CORRECT', val: `${correct}/${total}`, color: '#44DD44' },
              { label: 'MAX STREAK', val: `×${maxStreak}`, color: C.red },
              { label: 'RANK', val: rating.rank, color: rating.color },
            ].map(s => (
              <div key={s.label} style={{ background: '#080812', border: '1px solid #ffffff08',
                borderRadius: 4, padding: '10px 8px', textAlign: 'center' }}>
                <T size={10} color="#333" style={{ display: 'block', letterSpacing: 1 }}>{s.label}</T>
                <T size={20} weight={900} color={s.color} style={{ display: 'block', marginTop: 4 }}>{s.val}</T>
              </div>
            ))}
          </div>
        </Card>

        {/* Category breakdown */}
        {catData.length > 0 && (
          <Card style={{ padding: '14px 16px' }}>
            <T size={12} weight={800} color={C.gold} style={{ display: 'block', marginBottom: 14, letterSpacing: 2 }}>
              CATEGORY BREAKDOWN
            </T>
            {catData.map((d, i) => (
              <motion.div key={d.cat} style={{ marginBottom: 10 }}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.07 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <T size={12} weight={600} color="#666">{d.cat}</T>
                  <T size={12} weight={700} color={d.pct >= 70 ? '#44DD44' : d.pct >= 40 ? C.gold : C.red}>
                    {d.hits}/{d.total}
                  </T>
                </div>
                <div style={{ height: 8, background: '#080812', borderRadius: 4, overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }}
                    animate={{ width: `${d.pct}%` }}
                    transition={{ duration: 0.7, delay: 0.4 + i * 0.07, ease: 'easeOut' }}
                    style={{ height: '100%', borderRadius: 4,
                      background: d.pct >= 70 ? 'linear-gradient(90deg,#00AA00,#44FF44)' :
                        d.pct >= 40 ? `linear-gradient(90deg,${C.gold}88,${C.gold})` :
                        `linear-gradient(90deg,${C.redDark},${C.red})` }}/>
                </div>
              </motion.div>
            ))}
          </Card>
        )}

        {/* Radar chart */}
        <Card style={{ padding: '14px 10px' }}>
          <T size={12} weight={800} color="#4488FF" style={{ display: 'block', marginBottom: 4, paddingLeft: 8, letterSpacing: 2 }}>
            ARSENAL IQ RADAR
          </T>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 12, right: 28, bottom: 8, left: 28 }}>
                <PolarGrid stroke="#1a1a2e" strokeDasharray="3 3"/>
                <PolarAngleAxis dataKey="stat" tick={{ fill: '#555', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, fontWeight: 700 }}/>
                <Radar dataKey="val" stroke={C.red} fill={C.red} fillOpacity={0.25} strokeWidth={2}
                  dot={{ fill: C.red, r: 3 }}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Q-by-Q */}
        <div>
          <T size={12} weight={800} color={C.gold} style={{ display: 'block', marginBottom: 10, letterSpacing: 2 }}>
            MATCH REPORT
          </T>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {questions.map((_,i) => (
              <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.5 + i * 0.03 }}
                title={questions[i]?.question}
                style={{ width: 30, height: 30, borderRadius: 4,
                  background: log[i]?.correct ? '#002200' : '#220000',
                  border: `1px solid ${log[i]?.correct ? '#00AA00' : '#AA0000'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <T size={9} weight={700} color={log[i]?.correct ? '#44FF44' : '#FF4444'}>{i+1}</T>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn color={C.red} onClick={() => { play('click'); setScreen('setup') }}>
            🔄 REMATCH
          </Btn>
          <Btn color={C.gold} onClick={() => { play('reveal'); setShareVisible(true) }}>
            📸 SHARE
          </Btn>
          <Btn ghost color="#666" onClick={() => { play('click'); setScreen('welcome') }}>
            🏠 MENU
          </Btn>
        </div>
      </motion.div>

      {/* Share card modal */}
      <AnimatePresence>
        {shareVisible && (
          <ShareCard result={result} player={player} rating={rating} pct={pct} correct={correct}
            onClose={() => setShareVisible(false)} play={play}/>
        )}
      </AnimatePresence>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// SHARE CARD (Instagram Story format 9:16)
// ════════════════════════════════════════════════════════════
function ShareCard({ result, player, rating, pct, correct, onClose, play }) {
  const { score, log, maxStreak, questions } = result
  const total = questions.length
  const cardRef = useRef(null)

  const copyText = () => {
    const txt = `🔴 ARSENAL FC QUIZ CHAMPIONSHIP\n\n${rating.emoji} ${rating.title}\n${rating.subtitle}\n\nScore: ${score} pts | ${correct}/${total} correct | ${pct}% accuracy\nMax Streak: ×${maxStreak}\n\nCOYG! ⚽ #ArsenalFC #COYG #TheGooners`
    navigator.clipboard?.writeText(txt).catch(() => {})
    if (navigator.share) {
      navigator.share({ title: 'Arsenal FC Quiz', text: txt, url: window.location.href }).catch(() => {})
    }
  }

  // Story card - 9:16 ratio rendered as 270x480
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 500,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 20, backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      <T size={11} weight={700} color="#555" style={{ marginBottom: 12, letterSpacing: 2 }}>
        SCREENSHOT &amp; SHARE TO INSTAGRAM STORY
      </T>

      {/* The card itself — 9:16 Instagram Story proportions */}
      <div ref={cardRef} style={{
        width: 270, height: 480, borderRadius: 16, overflow: 'hidden', position: 'relative',
        background: `linear-gradient(160deg, #0f0005 0%, #1a0008 40%, #0a000f 70%, #000510 100%)`,
        border: `2px solid ${C.red}55`, boxShadow: `0 0 60px ${C.red}33, 0 24px 80px rgba(0,0,0,0.8)`,
        flexShrink: 0,
      }}>
        {/* BG glow */}
        <div style={{ position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse 70% 40% at 50% 20%, ${C.red}22 0%, transparent 70%)` }}/>
        <div style={{ position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)',
          backgroundSize: '16px 16px' }}/>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex',
          flexDirection: 'column', padding: '20px 18px', justifyContent: 'space-between' }}>

          {/* Top: Arsenal branding */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <div style={{ width: 6, height: 6, background: C.red }}/>
              <T size={9} weight={900} color={C.red} style={{ letterSpacing: 3 }}>ARSENAL FC</T>
              <div style={{ flex: 1 }}/>
              <T size={9} color="#333">QUIZ CHAMPIONSHIP</T>
            </div>
            <div style={{ height: 1, background: `linear-gradient(90deg, ${C.red}, transparent)`, marginBottom: 16 }}/>
          </div>

          {/* Middle: Rating */}
          <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ fontSize: 40 }}>{rating.emoji}</div>
            <T size={26} weight={900} color={rating.color}
              style={{ display: 'block', textShadow: `0 0 24px ${rating.glow}`, lineHeight: 1.1 }}>
              {rating.title}
            </T>
            <T size={9} weight={700} color={rating.color} style={{ letterSpacing: 2 }}>
              {rating.subtitle}
            </T>
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              {Array.from({length:5}).map((_,i) => (
                <span key={i} style={{ fontSize: 14, color: i < rating.stars ? C.goldLight : '#222' }}>★</span>
              ))}
            </div>
          </div>

          {/* Player info */}
          <div style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${C.red}33`,
            borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, background: C.red, borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${C.gold}` }}>
                <T size={12} weight={900}>{player.jersey}</T>
              </div>
              <T size={13} weight={800}>{player.name.toUpperCase()}</T>
              <div style={{ marginLeft: 'auto', background: `${rating.color}22`,
                border: `1px solid ${rating.color}44`, borderRadius: 4,
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <T size={14} weight={900} color={rating.color}>{rating.rank}</T>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {[
                { l: 'SCORE', v: score, c: C.goldLight },
                { l: 'CORRECT', v: `${correct}/${total}`, c: '#44FF44' },
                { l: 'STREAK', v: `×${maxStreak}`, c: C.red },
              ].map(s => (
                <div key={s.l} style={{ textAlign: 'center' }}>
                  <T size={8} color="#444" style={{ display: 'block' }}>{s.l}</T>
                  <T size={15} weight={900} color={s.c} style={{ display: 'block', marginTop: 2 }}>{s.v}</T>
                </div>
              ))}
            </div>
          </div>

          {/* Q dots */}
          <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginBottom: 10 }}>
            {questions.map((_,i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: 2,
                background: log[i]?.correct ? '#00AA00' : C.red,
                border: `1px solid ${log[i]?.correct ? '#00FF00' : '#FF4444'}` }}/>
            ))}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', borderTop: '1px solid #ffffff0a', paddingTop: 10 }}>
            <T size={8} color="#444">arzenalquiz.vercel.app</T>
            <T size={8} color={C.red} style={{ display: 'block', marginTop: 2 }}>#COYG #WeAreArsenal</T>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <Btn color={C.red} onClick={() => { play('click'); copyText() }}>
          📋 COPY &amp; SHARE
        </Btn>
        <Btn ghost color="#666" onClick={() => { play('click'); onClose() }}>
          CLOSE
        </Btn>
      </div>
      <T size={10} color="#333" style={{ marginTop: 8, textAlign: 'center' }}>
        Screenshot the card above to save it!
      </T>
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════
// SCREEN: INFOGRAPHICS
// ════════════════════════════════════════════════════════════
function InfographicsScreen({ nav }) {
  const { play, setScreen } = nav
  const [tab, setTab] = useState('trophies')
  const S = ARSENAL_STATS
  const tabs = [
    { id: 'trophies', label: 'TROPHIES', icon: '🏆' },
    { id: 'scorers',  label: 'SCORERS',  icon: '⚽' },
    { id: 'squad',    label: 'SQUAD',    icon: '👕' },
    { id: 'records',  label: 'RECORDS',  icon: '📋' },
    { id: 'managers', label: 'MANAGERS', icon: '🧠' },
  ]

  return (
    <div style={{ minHeight: '100vh', padding: '68px 16px 30px' }}>
      <motion.div {...slide}>
        <T size={32} weight={900} color={C.red} style={{ display: 'block', marginBottom: 4 }}>ARSENAL STATS</T>
        <T size={13} weight={500} color="#555" style={{ display: 'block', marginBottom: 16 }}>
          FOUNDED {S.founded} · {S.trophies.total} TROPHIES · {S.stadium.name.toUpperCase()}
        </T>
        <Divider color={C.red} style={{ marginBottom: 16 }}/>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 18, overflowX: 'auto', paddingBottom: 4 }}>
          {tabs.map(t => (
            <motion.button key={t.id} onClick={() => { setTab(t.id); play('click') }}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              style={{ padding: '8px 12px', background: tab === t.id ? `${C.red}22` : '#0a0a14',
                border: `1px solid ${tab === t.id ? C.red : '#ffffff0a'}`, borderRadius: 4,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>{t.icon}</span>
              <T size={11} weight={700} color={tab === t.id ? C.red : '#555'}>{t.label}</T>
            </motion.button>
          ))}
        </div>

        {/* TROPHIES */}
        {tab === 'trophies' && (
          <motion.div key="trophies" {...slide} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Card style={{ padding: '16px', textAlign: 'center', border: `1px solid ${C.gold}33`,
              background: `${C.gold}08` }}>
              <T size={11} color="#555" style={{ display: 'block', letterSpacing: 2 }}>TOTAL TROPHIES</T>
              <T size={56} weight={900} color={C.goldLight} style={{ display: 'block', textShadow: `0 0 30px ${C.goldLight}55` }}>
                {S.trophies.total}
              </T>
            </Card>
            {S.trophies.breakdown.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}>
                <Card style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <div style={{ flex: 1 }}>
                    <T size={13} weight={700} color="white" style={{ display: 'block' }}>{t.name}</T>
                    <div style={{ height: 6, background: '#080812', borderRadius: 3, marginTop: 4, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, t.count * 6)}%` }}
                        transition={{ duration: 0.6, delay: i * 0.06, ease: 'easeOut' }}
                        style={{ height: '100%', background: `linear-gradient(90deg,${C.redDark},${C.red})`, borderRadius: 3 }}/>
                    </div>
                  </div>
                  <div style={{ background: `${C.red}22`, border: `1px solid ${C.red}44`,
                    borderRadius: 4, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <T size={16} weight={900} color={C.red}>{t.count}</T>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* SCORERS */}
        {tab === 'scorers' && (
          <motion.div key="scorers" {...slide} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <T size={12} weight={700} color="#555" style={{ display: 'block', marginBottom: 4, letterSpacing: 1 }}>
              ALL-TIME TOP SCORERS
            </T>
            {S.allTimeTopScorers.map((p, i) => (
              <motion.div key={p.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}>
                <Card style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 28, height: 28, background: i < 3 ? C.red : '#111',
                    borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${i < 3 ? C.red : '#222'}`, flexShrink: 0 }}>
                    <T size={12} weight={900} color={i === 0 ? C.goldLight : 'white'}>{i+1}</T>
                  </div>
                  <div style={{ flex: 1 }}>
                    <T size={14} weight={700}>{p.name}</T>
                    <T size={11} color="#444" style={{ display: 'block', marginTop: 2 }}>{p.years}</T>
                    <div style={{ height: 5, background: '#080812', borderRadius: 2, marginTop: 5, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(p.goals/228)*100}%` }}
                        transition={{ duration: 0.7, delay: i*0.07, ease: 'easeOut' }}
                        style={{ height: '100%', background: i === 0 ? `linear-gradient(90deg,${C.gold},${C.goldLight})` : `linear-gradient(90deg,${C.redDark},${C.red})`, borderRadius: 2 }}/>
                    </div>
                  </div>
                  <T size={22} weight={900} color={i === 0 ? C.goldLight : C.red}>{p.goals}</T>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* SQUAD */}
        {tab === 'squad' && (
          <motion.div key="squad" {...slide}>
            <T size={12} weight={700} color="#555" style={{ display: 'block', marginBottom: 10, letterSpacing: 1 }}>
              CURRENT SQUAD 2024/25
            </T>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {S.currentSquad2024.map((p, i) => (
                <motion.div key={p.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}>
                  <Card style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, background: C.red, borderRadius: 4,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      border: `1px solid ${C.gold}44` }}>
                      <T size={12} weight={900}>{p.number}</T>
                    </div>
                    <div>
                      <T size={12} weight={700}>{p.name}</T>
                      <div style={{ display: 'flex', gap: 5, marginTop: 2 }}>
                        <Badge color={C.red}>{p.pos}</Badge>
                        <span style={{ fontSize: 12 }}>{p.nationality}</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* RECORDS */}
        {tab === 'records' && (
          <motion.div key="records" {...slide} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <T size={12} weight={700} color="#555" style={{ display: 'block', marginBottom: 4, letterSpacing: 1 }}>
              ARSENAL FC RECORDS
            </T>
            {S.records.map((r, i) => (
              <motion.div key={r.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}>
                <Card style={{ padding: '14px 16px', border: `1px solid ${C.gold}22`, background: `${C.gold}05` }}>
                  <T size={11} color="#555" style={{ display: 'block', letterSpacing: 1, marginBottom: 4 }}>{r.label}</T>
                  <T size={20} weight={900} color={C.goldLight} style={{ display: 'block' }}>{r.value}</T>
                  <T size={11} color="#444" style={{ display: 'block', marginTop: 4 }}>{r.detail}</T>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* MANAGERS */}
        {tab === 'managers' && (
          <motion.div key="managers" {...slide} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {S.managers.map((m, i) => (
              <motion.div key={m.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}>
                <Card style={{ padding: '14px 16px', border: `1px solid ${i === 3 ? C.red : i === 4 ? C.blue : '#ffffff0a'}22` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <T size={15} weight={800} color={i === 3 ? C.red : i === 4 ? C.blue : 'white'}>{m.name}</T>
                    <Badge color={i === 3 ? C.red : i === 4 ? C.blue : '#666'}>{m.years}</Badge>
                  </div>
                  <T size={12} color="#555" style={{ lineHeight: 1.6 }}>{m.trophies}</T>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        <div style={{ marginTop: 24 }}>
          <Btn full color={C.red} onClick={() => { play('click'); setScreen('setup') }}>
            ⚽ PLAY THE QUIZ
          </Btn>
        </div>
      </motion.div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// APP ROOT
// ════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState('welcome')
  const [player, setPlayer] = useState(null)
  const [result, setResult] = useState(null)
  const { init, play, toggleMute, muted, ready } = useAudio()

  const doInit = () => { if (!ready) init() }
  const safePlay = s => { doInit(); play(s) }

  const theme = player ? getTheme(player.mode) : null

  const showBack = ['setup','howtoplay','infographics'].includes(screen)
  const backTarget = screen === 'howtoplay' || screen === 'infographics' ? 'welcome' : 'welcome'

  const nav = { play: safePlay, setScreen, setPlayer, setResult }

  return (
    <div onClick={doInit} style={{ minHeight: '100vh', maxWidth: 480, margin: '0 auto',
      position: 'relative', overflow: 'hidden', background: '#080810' }}>
      <Background theme={theme}/>
      <NavBar muted={muted} onMute={toggleMute} onInit={doInit} play={safePlay}
        theme={theme} showBack={showBack}
        onBack={() => setScreen(backTarget)}/>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {screen === 'welcome' && <motion.div key="welcome" {...slide}><WelcomeScreen nav={nav}/></motion.div>}
          {screen === 'howtoplay' && <motion.div key="htp" {...slide}><HowToPlayScreen nav={nav}/></motion.div>}
          {screen === 'setup' && <motion.div key="setup" {...slide}><SetupScreen nav={nav}/></motion.div>}
          {screen === 'game' && player && <motion.div key="game" {...slide}><GameScreen nav={nav} player={player}/></motion.div>}
          {screen === 'results' && result && <motion.div key="results" {...slide}><ResultsScreen nav={nav} player={player} result={result}/></motion.div>}
          {screen === 'infographics' && <motion.div key="info" {...slide}><InfographicsScreen nav={nav}/></motion.div>}
        </AnimatePresence>
      </div>
    </div>
  )
}
