-- =============================================================================
--  M'DON — 5 query-t më të rëndësishme
--  Ekzekuto pas 01_schema.sql dhe 02_seed.sql.
--  Në aplikacion parametrat dërgohen gjithmonë si $1, $2… (prepared statements),
--  asnjëherë duke bashkuar tekst: kjo mbron nga SQL injection.
-- =============================================================================

SET TIME ZONE 'Europe/Tirane';   -- raportet ditore sipas orës së Shqipërisë


-- -----------------------------------------------------------------------------
-- 1) FILTRIMI I PRODUKTEVE (faqja e katalogut)
--    Kategoria me të gjitha nënkategoritë + gjinia + çmimi + madhësitë + ngjyrat
--    + marka + atribute JSONB + vetëm në stok, me faqosje "keyset" (pa OFFSET).
--    Parametrat janë në CTE-në "f" që query të ekzekutohet direkt; në aplikacion bëhen $1…$11.
--    Kur trafiku rritet, këtë punë e merr Meilisearch (shih README); ky query mbetet si rezervë.
-- -----------------------------------------------------------------------------
WITH f AS (
  SELECT
    (SELECT id FROM categories WHERE slug = 'femra' AND parent_id IS NULL) AS category_id,  -- "Femra" dhe gjithçka poshtë saj
    NULL::gender_target          AS gender,          -- p.sh. 'femra'
    5000::NUMERIC                AS price_min,
    40000::NUMERIC               AS price_max,
    ARRAY['M', '41']             AS sizes,           -- madhësi rrobash dhe numra këpucësh njëherësh
    NULL::TEXT[]                 AS color_families,  -- p.sh. ARRAY['kuqe', 'zeze']
    NULL::TEXT[]                 AS brands,          -- p.sh. ARRAY['mdon']
    '{"stina": ["vjeshte"]}'::JSONB AS attrs,        -- atributet JSONB (indeksi GIN products_attributes_gin)
    true                         AS in_stock_only,
    NULL::NUMERIC                AS after_price,     -- faqja tjetër: çmimi dhe id e produktit të fundit
    NULL::BIGINT                 AS after_id,
    24                           AS page_size
),
matching AS (   -- variantet që plotësojnë filtrat në nivel varianti
  SELECT v.product_id, v.effective_price, v.sale_price, s.code AS size_code, s.sort_order, c.family
    FROM product_variants v
    CROSS JOIN f
    LEFT JOIN sizes  s ON s.id = v.size_id
    LEFT JOIN colors c ON c.id = v.color_id
   WHERE v.deleted_at IS NULL AND v.is_active
     AND v.effective_price BETWEEN f.price_min AND f.price_max
     AND (f.sizes IS NULL OR s.code = ANY (f.sizes))
     AND (f.color_families IS NULL OR c.family = ANY (f.color_families))
     AND (NOT f.in_stock_only OR v.stock_quantity > v.reserved_quantity)
)
SELECT p.id,
       p.public_id,
       p.slug,
       p.name,
       b.name                                  AS brand,
       min(m.effective_price)                  AS price_from,
       bool_or(m.sale_price IS NOT NULL)       AS on_sale,
       (SELECT array_agg(x.size_code ORDER BY x.sort_order)
          FROM (SELECT DISTINCT m2.size_code, m2.sort_order FROM matching m2 WHERE m2.product_id = p.id) x) AS sizes_available,
       img.url                                 AS image
  FROM products p
  CROSS JOIN f
  JOIN matching m ON m.product_id = p.id
  LEFT JOIN brands b ON b.id = p.brand_id
  LEFT JOIN LATERAL (
    SELECT i.url FROM product_images i
     WHERE i.product_id = p.id AND i.is_primary AND i.deleted_at IS NULL
     ORDER BY i.color_id NULLS LAST LIMIT 1) img ON true
 WHERE p.status = 'active' AND p.deleted_at IS NULL
   AND (f.gender IS NULL OR p.gender IN (f.gender, 'unisex'))
   AND (f.brands IS NULL OR b.slug = ANY (f.brands))
   AND p.attributes @> f.attrs
   AND EXISTS (SELECT 1
                 FROM product_categories pc
                 JOIN categories c ON c.id = pc.category_id
                WHERE pc.product_id = p.id AND c.deleted_at IS NULL
                  AND c.path @> ARRAY[f.category_id])        -- indeksi GIN categories_path_gin
 GROUP BY p.id, b.name, img.url, f.after_price, f.after_id
