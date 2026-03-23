require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const ordersRouter          = require('./routes/orders');
const pricesRouter          = require('./routes/prices');
const adminRouter           = require('./routes/admin');
const { router: usersRouter } = require('./routes/users');

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
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
