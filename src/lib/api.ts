/**
 * Client-side API fetch helper.
 * Automatically attaches the session access token to all API requests.
 */

const TOKEN_KEY = "invoice_analyzer_token_v1";

export function getSessionToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch (_) {
    return null;
  }
}

export function setSessionToken(token: string | null) {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch (_) {}
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: Omit<RequestInit, "body"> & { body?: any } = {}
): Promise<T> {
  const token = getSessionToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Set default Content-Type for JSON payloads
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");

  if (!response.ok) {
    let errorMessage = `HTTP error! Status: ${response.status}`;
    if (isJson) {
      try {
        const errBody = await response.json();
        if (errBody && errBody.error) {
          errorMessage = errBody.error;
        }
      } catch (_) {}
    } else {
      try {
        const text = await response.text();
        if (text) errorMessage = text.slice(0, 150);
      } catch (_) {}
    }
    throw new Error(errorMessage);
  }

  if (!isJson) {
    const text = await response.text();
    throw new Error(`Server returned unexpected response (${contentType || "text/html"}): ${text.slice(0, 150)}`);
  }

  return response.json() as Promise<T>;
}
