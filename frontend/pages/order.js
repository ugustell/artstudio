import Head from 'next/head';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

// ─── Справочники ──────────────────────────────────────────────────────────────

const FORMATS = [
  'Холст на подрамнике (сосна, стандарт)',
  'Холст на подрамнике (бук, премиум)',
  'Холст на подрамнике (галерейный, 4 см)',
  'Холст без подрамника (в рулоне)',
  'Холст в деревянной раме (натуральный дуб)',
  'Холст в раме (чёрная, лаконичная)',
  'Холст в раме (золото, классика)',
  'Холст в раме (серебро, модерн)',
  'Холст в раме (белая, скандинавский стиль)',
  'Холст в плавающей раме (float frame)',
  'В багетной раме (широкий, классика)',
  'В багетной раме (узкий, модерн)',
  'В раме с паспарту (белое)',
  'В раме с паспарту (чёрное)',
  'Под стеклом в раме (для акварели/пастели)',
  'Под стеклом с паспарту (для графики)',
  'Без оформления (только работа)',
];

const DESIGNS = [
  'Масло — классическая техника',
  'Масло — импрессионизм (мазки)',
  'Масло — реализм (детальная прорисовка)',
  'Масло — абстракция',
  'Масло — пейзаж',
  'Масло — портрет',
  'Акварель — классическая (прозрачная)',
  'Акварель — ботаническая (детальная)',
  'Акварель — с тушью',
  'Акварель — городской пейзаж',
  'Акварель — портрет',
  'Акрил — яркая палитра',
  'Акрил — текстурная живопись (шпатель)',
  'Акрил — абстрактный экспрессионизм',
  'Акрил — поп-арт стиль',
  'Гуашь — книжная иллюстрация',
  'Гуашь — детский рисунок',
  'Гуашь — плакатный стиль',
  'Пастель — сухая пастель',
  'Пастель — масляная пастель',
  'Пастель — портрет',
  'Уголь — графика',
  'Уголь — портрет',
  'Карандаш — простой карандаш (реализм)',
  'Карандаш — цветные карандаши',
  'Смешанная техника — масло + уголь',
  'Смешанная техника — акварель + линер',
  'Смешанная техника — акрил + коллаж',
  'Живопись в стиле Ван Гога',
  'Живопись в стиле Моне',
  'Живопись в стиле Климта',
];

const MATERIALS = [
  'Хлопковый холст (стандарт)',
  'Льняной холст (профессиональный)',
  'Хлопок/лён смесь (универсальный)',
  'Холст грубой фактуры (для экспрессионизма)',
  'Бумага акварельная 300 г/м² (Fabriano)',
  'Бумага акварельная 640 г/м² (Arches, музейная)',
  'Бумага для пастели (бархатная)',
  'Бумага для пастели (цветная, тонированная)',
  'Бумага для графики (ватман)',
  'Картон грунтованный (для акрила/масла)',
  'Дерево (фанера грунтованная, для масла)',
];

// ─── Логика расчёта (дублирует backend) ──────────────────────────────────────
function calcDeadlineSurcharge(deadline) {
  if (!deadline) return { percent: 0, reason: '', days: null };
  const today = new Date(); today.setHours(0,0,0,0);
  const days  = Math.ceil((new Date(deadline) - today) / 86400000);
  if (days < 0)  return { percent: 0, reason: 'Выберите дату в будущем', days };
  if (days < 3)  return { percent: 60, reason: `Очень срочно — осталось ${days} дн.`, days };
  if (days < 7)  return { percent: 30, reason: `Срочный заказ — ${days} дн.`, days };
  if (days < 14) return { percent: 15, reason: `Ускоренный срок — ${days} дн.`, days };
  if (days >= 30) return { percent: -5, reason: `Скидка за длительный срок — ${days} дн.`, days };
  return { percent: 0, reason: `Стандартный срок — ${days} дн.`, days };
}