HAVING f.after_price IS NULL OR (min(m.effective_price), p.id) > (f.after_price, f.after_id)
 ORDER BY price_from, p.id
 LIMIT (SELECT page_size FROM f);


-- -----------------------------------------------------------------------------
-- 2) KRIJIMI I POROSISË (checkout)
--    E gjithë puna bëhet në create_order_from_cart() (01_schema.sql), brenda një transaksioni:
--    bllokon shportën dhe variantet (FOR UPDATE, sipas id), kontrollon stokun, llogarit kuponin
--    dhe transportin, ruan emrin/çmimin e çastit, ul stokun dhe shkruan librin e inventarit.
--
--    Dy klientë blejnë copën e fundit njëkohësisht:
--      Sesioni A                                    Sesioni B
--      BEGIN;                                       BEGIN;
--      SELECT … FOR UPDATE   (bllokon SKU-në)
--                                                   SELECT … FOR UPDATE   ← PRET këtu
--      stoku 1 → 0, INSERT porosia; COMMIT;
--                                                   zgjohet, sheh stokun 0
--                                                   → "Stok i pamjaftueshëm" → ROLLBACK
--    Vetëm një porosi kalon. Të dy sesionet bllokojnë variantet në të njëjtin rend (ORDER BY id),
--    prandaj nuk krijohet deadlock edhe kur shportat kanë disa produkte të njëjta.
-- -----------------------------------------------------------------------------
BEGIN;
SET LOCAL app.user_id = '2';                     -- kush po vepron (për historikun e statusit)

INSERT INTO carts (user_id, currency) SELECT id, 'ALL' FROM users WHERE email = 'ben.kola@example.com';
INSERT INTO cart_items (cart_id, variant_id, quantity, price_at_add)
SELECT c.id, v.id, 1, v.effective_price
  FROM carts c, product_variants v
 WHERE c.user_id = (SELECT id FROM users WHERE email = 'ben.kola@example.com') AND c.status = 'active'
   AND v.sku = 'MD-XHM-BAR-L';

SELECT *
  FROM create_order_from_cart(
         p_cart_id            => (SELECT id FROM carts WHERE user_id = (SELECT id FROM users WHERE email = 'ben.kola@example.com') AND status = 'active'),
         p_email              => 'ben.kola@example.com',
         p_shipping_address   => '{"full_name": "Ben Kola", "line1": "Rruga Kolë Idromeno 12", "city": "Shkodër", "country_code": "AL"}',
         p_shipping_method_id => (SELECT id FROM shipping_methods WHERE code = 'ekspres_tirane'),
         p_coupon_code        => 'FALAS',                                     -- kupon dërgese falas
         p_idempotency_key    => '0192f6a1-0000-7000-8000-00000000c0de');     -- vjen nga shfletuesi, një për çdo klikim "Paguaj"
COMMIT;


-- -----------------------------------------------------------------------------
-- 3) ULJA E STOKUT (shitje në dyqanin fizik, dëmtim, korrigjim)
-- -----------------------------------------------------------------------------

-- 3a. Një hap, atomik: UPDATE i kushtëzuar + regjistrim në libër, në një query.
--     Nëse dy arka shesin copën e fundit njëkohësisht, e dyta pret bllokimin e rreshtit,
--     rivlerëson kushtin "stoku mjafton" mbi vlerën e re dhe nuk ndryshon asgjë (0 rreshta).
WITH sold AS (
  UPDATE product_variants
     SET stock_quantity = stock_quantity - 1
   WHERE sku = 'ZV-OPG-KAF-42'
     AND deleted_at IS NULL
     AND stock_quantity - reserved_quantity >= 1
  RETURNING id, stock_quantity
)
INSERT INTO inventory_movements (variant_id, type, quantity_change, stock_after, note, reference)
SELECT id, 'sale_out', -1, stock_quantity, 'Shitje në dyqanin fizik, Tiranë', 'POS-TR-000881'
  FROM sold
RETURNING variant_id, stock_after;            -- 0 rreshta = nuk kishte stok, nuk u shit asgjë

-- 3b. Me SELECT … FOR UPDATE, kur duhet logjikë mes leximit dhe shkrimit
--     (p.sh. kthim malli i dëmtuar: kontrollo, pastaj ul stokun e disa SKU-ve bashkë)
BEGIN;
SELECT id, sku, stock_quantity, reserved_quantity
  FROM product_variants
 WHERE sku IN ('MD-FST-ZEZ-S', 'MD-FST-ZEZ-M')
 ORDER BY id                                  -- gjithmonë i njëjti rend → pa deadlock
   FOR UPDATE;                                -- askush tjetër nuk i ndryshon deri në COMMIT
