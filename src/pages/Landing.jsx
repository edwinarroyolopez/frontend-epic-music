import { useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, AudioLines, Check, Disc3, Headphones, ListMusic, Minus, Pause, Play, Plus, Search, Sparkles } from 'lucide-react'
import { usePreferences } from '../context/PreferencesContext.jsx'
import '../styles/landing.css'

const steps = ['remember', 'discover', 'keep']
const icons = [Search, Sparkles, ListMusic]

export function Landing({ staticView = false }) {
  const { t } = usePreferences()
  const [step, setStep] = useState(0)
  const [paused, setPaused] = useState(false)
  const explore = () => {
    const section = document.getElementById('landing-experience')
    section?.focus({ preventScroll: true })
    section?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
  }
  return <div className="landing">
    <section className="landing-hero" aria-labelledby="landing-title">
      <div className="landing-hero__copy">
        <p className="landing-eyebrow"><span />{t('landing.eyebrow')}</p>
        <h1 id="landing-title">{t('landing.title')}<em>{t('landing.titleAccent')}</em></h1>
        <p className="landing-hero__description">{t('landing.description')}</p>
        <div className="landing-hero__actions">
          <a href="#/registro" className="btn btn--primary landing-cta">{t('landing.start')}<ArrowUpRight size={18} aria-hidden="true" /></a>
          <button type="button" disabled={staticView} className="landing-text-link" onClick={explore}>{t('landing.explore')}<ArrowDown size={15} aria-hidden="true" /></button>
        </div>
        <p className="landing-hero__note"><Headphones size={15} aria-hidden="true" />{t('landing.heroNote')}</p>
      </div>

      <div className={`landing-studio${paused ? ' is-paused' : ''}`}>
        <div className="landing-studio__top">
          <span><AudioLines size={16} aria-hidden="true" />{t('landing.studioLabel')}</span>
          <button type="button" disabled={staticView} className="landing-motion" aria-label={t(paused ? 'landing.resumeMotion' : 'landing.pauseMotion')} title={t(paused ? 'landing.resumeMotion' : 'landing.pauseMotion')} onClick={() => setPaused(value => !value)}>
            {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
          </button>
        </div>
        <div className="landing-art" aria-hidden="true">
          <div className="landing-art__halo" />
          <div className="landing-vinyl"><span /><i /></div>
          <div className="landing-sleeve">
            <span className="landing-sleeve__edition">ÉPICA — VOL. 01</span>
            <div className="landing-sleeve__sun" />
            <div className="landing-sleeve__landscape"><i /><i /><i /><i /></div>
            <div className="landing-sleeve__bottom"><span>{t('landing.artTitle')}</span><Disc3 size={22} strokeWidth={1} /></div>
          </div>
          <span className="landing-art__index">33⅓<br />SIDE A</span>
        </div>

        <div className="landing-preview" aria-live="polite" aria-atomic="true">
          <div key={step} className="landing-preview__scene">
            <div className="landing-preview__label"><span className="landing-status-dot" />{t(`landing.${steps[step]}Label`)}<span>0{step + 1} / 03</span></div>
            {step === 0 && <>
              <p className="landing-preview__quote">“{t('landing.sampleFragment')}”</p>
              <div className="landing-preview__foot"><span>{t('landing.fragmentCaption')}</span><div className="landing-wave" aria-hidden="true">{[7, 15, 10, 21, 13, 18, 8].map((height, index) => <i key={index} style={{ '--bar-height': `${height}px`, '--bar-delay': `${index * -.21}s` }} />)}</div></div>
            </>}
            {step === 1 && <div className="landing-preview__tracks">
              {[0, 1].map(index => <div key={index} className="landing-preview__track"><span className={`landing-mini-art landing-mini-art--${index}`} aria-hidden="true"><AudioLines size={17} /></span><div><strong>{t(index ? 'landing.sampleRelated' : 'landing.sampleTitle')}</strong><span>{t(index ? 'landing.relatedCaption' : 'landing.originCaption')}</span></div><ArrowUpRight size={16} aria-hidden="true" /></div>)}
            </div>}
            {step === 2 && <div className="landing-preview__collection"><div className="landing-collection-art" aria-hidden="true"><span /><span /><span><ListMusic size={24} /></span></div><div><strong>{t('landing.sampleCollection')}</strong><p>{t('landing.collectionCaption')}</p><span className="landing-saved"><Check size={13} aria-hidden="true" />{t('landing.savedCaption')}</span></div></div>}
          </div>
        </div>
        <div className="landing-studio__steps" role="group" aria-label={t('landing.previewControls')}>
          {steps.map((name, index) => <button key={name} type="button" disabled={staticView} aria-pressed={step === index} onClick={() => setStep(index)}><span>0{index + 1}</span>{t(`landing.${name}`)}</button>)}
        </div>
        <p className="landing-studio__caption">{t('landing.previewNote')}</p>
      </div>
    </section>

    <section className="landing-values" aria-label={t('landing.valueLabel')}>
      <div><span className="landing-values__number">01</span><p><strong>{t('landing.valueOne')}</strong><span>{t('landing.valueOneNote')}</span></p></div>
      <div><span className="landing-values__number">11</span><p><strong>{t('landing.valueTwo')}</strong><span>{t('landing.valueTwoNote')}</span></p></div>
      <div><Disc3 size={26} strokeWidth={1} aria-hidden="true" /><p><strong>{t('landing.valueThree')}</strong><span>{t('landing.valueThreeNote')}</span></p></div>
    </section>

    <section className="landing-experience" id="landing-experience" tabIndex={-1} aria-labelledby="landing-experience-title">
      <div className="landing-experience__intro">
        <p className="landing-eyebrow"><span />{t('landing.experienceEyebrow')}</p>
        <h2 id="landing-experience-title">{t('landing.experienceTitle')}<em>{t('landing.experienceAccent')}</em></h2>
        <p>{t('landing.experienceDescription')}</p>
        <div className="landing-journey" aria-hidden="true"><Search size={19} strokeWidth={1.4} /><span /><Sparkles size={21} strokeWidth={1.4} /><span /><ListMusic size={21} strokeWidth={1.4} /></div>
      </div>
      <div className="landing-features">
        {steps.map((name, index) => {
          const Icon = icons[index]
          return <div key={name} className={`landing-feature${step === index ? ' is-active' : ''}`}>
            <h3><button type="button" disabled={staticView} aria-expanded={staticView || step === index} aria-controls={`landing-feature-${name}`} onClick={() => setStep(index)}><span className="landing-feature__number">0{index + 1}</span><span>{t(`landing.${name}Title`)}</span>{step === index ? <Minus size={17} aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}</button></h3>
            <div id={`landing-feature-${name}`} hidden={step !== index} className="landing-feature__body"><p>{t(`landing.${name}Description`)}</p><span className="landing-feature__detail"><Icon size={15} aria-hidden="true" />{t(`landing.${name}Detail`)}</span></div>
          </div>
        })}
      </div>
    </section>

    <section className="landing-faq" aria-labelledby="landing-faq-title">
      <h2 id="landing-faq-title">{t('landing.faqTitle')}</h2>
      <p>{t('landing.faqIntro')}</p>
      <div className="landing-faq__questions">
        {['Phrase', 'Identify', 'Related', 'Analysis', 'Personality', 'Save', 'Links'].map(topic =>
          <details key={topic}>
            <summary>{t(`landing.faq${topic}Q`)}</summary>
            <p>{t(`landing.faq${topic}A`)}</p>
          </details>,
        )}
      </div>
    </section>

    <section className="landing-invitation" aria-labelledby="landing-invitation-title">
      <div className="landing-invitation__ornament" aria-hidden="true"><Disc3 strokeWidth={.3} /></div>
      <p className="landing-eyebrow">{t('landing.invitationEyebrow')}</p>
      <h2 id="landing-invitation-title">{t('landing.invitationTitle')}<em>{t('landing.invitationAccent')}</em></h2>
      <p>{t('landing.invitationDescription')}</p>
      <a href="#/registro" className="btn btn--primary landing-cta">{t('landing.createAccount')}<ArrowRight size={17} aria-hidden="true" /></a>
      <a href="#/login" className="landing-text-link">{t('landing.haveAccount')}<ArrowUpRight size={14} aria-hidden="true" /></a>
    </section>
  </div>
}
