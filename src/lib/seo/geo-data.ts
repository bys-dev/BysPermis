/**
 * Référentiel géographique statique utilisé par les pages SEO locales
 * (`/stages`, `/stages/[ville]`, `/stages/departement/[dept]`).
 *
 * Pourquoi un référentiel statique plutôt que la base ?
 * Les pages villes doivent exister **avant** qu'un centre ne soit référencé
 * dans la commune : c'est ce qui permet d'être indexé sur « stage récupération
 * de points <ville> » puis de convertir vers les centres les plus proches.
 * Une page adossée à la base ne se déclenche qu'après coup — trop tard.
 *
 * Les coordonnées servent au calcul de proximité (haversine) et au JSON-LD
 * `GeoCoordinates`. Les populations ne sont jamais affichées : elles ne
 * servent qu'à ordonner les listes et à calibrer le rayon de recherche.
 */

export interface Departement {
  /** Code INSEE ("75", "2A", "974"). */
  code: string;
  nom: string;
  /** Slug d'URL : `95-val-d-oise`. */
  slug: string;
  region: string;
  prefecture: string;
  lat: number;
  lng: number;
}

export interface Ville {
  slug: string;
  nom: string;
  /** Code département INSEE. */
  dept: string;
  /** Code postal principal. */
  cp: string;
  lat: number;
  lng: number;
  /** Uniquement pour l'ordonnancement — jamais affiché. */
  pop: number;
}

// ─── Départements ──────────────────────────────────────────────────

