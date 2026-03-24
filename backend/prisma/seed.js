const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─── Техники живописи ─────────────────────────────────────────────────────
// Это то ЧЕМ рисует художник
const DESIGNS = [
  // Масло
  'Масло — классическая техника',
  'Масло — импрессионизм (мазки)',
  'Масло — реализм (детальная прорисовка)',
  'Масло — абстракция',
  'Масло — пейзаж',
  'Масло — портрет',
  // Акварель
  'Акварель — классическая (прозрачная)',
  'Акварель — ботаническая (детальная)',
  'Акварель — акварель с тушью',
  'Акварель — городской пейзаж',
  'Акварель — портрет',
  // Акрил
  'Акрил — яркая палитра',
  'Акрил — текстурная живопись (шпатель)',
  'Акрил — абстрактный экспрессионизм',
  'Акрил — поп-арт стиль',
  // Гуашь
  'Гуашь — книжная иллюстрация',
  'Гуашь — детский рисунок',
  'Гуашь — плакатный стиль',
  // Пастель
  'Пастель — сухая пастель',
  'Пастель — масляная пастель',
  'Пастель — портрет',
  // Уголь и карандаш
  'Уголь — графика',
  'Уголь — портрет',
  'Карандаш — простой карандаш (реализм)',
  'Карандаш — цветные карандаши',
  // Смешанные техники
  'Смешанная техника — масло + уголь',
  'Смешанная техника — акварель + линер',
  'Смешанная техника — акрил + коллаж',
  // Особые стили
  'Живопись в стиле Ван Гога',
  'Живопись в стиле Моне',
  'Живопись в стиле Климта',
];

// ─── Виды оформления готовой картины ─────────────────────────────────────
// Как художник оформит готовое полотно
const FORMATS = [
  // Холст
  'Холст на подрамнике (сосна, стандарт)',
  'Холст на подрамнике (бук, премиум)',
  'Холст на подрамнике (галерейный, 4 см)',
  'Холст без подрамника (в рулоне)',
  // Рамы
  'Холст в деревянной раме (натуральный дуб)',
  'Холст в раме (чёрная, лаконичная)',
  'Холст в раме (золото, классика)',
  'Холст в раме (серебро, модерн)',
  'Холст в раме (белая, скандинавский стиль)',
  'Холст в плавающей раме (float frame)',
  // Багет
  'В багетной раме (широкий, классика)',
  'В багетной раме (узкий, модерн)',
  'В раме с паспарту (белое)',
  'В раме с паспарту (чёрное)',
  // Бумажные работы
  'Под стеклом в раме (для акварели/пастели)',
  'Под стеклом с паспарту (для графики)',
  // Холст на бумаге
  'Без оформления (только работа)',
];

// ─── Основа для рисования ─────────────────────────────────────────────────
// На чём художник рисует
const MATERIALS = [
  // Холст
  'Хлопковый холст (стандарт)',
  'Льняной холст (профессиональный)',
  'Хлопок/лён смесь (универсальный)',
  'Холст грубой фактуры (для экспрессионизма)',
  // Бумага
  'Бумага акварельная 300 г/м² (Fabriano)',
  'Бумага акварельная 640 г/м² (Arches, музейная)',
  'Бумага для пастели (бархатная)',
  'Бумага для пастели (цветная, тонированная)',
  'Бумага для графики (ватман)',
  'Бумага крафт (для набросков и скетчей)',
  // Картон и дерево
  'Картон грунтованный (для акрила/масла)',
  'Дерево (фанера грунтованная, для масла)',
];

// ─── Срочность и сложность ────────────────────────────────────────────────
const COATINGS = [
  'Стандартный срок (14–21 день)',
  'Ускоренный срок (7–10 дней, +30%)',
  'Срочный заказ (3–5 дней, +60%)',
  'Без спешки (21–30 дней, скидка 10%)',
  'Уточнить срок индивидуально',
];

