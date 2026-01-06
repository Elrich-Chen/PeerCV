export const DEFAULT_API_URL = "http://localhost:8000";
const TOKEN_KEY = "authToken";
const USER_KEY = "authUser";
const AUTH_EVENT = "auth-changed";

export const normalizeUrl = (value = "") => value.trim().replace(/\/+$/, "");

const isBrowser = () => typeof window !== "undefined";

export const getToken = () => {
  if (!isBrowser()) {
    return "";
  }
  return window.localStorage.getItem(TOKEN_KEY) || "";
};

export const getAuthUser = () => {
  if (!isBrowser()) {
    return null;
  }
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

const notifyAuthChange = () => {
  if (!isBrowser()) {
    return;
  }
  window.dispatchEvent(new Event(AUTH_EVENT));
};

export const setAuthSession = (token, user) => {
  if (!isBrowser()) {
    return;
  }
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }

  if (user) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(USER_KEY);
  }

  notifyAuthChange();
};

export const clearAuthSession = () => {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  notifyAuthChange();
};

export const onAuthChange = (handler) => {
  if (!isBrowser()) {
    return () => {};
  }
  const listener = () => handler();
  window.addEventListener(AUTH_EVENT, listener);
  return () => window.removeEventListener(AUTH_EVENT, listener);
};

export const validateSession = async (baseUrl) => {
  if (!isBrowser()) {
    return null;
  }

  const token = getToken();
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${normalizeUrl(baseUrl)}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (
      response.status === 401 ||
      response.status === 403 ||
      response.status === 404 ||
      response.status === 204
    ) {
      clearAuthSession();
      return null;
    }

    if (!response.ok) {
      return getAuthUser();
    }

    const user = await response.json();
    setAuthSession(token, user);
    return user;
  } catch (error) {
    return getAuthUser();
  }
};
