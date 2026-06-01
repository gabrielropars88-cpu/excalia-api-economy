import React, { useMemo, useState } from 'react';
import { useEconomy } from '../App';
import { topCrafts, worstCrafts, rankAllFamilies, formatCurrency, formatNumber } from '../utils/profitability';
import { getPriceHistory } from '../services/excaliaApi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Award, Clock, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import recipes from '../data/recipes.json';

export default function TopProfits() {
  const { priceMap } = useEconomy();
  const [tab, setTab] = useState('top');

  const top10 = useMemo(() => topCrafts(priceMap, 10), [priceMap]);
  const worst10 = useMemo(() => worstCrafts(priceMap, 10), [priceMap]);
  const ranked = useMemo(() => rankAllFamilies(priceMap), [priceMap]);
  const history = useMemo(() => getPriceHistory(), []);

  // Build history chart data for top 3 families
  const top3Families = ranked.slice(0, 3).map(r => r.family);
  const historyChart = history.slice(-24).map(snap => {
    const point = { time: new Date(snap.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) };
    for (const fam of top3Families) {
      const def = recipes.families[fam];
      if (def) point[def.label] = snap.prices[def.baseItem] ?? null;
    }
    return point;
  });

  function exportExcel() {
    const rows = [
      ...top10.map((item, i) => ({
        Rang: i + 1,
        Type: 'Meilleur craft',
        Nom: item.label,
        Efficacité: item.efficiency.toFixed(4),
        'Rev./unité': item.revenuePerBaseUnit.toFixed(4),
        'Gain %': ((item.efficiency - 1) * 100).toFixed(1),
      })),
      ...worst10.map((item, i) => ({
        Rang: i + 1,
        Type: 'Pire craft',
        Nom: item.label,
        Efficacité: item.efficiency.toFixed(4),
        'Rev./unité': item.revenuePerBaseUnit.toFixed(4),
        'Gain %': ((item.efficiency - 1) * 100).toFixed(1),
      })),
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Top Profits');
    XLSX.writeFile(wb, 'excalia_top_profits.xlsx');
  }

  const COLORS = ['#38bdf8', '#10b981', '#fbbf24'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-white tracking-wider flex items-center gap-2">
            <Award size={20} className="text-gold-400" /> TOP PROFITS
          </h2>
          <p className="text-slate-400 text-sm mt-1">Classement général & évolution des prix</p>
        </div>
        <button className="btn-secondary" onClick={exportExcel}>
          <Download size={14} /> Export Excel
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[['top', '🏆 Top 10 crafts'], ['worst', '⚠️ Pires crafts'], ['ranking', '📊 Classement familles'], ['history', '📈 Historique']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-crystal-500/20 text-crystal-300 border border-crystal-500/40' : 'text-slate-500 hover:text-slate-300 bg-void-700/40 border border-slate-700/50'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* TOP 10 */}
      {tab === 'top' && (
        <div className="space-y-3">
          {top10.map((item, i) => (
            <PodiumCard key={i} item={item} rank={i + 1} isPositive={true} />
          ))}
        </div>
      )}

      {/* WORST 10 */}
      {tab === 'worst' && (
        <div className="space-y-3">
          {worst10.map((item, i) => (
            <PodiumCard key={i} item={item} rank={i + 1} isPositive={false} />
          ))}
        </div>
      )}

      {/* RANKING */}
      {tab === 'ranking' && (
        <div className="hex-card p-5 overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Famille</th>
                <th>Prix lingots</th>
                <th>Meilleur format</th>
                <th>Rev. optimal/u</th>
                <th>Gain%</th>
                <th>Tiers dispo</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r, i) => {
                const gain = r.gainVsBase;
                const def = recipes.families[r.family];
                return (
                  <tr key={r.family}>
                    <td>
                      <span className="font-display text-sm font-bold" style={{ color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#ea580c' : '#475569' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{r.emoji}</span>
                        <span className="font-semibold text-white">{r.label}</span>
                      </div>
                    </td>
                    <td className="font-mono text-sm text-slate-400">{formatCurrency(r.baseOption?.revenuePerBaseUnit ?? 0)}</td>
                    <td>
                      <span className="font-semibold" style={{ color: def?.color ?? '#94a3b8' }}>
                        {r.best?.label?.replace(r.label + ' (', '').replace(')', '') ?? '—'}
                      </span>
                    </td>
                    <td className="font-mono text-sm font-bold text-emerald-400">{formatCurrency(r.best?.revenuePerBaseUnit ?? 0)}</td>
                    <td>
                      {gain > 5 ? <span className="profit-badge-positive">+{gain.toFixed(1)}%</span>
                        : gain < -5 ? <span className="profit-badge-negative">{gain.toFixed(1)}%</span>
                        : <span className="profit-badge-neutral">≈0%</span>}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {Object.keys(def?.tiers ?? {}).map(t => (
                          <span key={t} className="text-xs px-1.5 py-0.5 rounded font-display"
                            style={{ background: `${def.color}15`, color: def.color, border: `1px solid ${def.color}30` }}>
                            {t.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* HISTORY */}
      {tab === 'history' && (
        <div className="space-y-4">
          <div className="hex-card p-5">
            <h3 className="font-display text-xs text-crystal-400 tracking-widest mb-4 flex items-center gap-2">
              <Clock size={14} /> ÉVOLUTION DES PRIX — TOP 3 FAMILLES
            </h3>
            {historyChart.length > 1 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historyChart}>
                  <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => formatNumber(v)} />
                  <Tooltip
                    formatter={(v, n) => [formatCurrency(v), n]}
                    contentStyle={{ background: 'rgba(5,13,20,0.98)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 8 }}
                  />
                  <Legend />
                  {top3Families.map((fam, i) => {
                    const def = recipes.families[fam];
                    return def ? (
                      <Line key={fam} type="monotone" dataKey={def.label} stroke={COLORS[i]} strokeWidth={2} dot={false} />
                    ) : null;
                  })}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <Clock size={48} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Pas encore d'historique.</p>
                <p className="text-slate-600 text-xs mt-1">Les données s'accumulent à chaque actualisation.</p>
              </div>
            )}
          </div>

          {/* History snapshots */}
          {history.length > 0 && (
            <div className="hex-card p-5 overflow-x-auto">
              <h3 className="font-display text-xs text-crystal-400 tracking-widest mb-4">SNAPSHOTS DE PRIX</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {[...history].reverse().slice(0, 20).map((snap, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'rgba(15,23,42,0.5)' }}>
                    <span className="font-mono text-xs text-slate-500 whitespace-nowrap">
                      {new Date(snap.timestamp).toLocaleString('fr-FR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(snap.prices).slice(0, 6).map(([id, price]) => (
                        <span key={id} className="text-xs font-mono text-slate-400">
                          {id}: <span className="text-gold-300">{formatCurrency(price)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PodiumCard({ item, rank, isPositive }) {
  const def = recipes.families[item.family];
  const gainPct = ((item.efficiency - 1) * 100);
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="hex-card p-4 flex items-center gap-4" style={{
      background: rank <= 3 && isPositive ? `${def?.color}08` : undefined,
      borderColor: rank <= 3 ? `${def?.color}30` : undefined,
    }}>
      <span className="font-display text-xl w-8 text-center">
        {rank <= 3 ? medals[rank - 1] : `#${rank}`}
      </span>
      <span className="text-2xl">{item.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-200 truncate">{item.label}</p>
        <p className="text-xs text-slate-500">
          Rev./unité: <span className="font-mono text-emerald-400">{formatCurrency(item.revenuePerBaseUnit)}</span>
          {' · '}Efficacité: <span className="font-mono" style={{ color: def?.color ?? '#94a3b8' }}>×{item.efficiency.toFixed(3)}</span>
        </p>
      </div>
      <div className="text-right">
        {isPositive ? (
          gainPct > 0
            ? <span className="profit-badge-positive">+{gainPct.toFixed(1)}%</span>
            : <span className="profit-badge-neutral">+0%</span>
        ) : (
          gainPct < 0
            ? <span className="profit-badge-negative">{gainPct.toFixed(1)}%</span>
            : <span className="profit-badge-positive">+{gainPct.toFixed(1)}%</span>
        )}
        <p className="text-xs text-slate-600 mt-1 font-mono">{item.option.type}</p>
      </div>
    </div>
  );
}
