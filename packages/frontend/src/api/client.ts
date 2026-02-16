const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export function getAudioUrl(relativePath: string): string {
  return `${API_URL}${relativePath}`;
}

let accessToken: string | null = null;
let refreshToken: string | null = null;

// Credentials used for dev-login (so we can re-auth automatically)
let devCredentials: { email: string; name: string; role: string } | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setRefreshToken(token: string | null) {
  refreshToken = token;
}

export function setDevCredentials(creds: {
  email: string;
  name: string;
  role: string;
} | null) {
  devCredentials = creds;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// --- Token refresh logic ---

let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempt to refresh tokens. Returns true if successful.
 * Deduplicates concurrent refresh attempts.
 */
async function tryRefreshTokens(): Promise<boolean> {
  // If a refresh is already in flight, wait for it
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    // Strategy 1: Use refresh token
    if (refreshToken) {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (res.ok) {
          const data = await res.json();
          accessToken = data.accessToken;
          refreshToken = data.refreshToken;
          return true;
        }
      } catch {
        // Refresh token failed, fall through to dev-login
      }
    }

    // Strategy 2: Re-authenticate via dev-login (dev mode only)
    if (devCredentials) {
      try {
        const res = await fetch(`${API_URL}/auth/dev-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(devCredentials),
        });

        if (res.ok) {
          const data = await res.json();
          accessToken = data.accessToken;
          refreshToken = data.refreshToken;
          return true;
        }
      } catch {
        // Dev login also failed
      }
    }

    return false;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

// --- Core request function with auto-retry on 401 ---

async function request<T>(
  path: string,
  options: RequestInit = {},
  _isRetry = false
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  // On 401, try to refresh and retry once
  if (res.status === 401 && !_isRetry) {
    const refreshed = await tryRefreshTokens();
    if (refreshed) {
      return request<T>(path, options, true);
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// --- Public API ---

export const api = {
  health: () => request<{ status: string }>("/health"),

  devLogin: async (email: string, name: string, role: string) => {
    // Store credentials so we can auto-refresh later
    devCredentials = { email, name, role };

    const result = await request<{
      user: { id: string; email: string; name: string; role: string };
      accessToken: string;
      refreshToken: string;
    }>("/auth/dev-login", {
      method: "POST",
      body: JSON.stringify({ email, name, role }),
    });

    // Store both tokens
    accessToken = result.accessToken;
    refreshToken = result.refreshToken;

    return result;
  },

  me: () =>
    request<{
      id: string;
      email: string;
      name: string;
      role: string;
      locale: string;
    }>("/auth/me"),

  snap: (imageBase64: string, gps?: { lat: number; lng: number }, locale = "en") =>
    request<{
      landmark: {
        schema: string;
        landmarks: Array<{
          name: string;
          confidence: number;
          location: { city: string | null; country: string | null };
          category: string;
          brief_description: string;
        }>;
        needs_clarification: boolean;
        clarification_message: string | null;
      };
      guide: {
        schema: string;
        landmark_name: string;
        locale: string;
        title: string;
        summary: string;
        facts: Array<{ heading: string; body: string }>;
        narration_script: string;
        fun_fact: string | null;
        confidence_note: string | null;
      } | null;
      cached: boolean;
      audio: {
        audioId: string;
        url: string;
        cached: boolean;
        voice: string;
      } | null;
      ads: Array<{
        id: string;
        title: string;
        body: string;
        image_url: string | null;
        link_url: string;
      }>;
    }>("/snap", {
      method: "POST",
      body: JSON.stringify({ image_base64: imageBase64, gps, locale }),
    }),
};
