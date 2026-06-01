import recipes from '../data/recipes.json';
import { resolveTierPrice } from '../services/excaliaApi';

const { stackSize, blockRatioDefault, tierStacksDefault } = recipes;

/**
 * Calculate base units required for a given tier
 * T1 = stacksDefault * stackSize base units
 * T2 = 9 * T1 base units
 * etc.
 */
export function calcBaseUnitsForTier(tierKey, family) {
  const familyDef = recipes.families[family];
  if (!familyDef) return null;

  const tiers = familyDef.tiers;
  const tierKeys = Object.keys(tiers);
  const tierIndex = tierKeys.indexOf(tierKey);
  if (tierIndex === -1) return null;

  const firstTier = tiers[tierKeys[0]];
  const baseUnitsPerT1 = (firstTier.stacks ?? tierStacksDefault) * stackSize;

  // Each subsequent tier requires 9x the previous
  let total = baseUnitsPerT1;
  for (let i = 1; i <= tierIndex; i++) {
    total *= (tiers[tierKeys[i]].quantity ?? 9);
  }

  return total;
}

/**
 * How many of a given tier can be crafted from baseUnits
 */
export function calcCraftableFromBase(baseUnits, tierKey, family) {
  const required = calcBaseUnitsForTier(tierKey, family);
  if (!required) return 0;
  return Math.floor(baseUnits / required);
}

/**
 * Calculate all profitability options for a family given price map
 */
export function calcFamilyProfitability(family, priceMap) {
  const familyDef = recipes.families[family];
  if (!familyDef) return null;

  const blockRatio = familyDef.blockRatio ?? blockRatioDefault;
  const baseItem = familyDef.baseItem;
  const blockItem = familyDef.blockItem;
  const oreItem = familyDef.oreItem;

  const basePrice = priceMap[baseItem] ?? 0;
  const blockPrice = priceMap[blockItem] ?? 0;
  const orePrice = priceMap[oreItem] ?? 0;

  const options = [];

  // Raw base item
  if (basePrice > 0) {
    options.push({
      key: 'base',
      label: familyDef.label + ' (lingots)',
      type: 'base',
      pricePerUnit: basePrice,
      baseUnitsRequired: 1,
      blocksEquivalent: 1 / blockRatio,
      revenuePerBaseUnit: basePrice,
      efficiency: 1,
    });
  }

  // Ore
  if (orePrice > 0) {
    options.push({
      key: 'ore',
      label: familyDef.label + ' (minerai)',
      type: 'ore',
      pricePerUnit: orePrice,
      baseUnitsRequired: 1,
      blocksEquivalent: 1 / blockRatio,
      revenuePerBaseUnit: orePrice,
      efficiency: orePrice / (basePrice || 1),
    });
  }

  // Block
  if (blockPrice > 0 && basePrice > 0) {
    const revenuePerBase = blockPrice / blockRatio;
    options.push({
      key: 'block',
      label: familyDef.label + ' (blocs)',
      type: 'block',
      pricePerUnit: blockPrice,
      baseUnitsRequired: blockRatio,
      blocksEquivalent: 1,
      revenuePerBaseUnit: revenuePerBase,
      efficiency: revenuePerBase / basePrice,
    });
  }

  // Compressed tiers
  const tiers = familyDef.tiers;
  for (const [tierKey] of Object.entries(tiers)) {
    const baseUnitsRequired = calcBaseUnitsForTier(tierKey, family);
    if (!baseUnitsRequired) continue;

    // On tente toutes les variantes de noms API connues, puis une recherche floue.
    const resolved = resolveTierPrice(family, tierKey, priceMap);
    const tierPrice = resolved && resolved.price > 0 ? resolved.price : null;
    const revenuePerBaseUnit = tierPrice !== null ? tierPrice / baseUnitsRequired : null;

    // IMPORTANT : même si le prix du tier est absent de l'API, on ajoute quand même
    // la ligne. Comme ça la page Minerais affiche T1/T2/T3/T4 à côté des blocs
    // avec le coût théorique et la mention "Non trouvé dans l'API" au lieu de cacher le tier.
    options.push({
      key: tierKey,
      label: familyDef.label + ` (${tierKey.toUpperCase()})`,
      type: 'compressed',
      tier: parseInt(tierKey.replace('t', '')),
      pricePerUnit: tierPrice,
      apiKey: resolved?.key ?? null,
      apiStrategy: resolved?.strategy ?? null,
      missingPrice: tierPrice === null,
      baseUnitsRequired,
      blocksEquivalent: baseUnitsRequired / blockRatio,
      directSaleValue: basePrice > 0 ? baseUnitsRequired * basePrice : null,
      profit: tierPrice !== null && basePrice > 0 ? tierPrice - baseUnitsRequired * basePrice : null,
      profitPct: tierPrice !== null && basePrice > 0 ? ((tierPrice - baseUnitsRequired * basePrice) / (baseUnitsRequired * basePrice)) * 100 : null,
      revenuePerBaseUnit,
      efficiency: revenuePerBaseUnit !== null ? revenuePerBaseUnit / (basePrice || 1) : null,
    });
  }

  if (options.length === 0) return null;

  // Sort by revenue per base unit descending, but keep missing prices at the end
  options.sort((a, b) => (b.revenuePerBaseUnit ?? -Infinity) - (a.revenuePerBaseUnit ?? -Infinity));

  const pricedOptions = options.filter(o => o.revenuePerBaseUnit !== null && o.revenuePerBaseUnit !== undefined);
  const best = pricedOptions[0] ?? options[0];
  const worst = pricedOptions[pricedOptions.length - 1] ?? options[options.length - 1];
  const baseOption = options.find(o => o.key === 'base') ?? worst;

  return {
    family,
    label: familyDef.label,
    emoji: familyDef.emoji,
    color: familyDef.color,
    mcIcon: familyDef.mcIcon ?? null,
    options,
    best,
    worst,
    baseOption,
    gainVsBase: baseOption
      ? ((best.revenuePerBaseUnit - baseOption.revenuePerBaseUnit) / (baseOption.revenuePerBaseUnit || 1)) * 100
      : 0,
  };
}

