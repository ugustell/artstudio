const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─── Справочники ─────────────────────────────────────────────────────────────

const FORMATS = [
  // Холсты
  'Холст на подрамнике (сосна)',
  'Холст на подрамнике (бук)',
  'Холст на подрамнике (толщина 4 см)',
  'Холст без подрамника (рулон)',
  // Рамы
  'В деревянной раме (натуральная)',
  'В багетной раме (золото)',
  'В багетной раме (серебро)',
  'В багетной раме (чёрная)',
  'В узкой раме (модерн, 1 см)',
  'В широкой раме (классика, 6 см)',
  'В раме с паспарту (белое)',
  'В раме с паспарту (чёрное)',
  'В раме с паспарту (цветное)',
  'В плавающей раме (float)',
  // Модульные
  'Модульная (2 части — диптих)',
  'Модульная (3 части — триптих)',
  'Модульная (4 части)',
  'Модульная (5 частей)',
  'Модульная (панорама 2:1)',
  'Модульная (панорама 3:1)',
  // Без рамы
  'Без оформления (только печать)',
  'Самоклеящийся постер',
];

const DESIGNS = [
  // Без обработки
  'Без дизайна',
  // Цвет
  'Цветокоррекция (базовая)',
  'Цветокоррекция (профессиональная)',
  'Улучшение резкости',
  'Осветление / затемнение',
  'Тёплая тонировка',
  'Холодная тонировка',
  // Стили
  'Художественная обработка (масло)',
  'Художественная обработка (акварель)',
  'Художественная обработка (гуашь)',
  'Художественная обработка (пастель)',
  'Карандашный рисунок (чёрно-белый)',
  'Карандашный рисунок (цветной)',
  'Чёрно-белая классика',
  'Сепия / Ретро',
  'Винтаж (выцветший)',
  'Дуотон (два цвета)',
  'Поп-арт (4 цвета)',
  'Поп-арт (Уорхол)',
  'Комикс / Графика',
  'Мозаика из фото',
  // Ретушь
  'Ретушь лица (базовая)',
  'Ретушь лица (полная)',
  'Удаление фона',
  'Замена фона',
  'Удаление лишних объектов',
  'Восстановление старого фото',
  // Текст и элементы
  'Добавление текста / даты',
  'Добавление рамки / бордюра',
  'Коллаж из нескольких фото',
  // Срочно
  'Срочная обработка (24 часа)',
];

const MATERIALS = [
  // Холст
  'Хлопковый холст 300 г/м² (стандарт)',
  'Хлопковый холст 380 г/м² (усиленный)',
  'Льняной холст 300 г/м² (премиум)',
  'Льняной холст 420 г/м² (музейный)',
  'Холст с фактурой мазков (имитация)',
  'Хлопок/лён смесь 340 г/м²',
  // Бумага
  'Матовая фотобумага 260 г/м²',
  'Глянцевая фотобумага 260 г/м²',
  'Шёлковая фотобумага 260 г/м²',
  'Матовая бумага Fine Art 310 г/м²',
  'Бумага Hahnemühle Photo Rag',
  'Бумага Canson Infinity (архивная)',
];

const COATINGS = [
  'Без покрытия',
  'Матовый лак (стандарт)',
  'Глянцевый лак',
  'Сатиновый лак (полуглянец)',
  'UV-защитный лак (архивный, 75 лет)',
  'Антибликовое покрытие',
  'Водоотталкивающее покрытие',
  'Двойной лак (UV + матовый)',
];

