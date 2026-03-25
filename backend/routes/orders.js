const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { PrismaClient } = require('@prisma/client');
const auth     = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ─── Multer ───────────────────────────────────────────────────────────────────
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
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|gif|webp|tiff/.test(path.extname(file.originalname).toLowerCase());
    ok ? cb(null, true) : cb(new Error('Разрешены только изображения'));
  },
});

// ─── Логика скидок ────────────────────────────────────────────────────────────
//
// Скидки хранятся в таблице discounts.
// При создании заказа подбирается подходящая скидка/надбавка.
//
// НАДБАВКИ (percent > 0): срочность, портрет, авторский стиль
// СКИДКИ   (percent < 0): объём, дальний срок
//
// Итог позиции = price_per_unit × quantity
// Итог заказа  = сумма позиций × (1 + discount.percent/100)

async function findDiscount({ quantity, deadline, techniqueId }) {
  let discountPercent = 0;
  let reason = null;

  // Надбавка за срочность
  if (deadline) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((new Date(deadline) - today) / (1000 * 60 * 60 * 24));
    if      (daysLeft < 3)  { discountPercent = 60;  reason = 'Надбавка: очень срочный заказ (менее 3 дней)'; }
    else if (daysLeft < 7)  { discountPercent = 30;  reason = 'Надбавка: срочный заказ (3–6 дней)'; }
    else if (daysLeft < 14) { discountPercent = 15;  reason = 'Надбавка: ускоренный срок (7–13 дней)'; }
    else if (daysLeft >= 30 && discountPercent === 0) {
      discountPercent = -5; reason = 'Длительный срок (30+ дней)';
    }
  }

  // Надбавка за технику (авторский стиль / сложный сюжет)
  if (techniqueId && discountPercent === 0) {
    const technique = await prisma.technique.findUnique({ where: { id: Number(techniqueId) } });
    if (technique) {
      const t = technique.name.toLowerCase();
      if (t.includes('ван гога') || t.includes('моне') || t.includes('климта')) {
        discountPercent = 30; reason = 'Надбавка: авторский стиль (копия мастера)';
      } else if (t.includes('реализм') || t.includes('портрет')) {
        discountPercent = 20; reason = 'Надбавка: сложный сюжет / портрет';
      }
    }
  }

  // Скидка за объём
  if (discountPercent === 0) {
    const qty = Number(quantity) || 1;
    if      (qty >= 10) { discountPercent = -20; reason = 'Скидка за объём (10+ картин)'; }
    else if (qty >= 5)  { discountPercent = -15; reason = 'Скидка за объём (5–9 картин)'; }
    else if (qty >= 3)  { discountPercent = -10; reason = 'Скидка за объём (3–4 картины)'; }
    else if (qty >= 2)  { discountPercent = -5;  reason = 'Скидка за объём (2 картины)'; }
  }

  if (!reason) return null; // нет скидки/надбавки

  // Найти или создать запись скидки
  let discount = await prisma.discount.findFirst({ where: { percent: discountPercent, description: reason } });
  if (!discount) {
    discount = await prisma.discount.create({ data: { percent: discountPercent, description: reason } });
  }
  return discount;
}

// ─── POST /api/orders — создать заказ ────────────────────────────────────────
// Body: { clientName, phone, email, items: [{priceId, quantity}], deadline, comments, prepayment }
// photos: multipart files
router.post('/', upload.array('photos', 5), async (req, res) => {
  const { clientName, phone, email, deadline, comments, prepayment } = req.body;

  // items передаётся как JSON-строка: [{priceId, quantity}]
  let items = [];
  try {
    items = JSON.parse(req.body.items || '[]');
  } catch {
    return res.status(400).json({ error: 'Некорректный формат items' });
  }

  if (!clientName || !phone || !email || !items.length) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }

  try {
    // Получаем цены для всех позиций
    const priceIds = items.map(i => Number(i.priceId));
    const priceRecords = await prisma.price.findMany({
      where: { id: { in: priceIds } },
      include: { technique: true },
    });
    const priceMap = Object.fromEntries(priceRecords.map(p => [p.id, p]));

    // Проверяем, что все priceId существуют
    for (const item of items) {
      if (!priceMap[item.priceId]) {
        return res.status(400).json({ error: `Позиция прайса ${item.priceId} не найдена` });
      }
    }

    // Подсчёт позиций
    const orderItemsData = items.map(item => {
      const priceRec = priceMap[item.priceId];
      const qty      = Number(item.quantity) || 1;
      return {
        priceId:      priceRec.id,
        quantity:     qty,
        pricePerUnit: priceRec.price,
        total:        Math.round(priceRec.price * qty),
      };
    });

    const subtotal     = orderItemsData.reduce((s, i) => s + i.total, 0);
    const totalQty     = orderItemsData.reduce((s, i) => s + i.quantity, 0);
    const firstTech    = priceRecords[0]?.techniqueId;

    // Скидка (на весь заказ)
    const discount = await findDiscount({ quantity: totalQty, deadline, techniqueId: firstTech });
    const factor   = discount ? (1 + discount.percent / 100) : 1;
    const total    = Math.round(subtotal * factor);

    const photoPaths  = (req.files || []).map(f => `/uploads/${f.filename}`);
    const prepaymentVal = Math.max(0, Number(prepayment) || 0);

    // Привязка к пользователю (если токен есть)
    let userId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        userId = decoded.id;
      } catch {}
    }

    const order = await prisma.order.create({
      data: {
        userId,
        discountId: discount?.id || null,
        totalPrice: total,
        prepayment: prepaymentVal,
        deadline:   deadline  || '',
        comments:   comments  || '',
        photoPaths: JSON.stringify(photoPaths),
        status:     'new',
        items: {
          create: orderItemsData,
        },
      },
      include: { items: true, discount: true },
    });

    res.status(201).json({
      success:        true,
      orderId:        order.id,
      subtotal,
      discount:       discount ? { percent: discount.percent, description: discount.description } : null,
      totalPrice:     total,
      prepayment:     prepaymentVal,
      remainder:      total - prepaymentVal,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при создании заказа' });
  }
});

