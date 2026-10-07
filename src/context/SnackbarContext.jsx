import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import {
    Snackbar
} from "../components/Snackbar.jsx";


const SnackbarContext =
    createContext(null);


export function SnackbarProvider({
    children
}) {

    const [snackbar, setSnackbar] =
        useState(null);


    const counter =
        useRef(0);


    const closeSnackbar =
        useCallback(() => {

            setSnackbar(null);

        }, []);


    const showSnackbar =
        useCallback(
            (
                message,
                {
                    type = "info",
                    duration = 3500
                } = {}
            ) => {

                counter.current += 1;


                setSnackbar({

                    id:
                        counter.current,

                    message,

                    type,

                    duration

                });

            },
            []
        );


    useEffect(() => {

        if (!snackbar) {
            return undefined;
        }


        const timeout =
            window.setTimeout(
                closeSnackbar,
                snackbar.duration
            );


        return () => {

            window.clearTimeout(
                timeout
            );

        };

    }, [
        snackbar,
        closeSnackbar
    ]);


    const value =
        useMemo(
            () => ({

                showSnackbar,

                closeSnackbar,

                success:
                    (
                        message,
                        options
                    ) =>
                        showSnackbar(
                            message,
                            {
                                ...options,
                                type:
                                    "success"
                            }
                        ),

                error:
                    (
                        message,
                        options
                    ) =>
                        showSnackbar(
                            message,
                            {
                                ...options,
                                type:
                                    "error"
                            }
                        ),

                warning:
                    (
                        message,
                        options
                    ) =>
                        showSnackbar(
                            message,
                            {
                                ...options,
                                type:
                                    "warning"
                            }
                        ),

                info:
                    (
                        message,
                        options
                    ) =>
                        showSnackbar(
                            message,
                            {
                                ...options,
                                type:
                                    "info"
                            }
                        )

            }),
            [
                showSnackbar,
                closeSnackbar
            ]
        );


    return (

        <SnackbarContext.Provider
            value={value}
        >

            {children}


            {snackbar && (

                <Snackbar
                    key={snackbar.id}
                    message={
                        snackbar.message
                    }
                    type={
                        snackbar.type
                    }
                    onClose={
                        closeSnackbar
                    }
                />

            )}

        </SnackbarContext.Provider>

    );

}


export function useSnackbar() {

    const context =
        useContext(
            SnackbarContext
        );


    if (!context) {

        throw new Error(
            "useSnackbar debe usarse dentro de SnackbarProvider"
        );

    }


    return context;

}