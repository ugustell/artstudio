const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/prices — публичный
router.get('/', async (req, res) => {
  try {
    const prices = await prisma.price.findMany({ orderBy: { id: 'asc' } });
    res.json(prices);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения прайса' });
  }
});

// PUT /api/prices/:id — обновить цену (только admin)
router.put('/:id', auth, async (req, res) => {
  const { price } = req.body;
  if (!price || isNaN(price)) {
    return res.status(400).json({ error: 'Укажите корректную цену' });
  }
  try {
    const updated = await prisma.price.update({
      where: { id: Number(req.params.id) },
      data:  { price: Number(price) },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обновления цены' });
  }
});

// POST /api/prices — добавить позицию (только admin)
router.post('/', auth, async (req, res) => {
  const { size, price } = req.body;
  if (!size || !price) return res.status(400).json({ error: 'Укажите размер и цену' });
  try {
    const created = await prisma.price.create({ data: { size, price: Number(price) } });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка создания' });
  }
});

// DELETE /api/prices/:id — удалить позицию (только admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.price.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});

module.exports = router;
