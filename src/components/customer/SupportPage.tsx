import { motion } from 'framer-motion';
import { CreditCard, MessageCircle, Package, Phone } from 'lucide-react';
import { BUSINESS_INFO } from '@/config/business';
import { useSettings } from '@/hooks/useSettings';
import { analytics } from '@/lib/analytics';
import { buildWhatsAppLink, isLikelyBangladeshMobile, sanitizePhoneForWhatsApp } from '@/lib/utils';

export function SupportPage() {
  const { settings } = useSettings();
  const supportNumber = settings.whatsappNumber || BUSINESS_INFO.whatsappNumber;
  const hasCallableNumber = isLikelyBangladeshMobile(supportNumber);
  const whatsappLink = buildWhatsAppLink(supportNumber, 'Hi Cuisinier! I need help with my order.');

  const supportOptions = [
    {
      icon: MessageCircle,
      label: 'WhatsApp Support',
      desc: 'Chat with us for quick help',
      href: whatsappLink,
      target: '_blank',
      color: 'green' as const,
    },
    {
      icon: Phone,
      label: 'Call Support',
      desc: hasCallableNumber ? supportNumber : 'Call number not configured yet',
      href: hasCallableNumber ? `tel:+${sanitizePhoneForWhatsApp(supportNumber)}` : whatsappLink,
      target: hasCallableNumber ? undefined : '_blank',
      color: 'blue' as const,
    },
    {
      icon: CreditCard,
      label: 'Payment Issue',
      desc: 'bKash, Nagad, or COD support',
      href: buildWhatsAppLink(supportNumber, 'Hi Cuisinier! I have a payment issue.'),
      target: '_blank',
      color: 'orange' as const,
    },
    {
      icon: Package,
      label: 'Order Issue',
      desc: 'Missing item, wrong order, or status concern',
      href: buildWhatsAppLink(supportNumber, 'Hi Cuisinier! I need help with an order issue.'),
      target: '_blank',
      color: 'red' as const,
    },
  ];

  const colorMap = {
    green: 'border-green-500/30 bg-green-500/15 text-green-400 hover:bg-green-500/25',
    blue: 'border-blue-500/30 bg-blue-500/15 text-blue-400 hover:bg-blue-500/25',
    orange: 'border-orange-500/30 bg-orange-500/15 text-orange-400 hover:bg-orange-500/25',
    red: 'border-red-500/30 bg-red-500/15 text-red-400 hover:bg-red-500/25',
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#080808]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,122,0,0.06)_0%,transparent_70%)]" />

      <div className="relative z-10 mx-auto max-w-xl px-5 py-6 pb-32">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white">Support</h1>
          <p className="mt-1 text-sm text-white/50">WhatsApp-first support for ordering, payment, and tracking issues.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 py-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/15">
            <MessageCircle size={32} className="text-orange-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Night support is active</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-white/50">
            Reach out during service hours and we will route the message to the team handling your order.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-4 space-y-3">
          {supportOptions.map((option, index) => (
            <motion.a
              key={option.label}
              href={option.href}
              target={option.target}
              rel={option.target === '_blank' ? 'noopener noreferrer' : undefined}
              onClick={() => analytics.whatsappClick({ source: 'support-page', label: option.label })}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + index * 0.05 }}
              className={`block rounded-2xl border p-4 transition-all ${colorMap[option.color]}`}
            >
              <div className="flex items-center gap-3">
                <option.icon size={22} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{option.label}</p>
                  <p className="text-xs opacity-75">{option.desc}</p>
                </div>
                <span className="text-lg">→</span>
              </div>
            </motion.a>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 text-center">
          <p className="text-xs text-white/30">Service Hours: 11 PM - 4 AM (Night)</p>
          <p className="mt-1 text-xs text-white/30">{settings.daytimeServiceText}</p>
        </motion.div>
      </div>
    </div>
  );
}