export const DEPARTEMENTS: Departement[] = [
  { code: "01", nom: "Ain", slug: "01-ain", region: "Auvergne-Rhône-Alpes", prefecture: "Bourg-en-Bresse", lat: 46.2051, lng: 5.2258 },
  { code: "02", nom: "Aisne", slug: "02-aisne", region: "Hauts-de-France", prefecture: "Laon", lat: 49.5641, lng: 3.6241 },
  { code: "03", nom: "Allier", slug: "03-allier", region: "Auvergne-Rhône-Alpes", prefecture: "Moulins", lat: 46.5647, lng: 3.3327 },
  { code: "04", nom: "Alpes-de-Haute-Provence", slug: "04-alpes-de-haute-provence", region: "Provence-Alpes-Côte d'Azur", prefecture: "Digne-les-Bains", lat: 44.0921, lng: 6.2358 },
  { code: "05", nom: "Hautes-Alpes", slug: "05-hautes-alpes", region: "Provence-Alpes-Côte d'Azur", prefecture: "Gap", lat: 44.5594, lng: 6.0794 },
  { code: "06", nom: "Alpes-Maritimes", slug: "06-alpes-maritimes", region: "Provence-Alpes-Côte d'Azur", prefecture: "Nice", lat: 43.7102, lng: 7.262 },
  { code: "07", nom: "Ardèche", slug: "07-ardeche", region: "Auvergne-Rhône-Alpes", prefecture: "Privas", lat: 44.7351, lng: 4.5998 },
  { code: "08", nom: "Ardennes", slug: "08-ardennes", region: "Grand Est", prefecture: "Charleville-Mézières", lat: 49.7724, lng: 4.7196 },
  { code: "09", nom: "Ariège", slug: "09-ariege", region: "Occitanie", prefecture: "Foix", lat: 42.9654, lng: 1.6053 },
  { code: "10", nom: "Aube", slug: "10-aube", region: "Grand Est", prefecture: "Troyes", lat: 48.2973, lng: 4.0744 },
  { code: "11", nom: "Aude", slug: "11-aude", region: "Occitanie", prefecture: "Carcassonne", lat: 43.213, lng: 2.3491 },
  { code: "12", nom: "Aveyron", slug: "12-aveyron", region: "Occitanie", prefecture: "Rodez", lat: 44.3495, lng: 2.574 },
  { code: "13", nom: "Bouches-du-Rhône", slug: "13-bouches-du-rhone", region: "Provence-Alpes-Côte d'Azur", prefecture: "Marseille", lat: 43.2965, lng: 5.3698 },
  { code: "14", nom: "Calvados", slug: "14-calvados", region: "Normandie", prefecture: "Caen", lat: 49.1829, lng: -0.3707 },
  { code: "15", nom: "Cantal", slug: "15-cantal", region: "Auvergne-Rhône-Alpes", prefecture: "Aurillac", lat: 44.9257, lng: 2.4409 },
  { code: "16", nom: "Charente", slug: "16-charente", region: "Nouvelle-Aquitaine", prefecture: "Angoulême", lat: 45.6484, lng: 0.1562 },
  { code: "17", nom: "Charente-Maritime", slug: "17-charente-maritime", region: "Nouvelle-Aquitaine", prefecture: "La Rochelle", lat: 46.1591, lng: -1.152 },
  { code: "18", nom: "Cher", slug: "18-cher", region: "Centre-Val de Loire", prefecture: "Bourges", lat: 47.081, lng: 2.3988 },
  { code: "19", nom: "Corrèze", slug: "19-correze", region: "Nouvelle-Aquitaine", prefecture: "Tulle", lat: 45.2673, lng: 1.7683 },
  { code: "2A", nom: "Corse-du-Sud", slug: "2a-corse-du-sud", region: "Corse", prefecture: "Ajaccio", lat: 41.9192, lng: 8.7386 },
  { code: "2B", nom: "Haute-Corse", slug: "2b-haute-corse", region: "Corse", prefecture: "Bastia", lat: 42.7028, lng: 9.4508 },
  { code: "21", nom: "Côte-d'Or", slug: "21-cote-d-or", region: "Bourgogne-Franche-Comté", prefecture: "Dijon", lat: 47.322, lng: 5.0415 },
  { code: "22", nom: "Côtes-d'Armor", slug: "22-cotes-d-armor", region: "Bretagne", prefecture: "Saint-Brieuc", lat: 48.5144, lng: -2.7657 },
  { code: "23", nom: "Creuse", slug: "23-creuse", region: "Nouvelle-Aquitaine", prefecture: "Guéret", lat: 46.1699, lng: 1.871 },
  { code: "24", nom: "Dordogne", slug: "24-dordogne", region: "Nouvelle-Aquitaine", prefecture: "Périgueux", lat: 45.1841, lng: 0.7212 },
  { code: "25", nom: "Doubs", slug: "25-doubs", region: "Bourgogne-Franche-Comté", prefecture: "Besançon", lat: 47.2378, lng: 6.0241 },
  { code: "26", nom: "Drôme", slug: "26-drome", region: "Auvergne-Rhône-Alpes", prefecture: "Valence", lat: 44.9334, lng: 4.8924 },
  { code: "27", nom: "Eure", slug: "27-eure", region: "Normandie", prefecture: "Évreux", lat: 49.027, lng: 1.1508 },
  { code: "28", nom: "Eure-et-Loir", slug: "28-eure-et-loir", region: "Centre-Val de Loire", prefecture: "Chartres", lat: 48.4469, lng: 1.489 },
  { code: "29", nom: "Finistère", slug: "29-finistere", region: "Bretagne", prefecture: "Quimper", lat: 47.996, lng: -4.1024 },
  { code: "30", nom: "Gard", slug: "30-gard", region: "Occitanie", prefecture: "Nîmes", lat: 43.8367, lng: 4.3601 },
  { code: "31", nom: "Haute-Garonne", slug: "31-haute-garonne", region: "Occitanie", prefecture: "Toulouse", lat: 43.6047, lng: 1.4442 },
  { code: "32", nom: "Gers", slug: "32-gers", region: "Occitanie", prefecture: "Auch", lat: 43.6465, lng: 0.586 },
  { code: "33", nom: "Gironde", slug: "33-gironde", region: "Nouvelle-Aquitaine", prefecture: "Bordeaux", lat: 44.8378, lng: -0.5792 },
  { code: "34", nom: "Hérault", slug: "34-herault", region: "Occitanie", prefecture: "Montpellier", lat: 43.6108, lng: 3.8767 },
  { code: "35", nom: "Ille-et-Vilaine", slug: "35-ille-et-vilaine", region: "Bretagne", prefecture: "Rennes", lat: 48.1173, lng: -1.6778 },
  { code: "36", nom: "Indre", slug: "36-indre", region: "Centre-Val de Loire", prefecture: "Châteauroux", lat: 46.811, lng: 1.691 },
  { code: "37", nom: "Indre-et-Loire", slug: "37-indre-et-loire", region: "Centre-Val de Loire", prefecture: "Tours", lat: 47.3941, lng: 0.6848 },
  { code: "38", nom: "Isère", slug: "38-isere", region: "Auvergne-Rhône-Alpes", prefecture: "Grenoble", lat: 45.1885, lng: 5.7245 },
  { code: "39", nom: "Jura", slug: "39-jura", region: "Bourgogne-Franche-Comté", prefecture: "Lons-le-Saunier", lat: 46.6757, lng: 5.5548 },
  { code: "40", nom: "Landes", slug: "40-landes", region: "Nouvelle-Aquitaine", prefecture: "Mont-de-Marsan", lat: 43.8907, lng: -0.4996 },
  { code: "41", nom: "Loir-et-Cher", slug: "41-loir-et-cher", region: "Centre-Val de Loire", prefecture: "Blois", lat: 47.5861, lng: 1.3359 },
  { code: "42", nom: "Loire", slug: "42-loire", region: "Auvergne-Rhône-Alpes", prefecture: "Saint-Étienne", lat: 45.4397, lng: 4.3872 },
  { code: "43", nom: "Haute-Loire", slug: "43-haute-loire", region: "Auvergne-Rhône-Alpes", prefecture: "Le Puy-en-Velay", lat: 45.043, lng: 3.885 },
  { code: "44", nom: "Loire-Atlantique", slug: "44-loire-atlantique", region: "Pays de la Loire", prefecture: "Nantes", lat: 47.2184, lng: -1.5536 },
  { code: "45", nom: "Loiret", slug: "45-loiret", region: "Centre-Val de Loire", prefecture: "Orléans", lat: 47.9029, lng: 1.9093 },
  { code: "46", nom: "Lot", slug: "46-lot", region: "Occitanie", prefecture: "Cahors", lat: 44.4475, lng: 1.4409 },
  { code: "47", nom: "Lot-et-Garonne", slug: "47-lot-et-garonne", region: "Nouvelle-Aquitaine", prefecture: "Agen", lat: 44.2049, lng: 0.6212 },
  { code: "48", nom: "Lozère", slug: "48-lozere", region: "Occitanie", prefecture: "Mende", lat: 44.518, lng: 3.5008 },
  { code: "49", nom: "Maine-et-Loire", slug: "49-maine-et-loire", region: "Pays de la Loire", prefecture: "Angers", lat: 47.4784, lng: -0.5632 },
  { code: "50", nom: "Manche", slug: "50-manche", region: "Normandie", prefecture: "Saint-Lô", lat: 49.1157, lng: -1.0899 },
  { code: "51", nom: "Marne", slug: "51-marne", region: "Grand Est", prefecture: "Châlons-en-Champagne", lat: 48.9566, lng: 4.3634 },
  { code: "52", nom: "Haute-Marne", slug: "52-haute-marne", region: "Grand Est", prefecture: "Chaumont", lat: 48.1116, lng: 5.1392 },
  { code: "53", nom: "Mayenne", slug: "53-mayenne", region: "Pays de la Loire", prefecture: "Laval", lat: 48.0698, lng: -0.7667 },
  { code: "54", nom: "Meurthe-et-Moselle", slug: "54-meurthe-et-moselle", region: "Grand Est", prefecture: "Nancy", lat: 48.6921, lng: 6.1844 },
  { code: "55", nom: "Meuse", slug: "55-meuse", region: "Grand Est", prefecture: "Bar-le-Duc", lat: 48.771, lng: 5.1614 },
  { code: "56", nom: "Morbihan", slug: "56-morbihan", region: "Bretagne", prefecture: "Vannes", lat: 47.6587, lng: -2.7603 },
  { code: "57", nom: "Moselle", slug: "57-moselle", region: "Grand Est", prefecture: "Metz", lat: 49.1193, lng: 6.1757 },
  { code: "58", nom: "Nièvre", slug: "58-nievre", region: "Bourgogne-Franche-Comté", prefecture: "Nevers", lat: 46.9896, lng: 3.159 },
  { code: "59", nom: "Nord", slug: "59-nord", region: "Hauts-de-France", prefecture: "Lille", lat: 50.6292, lng: 3.0573 },
  { code: "60", nom: "Oise", slug: "60-oise", region: "Hauts-de-France", prefecture: "Beauvais", lat: 49.4295, lng: 2.0809 },
  { code: "61", nom: "Orne", slug: "61-orne", region: "Normandie", prefecture: "Alençon", lat: 48.4306, lng: 0.0931 },
  { code: "62", nom: "Pas-de-Calais", slug: "62-pas-de-calais", region: "Hauts-de-France", prefecture: "Arras", lat: 50.291, lng: 2.7778 },
  { code: "63", nom: "Puy-de-Dôme", slug: "63-puy-de-dome", region: "Auvergne-Rhône-Alpes", prefecture: "Clermont-Ferrand", lat: 45.7772, lng: 3.087 },
  { code: "64", nom: "Pyrénées-Atlantiques", slug: "64-pyrenees-atlantiques", region: "Nouvelle-Aquitaine", prefecture: "Pau", lat: 43.2951, lng: -0.3708 },
  { code: "65", nom: "Hautes-Pyrénées", slug: "65-hautes-pyrenees", region: "Occitanie", prefecture: "Tarbes", lat: 43.2328, lng: 0.0783 },
  { code: "66", nom: "Pyrénées-Orientales", slug: "66-pyrenees-orientales", region: "Occitanie", prefecture: "Perpignan", lat: 42.6887, lng: 2.8948 },
  { code: "67", nom: "Bas-Rhin", slug: "67-bas-rhin", region: "Grand Est", prefecture: "Strasbourg", lat: 48.5734, lng: 7.7521 },
  { code: "68", nom: "Haut-Rhin", slug: "68-haut-rhin", region: "Grand Est", prefecture: "Colmar", lat: 48.0794, lng: 7.3585 },
  { code: "69", nom: "Rhône", slug: "69-rhone", region: "Auvergne-Rhône-Alpes", prefecture: "Lyon", lat: 45.764, lng: 4.8357 },
  { code: "70", nom: "Haute-Saône", slug: "70-haute-saone", region: "Bourgogne-Franche-Comté", prefecture: "Vesoul", lat: 47.6199, lng: 6.154 },
  { code: "71", nom: "Saône-et-Loire", slug: "71-saone-et-loire", region: "Bourgogne-Franche-Comté", prefecture: "Mâcon", lat: 46.306, lng: 4.83 },
  { code: "72", nom: "Sarthe", slug: "72-sarthe", region: "Pays de la Loire", prefecture: "Le Mans", lat: 48.0061, lng: 0.1996 },
  { code: "73", nom: "Savoie", slug: "73-savoie", region: "Auvergne-Rhône-Alpes", prefecture: "Chambéry", lat: 45.5646, lng: 5.9178 },
  { code: "74", nom: "Haute-Savoie", slug: "74-haute-savoie", region: "Auvergne-Rhône-Alpes", prefecture: "Annecy", lat: 45.8992, lng: 6.1294 },
  { code: "75", nom: "Paris", slug: "75-paris", region: "Île-de-France", prefecture: "Paris", lat: 48.8566, lng: 2.3522 },
  { code: "76", nom: "Seine-Maritime", slug: "76-seine-maritime", region: "Normandie", prefecture: "Rouen", lat: 49.4432, lng: 1.0999 },
  { code: "77", nom: "Seine-et-Marne", slug: "77-seine-et-marne", region: "Île-de-France", prefecture: "Melun", lat: 48.5392, lng: 2.6601 },
  { code: "78", nom: "Yvelines", slug: "78-yvelines", region: "Île-de-France", prefecture: "Versailles", lat: 48.8014, lng: 2.1301 },
  { code: "79", nom: "Deux-Sèvres", slug: "79-deux-sevres", region: "Nouvelle-Aquitaine", prefecture: "Niort", lat: 46.3239, lng: -0.4645 },
  { code: "80", nom: "Somme", slug: "80-somme", region: "Hauts-de-France", prefecture: "Amiens", lat: 49.8941, lng: 2.2958 },
  { code: "81", nom: "Tarn", slug: "81-tarn", region: "Occitanie", prefecture: "Albi", lat: 43.9298, lng: 2.148 },
  { code: "82", nom: "Tarn-et-Garonne", slug: "82-tarn-et-garonne", region: "Occitanie", prefecture: "Montauban", lat: 44.0221, lng: 1.3529 },
  { code: "83", nom: "Var", slug: "83-var", region: "Provence-Alpes-Côte d'Azur", prefecture: "Toulon", lat: 43.1242, lng: 5.928 },
  { code: "84", nom: "Vaucluse", slug: "84-vaucluse", region: "Provence-Alpes-Côte d'Azur", prefecture: "Avignon", lat: 43.9493, lng: 4.8055 },
  { code: "85", nom: "Vendée", slug: "85-vendee", region: "Pays de la Loire", prefecture: "La Roche-sur-Yon", lat: 46.6705, lng: -1.4269 },
  { code: "86", nom: "Vienne", slug: "86-vienne", region: "Nouvelle-Aquitaine", prefecture: "Poitiers", lat: 46.5802, lng: 0.3404 },
  { code: "87", nom: "Haute-Vienne", slug: "87-haute-vienne", region: "Nouvelle-Aquitaine", prefecture: "Limoges", lat: 45.8336, lng: 1.2611 },
  { code: "88", nom: "Vosges", slug: "88-vosges", region: "Grand Est", prefecture: "Épinal", lat: 48.1744, lng: 6.4494 },
  { code: "89", nom: "Yonne", slug: "89-yonne", region: "Bourgogne-Franche-Comté", prefecture: "Auxerre", lat: 47.7986, lng: 3.5673 },
  { code: "90", nom: "Territoire de Belfort", slug: "90-territoire-de-belfort", region: "Bourgogne-Franche-Comté", prefecture: "Belfort", lat: 47.6379, lng: 6.8628 },
  { code: "91", nom: "Essonne", slug: "91-essonne", region: "Île-de-France", prefecture: "Évry-Courcouronnes", lat: 48.6238, lng: 2.4297 },
  { code: "92", nom: "Hauts-de-Seine", slug: "92-hauts-de-seine", region: "Île-de-France", prefecture: "Nanterre", lat: 48.8924, lng: 2.2069 },
  { code: "93", nom: "Seine-Saint-Denis", slug: "93-seine-saint-denis", region: "Île-de-France", prefecture: "Bobigny", lat: 48.9106, lng: 2.4396 },
  { code: "94", nom: "Val-de-Marne", slug: "94-val-de-marne", region: "Île-de-France", prefecture: "Créteil", lat: 48.7904, lng: 2.4556 },
  { code: "95", nom: "Val-d'Oise", slug: "95-val-d-oise", region: "Île-de-France", prefecture: "Cergy", lat: 49.0353, lng: 2.06 },
  { code: "971", nom: "Guadeloupe", slug: "971-guadeloupe", region: "Guadeloupe", prefecture: "Basse-Terre", lat: 16.0, lng: -61.7333 },
  { code: "972", nom: "Martinique", slug: "972-martinique", region: "Martinique", prefecture: "Fort-de-France", lat: 14.6161, lng: -61.0588 },
  { code: "973", nom: "Guyane", slug: "973-guyane", region: "Guyane", prefecture: "Cayenne", lat: 4.9372, lng: -52.326 },
  { code: "974", nom: "La Réunion", slug: "974-la-reunion", region: "La Réunion", prefecture: "Saint-Denis", lat: -20.8789, lng: 55.4481 },
  { code: "976", nom: "Mayotte", slug: "976-mayotte", region: "Mayotte", prefecture: "Mamoudzou", lat: -12.7806, lng: 45.2278 },
];