function calcQuantityDiscount(qty) {
  if (qty >= 10) return { percent: 20, reason: 'Скидка за объём — 10+ картин' };
  if (qty >= 5)  return { percent: 15, reason: 'Скидка за объём — 5–9 картин' };
  if (qty >= 3)  return { percent: 10, reason: 'Скидка за объём — 3–4 картины' };
  if (qty >= 2)  return { percent: 5,  reason: 'Скидка за объём — 2 картины' };
  return { percent: 0, reason: '' };
}

function calcComplexity(design) {
  const d = (design || '').toLowerCase();
  if (d.includes('ван гога') || d.includes('моне') || d.includes('климт'))
    return { percent: 30, reason: 'Авторский стиль (копия мастера)' };
  if (d.includes('портрет') || d.includes('реализм'))
    return { percent: 20, reason: 'Сложный сюжет (портрет / реализм)' };
  return { percent: 0, reason: '' };
}

// ─── Вспомогательные компоненты ───────────────────────────────────────────────

function PriceRow({ label, value, color = 'text-on-surface/60', bold = false }) {
  return (
    <div className={`flex justify-between items-center py-1 ${bold ? 'border-t border-white/10 pt-3 mt-1' : ''}`}>
      <span className={`text-sm ${color}`}>{label}</span>
      <span className={`text-sm font-${bold ? 'bold' : 'medium'} ${color}`}>{value}</span>
    </div>
  );
}

function Badge({ color, text }) {
  const map = {
    green:  'bg-green-500/15 text-green-400 border-green-500/30',
    red:    'bg-red-500/15 text-red-400 border-red-500/30',
    yellow: 'bg-secondary/15 text-secondary border-secondary/30',
    blue:   'bg-tertiary/15 text-tertiary border-tertiary/30',
    gray:   'bg-white/5 text-on-surface/40 border-white/10',
  };
  return (
    <span className={`inline-block text-xs px-3 py-1 rounded-full border ${map[color] || map.gray}`}>
      {text}
    </span>
  );
}

// ─── Главная страница формы ───────────────────────────────────────────────────

