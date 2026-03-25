require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

// ── Роуты ─────────────────────────────────────────────
const ordersRouter = require('./routes/orders');
const refsRouter   = require('./routes/references');
const adminRouter  = require('./routes/admin');
const { router: usersRouter } = require('./routes/users');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── CORS ──────────────────────────────────────────────
// Разрешаем все поддомены Vercel и localhost для разработки
app.use(cors({
  origin: [/\.vercel\.app$/, 'http://localhost:3000'],
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
}));

// Обработка preflight (OPTIONS)
app.options('*', cors({
  origin: [/\.vercel\.app$/, 'http://localhost:3000'],
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
}));

// ── Middleware ───────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API маршруты ─────────────────────────────────────
app.use('/api/orders', ordersRouter);
app.use('/api/admin',  adminRouter);
app.use('/api/users',  usersRouter);
app.use('/api',        refsRouter);

// Обратная совместимость — /api/prices теперь это /api/sizes
app.get('/api/prices', async (req, res) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const sizes = await prisma.size.findMany({ orderBy: { price: 'asc' } });
  res.json(sizes.map(s => ({ id: s.id, size: s.size, price: s.price })));
});

// Проверка сервера
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ── Запуск ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎨 ArtStudio Backend запущен`);
  console.log(`   http://localhost:${PORT}/api`);
});