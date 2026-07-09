import type { AdminSession } from '@/types';
import { clearAdminSession, getAdminSession, setAdminSession } from '@/data/storage';

export function isAdminSessionValid(session: AdminSession | null): boolean {
  if (!session?.isAuthenticated || !session.expiresAt) return false;
  return new Date(session.expiresAt).getTime() > Date.now();
}

export function getValidatedAdminSession(): AdminSession | null {
  const session = getAdminSession();
  if (!isAdminSessionValid(session)) {
    clearAdminSession();
    return null;
  }
  return session;
}

// ──────────────────────────────────────────────────────────────────────────────
// Timing-safe local comparison for dev/fallback mode.
// Password NEVER leaves the browser in this path, but note: in production the
// password must be empty on the client (VITE_ADMIN_PASSWORD should not be set)
// and authentication must flow through /api/admin/login.
// ──────────────────────────────────────────────────────────────────────────────
function timingSafeLocalCompare(a: string, b: string): boolean {
  let result = a.length === b.length ? 0 : 1;
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return result === 0;
}

function getLocalAdminPassword(): string {
  // Only used when /api/admin/login is unreachable (local dev without Vercel CLI).
  return import.meta.env.VITE_ADMIN_PASSWORD?.trim() || 'cuisinier-admin';
}

async function tryServerLogin(
  password: string,
): Promise<{ success: boolean; expiresAt?: string; error?: string; isLocal?: boolean }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
      credentials: 'include',
    });
    const data = (await res.json()) as { success?: boolean; expiresAt?: string; error?: string };
    if (res.ok && data.success) {
      return { success: true, expiresAt: data.expiresAt };
    }
    return { success: false, error: data.error ?? 'Invalid credentials.' };
  } catch {
    // API route unavailable — local dev mode
    return { success: false, isLocal: true };
  }
}

export async function loginAdmin(
  password: string,
): Promise<{ success: boolean; error?: string }> {
  const serverResult = await tryServerLogin(password);

  if (!serverResult.isLocal) {
    if (serverResult.success && serverResult.expiresAt) {
      setAdminSession({
        isAuthenticated: true,
        loginTime: new Date().toISOString(),
        expiresAt: serverResult.expiresAt,
      });
    }
    return { success: serverResult.success, error: serverResult.error };
  }

  // ── Local dev fallback ────────────────────────────────────────────────────
  const valid = timingSafeLocalCompare(password, getLocalAdminPassword());
  if (!valid) return { success: false, error: 'Invalid credentials.' };

  const ttlMinutes = Number(import.meta.env.VITE_ADMIN_SESSION_TTL_MINUTES ?? 480);
  const safeTtl = Number.isFinite(ttlMinutes) && ttlMinutes > 0 ? ttlMinutes : 480;
  setAdminSession({
    isAuthenticated: true,
    loginTime: new Date().toISOString(),
    expiresAt: new Date(Date.now() + safeTtl * 60 * 1000).toISOString(),
  });
  return { success: true };
}

export async function logoutAdmin(): Promise<void> {
  try {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
  } catch {
    // ignore network failure — still clear locally
  }
  clearAdminSession();
}

export async function verifyAdminSession(): Promise<boolean> {
  const localSession = getValidatedAdminSession();
  if (!localSession) return false;
  try {
    const res = await fetch('/api/admin/verify', { credentials: 'include' });
    if (!res.ok) {
      clearAdminSession();
      return false;
    }
    const data = (await res.json()) as { valid?: boolean };
    if (!data.valid) {
      clearAdminSession();
      return false;
    }
    return true;
  } catch {
    // API route unavailable — trust local session in dev mode
    return true;
  }
}
