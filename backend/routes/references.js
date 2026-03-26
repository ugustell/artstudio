// routes/references.js
// Справочники: /api/sizes, /api/formats, /api/designs, /api/plots,
//              /api/discounts, /api/calc
// Совместимость с фронтом: /api/prices/options, /api/prices
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// ВАЖНО: /api/prices/options должен быть ДО /api/prices,
// иначе Express матчит "options" как :id в /prices/:id
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/prices/options — фронт загружает все справочники одним запросом
// Маппинг: sizes→canvasSizes, formats→designTypes, designs→techniques, plots→subjects
router.get('/prices/options', async (req, res) => {
  try {
    const [sizes, formats, designs, plots, discounts] = await Promise.all([
      prisma.size.findMany     ({ orderBy: { id: 'asc' } }),
      prisma.format.findMany   ({ orderBy: { id: 'asc' } }),
      prisma.design.findMany   ({ orderBy: { id: 'asc' } }),
      prisma.plot.findMany     ({ orderBy: { id: 'asc' } }),
      prisma.discount.findMany ({ orderBy: { id: 'asc' } }),
    ]);

    // Отдаём в формате который ожидает фронт
    res.json({
      // Размер холста
      canvasSizes: sizes.map(s => ({ id: s.id, size: s.size, price: s.price })),
      // Оформление (frame / mounting)
      designTypes: formats.map(f => ({ id: f.id, name: f.format, priceExtra: f.priceExtra })),
      // Техника живописи
      techniques:  designs.map(d => ({ id: d.id, name: d.design, priceExtra: d.priceExtra })),
      // Сюжет
      subjects:    plots.map(p => ({ id: p.id, name: p.plot, priceExtra: p.priceExtra })),
      // Скидки/надбавки
      discounts,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка получения справочников' });
  }
});

// GET /api/prices — обратная совместимость (фронт /pages/prices.js тоже использует)
router.get('/prices', async (req, res) => {
  try {
    const sizes = await prisma.size.findMany({ orderBy: { price: 'asc' } });
    res.json(sizes.map(s => ({ id: s.id, size: s.size, price: s.price })));
  } catch (e) {
    res.status(500).json({ error: 'Ошибка получения прайса' });
  }
});

// ── GET все справочники ───────────────────────────────────────────────────────
router.get('/sizes',     async (req, res) => {
  res.json(await prisma.size.findMany({ orderBy: { price: 'asc' } }));
});
router.get('/formats',   async (req, res) => {
  res.json(await prisma.format.findMany({ orderBy: { id: 'asc' } }));
});
router.get('/designs',   async (req, res) => {
  res.json(await prisma.design.findMany({ orderBy: { id: 'asc' } }));
});
router.get('/plots',     async (req, res) => {
  res.json(await prisma.plot.findMany({ orderBy: { id: 'asc' } }));
});
router.get('/discounts', async (req, res) => {
  res.json(await prisma.discount.findMany({ orderBy: { id: 'asc' } }));
});

// ── Калькулятор цены (публичный) ──────────────────────────────────────────────
// GET /api/calc?sizeId=1&formatId=2&designId=3&plotId=4&quantity=1&deadline=2026-04-10
// Фронт также шлёт canvasSizeId/designTypeId/techniqueId/subjectId — поддерживаем оба варианта
router.get('/calc', async (req, res) => {
  // поддержка обоих наименований полей
  const sizeId   = req.query.sizeId   || req.query.canvasSizeId;
  const formatId = req.query.formatId || req.query.designTypeId;
  const designId = req.query.designId || req.query.techniqueId;
  const plotId   = req.query.plotId   || req.query.subjectId;
  const { quantity = 1, deadline } = req.query;

  try {
    const [size, format, design, plot] = await Promise.all([
      sizeId   ? prisma.size.findUnique   ({ where: { id: Number(sizeId) } })   : null,
      formatId ? prisma.format.findUnique ({ where: { id: Number(formatId) } }) : null,
      designId ? prisma.design.findUnique ({ where: { id: Number(designId) } }) : null,
      plotId   ? prisma.plot.findUnique   ({ where: { id: Number(plotId) } })   : null,
    ]);

    const basePrice = size?.price        || 0;
    const fmtExtra  = format?.priceExtra || 0;
    const dsgExtra  = design?.priceExtra || 0;
    const pltExtra  = plot?.priceExtra   || 0;
    const priceUnit = basePrice + fmtExtra + dsgExtra + pltExtra;
    const qty       = Number(quantity) || 1;

    let surchargePercent = 0, surchargeReason = '';
    if (deadline) {
      const today = new Date(); today.setHours(0,0,0,0);
      const days  = Math.ceil((new Date(deadline) - today) / 86400000);
      if      (days < 3)  { surchargePercent = 60; surchargeReason = 'Очень срочный заказ (менее 3 дней)'; }
      else if (days < 7)  { surchargePercent = 30; surchargeReason = 'Срочный заказ (3–6 дней)'; }
      else if (days < 14) { surchargePercent = 15; surchargeReason = 'Ускоренный срок (7–13 дней)'; }
      else if (days >= 30){ surchargePercent = -5; surchargeReason = 'Длительный срок (30+ дней)'; }
    }

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
router.post('/sizes', auth, async (req, res) => {
  const { size, price } = req.body;
  if (!size || price === undefined || price === null || Number.isNaN(Number(price))) {
    return res.status(400).json({ error: 'Укажите size и price' });
  }
  try {
    const created = await prisma.size.create({ data: { size: String(size), price: Number(price) } });
    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка создания размера' });
  }
});
router.delete('/sizes/:id', auth, async (req, res) => {
  try {
    await prisma.size.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка удаления размера' });
  }
});

router.post('/formats', auth, async (req, res) => {
  const { format, priceExtra = 0 } = req.body;
  if (!format) return res.status(400).json({ error: 'Укажите format' });
  if (Number.isNaN(Number(priceExtra))) return res.status(400).json({ error: 'Укажите корректный priceExtra' });
  try {
    const created = await prisma.format.create({ data: { format: String(format), priceExtra: Number(priceExtra) } });
    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка создания оформления' });
  }
});
router.delete('/formats/:id', auth, async (req, res) => {
  try {
    await prisma.format.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка удаления оформления' });
  }
});

router.post('/designs', auth, async (req, res) => {
  const { design, priceExtra = 0 } = req.body;
  if (!design) return res.status(400).json({ error: 'Укажите design' });
  if (Number.isNaN(Number(priceExtra))) return res.status(400).json({ error: 'Укажите корректный priceExtra' });
  try {
    const created = await prisma.design.create({ data: { design: String(design), priceExtra: Number(priceExtra) } });
    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка создания техники' });
  }
});
router.delete('/designs/:id', auth, async (req, res) => {
  try {
    await prisma.design.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка удаления техники' });
  }
});

router.post('/plots', auth, async (req, res) => {
  const { plot, priceExtra = 0 } = req.body;
  if (!plot) return res.status(400).json({ error: 'Укажите plot' });
  if (Number.isNaN(Number(priceExtra))) return res.status(400).json({ error: 'Укажите корректный priceExtra' });
  try {
    const created = await prisma.plot.create({ data: { plot: String(plot), priceExtra: Number(priceExtra) } });
    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка создания сюжета' });
  }
});
router.delete('/plots/:id', auth, async (req, res) => {
  try {
    await prisma.plot.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка удаления сюжета' });
  }
});

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
