const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─── Справочные данные ────────────────────────────────────────────────────────

const CANVAS_SIZES = [
  '10×15 см', '13×18 см', '15×20 см', '20×20 см', '20×25 см', '20×30 см',
  '25×35 см', '30×30 см', '30×40 см', '30×45 см', '35×50 см', '40×40 см',
  '40×50 см', '40×60 см', '45×60 см', '50×50 см', '50×70 см', '50×75 см',
  '60×60 см', '60×80 см', '60×90 см', '70×70 см', '70×100 см', '75×100 см',
  '80×100 см', '80×120 см', '90×120 см', '100×100 см', '100×120 см',
  '100×150 см', '120×150 см', '150×200 см',
];

const DESIGN_TYPES = [
  'Холст на подрамнике (стандарт)',
  'Холст на подрамнике (галерейный, 4 см)',
  'Холст без подрамника (в рулоне)',
  'Холст в деревянной раме (дуб)',
  'Холст в раме (чёрная)',
  'Холст в раме (золото)',
  'Холст в раме (серебро)',
  'Холст в плавающей раме (float frame)',
  'В багетной раме (классика)',
  'В раме с паспарту',
  'Под стеклом в раме',
  'Без оформления',
];

const TECHNIQUES = [
  'Масло — классическая техника',
  'Масло — импрессионизм',
  'Масло — реализм',
  'Масло — абстракция',
  'Масло — портрет',
  'Акварель — классическая',
  'Акварель — ботаническая',
  'Акварель — портрет',
  'Акрил — яркая палитра',
  'Акрил — текстурная живопись',
  'Акрил — абстрактный экспрессионизм',
  'Гуашь — иллюстрация',
  'Пастель — сухая',
  'Пастель — масляная',
  'Уголь — графика',
  'Уголь — портрет',
  'Карандаш — реализм',
  'Смешанная техника',
  'Живопись в стиле Ван Гога',
  'Живопись в стиле Моне',
  'Живопись в стиле Климта',
];

const SUBJECTS = [
  'Пейзаж',
  'Морской пейзаж',
  'Городской пейзаж',
  'Портрет',
  'Анималистика',
  'Натюрморт',
  'Абстракция',
  'Цветы',
  'Архитектура',
  'Копия картины мастера',
  'Фэнтези',
  'Детский рисунок (сюжет)',
];

const DISCOUNTS = [
  { percent: -5,  description: 'Скидка за объём (2 картины)' },
  { percent: -10, description: 'Скидка за объём (3–4 картины)' },
  { percent: -15, description: 'Скидка за объём (5–9 картин)' },
  { percent: -20, description: 'Скидка за объём (10+ картин)' },
  { percent: -5,  description: 'Длительный срок (30+ дней)' },
  { percent: 15,  description: 'Надбавка: ускоренный срок (7–13 дней)' },
  { percent: 30,  description: 'Надбавка: срочный заказ (3–6 дней)' },
  { percent: 60,  description: 'Надбавка: очень срочный заказ (менее 3 дней)' },
  { percent: 20,  description: 'Надбавка: сложный сюжет / портрет' },
  { percent: 30,  description: 'Надбавка: авторский стиль (копия мастера)' },
];

// Базовые цены по размеру (для расчёта прайс-листа)
const BASE_PRICE_BY_SIZE = {
  '10×15 см': 1500, '13×18 см': 1800, '15×20 см': 2200, '20×20 см': 2500,
  '20×25 см': 2800, '20×30 см': 3200, '25×35 см': 3800, '30×30 см': 4000,
  '30×40 см': 4500, '30×45 см': 5000, '35×50 см': 5500, '40×40 см': 5800,
  '40×50 см': 6200, '40×60 см': 6800, '45×60 см': 7200, '50×50 см': 7500,
  '50×70 см': 8500, '50×75 см': 9000, '60×60 см': 10000, '60×80 см': 11000,
  '60×90 см': 12000, '70×70 см': 12500, '70×100 см': 14000, '75×100 см': 15000,
  '80×100 см': 17000, '80×120 см': 19000, '90×120 см': 22000, '100×100 см': 24000,
  '100×120 см': 26000, '100×150 см': 30000, '120×150 см': 35000, '150×200 см': 55000,
};

// Коэффициент за вид оформления
function designTypeMultiplier(name) {
  if (name.includes('float frame') || name.includes('паспарту')) return 1.35;
  if (name.includes('раме')) return 1.25;
  if (name.includes('подрамнике')) return 1.10;
  if (name.includes('рулоне')) return 1.00;
  if (name.includes('стеклом')) return 1.20;
  return 1.00;
}

// Коэффициент за технику
function techniqueMultiplier(name) {
  if (name.includes('Ван Гога') || name.includes('Моне') || name.includes('Климта')) return 1.30;
  if (name.includes('реализм') || name.includes('портрет') || name.includes('ботаническая')) return 1.20;
  if (name.includes('Масло') || name.includes('Акварель')) return 1.10;
  return 1.00;
}

// Коэффициент за сюжет
function subjectMultiplier(name) {
  if (name.includes('мастера') || name.includes('Фэнтези')) return 1.20;
  if (name.includes('Портрет') || name.includes('Анималистика')) return 1.15;
  return 1.00;
}

