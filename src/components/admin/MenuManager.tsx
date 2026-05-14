import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import type { Category, MenuItem, Tag } from '@/types';
import { menuRepository } from '@/data/repository';
import { GlowBadge } from '@/components/ui/GlowBadge';
import { formatCurrency } from '@/lib/utils';

const ALL_TAGS: Tag[] = ['Popular', 'Cheesy', 'Spicy', 'Midnight Pick', 'Best Value', 'Group Order', 'Heavy Meal', 'Quick Bite', 'Most Popular', 'Midnight Combo', 'Premium', 'Add-on'];
const CATEGORY_OPTIONS: Category[] = ['Shawarma', 'Burger', 'Pizza', 'Pasta', 'Fries & Snacks', 'Combos', 'Drinks'];

interface MenuManagerProps {
  items: MenuItem[];
  onUpdate: () => void;
}

const emptyItem = (): MenuItem => ({
  id: '',
  name: '',
  description: '',
  price: 0,
  category: 'Burger',
  tags: [],
  image: '/food-burger.jpg',
  available: true,
  featured: false,
  midnightPick: false,
  createdAt: new Date().toISOString(),
});

export function MenuManager({ items, onUpdate }: MenuManagerProps) {
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = items.filter((item) =>
    search
      ? item.name.toLowerCase().includes(search.toLowerCase()) || item.category.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  const handleSave = async () => {
    const item = editing;
    if (!item || !item.name.trim()) {
      setError('Item name is required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await menuRepository.upsert({
        ...item,
        id: item.id || crypto.randomUUID(),
      });
      setEditing(null);
      setIsCreating(false);
      onUpdate();
    } catch (saveError) {
      console.error(saveError);
      setError('Unable to save menu item.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this item?')) {
      return;
    }

    try {
      await menuRepository.remove(id);
      onUpdate();
    } catch (deleteError) {
      console.error(deleteError);
      setError('Unable to delete menu item.');
    }
  };

  const toggleTag = (tag: Tag) => {
    if (!editing) return;
    setEditing({
      ...editing,
      tags: editing.tags.includes(tag) ? editing.tags.filter((entry) => entry !== tag) : [...editing.tags, tag],
    });
  };

  if (editing) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{isCreating ? 'Add Item' : 'Edit Item'}</h2>
          <button
            onClick={() => {
              setEditing(null);
              setIsCreating(false);
              setError('');
            }}
            className="text-white/50 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-w-lg space-y-3">
          <div>
            <label className="mb-1 block text-xs text-white/50">Name</label>
            <input
              type="text"
              value={editing.name}
              onChange={(event) => setEditing({ ...editing, name: event.target.value })}
              className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-orange-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">Description</label>
            <textarea
              value={editing.description}
              onChange={(event) => setEditing({ ...editing, description: event.target.value })}
              rows={2}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-orange-500/50 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-white/50">Price (BDT)</label>
              <input
                type="number"
                value={editing.price}
                onChange={(event) => setEditing({ ...editing, price: Number.parseInt(event.target.value, 10) || 0 })}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-orange-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Category</label>
              <select
                value={editing.category}
                onChange={(event) => setEditing({ ...editing, category: event.target.value as Category })}
                className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-orange-500/50 focus:outline-none"
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">Image Path</label>
            <input
              type="text"
              value={editing.image}
              onChange={(event) => setEditing({ ...editing, image: event.target.value })}
              className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-orange-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs text-white/50">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-2 py-1 text-[11px] transition-colors ${
                    editing.tags.includes(tag)
                      ? 'border-orange-500/50 bg-orange-500/30 text-orange-400'
                      : 'border-white/10 bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <label className="cursor-pointer text-sm text-white/60">
              <input
                type="checkbox"
                checked={editing.available}
                onChange={(event) => setEditing({ ...editing, available: event.target.checked })}
                className="mr-2 rounded accent-orange-500"
              />
              Available
            </label>
            <label className="cursor-pointer text-sm text-white/60">
              <input
                type="checkbox"
                checked={editing.featured}
                onChange={(event) => setEditing({ ...editing, featured: event.target.checked })}
                className="mr-2 rounded accent-orange-500"
              />
              Featured
            </label>
            <label className="cursor-pointer text-sm text-white/60">
              <input
                type="checkbox"
                checked={editing.midnightPick}
                onChange={(event) => setEditing({ ...editing, midnightPick: event.target.checked })}
                className="mr-2 rounded accent-orange-500"
              />
              Midnight Pick
            </label>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-3 pt-3">
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-bold text-black transition-colors hover:bg-orange-600 disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setIsCreating(false);
                setError('');
              }}
              className="rounded-xl bg-white/10 px-6 py-3 text-white transition-colors hover:bg-white/15"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Menu Manager ({items.length} items)</h2>
        <button
          onClick={() => {
            setEditing(emptyItem());
            setIsCreating(true);
            setError('');
          }}
          className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-3 py-2 text-xs font-bold text-black transition-colors hover:bg-orange-600"
        >
          <Plus size={14} />
          Add Item
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search items..."
        className="mb-4 h-10 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/30 focus:border-orange-500/50 focus:outline-none"
      />

      {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

      <div className="space-y-2">
        {filtered.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06]"
          >
            <img src={item.image} alt={item.name} className="h-12 w-12 flex-shrink-0 rounded-lg border border-white/10 object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                {!item.available && <GlowBadge variant="red" className="text-[9px]">Hidden</GlowBadge>}
                {item.featured && <GlowBadge variant="orange" className="text-[9px]">Featured</GlowBadge>}
              </div>
              <p className="text-xs text-white/40">{item.category} / {formatCurrency(item.price)}</p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              <button
                onClick={() => {
                  setEditing({ ...item });
                  setIsCreating(false);
                  setError('');
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/60 transition-colors hover:bg-white/15 hover:text-white"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => void handleDelete(item.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400/60 transition-colors hover:bg-red-500/20 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      {filtered.length === 0 && <p className="py-8 text-center text-sm text-white/30">No items found.</p>}
    </div>
  );
}



