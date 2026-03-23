import Head from 'next/head';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// ─── Полные списки из БД (те же что в seed.js) ────────────────────────────

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
  { label: 'Без дизайна',                          extra: 0,    desc: 'бесплатно'       },
  // Цветокоррекция
  { label: 'Цветокоррекция (базовая)',              extra: 200,  desc: '+200 ₽'          },
  { label: 'Цветокоррекция (профессиональная)',     extra: 400,  desc: '+400 ₽'          },
  { label: 'Улучшение резкости',                   extra: 200,  desc: '+200 ₽'          },
  { label: 'Осветление / затемнение',              extra: 200,  desc: '+200 ₽'          },
  { label: 'Тёплая тонировка',                     extra: 250,  desc: '+250 ₽'          },
  { label: 'Холодная тонировка',                   extra: 250,  desc: '+250 ₽'          },
  // Художественные стили
  { label: 'Художественная обработка (масло)',      extra: 500,  desc: '+500 ₽'          },
  { label: 'Художественная обработка (акварель)',   extra: 500,  desc: '+500 ₽'          },
  { label: 'Художественная обработка (гуашь)',      extra: 500,  desc: '+500 ₽'          },
  { label: 'Художественная обработка (пастель)',    extra: 500,  desc: '+500 ₽'          },
  { label: 'Карандашный рисунок (чёрно-белый)',     extra: 400,  desc: '+400 ₽'          },
  { label: 'Карандашный рисунок (цветной)',         extra: 450,  desc: '+450 ₽'          },
  { label: 'Чёрно-белая классика',                 extra: 150,  desc: '+150 ₽'          },
  { label: 'Сепия / Ретро',                        extra: 150,  desc: '+150 ₽'          },
  { label: 'Винтаж (выцветший)',                   extra: 200,  desc: '+200 ₽'          },
  { label: 'Дуотон (два цвета)',                   extra: 300,  desc: '+300 ₽'          },
  { label: 'Поп-арт (4 цвета)',                    extra: 400,  desc: '+400 ₽'          },
  { label: 'Поп-арт (Уорхол)',                     extra: 450,  desc: '+450 ₽'          },
  { label: 'Комикс / Графика',                     extra: 400,  desc: '+400 ₽'          },
  { label: 'Мозаика из фото',                      extra: 600,  desc: '+600 ₽'          },
  // Ретушь
  { label: 'Ретушь лица (базовая)',                extra: 300,  desc: '+300 ₽'          },
  { label: 'Ретушь лица (полная)',                 extra: 600,  desc: '+600 ₽'          },
  { label: 'Удаление фона',                        extra: 350,  desc: '+350 ₽'          },
  { label: 'Замена фона',                          extra: 500,  desc: '+500 ₽'          },
  { label: 'Удаление лишних объектов',             extra: 400,  desc: '+400 ₽'          },
  { label: 'Восстановление старого фото',          extra: 800,  desc: '+800 ₽'          },
  // Добавление элементов
  { label: 'Добавление текста / даты',             extra: 200,  desc: '+200 ₽'          },
  { label: 'Добавление рамки / бордюра',           extra: 150,  desc: '+150 ₽'          },
  { label: 'Коллаж из нескольких фото',            extra: 700,  desc: '+700 ₽'          },
  // Срочно
  { label: 'Срочная обработка (24 часа)',          extra: 700,  desc: '+700 ₽, срок 24ч'},
];

const MATERIALS = [
  { label: 'Хлопковый холст 300 г/м² (стандарт)',     extra: 0   },
  { label: 'Хлопковый холст 380 г/м² (усиленный)',    extra: 200 },
  { label: 'Льняной холст 300 г/м² (премиум)',        extra: 400 },
  { label: 'Льняной холст 420 г/м² (музейный)',       extra: 700 },
  { label: 'Холст с фактурой мазков (имитация)',      extra: 350 },
  { label: 'Хлопок/лён смесь 340 г/м²',              extra: 300 },
  { label: 'Матовая фотобумага 260 г/м²',             extra: 0   },
  { label: 'Глянцевая фотобумага 260 г/м²',          extra: 0   },
  { label: 'Шёлковая фотобумага 260 г/м²',           extra: 150 },
  { label: 'Матовая бумага Fine Art 310 г/м²',        extra: 300 },
  { label: 'Бумага Hahnemühle Photo Rag',             extra: 600 },
  { label: 'Бумага Canson Infinity (архивная)',        extra: 600 },
];

