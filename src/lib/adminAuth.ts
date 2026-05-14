import type { AdminSession } from '@/types';
import { clearAdminSession, getAdminSession, setAdminSession } from '@/data/storage';

const DEFAULT_ADMIN_PASSWORD = 'cuisinier-admin';
const DEFAULT_SESSION_TTL_MINUTES = 8 * 60;

function parseSessionTtlMinutes() {
  const raw = Number(import.meta.env.VITE_ADMIN_SESSION_TTL_MINUTES ?? DEFAULT_SESSION_TTL_MINUTES);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_SESSION_TTL_MINUTES;
}

export function getAdminPassword() {
  return import.meta.env.VITE_ADMIN_PASSWORD?.trim() || DEFAULT_ADMIN_PASSWORD;
}

export function createAdminSession(): AdminSession {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + parseSessionTtlMinutes() * 60 * 1000);

  return {
    isAuthenticated: true,
    loginTime: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

export function isAdminSessionValid(session: AdminSession | null) {
  if (!session?.isAuthenticated || !session.expiresAt) {
    return false;
  }

  return new Date(session.expiresAt).getTime() > Date.now();
}

export function getValidatedAdminSession() {
  const session = getAdminSession();
  if (!isAdminSessionValid(session)) {
    clearAdminSession();
    return null;
  }

  return session;
}

export function loginAdmin(password: string) {
  if (password !== getAdminPassword()) {
    return false;
  }

  setAdminSession(createAdminSession());
  return true;
}

export function logoutAdmin() {
  clearAdminSession();
}
