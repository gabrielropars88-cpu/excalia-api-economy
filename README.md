# 💎 Excalia Economy Analyzer

Analyseur de rentabilité économique pour le serveur Minecraft **Excalia**.

## 🚀 Installation & Lancement

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer en mode développement
npm run dev

# 3. Build pour production
npm run build
```

Ouvrir [http://localhost:5173](http://localhost:5173)

---

## 📐 Structure du projet

```
src/
├─ components/         # Composants réutilisables
├─ pages/
│   ├─ Dashboard.jsx   # Vue d'ensemble + graphiques
│   ├─ MineralsList.jsx # Tous les minerais avec filtres
│   ├─ Comparator.jsx  # Comparaison détaillée par famille
│   ├─ Simulator.jsx   # Simulateur de vente par quantité
│   └─ TopProfits.jsx  # Classements + historique des prix
├─ services/
│   └─ excaliaApi.js   # Récupération API + cache + historique
├─ utils/
│   └─ profitability.js # Moteur de calcul de rentabilité
└─ data/
    └─ recipes.json     # ⭐ Recettes configurables
```

---

## ⚙️ Configuration des recettes (`src/data/recipes.json`)

Le fichier `recipes.json` définit toutes les familles de minerais et leurs tiers.

### Structure d'une famille

```json
{
  "families": {
    "iron": {
      "label": "Fer",
      "emoji": "⚙️",
      "color": "#d1d5db",
      "baseItem": "iron_ingot",       // ID de l'item de base dans l'API
      "blockItem": "iron_block",      // ID du bloc dans l'API
      "oreItem": "iron_ore",          // ID du minerai dans l'API
      "blockRatio": 9,                // Nombre d'unités par bloc
      "tiers": {
        "t1": {
          "ingredient": "iron_ingot", // Ingrédient utilisé
          "quantity": 9,              // Nombre d'ingrédients par craft
          "stacks": 9                 // Stacks pour T1 (premier tier uniquement)
        },
        "t2": { "ingredient": "iron_t1", "quantity": 9 },
        "t3": { "ingredient": "iron_t2", "quantity": 9 },
        "t4": { "ingredient": "iron_t3", "quantity": 9 }
      }
    }
  }
}
```

### Ajouter un nouveau minerai

1. Identifier son ID dans l'API : `https://excalia.fr/api/economie`
2. Ajouter une entrée dans `families` avec les bons IDs
3. Définir les tiers disponibles
4. Sauvegarder — la page se met à jour automatiquement

---

## 🧮 Formules de calcul

### Nombre d'unités par tier

```
T1 = stacks × stackSize = 9 × 64 = 576 unités de base
T2 = 9 × T1 = 5 184 unités de base
T3 = 9 × T2 = 46 656 unités de base
T4 = 9 × T3 = 419 904 unités de base
```

### Revenu par unité de base

```
Revenu/u = Prix de vente / Unités de base requises
```

### Efficacité

```
Efficacité = Revenu/u (format) / Revenu/u (brut)
```

---

## 🔄 API & Cache

- L'API est appelée automatiquement au chargement
- Cache local de **5 minutes** (localStorage)
- Mise à jour automatique toutes les **5 minutes**
- Bouton "Actualiser" pour forcer le rechargement
- **Fallback sur données démo** si l'API est inaccessible

---

## 📤 Exports

- **Export Excel** disponible sur la page Minerais et Top Profits
- Format `.xlsx` compatible Excel, LibreOffice, Google Sheets

---

## 🛠️ Techno utilisées

| Techno | Usage |
|--------|-------|
| React 18 | UI |
| Vite | Build tool |
| Tailwind CSS | Styles |
| Axios | Requêtes API |
| Recharts | Graphiques |
| xlsx | Export Excel |
| React Router | Navigation |

---

## 🔧 Personnalisation

### Changer la couleur d'un minerai

Dans `recipes.json`, modifier `"color": "#d1d5db"` avec n'importe quelle couleur hex.

### Modifier le ratio bloc

Par défaut `9` unités = 1 bloc. Modifiable via `"blockRatio"` par famille.

### Ajouter un tier

Ajouter une entrée dans `"tiers"` de la famille concernée.
