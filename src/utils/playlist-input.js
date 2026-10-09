export const identityKey = song => JSON.stringify([song.title, song.artist, song.edition || ''].map(v => v.normalize('NFC').trim().replace(/\s+/gu, ' ').toLowerCase()))
export function parseSongs(text) {
  return text.split(/\r?\n/u).filter(line => line.trim()).slice(0, 501).map(line => {
    const parts = line.split(/\s+[—–-]\s+/u)
    return { title: parts.shift()?.trim() || '', artist: parts.join(' — ').trim(), edition: '', genre: '' }
  })
}
export function reviewSongs(songs) {
  const seen = new Set()
  return songs.map((song, index) => {
    const valid = !song.parseError && [song.title, song.artist].every(v => typeof v === 'string' && v.trim() && v.length <= 200 && !/[<>\p{Cc}]/u.test(v)) &&
      [song.genre || '', song.edition || ''].every(v => v.length <= 200 && !/[<>\p{Cc}]/u.test(v))
    const key = identityKey(song), duplicate = seen.has(key)
    if (valid) seen.add(key)
    return { ...song, index, valid, duplicate }
  })
}

export const MAX_FILE_BYTES = 256 * 1024
const fileFail = code => { throw new Error(code) }
const column = value => ({ title: 'title', titulo: 'title', song: 'title', track: 'title', artist: 'artist', artista: 'artist', genre: 'genre', genero: 'genre', edition: 'edition', edicion: 'edition', version: 'edition' })[value.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase()]
// RFC-style quoting, escaped quotes, CRLF and quoted newlines. No eval/HTML/blob storage.
export function parseSongFile(content, name) {
  if (typeof content !== 'string' || new TextEncoder().encode(content).length > MAX_FILE_BYTES) fileFail('FILE_TOO_LARGE')
  content = content.replace(/^\uFEFF/u, '')
  const extension = name.split('.').pop().toLowerCase()
  let rows
  if (extension === 'txt') rows = parseSongs(content)
  else if (extension === 'json') {
    let data
    try { data = JSON.parse(content) } catch { fileFail('FILE_INVALID') }
    if (!Array.isArray(data)) fileFail('FILE_INVALID')
    rows = data.map((row, i) => {
      if (!row || typeof row !== 'object' || Array.isArray(row)) return { title: '', artist: '', genre: '', edition: '', sourceLine: i + 1, parseError: true }
      if (Object.keys(row).some(key => !column(key))) fileFail('FILE_PROVENANCE')
      const out = { title: '', artist: '', genre: '', edition: '', sourceLine: i + 1 }
      for (const [key, value] of Object.entries(row)) { if (typeof value !== 'string') out.parseError = true; else out[column(key)] = value }
      return out
    })
  } else if (extension === 'csv') {
    const first = content.split(/\r?\n/u)[0]
    const delimiter = [',', ';', '\t'].sort((a, b) => first.split(b).length - first.split(a).length)[0]
    const records = []; let fields = [], field = '', quoted = false, closed = false, bad = false, line = 1, startLine = 1
    const finishField = () => { fields.push(field); field = ''; closed = false }
    const finishRecord = () => { finishField(); if (fields.some(v => v.trim())) records.push({ fields, line: startLine, bad }); fields = []; bad = false; startLine = line + 1 }
    for (let i = 0; i < content.length; i++) {
      const char = content[i]
      if (quoted) {
        if (char === '"') { if (content[i + 1] === '"') { field += '"'; i++ } else { quoted = false; closed = true } }
        else { field += char; if (char === '\n') line++ }
      } else if (char === '"' && !field && !closed) quoted = true
      else if (char === delimiter) finishField()
      else if (char === '\n' || char === '\r') { if (char === '\r' && content[i + 1] === '\n') i++; finishRecord(); line++ }
      else { if (closed || char === '"') bad = true; field += char }
    }
    if (quoted) fileFail('FILE_INVALID')
    finishRecord()
    const header = records.shift()
    if (!header || header.bad) fileFail('FILE_INVALID')
    const keys = header.fields.map(column)
    if (keys.some(k => !k) || new Set(keys).size !== keys.length || !keys.includes('title') || !keys.includes('artist')) fileFail('FILE_HEADER')
    rows = records.map(record => ({ title: '', artist: '', genre: '', edition: '', ...Object.fromEntries(keys.map((key, i) => [key, record.fields[i] || ''])), sourceLine: record.line, parseError: record.bad || record.fields.length !== keys.length }))
  } else fileFail('FILE_TYPE')
  if (!rows.length) fileFail('FILE_EMPTY')
  if (rows.length > 500) fileFail('FILE_LIMIT')
  return rows
}
