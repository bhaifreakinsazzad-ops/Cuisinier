import { motion } from 'framer-motion';
import { ArrowRight, Download, MapPin, Phone, Sparkles, UtensilsCrossed } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppModeBadge } from '@/components/pwa/PWAInstallPrompt';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useSettings } from '@/hooks/useSettings';
import { analytics } from '@/lib/analytics';
import { formatCurrency } from '@/lib/utils';

const TRUST_CHIPS = [
  'No login needed',
  'COD / bKash / Nagad',
  'Order status timeline',
  'WhatsApp support',
  'Installable app',
];

export function HomeHero() {
  const navigate = useNavigate();
  const { canInstall, promptInstall } = usePWAInstall();
  const { settings } = useSettings();

  const hour = new Date().getHours();
  const isNight = hour >= settings.nightStartHour || hour < settings.nightEndHour;

  const handleInstall = async () => {
    analytics.installClick({ source: 'home-hero' });
    if (canInstall) {
      const accepted = await promptInstall();
      if (accepted) {
        return;
      }
    }

    navigate('/install');
  };

  return (
    <section className="relative flex min-h-[100dvh] flex-col overflow-hidden">
      <div className="absolute inset-0 bg-[#080808]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,122,0,0.18)_0%,transparent_60%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#080808] via-transparent to-transparent" />

      <div className="pointer-events-none absolute right-0 top-16 h-[420px] w-full overflow-hidden">
        <motion.img
          src="/food-burger.jpg"
          alt=""
          className="absolute right-[6%] top-[8%] h-24 w-24 rounded-2xl border border-white/10 object-cover shadow-2xl"
          animate={{ y: [0, -16, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.img
          src="/food-shawarma.jpg"
          alt=""
          className="absolute right-[18%] top-[38%] h-20 w-20 rounded-2xl border border-white/10 object-cover shadow-2xl"
          animate={{ y: [0, -12, 0], rotate: [0, -4, 0] }}
          transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        />
        <motion.img
          src="/food-pizza.jpg"
          alt=""
          className="absolute right-[36%] top-[18%] h-16 w-16 rounded-xl border border-white/10 object-cover shadow-xl"
          animate={{ y: [0, -10, 0], rotate: [0, 6, 0] }}
          transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.img
          src="/food-pasta.jpg"
          alt=""
          className="absolute right-[10%] top-[56%] h-14 w-14 rounded-xl border border-white/10 object-cover opacity-70 shadow-xl"
          animate={{ y: [0, -8, 0], rotate: [0, -4, 0] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent"
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col justify-end px-5 pb-24 pt-20">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <AppModeBadge />
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
              isNight
                ? 'border-green-500/30 bg-green-500/15 text-green-400'
                : 'border-blue-500/30 bg-blue-500/15 text-blue-400'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isNight ? 'bg-green-400' : 'bg-blue-400'} animate-pulse`} />
            {isNight ? 'Night kitchen live' : 'Daytime Dhanmondi service'}
          </span>
          <span className="inline-flex rounded-full border border-orange-500/25 bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-300">
            Delivery {formatCurrency(settings.deliveryFee)}
          </span>
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="mb-2 text-lg font-medium text-orange-300">{'\u09B0\u09BE\u09A4\u09C7\u09B0 \u0995\u09CD\u09B7\u09C1\u09A7\u09BE?'} Cuisinier is live.</p>
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-5xl">
            Midnight AI Kitchen.
            <span className="mt-2 block text-white/80">Built to convert fast.</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="mt-4 max-w-md text-base leading-relaxed text-white/65"
        >
          Shawarma, burgers, pizza, pasta, combos, and drinks with guest checkout, manual payment support, and
          timeline tracking that feels like an app.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.24 }}
          className="mt-5 flex flex-wrap gap-2"
        >
          {TRUST_CHIPS.map((chip) => (
            <span key={chip} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/55">
              {chip}
            </span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.36 }}
          className="mt-8 flex flex-col gap-3"
        >
          <button
            onClick={() => navigate('/craving')}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-base font-bold text-black shadow-[0_0_30px_rgba(255,122,0,0.3)] transition-all hover:bg-orange-600 active:scale-[0.98]"
          >
            Start Food Mission
            <ArrowRight size={20} />
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/craving')}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/10 py-3 text-sm font-semibold text-white transition-all hover:bg-white/15 active:scale-[0.98]"
            >
              <Sparkles size={16} />
              Choose My Craving
            </button>
            <button
              onClick={() => navigate('/menu')}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/10 py-3 text-sm font-semibold text-white transition-all hover:bg-white/15 active:scale-[0.98]"
            >
              <UtensilsCrossed size={16} />
              View Menu
            </button>
            <button
              onClick={() => navigate('/track')}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/80 transition-all hover:bg-white/10 active:scale-[0.98]"
            >
              <MapPin size={16} />
              Track Order
            </button>
            <button
              onClick={() => void handleInstall()}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/80 transition-all hover:bg-white/10 active:scale-[0.98]"
            >
              <Download size={16} />
              Install App
            </button>
          </div>

          <button
            onClick={() => {
              analytics.whatsappClick({ source: 'home-hero' });
              navigate('/support');
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/80 transition-all hover:bg-white/10 active:scale-[0.98]"
          >
            <Phone size={16} />
            Support
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.56 }}
          className="mt-4 text-center text-[11px] text-white/35"
        >
          {isNight ? 'Night: Dhaka service.' : `${settings.daytimeServiceText}.`} Fixed delivery fee{' '}
          {formatCurrency(settings.deliveryFee)}.
        </motion.p>
      </div>
    </section>
  );
}
