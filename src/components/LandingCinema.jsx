import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, AudioLines, Disc3, ListMusic, Pause, Play, Search, Sparkles } from 'lucide-react'
import { usePreferences } from '../context/PreferencesContext.jsx'
import atmosphere from '../assets/cinema/atmosphere.svg'
import memory from '../assets/cinema/memory.svg'
import record from '../assets/cinema/record.svg'
import vinyl from '../assets/cinema/vinyl.svg'
import constellation from '../assets/cinema/constellation.svg'
import affinity from '../assets/cinema/affinity.svg'
import archive from '../assets/cinema/archive.svg'
import glints from '../assets/cinema/glints.svg'
import poster from '../assets/cinema/poster.svg'

// Image, fallback and controls share one definition so a shot cannot drift
// away from its illustration, including when an individual image fails.
const scenes = [
  { id: 'memory', image: memory, Icon: Search },
  { id: 'record', image: record, Icon: Disc3 },
  { id: 'constellation', image: constellation, Icon: Sparkles },
  { id: 'affinity', image: affinity, Icon: AudioLines },
  { id: 'archive', image: archive, Icon: ListMusic },
]
const DURATION = 40000
const EASE = 'cubic-bezier(.32,.72,0,1)'

// A shared, seekable timeline. The last dissolve wraps back into the first shot.
function dissolve(index) {
  if (index === 0) return [
    { offset: 0, opacity: 1 }, { offset: .2, opacity: 1 },
    { offset: .24, opacity: 0 }, { offset: .96, opacity: 0 }, { offset: 1, opacity: 1 },
  ]
  const start = index * .2
  return [
    { offset: 0, opacity: 0 }, { offset: start, opacity: 0 },
    { offset: start + .04, opacity: 1 },
    { offset: index === 4 ? .96 : start + .2, opacity: 1 },
    { offset: index === 4 ? 1 : start + .24, opacity: 0 },
    ...(index === 4 ? [] : [{ offset: 1, opacity: 0 }]),
  ]
}

