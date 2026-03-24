const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware — проверка JWT пользователя
function userAuth(req, res, next) {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Требуется авторизация' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Токен недействителен' });
  }
}

// ─── POST /api/users/register ────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, phone, email, password } = req.body;
  if (!name || !phone || !email || !password)
    return res.status(400).json({ error: 'Заполните все поля' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });

  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email уже зарегистрирован' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, phone, email, passwordHash } });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address || '' } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── POST /api/users/login ───────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Введите email и пароль' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Неверный email или пароль' });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address || '' } });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── GET /api/users/me — профиль ────────────────────────────────────────────
router.get('/me', userAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, phone: true, address: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── GET /api/users/my-orders — мои заказы ──────────────────────────────────
router.get('/my-orders', userAuth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders.map(o => ({ ...o, photoPaths: JSON.parse(o.photoPaths || '[]') })));
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── PATCH /api/users/me — обновить профиль ─────────────────────────────────
router.patch('/me', userAuth, async (req, res) => {
  const { name, phone, address } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data:  {
        ...(name    !== undefined && { name }),
        ...(phone   !== undefined && { phone }),
        ...(address !== undefined && { address }),
      },
      select: { id: true, name: true, email: true, phone: true, address: true },
    });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});

module.exports = { router, userAuth };
