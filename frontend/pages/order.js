import Head from 'next/head';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

/**
 * Вспомогательные функции для расчёта (твои оригинальные)
 */
function calcDeadlineSurcharge(deadline) {
  if (!deadline) return { percent: 0, reason: '', days: null };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(deadline);
  const diffTime = targetDate - today;
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (days < 0) return { percent: 0, reason: 'Дата в прошлом', days };
  if (days < 3) return { percent: 60, reason: 'Критическая срочность (до 3 дней)', days };
  if (days < 7) return { percent: 30, reason: 'Срочный заказ (до недели)', days };
  if (days < 14) return { percent: 15, reason: 'Ускоренное выполнение', days };
  if (days >= 30) return { percent: -5, reason: 'Скидка за ожидание (>30 дней)', days };
  return { percent: 0, reason: 'Стандартный срок', days };
}

function calcQuantityDiscount(qty) {
  const count = Number(qty);
  if (count >= 10) return { percent: 20, reason: 'Оптовая скидка (10+)' };
  if (count >= 5) return { percent: 15, reason: 'Скидка за объем (5-9)' };
  if (count >= 3) return { percent: 10, reason: 'Мини-опт (3-4)' };
  if (count >= 2) return { percent: 5, reason: 'Скидка за 2 картины' };
  return { percent: 0, reason: '' };
}

/**
 * Твои компоненты UI
 */
function PriceRow({ label, value, color = 'text-on-surface/60', bold = false, strike = false }) {
  return (
    <div className={`flex justify-between items-center py-1.5 ${bold ? 'border-t border-white/10 pt-4 mt-2' : ''}`}>
      <span className={`text-[13px] ${color} leading-tight max-w-[70%]`}>{label}</span>
      <span className={`text-sm font-${bold ? 'bold' : 'medium'} ${color} ${strike ? 'line-through opacity-50' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function Badge({ color, text }) {
  const colors = {
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    yellow: 'bg-secondary/10 text-secondary border-secondary/20',
    gray: 'bg-white/5 text-on-surface/40 border-white/10',
  };
  return (
    <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${colors[color] || colors.gray} uppercase tracking-wider`}>
      {text}
    </span>
  );
}

