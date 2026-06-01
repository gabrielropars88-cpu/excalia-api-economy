import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SETTINGS_KEY = 'excalia_settings';

const DEFAULT_SETTINGS = {
  darkMode: true,
  compactMode: false,
  accentColor: '#0ea5e9',
  showCharts: true,
  showRawPrices: false,
  showProfits: true,
  topItemsCount: 10,
};

const SettingsContext = createContext(null);

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  // Persister chaque changement
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Appliquer le thème sombre/clair sur <html>
  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', !settings.darkMode);
    document.documentElement.classList.toggle('compact-mode', settings.compactMode);
    document.documentElement.style.setProperty('--color-accent', settings.accentColor);
  }, [settings.darkMode, settings.compactMode, settings.accentColor]);

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try { localStorage.removeItem(SETTINGS_KEY); } catch {}
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
