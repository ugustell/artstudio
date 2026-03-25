require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient(); // Один экземпляр на всё приложение
const app  = express();
const PORT = process.env.PORT || 4000;

// Роуты
const ordersRouter = require('./routes/orders');
const refsRouter   = require('./routes/references');
const adminRouter  = require('./routes/admin');
const { router: usersRouter } = require('./routes/users');

/* ── CORS ─────────────────────────────────────────────────────────────────── */
app.use(cors({
  origin: ['https://artstudio-silk.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

/* ── Middleware ───────────────────────────────────────────────────────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ── Routes ──────────────────────────────────────────────────────────────── */
app.use('/api/orders',  ordersRouter);
app.use('/api/admin',   adminRouter);
app.use('/api/users',   usersRouter);

// ВАЖНО: Привязываем справочники к /api/prices
app.use('/api/prices',  refsRouter); 

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎨 ArtStudio Backend запущен на порту ${PORT}`);
});