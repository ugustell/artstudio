const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const DEMO_DOMAIN = 'demo.artstudio.local';

const demoUsers = [
  { name: 'Марина Иванова', phone: '+7 900 123-45-67', email: `marina@${DEMO_DOMAIN}` },
  { name: 'Алексей Петров', phone: '+7 912 234-56-78', email: `alexey@${DEMO_DOMAIN}` },
  { name: 'Ольга Смирнова', phone: '+7 923 345-67-89', email: `olga@${DEMO_DOMAIN}` },
  { name: 'Дмитрий Козлов', phone: '+7 934 456-78-90', email: `dmitry@${DEMO_DOMAIN}` },
  { name: 'Анна Новикова', phone: '+7 945 567-89-01', email: `anna@${DEMO_DOMAIN}` },
  { name: 'Виктор Морозов', phone: '+7 956 678-90-12', email: `viktor@${DEMO_DOMAIN}` },
  { name: 'Екатерина Волкова', phone: '+7 967 789-01-23', email: `ekaterina@${DEMO_DOMAIN}` },
  { name: 'Максим Соколов', phone: '+7 978 890-12-34', email: `maxim@${DEMO_DOMAIN}` },
  { name: 'Наталья Лебедева', phone: '+7 989 901-23-45', email: `natalia@${DEMO_DOMAIN}` },
  { name: 'Андрей Зайцев', phone: '+7 990 012-34-56', email: `andrey@${DEMO_DOMAIN}` },
];

const comments = [
  'Портрет по фотографии, важны теплые тона и мягкий свет.',
  'Пейзаж для гостиной, хочется спокойную зелено-голубую гамму.',
  'Подарок на юбилей, нужен аккуратный классический стиль.',
  'Сюжет с городом, добавить чуть больше контраста.',
  'Семейный портрет, сохранить естественные выражения лиц.',
  'Натюрморт для кухни, можно сделать цвета чуть ярче.',
  'Картина по фото с моря, важен закатный свет.',
  'Интерьерная работа, ближе к современному минимализму.',
  'Нужна мягкая цветовая палитра без резких акцентов.',
  '',
];

async function ensureReferences() {
  const [sizes, formats, designs, plots] = await Promise.all([
    prisma.size.findMany({ orderBy: { id: 'asc' } }),
    prisma.format.findMany({ orderBy: { id: 'asc' } }),
    prisma.design.findMany({ orderBy: { id: 'asc' } }),
    prisma.plot.findMany({ orderBy: { id: 'asc' } }),
  ]);

  if (!sizes.length || !formats.length || !designs.length || !plots.length) {
    throw new Error('Справочники пустые. Сначала нужно заполнить базу через init-db.js.');
  }

  return { sizes, formats, designs, plots };
}

function calcDeadline(index) {
  const date = new Date();
  date.setDate(date.getDate() + 7 + (index % 21));
  return date.toISOString().split('T')[0];
}

function calcCreatedAt(index) {
  const date = new Date();
  date.setDate(date.getDate() - (index * 4 + 2));
  return date;
}

async function main() {
  const existingDemoOrders = await prisma.order.count({
    where: { email: { endsWith: DEMO_DOMAIN } },
  });

  if (existingDemoOrders > 0) {
    console.log(`ℹ️ Демо-заказы уже есть: ${existingDemoOrders}. Повторно не добавляю.`);
    return;
  }

  const { sizes, formats, designs, plots } = await ensureReferences();
  const passwordHash = await bcrypt.hash('user123', 10);

  const users = [];
  for (const user of demoUsers) {
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, phone: user.phone },
      create: { ...user, passwordHash },
    });
    users.push(created);
  }

  const statuses = ['new', 'new', 'in_progress', 'ready', 'delivered'];

  for (let i = 0; i < 30; i += 1) {
    const user = users[i % users.length];
    const size = sizes[i % sizes.length];
    const format = formats[i % formats.length];
    const design = designs[i % designs.length];
    const plot = plots[i % plots.length];
    const quantity = (i % 3) + 1;
    const priceUnit = size.price + format.priceExtra + design.priceExtra + plot.priceExtra;
    const totalPrice = priceUnit * quantity;
    const status = statuses[i % statuses.length];
    const createdAt = calcCreatedAt(i);
    const issueDate = status === 'delivered' ? createdAt.toISOString().split('T')[0] : '';

    const order = await prisma.order.create({
      data: {
        clientName: user.name,
        phone: user.phone,
        email: user.email,
        status,
        deadline: calcDeadline(i),
        issueDate,
        totalPrice,
        prepayment: Math.round(totalPrice * 0.4),
        photoPaths: '[]',
        comments: comments[i % comments.length],
        createdAt,
        userId: user.id,
        sizeId: size.id,
        formatId: format.id,
        designId: design.id,
        plotId: plot.id,
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        quantity,
        priceUnit,
        amount: priceUnit * quantity,
      },
    });
  }

  console.log('✅ Демо-заказы добавлены: 30');
  console.log(`👥 Демо-пользователи: ${users.length}, пароль для всех: user123`);
}

main()
  .catch((error) => {
    console.error('❌ seed-demo-orders error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
