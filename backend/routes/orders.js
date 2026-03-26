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
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
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

// ─── Расчёт цены ─────────────────────────────────────────────────────────────
async function calcPrice({ sizeId, formatId, designId, plotId, quantity, deadline }) {
  const qty = Number(quantity) || 1;

  const [size, format, design, plot] = await Promise.all([
    sizeId   ? prisma.size.findUnique({ where: { id: Number(sizeId) } })     : null,
    formatId ? prisma.format.findUnique({ where: { id: Number(formatId) } }) : null,
    designId ? prisma.design.findUnique({ where: { id: Number(designId) } }) : null,
    plotId   ? prisma.plot.findUnique({ where: { id: Number(plotId) } })     : null,
  ]);

 
  const priceUnit = (size?.price || 0) + (format?.priceExtra || 0) +
                    (design?.priceExtra || 0) + (plot?.priceExtra || 0);

  // Надбавка за срочность
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

  const surcharge = Math.max(surchargePercent, 0);
  const deadline5 = surchargePercent < 0 ? Math.abs(surchargePercent) : 0;
  const discount  = discountPercent + deadline5;

  const totalPrice = Math.round(priceUnit * qty * (1 + surcharge / 100) * (1 - discount / 100));

  return { priceUnit, qty, surchargePercent, surchargeReason, discountPercent, discountReason, totalPrice };
}

// ─── POST /api/orders — создать заказ ────────────────────────────────────────
router.post('/', upload.array('photos', 5), async (req, res) => {
  const { clientName, phone, email, sizeId, formatId, designId, plotId,
          quantity, deadline, prepayment, comments } = req.body;

  if (!clientName || !phone || !email || !sizeId || !formatId || !designId || !plotId) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }

  try {
    const pricing    = await calcPrice({ sizeId, formatId, designId, plotId, quantity, deadline });
    const photoPaths = (req.files || []).map(f => `/uploads/${f.filename}`);
    const prepayVal  = Math.max(0, Number(prepayment) || 0);

    let userId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        userId = decoded.id;
      } catch {}
    }
console.log('IDs:', { sizeId: Number(sizeId), formatId: Number(formatId), designId: Number(designId), plotId: Number(plotId) });
const sizeCheck = await prisma.size.findUnique({
  where: { id: Number(sizeId) }
});

const formatCheck = await prisma.format.findUnique({
  where: { id: Number(formatId) }
});

const designCheck = await prisma.design.findUnique({
  where: { id: Number(designId) }
});

const plotCheck = await prisma.plot.findUnique({
  where: { id: Number(plotId) }
});

console.log('CHECK:', {
  sizeCheck,
  formatCheck,
  designCheck,
  plotCheck
});



    const order = await prisma.order.create({
      data: {
        clientName, phone, email,
        deadline:        deadline   || '',
        comments:        comments   || '',
        surchargePercent: pricing.surchargePercent,
        surchargeReason:  pricing.surchargeReason,
        discountPercent:  pricing.discountPercent,
        discountReason:   pricing.discountReason,
        totalPrice:       pricing.totalPrice,
        prepayment:       prepayVal,
        photoPaths:       JSON.stringify(photoPaths),
        status:           'new',
        userId,
        sizeId:   Number(sizeId),
        formatId: Number(formatId),
        designId: Number(designId),
        plotId:   Number(plotId),
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId:   order.id,
        quantity:  pricing.qty,
        priceUnit: pricing.priceUnit,
        amount:    pricing.priceUnit * pricing.qty,
      },
    });

    res.status(201).json({
      success:          true,
      orderId:          order.id,
      totalPrice:       pricing.totalPrice,
      prepayment:       prepayVal,
      remainder:        pricing.totalPrice - prepayVal,
      surchargePercent: pricing.surchargePercent,
      surchargeReason:  pricing.surchargeReason,
      discountPercent:  pricing.discountPercent,
      discountReason:   pricing.discountReason,
    });
  } catch (e) {
    console.error(e);
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
      { clientName: { contains: search } },
      { phone:      { contains: search } },
      { email:      { contains: search } },
    ];
  }
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo)   { const d = new Date(dateTo); d.setHours(23,59,59,999); where.createdAt.lte = d; }
  }
  try {
    const include = { size: true, format: true, design: true, plot: true, items: true };
    const [orders, total] = await Promise.all([
      prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: Number(limit), include }),
      prisma.order.count({ where }),
    ]);
    res.json({
      orders: orders.map(o => ({ ...o, photoPaths: JSON.parse(o.photoPaths || '[]') })),
      total, page: Number(page), pages: Math.ceil(total / Number(limit)),
    });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка получения заказов' });
  }
});

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: { size: true, format: true, design: true, plot: true, discount: true, items: true },
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
    if (status)                  data.status    = status;
    if (comments !== undefined)  data.comments  = comments;
    if (issueDate !== undefined) data.issueDate = issueDate;
    if (status === 'delivered' && !issueDate) data.issueDate = new Date().toISOString().split('T')[0];
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

module.exports = router;
