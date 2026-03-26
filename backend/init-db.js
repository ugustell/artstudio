// init-db.js — запускается при каждом старте сервера.
// Если БД пустая (новый деплой на Railway) — заполняет данными.
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Проверяем нужен ли seed — если админ уже есть, всё ок
  const adminCount = await prisma.admin.count();
  if (adminCount > 0) {
    console.log('✅ БД уже инициализирована, пропускаем seed');
    return;
  }

  console.log('🌱 БД пустая — заполняем начальными данными...');

  await prisma.admin.create({
    data: { login: 'admin', passwordHash: await bcrypt.hash('admin123', 10) },
  });

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
  for (const s of sizesData) await prisma.size.create({ data: s });
  console.log(`✅ Размеры: ${sizesData.length}`);

  const formatsData = [
    { format: 'Без оформления (только работа)',             priceExtra: 0    },
    { format: 'Холст на подрамнике (сосна, стандарт)',      priceExtra: 800  },
    { format: 'Холст на подрамнике (бук, премиум)',         priceExtra: 1200 },
    { format: 'Холст на подрамнике (галерейный, 4 см)',     priceExtra: 1500 },
    { format: 'Холст без подрамника (в рулоне)',            priceExtra: 0    },
    { format: 'Холст в деревянной раме (натуральный дуб)',  priceExtra: 2500 },
    { format: 'Холст в раме (чёрная, лаконичная)',          priceExtra: 2000 },
    { format: 'Холст в раме (золото, классика)',            priceExtra: 2500 },
    { format: 'Холст в раме (серебро, модерн)',             priceExtra: 2200 },
    { format: 'Холст в раме (белая, скандинавский стиль)',  priceExtra: 2000 },
    { format: 'Холст в плавающей раме (float frame)',       priceExtra: 2800 },
    { format: 'В багетной раме (широкий, классика)',        priceExtra: 2500 },
    { format: 'В багетной раме (узкий, модерн)',            priceExtra: 2000 },
    { format: 'В раме с паспарту (белое)',                  priceExtra: 2500 },
    { format: 'В раме с паспарту (чёрное)',                 priceExtra: 2500 },
    { format: 'Под стеклом в раме (для акварели/пастели)', priceExtra: 1500 },
    { format: 'Под стеклом с паспарту (для графики)',      priceExtra: 1800 },
  ];
  for (const f of formatsData) await prisma.format.create({ data: f });
  console.log(`✅ Оформления: ${formatsData.length}`);

  const designsData = [
    { design: 'Масло — классическая техника',          priceExtra: 0    },
    { design: 'Масло — импрессионизм (мазки)',          priceExtra: 0    },
    { design: 'Масло — реализм (детальная прорисовка)', priceExtra: 1500 },
    { design: 'Масло — абстракция',                    priceExtra: 0    },
    { design: 'Масло — пейзаж',                        priceExtra: 0    },
    { design: 'Масло — портрет',                       priceExtra: 2000 },
    { design: 'Акварель — классическая (прозрачная)',  priceExtra: 0    },
    { design: 'Акварель — ботаническая (детальная)',   priceExtra: 1000 },
    { design: 'Акварель — с тушью',                    priceExtra: 500  },
    { design: 'Акварель — городской пейзаж',           priceExtra: 500  },
    { design: 'Акварель — портрет',                    priceExtra: 2000 },
    { design: 'Акрил — яркая палитра',                 priceExtra: 0    },
    { design: 'Акрил — текстурная живопись (шпатель)', priceExtra: 800  },
    { design: 'Акрил — абстрактный экспрессионизм',   priceExtra: 0    },
    { design: 'Акрил — поп-арт стиль',                priceExtra: 500  },
    { design: 'Гуашь — книжная иллюстрация',          priceExtra: 500  },
    { design: 'Гуашь — детский рисунок',              priceExtra: 0    },
    { design: 'Гуашь — плакатный стиль',              priceExtra: 300  },
    { design: 'Пастель — сухая пастель',              priceExtra: 0    },
    { design: 'Пастель — масляная пастель',           priceExtra: 300  },
    { design: 'Пастель — портрет',                    priceExtra: 2000 },
    { design: 'Уголь — графика',                      priceExtra: 0    },
    { design: 'Уголь — портрет',                      priceExtra: 1500 },
    { design: 'Карандаш — реализм',                   priceExtra: 1000 },
    { design: 'Карандаш — цветные карандаши',         priceExtra: 500  },
    { design: 'Смешанная техника — масло + уголь',    priceExtra: 1000 },
    { design: 'Смешанная техника — акварель + линер', priceExtra: 800  },
    { design: 'Смешанная техника — акрил + коллаж',   priceExtra: 1200 },
    { design: 'Живопись в стиле Ван Гога',            priceExtra: 3000 },
    { design: 'Живопись в стиле Моне',                priceExtra: 3000 },
    { design: 'Живопись в стиле Климта',              priceExtra: 3500 },
  ];
  for (const d of designsData) await prisma.design.create({ data: d });
  console.log(`✅ Техники: ${designsData.length}`);

  const plotsData = [
    { plot: 'Пейзаж',           priceExtra: 0    },
    { plot: 'Морской пейзаж',   priceExtra: 0    },
    { plot: 'Городской пейзаж', priceExtra: 500  },
    { plot: 'Зимний пейзаж',    priceExtra: 0    },
    { plot: 'Портрет',          priceExtra: 2000 },
    { plot: 'Парный портрет',   priceExtra: 3500 },
    { plot: 'Семейный портрет', priceExtra: 5000 },
    { plot: 'Детский портрет',  priceExtra: 2000 },
    { plot: 'Натюрморт',        priceExtra: 0    },
    { plot: 'Цветы',            priceExtra: 0    },
    { plot: 'Абстракция',       priceExtra: 0    },
    { plot: 'Животные',         priceExtra: 1000 },
    { plot: 'Лошади',           priceExtra: 1500 },
    { plot: 'Архитектура',      priceExtra: 1000 },
    { plot: 'Копия картины',    priceExtra: 2500 },
    { plot: 'Миниатюра',        priceExtra: 0    },
    { plot: 'По фотографии',    priceExtra: 500  },
  ];
  for (const p of plotsData) await prisma.plot.create({ data: p });
  console.log(`✅ Сюжеты: ${plotsData.length}`);

  const discountsData = [
    { description: 'Без скидки/надбавки',                percent:   0 },
    { description: 'Очень срочный заказ (менее 3 дней)', percent:  60 },
    { description: 'Срочный заказ (3–6 дней)',           percent:  30 },
    { description: 'Ускоренный срок (7–13 дней)',        percent:  15 },
    { description: 'Длительный срок (30+ дней)',         percent:  -5 },
    { description: 'Скидка за объём — 2 картины',        percent:  -5 },
    { description: 'Скидка за объём — 3–4 картины',      percent: -10 },
    { description: 'Скидка за объём — 5–9 картин',       percent: -15 },
    { description: 'Скидка за объём — 10+ картин',       percent: -20 },
  ];
  for (const d of discountsData) await prisma.discount.create({ data: d });
  console.log(`✅ Скидки: ${discountsData.length}`);

  console.log('🎨 БД готова! Админ: admin / admin123');
}

main()
  .catch(e => { console.error('❌ init-db error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
