-- =============================================================================
--  M'DON — Të dhëna shembull: 3 produkte me variante, përdorues, porosi, pagesë
--  Ekzekuto pas 01_schema.sql. Fjalëkalimet janë hash-e shembull, jo të vërteta.
-- =============================================================================

BEGIN;

-- Ndihmës i përkohshëm: gjen kategorinë sipas rrugës, p.sh. 'femra/veshje/fustane'
CREATE FUNCTION pg_temp.cat(p_path TEXT) RETURNS BIGINT LANGUAGE plpgsql AS $$
DECLARE
  part TEXT;
  v_id BIGINT;
BEGIN
  FOREACH part IN ARRAY string_to_array(p_path, '/') LOOP
    SELECT id INTO v_id FROM categories WHERE slug = part AND parent_id IS NOT DISTINCT FROM v_id;
  END LOOP;
  RETURN v_id;
END $$;

-- -----------------------------------------------------------------------------
-- Rolet dhe përdoruesit
-- -----------------------------------------------------------------------------
INSERT INTO roles (code, name) VALUES
  ('admin', 'Administrator'),
  ('klient', 'Klient'),
  ('magazinier', 'Magazinier');

INSERT INTO users (email, password_hash, first_name, last_name, phone, email_verified_at, marketing_consent) VALUES
  ('arta@mdon.al',         '$argon2id$v=19$m=65536,t=3,p=4$SHEMBULL$hash-shembull-jo-i-vertete', 'Arta', 'Hoxha', '+355 69 111 2233', now(), false),
  ('ben.kola@example.com', '$argon2id$v=19$m=65536,t=3,p=4$SHEMBULL$hash-shembull-jo-i-vertete', 'Ben',  'Kola',  '+355 68 444 5566', now(), true);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON (u.email, r.code) IN (('arta@mdon.al', 'admin'), ('ben.kola@example.com', 'klient'));

INSERT INTO addresses (user_id, label, full_name, phone, line1, city, region, postal_code, is_default_shipping, is_default_billing)
SELECT id, 'Shtëpia', 'Ben Kola', '+355 68 444 5566', 'Rruga Kolë Idromeno 12', 'Shkodër', 'Shkodër', '4001', true, true
  FROM users WHERE email = 'ben.kola@example.com';

-- -----------------------------------------------------------------------------
-- Marka, kategori (3 nivele), koleksione, etiketa
-- -----------------------------------------------------------------------------
INSERT INTO brands (name, slug, description) VALUES
  ('M''DON',             'mdon',              'Moda autoktone shqiptare, e qepur me dorë.'),
  ('Zanatet e Veriut',   'zanatet-e-veriut',  'Këpucë dhe aksesorë lëkure nga mjeshtër të Malësisë.');

INSERT INTO categories (name, slug, position) VALUES
  ('Meshkuj', 'meshkuj', 1), ('Femra', 'femra', 2), ('Fëmijë', 'femije', 3);

INSERT INTO categories (parent_id, name, slug, position)
SELECT pg_temp.cat(x.parent), x.name, x.slug, x.pos
  FROM (VALUES ('meshkuj', 'Veshje', 'veshje', 1), ('meshkuj', 'Këpucë', 'kepuce', 2),
               ('femra',   'Veshje', 'veshje', 1), ('femra',   'Këpucë', 'kepuce', 2),
               ('femije',  'Veshje', 'veshje', 1)) AS x (parent, name, slug, pos);

INSERT INTO categories (parent_id, name, slug, position)
SELECT pg_temp.cat(x.parent), x.name, x.slug, 1
  FROM (VALUES ('meshkuj/veshje', 'Xhamadanë', 'xhamadane'),
               ('femra/veshje',   'Fustane',   'fustane')) AS x (parent, name, slug);

INSERT INTO collections (name, slug, description, starts_at) VALUES
  ('Vjeshtë 2026', 'vjeshte-2026', 'Rrënjë të lashta. Vija të reja.', '2026-09-01'),
  ('Malësia',      'malesia',      'Xhubleta dhe qëndismat e Malësisë së Madhe.', NULL);

INSERT INTO tags (name, slug) VALUES
  ('Qëndisur me dorë', 'qendisur-me-dore'), ('Lesh natyral', 'lesh-natyral'), ('Lëkurë', 'lekure'), ('Risi', 'risi');

