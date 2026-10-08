
import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { usePreferences } from '../../context/PreferencesContext.jsx'

export function Input({
    id,
    ref,
    label,
    hint,
    error,
    icon: Icon,
    type = 'text',
    showPasswordToggle = true,
    showPasswordLabel,
    hidePasswordLabel,
    className = '',
    wrapperClassName = '',
    required = false,
    disabled = false,
    'aria-describedby': describedBy,
    'aria-label': ariaLabel,
    ...props
}) {
    const { t } = usePreferences()

    const generatedId = useId()
    const inputId = id ?? generatedId

    const hintId = hint ? `${inputId}-hint` : undefined
    const errorId = error ? `${inputId}-error` : undefined

    const descriptionIds = [
        describedBy,
        hintId,
        errorId
    ].filter(Boolean).join(' ') || undefined

    const isPassword = type === 'password'
    const [visible, setVisible] = useState(false)

    const actualType = isPassword && visible ? 'text' : type

    const showLabel =
        showPasswordLabel ?? t('common.showPassword')

    const hideLabel =
        hidePasswordLabel ?? t('common.hidePassword')

    const leadingIcon = Icon
        ? typeof Icon === 'function' ||
            (typeof Icon === 'object' && !('props' in Icon))
            ? <Icon size={18} aria-hidden="true" />
            : Icon
        : null

    return (
        <div className={`field ${wrapperClassName}`.trim()}>
            {label && (
                <label className="field__label" htmlFor={inputId}>
                    {label}
                    {required && <span aria-hidden="true"> *</span>}
                </label>
            )}

            <div className="ui-input-wrap">
                {leadingIcon && (
                    <span className="ui-input-icon" aria-hidden="true">
                        {leadingIcon}
                    </span>
                )}

                <input
                    {...props}
                    ref={ref}
                    id={inputId}
                    type={actualType}
                    required={required}
                    disabled={disabled}
                    aria-label={ariaLabel}
                    aria-invalid={Boolean(error)}
                    aria-describedby={descriptionIds}
                    className={[
                        'input',
                        leadingIcon && 'ui-input-has-icon',
                        isPassword && showPasswordToggle && 'ui-input-has-action',
                        error && 'ui-input-invalid',
                        className
                    ].filter(Boolean).join(' ')}
                />

                {isPassword && showPasswordToggle && (
                    <button
                        type="button"
                        className="ui-input-toggle"
                        onClick={() => setVisible(value => !value)}
                        disabled={disabled}
                        aria-label={visible ? hideLabel : showLabel}
                        title={visible ? hideLabel : showLabel}
                        aria-pressed={visible}
                        aria-controls={inputId}
                    >
                        {visible
                            ? <EyeOff size={18} aria-hidden="true" />
                            : <Eye size={18} aria-hidden="true" />
                        }
                    </button>
                )}
            </div>

            {hint && (
                <p className="field__hint" id={hintId}>
                    {hint}
                </p>
            )}

            {error && (
                <p className="field__error" id={errorId} role="alert">
                    {error}
                </p>
            )}
        </div>
    )
}
