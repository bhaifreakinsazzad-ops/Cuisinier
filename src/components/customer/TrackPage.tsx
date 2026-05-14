import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TrackPage() {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');

  const handleTrack = () => {
    const normalized = orderId.trim().toUpperCase();
    if (!normalized) {
      setError('Please enter your order ID.');
      return;
    }

    setError('');
    navigate(`/order/${normalized}`);
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-[#080808]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,122,0,0.08)_0%,transparent_70%)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/15">
            <MapPin size={28} className="text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Track Your Order</h1>
          <p className="mt-2 text-sm text-white/50">Enter your order ID to check the latest timeline status.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={orderId}
              onChange={(event) => {
                setOrderId(event.target.value);
                setError('');
              }}
              onKeyDown={(event) => event.key === 'Enter' && handleTrack()}
              placeholder="Enter Order ID (example: CUI-1001)"
              className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-4 text-base uppercase text-white placeholder:text-white/30 transition-colors focus:border-orange-500/50 focus:outline-none"
            />
          </div>
          {error && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-center text-xs text-red-400">{error}</motion.p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleTrack}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-base font-bold text-black shadow-[0_0_30px_rgba(255,122,0,0.3)] transition-all hover:bg-orange-600"
          >
            <Search size={18} />
            Track Order
          </motion.button>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 text-center text-[11px] text-white/20">
          Your order ID appears after checkout and stays available on the order details screen.
        </motion.p>
      </div>
    </div>
  );
}
