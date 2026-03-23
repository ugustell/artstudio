import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const FORMATS = ['Холст на подрамнике', 'В раме', 'Без оформления', 'Модульная картина'];
const DESIGNS = ['Без дизайна', 'С дизайном', 'Срочная обработка'];

export default function OrderPage() {
  const [prices, setPrices]   = useState([]);
  const [form, setForm]       = useState({
    clientName: '', phone: '', email: '',
    size: '', format: '', design: '', comments: '',
  });
  const [files, setFiles]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null); // { orderId, totalPrice }
  const [error, setError]     = useState('');
  const [preview, setPreview] = useState([]);

  useEffect(() => {
    axios.get(`${API}/api/prices`).then(r => setPrices(r.data)).catch(() => {});
  }, []);

  // Превью фото
  useEffect(() => {
    const urls = files.map(f => URL.createObjectURL(f));
    setPreview(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [files]);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFiles = e => {
    const picked = Array.from(e.target.files).slice(0, 5);
    setFiles(picked);
  };

  const removeFile = i => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const calcExtra = () => {
    const d = form.design === 'С дизайном' ? 300 : form.design === 'Срочная обработка' ? 700 : 0;
    const f = form.format === 'В раме' ? 500 : form.format === 'Модульная картина' ? 800 : 0;
    return d + f;
  };

  const basePrice = () => {
    const p = prices.find(p => p.size === form.size);
    return p ? p.price : 0;
  };

  const totalPrice = () => basePrice() + calcExtra();

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    const required = ['clientName', 'phone', 'email', 'size', 'format', 'design'];
    for (const k of required) {
      if (!form[k]) { setError('Пожалуйста, заполните все обязательные поля.'); return; }
    }

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach(f => fd.append('photos', f));

      const res = await axios.post(`${API}/api/orders`, fd);
      setSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при отправке заказа. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-surface px-6 pt-20">
          <div className="max-w-lg w-full text-center">
            <div className="text-7xl mb-8">🎉</div>
            <h1 className="font-serif text-4xl font-bold text-on-surface mb-4">Заказ принят!</h1>
            <p className="text-on-surface/60 mb-2">
              Номер вашего заказа: <span className="text-secondary font-bold">#{success.orderId}</span>
            </p>
            <p className="text-on-surface/60 mb-8">
              Итоговая стоимость: <span className="text-primary font-bold">{success.totalPrice?.toLocaleString('ru-RU')} ₽</span>
            </p>
            <div className="glass rounded p-6 mb-8 text-sm text-on-surface/50 leading-relaxed">
              Мы свяжемся с вами в течение 1 рабочего дня для подтверждения заказа и отправки предварительного макета.
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/" className="btn-outline">На главную</Link>
              <button onClick={() => setSuccess(null)} className="btn-primary">Новый заказ</button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Сделать заказ — ArtStudio</title>
        <meta name="description" content="Оформите заказ на картину на холсте. Загрузите фото, выберите размер и оформление." />
      </Head>
      <Navbar />

      <div className="min-h-screen bg-surface pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-6 md:px-12">

          {/* Заголовок */}
          <div className="mb-14 animate-fade-up">
            <div className="section-label">Оформление заказа</div>
            <h1 className="font-serif text-5xl font-bold tracking-tight text-on-surface">
              Создайте свою картину
            </h1>
            <p className="text-on-surface/50 mt-4 max-w-xl">
              Заполните форму ниже — мы свяжемся с вами в течение дня и пришлём предварительный макет перед печатью.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-8">

            {/* ── Левая колонка: данные клиента + параметры ── */}
            <div className="md:col-span-2 space-y-10">

              {/* Контактные данные */}
              <div className="glass rounded p-8">
                <h2 className="font-serif text-xl font-bold text-on-surface mb-6">Контактные данные</h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="section-label text-[10px]">Ваше имя *</label>
                    <input name="clientName" value={form.clientName} onChange={handleChange}
                      className="input-field" placeholder="Иванова Мария" />
                  </div>
                  <div>
                    <label className="section-label text-[10px]">Телефон *</label>
                    <input name="phone" value={form.phone} onChange={handleChange}
                      className="input-field" placeholder="+7 900 000-00-00" type="tel" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="section-label text-[10px]">Email *</label>
                    <input name="email" value={form.email} onChange={handleChange}
                      className="input-field" placeholder="example@mail.ru" type="email" />
                  </div>
                </div>
              </div>

              {/* Параметры картины */}
              <div className="glass rounded p-8">
                <h2 className="font-serif text-xl font-bold text-on-surface mb-6">Параметры картины</h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="section-label text-[10px]">Размер *</label>
                    <select name="size" value={form.size} onChange={handleChange}
                      className="input-field bg-transparent appearance-none cursor-pointer">
                      <option value="">— выберите размер —</option>
                      {prices.map(p => (
                        <option key={p.id} value={p.size} className="bg-surface-container">
                          {p.size} — {p.price.toLocaleString('ru-RU')} ₽
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="section-label text-[10px]">Оформление *</label>
                    <select name="format" value={form.format} onChange={handleChange}
                      className="input-field bg-transparent appearance-none cursor-pointer">
                      <option value="">— выберите оформление —</option>
                      {FORMATS.map(f => (
                        <option key={f} value={f} className="bg-surface-container">{f}
                          {f === 'В раме' ? ' (+500 ₽)' : f === 'Модульная картина' ? ' (+800 ₽)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="section-label text-[10px]">Тип обработки *</label>
                    <div className="grid sm:grid-cols-3 gap-3 mt-2">
                      {DESIGNS.map(d => (
                        <label key={d} className={`cursor-pointer glass rounded p-4 text-center transition-all duration-200 border ${
                          form.design === d ? 'border-primary/60 bg-primary/10' : 'border-transparent hover:border-white/20'
                        }`}>
                          <input type="radio" name="design" value={d}
                            checked={form.design === d} onChange={handleChange} className="sr-only" />
                          <div className="text-sm font-semibold text-on-surface">{d}</div>
                          <div className="text-xs text-on-surface/40 mt-1">
                            {d === 'С дизайном' ? '+300 ₽' : d === 'Срочная обработка' ? '+700 ₽' : 'бесплатно'}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Загрузка фото */}
              <div className="glass rounded p-8">
                <h2 className="font-serif text-xl font-bold text-on-surface mb-2">Фотографии</h2>
                <p className="text-on-surface/40 text-sm mb-6">До 5 файлов, не более 20 МБ каждый. Форматы: JPG, PNG, WEBP.</p>

                <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/20
                                   rounded p-10 cursor-pointer hover:border-primary/50 transition-colors group">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📁</div>
                  <div className="text-on-surface/60 text-sm">Нажмите или перетащите файлы сюда</div>
                  <div className="text-on-surface/30 text-xs mt-1">PNG, JPG, WEBP • до 20 МБ</div>
                  <input type="file" multiple accept="image/*" onChange={handleFiles} className="hidden" />
                </label>

                {preview.length > 0 && (
                  <div className="grid grid-cols-5 gap-3 mt-4">
                    {preview.map((url, i) => (
                      <div key={i} className="relative group aspect-square">
                        <img src={url} alt="" className="w-full h-full object-cover rounded" />
                        <button type="button" onClick={() => removeFile(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 text-white rounded-full text-xs
                                     opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Комментарий */}
              <div className="glass rounded p-8">
                <h2 className="font-serif text-xl font-bold text-on-surface mb-6">Комментарий</h2>
                <textarea name="comments" value={form.comments} onChange={handleChange} rows={4}
                  className="input-field resize-none"
                  placeholder="Особые пожелания: цветовая гамма, акценты, надписи на картине..." />
              </div>
            </div>

            {/* ── Правая колонка: итог ── */}
            <div className="space-y-6">
              <div className="glass rounded p-8 sticky top-28">
                <h2 className="font-serif text-xl font-bold text-on-surface mb-6">Итог</h2>

                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between">
                    <span className="text-on-surface/50">Размер:</span>
                    <span className="text-on-surface">{form.size || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface/50">Базовая цена:</span>
                    <span className="text-on-surface">{basePrice() ? basePrice().toLocaleString('ru-RU') + ' ₽' : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface/50">Оформление:</span>
                    <span className="text-on-surface">{form.format || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface/50">Обработка:</span>
                    <span className="text-on-surface">{form.design || '—'}</span>
                  </div>
                  {calcExtra() > 0 && (
                    <div className="flex justify-between">
                      <span className="text-on-surface/50">Доп. услуги:</span>
                      <span className="text-secondary">+{calcExtra().toLocaleString('ru-RU')} ₽</span>
                    </div>
                  )}
                  <div className="border-t border-white/10 pt-3 flex justify-between font-bold">
                    <span className="text-on-surface">Итого:</span>
                    <span className="text-primary text-lg">{totalPrice() ? totalPrice().toLocaleString('ru-RU') + ' ₽' : '—'}</span>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded p-3 mb-4">
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? (
                    <><span className="animate-spin mr-2">⏳</span>Отправляем...</>
                  ) : 'Отправить заказ'}
                </button>

                <p className="text-on-surface/30 text-xs text-center mt-4 leading-relaxed">
                  Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
                </p>
              </div>

              {/* Инфо */}
              <div className="glass rounded p-6 space-y-4 text-sm">
                {[
                  ['⚡', 'Срок изготовления: 3–5 рабочих дней'],
                  ['✉', 'Предварительный макет — бесплатно'],
                  ['🔄', 'Бесплатная корректировка'],
                  ['📦', 'Доставка по всей России'],
                ].map(([icon, text]) => (
                  <div key={text} className="flex items-start gap-3 text-on-surface/50">
                    <span className="shrink-0">{icon}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </>
  );
}