// ─── Villes ────────────────────────────────────────────────────────

export const VILLES: Ville[] = [
  { slug: "paris", nom: "Paris", dept: "75", cp: "75000", lat: 48.8566, lng: 2.3522, pop: 2133111 },
  { slug: "marseille", nom: "Marseille", dept: "13", cp: "13000", lat: 43.2965, lng: 5.3698, pop: 873076 },
  { slug: "lyon", nom: "Lyon", dept: "69", cp: "69000", lat: 45.764, lng: 4.8357, pop: 522250 },
  { slug: "toulouse", nom: "Toulouse", dept: "31", cp: "31000", lat: 43.6047, lng: 1.4442, pop: 498003 },
  { slug: "nice", nom: "Nice", dept: "06", cp: "06000", lat: 43.7102, lng: 7.262, pop: 342669 },
  { slug: "nantes", nom: "Nantes", dept: "44", cp: "44000", lat: 47.2184, lng: -1.5536, pop: 320732 },
  { slug: "montpellier", nom: "Montpellier", dept: "34", cp: "34000", lat: 43.6108, lng: 3.8767, pop: 299096 },
  { slug: "strasbourg", nom: "Strasbourg", dept: "67", cp: "67000", lat: 48.5734, lng: 7.7521, pop: 290576 },
  { slug: "bordeaux", nom: "Bordeaux", dept: "33", cp: "33000", lat: 44.8378, lng: -0.5792, pop: 259809 },
  { slug: "lille", nom: "Lille", dept: "59", cp: "59000", lat: 50.6292, lng: 3.0573, pop: 236234 },
  { slug: "rennes", nom: "Rennes", dept: "35", cp: "35000", lat: 48.1173, lng: -1.6778, pop: 222485 },
  { slug: "reims", nom: "Reims", dept: "51", cp: "51100", lat: 49.2583, lng: 4.0317, pop: 182211 },
  { slug: "toulon", nom: "Toulon", dept: "83", cp: "83000", lat: 43.1242, lng: 5.928, pop: 176198 },
  { slug: "saint-etienne", nom: "Saint-Étienne", dept: "42", cp: "42000", lat: 45.4397, lng: 4.3872, pop: 174739 },
  { slug: "le-havre", nom: "Le Havre", dept: "76", cp: "76600", lat: 49.4944, lng: 0.1079, pop: 170147 },
  { slug: "dijon", nom: "Dijon", dept: "21", cp: "21000", lat: 47.322, lng: 5.0415, pop: 159346 },
  { slug: "grenoble", nom: "Grenoble", dept: "38", cp: "38000", lat: 45.1885, lng: 5.7245, pop: 158454 },
  { slug: "angers", nom: "Angers", dept: "49", cp: "49000", lat: 47.4784, lng: -0.5632, pop: 155850 },
  { slug: "villeurbanne", nom: "Villeurbanne", dept: "69", cp: "69100", lat: 45.7719, lng: 4.8902, pop: 152212 },
  { slug: "nimes", nom: "Nîmes", dept: "30", cp: "30000", lat: 43.8367, lng: 4.3601, pop: 148561 },
  { slug: "clermont-ferrand", nom: "Clermont-Ferrand", dept: "63", cp: "63000", lat: 45.7772, lng: 3.087, pop: 147284 },
  { slug: "aix-en-provence", nom: "Aix-en-Provence", dept: "13", cp: "13100", lat: 43.5297, lng: 5.4474, pop: 147122 },
  { slug: "le-mans", nom: "Le Mans", dept: "72", cp: "72000", lat: 48.0061, lng: 0.1996, pop: 145047 },
  { slug: "brest", nom: "Brest", dept: "29", cp: "29200", lat: 48.3904, lng: -4.4861, pop: 139926 },
  { slug: "tours", nom: "Tours", dept: "37", cp: "37000", lat: 47.3941, lng: 0.6848, pop: 136463 },
  { slug: "amiens", nom: "Amiens", dept: "80", cp: "80000", lat: 49.8941, lng: 2.2958, pop: 134057 },
  { slug: "limoges", nom: "Limoges", dept: "87", cp: "87000", lat: 45.8336, lng: 1.2611, pop: 130876 },
  { slug: "annecy", nom: "Annecy", dept: "74", cp: "74000", lat: 45.8992, lng: 6.1294, pop: 130721 },
  { slug: "boulogne-billancourt", nom: "Boulogne-Billancourt", dept: "92", cp: "92100", lat: 48.8351, lng: 2.241, pop: 121583 },
  { slug: "perpignan", nom: "Perpignan", dept: "66", cp: "66000", lat: 42.6887, lng: 2.8948, pop: 119344 },
  { slug: "besancon", nom: "Besançon", dept: "25", cp: "25000", lat: 47.2378, lng: 6.0241, pop: 116775 },
  { slug: "metz", nom: "Metz", dept: "57", cp: "57000", lat: 49.1193, lng: 6.1757, pop: 116429 },
  { slug: "orleans", nom: "Orléans", dept: "45", cp: "45000", lat: 47.9029, lng: 1.9093, pop: 116269 },
  { slug: "saint-denis", nom: "Saint-Denis", dept: "93", cp: "93200", lat: 48.9362, lng: 2.3574, pop: 113116 },
  { slug: "rouen", nom: "Rouen", dept: "76", cp: "76000", lat: 49.4432, lng: 1.0999, pop: 112321 },
  { slug: "montreuil", nom: "Montreuil", dept: "93", cp: "93100", lat: 48.8638, lng: 2.4485, pop: 111240 },
  { slug: "argenteuil", nom: "Argenteuil", dept: "95", cp: "95100", lat: 48.9474, lng: 2.2467, pop: 111038 },
  { slug: "mulhouse", nom: "Mulhouse", dept: "68", cp: "68100", lat: 47.7508, lng: 7.3359, pop: 108312 },
  { slug: "caen", nom: "Caen", dept: "14", cp: "14000", lat: 49.1829, lng: -0.3707, pop: 105512 },
  { slug: "nancy", nom: "Nancy", dept: "54", cp: "54000", lat: 48.6921, lng: 6.1844, pop: 104885 },
  { slug: "roubaix", nom: "Roubaix", dept: "59", cp: "59100", lat: 50.6942, lng: 3.1746, pop: 98828 },
  { slug: "tourcoing", nom: "Tourcoing", dept: "59", cp: "59200", lat: 50.7236, lng: 3.1611, pop: 97656 },
  { slug: "nanterre", nom: "Nanterre", dept: "92", cp: "92000", lat: 48.8924, lng: 2.2069, pop: 96807 },
  { slug: "vitry-sur-seine", nom: "Vitry-sur-Seine", dept: "94", cp: "94400", lat: 48.7875, lng: 2.3928, pop: 95035 },
  { slug: "avignon", nom: "Avignon", dept: "84", cp: "84000", lat: 43.9493, lng: 4.8055, pop: 93671 },
  { slug: "creteil", nom: "Créteil", dept: "94", cp: "94000", lat: 48.7904, lng: 2.4556, pop: 92646 },
  { slug: "poitiers", nom: "Poitiers", dept: "86", cp: "86000", lat: 46.5802, lng: 0.3404, pop: 90033 },
  { slug: "aubervilliers", nom: "Aubervilliers", dept: "93", cp: "93300", lat: 48.9146, lng: 2.3822, pop: 88948 },
  { slug: "asnieres-sur-seine", nom: "Asnières-sur-Seine", dept: "92", cp: "92600", lat: 48.916, lng: 2.285, pop: 87748 },
  { slug: "aulnay-sous-bois", nom: "Aulnay-sous-Bois", dept: "93", cp: "93600", lat: 48.9345, lng: 2.4906, pop: 86937 },
  { slug: "dunkerque", nom: "Dunkerque", dept: "59", cp: "59140", lat: 51.0344, lng: 2.3768, pop: 86865 },
  { slug: "versailles", nom: "Versailles", dept: "78", cp: "78000", lat: 48.8014, lng: 2.1301, pop: 85205 },
  { slug: "colombes", nom: "Colombes", dept: "92", cp: "92700", lat: 48.9226, lng: 2.2543, pop: 85177 },
  { slug: "courbevoie", nom: "Courbevoie", dept: "92", cp: "92400", lat: 48.8967, lng: 2.2569, pop: 82521 },
  { slug: "beziers", nom: "Béziers", dept: "34", cp: "34500", lat: 43.3444, lng: 3.2158, pop: 78427 },
  { slug: "cherbourg-en-cotentin", nom: "Cherbourg-en-Cotentin", dept: "50", cp: "50100", lat: 49.6386, lng: -1.6164, pop: 78549 },
  { slug: "rueil-malmaison", nom: "Rueil-Malmaison", dept: "92", cp: "92500", lat: 48.8765, lng: 2.1806, pop: 78152 },
  { slug: "champigny-sur-marne", nom: "Champigny-sur-Marne", dept: "94", cp: "94500", lat: 48.8172, lng: 2.5153, pop: 77166 },
  { slug: "la-rochelle", nom: "La Rochelle", dept: "17", cp: "17000", lat: 46.1591, lng: -1.152, pop: 77205 },
  { slug: "pau", nom: "Pau", dept: "64", cp: "64000", lat: 43.2951, lng: -0.3708, pop: 77130 },
  { slug: "saint-maur-des-fosses", nom: "Saint-Maur-des-Fossés", dept: "94", cp: "94100", lat: 48.7994, lng: 2.493, pop: 74133 },
  { slug: "cannes", nom: "Cannes", dept: "06", cp: "06400", lat: 43.5528, lng: 7.0174, pop: 74152 },
  { slug: "antibes", nom: "Antibes", dept: "06", cp: "06600", lat: 43.5808, lng: 7.1251, pop: 72999 },
  { slug: "calais", nom: "Calais", dept: "62", cp: "62100", lat: 50.9513, lng: 1.8587, pop: 72929 },
  { slug: "merignac", nom: "Mérignac", dept: "33", cp: "33700", lat: 44.8386, lng: -0.6455, pop: 72207 },
  { slug: "saint-nazaire", nom: "Saint-Nazaire", dept: "44", cp: "44600", lat: 47.2734, lng: -2.2138, pop: 71887 },
  { slug: "ajaccio", nom: "Ajaccio", dept: "2A", cp: "20000", lat: 41.9192, lng: 8.7386, pop: 71361 },
  { slug: "drancy", nom: "Drancy", dept: "93", cp: "93700", lat: 48.9231, lng: 2.4453, pop: 71318 },
  { slug: "noisy-le-grand", nom: "Noisy-le-Grand", dept: "93", cp: "93160", lat: 48.8484, lng: 2.5527, pop: 69567 },
  { slug: "colmar", nom: "Colmar", dept: "68", cp: "68000", lat: 48.0794, lng: 7.3585, pop: 68784 },
  { slug: "issy-les-moulineaux", nom: "Issy-les-Moulineaux", dept: "92", cp: "92130", lat: 48.8244, lng: 2.2697, pop: 68451 },
  { slug: "evry-courcouronnes", nom: "Évry-Courcouronnes", dept: "91", cp: "91000", lat: 48.6238, lng: 2.4297, pop: 67000 },
  { slug: "venissieux", nom: "Vénissieux", dept: "69", cp: "69200", lat: 45.697, lng: 4.8862, pop: 66435 },
  { slug: "cergy", nom: "Cergy", dept: "95", cp: "95000", lat: 49.0353, lng: 2.06, pop: 66169 },
  { slug: "levallois-perret", nom: "Levallois-Perret", dept: "92", cp: "92300", lat: 48.8938, lng: 2.2874, pop: 66082 },
  { slug: "la-seyne-sur-mer", nom: "La Seyne-sur-Mer", dept: "83", cp: "83500", lat: 43.1024, lng: 5.8781, pop: 65691 },
  { slug: "bourges", nom: "Bourges", dept: "18", cp: "18000", lat: 47.081, lng: 2.3988, pop: 64551 },
  { slug: "valence", nom: "Valence", dept: "26", cp: "26000", lat: 44.9334, lng: 4.8924, pop: 64483 },
  { slug: "quimper", nom: "Quimper", dept: "29", cp: "29000", lat: 47.996, lng: -4.1024, pop: 63849 },
  { slug: "pessac", nom: "Pessac", dept: "33", cp: "33600", lat: 44.8067, lng: -0.6311, pop: 63808 },
  { slug: "antony", nom: "Antony", dept: "92", cp: "92160", lat: 48.7539, lng: 2.2976, pop: 62760 },
  { slug: "clichy", nom: "Clichy", dept: "92", cp: "92110", lat: 48.9044, lng: 2.3064, pop: 62902 },
  { slug: "ivry-sur-seine", nom: "Ivry-sur-Seine", dept: "94", cp: "94200", lat: 48.8136, lng: 2.3877, pop: 62480 },
  { slug: "villeneuve-d-ascq", nom: "Villeneuve-d'Ascq", dept: "59", cp: "59650", lat: 50.623, lng: 3.1439, pop: 62308 },
  { slug: "troyes", nom: "Troyes", dept: "10", cp: "10000", lat: 48.2973, lng: 4.0744, pop: 61996 },
  { slug: "montauban", nom: "Montauban", dept: "82", cp: "82000", lat: 44.0221, lng: 1.3529, pop: 61372 },
  { slug: "neuilly-sur-seine", nom: "Neuilly-sur-Seine", dept: "92", cp: "92200", lat: 48.8846, lng: 2.2697, pop: 60364 },
  { slug: "chambery", nom: "Chambéry", dept: "73", cp: "73000", lat: 45.5646, lng: 5.9178, pop: 59490 },
  { slug: "pantin", nom: "Pantin", dept: "93", cp: "93500", lat: 48.8946, lng: 2.409, pop: 59846 },
  { slug: "niort", nom: "Niort", dept: "79", cp: "79000", lat: 46.3239, lng: -0.4645, pop: 58707 },
  { slug: "sarcelles", nom: "Sarcelles", dept: "95", cp: "95200", lat: 48.9958, lng: 2.3784, pop: 58241 },
  { slug: "hyeres", nom: "Hyères", dept: "83", cp: "83400", lat: 43.1204, lng: 6.1286, pop: 57635 },
  { slug: "villejuif", nom: "Villejuif", dept: "94", cp: "94800", lat: 48.7939, lng: 2.3592, pop: 57365 },
  { slug: "lorient", nom: "Lorient", dept: "56", cp: "56100", lat: 47.7477, lng: -3.366, pop: 57408 },
  { slug: "le-blanc-mesnil", nom: "Le Blanc-Mesnil", dept: "93", cp: "93150", lat: 48.9384, lng: 2.4644, pop: 57396 },
  { slug: "beauvais", nom: "Beauvais", dept: "60", cp: "60000", lat: 49.4295, lng: 2.0809, pop: 56020 },
  { slug: "epinay-sur-seine", nom: "Épinay-sur-Seine", dept: "93", cp: "93800", lat: 48.9539, lng: 2.3097, pop: 55921 },
  { slug: "la-roche-sur-yon", nom: "La Roche-sur-Yon", dept: "85", cp: "85000", lat: 46.6705, lng: -1.4269, pop: 55862 },
  { slug: "melun", nom: "Melun", dept: "77", cp: "77000", lat: 48.5392, lng: 2.6601, pop: 41371 },
  { slug: "meaux", nom: "Meaux", dept: "77", cp: "77100", lat: 48.9601, lng: 2.8783, pop: 55750 },
  { slug: "narbonne", nom: "Narbonne", dept: "11", cp: "11100", lat: 43.1839, lng: 3.0036, pop: 55516 },
  { slug: "maisons-alfort", nom: "Maisons-Alfort", dept: "94", cp: "94700", lat: 48.8123, lng: 2.4372, pop: 55000 },
  { slug: "chelles", nom: "Chelles", dept: "77", cp: "77500", lat: 48.8833, lng: 2.5931, pop: 54946 },
  { slug: "cholet", nom: "Cholet", dept: "49", cp: "49300", lat: 47.0592, lng: -0.879, pop: 54277 },
  { slug: "bobigny", nom: "Bobigny", dept: "93", cp: "93000", lat: 48.9106, lng: 2.4396, pop: 54000 },
  { slug: "bondy", nom: "Bondy", dept: "93", cp: "93140", lat: 48.9024, lng: 2.4835, pop: 54043 },
  { slug: "frejus", nom: "Fréjus", dept: "83", cp: "83600", lat: 43.4332, lng: 6.737, pop: 54023 },
  { slug: "vannes", nom: "Vannes", dept: "56", cp: "56000", lat: 47.6587, lng: -2.7603, pop: 53719 },
  { slug: "fontenay-sous-bois", nom: "Fontenay-sous-Bois", dept: "94", cp: "94120", lat: 48.8515, lng: 2.4753, pop: 53360 },
  { slug: "clamart", nom: "Clamart", dept: "92", cp: "92140", lat: 48.8014, lng: 2.2665, pop: 53095 },
  { slug: "arles", nom: "Arles", dept: "13", cp: "13200", lat: 43.6768, lng: 4.628, pop: 52548 },
  { slug: "sartrouville", nom: "Sartrouville", dept: "78", cp: "78500", lat: 48.9403, lng: 2.1631, pop: 52318 },
  { slug: "bayonne", nom: "Bayonne", dept: "64", cp: "64100", lat: 43.4929, lng: -1.4748, pop: 51894 },
  { slug: "cagnes-sur-mer", nom: "Cagnes-sur-Mer", dept: "06", cp: "06800", lat: 43.6644, lng: 7.1489, pop: 51516 },
  { slug: "corbeil-essonnes", nom: "Corbeil-Essonnes", dept: "91", cp: "91100", lat: 48.6139, lng: 2.482, pop: 51470 },
  { slug: "sevran", nom: "Sevran", dept: "93", cp: "93270", lat: 48.9394, lng: 2.5286, pop: 51452 },
  { slug: "vaulx-en-velin", nom: "Vaulx-en-Velin", dept: "69", cp: "69120", lat: 45.7768, lng: 4.9186, pop: 51000 },
  { slug: "saint-ouen-sur-seine", nom: "Saint-Ouen-sur-Seine", dept: "93", cp: "93400", lat: 48.911, lng: 2.333, pop: 51000 },
  { slug: "grasse", nom: "Grasse", dept: "06", cp: "06130", lat: 43.6584, lng: 6.9225, pop: 50396 },
  { slug: "massy", nom: "Massy", dept: "91", cp: "91300", lat: 48.7309, lng: 2.2828, pop: 50644 },
  { slug: "vincennes", nom: "Vincennes", dept: "94", cp: "94300", lat: 48.8478, lng: 2.4392, pop: 49891 },
  { slug: "montrouge", nom: "Montrouge", dept: "92", cp: "92120", lat: 48.8156, lng: 2.3194, pop: 49854 },
  { slug: "suresnes", nom: "Suresnes", dept: "92", cp: "92150", lat: 48.8712, lng: 2.2292, pop: 49500 },
  { slug: "albi", nom: "Albi", dept: "81", cp: "81000", lat: 43.9298, lng: 2.148, pop: 49531 },
  { slug: "laval", nom: "Laval", dept: "53", cp: "53000", lat: 48.0698, lng: -0.7667, pop: 49573 },
  { slug: "martigues", nom: "Martigues", dept: "13", cp: "13500", lat: 43.4053, lng: 5.048, pop: 49020 },
  { slug: "bastia", nom: "Bastia", dept: "2B", cp: "20200", lat: 42.7028, lng: 9.4508, pop: 48000 },
  { slug: "gennevilliers", nom: "Gennevilliers", dept: "92", cp: "92230", lat: 48.9333, lng: 2.295, pop: 48000 },
  { slug: "evreux", nom: "Évreux", dept: "27", cp: "27000", lat: 49.027, lng: 1.1508, pop: 47733 },
  { slug: "aubagne", nom: "Aubagne", dept: "13", cp: "13400", lat: 43.2925, lng: 5.5707, pop: 47410 },
  { slug: "choisy-le-roi", nom: "Choisy-le-Roi", dept: "94", cp: "94600", lat: 48.7644, lng: 2.41, pop: 47000 },
  { slug: "brive-la-gaillarde", nom: "Brive-la-Gaillarde", dept: "19", cp: "19100", lat: 45.159, lng: 1.533, pop: 46961 },
  { slug: "saint-priest", nom: "Saint-Priest", dept: "69", cp: "69800", lat: 45.6961, lng: 4.9442, pop: 46000 },
  { slug: "belfort", nom: "Belfort", dept: "90", cp: "90000", lat: 47.6379, lng: 6.8628, pop: 46443 },
  { slug: "rosny-sous-bois", nom: "Rosny-sous-Bois", dept: "93", cp: "93110", lat: 48.8748, lng: 2.4854, pop: 46156 },
  { slug: "saint-herblain", nom: "Saint-Herblain", dept: "44", cp: "44800", lat: 47.2172, lng: -1.6488, pop: 47206 },
  { slug: "saint-malo", nom: "Saint-Malo", dept: "35", cp: "35400", lat: 48.6493, lng: -2.0257, pop: 46097 },
  { slug: "charleville-mezieres", nom: "Charleville-Mézières", dept: "08", cp: "08000", lat: 49.7724, lng: 4.7196, pop: 46281 },
  { slug: "carcassonne", nom: "Carcassonne", dept: "11", cp: "11000", lat: 43.213, lng: 2.3491, pop: 46031 },
  { slug: "blois", nom: "Blois", dept: "41", cp: "41000", lat: 47.5861, lng: 1.3359, pop: 45871 },
  { slug: "mantes-la-jolie", nom: "Mantes-la-Jolie", dept: "78", cp: "78200", lat: 48.9906, lng: 1.7167, pop: 45000 },
  { slug: "meudon", nom: "Meudon", dept: "92", cp: "92190", lat: 48.8137, lng: 2.235, pop: 45000 },
  { slug: "alfortville", nom: "Alfortville", dept: "94", cp: "94140", lat: 48.8058, lng: 2.4204, pop: 45000 },
  { slug: "la-courneuve", nom: "La Courneuve", dept: "93", cp: "93120", lat: 48.93, lng: 2.398, pop: 45000 },
  { slug: "les-sables-d-olonne", nom: "Les Sables-d'Olonne", dept: "85", cp: "85100", lat: 46.4972, lng: -1.7833, pop: 45000 },
  { slug: "salon-de-provence", nom: "Salon-de-Provence", dept: "13", cp: "13300", lat: 43.6403, lng: 5.0975, pop: 45528 },
  { slug: "saint-germain-en-laye", nom: "Saint-Germain-en-Laye", dept: "78", cp: "78100", lat: 48.8987, lng: 2.0942, pop: 44000 },
  { slug: "saint-brieuc", nom: "Saint-Brieuc", dept: "22", cp: "22000", lat: 48.5144, lng: -2.7657, pop: 44372 },
  { slug: "chalons-en-champagne", nom: "Châlons-en-Champagne", dept: "51", cp: "51000", lat: 48.9566, lng: 4.3634, pop: 44246 },
  { slug: "noisy-le-sec", nom: "Noisy-le-Sec", dept: "93", cp: "93130", lat: 48.89, lng: 2.46, pop: 44000 },
  { slug: "caluire-et-cuire", nom: "Caluire-et-Cuire", dept: "69", cp: "69300", lat: 45.7955, lng: 4.8452, pop: 43000 },
  { slug: "istres", nom: "Istres", dept: "13", cp: "13800", lat: 43.5131, lng: 4.9871, pop: 43463 },
  { slug: "chateauroux", nom: "Châteauroux", dept: "36", cp: "36000", lat: 46.811, lng: 1.691, pop: 43442 },
  { slug: "valenciennes", nom: "Valenciennes", dept: "59", cp: "59300", lat: 50.358, lng: 3.5234, pop: 43336 },
  { slug: "bron", nom: "Bron", dept: "69", cp: "69500", lat: 45.7333, lng: 4.9111, pop: 42000 },
  { slug: "garges-les-gonesse", nom: "Garges-lès-Gonesse", dept: "95", cp: "95140", lat: 48.9727, lng: 2.402, pop: 42000 },
  { slug: "angouleme", nom: "Angoulême", dept: "16", cp: "16000", lat: 45.6484, lng: 0.1562, pop: 41740 },
  { slug: "arras", nom: "Arras", dept: "62", cp: "62000", lat: 50.291, lng: 2.7778, pop: 41019 },
  { slug: "boulogne-sur-mer", nom: "Boulogne-sur-Mer", dept: "62", cp: "62200", lat: 50.7264, lng: 1.6139, pop: 40874 },
  { slug: "gap", nom: "Gap", dept: "05", cp: "05000", lat: 44.5594, lng: 6.0794, pop: 40895 },
  { slug: "compiegne", nom: "Compiègne", dept: "60", cp: "60200", lat: 49.4179, lng: 2.8261, pop: 40527 },
  { slug: "draguignan", nom: "Draguignan", dept: "83", cp: "83300", lat: 43.5404, lng: 6.4665, pop: 40054 },
  { slug: "douai", nom: "Douai", dept: "59", cp: "59500", lat: 50.3714, lng: 3.08, pop: 39725 },
  { slug: "stains", nom: "Stains", dept: "93", cp: "93240", lat: 48.9558, lng: 2.3855, pop: 39000 },
  { slug: "chartres", nom: "Chartres", dept: "28", cp: "28000", lat: 48.4469, lng: 1.489, pop: 38534 },
  { slug: "poissy", nom: "Poissy", dept: "78", cp: "78300", lat: 48.9294, lng: 2.049, pop: 37000 },
  { slug: "franconville", nom: "Franconville", dept: "95", cp: "95130", lat: 48.9878, lng: 2.2276, pop: 37000 },
  { slug: "savigny-sur-orge", nom: "Savigny-sur-Orge", dept: "91", cp: "91600", lat: 48.68, lng: 2.3489, pop: 37000 },
  { slug: "villefranche-sur-saone", nom: "Villefranche-sur-Saône", dept: "69", cp: "69400", lat: 45.9895, lng: 4.7186, pop: 37000 },
  { slug: "annemasse", nom: "Annemasse", dept: "74", cp: "74100", lat: 46.1937, lng: 6.236, pop: 36000 },
  { slug: "conflans-sainte-honorine", nom: "Conflans-Sainte-Honorine", dept: "78", cp: "78700", lat: 48.999, lng: 2.097, pop: 36000 },
  { slug: "sainte-genevieve-des-bois", nom: "Sainte-Geneviève-des-Bois", dept: "91", cp: "91700", lat: 48.642, lng: 2.323, pop: 36000 },
  { slug: "creil", nom: "Creil", dept: "60", cp: "60100", lat: 49.2583, lng: 2.4828, pop: 35817 },
  { slug: "bagnolet", nom: "Bagnolet", dept: "93", cp: "93170", lat: 48.8686, lng: 2.4181, pop: 35000 },
  { slug: "neuilly-sur-marne", nom: "Neuilly-sur-Marne", dept: "93", cp: "93330", lat: 48.8533, lng: 2.549, pop: 35000 },
  { slug: "thonon-les-bains", nom: "Thonon-les-Bains", dept: "74", cp: "74200", lat: 46.3707, lng: 6.4794, pop: 35000 },
  { slug: "roanne", nom: "Roanne", dept: "42", cp: "42300", lat: 46.0367, lng: 4.068, pop: 34000 },
  { slug: "montlucon", nom: "Montluçon", dept: "03", cp: "03100", lat: 46.3408, lng: 2.6033, pop: 34000 },
  { slug: "auxerre", nom: "Auxerre", dept: "89", cp: "89000", lat: 47.7986, lng: 3.5673, pop: 34634 },
  { slug: "palaiseau", nom: "Palaiseau", dept: "91", cp: "91120", lat: 48.7145, lng: 2.2455, pop: 34000 },
  { slug: "vitrolles", nom: "Vitrolles", dept: "13", cp: "13127", lat: 43.46, lng: 5.2486, pop: 34000 },
  { slug: "chalon-sur-saone", nom: "Chalon-sur-Saône", dept: "71", cp: "71100", lat: 46.7806, lng: 4.8536, pop: 45000 },
  { slug: "macon", nom: "Mâcon", dept: "71", cp: "71000", lat: 46.306, lng: 4.83, pop: 33638 },
  { slug: "marignane", nom: "Marignane", dept: "13", cp: "13700", lat: 43.4159, lng: 5.2148, pop: 33000 },
  { slug: "trappes", nom: "Trappes", dept: "78", cp: "78190", lat: 48.7756, lng: 1.9942, pop: 33000 },
  { slug: "les-mureaux", nom: "Les Mureaux", dept: "78", cp: "78130", lat: 48.991, lng: 1.916, pop: 33000 },
  { slug: "meyzieu", nom: "Meyzieu", dept: "69", cp: "69330", lat: 45.7667, lng: 5.0, pop: 33000 },
  { slug: "nevers", nom: "Nevers", dept: "58", cp: "58000", lat: 46.9896, lng: 3.159, pop: 32493 },
  { slug: "agen", nom: "Agen", dept: "47", cp: "47000", lat: 44.2049, lng: 0.6212, pop: 32485 },
  { slug: "cambrai", nom: "Cambrai", dept: "59", cp: "59400", lat: 50.1767, lng: 3.2358, pop: 32501 },
  { slug: "pontoise", nom: "Pontoise", dept: "95", cp: "95300", lat: 49.05, lng: 2.1, pop: 32000 },
  { slug: "epinal", nom: "Épinal", dept: "88", cp: "88000", lat: 48.1744, lng: 6.4494, pop: 31933 },
  { slug: "lens", nom: "Lens", dept: "62", cp: "62300", lat: 50.4291, lng: 2.832, pop: 31235 },
  { slug: "menton", nom: "Menton", dept: "06", cp: "06500", lat: 43.7765, lng: 7.5044, pop: 30000 },
  { slug: "saint-laurent-du-var", nom: "Saint-Laurent-du-Var", dept: "06", cp: "06700", lat: 43.6684, lng: 7.1889, pop: 30000 },
  { slug: "carpentras", nom: "Carpentras", dept: "84", cp: "84200", lat: 44.0553, lng: 5.048, pop: 30000 },
  { slug: "vienne", nom: "Vienne", dept: "38", cp: "38200", lat: 45.5252, lng: 4.8747, pop: 30000 },
  { slug: "mont-de-marsan", nom: "Mont-de-Marsan", dept: "40", cp: "40000", lat: 43.8907, lng: -0.4996, pop: 30000 },
  { slug: "aix-les-bains", nom: "Aix-les-Bains", dept: "73", cp: "73100", lat: 45.6885, lng: 5.9155, pop: 30000 },
  { slug: "maubeuge", nom: "Maubeuge", dept: "59", cp: "59600", lat: 50.2777, lng: 3.9727, pop: 29942 },
  { slug: "perigueux", nom: "Périgueux", dept: "24", cp: "24000", lat: 45.1841, lng: 0.7212, pop: 29699 },
  { slug: "dieppe", nom: "Dieppe", dept: "76", cp: "76200", lat: 49.9229, lng: 1.0779, pop: 29080 },
  { slug: "orange", nom: "Orange", dept: "84", cp: "84100", lat: 44.136, lng: 4.8076, pop: 29000 },
  { slug: "bourgoin-jallieu", nom: "Bourgoin-Jallieu", dept: "38", cp: "38300", lat: 45.5859, lng: 5.274, pop: 28000 },
  { slug: "soissons", nom: "Soissons", dept: "02", cp: "02200", lat: 49.3817, lng: 3.3237, pop: 28500 },
  { slug: "oullins", nom: "Oullins", dept: "69", cp: "69600", lat: 45.7147, lng: 4.808, pop: 26000 },
  { slug: "alencon", nom: "Alençon", dept: "61", cp: "61000", lat: 48.4306, lng: 0.0931, pop: 25848 },
  { slug: "aurillac", nom: "Aurillac", dept: "15", cp: "15000", lat: 44.9257, lng: 2.4409, pop: 25537 },
  { slug: "biarritz", nom: "Biarritz", dept: "64", cp: "64200", lat: 43.4832, lng: -1.5586, pop: 25404 },
  { slug: "vichy", nom: "Vichy", dept: "03", cp: "03200", lat: 46.1271, lng: 3.4261, pop: 25000 },
  { slug: "saintes", nom: "Saintes", dept: "17", cp: "17100", lat: 45.746, lng: -0.6337, pop: 25000 },
  { slug: "saint-quentin", nom: "Saint-Quentin", dept: "02", cp: "02100", lat: 49.8486, lng: 3.2864, pop: 53001 },
  { slug: "laon", nom: "Laon", dept: "02", cp: "02000", lat: 49.5641, lng: 3.6241, pop: 24876 },
  { slug: "rochefort", nom: "Rochefort", dept: "17", cp: "17300", lat: 45.942, lng: -0.9611, pop: 24000 },
  { slug: "rodez", nom: "Rodez", dept: "12", cp: "12000", lat: 44.3495, lng: 2.574, pop: 24057 },
  { slug: "dole", nom: "Dole", dept: "39", cp: "39100", lat: 47.0928, lng: 5.4906, pop: 23293 },
  { slug: "chaumont", nom: "Chaumont", dept: "52", cp: "52000", lat: 48.1116, lng: 5.1392, pop: 21947 },
  { slug: "dax", nom: "Dax", dept: "40", cp: "40100", lat: 43.7102, lng: -1.053, pop: 21000 },
  { slug: "auch", nom: "Auch", dept: "32", cp: "32000", lat: 43.6465, lng: 0.586, pop: 21625 },
  { slug: "lannion", nom: "Lannion", dept: "22", cp: "22300", lat: 48.7326, lng: -3.458, pop: 20000 },
  { slug: "tarbes", nom: "Tarbes", dept: "65", cp: "65000", lat: 43.2328, lng: 0.0783, pop: 40626 },
  { slug: "albertville", nom: "Albertville", dept: "73", cp: "73200", lat: 45.6759, lng: 6.3925, pop: 19000 },
  { slug: "cahors", nom: "Cahors", dept: "46", cp: "46000", lat: 44.4475, lng: 1.4409, pop: 19430 },
  { slug: "saint-lo", nom: "Saint-Lô", dept: "50", cp: "50000", lat: 49.1157, lng: -1.0899, pop: 19071 },
  { slug: "moulins", nom: "Moulins", dept: "03", cp: "03000", lat: 46.5647, lng: 3.3327, pop: 19563 },
  { slug: "le-puy-en-velay", nom: "Le Puy-en-Velay", dept: "43", cp: "43000", lat: 45.043, lng: 3.885, pop: 18634 },
  { slug: "lons-le-saunier", nom: "Lons-le-Saunier", dept: "39", cp: "39000", lat: 46.6757, lng: 5.5548, pop: 17161 },
  { slug: "digne-les-bains", nom: "Digne-les-Bains", dept: "04", cp: "04000", lat: 44.0921, lng: 6.2358, pop: 16000 },
  { slug: "bar-le-duc", nom: "Bar-le-Duc", dept: "55", cp: "55000", lat: 48.771, lng: 5.1614, pop: 14907 },
  { slug: "vesoul", nom: "Vesoul", dept: "70", cp: "70000", lat: 47.6199, lng: 6.154, pop: 14883 },
  { slug: "tulle", nom: "Tulle", dept: "19", cp: "19000", lat: 45.2673, lng: 1.7683, pop: 14000 },
  { slug: "gueret", nom: "Guéret", dept: "23", cp: "23000", lat: 46.1699, lng: 1.871, pop: 12800 },
  { slug: "mende", nom: "Mende", dept: "48", cp: "48000", lat: 44.518, lng: 3.5008, pop: 11804 },
  { slug: "foix", nom: "Foix", dept: "09", cp: "09000", lat: 42.9654, lng: 1.6053, pop: 9608 },
  { slug: "privas", nom: "Privas", dept: "07", cp: "07000", lat: 44.7351, lng: 4.5998, pop: 8348 },
  { slug: "bourg-en-bresse", nom: "Bourg-en-Bresse", dept: "01", cp: "01000", lat: 46.2051, lng: 5.2258, pop: 41527 },
  { slug: "fort-de-france", nom: "Fort-de-France", dept: "972", cp: "97200", lat: 14.6161, lng: -61.0588, pop: 75516 },
  { slug: "pointe-a-pitre", nom: "Pointe-à-Pitre", dept: "971", cp: "97110", lat: 16.2411, lng: -61.5331, pop: 15410 },
  { slug: "cayenne", nom: "Cayenne", dept: "973", cp: "97300", lat: 4.9372, lng: -52.326, pop: 63652 },
  { slug: "saint-denis-reunion", nom: "Saint-Denis de La Réunion", dept: "974", cp: "97400", lat: -20.8789, lng: 55.4481, pop: 153810 },
  { slug: "mamoudzou", nom: "Mamoudzou", dept: "976", cp: "97600", lat: -12.7806, lng: 45.2278, pop: 71437 },
];

