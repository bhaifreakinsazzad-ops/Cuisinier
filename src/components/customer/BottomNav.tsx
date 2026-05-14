import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Sparkles, UtensilsCrossed, ShoppingCart, MapPin } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

export function BottomNav() {
  const { count } = useCart();

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/craving', icon: Sparkles, label: 'Craving' },
    { to: '/menu', icon: UtensilsCrossed, label: 'Menu' },
    { to: '/cart', icon: ShoppingCart, label: 'Cart', badge: count },
    { to: '/track', icon: MapPin, label: 'Track' },
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.2 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
    >
      {/* Top fade */}
      <div className="h-8 bg-gradient-to-t from-[#080808] to-transparent pointer-events-none" />

      <div className="bg-[#080808]/90 backdrop-blur-xl border-t border-white/10 px-2 pb-safe">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors relative ${
                  isActive ? 'text-orange-500' : 'text-white/50 hover:text-white/80'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                    {item.badge ? (
                      <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 bg-orange-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="bottomTab"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-orange-500 rounded-full"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </motion.nav>
  );
}