-- -----------------------------------------------------------------------------
-- Madhësi dhe ngjyra
-- -----------------------------------------------------------------------------
INSERT INTO sizes (system, code, label, sort_order)
SELECT 'rroba', s, s, ord FROM unnest(ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL']) WITH ORDINALITY AS t (s, ord);
INSERT INTO sizes (system, code, label, sort_order)
SELECT 'kepuce', n::text, n::text, n FROM generate_series(35, 46) AS n;
INSERT INTO sizes (system, code, label, sort_order) VALUES
  ('femije', '2-3v', '2–3 vjeç', 1), ('femije', '4-5v', '4–5 vjeç', 2), ('femije', '6-7v', '6–7 vjeç', 3), ('femije', '8-9v', '8–9 vjeç', 4);

INSERT INTO colors (name, family, hex) VALUES
  ('E zezë',  'zeze',   '#0E0A0A'),
  ('E kuqe',  'kuqe',   '#B3141B'),
  ('E bardhë','bardhe', '#F4F1EA'),
  ('Kafe',    'kafe',   '#6B4423');

-- -----------------------------------------------------------------------------
-- 3 produkte (atributet fleksibël në JSONB)
-- -----------------------------------------------------------------------------
INSERT INTO products (brand_id, name, slug, description, gender, status, published_at, attributes)
VALUES
  ((SELECT id FROM brands WHERE slug = 'mdon'),
   'Xhamadan i qëndisur', 'xhamadan-i-qendisur',
   'Xhamadan leshi me qëndisje të kuqe me dorë, në prerje bashkëkohore.',
   'meshkuj', 'active', now(),
   '{"perberja": {"lesh": 100}, "larja": ["Vetëm pastrim kimik", "Mos e shtrydh"],
     "stina": ["vjeshte", "dimer"], "origjina": "Shkodër", "qendisja": "me dorë, 40 orë"}'),
  ((SELECT id FROM brands WHERE slug = 'mdon'),
   'Fustan me thekë', 'fustan-me-theke',
   'Fustan i frymëzuar nga xhubleta e Malësisë, me thekë në fund.',
   'femra', 'active', now(),
   '{"perberja": {"lesh merino": 85, "mendafsh": 15}, "larja": ["30°C me dorë", "Thaje shtrirë"],
     "stina": ["vjeshte", "pranvere"], "origjina": "Malësi e Madhe"}'),
  ((SELECT id FROM brands WHERE slug = 'zanatet-e-veriut'),
   'Opinga lëkure', 'opinga-lekure',
   'Opinga tradicionale prej lëkure lope, të qepura me dorë.',
   'unisex', 'active', now(),
   '{"perberja": {"lekure lope": 100}, "larja": ["Pastro me leckë të lagur", "Krem lëkure një herë në muaj"],
     "stina": ["pranvere", "vere", "vjeshte"], "origjina": "Kukës", "taban": "lëkurë"}');

INSERT INTO product_categories (product_id, category_id, is_primary)
SELECT p.id, pg_temp.cat(x.path), x.is_primary
  FROM (VALUES ('xhamadan-i-qendisur', 'meshkuj/veshje/xhamadane', true),
               ('fustan-me-theke',     'femra/veshje/fustane',     true),
               ('opinga-lekure',       'femra/kepuce',             true),
               ('opinga-lekure',       'meshkuj/kepuce',           false)) AS x (slug, path, is_primary)
  JOIN products p ON p.slug = x.slug;

INSERT INTO collection_products (collection_id, product_id, position)
SELECT c.id, p.id, x.pos
  FROM (VALUES ('vjeshte-2026', 'xhamadan-i-qendisur', 1), ('vjeshte-2026', 'fustan-me-theke', 2),
               ('malesia', 'fustan-me-theke', 1)) AS x (coll, slug, pos)
  JOIN collections c ON c.slug = x.coll JOIN products p ON p.slug = x.slug;

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id
  FROM (VALUES ('xhamadan-i-qendisur', 'qendisur-me-dore'), ('xhamadan-i-qendisur', 'lesh-natyral'),
               ('fustan-me-theke', 'lesh-natyral'), ('fustan-me-theke', 'risi'),
               ('opinga-lekure', 'lekure')) AS x (slug, tag)
  JOIN products p ON p.slug = x.slug JOIN tags t ON t.slug = x.tag;

-- -----------------------------------------------------------------------------
-- Variantet (SKU): madhësi × ngjyrë × material, me çmimin dhe stokun e vet
-- Futen me stok 0; stoku hyn më poshtë përmes adjust_stock(), që libri i inventarit të jetë i plotë.
-- -----------------------------------------------------------------------------
CREATE TEMP TABLE seed_variants (
  product_slug TEXT, sku TEXT, system size_system, size_code TEXT, color TEXT, material TEXT,
  price NUMERIC, sale_price NUMERIC, qty INTEGER, weight INTEGER
) ON COMMIT DROP;

INSERT INTO seed_variants VALUES
  -- Xhamadan: XL në ulje çmimi, XL pa stok
  ('xhamadan-i-qendisur', 'MD-XHM-ZEZ-S',  'rroba', 'S',  'E zezë',   'Lesh', 24900, NULL,  4, 950),
  ('xhamadan-i-qendisur', 'MD-XHM-ZEZ-M',  'rroba', 'M',  'E zezë',   'Lesh', 24900, NULL,  8, 980),
  ('xhamadan-i-qendisur', 'MD-XHM-ZEZ-L',  'rroba', 'L',  'E zezë',   'Lesh', 24900, NULL,  6, 1010),
  ('xhamadan-i-qendisur', 'MD-XHM-ZEZ-XL', 'rroba', 'XL', 'E zezë',   'Lesh', 24900, 21900, 0, 1040),
  ('xhamadan-i-qendisur', 'MD-XHM-BAR-M',  'rroba', 'M',  'E bardhë', 'Lesh', 26900, NULL,  3, 980),
  ('xhamadan-i-qendisur', 'MD-XHM-BAR-L',  'rroba', 'L',  'E bardhë', 'Lesh', 26900, NULL,  2, 1010),
  -- Fustan: e kuqja me zbritje
  ('fustan-me-theke', 'MD-FST-ZEZ-XS', 'rroba', 'XS', 'E zezë', 'Lesh merino', 32500, NULL,  3, 700),
  ('fustan-me-theke', 'MD-FST-ZEZ-S',  'rroba', 'S',  'E zezë', 'Lesh merino', 32500, NULL,  5, 720),
  ('fustan-me-theke', 'MD-FST-ZEZ-M',  'rroba', 'M',  'E zezë', 'Lesh merino', 32500, NULL,  5, 740),
  ('fustan-me-theke', 'MD-FST-ZEZ-L',  'rroba', 'L',  'E zezë', 'Lesh merino', 32500, NULL,  2, 760),
  ('fustan-me-theke', 'MD-FST-KUQ-XS', 'rroba', 'XS', 'E kuqe', 'Lesh merino', 32500, 27900, 2, 700),
  ('fustan-me-theke', 'MD-FST-KUQ-S',  'rroba', 'S',  'E kuqe', 'Lesh merino', 32500, 27900, 4, 720),
  ('fustan-me-theke', 'MD-FST-KUQ-M',  'rroba', 'M',  'E kuqe', 'Lesh merino', 32500, 27900, 0, 740),
  ('fustan-me-theke', 'MD-FST-KUQ-L',  'rroba', 'L',  'E kuqe', 'Lesh merino', 32500, 27900, 1, 760),
  -- Opinga: numrat 38–43
  ('opinga-lekure', 'ZV-OPG-KAF-38', 'kepuce', '38', 'Kafe', 'Lëkurë', 12900, NULL, 2, 600),
  ('opinga-lekure', 'ZV-OPG-KAF-39', 'kepuce', '39', 'Kafe', 'Lëkurë', 12900, NULL, 4, 620),
  ('opinga-lekure', 'ZV-OPG-KAF-40', 'kepuce', '40', 'Kafe', 'Lëkurë', 12900, NULL, 6, 640),
  ('opinga-lekure', 'ZV-OPG-KAF-41', 'kepuce', '41', 'Kafe', 'Lëkurë', 12900, NULL, 6, 660),
  ('opinga-lekure', 'ZV-OPG-KAF-42', 'kepuce', '42', 'Kafe', 'Lëkurë', 12900, NULL, 3, 680),
  ('opinga-lekure', 'ZV-OPG-KAF-43', 'kepuce', '43', 'Kafe', 'Lëkurë', 12900, NULL, 1, 700);

INSERT INTO product_variants (product_id, sku, size_id, color_id, material, price, sale_price, currency, weight_grams, position)
SELECT p.id, sv.sku, s.id, c.id, sv.material, sv.price, sv.sale_price, 'ALL', sv.weight,
       row_number() OVER (PARTITION BY p.id ORDER BY c.id, s.sort_order)
  FROM seed_variants sv
  JOIN products p ON p.slug = sv.product_slug
  JOIN sizes s    ON s.system = sv.system AND s.code = sv.size_code
  JOIN colors c   ON c.name = sv.color;

-- Hyrja e parë e mallit nga furnitori → inventory_movements ('purchase_in')
SELECT adjust_stock(v.id, sv.qty, 'purchase_in', NULL, 'Stoku fillestar',
                    (SELECT id FROM users WHERE email = 'arta@mdon.al'), 'FAT-2026-0001')
  FROM seed_variants sv JOIN product_variants v ON v.sku = sv.sku
 WHERE sv.qty > 0
 ORDER BY v.id;

-- -----------------------------------------------------------------------------
-- Fotot në CDN: disa për çdo ngjyrë, një kryesore për ngjyrë
-- -----------------------------------------------------------------------------
INSERT INTO product_images (product_id, color_id, storage_key, url, alt_text, width, height, position, is_primary)
SELECT p.id, c.id,
       format('products/%s/%s-%s.jpg', p.slug, c.family, n),
       format('https://cdn.mdon.al/products/%s/%s-%s.jpg', p.slug, c.family, n),
       format('%s, %s, foto %s', p.name, lower(c.name), n),
       1600, 2133, n, n = 1
  FROM (VALUES ('xhamadan-i-qendisur', 'E zezë'), ('xhamadan-i-qendisur', 'E bardhë'),
               ('fustan-me-theke', 'E zezë'), ('fustan-me-theke', 'E kuqe'),
               ('opinga-lekure', 'Kafe')) AS x (slug, color)
  JOIN products p ON p.slug = x.slug
  JOIN colors c ON c.name = x.color
  CROSS JOIN generate_series(1, 3) AS n;

-- -----------------------------------------------------------------------------
-- Dërgesa, zbritje, kuponë
-- -----------------------------------------------------------------------------
INSERT INTO shipping_methods (code, name, carrier, price, free_over, min_days, max_days, countries) VALUES
  ('standard',      'Dërgesë standarde',          'Korrier lokal', 300,  5000, 1, 3, '{AL}'),
  ('ekspres_tirane','Ekspres brenda ditës (Tiranë)', 'Korrier lokal', 600,  NULL, 0, 1, '{AL}'),
  ('nderkombetare', 'Ndërkombëtare',               'DHL',           1500, 30000, 4, 8, '{XK,MK,ME,IT,GR}');

INSERT INTO discounts (name, type, value, scope, min_order_amount, max_discount_amount, starts_at, ends_at) VALUES
  ('Vjeshta: 10% te koleksioni Vjeshtë 2026', 'percent', 10, 'collections', 10000, 10000, '2026-09-01', '2026-12-31'),
  ('Dërgesë falas',                           'free_shipping', 0, 'order', 0, NULL, '2026-01-01', NULL);

INSERT INTO discount_targets (discount_id, collection_id)
SELECT d.id, c.id FROM discounts d, collections c
 WHERE d.name LIKE 'Vjeshta%' AND c.slug = 'vjeshte-2026';

INSERT INTO coupons (discount_id, code, usage_limit, usage_limit_per_user)
SELECT id, 'VJESHTE10', 500, 1 FROM discounts WHERE name LIKE 'Vjeshta%'
UNION ALL
SELECT id, 'FALAS', 100, 1 FROM discounts WHERE name = 'Dërgesë falas';

-- -----------------------------------------------------------------------------
-- Lista e dëshirave dhe shporta e Benit → porosi me kupon
-- -----------------------------------------------------------------------------
INSERT INTO wishlists (user_id) SELECT id FROM users WHERE email = 'ben.kola@example.com';
INSERT INTO wishlist_items (wishlist_id, product_id, variant_id)
SELECT w.id, v.product_id, v.id FROM wishlists w, product_variants v
 WHERE w.user_id = (SELECT id FROM users WHERE email = 'ben.kola@example.com') AND v.sku = 'ZV-OPG-KAF-42';

INSERT INTO carts (user_id, currency) SELECT id, 'ALL' FROM users WHERE email = 'ben.kola@example.com';
INSERT INTO cart_items (cart_id, variant_id, quantity, price_at_add)
SELECT c.id, v.id, x.qty, v.effective_price
  FROM (VALUES ('MD-XHM-ZEZ-M', 1), ('MD-FST-KUQ-S', 1), ('ZV-OPG-KAF-41', 1)) AS x (sku, qty)
  JOIN product_variants v ON v.sku = x.sku
  CROSS JOIN carts c
 WHERE c.user_id = (SELECT id FROM users WHERE email = 'ben.kola@example.com') AND c.status = 'active';

-- Porosia: kuponi VJESHTE10 vlen vetëm për xhamadanin dhe fustanin (koleksioni Vjeshtë 2026), jo për opingat
SELECT * FROM create_order_from_cart(
  (SELECT id FROM carts WHERE user_id = (SELECT id FROM users WHERE email = 'ben.kola@example.com') AND status = 'active'),
  'ben.kola@example.com',
  '{"full_name": "Ben Kola", "phone": "+355 68 444 5566", "line1": "Rruga Kolë Idromeno 12",
    "city": "Shkodër", "postal_code": "4001", "country_code": "AL"}',
  (SELECT id FROM shipping_methods WHERE code = 'standard'),
  'VJESHTE10',
  '0192f6a0-7c1e-7b3a-9d2e-5a1b2c3d4e5f');

