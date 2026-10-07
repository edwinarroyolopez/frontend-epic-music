import {
    AlertCircle,
    CheckCircle2,
    Info,
    TriangleAlert,
    X
} from "lucide-react";


const ICONS = {

    success: CheckCircle2,

    error: AlertCircle,

    warning: TriangleAlert,

    info: Info

};


export function Snackbar({
    message,
    type = "info",
    onClose
}) {

    if (!message) {
        return null;
    }


    const Icon =
        ICONS[type] ??
        Info;


    return (

        <div
            className={
                `snackbar snackbar--${type}`
            }
            role={
                type === "error"
                    ? "alert"
                    : "status"
            }
            aria-live={
                type === "error"
                    ? "assertive"
                    : "polite"
            }
        >

            <span
                className="snackbar__icon"
                aria-hidden="true"
            >

                <Icon size={20} />

            </span>


            <p className="snackbar__message">

                {message}

            </p>


            <button
                type="button"
                className="snackbar__close"
                onClick={onClose}
                aria-label="Cerrar"
            >

                <X size={18} />

            </button>

        </div>

    );

}