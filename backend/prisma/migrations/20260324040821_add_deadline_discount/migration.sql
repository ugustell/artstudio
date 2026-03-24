-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_orders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "design" TEXT NOT NULL,
    "material" TEXT NOT NULL DEFAULT '',
    "coating" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'new',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "deadline" TEXT NOT NULL DEFAULT '',
    "base_price" REAL NOT NULL DEFAULT 0,
    "discount_percent" REAL NOT NULL DEFAULT 0,
    "discount_reason" TEXT NOT NULL DEFAULT '',
    "surcharge_percent" REAL NOT NULL DEFAULT 0,
    "surcharge_reason" TEXT NOT NULL DEFAULT '',
    "total_price" REAL NOT NULL,
    "photo_paths" TEXT NOT NULL DEFAULT '[]',
    "comments" TEXT NOT NULL DEFAULT '',
    "user_id" INTEGER,
    CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_orders" ("client_name", "coating", "comments", "created_at", "design", "email", "format", "id", "material", "phone", "photo_paths", "size", "status", "total_price", "user_id") SELECT "client_name", "coating", "comments", "created_at", "design", "email", "format", "id", "material", "phone", "photo_paths", "size", "status", "total_price", "user_id" FROM "orders";
DROP TABLE "orders";
ALTER TABLE "new_orders" RENAME TO "orders";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
