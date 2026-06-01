/**
 * excaliaApi.js — Service API Excalia Economy
 *
 * CORRECTIONS v4 (tiers Oraxen) :
 * 1. getTierCandidateKeys() ajoute le préfixe oraxen: pour TOUS les patterns
 *    → couvre oraxen:fer_t1, oraxen:iron_t1, oraxen:diamant_t1...
 * 2. resolveTierPrice() cherche d'abord les clés exactes avec oraxen:
 *    puis les variantes normalisées, puis le fuzzy
 * 3. buildPriceMap() conserve la clé brute oraxen:xxx ET la version sans préfixe
 * 4. getItemIcon() intelligente : nettoie oraxen:, retire _t1/_t2, cherche base
 * 5. Debug sections enrichies : items oraxen:, items tiers
 */

const API_URL = import.meta.env.PROD
  ? 'https://excalia.fr/api/economie'
  : '/api/excalia/economie';
const CACHE_KEY = 'excalia_slim_v3';
const HIST_KEY  = 'excalia_price_history';
const CUST_KEY  = 'excalia_custom_prices';
const CACHE_TTL = 5 * 60 * 1000;

const ROOT_SKIP_KEYS = new Set(['summary', 'histories', 'history', 'stats', 'meta', 'info']);
const SLIM_FIELDS = ['type', 'sellPrice', 'buyPrice', 'sellAmount', 'sellCurrency', 'page', 'slot', 'shopName', 'category'];

// ─── Aliases famille : anglais + français + variantes ────────────────────
const FAMILY_ALIASES = {
  iron:      ['iron', 'fer'],
  gold:      ['gold', 'or'],
  copper:    ['copper', 'cuivre'],
  coal:      ['coal', 'charbon'],
  diamond:   ['diamond', 'diamant'],
  emerald:   ['emerald', 'emeraude', 'émeraude'],
  redstone:  ['redstone'],
  lapis:     ['lapis', 'lapis_lazuli', 'lapis-lazuli'],
  quartz:    ['quartz', 'nether_quartz'],
  netherite: ['netherite', 'netherite_ingot'],
};

