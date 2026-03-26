-- CreateTable
CREATE TABLE "sizes" (
    "id" SERIAL NOT NULL,
    "size" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "sizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formats" (
    "id" SERIAL NOT NULL,
    "format" TEXT NOT NULL,
    "price_extra" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "formats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designs" (
    "id" SERIAL NOT NULL,
    "design" TEXT NOT NULL,
    "price_extra" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "designs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plots" (
    "id" SERIAL NOT NULL,
    "plot" TEXT NOT NULL,
    "price_extra" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "plots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discounts" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "percent" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "password_hash" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "deadline" TEXT NOT NULL DEFAULT '',
    "issue_date" TEXT NOT NULL DEFAULT '',
    "discount_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount_reason" TEXT NOT NULL DEFAULT '',
    "surcharge_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "surcharge_reason" TEXT NOT NULL DEFAULT '',
    "total_price" DOUBLE PRECISION NOT NULL,
    "prepayment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "photo_paths" TEXT NOT NULL DEFAULT '[]',
    "comments" TEXT NOT NULL DEFAULT '',
    "user_id" INTEGER,
    "size_id" INTEGER,
    "format_id" INTEGER,
    "design_id" INTEGER,
    "plot_id" INTEGER,
    "discount_id" INTEGER,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price_unit" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "login" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sizes_size_key" ON "sizes"("size");

-- CreateIndex
CREATE UNIQUE INDEX "formats_format_key" ON "formats"("format");

-- CreateIndex
CREATE UNIQUE INDEX "designs_design_key" ON "designs"("design");

-- CreateIndex
CREATE UNIQUE INDEX "plots_plot_key" ON "plots"("plot");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admins_login_key" ON "admins"("login");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "sizes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_format_id_fkey" FOREIGN KEY ("format_id") REFERENCES "formats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_design_id_fkey" FOREIGN KEY ("design_id") REFERENCES "designs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_plot_id_fkey" FOREIGN KEY ("plot_id") REFERENCES "plots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

