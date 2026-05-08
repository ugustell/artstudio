/**
 * seed-35-orders.js
 * Удаляет все заказы и создаёт 35 контрольных примеров.
 *
 * Запуск (Railway DB):
 *   DATABASE_URL="postgresql://..." node prisma/seed-35-orders.js
 *
 * Запуск (локально, если есть .env):
 *   node prisma/seed-35-orders.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

if (process.env.DATABASE_URL && /^file:\.\//.test(process.env.DATABASE_URL)) {
  const p = require('path').resolve(__dirname, '..', process.env.DATABASE_URL.replace(/^file:\.\//, ''));
  process.env.DATABASE_URL = `file:${p}`;
}

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

// ──────────────────────────────────────────────────────────────────────────────
// Данные 35 заказов (s=размер, f=оформление, d=техника, p=сюжет, q=кол-во)
// Имена справочников — точно как в init-db.js
// ──────────────────────────────────────────────────────────────────────────────

const ORDERS = [
  // ─── ВЫПОЛНЕНЫ (10) ────────────────────────────────────────────────────────
  {
    clientName: 'Смирнова Анна Сергеевна',   phone: '+79021234567', email: 'smirnova.as@mail.ru',
    status: 'delivered', createdAt: '2026-01-08', deadline: '2026-02-10', issueDate: '2026-02-08',
    address: 'г. Тольятти, ул. Ленина, 45, кв. 12', note: 'Подарок на день рождения, завернуть в упаковку',
    prepayment: 5500,
    items: [{ s:'40×50 см', f:'Холст в плавающей раме (float frame)', d:'Масло — классическая техника', p:'Портрет', q:1 }],
  },
  {
    clientName: 'Петров Игорь Владимирович',  phone: '+79031112233', email: 'petrov.iv@gmail.com',
    status: 'delivered', createdAt: '2026-01-12', deadline: '2026-02-15', issueDate: '2026-02-14',
    address: 'г. Тольятти, ул. Победы, 10, кв. 5', note: 'Два пейзажа для гостиной, одинаковый стиль',
    prepayment: 3000,
    items: [
      { s:'30×40 см', f:'Холст на подрамнике (сосна, стандарт)', d:'Акварель — классическая (прозрачная)', p:'Цветы', q:1 },
      { s:'30×40 см', f:'Холст на подрамнике (сосна, стандарт)', d:'Акварель — классическая (прозрачная)', p:'Натюрморт', q:1 },
    ],
  },
  {
    clientName: 'Козлова Мария Николаевна',   phone: '+79157778899', email: 'kozlova.m@yandex.ru',
    status: 'delivered', createdAt: '2026-01-15', deadline: '2026-02-20', issueDate: '2026-02-18',
    address: 'г. Тольятти, ул. Мира, 89, кв. 34', note: 'Портрет по фотографии, прислать макет перед написанием',
    prepayment: 7000,
    items: [{ s:'50×70 см', f:'Холст в раме (золото, классика)', d:'Масло — реализм (детальная прорисовка)', p:'Портрет', q:1 }],
  },
  {
    clientName: 'Новиков Дмитрий Александрович', phone: '+79264445566', email: 'novikov.da@mail.ru',
    status: 'delivered', createdAt: '2026-01-20', deadline: '2026-02-28', issueDate: '2026-02-25',
    address: 'г. Тольятти, ул. Тополиная, 23, кв. 7', note: 'Три пейзажа в серии — лето, осень, зима',
    prepayment: 5000,
    items: [
      { s:'20×30 см', f:'Холст на подрамнике (сосна, стандарт)', d:'Масло — классическая техника', p:'Пейзаж', q:1 },
      { s:'20×30 см', f:'Холст на подрамнике (сосна, стандарт)', d:'Масло — классическая техника', p:'Зимний пейзаж', q:1 },
      { s:'20×30 см', f:'Холст на подрамнике (сосна, стандарт)', d:'Масло — классическая техника', p:'Морской пейзаж', q:1 },
    ],
  },
  {
    clientName: 'Морозова Елена Петровна',    phone: '+79378889900', email: 'morozova.ep@mail.ru',
    status: 'delivered', createdAt: '2026-01-25', deadline: '2026-03-01', issueDate: '2026-02-27',
    address: 'г. Тольятти, ул. Революционная, 12, кв. 101', note: '',
    prepayment: 8000,
    items: [{ s:'60×80 см', f:'Холст в деревянной раме (натуральный дуб)', d:'Масло — портрет', p:'Портрет', q:1 }],
  },
  {
    clientName: 'Соколов Андрей Иванович',    phone: '+79489991010', email: 'sokolov.ai@gmail.com',
    status: 'delivered', createdAt: '2026-02-03', deadline: '2026-03-10', issueDate: '2026-03-08',
    address: 'г. Тольятти, ул. Гагарина, 55, кв. 18', note: 'Два абстрактных полотна для офиса',
    prepayment: 7000,
    items: [
      { s:'40×50 см', f:'Холст в раме (чёрная, лаконичная)', d:'Акрил — яркая палитра', p:'Абстракция', q:1 },
      { s:'40×50 см', f:'Холст в раме (чёрная, лаконичная)', d:'Акрил — яркая палитра', p:'Абстракция', q:1 },
    ],
  },
  {
    clientName: 'Попова Наталья Викторовна',  phone: '+79590002020', email: 'popova.nv@yandex.ru',
    status: 'delivered', createdAt: '2026-02-08', deadline: '2026-03-15', issueDate: '2026-03-13',
    address: 'г. Тольятти, ул. Свердлова, 3, кв. 42', note: 'Семейный портрет 4 человека по фото',
    prepayment: 11500,
    items: [{ s:'70×100 см', f:'Холст в раме (золото, классика)', d:'Масло — реализм (детальная прорисовка)', p:'Семейный портрет', q:1 }],
  },
  {
    clientName: 'Лебедева Ирина Алексеевна',  phone: '+79621113131', email: 'lebedeva.ia@mail.ru',
    status: 'delivered', createdAt: '2026-02-12', deadline: '2026-03-20', issueDate: '2026-03-19',
    address: 'г. Тольятти, ул. Комсомольская, 100, кв. 6', note: 'Морской пейзаж, солнечный день, яркие краски',
    prepayment: 3000,
    items: [{ s:'40×60 см', f:'Холст на подрамнике (сосна, стандарт)', d:'Масло — импрессионизм (мазки)', p:'Морской пейзаж', q:1 }],
  },
  {
    clientName: 'Васильев Кирилл Сергеевич',  phone: '+79732224242', email: 'vasiliev.ks@gmail.com',
    status: 'delivered', createdAt: '2026-02-18', deadline: '2026-03-25', issueDate: '2026-03-24',
    address: 'г. Тольятти, пр. Кирова, 67, кв. 25', note: 'Пейзаж и натюрморт в подарок родителям',
    prepayment: 6000,
    items: [
      { s:'40×50 см', f:'Холст на подрамнике (галерейный, 4 см)', d:'Масло — пейзаж', p:'Пейзаж', q:1 },
      { s:'30×40 см', f:'Холст на подрамнике (сосна, стандарт)', d:'Масло — классическая техника', p:'Натюрморт', q:1 },
    ],
  },
  {
    clientName: 'Павлова Светлана Борисовна', phone: '+79843335353', email: 'pavlova.sb@yandex.ru',
    status: 'delivered', createdAt: '2026-02-25', deadline: '2026-04-01', issueDate: '2026-03-29',
    address: 'г. Тольятти, ул. Осипенко, 8, кв. 11', note: 'Большой семейный портрет для гостиной',
    prepayment: 14000,
    items: [{ s:'80×120 см', f:'Холст в раме (золото, классика)', d:'Масло — реализм (детальная прорисовка)', p:'Семейный портрет', q:1 }],
  },

  // ─── ГОТОВ К ВЫДАЧЕ (5) ────────────────────────────────────────────────────
  {
    clientName: 'Семёнов Максим Геннадьевич', phone: '+79954446464', email: 'semenov.mg@mail.ru',
    status: 'ready', createdAt: '2026-02-28', deadline: '2026-05-20', issueDate: '',
    address: 'г. Тольятти, ул. Жилина, 4, кв. 88', note: 'Абстрактное полотно в стиле поп-арт для спальни',
    prepayment: 4000,
    items: [{ s:'40×50 см', f:'Холст в плавающей раме (float frame)', d:'Акрил — текстурная живопись (шпатель)', p:'Абстракция', q:1 }],
  },
  {
    clientName: 'Голубева Оксана Михайловна', phone: '+79065557575', email: 'golubeva.om@gmail.com',
    status: 'ready', createdAt: '2026-03-05', deadline: '2026-05-25', issueDate: '',
    address: 'г. Тольятти, пр. Степана Разина, 40, кв. 15', note: 'Ботанические иллюстрации для кухни, в рамах с паспарту',
    prepayment: 7000,
    items: [
      { s:'30×40 см', f:'В раме с паспарту (белое)', d:'Акварель — ботаническая (детальная)', p:'Цветы', q:1 },
      { s:'30×40 см', f:'В раме с паспарту (белое)', d:'Акварель — ботаническая (детальная)', p:'Цветы', q:1 },
    ],
  },
  {
    clientName: 'Виноградов Роман Юрьевич',   phone: '+79176668686', email: 'vinogradov.ry@yandex.ru',
    status: 'ready', createdAt: '2026-03-10', deadline: '2026-05-30', issueDate: '',
    address: 'г. Тольятти, ул. Маяковского, 22, кв. 3', note: 'Крупная абстракция для лофт-пространства',
    prepayment: 5000,
    items: [{ s:'50×70 см', f:'Холст в плавающей раме (float frame)', d:'Масло — абстракция', p:'Абстракция', q:1 }],
  },
  {
    clientName: 'Кузнецова Татьяна Олеговна', phone: '+79287779797', email: 'kuznetsova.to@mail.ru',
    status: 'ready', createdAt: '2026-03-15', deadline: '2026-06-01', issueDate: '',
    address: 'г. Тольятти, ул. Дружбы народов, 14, кв. 56', note: 'Три миниатюры в подарок коллегам на юбилей',
    prepayment: 5000,
    items: [
      { s:'20×30 см', f:'Холст на подрамнике (сосна, стандарт)', d:'Акварель — классическая (прозрачная)', p:'Пейзаж', q:1 },
      { s:'20×30 см', f:'Холст на подрамнике (сосна, стандарт)', d:'Акварель — классическая (прозрачная)', p:'Зимний пейзаж', q:1 },
      { s:'20×30 см', f:'Холст на подрамнике (сосна, стандарт)', d:'Акварель — классическая (прозрачная)', p:'Морской пейзаж', q:1 },
    ],
  },
  {
    clientName: 'Фёдоров Евгений Николаевич', phone: '+79398880808', email: 'fedorov.en@gmail.com',
    status: 'ready', createdAt: '2026-03-20', deadline: '2026-06-10', issueDate: '',
    address: 'г. Тольятти, ул. Дзержинского, 78, кв. 9', note: 'Пейзаж в стиле Ван Гога — «Звёздная ночь над Волгой»',
    prepayment: 8000,
    items: [{ s:'60×80 см', f:'В багетной раме (широкий, классика)', d:'Живопись в стиле Ван Гога', p:'Пейзаж', q:1 }],
  },

  // ─── В РАБОТЕ (12) ─────────────────────────────────────────────────────────
  {
    clientName: 'Орлова Анастасия Дмитриевна', phone: '+79419991919', email: 'orlova.ad@yandex.ru',
    status: 'in_progress', createdAt: '2026-03-22', deadline: '2026-06-15', issueDate: '',
    address: 'г. Тольятти, ул. Новозаводская, 6, кв. 71', note: 'Детский портрет дочери, 5 лет',
    prepayment: 4000,
    items: [{ s:'40×50 см', f:'Холст на подрамнике (сосна, стандарт)', d:'Масло — классическая техника', p:'Детский портрет', q:1 }],
  },
  {
    clientName: 'Медведев Артём Сергеевич',   phone: '+79520002020', email: 'medvedev.as@mail.ru',
    status: 'in_progress', createdAt: '2026-03-25', deadline: '2026-06-20', issueDate: '',
    address: 'г. Тольятти, ул. Механизаторов, 33, кв. 44', note: 'Два парных портрета для супругов',
    prepayment: 12000,
    items: [
      { s:'40×50 см', f:'Холст в раме (золото, классика)', d:'Масло — портрет', p:'Портрет', q:1 },
      { s:'40×50 см', f:'Холст в раме (золото, классика)', d:'Масло — портрет', p:'Портрет', q:1 },
    ],
  },
  {
    clientName: 'Захарова Юлия Андреевна',    phone: '+79631113030', email: 'zakharova.ya@gmail.com',
    status: 'in_progress', createdAt: '2026-03-28', deadline: '2026-06-25', issueDate: '',
    address: 'г. Тольятти, ул. Рабочая, 15, кв. 2', note: 'Ботаническая акварель с любимыми цветами',
    prepayment: 3500,
    items: [{ s:'30×40 см', f:'Под стеклом в раме (для акварели/пастели)', d:'Акварель — ботаническая (детальная)', p:'Цветы', q:1 }],
  },
  {
    clientName: 'Соловьёв Николай Петрович',  phone: '+79742224141', email: 'soloviev.np@yandex.ru',
    status: 'in_progress', createdAt: '2026-04-02', deadline: '2026-07-01', issueDate: '',
    address: 'г. Тольятти, ул. Спортивная, 50, кв. 30', note: 'Три пейзажа для загородного дома, одинаковый размер и стиль',
    prepayment: 12000,
    items: [
      { s:'40×60 см', f:'Холст в плавающей раме (float frame)', d:'Масло — импрессионизм (мазки)', p:'Морской пейзаж', q:1 },
      { s:'40×60 см', f:'Холст в плавающей раме (float frame)', d:'Масло — импрессионизм (мазки)', p:'Пейзаж', q:1 },
      { s:'40×60 см', f:'Холст в плавающей раме (float frame)', d:'Масло — импрессионизм (мазки)', p:'Зимний пейзаж', q:1 },
    ],
  },
  {
    clientName: 'Тарасова Вероника Ильинична', phone: '+79853335252', email: 'tarasova.vi@mail.ru',
    status: 'in_progress', createdAt: '2026-04-05', deadline: '2026-07-05', issueDate: '',
    address: 'г. Тольятти, ул. 40 лет Победы, 2, кв. 85', note: 'Городской пейзаж — набережная Тольятти',
    prepayment: 5000,
    items: [{ s:'50×70 см', f:'Холст в раме (серебро, модерн)', d:'Акрил — яркая палитра', p:'Городской пейзаж', q:1 }],
  },
  {
    clientName: 'Белова Ксения Валентиновна', phone: '+79964446363', email: 'belova.kv@gmail.com',
    status: 'in_progress', createdAt: '2026-04-08', deadline: '2026-07-10', issueDate: '',
    address: 'г. Тольятти, ул. Баныкина, 11, кв. 17', note: 'Два детских портрета — сын и дочь',
    prepayment: 6000,
    items: [
      { s:'30×40 см', f:'Холст на подрамнике (сосна, стандарт)', d:'Гуашь — детский рисунок', p:'Детский портрет', q:1 },
      { s:'30×40 см', f:'Холст на подрамнике (сосна, стандарт)', d:'Гуашь — детский рисунок', p:'Детский портрет', q:1 },
    ],
  },
  {
    clientName: 'Григорьев Денис Олегович',   phone: '+79075557474', email: 'grigoriev.do@yandex.ru',
    status: 'in_progress', createdAt: '2026-04-10', deadline: '2026-07-15', issueDate: '',
    address: 'г. Тольятти, ул. Чайковского, 88, кв. 63', note: 'Крупный пейзаж — для кабинета руководителя',
    prepayment: 8000,
    items: [{ s:'70×100 см', f:'Холст в плавающей раме (float frame)', d:'Масло — классическая техника', p:'Пейзаж', q:1 }],
  },
  {
    clientName: 'Яковлева Алина Романовна',   phone: '+79186668585', email: 'yakovleva.ar@mail.ru',
    status: 'in_progress', createdAt: '2026-04-12', deadline: '2026-07-20', issueDate: '',
    address: 'г. Тольятти, ул. Мурысева, 56, кв. 39', note: 'Архитектурная акварель — старый Тольятти',
    prepayment: 4500,
    items: [{ s:'40×50 см', f:'Холст в раме (белая, скандинавский стиль)', d:'Акварель — с тушью', p:'Архитектура', q:1 }],
  },
  {
    clientName: 'Никитин Владислав Сергеевич', phone: '+79297779696', email: 'nikitin.vs@gmail.com',
    status: 'in_progress', createdAt: '2026-04-15', deadline: '2026-07-25', issueDate: '',
    address: 'г. Тольятти, ул. Горького, 41, кв. 22', note: 'Две картины с лошадьми для конного клуба',
    prepayment: 11000,
    items: [
      { s:'50×70 см', f:'Холст в раме (золото, классика)', d:'Масло — реализм (детальная прорисовка)', p:'Животные', q:1 },
      { s:'40×50 см', f:'Холст в раме (золото, классика)', d:'Масло — реализм (детальная прорисовка)', p:'Животные', q:1 },
    ],
  },
  {
    clientName: 'Степанова Дарья Михайловна', phone: '+79308880707', email: 'stepanova.dm@yandex.ru',
    status: 'in_progress', createdAt: '2026-04-18', deadline: '2026-07-30', issueDate: '',
    address: 'г. Тольятти, ул. Матросова, 19, кв. 4', note: 'Парный портрет с мужем — свадебный подарок от родителей',
    prepayment: 9500,
    items: [{ s:'60×80 см', f:'Холст в раме (золото, классика)', d:'Масло — портрет', p:'Парный портрет', q:1 }],
  },
  {
    clientName: 'Романов Александр Константинович', phone: '+79419991818', email: 'romanov.ak@mail.ru',
    status: 'in_progress', createdAt: '2026-04-20', deadline: '2026-08-01', issueDate: '',
    address: 'г. Тольятти, ул. Голосова, 32, кв. 8', note: 'Три пейзажа разного формата для галереи',
    prepayment: 9500,
    items: [
      { s:'30×40 см', f:'Холст на подрамнике (сосна, стандарт)', d:'Масло — классическая техника', p:'Пейзаж', q:1 },
      { s:'40×50 см', f:'Холст на подрамнике (сосна, стандарт)', d:'Масло — классическая техника', p:'Пейзаж', q:1 },
      { s:'50×70 см', f:'Холст на подрамнике (сосна, стандарт)', d:'Масло — классическая техника', p:'Пейзаж', q:1 },
    ],
  },
  {
    clientName: 'Матвеева Полина Аркадьевна', phone: '+79520002929', email: 'matveeva.pa@gmail.com',
    status: 'in_progress', createdAt: '2026-04-22', deadline: '2026-08-05', issueDate: '',
    address: 'г. Тольятти, ул. Воронежская, 7, кв. 90', note: 'Пейзаж в стиле Моне — сад с кувшинками',
    prepayment: 6000,
    items: [{ s:'40×50 см', f:'Холст в плавающей раме (float frame)', d:'Живопись в стиле Моне', p:'Пейзаж', q:1 }],
  },

  // ─── НОВЫЕ (8) ─────────────────────────────────────────────────────────────
  {
    clientName: 'Крылова Инна Викторовна',    phone: '+79631113838', email: 'krylova.iv@yandex.ru',
    status: 'new', createdAt: '2026-04-25', deadline: '2026-07-30', issueDate: '',
    address: 'г. Тольятти, ул. Куйбышева, 64, кв. 14', note: 'Зимний пейзаж для детской комнаты',
    prepayment: 0,
    items: [{ s:'30×40 см', f:'Холст на подрамнике (сосна, стандарт)', d:'Акварель — классическая (прозрачная)', p:'Зимний пейзаж', q:1 }],
  },
  {
    clientName: 'Борисов Станислав Юрьевич',  phone: '+79742223939', email: 'borisov.sy@mail.ru',
    status: 'new', createdAt: '2026-04-27', deadline: '2026-08-01', issueDate: '',
    address: 'г. Тольятти, ул. Нагорная, 28, кв. 57', note: 'Два городских пейзажа в стиле поп-арт для баров',
    prepayment: 0,
    items: [
      { s:'40×50 см', f:'Холст в раме (чёрная, лаконичная)', d:'Акрил — поп-арт стиль', p:'Городской пейзаж', q:1 },
      { s:'40×50 см', f:'Холст в раме (чёрная, лаконичная)', d:'Акрил — поп-арт стиль', p:'Городской пейзаж', q:1 },
    ],
  },
  {
    clientName: 'Зайцева Людмила Фёдоровна',  phone: '+79853334040', email: 'zaitseva.lf@gmail.com',
    status: 'new', createdAt: '2026-04-28', deadline: '2026-08-10', issueDate: '',
    address: 'г. Тольятти, ул. Дачная, 83, кв. 31', note: 'Архитектурный пейзаж — Самарская набережная',
    prepayment: 0,
    items: [{ s:'80×120 см', f:'Холст в раме (золото, классика)', d:'Масло — реализм (детальная прорисовка)', p:'Архитектура', q:1 }],
  },
  {
    clientName: 'Ершов Руслан Тимурович',     phone: '+79964445050', email: 'ershov.rt@yandex.ru',
    status: 'new', createdAt: '2026-04-30', deadline: '2026-08-15', issueDate: '',
    address: 'г. Тольятти, ул. Зеленовская, 16, кв. 68', note: 'Три портрета карандашом — для семейного архива',
    prepayment: 0,
    items: [
      { s:'20×30 см', f:'Без оформления (только работа)', d:'Карандаш — реализм', p:'Портрет', q:1 },
      { s:'20×30 см', f:'Без оформления (только работа)', d:'Карандаш — реализм', p:'Портрет', q:1 },
      { s:'20×30 см', f:'Без оформления (только работа)', d:'Карандаш — реализм', p:'Портрет', q:1 },
    ],
  },
  {
    clientName: 'Чернова Валерия Игоревна',   phone: '+79075556161', email: 'chernova.vi@mail.ru',
    status: 'new', createdAt: '2026-05-02', deadline: '2026-08-20', issueDate: '',
    address: 'г. Тольятти, ул. Фрунзе, 93, кв. 46', note: 'Портрет дочери 7 лет, масло',
    prepayment: 0,
    items: [{ s:'50×70 см', f:'Холст в раме (золото, классика)', d:'Масло — портрет', p:'Детский портрет', q:1 }],
  },
  {
    clientName: 'Комаров Евгений Павлович',   phone: '+79186667272', email: 'komarov.ep@gmail.com',
    status: 'new', createdAt: '2026-05-04', deadline: '2026-08-25', issueDate: '',
    address: 'г. Тольятти, ул. Юбилейная, 3, кв. 20', note: 'Лошади и животные — для загородного коттеджа',
    prepayment: 0,
    items: [
      { s:'40×60 см', f:'Холст в плавающей раме (float frame)', d:'Масло — классическая техника', p:'Животные', q:1 },
      { s:'40×60 см', f:'Холст в плавающей раме (float frame)', d:'Масло — классическая техника', p:'Лошади', q:1 },
    ],
  },
  {
    clientName: 'Горбунова Алёна Сергеевна',  phone: '+79297778383', email: 'gorbunova.as@yandex.ru',
    status: 'new', createdAt: '2026-05-06', deadline: '2026-09-01', issueDate: '',
    address: 'г. Тольятти, ул. Офицерская, 47, кв. 77', note: 'Морской импрессионизм для спальни',
    prepayment: 0,
    items: [{ s:'60×80 см', f:'Холст в плавающей раме (float frame)', d:'Масло — импрессионизм (мазки)', p:'Морской пейзаж', q:1 }],
  },
  {
    clientName: 'Дроздов Антон Леонидович',   phone: '+79408889494', email: 'drozdov.al@mail.ru',
    status: 'new', createdAt: '2026-05-08', deadline: '2026-09-10', issueDate: '',
    address: 'г. Тольятти, ул. Садовая, 61, кв. 13', note: 'Два абстрактных полотна в серебряных рамах',
    prepayment: 0,
    items: [
      { s:'40×50 см', f:'Холст в раме (серебро, модерн)', d:'Акрил — абстрактный экспрессионизм', p:'Абстракция', q:1 },
      { s:'50×70 см', f:'Холст в раме (серебро, модерн)', d:'Акрил — абстрактный экспрессионизм', p:'Абстракция', q:1 },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Логика расчёта
// ──────────────────────────────────────────────────────────────────────────────

function calcDiscount(totalQty) {
  if (totalQty >= 10) return { pct: 20, reason: 'Скидка за объём — 10+ картин' };
  if (totalQty >= 5)  return { pct: 15, reason: 'Скидка за объём — 5–9 картин' };
  if (totalQty >= 3)  return { pct: 10, reason: 'Скидка за объём — 3–4 картины' };
  if (totalQty >= 2)  return { pct:  5, reason: 'Скидка за объём — 2 картины' };
  return { pct: 0, reason: '' };
}

async function main() {
  // 1. Загружаем справочники
  console.log('📚 Загружаем справочники...');
  const [sizes, formats, designs, plots] = await Promise.all([
    prisma.size.findMany(),
    prisma.format.findMany(),
    prisma.design.findMany(),
    prisma.plot.findMany(),
  ]);

  if (!sizes.length) {
    console.error('❌ Справочники пусты — сначала запустите init-db.js');
    process.exit(1);
  }

  const sMap = Object.fromEntries(sizes.map(x => [x.size, x]));
  const fMap = Object.fromEntries(formats.map(x => [x.format, x]));
  const dMap = Object.fromEntries(designs.map(x => [x.design, x]));
  const pMap = Object.fromEntries(plots.map(x => [x.plot, x]));

  function priceUnit(s, f, d, p) {
    return sMap[s].price + fMap[f].priceExtra + dMap[d].priceExtra + pMap[p].priceExtra;
  }

  // 2. Удаляем все существующие заказы
  console.log('🗑  Удаляем старые заказы...');
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});

  // 3. Создаём 35 новых заказов
  console.log('✍️  Создаём 35 заказов...');
  const report = [];

  for (let i = 0; i < ORDERS.length; i++) {
    const od = ORDERS[i];
    const num = i + 1;

    // Расчёт цен
    const itemCalcs = od.items.map(it => {
      const pu = priceUnit(it.s, it.f, it.d, it.p);
      return { ...it, pu, subtotal: pu * it.q };
    });
    const grossTotal = itemCalcs.reduce((s, x) => s + x.subtotal, 0);
    const totalQty   = itemCalcs.reduce((s, x) => s + x.q, 0);
    const disc       = calcDiscount(totalQty);
    const totalPrice = Math.round(grossTotal * (1 - disc.pct / 100));

    // Комментарий = адрес + примечание
    const comments = [
      od.address ? `Адрес доставки: ${od.address}` : '',
      od.note    || '',
    ].filter(Boolean).join('\n\n');

    const order = await prisma.order.create({
      data: {
        clientName:      od.clientName,
        phone:           od.phone,
        email:           od.email,
        status:          od.status,
        createdAt:       new Date(od.createdAt),
        deadline:        od.deadline   || '',
        issueDate:       od.issueDate  || '',
        comments,
        totalPrice,
        prepayment:      od.prepayment || 0,
        discountPercent: disc.pct,
        discountReason:  disc.reason,
        surchargePercent: 0,
        surchargeReason:  '',
        photoPaths:      '[]',
        sizeId:   sMap[od.items[0].s].id,
        formatId: fMap[od.items[0].f].id,
        designId: dMap[od.items[0].d].id,
        plotId:   pMap[od.items[0].p].id,
      },
    });

    await prisma.orderItem.createMany({
      data: itemCalcs.map(it => ({
        orderId:  order.id,
        quantity: it.q,
        priceUnit: it.pu,
        amount:   it.subtotal,
        sizeId:   sMap[it.s].id,
        formatId: fMap[it.f].id,
        designId: dMap[it.d].id,
        plotId:   pMap[it.p].id,
      })),
    });

    const STATUS_RU = { new: 'Новый', in_progress: 'В работе', ready: 'Готов', delivered: 'Выполнен' };
    report.push({ num, id: order.id, od, itemCalcs, grossTotal, totalQty, disc, totalPrice });
    console.log(`  #${order.id} ${od.clientName} — ${totalPrice.toLocaleString('ru-RU')} ₽ [${STATUS_RU[od.status]}]`);
  }

  // 4. Генерируем текстовый отчёт
  const STATUS_RU = { new: 'Новый', in_progress: 'В работе', ready: 'Готов', delivered: 'Выполнен' };
  let txt = '='.repeat(78) + '\n';
  txt += '       КОНТРОЛЬНЫЙ ПРИМЕР: СПИСОК ЗАКАЗОВ — ArtStudio\n';
  txt += '='.repeat(78) + '\n\n';

  for (const r of report) {
    const od = r.od;
    txt += `─`.repeat(78) + '\n';
    txt += `Заказ № ${r.id}  |  ${r.od.clientName}\n`;
    txt += `Статус: ${STATUS_RU[od.status]}  |  Создан: ${od.createdAt}  |  Срок: ${od.deadline || '—'}\n`;
    if (od.issueDate) txt += `Дата выдачи: ${od.issueDate}\n`;
    txt += `Телефон: ${od.phone}  |  Email: ${od.email}\n`;
    txt += `Адрес: ${od.address || '—'}\n`;
    if (od.note) txt += `Примечание: ${od.note}\n`;
    txt += '\n  Состав заказа:\n';
    r.itemCalcs.forEach((it, i) => {
      txt += `  ${i + 1}. ${it.s} | ${it.f}\n`;
      txt += `     Техника: ${it.d}\n`;
      txt += `     Сюжет: ${it.p}\n`;
      txt += `     Кол-во: ${it.q} шт.  ×  ${it.pu.toLocaleString('ru-RU')} ₽  =  ${it.subtotal.toLocaleString('ru-RU')} ₽\n`;
    });
    if (r.grossTotal !== r.totalPrice) {
      txt += `\n  Итого без скидки: ${r.grossTotal.toLocaleString('ru-RU')} ₽\n`;
      txt += `  Скидка: ${r.disc.pct}% (${r.disc.reason})\n`;
    }
    txt += `  ИТОГО К ОПЛАТЕ: ${r.totalPrice.toLocaleString('ru-RU')} ₽\n`;
    if (od.prepayment) {
      txt += `  Аванс: ${od.prepayment.toLocaleString('ru-RU')} ₽  |  Остаток: ${(r.totalPrice - od.prepayment).toLocaleString('ru-RU')} ₽\n`;
    }
    txt += '\n';
  }

  txt += '='.repeat(78) + '\n';
  txt += `ИТОГО ЗАКАЗОВ: ${report.length}\n`;
  const delivered = report.filter(r => r.od.status === 'delivered');
  const ready     = report.filter(r => r.od.status === 'ready');
  const inProg    = report.filter(r => r.od.status === 'in_progress');
  const newO      = report.filter(r => r.od.status === 'new');
  txt += `  Выполнено:  ${delivered.length}  (${delivered.reduce((s,r)=>s+r.totalPrice,0).toLocaleString('ru-RU')} ₽)\n`;
  txt += `  Готово:     ${ready.length}  (${ready.reduce((s,r)=>s+r.totalPrice,0).toLocaleString('ru-RU')} ₽)\n`;
  txt += `  В работе:   ${inProg.length}  (${inProg.reduce((s,r)=>s+r.totalPrice,0).toLocaleString('ru-RU')} ₽)\n`;
  txt += `  Новые:      ${newO.length}  (${newO.reduce((s,r)=>s+r.totalPrice,0).toLocaleString('ru-RU')} ₽)\n`;
  txt += `  ОБЩАЯ СУММА: ${report.reduce((s,r)=>s+r.totalPrice,0).toLocaleString('ru-RU')} ₽\n`;
  txt += '='.repeat(78) + '\n';

  const outPath = path.resolve(__dirname, '../orders-report.txt');
  fs.writeFileSync(outPath, txt, 'utf8');
  console.log(`\n✅ Готово! 35 заказов созданы.`);
  console.log(`📄 Отчёт сохранён: ${outPath}`);
}

main()
  .catch(e => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
