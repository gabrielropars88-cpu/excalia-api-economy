import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useEconomy } from '../App';
import {
  getCustomPrices, setCustomPrice, removeCustomPrice, clearCustomPrices
} from '../services/excaliaApi';
import { formatCurrency } from '../utils/profitability';
import recipes from '../data/recipes.json';
import { Settings, RotateCcw, Save, Trash2, AlertCircle, CheckCircle2, Info } from 'lucide-react';

const BASE_LABELS = {
  iron: 'Lingot de fer',
  gold: "Lingot d'or",
  copper: 'Lingot de cuivre',
  netherite: 'Lingot de netherite',
  diamond: 'Diamant',
  emerald: 'Émeraude',
  coal: 'Charbon',
  lapis: 'Lapis-lazuli',
  redstone: 'Redstone',
  quartz: 'Quartz',
};

const BLOCK_LABELS = {
  iron: 'Bloc de fer',
  gold: "Bloc d'or",
  copper: 'Bloc de cuivre',
  netherite: 'Bloc de netherite',
  diamond: 'Bloc de diamant',
  emerald: "Bloc d'émeraude",
  coal: 'Bloc de charbon',
  lapis: 'Bloc de lapis-lazuli',
  redstone: 'Bloc de redstone',
  quartz: 'Bloc de quartz',
};

