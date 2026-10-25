-- =============================================================================
--  M'DON — Skema e databazës PostgreSQL për një e-commerce të madh rrobash
--  Synon: PostgreSQL 18 (në 15–17 zëvendëso uuidv7() me gen_random_uuid())
--
--  Rendi i ekzekutimit:  01_schema.sql → 02_seed.sql → 03_queries.sql
--
--  ÇELËSAT PRIMARË: BIGINT + UUID publik
--  - Brenda databazës çdo tabelë ka BIGINT GENERATED ALWAYS AS IDENTITY:
--    8 bajt (UUID = 16), indekse më të vogla, JOIN-e më të shpejta dhe futje
--    në rend në B-tree. Kjo ka rëndësi te tabelat që rriten shpejt
--    (order_items, inventory_movements, cart_items).
--  - Entitetet që dalin jashtë (URL, API, email: users, products, carts, orders)
--    kanë edhe public_id UUIDv7, i rregulluar sipas kohës (nuk e fragmenton
--    indeksin si UUIDv4) dhe i pamundur për t'u hamendësuar: askush nuk mund
--    të provojë /porosia/1001, /porosia/1002…
--  - UUIDv7 si çelës primar vlen kur ID-të krijohen jashtë databazës ose kur
--    shkruhet në disa rajone njëkohësisht; për një databazë kryesore, BIGINT
--    është më i lehtë dhe më i shpejtë.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS citext;   -- email dhe kode kuponi pa dallim shkronjash të mëdha/vogla
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- kërkim i përafërt me gabime shkrimi ("xhamdan" → "xhamadan")

-- -----------------------------------------------------------------------------
-- Llojet e numëruara (ENUM): vlera të kufizuara, 4 bajt, të lexueshme në query.
-- Vlera të reja shtohen me: ALTER TYPE order_status ADD VALUE '...';
-- -----------------------------------------------------------------------------
CREATE TYPE product_status   AS ENUM ('draft', 'active', 'archived');
CREATE TYPE gender_target    AS ENUM ('meshkuj', 'femra', 'femije', 'unisex');
CREATE TYPE size_system      AS ENUM ('rroba', 'kepuce', 'femije', 'universale');
CREATE TYPE cart_status      AS ENUM ('active', 'converted', 'abandoned');
CREATE TYPE order_status     AS ENUM ('pending_payment', 'paid', 'processing', 'shipped', 'delivered',
                                      'cancelled', 'partially_refunded', 'refunded');
CREATE TYPE payment_provider AS ENUM ('stripe', 'pok', 'paypal', 'bank_transfer', 'cash_on_delivery');
CREATE TYPE payment_status   AS ENUM ('pending', 'authorized', 'captured', 'failed', 'cancelled',
                                      'partially_refunded', 'refunded');
CREATE TYPE refund_status    AS ENUM ('pending', 'succeeded', 'failed');
CREATE TYPE shipment_status  AS ENUM ('pending', 'packed', 'shipped', 'in_transit', 'delivered', 'returned', 'lost');
CREATE TYPE discount_type    AS ENUM ('percent', 'fixed_amount', 'free_shipping');
CREATE TYPE discount_scope   AS ENUM ('order', 'products', 'categories', 'collections', 'brands');
CREATE TYPE review_status    AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE movement_type    AS ENUM ('purchase_in',  -- hyrje nga furnitori
                                      'sale_out',     -- shitje
                                      'return_in',    -- kthim nga klienti
                                      'cancel_in',    -- porosi e anuluar, malli kthehet në stok
                                      'damaged',      -- i dëmtuar / i humbur
                                      'adjustment');  -- korrigjim pas numërimit fizik