// ─── GET /api/orders — список (admin) ────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  const { status, search, page = 1, limit = 20, dateFrom, dateTo } = req.query;
  const skip  = (Number(page) - 1) * Number(limit);
  const where = {};

  if (status && status !== 'all') where.status = status;
  if (search) {
    where.OR = [
      { user: { name:  { contains: search } } },
      { user: { phone: { contains: search } } },
      { user: { email: { contains: search } } },
    ];
  }
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo)   { const d = new Date(dateTo); d.setHours(23,59,59,999); where.createdAt.lte = d; }
  }

  try {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        include: {
          user:     { select: { id: true, name: true, phone: true, email: true } },
          discount: true,
          items: {
            include: {
              price: {
                include: {
                  canvasSize: true,
                  designType: true,
                  technique:  true,
                  subject:    true,
                },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders: orders.map(o => ({ ...o, photoPaths: JSON.parse(o.photoPaths || '[]') })),
      total, page: Number(page), pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения заказов' });
  }
});

// ─── GET /api/orders/:id (admin) ─────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        user:     { select: { id: true, name: true, phone: true, email: true } },
        discount: true,
        items: {
          include: {
            price: {
              include: {
                canvasSize: true,
                designType: true,
                technique:  true,
                subject:    true,
              },
            },
          },
        },
      },
    });
    if (!order) return res.status(404).json({ error: 'Заказ не найден' });
    res.json({ ...order, photoPaths: JSON.parse(order.photoPaths || '[]') });
  } catch { res.status(500).json({ error: 'Ошибка сервера' }); }
});

// ─── PATCH /api/orders/:id (admin) ───────────────────────────────────────────
router.patch('/:id', auth, async (req, res) => {
  const { status, comments, issueDate } = req.body;
  const allowed = ['new', 'in_progress', 'ready', 'delivered'];
  if (status && !allowed.includes(status)) return res.status(400).json({ error: 'Недопустимый статус' });
  try {
    const data = {};
    if (status    !== undefined) data.status    = status;
    if (comments  !== undefined) data.comments  = comments;
    if (issueDate !== undefined) data.issueDate = issueDate;
    const order = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data,
      include: { discount: true, items: { include: { price: { include: { canvasSize: true, designType: true, technique: true, subject: true } } } } },
    });
    res.json({ ...order, photoPaths: JSON.parse(order.photoPaths || '[]') });
  } catch { res.status(500).json({ error: 'Ошибка обновления' }); }
});

// ─── DELETE /api/orders/:id (admin) ──────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } });
    if (!order) return res.status(404).json({ error: 'Заказ не найден' });
    JSON.parse(order.photoPaths || '[]').forEach(p => {
      const abs = path.join(__dirname, '..', p);
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    });
    await prisma.order.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Ошибка удаления' }); }
});

// ─── GET /api/orders/calc — предварительный расчёт (публичный) ───────────────
// Query: ?priceId=1&quantity=3&deadline=2026-04-10
router.get('/calc', async (req, res) => {
  const { priceId, quantity, deadline } = req.query;
  try {
    const priceRec = priceId ? await prisma.price.findUnique({ where: { id: Number(priceId) }, include: { technique: true } }) : null;
    if (!priceRec) return res.status(404).json({ error: 'Позиция не найдена' });

    const qty      = Number(quantity) || 1;
    const subtotal = priceRec.price * qty;
    const discount = await findDiscount({ quantity: qty, deadline, techniqueId: priceRec.techniqueId });
    const factor   = discount ? (1 + discount.percent / 100) : 1;
    const total    = Math.round(subtotal * factor);

    res.json({
      pricePerUnit: priceRec.price,
      quantity:     qty,
      subtotal,
      discount:     discount ? { percent: discount.percent, description: discount.description } : null,
      total,
    });
  } catch { res.status(500).json({ error: 'Ошибка расчёта' }); }
});

module.exports = router;