function normalizeKey(key) {
  return String(key ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^minecraft:/, '')
    .replace(/^oraxen:/, '')        // ← CRUCIAL : retire oraxen: pour normalisation
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function unique(arr) {
  return [...new Set(arr.filter(Boolean))];
}

/**
 * Génère toutes les variantes de noms possibles pour un tier dans l'API Excalia.
 *
 * CORRECTION PRINCIPALE v4 :
 * On ajoute systématiquement le préfixe "oraxen:" devant chaque variante,
 * car les minerais Excalia utilisent ce préfixe (ex: oraxen:fer_t1, oraxen:diamant_t2).
 * Les tiers de mobs fonctionnaient déjà car oraxen:patte_lapin_t3 était trouvé
 * par correspondance exacte. Les minerais échouaient car oraxen:fer_t1 n'était
 * pas dans les candidats générés.
 */
export function getTierCandidateKeys(family, tierKey) {
  const n = parseInt(String(tierKey).replace('t', ''), 10);
  const aliases = FAMILY_ALIASES[family] || [family];
  const out = [];

  for (const base of aliases) {
    // Variantes sans préfixe (vanilla / custom sans oraxen)
    const plain = [
      `${base}_${tierKey}`,
      `${base}_t${n}`,
      `${base}_${n}`,
      `${base}${n}`,
      `${base}_tier_${n}`,
      `${base}_tier_t${n}`,
      `${base}_tier${n}`,
      `${base}_compressed_${n}`,
      `${base}_compressed_t${n}`,
      `${base}_compressed_tier_${n}`,
      `${base}_compress_${n}`,
      `${base}_compress_t${n}`,
      `${base}_c${n}`,
      `compressed_${base}_${n}`,
      `compressed_${base}_t${n}`,
      `compressed_${base}_tier_${n}`,
      `compress_${base}_${n}`,
      `compress_${base}_t${n}`,
      `tier_${n}_${base}`,
      `t${n}_${base}`,
      `minerai_${base}_t${n}`,
      `minerai_${base}_${n}`,
      `mineral_${base}_t${n}`,
      `mineral_${base}_${n}`,
      `${base}_niveau_${n}`,
      `${base}_niv_${n}`,
      `${base}_level_${n}`,
      `${base}_lvl_${n}`,
    ];

    // ✅ CORRECTION : même variantes avec préfixe oraxen: (clé exacte non normalisée)
    // C'est CE qui permet de trouver oraxen:fer_t1, oraxen:diamant_t2, etc.
    const withOraxen = plain.map(k => `oraxen:${k}`);

    out.push(...plain, ...withOraxen);
  }

  // On retourne : les clés exactes avec oraxen: EN PREMIER (priorité haute),
  // puis les variantes normalisées (sans préfixe)
  const exactOraxen = out.filter(k => k.startsWith('oraxen:'));
  const normalized = unique(out.filter(k => !k.startsWith('oraxen:')).map(normalizeKey));

  return unique([...exactOraxen, ...normalized]);
}

function tierRegexFor(family, tierKey) {
  const n = parseInt(String(tierKey).replace('t', ''), 10);
  const aliases = (FAMILY_ALIASES[family] || [family]).map(normalizeKey);
  const famPart = aliases.map(a => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const tierPart = `(t_?${n}|tier_?${n}|compressed_?t?_?${n}|compress_?t?_?${n}|c_?${n}|niveau_?${n}|niv_?${n}|level_?${n}|lvl_?${n})`;
  return new RegExp(`(^|_)(${famPart})(_|$).*${tierPart}($|_)|(^|_)${tierPart}.*(_|^)(${famPart})(_|$)`, 'i');
}

/**
 * Retourne le prix d'un tier depuis priceMap.
 *
 * Ordre de recherche :
 * 1. Clés exactes avec oraxen: (ex: oraxen:fer_t1)
 * 2. Candidats normalisés (sans préfixe)
 * 3. Recherche floue par regex
 */
export function resolveTierPrice(family, tierKey, priceMap) {
  if (!priceMap) return null;

  const candidates = getTierCandidateKeys(family, tierKey);

  // Passage 1 : clés exactes (inclut oraxen:xxx)
  for (const key of candidates) {
    if (priceMap[key] !== undefined && priceMap[key] !== null && Number(priceMap[key]) > 0) {
      return { key, price: Number(priceMap[key]), strategy: 'candidate' };
    }
  }

  // Passage 2 : fuzzy regex sur clés normalisées du priceMap
  const re = tierRegexFor(family, tierKey);
  const allKeys = Object.keys(priceMap || {});
  const found = allKeys.find(k => re.test(normalizeKey(k)) && Number(priceMap[k]) > 0);
  if (found) return { key: found, price: Number(priceMap[found]), strategy: 'fuzzy' };

  return null;
}

export function findDetectedTierItems(items = []) {
  const detected = [];
  for (const item of items) {
    const key = normalizeKey(item.type);
    for (const family of Object.keys(FAMILY_ALIASES)) {
      for (const tier of ['t1', 't2', 't3', 't4']) {
        if (tierRegexFor(family, tier).test(key)) {
          detected.push({ ...item, family, tier, normalizedType: key });
        }
      }
    }
  }
  return detected;
}

// ─── Extracteur récursif ──────────────────────────────────────────────────
export function extractEconomyItems(node, context = {}, parentKey = '') {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) {
    return node.flatMap((child) => extractEconomyItems(child, context, parentKey));
  }
  if (isEconomyItem(node)) {
    return [buildSlimItem(node, context)];
  }
  const results = [];
  for (const [key, value] of Object.entries(node)) {
    if (ROOT_SKIP_KEYS.has(key)) continue;
    if (!value || typeof value !== 'object') continue;
    const childContext = buildContext(key, value, context);
    results.push(...extractEconomyItems(value, childContext, key));
  }
  return results;
}

function isEconomyItem(obj) {
  return (
    typeof obj.type === 'string' &&
    obj.type.length > 0 &&
    !ROOT_SKIP_KEYS.has(obj.type) &&
    (typeof obj.sellPrice === 'number' || typeof obj.buyPrice === 'number')
  );
}

function buildContext(key, value, parentContext) {
  const ctx = { ...parentContext };
  if (typeof value?.page === 'number')     ctx.page     = value.page;
  if (typeof value?.slot === 'number')     ctx.slot     = value.slot;
  if (typeof value?.name === 'string')     ctx.shopName = value.name;
  if (typeof value?.shopName === 'string') ctx.shopName = value.shopName;
  if (typeof key === 'string' && isNaN(Number(key)) && key.length > 2) ctx._section = key;
  return ctx;
}

function buildSlimItem(item, context) {
  const out = {};
  for (const f of SLIM_FIELDS) {
    if (item[f] !== undefined) out[f] = item[f];
  }
  if (out.page === undefined && context.page !== undefined) out.page = context.page;
  if (out.slot === undefined && context.slot !== undefined) out.slot = context.slot;
  if (!out.shopName && context.shopName) out.shopName = context.shopName;
  if (!out.shopName && context._section) out.shopName = context._section;
  return out;
}

// ─── Détection catégories ────────────────────────────────────────────────
const CATEGORY_RULES = [
  { key: 'minerals',  test: /^(iron|gold|copper|coal|diamond|emerald|redstone|lapis|quartz|netherite|ancient_debris|amethyst|raw_iron|raw_gold|raw_copper|fer|or|cuivre|charbon|diamant|emeraude|emeraude)(_ore|_ingot|_block|_shard|_lazuli)?$/ , label: 'Minerais' },
  { key: 'tiers',     test: /^(oraxen_)?(iron|gold|copper|coal|diamond|emerald|redstone|lapis|quartz|netherite|fer|or|cuivre|charbon|diamant|emeraude).*_?t[1-4]$/, label: 'Compressés' },
  { key: 'mob_drops', test: /^(oraxen_)?(bone|string|spider_eye|gunpowder|rotten_flesh|ender_pearl|blaze_rod|ghast_tear|magma_cream|slime_ball|rabbit|patte|lapin|os|chair|fil|poudre|ender|perle|zombie|squelette|araignee)/, label: 'Loots de mobs' },
  { key: 'wood',      test: /^(oak|birch|spruce|jungle|acacia|dark_oak|mangrove|cherry|bamboo|crimson|warped)_(log|planks|slab|stairs|door)/, label: 'Bois' },
  { key: 'food',      test: /^(bread|wheat|carrot|potato|apple|beef|porkchop|chicken|rabbit|cod|salmon|cake|cookie|melon|pumpkin|beetroot)/, label: 'Agriculture & Nourriture' },
  { key: 'nether',    test: /^(netherite|ancient_debris|nether_quartz|nether_brick|nether_star|blaze|ghast|magma|soul_sand|glowstone|crimson|warped|basalt|blackstone)/, label: 'Nether' },
  { key: 'end',       test: /^(end_stone|ender_pearl|eye_of_ender|ender_chest|shulker|purpur|chorus|dragon|elytra)/, label: 'End' },
  { key: 'gems',      test: /^(diamond|emerald|amethyst|prismarine|lapis_lazuli)/, label: 'Gemmes' },
  { key: 'ingots',    test: /_(ingot|nugget)$/, label: 'Lingots & Nuggets' },
  { key: 'blocks',    test: /_block$/, label: 'Blocs' },
  { key: 'tools',     test: /_(sword|pickaxe|axe|shovel|hoe|bow|crossbow|shield|helmet|chestplate|leggings|boots)$/, label: 'Outils & Armes' },
  { key: 'boss',      test: /^(wither_skeleton_skull|nether_star|dragon_egg|elytra|totem_of_undying|beacon)/, label: 'Boss & Rares' },
];

export function detectCategory(type) {
  if (!type) return 'Divers';
  const normalized = normalizeKey(type);
  // Détecter les tiers oraxen (oraxen:fer_t1 → normalisé → fer_t1)
  if (/_(t[1-4])$/.test(normalized)) return 'Compressés';
  for (const rule of CATEGORY_RULES) {
    if (rule.test.test(normalized)) return rule.label;
  }
  if (type.startsWith('oraxen:')) return 'Loots de mobs';
  return 'Divers';
}

export function enrichWithCategories(items) {
  return items.map(item => ({
    ...item,
    category: item.category || detectCategory(item.type),
  }));
}

// ─── Formatage ────────────────────────────────────────────────────────────
export function formatPrice(price) {
  if (price == null || isNaN(price)) return '—';
  return Number(price).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ─── Mock data ────────────────────────────────────────────────────────────
// Tiers avec préfixe oraxen: pour simuler les vrais noms Excalia
export const MOCK_DATA = [
  // Fer
  { type: 'iron_ingot',         sellPrice: 3,        sellAmount: 1, category: 'Lingots & Nuggets' },
  { type: 'iron_block',         sellPrice: 25,        sellAmount: 1, category: 'Blocs' },
  { type: 'oraxen:fer_t1',      sellPrice: 1800,      sellAmount: 1, category: 'Compressés' },
  { type: 'oraxen:fer_t2',      sellPrice: 16000,     sellAmount: 1, category: 'Compressés' },
  { type: 'oraxen:fer_t3',      sellPrice: 145000,    sellAmount: 1, category: 'Compressés' },
  { type: 'oraxen:fer_t4',      sellPrice: 1300000,   sellAmount: 1, category: 'Compressés' },
  // Or
  { type: 'gold_ingot',         sellPrice: 16,        sellAmount: 1, category: 'Lingots & Nuggets' },
  { type: 'gold_block',         sellPrice: 140,       sellAmount: 1, category: 'Blocs' },
  { type: 'oraxen:or_t1',       sellPrice: 9500,      sellAmount: 1, category: 'Compressés' },
  { type: 'oraxen:or_t2',       sellPrice: 85000,     sellAmount: 1, category: 'Compressés' },
  { type: 'oraxen:or_t3',       sellPrice: 765000,    sellAmount: 1, category: 'Compressés' },
  // Cuivre
  { type: 'copper_ingot',       sellPrice: 1.5,       sellAmount: 1, category: 'Lingots & Nuggets' },
  { type: 'copper_block',       sellPrice: 12,        sellAmount: 1, category: 'Blocs' },
  { type: 'oraxen:cuivre_t1',   sellPrice: 870,       sellAmount: 1, category: 'Compressés' },
  { type: 'oraxen:cuivre_t2',   sellPrice: 7800,      sellAmount: 1, category: 'Compressés' },
  // Diamant
  { type: 'diamond',            sellPrice: 67.2,      sellAmount: 1, category: 'Gemmes' },
  { type: 'diamond_block',      sellPrice: 604,       sellAmount: 1, category: 'Blocs' },
  { type: 'oraxen:diamant_t1',  sellPrice: 39500,     sellAmount: 1, category: 'Compressés' },
  { type: 'oraxen:diamant_t2',  sellPrice: 355000,    sellAmount: 1, category: 'Compressés' },
  { type: 'oraxen:diamant_t3',  sellPrice: 3200000,   sellAmount: 1, category: 'Compressés' },
  // Émeraude
  { type: 'emerald',            sellPrice: 50,        sellAmount: 1, category: 'Gemmes' },
  { type: 'emerald_block',      sellPrice: 430,       sellAmount: 1, category: 'Blocs' },
  { type: 'oraxen:emeraude_t1', sellPrice: 29500,     sellAmount: 1, category: 'Compressés' },
  { type: 'oraxen:emeraude_t2', sellPrice: 265000,    sellAmount: 1, category: 'Compressés' },
  // Charbon
  { type: 'coal',               sellPrice: 1.5,       sellAmount: 1, category: 'Minerais' },
  { type: 'coal_block',         sellPrice: 12,        sellAmount: 1, category: 'Blocs' },
  { type: 'oraxen:charbon_t1',  sellPrice: 870,       sellAmount: 1, category: 'Compressés' },
  { type: 'oraxen:charbon_t2',  sellPrice: 7800,      sellAmount: 1, category: 'Compressés' },
  // Lapis
  { type: 'lapis_lazuli',       sellPrice: 6,         sellAmount: 1, category: 'Gemmes' },
  { type: 'lapis_block',        sellPrice: 50,        sellAmount: 1, category: 'Blocs' },
  { type: 'oraxen:lapis_t1',    sellPrice: 3500,      sellAmount: 1, category: 'Compressés' },
  { type: 'oraxen:lapis_t2',    sellPrice: 31500,     sellAmount: 1, category: 'Compressés' },
  // Redstone
  { type: 'redstone',           sellPrice: 4,         sellAmount: 1, category: 'Minerais' },
  { type: 'redstone_block',     sellPrice: 34,        sellAmount: 1, category: 'Blocs' },
  { type: 'oraxen:redstone_t1', sellPrice: 2350,      sellAmount: 1, category: 'Compressés' },
  { type: 'oraxen:redstone_t2', sellPrice: 21000,     sellAmount: 1, category: 'Compressés' },
  // Quartz
  { type: 'quartz',             sellPrice: 7,         sellAmount: 1, category: 'Nether' },
  { type: 'quartz_block',       sellPrice: 25,        sellAmount: 1, category: 'Blocs' },
  { type: 'oraxen:quartz_t1',   sellPrice: 4100,      sellAmount: 1, category: 'Compressés' },
  // Netherite
  { type: 'netherite_ingot',    sellPrice: 350,       sellAmount: 1, category: 'Nether' },
  { type: 'netherite_block',    sellPrice: 3000,      sellAmount: 1, category: 'Nether' },
  { type: 'oraxen:netherite_t1', sellPrice: 205000,   sellAmount: 1, category: 'Compressés' },
  // Loots de mobs (exemples déjà fonctionnels)
  { type: 'oraxen:patte_lapin_t1', sellPrice: 277551, sellAmount: 1, category: 'Loots de mobs' },
  { type: 'oraxen:patte_lapin_t2', sellPrice: 832654, sellAmount: 1, category: 'Loots de mobs' },
  { type: 'oraxen:patte_lapin_t3', sellPrice: 2497962.24, sellAmount: 1, category: 'Loots de mobs' },
  { type: 'oraxen:os_t1',          sellPrice: 120000, sellAmount: 1, category: 'Loots de mobs' },
  { type: 'oraxen:fil_t1',         sellPrice: 95000,  sellAmount: 1, category: 'Loots de mobs' },
  { type: 'oraxen:ender_pearl_t1', sellPrice: 450000, sellAmount: 1, category: 'Loots de mobs' },
];

// ─── localStorage ─────────────────────────────────────────────────────────
function saveSlimCache(items) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: items, ts: Date.now() }));
    return true;
  } catch (e) {
    console.warn('[Excalia] Cache localStorage échoué:', e.message);
    return false;
  }
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    return { data, timestamp: ts };
  } catch { return null; }
}

