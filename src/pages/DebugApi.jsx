import React, { useState, useMemo } from 'react';
import { useEconomy } from '../App';
import { formatPrice, computeStats, getTierCandidateKeys, resolveTierPrice, findDetectedTierItems } from '../services/excaliaApi';
import { getItemDisplayName } from '../utils/itemDisplay';
import { getItemIcon } from '../data/itemIcons';
import recipes from '../data/recipes.json';
import {
  RefreshCw, Copy, CheckCircle, Wifi, WifiOff, AlertTriangle,
  Database, Code, Layers, Search, PackageSearch, Gem
} from 'lucide-react';

const MINERAL_KEYWORDS = [
  't1','t2','t3','t4',
  'minerai','mineral',
  'iron','fer',
  'gold','or',
  'diamond','diamant',
  'emerald','emeraude','émeraude',
  'coal','charbon',
  'lapis',
  'redstone',
  'quartz',
  'copper','cuivre',
  'netherite',
];

// ─── Cherche les items API liés aux minerais / tiers ──────────────────────
function searchMineralTierItems(items) {
  const results = { withTier: [], minerals: [], oraxen: [] };

  for (const item of items) {
    if (!item.type) continue;
    const lower = item.type.toLowerCase();

    const hasTier = /_t[1-4]$/.test(lower) || /_(tier|compressed?)_?\d/.test(lower);
    const isMineralKeyword = MINERAL_KEYWORDS.some(kw => lower.includes(kw));
    const isOraxen = lower.startsWith('oraxen:');

    if (hasTier) {
      results.withTier.push(item);
    } else if (isMineralKeyword) {
      results.minerals.push(item);
    }

    if (isOraxen) {
      results.oraxen.push(item);
    }
  }

  return results;
}

// ─── Tiers détectés / manquants ───────────────────────────────────────────
function computeMissingTiers(priceMap) {
  const missing = [];
  for (const [familyKey, familyDef] of Object.entries(recipes.families)) {
    for (const tierKey of Object.keys(familyDef.tiers)) {
      const resolved = resolveTierPrice(familyKey, tierKey, priceMap);
      if (!resolved) {
        const candidates = getTierCandidateKeys(familyKey, tierKey);
        missing.push({
          family: familyKey,
          familyLabel: familyDef.label,
          tierKey,
          tierLabel: tierKey.toUpperCase(),
          candidatesTried: candidates,
        });
      }
    }
  }
  return missing;
}

function computeFoundTiers(priceMap, items) {
  const found = [];
  for (const [familyKey, familyDef] of Object.entries(recipes.families)) {
    for (const tierKey of Object.keys(familyDef.tiers)) {
      const resolved = resolveTierPrice(familyKey, tierKey, priceMap);
      if (resolved) {
        const item = items.find(i =>
          i.type === resolved.key ||
          String(i.type).toLowerCase() === String(resolved.key).toLowerCase()
        );
        found.push({
          family: familyKey,
          familyLabel: familyDef.label,
          familyEmoji: familyDef.emoji,
          tierKey,
          tierLabel: tierKey.toUpperCase(),
          apiKey: resolved.key,
          strategy: resolved.strategy ?? 'exact',
          sellPrice: resolved.price,
          category: item?.category ?? '—',
        });
      }
    }
  }
  return found;
}

