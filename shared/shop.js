// Rules shared by the shop (browser) and the server, so prices and labels never disagree.

export const SHIPPING_FREE_FROM = 5000; // Lekë
export const SHIPPING_COST = 300; // Lekë

export const shippingFor = (subtotal) => (subtotal === 0 || subtotal >= SHIPPING_FREE_FROM ? 0 : SHIPPING_COST);

export const CATEGORIES = {
  burra: { sq: 'Burra', en: 'Men' },
  gra: { sq: 'Gra', en: 'Women' },
  femije: { sq: 'Fëmijë', en: 'Kids' },
};

// The collections are organised by season. `title` is the definite form used as a page heading.
export const SEASONS = {
  pranvere: { sq: 'Pranverë', en: 'Spring', title: 'Pranvera' },
  vere: { sq: 'Verë', en: 'Summer', title: 'Vera' },
  vjeshte: { sq: 'Vjeshtë', en: 'Autumn', title: 'Vjeshta' },
  dimer: { sq: 'Dimër', en: 'Winter', title: 'Dimri' },
};

/** Season for a date: March–May spring, June–August summer, September–November autumn, December–February winter */
export const seasonOf = (date = new Date()) => ['dimer', 'pranvere', 'vere', 'vjeshte'][Math.floor(((date.getMonth() + 1) % 12) / 3)];

// Where a product was made, north to south (shown on the product, not used for collections)
export const REGIONS = {
  malesia: 'Malësia',
  kukesi: 'Kukësi',
  shkodra: 'Shkodra',
  tirana: 'Tirana',
  korca: 'Korça',
  gjirokastra: 'Gjirokastra',
};

export const LABELS = {
  unisex: { sq: 'Unisex', en: 'Unisex' },
  aksesore: { sq: 'Aksesorë', en: 'Accessories' },
};

export const BADGES = {
  risi: { sq: 'Risi', en: 'New' },
  seri: { sq: 'Seri e kufizuar', en: 'Limited edition' },
};

export const PAYMENT_METHODS = {
  karte: { sq: 'Kartë (Stripe)', en: 'Card (Stripe)' },   // shown only when Stripe keys are set
  dorezim: { sq: 'Pagesë në dorëzim', en: 'Cash on delivery' },
  banke: { sq: 'Transfertë bankare', en: 'Bank transfer' },
};

// Card orders wait in "pret_pagesen" until Stripe confirms the payment; they never count as sales before that.
export const ORDER_STATUSES = {
  pret_pagesen: 'Pret pagesën',
  e_re: 'E re',
  ne_pergatitje: 'Në përgatitje',
  derguar: 'Dërguar',
  dorezuar: 'Dorëzuar',
  anuluar: 'Anuluar',
};

export const PAYMENT_STATUSES = {
  ne_pritje: 'Në pritje',      // cash on delivery / bank transfer not yet received, or card not yet paid
  paguar: 'Paguar',
  deshtoi: 'Dështoi',
  rimbursuar: 'Rimbursuar',
};

// Statuses that are not (yet) a sale
export const NOT_SOLD = ['anuluar', 'pret_pagesen'];

export const MAX_QTY = 20;