function saveHistory(items) {
  try {
    const hist = JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
    hist.push({
      ts: Date.now(),
      prices: Object.fromEntries(items.filter(i => i.sellPrice != null).map(i => [i.type, i.sellPrice])),
    });
    localStorage.setItem(HIST_KEY, JSON.stringify(hist.slice(-48)));
  } catch {}
}

// ─── Prix personnalisés ────────────────────────────────────────────────────
export function getCustomPrices() {
  try { return JSON.parse(localStorage.getItem(CUST_KEY) || '{}'); } catch { return {}; }
}
export function setCustomPrice(t, p) {
  const c = getCustomPrices();
  const price = Number(p);
  if (!t || Number.isNaN(price) || price < 0) return;
  c[t] = price;
  try { localStorage.setItem(CUST_KEY, JSON.stringify(c)); } catch {}
}
export function removeCustomPrice(t) {
  const c = getCustomPrices(); delete c[t];
  try { localStorage.setItem(CUST_KEY, JSON.stringify(c)); } catch {}
}
export function clearCustomPrices() { localStorage.removeItem(CUST_KEY); }

function applyCustom(items) {
  const custom = getCustomPrices();
  const customEntries = Object.entries(custom)
    .map(([type, price]) => ({ type, price: Number(price) }))
    .filter(({ type, price }) => type && !Number.isNaN(price) && price >= 0);

  if (!customEntries.length) return items;

  const existing = new Set(items.map(i => normalizeKey(i.type)));
  const existingExact = new Set(items.map(i => i.type));

  const patched = items.map(i => {
    const exact = custom[i.type];
    const normalized = custom[normalizeKey(i.type)];
    const price = exact !== undefined ? exact : normalized;
    return price !== undefined ? { ...i, sellPrice: Number(price), customPrice: true } : i;
  });

  for (const { type, price } of customEntries) {
    const normalized = normalizeKey(type);
    if (!existing.has(normalized) && !existingExact.has(type)) {
      patched.push({
        type: type,  // conserver le nom exact (oraxen:fer_t1 si saisi ainsi)
        sellPrice: price,
        sellAmount: 1,
        sellCurrency: 'Skydollars',
        category: detectCategory(type),
        customPrice: true,
        source: 'custom',
      });
    }
  }

  return patched;
}

