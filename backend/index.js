require('dotenv').config();
const path = require('path');

// Ensure SQLite file DB is stable regardless of process.cwd().
// When DATABASE_URL is `file:./...` Prisma may resolve relative to current working directory,
// which can differ between local/dev/prod starts.
if (process.env.DATABASE_URL && /^file:\.\//.test(process.env.DATABASE_URL)) {
  const rel = process.env.DATABASE_URL.replace(/^file:\.\//, '');
  const abs = path.resolve(__dirname, rel);
  process.env.DATABASE_URL = `file:${abs}`;
}
const express = require('express');
const cors    = require('cors');

const ordersRouter     = require('./routes/orders');
const refsRouter       = require('./routes/references');
const adminRouter      = require('./routes/admin');
const { router: usersRouter } = require('./routes/users');
const pricesRouter    = require('./routes/prices');

const app  = express();
const PORT = process.env.PORT || 4000;

/* ── CORS ─────────────────────────────────────────────────────────────────── */
const allowedOrigins = [
  'https://artstudio-silk.vercel.app',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin))
      return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ❌ УБРАНО: дублирующий app.options('*', ...) — cors() уже сам обрабатывает preflight

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
app.use('/api/prices',  pricesRouter);

// Обратная совместимость — /api/prices теперь это /api/sizes
app.get('/api/prices', async (req, res) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const sizes = await prisma.size.findMany({ orderBy: { price: 'asc' } });
  res.json(sizes.map(s => ({ id: s.id, size: s.size, price: s.price })));
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

/* ── Start server ─────────────────────────────────────────────────────────── */
const server = app.listen(PORT, () => {
  console.log(`\n🎨 ArtStudio Backend запущен`);
  console.log(`   http://localhost:${PORT}/api`);
});

// ✅ ДОБАВЛЕНО: корректная обработка занятого порта
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Exiting...`);
    process.exit(1);
  } else {
    throw err;
  }
});