async function main() {
  console.log('🎨 Заполняю базу данных ArtStudio (художественная студия)...\n');

  // Очистка старых данных
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();
  await prisma.price.deleteMany();

  // ─── Администратор ──────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin123', 10);
  await prisma.admin.upsert({
    where:  { login: 'admin' },
    update: {},
    create: { login: 'admin', passwordHash: adminHash },
  });
  console.log('✅ Администратор: login=admin, password=admin123');

  // ─── Пользователи ───────────────────────────────────────────────────────
  const usersData = [
    { name: 'Марина Иванова',    phone: '+7 900 123-45-67', email: 'marina@mail.ru'     },
    { name: 'Алексей Петров',    phone: '+7 912 234-56-78', email: 'alex@gmail.com'      },
    { name: 'Ольга Смирнова',    phone: '+7 923 345-67-89', email: 'olga@yandex.ru'      },
    { name: 'Дмитрий Козлов',    phone: '+7 934 456-78-90', email: 'dmitry@mail.ru'      },
    { name: 'Анна Новикова',     phone: '+7 945 567-89-01', email: 'anna@gmail.com'      },
    { name: 'Виктор Морозов',    phone: '+7 956 678-90-12', email: 'viktor@inbox.ru'     },
    { name: 'Екатерина Волкова', phone: '+7 967 789-01-23', email: 'katya@mail.ru'       },
    { name: 'Максим Соколов',    phone: '+7 978 890-12-34', email: 'maxim@yandex.ru'     },
    { name: 'Наталья Лебедева',  phone: '+7 989 901-23-45', email: 'natalia@gmail.com'   },
    { name: 'Андрей Зайцев',     phone: '+7 990 012-34-56', email: 'andrey@mail.ru'      },
    { name: 'Светлана Попова',   phone: '+7 901 111-22-33', email: 'svetlana@rambler.ru' },
    { name: 'Игорь Никитин',     phone: '+7 902 222-33-44', email: 'igor@gmail.com'      },
    { name: 'Ирина Фёдорова',    phone: '+7 903 333-44-55', email: 'irina@yandex.ru'     },
    { name: 'Павел Семёнов',     phone: '+7 904 444-55-66', email: 'pavel@mail.ru'       },
    { name: 'Татьяна Орлова',    phone: '+7 905 555-66-77', email: 'tatyana@inbox.ru'    },
    { name: 'Сергей Виноградов', phone: '+7 906 666-77-88', email: 'sergey@gmail.com'    },
    { name: 'Юлия Белова',       phone: '+7 907 777-88-99', email: 'yulia@mail.ru'       },
    { name: 'Евгений Тихонов',   phone: '+7 908 888-99-00', email: 'evgeny@yandex.ru'    },
    { name: 'Валерия Кузнецова', phone: '+7 909 999-00-11', email: 'valeria@gmail.com'   },
    { name: 'Артём Громов',      phone: '+7 910 100-20-30', email: 'artem@mail.ru'       },
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
  console.log(`✅ Пользователи: ${createdUsers.length} аккаунтов (пароль: user123)`);

  // ─── Прайс-лист ─────────────────────────────────────────────────────────
  // Цены на РУЧНУЮ живопись — выше чем на печать, т.к. это работа художника
  const prices = [
    // Миниатюры (быстро, недорого)
    { size: '10×15 см',   price: 1500,  category: 'mini'     },
    { size: '13×18 см',   price: 1800,  category: 'mini'     },
    { size: '15×20 см',   price: 2200,  category: 'mini'     },
    { size: '20×20 см',   price: 2500,  category: 'mini'     },
    { size: '20×25 см',   price: 2800,  category: 'mini'     },
    { size: '20×30 см',   price: 3200,  category: 'mini'     },
    // Стандарт
    { size: '25×35 см',   price: 3800,  category: 'standard' },
    { size: '30×30 см',   price: 4000,  category: 'standard' },
    { size: '30×40 см',   price: 4500,  category: 'standard' },
    { size: '30×45 см',   price: 5000,  category: 'standard' },
    { size: '35×50 см',   price: 5500,  category: 'standard' },
    { size: '40×40 см',   price: 5800,  category: 'standard' },
    { size: '40×50 см',   price: 6200,  category: 'standard' },
    { size: '40×60 см',   price: 6800,  category: 'standard' },
    { size: '45×60 см',   price: 7200,  category: 'standard' },
    { size: '50×50 см',   price: 7500,  category: 'standard' },
    { size: '50×70 см',   price: 8500,  category: 'standard' },
    { size: '50×75 см',   price: 9000,  category: 'standard' },
    // Большие
    { size: '60×60 см',   price: 10000, category: 'large'    },
    { size: '60×80 см',   price: 11000, category: 'large'    },
    { size: '60×90 см',   price: 12000, category: 'large'    },
    { size: '70×70 см',   price: 12500, category: 'large'    },
    { size: '70×100 см',  price: 14000, category: 'large'    },
    { size: '75×100 см',  price: 15000, category: 'large'    },
    { size: '80×100 см',  price: 17000, category: 'large'    },
    { size: '80×120 см',  price: 19000, category: 'large'    },
    // Очень большие (XL)
    { size: '90×120 см',  price: 22000, category: 'xl'       },
    { size: '100×100 см', price: 24000, category: 'xl'       },
    { size: '100×120 см', price: 26000, category: 'xl'       },
    { size: '100×150 см', price: 30000, category: 'xl'       },
    { size: '110×140 см', price: 32000, category: 'xl'       },
    { size: '120×150 см', price: 35000, category: 'xl'       },
    { size: '120×160 см', price: 38000, category: 'xl'       },
    // Монументальные (XXL)
    { size: '130×180 см', price: 45000, category: 'xxl'      },
    { size: '150×200 см', price: 55000, category: 'xxl'      },
    { size: '160×200 см', price: 62000, category: 'xxl'      },
    { size: '180×240 см', price: 80000, category: 'xxl'      },
  ];

  for (const p of prices) {
    await prisma.price.upsert({
      where:  { size: p.size },
      update: { price: p.price, category: p.category },
      create: p,
    });
  }
  console.log(`✅ Прайс-лист: ${prices.length} позиций (от 10×15 за 1500₽ до 180×240 за 80000₽)`);

  // ─── Заказы (80 штук) ───────────────────────────────────────────────────
  const statuses = ['new','new','new','in_progress','in_progress','ready','delivered','delivered'];
  const allSizes = prices.map(p => p.size);

  const comments = [
    'Портрет мамы по фотографии, масло. Хочу тёплые тона, без холодных оттенков',
    'Пейзаж — наш дачный участок летом, акварель. Передайте атмосферу вечернего заката',
    'Свадебный портрет по фото, масло. Очень важный заказ, прошу внимательно',
    '',
    'Детский портрет (дочке 5 лет), акварель. Улыбка должна быть яркой',
    'Подарок на юбилей папе — портрет по старой чёрно-белой фотографии',
    '',
    'Копия картины Моне «Кувшинки», масло. Размер чуть меньше оригинала',
    'Натюрморт с цветами на кухню. Преобладающие цвета — жёлтый и белый',
    'Пейзаж с видом на море, хочу в технике импрессионизм',
    '',
    'Три портрета — меня, мужа и нашей собаки. Общий холст',
    'Городской пейзаж — наша улица в Москве, акварель + линер',
    '',
    'Абстрактная работа для гостиной. Размер 100×80. Цвета: терракота, синий, белый',
    'Копия картины Климта «Поцелуй», акрил. Подарок на свадьбу',
    '',
    'Портрет дедушки по фотографии 1965 года. Восстановить и нарисовать маслом',
    'Пейзаж — лесная опушка осенью, пастель. Для кабинета',
    'Натюрморт с книгами и чернильницей в стиле голландской школы',
    '',
    'Семейный портрет — 4 человека + кот. По серии фотографий',
    'Конный портрет — наша лошадь на пастбище, масло',
    '',
    'Морской пейзаж с парусниками, акварель. Будет висеть в детской',
    'Зимний пейзаж — деревня в снегу, масло. Хочу как у русских передвижников',
  ];

  for (let i = 0; i < 80; i++) {
    const user     = createdUsers[i % createdUsers.length];
    const size     = allSizes[i % allSizes.length];
    const design   = DESIGNS[i % DESIGNS.length];
    const format   = FORMATS[i % FORMATS.length];
    const material = MATERIALS[i % MATERIALS.length];
    const coating  = COATINGS[i % COATINGS.length];
    const status   = statuses[i % statuses.length];
    const comment  = comments[i % comments.length];

    const priceEntry  = prices.find(p => p.size === size);
    const base        = priceEntry ? priceEntry.price : 4500;

    // Надбавки за технику
    const techExtra = design.includes('портрет') ? Math.round(base * 0.2)
                    : design.includes('Климта') || design.includes('Ван Гога') || design.includes('Моне') ? Math.round(base * 0.3)
                    : design.includes('реализм') ? Math.round(base * 0.15)
                    : 0;

    // Надбавка за оформление
    const frameExtra = format.includes('раме') || format.includes('паспарту') || format.includes('float') ? 2500
                     : format.includes('подрамнике') ? 800
                     : format.includes('стеклом') ? 1500
                     : 0;

    // Надбавка за срочность
    const urgencyExtra = coating.includes('Ускоренный') ? Math.round(base * 0.3)
                       : coating.includes('Срочный')    ? Math.round(base * 0.6)
                       : 0;

    const totalPrice = base + techExtra + frameExtra + urgencyExtra;

    const daysAgo   = Math.floor((i / 80) * 365);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    await prisma.order.create({
      data: {
        clientName: user.name,
        phone:      user.phone,
        email:      user.email,
        size,
        format,
        design,
        material,
        coating,
        status,
        totalPrice,
        photoPaths: '[]',
        comments:   comment,
        createdAt,
        userId:     user.id,
      },
    });
  }
  console.log(`✅ Заказы: 80 записей за последний год`);

  console.log('\n🎨 База данных художественной студии готова!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 Администратор:      admin / admin123');
  console.log('👥 Пользователи:       20 аккаунтов, пароль: user123');
  console.log('   Пример входа:       marina@mail.ru / user123');
  console.log('📦 Заказов:            80');
  console.log(`💰 Прайс:              ${prices.length} позиций (1 500 — 80 000 ₽)`);
  console.log(`🎨 Техник живописи:    ${DESIGNS.length} (масло, акварель, акрил, пастель...)`);
  console.log(`🖼  Форматов:           ${FORMATS.length} (рамы, подрамник, паспарту...)`);
  console.log(`🖌  Оснований:         ${MATERIALS.length} (холст, бумага, дерево...)`);
  console.log(`⏱  Сроки:              ${COATINGS.length} вариантов`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
