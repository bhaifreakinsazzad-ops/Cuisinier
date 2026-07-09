import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Beef, Flame, Moon, Plus, RotateCcw, Star, Timer, TrendingUp, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CUISINIER_DATA_EVENT, addToCart, getMenuItems } from '@/data/storage';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowBadge } from '@/components/ui/GlowBadge';
import type { HungerLevel, MenuItem, Mood, PeopleCount } from '@/types';
import { CATEGORY_EMOJI } from '@/types';
import { analytics } from '@/lib/analytics';
import { formatCurrency } from '@/lib/utils';
import { triggerCartFx } from '@/lib/cartFx';
import { ItemDetailModal } from './ItemDetailModal';

export function CravingSelector() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 'scan' | 'result'>(1);
  const [mood, setMood] = useState<Mood | null>(null);
  const [hunger, setHunger] = useState<HungerLevel | null>(null);
  const [people, setPeople] = useState<PeopleCount | null>(null);
  const [items, setItems] = useState<MenuItem[]>(() => getMenuItems());
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    const refresh = () => setItems(getMenuItems());
    window.addEventListener('storage', refresh);
    window.addEventListener(CUISINIER_DATA_EVENT, refresh);

    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(CUISINIER_DATA_EVENT, refresh);
    };
  }, []);

  const moods: { value: Mood; label: string; icon: typeof Zap; desc: string }[] = [
    { value: 'cheesy', label: 'Cheesy', icon: Zap, desc: 'Melty, gooey goodness' },
    { value: 'spicy', label: 'Spicy', icon: Flame, desc: 'Fire in every bite' },
    { value: 'quick_bite', label: 'Quick Bite', icon: Timer, desc: 'Fast and satisfying' },
    { value: 'midnight_combo', label: 'Midnight Combo', icon: Moon, desc: 'The full midnight deal' },
    { value: 'heavy_meal', label: 'Heavy Meal', icon: Beef, desc: 'Go big or go home' },
    { value: 'best_value', label: 'Best Value', icon: Star, desc: 'Maximum value' },
    { value: 'most_popular', label: 'Most Popular', icon: TrendingUp, desc: 'What everyone loves' },
  ];

  const hungerLevels: { value: HungerLevel; label: string; desc: string; emoji: string }[] = [
    { value: 'light', label: 'Light', desc: 'Just a snack', emoji: '🥗' },
    { value: 'medium', label: 'Medium', desc: 'Proper meal', emoji: '🍽️' },
    { value: 'monster', label: 'Monster Hunger', desc: 'Feed the beast', emoji: '🦖' },
  ];

  const peopleCounts: { value: PeopleCount; label: string; desc: string; emoji: string }[] = [
    { value: 'solo', label: 'Solo', desc: 'Just me', emoji: '👤' },
    { value: 'two', label: 'Two People', desc: 'Date night', emoji: '👥' },
    { value: 'group', label: 'Group', desc: 'Squad hunger', emoji: '🧑‍🤝‍🧑' },
  ];

  const recommendedItems = useMemo<Array<{ item: MenuItem; matchPercent: number }>>(() => {
    if (!mood) return [];
    const allItems = items.filter((item) => item.available);

    const moodTagMap: Record<Mood, string[]> = {
      cheesy: ['Cheesy'],
      spicy: ['Spicy'],
      quick_bite: ['Quick Bite'],
      midnight_combo: ['Midnight Combo', 'Midnight Pick'],
      heavy_meal: ['Heavy Meal'],
      best_value: ['Best Value'],
      most_popular: ['Most Popular', 'Popular'],
    };

    const hungerCategoryMap: Record<HungerLevel, string[]> = {
      light: ['Shawarma', 'Fries & Snacks', 'Drinks'],
      medium: ['Burger', 'Pasta', 'Shawarma'],
      monster: ['Burger', 'Pizza', 'Combos'],
    };

    const peopleCategoryMap: Record<PeopleCount, string[]> = {
      solo: ['Shawarma', 'Burger', 'Fries & Snacks', 'Combos'],
      two: ['Burger', 'Pizza', 'Pasta', 'Combos'],
      group: ['Pizza', 'Combos', 'Fries & Snacks', 'Drinks'],
    };

    const targetTags = moodTagMap[mood] ?? [];
    const targetCategories = [...(hunger ? hungerCategoryMap[hunger] : []), ...(people ? peopleCategoryMap[people] : [])];

    const scored = allItems
      .map((item) => {
        let score = 0;
        if (item.tags.some((tag) => targetTags.includes(tag))) score += 3;
        if (targetCategories.includes(item.category)) score += 2;
        if (item.featured) score += 1;
        if (item.midnightPick && mood === 'midnight_combo') score += 2;
        return { item, score };
      })
      .sort((left, right) => right.score - left.score);

    const withMatch = (entries: MenuItem[]) =>
      entries.map((item, index) => ({ item, matchPercent: Math.max(96 - index * 7, 62) }));

    const matches = scored.filter((entry) => entry.score > 0).slice(0, 6).map((entry) => entry.item);
    return matches.length > 0
      ? withMatch(matches)
      : withMatch(allItems.filter((item) => item.featured).slice(0, 6));
  }, [hunger, items, mood, people]);

  const handlePeopleSelect = (value: PeopleCount) => {
    setPeople(value);
    setStep('scan');
    window.setTimeout(() => setStep('result'), 2200);
  };

  const reset = () => {
    setMood(null);
    setHunger(null);
    setPeople(null);
    setStep(1);
  };

  const handleQuickAdd = (item: MenuItem, originEl: HTMLElement | null) => {
    addToCart({ menuItem: item, quantity: 1, addons: [], note: '' });
    triggerCartFx(originEl, item.visualEmoji ?? CATEGORY_EMOJI[item.category] ?? '🍽️');
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
      source: 'craving-selector',
    });
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#080808]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,122,0,0.08)_0%,transparent_70%)]" />

      <div className="relative z-10 mx-auto max-w-xl px-5 py-8 pb-24">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button onClick={() => navigate('/')} className="mb-4 flex items-center gap-1 text-sm text-white/50 transition-colors hover:text-white/80">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-white">Choose My Craving</h1>
          <p className="mt-1 text-sm text-white/50">AI will decode your midnight hunger.</p>

          <div className="mt-4 flex gap-2">
            {[1, 2, 3].map((value) => (
              <div
                key={value}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  step === 'scan' || step === 'result' || value <= step ? 'bg-orange-500' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="mb-4 text-sm font-medium text-white/70">Step 1 - What&apos;s your mood?</p>
              <div className="grid gap-3">
                {moods.map((entry, index) => (
                  <GlassCard key={entry.value} delay={index * 0.05} hover tilt onClick={() => { setMood(entry.value); setStep(2); }}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15">
                        <entry.icon size={20} className="text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{entry.label}</p>
                        <p className="text-xs text-white/40">{entry.desc}</p>
                      </div>
                      <ArrowRight size={16} className="text-white/30" />
                    </div>
                  </GlassCard>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="mb-4 text-sm font-medium text-white/70">Step 2 - How hungry?</p>
              <div className="grid gap-3">
                {hungerLevels.map((entry, index) => (
                  <GlassCard key={entry.value} delay={index * 0.05} hover tilt onClick={() => { setHunger(entry.value); setStep(3); }}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${entry.value === 'light' ? 'bg-green-500/15' : entry.value === 'medium' ? 'bg-orange-500/15' : 'bg-red-500/15'}`}>
                        <span className="text-lg">{entry.emoji}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{entry.label}</p>
                        <p className="text-xs text-white/40">{entry.desc}</p>
                      </div>
                      <ArrowRight size={16} className="text-white/30" />
                    </div>
                  </GlassCard>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="mt-4 flex items-center gap-1 text-xs text-white/40 transition-colors hover:text-white/70">
                <RotateCcw size={12} />
                Back to mood
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="mb-4 text-sm font-medium text-white/70">Step 3 - How many people?</p>
              <div className="grid gap-3">
                {peopleCounts.map((entry, index) => (
                  <GlassCard key={entry.value} delay={index * 0.05} hover tilt onClick={() => handlePeopleSelect(entry.value)}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15">
                        <span className="text-lg">{entry.emoji}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{entry.label}</p>
                        <p className="text-xs text-white/40">{entry.desc}</p>
                      </div>
                      <ArrowRight size={16} className="text-white/30" />
                    </div>
                  </GlassCard>
                ))}
              </div>
              <button onClick={() => setStep(2)} className="mt-4 flex items-center gap-1 text-xs text-white/40 transition-colors hover:text-white/70">
                <RotateCcw size={12} />
                Back to hunger
              </button>
            </motion.div>
          )}

          {step === 'scan' && (
            <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-14">
              {/* Holographic radar HUD */}
              <div className="perspective-1200">
                <motion.div
                  className="relative flex h-56 w-56 items-center justify-center rounded-full holo-grid"
                  initial={{ rotateX: 35, opacity: 0 }}
                  animate={{ rotateX: 35, opacity: 1 }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Outer holographic conic ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full border border-orange-500/25"
                    style={{
                      background:
                        'conic-gradient(from 0deg, transparent 0%, rgba(255,122,0,0.35) 15%, transparent 30%, transparent 100%)',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
                  />
                  {/* Middle ring, counter-rotating */}
                  <motion.div
                    className="absolute inset-6 rounded-full border border-orange-400/20"
                    animate={{ rotate: -360, scale: [1, 1.04, 1] }}
                    transition={{ rotate: { duration: 4, repeat: Infinity, ease: 'linear' }, scale: { duration: 2, repeat: Infinity } }}
                  />
                  {/* Pulse rings */}
                  <motion.div
                    className="absolute inset-10 rounded-full border border-orange-500/20"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                  />
                  {/* Core */}
                  <motion.div
                    className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/15 shadow-[0_0_40px_rgba(255,122,0,0.4)]"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    <Zap size={30} className="text-orange-400" />
                  </motion.div>
                </motion.div>
              </div>

              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="mt-8 text-sm font-semibold tracking-wide text-orange-400"
              >
                AI SCANNING CRAVING PROFILE
              </motion.p>

              {/* Animated HUD readout */}
              <div className="mt-4 w-full max-w-[240px] space-y-1.5 font-mono text-[11px]">
                {[
                  { label: 'MOOD', value: mood ?? '—' },
                  { label: 'HUNGER', value: hunger ?? '—' },
                  { label: 'PEOPLE', value: people ?? '—' },
                ].map((row, index) => (
                  <motion.div
                    key={row.label}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.25 }}
                    className="flex items-center justify-between rounded-md border border-orange-500/15 bg-orange-500/5 px-2.5 py-1"
                  >
                    <span className="text-white/40">{row.label}</span>
                    <span className="text-orange-300">{row.value.toString().replace(/_/g, ' ').toUpperCase()}</span>
                  </motion.div>
                ))}
              </div>

              {/* Progress bar synced to the 2.2s scan window */}
              <div className="mt-4 h-1 w-full max-w-[240px] overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-orange-600 via-orange-400 to-orange-500"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2.1, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          )}

          {step === 'result' && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-6 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }} className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                  <Zap size={28} className="text-green-400" />
                </motion.div>
                <h2 className="text-xl font-bold text-white">Craving detected.</h2>
                <p className="text-sm text-white/50">AI decoded your hunger profile.</p>
              </div>

              <p className="mb-3 text-sm font-medium text-white/70">Recommended for you:</p>
              <div className="grid gap-3">
                {recommendedItems.map(({ item, matchPercent }, index) => (
                  <GlassCard key={item.id} delay={index * 0.08} hover tilt holo={index === 0}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-3xl">
                        {item.visualEmoji ?? CATEGORY_EMOJI[item.category] ?? '🍽️'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                          {index === 0 && (
                            <span className="flex-shrink-0 rounded-full bg-orange-500/20 px-1.5 py-0.5 text-[9px] font-bold text-orange-400">
                              TOP MATCH
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-white/40">{item.description}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.tags.slice(0, 2).map((tag) => (
                            <GlowBadge key={tag} variant="orange" className="py-0 text-[10px]">
                              {tag}
                            </GlowBadge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-orange-400">{formatCurrency(item.price)}</p>
                      </div>
                    </div>

                    {/* Match score bar */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[10px] font-medium text-white/35">AI Match</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${matchPercent}%` }}
                          transition={{ duration: 0.6, delay: 0.1 + index * 0.05, ease: 'easeOut' }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-orange-400">{matchPercent}%</span>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={(event) => handleQuickAdd(item, event.currentTarget)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-2 text-xs font-bold text-black transition-colors hover:bg-orange-600"
                      >
                        <Plus size={14} />
                        Quick Add
                      </motion.button>
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/10"
                      >
                        Customize
                      </button>
                    </div>
                  </GlassCard>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button onClick={reset} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/10 py-3 text-sm font-medium text-white transition-all hover:bg-white/15">
                  <RotateCcw size={16} />
                  Start Over
                </button>
                <button onClick={() => navigate('/menu')} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-3 text-sm font-bold text-black transition-all hover:bg-orange-600">
                  View Full Menu
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>{selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}</AnimatePresence>
    </div>
  );
}