export default function DebugApi() {
  const { items, priceMap, debugData, dataSource, apiError, lastUpdate, loadData, loading, rawStructure } = useEconomy();
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);
  const [showAllCandidates, setShowAllCandidates] = useState({});

  const stats = useMemo(() => computeStats(items), [items]);

  const tierItems = useMemo(() => findDetectedTierItems(items), [items]);
  const missingTiers = useMemo(() => computeMissingTiers(priceMap ?? {}), [priceMap]);
  const foundTiers = useMemo(() => computeFoundTiers(priceMap ?? {}, items), [priceMap, items]);

  // ── NOUVELLE SECTION : recherche minerais tiers ─────────────────────────
  const mineralSearch = useMemo(() => searchMineralTierItems(items), [items]);

  const isMobTier = (apiKey) => {
    const clean = apiKey?.toLowerCase().replace(/^oraxen:/, '') ?? '';
    const mineralBases = ['fer','or','cuivre','charbon','diamant','emeraude','redstone','lapis','quartz','netherite','iron','gold','copper','coal','diamond','emerald'];
    return !mineralBases.some(b => clean.startsWith(b + '_') || clean === b);
  };

  const foundMineralTiers = useMemo(() => foundTiers.filter(t => !isMobTier(t.apiKey)), [foundTiers]);
  const foundMobTiers = useMemo(() => foundTiers.filter(t => isMobTier(t.apiKey)), [foundTiers]);
  const missingMineralTiers = useMemo(() => missingTiers.filter(m => {
    const mineralFamilies = ['iron','gold','copper','coal','diamond','emerald','redstone','lapis','quartz','netherite'];
    return mineralFamilies.includes(m.family);
  }), [missingTiers]);

  const cacheSize = useMemo(() => {
    try {
      const v = localStorage.getItem('excalia_slim_v3') || localStorage.getItem('excalia_slim_v2');
      return v ? (new Blob([v]).size / 1024).toFixed(1) + ' KB' : '—';
    } catch { return '—'; }
  }, [items]);

  const statusInfo = {
    api:   { label: 'API connectée',  color: 'profit-badge-positive', icon: Wifi },
    cache: { label: 'Cache local',    color: 'profit-badge-neutral',  icon: Database },
    mock:  { label: 'Mode démo',      color: 'profit-badge-neutral',  icon: WifiOff },
    error: { label: 'Erreur API',     color: 'profit-badge-negative', icon: AlertTriangle },
  }[dataSource] ?? { label: '—', color: 'profit-badge-neutral', icon: Wifi };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(debugData ?? items, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const displayedItems = showAllItems ? items : items.slice(0, 50);

  const toggleCandidates = (id) => {
    setShowAllCandidates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <div className="fade-in-up">
        <h2 className="font-display text-xl font-bold text-white tracking-wider">DEBUG API</h2>
        <p className="text-slate-400 text-sm">Diagnostic complet — connexion Excalia & détection des tiers minerais/mobs</p>
      </div>

      {/* Statut */}
      <div className="hex-card p-5 fade-in-up">
        <h3 className="font-display text-xs text-crystal-400 tracking-widest mb-4">STATUT</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Source</p>
            <span className={`${statusInfo.color} flex items-center gap-1 w-fit`}>
              <statusInfo.icon size={10} />{statusInfo.label}
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Items extraits</p>
            <p className="font-display text-xl font-bold text-white">{items.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Catégories</p>
            <p className="font-display text-xl font-bold text-white">{stats?.categories ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Cache localStorage</p>
            <p className="text-sm font-mono text-white">{cacheSize}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">URL utilisée</p>
            <p className="text-xs font-mono text-crystal-400">/api/excalia/economie</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Dernier refresh</p>
            <p className="text-xs font-mono text-white">
              {lastUpdate ? new Date(lastUpdate).toLocaleString('fr-FR') : '—'}
            </p>
          </div>
          {rawStructure && (
            <div className="col-span-2">
              <p className="text-xs text-slate-500 mb-1">Clés racine de l'API</p>
              <p className="text-xs font-mono text-slate-300">[{rawStructure.join(', ')}]</p>
            </div>
          )}
        </div>
        {apiError && (
          <div className="p-3 rounded-lg mb-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-xs text-red-400 font-mono">{apiError}</p>
          </div>
        )}
        <div className="flex gap-3 flex-wrap">
          <button className="btn-primary text-xs py-1.5 px-3" onClick={() => loadData(true)} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Actualiser API
          </button>
          <button className="btn-secondary text-xs py-1.5 px-3" onClick={copyJson}>
            {copied ? <CheckCircle size={13} className="text-emerald-400" /> : <Copy size={13} />}
            {copied ? 'Copié !' : 'Copier JSON extrait'}
          </button>
          <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => setShowRaw(!showRaw)}>
            <Code size={13} /> {showRaw ? 'Masquer' : 'Voir'} JSON brut
          </button>
        </div>
      </div>

      {/* ─── NOUVELLE SECTION : Recherche spéciale tiers minerais ─────────── */}
      <div className="hex-card p-5 fade-in-up" style={{ borderColor: 'rgba(14,165,233,0.3)' }}>
        <h3 className="font-display text-xs text-crystal-400 tracking-widest mb-1 flex items-center gap-2">
          <PackageSearch size={13} />
          RECHERCHE TIERS MINERAIS — NOMS BRUTS DANS L'API
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Tous les items API contenant des mots-clés minerais/tiers.
          Ces noms bruts sont exactement ceux que le site doit utiliser pour
          <code className="font-mono bg-slate-800 px-1 mx-1 rounded">resolveTierPrice()</code>.
        </p>

        {/* Items avec suffixe de tier */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-crystal-300 mb-2 flex items-center gap-1">
            <Gem size={11} />
            Items avec suffixe de tier (_t1/_t2/_t3/_t4) — {mineralSearch.withTier.length} trouvés
          </p>
          {mineralSearch.withTier.length === 0 ? (
            <div className="p-3 rounded-lg text-xs text-amber-400" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <AlertTriangle size={12} className="inline mr-1" />
              Aucun item avec suffixe de tier trouvé dans l'API.
              {dataSource === 'mock' && ' (Mode démo : oraxen:fer_t1, oraxen:diamant_t1... sont disponibles)'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700/50 text-slate-400 font-display tracking-widest">
                    <th className="text-left py-2 pr-3">TYPE EXACT (API)</th>
                    <th className="text-left py-2 pr-3">NOM AFFICHÉ</th>
                    <th className="text-right py-2 pr-3">PRIX VENTE</th>
                    <th className="text-left py-2">CATÉGORIE</th>
                  </tr>
                </thead>
                <tbody>
                  {mineralSearch.withTier.map((item, i) => {
                    const icon = getItemIcon(item.type, item.category);
                    return (
                      <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                        <td className="py-2 pr-3 font-mono text-emerald-400">
                          {item.type}
                        </td>
                        <td className="py-2 pr-3 flex items-center gap-2">
                          {icon && <img src={icon} alt="" className="w-5 h-5 object-contain" onError={e => e.target.style.display='none'} />}
                          <span className="text-white">{getItemDisplayName(item.type)}</span>
                        </td>
                        <td className="py-2 pr-3 text-right font-mono text-crystal-300 font-bold">
                          {formatPrice(item.sellPrice)}€
                        </td>
                        <td className="py-2 text-slate-400">{item.category}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Items oraxen: */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-purple-300 mb-2 flex items-center gap-1">
            Tous les items <code className="font-mono bg-slate-800 px-1 rounded text-purple-300">oraxen:</code>
            — {mineralSearch.oraxen.length} trouvés
          </p>
          {mineralSearch.oraxen.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Aucun item oraxen: dans les données actuelles.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {mineralSearch.oraxen.map((item, i) => {
                const hasTier = /_t[1-4]$/.test(item.type.toLowerCase());
                return (
                  <div key={i} className="flex items-center gap-1.5 font-mono text-xs px-2 py-1 rounded border"
                    style={{
                      background: hasTier ? 'rgba(14,165,233,0.08)' : 'rgba(168,85,247,0.08)',
                      borderColor: hasTier ? 'rgba(14,165,233,0.25)' : 'rgba(168,85,247,0.25)',
                    }}>
                    <span className={hasTier ? 'text-crystal-300' : 'text-purple-300'}>{item.type}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-emerald-400">{formatPrice(item.sellPrice)}€</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Explication logique de recherche */}
        <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(30,41,59,0.8)' }}>
          <p className="text-crystal-400 font-semibold mb-2">💡 Logique de recherche v4 (correction oraxen:)</p>
          <ol className="space-y-1 text-slate-400 list-decimal list-inside">
            <li><span className="text-white font-mono">oraxen:fer_t1</span> → cherché en 1er (clé exacte avec préfixe oraxen:)</li>
            <li><span className="text-white font-mono">oraxen:iron_t1</span> → même priorité (alias anglais avec oraxen:)</li>
            <li><span className="text-white font-mono">fer_t1</span> → clé normalisée (sans préfixe)</li>
            <li><span className="text-white font-mono">iron_t1</span> → alias anglais normalisé</li>
            <li>Regex floue → si aucun candidat ne correspond</li>
          </ol>
          <p className="text-amber-400 mt-2">
            ⚠ Avant v4 : seules les variantes sans "oraxen:" étaient générées
            → <code className="bg-slate-900 px-1">oraxen:fer_t1</code> ne matchait jamais.
            Maintenant toutes les variantes incluent "oraxen:".
          </p>
        </div>
      </div>

      {/* ─── SECTION : Tiers minerais trouvés ──────────────────────────────── */}
      <div className="hex-card p-5 fade-in-up">
        <h3 className="font-display text-xs text-crystal-400 tracking-widest mb-1 flex items-center gap-2">
          <Gem size={13} className="text-cyan-400" />
          TIERS MINERAIS DÉTECTÉS ({foundMineralTiers.length})
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Tiers des minerais (fer, or, diamant...) trouvés dans le priceMap.
        </p>
        {foundMineralTiers.length === 0 ? (
          <div className="p-4 rounded-lg text-center" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <AlertTriangle size={20} className="text-amber-400 mx-auto mb-2" />
            <p className="text-amber-300 text-sm font-semibold">Aucun tier minerai trouvé dans l'API</p>
            <p className="text-slate-500 text-xs mt-1">
              Les tiers comme <code className="font-mono bg-slate-800 px-1 rounded">oraxen:fer_t1</code>,{' '}
              <code className="font-mono bg-slate-800 px-1 rounded">oraxen:diamant_t2</code>...
              ne sont pas présents dans les données actuelles.
            </p>
            {dataSource === 'mock' && (
              <p className="text-emerald-400 text-xs mt-2">
                Mode démo actif : les tiers oraxen: sont simulés (oraxen:fer_t1, oraxen:diamant_t1...).
                Activez-le pour les voir ici.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700/50 text-slate-400 font-display tracking-widest">
                  <th className="text-left py-2 pr-3">FAMILLE</th>
                  <th className="text-left py-2 pr-3">TIER</th>
                  <th className="text-left py-2 pr-3">NOM BRUT EXACT (API)</th>
                  <th className="text-left py-2 pr-3">NOM AFFICHÉ</th>
                  <th className="text-right py-2 pr-3">PRIX VENTE</th>
                  <th className="text-left py-2">STRATÉGIE</th>
                </tr>
              </thead>
              <tbody>
                {foundMineralTiers.map((t, i) => {
                  const icon = getItemIcon(t.apiKey, 'Compressés');
                  return (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                      <td className="py-2 pr-3 text-white font-semibold">{t.familyEmoji} {t.familyLabel}</td>
                      <td className="py-2 pr-3">
                        <span className="px-2 py-0.5 rounded text-xs font-display font-bold bg-crystal-500/15 text-crystal-300 border border-crystal-500/25">
                          {t.tierLabel}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-mono text-emerald-400">{t.apiKey}</td>
                      <td className="py-2 pr-3 flex items-center gap-2">
                        {icon && <img src={icon} alt="" className="w-5 h-5 object-contain" onError={e => e.target.style.display='none'} />}
                        <span className="text-white">{getItemDisplayName(t.apiKey)}</span>
                      </td>
                      <td className="py-2 pr-3 text-right font-mono text-white font-bold">
                        {formatPrice(t.sellPrice)}€
                      </td>
                      <td className="py-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${t.strategy === 'candidate' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                          {t.strategy}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── SECTION : Tiers mobs trouvés ──────────────────────────────────── */}
      <div className="hex-card p-5 fade-in-up">
        <h3 className="font-display text-xs text-crystal-400 tracking-widest mb-1 flex items-center gap-2">
          <Layers size={13} />
          TIERS MOBS DÉTECTÉS ({foundMobTiers.length})
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Tiers de loots de mobs (patte_lapin, os, fil...) trouvés dans le priceMap.
        </p>
        {foundMobTiers.length === 0 ? (
          <p className="text-xs text-slate-500 italic">Aucun tier de mob trouvé dans les données actuelles.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700/50 text-slate-400 font-display tracking-widest">
                  <th className="text-left py-2 pr-3">FAMILLE</th>
                  <th className="text-left py-2 pr-3">TIER</th>
                  <th className="text-left py-2 pr-3">NOM BRUT EXACT (API)</th>
                  <th className="text-left py-2 pr-3">ICÔNE + NOM</th>
                  <th className="text-right py-2">PRIX VENTE</th>
                </tr>
              </thead>
              <tbody>
                {foundMobTiers.map((t, i) => {
                  const icon = getItemIcon(t.apiKey, 'Loots de mobs');
                  return (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                      <td className="py-2 pr-3 text-white font-semibold">{t.familyEmoji ?? '🐾'} {t.familyLabel}</td>
                      <td className="py-2 pr-3">
                        <span className="px-2 py-0.5 rounded text-xs font-display font-bold bg-purple-500/15 text-purple-300 border border-purple-500/25">
                          {t.tierLabel}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-mono text-purple-400">{t.apiKey}</td>
                      <td className="py-2 pr-3 flex items-center gap-2">
                        {icon
                          ? <img src={icon} alt="" className="w-5 h-5 object-contain" onError={e => e.target.style.display='none'} />
                          : <span className="text-slate-600 text-xs">—</span>
                        }
                        <span className="text-white">{getItemDisplayName(t.apiKey)}</span>
                      </td>
                      <td className="py-2 text-right font-mono text-white font-bold">
                        {formatPrice(t.sellPrice)}€
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── SECTION : Tiers manquants minerais ────────────────────────────── */}
      <div className="hex-card p-5 fade-in-up">
        <h3 className="font-display text-xs text-crystal-400 tracking-widest mb-1 flex items-center gap-2">
          <AlertTriangle size={13} className="text-amber-400" />
          TIERS MINERAIS MANQUANTS ({missingMineralTiers.length})
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Tiers minerais cherchés mais non trouvés dans l'API — toutes les clés ont été essayées.
          Si l'API utilise un autre pattern, il apparaîtra dans la section "Tiers détectés" ci-dessus.
        </p>
        {missingMineralTiers.length === 0 ? (
          <div className="p-3 rounded-lg flex items-center gap-3" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
            <p className="text-emerald-300 text-sm">Tous les tiers minerais sont trouvés dans l'API !</p>
          </div>
        ) : (
          <div className="space-y-2">
            {missingMineralTiers.map((m, i) => {
              const id = `${m.family}_${m.tierKey}`;
              const show = showAllCandidates[id];
              // Les 6 premières clés incluent les variantes oraxen: les plus probables
              const preview = m.candidatesTried.slice(0, 6);
              const rest = m.candidatesTried.slice(6);
              return (
                <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-amber-400 font-semibold text-xs">{m.familyLabel} {m.tierLabel}</span>
                    <span className="text-slate-600 text-xs">— non trouvé</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">Clés essayées (dont oraxen:) :</p>
                  <div className="flex flex-wrap gap-1">
                    {preview.map((k, j) => (
                      <code key={j} className="text-xs font-mono px-1.5 py-0.5 rounded border"
                        style={{
                          background: k.startsWith('oraxen:') ? 'rgba(168,85,247,0.08)' : 'rgba(239,68,68,0.06)',
                          borderColor: k.startsWith('oraxen:') ? 'rgba(168,85,247,0.3)' : 'rgba(239,68,68,0.25)',
                          color: k.startsWith('oraxen:') ? '#c084fc' : '#f87171',
                        }}>
                        {k}
                      </code>
                    ))}
                    {rest.length > 0 && (
                      <>
                        {show && rest.map((k, j) => (
                          <code key={`r${j}`} className="text-xs font-mono bg-slate-900 text-red-400 px-1.5 py-0.5 rounded border border-red-900/40">{k}</code>
                        ))}
                        <button
                          className="text-xs text-crystal-400 px-1.5 py-0.5 rounded border border-crystal-500/20 hover:border-crystal-500/40"
                          onClick={() => toggleCandidates(id)}
                        >
                          {show ? `▲ réduire` : `▼ +${rest.length} autres`}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Catégories */}
      {stats?.categoryList?.length > 0 && (
        <div className="hex-card p-5 fade-in-up">
          <h3 className="font-display text-xs text-crystal-400 tracking-widest mb-3">
            CATÉGORIES DÉTECTÉES ({stats.categoryList.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.categoryList.map(cat => (
              <span key={cat} className="profit-badge-neutral text-xs">{cat}</span>
            ))}
          </div>
        </div>
      )}

      {/* Table des items */}
      <div className="hex-card p-5 fade-in-up">
        <h3 className="font-display text-xs text-crystal-400 tracking-widest mb-4">
          ITEMS EXTRAITS ({items.length})
        </h3>
        {items.length === 0 ? (
          <p className="text-slate-500 text-sm">Aucun item chargé.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700/50 text-slate-400 font-display tracking-widest">
                    <th className="text-left py-2 pr-3">ICÔNE</th>
                    <th className="text-left py-2 pr-3">TYPE (API)</th>
                    <th className="text-left py-2 pr-3">NOM AFFICHÉ</th>
                    <th className="text-right py-2 pr-3">PRIX</th>
                    <th className="text-left py-2 pr-3">CATÉGORIE</th>
                    <th className="text-left py-2">SOURCE</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedItems.map((item, i) => {
                    const isTierItem = /_(t[1-4])$/i.test(item.type ?? '');
                    const icon = getItemIcon(item.type, item.category);
                    return (
                      <tr key={i} className={`border-b border-slate-800/50 hover:bg-slate-800/20 ${isTierItem ? 'bg-crystal-500/5' : ''}`}>
                        <td className="py-2 pr-3">
                          {icon
                            ? <img src={icon} alt="" className="w-6 h-6 object-contain" onError={e => e.target.style.display='none'} />
                            : <span className="text-slate-700 text-xs">—</span>}
                        </td>
                        <td className="py-2 pr-3 font-mono text-crystal-400">
                          {item.type ?? '—'}
                          {isTierItem && <span className="ml-1 text-crystal-500 text-xs">⬆</span>}
                        </td>
                        <td className="py-2 pr-3 text-white">{getItemDisplayName(item.type)}</td>
                        <td className="py-2 pr-3 text-right font-mono text-emerald-400">
                          {item.sellPrice != null ? formatPrice(item.sellPrice) + '€' : '—'}
                        </td>
                        <td className="py-2 pr-3 text-slate-400">{item.category ?? '—'}</td>
                        <td className="py-2">
                          <span className={dataSource === 'mock' ? 'profit-badge-neutral' : 'profit-badge-positive'} style={{ fontSize: '10px' }}>
                            {dataSource === 'mock' ? 'démo' : 'API'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {items.length > 50 && (
              <button
                className="btn-secondary text-xs py-1.5 px-3 mt-3"
                onClick={() => setShowAllItems(!showAllItems)}
              >
                {showAllItems ? `Réduire (afficher 50)` : `Voir tous les ${items.length} items`}
              </button>
            )}
          </>
        )}
      </div>

      {/* JSON brut */}
      {showRaw && (
        <div className="hex-card p-5 fade-in-up">
          <h3 className="font-display text-xs text-crystal-400 tracking-widest mb-3">
            JSON EXTRAIT
          </h3>
          <pre className="text-xs text-slate-400 font-mono overflow-auto max-h-80 bg-black/30 p-3 rounded-lg">
            {JSON.stringify(debugData ?? items, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