async function main() {
  console.log('🎨 Заполняю базу данных ArtStudio (нормализованная схема)...\n');

  // Очистка
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.price.deleteMany();
  await prisma.user.deleteMany();
  await prisma.canvasSize.deleteMany();
  await prisma.designType.deleteMany();
  await prisma.technique.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.discount.deleteMany();

  // ─── Администратор ──────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin123', 10);
  await prisma.admin.upsert({
    where:  { login: 'admin' },
    update: {},
    create: { login: 'admin', passwordHash: adminHash },
  });
  console.log('✅ Администратор: login=admin, password=admin123');

  // ─── Скидки/надбавки ────────────────────────────────────────────────────────
  const createdDiscounts = [];
  for (const d of DISCOUNTS) {
    const rec = await prisma.discount.create({ data: d });
    createdDiscounts.push(rec);
  }
  console.log(`✅ Скидки/надбавки: ${createdDiscounts.length} записей`);

  // ─── Справочники ────────────────────────────────────────────────────────────
  const sizeMap = {};
  for (const size of CANVAS_SIZES) {
    const rec = await prisma.canvasSize.create({ data: { size } });
    sizeMap[size] = rec.id;
  }
  console.log(`✅ Размеры холста: ${CANVAS_SIZES.length} записей`);

  const designMap = {};
  for (const name of DESIGN_TYPES) {
    const rec = await prisma.designType.create({ data: { name } });
    designMap[name] = rec.id;
  }
  console.log(`✅ Виды оформления: ${DESIGN_TYPES.length} записей`);

  const techniqueMap = {};
  for (const name of TECHNIQUES) {
    const rec = await prisma.technique.create({ data: { name } });
    techniqueMap[name] = rec.id;
  }
  console.log(`✅ Техники исполнения: ${TECHNIQUES.length} записей`);

  const subjectMap = {};
  for (const name of SUBJECTS) {
    const rec = await prisma.subject.create({ data: { name } });
    subjectMap[name] = rec.id;
  }
  console.log(`✅ Сюжеты: ${SUBJECTS.length} записей`);

  // ─── Прайс-лист ─────────────────────────────────────────────────────────────
  // Генерируем цены для комбинаций: все размеры × все техники × первые 3 вида оформления × первые 4 сюжета
  // (полный перебор из 32×21×12×12 = 96768 — слишком много; берём репрезентативный набор)
  const DESIGN_SUBSET  = DESIGN_TYPES.slice(0, 4);  // первые 4 вида оформления
  const SUBJECT_SUBSET = SUBJECTS.slice(0, 4);       // первые 4 сюжета

  let priceCount = 0;
  for (const size of CANVAS_SIZES) {
    const base = BASE_PRICE_BY_SIZE[size] || 5000;
    for (const design of DESIGN_SUBSET) {
      for (const technique of TECHNIQUES) {
        for (const subject of SUBJECT_SUBSET) {
          const finalPrice = Math.round(
            base
            * designTypeMultiplier(design)
            * techniqueMultiplier(technique)
            * subjectMultiplier(subject)
          );
          await prisma.price.create({
            data: {
              canvasSizeId: sizeMap[size],
              designTypeId: designMap[design],
              techniqueId:  techniqueMap[technique],
              subjectId:    subjectMap[subject],
              price:        finalPrice,
            },
          });
          priceCount++;
        }
      }
    }
  }
  console.log(`✅ Прайс-лист: ${priceCount} позиций`);

  // ─── Пользователи ───────────────────────────────────────────────────────────
  const usersData = [
    { name: 'Марина Иванова',    phone: '+7 900 123-45-67', email: 'marina@mail.ru'   },
    { name: 'Алексей Петров',    phone: '+7 912 234-56-78', email: 'alex@gmail.com'   },
    { name: 'Ольга Смирнова',    phone: '+7 923 345-67-89', email: 'olga@yandex.ru'   },
    { name: 'Дмитрий Козлов',    phone: '+7 934 456-78-90', email: 'dmitry@mail.ru'   },
    { name: 'Анна Новикова',     phone: '+7 945 567-89-01', email: 'anna@gmail.com'   },
  ];

  const createdUsers = [];
  for (const u of usersData) {
    const hash = await bcrypt.hash('user123', 10);
    const user = await prisma.user.create({
      data: { ...u, password: hash, role: 'client', address: '' },
    });
    createdUsers.push(user);
  }
  console.log(`✅ Пользователи: ${createdUsers.length} записей`);

  // ─── Тестовые заказы ────────────────────────────────────────────────────────
  const statuses = ['new', 'in_progress', 'ready', 'delivered'];
  const allPrices = await prisma.price.findMany({ take: 20 });

  for (let i = 0; i < 5; i++) {
    const user    = createdUsers[i % createdUsers.length];
    const priceRec = allPrices[i % allPrices.length];
    const qty     = Math.ceil(Math.random() * 3);
    const discount = createdDiscounts[i % 3]; // объёмная скидка
    const discountFactor = 1 + discount.percent / 100;
    const itemTotal = Math.round(priceRec.price * qty * discountFactor);
    const total     = itemTotal;

    const order = await prisma.order.create({
      data: {
        userId:     user.id,
        discountId: discount.id,
        totalPrice: total,
        prepayment: Math.round(total * 0.3),
        status:     statuses[i % statuses.length],
        deadline:   '',
        issueDate:  '',
        comments:   `Тестовый заказ #${i + 1}`,
        photoPaths: '[]',
        items: {
          create: [{
            priceId:      priceRec.id,
            quantity:     qty,
            pricePerUnit: priceRec.price,
            total:        itemTotal,
          }],
        },
      },
    });
    console.log(`   📦 Заказ #${order.id} — ${total}₽ (статус: ${order.status})`);
  }

  console.log('\n🎉 База данных заполнена успешно!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