// ─── Index & helpers ───────────────────────────────────────────────

const VILLES_BY_SLUG = new Map(VILLES.map((v) => [v.slug, v]));
const DEPTS_BY_CODE = new Map(DEPARTEMENTS.map((d) => [d.code, d]));
const DEPTS_BY_SLUG = new Map(DEPARTEMENTS.map((d) => [d.slug, d]));

export function getVille(slug: string): Ville | undefined {
  return VILLES_BY_SLUG.get(slug.toLowerCase());
}

export function getDepartement(codeOrSlug: string): Departement | undefined {
  const k = codeOrSlug.toUpperCase();
  return DEPTS_BY_CODE.get(k) ?? DEPTS_BY_SLUG.get(codeOrSlug.toLowerCase());
}

export function villesOfDepartement(code: string): Ville[] {
  return VILLES.filter((v) => v.dept === code).sort((a, b) => b.pop - a.pop);
}

/** Départements groupés par région, l'ensemble trié alphabétiquement. */
export function departementsByRegion(): Array<{ region: string; departements: Departement[] }> {
  const map = new Map<string, Departement[]>();
  for (const d of DEPARTEMENTS) {
    const list = map.get(d.region) ?? [];
    list.push(d);
    map.set(d.region, list);
  }
  return [...map.entries()]
    .map(([region, departements]) => ({
      region,
      departements: departements.sort((a, b) => a.code.localeCompare(b.code)),
    }))
    .sort((a, b) => a.region.localeCompare(b.region, "fr"));
}

