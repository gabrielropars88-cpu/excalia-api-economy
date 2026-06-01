/**
 * itemDisplay.js — Noms FR des items Minecraft + Oraxen
 *
 * CORRECTION v4 :
 * - getItemDisplayName() gère les noms oraxen:xxx et oraxen:xxx_t1/t2/t3/t4
 * - Noms français pour les tiers Oraxen (oraxen:fer_t1 → "Fer compressé T1")
 * - Noms français pour les loots Oraxen (oraxen:patte_lapin_t3 → "Patte de lapin T3")
 */

const NAME_MAP = {
  // ── Fer ──────────────────────────────────────────────────────────────────
  iron_ingot: 'Lingot de fer',      iron_block: 'Bloc de fer',
  iron_ore: 'Minerai de fer',       raw_iron: 'Fer brut',
  iron_nugget: 'Pépite de fer',
  iron_t1: 'Fer compressé T1',      iron_t2: 'Fer compressé T2',
  iron_t3: 'Fer compressé T3',      iron_t4: 'Fer compressé T4',
  'oraxen:fer_t1': 'Fer compressé T1', 'oraxen:fer_t2': 'Fer compressé T2',
  'oraxen:fer_t3': 'Fer compressé T3', 'oraxen:fer_t4': 'Fer compressé T4',
  fer_t1: 'Fer compressé T1',       fer_t2: 'Fer compressé T2',
  fer_t3: 'Fer compressé T3',       fer_t4: 'Fer compressé T4',
  // ── Or ───────────────────────────────────────────────────────────────────
  gold_ingot: "Lingot d'or",        gold_block: "Bloc d'or",
  gold_ore: "Minerai d'or",         raw_gold: 'Or brut',
  gold_nugget: "Pépite d'or",
  gold_t1: 'Or compressé T1',       gold_t2: 'Or compressé T2',
  gold_t3: 'Or compressé T3',       gold_t4: "Or compressé T4",
  'oraxen:or_t1': 'Or compressé T1',   'oraxen:or_t2': 'Or compressé T2',
  'oraxen:or_t3': 'Or compressé T3',   'oraxen:or_t4': 'Or compressé T4',
  or_t1: 'Or compressé T1',         or_t2: 'Or compressé T2',
  or_t3: 'Or compressé T3',
  // ── Cuivre ───────────────────────────────────────────────────────────────
  copper_ingot: 'Lingot de cuivre', copper_block: 'Bloc de cuivre',
  copper_ore: 'Minerai de cuivre',  raw_copper: 'Cuivre brut',
  copper_t1: 'Cuivre compressé T1', copper_t2: 'Cuivre compressé T2',
  copper_t3: 'Cuivre compressé T3',
  'oraxen:cuivre_t1': 'Cuivre compressé T1', 'oraxen:cuivre_t2': 'Cuivre compressé T2',
  'oraxen:cuivre_t3': 'Cuivre compressé T3',
  cuivre_t1: 'Cuivre compressé T1', cuivre_t2: 'Cuivre compressé T2',
  // ── Charbon ──────────────────────────────────────────────────────────────
  coal: 'Charbon',                   coal_block: 'Bloc de charbon',
  coal_ore: 'Minerai de charbon',
  coal_t1: 'Charbon compressé T1',   coal_t2: 'Charbon compressé T2',
  'oraxen:charbon_t1': 'Charbon compressé T1', 'oraxen:charbon_t2': 'Charbon compressé T2',
  charbon_t1: 'Charbon compressé T1', charbon_t2: 'Charbon compressé T2',
  // ── Diamant ───────────────────────────────────────────────────────────────
  diamond: 'Diamant',               diamond_block: 'Bloc de diamant',
  diamond_ore: 'Minerai de diamant', deepslate_diamond_ore: 'Minerai de diamant (ardoise)',
  diamond_t1: 'Diamant compressé T1', diamond_t2: 'Diamant compressé T2',
  diamond_t3: 'Diamant compressé T3', diamond_t4: 'Diamant compressé T4',
  'oraxen:diamant_t1': 'Diamant compressé T1', 'oraxen:diamant_t2': 'Diamant compressé T2',
  'oraxen:diamant_t3': 'Diamant compressé T3', 'oraxen:diamant_t4': 'Diamant compressé T4',
  diamant_t1: 'Diamant compressé T1', diamant_t2: 'Diamant compressé T2',
  diamant_t3: 'Diamant compressé T3',
  // ── Émeraude ──────────────────────────────────────────────────────────────
  emerald: 'Émeraude',              emerald_block: "Bloc d'émeraude",
  emerald_ore: "Minerai d'émeraude", deepslate_emerald_ore: "Minerai d'émeraude (ardoise)",
  emerald_t1: 'Émeraude compressée T1', emerald_t2: 'Émeraude compressée T2',
  'oraxen:emeraude_t1': 'Émeraude compressée T1', 'oraxen:emeraude_t2': 'Émeraude compressée T2',
  emeraude_t1: 'Émeraude compressée T1', emeraude_t2: 'Émeraude compressée T2',
  // ── Redstone ──────────────────────────────────────────────────────────────
  redstone: 'Redstone',             redstone_block: 'Bloc de redstone',
  redstone_ore: 'Minerai de redstone', deepslate_redstone_ore: 'Minerai de redstone (ardoise)',
  redstone_t1: 'Redstone compressé T1', redstone_t2: 'Redstone compressé T2',
  'oraxen:redstone_t1': 'Redstone compressé T1', 'oraxen:redstone_t2': 'Redstone compressé T2',
  // ── Lapis ─────────────────────────────────────────────────────────────────
  lapis_lazuli: 'Lapis-lazuli',     lapis_block: 'Bloc de lapis-lazuli',
  lapis_ore: 'Minerai de lapis-lazuli', deepslate_lapis_ore: 'Minerai de lapis (ardoise)',
  lapis_t1: 'Lapis compressé T1',   lapis_t2: 'Lapis compressé T2',
  'oraxen:lapis_t1': 'Lapis compressé T1', 'oraxen:lapis_t2': 'Lapis compressé T2',
  // ── Quartz ────────────────────────────────────────────────────────────────
  quartz: 'Quartz',                 quartz_block: 'Bloc de quartz',
  nether_quartz_ore: 'Minerai de quartz (Nether)',
  quartz_t1: 'Quartz compressé T1', quartz_t2: 'Quartz compressé T2',
  'oraxen:quartz_t1': 'Quartz compressé T1', 'oraxen:quartz_t2': 'Quartz compressé T2',
  // ── Netherite ─────────────────────────────────────────────────────────────
  netherite_ingot: 'Lingot de netherite', netherite_block: 'Bloc de netherite',
  ancient_debris: 'Vieux débris',   netherite_scrap: 'Débris de netherite',
  netherite_t1: 'Netherite compressé T1', netherite_t2: 'Netherite compressé T2',
  'oraxen:netherite_t1': 'Netherite compressé T1', 'oraxen:netherite_t2': 'Netherite compressé T2',
  // ── Amethyst ──────────────────────────────────────────────────────────────
  amethyst_shard: "Éclat d'améthyste", amethyst_block: "Bloc d'améthyste",
  budding_amethyst: 'Améthyste en croissance',
  // ── Bois ──────────────────────────────────────────────────────────────────
  oak_log: 'Bûche de chêne',       birch_log: 'Bûche de bouleau',
  spruce_log: "Bûche d'épicéa",    jungle_log: 'Bûche de jungle',
  acacia_log: "Bûche d'acacia",    dark_oak_log: 'Bûche de chêne noir',
  mangrove_log: 'Bûche de palétuviers', cherry_log: 'Bûche de cerisier',
  bamboo_block: 'Bloc de bambou',  crimson_stem: 'Tige cramoisie',
  warped_stem: 'Tige déformée',
  // ── Nourriture ────────────────────────────────────────────────────────────
  bread: 'Pain',                    wheat: 'Blé',
  carrot: 'Carotte',                potato: 'Pomme de terre',
  apple: 'Pomme',                   golden_apple: 'Pomme en or',
  enchanted_golden_apple: 'Pomme en or enchantée',
  beef: 'Bœuf cru',                 cooked_beef: 'Bœuf cuit',
  porkchop: 'Côtelette de porc',    cooked_porkchop: 'Côtelette cuite',
  chicken: 'Poulet cru',            cooked_chicken: 'Poulet cuit',
  cod: 'Cabillaud',                 salmon: 'Saumon',
  tropical_fish: 'Poisson tropical', pufferfish: 'Poisson-globe',
  // ── Loots de mobs ─────────────────────────────────────────────────────────
  bone: 'Os',                       bone_meal: "Farine d'os",
  string: 'Ficelle',                spider_eye: "Œil d'araignée",
  gunpowder: 'Poudre à canon',      rotten_flesh: 'Chair pourrie',
  ender_pearl: "Perle de l'Ender",  blaze_rod: 'Bâton de Blaze',
  blaze_powder: 'Poudre de Blaze',  ghast_tear: 'Larme de Ghast',
  magma_cream: 'Crème de magma',    slime_ball: 'Boule de slime',
  leather: 'Cuir',                  feather: 'Plume',
  ink_sac: "Poche d'encre",         glow_ink_sac: "Poche d'encre brillante",
  prismarine_shard: 'Éclat de prismarine', prismarine_crystal: 'Cristal de prismarine',
  nether_star: 'Étoile du Nether',  totem_of_undying: "Totem d'immortalité",
  shulker_shell: 'Coquille de Shulker', elytra: 'Élytre',
  dragon_breath: 'Souffle de dragon',
  rabbit_hide: 'Peau de lapin',     rabbit_foot: 'Patte de lapin',
  // ── Nether ────────────────────────────────────────────────────────────────
  glowstone: 'Pierre lumineuse',    glowstone_dust: 'Poudre lumineuse',
  soul_sand: 'Sable des âmes',      soul_soil: 'Terre des âmes',
  nether_brick: 'Brique du Nether', nether_wart: 'Verrue du Nether',
  basalt: 'Basalte',                blackstone: 'Roche noire',
};

