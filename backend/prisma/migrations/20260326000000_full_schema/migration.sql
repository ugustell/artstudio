-- Удаляем старые таблицы
DROP TABLE IF EXISTS "orders";
DROP TABLE IF EXISTS "prices";
DROP TABLE IF EXISTS "users";
DROP TABLE IF EXISTS "admins";

-- sizes
CREATE TABLE "sizes" (
  "id"    INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "size"  TEXT    NOT NULL,
  "price" REAL    NOT NULL,
  CONSTRAINT "sizes_size_key" UNIQUE ("size")
);

-- formats
CREATE TABLE "formats" (
  "id"          INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "format"      TEXT    NOT NULL,
  "price_extra" REAL    NOT NULL DEFAULT 0,
  CONSTRAINT "formats_format_key" UNIQUE ("format")
);

-- designs
CREATE TABLE "designs" (
  "id"          INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "design"      TEXT    NOT NULL,
  "price_extra" REAL    NOT NULL DEFAULT 0,
  CONSTRAINT "designs_design_key" UNIQUE ("design")
);

-- plots
CREATE TABLE "plots" (
  "id"          INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "plot"        TEXT    NOT NULL,
  "price_extra" REAL    NOT NULL DEFAULT 0,
  CONSTRAINT "plots_plot_key" UNIQUE ("plot")
);

-- discounts
CREATE TABLE "discounts" (
  "id"          INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "description" TEXT    NOT NULL,
  "percent"     REAL    NOT NULL
);

-- users
CREATE TABLE "users" (
  "id"            INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "created_at"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "name"          TEXT    NOT NULL,
  "phone"         TEXT    NOT NULL,
  "email"         TEXT    NOT NULL,
  "address"       TEXT    NOT NULL DEFAULT '',
  "password_hash" TEXT    NOT NULL,
  CONSTRAINT "users_email_key" UNIQUE ("email")
);

-- orders
CREATE TABLE "orders" (
  "id"               INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
  "created_at"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "client_name"      TEXT     NOT NULL,
  "phone"            TEXT     NOT NULL,
  "email"            TEXT     NOT NULL,
  "status"           TEXT     NOT NULL DEFAULT 'new',
  "deadline"         TEXT     NOT NULL DEFAULT '',
  "issue_date"       TEXT     NOT NULL DEFAULT '',
  "discount_percent" REAL     NOT NULL DEFAULT 0,
  "discount_reason"  TEXT     NOT NULL DEFAULT '',
  "surcharge_percent" REAL    NOT NULL DEFAULT 0,
  "surcharge_reason" TEXT     NOT NULL DEFAULT '',
  "total_price"      REAL     NOT NULL,
  "prepayment"       REAL     NOT NULL DEFAULT 0,
  "photo_paths"      TEXT     NOT NULL DEFAULT '[]',
  "comments"         TEXT     NOT NULL DEFAULT '',
  "user_id"          INTEGER,
  "size_id"          INTEGER,
  "format_id"        INTEGER,
  "design_id"        INTEGER,
  "plot_id"          INTEGER,
  "discount_id"      INTEGER,
  CONSTRAINT "orders_user_id_fkey"     FOREIGN KEY ("user_id")     REFERENCES "users"     ("id") ON DELETE SET NULL,
  CONSTRAINT "orders_size_id_fkey"     FOREIGN KEY ("size_id")     REFERENCES "sizes"     ("id") ON DELETE SET NULL,
  CONSTRAINT "orders_format_id_fkey"   FOREIGN KEY ("format_id")   REFERENCES "formats"   ("id") ON DELETE SET NULL,
  CONSTRAINT "orders_design_id_fkey"   FOREIGN KEY ("design_id")   REFERENCES "designs"   ("id") ON DELETE SET NULL,
  CONSTRAINT "orders_plot_id_fkey"     FOREIGN KEY ("plot_id")     REFERENCES "plots"     ("id") ON DELETE SET NULL,
  CONSTRAINT "orders_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts" ("id") ON DELETE SET NULL
);

-- order_items
CREATE TABLE "order_items" (
  "id"         INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "order_id"   INTEGER NOT NULL,
  "quantity"   INTEGER NOT NULL DEFAULT 1,
  "price_unit" REAL    NOT NULL,
  "amount"     REAL    NOT NULL,
  CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE
);

-- admins
CREATE TABLE "admins" (
  "id"            INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "login"         TEXT    NOT NULL,
  "password_hash" TEXT    NOT NULL,
  CONSTRAINT "admins_login_key" UNIQUE ("login")
);
