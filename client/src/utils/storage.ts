// Centralized token storage so the rest of the app never touches
// localStorage directly. Swap the implementation here if the backend
// switches to httpOnly cookies instead of a bearer token.

const ACCESS_TOKEN_KEY = "auth_access_token";

export const tokenStorage = {
  get(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  set(token: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },
};