-- Pagesa me kartë, pastaj porosia përgatitet dhe dërgohet (admini: app.user_id → historiku i statusit)
SET LOCAL app.user_id = '1';

INSERT INTO payments (order_id, provider, provider_payment_id, status, amount, currency, method_details, authorized_at, captured_at)
SELECT o.id, 'stripe', 'pi_shembull_3QxM8L', 'captured', o.grand_total, o.currency,
       '{"brand": "visa", "last4": "4242", "exp": "08/29"}', now(), now()
  FROM orders o WHERE o.idempotency_key = '0192f6a0-7c1e-7b3a-9d2e-5a1b2c3d4e5f';

UPDATE orders SET status = 'paid'       WHERE idempotency_key = '0192f6a0-7c1e-7b3a-9d2e-5a1b2c3d4e5f';
UPDATE orders SET status = 'processing' WHERE idempotency_key = '0192f6a0-7c1e-7b3a-9d2e-5a1b2c3d4e5f';

INSERT INTO shipments (order_id, shipping_method_id, carrier, tracking_number, tracking_url, status, shipped_at)
SELECT o.id, o.shipping_method_id, 'Korrier lokal', 'AL2026SH000123', 'https://track.example.al/AL2026SH000123', 'shipped', now()
  FROM orders o WHERE o.idempotency_key = '0192f6a0-7c1e-7b3a-9d2e-5a1b2c3d4e5f';
