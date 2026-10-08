import { LoaderCircle } from 'lucide-react'

/** Botón universal compatible con las clases .btn actuales. */
export function Button({
    ref,
    children,
    type = 'button',
    variant = 'primary',
    icon: Icon,
    iconPosition = 'left',
    loading = false,
    loadingLabel,
    block = false,
    disabled = false,
    className = '',
    ...props
}) {
    const classes = variant === 'unstyled'
        ? className
        : ['btn', `btn--${variant}`, block && 'btn--block', className].filter(Boolean).join(' ')

    const contentIcon = Icon && (typeof Icon === 'function' || typeof Icon === 'object' && !('props' in Icon))
        ? <Icon size={16} aria-hidden="true" />
        : Icon

    return (
        <button
            {...props}
            ref={ref}
            type={type}
            className={classes}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
        >
            {loading ? (
                <LoaderCircle size={16} className="ui-button-spinner" aria-hidden="true" />
            ) : iconPosition === 'left' ? contentIcon : null}
            <span className="ui-button-content">{loading && loadingLabel ? loadingLabel : children}</span>
            {!loading && iconPosition === 'right' && contentIcon}
        </button>
    )
}
