import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { CUISINIER_DATA_EVENT, addToCart, getMenuItems } from '@/data/storage';
import type { Category, MenuItem, Tag } from '@/types';
import { CATEGORY_EMOJI } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowBadge } from '@/components/ui/GlowBadge';
import { analytics } from '@/lib/analytics';
import { formatCurrency } from '@/lib/utils';
import { ItemDetailModal } from './ItemDetailModal';

const CATEGORIES: Category[] = ['All', 'Shawarma', 'Burger', 'Pizza', 'Pasta', 'Fries & Snacks', 'Combos', 'Drinks'];
const TAGS: Tag[] = ['Popular', 'Most Popular', 'Cheesy', 'Spicy', 'Midnight Pick', 'Best Value', 'Group Order', 'Heavy Meal', 'Quick Bite'];

function FoodCardImage({ item }: { item: MenuItem }) {
  const [failed, setFailed] = useState(false);
  const emoji = item.visualEmoji ?? CATEGORY_EMOJI[item.category] ?? '🍽️';

  if (failed || !item.image) {
    return (
      <div
        className={`mb-3 flex h-40 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 text-6xl ${
          !item.available ? 'grayscale-[0.5]' : ''
        }`}
      >
        {emoji}
      </div>
    );
  }

  return (
    <div className="relative mb-3">
      <img
        src={item.image}
        alt={item.name}
        onError={() => setFailed(true)}
        className={`h-40 w-full rounded-xl border border-white/10 object-cover ${!item.available ? 'grayscale-[0.35]' : ''}`}
      />
      {/* Emoji badge overlay */}
      <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-base backdrop-blur-sm">
        {emoji}
      </span>
    </div>
  );
}

export function MenuGrid() {
  const [searchParams] = useSearchParams();
  const preselectedItem = searchParams.get('item');

  const [items, setItems] = useState<MenuItem[]>(() => getMenuItems());
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [activeTag, setActiveTag] = useState<Tag | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const refresh = () => setItems(getMenuItems());
    window.addEventListener('storage', refresh);
    window.addEventListener(CUISINIER_DATA_EVENT, refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(CUISINIER_DATA_EVENT, refresh);
    };
  }, []);

  useEffect(() => {
    if (!preselectedItem) return;
    const item = items.find((entry) => entry.id === preselectedItem);
    if (item) setSelectedItem(item);
  }, [items, preselectedItem]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (activeCategory !== 'All' && item.category !== activeCategory) return false;
      if (activeTag && !item.tags.includes(activeTag)) return false;
      if (!search.trim()) return true;

      const query = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [items, activeCategory, activeTag, search]);

  const availableCount = filtered.filter((item) => item.available).length;

  const handleQuickAdd = (item: MenuItem) => {
    if (!item.available) return;

    addToCart({ menuItem: item, quantity: 1, addons: [], note: '' });
    analytics.addToCart({
      currency: 'BDT',
      content_ids: [item.id],
      content_name: item.name,
      content_category: item.category,
      content_type: 'product',
      value: item.price,
      itemId: item.id,
      itemName: item.name,
      quantity: 1,
      source: 'menu-grid',
    });
  };

  const handleOpenItem = (item: MenuItem) => {
    setSelectedItem(item);
    analytics.viewContent({
      content_ids: [item.id],
      content_name: item.name,
      content_category: item.category,
      content_type: 'product',
      value: item.price,
      currency: 'BDT',
    });
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#080808]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,122,0,0.06)_0%,transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-6 pb-32">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white">Full Menu</h1>
          <p className="text-sm text-white/50">
            {items.length} items across {CATEGORIES.length - 1} categories.
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mt-4"
        >
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search burger, shawarma, pizza, cheesy…"
            className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-12 text-sm text-white placeholder:text-white/30 transition-colors focus:border-orange-500/50 focus:outline-none"
          />
          <button
            onClick={() => setShowFilters((current) => !current)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition-colors ${
              showFilters ? 'bg-orange-500/20 text-orange-400' : 'text-white/40 hover:text-white/70'
            }`}
            aria-label="Toggle tag filters"
          >
            <SlidersHorizontal size={16} />
          </button>
        </motion.div>

        {/* Category tabs with emoji */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-4 -mx-1">
          <div className="scrollbar-hide flex gap-1.5 overflow-x-auto px-1 pb-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex-shrink-0 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                  activeCategory === category
                    ? 'bg-orange-500 text-black'
                    : 'border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90'
                }`}
              >
                {category === 'All' ? 'All' : `${CATEGORY_EMOJI[category] ?? ''} ${category}`}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tag filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 flex flex-wrap gap-1.5">
                <button
                  onClick={() => setActiveTag(null)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                    !activeTag ? 'bg-orange-500 text-black' : 'border border-white/10 bg-white/5 text-white/50'
                  }`}
                >
                  All Tags
                </button>
                {TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag((current) => (current === tag ? null : tag))}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                      activeTag === tag
                        ? 'border border-orange-500/40 bg-orange-500/30 text-orange-400'
                        : 'border border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-white/30">{availableCount} available now</p>
          <p className="text-xs text-white/30">Quick add or open to customize</p>
        </div>

        {/* Menu grid */}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {filtered.map((item, index) => (
              <GlassCard
                key={item.id}
                delay={index * 0.04}
                hover={item.available}
                onClick={item.available ? () => handleOpenItem(item) : undefined}
                className={!item.available ? 'opacity-75' : ''}
              >
                <div className="relative">
                  <FoodCardImage item={item} />
                  {item.midnightPick && (
                    <span className="absolute left-2 top-2 rounded-full bg-red-500/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                      🌙 Midnight Pick
                    </span>
                  )}
                  {item.featured && !item.midnightPick && (
                    <span className="absolute left-2 top-2 rounded-full bg-orange-500/85 px-2 py-0.5 text-[10px] font-bold text-black backdrop-blur-sm">
                      ⭐ Featured
                    </span>
                  )}
                  {!item.available && (
                    <span className="absolute bottom-2 left-2 rounded-full border border-white/10 bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
                      Temporarily unavailable
                    </span>
                  )}
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold leading-tight text-white">{item.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-white/40">{item.description}</p>
                  </div>
                  <span className="whitespace-nowrap text-sm font-bold text-orange-400">{formatCurrency(item.price)}</span>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  {item.tags.slice(0, 3).map((tag) => (
                    <GlowBadge key={tag} variant="orange" className="py-0 text-[10px]">
                      {tag}
                    </GlowBadge>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-white/40">{item.category}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        if (!item.available) return;
                        handleOpenItem(item);
                      }}
                      disabled={!item.available}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/70 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Customize
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleQuickAdd(item);
                      }}
                      disabled={!item.available}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Quick add ${item.name}`}
                    >
                      <Plus size={16} className="text-black" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm text-white/30">No items found. Try a different search or filter.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
      </AnimatePresence>
    </div>
  );
}
