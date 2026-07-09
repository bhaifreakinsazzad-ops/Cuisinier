import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Shield } from 'lucide-react';
import { loginAdmin } from '@/lib/adminAuth';

interface AdminLoginProps {
  onLogin: () => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || !password.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const result = await loginAdmin(password);
      if (result.success) {
        onLogin();
      } else {
        setError(result.error ?? 'Access denied. Check the admin credentials and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-[#080808] px-5">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,122,0,0.1)_0%,transparent_70%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/15">
            <Shield size={28} className="text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Access</h1>
          <p className="mt-1 text-sm text-white/45">Cuisinier Command Center</p>
          <p className="mt-3 text-xs leading-5 text-white/35">
            This session expires automatically for safer dashboard access.
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
              placeholder="Enter admin credentials"
              disabled={submitting}
              autoComplete="current-password"
              className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-4 text-base text-white placeholder:text-white/30 transition-colors focus:border-orange-500/50 focus:outline-none disabled:opacity-50"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-xs text-red-400"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={submitting || !password.trim()}
            className="w-full rounded-2xl bg-orange-500 py-4 text-base font-bold text-black shadow-[0_0_30px_rgba(255,122,0,0.3)] transition-all hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Verifying...' : 'Access Dashboard'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