/**
 * Correspondances noms Oraxen français → noms d'affichage
 * Pour les items dont le type est "oraxen:patte_lapin_t3" etc.
 */
const ORAXEN_DISPLAY_NAMES = {
  // Loots de mobs (base sans tier)
  patte_lapin:      'Patte de lapin',
  os:               'Os',
  chair_putrefiee:  'Chair putréfiée',
  chair_pourrie:    'Chair pourrie',
  fil:              'Ficelle',
  ficelle:          'Ficelle',
  poudre_a_canon:   'Poudre à canon',
  poudre_canon:     'Poudre à canon',
  perle_ender:      "Perle de l'Ender",
  ender_pearl:      "Perle de l'Ender",
  baton_blaze:      'Bâton de Blaze',
  poudre_blaze:     'Poudre de Blaze',
  larme_ghast:      'Larme de Ghast',
  creme_magma:      'Crème de magma',
  boule_slime:      'Boule de slime',
  cuir:             'Cuir',
  plume:            'Plume',
  encre:            "Poche d'encre",
  encre_brillante:  "Poche d'encre brillante",
  etoile_nether:    'Étoile du Nether',
  totem:            "Totem d'immortalité",
  coquille_shulker: 'Coquille de Shulker',
  elytre:           'Élytre',
  // Minerais (noms oraxen français)
  fer:              'Fer',
  or:               'Or',
  cuivre:           'Cuivre',
  charbon:          'Charbon',
  diamant:          'Diamant',
  emeraude:         'Émeraude',
  redstone:         'Redstone',
  lapis:            'Lapis-lazuli',
  quartz:           'Quartz',
  netherite:        'Netherite',
};