// ─── Fetch principal ───────────────────────────────────────────────────────
export async function fetchEconomyData() {
  const cached = readCache();
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { data: applyCustom(cached.data), source: 'cache', fromCache: true, mock: false, timestamp: cached.timestamp };
  }

  try {
    const res = await fetch(API_URL, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

    const rawJson = await res.json();
    const extracted = extractEconomyItems(rawJson);
    if (!extracted.length) throw new Error('Aucun item économique trouvé dans la réponse API');

    const enriched = enrichWithCategories(extracted);
    saveSlimCache(enriched);
    saveHistory(enriched);

    return { data: applyCustom(enriched), source: 'api', fromCache: false, mock: false, timestamp: Date.now(), rawStructure: Object.keys(rawJson) };

  } catch (err) {
    console.error('[Excalia] Erreur fetch:', err.message);

    if (cached) {
      return { data: applyCustom(cached.data), source: 'cache', fromCache: true, stale: true, mock: false, timestamp: cached.timestamp, apiError: err.message };
    }

    return { data: [], source: 'error', fromCache: false, mock: false, apiError: err.message, timestamp: Date.now() };
  }
}

export function getMockData() {
  return { data: applyCustom(MOCK_DATA), source: 'mock', fromCache: false, mock: true, timestamp: Date.now() };
}