export default function OrderPage() {
  const { user, token } = useAuth();

  const [sizes, setSizes] = useState([]);
  const [loadingSizes, setLoadingSizes] = useState(true);

  const [form, setForm] = useState({
    clientName: '', phone: '', email: '',
    size: '', format: '', design: 'Масло — классическая техника',
    material: 'Хлопковый холст (стандарт)',
    deadline: '',
    quantity: 1,
    comments: '',
    prepayment: 0,
  });

  const [files, setFiles]     = useState([]);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  // Составные части цены
  const [basePrice,   setBasePrice]   = useState(0);
  const [frameExtra,  setFrameExtra]  = useState(0);
  const [deadlineInfo, setDeadlineInfo] = useState({ percent: 0, reason: '', days: null });
  const [quantityInfo, setQuantityInfo] = useState({ percent: 0, reason: '' });
  const [complexInfo,  setComplexInfo]  = useState({ percent: 0, reason: '' });
  const [totalPrice,  setTotalPrice]  = useState(0);
  const [breakdown,   setBreakdown]   = useState([]); // список строк для отображения

  // Загружаем прайс из БД
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/prices`)
      .then(r => r.json()).then(setSizes).catch(() => setSizes([]))
      .finally(() => setLoadingSizes(false));
  }, []);

  // Автозаполнение данных из профиля
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        clientName: user.name  || prev.clientName,
        phone:      user.phone || prev.phone,
        email:      user.email || prev.email,
      }));
    }
  }, [user]);

  // Пересчёт цены при любом изменении
  useEffect(() => {
    const sizeEntry = sizes.find(s => s.size === form.size);
    const base      = sizeEntry ? sizeEntry.price : 0;

    const frame = form.format.includes('раме') || form.format.includes('паспарту') || form.format.includes('float') ? 2500
                : form.format.includes('подрамнике') ? 800
                : form.format.includes('стеклом')    ? 1500 : 0;

    const dl  = calcDeadlineSurcharge(form.deadline);
    const qty = calcQuantityDiscount(Number(form.quantity) || 1);
    const cmp = calcComplexity(form.design);

    setBasePrice(base);
    setFrameExtra(frame);
    setDeadlineInfo(dl);
    setQuantityInfo(qty);
    setComplexInfo(cmp);

    const unitCost = base + frame;
    const n        = Number(form.quantity) || 1;

    // Общий % надбавки = max(deadline, complexity) если оба положительные
    const surchargePct = Math.max(
      dl.percent > 0  ? dl.percent  : 0,
      cmp.percent > 0 ? cmp.percent : 0,
    );
    // Общий % скидки = скидка за кол-во + скидка за длительный срок
    const deadlineDisc  = dl.percent < 0 ? Math.abs(dl.percent) : 0;
    const discountPct   = qty.percent + deadlineDisc;

    const total = Math.round(unitCost * n * (1 + surchargePct / 100) * (1 - discountPct / 100));
    setTotalPrice(total);
  }, [form.size, form.format, form.design, form.deadline, form.quantity, sizes]);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.clientName.trim()) e.clientName = 'Введите имя';
    if (!form.phone.trim())      e.phone      = 'Введите телефон';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Введите корректный email';
    if (!form.size)     e.size     = 'Выберите размер';
    if (!form.format)   e.format   = 'Выберите оформление';
    if (!form.deadline) e.deadline = 'Укажите желаемую дату готовности';
    if (!form.design)   e.design   = 'Выберите технику';
    // Дата не в прошлом
    if (form.deadline) {
      const today = new Date(); today.setHours(0,0,0,0);
      if (new Date(form.deadline) < today) e.deadline = 'Дата не может быть в прошлом';
    }
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
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, { method: 'POST', body: data, headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Ошибка сервера');
      setSuccess(json);
    } catch (err) {
      setErrors({ _global: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Минимальная дата = завтра
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // ─── Экран успеха ─────────────────────────────────────────────────────────
  if (success) return (
    <>
      <Head><title>Заказ принят — ArtStudio</title></Head>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
        <div className="glass p-12 rounded-xl text-center max-w-lg w-full animate-fade-up">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-8 text-4xl text-primary">✓</div>
          <h1 className="font-serif text-4xl font-bold text-on-surface mb-4">Заказ принят!</h1>
          <p className="text-on-surface/60 mb-2">Номер заказа: <span className="text-secondary font-bold">#{success.orderId}</span></p>
          <p className="text-on-surface/60 mb-4">
            Итоговая стоимость: <span className="text-primary font-bold text-2xl">{success.totalPrice?.toLocaleString('ru-RU')} ₽</span>
          </p>
          {success.prepayment > 0 && (
            <div className="bg-white/5 rounded-xl p-4 mb-4 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-on-surface/50">Аванс:</span>
                <span className="text-green-400 font-bold">{success.prepayment?.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface/50">Остаток при получении:</span>
                <span className="text-secondary font-bold">{success.remainder?.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
          )}
          {success.discountPercent > 0 && (
            <p className="text-green-400 text-sm mb-1">✓ Скидка {success.discountPercent}% — {success.discountReason}</p>
          )}
          {success.surchargePercent > 0 && (
            <p className="text-secondary text-sm mb-1">⚡ Надбавка {success.surchargePercent}% — {success.surchargeReason}</p>
          )}
          <p className="text-on-surface/40 text-sm mt-6 mb-10">
            В течение 24 часов пришлём предварительный эскиз на вашу почту для согласования.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button onClick={() => {
              setSuccess(null);
              setForm({ clientName:'',phone:'',email:'',size:'',format:'',design:'Масло — классическая техника',material:'Хлопковый холст (стандарт)',deadline:'',quantity:1,comments:'',prepayment:0 });
              setFiles([]);
            }} className="btn-outline">Новый заказ</button>
            <a href="/" className="btn-primary">На главную</a>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );

  const qty = Number(form.quantity) || 1;
  const unitBase = basePrice + frameExtra;

  return (
    <>
      <Head>
        <title>Сделать заказ — ArtStudio</title>
        <meta name="description" content="Закажите картину у профессионального художника. Масло, акварель, акрил. Любой размер и сюжет." />
      </Head>
      <Navbar />

      <div className="min-h-screen pt-28 pb-24 px-4 md:px-6">
        <div className="max-w-3xl mx-auto">

          {/* Заголовок */}
          <div className="mb-12 animate-fade-up">
            <div className="section-label">Оформление заказа</div>
            <h1 className="font-serif text-5xl font-black tracking-tight text-on-surface mt-2">Закажите свою картину</h1>
            <p className="text-on-surface/50 mt-4 text-lg">Опишите задачу — художник свяжется с вами в течение дня</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 animate-fade-up" style={{ animationDelay: '100ms' }}>

            {/* ── 1. Личные данные ─────────────────────────────────── */}
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

            {/* ── 2. Параметры картины ──────────────────────────────── */}
            <div className="glass p-8 rounded-xl">
              <h2 className="font-serif text-xl font-bold text-on-surface mb-6 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full border border-secondary/40 flex items-center justify-center text-xs text-secondary shrink-0">2</span>
                Параметры картины
              </h2>
              <div className="grid md:grid-cols-2 gap-6">

                {/* Размер */}
                <div>
                  <label className="text-xs text-on-surface/50 uppercase tracking-widest block mb-2">Размер *</label>
                  {loadingSizes ? (
                    <div className="text-on-surface/30 text-sm py-3 border-b border-on-surface/20">Загрузка...</div>
                  ) : (
                    <select value={form.size} onChange={e => set('size', e.target.value)}
                      className={`w-full bg-transparent border-b py-3 text-on-surface focus:outline-none transition-colors appearance-none cursor-pointer
                        ${errors.size ? 'border-red-400' : 'border-on-surface/20 focus:border-secondary'}`}>
                      <option value="" className="bg-surface-container">— выберите размер —</option>
                      {sizes.map(s => (
                        <option key={s.id} value={s.size} className="bg-surface-container">
                          {s.size} — от {s.price.toLocaleString('ru-RU')} ₽
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.size && <p className="text-red-400 text-xs mt-1">{errors.size}</p>}
                </div>

                {/* Оформление */}
                <div>
                  <label className="text-xs text-on-surface/50 uppercase tracking-widest block mb-2">Оформление *</label>
                  <select value={form.format} onChange={e => set('format', e.target.value)}
                    className={`w-full bg-transparent border-b py-3 text-on-surface focus:outline-none transition-colors appearance-none cursor-pointer
                      ${errors.format ? 'border-red-400' : 'border-on-surface/20 focus:border-secondary'}`}>
                    <option value="" className="bg-surface-container">— выберите оформление —</option>
                    {FORMATS.map(f => <option key={f} value={f} className="bg-surface-container">{f}</option>)}
                  </select>
                  {errors.format && <p className="text-red-400 text-xs mt-1">{errors.format}</p>}
                </div>

                {/* Техника */}
                <div className="md:col-span-2">
                  <label className="text-xs text-on-surface/50 uppercase tracking-widest block mb-2">Техника живописи *</label>
                  <select value={form.design} onChange={e => set('design', e.target.value)}
                    className={`w-full bg-transparent border-b py-3 text-on-surface focus:outline-none transition-colors appearance-none cursor-pointer
                      ${errors.design ? 'border-red-400' : 'border-on-surface/20 focus:border-secondary'}`}>
                    {DESIGNS.map(d => <option key={d} value={d} className="bg-surface-container">{d}</option>)}
                  </select>
                  {complexInfo.percent > 0 && (
                    <p className="text-secondary text-xs mt-2">⚡ {complexInfo.reason} (+{complexInfo.percent}%)</p>
                  )}
                </div>

                {/* Основа */}
                <div className="md:col-span-2">
                  <label className="text-xs text-on-surface/50 uppercase tracking-widest block mb-2">Основа для рисования</label>
                  <select value={form.material} onChange={e => set('material', e.target.value)}
                    className="w-full bg-transparent border-b border-on-surface/20 py-3 text-on-surface focus:outline-none focus:border-secondary transition-colors appearance-none cursor-pointer">
                    {MATERIALS.map(m => <option key={m} value={m} className="bg-surface-container">{m}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* ── 3. Дата и количество ─────────────────────────────── */}
            <div className="glass p-8 rounded-xl">
              <h2 className="font-serif text-xl font-bold text-on-surface mb-6 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full border border-tertiary/40 flex items-center justify-center text-xs text-tertiary shrink-0">3</span>
                Сроки и количество
              </h2>
              <div className="grid md:grid-cols-2 gap-6">

                {/* Желаемая дата */}
                <div>
                  <label className="text-xs text-on-surface/50 uppercase tracking-widest block mb-2">Желаемая дата готовности *</label>
                  <input type="date" value={form.deadline} min={minDate}
                    onChange={e => set('deadline', e.target.value)}
                    className={`w-full bg-transparent border-b py-3 text-on-surface focus:outline-none transition-colors cursor-pointer
                      ${errors.deadline ? 'border-red-400' : 'border-on-surface/20 focus:border-secondary'}`} />
                  {errors.deadline && <p className="text-red-400 text-xs mt-1">{errors.deadline}</p>}

                  {/* Подсказка по сроку */}
                  {form.deadline && deadlineInfo.days !== null && (
                    <div className="mt-2">
                      {deadlineInfo.percent > 0 && <Badge color="red"    text={`+${deadlineInfo.percent}% — ${deadlineInfo.reason}`} />}
                      {deadlineInfo.percent < 0 && <Badge color="green"  text={`−${Math.abs(deadlineInfo.percent)}% — ${deadlineInfo.reason}`} />}
                      {deadlineInfo.percent === 0 && deadlineInfo.days >= 0 && <Badge color="gray" text={deadlineInfo.reason} />}
                    </div>
                  )}

                  {/* Подсказки по срокам */}
                  <div className="mt-3 space-y-1 text-xs text-on-surface/30">
                    <div className="flex gap-2"><span className="text-green-400">●</span> 30+ дней — скидка 5%</div>
                    <div className="flex gap-2"><span className="text-on-surface/30">●</span> 14–29 дней — стандартный срок</div>
                    <div className="flex gap-2"><span className="text-secondary">●</span> 7–13 дней — надбавка 15%</div>
                    <div className="flex gap-2"><span className="text-primary">●</span> 3–6 дней — надбавка 30%</div>
                    <div className="flex gap-2"><span className="text-red-400">●</span> менее 3 дней — надбавка 60%</div>
                  </div>
                </div>

                {/* Количество */}
                <div>
                  <label className="text-xs text-on-surface/50 uppercase tracking-widest block mb-2">Количество картин</label>
                  <div className="flex items-center gap-4 border-b border-on-surface/20 pb-3">
                    <button type="button"
                      onClick={() => set('quantity', Math.max(1, qty - 1))}
                      className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-on-surface/60 hover:border-primary hover:text-primary transition-all text-xl">
                      −
                    </button>
                    <span className="text-on-surface text-2xl font-serif font-bold w-8 text-center">{qty}</span>
                    <button type="button"
                      onClick={() => set('quantity', qty + 1)}
                      className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-on-surface/60 hover:border-primary hover:text-primary transition-all text-xl">
                      +
                    </button>
                  </div>

                  {/* Скидки за количество */}
                  <div className="mt-3 space-y-1 text-xs text-on-surface/30">
                    <div className={`flex gap-2 ${qty >= 2  ? 'text-green-400' : ''}`}><span>●</span> 2 картины — скидка 5%</div>
                    <div className={`flex gap-2 ${qty >= 3  ? 'text-green-400' : ''}`}><span>●</span> 3–4 картины — скидка 10%</div>
                    <div className={`flex gap-2 ${qty >= 5  ? 'text-green-400' : ''}`}><span>●</span> 5–9 картин — скидка 15%</div>
                    <div className={`flex gap-2 ${qty >= 10 ? 'text-green-400' : ''}`}><span>●</span> 10+ картин — скидка 20%</div>
                  </div>
                  {quantityInfo.percent > 0 && (
                    <div className="mt-3">
                      <Badge color="green" text={`−${quantityInfo.percent}% — ${quantityInfo.reason}`} />
                    </div>
                  )}
                </div>
              </div>

              {/* Калькулятор цены */}
              {unitBase > 0 && (
                <div className="mt-8 bg-white/[0.03] rounded-xl p-6 border border-white/5">
                  <div className="text-xs text-on-surface/40 uppercase tracking-widest mb-4">Расчёт стоимости</div>
                  <div className="space-y-0.5">
                    <PriceRow label={`Базовая цена (${form.size})`} value={`${basePrice.toLocaleString('ru-RU')} ₽`} />
                    {frameExtra > 0 && (
                      <PriceRow label="Оформление" value={`+${frameExtra.toLocaleString('ru-RU')} ₽`} />
                    )}
                    {qty > 1 && (
                      <PriceRow label={`× ${qty} картин`} value={`${(unitBase * qty).toLocaleString('ru-RU')} ₽`} />
                    )}
                    {complexInfo.percent > 0 && (
                      <PriceRow label={`Надбавка: ${complexInfo.reason}`}
                        value={`+${complexInfo.percent}%`} color="text-secondary" />
                    )}
                    {deadlineInfo.percent > 0 && (
                      <PriceRow label={`Надбавка: ${deadlineInfo.reason}`}
                        value={`+${deadlineInfo.percent}%`} color="text-primary" />
                    )}
                    {quantityInfo.percent > 0 && (
                      <PriceRow label={`Скидка: ${quantityInfo.reason}`}
                        value={`−${quantityInfo.percent}%`} color="text-green-400" />
                    )}
                    {deadlineInfo.percent < 0 && (
                      <PriceRow label={`Скидка: ${deadlineInfo.reason}`}
                        value={`−${Math.abs(deadlineInfo.percent)}%`} color="text-green-400" />
                    )}
                  </div>
                  <div className="border-t border-white/10 mt-4 pt-4 flex items-center justify-between">
                    <span className="text-on-surface/60 text-sm">Итого</span>
                    <span className="text-secondary font-black text-3xl font-serif">{totalPrice.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <p className="text-on-surface/25 text-xs mt-2">* Окончательная цена согласовывается после обсуждения деталей</p>
                </div>
              )}
            </div>

            {/* ── 4. Исходное фото ──────────────────────────────────── */}
            <div className="glass p-8 rounded-xl">
              <h2 className="font-serif text-xl font-bold text-on-surface mb-2 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full border border-on-surface/20 flex items-center justify-center text-xs text-on-surface/40 shrink-0">4</span>
                Исходные материалы
              </h2>
              <p className="text-on-surface/40 text-sm mb-5">
                Загрузите фото, эскиз или референс — что художник должен использовать как основу
              </p>
              <label className="block cursor-pointer">
                <div className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300
                  ${files.length > 0 ? 'border-primary/50 bg-primary/5' : 'border-white/10 hover:border-primary/30 hover:bg-white/[0.02]'}`}>
                  {files.length > 0 ? (
                    <div>
                      <div className="text-primary text-3xl mb-3">✓</div>
                      <p className="text-on-surface font-medium">{files.length} {files.length === 1 ? 'файл' : 'файла'} выбрано</p>
                      <p className="text-on-surface/40 text-xs mt-1 break-all">{files.map(f => f.name).join(', ')}</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-on-surface/20 text-4xl mb-3">↑</div>
                      <p className="text-on-surface/60 font-medium">Нажмите или перетащите файлы</p>
                      <p className="text-on-surface/30 text-sm mt-2">JPG, PNG, PDF · до 5 файлов · до 20 МБ</p>
                    </div>
                  )}
                </div>
                <input type="file" multiple accept="image/*,.pdf" onChange={e => setFiles(Array.from(e.target.files).slice(0,5))} className="hidden" />
              </label>
              {files.length > 0 && (
                <button type="button" onClick={() => setFiles([])}
                  className="mt-2 text-xs text-on-surface/30 hover:text-red-400 transition-colors">
                  Очистить
                </button>
              )}
            </div>

            {/* ── 5. Аванс ─────────────────────────────────────────── */}
            {totalPrice > 0 && (
              <div className="glass p-8 rounded-xl">
                <h2 className="font-serif text-xl font-bold text-on-surface mb-6 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full border border-on-surface/20 flex items-center justify-center text-xs text-on-surface/40 shrink-0">5</span>
                  Аванс
                </h2>
                <p className="text-on-surface/40 text-sm mb-5">
                  Укажите сумму аванса (30–50% от стоимости). Остаток оплачивается при получении работы.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs text-on-surface/50 uppercase tracking-widest block mb-2">Сумма аванса (₽)</label>
                    <input type="number" min="0" max={totalPrice}
                      value={form.prepayment || ''}
                      onChange={e => set('prepayment', Math.min(Number(e.target.value) || 0, totalPrice))}
                      placeholder="0"
                      className="input-field" />
                  </div>
                  <div className="flex flex-col justify-center space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-on-surface/50">Итого к оплате:</span>
                      <span className="text-on-surface font-bold">{totalPrice.toLocaleString('ru-RU')} ₽</span>
                    </div>
                    <div className="flex justify-between text-green-400">
                      <span>Аванс:</span>
                      <span className="font-bold">− {Number(form.prepayment || 0).toLocaleString('ru-RU')} ₽</span>
                    </div>
                    <div className="flex justify-between border-t border-white/10 pt-2 mt-1">
                      <span className="text-on-surface/50">Остаток при получении:</span>
                      <span className="text-secondary font-bold">
                        {(totalPrice - Number(form.prepayment || 0)).toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-5 flex-wrap">
                  {[0.3, 0.4, 0.5].map(pct => (
                    <button key={pct} type="button"
                      onClick={() => set('prepayment', Math.round(totalPrice * pct))}
                      className="text-xs px-4 py-2 glass rounded-lg text-on-surface/50 hover:text-secondary hover:border-secondary/40 border border-transparent transition-all">
                      {Math.round(pct * 100)}% = {Math.round(totalPrice * pct).toLocaleString('ru-RU')} ₽
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── 6. Комментарий ───────────────────────────────────── */}
            <div className="glass p-8 rounded-xl">
              <h2 className="font-serif text-xl font-bold text-on-surface mb-6 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full border border-on-surface/10 flex items-center justify-center text-xs text-on-surface/30 shrink-0">6</span>
                Пожелания к картине
              </h2>
              <textarea value={form.comments} onChange={e => set('comments', e.target.value)} rows={5}
                placeholder="Опишите сюжет, настроение, цветовую гамму, детали которые важно передать. Чем подробнее — тем точнее результат."
                className="w-full bg-transparent border-b border-on-surface/20 py-3 text-on-surface placeholder-on-surface/30 focus:outline-none focus:border-secondary transition-colors resize-none text-sm" />
            </div>

            {errors._global && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
                ⚠ {errors._global}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center text-lg py-5 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Отправляем заказ...' : 'Отправить заявку →'}
            </button>

            <p className="text-center text-on-surface/25 text-xs">
              Нажимая кнопку, вы соглашаетесь на обработку персональных данных.
              После отправки мы пришлём эскиз на согласование в течение 24 часов.
            </p>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
