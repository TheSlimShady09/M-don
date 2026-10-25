-- =============================================================================
--  M'DON — Particionimi i porosive sipas muajit (kur tabela kalon ~50–100 milionë rreshta)
--  Ky skedar është SHEMBULL në skemën më vete "particionim", që të mos prekë tabelat kryesore.
--  Kalimi i tabelës reale bëhet me një migrim (krijo tabelën e particionuar, kopjo në grupe, ndërro emrat).
--
--  Pse:
--  - Query-t me interval datash lexojnë vetëm muajt që duhen (partition pruning).
--  - VACUUM dhe indekset punojnë mbi copa të vogla; muajt e vjetër nuk preken më.
--  - Arkivimi bëhet në sekonda: DETACH PARTITION + eksport, pa DELETE të madh.
--
--  Çmimi:
--  - Çelësi primar dhe çdo UNIQUE duhet të përfshijnë kolonën e particionimit (placed_at).
--  - order_items mban edhe order_placed_at, që çelësi i huaj të tregojë (id, placed_at).
--  - order_number mbetet unik përmes formatit MD-VVVV-NNNNNNN nga sekuenca, dhe një UNIQUE (order_number, placed_at).
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS particionim;

CREATE TABLE particionim.orders (
  id             BIGINT GENERATED ALWAYS AS IDENTITY,   -- identity në tabela të particionuara: PostgreSQL 17+
  public_id      UUID NOT NULL DEFAULT uuidv7(),
  order_number   TEXT NOT NULL,
  user_id        BIGINT,
  status         order_status NOT NULL DEFAULT 'pending_payment',
  grand_total    money_amount NOT NULL,
  currency       currency_code NOT NULL,
  placed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, placed_at),
  UNIQUE (order_number, placed_at)
) PARTITION BY RANGE (placed_at);

CREATE TABLE particionim.order_items (
  id              BIGINT GENERATED ALWAYS AS IDENTITY,
  order_id        BIGINT NOT NULL,
  order_placed_at TIMESTAMPTZ NOT NULL,                 -- kopje e orders.placed_at, për çelësin e huaj dhe particionin
  sku             TEXT NOT NULL,
  product_name    TEXT NOT NULL,
  unit_price      price_amount NOT NULL,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (id, order_placed_at),
  FOREIGN KEY (order_id, order_placed_at) REFERENCES particionim.orders (id, placed_at) ON DELETE CASCADE
) PARTITION BY RANGE (order_placed_at);

-- Indekset krijohen një herë në prind dhe trashëgohen nga çdo muaj
CREATE INDEX ON particionim.orders (user_id, placed_at DESC);
CREATE INDEX ON particionim.orders (status, placed_at DESC);
CREATE INDEX ON particionim.order_items (order_id, order_placed_at);

-- Krijon particionin e një muaji për të dyja tabelat (në prodhim: pg_partman ose një cron çdo muaj)
CREATE FUNCTION particionim.create_month(p_month DATE) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  m_start DATE := date_trunc('month', p_month)::date;
  m_end   DATE := (date_trunc('month', p_month) + INTERVAL '1 month')::date;
  suffix  TEXT := to_char(m_start, 'YYYY_MM');
BEGIN
  EXECUTE format('CREATE TABLE IF NOT EXISTS particionim.orders_%s PARTITION OF particionim.orders FOR VALUES FROM (%L) TO (%L)',
                 suffix, m_start, m_end);
  EXECUTE format('CREATE TABLE IF NOT EXISTS particionim.order_items_%s PARTITION OF particionim.order_items FOR VALUES FROM (%L) TO (%L)',
                 suffix, m_start, m_end);
END $$;

-- Muaji i kaluar, ky muaj dhe dy të ardhshmit; "default" kap çdo datë të papritur (nuk humbet asnjë porosi)
SELECT particionim.create_month((date_trunc('month', now()) + make_interval(months => m))::date)
  FROM generate_series(-1, 2) AS m;
CREATE TABLE particionim.orders_default      PARTITION OF particionim.orders      DEFAULT;
CREATE TABLE particionim.order_items_default PARTITION OF particionim.order_items DEFAULT;

-- Provë: dy porosi në muaj të ndryshëm
WITH o AS (
  INSERT INTO particionim.orders (order_number, grand_total, currency, placed_at) VALUES
    ('MD-2026-0900001', 24900, 'ALL', date_trunc('month', now()) - INTERVAL '10 days'),
    ('MD-2026-1000001', 32500, 'ALL', now())
  RETURNING id, placed_at, grand_total
)
INSERT INTO particionim.order_items (order_id, order_placed_at, sku, product_name, unit_price, quantity)
SELECT id, placed_at, 'MD-XHM-ZEZ-M', 'Xhamadan i qëndisur', grand_total, 1 FROM o;

-- Ku ra çdo porosi
SELECT tableoid::regclass AS particioni, order_number, placed_at FROM particionim.orders ORDER BY placed_at;

-- Arkivimi i një muaji të vjetër (pa DELETE): shkëpute, eksportoje, fshije më vonë
--   ALTER TABLE particionim.orders DETACH PARTITION particionim.orders_2024_01 CONCURRENTLY;
