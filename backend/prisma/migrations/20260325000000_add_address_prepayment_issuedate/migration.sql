-- AddColumn address to users (with default)
ALTER TABLE "users" ADD COLUMN "address" TEXT NOT NULL DEFAULT '';

-- AddColumn prepayment to orders
ALTER TABLE "orders" ADD COLUMN "prepayment" REAL NOT NULL DEFAULT 0;

-- AddColumn issue_date to orders
ALTER TABLE "orders" ADD COLUMN "issue_date" TEXT NOT NULL DEFAULT '';
