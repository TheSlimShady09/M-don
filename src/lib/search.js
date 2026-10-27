import { BADGES, CATEGORIES, LABELS, REGIONS, SEASONS } from '../../shared/shop.js';

// Search the catalogue the way people type: in either language, with or without ë and ç,
// in any word order, in the plural, or just the start of a word ("xham" finds Xhamadan).

/** Lower case without accents: "Këmishë" → "kemishe" */
export const fold = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'`]/g, '');

const words = (s) => fold(s).split(/[^a-z0-9]+/).filter(Boolean);

// Words people search for that are not written on the products themselves
const SYNONYMS = {
  sweater: ['jumper', 'pulover'], pullover: ['jumper', 'pulover'],
  hat: ['qeleshe'], cap: ['qeleshe'], kapele: ['qeleshe'], plis: ['qeleshe'],
  scarf: ['shall'], shawl: ['shall'],
  pants: ['trousers', 'pantallona'],
  jewelry: ['aksesore'], jewellery: ['aksesore'], bizhuteri: ['aksesore'], stoli: ['aksesore'],
  necklace: ['pendant', 'varese'],
  woman: ['gra'], grua: ['gra'], femra: ['gra'],
  man: ['burra'], burre: ['burra'], meshkuj: ['burra'],
  child: ['femije'], children: ['femije'], kid: ['femije'], baby: ['femije'],
};

// Little words that say nothing about the product ("jelek me qëndisje", "dress for winter")
const STOP = new Set(['a', 'an', 'the', 'for', 'with', 'and', 'of', 'in', 'e', 'i', 'te', 'me', 'per', 'dhe', 'nje', 'ne']);

/** The term itself, its synonyms, and the term without a plural ending ("dresses", "këmishët") */
function variants(term) {
  const bases = [term];
  if (term.length >= 5) bases.push(term.slice(0, -1));
  if (term.length >= 6) bases.push(term.slice(0, -2));
  return [...new Set(bases.flatMap((b) => [b, ...(SYNONYMS[b] || [])]))];
}

// A word matches when it starts with the term; longer terms may also sit inside a word ("madan").
// Short ones may not, so "men" doesn't find "women".
const hit = (list, term) => list.some((w) => w.startsWith(term) || (term.length >= 4 && w.includes(term)));

// What can be searched on a product, and how much a match there counts
function fieldsOf(p) {
  const names = (map, keys) => keys.flatMap((k) => (map[k] ? [map[k].sq, map[k].en, map[k].title] : []));
  return [
    [3, [p.name_sq, p.name_en]],
    [2, [p.material_sq, p.material_en, ...names(CATEGORIES, p.categories), ...names(LABELS, [p.label])]],
    [1, [...names(SEASONS, p.seasons), REGIONS[p.region], ...names(BADGES, [p.badge])]],
  ].map(([weight, texts]) => [weight, words(texts.filter(Boolean).join(' '))]);
}

/** Products matching every word of the query, best matches first */
export function searchProducts(products, query) {
  const all = words(query);
  const terms = all.filter((w) => !STOP.has(w));
  const use = terms.length ? terms : all;
  if (!use.length) return [];
  const whole = fold(query).trim();

  return products
    .map((p, i) => {
      const fields = fieldsOf(p);
      let score = 0;
      for (const term of use) {
        const vs = variants(term);
        const best = Math.max(0, ...fields.map(([weight, list]) => (vs.some((v) => hit(list, v)) ? weight : 0)));
        if (!best) return null;
        score += best;
      }
      if (fold(p.name_sq).startsWith(whole) || fold(p.name_en).startsWith(whole)) score += 2;
      return { p, i, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map(({ p }) => p);
}
