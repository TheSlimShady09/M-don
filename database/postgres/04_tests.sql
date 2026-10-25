-- =============================================================================
--  M'DON — Kontrollet e rregullave: çdo test provon diçka të ndaluar dhe pret refuzim.
--  Ekzekuto pas 02_seed.sql. Gjithçka bëhet brenda një transaksioni që në fund kthehet
--  mbrapsht (ROLLBACK): databaza mbetet e paprekur.
--  Rezultati: tabela test_results; çdo rresht duhet të jetë ok = true.
-- =============================================================================

BEGIN;

CREATE TEMP TABLE test_results (nr INT, testi TEXT, ok BOOLEAN, detaj TEXT);

-- Ndihmës: ekzekuto një urdhër që DUHET të dështojë
CREATE FUNCTION pg_temp.expect_error(p_nr INT, p_name TEXT, p_sql TEXT, p_pattern TEXT) RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE p_sql;
    INSERT INTO test_results VALUES (p_nr, p_name, false, 'U pranua, por duhej refuzuar');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO test_results VALUES (p_nr, p_name, SQLERRM ~* p_pattern, SQLERRM);
  END;
END $$;

-- Ndihmës: shportë e re me një variant (klient vizitor)
CREATE FUNCTION pg_temp.cart_with(p_sku TEXT, p_qty INT) RETURNS BIGINT LANGUAGE plpgsql AS $$
DECLARE v_cart BIGINT;
BEGIN
  INSERT INTO carts (currency) VALUES ('ALL') RETURNING id INTO v_cart;
  INSERT INTO cart_items (cart_id, variant_id, quantity, price_at_add)
  SELECT v_cart, id, p_qty, effective_price FROM product_variants WHERE sku = p_sku;
  RETURN v_cart;
END $$;

-- 1. Dy klientë duan copën e fundit (MD-FST-KUQ-L ka 1 copë): i pari blen, i dyti refuzohet.
--    Në prodhim ata vijnë njëkohësisht; FOR UPDATE e bën të dytin të presë dhe pastaj të shohë stokun 0.
DO $$
DECLARE a BIGINT := pg_temp.cart_with('MD-FST-KUQ-L', 1);
        b BIGINT := pg_temp.cart_with('MD-FST-KUQ-L', 1);
BEGIN
  PERFORM create_order_from_cart(a, 'klienti.a@example.com', '{"city": "Tiranë"}', 1::SMALLINT);
  PERFORM pg_temp.expect_error(1, 'Copa e fundit shitet vetëm një herë',
    format($q$SELECT create_order_from_cart(%s, 'klienti.b@example.com', '{"city": "Durrës"}', 1::SMALLINT)$q$, b),
    'Stok i pamjaftueshëm');
END $$;

-- 2. Stoku nuk mund të shkojë nën zero, edhe me UPDATE të drejtpërdrejtë
--    (refuzohet nga variants_stock_not_negative ose variants_reserved_valid, cilido kontrollohet i pari)
SELECT pg_temp.expect_error(2, 'CHECK: stoku >= 0',
  $q$UPDATE product_variants SET stock_quantity = -1 WHERE sku = 'ZV-OPG-KAF-38'$q$, 'variants_stock_not_negative|variants_reserved_valid');

-- 3. adjust_stock() refuzon daljen më të madhe se stoku
SELECT pg_temp.expect_error(3, 'adjust_stock: dalje > stoku',
  $q$SELECT adjust_stock((SELECT id FROM product_variants WHERE sku = 'ZV-OPG-KAF-43'), -5, 'sale_out')$q$, 'Stok i pamjaftueshëm');

-- 4. Çmimi duhet > 0 dhe çmimi me zbritje < çmimi
SELECT pg_temp.expect_error(4, 'CHECK: çmimi > 0',
  $q$UPDATE product_variants SET price = 0 WHERE sku = 'ZV-OPG-KAF-38'$q$, 'price_amount|check');
SELECT pg_temp.expect_error(5, 'CHECK: zbritja < çmimi',
  $q$UPDATE product_variants SET sale_price = price WHERE sku = 'ZV-OPG-KAF-38'$q$, 'variants_sale_below_price');

-- 6. SKU unik
SELECT pg_temp.expect_error(6, 'UNIQUE: SKU',
  $q$INSERT INTO product_variants (product_id, sku, price, currency) SELECT product_id, sku, 100, 'ALL' FROM product_variants WHERE sku = 'ZV-OPG-KAF-38'$q$,
  'variants_sku_uq');

-- 7. Kalim i palejuar i statusit (porosia e dërguar nuk kthehet në "në pritje të pagesës")
SELECT pg_temp.expect_error(7, 'Statusi: shipped → pending_payment',
  $q$UPDATE orders SET status = 'pending_payment' WHERE status = 'shipped'$q$, 'Kalim i palejuar');