export default function OrderPage() {
  const { user, token } = useAuth();
  const API = process.env.NEXT_PUBLIC_API_URL;

  // 1. Справочники (Имена под новую БД из твоего prices.js)
  const [options, setOptions] = useState({
    sizes: [],
    formats: [],
    designs: [],
    plots: [],
    discounts: []
  });

  // 2. Состояние формы (Ключи соответствуют schema.prisma)
  const [form, setForm] = useState({
    clientName: '',
    phone: '',
    email: '',
    sizeId: '',
    formatId: '',
    designId: '',
    plotId: '',
    deadline: '',
    quantity: 1,
    comments: '',
    prepayment: 0
  });

  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [success, setSuccess] = useState(null);

  // 3. Состояния расчёта (Твоя детальная структура)
  const [prices, setPrices] = useState({
    base: 0,
    extras: 0,
    unit: 0,
    subtotal: 0,
    total: 0,
    discountSum: 0,
    surchargeSum: 0
  });

  const [info, setInfo] = useState({
    deadline: { percent: 0, reason: '' },
    quantity: { percent: 0, reason: '' }
  });

  // --- Эффекты ---

  // Загрузка справочников (используем твой эндпоинт /api/prices/options)
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch(`${API}/api/prices/options`);
        const data = await res.json();
        if (res.ok) {
          // Мапим твои названия из бэкенда на стейт фронта
          setOptions({
            sizes: data.canvasSizes || [],
            formats: data.designTypes || [], // В твоем старом коде форматы были designTypes
            designs: data.techniques || [],
            plots: data.subjects || [],
            discounts: data.discounts || []
          });
        }
      } catch (err) {
        console.error("Fetch options error:", err);
      } finally {
        setLoadingOptions(false);
      }
    }
    init();
  }, [API]);

  // Автозаполнение профиля
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        clientName: user.name || '',
        phone: user.phone || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  // Расчёт цены (Твоя логика, адаптированная под новую структуру)
  useEffect(() => {
    const s = options.sizes.find(x => x.id === Number(form.sizeId));
    const f = options.formats.find(x => x.id === Number(form.formatId));
    const d = options.designs.find(x => x.id === Number(form.designId));
    const p = options.plots.find(x => x.id === Number(form.plotId));

    if (!s) {
      setPrices(prev => ({ ...prev, total: 0 }));
      return;
    }

    // База из размера + Допы из остальных таблиц (как в твоей миграции)
    const basePrice = s.price;
    const extraPrice = (f?.priceExtra || 0) + (d?.priceExtra || 0) + (p?.priceExtra || 0);
    const unitPrice = basePrice + extraPrice;
    
    const qty = Number(form.quantity) || 1;
    const subtotal = unitPrice * qty;

    const dl = calcDeadlineSurcharge(form.deadline);
    const qd = calcQuantityDiscount(qty);

    // Наценки и скидки (твоя логика из старого кода)
    const surchargeAmt = dl.percent > 0 ? Math.round(subtotal * (dl.percent / 100)) : 0;
    const discountPct = qd.percent + (dl.percent < 0 ? Math.abs(dl.percent) : 0);
    const discountAmt = Math.round(subtotal * (discountPct / 100));

    const finalTotal = subtotal + surchargeAmt - discountAmt;

    setPrices({
      base: basePrice,
      extras: extraPrice,
      unit: unitPrice,
      subtotal,
      total: finalTotal,
      discountSum: discountAmt,
      surchargeSum: surchargeAmt
    });

    setInfo({ deadline: dl, quantity: qd });
    
    // Авто-аванс (30%)
    setForm(prev => ({ ...prev, prepayment: Math.round(finalTotal * 0.3) }));

  }, [form, options]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    let errs = {};
    if (!form.clientName) errs.clientName = "Введите имя";
    if (!form.phone) errs.phone = "Введите номер телефона";
    if (!form.sizeId) errs.sizeId = "Выберите размер холста";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const data = new FormData();
      // Поля заказа для Prisma (смотри схему Order)
      data.append('clientName', form.clientName);
      data.append('phone', form.phone);
      data.append('email', form.email);
      data.append('sizeId', form.sizeId);
      data.append('formatId', form.formatId);
      data.append('designId', form.designId);
      data.append('plotId', form.plotId);
      data.append('deadline', form.deadline);
      data.append('comments', form.comments);
      data.append('prepayment', form.prepayment);
      data.append('totalPrice', prices.total);
      
      // Поля для OrderItem (создается на бэкенде)
      data.append('quantity', form.quantity);

      files.forEach(file => data.append('photos', file));

      const res = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: data
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Не удалось оформить заказ");
      setSuccess(result);
    } catch (err) {
      setErrors({ _global: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="glass max-w-md w-full p-10 rounded-[40px] text-center animate-in fade-in zoom-in duration-500 shadow-2xl border border-white/5">
           <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 text-5xl">✓</div>
           <h2 className="text-4xl font-serif font-black mb-4 tracking-tight leading-tight text-on-surface">Заказ <br/>оформлен!</h2>
           <p className="opacity-50 mb-10 text-sm leading-relaxed">Номер вашего заказа: <span className="text-on-surface font-bold">#{success.id}</span>. <br/> Мы свяжемся с вами в течение 15 минут для подтверждения деталей.</p>
           <button onClick={() => window.location.href = '/'} className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-transform">На главную</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Заказать картину — ArtStudio</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Navbar />
      
      <div className="min-h-screen pt-32 pb-24 px-4 bg-surface selection:bg-primary/30 overflow-x-hidden">
        <div className="max-w-7xl mx-auto relative">
          
          {/* Декор */}
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/2 -left-60 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

          <header className="mb-20 relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-[1px] w-12 bg-primary/40" />
              <span className="text-primary font-bold tracking-[0.3em] uppercase text-[10px]">Artisan process</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-serif font-black tracking-tighter leading-[0.9] mb-8 text-on-surface">
              Ваша идея — <br/> <span className="text-primary">наше воплощение</span>
            </h1>
            <p className="max-w-2xl opacity-50 text-xl font-medium leading-relaxed">
              Выберите параметры полотна, загрузите фотографии и мы создадим уникальную картину вручную.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-16 items-start relative z-10">
            
            {/* ФОРМА: ЛЕВАЯ ЧАСТЬ */}
            <div className="lg:col-span-7 space-y-16">
              
              {/* Секция 1: Контакты */}
              <section className="space-y-8">
                <div className="flex items-center gap-6">
                  <span className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black shadow-inner">01</span>
                  <h2 className="text-3xl font-serif font-bold">Личные данные</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black opacity-30 ml-4 tracking-widest">Имя клиента</label>
                    <input 
                      type="text" 
                      placeholder="Как к вам обращаться?" 
                      className={`input-field ${errors.clientName ? 'border-red-500/40 bg-red-500/5' : ''}`}
                      value={form.clientName}
                      onChange={e => handleChange('clientName', e.target.value)}
                    />
                    {errors.clientName && <p className="text-[10px] text-red-400 font-bold ml-4">{errors.clientName}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black opacity-30 ml-4 tracking-widest">Телефон</label>
                    <input 
                      type="tel" 
                      placeholder="+7 (___) ___-__-__" 
                      className="input-field"
                      value={form.phone}
                      onChange={e => handleChange('phone', e.target.value)}
                    />
                  </div>
                </div>
              </section>

              {/* Секция 2: Параметры (Prisma Ids) */}
              <section className="space-y-8">
                <div className="flex items-center gap-6">
                  <span className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black shadow-inner">02</span>
                  <h2 className="text-3xl font-serif font-bold">Характеристики</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black opacity-30 ml-4 tracking-widest">Размер холста</label>
                    <select 
                      className={`input-field appearance-none ${errors.sizeId ? 'border-red-500/40' : ''}`}
                      value={form.sizeId} 
                      onChange={e => handleChange('sizeId', e.target.value)}
                    >
                      <option value="">Выберите размер</option>
                      {options.sizes.map(s => <option key={s.id} value={s.id}>{s.size}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black opacity-30 ml-4 tracking-widest">Техника живописи</label>
                    <select 
                      className="input-field appearance-none" 
                      value={form.designId} 
                      onChange={e => handleChange('designId', e.target.value)}
                    >
                      <option value="">Любая техника</option>
                      {options.designs.map(d => <option key={d.id} value={d.id}>{d.design}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black opacity-30 ml-4 tracking-widest">Сюжет / Жанр</label>
                    <select 
                      className="input-field appearance-none" 
                      value={form.plotId} 
                      onChange={e => handleChange('plotId', e.target.value)}
                    >
                      <option value="">Любой сюжет</option>
                      {options.plots.map(p => <option key={p.id} value={p.id}>{p.plot}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black opacity-30 ml-4 tracking-widest">Оформление</label>
                    <select 
                      className="input-field appearance-none" 
                      value={form.formatId} 
                      onChange={e => handleChange('formatId', e.target.value)}
                    >
                      <option value="">Стандарт (без рамы)</option>
                      {options.formats.map(f => <option key={f.id} value={f.id}>{f.format}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              {/* Секция 3: Загрузка файлов */}
              <section className="space-y-8">
                <div className="flex items-center gap-6">
                  <span className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black shadow-inner">03</span>
                  <h2 className="text-3xl font-serif font-bold">Фотографии</h2>
                </div>
                <div className="group relative border-2 border-dashed border-white/10 rounded-[40px] p-16 text-center hover:border-primary/40 transition-all cursor-pointer bg-white/[0.02] hover:bg-primary/[0.02]">
                  <input 
                    type="file" 
                    multiple 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                    onChange={e => setFiles(Array.from(e.target.files))}
                  />
                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-white/5 rounded-[24px] flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-primary/10 transition-all">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-bold">Загрузите референсы</p>
                      <p className="text-xs opacity-30 mt-1 uppercase tracking-widest">PNG, JPG или WEBP до 15MB</p>
                    </div>
                  </div>
                  {files.length > 0 && (
                    <div className="mt-10 flex flex-wrap justify-center gap-3">
                      {files.map((f, i) => (
                        <div key={i} className="px-4 py-2 bg-primary text-white text-[10px] font-black rounded-full shadow-lg shadow-primary/20 animate-in fade-in slide-in-from-bottom-2">
                          {f.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Секция 4: Сроки */}
              <section className="grid md:grid-cols-2 gap-12 pt-8">
                <div className="space-y-4">
                  <label className="text-sm font-bold opacity-80 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Крайний срок
                  </label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={form.deadline}
                    onChange={e => handleChange('deadline', e.target.value)}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-sm font-bold opacity-80 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Количество
                  </label>
                  <div className="flex items-center gap-6">
                    <button type="button" onClick={() => handleChange('quantity', Math.max(1, form.quantity - 1))} className="w-14 h-14 glass rounded-2xl border border-white/10 font-bold hover:bg-white/5 transition-colors">-</button>
                    <span className="text-3xl font-serif font-black w-10 text-center">{form.quantity}</span>
                    <button type="button" onClick={() => handleChange('quantity', form.quantity + 1)} className="w-14 h-14 glass rounded-2xl border border-white/10 font-bold hover:bg-white/5 transition-colors">+</button>
                  </div>
                </div>
              </section>

            </div>

            {/* ПРАВАЯ ЧАСТЬ: ИТОГОВЫЙ ЧЕК */}
            <aside className="lg:col-span-5">
              <div className="glass p-10 rounded-[50px] sticky top-32 border border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16" />
                
                <h3 className="text-[10px] uppercase tracking-[0.3em] font-black opacity-20 mb-10">Сводка заказа</h3>
                
                <div className="space-y-2 mb-10 relative z-10">
                  {!prices.total ? (
                    <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-[30px] bg-white/[0.01]">
                      <p className="text-xs opacity-20 font-medium italic">Ожидание выбора параметров...</p>
                    </div>
                  ) : (
                    <>
                      <PriceRow label="Базовое полотно" value={`${prices.base} ₽`} />
                      {prices.extras > 0 && <PriceRow label="Дополнительные опции" value={`+ ${prices.extras} ₽`} />}
                      <PriceRow label="Стоимость за единицу" value={`${prices.unit} ₽`} color="text-on-surface" bold />
                      
                      <div className="my-6 border-b border-white/5" />
                      
                      <PriceRow label="Сумма (без учёта сроков)" value={`${prices.subtotal} ₽`} />
                      
                      {prices.surchargeSum > 0 && (
                        <PriceRow 
                          label={info.deadline.reason} 
                          value={`+ ${prices.surchargeSum} ₽`} 
                          color="text-primary" 
                        />
                      )}
                      
                      {prices.discountSum > 0 && (
                        <PriceRow 
                          label={info.quantity.reason} 
                          value={`- ${prices.discountSum} ₽`} 
                          color="text-green-400" 
                        />
                      )}

                      <div className="pt-10 mt-6 border-t border-white/10">
                        <div className="flex justify-between items-end mb-6">
                          <div>
                            <p className="text-[10px] uppercase font-black opacity-30 mb-2 tracking-[0.1em]">Общий итог</p>
                            <p className="text-6xl font-serif font-black tracking-tighter text-secondary leading-none">{prices.total} ₽</p>
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex justify-between items-center">
                           <div className="space-y-1">
                             <p className="text-[10px] uppercase font-black opacity-30 tracking-widest">Авансовый платеж</p>
                             <p className="text-xl font-bold text-on-surface">{form.prepayment} ₽</p>
                           </div>
                           <Badge color="yellow" text="30%" />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-6 relative z-10">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black opacity-30 ml-4 tracking-widest">Комментарий</label>
                    <textarea 
                      placeholder="Опишите ваши пожелания..." 
                      className="input-field h-28 text-sm py-5 resize-none bg-white/[0.03]"
                      value={form.comments}
                      onChange={e => handleChange('comments', e.target.value)}
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={loading || !prices.total}
                    className="group relative w-full py-6 bg-primary text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 disabled:grayscale overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <span className="relative z-10">{loading ? 'Обработка...' : 'Подтвердить заказ'}</span>
                  </button>
                  
                  {errors._global && <p className="text-center text-[10px] text-red-400 font-black uppercase tracking-widest bg-red-500/10 py-3 rounded-lg">{errors._global}</p>}
                </div>

                <p className="mt-8 text-[9px] text-center opacity-20 leading-relaxed px-6 uppercase tracking-widest font-bold">
                  * Итоговая стоимость может быть скорректирована менеджером после оценки сложности фото.
                </p>
              </div>
            </aside>

          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}