const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ─── GET /api/prices — публичный, полный прайс со связанными данными ──────────
router.get('/', async (req, res) => {
  const { canvasSizeId, designTypeId, techniqueId, subjectId } = req.query;
  const where = {};
  if (canvasSizeId) where.canvasSizeId = Number(canvasSizeId);
  if (designTypeId) where.designTypeId = Number(designTypeId);
  if (techniqueId)  where.techniqueId  = Number(techniqueId);
  if (subjectId)    where.subjectId    = Number(subjectId);

  try {
    const prices = await prisma.price.findMany({
      where,
      include: {
        canvasSize: true,
        designType: true,
        technique:  true,
        subject:    true,
      },
      orderBy: { id: 'asc' },
    });
    res.json(prices);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения прайса' });
  }
});

// ─── GET /api/prices/options — справочники для форм ──────────────────────────
router.get('/options', async (req, res) => {
  try {
    const [canvasSizes, designTypes, techniques, subjects, discounts] = await Promise.all([
      prisma.canvasSize.findMany({ orderBy: { id: 'asc' } }),
      prisma.designType.findMany({ orderBy: { id: 'asc' } }),
      prisma.technique.findMany ({ orderBy: { id: 'asc' } }),
      prisma.subject.findMany   ({ orderBy: { id: 'asc' } }),
      prisma.discount.findMany  ({ orderBy: { id: 'asc' } }),
    ]);
    res.json({ canvasSizes, designTypes, techniques, subjects, discounts });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения справочников' });
  }
});

// ─── GET /api/prices/:id — одна позиция ──────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const price = await prisma.price.findUnique({
      where:   { id: Number(req.params.id) },
      include: { canvasSize: true, designType: true, technique: true, subject: true },
    });
    if (!price) return res.status(404).json({ error: 'Позиция не найдена' });
    res.json(price);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── PUT /api/prices/:id — обновить цену (admin) ──────────────────────────────
router.put('/:id', auth, async (req, res) => {
  const { price } = req.body;
  if (!price || isNaN(price)) return res.status(400).json({ error: 'Укажите корректную цену' });
  try {
    const updated = await prisma.price.update({
      where:   { id: Number(req.params.id) },
      data:    { price: Number(price) },
      include: { canvasSize: true, designType: true, technique: true, subject: true },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обновления цены' });
  }
});

// ─── POST /api/prices — добавить позицию (admin) ──────────────────────────────
router.post('/', auth, async (req, res) => {
  const { canvasSizeId, designTypeId, techniqueId, subjectId, price } = req.body;
  if (!canvasSizeId || !designTypeId || !techniqueId || !subjectId || !price) {
    return res.status(400).json({ error: 'Укажите все поля: canvasSizeId, designTypeId, techniqueId, subjectId, price' });
  }
  try {
    const created = await prisma.price.create({
      data: {
        canvasSizeId: Number(canvasSizeId),
        designTypeId: Number(designTypeId),
        techniqueId:  Number(techniqueId),
        subjectId:    Number(subjectId),
        price:        Number(price),
      },
      include: { canvasSize: true, designType: true, technique: true, subject: true },
    });
    res.status(201).json(created);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Такая комбинация уже существует' });
    res.status(500).json({ error: 'Ошибка создания' });
  }
});

// ─── DELETE /api/prices/:id — удалить позицию (admin) ────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.price.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});

// ─── CRUD для справочников (admin) ───────────────────────────────────────────

// Размеры холста
router.get ('/canvas-sizes',      async (req, res) => { res.json(await prisma.canvasSize.findMany({ orderBy: { id: 'asc' } })); });
router.post('/canvas-sizes', auth, async (req, res) => {
  const { size } = req.body;
  if (!size) return res.status(400).json({ error: 'Укажите размер' });
  try { res.status(201).json(await prisma.canvasSize.create({ data: { size } })); }
  catch { res.status(500).json({ error: 'Ошибка создания' }); }
});
router.delete('/canvas-sizes/:id', auth, async (req, res) => {
  try { await prisma.canvasSize.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); }
  catch { res.status(500).json({ error: 'Ошибка удаления' }); }
});

// Виды оформления
router.get ('/design-types',      async (req, res) => { res.json(await prisma.designType.findMany({ orderBy: { id: 'asc' } })); });
router.post('/design-types', auth, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Укажите название' });
  try { res.status(201).json(await prisma.designType.create({ data: { name } })); }
  catch { res.status(500).json({ error: 'Ошибка создания' }); }
});
router.delete('/design-types/:id', auth, async (req, res) => {
  try { await prisma.designType.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); }
  catch { res.status(500).json({ error: 'Ошибка удаления' }); }
});

// Техники исполнения
router.get ('/techniques',      async (req, res) => { res.json(await prisma.technique.findMany({ orderBy: { id: 'asc' } })); });
router.post('/techniques', auth, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Укажите название' });
  try { res.status(201).json(await prisma.technique.create({ data: { name } })); }
  catch { res.status(500).json({ error: 'Ошибка создания' }); }
});
router.delete('/techniques/:id', auth, async (req, res) => {
  try { await prisma.technique.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); }
  catch { res.status(500).json({ error: 'Ошибка удаления' }); }
});

// Сюжеты
router.get ('/subjects',      async (req, res) => { res.json(await prisma.subject.findMany({ orderBy: { id: 'asc' } })); });
router.post('/subjects', auth, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Укажите название' });
  try { res.status(201).json(await prisma.subject.create({ data: { name } })); }
  catch { res.status(500).json({ error: 'Ошибка создания' }); }
});
router.delete('/subjects/:id', auth, async (req, res) => {
  try { await prisma.subject.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); }
  catch { res.status(500).json({ error: 'Ошибка удаления' }); }
});

// Скидки/надбавки
router.get ('/discounts',      async (req, res) => { res.json(await prisma.discount.findMany({ orderBy: { id: 'asc' } })); });
router.post('/discounts', auth, async (req, res) => {
  const { percent, description } = req.body;
  if (percent === undefined || !description) return res.status(400).json({ error: 'Укажите percent и description' });
  try { res.status(201).json(await prisma.discount.create({ data: { percent: Number(percent), description } })); }
  catch { res.status(500).json({ error: 'Ошибка создания' }); }
});
router.put('/discounts/:id', auth, async (req, res) => {
  const { percent, description } = req.body;
  try {
    res.json(await prisma.discount.update({
      where: { id: Number(req.params.id) },
      data:  { ...(percent !== undefined && { percent: Number(percent) }), ...(description && { description }) },
    }));
  } catch { res.status(500).json({ error: 'Ошибка обновления' }); }
});
router.delete('/discounts/:id', auth, async (req, res) => {
  try { await prisma.discount.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); }
  catch { res.status(500).json({ error: 'Ошибка удаления' }); }
});

module.exports = router;