export function LandingCinema({ staticView = false }) {
  const { t } = usePreferences()
  const root = useRef(null)
  const animations = useRef([])
  const selected = useRef(0)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [visible, setVisible] = useState(false)
  const [foreground, setForeground] = useState(true)
  const [limited, setLimited] = useState(true)
  const [failedScenes, setFailedScenes] = useState({})
  const [ready, setReady] = useState(false)
  const failed = Boolean(failedScenes[active])
  const running = ready && !staticView && !paused && visible && foreground && !limited && !failed
  const staticMotion = limited || failed

  useEffect(() => {
    if (staticView) return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const connection = navigator.connection
    const preferences = () => setLimited(media.matches || Boolean(connection?.saveData) || ['slow-2g', '2g'].includes(connection?.effectiveType) || navigator.hardwareConcurrency <= 2)
    const visibility = () => setForeground(!document.hidden)
    preferences()
    visibility()
    media.addEventListener('change', preferences)
    connection?.addEventListener?.('change', preferences)
    document.addEventListener('visibilitychange', visibility)
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .05 })
    observer.observe(root.current)
    return () => {
      media.removeEventListener('change', preferences)
      connection?.removeEventListener?.('change', preferences)
      document.removeEventListener('visibilitychange', visibility)
      observer.disconnect()
    }
  }, [staticView])

  useEffect(() => {
    if (staticView || limited || !root.current.animate) return
    const node = root.current
    const tracks = []
    const animate = (target, frames, options = {}) => {
      const animation = target.animate(frames, { duration: DURATION, iterations: Infinity, easing: EASE, ...options })
      animation.pause()
      animation.currentTime = selected.current * 8000 + (selected.current ? 1600 : 0)
      tracks.push(animation)
    }
    node.querySelectorAll('.cinema-scene').forEach((scene, i) => {
      animate(scene, dissolve(i).map(frame => ({ ...frame, easing: EASE })), { easing: 'linear' })
      // Distant scenery drifts right; subjects approach left; near arcs move faster.
      animate(scene.querySelector('.cinema-subject'), [
        { transform: 'translate3d(2%, 1%, 0) scale(.94) rotate(-2deg)' },
        { transform: 'translate3d(-3%, -2%, 0) scale(1.08) rotate(2deg)' },
        { transform: 'translate3d(2%, 1%, 0) scale(.94) rotate(-2deg)' },
      ])
    })
    node.querySelectorAll('.cinema-caption').forEach((caption, i) => animate(caption, dissolve(i).map(frame => ({ ...frame, easing: EASE })), { easing: 'linear' }))
    animate(node.querySelector('.cinema-atmosphere'), [
      { transform: 'scale(1.04) translateX(-2%)' },
      { transform: 'scale(1.14) translateX(2%)', opacity: 1 },
      { transform: 'scale(1.04) translateX(-2%)' },
    ])
    animate(node.querySelector('.cinema-near'), [
      { transform: 'translate3d(-7%, 4%, 0) scale(1.03)', opacity: .4 },
      { transform: 'translate3d(7%, -4%, 0) scale(1.14)', opacity: .85 },
      { transform: 'translate3d(-7%, 4%, 0) scale(1.03)', opacity: .4 },
    ])
    // Constant angular velocity is intentional for a physical record.
    animate(node.querySelector('.cinema-record'), [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { easing: 'linear' })
    animations.current = tracks
    setReady(true)
    return () => {
      tracks.forEach(animation => animation.cancel())
      animations.current = []
      setReady(false)
    }
  }, [staticView, limited])

  useEffect(() => {
    const time = animations.current[0]?.currentTime || 0
    animations.current.forEach(animation => {
      if (running) animation.play()
      else {
        animation.pause()
        animation.currentTime = time
      }
    })
    if (!running) return
    // Only updates React at shot boundaries; compositor owns every animation frame.
    const timer = window.setInterval(() => {
      const time = (animations.current[0]?.currentTime || 0) % DURATION
      const index = time >= 39200 ? 0 : Math.min(4, Math.floor(Math.max(0, time - 800) / 8000))
      selected.current = index
      setActive(index)
    }, 200)
    return () => window.clearInterval(timer)
  }, [running])

  function seek(index) {
    const next = (index + scenes.length) % scenes.length
    selected.current = next
    setActive(next)
    animations.current.forEach(animation => { animation.currentTime = next * 8000 + (next ? 1600 : 0) })
  }

  function imageFailed(index) {
    setFailedScenes(previous => previous[index] ? previous : { ...previous, [index]: true })
  }

  return <div ref={root} className={`landing-studio${running ? '' : ' is-paused'}${failed ? ' has-fallback' : ''}`} data-scene={active} data-scene-id={scenes[active].id} data-running={running}>
    <div className="cinema-heading"><span>{t('landing.filmTitle')}</span><span aria-hidden="true">ME / 001</span></div>
    <div className="cinema-frame" aria-hidden="true">
      <img className="cinema-poster" src={poster} width="1000" height="700" alt="" fetchPriority="high" />
        <img className="cinema-atmosphere" src={atmosphere} width="1000" height="700" alt="" />
        {scenes.map(({ id, image, Icon }, i) => <div key={id} id={`cinema-scene-${id}`} data-art={id} className={`cinema-scene${active === i ? ' is-current' : ''}${failedScenes[i] ? ' is-unavailable' : ''}`}>
          {i === 1 && <img className="cinema-record" src={vinyl} width="1000" height="700" alt="" onError={() => imageFailed(i)} />}
          <img className="cinema-subject" src={image} width="1000" height="700" alt="" onError={() => imageFailed(i)} />
          {failedScenes[i] && <div className="cinema-scene-fallback"><Icon size={80} strokeWidth={1} /><span>{t(`landing.film${i}Title`)}</span></div>}
        </div>)}
        <img className="cinema-near" src={glints} width="1000" height="700" alt="" />
      <span className="cinema-frame__corner cinema-frame__corner--a" /><span className="cinema-frame__corner cinema-frame__corner--b" />
    </div>
    <div className="cinema-captions" aria-live="off">
      {scenes.map(({ id }, i) => <div id={`cinema-caption-${id}`} className={`cinema-caption${active === i ? ' is-current' : ''}`} key={id} aria-hidden={active !== i}>
        <span className="cinema-caption__index">0{i + 1}</span><div><strong>{t(`landing.film${i}Title`)}</strong><p>{t(`landing.film${i}Note`)}</p></div>
      </div>)}
    </div>
    <div className="cinema-controls">
      <button type="button" className="landing-motion" disabled={staticView} aria-disabled={staticMotion} aria-pressed={staticMotion || paused} aria-label={t(staticMotion ? 'landing.motionLimited' : paused ? 'landing.resumeMotion' : 'landing.pauseMotion')} onClick={() => { if (!staticMotion) setPaused(value => !value) }}>{paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}</button>
      <div className="landing-studio__steps" role="group" aria-label={t('landing.previewControls')}>
        {scenes.map(({ id }, i) => <button key={id} type="button" disabled={staticView} aria-pressed={active === i} aria-controls={`cinema-scene-${id} cinema-caption-${id}`} title={t(`landing.film${i}Title`)} aria-label={`${String(i + 1).padStart(2, '0')} · ${t(`landing.film${i}Title`)}`} onClick={() => seek(i)}><span>0{i + 1}</span></button>)}
      </div>
      <button type="button" className="cinema-arrow" disabled={staticView} aria-label={t('landing.previousScene')} onClick={() => seek(active - 1)}><ArrowLeft size={16} aria-hidden="true" /></button>
      <button type="button" className="cinema-arrow" disabled={staticView} aria-label={t('landing.nextScene')} onClick={() => seek(active + 1)}><ArrowRight size={16} aria-hidden="true" /></button>
    </div>
    <p className="landing-studio__caption">{t(failed ? 'landing.sceneUnavailable' : limited ? 'landing.staticPreviewNote' : 'landing.previewNote')}</p>
  </div>
}
