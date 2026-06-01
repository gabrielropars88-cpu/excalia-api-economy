import React, { useState, useEffect, useCallback } from 'react';
import { useEconomy } from '../App';
import { useSettings } from '../contexts/SettingsContext';
import { clearCache, getPriceHistory } from '../services/excaliaApi';
import {
  Settings, Sun, Moon, Layers, Palette, BarChart2, EyeOff, Eye,
  TrendingUp, Hash, RotateCcw, Trash2, RefreshCw, FlaskConical,
  Download, Copy, CheckCircle, AlertCircle, Zap
} from 'lucide-react';

const ACCENT_COLORS = [
  { label: 'Bleu cristal', value: '#0ea5e9' },
  { label: 'Violet',        value: '#8b5cf6' },
  { label: 'Émeraude',      value: '#10b981' },
  { label: 'Or',            value: '#f59e0b' },
  { label: 'Rose',          value: '#ec4899' },
  { label: 'Rouge',         value: '#ef4444' },
];

function Toggle({ checked, onChange, label, description, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-800/50">
      <div className="flex items-start gap-3">
        {Icon && <Icon size={15} className="text-crystal-400 mt-0.5 flex-shrink-0" />}
        <div>
          <p className="text-sm text-white font-semibold">{label}</p>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-crystal-500' : 'bg-slate-700'}`}
        role="switch"
        aria-checked={checked}
      >
        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="hex-card overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-800/50 flex items-center gap-2"
        style={{ background: 'rgba(14,165,233,0.05)' }}>
        {Icon && <Icon size={14} className="text-crystal-400" />}
        <h3 className="font-display text-xs tracking-widest text-crystal-400">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function AdminPanel() {
  const { items, loadData, loading, isDemoMode, activateDemoMode, deactivateDemoMode, dataSource } = useEconomy();
  const { settings, updateSetting, resetSettings } = useSettings();
  const [feedbacks, setFeedbacks] = useState({});
  const [csvCopied, setCsvCopied] = useState(false);

  const flash = useCallback((key, msg = '✓') => {
    setFeedbacks(p => ({ ...p, [key]: msg }));
    setTimeout(() => setFeedbacks(p => { const n = { ...p }; delete n[key]; return n; }), 2500);
  }, []);

  const handleClearCache = () => {
    clearCache();
    flash('cache', 'Cache vidé !');
  };

  const handleForceRefresh = async () => {
    await loadData(true);
    flash('refresh', 'API rafraîchie !');
  };

  const handleReset = () => {
    resetSettings();
    flash('reset', 'Paramètres réinitialisés !');
  };

  const handleToggleDemo = () => {
    if (isDemoMode) deactivateDemoMode();
    else activateDemoMode();
    flash('demo', isDemoMode ? 'Mode démo désactivé' : 'Mode démo activé');
  };

  const handleExportCSV = () => {
    if (!items.length) return;
    const header = ['type', 'sellPrice', 'buyPrice', 'category', 'shopName', 'page', 'slot'];
    const rows = items.map(i => header.map(k => i[k] ?? '').join(';'));
    const csv = [header.join(';'), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `excalia_economy_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    flash('csv', 'CSV exporté !');
  };

  const handleCopyDebug = () => {
    const debug = {
      timestamp: new Date().toISOString(),
      source: dataSource,
      itemsCount: items.length,
      categories: [...new Set(items.map(i => i.category).filter(Boolean))],
      pricesSample: items.slice(0, 20).map(i => ({ type: i.type, sellPrice: i.sellPrice })),
      cacheSize: (() => { try { const v = localStorage.getItem('excalia_slim_v2'); return v ? (new Blob([v]).size / 1024).toFixed(1) + ' KB' : 'vide'; } catch { return '?'; } })(),
    };
    navigator.clipboard.writeText(JSON.stringify(debug, null, 2)).then(() => {
      flash('debug', 'Debug copié !');
    });
  };

  const FB = ({ k }) => feedbacks[k]
    ? <span className="text-emerald-400 text-xs flex items-center gap-1"><CheckCircle size={11} />{feedbacks[k]}</span>
    : null;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="font-display text-xl font-bold text-white tracking-wider flex items-center gap-2">
          <Settings size={18} className="text-crystal-400" />
          PANNEAU D'ADMINISTRATION
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Paramètres du site — les changements s'appliquent immédiatement et sont sauvegardés.
        </p>
      </div>

      {/* Apparence */}
      <Section title="APPARENCE" icon={Palette}>
        <Toggle
          checked={settings.darkMode}
          onChange={v => updateSetting('darkMode', v)}
          icon={settings.darkMode ? Moon : Sun}
          label="Mode sombre"
          description="Thème sombre (actif) ou clair"
        />
        <Toggle
          checked={settings.compactMode}
          onChange={v => updateSetting('compactMode', v)}
          icon={Layers}
          label="Mode compact"
          description="Réduit les espaces et taille des éléments"
        />

        <div className="mt-4">
          <p className="text-sm text-white font-semibold mb-2 flex items-center gap-2">
            <Zap size={13} className="text-crystal-400" /> Couleur principale
          </p>
          <div className="flex flex-wrap gap-2">
            {ACCENT_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => updateSetting('accentColor', c.value)}
                title={c.label}
                className="w-8 h-8 rounded-lg transition-all hover:scale-110 focus:outline-none"
                style={{
                  background: c.value,
                  border: settings.accentColor === c.value ? '2px solid white' : '2px solid transparent',
                  boxShadow: settings.accentColor === c.value ? `0 0 10px ${c.value}80` : 'none',
                }}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">Couleur actuelle : <span className="font-mono" style={{ color: settings.accentColor }}>{settings.accentColor}</span></p>
        </div>
      </Section>

      {/* Affichage des données */}
      <Section title="AFFICHAGE DES DONNÉES" icon={Eye}>
        <Toggle
          checked={settings.showCharts}
          onChange={v => updateSetting('showCharts', v)}
          icon={BarChart2}
          label="Afficher les graphiques"
          description="Graphiques sur le dashboard et comparateur"
        />
        <Toggle
          checked={settings.showRawPrices}
          onChange={v => updateSetting('showRawPrices', v)}
          icon={Eye}
          label="Afficher les prix bruts API"
          description="Valeurs numériques non formatées"
        />
        <Toggle
          checked={settings.showProfits}
          onChange={v => updateSetting('showProfits', v)}
          icon={TrendingUp}
          label="Afficher les profits"
          description="Colonnes profit et rentabilité %"
        />

        <div className="mt-4">
          <label className="text-sm text-white font-semibold flex items-center gap-2 mb-2">
            <Hash size={13} className="text-crystal-400" />
            Nombre d'items dans les tops
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range" min={3} max={50} step={1}
              value={settings.topItemsCount}
              onChange={e => updateSetting('topItemsCount', Number(e.target.value))}
              className="flex-1 accent-crystal-400"
            />
            <span className="font-display text-xl text-crystal-400 font-bold w-10 text-center">
              {settings.topItemsCount}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Tops profits, top prix — nombre de lignes affichées</p>
        </div>
      </Section>

      {/* Actions */}
      <Section title="ACTIONS" icon={RefreshCw}>
        <div className="grid gap-3 sm:grid-cols-2">

          <button onClick={handleForceRefresh} disabled={loading}
            className="btn-primary text-xs py-2.5 flex items-center justify-between px-4">
            <span className="flex items-center gap-2">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Forcer refresh API
            </span>
            <FB k="refresh" />
          </button>

          <button onClick={handleClearCache}
            className="btn-secondary text-xs py-2.5 flex items-center justify-between px-4">
            <span className="flex items-center gap-2">
              <Trash2 size={13} />
              Vider le cache
            </span>
            <FB k="cache" />
          </button>

          <button onClick={handleToggleDemo}
            className={`btn-secondary text-xs py-2.5 flex items-center justify-between px-4 ${isDemoMode ? 'border-amber-500/40 text-amber-300' : ''}`}>
            <span className="flex items-center gap-2">
              <FlaskConical size={13} />
              {isDemoMode ? 'Désactiver mode démo' : 'Activer mode démo'}
            </span>
            <FB k="demo" />
          </button>

          <button onClick={handleExportCSV} disabled={!items.length}
            className="btn-secondary text-xs py-2.5 flex items-center justify-between px-4">
            <span className="flex items-center gap-2">
              <Download size={13} />
              Exporter CSV ({items.length} items)
            </span>
            <FB k="csv" />
          </button>

          <button onClick={handleCopyDebug}
            className="btn-secondary text-xs py-2.5 flex items-center justify-between px-4">
            <span className="flex items-center gap-2">
              <Copy size={13} />
              Copier Debug API
            </span>
            <FB k="debug" />
          </button>

          <button onClick={handleReset}
            className="btn-secondary text-xs py-2.5 flex items-center justify-between px-4 border-red-500/30 text-red-400 hover:bg-red-500/10">
            <span className="flex items-center gap-2">
              <RotateCcw size={13} />
              Réinitialiser les paramètres
            </span>
            <FB k="reset" />
          </button>
        </div>
      </Section>

      {/* Statut */}
      <Section title="ÉTAT ACTUEL" icon={AlertCircle}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          {[
            { label: 'Source données', value: dataSource === 'mock' ? '🎭 Démo' : dataSource === 'api' ? '✅ API' : dataSource === 'cache' ? '📦 Cache' : '❌ Erreur' },
            { label: 'Items chargés', value: items.length },
            { label: 'Mode sombre', value: settings.darkMode ? 'Oui' : 'Non' },
            { label: 'Mode compact', value: settings.compactMode ? 'Oui' : 'Non' },
            { label: 'Graphiques', value: settings.showCharts ? 'Affichés' : 'Masqués' },
            { label: 'Taille top', value: settings.topItemsCount },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 rounded-lg bg-void-800/50 border border-slate-800/50">
              <p className="text-slate-500 mb-1">{label}</p>
              <p className="font-mono text-white font-semibold">{value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-3">
          Paramètres sauvegardés dans localStorage (clé : <code className="font-mono">excalia_settings</code>).
          Aucune donnée API n'est stockée dans localStorage.
        </p>
      </Section>
    </div>
  );
}
