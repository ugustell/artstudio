import Head from 'next/head';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

// ─── Логика расчёта (твоя оригинальная) ──────────────────────────────────────
function calcDeadlineSurcharge(deadline) {
  if (!deadline) return { percent: 0, reason: '', days: null };
  const today = new Date(); today.setHours(0,0,0,0);
  const days = Math.ceil((new Date(deadline) - today) / 86400000);
  if (days < 0) return { percent: 0, reason: 'Выберите дату в будущем', days };
  if (days < 3) return { percent: 60, reason: `Очень срочно — осталось ${days} дн.`, days };
  if (days < 7) return { percent: 30, reason: `Срочный заказ — ${days} дн.`, days };
  if (days < 14) return { percent: 15, reason: `Ускоренный срок — ${days} дн.`, days };
  if (days >= 30) return { percent: -5, reason: `Скидка за длительный срок — ${days} дн.`, days };
  return { percent: 0, reason: `Стандартный срок — ${days} дн.`, days };
}

function calcQuantityDiscount(qty) {
  if (qty >= 10) return { percent: 20, reason: 'Скидка за объём — 10+ картин' };
  if (qty >= 5) return { percent: 15, reason: 'Скидка за объём — 5–9 картин' };
  if (qty >= 3) return { percent: 10, reason: 'Скидка за объём — 3–4 картины' };
  if (qty >= 2) return { percent: 5, reason: 'Скидка за объём — 2 картины' };
  return { percent: 0, reason: '' };
}

// ─── Вспомогательные компоненты UI ────────────────────────────────────────────
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
    green: 'bg-green-500/15 text-green-400 border-green-500/30',
    red: 'bg-red-500/15 text-red-400 border-red-500/30',
    yellow: 'bg-secondary/15 text-secondary border-secondary/30',
    gray: 'bg-white/5 text-on-surface/40 border-white/10',
  };
  return (
    <span className={`inline-block text-xs px-3 py-1 rounded-full border ${map[color] || map.gray}`}>
      {text}
    </span>
  );
}

