import React, { useState, useMemo } from 'react';
import { useEconomy } from '../App';
import { formatPrice } from '../services/excaliaApi';
import { getItemDisplayName } from '../utils/itemDisplay';
import { getItemIcon } from '../data/itemIcons';
import { Search, ArrowUp, ArrowDown, ChevronLeft, Package, ShoppingCart, TrendingUp, BarChart3 } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'name',      label: 'Nom (A → Z)' },
  { value: 'name_desc', label: 'Nom (Z → A)' },
  { value: 'price_asc', label: 'Prix ↑' },
  { value: 'price_desc',label: 'Prix ↓' },
];

function ItemCard({ item }) {
  const icon = getItemIcon(item.type);
  const name = getItemDisplayName(item.type);

  return (
    <div className="hex-card p-3 flex flex-col gap-2 hover:border-crystal-500/40 transition-all">
      <div className="flex items-start gap-3">
        {icon ? (
          <img src={icon} alt={name} className="w-8 h-8 object-contain pixelated flex-shrink-0"
            style={{ imageRendering: 'pixelated' }}
            onError={e => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)' }}>
            <Package size={14} className="text-slate-500" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate leading-tight">{name}</p>
          <p className="text-xs text-slate-500 font-mono truncate">{item.type}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1 text-xs">
        <div className="flex flex-col">
          <span className="text-slate-500">Vente</span>
          <span className="text-emerald-400 font-mono font-bold">
            {item.sellPrice != null ? formatPrice(item.sellPrice) + '€' : '—'}
          </span>
        </div>
        {item.buyPrice != null && (
          <div className="flex flex-col">
            <span className="text-slate-500">Achat</span>
            <span className="text-crystal-400 font-mono">
              {formatPrice(item.buyPrice)}€
            </span>
          </div>
        )}
        {item.sellAmount != null && (
          <div className="flex flex-col">
            <span className="text-slate-500">Qté</span>
            <span className="text-white font-mono">×{item.sellAmount}</span>
          </div>
        )}
        {item.page != null && (
          <div className="flex flex-col">
            <span className="text-slate-500">Page</span>
            <span className="text-slate-400 font-mono">p.{item.page}</span>
          </div>
        )}
      </div>

      {item.category && (
        <span className="profit-badge-neutral text-xs w-fit">{item.category}</span>
      )}
    </div>
  );
}

function CategoryView({ category, items, onBack }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('price_desc');

  const filtered = useMemo(() => {
    let list = items;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.type?.toLowerCase().includes(q) ||
        getItemDisplayName(i.type).toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sort === 'name')       return getItemDisplayName(a.type).localeCompare(getItemDisplayName(b.type), 'fr');
      if (sort === 'name_desc')  return getItemDisplayName(b.type).localeCompare(getItemDisplayName(a.type), 'fr');
      if (sort === 'price_asc')  return (a.sellPrice ?? 0) - (b.sellPrice ?? 0);
      if (sort === 'price_desc') return (b.sellPrice ?? 0) - (a.sellPrice ?? 0);
      return 0;
    });
  }, [items, search, sort]);

  const avgPrice = items.filter(i => i.sellPrice != null).reduce((s, i) => s + i.sellPrice, 0) / (items.filter(i => i.sellPrice != null).length || 1);
  const maxItem = items.filter(i => i.sellPrice != null).reduce((a, b) => (a?.sellPrice ?? 0) > (b?.sellPrice ?? 0) ? a : b, null);

  return (
    <div className="space-y-4 fade-in-up">
      {/* Header catégorie */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
          <ChevronLeft size={13} /> Retour
        </button>
        <div>
          <h2 className="font-display text-xl font-bold text-white tracking-wider">{category}</h2>
          <p className="text-slate-400 text-sm">{items.length} items</p>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Items', value: items.length },
          { label: 'Prix moyen', value: formatPrice(avgPrice) + '€' },
          { label: 'Plus cher', value: maxItem ? formatPrice(maxItem.sellPrice) + '€' : '—', small: true },
        ].map(({ label, value, small }, i) => (
          <div key={i} className="stat-card text-center">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`font-display font-bold text-white ${small ? 'text-sm' : 'text-xl'}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Recherche + tri */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text" placeholder="Rechercher un item..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-slate-900/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-crystal-500/50"
          />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg bg-slate-900/60 border border-slate-700/50 text-white focus:outline-none">
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Grille d'items */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filtered.map((item, i) => <ItemCard key={i} item={item} />)}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-10 text-slate-500">
            Aucun item pour cette recherche.
          </div>
        )}
      </div>
    </div>
  );
}

export default function Shops() {
  const { items, loading, dataSource } = useEconomy();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('count');

  // Grouper par catégorie
  const categories = useMemo(() => {
    const map = {};
    for (const item of items) {
      const cat = item.category || 'Divers';
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    }
    return map;
  }, [items]);

  // Stats globales
  const stats = useMemo(() => {
    const withPrice = items.filter(i => i.sellPrice != null);
    if (!withPrice.length) return null;
    const prices = withPrice.map(i => i.sellPrice);
    return {
      total: items.length,
      catCount: Object.keys(categories).length,
      avg: prices.reduce((a, b) => a + b, 0) / prices.length,
      max: withPrice.reduce((a, b) => a.sellPrice > b.sellPrice ? a : b, withPrice[0]),
      min: withPrice.reduce((a, b) => a.sellPrice < b.sellPrice ? a : b, withPrice[0]),
    };
  }, [items, categories]);

  // Catégories filtrées + triées
  const sortedCategories = useMemo(() => {
    let list = Object.entries(categories);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(([cat]) => cat.toLowerCase().includes(q));
    }
    return list.sort((a, b) => {
      if (sort === 'count')      return b[1].length - a[1].length;
      if (sort === 'count_asc')  return a[1].length - b[1].length;
      if (sort === 'name')       return a[0].localeCompare(b[0], 'fr');
      if (sort === 'price')      return (
        (b[1].filter(i => i.sellPrice != null).reduce((s, i) => Math.max(s, i.sellPrice ?? 0), 0)) -
        (a[1].filter(i => i.sellPrice != null).reduce((s, i) => Math.max(s, i.sellPrice ?? 0), 0))
      );
      return 0;
    });
  }, [categories, search, sort]);

  if (selectedCategory) {
    return (
      <CategoryView
        category={selectedCategory}
        items={categories[selectedCategory] ?? []}
        onBack={() => setSelectedCategory(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="fade-in-up">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingCart size={18} className="text-crystal-400" />
          <h2 className="font-display text-xl font-bold text-white tracking-wider">SHOPS</h2>
          {dataSource === 'mock' && <span className="profit-badge-neutral text-xs">MODE DÉMO</span>}
          {dataSource === 'api' && <span className="profit-badge-positive text-xs">API connectée</span>}
        </div>
        <p className="text-slate-400 text-sm">Tous les items disponibles sur le serveur Excalia</p>
      </div>

      {/* Stats globales */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 fade-in-up">
          {[
            { label: 'Items total',    value: stats.total },
            { label: 'Catégories',     value: stats.catCount },
            { label: 'Prix moyen',     value: formatPrice(stats.avg) + '€' },
            { label: 'Plus cher',      value: getItemDisplayName(stats.max?.type), sub: formatPrice(stats.max?.sellPrice) + '€', small: true },
            { label: 'Moins cher',     value: getItemDisplayName(stats.min?.type), sub: formatPrice(stats.min?.sellPrice) + '€', small: true },
          ].map(({ label, value, sub, small }, i) => (
            <div key={i} className={`stat-card fade-in-up stagger-${i+1}`}>
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className={`font-display font-bold text-white ${small ? 'text-sm' : 'text-xl'}`}>{value}</p>
              {sub && <p className="text-xs text-emerald-400 font-mono mt-0.5">{sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Recherche catégories + tri */}
      <div className="flex flex-col sm:flex-row gap-3 fade-in-up">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Rechercher une catégorie..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-slate-900/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-crystal-500/50"
          />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg bg-slate-900/60 border border-slate-700/50 text-white focus:outline-none">
          <option value="count">Plus d'items</option>
          <option value="count_asc">Moins d'items</option>
          <option value="name">Alphabétique</option>
          <option value="price">Prix max ↓</option>
        </select>
      </div>

      {/* Grille de catégories */}
      {loading && items.length === 0 ? (
        <p className="text-slate-500 text-center py-10">Chargement...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCategories.map(([cat, catItems], i) => {
            const withPrice = catItems.filter(i => i.sellPrice != null);
            const maxPrice = withPrice.reduce((m, x) => Math.max(m, x.sellPrice ?? 0), 0);
            const minPrice = withPrice.reduce((m, x) => x.sellPrice != null ? Math.min(m, x.sellPrice) : m, Infinity);
            const sampleIcons = catItems.slice(0, 4).map(it => getItemIcon(it.type)).filter(Boolean);

            return (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className={`hex-card p-4 text-left hover:border-crystal-500/40 transition-all fade-in-up stagger-${Math.min(i+1,6)} group`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display text-sm font-bold text-white group-hover:text-crystal-400 transition-colors">{cat}</h3>
                    <p className="text-xs text-slate-500">{catItems.length} items</p>
                  </div>
                  <div className="flex gap-1">
                    {sampleIcons.slice(0, 3).map((src, j) => (
                      <img key={j} src={src} alt="" className="w-6 h-6 object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                        style={{ imageRendering: 'pixelated' }}
                        onError={e => { e.currentTarget.style.display = 'none'; }} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">De </span>
                    <span className="text-emerald-400 font-mono">{isFinite(minPrice) ? formatPrice(minPrice) + '€' : '—'}</span>
                    <span className="text-slate-500"> à </span>
                    <span className="text-emerald-400 font-mono">{maxPrice > 0 ? formatPrice(maxPrice) + '€' : '—'}</span>
                  </div>
                  <BarChart3 size={14} className="text-slate-600 group-hover:text-crystal-400 transition-colors" />
                </div>
              </button>
            );
          })}
          {sortedCategories.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-500">
              {items.length === 0 ? 'Aucune donnée chargée.' : 'Aucune catégorie trouvée.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
