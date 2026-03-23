const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { PrismaClient } = require('@prisma/client');
const auth     = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Multer — сохраняем фото в uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB на файл
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
               allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Разрешены только изображения'));
  },
});

// ─── POST /api/orders — создать заказ (публичный) ───────────────────────────
router.post('/', upload.array('photos', 5), async (req, res) => {
  const { clientName, phone, email, size, format, design, comments } = req.body;

  if (!clientName || !phone || !email || !size || !format || !design) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }

  try {
    // Получаем базовую цену из прайс-листа
    const priceEntry = await prisma.price.findUnique({ where: { size } });
    const basePrice   = priceEntry ? priceEntry.price : 0;
    const designExtra = design === 'С дизайном' ? 300 : design === 'Срочная обработка' ? 700 : 0;
    const frameExtra  = format === 'В раме' ? 500 : format === 'Модульная картина' ? 800 : 0;
    const totalPrice  = basePrice + designExtra + frameExtra;

    const photoPaths = (req.files || []).map(f => `/uploads/${f.filename}`);

    const order = await prisma.order.create({
      data: {
        clientName,
        phone,
        email,
        size,
        format,
        design,
        status:    'new',
        totalPrice,
        photoPaths: JSON.stringify(photoPaths),
        comments:  comments || '',
      },
    });

    res.status(201).json({ success: true, orderId: order.id, totalPrice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при создании заказа' });
  }
});

// ─── GET /api/orders — список заказов (только admin) ────────────────────────
router.get('/', auth, async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {};
  if (status && status !== 'all') where.status = status;
  if (search) {
    where.OR = [
      { clientName: { contains: search } },
      { phone:      { contains: search } },
      { email:      { contains: search } },
    ];
  }

  try {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.order.count({ where }),
    ]);

    // Парсим photoPaths из строки в массив
    const parsed = orders.map(o => ({
      ...o,
      photoPaths: JSON.parse(o.photoPaths || '[]'),
    }));

    res.json({ orders: parsed, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения заказов' });
  }
});

// ─── GET /api/orders/:id — детали заказа (только admin) ─────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } });
    if (!order) return res.status(404).json({ error: 'Заказ не найден' });
    res.json({ ...order, photoPaths: JSON.parse(order.photoPaths || '[]') });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── PATCH /api/orders/:id — изменить статус (только admin) ─────────────────
router.patch('/:id', auth, async (req, res) => {
  const { status, comments } = req.body;
  const allowed = ['new', 'in_progress', 'ready', 'delivered'];

  if (status && !allowed.includes(status)) {
    return res.status(400).json({ error: 'Недопустимый статус' });
  }

  try {
    const data = {};
    if (status)   data.status   = status;
    if (comments !== undefined) data.comments = comments;

    const order = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data,
    });
    res.json({ ...order, photoPaths: JSON.parse(order.photoPaths || '[]') });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});

// ─── DELETE /api/orders/:id — удалить заказ (только admin) ──────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } });
    if (!order) return res.status(404).json({ error: 'Заказ не найден' });

    // Удаляем файлы фото
    const photos = JSON.parse(order.photoPaths || '[]');
    photos.forEach(p => {
      const abs = path.join(__dirname, '..', p);
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    });

    await prisma.order.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});

module.exports = router;
