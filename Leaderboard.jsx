// ============================================================
// ARSENAL QUIZ -- LEADERBOARD SCREEN
// Real-time global top 20 + category champions
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  fetchGlobalTop20, fetchCategoryChampions,
  subscribeLeaderboard,
} from './supabase'
import { CATEGORIES } from './data'

const FONT_DISPLAY = "'Syne', sans-serif"

// ── Badge colors per rank ────────────────────────────────────
const RANK_COLORS = {
  'S+': '#E8010A', 'S': '#D4A820', 'A+': '#E8010A',
  'A': '#E8010A', 'B+': '#E67E22', 'B': '#E67E22',
  'C+': '#888', 'C': '#888', 'D': '#666', 'F': '#444',
}

// ── Position medal ───────────────────────────────────────────
function Medal({ pos }) {
  if (pos === 1) return <span style={{ fontSize: 20 }}>🥇</span>
  if (pos === 2) return <span style={{ fontSize: 20 }}>🥈</span>
  if (pos === 3) return <span style={{ fontSize: 20 }}>🥉</span>
  return (
    <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 800,
      fontSize: 14, color: 'var(--text-3)', minWidth: 24, textAlign: 'center' }}>
      {pos}
    </span>
  )
}

// ── Score row ────────────────────────────────────────────────
function ScoreRow({ entry, pos, isMe, isNew }) {
  const rankColor = RANK_COLORS[entry.rating_rank] || '#888'
  return (
    <motion.div
      initial={isNew ? { opacity: 0, x: 20, background: 'rgba(232,1,10,0.15)' } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, x: 0, y: 0, background: isMe ? 'rgba(232,1,10,0.08)' : 'transparent' }}
      transition={{ duration: 0.35 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 14px', borderRadius: 12,
        border: isMe ? '1px solid rgba(232,1,10,0.3)' : '1px solid var(--border)',
        background: isMe ? 'rgba(232,1,10,0.06)' : 'var(--bg-2)',
        position: 'relative', overflow: 'hidden',
      }}>
      {/* New entry shimmer */}
      {isNew && (
        <motion.div initial={{ x: '-100%' }} animate={{ x: '200%' }}
          transition={{ duration: 0.8 }}
          style={{ position: 'absolute', inset: 0, width: '40%',
            background: 'linear-gradient(90deg, transparent, rgba(232,1,10,0.15), transparent)',
            pointerEvents: 'none' }}/>
      )}

      {/* Position */}
      <div style={{ width: 28, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <Medal pos={pos}/>
      </div>

      {/* Jersey number */}
      <div style={{ width: 32, height: 32, background: isMe ? 'var(--red)' : 'var(--bg-3)',
        borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, border: isMe ? 'none' : '1px solid var(--border)' }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 13,
          color: isMe ? 'white' : 'var(--text-2)' }}>{entry.jersey}</span>
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entry.name}
          </span>
          {isMe && (
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)',
              background: 'rgba(232,1,10,0.1)', border: '1px solid rgba(232,1,10,0.3)',
              borderRadius: 10, padding: '1px 6px', flexShrink: 0 }}>YOU</span>
          )}
          {isNew && !isMe && (
            <motion.span animate={{ opacity: [1,0,1] }} transition={{ duration: 1, repeat: 3 }}
              style={{ fontSize: 10, fontWeight: 700, color: '#22C55E',
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: 10, padding: '1px 6px', flexShrink: 0 }}>NEW</motion.span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
            color: rankColor, background: `${rankColor}15`,
            border: `1px solid ${rankColor}30`, borderRadius: 8, padding: '1px 7px' }}>
            {entry.rating_rank}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {entry.correct}/{entry.total} correct
          </span>
          {entry.max_streak >= 3 && (
            <span style={{ fontSize: 11, color: '#F59E0B' }}>🔥×{entry.max_streak}</span>
          )}
        </div>
      </div>

      {/* Score */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 17,
          color: pos <= 3 ? rankColor : 'var(--text)' }}>
          {entry.score.toLocaleString()}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
          {Math.round((entry.correct / entry.total) * 100)}%
        </div>
      </div>
    </motion.div>
  )
}

