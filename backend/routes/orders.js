const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { PrismaClient } = require('@prisma/client');

const auth = require('../middleware/auth');
const authOptional = require('../middleware/authOptional');

const router = express.Router();
const prisma = new PrismaClient();

// ─── Multer ─────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.random();
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ─── CALC ───────────────────────────────────────────────
function calcPricing({ basePrice, quantity }) {
  const qty = Number(quantity) || 1;
  return {
    quantity: qty,
    basePrice,
    totalPrice: basePrice * qty,
    discountPercent: 0,
    surchargePercent: 0
  };
}

// ───────────────────────────────────────────────────────
// 🔥 CREATE ORDER
// ───────────────────────────────────────────────────────
router.post('/', authOptional, upload.array('photos', 5), async (req, res) => {
  try {
    const {
      clientName, phone, email,
      size, format, design,
      material, coating,
      comments, deadline,
      quantity
    } = req.body;

    const priceEntry = await prisma.price.findUnique({ where: { size } });
    const basePrice = priceEntry ? priceEntry.price : 0;

    const pricing = calcPricing({ basePrice, quantity });

    const photoPaths = (req.files || []).map(f => `/uploads/${f.filename}`);

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
        userId: req.user ? req.user.id : null // 🔥 КЛЮЧЕВОЕ
      }
    });

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка создания заказа' });
  }
});

// ───────────────────────────────────────────────────────
// 🔥 МОИ ЗАКАЗЫ
// ───────────────────────────────────────────────────────
router.get('/my', auth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: req.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(
      orders.map(o => ({
        ...o,
        photoPaths: JSON.parse(o.photoPaths || '[]')
      }))
    );
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения заказов' });
  }
});

// ───────────────────────────────────────────────────────
// 🔥 ADMIN LIST (ВОССТАНОВЛЕННЫЙ)
// ───────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const where = {};

  if (status && status !== 'all') {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { clientName: { contains: search } },
      { phone: { contains: search } },
      { email: { contains: search } },
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

    res.json({
      orders: orders.map(o => ({
        ...o,
        photoPaths: JSON.parse(o.photoPaths || '[]'),
      })),
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения заказов' });
  }
});

// ───────────────────────────────────────────────────────
// 🔥 UPDATE STATUS
// ───────────────────────────────────────────────────────
router.patch('/:id', auth, async (req, res) => {
  const { status } = req.body;

  try {
    const order = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: { status }
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});

// ───────────────────────────────────────────────────────
module.exports = router;