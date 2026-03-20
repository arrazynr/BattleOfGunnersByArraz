// ============================================================
// ARSENAL QUIZ -- SUPABASE CLIENT & LEADERBOARD
// ============================================================
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zakkbuszcnxxfgdcoqvh.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpha2tidXN6Y254eGZnZGNvcXZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTE3MzcsImV4cCI6MjA4OTU2NzczN30.o8v6tGKP6lb6V9djYS_5VoIAOYn97jXGuFmaklf7Lx8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

// ── Submit a score ───────────────────────────────────────────
export async function submitScore({ name, jersey, score, correct, total, maxStreak, category, ratingRank, ratingTitle }) {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .insert([{
        name: name.toUpperCase().slice(0, 14),
        jersey,
        score,
        correct,
        total,
        max_streak: maxStreak,
        category,
        rating_rank: ratingRank,
        rating_title: ratingTitle,
      }])
      .select()
      .single()

    if (error) throw error
    return { ok: true, data }
  } catch (e) {
    console.error('submitScore error:', e)
    return { ok: false, error: e.message }
  }
}

// ── Fetch global top 20 (all categories) ────────────────────
export async function fetchGlobalTop20() {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(20)

    if (error) throw error
    return { ok: true, data }
  } catch (e) {
    console.error('fetchGlobalTop20 error:', e)
    return { ok: false, data: [] }
  }
}

// ── Fetch top 5 per category (for category champions) ────────
export async function fetchCategoryChampions() {
  try {
    const categories = ['history', 'legends', 'trophies', 'invincibles', 'modern', 'transfers', 'rivals', 'all']
    const results = {}

    await Promise.all(categories.map(async cat => {
      const { data } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('category', cat)
        .order('score', { ascending: false })
        .limit(1)
      if (data?.[0]) results[cat] = data[0]
    }))

    return { ok: true, data: results }
  } catch (e) {
    console.error('fetchCategoryChampions error:', e)
    return { ok: false, data: {} }
  }
}

// ── Get rank position of a score ─────────────────────────────
export async function getMyRank(score) {
  try {
    const { count, error } = await supabase
      .from('leaderboard')
      .select('*', { count: 'exact', head: true })
      .gt('score', score)

    if (error) throw error
    return { ok: true, rank: (count || 0) + 1 }
  } catch (e) {
    return { ok: false, rank: null }
  }
}

// ── Subscribe to real-time leaderboard changes ───────────────
export function subscribeLeaderboard(callback) {
  return supabase
    .channel('leaderboard_changes')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'leaderboard',
    }, payload => callback(payload.new))
    .subscribe()
}
