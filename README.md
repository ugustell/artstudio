# 🎨 ArtStudio — Сайт заказа картин на холсте

Полноценный веб-сайт для приёма и управления заказами картин на холсте.  
**Стек:** Next.js 14 + Node.js/Express + SQLite (Prisma ORM)

---

## 📁 Структура проекта

```
artstudio/
├── frontend/          ← Next.js (то, что видит пользователь)
│   ├── pages/
│   │   ├── index.js           — главная страница
│   │   ├── order.js           — форма заказа
│   │   ├── prices.js          — прайс-лист
│   │   ├── faq.js             — вопрос-ответ (аккордеон)
│   │   ├── certificates.js    — подарочные сертификаты
│   │   └── admin/
│   │       ├── login.js       — вход в панель
│   │       └── index.js       — панель управления заказами
│   └── components/
│       ├── Navbar.js
│       └── Footer.js
│
└── backend/           ← Node.js + Express (API сервер)
    ├── prisma/
    │   ├── schema.prisma      — схема базы данных
    │   └── seed.js            — начальное заполнение БД
    ├── routes/
    │   ├── orders.js          — CRUD заказов
    │   ├── prices.js          — управление прайсом
    │   └── admin.js           — авторизация
    ├── middleware/
    │   └── auth.js            — JWT проверка
    ├── uploads/               — загруженные фото (создаётся автоматически)
    ├── database.db            — файл SQLite (создаётся автоматически)
    └── index.js               — точка входа
```

---

## 🚀 Быстрый старт

### Шаг 1 — Backend

```bash
cd artstudio/backend

# Установить зависимости
npm install

# Создать базу данных и применить схему
npx prisma migrate dev --name init

# Заполнить базу тестовыми данными (40 заказов, прайс, админ)
node prisma/seed.js

# Запустить сервер
npm run dev
```

Сервер запустится на **http://localhost:4000**

### Шаг 2 — Frontend

```bash
cd artstudio/frontend

# Установить зависимости
npm install

# Запустить в режиме разработки
npm run dev
```

Сайт откроется на **http://localhost:3000**

---

## 🔐 Доступ в панель администратора

| Поле     | Значение    |
|----------|-------------|
| URL      | http://localhost:3000/admin/login |
| Логин    | `admin`     |
| Пароль   | `admin123`  |

> ⚠️ **Смените пароль перед деплоем на продакшн!**  
> Для смены пароля: в файле `backend/prisma/seed.js` измените строку `bcrypt.hash('admin123', 10)` на свой пароль, затем повторно запустите seed.

---

## ⚙️ Переменные окружения

### backend/.env
```
DATABASE_URL="file:./database.db"
JWT_SECRET="замените-на-случайную-строку-не-менее-32-символов"
PORT=4000
FRONTEND_URL="http://localhost:3000"
```

### frontend/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 📡 API эндпоинты

| Метод  | URL                    | Доступ | Описание                        |
|--------|------------------------|--------|---------------------------------|
| POST   | /api/orders            | Публ.  | Создать заказ (с загрузкой фото)|
| GET    | /api/orders            | Admin  | Список заказов (фильтры, пагин.)|
| GET    | /api/orders/:id        | Admin  | Детали заказа                   |
| PATCH  | /api/orders/:id        | Admin  | Изменить статус заказа          |
| DELETE | /api/orders/:id        | Admin  | Удалить заказ                   |
| GET    | /api/prices            | Публ.  | Получить прайс-лист             |
| PUT    | /api/prices/:id        | Admin  | Обновить цену                   |
| POST   | /api/prices            | Admin  | Добавить позицию в прайс        |
| DELETE | /api/prices/:id        | Admin  | Удалить позицию из прайса       |
| POST   | /api/admin/login       | Публ.  | Авторизация администратора      |
| GET    | /api/health            | Публ.  | Проверка работы сервера         |

---

## 🗄️ База данных

**Используется SQLite** — это один файл `backend/database.db`.  
Никакого отдельного сервера БД устанавливать не нужно.

Если в будущем нужно перейти на **PostgreSQL**:
1. Измените в `backend/prisma/schema.prisma` строку `provider = "sqlite"` на `provider = "postgresql"`
2. Обновите `DATABASE_URL` в `.env` на строку подключения PostgreSQL
3. Повторно запустите `npx prisma migrate dev`

### Таблицы

**orders** — заказы  
`id, created_at, client_name, phone, email, size, format, design, status, total_price, photo_paths, comments`

**prices** — прайс-лист  
`id, size, price`

**admins** — администраторы  
`id, login, password_hash`

### Статусы заказов
| Ключ         | Отображение |
|--------------|-------------|
| `new`        | Новый       |
| `in_progress`| В работе    |
| `ready`      | Готов       |
| `delivered`  | Доставлен   |

---

## 🌐 Страницы сайта

| URL                   | Описание                              |
|-----------------------|---------------------------------------|
| `/`                   | Главная: герой, о нас, преимущества, цены, доставка, отзывы, контакты |
| `/order`              | Форма заказа с загрузкой фото        |
| `/prices`             | Полный прайс-лист (данные из БД)     |
| `/faq`                | FAQ-аккордеон (16+ вопросов)         |
| `/certificates`       | Подарочные сертификаты               |
| `/admin/login`        | Вход в панель                        |
| `/admin`              | Панель: список заказов, фильтры, управление прайсом |

---

## 📦 Продакшн-деплой

### Backend на VPS
```bash
npm install -g pm2
cd backend
npm install
npx prisma migrate deploy
pm2 start index.js --name artstudio-api
```

### Frontend на Vercel / Netlify
```bash
cd frontend
npm run build
npm start
```
Или деплой напрямую через `vercel deploy`.

---

## 💡 Полезные команды Prisma

```bash
# Открыть визуальный редактор БД в браузере
npx prisma studio

# Применить новые изменения схемы
npx prisma migrate dev

# Сбросить БД и пересоздать
npx prisma migrate reset
```
