import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE_NAME = 'cuisinier_admin';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

// Module-scope in-memory map: best effort within a single serverless instance lifetime.
// True rate limiting across instances requires persistent storage (Supabase/Redis).
const loginAttempts = new Map<string, { count: number; firstAt: number }>();

function getClientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  return (typeof fwd === 'string' ? fwd.split(',')[0] : 'unknown').trim();
}

function isRateLimited(ip: string): boolean {
  const r = loginAttempts.get(ip);
  if (!r) return false;
  if (Date.now() - r.firstAt > LOCKOUT_MS) {
    loginAttempts.delete(ip);
    return false;
  }
  return r.count >= MAX_ATTEMPTS;
}

function recordAttempt(ip: string): void {
  const r = loginAttempts.get(ip);
  const now = Date.now();
  if (!r || now - r.firstAt > LOCKOUT_MS) {
    loginAttempts.set(ip, { count: 1, firstAt: now });
  } else {
    loginAttempts.set(ip, { count: r.count + 1, firstAt: r.firstAt });
  }
}

function clearAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length);
  const bufA = Buffer.alloc(maxLen, 0);
  const bufB = Buffer.alloc(maxLen, 0);
  Buffer.from(a, 'utf8').copy(bufA);
  Buffer.from(b, 'utf8').copy(bufB);
  const lengthEqual = a.length === b.length ? 1 : 0;
  const contentEqual = timingSafeEqual(bufA, bufB) ? 1 : 0;
  return (lengthEqual & contentEqual) === 1;
}

function makeToken(expiresAt: number): string {
  const secret = process.env.ADMIN_SESSION_SECRET ?? '';
  const payload = Buffer.from(JSON.stringify({ exp: expiresAt, sub: 'admin' })).toString('base64url');
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminPassword = process.env.ADMIN_PASSWORD ?? '';
  if (!adminPassword) {
    return res.status(503).json({ error: 'Admin authentication is not configured on this server.' });
  }

  const ip = getClientIp(req);

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Please wait 15 minutes before trying again.' });
  }

  const { password } = (req.body ?? {}) as Record<string, unknown>;

  if (typeof password !== 'string' || !password) {
    recordAttempt(ip);
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  if (!timingSafeStringEqual(password, adminPassword)) {
    recordAttempt(ip);
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  clearAttempts(ip);

  const ttlMinutes = Number(process.env.ADMIN_SESSION_TTL_MINUTES ?? 480);
  const safeTtl = Number.isFinite(ttlMinutes) && ttlMinutes > 0 ? ttlMinutes : 480;
  const expiresAt = Date.now() + safeTtl * 60 * 1000;
  const token = makeToken(expiresAt);

  const cookieParts = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${safeTtl * 60}`,
  ];

  // Secure flag only over HTTPS
  if (req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production') {
    cookieParts.push('Secure');
  }

  res.setHeader('Set-Cookie', cookieParts.join('; '));

  return res.status(200).json({ success: true, expiresAt: new Date(expiresAt).toISOString() });
}
