import React, { useState, useMemo } from 'react';
import { useEconomy } from '../App';
import { calcFamilyProfitability, calcBaseUnitsForTier, formatCurrency, formatNumber } from '../utils/profitability';
import recipes from '../data/recipes.json';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';
import { GitCompare } from 'lucide-react';

export default function Comparator() {
  const { priceMap } = useEconomy();
  const [selectedFamily, setSelectedFamily] = useState('iron');

  const families = Object.keys(recipes.families);
  const profitData = useMemo(() => calcFamilyProfitability(selectedFamily, priceMap), [selectedFamily, priceMap]);
  const familyDef = recipes.families[selectedFamily];

  if (!profitData) return <div className="text-slate-400 text-center p-10">Aucune donnée disponible pour cette famille.</div>;

  const barData = profitData.options.map(opt => ({
    name: opt.label.replace(profitData.label + ' (', '').replace(')', '').replace(profitData.label + ' ', ''),
    rev: parseFloat(opt.revenuePerBaseUnit.toFixed(4)),
    efficiency: opt.efficiency,
    isBest: opt.key === profitData.best.key,
    isWorst: opt.key === profitData.worst.key,
  }));

  const tierDetails = Object.entries(familyDef.tiers ?? {}).map(([tierKey]) => {
    const baseUnits = calcBaseUnitsForTier(tierKey, selectedFamily);
    const tierId = `${selectedFamily}_${tierKey}`;
    const tierPrice = priceMap[tierId] ?? 0;
    const stacks = Math.floor(baseUnits / 64);
    const remainder = baseUnits % 64;
    const blocks = Math.floor(baseUnits / (familyDef.blockRatio ?? 9));
    return { tierKey, baseUnits, tierPrice, stacks, remainder, blocks };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-white tracking-wider flex items-center gap-2">
          <GitCompare size={20} className="text-crystal-400" /> COMPARATEUR DÉTAILLÉ
        </h2>
        <p className="text-slate-400 text-sm mt-1">Analyse complète d'une famille de minerais</p>
      </div>

      {/* Family selector */}
      <div className="flex flex-wrap gap-2">
        {families.map(f => {
          const def = recipes.families[f];
          const isSelected = f === selectedFamily;
          return (
            <button key={f} onClick={() => setSelectedFamily(f)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
              style={{
                background: isSelected ? `${def.color}20` : 'rgba(15,23,42,0.5)',
                border: isSelected ? `1px solid ${def.color}50` : '1px solid rgba(30,41,59,0.8)',
                boxShadow: isSelected ? `0 0 15px ${def.color}20` : 'none',
              }}>
              <span>{def.emoji}</span>
              <span style={{ color: isSelected ? def.color : undefined }}>{def.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main comparison */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="hex-card p-5">
          <h3 className="font-display text-xs tracking-widest mb-4" style={{ color: familyDef.color }}>
            REVENU PAR UNITÉ DE BASE — {profitData.label.toUpperCase()}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'Rajdhani' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={v => formatNumber(v)} />
              <Tooltip
                formatter={v => [formatCurrency(v), 'Rev./unité']}
                contentStyle={{ background: 'rgba(5,13,20,0.98)', border: `1px solid ${familyDef.color}40`, borderRadius: 8, fontFamily: 'Rajdhani' }}
              />
              <Bar dataKey="rev" radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.isBest ? familyDef.color : entry.isWorst ? '#ef4444' : '#334155'} fillOpacity={entry.isBest ? 0.9 : 0.6} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Best / worst */}
        <div className="space-y-4">
          <div className="hex-card p-4" style={{ borderColor: `${familyDef.color}30` }}>
            <p className="text-xs font-display tracking-widest text-slate-500 mb-2">🏆 MEILLEURE OPTION</p>
            <p className="font-display text-lg font-bold text-white">{profitData.best.label}</p>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <p className="text-xs text-slate-500">Prix vente</p>
                <p className="font-mono font-bold text-gold-300">{formatCurrency(profitData.best.pricePerUnit)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Rev./unité base</p>
                <p className="font-mono font-bold text-emerald-400">{formatCurrency(profitData.best.revenuePerBaseUnit)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Unités base req.</p>
                <p className="font-mono text-sm text-slate-300">{profitData.best.baseUnitsRequired.toLocaleString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Gain vs lingots</p>
                <span className="profit-badge-positive">+{profitData.gainVsBase.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="hex-card p-4" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
            <p className="text-xs font-display tracking-widest text-slate-500 mb-2">⚠️ PIRE OPTION</p>
            <p className="font-display text-base font-bold text-white">{profitData.worst.label}</p>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <p className="text-xs text-slate-500">Rev./unité base</p>
                <p className="font-mono font-bold text-red-400">{formatCurrency(profitData.worst.revenuePerBaseUnit)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Écart vs meilleur</p>
                <span className="profit-badge-negative">
                  {(((profitData.worst.revenuePerBaseUnit - profitData.best.revenuePerBaseUnit) / (profitData.best.revenuePerBaseUnit || 1)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tier details table */}
      {tierDetails.length > 0 && (
        <div className="hex-card p-5 overflow-x-auto">
          <h3 className="font-display text-xs tracking-widest mb-4" style={{ color: familyDef.color }}>
            DÉTAIL DES TIERS — COMPOSITION EN RESSOURCES
          </h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Unités base</th>
                <th>Stacks + reste</th>
                <th>Blocs éq.</th>
                <th>Prix vente</th>
                <th>Rev./unité base</th>
                <th>Calcul</th>
              </tr>
            </thead>
            <tbody>
              {tierDetails.map(({ tierKey, baseUnits, tierPrice, stacks, remainder, blocks }) => {
                const rev = tierPrice / (baseUnits || 1);
                const baseRev = profitData.baseOption?.revenuePerBaseUnit ?? 0;
                const gain = baseRev > 0 ? ((rev - baseRev) / baseRev) * 100 : 0;
                return (
                  <tr key={tierKey}>
                    <td>
                      <span className="font-display text-sm font-bold uppercase" style={{ color: familyDef.color }}>
                        {tierKey.toUpperCase()}
                      </span>
                    </td>
                    <td className="font-mono text-sm text-slate-300">{baseUnits.toLocaleString('fr-FR')}</td>
                    <td className="font-mono text-sm text-slate-400">
                      {stacks > 0 && `${stacks} stack${stacks > 1 ? 's' : ''}`}
                      {remainder > 0 && ` + ${remainder}`}
                    </td>
                    <td className="font-mono text-sm text-slate-400">{blocks.toLocaleString('fr-FR')}</td>
                    <td className="font-mono text-sm text-gold-300">{formatCurrency(tierPrice)}</td>
                    <td className="font-mono text-sm font-bold text-emerald-400">{formatCurrency(rev)}</td>
                    <td>
                      {gain > 5 ? <span className="profit-badge-positive">+{gain.toFixed(0)}%</span>
                        : gain < -5 ? <span className="profit-badge-negative">{gain.toFixed(0)}%</span>
                        : <span className="profit-badge-neutral">≈0%</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* All options full table */}
      <div className="hex-card p-5 overflow-x-auto">
        <h3 className="font-display text-xs tracking-widest mb-4 text-crystal-400">
          TABLEAU COMPLET DE COMPARAISON
        </h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Format</th>
              <th>Type</th>
              <th>Prix vente</th>
              <th>Base req.</th>
              <th>Rev./unité</th>
              <th>Efficacité</th>
              <th>Barre</th>
            </tr>
          </thead>
          <tbody>
            {profitData.options.map((opt, i) => {
              const isBest = opt.key === profitData.best.key;
              const pct = profitData.best.revenuePerBaseUnit > 0
                ? (opt.revenuePerBaseUnit / profitData.best.revenuePerBaseUnit) * 100 : 0;
              return (
                <tr key={opt.key} style={{ background: isBest ? `${familyDef.color}08` : undefined }}>
                  <td className="text-slate-500 font-mono text-xs">{i + 1}</td>
                  <td>
                    <span className={`font-semibold ${isBest ? 'text-white' : 'text-slate-300'}`}>{opt.label}</span>
                    {isBest && <span className="ml-2 text-xs">🏆</span>}
                  </td>
                  <td>
                    <span className="text-xs px-2 py-0.5 rounded" style={{
                      background: opt.type === 'compressed' ? `${familyDef.color}15` : 'rgba(71,85,105,0.3)',
                      color: opt.type === 'compressed' ? familyDef.color : '#94a3b8',
                      border: `1px solid ${opt.type === 'compressed' ? familyDef.color + '30' : 'rgba(71,85,105,0.4)'}`,
                    }}>
                      {opt.type === 'compressed' ? `T${opt.tier}` : opt.type}
                    </span>
                  </td>
                  <td className="font-mono text-sm text-gold-300">{formatCurrency(opt.pricePerUnit)}</td>
                  <td className="font-mono text-sm text-slate-400">{opt.baseUnitsRequired.toLocaleString('fr-FR')}</td>
                  <td className="font-mono text-sm font-bold" style={{ color: isBest ? familyDef.color : '#10b981' }}>
                    {formatCurrency(opt.revenuePerBaseUnit)}
                  </td>
                  <td className="font-mono text-xs text-slate-400">×{opt.efficiency.toFixed(3)}</td>
                  <td className="min-w-24">
                    <div className="bg-void-700 rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${Math.min(100, pct)}%`,
                        background: isBest ? familyDef.color : `${familyDef.color}60`,
                      }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
