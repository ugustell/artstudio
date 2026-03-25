// GET /api/sizes, /api/formats, /api/designs, /api/plots, /api/discounts
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ── GET все ───────────────────────────────────────────────────────────────────
router.get('/sizes',     async (req, res) => {
  const data = await prisma.size.findMany({ orderBy: { price: 'asc' } });
  res.json(data);
});
router.get('/formats',   async (req, res) => {
  const data = await prisma.format.findMany({ orderBy: { id: 'asc' } });
  res.json(data);
});
router.get('/designs',   async (req, res) => {
  const data = await prisma.design.findMany({ orderBy: { id: 'asc' } });
  res.json(data);
});
router.get('/plots',     async (req, res) => {
  const data = await prisma.plot.findMany({ orderBy: { id: 'asc' } });
  res.json(data);
});
router.get('/discounts', async (req, res) => {
  const data = await prisma.discount.findMany({ orderBy: { id: 'asc' } });
  res.json(data);
});

// GET /api/prices/options (Сборный роут для фронтенда)
router.get('/options', async (req, res) => {
  try {
    const [sizes, formats, designs, plots, discounts] = await Promise.all([
      prisma.size.findMany({ orderBy: { price: 'asc' } }),
      prisma.format.findMany({ orderBy: { id: 'asc' } }),
      prisma.design.findMany({ orderBy: { id: 'asc' } }),
      prisma.plot.findMany({ orderBy: { id: 'asc' } }),
      prisma.discount.findMany({ orderBy: { id: 'asc' } }),
    ]);
    
    // Возвращаем объект, который ожидает фронтенд
    res.json({
      canvasSizes: sizes,
      designTypes: formats,
      techniques: designs,
      subjects: plots,
      discounts: discounts
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка загрузки справочников' });
  }
});

// ── Калькулятор цены (публичный) ──────────────────────────────────────────────
// GET /api/calc?sizeId=1&formatId=2&designId=3&plotId=4&quantity=1&deadline=2026-04-10
router.get('/calc', async (req, res) => {
  const { sizeId, formatId, designId, plotId, quantity = 1, deadline } = req.query;
  try {
    const [size, format, design, plot] = await Promise.all([
      sizeId   ? prisma.size.findUnique({ where: { id: Number(sizeId) } })     : null,
      formatId ? prisma.format.findUnique({ where: { id: Number(formatId) } }) : null,
      designId ? prisma.design.findUnique({ where: { id: Number(designId) } }) : null,
      plotId   ? prisma.plot.findUnique({ where: { id: Number(plotId) } })     : null,
    ]);

    const basePrice  = size?.price        || 0;
    const fmtExtra   = format?.priceExtra || 0;
    const dsgExtra   = design?.priceExtra || 0;
    const pltExtra   = plot?.priceExtra   || 0;
    const priceUnit  = basePrice + fmtExtra + dsgExtra + pltExtra;
    const qty        = Number(quantity) || 1;

    // Срочность по дате
    let surchargePercent = 0, surchargeReason = '';
    if (deadline) {
      const today = new Date(); today.setHours(0,0,0,0);
      const days  = Math.ceil((new Date(deadline) - today) / 86400000);
      if      (days < 3)  { surchargePercent = 60; surchargeReason = 'Очень срочный заказ (менее 3 дней)'; }
      else if (days < 7)  { surchargePercent = 30; surchargeReason = 'Срочный заказ (3–6 дней)'; }
      else if (days < 14) { surchargePercent = 15; surchargeReason = 'Ускоренный срок (7–13 дней)'; }
      else if (days >= 30){ surchargePercent = -5; surchargeReason = 'Длительный срок (30+ дней)'; }
    }

    // Скидка за количество
    let discountPercent = 0, discountReason = '';
    if      (qty >= 10) { discountPercent = 20; discountReason = 'Скидка за объём — 10+ картин'; }
    else if (qty >= 5)  { discountPercent = 15; discountReason = 'Скидка за объём — 5–9 картин'; }
    else if (qty >= 3)  { discountPercent = 10; discountReason = 'Скидка за объём — 3–4 картины'; }
    else if (qty >= 2)  { discountPercent =  5; discountReason = 'Скидка за объём — 2 картины'; }

    const totalSurcharge = Math.max(surchargePercent, 0);
    const totalDiscount  = discountPercent + (surchargePercent < 0 ? Math.abs(surchargePercent) : 0);
    const totalPrice = Math.round(priceUnit * qty * (1 + totalSurcharge / 100) * (1 - totalDiscount / 100));

    res.json({
      priceUnit, basePrice, fmtExtra, dsgExtra, pltExtra,
      quantity: qty, surchargePercent, surchargeReason,
      discountPercent, discountReason, totalPrice,
    });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка расчёта' });
  }
});

// ── CRUD справочников (только admin) ─────────────────────────────────────────
router.put('/sizes/:id',   auth, async (req, res) => {
  const { price } = req.body;
  const updated = await prisma.size.update({ where: { id: Number(req.params.id) }, data: { price: Number(price) } });
  res.json(updated);
});
router.put('/formats/:id', auth, async (req, res) => {
  const { priceExtra } = req.body;
  const updated = await prisma.format.update({ where: { id: Number(req.params.id) }, data: { priceExtra: Number(priceExtra) } });
  res.json(updated);
});
router.put('/designs/:id', auth, async (req, res) => {
  const { priceExtra } = req.body;
  const updated = await prisma.design.update({ where: { id: Number(req.params.id) }, data: { priceExtra: Number(priceExtra) } });
  res.json(updated);
});
router.put('/plots/:id',   auth, async (req, res) => {
  const { priceExtra } = req.body;
  const updated = await prisma.plot.update({ where: { id: Number(req.params.id) }, data: { priceExtra: Number(priceExtra) } });
  res.json(updated);
});

module.exports = router;
