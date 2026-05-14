import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, MessageCircle, Save, Store } from 'lucide-react';
import type { Settings } from '@/types';
import { getSettings } from '@/data/storage';
import { settingsRepository } from '@/data/repository';
import { GlassCard } from '@/components/ui/GlassCard';

interface SettingsPanelProps {
  onSaved?: (settings: Settings) => void;
}

export function SettingsPanel({ onSaved }: SettingsPanelProps) {
  const [settings, setLocalSettings] = useState<Settings>(getSettings());
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void settingsRepository.get().then(setLocalSettings).catch(console.error);
  }, []);

  const update = (partial: Partial<Settings>) => {
    setLocalSettings((prev) => ({ ...prev, ...partial }));
    setSaved(false);
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const nextSettings = await settingsRepository.save(settings);
      setSaved(true);
      onSaved?.(nextSettings);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (saveError) {
      console.error(saveError);
      setError('Unable to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-orange-500/50 focus:outline-none';

  return (
    <div className="max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Settings</h2>
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            saved ? 'bg-green-500 text-black' : 'bg-orange-500 text-black hover:bg-orange-600'
          } disabled:opacity-50`}
        >
          <Save size={14} />
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
        </button>
      </div>

      <GlassCard className="mb-3">
        <div className="mb-4 flex items-center gap-2">
          <Store size={16} className="text-orange-400" />
          <h3 className="text-sm font-semibold text-white">Store</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-white/50">Delivery Fee (BDT)</label>
            <input
              type="number"
              value={settings.deliveryFee}
              onChange={(event) => update({ deliveryFee: Number.parseInt(event.target.value, 10) || 0 })}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-white/50">Night Start (hour)</label>
              <input
                type="number"
                min={0}
                max={23}
                value={settings.nightStartHour}
                onChange={(event) => update({ nightStartHour: Number.parseInt(event.target.value, 10) || 23 })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Night End (hour)</label>
              <input
                type="number"
                min={0}
                max={23}
                value={settings.nightEndHour}
                onChange={(event) => update({ nightEndHour: Number.parseInt(event.target.value, 10) || 4 })}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">Daytime Service Text</label>
            <input
              type="text"
              value={settings.daytimeServiceText}
              onChange={(event) => update({ daytimeServiceText: event.target.value })}
              className={inputClass}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 pt-1 text-sm text-white/60">
            <input
              type="checkbox"
              checked={settings.acceptingOrders}
              onChange={(event) => update({ acceptingOrders: event.target.checked })}
              className="h-4 w-4 rounded accent-orange-500"
            />
            Accepting Orders
            <span className="ml-1 text-xs text-white/30">
              {settings.acceptingOrders ? '(Checkout enabled)' : '(Checkout disabled)'}
            </span>
          </label>
        </div>
      </GlassCard>

      <GlassCard className="mb-3">
        <div className="mb-4 flex items-center gap-2">
          <MessageCircle size={16} className="text-green-400" />
          <h3 className="text-sm font-semibold text-white">Contact</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-white/50">WhatsApp Number</label>
            <input
              type="tel"
              value={settings.whatsappNumber}
              onChange={(event) => update({ whatsappNumber: event.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="mb-4 flex items-center gap-2">
          <CreditCard size={16} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Payment Numbers</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-white/50">bKash Number</label>
            <input
              type="tel"
              value={settings.bkashNumber}
              onChange={(event) => update({ bkashNumber: event.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">Nagad Number</label>
            <input
              type="tel"
              value={settings.nagadNumber}
              onChange={(event) => update({ nagadNumber: event.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      </GlassCard>

      {error && <p className="mt-4 text-center text-xs text-red-400">{error}</p>}

      {saved && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center text-xs text-green-400"
        >
          Settings saved successfully.
        </motion.p>
      )}
    </div>
  );
}



