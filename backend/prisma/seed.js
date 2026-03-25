const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🎨 Заполняю базу данных ArtStudio...\n');

  // ── Очистка ───────────────────────────────────────────────────────────────
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.plot.deleteMany();
  await prisma.design.deleteMany();
  await prisma.format.deleteMany();
  await prisma.size.deleteMany();
  await prisma.user.deleteMany();
  await prisma.admin.upsert({
    where:  { login: 'admin' },
    update: {},
    create: { login: 'admin', passwordHash: await bcrypt.hash('admin123', 10) },
  });

  // ── Размеры холста (базовая цена) ─────────────────────────────────────────
  const sizesData = [
    { size: '10×15 см',   price: 1500  },
    { size: '20×30 см',   price: 3200  },
    { size: '30×40 см',   price: 4500  },
    { size: '40×50 см',   price: 6200  },
    { size: '40×60 см',   price: 6800  },
    { size: '50×70 см',   price: 8500  },
    { size: '60×80 см',   price: 11000 },
    { size: '70×100 см',  price: 14000 },
    { size: '80×120 см',  price: 19000 },
    { size: '100×150 см', price: 30000 },
  ];
  const sizes = [];
  for (const s of sizesData) {
    sizes.push(await prisma.size.create({ data: s }));
  }
  console.log(`✅ Размеры: ${sizes.length}`);

  // ── Виды оформления (надбавка к цене) ────────────────────────────────────
  const formatsData = [
    { format: 'Без оформления (только работа)',           priceExtra: 0    },
    { format: 'Холст на подрамнике (сосна, стандарт)',    priceExtra: 800  },
    { format: 'Холст на подрамнике (бук, премиум)',       priceExtra: 1200 },
    { format: 'Холст на подрамнике (галерейный, 4 см)',   priceExtra: 1500 },
    { format: 'Холст без подрамника (в рулоне)',          priceExtra: 0    },
    { format: 'Холст в деревянной раме (натуральный дуб)',priceExtra: 2500 },
    { format: 'Холст в раме (чёрная, лаконичная)',        priceExtra: 2000 },
    { format: 'Холст в раме (золото, классика)',          priceExtra: 2500 },
    { format: 'Холст в раме (серебро, модерн)',           priceExtra: 2200 },
    { format: 'Холст в раме (белая, скандинавский стиль)',priceExtra: 2000 },
    { format: 'Холст в плавающей раме (float frame)',     priceExtra: 2800 },
    { format: 'В багетной раме (широкий, классика)',      priceExtra: 2500 },
    { format: 'В багетной раме (узкий, модерн)',          priceExtra: 2000 },
    { format: 'В раме с паспарту (белое)',                priceExtra: 2500 },
    { format: 'В раме с паспарту (чёрное)',               priceExtra: 2500 },
    { format: 'Под стеклом в раме (для акварели/пастели)',priceExtra: 1500 },
    { format: 'Под стеклом с паспарту (для графики)',     priceExtra: 1800 },
  ];
  const formats = [];
  for (const f of formatsData) {
    formats.push(await prisma.format.create({ data: f }));
  }
  console.log(`✅ Виды оформления: ${formats.length}`);

  // ── Техники исполнения (надбавка за сложность) ────────────────────────────
  const designsData = [
    { design: 'Масло — классическая техника',         priceExtra: 0    },
    { design: 'Масло — импрессионизм (мазки)',         priceExtra: 0    },
    { design: 'Масло — реализм (детальная прорисовка)',priceExtra: 1500 },
    { design: 'Масло — абстракция',                   priceExtra: 0    },
    { design: 'Масло — пейзаж',                       priceExtra: 0    },
    { design: 'Масло — портрет',                      priceExtra: 2000 },
    { design: 'Акварель — классическая (прозрачная)', priceExtra: 0    },
    { design: 'Акварель — ботаническая (детальная)',  priceExtra: 1000 },
    { design: 'Акварель — с тушью',                   priceExtra: 500  },
    { design: 'Акварель — городской пейзаж',          priceExtra: 500  },
    { design: 'Акварель — портрет',                   priceExtra: 2000 },
    { design: 'Акрил — яркая палитра',                priceExtra: 0    },
    { design: 'Акрил — текстурная живопись (шпатель)',priceExtra: 800  },
    { design: 'Акрил — абстрактный экспрессионизм',  priceExtra: 0    },
    { design: 'Акрил — поп-арт стиль',               priceExtra: 500  },
    { design: 'Гуашь — книжная иллюстрация',         priceExtra: 500  },
    { design: 'Гуашь — детский рисунок',             priceExtra: 0    },
    { design: 'Гуашь — плакатный стиль',             priceExtra: 300  },
    { design: 'Пастель — сухая пастель',             priceExtra: 0    },
    { design: 'Пастель — масляная пастель',          priceExtra: 300  },
    { design: 'Пастель — портрет',                   priceExtra: 2000 },
    { design: 'Уголь — графика',                     priceExtra: 0    },
    { design: 'Уголь — портрет',                     priceExtra: 1500 },
    { design: 'Карандаш — реализм',                  priceExtra: 1000 },
    { design: 'Карандаш — цветные карандаши',        priceExtra: 500  },
    { design: 'Смешанная техника — масло + уголь',   priceExtra: 1000 },
    { design: 'Смешанная техника — акварель + линер',priceExtra: 800  },
    { design: 'Смешанная техника — акрил + коллаж',  priceExtra: 1200 },
    { design: 'Живопись в стиле Ван Гога',           priceExtra: 3000 },
    { design: 'Живопись в стиле Моне',               priceExtra: 3000 },
    { design: 'Живопись в стиле Климта',             priceExtra: 3500 },
  ];
  const designs = [];
  for (const d of designsData) {
    designs.push(await prisma.design.create({ data: d }));
  }
  console.log(`✅ Техники исполнения: ${designs.length}`);

  // ── Сюжеты (надбавка за сложность сюжета) ────────────────────────────────
  const plotsData = [
    { plot: 'Пейзаж',             priceExtra: 0    },
    { plot: 'Морской пейзаж',     priceExtra: 0    },
    { plot: 'Городской пейзаж',   priceExtra: 500  },
    { plot: 'Зимний пейзаж',      priceExtra: 0    },
    { plot: 'Портрет',            priceExtra: 2000 },
    { plot: 'Парный портрет',     priceExtra: 3500 },
    { plot: 'Семейный портрет',   priceExtra: 5000 },
    { plot: 'Детский портрет',    priceExtra: 2000 },
    { plot: 'Натюрморт',          priceExtra: 0    },
    { plot: 'Цветы',              priceExtra: 0    },
    { plot: 'Абстракция',         priceExtra: 0    },
    { plot: 'Животные',           priceExtra: 1000 },
    { plot: 'Лошади',             priceExtra: 1500 },
    { plot: 'Архитектура',        priceExtra: 1000 },
    { plot: 'Копия картины',      priceExtra: 2500 },
    { plot: 'Миниатюра',          priceExtra: 0    },
    { plot: 'По фотографии',      priceExtra: 500  },
  ];
  const plots = [];
  for (const p of plotsData) {
    plots.push(await prisma.plot.create({ data: p }));
  }
  console.log(`✅ Сюжеты: ${plots.length}`);

  // ── Скидки и надбавки (за срочность и количество) ────────────────────────
  const discountsData = [
    { description: 'Без скидки/надбавки',                 percent:   0 },
    { description: 'Очень срочный заказ (менее 3 дней)',  percent:  60 },
    { description: 'Срочный заказ (3–6 дней)',            percent:  30 },
    { description: 'Ускоренный срок (7–13 дней)',         percent:  15 },
    { description: 'Длительный срок (30+ дней)',          percent:  -5 },
    { description: 'Скидка за объём — 2 картины',         percent:  -5 },
    { description: 'Скидка за объём — 3–4 картины',       percent: -10 },
    { description: 'Скидка за объём — 5–9 картин',        percent: -15 },
    { description: 'Скидка за объём — 10+ картин',        percent: -20 },
  ];
  const discounts = [];
  for (const d of discountsData) {
    discounts.push(await prisma.discount.create({ data: d }));
  }
  console.log(`✅ Скидки/надбавки: ${discounts.length}`);

  // ── Пользователи ──────────────────────────────────────────────────────────
  const usersData = [
    { name: 'Марина Иванова',    phone: '+7 900 123-45-67', email: 'marina@mail.ru'   },
    { name: 'Алексей Петров',    phone: '+7 912 234-56-78', email: 'alex@gmail.com'   },
    { name: 'Ольга Смирнова',    phone: '+7 923 345-67-89', email: 'olga@yandex.ru'   },
    { name: 'Дмитрий Козлов',    phone: '+7 934 456-78-90', email: 'dmitry@mail.ru'   },
    { name: 'Анна Новикова',     phone: '+7 945 567-89-01', email: 'anna@gmail.com'   },
    { name: 'Виктор Морозов',    phone: '+7 956 678-90-12', email: 'viktor@inbox.ru'  },
    { name: 'Екатерина Волкова', phone: '+7 967 789-01-23', email: 'katya@mail.ru'    },
    { name: 'Максим Соколов',    phone: '+7 978 890-12-34', email: 'maxim@yandex.ru'  },
    { name: 'Наталья Лебедева',  phone: '+7 989 901-23-45', email: 'natalia@gmail.com'},
    { name: 'Андрей Зайцев',     phone: '+7 990 012-34-56', email: 'andrey@mail.ru'   },
    { name: 'Светлана Попова',   phone: '+7 901 111-22-33', email: 'svetlana@mail.ru' },
    { name: 'Игорь Никитин',     phone: '+7 902 222-33-44', email: 'igor@gmail.com'   },
    { name: 'Ирина Фёдорова',    phone: '+7 903 333-44-55', email: 'irina@yandex.ru'  },
    { name: 'Павел Семёнов',     phone: '+7 904 444-55-66', email: 'pavel@mail.ru'    },
    { name: 'Татьяна Орлова',    phone: '+7 905 555-66-77', email: 'tatyana@inbox.ru' },
    { name: 'Сергей Виноградов', phone: '+7 906 666-77-88', email: 'sergey@gmail.com' },
    { name: 'Юлия Белова',       phone: '+7 907 777-88-99', email: 'yulia@mail.ru'    },
    { name: 'Евгений Тихонов',   phone: '+7 908 888-99-00', email: 'evgeny@yandex.ru' },
    { name: 'Валерия Кузнецова', phone: '+7 909 999-00-11', email: 'valeria@gmail.com'},
    { name: 'Артём Громов',      phone: '+7 910 100-20-30', email: 'artem@mail.ru'    },
  ];
  const users = [];
  for (const u of usersData) {
    users.push(await prisma.user.create({
      data: { ...u, passwordHash: await bcrypt.hash('user123', 10) }
    }));
  }
  console.log(`✅ Пользователи: ${users.length}`);

  // ── Заказы с позициями ────────────────────────────────────────────────────
  const statuses = ['new','new','in_progress','in_progress','ready','delivered','delivered'];
  const comments = [
    'Портрет мамы по фотографии, тёплые тона',
    'Пейзаж — дачный участок летом, вечерний закат',
    'Свадебный портрет по фото',
    '',
    'Детский портрет, яркая улыбка',
    'Подарок на юбилей — портрет по старой фотографии',
    '',
    'Копия Моне «Кувшинки», масло',
    'Натюрморт с цветами на кухню, жёлтый и белый',
    '',
  ];

  for (let i = 0; i < 30; i++) {
    const user     = users[i % users.length];
    const size     = sizes[i % sizes.length];
    const format   = formats[i % formats.length];
    const design   = designs[i % designs.length];
    const plot     = plots[i % plots.length];
    const discount = discounts[i % discounts.length];
    const status   = statuses[i % statuses.length];
    const qty      = (i % 3) + 1;

    const priceUnit = size.price + format.priceExtra + design.priceExtra + plot.priceExtra;
    const baseTotal = priceUnit * qty;
    const pct       = discount.percent;
    const totalPrice = pct >= 0
      ? Math.round(baseTotal * (1 + pct / 100))
      : Math.round(baseTotal * (1 + pct / 100));

    const daysAgo   = Math.floor((i / 30) * 180);
    const createdAt = new Date(Date.now() - daysAgo * 86400000);

    const order = await prisma.order.create({
      data: {
        clientName:      user.name,
        phone:           user.phone,
        email:           user.email,
        status,
        totalPrice,
        prepayment:      Math.round(totalPrice * 0.3),
        photoPaths:      '[]',
        comments:        comments[i % comments.length],
        createdAt,
        discountPercent: pct,
        discountReason:  pct !== 0 ? discount.description : '',
        userId:          user.id,
        sizeId:          size.id,
        formatId:        format.id,
        designId:        design.id,
        plotId:          plot.id,
        discountId:      discount.id,
      },
    });

    await prisma.orderItem.create({
      data: { orderId: order.id, quantity: qty, priceUnit, amount: priceUnit * qty }
    });
  }
  console.log(`✅ Заказы: 30`);

  console.log('\n🎨 База данных готова!');
  console.log('─────────────────────────────────────────');
  console.log('👤 Админ:       admin / admin123');
  console.log('👥 Пользователи: 20 аккаунтов, пароль: user123');
  console.log('   Пример:      marina@mail.ru / user123');
  console.log('─────────────────────────────────────────');
}

main()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
