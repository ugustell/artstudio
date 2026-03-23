const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ error: 'Введите логин и пароль' });
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { login } });
    if (!admin) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const token = jwt.sign(
      { id: admin.id, login: admin.login },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, login: admin.login });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
