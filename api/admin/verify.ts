import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE_NAME = 'cuisinier_admin';

function parseCookies(header: string): Record<string, string> {
  return Object.fromEntries(
    header.split(';').map((c) => {
      const idx = c.indexOf('=');
      return idx < 0 ? [c.trim(), ''] : [c.slice(0, idx).trim(), c.slice(idx + 1).trim()];
    }),
  );
}

function verifyToken(token: string): { valid: boolean; expiresAt?: number } {
  try {
    const secret = process.env.ADMIN_SESSION_SECRET ?? '';
    if (!secret) return { valid: false };

    const dotIdx = token.lastIndexOf('.');
    if (dotIdx < 0) return { valid: false };

    const payload = token.slice(0, dotIdx);
    const sig = token.slice(dotIdx + 1);

    const expected = createHmac('sha256', secret).update(payload).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return { valid: false };

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: number };
    if (!data.exp || Date.now() > data.exp) return { valid: false };

    return { valid: true, expiresAt: data.exp };
  } catch {
    return { valid: false };
  }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookies = parseCookies(req.headers.cookie ?? '');
  const token = cookies[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ valid: false });
  }

  const result = verifyToken(token);

  if (!result.valid) {
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
    return res.status(401).json({ valid: false });
  }

  return res.status(200).json({
    valid: true,
    expiresAt: result.expiresAt ? new Date(result.expiresAt).toISOString() : undefined,
  });
}