SELECT adjust_stock(id, -1, 'damaged', NULL, 'Dëmtuar gjatë transportit nga furnitori', 1, 'RAP-2026-014')
  FROM product_variants WHERE sku IN ('MD-FST-ZEZ-S', 'MD-FST-ZEZ-M') ORDER BY id;
COMMIT;


-- -----------------------------------------------------------------------------
-- 4) RAPORTET E SHITJEVE
--    Pa porositë e anuluara/rimbursuara plotësisht. Indeksi BRIN orders_placed_brin
--    i bën intervalet e datave të shpejta edhe me qindra miliona porosi.
-- -----------------------------------------------------------------------------

-- 4a. Shitjet ditore për 30 ditët e fundit (edhe ditët pa shitje dalin me 0)
WITH d AS (SELECT g::date AS dita FROM generate_series(current_date - 29, current_date, INTERVAL '1 day') AS g)
SELECT d.dita,
       count(o.id)                            AS porosi,
       coalesce(sum(o.grand_total), 0)        AS te_ardhurat,
       round(avg(o.grand_total), 2)           AS vlera_mesatare,
       coalesce(sum(o.discount_total), 0)     AS zbritje
  FROM d
  LEFT JOIN orders o
         ON o.placed_at >= d.dita AND o.placed_at < d.dita + 1
        AND o.status NOT IN ('cancelled', 'refunded')
 GROUP BY d.dita
 ORDER BY d.dita DESC;

-- 4b. Të ardhurat sipas kategorisë kryesore (Meshkuj / Femra / Fëmijë) këtë muaj
SELECT root.name                 AS kategoria,
       sum(oi.quantity)          AS cope,
       sum(oi.line_total)        AS te_ardhurat,
       round(100 * sum(oi.line_total) / sum(sum(oi.line_total)) OVER (), 1) AS perqindja
  FROM order_items oi
  JOIN orders o              ON o.id = oi.order_id
  JOIN product_categories pc ON pc.product_id = oi.product_id AND pc.is_primary
  JOIN categories c          ON c.id = pc.category_id
  JOIN categories root       ON root.id = c.path[1]
 WHERE o.status NOT IN ('cancelled', 'refunded')
   AND o.placed_at >= date_trunc('month', now())
 GROUP BY root.name
 ORDER BY te_ardhurat DESC;

-- 4c. Muaj pas muaji, me rritjen në përqindje
SELECT muaji,
       porosi,
       te_ardhurat,
       round(100 * (te_ardhurat - lag(te_ardhurat) OVER w) / nullif(lag(te_ardhurat) OVER w, 0), 1) AS rritja_pct
  FROM (SELECT date_trunc('month', placed_at)::date AS muaji, count(*) AS porosi, sum(grand_total) AS te_ardhurat
          FROM orders
         WHERE status NOT IN ('cancelled', 'refunded')
           AND placed_at >= date_trunc('month', now()) - INTERVAL '11 months'
         GROUP BY 1) m
WINDOW w AS (ORDER BY muaji)
 ORDER BY muaji DESC;


-- -----------------------------------------------------------------------------
-- 5) PRODUKTET MË TË SHITURA (30 ditët e fundit)
--    Me të ardhurat, madhësinë që shitet më shumë dhe stokun që ka mbetur
-- -----------------------------------------------------------------------------
SELECT rank() OVER (ORDER BY sum(oi.quantity) DESC)                AS renditja,
       p.name                                                      AS produkti,
       sum(oi.quantity)                                            AS cope_te_shitura,
       sum(oi.line_total)                                          AS te_ardhurat,
       count(DISTINCT oi.order_id)                                 AS porosi,
       mode() WITHIN GROUP (ORDER BY oi.variant_label)             AS varianti_me_i_shitur,
       (SELECT sum(v.stock_quantity - v.reserved_quantity)
          FROM product_variants v
         WHERE v.product_id = p.id AND v.deleted_at IS NULL)       AS stoku_ne_dispozicion
  FROM order_items oi
  JOIN orders o   ON o.id = oi.order_id
  JOIN products p ON p.id = oi.product_id
 WHERE o.status NOT IN ('cancelled', 'refunded')
   AND o.placed_at >= now() - INTERVAL '30 days'
 GROUP BY p.id, p.name
 ORDER BY cope_te_shitura DESC, te_ardhurat DESC
 LIMIT 10;
