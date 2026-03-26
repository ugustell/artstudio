require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const ordersRouter     = require('./routes/orders');
const refsRouter       = require('./routes/references');
const adminRouter      = require('./routes/admin');
const { router: usersRouter } = require('./routes/users');

const app  = express();
const PORT = process.env.PORT || 4000;

/* ── CORS ─────────────────────────────────────────────────────────────────── */
// Разрешаем доступ с frontend (Vercel и локальный dev)
const allowedOrigins = [
  'https://artstudio-silk.vercel.app',
  'http://localhost:3000',
];

// Подключаем CORS один раз и корректно
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // для Postman / curl

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(null, true); // на проде можно ограничить, сейчас для теста разрешаем всё
    }
  },
  credentials: true,
}));

// Обработка preflight запросов (OPTIONS)
app.options('*', cors());

/* ── Парсер JSON ───────────────────────────────────────────────────────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Статические файлы (например, для загрузок) ────────────────────────────── */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ── Роуты ────────────────────────────────────────────────────────────────── */
app.use('/api/orders', ordersRouter);
app.use('/api/refs', refsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/users', usersRouter);

/* ── Тестовый роут для проверки CORS ──────────────────────────────────────── */
app.get('/test', (req, res) => {
  res.json({ ok: true });
});

/* ── Запуск сервера ───────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});

/* ── Middleware ───────────────────────────────────────────────────────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ── Routes ──────────────────────────────────────────────────────────────── */
app.use('/api/orders',  ordersRouter);
app.use('/api/admin',   adminRouter);
app.use('/api/users',   usersRouter);

// Справочники: /api/sizes, /api/formats, /api/designs, /api/plots, /api/discounts, /api/calc
app.use('/api',         refsRouter);

// Обратная совместимость — /api/prices теперь это /api/sizes
app.get('/api/prices', async (req, res) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const sizes = await prisma.size.findMany({ orderBy: { price: 'asc' } });
  res.json(sizes.map(s => ({ id: s.id, size: s.size, price: s.price })));
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

app.listen(PORT, () => {
  console.log(`\n🎨 ArtStudio Backend запущен`);
  console.log(`   http://localhost:${PORT}/api`);
});