function normalizeKey(key) {
  return String(key ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^minecraft:/, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getPriceFromItems(items, id) {
  if (!id) return null;
  const normalized = normalizeKey(id);
  const item = items.find(i => normalizeKey(i.type) === normalized);
  const price = item?.sellPrice;
  return price === undefined || price === null || Number.isNaN(Number(price)) ? null : Number(price);
}

function buildEditableFamilies(items, customPrices) {
  return Object.entries(recipes.families).map(([familyKey, familyDef]) => {
    const rows = [];

    if (familyDef.baseItem) {
      rows.push({
        id: familyDef.baseItem,
        label: BASE_LABELS[familyKey] ?? familyDef.label,
        kind: 'Ressource',
        apiPrice: getPriceFromItems(items, familyDef.baseItem),
      });
    }

    if (familyDef.blockItem) {
      rows.push({
        id: familyDef.blockItem,
        label: BLOCK_LABELS[familyKey] ?? `Bloc de ${familyDef.label}`,
        kind: 'Bloc',
        apiPrice: getPriceFromItems(items, familyDef.blockItem),
      });
    }

    // Toujours afficher les T1/T2/T3/T4 même si l'API ne les donne pas.
    // C'est ici que tu peux saisir les VRAIS prix vus en jeu.
    Object.keys(familyDef.tiers || {}).forEach((tierKey, index) => {
      const id = `${familyKey}_${tierKey}`;
      rows.push({
        id,
        label: `${familyDef.label} T${index + 1}`,
        kind: `Tier T${index + 1}`,
        apiPrice: getPriceFromItems(items, id),
        isTier: true,
      });
    });

    return {
      family: familyKey,
      label: familyDef.label,
      color: familyDef.color,
      mcIcon: familyDef.mcIcon,
      rows: rows.map(row => ({
        ...row,
        customPrice: customPrices[row.id] !== undefined ? Number(customPrices[row.id]) : null,
      })),
    };
  });
}

export default function AdminPrices() {
  const { items, loadData } = useEconomy();
  const [customPrices, setCustomPricesState] = useState({});
  const [edits, setEdits] = useState({});
  const [saved, setSaved] = useState({});
  const [globalMsg, setGlobalMsg] = useState(null);
  const [onlyTiers, setOnlyTiers] = useState(false);

  useEffect(() => {
    setCustomPricesState(getCustomPrices());
  }, []);

  const editableFamilies = useMemo(
    () => buildEditableFamilies(items, customPrices),
    [items, customPrices]
  );

  const visibleFamilies = useMemo(() => {
    if (!onlyTiers) return editableFamilies;
    return editableFamilies.map(f => ({ ...f, rows: f.rows.filter(r => r.isTier) }));
  }, [editableFamilies, onlyTiers]);

  const handleChange = useCallback((itemId, value) => {
    setEdits(prev => ({ ...prev, [itemId]: value }));
  }, []);

  const refreshAfterChange = useCallback(() => {
    setCustomPricesState(getCustomPrices());
    loadData(true);
  }, [loadData]);

  const handleSave = useCallback((itemId) => {
    const val = parseFloat(String(edits[itemId]).replace(',', '.'));
    if (Number.isNaN(val) || val < 0) return;
    setCustomPrice(itemId, val);
    setSaved(prev => ({ ...prev, [itemId]: true }));
    setTimeout(() => setSaved(prev => { const n = { ...prev }; delete n[itemId]; return n; }), 2000);
    refreshAfterChange();
  }, [edits, refreshAfterChange]);

  const handleRemove = useCallback((itemId) => {
    removeCustomPrice(itemId);
    setEdits(prev => { const n = { ...prev }; delete n[itemId]; return n; });
    refreshAfterChange();
  }, [refreshAfterChange]);

  const handleResetAll = () => {
    clearCustomPrices();
    setCustomPricesState({});
    setEdits({});
    loadData(true);
    setGlobalMsg('Tous les prix personnalisés ont été réinitialisés.');
    setTimeout(() => setGlobalMsg(null), 3000);
  };

  const customCount = Object.keys(customPrices).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-white tracking-wider flex items-center gap-2">
            <Settings size={18} className="text-crystal-400" />
            PRIX ADMIN
          </h2>
          <p className="text-slate-400 text-sm">
            Ajoute ici les vrais prix des tiers vus en jeu. Ils seront utilisés dans Minerais, Comparateur Tiers et Simulateur.
            {customCount > 0 && <span className="ml-2 text-amber-400 font-semibold">{customCount} prix manuel(s) actif(s)</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={`btn-secondary text-xs ${onlyTiers ? 'border-crystal-500/50 text-crystal-300' : ''}`}
            onClick={() => setOnlyTiers(v => !v)}
          >
            {onlyTiers ? 'Voir tout' : 'Voir seulement les tiers'}
          </button>
          {customCount > 0 && (
            <button className="btn-secondary text-xs flex items-center gap-1.5" onClick={handleResetAll}>
              <RotateCcw size={13} /> Tout réinitialiser
            </button>
          )}
        </div>
      </div>

      {globalMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
          <CheckCircle2 size={15} /> {globalMsg}
        </div>
      )}

      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-sm text-amber-300">
        <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
        <span>
          L'API Excalia ne donne pas toujours les T1/T2/T3/T4. Pour avoir les vrais prix des tiers,
          saisis-les ici avec l'identifiant standard comme <b>iron_t1</b>, <b>diamond_t2</b>, etc.
          Le site n'invente aucun prix : il utilise l'API + tes prix manuels.
        </span>
      </div>

      <div className="p-3 rounded-lg bg-crystal-500/10 border border-crystal-500/20 flex items-start gap-2 text-sm text-crystal-200">
        <Info size={15} className="mt-0.5 flex-shrink-0" />
        <span>
          Exemple : si le Fer T1 vaut 10 000 en jeu, mets <b>10000</b> sur la ligne <b>Fer T1</b> puis clique sur la disquette.
          Le comparateur calculera ensuite : 576 × prix du fer vs prix Fer T1.
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {visibleFamilies.map(({ family, label, color, mcIcon, rows }) => (
          <div key={family} className="hex-card overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${color}25` }}>
              {mcIcon ? (
                <img
                  src={mcIcon}
                  alt={label}
                  className="w-8 h-8 object-contain pixelated"
                  style={{ imageRendering: 'pixelated' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ) : <span className="text-2xl">{recipes.families[family]?.emoji}</span>}
              <h3 className="font-display text-sm font-bold tracking-wider" style={{ color }}>
                {label.toUpperCase()}
              </h3>
              {rows.some(i => customPrices[i.id] !== undefined) && (
                <span className="ml-auto text-xs text-amber-400 font-semibold">prix manuel</span>
              )}
            </div>

            <div className="p-3 space-y-2">
              {rows.map(({ id, label: itemLabel, kind, apiPrice, customPrice, isTier }) => {
                const isCustom = customPrice !== null;
                const displayPrice = isCustom ? customPrice : apiPrice;
                const editVal = edits[id] ?? '';
                const isSaved = saved[id];

                return (
                  <div key={id} className={`grid grid-cols-[82px_1fr_90px_1fr_56px] items-center gap-2 ${isTier ? 'bg-crystal-500/5 rounded-md p-1.5 -mx-1.5' : ''}`}>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">{kind}</span>
                    <div className="min-w-0">
                      <div className="text-xs text-slate-300 truncate">{itemLabel}</div>
                      <div className="text-[10px] font-mono text-slate-600 truncate">{id}</div>
                    </div>
                    <span className={`text-xs font-mono flex-shrink-0 ${isCustom ? 'text-amber-300' : displayPrice == null ? 'text-red-300' : 'text-slate-400'}`}>
                      {displayPrice == null ? 'Non défini' : formatCurrency(displayPrice)}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={displayPrice == null ? 'prix réel' : String(displayPrice)}
                      value={editVal}
                      onChange={e => handleChange(id, e.target.value)}
                      className={`min-w-0 px-2 py-1 text-xs font-mono rounded bg-void-700 border focus:outline-none transition-colors ${
                        isCustom ? 'border-amber-500/50 text-amber-300' : 'border-crystal-500/20 text-slate-200'
                      } focus:border-crystal-500/50`}
                    />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSave(id)}
                        disabled={!editVal}
                        className="p-1.5 rounded hover:bg-crystal-500/20 text-crystal-400 disabled:opacity-30 transition-colors"
                        title="Appliquer"
                      >
                        {isSaved ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Save size={14} />}
                      </button>
                      {isCustom && (
                        <button
                          onClick={() => handleRemove(id)}
                          className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                          title="Supprimer le prix manuel"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
