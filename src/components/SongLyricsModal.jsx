import { Modal } from './Modal.jsx'
import { LyricsContent } from './LyricsPanel.jsx'
import { SongLinks } from './SongLinks.jsx'

export function SongLyricsModal({ song, onClose }) {
  return <Modal open title={song.title} description={song.artist} onClose={onClose} size="wide" initialFocus="dialog">
    <div className="stack stack--3">
      <SongLinks song={song} />
      <LyricsContent key={`${song.title}:${song.artist}`} song={song} />
    </div>
  </Modal>
}
