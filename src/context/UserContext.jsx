import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { fetchMe, getToken, logout as logoutRemoto } from '../services/auth.js'

const UserContext = createContext(null)

/**
 * Datos del usuario.
 *
 * displayName  -> nombre visible, puede repetirse y llevar espacios.
 * username     -> identificador unico de la cuenta (sin "@", se muestra con "@").
 * profilePicture -> foto (data URL) o null.
 * bio / pronouns -> datos opcionales del perfil.
 *
 * displayName y username son cosas distintas a proposito: no se mezclan.
 */
const DEFAULT_USER = {
  displayName: 'Samantha',
  username: 'samantha',
  profilePicture: null,
  bio: '',
  pronouns: '',
  email: 'samantha@musicaepica.app',
  provider: 'demo',
  createdAt: '2024-11-03T10:00:00.000Z',
  isAuthenticated: true,
}

const MAX_PHOTO_BYTES = 1024 * 1024 // 1 MB: suficiente y evita localStorage enorme

/**
 * Normaliza la sesion guardada. Las sesiones anteriores usaban `name` y
 * `photo`; se migran al shape actual sin perder la foto ya elegida.
 */
function readUser(stored) {
  if (!stored) return null
  const { name, photo, ...actual } = stored
  return {
    ...DEFAULT_USER,
    ...actual,
    displayName: actual.displayName ?? name ?? DEFAULT_USER.displayName,
    profilePicture: actual.profilePicture ?? photo ?? null,
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('FILE_READ_ERROR'))
    reader.readAsDataURL(file)
  })
}

/**
 * Valida y lee una imagen sin guardarla todavia. Lo usa el editor de perfil
 * para previsualizar el cambio antes de pulsar "Guardar".
 * @returns {Promise<{ok: true, dataUrl: string} | {ok: false, error: string}>}
 */
export async function readPhotoFile(file) {
  if (!file) return { ok: false, error: 'NO_FILE' }
  if (!file.type.startsWith('image/')) return { ok: false, error: 'INVALID_TYPE' }
  if (file.size > MAX_PHOTO_BYTES) return { ok: false, error: 'TOO_LARGE' }
  try {
    return { ok: true, dataUrl: await readFileAsDataUrl(file) }
  } catch {
    return { ok: false, error: 'FILE_READ_ERROR' }
  }
}

/**
 * Sesion del usuario. En esta version es local (localStorage): cuando exista
 * autenticacion real y un endpoint de perfil, este mismo contexto es el punto
 * unico a sustituir.
 */
export function UserProvider({
  children
}) {

  const [user, setUser] =
    useLocalStorage(
      "me:user",
      null
    );


  const [sessionChecking, setSessionChecking] =
    useState(
      Boolean(getToken())
    );


  // ===============================================
  // RESTAURAR SESIÓN AL CARGAR
  // ===============================================

  useEffect(() => {

    const token =
      getToken();


    // Sin JWT no existe una sesión real.
    // Exceptuamos demo si quieres conservarlo.

    if (!token) return;


    let mounted = true;


    const restoreSession =
      async () => {

        try {

          const account =
            await fetchMe();


          if (!mounted || getToken() !== token) {
            return;
          }


          if (!account) {

            setUser(null);

            return;

          }


          setUser({
            ...account,
            isAuthenticated: true
          });


        } catch {

          if (mounted && getToken() === token) {

            logoutRemoto();

            setUser(null);

          }

        } finally {

          if (mounted) {

            setSessionChecking(
              false
            );

          }

        }

      };


    restoreSession();


    return () => {

      mounted = false;

    };

  }, [setUser]);

  useEffect(() => {
    const expired = () => setUser(null);
    window.addEventListener('auth:expired', expired);
    const storage = event => {
      if (event.key === 'me:token') setUser(null);
    };
    window.addEventListener('storage', storage);
    return () => {
      window.removeEventListener('auth:expired', expired);
      window.removeEventListener('storage', storage);
    };
  }, [setUser]);


  // ===============================================
  // LOGIN REAL
  // ===============================================

  const adoptUser =
    useCallback(
      (account) => {

        if (!account) {
          return;
        }


        setUser({

          ...account,

          isAuthenticated:
            true

        });

      },
      [setUser]
    );


  // ===============================================
  // LOGOUT
  // ===============================================

  const signOut =
    useCallback(() => {

      logoutRemoto();

      setUser(null);

    }, [setUser]);


  // ===============================================
  // DEMO
  // ===============================================

  const signInDemo =
    useCallback(() => {
      logoutRemoto();
      setUser({
        ...DEFAULT_USER,
        isAuthenticated: true
      });

    }, [setUser]);


  // ===============================================
  // PERFIL
  // ===============================================

  const updateProfile =
    useCallback(
      (changes) => {

        setUser(
          (current) =>
            current
              ? {
                ...current,
                ...changes
              }
              : current
        );

      },
      [setUser]
    );


  const setPhoto =
    useCallback(
      async (file) => {

        const result =
          await readPhotoFile(
            file
          );


        if (!result.ok) {
          return result;
        }


        updateProfile({
          profilePicture:
            result.dataUrl
        });


        return {
          ok: true
        };

      },
      [updateProfile]
    );


  const removePhoto =
    useCallback(
      () => {

        updateProfile({
          profilePicture: null
        });

      },
      [updateProfile]
    );


  // ===============================================
  // CONTEXT
  // ===============================================

  const value =
    useMemo(
      () => ({

        user:
          readUser(user),

        isAuthenticated:
          Boolean(user && (user.provider === 'demo' || getToken())),

        canUsePlaylists: Boolean(user && user.provider !== 'demo' && user.active !== false && getToken() && !sessionChecking),

        sessionChecking,

        signInDemo,

        signOut,

        adoptUser,

        updateProfile,

        setPhoto,

        removePhoto

      }),
      [
        user,
        sessionChecking,
        signInDemo,
        signOut,
        adoptUser,
        updateProfile,
        setPhoto,
        removePhoto
      ]
    );


  return (

    <UserContext.Provider
      value={value}
    >

      {children}

    </UserContext.Provider>

  );

}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser debe usarse dentro de UserProvider')
  return context
}
