import React, { useState, useMemo } from 'react';
import { useEconomy } from '../App';
import { calcFamilyProfitability, formatCurrency, calcBaseUnitsForTier } from '../utils/profitability';
import recipes from '../data/recipes.json';
import { Search, Filter, ArrowUpDown, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const SORT_OPTIONS = [
  { value: 'bestRev', label: 'Meilleur revenu' },
  { value: 'label', label: 'Nom (A-Z)' },
  { value: 'basePrice', label: 'Prix lingots' },
  { value: 'gain', label: 'Gain %' },
];

const FILTER_OPTIONS = ['Tous', 'Rentable', 'Neutre', 'Perte'];

const BASE_LABELS = {
  iron: 'Prix lingot', gold: 'Prix lingot', copper: 'Prix lingot', netherite: 'Prix lingot',
  diamond: 'Prix diamant', emerald: 'Prix émeraude', coal: 'Prix charbon',
  lapis: 'Prix lapis', redstone: 'Prix redstone', quartz: 'Prix quartz',
};

function orderedDisplayOptions(options) {
  const order = ['base', 'block', 't1', 't2', 't3', 't4'];
  return order.map(k => options.find(o => o.key === k)).filter(Boolean);
}

export default function MineralsList() {
  const { priceMap } = useEconomy();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('bestRev');
  const [filter, setFilter] = useState('Tous');

  const families = useMemo(() => {
    return Object.keys(recipes.families).map(family => calcFamilyProfitability(family, priceMap)).filter(Boolean);
  }, [priceMap]);

  const filtered = useMemo(() => {
    let result = families;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(f => f.label.toLowerCase().includes(s) || f.family.includes(s));
    }

    if (filter === 'Rentable') result = result.filter(f => f.gainVsBase > 5);
    else if (filter === 'Neutre') result = result.filter(f => Math.abs(f.gainVsBase) <= 5);
    else if (filter === 'Perte') result = result.filter(f => f.gainVsBase < -5);

    return [...result].sort((a, b) => {
      if (sortBy === 'label') return a.label.localeCompare(b.label);
      if (sortBy === 'basePrice') return (b.baseOption?.revenuePerBaseUnit ?? 0) - (a.baseOption?.revenuePerBaseUnit ?? 0);
      if (sortBy === 'gain') return b.gainVsBase - a.gainVsBase;
      return (b.best?.revenuePerBaseUnit ?? 0) - (a.best?.revenuePerBaseUnit ?? 0);
    });
  }, [families, search, sortBy, filter]);

  function exportCSV() {
    const rows = filtered.map(f => ({
      Famille: f.label,
      'Prix lingots (€/u)': f.baseOption?.revenuePerBaseUnit?.toFixed(2) ?? 0,
      'Meilleur format': f.best?.label ?? '',
      'Rev. meilleur (€/u)': f.best?.revenuePerBaseUnit?.toFixed(2) ?? 0,
      'Gain %': f.gainVsBase.toFixed(1),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Minéraux');
    XLSX.writeFile(wb, 'excalia_mineraux.xlsx');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-white tracking-wider flex items-center gap-2">
            <span>💎</span> TOUS LES MINERAIS
          </h2>
          <p className="text-slate-400 text-sm">{filtered.length} famille(s) affichée(s)</p>
        </div>
        <button className="btn-secondary" onClick={exportCSV}>
          <Download size={14} /> Export Excel
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-void-700 border border-crystal-500/20 text-slate-200 focus:outline-none focus:border-crystal-500/50 placeholder:text-slate-600"
            placeholder="Rechercher un minerai..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          {FILTER_OPTIONS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f ? 'bg-crystal-500/20 text-crystal-300 border border-crystal-500/40' : 'text-slate-500 hover:text-slate-300'}`}>
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown size={14} className="text-slate-500" />
          <select
            className="py-2 px-3 text-xs rounded-lg bg-void-700 border border-crystal-500/20 text-slate-300 focus:outline-none focus:border-crystal-500/40"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-4">
        {filtered.map((f, i) => (
          <FamilyCard key={f.family} family={f} index={i} priceMap={priceMap} />
        ))}
      </div>
    </div>
  );
}

function FamilyCard({ family: f, index, priceMap }) {
  const [expanded, setExpanded] = useState(false);
  const tiers = Object.keys(recipes.families[f.family]?.tiers ?? {});
  const displayOptions = orderedDisplayOptions(f.options);
  const baseLabel = BASE_LABELS[f.family] ?? 'Prix ressource';

  return (
    <div className={`hex-card fade-in-up stagger-${Math.min(index + 1, 6)}`}>
      <div className="p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            {f.mcIcon ? (
              <img
                src={f.mcIcon}
                alt={f.label}
                className="w-10 h-10 object-contain"
                style={{ imageRendering: 'pixelated' }}
                onError={e => { e.target.style.display='none'; e.target.nextSibling && (e.target.nextSibling.style.display='block'); }}
              />
            ) : null}
            <span className="text-3xl" style={{ display: f.mcIcon ? 'none' : 'block' }}>{f.emoji}</span>
            <div>
              <h3 className="font-display text-base font-bold text-white tracking-wider">{f.label.toUpperCase()}</h3>
              <p className="text-xs text-slate-500">{baseLabel}: {formatCurrency(f.baseOption?.revenuePerBaseUnit ?? 0)}/unité</p>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 ml-2">
            {displayOptions.map(opt => (
              <div key={opt.key} className={`p-2 rounded-lg text-center ${opt.key === f.best.key ? 'ring-1' : ''}`}
                style={{
                  background: opt.key === f.best.key ? `${f.color}15` : 'rgba(15,23,42,0.5)',
                  ringColor: f.color,
                  borderColor: opt.key === f.best.key ? f.color : 'transparent',
                  border: opt.key === f.best.key ? `1px solid ${f.color}40` : '1px solid transparent',
                }}>
                <p className="text-xs text-slate-500 truncate">{opt.label.replace(f.label + ' ', '')}</p>
                <p className="font-mono text-sm font-bold" style={{ color: opt.key === f.best.key ? f.color : '#94a3b8' }}>
                  {opt.missingPrice ? 'Non trouvé' : formatCurrency(opt.pricePerUnit)}
                </p>
                {opt.type === 'compressed' && !opt.missingPrice && (
                  <p className="text-[10px] text-slate-600 font-mono mt-0.5">
                    {formatCurrency(opt.revenuePerBaseUnit)}/base
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {f.gainVsBase > 5 ? (
              <span className="profit-badge-positive">+{f.gainVsBase.toFixed(0)}%</span>
            ) : f.gainVsBase < -5 ? (
              <span className="profit-badge-negative">{f.gainVsBase.toFixed(0)}%</span>
            ) : (
              <span className="profit-badge-neutral">≈0%</span>
            )}
            <span className="text-slate-500 text-sm">{expanded ? '▲' : '▼'}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-crystal-500/10 pt-4">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Format</th>
                  <th>Prix vente</th>
                  <th>Unités base req.</th>
                  <th>Blocs eq.</th>
                  <th>Rev./unité base</th>
                  <th>Efficacité</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {f.options.map(opt => {
                  const isBest = opt.key === f.best.key;
                  const isWorst = opt.key === f.worst.key;
                  return (
                    <tr key={opt.key} style={{ background: isBest ? `${f.color}08` : 'transparent' }}>
                      <td>
                        <div className="flex items-center gap-2">
                          {isBest && <span className="text-xs">🏆</span>}
                          {isWorst && <span className="text-xs">⚠️</span>}
                          <span className={`font-semibold ${isBest ? 'text-white' : 'text-slate-300'}`}>{opt.label}</span>
                        </div>
                      </td>
                      <td className="font-mono text-sm text-gold-300">{formatCurrency(opt.pricePerUnit)}</td>
                      <td className="font-mono text-sm text-slate-400">{opt.baseUnitsRequired.toLocaleString('fr-FR')}</td>
                      <td className="font-mono text-sm text-slate-400">{opt.blocksEquivalent < 1 ? opt.blocksEquivalent.toFixed(2) : opt.blocksEquivalent.toLocaleString('fr-FR')}</td>
                      <td className="font-mono text-sm font-bold text-emerald-400">{opt.missingPrice ? 'Non trouvé' : formatCurrency(opt.revenuePerBaseUnit)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-void-700 rounded-full h-1.5 max-w-20">
                            <div className="h-full rounded-full" style={{
                              width: `${opt.efficiency == null ? 0 : Math.min(100, (opt.efficiency / (f.best.efficiency || 1)) * 100)}%`,
                              background: isBest ? f.color : '#475569'
                            }} />
                          </div>
                          <span className="font-mono text-xs text-slate-400">{opt.efficiency == null ? '—' : `×${opt.efficiency.toFixed(2)}`}</span>
                        </div>
                      </td>
                      <td>
                        {isBest ? <span className="profit-badge-positive">✓ MEILLEUR</span> :
                         isWorst ? <span className="profit-badge-negative">✗ PIRE</span> :
                         <span className="profit-badge-neutral">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
