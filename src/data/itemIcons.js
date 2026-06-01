/**
 * itemIcons.js — Icônes Minecraft pour Excalia Economy
 *
 * CORRECTION v4 :
 * - getItemIcon() intelligente : gère les noms oraxen:xxx_t1/t2/t3/t4
 * - Nettoie oraxen:, retire _t1/_t2/_t3/_t4 pour trouver l'icône de base
 * - Mappage français ↔ icône (fer→iron_ingot, diamant→diamond, etc.)
 * - Fallback par catégorie si icône spécifique absente
 */

export const ITEM_ICONS = {
  // ── Fer ──────────────────────────────────────────────────────────────────
  iron_ingot:   'https://minecraft.wiki/images/Iron_Ingot_JE3_BE2.png',
  iron_block:   'https://minecraft.wiki/images/Block_of_Iron_JE4_BE3.png',
  iron_ore:     'https://minecraft.wiki/images/Iron_Ore_JE4_BE3.png',
  raw_iron:     'https://minecraft.wiki/images/Raw_Iron_JE2_BE2.png',
  iron_nugget:  'https://minecraft.wiki/images/Iron_Nugget_JE2_BE1.png',
  // Or
  gold_ingot:   'https://minecraft.wiki/images/Gold_Ingot_JE4_BE2.png',
  gold_block:   'https://minecraft.wiki/images/Block_of_Gold_JE6_BE3.png',
  gold_ore:     'https://minecraft.wiki/images/Gold_Ore_JE4_BE2.png',
  raw_gold:     'https://minecraft.wiki/images/Raw_Gold_JE2_BE2.png',
  gold_nugget:  'https://minecraft.wiki/images/Gold_Nugget_JE2_BE1.png',
  // Cuivre
  copper_ingot: 'https://minecraft.wiki/images/Copper_Ingot_JE2_BE1.png',
  copper_block: 'https://minecraft.wiki/images/Block_of_Copper_JE2_BE1.png',
  copper_ore:   'https://minecraft.wiki/images/Copper_Ore_JE3_BE3.png',
  raw_copper:   'https://minecraft.wiki/images/Raw_Copper_JE2_BE2.png',
  // Charbon
  coal:         'https://minecraft.wiki/images/Coal_JE4_BE3.png',
  coal_block:   'https://minecraft.wiki/images/Block_of_Coal_JE2_BE2.png',
  coal_ore:     'https://minecraft.wiki/images/Coal_Ore_JE4_BE3.png',
  // Diamant
  diamond:           'https://minecraft.wiki/images/Diamond_JE3_BE3.png',
  diamond_block:     'https://minecraft.wiki/images/Block_of_Diamond_JE5_BE3.png',
  diamond_ore:       'https://minecraft.wiki/images/Diamond_Ore_JE4_BE3.png',
  deepslate_diamond_ore: 'https://minecraft.wiki/images/Deepslate_Diamond_Ore_JE2_BE1.png',
  // Émeraude
  emerald:           'https://minecraft.wiki/images/Emerald_JE3_BE3.png',
  emerald_block:     'https://minecraft.wiki/images/Block_of_Emerald_JE4_BE3.png',
  emerald_ore:       'https://minecraft.wiki/images/Emerald_Ore_JE4_BE3.png',
  // Redstone
  redstone:          'https://minecraft.wiki/images/Redstone_Dust_JE2_BE2.png',
  redstone_block:    'https://minecraft.wiki/images/Block_of_Redstone_JE2_BE2.png',
  redstone_ore:      'https://minecraft.wiki/images/Redstone_Ore_JE3_BE3.png',
  // Lapis
  lapis_lazuli:      'https://minecraft.wiki/images/Lapis_Lazuli_JE1_BE1.png',
  lapis_block:       'https://minecraft.wiki/images/Lapis_Lazuli_Block_JE3_BE3.png',
  lapis_ore:         'https://minecraft.wiki/images/Lapis_Lazuli_Ore_JE4_BE3.png',
  // Quartz
  quartz:            'https://minecraft.wiki/images/Nether_Quartz_JE2_BE2.png',
  quartz_block:      'https://minecraft.wiki/images/Block_of_Quartz_JE5_BE3.png',
  nether_quartz_ore: 'https://minecraft.wiki/images/Nether_Quartz_Ore_JE3_BE2.png',
  // Netherite
  netherite_ingot:   'https://minecraft.wiki/images/Netherite_Ingot_JE2_BE1.png',
  netherite_block:   'https://minecraft.wiki/images/Block_of_Netherite_JE1_BE1.png',
  ancient_debris:    'https://minecraft.wiki/images/Ancient_Debris_JE2_BE1.png',
  netherite_scrap:   'https://minecraft.wiki/images/Netherite_Scrap_JE2_BE1.png',
  // Amethyst
  amethyst_shard:    'https://minecraft.wiki/images/Amethyst_Shard_JE3_BE3.png',
  amethyst_block:    'https://minecraft.wiki/images/Block_of_Amethyst_JE2_BE2.png',
  // ── Agriculture ──────────────────────────────────────────────────────────
  wheat:             'https://minecraft.wiki/images/Wheat_JE2_BE1.png',
  bread:             'https://minecraft.wiki/images/Bread_JE2_BE2.png',
  carrot:            'https://minecraft.wiki/images/Carrot_JE2_BE2.png',
  potato:            'https://minecraft.wiki/images/Potato_JE2_BE2.png',
  apple:             'https://minecraft.wiki/images/Apple_JE3_BE3.png',
  golden_apple:      'https://minecraft.wiki/images/Golden_Apple_JE2_BE2.png',
  enchanted_golden_apple: 'https://minecraft.wiki/images/Enchanted_Golden_Apple_JE3_BE3.png',
  // ── Loots de mobs ────────────────────────────────────────────────────────
  bone:              'https://minecraft.wiki/images/Bone_JE3_BE3.png',
  bone_meal:         'https://minecraft.wiki/images/Bone_Meal_JE3_BE3.png',
  string:            'https://minecraft.wiki/images/String_JE3_BE2.png',
  spider_eye:        'https://minecraft.wiki/images/Spider_Eye_JE3_BE3.png',
  gunpowder:         'https://minecraft.wiki/images/Gunpowder_JE3_BE3.png',
  rotten_flesh:      'https://minecraft.wiki/images/Rotten_Flesh_JE3_BE3.png',
  ender_pearl:       'https://minecraft.wiki/images/Ender_Pearl_JE3_BE3.png',
  blaze_rod:         'https://minecraft.wiki/images/Blaze_Rod_JE3_BE3.png',
  blaze_powder:      'https://minecraft.wiki/images/Blaze_Powder_JE3_BE3.png',
  ghast_tear:        'https://minecraft.wiki/images/Ghast_Tear_JE3_BE3.png',
  magma_cream:       'https://minecraft.wiki/images/Magma_Cream_JE3_BE3.png',
  slime_ball:        'https://minecraft.wiki/images/Slimeball_JE3_BE3.png',
  leather:           'https://minecraft.wiki/images/Leather_JE3_BE3.png',
  feather:           'https://minecraft.wiki/images/Feather_JE3_BE3.png',
  ink_sac:           'https://minecraft.wiki/images/Ink_Sac_JE3_BE2.png',
  glow_ink_sac:      'https://minecraft.wiki/images/Glow_Ink_Sac_JE2_BE1.png',
  nether_star:       'https://minecraft.wiki/images/Nether_Star_JE3_BE3.png',
  totem_of_undying:  'https://minecraft.wiki/images/Totem_of_Undying_JE2_BE2.png',
  shulker_shell:     'https://minecraft.wiki/images/Shulker_Shell_JE2_BE1.png',
  elytra:            'https://minecraft.wiki/images/Elytra_JE3_BE3.png',
  rabbit_hide:       'https://minecraft.wiki/images/Rabbit_Hide_JE2_BE2.png',
  rabbit_foot:       'https://minecraft.wiki/images/Rabbit\'s_Foot_JE2_BE2.png',
  // ── Nether ───────────────────────────────────────────────────────────────
  glowstone:         'https://minecraft.wiki/images/Glowstone_JE4_BE2.png',
  glowstone_dust:    'https://minecraft.wiki/images/Glowstone_Dust_JE3_BE3.png',
  soul_sand:         'https://minecraft.wiki/images/Soul_Sand_JE5_BE4.png',
  nether_wart:       'https://minecraft.wiki/images/Nether_Wart_JE2_BE2.png',
  nether_brick:      'https://minecraft.wiki/images/Nether_Brick_(item)_JE2_BE2.png',
  blackstone:        'https://minecraft.wiki/images/Blackstone_JE1_BE1.png',
  basalt:            'https://minecraft.wiki/images/Basalt_JE3_BE1.png',
};

