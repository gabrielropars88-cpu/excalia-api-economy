import React, { useState, useMemo } from 'react';
import { useEconomy } from '../App';
import { formatCurrency } from '../utils/profitability';
import { getItemDisplayName } from '../utils/itemDisplay';
import { resolveTierPrice } from '../services/excaliaApi';
import recipes from '../data/recipes.json';
import {
  BarChart2, TrendingUp, TrendingDown, ArrowUpDown, Filter,
  CheckCircle, XCircle, AlertTriangle, Info, Search
} from 'lucide-react';

const { stackSize } = recipes; // 64

// Calcule les unités de base pour un tier donné
// T1 = 9 stacks × 64 = 576
// T2 = 9 × T1 = 5 184
// T3 = 9 × T2 = 46 656
// T4 = 9 × T3 = 419 904
function getBaseUnits(tierIndex) {
  // tierIndex : 0 = T1, 1 = T2, 2 = T3, 3 = T4
  const t1 = 9 * stackSize; // 9 stacks * 64 = 576
  let total = t1;
  for (let i = 0; i < tierIndex; i++) total *= 9;
  return total;
}

// Noms d'affichage corrects selon les règles du brief
const FAMILY_DISPLAY = {
  iron:      { base: 'Lingot de fer',        block: 'Bloc de fer',          tier: 'Fer compressé' },
  gold:      { base: "Lingot d'or",          block: "Bloc d'or",            tier: 'Or compressé' },
  copper:    { base: 'Lingot de cuivre',     block: 'Bloc de cuivre',       tier: 'Cuivre compressé' },
  coal:      { base: 'Charbon',              block: 'Bloc de charbon',      tier: 'Charbon compressé' },
  diamond:   { base: 'Diamant',              block: 'Bloc de diamant',      tier: 'Diamant compressé' },
  emerald:   { base: 'Émeraude',             block: "Bloc d'émeraude",      tier: 'Émeraude compressée' },
  redstone:  { base: 'Redstone',             block: 'Bloc de redstone',     tier: 'Redstone compressé' },
  lapis:     { base: 'Lapis-lazuli',         block: 'Bloc de lapis-lazuli', tier: 'Lapis compressé' },
  quartz:    { base: 'Quartz',               block: 'Bloc de quartz',       tier: 'Quartz compressé' },
  netherite: { base: 'Lingot de netherite',  block: 'Bloc de netherite',    tier: 'Netherite compressé' },
};

function formatPct(n) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  const sign = n >= 0 ? '+' : '';
  return sign + Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' %';
}

function PriceMissing({ label = 'Non trouvé dans l\'API' }) {
  return (
    <span className="flex items-center gap-1 text-amber-400 text-xs font-mono whitespace-nowrap">
      <AlertTriangle size={11} /> {label}
    </span>
  );
}

