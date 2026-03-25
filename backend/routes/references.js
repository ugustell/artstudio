const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// ЭТОТ РОУТ НУЖЕН ФРОНТЕНДУ (GET /api/prices/options)
router.get('/options', async (req, res) => {
  try {
    const [sizes, formats, designs, plots, discounts] = await Promise.all([
      prisma.size.findMany({ orderBy: { price: 'asc' } }),
      prisma.format.findMany({ orderBy: { id: 'asc' } }),
      prisma.design.findMany({ orderBy: { id: 'asc' } }),
      prisma.plot.findMany({ orderBy: { id: 'asc' } }),
      prisma.discount.findMany({ orderBy: { id: 'asc' } }),
    ]);

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

// Стандартные роуты (оставляем как есть)
router.get('/sizes',     async (req, res) => res.json(await prisma.size.findMany()));
router.get('/formats',   async (req, res) => res.json(await prisma.format.findMany()));
router.get('/designs',   async (req, res) => res.json(await prisma.design.findMany()));
router.get('/plots',     async (req, res) => res.json(await prisma.plot.findMany()));

module.exports = router;