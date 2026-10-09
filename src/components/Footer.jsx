import { Disc3 } from 'lucide-react'
import { usePreferences } from '../context/PreferencesContext.jsx'

/** Pie de pagina: identifica el estado de la version actual. */
export function Footer({ publicView = false }) {
  const { t } = usePreferences()

  return (
    <footer className="footer">
      <div className="footer__inner">
        <span className="footer__brand">
          <Disc3 size={16} aria-hidden="true" />
          {t('app.name')}
        </span>
        <p className="footer__note">{t(publicView ? 'landing.footerNote' : 'footer.note')}</p>
        <p className="footer__note text-xs">{t(publicView ? 'landing.footerDetail' : 'footer.protected')}</p>
      </div>
    </footer>
  )
}
