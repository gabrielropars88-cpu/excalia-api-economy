import React, { useState, useMemo } from 'react';
import { useEconomy } from '../App';
import { simulateQuantity, calcCraftableFromBase, formatCurrency, formatNumber } from '../utils/profitability';
import recipes from '../data/recipes.json';
import { Calculator, TrendingUp, Package, Zap, ChevronRight } from 'lucide-react';

export default function Simulator() {
  const { priceMap } = useEconomy();
  const [selectedFamily, setSelectedFamily] = useState('iron');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('units'); // units | stacks | blocks

  const families = Object.keys(recipes.families);
  const familyDef = recipes.families[selectedFamily];

  const resolvedQty = useMemo(() => {
    const n = parseFloat(quantity.replace(/\s/g, '').replace(',', '.')) || 0;
    if (unit === 'stacks') return Math.floor(n * 64);
    if (unit === 'blocks') return Math.floor(n * (familyDef?.blockRatio ?? 9));
    return Math.floor(n);
  }, [quantity, unit, familyDef]);

  const simulation = useMemo(() => {
    if (!resolvedQty || resolvedQty <= 0) return null;
    return simulateQuantity(resolvedQty, selectedFamily, priceMap);
  }, [resolvedQty, selectedFamily, priceMap]);

  const craftables = useMemo(() => {
    if (!resolvedQty) return [];
    return Object.keys(familyDef?.tiers ?? {}).map(tierKey => ({
      tierKey,
      craftable: calcCraftableFromBase(resolvedQty, tierKey, selectedFamily),
    }));
  }, [resolvedQty, selectedFamily, familyDef]);

  const presets = [
    { label: '1 stack', value: 64, u: 'units' },
    { label: '10 stacks', value: 640, u: 'units' },
    { label: '1k', value: 1000, u: 'units' },
    { label: '10k', value: 10000, u: 'units' },
    { label: '100k', value: 100000, u: 'units' },
    { label: '1M', value: 1000000, u: 'units' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-white tracking-wider flex items-center gap-2">
          <Calculator size={20} className="text-crystal-400" /> SIMULATEUR DE VENTE
        </h2>
        <p className="text-slate-400 text-sm mt-1">Calculez le revenu optimal selon votre stock</p>
      </div>

      {/* Config */}
      <div className="hex-card p-5">
        <h3 className="font-display text-xs text-crystal-400 tracking-widest mb-4">CONFIGURATION</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Family */}
          <div>
            <label className="text-xs text-slate-400 font-display tracking-wider block mb-2">RESSOURCE</label>
            <select
              className="w-full py-2.5 px-3 text-sm rounded-lg bg-void-700 border border-crystal-500/20 text-slate-200 focus:outline-none focus:border-crystal-500/40"
              value={selectedFamily}
              onChange={e => setSelectedFamily(e.target.value)}
            >
              {families.map(f => (
                <option key={f} value={f}>{recipes.families[f].emoji} {recipes.families[f].label}</option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-xs text-slate-400 font-display tracking-wider block mb-2">QUANTITÉ</label>
            <div className="relative">
              <input
                type="text"
                className="w-full py-2.5 px-3 text-sm rounded-lg bg-void-700 border border-crystal-500/20 text-slate-200 focus:outline-none focus:border-crystal-500/50 font-mono pr-20"
                placeholder="100000"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
              {resolvedQty > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                  ={resolvedQty.toLocaleString('fr-FR')} u.
                </span>
              )}
            </div>
          </div>

          {/* Unit */}
          <div>
            <label className="text-xs text-slate-400 font-display tracking-wider block mb-2">UNITÉ DE SAISIE</label>
            <div className="flex gap-2">
              {[['units', 'Unités'], ['stacks', 'Stacks (×64)'], ['blocks', 'Blocs']].map(([v, l]) => (
                <button key={v} onClick={() => setUnit(v)}
                  className={`flex-1 py-2 px-2 text-xs rounded-lg font-semibold transition-all ${unit === v ? 'bg-crystal-500/20 text-crystal-300 border border-crystal-500/40' : 'text-slate-500 bg-void-700/50 border border-slate-700/50'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Presets */}
        <div className="mt-4">
          <label className="text-xs text-slate-500 font-display tracking-wider block mb-2">RACCOURCIS</label>
          <div className="flex flex-wrap gap-2">
            {presets.map(p => (
              <button key={p.label} onClick={() => { setQuantity(String(p.value)); setUnit(p.u); }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-void-700/60 border border-slate-700/60 text-slate-400 hover:text-crystal-300 hover:border-crystal-500/30 transition-all">
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {simulation && (
        <>
          {/* Craftable summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="hex-card p-4">
              <p className="text-xs text-slate-500 font-display tracking-wider">UNITÉS BRUTES</p>
              <p className="font-display text-xl font-bold text-white mt-1">{formatNumber(resolvedQty)}</p>
              <p className="text-xs text-slate-500">{Math.floor(resolvedQty / 64)} stacks + {resolvedQty % 64}</p>
            </div>
            {craftables.map(({ tierKey, craftable }) => (
              <div key={tierKey} className="hex-card p-4" style={{ borderColor: craftable > 0 ? `${familyDef.color}30` : undefined }}>
                <p className="text-xs text-slate-500 font-display tracking-wider">{tierKey.toUpperCase()} CRAFTABLES</p>
                <p className="font-display text-xl font-bold mt-1" style={{ color: craftable > 0 ? familyDef.color : '#ef4444' }}>
                  {craftable > 0 ? formatNumber(craftable) : '0'}
                </p>
                <p className="text-xs text-slate-500">{craftable > 0 ? `+ ${(resolvedQty % (resolvedQty / (craftable || 1) || 1)).toFixed(0)} reste` : 'Insuffisant'}</p>
              </div>
            ))}
          </div>

          {/* Revenue comparison */}
          <div className="hex-card p-5">
            <h3 className="font-display text-xs text-crystal-400 tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp size={14} /> COMPARAISON DES REVENUS
            </h3>
            <div className="space-y-3">
              {simulation.results.map((result, i) => {
                const isBest = result.key === simulation.best.key;
                const isWorst = result.key === simulation.worst.key;
                const maxRev = simulation.best.revenue || 1;
                const pct = (result.revenue / maxRev) * 100;
                return (
                  <div key={result.key} className={`p-4 rounded-xl transition-all ${isBest ? 'ring-1' : ''}`}
                    style={{
                      background: isBest ? `${familyDef.color}10` : 'rgba(15,23,42,0.5)',
                      border: isBest ? `1px solid ${familyDef.color}40` : '1px solid rgba(30,41,59,0.6)',
                    }}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-display text-xs text-slate-500 w-5">{i + 1}</span>
                      <span className="font-semibold text-slate-200 flex-1">
                        {isBest && '🏆 '}{isWorst && '⚠️ '}{result.label}
                      </span>
                      <span className="font-display text-lg font-bold" style={{ color: isBest ? familyDef.color : '#10b981' }}>
                        {formatCurrency(result.revenue)}
                      </span>
                      {isBest ? <span className="profit-badge-positive">OPTIMAL</span>
                        : isWorst ? <span className="profit-badge-negative">PIRE</span>
                        : null}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-void-700 rounded-full h-2">
                        <div className="h-full rounded-full transition-all duration-700" style={{
                          width: `${pct}%`,
                          background: isBest ? familyDef.color : `${familyDef.color}50`,
                        }} />
                      </div>
                      {result.leftover > 0 && (
                        <span className="text-xs text-slate-500">
                          +{formatNumber(result.leftover)} en lingots
                        </span>
                      )}
                      {result.cantCraft && (
                        <span className="text-xs text-red-400">
                          Besoin: {formatNumber(result.required)} min.
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gain summary */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="hex-card p-4" style={{ borderColor: `${familyDef.color}30` }}>
              <p className="text-xs text-slate-500 font-display tracking-wider mb-2">💰 REVENU OPTIMAL</p>
              <p className="font-display text-2xl font-bold" style={{ color: familyDef.color }}>
                {formatCurrency(simulation.best.revenue)}
              </p>
              <p className="text-sm text-slate-400 mt-1">{simulation.best.label}</p>
            </div>
            <div className="hex-card p-4">
              <p className="text-xs text-slate-500 font-display tracking-wider mb-2">📦 REVENU BRUT</p>
              <p className="font-display text-2xl font-bold text-slate-300">
                {formatCurrency(simulation.results.find(r => r.key === 'base')?.revenue ?? simulation.worst.revenue)}
              </p>
              <p className="text-sm text-slate-500 mt-1">Vente directe</p>
            </div>
            <div className="hex-card p-4" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
              <p className="text-xs text-slate-500 font-display tracking-wider mb-2">💹 GAIN SUPPLÉMENTAIRE</p>
              {(() => {
                const rawRev = simulation.results.find(r => r.key === 'base')?.revenue ?? simulation.worst.revenue;
                const gain = simulation.best.revenue - rawRev;
                const gainPct = rawRev > 0 ? (gain / rawRev) * 100 : 0;
                return (
                  <>
                    <p className="font-display text-2xl font-bold text-emerald-400">
                      +{formatCurrency(gain)}
                    </p>
                    <p className="text-sm text-emerald-500 mt-1">+{gainPct.toFixed(1)}% de gain</p>
                  </>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {!simulation && (
        <div className="hex-card p-10 text-center">
          <Calculator size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="font-display text-crystal-400 tracking-widest text-sm">EN ATTENTE</p>
          <p className="text-slate-500 mt-2">Sélectionnez une ressource et entrez une quantité pour simuler.</p>
        </div>
      )}
    </div>
  );
}