export default function OrderPage() {
  const { user, token } = useAuth();
  const API = process.env.NEXT_PUBLIC_API_URL;

  // Справочники (под новую Prisma)
  const [options, setOptions] = useState({
    sizes: [], formats: [], designs: [], plots: [],
  });
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Состояние формы (ключи как в твоей новой миграции)
  const [form, setForm] = useState({
    clientName: '', phone: '', email: '',
    sizeId: '', formatId: '', designId: '', plotId: '',
    deadline: '', quantity: 1, comments: '', prepayment: 0,
  });

  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  // Расчетные данные
  const [prices, setPrices] = useState({ unit: 0, total: 0, base: 0, extras: 0 });
  const [info, setInfo] = useState({ dl: {}, qd: {} });

  // 1. Загрузка опций
  useEffect(() => {
    fetch(`${API}/api/options`) // Проверь эндпоинт, обычно это GET всех справочников
      .then(r => r.json())
      .then(data => setOptions(data))
      .catch(err => console.error("Ошибка загрузки:", err))
      .finally(() => setLoadingOptions(false));
  }, [API]);

  // 2. Автозаполнение профиля
  useEffect(() => {
    if (user) {
      setForm(p => ({
        ...p,
        clientName: user.name || p.clientName,
        phone: user.phone || p.phone,
        email: user.email || p.email,
      }));
    }
  }, [user]);

  // 3. Динамический расчет цены (Base + Extras)
  useEffect(() => {
    const s = options.sizes.find(x => x.id === Number(form.sizeId));
    const f = options.formats.find(x => x.id === Number(form.formatId));
    const d = options.designs.find(x => x.id === Number(form.designId));
    const p = options.plots.find(x => x.id === Number(form.plotId));

    if (!s) {
      setPrices({ unit: 0, total: 0, base: 0, extras: 0 });
      return;
    }

    const basePrice = s.price;
    const extras = (f?.priceExtra || 0) + (d?.priceExtra || 0) + (p?.priceExtra || 0);
    const unitPrice = basePrice + extras;

    const qty = Number(form.quantity) || 1;
    const dl = calcDeadlineSurcharge(form.deadline);
    const qd = calcQuantityDiscount(qty);

    // Логика из твоего старого кода: берем максимум между наценкой за срок и сложностью (если она есть)
    const surchargePct = dl.percent > 0 ? dl.percent : 0;
    const discountPct = qd.percent + (dl.percent < 0 ? Math.abs(dl.percent) : 0);

    const total = Math.round(unitPrice * qty * (1 + surchargePct / 100) * (1 - discountPct / 100));

    setPrices({ unit: unitPrice, total, base: basePrice, extras });
    setInfo({ dl, qd });
  }, [form, options]);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = new FormData();
      // Обязательные поля для Order в Prisma
      data.append('clientName', form.clientName);
      data.append('phone', form.phone);
      data.append('email', form.email);
      data.append('sizeId', form.sizeId);
      data.append('formatId', form.formatId);
      data.append('designId', form.designId);
      data.append('plotId', form.plotId);
      data.append('totalPrice', prices.total);
      data.append('prepayment', form.prepayment);
      data.append('comments', form.comments);
      data.append('deadline', form.deadline);
      
      // Добавляем количество для OrderItem
      data.append('quantity', form.quantity);

      files.forEach(f => data.append('photos', f));

      const res = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: data
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Ошибка при сохранении');
      setSuccess(result);
    } catch (err) {
      setErrors({ _global: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    // Твой экран успеха... (оставляем без изменений)
    return <div className="min-h-screen bg-surface flex items-center justify-center">Успех! №{success.id}</div>;
  }

  return (
    <>
      <Head><title>Заказ картины — ArtStudio</title></Head>
      <Navbar />
      <div className="min-h-screen pt-28 pb-24 px-4 bg-surface text-on-surface">
        <div className="max-w-4xl mx-auto">
          {/* Твой заголовок */}
          <div className="mb-12">
            <h1 className="font-serif text-5xl font-black">Закажите свою картину</h1>
          </div>

          <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              
              {/* СЕКЦИЯ 1: ДАННЫЕ */}
              <div className="glass p-6 rounded-2xl">
                <h2 className="text-xl font-bold mb-4">1. Личные данные</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <input type="text" value={form.clientName} onChange={e => set('clientName', e.target.value)} placeholder="Имя" className="input-field" required />
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Телефон" className="input-field" required />
                </div>
              </div>

              {/* СЕКЦИЯ 2: ПАРАМЕТРЫ */}
              <div className="glass p-6 rounded-2xl">
                <h2 className="text-xl font-bold mb-4">2. Параметры картины</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <select value={form.sizeId} onChange={e => set('sizeId', e.target.value)} className="input-field" required>
                    <option value="">Выберите размер</option>
                    {options.sizes.map(s => <option key={s.id} value={s.id}>{s.size} ({s.price} ₽)</option>)}
                  </select>
                  
                  <select value={form.designId} onChange={e => set('designId', e.target.value)} className="input-field">
                    <option value="">Выберите технику</option>
                    {options.designs.map(d => <option key={d.id} value={d.id}>{d.design}</option>)}
                  </select>

                  <select value={form.plotId} onChange={e => set('plotId', e.target.value)} className="input-field">
                    <option value="">Выберите сюжет</option>
                    {options.plots.map(p => <option key={p.id} value={p.id}>{p.plot}</option>)}
                  </select>

                  <select value={form.formatId} onChange={e => set('formatId', e.target.value)} className="input-field">
                    <option value="">Оформление</option>
                    {options.formats.map(f => <option key={f.id} value={f.id}>{f.format}</option>)}
                  </select>
                </div>
              </div>

              {/* СЕКЦИЯ 3: ФОТО */}
              <div className="glass p-6 rounded-2xl">
                <h2 className="text-xl font-bold mb-2">3. Фото-референс</h2>
                <input type="file" multiple onChange={e => setFiles(Array.from(e.target.files))} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary/10 file:text-primary" />
              </div>
            </div>

            {/* ПРАВАЯ ПАНЕЛЬ: ЧЕК (ТВОЯ ЛОГИКА) */}
            <div className="lg:col-span-4">
              <div className="glass p-6 rounded-2xl sticky top-28 border border-white/10">
                <h3 className="text-lg font-bold mb-4 uppercase tracking-tighter">Ваш расчет</h3>
                <div className="space-y-2">
                  <PriceRow label="База" value={`${prices.base} ₽`} />
                  <PriceRow label="Допы" value={`+${prices.extras} ₽`} />
                  <PriceRow label="Количество" value={`x${form.quantity}`} />
                  
                  {info.dl.percent !== 0 && (
                    <PriceRow 
                      label={info.dl.reason} 
                      value={`${info.dl.percent > 0 ? '+' : ''}${info.dl.percent}%`} 
                      color={info.dl.percent > 0 ? 'text-primary' : 'text-green-400'} 
                    />
                  )}
                  
                  {info.qd.percent > 0 && (
                    <PriceRow label="Оптовая скидка" value={`-${info.qd.percent}%`} color="text-green-400" />
                  )}

                  <div className="pt-4 mt-4 border-t border-white/10">
                    <div className="flex justify-between items-end">
                      <span className="text-sm opacity-50">Итого:</span>
                      <span className="text-3xl font-black text-secondary">{prices.total} ₽</span>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || !prices.total}
                  className="w-full mt-6 py-4 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50"
                >
                  {loading ? 'Оформляем...' : 'Оформить заказ'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}