import type { VercelRequest, VercelResponse } from '@vercel/node';

const COOKIE_NAME = 'cuisinier_admin';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`);
  return res.status(200).json({ success: true });
}
