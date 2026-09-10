import { HQ_CONFIG } from "./config.js";

const SESSION_KEY = "naadix_hq_session";
const listeners = new Set();

function headers(session, extra = {}) {
  return {
    apikey: HQ_CONFIG.publishableKey,
    Authorization: `Bearer ${session?.access_token || HQ_CONFIG.publishableKey}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function writeSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
  for (const listener of listeners) listener(session ? "SIGNED_IN" : "SIGNED_OUT", session);
}

async function authRequest(path, body, method = "POST") {
  const response = await fetch(`${HQ_CONFIG.supabaseUrl}/auth/v1/${path}`, {
    method,
    headers: headers(null),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error_description || payload.msg || payload.message || "Authentication failed.");
  return payload;
}

export const supabase = {
  auth: {
    async signInWithPassword({ email, password }) {
      try {
        const session = await authRequest("token?grant_type=password", { email, password });
        writeSession(session);
        return { data: { session, user: session.user }, error: null };
      } catch (error) {
        return { data: { session: null }, error };
      }
    },
    async signOut() {
      const session = readSession();
      if (session?.access_token) await fetch(`${HQ_CONFIG.supabaseUrl}/auth/v1/logout`, { method: "POST", headers: headers(session) }).catch(() => {});
      writeSession(null);
    },
    async getSession() {
      let session = readSession();
      if (session?.refresh_token) {
        const expiresAt = Number(session.created_at || 0) + Number(session.expires_in || 3600);
        if (expiresAt && Date.now() / 1000 > expiresAt - 60) {
          try {
            session = await authRequest("token?grant_type=refresh_token", { refresh_token: session.refresh_token });
            writeSession(session);
          } catch {
            writeSession(null);
            session = null;
          }
        }
      }
      return { data: { session } };
    },
    onAuthStateChange(callback) {
      listeners.add(callback);
      return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } };
    },
    async resetPasswordForEmail(email, options = {}) {
      return authRequest("recover", { email, redirect_to: options.redirectTo || `${location.origin}/hq/reset-password/` });
    },
    async updateUser(attributes) {
      const session = readSession();
      if (!session) return { data: { user: null }, error: new Error("Your session has expired.") };
      try {
        const user = await authRequest("user", attributes, "PUT");
        return { data: { user }, error: null };
      } catch (error) {
        return { data: { user: null }, error };
      }
    },
  },
  async query(table, { select = "*", filters = {}, order, limit } = {}) {
    const session = readSession();
    if (!session) throw new Error("Your session has expired.");
    const params = new URLSearchParams({ select });
    for (const [key, value] of Object.entries(filters)) params.set(key, value);
    if (order) params.set("order", order);
    if (limit) params.set("limit", String(limit));
    const response = await fetch(`${HQ_CONFIG.supabaseUrl}/rest/v1/${table}?${params}`, { headers: headers(session) });
    const data = await response.json().catch(() => []);
    if (!response.ok) throw new Error(data.message || data.error || "Unable to load private data.");
    return data;
  },
  async insert(table, values) {
    const session = readSession();
    if (!session) throw new Error("Your session has expired.");
    const response = await fetch(`${HQ_CONFIG.supabaseUrl}/rest/v1/${table}`, { method: "POST", headers: headers(session, { Prefer: "return=representation" }), body: JSON.stringify(values) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || "Unable to save record.");
    return Array.isArray(data) ? data[0] : data;
  },
  async update(table, id, values) {
    const session = readSession();
    if (!session) throw new Error("Your session has expired.");
    const response = await fetch(`${HQ_CONFIG.supabaseUrl}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: headers(session, { Prefer: "return=representation" }), body: JSON.stringify(values) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || "Unable to update record.");
    return Array.isArray(data) ? data[0] : data;
  },
  async remove(table, id) {
    const session = readSession();
    if (!session) throw new Error("Your session has expired.");
    const response = await fetch(`${HQ_CONFIG.supabaseUrl}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: headers(session) });
    if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.message || "Unable to delete record."); }
  },
};

export function setRecoverySession(accessToken, refreshToken) {
  const session = { access_token: accessToken, refresh_token: refreshToken, expires_in: 3600, created_at: Math.floor(Date.now() / 1000) };
  writeSession(session);
  return session;
}

export function currentSession() { return readSession(); }