-- Paratë: NUMERIC (asnjëherë FLOAT, që nuk paraqet saktë 0.1)
CREATE DOMAIN money_amount  AS NUMERIC(12, 2) CHECK (VALUE >= 0);
CREATE DOMAIN price_amount  AS NUMERIC(12, 2) CHECK (VALUE > 0);
CREATE DOMAIN currency_code AS CHAR(3) DEFAULT 'ALL' CHECK (VALUE ~ '^[A-Z]{3}$');
CREATE DOMAIN slug_text     AS TEXT CHECK (VALUE ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
CREATE DOMAIN https_url     AS TEXT CHECK (VALUE ~ '^https://');

-- updated_at mbahet nga databaza, jo nga aplikacioni (triggeri vendoset në fund të skedarit)
CREATE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;


-- =============================================================================
-- 1. PËRDORUESIT DHE ROLET
-- =============================================================================

CREATE TABLE roles (
  id          SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE CHECK (code ~ '^[a-z_]+$'),   -- 'admin', 'klient', 'magazinier'
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  public_id         UUID NOT NULL DEFAULT uuidv7() UNIQUE,
  email             CITEXT NOT NULL,
  password_hash     TEXT,                         -- argon2id; NULL për llogari vetëm me Google/Apple
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  phone             TEXT,
  locale            TEXT NOT NULL DEFAULT 'sq' CHECK (locale IN ('sq', 'en')),
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  email_verified_at TIMESTAMPTZ,
  last_login_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ,                  -- fshirje e butë (soft delete)
  CONSTRAINT users_email_format CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  CONSTRAINT users_phone_format CHECK (phone IS NULL OR phone ~ '^\+?[0-9 ()-]{6,20}$')
);
-- Email unik vetëm mes llogarive aktive: pas fshirjes, i njëjti email mund të regjistrohet sërish
CREATE UNIQUE INDEX users_email_active_uq ON users (email) WHERE deleted_at IS NULL;

-- Një përdorues mund të ketë disa role (p.sh. klient + magazinier)
CREATE TABLE user_roles (
  user_id    BIGINT   NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role_id    SMALLINT NOT NULL REFERENCES roles (id) ON DELETE RESTRICT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE addresses (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id             BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  label               TEXT,                       -- "Shtëpia", "Puna"
  full_name           TEXT NOT NULL,
  phone               TEXT NOT NULL,
  line1               TEXT NOT NULL,
  line2               TEXT,
  city                TEXT NOT NULL,
  region              TEXT,                       -- qarku
  postal_code         TEXT,
  country_code        CHAR(2) NOT NULL DEFAULT 'AL' CHECK (country_code ~ '^[A-Z]{2}$'),
  is_default_shipping BOOLEAN NOT NULL DEFAULT false,
  is_default_billing  BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);
-- Vetëm një adresë e paracaktuar për dërgesë dhe një për faturim për çdo përdorues
CREATE UNIQUE INDEX addresses_default_shipping_uq ON addresses (user_id) WHERE is_default_shipping AND deleted_at IS NULL;
CREATE UNIQUE INDEX addresses_default_billing_uq  ON addresses (user_id) WHERE is_default_billing  AND deleted_at IS NULL;
CREATE INDEX addresses_user_idx ON addresses (user_id) WHERE deleted_at IS NULL;


-- =============================================================================
-- 2. KATALOGU: MARKA, KATEGORI, KOLEKSIONE, ETIKETA, MADHËSI, NGJYRA
-- =============================================================================

CREATE TABLE brands (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        slug_text NOT NULL,
  description TEXT,
  logo_url    https_url,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);
CREATE UNIQUE INDEX brands_slug_uq ON brands (slug) WHERE deleted_at IS NULL;

-- Kategori hierarkike: Femra > Veshje > Fustane
--   parent_id: lidhja me prindin
--   path:      [id_rrënjës, …, id_prindit, id_vetes], e mbushur nga triggeri
--   "Gjithçka nën Femra" = WHERE path @> ARRAY[id_femra]  (indeks GIN, pa rekursion)
CREATE TABLE categories (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_id   BIGINT REFERENCES categories (id) ON DELETE RESTRICT,
  name        TEXT NOT NULL,
  slug        slug_text NOT NULL,
  path        BIGINT[] NOT NULL DEFAULT '{}',
  position    INTEGER NOT NULL DEFAULT 0,          -- renditja në menu
  description TEXT,
  image_url   https_url,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ,
  CONSTRAINT categories_not_own_parent CHECK (parent_id IS NULL OR parent_id <> id)
);
-- Slug unik brenda të njëjtit prind (/femra/veshje dhe /meshkuj/veshje lejohen)
CREATE UNIQUE INDEX categories_parent_slug_uq ON categories (parent_id, slug) NULLS NOT DISTINCT WHERE deleted_at IS NULL;
CREATE INDEX categories_path_gin  ON categories USING GIN (path);
CREATE INDEX categories_parent_idx ON categories (parent_id, position) WHERE deleted_at IS NULL;

CREATE FUNCTION categories_set_path() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  parent_path BIGINT[];
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.path := ARRAY[NEW.id];
  ELSE
    SELECT path INTO parent_path FROM categories WHERE id = NEW.parent_id;
    IF parent_path IS NULL THEN
      RAISE EXCEPTION 'Kategoria prind % nuk ekziston', NEW.parent_id;
    END IF;
    IF NEW.id = ANY (parent_path) THEN
      RAISE EXCEPTION 'Cikël në hierarki: kategoria % nuk mund të vendoset nën vetveten', NEW.id;
    END IF;
    NEW.path := parent_path || NEW.id;
  END IF;
  RETURN NEW;
END $$;

-- Kur zhvendoset një kategori, i gjithë nënpema merr rrugën e re
CREATE FUNCTION categories_move_subtree() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.path IS DISTINCT FROM OLD.path THEN
    UPDATE categories
       SET path = NEW.path || path[cardinality(OLD.path) + 1 :]
     WHERE path @> ARRAY[OLD.id] AND id <> NEW.id;
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER categories_path_biu BEFORE INSERT OR UPDATE OF parent_id ON categories
  FOR EACH ROW EXECUTE FUNCTION categories_set_path();
CREATE TRIGGER categories_path_au AFTER UPDATE OF parent_id ON categories
  FOR EACH ROW EXECUTE FUNCTION categories_move_subtree();

CREATE TABLE collections (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name           TEXT NOT NULL,
  slug           slug_text NOT NULL,
  description    TEXT,
  hero_image_url https_url,
  starts_at      TIMESTAMPTZ,
  ends_at        TIMESTAMPTZ,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ,
  CONSTRAINT collections_dates CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);
CREATE UNIQUE INDEX collections_slug_uq ON collections (slug) WHERE deleted_at IS NULL;

CREATE TABLE tags (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       TEXT NOT NULL,
  slug       slug_text NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX tags_slug_uq ON tags (slug) WHERE deleted_at IS NULL;

-- Madhësitë si tabelë: renditja e saktë në filtra (XS < S < M…), jo alfabetike
CREATE TABLE sizes (
  id         SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  system     size_system NOT NULL,
  code       TEXT NOT NULL,          -- 'M', '42', '6-7v'
  label      TEXT NOT NULL,          -- teksti që shfaqet
  sort_order SMALLINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (system, code)
);

-- Ngjyrat: emri i markës + "familja" për filtër ("Bordo" dhe "Gjak" → kuqe)
CREATE TABLE colors (
  id         SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,   -- 'E zezë'
  family     TEXT NOT NULL,          -- 'zeze', 'kuqe', 'bardhe', 'kafe'…
  hex        CHAR(7) CHECK (hex ~ '^#[0-9A-Fa-f]{6}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 3. PRODUKTET DHE VARIANTET (stoku dhe çmimi jetojnë te varianti = SKU)
-- =============================================================================

CREATE TABLE products (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  public_id       UUID NOT NULL DEFAULT uuidv7() UNIQUE,
  brand_id        BIGINT REFERENCES brands (id) ON DELETE RESTRICT,
  name            TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 200),
  slug            slug_text NOT NULL,
  description     TEXT,
  gender          gender_target NOT NULL,
  status          product_status NOT NULL DEFAULT 'draft',
  -- Atribute fleksibël, p.sh.:
  -- {"perberja": {"lesh": 80, "mendafsh": 20}, "larja": ["30°C", "Mos përdor tharëse"],
  --  "stina": ["vjeshte", "dimer"], "origjina": "Shkodër"}
  attributes      JSONB NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(attributes) = 'object'),
  seo_title       TEXT,
  seo_description TEXT,
  published_at    TIMESTAMPTZ,
  -- Kërkim tekstual në PostgreSQL (rezervë/fallback për Meilisearch); 'simple' sepse nuk ka fjalor shqip
  search_vector   TSVECTOR GENERATED ALWAYS AS (
                    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
                    setweight(to_tsvector('simple', coalesce(description, '')), 'B')
                  ) STORED,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,
  CONSTRAINT products_active_is_published CHECK (status <> 'active' OR published_at IS NOT NULL)
);
CREATE UNIQUE INDEX products_slug_uq ON products (slug) WHERE deleted_at IS NULL;

-- Një produkt mund të jetë në disa kategori (p.sh. Opinga: Femra > Këpucë dhe Meshkuj > Këpucë);
-- njëra është kryesorja, për breadcrumb dhe URL kanonik
CREATE TABLE product_categories (
  product_id  BIGINT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
  is_primary  BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (product_id, category_id)
);
CREATE UNIQUE INDEX product_categories_one_primary ON product_categories (product_id) WHERE is_primary;

CREATE TABLE collection_products (
  collection_id BIGINT NOT NULL REFERENCES collections (id) ON DELETE CASCADE,
  product_id    BIGINT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  position      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, product_id)
);

CREATE TABLE product_tags (
  product_id BIGINT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  tag_id     BIGINT NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);

-- Varianti = një SKU i shitshëm: madhësi × ngjyrë × material, me çmimin dhe stokun e vet
CREATE TABLE product_variants (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id          BIGINT NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  sku                 TEXT NOT NULL CHECK (sku ~ '^[A-Z0-9][A-Z0-9-]{2,63}$'),
  barcode             TEXT CHECK (barcode ~ '^[0-9]{8,14}$'),        -- EAN/UPC
  size_id             SMALLINT REFERENCES sizes (id) ON DELETE RESTRICT,
  color_id            SMALLINT REFERENCES colors (id) ON DELETE RESTRICT,
  material            TEXT,
  price               price_amount NOT NULL,                          -- çmimi i rregullt
  sale_price          price_amount,                                   -- çmimi me zbritje (NULL = pa zbritje)
  effective_price     NUMERIC(12, 2) GENERATED ALWAYS AS (coalesce(sale_price, price)) STORED,
  currency            currency_code NOT NULL,
  stock_quantity      INTEGER NOT NULL DEFAULT 0,
  reserved_quantity   INTEGER NOT NULL DEFAULT 0,                     -- mbajtur për checkout në pritje
  low_stock_threshold INTEGER NOT NULL DEFAULT 3 CHECK (low_stock_threshold >= 0),
  weight_grams        INTEGER CHECK (weight_grams > 0),
  position            INTEGER NOT NULL DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ,
  CONSTRAINT variants_stock_not_negative   CHECK (stock_quantity >= 0),
  CONSTRAINT variants_reserved_valid       CHECK (reserved_quantity >= 0 AND reserved_quantity <= stock_quantity),
  CONSTRAINT variants_sale_below_price     CHECK (sale_price IS NULL OR sale_price < price)
) WITH (fillfactor = 85);  -- hapësirë në faqe që ndryshimet e stokut të bëhen si HOT update (pa prekur indekset)

-- SKU unik përgjithmonë (edhe pas fshirjes së butë, që historiku i porosive të mbetet i qartë)
CREATE UNIQUE INDEX variants_sku_uq      ON product_variants (sku);
CREATE UNIQUE INDEX variants_barcode_uq  ON product_variants (barcode) WHERE barcode IS NOT NULL;
-- E njëjta kombinim madhësi/ngjyrë/material nuk mund të ekzistojë dy herë për një produkt
CREATE UNIQUE INDEX variants_combination_uq ON product_variants (product_id, size_id, color_id, material)
  NULLS NOT DISTINCT WHERE deleted_at IS NULL;

CREATE TABLE product_images (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id  BIGINT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  color_id    SMALLINT REFERENCES colors (id) ON DELETE SET NULL,     -- NULL = foto e përgjithshme
  storage_key TEXT NOT NULL,          -- çelësi në S3/R2: products/2026/xhamadan-zeze-1.jpg
  url         https_url NOT NULL,     -- adresa publike në CDN
  alt_text    TEXT,
  width       INTEGER CHECK (width > 0),
  height      INTEGER CHECK (height > 0),
  position    SMALLINT NOT NULL DEFAULT 0,
  is_primary  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);
-- Një foto kryesore për çdo produkt × ngjyrë
CREATE UNIQUE INDEX product_images_one_primary ON product_images (product_id, color_id)
  NULLS NOT DISTINCT WHERE is_primary AND deleted_at IS NULL;


-- =============================================================================
-- 4. DËRGESAT, ZBRITJET DHE KUPONAT
-- =============================================================================

CREATE TABLE shipping_methods (
  id         SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code       TEXT NOT NULL UNIQUE CHECK (code ~ '^[a-z_]+$'),
  name       TEXT NOT NULL,
  carrier    TEXT,
  price      money_amount NOT NULL,
  free_over  price_amount,             -- falas mbi këtë shumë
  min_days   SMALLINT NOT NULL CHECK (min_days >= 0),
  max_days   SMALLINT NOT NULL,
  countries  CHAR(2)[] NOT NULL DEFAULT '{AL}',
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT shipping_days CHECK (max_days >= min_days)
);

-- Zbritja = rregulli (sa, për çfarë, kur); kuponi = kodi që e aktivizon
CREATE TABLE discounts (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name                TEXT NOT NULL,
  type                discount_type NOT NULL,
  value               NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (value >= 0),
  scope               discount_scope NOT NULL DEFAULT 'order',
  min_order_amount    money_amount NOT NULL DEFAULT 0,
  max_discount_amount price_amount,              -- tavan për zbritjet në përqindje
  starts_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at             TIMESTAMPTZ,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ,
  CONSTRAINT discounts_percent_range CHECK (type <> 'percent' OR value BETWEEN 0.01 AND 100),
  CONSTRAINT discounts_fixed_positive CHECK (type <> 'fixed_amount' OR value > 0),
  CONSTRAINT discounts_dates CHECK (ends_at IS NULL OR ends_at > starts_at)
);

-- Për çfarë vlen zbritja (kur scope <> 'order'): saktësisht një objektiv për rresht
CREATE TABLE discount_targets (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  discount_id   BIGINT NOT NULL REFERENCES discounts (id) ON DELETE CASCADE,
  product_id    BIGINT REFERENCES products (id) ON DELETE CASCADE,
  category_id   BIGINT REFERENCES categories (id) ON DELETE CASCADE,   -- vlen edhe për nënkategoritë
  collection_id BIGINT REFERENCES collections (id) ON DELETE CASCADE,
  brand_id      BIGINT REFERENCES brands (id) ON DELETE CASCADE,
  CONSTRAINT discount_targets_exactly_one CHECK (num_nonnulls(product_id, category_id, collection_id, brand_id) = 1)
);
CREATE INDEX discount_targets_discount_idx ON discount_targets (discount_id);

CREATE TABLE coupons (
  id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  discount_id          BIGINT NOT NULL REFERENCES discounts (id) ON DELETE RESTRICT,
  code                 CITEXT NOT NULL CHECK (code ~ '^[A-Za-z0-9_-]{3,40}$'),
  usage_limit          INTEGER CHECK (usage_limit > 0),               -- NULL = pa kufi
  usage_limit_per_user INTEGER NOT NULL DEFAULT 1 CHECK (usage_limit_per_user > 0),
  times_used           INTEGER NOT NULL DEFAULT 0 CHECK (times_used >= 0),
  is_active            BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at           TIMESTAMPTZ,
  -- Mbrojtja e fundit: kuponi i 101-të i një limiti 100 dështon edhe nëse dy porosi vijnë njëkohësisht
  CONSTRAINT coupons_within_limit CHECK (usage_limit IS NULL OR times_used <= usage_limit)
);
CREATE UNIQUE INDEX coupons_code_uq ON coupons (code) WHERE deleted_at IS NULL;


-- =============================================================================
-- 5. SHPORTA DHE LISTA E DËSHIRAVE
-- =============================================================================

-- Shporta "e nxehtë" jeton në Redis; këtu ruhet për përdoruesit e kyçur,
-- për rikuperim (shporta të braktisura) dhe në momentin e checkout-it
CREATE TABLE carts (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  public_id  UUID NOT NULL DEFAULT uuidv7() UNIQUE,     -- token në cookie për vizitorët pa llogari
  user_id    BIGINT REFERENCES users (id) ON DELETE CASCADE,
  status     cart_status NOT NULL DEFAULT 'active',
  currency   currency_code NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '30 days',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Një shportë aktive për çdo përdorues të kyçur
CREATE UNIQUE INDEX carts_one_active_per_user ON carts (user_id) WHERE status = 'active' AND user_id IS NOT NULL;
CREATE INDEX carts_expiry_idx ON carts (expires_at) WHERE status = 'active';

CREATE TABLE cart_items (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cart_id      BIGINT NOT NULL REFERENCES carts (id) ON DELETE CASCADE,
  variant_id   BIGINT NOT NULL REFERENCES product_variants (id) ON DELETE CASCADE,
  quantity     INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  price_at_add price_amount NOT NULL,       -- për njoftimin "çmimi ka ndryshuar që kur e shtove"
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cart_id, variant_id)
);
CREATE INDEX cart_items_variant_idx ON cart_items (variant_id);

CREATE TABLE wishlists (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  public_id  UUID NOT NULL DEFAULT uuidv7() UNIQUE,     -- për ndarje me link
  user_id    BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT 'Të preferuarat',
  is_public  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX wishlists_user_name_uq ON wishlists (user_id, name) WHERE deleted_at IS NULL;

CREATE TABLE wishlist_items (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wishlist_id BIGINT NOT NULL REFERENCES wishlists (id) ON DELETE CASCADE,
  product_id  BIGINT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  variant_id  BIGINT REFERENCES product_variants (id) ON DELETE SET NULL,   -- opsionale: madhësia e dëshiruar
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (wishlist_id, product_id, variant_id)
);
CREATE INDEX wishlist_items_product_idx ON wishlist_items (product_id);   -- "sa veta e duan këtë produkt"


-- =============================================================================
-- 6. POROSITË
-- Porositë nuk fshihen kurrë (as butë): janë dokumente financiare. Anulimi = status.
-- =============================================================================

CREATE SEQUENCE order_number_seq;

CREATE TABLE orders (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  public_id          UUID NOT NULL DEFAULT uuidv7() UNIQUE,
  order_number       TEXT NOT NULL UNIQUE
                       DEFAULT ('MD-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 7, '0')),
  user_id            BIGINT REFERENCES users (id) ON DELETE SET NULL,   -- NULL = blerje si vizitor
  email              CITEXT NOT NULL,
  status             order_status NOT NULL DEFAULT 'pending_payment',
  currency           currency_code NOT NULL,
  subtotal           money_amount NOT NULL,
  discount_total     money_amount NOT NULL DEFAULT 0,
  shipping_total     money_amount NOT NULL DEFAULT 0,
  tax_total          money_amount NOT NULL DEFAULT 0,   -- në Shqipëri TVSH-ja është e përfshirë në çmim → 0
  grand_total        money_amount NOT NULL,
  shipping_method_id SMALLINT REFERENCES shipping_methods (id) ON DELETE RESTRICT,
  coupon_id          BIGINT REFERENCES coupons (id) ON DELETE RESTRICT,
  -- Kopje e adresës në momentin e blerjes (adresa e klientit mund të ndryshojë më vonë)
  shipping_address   JSONB NOT NULL CHECK (jsonb_typeof(shipping_address) = 'object'),
  billing_address    JSONB CHECK (jsonb_typeof(billing_address) = 'object'),
  customer_note      TEXT CHECK (char_length(customer_note) <= 1000),
  idempotency_key    UUID UNIQUE,                       -- i njëjti klikim dy herë → një porosi
  placed_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at            TIMESTAMPTZ,
  cancelled_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT orders_total_math CHECK (grand_total = subtotal - discount_total + shipping_total + tax_total),
  CONSTRAINT orders_discount_le_subtotal CHECK (discount_total <= subtotal)
);

CREATE TABLE order_items (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id        BIGINT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  variant_id      BIGINT REFERENCES product_variants (id) ON DELETE SET NULL,
  product_id      BIGINT REFERENCES products (id) ON DELETE SET NULL,
  -- Kopje (snapshot) në momentin e blerjes: nuk ndryshojnë kur ndryshon katalogu
  sku             TEXT NOT NULL,
  product_name    TEXT NOT NULL,
  variant_label   TEXT NOT NULL,                 -- "M / E zezë / Lesh"
  image_url       TEXT,
  unit_price      price_amount NOT NULL,         -- çmimi efektiv (me zbritjen e produktit) kur u ble
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  discount_amount money_amount NOT NULL DEFAULT 0,   -- pjesa e kuponit që i bie këtij rreshti (për rimbursime)
  line_total      NUMERIC(12, 2) GENERATED ALWAYS AS (unit_price * quantity - discount_amount) STORED,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT order_items_discount_le_line CHECK (discount_amount <= unit_price * quantity)
);

CREATE TABLE order_status_history (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id    BIGINT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  from_status order_status,                      -- NULL në krijim
  to_status   order_status NOT NULL,
  changed_by  BIGINT REFERENCES users (id) ON DELETE SET NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE coupon_redemptions (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  coupon_id   BIGINT NOT NULL REFERENCES coupons (id) ON DELETE RESTRICT,
  order_id    BIGINT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  user_id     BIGINT REFERENCES users (id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, order_id)
);


-- =============================================================================
-- 7. PAGESAT, RIMBURSIMET, DËRGESAT
-- =============================================================================

CREATE TABLE payments (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id            BIGINT NOT NULL REFERENCES orders (id) ON DELETE RESTRICT,
  provider            payment_provider NOT NULL,
  provider_payment_id TEXT,                       -- p.sh. ID-ja e PaymentIntent te Stripe
  status              payment_status NOT NULL DEFAULT 'pending',
  amount              price_amount NOT NULL,
  currency            currency_code NOT NULL,
  -- Vetëm të dhëna jo të ndjeshme (marka e kartës, 4 shifrat e fundit). KURRË numri i plotë ose CVV.
  method_details      JSONB NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(method_details) = 'object'),
  failure_reason      TEXT,
  idempotency_key     UUID UNIQUE,
  authorized_at       TIMESTAMPTZ,
  captured_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_payment_id)          -- webhook-u i njëjtë dy herë nuk krijon dy pagesa
);

CREATE TABLE refunds (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  payment_id         BIGINT NOT NULL REFERENCES payments (id) ON DELETE RESTRICT,
  order_id           BIGINT NOT NULL REFERENCES orders (id) ON DELETE RESTRICT,
  amount             price_amount NOT NULL,
  reason             TEXT NOT NULL,
  status             refund_status NOT NULL DEFAULT 'pending',
  provider_refund_id TEXT UNIQUE,
  created_by         BIGINT REFERENCES users (id) ON DELETE SET NULL,
  processed_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE shipments (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id           BIGINT NOT NULL REFERENCES orders (id) ON DELETE RESTRICT,
  shipping_method_id SMALLINT REFERENCES shipping_methods (id) ON DELETE RESTRICT,
  carrier            TEXT,
  tracking_number    TEXT,
  tracking_url       https_url,
  status             shipment_status NOT NULL DEFAULT 'pending',
  shipped_at         TIMESTAMPTZ,
  delivered_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (carrier, tracking_number),
  CONSTRAINT shipments_dates CHECK (delivered_at IS NULL OR (shipped_at IS NOT NULL AND delivered_at >= shipped_at))
);

-- Një porosi mund të dërgohet me disa pako (dërgesa të pjesshme)
CREATE TABLE shipment_items (
  shipment_id   BIGINT NOT NULL REFERENCES shipments (id) ON DELETE CASCADE,
  order_item_id BIGINT NOT NULL REFERENCES order_items (id) ON DELETE RESTRICT,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (shipment_id, order_item_id)
);


-- =============================================================================
-- 8. VLERËSIMET
-- =============================================================================

CREATE TABLE reviews (
  id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id           BIGINT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  user_id              BIGINT REFERENCES users (id) ON DELETE SET NULL,   -- vlerësimi mbetet anonim kur fshihet llogaria
  order_item_id        BIGINT REFERENCES order_items (id) ON DELETE SET NULL,
  rating               SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title                TEXT CHECK (char_length(title) <= 150),
  body                 TEXT CHECK (char_length(body) <= 5000),
  status               review_status NOT NULL DEFAULT 'pending',          -- moderim para publikimit
  is_verified_purchase BOOLEAN GENERATED ALWAYS AS (order_item_id IS NOT NULL) STORED,
  helpful_count        INTEGER NOT NULL DEFAULT 0 CHECK (helpful_count >= 0),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at           TIMESTAMPTZ
);
-- Një vlerësim për produkt për çdo klient
CREATE UNIQUE INDEX reviews_one_per_user ON reviews (product_id, user_id) WHERE deleted_at IS NULL AND user_id IS NOT NULL;

CREATE TABLE review_images (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  review_id   BIGINT NOT NULL REFERENCES reviews (id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  url         https_url NOT NULL,
  position    SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 9. INVENTARI DHE SINKRONIZIMI ME SHËRBIMET E JASHTME
-- =============================================================================

-- Libri i stokut: çdo hyrje/dalje regjistrohet, asgjë nuk ndryshohet ose fshihet (append-only).
-- stock_after lejon rindërtimin e historikut dhe kontrollin: SUM(quantity_change) = stoku aktual.
CREATE TABLE inventory_movements (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  variant_id      BIGINT NOT NULL REFERENCES product_variants (id) ON DELETE RESTRICT,
  type            movement_type NOT NULL,
  quantity_change INTEGER NOT NULL CHECK (quantity_change <> 0),   -- + hyrje, − dalje
  stock_after     INTEGER NOT NULL CHECK (stock_after >= 0),
  order_id        BIGINT REFERENCES orders (id) ON DELETE SET NULL,
  reference       TEXT,                                            -- p.sh. nr. i faturës së furnitorit
  note            TEXT,
  created_by      BIGINT REFERENCES users (id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT inventory_direction CHECK (
       (type IN ('sale_out', 'damaged') AND quantity_change < 0)
    OR (type IN ('purchase_in', 'return_in', 'cancel_in') AND quantity_change > 0)
    OR type = 'adjustment')
);

-- "Outbox": çdo ndryshim në katalog shkruhet këtu në të njëjtin transaksion;
-- një worker i lexon dhe përditëson Meilisearch/Redis. Asnjë ndryshim nuk humbet,
-- edhe nëse Meilisearch është i rënë në atë moment.
CREATE TABLE outbox_events (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  aggregate_type TEXT NOT NULL,            -- 'product'
  aggregate_id   BIGINT NOT NULL,
  event_type     TEXT NOT NULL,            -- 'product.changed', 'stock.changed'
  payload        JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at   TIMESTAMPTZ
);


-- =============================================================================
-- 10. INDEKSET PËR KËRKIM, FILTRIM DHE RAPORTE
-- Indekse të pjesshme (WHERE deleted_at IS NULL): më të vogla, sepse rreshtat e fshirë nuk kërkohen kurrë.
-- =============================================================================

-- Produktet: listimi, marka, gjinia, atributet JSONB, teksti
CREATE INDEX products_listing_idx    ON products (status, published_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX products_brand_idx      ON products (brand_id) WHERE deleted_at IS NULL;
CREATE INDEX products_gender_idx     ON products (gender, status) WHERE deleted_at IS NULL;
CREATE INDEX products_attributes_gin ON products USING GIN (attributes jsonb_path_ops);   -- attributes @> '{"stina":["dimer"]}'
CREATE INDEX products_search_gin     ON products USING GIN (search_vector);
CREATE INDEX products_name_trgm      ON products USING GIN (name gin_trgm_ops);         -- name % 'xhamdan'

CREATE INDEX product_categories_category_idx ON product_categories (category_id, product_id);
CREATE INDEX collection_products_product_idx ON collection_products (product_id);
CREATE INDEX product_tags_tag_idx            ON product_tags (tag_id, product_id);

-- Variantet: filtrat madhësi / ngjyrë / çmim. Stoku NUK indeksohet me qëllim:
-- një indeks mbi stock_quantity do t'i kthente çdo shitje në update jo-HOT (më të ngadaltë).
CREATE INDEX variants_product_idx ON product_variants (product_id) WHERE deleted_at IS NULL;
CREATE INDEX variants_size_idx    ON product_variants (size_id, product_id)  WHERE deleted_at IS NULL AND is_active;
CREATE INDEX variants_color_idx   ON product_variants (color_id, product_id) WHERE deleted_at IS NULL AND is_active;
CREATE INDEX variants_price_idx   ON product_variants (effective_price, product_id) WHERE deleted_at IS NULL AND is_active;

CREATE INDEX product_images_product_idx ON product_images (product_id, color_id, position) WHERE deleted_at IS NULL;

-- Porositë: "porositë e mia", paneli sipas statusit, raportet sipas datës
CREATE INDEX orders_user_idx       ON orders (user_id, placed_at DESC);
CREATE INDEX orders_status_idx     ON orders (status, placed_at DESC);
CREATE INDEX orders_placed_brin    ON orders USING BRIN (placed_at);           -- shumë i vogël, ideal për intervale datash
CREATE INDEX order_items_order_idx   ON order_items (order_id);
CREATE INDEX order_items_variant_idx ON order_items (variant_id);
CREATE INDEX order_items_product_idx ON order_items (product_id, created_at);
CREATE INDEX order_status_history_order_idx ON order_status_history (order_id, created_at);
CREATE INDEX coupon_redemptions_user_idx    ON coupon_redemptions (coupon_id, user_id);

CREATE INDEX payments_order_idx  ON payments (order_id);
CREATE INDEX refunds_payment_idx ON refunds (payment_id);
CREATE INDEX shipments_order_idx ON shipments (order_id);

CREATE INDEX reviews_product_idx ON reviews (product_id, created_at DESC) WHERE status = 'approved' AND deleted_at IS NULL;
CREATE INDEX reviews_user_idx    ON reviews (user_id);

CREATE INDEX inventory_variant_idx   ON inventory_movements (variant_id, created_at DESC);
CREATE INDEX inventory_order_idx     ON inventory_movements (order_id) WHERE order_id IS NOT NULL;
CREATE INDEX inventory_created_brin  ON inventory_movements USING BRIN (created_at);

CREATE INDEX outbox_pending_idx ON outbox_events (id) WHERE processed_at IS NULL;


-- =============================================================================
-- 11. TRIGGERË: updated_at, historiku i statusit, rregullat e biznesit
-- =============================================================================

-- updated_at automatik për çdo tabelë që e ka këtë kolonë
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT c.table_name FROM information_schema.columns c
    JOIN information_schema.tables tb ON tb.table_name = c.table_name AND tb.table_schema = c.table_schema
    WHERE c.table_schema = current_schema() AND c.column_name = 'updated_at' AND tb.table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
                   t || '_set_updated_at', t);
  END LOOP;
END $$;

-- Kalimet e lejuara të statusit (p.sh. një porosi e dorëzuar nuk kthehet në "në pritje të pagesës")
CREATE FUNCTION orders_check_transition() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  allowed order_status[];
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;
  allowed := CASE OLD.status
    WHEN 'pending_payment'    THEN ARRAY['paid', 'cancelled']::order_status[]
    WHEN 'paid'               THEN ARRAY['processing', 'cancelled', 'partially_refunded', 'refunded']::order_status[]
    WHEN 'processing'         THEN ARRAY['shipped', 'cancelled', 'partially_refunded', 'refunded']::order_status[]
    WHEN 'shipped'            THEN ARRAY['delivered', 'partially_refunded', 'refunded']::order_status[]
    WHEN 'delivered'          THEN ARRAY['partially_refunded', 'refunded']::order_status[]
    WHEN 'partially_refunded' THEN ARRAY['refunded']::order_status[]
    ELSE ARRAY[]::order_status[]                       -- cancelled, refunded: përfundimtare
  END;
  IF NOT NEW.status = ANY (allowed) THEN
    RAISE EXCEPTION 'Kalim i palejuar i statusit të porosisë %: % → %', OLD.order_number, OLD.status, NEW.status;
  END IF;
  IF NEW.status = 'paid'      THEN NEW.paid_at := coalesce(NEW.paid_at, now()); END IF;
  IF NEW.status = 'cancelled' THEN NEW.cancelled_at := coalesce(NEW.cancelled_at, now()); END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER orders_status_transition BEFORE UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION orders_check_transition();

-- Çdo ndryshim statusi regjistrohet automatikisht. Kush e bëri: aplikacioni vendos
-- SET LOCAL app.user_id = '42' në fillim të transaksionit.
CREATE FUNCTION orders_log_status() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO order_status_history (order_id, from_status, to_status, changed_by)
    VALUES (NEW.id,
            CASE WHEN TG_OP = 'UPDATE' THEN OLD.status END,
            NEW.status,
            nullif(current_setting('app.user_id', true), '')::BIGINT);
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER orders_status_history AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION orders_log_status();

-- Rimbursimet nuk mund të kalojnë shumën e paguar (pagesa bllokohet, që dy rimbursime njëkohësisht të mos kalojnë)
CREATE FUNCTION refunds_check_total() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  paid       NUMERIC;
  pay_order  BIGINT;
  refunded   NUMERIC;
BEGIN
  SELECT amount, order_id INTO paid, pay_order FROM payments WHERE id = NEW.payment_id FOR UPDATE;
  IF pay_order <> NEW.order_id THEN
    RAISE EXCEPTION 'Rimbursimi i përket porosisë %, por pagesa porosisë %', NEW.order_id, pay_order;
  END IF;
  SELECT coalesce(sum(amount), 0) INTO refunded
    FROM refunds WHERE payment_id = NEW.payment_id AND status <> 'failed' AND id <> NEW.id;
  IF NEW.status <> 'failed' AND refunded + NEW.amount > paid THEN
    RAISE EXCEPTION 'Rimbursimet (%) kalojnë shumën e paguar (%)', refunded + NEW.amount, paid;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER refunds_total_check BEFORE INSERT OR UPDATE OF amount, status ON refunds
  FOR EACH ROW EXECUTE FUNCTION refunds_check_total();

-- Librat (inventari, historiku i statusit) vetëm shtohen: korrigjimi bëhet me një lëvizje të re
CREATE FUNCTION forbid_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Tabela % është vetëm për shtim: shto një rresht korrigjues në vend që të ndryshosh/fshish', TG_TABLE_NAME;
END $$;
CREATE TRIGGER inventory_movements_append_only BEFORE UPDATE OR DELETE ON inventory_movements
  FOR EACH ROW EXECUTE FUNCTION forbid_change();
CREATE TRIGGER order_status_history_append_only BEFORE UPDATE OR DELETE ON order_status_history
  FOR EACH ROW EXECUTE FUNCTION forbid_change();

-- Ndryshimet në katalog → outbox (për Meilisearch dhe pastrimin e cache-it)
CREATE FUNCTION enqueue_product_sync() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  pid BIGINT;
  evt TEXT := 'product.changed';
BEGIN
  IF TG_TABLE_NAME = 'products' THEN
    pid := coalesce(NEW.id, OLD.id);
  ELSE
    pid := coalesce(NEW.product_id, OLD.product_id);
    -- IF i ndarë: PL/pgSQL e lexon NEW.stock_quantity vetëm për tabelën që e ka këtë kolonë
    IF TG_TABLE_NAME = 'product_variants' AND TG_OP = 'UPDATE' THEN
      IF NEW.stock_quantity IS DISTINCT FROM OLD.stock_quantity THEN
        evt := 'stock.changed';
      END IF;
    END IF;
  END IF;
  INSERT INTO outbox_events (aggregate_type, aggregate_id, event_type) VALUES ('product', pid, evt);
  RETURN NULL;
END $$;
CREATE TRIGGER products_outbox AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION enqueue_product_sync();
CREATE TRIGGER product_variants_outbox AFTER INSERT OR UPDATE OR DELETE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION enqueue_product_sync();
CREATE TRIGGER product_images_outbox AFTER INSERT OR UPDATE OR DELETE ON product_images
  FOR EACH ROW EXECUTE FUNCTION enqueue_product_sync();


-- =============================================================================
-- 12. FUNKSIONET E STOKUT DHE TË POROSISË
-- =============================================================================

-- Ndryshim i stokut për një variant (hyrje nga furnitori, kthim, shitje në dyqan fizik…).
-- Një UPDATE i kushtëzuar është atomik: dy transaksione njëkohësisht nuk mund ta çojnë stokun nën 0,
-- sepse i dyti pret bllokimin e rreshtit dhe pastaj rivlerëson kushtin mbi vlerën e re.
CREATE FUNCTION adjust_stock(
  p_variant_id BIGINT,
  p_delta      INTEGER,
  p_type       movement_type,
  p_order_id   BIGINT  DEFAULT NULL,
  p_note       TEXT    DEFAULT NULL,
  p_user_id    BIGINT  DEFAULT NULL,
  p_reference  TEXT    DEFAULT NULL
) RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  v_after INTEGER;
BEGIN
  UPDATE product_variants
     SET stock_quantity = stock_quantity + p_delta
   WHERE id = p_variant_id
     AND deleted_at IS NULL
     AND stock_quantity + p_delta >= reserved_quantity     -- nuk shet atë që është mbajtur për të tjerë
  RETURNING stock_quantity INTO v_after;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stok i pamjaftueshëm ose variant i panjohur (id %)', p_variant_id
      USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO inventory_movements (variant_id, type, quantity_change, stock_after, order_id, note, created_by, reference)
  VALUES (p_variant_id, p_type, p_delta, v_after, p_order_id, p_note, p_user_id, p_reference);
  RETURN v_after;
END $$;

-- A vlen zbritja për këtë produkt? (sipas produktit, markës, koleksionit ose kategorisë dhe nënkategorive)
CREATE FUNCTION discount_applies(p_discount_id BIGINT, p_product_id BIGINT) RETURNS BOOLEAN
LANGUAGE sql STABLE AS $$
  SELECT d.scope = 'order' OR EXISTS (
    SELECT 1
      FROM discount_targets t
      JOIN products p ON p.id = p_product_id
     WHERE t.discount_id = d.id
       AND (   t.product_id = p.id
            OR t.brand_id   = p.brand_id
            OR t.collection_id IN (SELECT cp.collection_id FROM collection_products cp WHERE cp.product_id = p.id)
            OR t.category_id IN (SELECT unnest(c.path)
                                   FROM product_categories pc JOIN categories c ON c.id = pc.category_id
                                  WHERE pc.product_id = p.id)))
  FROM discounts d WHERE d.id = p_discount_id
$$;

-- Krijimi i porosisë nga shporta, në një transaksion të vetëm.
-- Si parandalohet shitja e stokut që nuk ekziston (dy klientë blejnë copën e fundit njëkohësisht):
--   1) Shporta bllokohet (FOR UPDATE): i njëjti klient nuk mund ta paguajë dy herë nga dy skeda.
--   2) Variantet bllokohen me SELECT … FOR UPDATE, gjithmonë sipas renditjes së id-së, që dy porosi
--      me të njëjtat produkte të mos bllokojnë njëra-tjetrën (deadlock).
--   3) Stoku kontrollohet MBI rreshtat e bllokuar: klienti i dytë pret derisa i pari të bëjë COMMIT,
--      pastaj sheh stokun e ri dhe merr gabimin "Stok i pamjaftueshëm".
--   4) CHECK (stock_quantity >= 0) është vija e fundit e mbrojtjes nëse ndonjë kod tjetër gabon.
CREATE FUNCTION create_order_from_cart(
  p_cart_id            BIGINT,
  p_email              CITEXT,
  p_shipping_address   JSONB,
  p_shipping_method_id SMALLINT,
  p_coupon_code        CITEXT DEFAULT NULL,
  p_idempotency_key    UUID   DEFAULT NULL
) RETURNS TABLE (order_id BIGINT, order_number TEXT, grand_total NUMERIC)
LANGUAGE plpgsql AS $$
#variable_conflict use_column
DECLARE
  v_cart     carts%ROWTYPE;
  v_ship     shipping_methods%ROWTYPE;
  v_coupon   coupons%ROWTYPE;
  v_disc     discounts%ROWTYPE;
  v_order_id BIGINT;
  v_subtotal NUMERIC(12, 2);
  v_eligible NUMERIC(12, 2) := 0;
  v_discount NUMERIC(12, 2) := 0;
  v_shipping NUMERIC(12, 2);
  v_problems TEXT;
BEGIN
  -- 0. E njëjta kërkesë e dërguar dy herë → kthe porosinë ekzistuese
  IF p_idempotency_key IS NOT NULL THEN
    RETURN QUERY SELECT o.id, o.order_number, o.grand_total::NUMERIC FROM orders o WHERE o.idempotency_key = p_idempotency_key;
    IF FOUND THEN RETURN; END IF;
  END IF;

  -- 1. Blloko shportën
  SELECT * INTO v_cart FROM carts c WHERE c.id = p_cart_id FOR UPDATE;
  IF NOT FOUND OR v_cart.status <> 'active' THEN
    RAISE EXCEPTION 'Shporta nuk ekziston ose është mbyllur';
  END IF;

  -- 2. Blloko variantet, gjithmonë në të njëjtin rend
  PERFORM 1
     FROM product_variants v
    WHERE v.id IN (SELECT ci.variant_id FROM cart_items ci WHERE ci.cart_id = p_cart_id)
    ORDER BY v.id
      FOR UPDATE;

  -- 3. Kontrollo stokun dhe disponueshmërinë mbi rreshtat e bllokuar
  SELECT string_agg(format('%s (kërkuar %s, në dispozicion %s)', v.sku, ci.quantity,
                           greatest(v.stock_quantity - v.reserved_quantity, 0)), ', ')
    INTO v_problems
    FROM cart_items ci
    JOIN product_variants v ON v.id = ci.variant_id
    JOIN products p ON p.id = v.product_id
   WHERE ci.cart_id = p_cart_id
     AND (   v.stock_quantity - v.reserved_quantity < ci.quantity
          OR v.deleted_at IS NOT NULL OR NOT v.is_active
          OR p.deleted_at IS NOT NULL OR p.status <> 'active');
  IF v_problems IS NOT NULL THEN
    RAISE EXCEPTION 'Stok i pamjaftueshëm: %', v_problems USING ERRCODE = 'P0001';
  END IF;

  SELECT sum(v.effective_price * ci.quantity) INTO v_subtotal
    FROM cart_items ci JOIN product_variants v ON v.id = ci.variant_id
   WHERE ci.cart_id = p_cart_id;
  IF v_subtotal IS NULL THEN
    RAISE EXCEPTION 'Shporta është bosh';
  END IF;

  -- 4. Kuponi (rreshti bllokohet; limiti mbrohet edhe nga CHECK coupons_within_limit)
  IF p_coupon_code IS NOT NULL THEN
    SELECT * INTO v_coupon FROM coupons c
     WHERE c.code = p_coupon_code AND c.is_active AND c.deleted_at IS NULL
       FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Kuponi "%" nuk është i vlefshëm', p_coupon_code;
    END IF;
    SELECT * INTO v_disc FROM discounts d
     WHERE d.id = v_coupon.discount_id AND d.is_active AND d.deleted_at IS NULL
       AND now() >= d.starts_at AND (d.ends_at IS NULL OR now() < d.ends_at);
    IF NOT FOUND OR v_subtotal < v_disc.min_order_amount THEN
      RAISE EXCEPTION 'Kuponi "%" nuk vlen për këtë porosi', p_coupon_code;
    END IF;
    IF v_cart.user_id IS NOT NULL AND (
         SELECT count(*) FROM coupon_redemptions cr
          WHERE cr.coupon_id = v_coupon.id AND cr.user_id = v_cart.user_id) >= v_coupon.usage_limit_per_user THEN
      RAISE EXCEPTION 'Kuponin "%" e ke përdorur tashmë', p_coupon_code;
    END IF;

    SELECT coalesce(sum(v.effective_price * ci.quantity), 0) INTO v_eligible
      FROM cart_items ci JOIN product_variants v ON v.id = ci.variant_id
     WHERE ci.cart_id = p_cart_id AND discount_applies(v_disc.id, v.product_id);

    v_discount := CASE v_disc.type
                    WHEN 'percent'      THEN round(v_eligible * v_disc.value / 100, 2)
                    WHEN 'fixed_amount' THEN least(v_disc.value, v_eligible)
                    ELSE 0
                  END;
    IF v_disc.max_discount_amount IS NOT NULL THEN
      v_discount := least(v_discount, v_disc.max_discount_amount);
    END IF;
  END IF;

  -- 5. Dërgesa
  SELECT * INTO v_ship FROM shipping_methods s
   WHERE s.id = p_shipping_method_id AND s.is_active AND s.deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mënyra e dërgesës nuk ekziston';
  END IF;
  v_shipping := CASE
                  WHEN v_disc.type = 'free_shipping' THEN 0
                  WHEN v_ship.free_over IS NOT NULL AND v_subtotal - v_discount >= v_ship.free_over THEN 0
                  ELSE v_ship.price
                END;

  -- 6. Porosia (triggeri regjistron statusin e parë në order_status_history)
  INSERT INTO orders (user_id, email, currency, subtotal, discount_total, shipping_total, tax_total, grand_total,
                      shipping_method_id, coupon_id, shipping_address, idempotency_key)
  VALUES (v_cart.user_id, p_email, v_cart.currency, v_subtotal, v_discount, v_shipping, 0,
          v_subtotal - v_discount + v_shipping, v_ship.id, v_coupon.id, p_shipping_address, p_idempotency_key)
  RETURNING id INTO v_order_id;

  -- 7. Rreshtat, me emrin dhe çmimin e çastit (snapshot); zbritja ndahet proporcionalisht
  INSERT INTO order_items (order_id, variant_id, product_id, sku, product_name, variant_label, image_url,
                           unit_price, quantity, discount_amount)
  SELECT v_order_id, v.id, p.id, v.sku, p.name,
         concat_ws(' / ', s.label, col.name, v.material),
         img.url,
         v.effective_price, ci.quantity,
         CASE WHEN v_discount > 0 AND discount_applies(v_disc.id, p.id)
              THEN round(v.effective_price * ci.quantity * v_discount / v_eligible, 2)
              ELSE 0 END
    FROM cart_items ci
    JOIN product_variants v ON v.id = ci.variant_id
    JOIN products p ON p.id = v.product_id
    LEFT JOIN sizes s ON s.id = v.size_id
    LEFT JOIN colors col ON col.id = v.color_id
    LEFT JOIN LATERAL (
      SELECT i.url FROM product_images i
       WHERE i.product_id = p.id AND i.deleted_at IS NULL AND (i.color_id = v.color_id OR i.color_id IS NULL)
       ORDER BY (i.color_id IS NULL), i.is_primary DESC, i.position
       LIMIT 1) img ON true
   WHERE ci.cart_id = p_cart_id
   ORDER BY v.id;

  -- Centët që mbeten nga rrumbullakimi i shtohen rreshtit të fundit që merr zbritje
  IF v_discount > 0 THEN
    UPDATE order_items oi
       SET discount_amount = oi.discount_amount + (v_discount - (SELECT sum(x.discount_amount) FROM order_items x WHERE x.order_id = v_order_id))
     WHERE oi.id = (SELECT max(x.id) FROM order_items x WHERE x.order_id = v_order_id AND x.discount_amount > 0);
  END IF;

  -- 8. Ul stokun (rreshtat janë të bllokuar që nga hapi 2) dhe shkruaj librin e inventarit
  UPDATE product_variants v
     SET stock_quantity = v.stock_quantity - ci.quantity
    FROM cart_items ci
   WHERE ci.cart_id = p_cart_id AND ci.variant_id = v.id;

  INSERT INTO inventory_movements (variant_id, type, quantity_change, stock_after, order_id)
  SELECT v.id, 'sale_out', -ci.quantity, v.stock_quantity, v_order_id
    FROM cart_items ci JOIN product_variants v ON v.id = ci.variant_id
   WHERE ci.cart_id = p_cart_id;

  -- 9. Kuponi i përdorur
  IF v_coupon.id IS NOT NULL THEN
    UPDATE coupons c SET times_used = c.times_used + 1 WHERE c.id = v_coupon.id;
    INSERT INTO coupon_redemptions (coupon_id, order_id, user_id) VALUES (v_coupon.id, v_order_id, v_cart.user_id);
  END IF;

  -- 10. Mbyll shportën
  UPDATE carts c SET status = 'converted' WHERE c.id = p_cart_id;

  RETURN QUERY SELECT o.id, o.order_number, o.grand_total::NUMERIC FROM orders o WHERE o.id = v_order_id;
END $$;

-- Anulimi: statusi + kthimi i mallit në stok, në një transaksion
CREATE FUNCTION cancel_order(p_order_id BIGINT, p_note TEXT DEFAULT NULL) RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
  r RECORD;
BEGIN
  UPDATE orders SET status = 'cancelled' WHERE id = p_order_id;   -- triggeri kontrollon nëse lejohet
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Porosia % nuk ekziston', p_order_id;
  END IF;
  FOR r IN SELECT variant_id, quantity FROM order_items
            WHERE order_id = p_order_id AND variant_id IS NOT NULL ORDER BY variant_id LOOP
    PERFORM adjust_stock(r.variant_id, r.quantity, 'cancel_in', p_order_id, coalesce(p_note, 'Porosi e anuluar'));
  END LOOP;
END $$;
