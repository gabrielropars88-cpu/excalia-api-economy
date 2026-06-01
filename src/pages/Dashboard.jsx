import React, { useMemo } from 'react';
import { useEconomy } from '../App';
import { rankAllFamilies, topCrafts, worstCrafts, formatCurrency, formatNumber } from '../utils/profitability';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Zap, Award, AlertTriangle, Activity } from 'lucide-react';
import recipes from '../data/recipes.json';

export default function Dashboard() {
  const { priceMap, items, isMock } = useEconomy();

  const ranked = useMemo(() => rankAllFamilies(priceMap), [priceMap]);
  const top10 = useMemo(() => topCrafts(priceMap, 10), [priceMap]);
  const worst10 = useMemo(() => worstCrafts(priceMap, 10), [priceMap]);

  const chartData = ranked.map(r => ({
    name: r.label,
    best: parseFloat(r.best?.revenuePerBaseUnit?.toFixed(2) ?? 0),
    base: parseFloat(r.baseOption?.revenuePerBaseUnit?.toFixed(2) ?? 0),
    emoji: r.emoji,
    mcIcon: r.mcIcon ?? null,
    color: r.color,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="fade-in-up">
        <div className="flex items-center gap-3 mb-1">
          <Activity size={18} className="text-crystal-400" />
          <h2 className="font-display text-xl font-bold text-white tracking-wider">DASHBOARD</h2>
          {isMock && (
            <span className="profit-badge-neutral text-xs">MODE DÉMO</span>
          )}
        </div>
        <p className="text-slate-400 text-sm">Vue d'ensemble de l'économie Excalia en temps réel</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Familles analysées', value: ranked.length, icon: Zap, color: 'text-crystal-400' },
          { label: 'Items total', value: items.length, icon: Activity, color: 'text-emerald-400' },
          { label: 'Meilleure rentab.', value: ranked[0] ? `${ranked[0].label} ${ranked[0].best?.label?.split('(')[1]?.replace(')', '') ?? ''}` : '—', icon: Award, color: 'text-gold-400', small: true },
          { label: 'Gain max potentiel', value: ranked[0] ? `+${ranked[0].gainVsBase.toFixed(0)}%` : '—', icon: TrendingUp, color: 'text-ore-400' },
        ].map(({ label, value, icon: Icon, color, small }, i) => (
          <div key={i} className={`stat-card fade-in-up stagger-${i + 1}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-display">{label}</p>
              <Icon size={16} className={color} />
            </div>
            <p className={`stat-value text-white ${small ? 'text-base' : 'text-2xl'}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Chart - Revenue per base unit */}
      <div className="hex-card p-5 fade-in-up stagger-3">
        <h3 className="font-display text-xs text-crystal-400 tracking-widest mb-4 flex items-center gap-2">
          <TrendingUp size={14} />
          REVENUS PAR UNITÉ DE BASE — BRUT VS MEILLEUR FORMAT
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barGap={2}>
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Rajdhani' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={v => formatNumber(v)} />
            <Tooltip
              formatter={(v, name) => [formatCurrency(v), name === 'best' ? 'Meilleur format' : 'Lingots']}
              contentStyle={{ background: 'rgba(5,13,20,0.98)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 8, fontFamily: 'Rajdhani' }}
              labelStyle={{ color: '#38bdf8', fontFamily: 'Orbitron', fontSize: 11 }}
            />
            <Bar dataKey="base" name="Lingots" fill="rgba(71,85,105,0.5)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="best" name="Meilleur" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top & Worst side by side */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top 10 */}
        <div className="hex-card p-5 fade-in-up stagger-4">
          <h3 className="font-display text-xs text-ore-400 tracking-widest mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-ore-400" />
            TOP 10 MEILLEURS CRAFTS
          </h3>
          <div className="space-y-2">
            {top10.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.08)' }}>
                <span className="font-display text-xs text-slate-500 w-5 text-right">{i + 1}</span>
                {item.mcIcon ? <img src={item.mcIcon} alt={item.label} className="w-6 h-6 object-contain" style={{imageRendering:"pixelated"}} /> : <span className="text-lg">{item.emoji}</span>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{item.label}</p>
                  <p className="text-xs text-slate-500">×{item.efficiency.toFixed(2)} efficacité</p>
                </div>
                <span className="profit-badge-positive whitespace-nowrap">+{((item.efficiency - 1) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Worst 10 */}
        <div className="hex-card p-5 fade-in-up stagger-5">
          <h3 className="font-display text-xs text-red-400 tracking-widest mb-4 flex items-center gap-2">
            <TrendingDown size={14} className="text-red-400" />
            TOP 10 PIRES CRAFTS
          </h3>
          <div className="space-y-2">
            {worst10.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.08)' }}>
                <span className="font-display text-xs text-slate-500 w-5 text-right">{i + 1}</span>
                {item.mcIcon ? <img src={item.mcIcon} alt={item.label} className="w-6 h-6 object-contain" style={{imageRendering:"pixelated"}} /> : <span className="text-lg">{item.emoji}</span>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{item.label}</p>
                  <p className="text-xs text-slate-500">×{item.efficiency.toFixed(2)} efficacité</p>
                </div>
                {item.efficiency < 1
                  ? <span className="profit-badge-negative whitespace-nowrap">{((item.efficiency - 1) * 100).toFixed(0)}%</span>
                  : <span className="profit-badge-neutral whitespace-nowrap">+{((item.efficiency - 1) * 100).toFixed(0)}%</span>
                }
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Family overview table */}
      <div className="hex-card p-5 fade-in-up stagger-6 overflow-x-auto">
        <h3 className="font-display text-xs text-crystal-400 tracking-widest mb-4 flex items-center gap-2">
          <Award size={14} />
          RÉSUMÉ PAR FAMILLE
        </h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Famille</th>
              <th>Prix lingots</th>
              <th>Meilleur format</th>
              <th>Rev./unité</th>
              <th>Gain vs lingots</th>
              <th>Verdict</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((r) => {
              const basePrice = r.baseOption?.revenuePerBaseUnit ?? 0;
              const gain = r.gainVsBase;
              return (
                <tr key={r.family}>
                  <td>
                    <div className="flex items-center gap-2">
                      {r.mcIcon ? <img src={r.mcIcon} alt={r.label} className="w-6 h-6 object-contain" style={{imageRendering:"pixelated"}} /> : <span className="text-lg">{r.emoji}</span>}
                      <span className="font-semibold text-slate-200">{r.label}</span>
                    </div>
                  </td>
                  <td className="font-mono text-sm text-slate-400">{formatCurrency(basePrice)}</td>
                  <td>
                    <span className="text-crystal-300 font-semibold">{r.best?.label?.replace(r.label + ' (', '').replace(')', '') ?? '—'}</span>
                  </td>
                  <td className="font-mono text-sm text-emerald-400">{formatCurrency(r.best?.revenuePerBaseUnit ?? 0)}</td>
                  <td>
                    {gain > 5 ? (
                      <span className="profit-badge-positive">+{gain.toFixed(0)}%</span>
                    ) : gain < -5 ? (
                      <span className="profit-badge-negative">{gain.toFixed(0)}%</span>
                    ) : (
                      <span className="profit-badge-neutral">≈0%</span>
                    )}
                  </td>
                  <td>
                    {gain > 20 ? '🔥 Très rentable' : gain > 5 ? '✅ Rentable' : gain < -10 ? '❌ Perte' : '⚖️ Neutre'}
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