INSERT INTO shipment_items (shipment_id, order_item_id, quantity)
SELECT s.id, oi.id, oi.quantity FROM shipments s JOIN order_items oi ON oi.order_id = s.order_id;
UPDATE orders SET status = 'shipped' WHERE idempotency_key = '0192f6a0-7c1e-7b3a-9d2e-5a1b2c3d4e5f';

-- Vlerësim nga blerja e verifikuar, me foto
INSERT INTO reviews (product_id, user_id, order_item_id, rating, title, body, status)
SELECT oi.product_id, o.user_id, oi.id, 5, 'Qëndisje e mrekullueshme',
       'Leshi është i ngrohtë dhe qëndisja duket edhe më bukur se në foto.', 'approved'
  FROM order_items oi JOIN orders o ON o.id = oi.order_id
 WHERE oi.sku = 'MD-XHM-ZEZ-M';
INSERT INTO review_images (review_id, storage_key, url)
SELECT id, 'reviews/2026/xhamadan-ben-1.jpg', 'https://cdn.mdon.al/reviews/2026/xhamadan-ben-1.jpg'
  FROM reviews WHERE title = 'Qëndisje e mrekullueshme';

-- Një porosi tjetër si vizitor (pa llogari), dje, në pritje të pagesës në dorëzim
INSERT INTO carts (currency) VALUES ('ALL');
INSERT INTO cart_items (cart_id, variant_id, quantity, price_at_add)
SELECT (SELECT max(id) FROM carts WHERE user_id IS NULL), v.id, 2, v.effective_price
  FROM product_variants v WHERE v.sku = 'ZV-OPG-KAF-40';
SELECT * FROM create_order_from_cart(
  (SELECT max(id) FROM carts WHERE user_id IS NULL),
  'drita@example.com',
  '{"full_name": "Drita Gjoka", "phone": "+355 69 555 1234", "line1": "Rruga e Kavajës 40", "city": "Tiranë", "country_code": "AL"}',
  (SELECT id FROM shipping_methods WHERE code = 'ekspres_tirane'));
UPDATE orders SET placed_at = now() - INTERVAL '1 day' WHERE email = 'drita@example.com';   -- vetëm që raportet të kenë dy ditë

COMMIT;