// ── Category champion badge ───────────────────────────────────
function ChampionBadge({ cat, champion }) {
  const catInfo = CATEGORIES.find(c => c.id === cat)
  if (!catInfo || !champion) return null
  return (
    <motion.div whileHover={{ scale: 1.02 }}
      style={{ background: 'var(--bg-2)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 16 }}>{catInfo.emoji}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: catInfo.color,
          textTransform: 'uppercase', letterSpacing: 0.5 }}>{catInfo.label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, background: catInfo.color,
          borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 12, color: 'white',
          flexShrink: 0 }}>{champion.jersey}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {champion.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{champion.score} pts</div>
        </div>
        <span style={{ fontSize: 16 }}>👑</span>
      </div>
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════
// MAIN LEADERBOARD SCREEN
// ════════════════════════════════════════════════════════════
export default function LeaderboardScreen({ myScore, myName, play }) {
  const [tab, setTab] = useState('global')
  const [entries, setEntries] = useState([])
  const [champions, setChampions] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newIds, setNewIds] = useState(new Set())
  const subRef = useRef(null)

  // Initial load
  useEffect(() => {
    loadData()
    // Subscribe to real-time inserts
    subRef.current = subscribeLeaderboard(newEntry => {
      setEntries(prev => {
        const updated = [newEntry, ...prev]
          .sort((a, b) => b.score - a.score)
          .slice(0, 20)
        setNewIds(ids => new Set([...ids, newEntry.id]))
        setTimeout(() => setNewIds(ids => {
          const next = new Set(ids); next.delete(newEntry.id); return next
        }), 4000)
        return updated
      })
    })
    return () => { subRef.current?.unsubscribe() }
  }, [])

  const loadData = async () => {
    setLoading(true); setError(null)
    const [globalRes, champRes] = await Promise.all([
      fetchGlobalTop20(),
      fetchCategoryChampions(),
    ])
    if (!globalRes.ok) setError('Failed to load leaderboard')
    else setEntries(globalRes.data || [])
    if (champRes.ok) setChampions(champRes.data || {})
    setLoading(false)
  }

  // Find my position in leaderboard
  const myPosition = myScore != null
    ? entries.findIndex(e => e.name === myName?.toUpperCase() && e.score === myScore) + 1
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 26,
            color: 'var(--text)', marginBottom: 2 }}>Leaderboard</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Global top 20 Gunners</p>
        </div>
        <motion.button onClick={() => { play('click'); loadData() }}
          whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
          style={{ background: 'var(--bg-3)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '8px 12px', fontSize: 14 }}>
          🔄
        </motion.button>
      </div>

      {/* My rank highlight (if just played) */}
      <AnimatePresence>
        {myScore != null && myPosition != null && myPosition > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ background: 'rgba(232,1,10,0.08)', border: '1px solid rgba(232,1,10,0.25)',
              borderRadius: 12, padding: '10px 16px',
              display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🎯</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>
                Your position: #{myPosition} globally
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                Score: {myScore.toLocaleString()} pts
              </div>
            </div>
          </motion.div>
        )}
        {myScore != null && (myPosition === 0 || myPosition === null) && !loading && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'rgba(232,1,10,0.06)', border: '1px solid rgba(232,1,10,0.2)',
              borderRadius: 12, padding: '10px 16px',
              display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>📊</span>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
              Your score: <strong style={{ color: 'var(--red)' }}>{myScore.toLocaleString()} pts</strong>
              {' '}-- outside top 20 this time!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[
          { id: 'global', label: '🌍 Global Top 20' },
          { id: 'champions', label: '👑 Champions' },
        ].map(t => (
          <motion.button key={t.id} onClick={() => { setTab(t.id); play('click') }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            style={{ flex: 1, padding: '9px 12px', borderRadius: 10,
              background: tab === t.id ? 'var(--red)' : 'var(--bg-2)',
              border: `1px solid ${tab === t.id ? 'var(--red)' : 'var(--border)'}`,
              color: tab === t.id ? 'white' : 'var(--text-2)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            {t.label}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 12, padding: '40px 0' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: 32 }}>⚽</motion.div>
            <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600 }}>
              Loading leaderboard...
            </span>
          </motion.div>
        ) : error ? (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>😕</div>
            <div style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 16 }}>
              Could not load leaderboard
            </div>
            <motion.button onClick={loadData} whileHover={{ scale: 1.03 }}
              style={{ background: 'var(--red)', color: 'white', border: 'none',
                borderRadius: 10, padding: '9px 20px', fontWeight: 600, fontSize: 13 }}>
              Try again
            </motion.button>
          </motion.div>
        ) : tab === 'global' ? (
          <motion.div key="global" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {entries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
                <div style={{ fontSize: 14, color: 'var(--text-3)' }}>
                  No scores yet -- be the first!
                </div>
              </div>
            ) : (
              entries.map((entry, i) => (
                <ScoreRow key={entry.id} entry={entry} pos={i + 1}
                  isMe={entry.name === myName?.toUpperCase() && entry.score === myScore}
                  isNew={newIds.has(entry.id)}/>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div key="champions" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>
              #1 player in each category
            </p>
            {/* All categories champion */}
            {champions['all'] && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
                  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  Overall Champion
                </div>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ background: 'linear-gradient(135deg, rgba(232,1,10,0.1), rgba(212,168,32,0.1))',
                    border: '1px solid rgba(232,1,10,0.2)', borderRadius: 14, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, background: 'var(--red)',
                    borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 18, color: 'white' }}>
                    {champions['all'].jersey}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 16,
                      color: 'var(--text)' }}>{champions['all'].name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                      {champions['all'].rating_title} · {champions['all'].score.toLocaleString()} pts
                    </div>
                  </div>
                  <div style={{ fontSize: 28 }}>👑</div>
                </motion.div>
              </div>
            )}
            {/* Per category champions */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
              textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              Category Champions
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {CATEGORIES.map(cat => (
                <ChampionBadge key={cat.id} cat={cat.id} champion={champions[cat.id]}/>
              ))}
            </div>
            {Object.keys(champions).filter(k => k !== 'all').length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0',
                fontSize: 13, color: 'var(--text-3)' }}>
                No champions yet -- play a category to claim it! 🏆
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6,
        justifyContent: 'center', padding: '4px 0' }}>
        <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }}/>
        <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>
          Live · updates in real-time
        </span>
      </div>
    </div>
  )
}
