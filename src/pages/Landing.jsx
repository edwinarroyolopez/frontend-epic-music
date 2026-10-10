import { useEffect, useRef } from 'react'
import { ArrowRight, ArrowUpRight, Search, Sparkles, ListMusic } from 'lucide-react'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { LandingCinema } from '../components/LandingCinema.jsx'
import constellation from '../assets/cinema/constellation.svg'
import affinity from '../assets/cinema/affinity.svg'
import archive from '../assets/cinema/archive.svg'
import '../styles/landing.css'

const steps = ['remember', 'discover', 'keep']
const icons = [Search, Sparkles, ListMusic]

export function Landing({ staticView = false }) {
  const { t } = usePreferences()
  const root = useRef(null)
  useEffect(() => {
    if (staticView || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const reveals = new Set()
    const stop = () => { if (media.matches) reveals.forEach(animation => animation.cancel()) }
    media.addEventListener('change', stop)
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        if (!media.matches && entry.target.animate) {
          const animation = entry.target.animate([{ transform: 'translateY(16px)', opacity: .65 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 900, easing: 'cubic-bezier(.32,.72,0,1)' })
          reveals.add(animation)
          animation.onfinish = () => reveals.delete(animation)
        }
        observer.unobserve(entry.target)
      })
    }, { threshold: .15 })
    root.current.querySelectorAll('.landing-chapter').forEach(node => observer.observe(node))
    return () => { observer.disconnect(); media.removeEventListener('change', stop); reveals.forEach(animation => animation.cancel()) }
  }, [staticView])

  return <div ref={root} className="landing">
    <section className="landing-hero" aria-labelledby="landing-title">
      <div className="landing-hero__copy">
        <p className="landing-eyebrow"><span />{t('landing.eyebrow')}</p>
        <h1 id="landing-title">{t('landing.title')}<em>{t('landing.titleAccent')}</em></h1>
        <p className="landing-hero__description">{t('landing.description')}</p>
        <div className="landing-hero__actions"><a href="#/registro" className="btn btn--primary landing-cta">{t('landing.start')}<ArrowUpRight size={18} aria-hidden="true" /></a></div>
        <p className="landing-hero__note">{t('landing.heroNote')}</p>
        <div className="landing-hero__trail" aria-label={t('landing.valueLabel')}><span>{t('landing.remember')}</span><ArrowRight size={13} aria-hidden="true" /><span>{t('landing.discover')}</span><ArrowRight size={13} aria-hidden="true" /><span>{t('landing.keep')}</span></div>
      </div>
      <LandingCinema staticView={staticView} />
    </section>

    <section className="landing-chapter landing-experience" id="landing-experience" aria-labelledby="landing-experience-title">
      <div className="landing-experience__intro">
        <p className="landing-eyebrow">01 — {t('landing.experienceEyebrow')}</p>
        <h2 id="landing-experience-title">{t('landing.experienceTitle')}<em>{t('landing.experienceAccent')}</em></h2>
        <p>{t('landing.experienceDescription')}</p>
        <div className="landing-chapter-art" aria-hidden="true"><img src={constellation} width="1000" height="700" loading="lazy" alt="" /></div>
      </div>
      <ol className="landing-features">
        {steps.map((name, index) => {
          const Icon = icons[index]
          return <li key={name} className="landing-feature"><Icon size={21} strokeWidth={1.4} aria-hidden="true" /><div><h3>{t(`landing.${name}Title`)}</h3><p>{t(`landing.${name}Description`)}</p><span className="landing-feature__detail">{t(`landing.${name}Detail`)}</span></div></li>
        })}
      </ol>
    </section>

    <section className="landing-chapter landing-affinity" aria-labelledby="landing-affinity-title">
      <div className="landing-affinity__art" aria-hidden="true"><img src={affinity} width="1000" height="700" loading="lazy" alt="" /></div>
      <div><p className="landing-eyebrow">02 — {t('landing.affinityEyebrow')}</p><h2 id="landing-affinity-title">{t('landing.affinityTitle')}</h2><p>{t('landing.affinityDescription')}</p><span className="landing-availability">{t('landing.affinityAvailability')}</span></div>
    </section>

    <section className="landing-faq" aria-labelledby="landing-faq-title">
      <div><p className="landing-eyebrow">{t('landing.faqEyebrow')}</p><h2 id="landing-faq-title">{t('landing.faqTitle')}</h2><p>{t('landing.faqIntro')}</p></div>
      <div className="landing-faq__questions">
        {['Phrase', 'Identify', 'Related', 'Analysis', 'Personality', 'Save', 'Links'].map(topic => <details key={topic}><summary>{t(`landing.faq${topic}Q`)}</summary><p>{t(`landing.faq${topic}A`)}</p></details>)}
      </div>
    </section>

    <section className="landing-chapter landing-invitation" aria-labelledby="landing-invitation-title">
      <div className="landing-invitation__art" aria-hidden="true"><img src={archive} width="1000" height="700" loading="lazy" alt="" /></div>
      <div className="landing-invitation__copy"><p className="landing-eyebrow">03 — {t('landing.invitationEyebrow')}</p><h2 id="landing-invitation-title">{t('landing.invitationTitle')}<em>{t('landing.invitationAccent')}</em></h2><p>{t('landing.invitationDescription')}</p><a href="#/registro" className="btn btn--primary landing-cta">{t('landing.start')}<ArrowRight size={17} aria-hidden="true" /></a><a href="#/login" className="landing-text-link">{t('landing.haveAccount')}<ArrowUpRight size={14} aria-hidden="true" /></a></div>
    </section>
  </div>
}
