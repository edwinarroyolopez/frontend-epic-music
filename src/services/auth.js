import { API_CONFIG } from "./config.js";

const TOKEN_KEY = "me:token";


// ======================================================
// ERROR DE AUTENTICACIÓN
// ======================================================

export class AuthError extends Error {

  constructor(
    message,
    {
      code = "AUTH_ERROR",
      status = 0,
      detail = ""
    } = {}
  ) {

    super(message);

    this.name = "AuthError";
    this.code = code;
    this.status = status;
    this.detail = detail;
  }

}


// ======================================================
// TOKEN
// ======================================================

export function getToken() {

  try {

    return (
      window.localStorage.getItem(TOKEN_KEY) ||
      null
    );

  } catch {

    return null;

  }

}


export function setToken(token) {

  try {

    if (token) {

      window.localStorage.setItem(
        TOKEN_KEY,
        token
      );

    } else {

      window.localStorage.removeItem(
        TOKEN_KEY
      );

    }

  } catch {

    // Si localStorage no está disponible,
    // la sesión no se podrá persistir.

  }

}


// ======================================================
// NORMALIZAR USUARIO BACKEND → FRONTEND
// ======================================================

function normalizeUser(user) {

  if (!user) {
    return null;
  }

  return {

    id:
      user.id ??
      user._id ??
      null,

    displayName:
      user.name ??
      user.displayName ??
      "",

    username:
      user.username ??
      "",

    email:
      user.email ??
      "",

    phone:
      user.phone ??
      "",

    active:
      user.active !== false,

    profilePicture:
      user.profilePicture ??
      null,

    bio:
      user.bio ??
      "",

    pronouns:
      user.pronouns ??
      "",

    provider: "email",

    createdAt:
      user.createdAt ??
      null,

    isAuthenticated: true
  };

}


// ======================================================
// CÓDIGOS DE ERROR
// ======================================================

function errorCodeForStatus(status) {

  switch (status) {

    case 400:
      return "VALIDATION_ERROR";

    case 401:
      return "INVALID_CREDENTIALS";

    case 403:
      return "ACCOUNT_DISABLED";

    case 404:
      return "NOT_FOUND";

    case 409:
      return "USER_ALREADY_EXISTS";

    case 500:
    case 502:
    case 503:
    case 504:
      return "SERVER_ERROR";

    default:
      return "API_ERROR";

  }

}


// ======================================================
// REQUEST
// ======================================================

async function request(
  path,
  {
    method = "GET",
    body,
    auth = true
  } = {}
) {

  // A public GET without a body must not trigger an unnecessary JSON preflight.
  const headers = body === undefined ? {} : { "Content-Type": "application/json" };


  const token = getToken();


  if (auth && token) {

    headers.Authorization =
      `Bearer ${token}`;

  }


  let response;


  try {

    response = await fetch(
      `${API_CONFIG.baseUrl}${path}`,
      {
        method,
        headers,

        body:
          body
            ? JSON.stringify(body)
            : undefined
      }
    );

  } catch {

    throw new AuthError(
      "No se pudo conectar con el servidor",
      {
        code: "NETWORK_ERROR"
      }
    );

  }


  let data = {};


  try {

    const text =
      await response.text();

    data =
      text
        ? JSON.parse(text)
        : {};

  } catch {

    data = {};

  }


  if (!response.ok) {

    // Token inválido o expirado
    if (
      response.status === 401 &&
      auth
    ) {

      setToken(null);

    }


    throw new AuthError(
      data.message ||
      data.error ||
      "Error procesando la solicitud",
      {
        code:
          data.code || data.error?.code || errorCodeForStatus(
            response.status
          ),

        status:
          response.status,

        detail:
          data.message ||
          data.error ||
          data.detail ||
          ""
      }
    );

  }


  return data;
}


// ======================================================
// REGISTRO
// ======================================================

export async function registerWithEmail({
  username,
  email,
  phone,
  password,
  displayName
}) {

  const data = await request(
    "/auth/signup",
    {
      method: "POST",
      auth: false,

      body: {
        username,
        name: displayName,
        phone,
        email,
        password
      }
    }
  );


  if (!data.token) {

    throw new AuthError(
      "El servidor no devolvió un token",
      {
        code: "TOKEN_MISSING"
      }
    );

  }


  setToken(data.token);


  return normalizeUser(
    data.user
  );

}


// ======================================================
// LOGIN
// ======================================================

export async function loginWithEmail({
  email,
  password
}) {

  const data = await request(
    "/auth/login",
    {
      method: "POST",
      auth: false,

      body: {
        email,
        password
      }
    }
  );


  if (!data.token) {

    throw new AuthError(
      "El servidor no devolvió un token",
      {
        code: "TOKEN_MISSING"
      }
    );

  }


  setToken(data.token);


  return normalizeUser(
    data.user
  );

}


// ======================================================
// RESTAURAR SESIÓN
// ======================================================

export async function fetchMe() {

  if (!getToken()) {
    return null;
  }


  try {

    const data =
      await request(
        "/auth/me"
      );


    return normalizeUser(
      data.user
    );


  } catch (error) {

    if (
      error.status === 401 ||
      error.status === 403
    ) {

      setToken(null);

      return null;

    }


    throw error;

  }

}


// ======================================================
// LOGOUT
// ======================================================

export function logout() {

  setToken(null);

}


// ======================================================
// MENSAJE PARA EL USUARIO
// ======================================================

export function describeAuthError(
  error,
  t
) {

  switch (error?.code) {

    case "NETWORK_ERROR":

      return t(
        "login.errors.network"
      );


    case "VALIDATION_ERROR":

      return t(
        "login.errors.validation"
      );


    case "INVALID_CREDENTIALS":

      return t(
        "login.errors.credentials"
      );


    case "ACCOUNT_DISABLED":

      return t(
        "login.errors.disabled"
      );


    case "USER_ALREADY_EXISTS":

      return t(
        "login.errors.exists"
      );


    case "TOKEN_MISSING":

      return t(
        "login.errors.session"
      );


    case "SERVER_ERROR":

      return t(
        "login.errors.server"
      );

    case 'AUTH_UNAVAILABLE':
      return t('login.errors.unavailable');


    default:

      return t(
        "login.errorGeneric"
      );

  }

}



/** URL de inicio de sesion de Apple (redirige el navegador al proveedor). */
export async function getAppleSignInUrl() {
  const datos = await request('/auth/apple/start', { auth: false })
  return datos.url
}

/**
 * Apple devuelve al navegador con el token en la query del hash
 * (por ejemplo #/?token=...). Se recoge, se guarda y se limpia la URL.
 * @returns {Promise<{token?: string, error?: string}>}
 */
export async function readAppleReturn() {
  const hash = window.location.hash.replace(/^#/, '')
  const query = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
  if (!query) return {}

  const params = new URLSearchParams(query)
  const token = params.get('token')
  const error = params.get('error')
  if (!token && !error) return {}

  // La app vuelve a su estado normal (#/), sin los parametros de la respuesta.
  window.history.replaceState(null, '', `${window.location.pathname}#/`)

  if (error) return { error }
  setToken(token)
  return { token }
}


/** Que metodos estan disponibles ahora mismo en el backend. */
export async function getProviders() {
  const datos = await request('/auth/providers', { auth: false })
  return {
    email: Boolean(datos.email),
    emailUnavailableReason: datos.emailUnavailableReason ?? null,
    apple: Boolean(datos.apple),
    google: Boolean(datos.google),
    spotify: Boolean(datos.spotify),
  }
}