/**
 * Correspondances noms français Excalia → clé d'icône standard
 * Permet de trouver l'icône d'un item oraxen: dont le nom est en français.
 */
const FR_TO_ICON_KEY = {
  // Minerais (noms français Oraxen → clé icône)
  fer:        'iron_ingot',
  or:         'gold_ingot',
  cuivre:     'copper_ingot',
  charbon:    'coal',
  diamant:    'diamond',
  emeraude:   'emerald',
  redstone:   'redstone',
  lapis:      'lapis_lazuli',
  quartz:     'quartz',
  netherite:  'netherite_ingot',
  // Loots de mobs (noms français Oraxen → clé icône)
  patte_lapin:      'rabbit_foot',
  patte:            'rabbit_foot',
  lapin:            'rabbit_foot',
  os:               'bone',
  chair_putrefiee:  'rotten_flesh',
  chair_pourrie:    'rotten_flesh',
  chair:            'rotten_flesh',
  fil:              'string',
  ficelle:          'string',
  poudre_a_canon:   'gunpowder',
  poudre_canon:     'gunpowder',
  perle_ender:      'ender_pearl',
  ender_pearl:      'ender_pearl',
  baton_blaze:      'blaze_rod',
  blaze:            'blaze_rod',
  poudre_blaze:     'blaze_powder',
  larme_ghast:      'ghast_tear',
  ghast:            'ghast_tear',
  creme_magma:      'magma_cream',
  magma:            'magma_cream',
  boule_slime:      'slime_ball',
  slime:            'slime_ball',
  cuir:             'leather',
  plume:            'feather',
  encre:            'ink_sac',
  encre_brillante:  'glow_ink_sac',
  etoile_nether:    'nether_star',
  totem:            'totem_of_undying',
  coquille_shulker: 'shulker_shell',
  shulker:          'shulker_shell',
  elytre:           'elytra',
};