/**
 * getItemDisplayName(type) — CORRECTION v4
 *
 * Gère :
 * - Noms exacts (iron_ingot → "Lingot de fer")
 * - Noms oraxen: avec tier (oraxen:fer_t1 → "Fer compressé T1")
 * - Noms oraxen: sans tier (oraxen:patte_lapin → "Patte de lapin")
 * - Noms oraxen: loots avec tier (oraxen:patte_lapin_t3 → "Patte de lapin T3")
 * - Fallback lisible si rien trouvé
 */
export function getItemDisplayName(type) {
  if (!type) return '—';

  // 1. Correspondance exacte (inclut les clés oraxen:xxx_t1)
  if (NAME_MAP[type]) return NAME_MAP[type];

  // 2. Traitement spécial pour les noms oraxen:
  if (type.startsWith('oraxen:')) {
    const inner = type.replace(/^oraxen:/, '');

    // 2a. Correspondance exacte de la partie interne
    if (NAME_MAP[inner]) return NAME_MAP[inner];

    // 2b. Détecter le suffixe de tier
    const tierMatch = inner.match(/^(.+?)_(t[1-4])$/);
    if (tierMatch) {
      const base = tierMatch[1];       // ex: "fer", "patte_lapin", "diamant"
      const tier = tierMatch[2].toUpperCase(); // ex: "T1", "T2"

      // Correspondance directe base dans NAME_MAP
      if (NAME_MAP[`${base}_${tierMatch[2]}`]) return NAME_MAP[`${base}_${tierMatch[2]}`];

      // Chercher le nom de base dans ORAXEN_DISPLAY_NAMES
      if (ORAXEN_DISPLAY_NAMES[base]) {
        return `${ORAXEN_DISPLAY_NAMES[base]} ${tier}`;
      }

      // Cherche en partiel (patte_lapin → patte)
      const parts = base.split('_');
      for (let len = parts.length; len >= 1; len--) {
        const partial = parts.slice(0, len).join('_');
        if (ORAXEN_DISPLAY_NAMES[partial]) {
          return `${ORAXEN_DISPLAY_NAMES[partial]} ${tier}`;
        }
      }

      // Fallback : nom de base humanisé + tier
      const humanBase = base.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return `${humanBase} ${tier}`;
    }

    // 2c. Pas de tier : juste le nom de base
    if (ORAXEN_DISPLAY_NAMES[inner]) return ORAXEN_DISPLAY_NAMES[inner];

    // Cherche en partiel
    const parts = inner.split('_');
    for (let len = parts.length; len >= 1; len--) {
      const partial = parts.slice(0, len).join('_');
      if (ORAXEN_DISPLAY_NAMES[partial]) return ORAXEN_DISPLAY_NAMES[partial];
    }

    // Fallback : humaniser le nom oraxen
    return inner.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // 3. Fallback général lisible : "iron_ore" → "Iron Ore"
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function getItemFamily(type) {
  if (!type) return 'unknown';
  const clean = type.replace(/^oraxen:/, '').replace(/^minecraft:/, '');
  const prefixes = [
    'iron','gold','copper','coal','diamond','emerald','redstone','lapis','quartz','netherite',
    'fer','or','cuivre','charbon','diamant','emeraude','oak','birch','spruce','jungle',
    'acacia','dark_oak','mangrove','cherry','crimson','warped'
  ];
  for (const p of prefixes) {
    if (clean === p || clean.startsWith(p + '_') || clean === p + '_lazuli') return p;
  }
  return clean.split('_')[0];
}

export function isBlock(type)  { return (type?.endsWith('_block') || type?.includes(':') && type?.split(':')[1]?.endsWith('_block')) ?? false; }
export function isIngot(type)  { return type?.endsWith('_ingot') ?? false; }
export function isTier(type)   { return /_(t[1-4])$/.test(type ?? ''); }
export function getTier(type)  { const m = (type ?? '').match(/_(t([1-4]))$/); return m ? parseInt(m[2]) : null; }