// Construit toutes les lignes du tableau comparatif
function buildRows(priceMap) {
  const rows = [];

  for (const [familyKey, familyDef] of Object.entries(recipes.families)) {
    const display = FAMILY_DISPLAY[familyKey] ?? { base: familyDef.label, block: `Bloc de ${familyDef.label.toLowerCase()}`, tier: `${familyDef.label} compressé` };
    const blockRatio = familyDef.blockRatio ?? 9;
    const baseItemId = familyDef.baseItem;
    const blockItemId = familyDef.blockItem;

    const basePrice = priceMap[baseItemId] ?? null;  // null = manquant
    const blockPrice = priceMap[blockItemId] ?? null;

    // ─── Ligne : ressource de base ───────────────────────────────────────
    rows.push({
      id: `${familyKey}_base`,
      family: familyKey,
      familyLabel: familyDef.label,
      familyColor: familyDef.color,
      familyEmoji: familyDef.emoji,
      tier: 'Base',
      tierNum: 0,
      type: 'base',
      itemName: display.base,
      baseUnits: 1,
      blocksEquiv: (1 / blockRatio),
      baseUnitPrice: basePrice,
      directSaleValue: basePrice,
      tierPrice: basePrice,
      profit: 0,
      profitPct: 0,
      revenuePerBase: basePrice,
      isRentable: null,
      isBestOfFamily: false,
      missingPrice: basePrice === null,
    });

    // ─── Ligne : bloc ────────────────────────────────────────────────────
    if (blockItemId) {
      const directVal = basePrice !== null ? blockRatio * basePrice : null;
      const profit = (blockPrice !== null && directVal !== null) ? blockPrice - directVal : null;
      const profitPct = (profit !== null && directVal !== null && directVal > 0) ? (profit / directVal) * 100 : null;
      rows.push({
        id: `${familyKey}_block`,
        family: familyKey,
        familyLabel: familyDef.label,
        familyColor: familyDef.color,
        familyEmoji: familyDef.emoji,
        tier: 'Bloc',
        tierNum: 0.5,
        type: 'block',
        itemName: display.block,
        baseUnits: blockRatio,
        blocksEquiv: 1,
        baseUnitPrice: basePrice,
        directSaleValue: directVal,
        tierPrice: blockPrice,
        profit,
        profitPct,
        revenuePerBase: (blockPrice !== null) ? blockPrice / blockRatio : null,
        isRentable: profit !== null ? profit > 0 : null,
        isBestOfFamily: false,
        missingPrice: blockPrice === null,
      });
    }

    // ─── Lignes : tiers T1 → T4 ─────────────────────────────────────────
    const tierKeys = Object.keys(familyDef.tiers);
    tierKeys.forEach((tierKey, idx) => {
      const tierNum = idx + 1; // 1, 2, 3, 4
      const baseUnits = getBaseUnits(idx);
      const blocksEquiv = baseUnits / blockRatio;

      // ⚠ CORRECTION PRINCIPALE :
      // On ne cherche plus uniquement "iron_t1" — on tente TOUS les patterns possibles
      // (iron_t1, iron_compressed_1, compressed_iron_1, iron_1, etc.)
      const resolved = resolveTierPrice(familyKey, tierKey, priceMap);
      const tierPrice = resolved ? resolved.price : null;
      const tierApiKey = resolved ? resolved.key : `${familyKey}_${tierKey} (non trouvé)`;

      const directVal = basePrice !== null ? baseUnits * basePrice : null;
      const profit = (tierPrice !== null && directVal !== null) ? tierPrice - directVal : null;
      const profitPct = (profit !== null && directVal !== null && directVal > 0) ? (profit / directVal) * 100 : null;

      rows.push({
        id: `${familyKey}_${tierKey}`,
        family: familyKey,
        familyLabel: familyDef.label,
        familyColor: familyDef.color,
        familyEmoji: familyDef.emoji,
        tier: `T${tierNum}`,
        tierNum,
        type: 'compressed',
        itemName: `${display.tier} T${tierNum}`,
        baseUnits,
        blocksEquiv,
        baseUnitPrice: basePrice,
        directSaleValue: directVal,
        tierPrice,       // null = non trouvé (jamais 0, jamais undefined)
        tierApiKey,      // nom exact utilisé dans l'API (pour debug inline)
        profit,
        profitPct,
        revenuePerBase: (tierPrice !== null) ? tierPrice / baseUnits : null,
        isRentable: profit !== null ? profit > 0 : null,
        isBestOfFamily: false,
        missingPrice: tierPrice === null,
      });
    });
  }

  // Marquer la meilleure option par famille (revenue/base max)
  const families = [...new Set(rows.map(r => r.family))];
  for (const fam of families) {
    const famRows = rows.filter(r => r.family === fam && r.revenuePerBase !== null);
    if (!famRows.length) continue;
    const best = famRows.reduce((a, b) => (a.revenuePerBase > b.revenuePerBase ? a : b));
    const row = rows.find(r => r.id === best.id);
    if (row) row.isBestOfFamily = true;
  }

  return rows;
}

const SORT_OPTIONS = [
  { value: 'profitPct_desc',    label: '% Profit ↓ (plus rentable)' },
  { value: 'profitPct_asc',     label: '% Profit ↑ (moins rentable)' },
  { value: 'profit_desc',       label: 'Profit absolu ↓' },
  { value: 'profit_asc',        label: 'Profit absolu ↑' },
  { value: 'tierPrice_desc',    label: 'Prix tier ↓' },
  { value: 'tierPrice_asc',     label: 'Prix tier ↑' },
  { value: 'family_asc',        label: 'Famille A→Z' },
];