async function main() {
  console.log('🌱 Заполняю базу данных ArtStudio...\n');
  // Очистить старые данные
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();
  await prisma.price.deleteMany();

  // ─── Администратор ───────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin123', 10);
  await prisma.admin.upsert({
    where: { login: 'admin' },
    update: {},
    create: { login: 'admin', passwordHash: adminHash },
  });
  console.log('✅ Администратор: login=admin, password=admin123');

  // ─── Пользователи ────────────────────────────────────────────────────────
  const usersData = [
    { name: 'Марина Иванова',     phone: '+7 900 123-45-67', email: 'marina@mail.ru'     },
    { name: 'Алексей Петров',     phone: '+7 912 234-56-78', email: 'alex@gmail.com'      },
    { name: 'Ольга Смирнова',     phone: '+7 923 345-67-89', email: 'olga@yandex.ru'      },
    { name: 'Дмитрий Козлов',     phone: '+7 934 456-78-90', email: 'dmitry@mail.ru'      },
    { name: 'Анна Новикова',      phone: '+7 945 567-89-01', email: 'anna@gmail.com'      },
    { name: 'Виктор Морозов',     phone: '+7 956 678-90-12', email: 'viktor@inbox.ru'     },
    { name: 'Екатерина Волкова',  phone: '+7 967 789-01-23', email: 'katya@mail.ru'       },
    { name: 'Максим Соколов',     phone: '+7 978 890-12-34', email: 'maxim@yandex.ru'     },
    { name: 'Наталья Лебедева',   phone: '+7 989 901-23-45', email: 'natalia@gmail.com'   },
    { name: 'Андрей Зайцев',      phone: '+7 990 012-34-56', email: 'andrey@mail.ru'      },
    { name: 'Светлана Попова',    phone: '+7 901 111-22-33', email: 'svetlana@rambler.ru' },
    { name: 'Игорь Никитин',      phone: '+7 902 222-33-44', email: 'igor@gmail.com'      },
    { name: 'Ирина Фёдорова',     phone: '+7 903 333-44-55', email: 'irina@yandex.ru'     },
    { name: 'Павел Семёнов',      phone: '+7 904 444-55-66', email: 'pavel@mail.ru'       },
    { name: 'Татьяна Орлова',     phone: '+7 905 555-66-77', email: 'tatyana@inbox.ru'    },
    { name: 'Сергей Виноградов',  phone: '+7 906 666-77-88', email: 'sergey@gmail.com'    },
    { name: 'Юлия Белова',        phone: '+7 907 777-88-99', email: 'yulia@mail.ru'       },
    { name: 'Евгений Тихонов',    phone: '+7 908 888-99-00', email: 'evgeny@yandex.ru'    },
    { name: 'Валерия Кузнецова',  phone: '+7 909 999-00-11', email: 'valeria@gmail.com'   },
    { name: 'Артём Громов',       phone: '+7 910 100-20-30', email: 'artem@mail.ru'       },
  ];

  const createdUsers = [];
  for (const u of usersData) {
    const hash = await bcrypt.hash('user123', 10);
    const user = await prisma.user.upsert({
      where:  { email: u.email },
      update: {},
      create: { name: u.name, phone: u.phone, email: u.email, passwordHash: hash },
    });
    createdUsers.push(user);
  }
  console.log(`✅ Пользователи: ${createdUsers.length} аккаунтов (пароль для всех: user123)`);

  // ─── Прайс-лист (40 позиций) ─────────────────────────────────────────────
  const prices = [
    { size: '10×15 см',   price: 490,   category: 'mini'     },
    { size: '13×18 см',   price: 590,   category: 'mini'     },
    { size: '15×20 см',   price: 690,   category: 'mini'     },
    { size: '20×20 см',   price: 790,   category: 'mini'     },
    { size: '20×25 см',   price: 850,   category: 'mini'     },
    { size: '20×30 см',   price: 900,   category: 'mini'     },
    { size: '25×35 см',   price: 1100,  category: 'standard' },
    { size: '30×30 см',   price: 1150,  category: 'standard' },
    { size: '30×40 см',   price: 1300,  category: 'standard' },
    { size: '30×45 см',   price: 1400,  category: 'standard' },
    { size: '35×50 см',   price: 1550,  category: 'standard' },
    { size: '40×40 см',   price: 1600,  category: 'standard' },
    { size: '40×50 см',   price: 1650,  category: 'standard' },
    { size: '40×60 см',   price: 1800,  category: 'standard' },
    { size: '45×60 см',   price: 1950,  category: 'standard' },
    { size: '50×50 см',   price: 2000,  category: 'standard' },
    { size: '50×70 см',   price: 2200,  category: 'standard' },
    { size: '50×75 см',   price: 2350,  category: 'standard' },
    { size: '60×60 см',   price: 2600,  category: 'large'    },
    { size: '60×80 см',   price: 2700,  category: 'large'    },
    { size: '60×90 см',   price: 2950,  category: 'large'    },
    { size: '70×70 см',   price: 3000,  category: 'large'    },
    { size: '70×100 см',  price: 3500,  category: 'large'    },
    { size: '75×100 см',  price: 3700,  category: 'large'    },
    { size: '80×100 см',  price: 4000,  category: 'large'    },
    { size: '80×120 см',  price: 4500,  category: 'large'    },
    { size: '90×120 см',  price: 5000,  category: 'xl'       },
    { size: '100×100 см', price: 5200,  category: 'xl'       },
    { size: '100×120 см', price: 5500,  category: 'xl'       },
    { size: '100×150 см', price: 6500,  category: 'xl'       },
    { size: '110×140 см', price: 6800,  category: 'xl'       },
    { size: '120×150 см', price: 7200,  category: 'xl'       },
    { size: '120×160 см', price: 7800,  category: 'xl'       },
    { size: '130×180 см', price: 9000,  category: 'xxl'      },
    { size: '150×200 см', price: 11000, category: 'xxl'      },
    { size: '160×200 см', price: 12500, category: 'xxl'      },
    { size: '180×240 см', price: 16000, category: 'xxl'      },
  ];
  for (const p of prices) {
    await prisma.price.upsert({ where: { size: p.size }, update: { price: p.price, category: p.category }, create: p });
  }
  console.log(`✅ Прайс-лист: ${prices.length} позиций`);

  // ─── Заказы (80 штук) ────────────────────────────────────────────────────
  const statuses = ['new','new','new','in_progress','in_progress','ready','delivered','delivered'];
  const allSizes  = prices.map(p => p.size);
  const comments  = [
    'Насыщенные цвета, пожалуйста',
    'Подарок на день рождения — нужно к 15-му',
    '',
    'Портрет семьи, очень важный заказ',
    'Добавьте подпись внизу справа',
    '',
    'Срочно! Нужно через 3 дня',
    'Минимальная обработка, не меняйте цвета',
    'Тёплая цветовая гамма, уберите синеву',
    '',
    'Фото немного размытое — улучшите резкость',
    'Подарок на серебряную свадьбу',
    '',
    'Нейтральный фон вместо загруженного',
    'Пастельные нежные тона',
    'Строго чёрно-белое, без тонирования',
    '',
    'Детский портрет — улыбку сделайте ярче',
    'Три экземпляра — в подарок коллегам',
    '',
    'Свадебное фото — самое важное, прошу внимательно',
    'Уберите лишних людей на заднем плане',
    '',
    'Логотип компании в правом нижнем углу',
    'Мягкий виньетированный фон',
  ];

  for (let i = 0; i < 80; i++) {
    const user     = createdUsers[i % createdUsers.length];
    const size     = allSizes[i % allSizes.length];
    const format   = FORMATS[i % FORMATS.length];
    const design   = DESIGNS[i % DESIGNS.length];
    const material = MATERIALS[i % MATERIALS.length];
    const coating  = COATINGS[i % COATINGS.length];
    const status   = statuses[i % statuses.length];
    const comment  = comments[i % comments.length];

    const priceEntry    = prices.find(p => p.size === size);
    const base          = priceEntry ? priceEntry.price : 1300;
    const designExtra   = design.includes('Срочная') ? 700 : design === 'Без дизайна' ? 0 : 300;
    const frameExtra    = format.includes('раме') ? 800 : format.includes('Модульная') ? 1200 : format.includes('подрамнике') ? 500 : 0;
    const materialExtra = material.includes('Льняной') || material.includes('премиум') ? 600 : material.includes('фактурой') ? 400 : 0;
    const totalPrice    = base + designExtra + frameExtra + materialExtra;

    const daysAgo   = Math.floor((i / 80) * 365);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    await prisma.order.create({
      data: { clientName: user.name, phone: user.phone, email: user.email, size, format, design, material, coating, status, totalPrice, photoPaths: '[]', comments: comment, createdAt, userId: user.id },
    });
  }
  console.log(`✅ Заказы: 80 записей за последний год`);

  console.log('\n🎉 База данных готова!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 Администратор:  admin / admin123');
  console.log('👥 Пользователи:   20 аккаунтов, пароль: user123');
  console.log('   Пример входа:   marina@mail.ru / user123');
  console.log('📦 Заказов:        80');
  console.log(`💰 Прайс:          ${prices.length} позиций (10×15 до 180×240)`);
  console.log(`🖼  Форматов:       ${FORMATS.length}`);
  console.log(`🎨 Техник дизайна: ${DESIGNS.length}`);
  console.log(`🧵 Материалов:     ${MATERIALS.length}`);
  console.log(`✨ Покрытий:       ${COATINGS.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
