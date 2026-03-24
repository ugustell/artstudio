require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const ordersRouter            = require('./routes/orders');
const pricesRouter            = require('./routes/prices');
const adminRouter             = require('./routes/admin');
const { router: usersRouter } = require('./routes/users');

const app  = express();
const PORT = process.env.PORT || 4000;

/* ----------------------  CORS  ---------------------- */

const allowedOrigins = [
  "https://artstudio-silk.vercel.app",
  "http://localhost:3000",
];

app.use(cors({
  origin: (origin, callback) => {
    // Разрешаем запросы без origin (Postman, curl, Railway health checks)
    if (!origin) return callback(null, true);
    // Разрешаем все поддомены vercel.app для preview deployments
    if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Разрешаем preflight для всех маршрутов
app.options("*", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.sendStatus(204);
});

/* ---------------------------------------------------- */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/orders', ordersRouter);
app.use('/api/prices', pricesRouter);
app.use('/api/admin',  adminRouter);
app.use('/api/users',  usersRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

app.listen(PORT, () => {
  console.log(`\n🎨 ArtStudio Backend запущен`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api`);
  console.log(`   Uploads: http://localhost:${PORT}/uploads\n`);
});
