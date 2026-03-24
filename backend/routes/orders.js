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

// ─── Логика скидок и надбавок ────────────────────────────────────────────────
//
// НАДБАВКИ (увеличивают цену):
//   Срочность по дате:
//     < 3 дней  → +60% (очень срочно)
//     3–6 дней  → +30% (срочно)
//     7–13 дней → +15% (ускоренно)
//     14+ дней  → 0%   (стандарт)
//   Портрет/сложный сюжет (в технике есть слово «портрет» или «реализм»):
//     → +20%
//   Авторские стили (Ван Гог, Моне, Климт):
//     → +30%
//
// СКИДКИ (уменьшают цену):
//   Количество картин в одном заказе:
//     2 картины → −5%
//     3–4       → −10%
//     5–9       → −15%
//     10+       → −20%
//   Дальний срок (30+ дней):
//     → −5% (художник может запланировать спокойно)
//
// Итог = base × quantity × (1 + surcharge/100) × (1 − discount/100)

function calcPricing({ basePrice, quantity, deadline, design }) {
  const qty  = Number(quantity) || 1;
  const base = Number(basePrice) || 0;

  // ── Надбавка за срочность ──────────────────────────────────────────────
  let surchargePercent = 0;
  let surchargeReason  = '';

  if (deadline) {
    const today     = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    const daysLeft  = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 3) {
      surchargePercent = 60;
      surchargeReason  = 'Очень срочный заказ (менее 3 дней)';
    } else if (daysLeft < 7) {
      surchargePercent = 30;
      surchargeReason  = 'Срочный заказ (3–6 дней)';
    } else if (daysLeft < 14) {
      surchargePercent = 15;
      surchargeReason  = 'Ускоренный срок (7–13 дней)';
    }
  }

  // Надбавка за сложный стиль
  const d = (design || '').toLowerCase();
  const isComplex = d.includes('портрет') || d.includes('реализм');
  const isAuthors = d.includes('ван гога') || d.includes('моне') || d.includes('климт');

  if (isAuthors) {
    surchargePercent = Math.max(surchargePercent, 30);
    surchargeReason  = surchargeReason
      ? surchargeReason + ' + авторский стиль'
      : 'Авторский стиль (копия мастера)';
  } else if (isComplex) {
    surchargePercent = Math.max(surchargePercent, 20);
    surchargeReason  = surchargeReason
      ? surchargeReason + ' + сложный сюжет'
      : 'Портрет / сложный реализм';
  }

  // ── Скидка за количество ───────────────────────────────────────────────
  let discountPercent = 0;
  let discountReason  = '';

  if (qty >= 10) {
    discountPercent = 20; discountReason = 'Скидка за объём (10+ картин)';
  } else if (qty >= 5) {
    discountPercent = 15; discountReason = 'Скидка за объём (5–9 картин)';
  } else if (qty >= 3) {
    discountPercent = 10; discountReason = 'Скидка за объём (3–4 картины)';
  } else if (qty >= 2) {
    discountPercent = 5;  discountReason = 'Скидка за объём (2 картины)';
  }

  // Скидка за нескорый срок (30+ дней)
  if (deadline) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((new Date(deadline) - today) / (1000 * 60 * 60 * 24));
    if (daysLeft >= 30 && surchargePercent === 0) {
      discountPercent = Math.max(discountPercent, 5);
      discountReason  = discountReason
        ? discountReason + ' + длительный срок'
        : 'Длительный срок (30+ дней)';
    }
  }

  // ── Итоговая цена ─────────────────────────────────────────────────────
  const totalPrice = Math.round(
    base * qty * (1 + surchargePercent / 100) * (1 - discountPercent / 100)
  );

  return { basePrice: base, quantity: qty, surchargePercent, surchargeReason, discountPercent, discountReason, totalPrice };
}

// ─── POST /api/orders — создать заказ (публичный) ────────────────────────────
router.post('/', upload.array('photos', 5), async (req, res) => {
  const { clientName, phone, email, size, format, design, material, coating, comments, deadline, quantity } = req.body;

  if (!clientName || !phone || !email || !size || !format || !design) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }

  try {
    // Базовая цена из прайса
    const priceEntry = await prisma.price.findUnique({ where: { size } });
    const basePrice  = priceEntry ? priceEntry.price : 0;

    // Надбавка за оформление
    const frameExtra = format.includes('раме') || format.includes('паспарту') || format.includes('float') ? 2500
                     : format.includes('подрамнике') ? 800
                     : format.includes('стеклом') ? 1500 : 0;

    // Надбавка за материал (льняной/музейный)
    const matExtra = (material || '').includes('Льняной') && (material || '').includes('музейный') ? 1000
                   : (material || '').includes('Льняной') ? 600
                   : (material || '').includes('Hahnemühle') || (material || '').includes('Canson') ? 800
                   : 0;

    const base = basePrice + frameExtra + matExtra;

    // Скидки и надбавки
    const pricing = calcPricing({ basePrice: base, quantity, deadline, design });

    const photoPaths = (req.files || []).map(f => `/uploads/${f.filename}`);

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
        clientName, phone, email, size, format, design,
        material:        material  || '',
        coating:         coating   || '',
        comments:        comments  || '',
        deadline:        deadline  || '',
        quantity:        pricing.quantity,
        basePrice:       pricing.basePrice,
        discountPercent: pricing.discountPercent,
        discountReason:  pricing.discountReason,
        surchargePercent: pricing.surchargePercent,
        surchargeReason:  pricing.surchargeReason,
        totalPrice:      pricing.totalPrice,
        photoPaths:      JSON.stringify(photoPaths),
        status:          'new',
        userId,
      },
    });

    res.status(201).json({
      success:         true,
      orderId:         order.id,
      totalPrice:      pricing.totalPrice,
      discountPercent: pricing.discountPercent,
      discountReason:  pricing.discountReason,
      surchargePercent: pricing.surchargePercent,
      surchargeReason:  pricing.surchargeReason,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при создании заказа' });
  }
});

// ─── GET /api/orders — список (admin) ────────────────────────────────────────
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
      prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: Number(limit) }),
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
    const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } });
    if (!order) return res.status(404).json({ error: 'Заказ не найден' });
    res.json({ ...order, photoPaths: JSON.parse(order.photoPaths || '[]') });
  } catch { res.status(500).json({ error: 'Ошибка сервера' }); }
});

// ─── PATCH /api/orders/:id (admin) ───────────────────────────────────────────
router.patch('/:id', auth, async (req, res) => {
  const { status, comments } = req.body;
  const allowed = ['new', 'in_progress', 'ready', 'delivered'];
  if (status && !allowed.includes(status)) return res.status(400).json({ error: 'Недопустимый статус' });
  try {
    const data = {};
    if (status)   data.status   = status;
    if (comments !== undefined) data.comments = comments;
    const order = await prisma.order.update({ where: { id: Number(req.params.id) }, data });
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

// ─── GET /api/orders/calc — предварительный расчёт цены (публичный) ──────────
router.get('/calc', async (req, res) => {
  const { size, format, design, material, quantity, deadline } = req.query;
  try {
    const priceEntry = size ? await prisma.price.findUnique({ where: { size } }) : null;
    const basePrice  = priceEntry ? priceEntry.price : 0;
    const frameExtra = (format || '').includes('раме') ? 2500 : (format || '').includes('подрамнике') ? 800 : 0;
    const result = calcPricing({ basePrice: basePrice + frameExtra, quantity, deadline, design });
    res.json(result);
  } catch { res.status(500).json({ error: 'Ошибка расчёта' }); }
});

module.exports = router;
