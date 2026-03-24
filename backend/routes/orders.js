const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { PrismaClient } = require('@prisma/client');

const auth = require('../middleware/auth');
const authOptional = require('../middleware/authOptional');

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
    const ok = /jpeg|jpg|png|gif|webp|tiff/.test(
      path.extname(file.originalname).toLowerCase()
    );
    ok ? cb(null, true) : cb(new Error('Разрешены только изображения'));
  },
});

// ─── Pricing ──────────────────────────────────────────────────────────────────
function calcPricing({ basePrice, quantity, deadline, design }) {
  const qty  = Number(quantity) || 1;
  const base = Number(basePrice) || 0;

  let surchargePercent = 0;
  let surchargeReason  = '';

  if (deadline) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    const daysLeft = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 3) {
      surchargePercent = 60;
      surchargeReason = 'Очень срочный заказ';
    } else if (daysLeft < 7) {
      surchargePercent = 30;
      surchargeReason = 'Срочный заказ';
    } else if (daysLeft < 14) {
      surchargePercent = 15;
      surchargeReason = 'Ускоренный срок';
    }
  }

  const d = (design || '').toLowerCase();

  if (d.includes('ван гога') || d.includes('моне') || d.includes('климт')) {
    surchargePercent = Math.max(surchargePercent, 30);
  } else if (d.includes('портрет') || d.includes('реализм')) {
    surchargePercent = Math.max(surchargePercent, 20);
  }

  let discountPercent = 0;

  if (qty >= 10) discountPercent = 20;
  else if (qty >= 5) discountPercent = 15;
  else if (qty >= 3) discountPercent = 10;
  else if (qty >= 2) discountPercent = 5;

  const totalPrice = Math.round(
    base * qty * (1 + surchargePercent / 100) * (1 - discountPercent / 100)
  );

  return {
    quantity: qty,
    basePrice: base,
    surchargePercent,
    discountPercent,
    totalPrice,
  };
}

// ─── CREATE ORDER ─────────────────────────────────────────────────────────────
router.post('/', authOptional, upload.array('photos', 5), async (req, res) => {
  const {
    clientName,
    phone,
    email,
    size,
    format,
    design,
    material,
    coating,
    comments,
    deadline,
    quantity,
  } = req.body;

  if (!clientName || !phone || !email || !size || !format || !design) {
    return res.status(400).json({ error: 'Заполните все поля' });
  }

  try {
    const priceEntry = await prisma.price.findUnique({ where: { size } });
    const basePrice = priceEntry ? priceEntry.price : 0;

    const pricing = calcPricing({
      basePrice,
      quantity,
      deadline,
      design,
    });

    const photoPaths = (req.files || []).map(
      (f) => `/uploads/${f.filename}`
    );

    const order = await prisma.order.create({
      data: {
        clientName,
        phone,
        email,
        size,
        format,
        design,
        material: material || '',
        coating: coating || '',
        comments: comments || '',
        deadline: deadline || '',
        quantity: pricing.quantity,
        basePrice: pricing.basePrice,
        discountPercent: pricing.discountPercent,
        surchargePercent: pricing.surchargePercent,
        totalPrice: pricing.totalPrice,
        photoPaths: JSON.stringify(photoPaths),
        status: 'new',
        userId: req.user ? req.user.id : null, // 🔥 ФИКС
      },
    });

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка создания заказа' });
  }
});

// ─── MY ORDERS ────────────────────────────────────────────────────────────────
router.get('/my', auth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(
      orders.map((o) => ({
        ...o,
        photoPaths: JSON.parse(o.photoPaths || '[]'),
      }))
    );
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения заказов' });
  }
});

// ─── ADMIN LIST ───────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
  });

  res.json(
    orders.map((o) => ({
      ...o,
      photoPaths: JSON.parse(o.photoPaths || '[]'),
    }))
  );
});

// ─── UPDATE STATUS ────────────────────────────────────────────────────────────
router.patch('/:id', auth, async (req, res) => {
  const { status } = req.body;

  try {
    const order = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: { status },
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});

module.exports = router;