-- Add per-item size/format/design/plot references to order_items
ALTER TABLE "order_items" ADD COLUMN "size_id"   INTEGER;
ALTER TABLE "order_items" ADD COLUMN "format_id" INTEGER;
ALTER TABLE "order_items" ADD COLUMN "design_id" INTEGER;
ALTER TABLE "order_items" ADD COLUMN "plot_id"   INTEGER;

-- Foreign key constraints
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_size_id_fkey"
  FOREIGN KEY ("size_id")   REFERENCES "sizes"("id")   ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_format_id_fkey"
  FOREIGN KEY ("format_id") REFERENCES "formats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_design_id_fkey"
  FOREIGN KEY ("design_id") REFERENCES "designs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_plot_id_fkey"
  FOREIGN KEY ("plot_id")   REFERENCES "plots"("id")   ON DELETE SET NULL ON UPDATE CASCADE;