const COATINGS = [
  { label: 'Без покрытия',                      extra: 0   },
  { label: 'Матовый лак (стандарт)',             extra: 0   },
  { label: 'Глянцевый лак',                     extra: 0   },
  { label: 'Сатиновый лак (полуглянец)',         extra: 100 },
  { label: 'UV-защитный лак (архивный, 75 лет)',extra: 300 },
  { label: 'Антибликовое покрытие',             extra: 250 },
  { label: 'Водоотталкивающее покрытие',        extra: 200 },
  { label: 'Двойной лак (UV + матовый)',         extra: 400 },
];

// ─── Компонент Select ─────────────────────────────────────────────────────
function Select({ label, value, onChange, options, error, placeholder }) {
  return (
    <div>
      <label className="text-xs text-on-surface/50 uppercase tracking-widest block mb-2">
        {label} *
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full bg-surface-container border-b py-3 text-on-surface focus:outline-none transition-colors appearance-none cursor-pointer
          ${error ? 'border-red-400' : 'border-on-surface/20 focus:border-secondary'}`}
        style={{ background: 'transparent' }}
      >
        <option value="" className="bg-surface-container">{placeholder || `— выберите ${label.toLowerCase()} —`}</option>
        {options.map(opt => (
          <option key={typeof opt === 'string' ? opt : opt.label}
            value={typeof opt === 'string' ? opt : opt.label}
            className="bg-surface-container">
            {typeof opt === 'string' ? opt : `${opt.label}${opt.extra ? ` (+${opt.extra} ₽)` : ''}`}
          </option>
        ))}
      </select>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

// ─── Главный компонент ────────────────────────────────────────────────────
export default function OrderPage() {
  const [sizes, setSizes] = useState([]);
  const [loadingSizes, setLoadingSizes] = useState(true);

  const [form, setForm] = useState({
    clientName: '', phone: '', email: '',
    size: '', format: '', design: 'Без дизайна',
    material: 'Хлопковый холст 300 г/м² (стандарт)',
    coating: 'Без покрытия',
    comments: '',
  });
  const [files, setFiles]   = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);

  // Загружаем размеры из БД
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/prices`)
      .then(r => r.json())
      .then(data => setSizes(data))
      .catch(() => setSizes([]))
      .finally(() => setLoadingSizes(false));
  }, []);

  // Считаем цену при изменении полей
  useEffect(() => {
    if (!form.size) { setTotalPrice(0); return; }
    const sizeEntry   = sizes.find(s => s.size === form.size);
    const base        = sizeEntry ? sizeEntry.price : 0;
    const designEntry = DESIGNS.find(d => d.label === form.design);
    const matEntry    = MATERIALS.find(m => m.label === form.material);
    const coatEntry   = COATINGS.find(c => c.label === form.coating);
    const frameExtra  = form.format.includes('раме') || form.format.includes('паспарту') || form.format.includes('float') ? 800
                      : form.format.includes('Модульная') ? 1200
                      : form.format.includes('подрамнике') ? 500 : 0;
    setTotalPrice(
      base +
      (designEntry?.extra || 0) +
      (matEntry?.extra || 0) +
      (coatEntry?.extra || 0) +
      frameExtra
    );
  }, [form.size, form.format, form.design, form.material, form.coating, sizes]);

  const set = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => ({ ...prev, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.clientName.trim()) e.clientName = 'Введите имя';
    if (!form.phone.trim())      e.phone      = 'Введите телефон';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Введите корректный email';
    if (!form.size)   e.size   = 'Выберите размер';
    if (!form.format) e.format = 'Выберите оформление';
    if (!form.design) e.design = 'Выберите тип обработки';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      files.forEach(f => data.append('photos', f));
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, { method: 'POST', body: data });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Ошибка');
      setSuccess(json);
    } catch (err) {
      setErrors({ _global: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ─── Экран успеха ─────────────────────────────────────────────────────
  if (success) return (
    <>
      <Head><title>Заказ принят — ArtStudio</title></Head>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
        <div className="glass p-12 rounded-xl text-center max-w-lg w-full animate-fade-up">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-8 text-4xl text-primary">✓</div>
          <h1 className="font-serif text-4xl font-bold text-on-surface mb-4">Заказ принят!</h1>
          <p className="text-on-surface/60 mb-2">Номер заказа: <span className="text-secondary font-bold">#{success.orderId}</span></p>
          <p className="text-on-surface/60 mb-8">Итоговая стоимость: <span className="text-primary font-bold text-xl">{success.totalPrice?.toLocaleString('ru-RU')} ₽</span></p>
          <p className="text-on-surface/40 text-sm mb-10">Мы свяжемся с вами в течение 1 рабочего дня для подтверждения.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button onClick={() => { setSuccess(null); setForm({ clientName:'',phone:'',email:'',size:'',format:'',design:'Без дизайна',material:'Хлопковый холст 300 г/м² (стандарт)',coating:'Без покрытия',comments:'' }); setFiles([]); }}
              className="btn-outline">Новый заказ</button>
            <a href="/" className="btn-primary">На главную</a>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );

  // ─── Форма ────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Сделать заказ — ArtStudio</title>
        <meta name="description" content="Оформите заказ на картину на холсте. Загрузите фото, выберите размер и оформление." />
      </Head>
      <Navbar />

      <div className="min-h-screen pt-28 pb-24 px-4 md:px-6">
        <div className="max-w-3xl mx-auto">

          {/* Заголовок */}
          <div className="mb-12 animate-fade-up">
            <div className="section-label">Оформление заказа</div>
            <h1 className="font-serif text-5xl font-black tracking-tight text-on-surface mt-2">Создайте свою картину</h1>
            <p className="text-on-surface/50 mt-4 text-lg">Заполните форму — мы свяжемся с вами в течение дня</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 animate-fade-up" style={{ animationDelay: '100ms' }}>

            {/* 1 — Личные данные */}
            <div className="glass p-8 rounded-xl">
              <h2 className="font-serif text-xl font-bold text-on-surface mb-6 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full border border-primary/40 flex items-center justify-center text-xs text-primary shrink-0">1</span>
                Личные данные
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs text-on-surface/50 uppercase tracking-widest block mb-2">Имя и фамилия *</label>
                  <input type="text" value={form.clientName} onChange={e => set('clientName', e.target.value)}
                    placeholder="Иванова Марина" className="input-field" />
                  {errors.clientName && <p className="text-red-400 text-xs mt-1">{errors.clientName}</p>}
                </div>
                <div>
                  <label className="text-xs text-on-surface/50 uppercase tracking-widest block mb-2">Телефон *</label>
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                    placeholder="+7 900 000-00-00" className="input-field" />
                  {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-on-surface/50 uppercase tracking-widest block mb-2">Email *</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="you@example.com" className="input-field" />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>
              </div>
            </div>

            {/* 2 — Параметры картины */}
            <div className="glass p-8 rounded-xl">
              <h2 className="font-serif text-xl font-bold text-on-surface mb-6 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full border border-secondary/40 flex items-center justify-center text-xs text-secondary shrink-0">2</span>
                Параметры картины
              </h2>
              <div className="grid md:grid-cols-2 gap-6">

                {/* Размер — из БД */}
                <div>
                  <label className="text-xs text-on-surface/50 uppercase tracking-widest block mb-2">Размер *</label>
                  {loadingSizes ? (
                    <div className="text-on-surface/30 text-sm py-3 border-b border-on-surface/20">Загрузка размеров...</div>
                  ) : (
                    <select value={form.size} onChange={e => set('size', e.target.value)}
                      className={`w-full bg-transparent border-b py-3 text-on-surface focus:outline-none transition-colors appearance-none cursor-pointer
                        ${errors.size ? 'border-red-400' : 'border-on-surface/20 focus:border-secondary'}`}>
                      <option value="" className="bg-surface-container">— выберите размер —</option>
                      {sizes.map(s => (
                        <option key={s.id} value={s.size} className="bg-surface-container">
                          {s.size} — {s.price.toLocaleString('ru-RU')} ₽
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.size && <p className="text-red-400 text-xs mt-1">{errors.size}</p>}
                </div>

                {/* Оформление */}
                <Select label="Оформление" value={form.format} onChange={v => set('format', v)}
                  options={FORMATS} error={errors.format} />

                {/* Техника дизайна */}
                <div className="md:col-span-2">
                  <Select label="Тип обработки" value={form.design} onChange={v => set('design', v)}
                    options={DESIGNS} error={errors.design} />
                </div>

                {/* Материал */}
                <Select label="Материал" value={form.material} onChange={v => set('material', v)}
                  options={MATERIALS} error={errors.material} />

                {/* Покрытие */}
                <Select label="Покрытие" value={form.coating} onChange={v => set('coating', v)}
                  options={COATINGS} error={errors.coating} />
              </div>

              {/* Итог цены */}
              {totalPrice > 0 && (
                <div className="mt-6 p-4 bg-secondary/10 border border-secondary/30 rounded-lg flex items-center justify-between">
                  <span className="text-on-surface/70 text-sm">Предварительная стоимость:</span>
                  <span className="text-secondary font-bold text-2xl font-serif">{totalPrice.toLocaleString('ru-RU')} ₽</span>
                </div>
              )}
            </div>

            {/* 3 — Фото */}
            <div className="glass p-8 rounded-xl">
              <h2 className="font-serif text-xl font-bold text-on-surface mb-6 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full border border-tertiary/40 flex items-center justify-center text-xs text-tertiary shrink-0">3</span>
                Исходное фото
              </h2>
              <label className="block cursor-pointer">
                <div className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300
                  ${files.length > 0 ? 'border-primary/50 bg-primary/5' : 'border-white/10 hover:border-primary/30 hover:bg-white/[0.02]'}`}>
                  {files.length > 0 ? (
                    <div>
                      <div className="text-primary text-3xl mb-3">✓</div>
                      <p className="text-on-surface font-medium">{files.length} {files.length === 1 ? 'файл выбран' : 'файла выбрано'}</p>
                      <p className="text-on-surface/40 text-xs mt-1 break-all">{files.map(f => f.name).join(', ')}</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-on-surface/20 text-4xl mb-3">↑</div>
                      <p className="text-on-surface/60 font-medium">Перетащите файлы или нажмите для выбора</p>
                      <p className="text-on-surface/30 text-sm mt-2">JPEG, PNG, TIFF · до 5 файлов · до 20 МБ каждый</p>
                    </div>
                  )}
                </div>
                <input type="file" multiple accept="image/*" onChange={e => setFiles(Array.from(e.target.files).slice(0,5))} className="hidden" />
              </label>
              <p className="text-on-surface/30 text-xs mt-3">
                💡 Рекомендуем фото не менее 2000×2000 пикселей для качественной печати
              </p>
            </div>

            {/* 4 — Комментарий */}
            <div className="glass p-8 rounded-xl">
              <h2 className="font-serif text-xl font-bold text-on-surface mb-6 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full border border-on-surface/20 flex items-center justify-center text-xs text-on-surface/40 shrink-0">4</span>
                Комментарий
              </h2>
              <textarea value={form.comments} onChange={e => set('comments', e.target.value)} rows={4}
                placeholder="Особые пожелания: цвет, яркость, обрезка, текст на картине, срок и т.д."
                className="w-full bg-transparent border-b border-on-surface/20 py-3 text-on-surface placeholder-on-surface/30 focus:outline-none focus:border-secondary transition-colors resize-none" />
            </div>

            {errors._global && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
                {errors._global}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center text-lg py-5 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Отправляем заказ...' : 'Оформить заказ →'}
            </button>

            <p className="text-center text-on-surface/30 text-xs">
              Нажимая кнопку, вы соглашаетесь с условиями обработки персональных данных
            </p>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