-- 8. Rimbursimet nuk kalojnë shumën e paguar (60.420 L): 60.000 kalon, 1.000 më shumë jo
INSERT INTO refunds (payment_id, order_id, amount, reason, status)
SELECT id, order_id, 60000, 'Kthim i pjesshëm', 'succeeded' FROM payments LIMIT 1;
SELECT pg_temp.expect_error(8, 'Rimbursimi > shuma e paguar',
  $q$INSERT INTO refunds (payment_id, order_id, amount, reason) SELECT id, order_id, 1000, 'Tepër' FROM payments LIMIT 1$q$,
  'kalojnë shumën e paguar');

-- 9. Libri i inventarit është vetëm për shtim
SELECT pg_temp.expect_error(9, 'inventory_movements nuk ndryshohet',
  $q$UPDATE inventory_movements SET quantity_change = 100 WHERE id = (SELECT min(id) FROM inventory_movements)$q$, 'vetëm për shtim');

-- 10. Kategoria nuk mund të vendoset nën nënkategorinë e vet (cikël)
SELECT pg_temp.expect_error(10, 'Kategori: pa cikle',
  $q$UPDATE categories SET parent_id = (SELECT id FROM categories WHERE slug = 'fustane') WHERE slug = 'femra' AND parent_id IS NULL$q$,
  'Cikël');

-- 11. Kuponi nuk kalon limitin e përdorimeve
UPDATE coupons SET usage_limit = times_used WHERE code = 'VJESHTE10';
SELECT pg_temp.expect_error(11, 'Kuponi: limiti i përdorimeve',
  $q$UPDATE coupons SET times_used = times_used + 1 WHERE code = 'VJESHTE10'$q$, 'coupons_within_limit');

-- 12. Vlerësimi 1–5
SELECT pg_temp.expect_error(12, 'CHECK: vlerësimi 1–5',
  $q$INSERT INTO reviews (product_id, rating) SELECT id, 6 FROM products LIMIT 1$q$, 'rating');

-- 13. E njëjta kërkesë porosie dy herë (idempotency) → një porosi e vetme
DO $$
DECLARE c BIGINT := pg_temp.cart_with('ZV-OPG-KAF-39', 1);
        first_id BIGINT; second_id BIGINT;
BEGIN
  SELECT order_id INTO first_id  FROM create_order_from_cart(c, 'x@example.com', '{"city": "Vlorë"}', 1::SMALLINT, NULL, '0192f6a2-0000-7000-8000-000000000013');
  SELECT order_id INTO second_id FROM create_order_from_cart(c, 'x@example.com', '{"city": "Vlorë"}', 1::SMALLINT, NULL, '0192f6a2-0000-7000-8000-000000000013');
  INSERT INTO test_results VALUES (13, 'Idempotency: i njëjti çelës = e njëjta porosi', first_id = second_id, format('porosia %s dhe %s', first_id, second_id));
END $$;

-- 14. Zhvendosja e një kategorie përditëson rrugën e gjithë nënpemës
--     (Femra > Veshje zhvendoset nën një kategori të re "Arkiv"; Fustane duhet ta ndjekë)
DO $$
DECLARE moved BIGINT[];
        archive BIGINT;
BEGIN
  INSERT INTO categories (name, slug) VALUES ('Arkiv', 'arkiv') RETURNING id INTO archive;
  UPDATE categories SET parent_id = archive
   WHERE slug = 'veshje' AND parent_id = (SELECT id FROM categories WHERE slug = 'femra' AND parent_id IS NULL);
  SELECT path INTO moved FROM categories WHERE slug = 'fustane';
  INSERT INTO test_results VALUES (14, 'Kategori: nënpema ndjek prindin', moved[1] = archive AND cardinality(moved) = 3, moved::TEXT);
END $$;

-- 16. Slug unik brenda të njëjtit prind (Fëmijë ka tashmë "Veshje")
SELECT pg_temp.expect_error(16, 'UNIQUE: slug brenda prindit',
  $q$INSERT INTO categories (parent_id, name, slug) SELECT id, 'Veshje', 'veshje' FROM categories WHERE slug = 'femije' AND parent_id IS NULL$q$,
  'categories_parent_slug_uq');

-- 15. Stoku i çdo varianti = shuma e lëvizjeve në libër
INSERT INTO test_results
SELECT 15, 'Libri i inventarit përputhet me stokun', bool_and(v.stock_quantity = coalesce(m.total, 0)),
       count(*) FILTER (WHERE v.stock_quantity <> coalesce(m.total, 0)) || ' mospërputhje'
  FROM product_variants v
  LEFT JOIN (SELECT variant_id, sum(quantity_change) AS total FROM inventory_movements GROUP BY variant_id) m ON m.variant_id = v.id;

SELECT nr, testi, ok, left(detaj, 90) AS detaj FROM test_results ORDER BY nr;

ROLLBACK;
