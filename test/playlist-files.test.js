import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseSongFile, reviewSongs, MAX_FILE_BYTES } from '../src/utils/playlist-input.js'
import { es } from '../src/translations/es.js'
import { en } from '../src/translations/en.js'

test('CSV UTF-8 headers/delimiters/quoted commas/escaped quotes/CRLF and optional fields', () => {
  assert.deepEqual(Object.keys(es.playlistLinks).sort(), Object.keys(en.playlistLinks).sort())
  const rows = parseSongFile('\uFEFFtitle,artist,genre,edition\r\n"Song, one","Artist ""A""",Rock,Live\r\nTwo,Other,Folk,', 'songs.csv')
  assert.equal(rows[0].title, 'Song, one'); assert.equal(rows[0].artist, 'Artist "A"'); assert.equal(rows[0].sourceLine, 2)
  assert.ok(reviewSongs(rows).every(r => r.valid))
  for (const delimiter of [';', '\t']) assert.equal(parseSongFile(`Título${delimiter}Artista\nUno${delimiter}Autor`, 'x.csv')[0].title, 'Uno')
})
test('partial errors retained for editing, duplicates marked, XSS never valid', () => {
  const rows = reviewSongs(parseSongFile('title,artist\nOne,A\nOne,A\nMissing\n<script>,B\nToo,many,fields', 'x.csv'))
  assert.equal(rows.length, 5); assert.equal(rows[1].duplicate, true); assert.equal(rows.filter(r => !r.valid).length, 3)
  assert.equal(rows[2].sourceLine, 4)
  assert.equal(reviewSongs(parseSongFile('title,artist\n"multiline\nvalue",A', 'x.csv'))[0].valid, false)
  assert.throws(() => parseSongFile('title,artist\n"unclosed,A', 'x.csv'), /FILE_INVALID/)
})
test('TXT/JSON share validation, 2 and 500 rows, no silent truncation and size/empty limits', () => {
  const songs = Array.from({ length: 500 }, (_, i) => ({ title: `Synthetic ${i}`, artist: 'Own author' }))
  assert.equal(parseSongFile(JSON.stringify(songs), 'x.json').length, 500)
  assert.equal(parseSongFile(songs.map(s => `${s.title} — ${s.artist}`).join('\n'), 'x.txt').length, 500)
  assert.equal(parseSongFile('One — A\nTwo — B', 'x.txt').length, 2)
  assert.throws(() => parseSongFile(JSON.stringify([...songs, songs[0]]), 'x.json'), /FILE_LIMIT/)
  assert.throws(() => parseSongFile(Array(502).fill('One — A').join('\n'), 'x.txt'), /FILE_LIMIT/)
  for (const [text, file] of [['', 'x.txt'], ['[]', 'x.json'], ['title,artist', 'x.csv']]) assert.throws(() => parseSongFile(text, file), /FILE_EMPTY/)
  assert.throws(() => parseSongFile('x'.repeat(MAX_FILE_BYTES + 1), 'x.txt'), /FILE_TOO_LARGE/)
  assert.throws(() => parseSongFile('{}', 'x.json'), /FILE_INVALID/)
  assert.throws(() => parseSongFile('title,artist,spotify_uri\nOne,A,x', 'x.csv'), /FILE_HEADER/)
  assert.throws(() => parseSongFile('[{"title":"One","artist":"A","provenance":"provider_api_metadata"}]', 'x.json'), /FILE_PROVENANCE/)
  assert.equal(reviewSongs(parseSongFile('[{"title":42,"artist":"A"}]', 'x.json'))[0].valid, false)
})