export default function TiersComparator() {
  const { priceMap, loading } = useEconomy();
  const [sortKey, setSortKey]           = useState('profitPct_desc');
  const [filterFamily, setFilterFamily] = useState('all');
  const [filterTier, setFilterTier]     = useState('all');
  const [filterRent, setFilterRent]     = useState('all');  // 'all' | 'rentable' | 'perte'
  const [expandFamily, setExpandFamily] = useState(null);

  const allRows = useMemo(() => buildRows(priceMap), [priceMap]);

  const familyKeys = useMemo(() => [...new Set(allRows.map(r => r.family))], [allRows]);

  // Compter les tiers manquants pour la bannière de diagnostic
  const missingTiersCount = useMemo(
    () => allRows.filter(r => r.type === 'compressed' && r.missingPrice).length,
    [allRows]
  );
  const totalTiersCount = useMemo(
    () => allRows.filter(r => r.type === 'compressed').length,
    [allRows]
  );
  const tierLabels = ['Base', 'Bloc', 'T1', 'T2', 'T3', 'T4'];

  // Résumé meilleure option par famille
  const bestByFamily = useMemo(() => {
    const result = {};
    for (const fam of familyKeys) {
      const famRows = allRows.filter(r => r.family === fam && r.revenuePerBase !== null);
      if (!famRows.length) continue;
      result[fam] = famRows.reduce((a, b) => (a.revenuePerBase > b.revenuePerBase ? a : b));
    }
    return result;
  }, [allRows, familyKeys]);

  const filteredRows = useMemo(() => {
    let rows = [...allRows];
    if (filterFamily !== 'all') rows = rows.filter(r => r.family === filterFamily);
    if (filterTier !== 'all')   rows = rows.filter(r => r.tier === filterTier);
    if (filterRent === 'rentable') rows = rows.filter(r => r.isRentable === true);
    if (filterRent === 'perte')    rows = rows.filter(r => r.isRentable === false);

    const [field, dir] = sortKey.split('_');
    rows.sort((a, b) => {
      const av = a[field] ?? -Infinity;
      const bv = b[field] ?? -Infinity;
      if (typeof av === 'string') return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return dir === 'asc' ? av - bv : bv - av;
    });
    return rows;
  }, [allRows, filterFamily, filterTier, filterRent, sortKey]);

  const familyDefs = recipes.families;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-xl font-bold text-white tracking-wider flex items-center gap-2">
          <BarChart2 size={20} className="text-crystal-400" />
          COMPARATEUR TIERS
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Comparaison de la rentabilité des ressources compressées T1→T4 vs vente directe
        </p>
      </div>

      {/* Explications calcul */}
      <div className="hex-card p-4 flex items-start gap-3 text-sm text-slate-400">
        <Info size={15} className="text-crystal-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="text-white font-semibold">Comment c'est calculé : </span>
          T1 = 9 stacks × 64 = <span className="text-crystal-400 font-mono">576</span> ressources de base.{' '}
          T2 = 9 × T1 = <span className="text-crystal-400 font-mono">5 184</span>.{' '}
          T3 = 9 × T2 = <span className="text-crystal-400 font-mono">46 656</span>.{' '}
          T4 = 9 × T3 = <span className="text-crystal-400 font-mono">419 904</span>.{' '}
          Le profit = prix tier API − (qté × prix unitaire API). <span className="text-amber-400">Aucun prix n'est inventé.</span>
        </div>
      </div>

      {/* Bannière diagnostic tiers manquants */}
      {missingTiersCount > 0 && (
        <div className="hex-card p-4 flex items-start gap-3"
          style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.25)' }}>
          <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 font-semibold text-sm">
              {missingTiersCount}/{totalTiersCount} tiers non trouvés dans l'API
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Le site cherche des clés comme <code className="font-mono bg-slate-800 px-1 rounded">iron_t1</code>, <code className="font-mono bg-slate-800 px-1 rounded">diamond_compressed_1</code>...
              mais ces identifiants n'existent pas dans les données actuelles.
              Consultez la page <strong className="text-crystal-400">Debug API → Tiers manquants</strong> pour voir exactement quelles clés ont été essayées.
              Les lignes avec "Non trouvé dans l'API" affichent les calculs théoriques sans prix tier.
            </p>
          </div>
        </div>
      )}

      {/* Tiers tous trouvés */}
      {missingTiersCount === 0 && totalTiersCount > 0 && (
        <div className="hex-card p-3 flex items-center gap-3"
          style={{ background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.2)' }}>
          <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-300 text-xs">
            Tous les tiers ({totalTiersCount}) sont présents dans l'API. Calculs de rentabilité complets.
          </p>
        </div>
      )}

      {/* Best par famille — résumé rapide */}
      <div className="hex-card p-5">
        <h3 className="font-display text-xs tracking-widest text-crystal-400 mb-4">
          🏆 MEILLEURE OPTION PAR FAMILLE
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {familyKeys.map(fam => {
            const best = bestByFamily[fam];
            const def = familyDefs[fam];
            return (
              <div key={fam} className="rounded-lg p-3 text-center"
                style={{ background: `${def.color}0d`, border: `1px solid ${def.color}30` }}>
                <div className="text-xl mb-1">{def.emoji}</div>
                <div className="font-display text-xs font-bold mb-1" style={{ color: def.color }}>
                  {def.label.toUpperCase()}
                </div>
                {best ? (
                  <>
                    <div className="text-xs text-white font-semibold">{best.tier}</div>
                    <div className="text-xs font-mono text-emerald-400 mt-0.5">
                      {best.revenuePerBase !== null ? formatCurrency(best.revenuePerBase) + '/u' : <PriceMissing />}
                    </div>
                    {best.profitPct !== null && best.type !== 'base' && (
                      <div className={`text-xs font-mono mt-0.5 ${best.profitPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatPct(best.profitPct)}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-slate-500">—</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Filtres et tris */}
      <div className="hex-card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Tri */}
          <div className="flex flex-col gap-1 min-w-52">
            <label className="text-xs text-slate-500 font-display tracking-widest flex items-center gap-1">
              <ArrowUpDown size={11} /> TRI
            </label>
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg bg-void-700 border border-crystal-500/20 text-slate-200 focus:outline-none focus:border-crystal-500/50"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Filtre famille */}
          <div className="flex flex-col gap-1 min-w-36">
            <label className="text-xs text-slate-500 font-display tracking-widest flex items-center gap-1">
              <Filter size={11} /> MINERAI
            </label>
            <select
              value={filterFamily}
              onChange={e => setFilterFamily(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg bg-void-700 border border-crystal-500/20 text-slate-200 focus:outline-none focus:border-crystal-500/50"
            >
              <option value="all">Tous les minerais</option>
              {familyKeys.map(f => (
                <option key={f} value={f}>{familyDefs[f].emoji} {familyDefs[f].label}</option>
              ))}
            </select>
          </div>

          {/* Filtre tier */}
          <div className="flex flex-col gap-1 min-w-32">
            <label className="text-xs text-slate-500 font-display tracking-widest">TIER</label>
            <select
              value={filterTier}
              onChange={e => setFilterTier(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg bg-void-700 border border-crystal-500/20 text-slate-200 focus:outline-none focus:border-crystal-500/50"
            >
              <option value="all">Tous les tiers</option>
              {tierLabels.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Filtre rentabilité */}
          <div className="flex flex-col gap-1 min-w-36">
            <label className="text-xs text-slate-500 font-display tracking-widest">RENTABILITÉ</label>
            <select
              value={filterRent}
              onChange={e => setFilterRent(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg bg-void-700 border border-crystal-500/20 text-slate-200 focus:outline-none focus:border-crystal-500/50"
            >
              <option value="all">Tout afficher</option>
              <option value="rentable">✅ Rentable uniquement</option>
              <option value="perte">❌ Perte uniquement</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 pb-1 ml-auto">
            {filteredRows.length} ligne{filteredRows.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Tableau principal */}
      <div className="hex-card p-5 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700/50 text-slate-400 font-display tracking-widest text-left">
              <th className="py-2 pr-3">Famille</th>
              <th className="py-2 pr-3">Tier</th>
              <th className="py-2 pr-3">Item</th>
              <th className="py-2 pr-3 text-right">Qté base</th>
              <th className="py-2 pr-3 text-right">Éq. blocs</th>
              <th className="py-2 pr-3 text-right">Prix unitaire</th>
              <th className="py-2 pr-3 text-right">Valeur vente directe</th>
              <th className="py-2 pr-3 text-right">Prix tier (API)</th>
              <th className="py-2 pr-3 text-right">Profit</th>
              <th className="py-2 pr-3 text-right">Rentabilité %</th>
              <th className="py-2 text-center">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const isBest = row.isBestOfFamily;
              const isBase = row.type === 'base';
              return (
                <tr
                  key={row.id}
                  className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${isBest ? 'bg-crystal-500/5' : ''}`}
                >
                  {/* Famille */}
                  <td className="py-2 pr-3">
                    <span className="flex items-center gap-1.5">
                      <span>{row.familyEmoji}</span>
                      <span className="font-semibold" style={{ color: row.familyColor }}>{row.familyLabel}</span>
                    </span>
                  </td>

                  {/* Tier badge */}
                  <td className="py-2 pr-3">
                    <span className="px-2 py-0.5 rounded text-xs font-display font-bold"
                      style={{
                        background: isBase ? 'rgba(100,116,139,0.15)' : `${row.familyColor}18`,
                        color: isBase ? '#94a3b8' : row.familyColor,
                        border: `1px solid ${isBase ? 'rgba(100,116,139,0.3)' : row.familyColor + '35'}`,
                      }}>
                      {row.tier}
                    </span>
                    {isBest && <span className="ml-1">🏆</span>}
                  </td>

                  {/* Item */}
                  <td className="py-2 pr-3 text-white">{row.itemName}</td>

                  {/* Quantité base */}
                  <td className="py-2 pr-3 text-right font-mono text-slate-300">
                    {isBase ? '1' : row.baseUnits.toLocaleString('fr-FR')}
                  </td>

                  {/* Équivalent blocs */}
                  <td className="py-2 pr-3 text-right font-mono text-slate-400">
                    {isBase ? '—' : row.blocksEquiv < 1
                      ? '< 1'
                      : row.blocksEquiv.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}
                  </td>

                  {/* Prix unitaire */}
                  <td className="py-2 pr-3 text-right font-mono">
                    {row.baseUnitPrice !== null
                      ? <span className="text-gold-300">{formatCurrency(row.baseUnitPrice)}</span>
                      : <PriceMissing />}
                  </td>

                  {/* Valeur vente directe */}
                  <td className="py-2 pr-3 text-right font-mono">
                    {isBase ? '—' : row.directSaleValue !== null
                      ? <span className="text-slate-300">{formatCurrency(row.directSaleValue)}</span>
                      : <PriceMissing />}
                  </td>

                  {/* Prix tier (API) */}
                  <td className="py-2 pr-3 text-right font-mono">
                    {row.tierPrice !== null
                      ? <span className="text-crystal-300 font-bold">{formatCurrency(row.tierPrice)}</span>
                      : isBase
                      ? <span className="text-slate-500 text-xs">—</span>
                      : <PriceMissing />}
                  </td>

                  {/* Profit */}
                  <td className="py-2 pr-3 text-right font-mono">
                    {isBase ? '—' : row.profit !== null
                      ? <span className={row.profit >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                          {row.profit >= 0 ? '+' : ''}{formatCurrency(row.profit)}
                        </span>
                      : <PriceMissing />}
                  </td>

                  {/* Rentabilité % */}
                  <td className="py-2 pr-3 text-right font-mono">
                    {isBase ? '—' : row.profitPct !== null
                      ? <span className={row.profitPct >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {formatPct(row.profitPct)}
                        </span>
                      : <PriceMissing />}
                  </td>

                  {/* Statut */}
                  <td className="py-2 text-center">
                    {isBase
                      ? <span className="text-slate-500 text-xs">base</span>
                      : row.missingPrice
                      ? <span className="profit-badge-neutral flex items-center gap-1 w-fit mx-auto">
                          <AlertTriangle size={10} /> manquant
                        </span>
                      : row.isRentable
                      ? <span className="profit-badge-positive flex items-center gap-1 w-fit mx-auto">
                          <CheckCircle size={10} /> rentable
                        </span>
                      : <span className="profit-badge-negative flex items-center gap-1 w-fit mx-auto">
                          <XCircle size={10} /> perte
                        </span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredRows.length === 0 && (
          <div className="text-center py-10 text-slate-500 text-sm">
            Aucune ligne ne correspond aux filtres sélectionnés.
          </div>
        )}
      </div>

      {/* Détail famille sélectionnée */}
      {filterFamily !== 'all' && (() => {
        const fam = filterFamily;
        const def = familyDefs[fam];
        const display = FAMILY_DISPLAY[fam] ?? { base: def.label, block: `Bloc`, tier: def.label };
        const famRows = allRows.filter(r => r.family === fam);

        return (
          <div className="hex-card p-5" style={{ borderColor: `${def.color}30` }}>
            <h3 className="font-display text-xs tracking-widest mb-4 flex items-center gap-2" style={{ color: def.color }}>
              {def.emoji} ANALYSE DÉTAILLÉE — {def.label.toUpperCase()}
            </h3>
            <div className="space-y-3">
              {famRows.map(row => {
                const isBase = row.type === 'base';
                return (
                  <div key={row.id} className="p-3 rounded-lg"
                    style={{
                      background: row.isBestOfFamily ? `${def.color}12` : 'rgba(15,23,42,0.4)',
                      border: `1px solid ${row.isBestOfFamily ? def.color + '40' : 'rgba(30,41,59,0.6)'}`,
                    }}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-display font-bold"
                          style={{
                            background: `${def.color}18`,
                            color: def.color,
                            border: `1px solid ${def.color}35`,
                          }}>
                          {row.tier}
                        </span>
                        <span className="font-semibold text-white text-sm">{row.itemName}</span>
                        {row.isBestOfFamily && <span className="text-xs">🏆 Meilleure option</span>}
                      </div>
                      {!isBase && !row.missingPrice && row.isRentable !== null && (
                        <span className={row.isRentable ? 'profit-badge-positive' : 'profit-badge-negative'}>
                          {row.isRentable ? '✅ Rentable' : '❌ Perte'}
                        </span>
                      )}
                    </div>

                    {!isBase && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
                        <div>
                          <p className="text-slate-500 mb-0.5">Ressources utilisées</p>
                          <p className="font-mono text-slate-200">{row.baseUnits.toLocaleString('fr-FR')} {display.base.toLowerCase()}s</p>
                          <p className="font-mono text-slate-500 text-xs">= {Math.round(row.baseUnits / 64)} stacks + {row.baseUnits % 64} rest.</p>
                        </div>
                        <div>
                          <p className="text-slate-500 mb-0.5">Valeur vente directe</p>
                          {row.directSaleValue !== null
                            ? <p className="font-mono text-slate-300">{formatCurrency(row.directSaleValue)}</p>
                            : <PriceMissing />}
                          <p className="text-slate-600 text-xs">({row.baseUnits.toLocaleString('fr-FR')} × prix unitaire)</p>
                        </div>
                        <div>
                          <p className="text-slate-500 mb-0.5">Prix vente {row.tier} (API)</p>
                          {row.tierPrice !== null
                            ? <p className="font-mono text-crystal-300 font-bold">{formatCurrency(row.tierPrice)}</p>
                            : <PriceMissing />}
                        </div>
                        <div>
                          <p className="text-slate-500 mb-0.5">Profit</p>
                          {row.profit !== null
                            ? <>
                                <p className={`font-mono font-bold ${row.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {row.profit >= 0 ? '+' : ''}{formatCurrency(row.profit)}
                                </p>
                                <p className={`text-xs font-mono ${row.profitPct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {formatPct(row.profitPct)}
                                </p>
                              </>
                            : <PriceMissing />}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
