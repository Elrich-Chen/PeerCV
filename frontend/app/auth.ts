import type { AuthUser, User } from "./types";

export const normalizeUrl = (value = ""): string =>
  value.trim().replace(/\/+$/, "");

const DEFAULT_API_FALLBACK = "http://localhost:8000";

const resolveDefaultApiUrl = (): string => {
  const envValue =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : "";
  return normalizeUrl(envValue || DEFAULT_API_FALLBACK);
};

export const DEFAULT_API_URL = resolveDefaultApiUrl();
const TOKEN_KEY = "authToken";
const USER_KEY = "authUser";
const AUTH_EVENT = "auth-changed";

const isBrowser = (): boolean => typeof window !== "undefined";

export const getToken = (): string => {
  if (!isBrowser()) {
    return "";
  }
  return window.localStorage.getItem(TOKEN_KEY) || "";
};

export const getAuthUser = (): User | null => {
  if (!isBrowser()) {
    return null;
  }
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

const notifyAuthChange = (): void => {
  if (!isBrowser()) {
    return;
  }
  window.dispatchEvent(new Event(AUTH_EVENT));
};

export const setAuthSession = (token: string, user: User | null): void => {
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

export const clearAuthSession = (): void => {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  notifyAuthChange();
};

export const onAuthChange = (handler: () => void): (() => void) => {
  if (!isBrowser()) {
    return () => {};
  }
  const listener = () => handler();
  window.addEventListener(AUTH_EVENT, listener);
  return () => window.removeEventListener(AUTH_EVENT, listener);
};

export const validateSession = async (
  baseUrl: string
): Promise<User | null> => {
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

    const user = (await response.json()) as AuthUser;
    setAuthSession(token, user);
    return user;
  } catch {
    return getAuthUser();
  }
};
