require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const ordersRouter            = require('./routes/orders');
const refsRouter              = require('./routes/references');
const adminRouter             = require('./routes/admin');
const { router: usersRouter } = require('./routes/users');

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
app.use('/api/orders', ordersRouter);
app.use('/api/admin',  adminRouter);
app.use('/api/users',  usersRouter);

// Справочники: /api/sizes, /api/formats, /api/designs, /api/plots,
//              /api/discounts, /api/calc, /api/prices/options, /api/prices
app.use('/api', refsRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

app.listen(PORT, () => {
  console.log(`\n🎨 ArtStudio Backend запущен`);
  console.log(`   http://localhost:${PORT}/api`);
});