export function clearCache() {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem('excalia_slim_v2');
}

export function getPriceHistory() {
  try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch { return []; }
}

/**
 * buildPriceMap — CORRECTION v4 :
 * Conserve la clé EXACTE (ex: oraxen:fer_t1) ET la version normalisée (fer_t1).
 * Avant, la clé exacte oraxen:xxx était stockée mais la recherche candidat
 * ne générait jamais "oraxen:fer_t1" → miss systématique.
 * Maintenant getTierCandidateKeys() génère les clés oraxen: → match direct.
 */
export function buildPriceMap(items) {
  const map = {};
  for (const item of items) {
    if (!item.type) continue;
    const price = item.sellPrice ?? null;
    if (price === null || price === undefined || Number.isNaN(Number(price))) continue;

    const exact = item.type;
    const normalized = normalizeKey(item.type);

    // Clé exacte (oraxen:fer_t1 reste oraxen:fer_t1)
    map[exact] = Number(price);
    // Clé normalisée (oraxen:fer_t1 → fer_t1)
    if (normalized !== exact) map[normalized] = Number(price);
  }

  const custom = getCustomPrices();
  for (const [key, value] of Object.entries(custom)) {
    const price = Number(value);
    if (!key || Number.isNaN(price) || price < 0) continue;
    map[key] = price;
    const normalized = normalizeKey(key);
    if (normalized !== key) map[normalized] = price;
  }

  return map;
}

export function getItemPrice(items, typeKey) {
  const item = items.find(i => i.type === typeKey);
  return item ? (item.sellPrice ?? 0) : null;
}

export function computeStats(items) {
  if (!items.length) return null;
  const withPrice = items.filter(i => i.sellPrice != null);
  const prices = withPrice.map(i => i.sellPrice);
  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];
  const mostExpensive = withPrice.reduce((a, b) => (a.sellPrice > b.sellPrice ? a : b), withPrice[0]);
  const cheapest = withPrice.reduce((a, b) => (a.sellPrice < b.sellPrice ? a : b), withPrice[0]);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  return {
    total: items.length,
    withPrice: withPrice.length,
    categories: categories.length,
    categoryList: categories.sort(),
    mostExpensive,
    cheapest,
    avgPrice: avg,
    pages: [...new Set(items.map(i => i.page).filter(v => v != null))].length,
  };
}
