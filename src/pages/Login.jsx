import { useEffect, useState } from 'react'
import { AlertCircle, ArrowRight, Check, KeyRound, LogIn, Mail, Phone, ShieldAlert, User, UserPlus, AtSign } from 'lucide-react'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { useUser } from '../context/UserContext.jsx'
import { useSnackbar } from '../context/SnackbarContext.jsx'
import { AuthError, getProviders, loginWithEmail, readAppleReturn, registerWithEmail, describeAuthError } from '../services/auth.js'
import { AppleMusicIcon } from '../components/BrandIcons.jsx'
import { Button, Input } from '../components/ui/index.js'

export function Login({ onSignedIn, initialMode = 'login' }) {
  const { t, language } = usePreferences()
  const { adoptUser } = useUser()
  const snackbar = useSnackbar()
  const [modo, setModo] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const [pendiente, setPendiente] = useState(null)
  const [proveedores, setProveedores] = useState({ email: true, apple: false, google: false, spotify: false })

  useEffect(() => {
    let vivo = true
    getProviders()
      .then((estado) => { if (vivo) setProveedores(estado) })
      .catch(() => { if (vivo) setProveedores({ email: true, apple: false, google: false, spotify: false }) })
    return () => { vivo = false }
  }, [])

  useEffect(() => {
    let vivo = true
    readAppleReturn().then((resultado) => {
      if (vivo && resultado.token) window.location.reload()
    })
    return () => { vivo = false }
  }, [])

  const entrar = async (event) => {
    event.preventDefault()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !password || (modo === 'registro' && (!displayName.trim() || !username.trim() || !phone.trim()))) {
      snackbar.error(t('login.errors.required'))
      return
    }
    if (modo === 'registro' && password.length < 8) {
      snackbar.error(t('login.errors.passwordLength'))
      return
    }
    setEnviando(true)
    setError(null)
    try {
      const usuario = modo === 'registro'
        ? await registerWithEmail({
          email: cleanEmail,
          phone: phone.trim(),
          password,
          displayName: displayName.trim(),
          username: username.trim().toLowerCase(),
        })
        : await loginWithEmail({ email: cleanEmail, password })
      adoptUser(usuario)
      snackbar.success(t(modo === 'registro' ? 'login.registerSuccess' : 'login.loginSuccess'))
      onSignedIn?.()
    } catch (fallo) {
      console.error('Auth error:', fallo)
      snackbar.error(fallo instanceof AuthError ? describeAuthError(fallo, t) : t('login.errorGeneric'), { duration: 5000 })
    } finally {
      setEnviando(false)
    }
  }

  const pendienteDe = (proveedor) => {
    setError(null)
    setPendiente(proveedor)
  }

  const isRegister = modo === 'registro'
  const visibilityLabels = language === 'en'
    ? { showPasswordLabel: 'Show password', hidePasswordLabel: 'Hide password' }
    : { showPasswordLabel: 'Mostrar contraseña', hidePasswordLabel: 'Ocultar contraseña' }

  return (
    <div className="login">
      <section className="login__card card card--padded">
        <div className="login__head">
          <span className="login__mark" aria-hidden="true"><span className="login__disc" /></span>
          <h1 className="login__title">{t('login.title')}</h1>
          <p className="login__subtitle">{t('login.subtitle')}</p>
        </div>

        <form className="login__form stack stack--3" onSubmit={entrar} noValidate>
          {!proveedores.email && <p className="login__error" role="alert">{t('login.errors.unavailable')}</p>}
          <div className="row row--wrap login__tabs" role="group" aria-label={t('login.title')}>
            <Button variant="unstyled" icon={LogIn} aria-pressed={!isRegister}
              className={`login__tab${!isRegister ? ' is-active' : ''}`}
              onClick={() => { setModo('login'); setError(null) }}>
              {t('login.tabLogin')}
            </Button>
            <Button variant="unstyled" icon={UserPlus} aria-pressed={isRegister}
              className={`login__tab${isRegister ? ' is-active' : ''}`}
              onClick={() => { setModo('registro'); setError(null) }}>
              {t('login.tabRegister')}
            </Button>
          </div>

          {isRegister && (
            <>
              <Input id="auth-name" label={t('profile.displayName')} icon={User}
                value={displayName} required autoComplete="name" placeholder="Sam"
                onChange={(e) => setDisplayName(e.target.value)} />
              <Input id="auth-username" label={t('profile.username')} icon={AtSign}
                value={username} required autoComplete="username" autoCapitalize="none" spellCheck={false}
                placeholder="sam_rivers" onChange={(e) => setUsername(e.target.value.toLowerCase())} />
            </>
          )}

          <Input id="auth-email" label={t('profile.email')} type="email" icon={Mail}
            value={email} required autoComplete="email" placeholder="tu@correo.com"
            onChange={(e) => setEmail(e.target.value)} />

          {isRegister && (
            <Input id="auth-phone" label={t('profile.phone')} icon={Phone}
              type="tel" value={phone} required autoComplete="tel" placeholder="3016443223"
              onChange={(e) => setPhone(e.target.value)} />
          )}

          <Input id="auth-password" label={t('login.password')} type="password" icon={KeyRound}
            value={password} required minLength={isRegister ? 8 : undefined}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            placeholder="••••••••" hint={isRegister ? t('login.passwordHint') : undefined}
            onChange={(e) => setPassword(e.target.value)} {...visibilityLabels} />

          {error && <p className="login__error" role="alert"><AlertCircle size={15} aria-hidden="true" />{error}</p>}

          <Button type="submit" variant="primary" block loading={enviando}
            disabled={!proveedores.email}
            loadingLabel={t('login.working')} icon={ArrowRight} iconPosition="right">
            {isRegister ? t('login.createAccount') : t('login.tabLogin')}
          </Button>
        </form>

        <div className="login__divider" aria-hidden="true"><span>{t('login.or')}</span></div>
        {!proveedores.apple && !proveedores.google && !proveedores.spotify ?
          <p className="login__providers-note text-muted text-sm">Apple · Google · Spotify — {t('login.pending')}</p> : <div className="login__providers">
          <Button variant="provider" icon={AppleMusicIcon} disabled={!proveedores.apple}
            onClick={() => pendienteDe('Apple')}>
            {t('login.withApple')}
            {proveedores.apple ? <Check size={15} className="login__ok" /> : <span className="login__tag">{t('login.pending')}</span>}
          </Button>
          <Button variant="provider" icon={Mail} disabled={!proveedores.google}
            onClick={() => pendienteDe('Google')}>
            {t('login.withGoogle')}
            {proveedores.google ? <Check size={15} className="login__ok" /> : <span className="login__tag">{t('login.pending')}</span>}
          </Button>
          <Button variant="provider" icon={Mail} disabled={!proveedores.spotify}
            onClick={() => pendienteDe('Spotify')}>
            {t('login.withSpotify')}
            {proveedores.spotify ? <Check size={15} className="login__ok" /> : <span className="login__tag">{t('login.pending')}</span>}
          </Button>
        </div>}

        {pendiente && <div className="login__notice login__notice--info" role="status">
          <ShieldAlert size={15} aria-hidden="true" />
          <span>{t(`login.pendiente_${pendiente}`)}</span>
        </div>}
        <p className="login__legal">{t('login.providersNote')}</p>
      </section>
    </div>
  )
}
