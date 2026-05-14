import { useState, useCallback, useEffect } from 'react';
import type { Settings } from '@/types';
import { CUISINIER_DATA_EVENT, getSettings, saveSettings } from '@/data/storage';

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(getSettings());

  const setSettings = useCallback((partial: Partial<Settings>) => {
    const current = getSettings();
    const updated = { ...current, ...partial };
    saveSettings(updated);
    setSettingsState(updated);
  }, []);

  const refresh = useCallback(() => {
    setSettingsState(getSettings());
  }, []);

  useEffect(() => {
    window.addEventListener('storage', refresh);
    window.addEventListener(CUISINIER_DATA_EVENT, refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(CUISINIER_DATA_EVENT, refresh);
    };
  }, [refresh]);

  return { settings, setSettings, refresh };
}
