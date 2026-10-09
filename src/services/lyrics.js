import { request, ApiError } from './api.js'
import { API_CONFIG } from './config.js'

const EMOTIONS = ['joy', 'sadness', 'anger', 'fear', 'love', 'hope', 'nostalgia', 'calm']

export async function getLyrics({ title, artist }, options = {}) {
  const { data } = await request(`/songs/lyrics?${new URLSearchParams({ title, artist })}`, { timeout: API_CONFIG.lyricsTimeout, ...options })
  if (!data || !['available', 'not_found', 'instrumental'].includes(data.status) ||
    (data.status === 'available' && (typeof data.lyrics !== 'string' || !data.lyrics.trim() || data.lyrics.length > 60000))) {
    throw new ApiError('Invalid lyrics response', { code: 'INVALID_RESPONSE' })
  }
  const metrics = data.emotions
  const validMetrics = data.status === 'available' && data.emotionAnalysis?.status === 'estimated' &&
    Array.isArray(metrics) && metrics.length === 3 && new Set(metrics.map(value => value?.code)).size === 3 &&
    metrics.every(value => EMOTIONS.includes(value?.code) && Number.isInteger(value.score) && value.score >= 1 && value.score <= 100) &&
    metrics.reduce((sum, value) => sum + value.score, 0) === 100
  const fallbackStatus = data.status !== 'available' ? 'not_applicable' : data.emotionAnalysis?.status === 'insufficient_evidence' ? 'insufficient_evidence' : 'unavailable'
  return { ...data,
    emotions: validMetrics ? metrics.map(({ code, score }) => ({ code, score })).sort((a, b) => b.score - a.score || a.code.localeCompare(b.code)) : [],
    emotionAnalysis: { ...data.emotionAnalysis, status: validMetrics ? 'estimated' : fallbackStatus },
  }
}
