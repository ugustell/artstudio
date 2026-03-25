-- Migration: new normalized schema matching ER diagram
-- Drops old tables and creates new normalized structure

PRAGMA foreign_keys=OFF;

-- Drop old tables
DROP TABLE IF EXISTS "orders";
DROP TABLE IF EXISTS "prices";
DROP TABLE IF EXISTS "users";
DROP TABLE IF EXISTS "admins";

-- ─── Пользователи ────────────────────────────────────────────────────────────
CREATE TABLE "users" (
    "id"         INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name"       TEXT NOT NULL,
    "email"      TEXT NOT NULL,
    "password"   TEXT NOT NULL,
    "role"       TEXT NOT NULL DEFAULT 'client',
    "address"    TEXT NOT NULL DEFAULT '',
    "phone"      TEXT NOT NULL
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- ─── Скидки/надбавки ─────────────────────────────────────────────────────────
CREATE TABLE "discounts" (
    "id"          INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "percent"     REAL NOT NULL,
    "description" TEXT NOT NULL
);

-- ─── Размеры холста ───────────────────────────────────────────────────────────
CREATE TABLE "canvas_sizes" (
    "id"   INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "size" TEXT NOT NULL
);
CREATE UNIQUE INDEX "canvas_sizes_size_key" ON "canvas_sizes"("size");

-- ─── Виды оформления ──────────────────────────────────────────────────────────
CREATE TABLE "design_types" (
    "id"   INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);
CREATE UNIQUE INDEX "design_types_name_key" ON "design_types"("name");

-- ─── Техники исполнения ───────────────────────────────────────────────────────
CREATE TABLE "techniques" (
    "id"   INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);
CREATE UNIQUE INDEX "techniques_name_key" ON "techniques"("name");

-- ─── Сюжеты ───────────────────────────────────────────────────────────────────
CREATE TABLE "subjects" (
    "id"   INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);
CREATE UNIQUE INDEX "subjects_name_key" ON "subjects"("name");

-- ─── Прайс-лист ───────────────────────────────────────────────────────────────
CREATE TABLE "prices" (
    "id"             INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "canvas_size_id" INTEGER NOT NULL,
    "design_type_id" INTEGER NOT NULL,
    "technique_id"   INTEGER NOT NULL,
    "subject_id"     INTEGER NOT NULL,
    "price"          REAL NOT NULL,
    CONSTRAINT "prices_canvas_size_id_fkey" FOREIGN KEY ("canvas_size_id") REFERENCES "canvas_sizes" ("id"),
    CONSTRAINT "prices_design_type_id_fkey" FOREIGN KEY ("design_type_id") REFERENCES "design_types" ("id"),
    CONSTRAINT "prices_technique_id_fkey"   FOREIGN KEY ("technique_id")   REFERENCES "techniques"   ("id"),
    CONSTRAINT "prices_subject_id_fkey"     FOREIGN KEY ("subject_id")     REFERENCES "subjects"     ("id")
);
CREATE UNIQUE INDEX "prices_unique" ON "prices"("canvas_size_id","design_type_id","technique_id","subject_id");

-- ─── Заказы ───────────────────────────────────────────────────────────────────
CREATE TABLE "orders" (
    "id"          INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id"     INTEGER,
    "created_at"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline"    TEXT NOT NULL DEFAULT '',
    "issue_date"  TEXT NOT NULL DEFAULT '',
    "discount_id" INTEGER,
    "total_price" REAL NOT NULL,
    "prepayment"  REAL NOT NULL DEFAULT 0,
    "status"      TEXT NOT NULL DEFAULT 'new',
    "photo_paths" TEXT NOT NULL DEFAULT '[]',
    "comments"    TEXT NOT NULL DEFAULT '',
    CONSTRAINT "orders_user_id_fkey"     FOREIGN KEY ("user_id")     REFERENCES "users"     ("id") ON DELETE SET NULL,
    CONSTRAINT "orders_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts" ("id") ON DELETE SET NULL
);

-- ─── Картины в заказе ─────────────────────────────────────────────────────────
CREATE TABLE "order_items" (
    "id"             INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "order_id"       INTEGER NOT NULL,
    "price_id"       INTEGER NOT NULL,
    "quantity"       INTEGER NOT NULL DEFAULT 1,
    "price_per_unit" REAL NOT NULL,
    "total"          REAL NOT NULL,
    CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE,
    CONSTRAINT "order_items_price_id_fkey" FOREIGN KEY ("price_id") REFERENCES "prices" ("id")
);

-- ─── Администраторы ───────────────────────────────────────────────────────────
CREATE TABLE "admins" (
    "id"            INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "login"         TEXT NOT NULL,
    "password_hash" TEXT NOT NULL
);
CREATE UNIQUE INDEX "admins_login_key" ON "admins"("login");

PRAGMA foreign_keys=ON;