/**
 * Simulate revenue for a given quantity of base units
 */
export function simulateQuantity(baseUnits, family, priceMap) {
  const familyDef = recipes.families[family];
  if (!familyDef) return [];

  const blockRatio = familyDef.blockRatio ?? blockRatioDefault;
  const basePrice = priceMap[familyDef.baseItem] ?? 0;
  const blockPrice = priceMap[familyDef.blockItem] ?? 0;

  const results = [];

  // Sell raw
  if (basePrice > 0) {
    results.push({
      key: 'base',
      label: 'Vente lingots',
      qty: baseUnits,
      revenue: baseUnits * basePrice,
      leftover: 0,
    });
  }

  // Sell as blocks
  if (blockPrice > 0) {
    const blocks = Math.floor(baseUnits / blockRatio);
    const leftover = baseUnits % blockRatio;
    results.push({
      key: 'block',
      label: 'Vente en blocs',
      qty: blocks,
      revenue: blocks * blockPrice + leftover * basePrice,
      leftover,
    });
  }

  // Each tier
  for (const [tierKey] of Object.entries(familyDef.tiers)) {
    // ⚠ CORRECTION : même logique que calcFamilyProfitability
    const resolved = resolveTierPrice(family, tierKey, priceMap);
    if (!resolved || resolved.price <= 0) continue;
    const tierPrice = resolved.price;

    const required = calcBaseUnitsForTier(tierKey, family);
    if (!required) continue;

    const craftable = Math.floor(baseUnits / required);
    if (craftable < 1) {
      results.push({
        key: tierKey,
        label: `Vente ${tierKey.toUpperCase()}`,
        qty: 0,
        revenue: baseUnits * basePrice, // sell raw instead
        leftover: baseUnits,
        cantCraft: true,
        required,
      });
      continue;
    }

    const leftover = baseUnits % required;
    const revenue = craftable * tierPrice + leftover * basePrice;
    results.push({
      key: tierKey,
      label: `Vente ${tierKey.toUpperCase()}`,
      qty: craftable,
      revenue,
      leftover,
      required,
    });
  }

  results.sort((a, b) => b.revenue - a.revenue);

  const best = results[0];
  const worst = results[results.length - 1];

  return { results, best, worst, baseUnits };
}

/**
 * Compute all families profitability ranking
 */
export function rankAllFamilies(priceMap) {
  const ranked = [];
  for (const family of Object.keys(recipes.families)) {
    const prof = calcFamilyProfitability(family, priceMap);
    if (prof) ranked.push(prof);
  }
  ranked.sort((a, b) => (b.best?.revenuePerBaseUnit ?? 0) - (a.best?.revenuePerBaseUnit ?? 0));
  return ranked;
}

/**
 * Top N best crafts across all families
 */
export function topCrafts(priceMap, n = 10) {
  const all = [];
  for (const family of Object.keys(recipes.families)) {
    const prof = calcFamilyProfitability(family, priceMap);
    if (!prof) continue;
    for (const opt of prof.options) {
      if ((opt.type === 'compressed' || opt.type === 'block') && opt.efficiency !== null && opt.efficiency !== undefined) {
        all.push({
          family,
          label: familyLabel(family) + ` → ${opt.label}`,
          efficiency: opt.efficiency,
          revenuePerBaseUnit: opt.revenuePerBaseUnit,
          option: opt,
          emoji: recipes.families[family]?.emoji,
          color: recipes.families[family]?.color,
        });
      }
    }
  }
  all.sort((a, b) => b.efficiency - a.efficiency);
  return all.slice(0, n);
}

export function worstCrafts(priceMap, n = 10) {
  const all = [];
  for (const family of Object.keys(recipes.families)) {
    const prof = calcFamilyProfitability(family, priceMap);
    if (!prof) continue;
    for (const opt of prof.options) {
      if ((opt.type === 'compressed' || opt.type === 'block') && opt.efficiency !== null && opt.efficiency !== undefined) {
        all.push({
          family,
          label: familyLabel(family) + ` → ${opt.label}`,
          efficiency: opt.efficiency,
          revenuePerBaseUnit: opt.revenuePerBaseUnit,
          option: opt,
          emoji: recipes.families[family]?.emoji,
          color: recipes.families[family]?.color,
        });
      }
    }
  }
  all.sort((a, b) => a.efficiency - b.efficiency);
  return all.slice(0, n);
}

export function familyLabel(family) {
  return recipes.families[family]?.label ?? family;
}

export function formatNumber(n, decimals = 0) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return Number(n).toFixed(decimals);
}

export function formatCurrency(n) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 'G€';
  if (n >= 1_000_000) return (n / 1_000_000).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 'M€';
  if (n >= 1_000) return (n / 1_000).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'k€';
  // Petits prix : toujours 2 décimales (67,20 et pas 67)
  return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€';
}

export { recipes };