/** Code département déduit d'un code postal (gère les DOM en 97x). */
export function deptFromCodePostal(cp: string | null | undefined): string | null {
  if (!cp) return null;
  const clean = cp.replace(/\s/g, "");
  if (clean.length < 2) return null;
  if (clean.startsWith("97") || clean.startsWith("98")) return clean.slice(0, 3);
  // La Corse est en 20xxx : on ne peut pas distinguer 2A/2B de façon fiable
  // à partir du seul code postal, on retient 2A pour 200xx/201xx et 2B sinon.
  if (clean.startsWith("20")) {
    const n = parseInt(clean.slice(0, 3), 10);
    return n <= 201 ? "2A" : "2B";
  }
  return clean.slice(0, 2);
}

/** Distance orthodromique en kilomètres. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Villes du référentiel les plus proches, hors la ville elle-même. */
export function villesProches(ville: Ville, limit = 8, rayonKm = 60): Ville[] {
  return VILLES.filter((v) => v.slug !== ville.slug)
    .map((v) => ({ v, d: distanceKm(ville, v) }))
    .filter((x) => x.d <= rayonKm)
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map((x) => x.v);
}

/** Normalise un libellé de commune libre (saisi par un centre) en slug. */
export function slugifyVille(nom: string): string {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Les N villes les plus peuplées — utilisé pour le prérendu et le maillage. */
export function topVilles(n: number): Ville[] {
  return [...VILLES].sort((a, b) => b.pop - a.pop).slice(0, n);
}
