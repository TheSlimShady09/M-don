// The starting collection, loaded into an empty database on first run.
// After that, products are managed from the owner dashboard.
export const SEED_PRODUCTS = [
  // Burra
  { id: 'xhamadan-i-qendisur', name_sq: 'Xhamadan i qëndisur', name_en: 'Embroidered xhamadan', categories: ['burra'], region: 'malesia', material_sq: 'Lesh', material_en: 'Wool', price: 24900, badge: 'risi', featured: 1 },
  { id: 'xhamadan-klasik', name_sq: 'Xhamadan klasik', name_en: 'Classic xhamadan', categories: ['burra'], region: 'tirana', material_sq: 'Lesh', material_en: 'Wool', price: 21500 },
  { id: 'jelek-me-motiv-qilimi', name_sq: 'Jelek me motiv qilimi', name_en: 'Kilim-motif vest', categories: ['burra'], region: 'kukesi', material_sq: 'Lesh', material_en: 'Wool', price: 14800, badge: 'risi' },
  { id: 'kemishe-liri', name_sq: 'Këmishë liri', name_en: 'Linen shirt', categories: ['burra'], region: 'korca', material_sq: 'Li', material_en: 'Linen', price: 9900, featured: 1 },
  { id: 'pantallona-leshi', name_sq: 'Pantallona leshi', name_en: 'Wool trousers', categories: ['burra'], region: 'malesia', material_sq: 'Lesh', material_en: 'Wool', price: 16500 },
  { id: 'kostum-i-zi', name_sq: 'Kostum i zi', name_en: 'Black suit', categories: ['burra'], region: 'korca', material_sq: 'Lesh merino', material_en: 'Merino wool', price: 42000 },
  { id: 'pallto-leshi-gri', name_sq: 'Pallto leshi gri', name_en: 'Grey wool coat', categories: ['burra'], region: 'gjirokastra', material_sq: 'Lesh', material_en: 'Wool', price: 36000 },
  { id: 'kopsa-argjendi', name_sq: 'Kopsa argjendi për mansheta', name_en: 'Silver cufflinks', categories: ['burra'], region: 'shkodra', material_sq: 'Argjend', material_en: 'Silver', price: 11500, badge: 'seri', label: 'aksesore' },

  // Gra
  { id: 'fustan-me-theke', name_sq: 'Fustan me thekë', name_en: 'Fringed dress', categories: ['gra'], region: 'malesia', material_sq: 'Lesh', material_en: 'Wool', price: 32500, badge: 'risi', featured: 1 },
  { id: 'pallto-me-motiv-qilimi', name_sq: 'Pallto me motiv qilimi', name_en: 'Kilim-motif coat', categories: ['gra'], region: 'kukesi', material_sq: 'Lesh', material_en: 'Wool', price: 38000, badge: 'risi', featured: 1 },
  { id: 'fund-leshi-me-qendisje', name_sq: 'Fund leshi me qëndisje', name_en: 'Embroidered wool skirt', categories: ['gra'], region: 'malesia', material_sq: 'Lesh', material_en: 'Wool', price: 19800 },
  { id: 'kemishe-e-qendisur', name_sq: 'Këmishë e qëndisur', name_en: 'Embroidered blouse', categories: ['gra'], region: 'shkodra', material_sq: 'Li', material_en: 'Linen', price: 12400 },
  { id: 'vathe-filigrani', name_sq: 'Vathë filigrani', name_en: 'Filigree earrings', categories: ['gra'], region: 'shkodra', material_sq: 'Argjend', material_en: 'Silver', price: 14200, badge: 'seri', label: 'aksesore', featured: 1 },
  { id: 'jelek-kadifeje', name_sq: 'Jelek kadifeje', name_en: 'Velvet vest', categories: ['gra'], region: 'tirana', material_sq: 'Kadife', material_en: 'Velvet', price: 17900 },
  { id: 'fustan-mbremjeje', name_sq: 'Fustan mbrëmjeje', name_en: 'Evening dress', categories: ['gra'], region: 'korca', material_sq: 'Mëndafsh', material_en: 'Silk', price: 45000 },
  { id: 'shall-me-theke', name_sq: 'Shall me thekë', name_en: 'Fringed shawl', categories: ['gra'], region: 'malesia', material_sq: 'Lesh', material_en: 'Wool', price: 8900 },
  { id: 'varese-argjendi', name_sq: 'Varëse argjendi', name_en: 'Silver pendant', categories: ['gra'], region: 'shkodra', material_sq: 'Argjend', material_en: 'Silver', price: 16800, label: 'aksesore' },
  { id: 'xhakete-leshi', name_sq: 'Xhaketë leshi', name_en: 'Wool jacket', categories: ['gra'], region: 'gjirokastra', material_sq: 'Lesh', material_en: 'Wool', price: 27500 },

  // Fëmijë
  { id: 'jelek-i-qendisur', name_sq: 'Jelek i qëndisur', name_en: 'Embroidered vest', categories: ['femije'], region: 'kukesi', material_sq: 'Lesh', material_en: 'Wool', price: 8400, featured: 1 },
  { id: 'fustan-i-vogel-me-theke', name_sq: 'Fustan i vogël me thekë', name_en: 'Little fringed dress', categories: ['femije'], region: 'malesia', material_sq: 'Lesh', material_en: 'Wool', price: 11900, badge: 'risi' },
  { id: 'xhamadan-i-vogel', name_sq: 'Xhamadan i vogël', name_en: 'Little xhamadan', categories: ['femije'], region: 'malesia', material_sq: 'Lesh', material_en: 'Wool', price: 10500 },
  { id: 'qeleshe-e-vogel', name_sq: 'Qeleshe e vogël', name_en: 'Little qeleshe', categories: ['femije'], region: 'tirana', material_sq: 'Lesh i shtypur', material_en: 'Felted wool', price: 4200 },
  { id: 'kemishe-liri-femije', name_sq: 'Këmishë liri', name_en: 'Linen shirt', categories: ['femije'], region: 'korca', material_sq: 'Li', material_en: 'Linen', price: 5900 },
  { id: 'pulover-me-motiv-qilimi', name_sq: 'Pulovër me motiv qilimi', name_en: 'Kilim-motif jumper', categories: ['femije'], region: 'kukesi', material_sq: 'Lesh', material_en: 'Wool', price: 7800 },
  { id: 'pallto-e-vogel', name_sq: 'Pallto e vogël', name_en: 'Little coat', categories: ['femije'], region: 'gjirokastra', material_sq: 'Lesh', material_en: 'Wool', price: 14500 },
  { id: 'shall-i-vogel', name_sq: 'Shall i vogël', name_en: 'Little scarf', categories: ['femije'], region: 'gjirokastra', material_sq: 'Lesh', material_en: 'Wool', price: 3900 },

  // Unisex (Burra dhe Gra)
  { id: 'qeleshe-e-bardhe', name_sq: 'Qeleshe e bardhë', name_en: 'White qeleshe', categories: ['burra', 'gra'], region: 'tirana', material_sq: 'Lesh i shtypur', material_en: 'Felted wool', price: 6800, label: 'unisex', featured: 1 },
  { id: 'shall-leshi', name_sq: 'Shall leshi', name_en: 'Wool scarf', categories: ['burra', 'gra'], region: 'gjirokastra', material_sq: 'Lesh', material_en: 'Wool', price: 7500, label: 'unisex', featured: 1 },
];