/**
 * Icônes génériques par catégorie détectée
 */
const CATEGORY_FALLBACK_ICONS = {
  'Compressés':          'https://minecraft.wiki/images/Bundle_JE2_BE2.png',
  'Loots de mobs':       'https://minecraft.wiki/images/Bone_JE3_BE3.png',
  'Minerais':            'https://minecraft.wiki/images/Iron_Ore_JE4_BE3.png',
  'Lingots & Nuggets':   'https://minecraft.wiki/images/Iron_Ingot_JE3_BE2.png',
  'Blocs':               'https://minecraft.wiki/images/Block_of_Iron_JE4_BE3.png',
  'Agriculture & Nourriture': 'https://minecraft.wiki/images/Wheat_JE2_BE1.png',
  'Nether':              'https://minecraft.wiki/images/Netherite_Ingot_JE2_BE1.png',
  'End':                 'https://minecraft.wiki/images/Ender_Pearl_JE3_BE3.png',
  'Gemmes':              'https://minecraft.wiki/images/Diamond_JE3_BE3.png',
  'Bois':                'https://minecraft.wiki/images/Oak_Log_JE4_BE2.png',
  'Outils & Armes':      'https://minecraft.wiki/images/Diamond_Sword_JE3_BE3.png',
  'Boss & Rares':        'https://minecraft.wiki/images/Nether_Star_JE3_BE3.png',
};

/**
 * getItemIcon(type, category?) — Fonction intelligente
 *
 * Gère :
 * - Noms exacts (iron_ingot, diamond...)
 * - Noms oraxen: (oraxen:fer_t1 → cherche 'fer' → iron_ingot)
 * - Noms avec tier (_t1/_t2/_t3/_t4 retiré pour trouver la base)
 * - Noms français (fer, diamant, patte_lapin...)
 * - Fallback par catégorie
 * - Fallback générique si rien trouvé
 *
 * Exemples :
 *   getItemIcon('oraxen:patte_lapin_t3') → rabbit_foot icon
 *   getItemIcon('oraxen:fer_t1')         → iron_ingot icon
 *   getItemIcon('oraxen:diamant_t2')     → diamond icon
 *   getItemIcon('diamond')               → diamond icon (direct)
 */
export function getItemIcon(type, category = null) {
  if (!type) return null;

  // 1. Correspondance directe
  if (ITEM_ICONS[type]) return ITEM_ICONS[type];

  // 2. Nettoyer le préfixe oraxen: et minecraft:
  let clean = String(type)
    .toLowerCase()
    .replace(/^oraxen:/, '')
    .replace(/^minecraft:/, '')
    .trim();

  // 3. Correspondance directe après nettoyage
  if (ITEM_ICONS[clean]) return ITEM_ICONS[clean];

  // 4. Retirer le suffixe de tier (_t1, _t2, _t3, _t4)
  const withoutTier = clean.replace(/_t[1-4]$/, '');

  // 5. Correspondance directe sans tier
  if (ITEM_ICONS[withoutTier]) return ITEM_ICONS[withoutTier];

  // 6. Chercher dans les alias français (nom de base sans tier)
  if (FR_TO_ICON_KEY[withoutTier]) {
    const iconKey = FR_TO_ICON_KEY[withoutTier];
    if (ITEM_ICONS[iconKey]) return ITEM_ICONS[iconKey];
  }

  // 7. Chercher dans les alias français (nom complet avec tier retiré, partiel)
  // ex: "patte_lapin" → cherche "patte_lapin" puis "patte" puis "lapin"
  const parts = withoutTier.split('_');
  for (let len = parts.length; len >= 1; len--) {
    const partial = parts.slice(0, len).join('_');
    if (FR_TO_ICON_KEY[partial]) {
      const iconKey = FR_TO_ICON_KEY[partial];
      if (ITEM_ICONS[iconKey]) return ITEM_ICONS[iconKey];
    }
  }

  // 8. Fallback par catégorie
  if (category && CATEGORY_FALLBACK_ICONS[category]) {
    return CATEGORY_FALLBACK_ICONS[category];
  }

  // 9. Détecter la catégorie depuis le nom et appliquer le fallback
  if (/_t[1-4]$/.test(clean)) return CATEGORY_FALLBACK_ICONS['Compressés'];

  // 10. Aucune icône trouvée
  return null;
}

/**
 * getItemIconOrFallback — Comme getItemIcon mais retourne toujours une URL
 */
export function getItemIconOrFallback(type, category = null) {
  return getItemIcon(type, category) ?? 'https://minecraft.wiki/images/Dirt_JE2_BE2.png';
}
