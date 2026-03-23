import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const FORMATS = [
  { name: 'Холст на подрамнике', extra: 0,   desc: 'Классический вариант — натянутый на деревянный подрамник.' },
  { name: 'В раме',              extra: 500,  desc: 'Деревянная рама в комплекте — готово к повешению.' },
  { name: 'Без оформления',      extra: 0,    desc: 'Только отпечаток на холсте, без натяжки и рамки.' },
  { name: 'Модульная картина',   extra: 800,  desc: 'Несколько частей — эффектная галерейная развеска.' },
];

const DESIGNS = [
  { name: 'Без дизайна',         extra: 0,   desc: 'Точная печать вашего фото без изменений.' },
  { name: 'С дизайном',          extra: 300, desc: 'Художественная обработка: тонирование, ретушь, фон.' },
  { name: 'Срочная обработка',   extra: 700, desc: 'Приоритетная обработка и изготовление за 24–48 ч.' },
];

export default function PricesPage() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState({ size: null, format: 'Холст на подрамнике', design: 'Без дизайна' });

  useEffect(() => {
    axios.get(`${API}/api/prices`)
      .then(r => setPrices(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const calcTotal = () => {
    const base = prices.find(p => p.size === selected.size)?.price || 0;
    const formatExtra = FORMATS.find(f => f.name === selected.format)?.extra || 0;
    const designExtra = DESIGNS.find(d => d.name === selected.design)?.extra || 0;
    return base + formatExtra + designExtra;
  };

  return (
    <>
      <Head>
        <title>Прайс-лист — ArtStudio</title>
        <meta name="description" content="Цены на картины на холсте. Размеры от 20×30 до 120×160 см. Различные виды оформления." />
      </Head>
      <Navbar />

      <div className="min-h-screen bg-surface pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">

          {/* Заголовок */}
          <div className="mb-16 animate-fade-up">
            <div className="section-label">Стоимость</div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold tracking-tight text-on-surface">Прайс-лист</h1>
            <p className="text-on-surface/50 mt-4 max-w-xl">
              Цена зависит от размера холста, вида оформления и типа обработки фото. Воспользуйтесь калькулятором ниже.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">

            {/* ── Таблица размеров ── */}
            <div className="lg:col-span-2">
              <h2 className="font-serif text-2xl font-bold text-on-surface mb-6">Базовые цены по размерам</h2>

              {loading ? (
                <div className="glass rounded p-12 text-center text-on-surface/40">Загружаем прайс...</div>
              ) : (
                <div className="glass rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-6 py-4 text-on-surface/40 font-semibold uppercase tracking-widest text-xs">Размер</th>
                        <th className="text-right px-6 py-4 text-on-surface/40 font-semibold uppercase tracking-widest text-xs">Цена</th>
                        <th className="px-4 py-4 w-24" />
                      </tr>
                    </thead>
                    <tbody>
                      {prices.map((p, i) => (
                        <tr key={p.id}
                          onClick={() => setSelected(s => ({ ...s, size: p.size }))}
                          className={`border-b border-white/5 cursor-pointer transition-colors duration-200 ${
                            selected.size === p.size
                              ? 'bg-primary/10 border-primary/20'
                              : 'hover:bg-white/5'
                          }`}>
                          <td className="px-6 py-4 font-bold text-on-surface">{p.size}</td>
                          <td className="px-6 py-4 text-right text-secondary font-bold">
                            {p.price.toLocaleString('ru-RU')} ₽
                          </td>
                          <td className="px-4 py-4 text-center">
                            {selected.size === p.size && (
                              <span className="text-xs text-primary">✓ выбрано</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Оформление */}
              <h2 className="font-serif text-2xl font-bold text-on-surface mt-12 mb-6">Виды оформления</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {FORMATS.map(f => (
                  <div key={f.name}
                    onClick={() => setSelected(s => ({ ...s, format: f.name }))}
                    className={`glass rounded p-6 cursor-pointer transition-all duration-200 border ${
                      selected.format === f.name
                        ? 'border-secondary/50 bg-secondary/10'
                        : 'border-transparent hover:border-white/20'
                    }`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-on-surface">{f.name}</span>
                      <span className={`text-sm font-bold ${f.extra > 0 ? 'text-secondary' : 'text-on-surface/40'}`}>
                        {f.extra > 0 ? `+${f.extra} ₽` : 'включено'}
                      </span>
                    </div>
                    <p className="text-on-surface/40 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>

              {/* Обработка */}
              <h2 className="font-serif text-2xl font-bold text-on-surface mt-10 mb-6">Тип обработки</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {DESIGNS.map(d => (
                  <div key={d.name}
                    onClick={() => setSelected(s => ({ ...s, design: d.name }))}
                    className={`glass rounded p-6 cursor-pointer transition-all duration-200 border ${
                      selected.design === d.name
                        ? 'border-primary/50 bg-primary/10'
                        : 'border-transparent hover:border-white/20'
                    }`}>
                    <div className="font-bold text-on-surface mb-1">{d.name}</div>
                    <div className={`text-sm font-bold mb-3 ${d.extra > 0 ? 'text-primary' : 'text-on-surface/40'}`}>
                      {d.extra > 0 ? `+${d.extra} ₽` : 'бесплатно'}
                    </div>
                    <p className="text-on-surface/40 text-xs leading-relaxed">{d.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Калькулятор ── */}
            <div>
              <div className="glass rounded p-8 sticky top-28">
                <h2 className="font-serif text-xl font-bold text-on-surface mb-6">Калькулятор</h2>
                <p className="text-on-surface/40 text-sm mb-6">
                  Кликайте на размер, оформление и тип обработки — стоимость считается автоматически.
                </p>

                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between">
                    <span className="text-on-surface/50">Размер:</span>
                    <span className={selected.size ? 'text-on-surface' : 'text-on-surface/30'}>
                      {selected.size || 'не выбран'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface/50">Базовая цена:</span>
                    <span className="text-on-surface">
                      {prices.find(p => p.size === selected.size)?.price
                        ? prices.find(p => p.size === selected.size).price.toLocaleString('ru-RU') + ' ₽'
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface/50">Оформление:</span>
                    <span className="text-on-surface">{selected.format}</span>
                  </div>
                  {FORMATS.find(f => f.name === selected.format)?.extra > 0 && (
                    <div className="flex justify-between text-secondary">
                      <span>↳ доп.:</span>
                      <span>+{FORMATS.find(f => f.name === selected.format).extra} ₽</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-on-surface/50">Обработка:</span>
                    <span className="text-on-surface">{selected.design}</span>
                  </div>
                  {DESIGNS.find(d => d.name === selected.design)?.extra > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>↳ доп.:</span>
                      <span>+{DESIGNS.find(d => d.name === selected.design).extra} ₽</span>
                    </div>
                  )}
                  <div className="border-t border-white/10 pt-3 flex justify-between font-bold text-base">
                    <span className="text-on-surface">Итого:</span>
                    <span className={calcTotal() > 0 ? 'text-primary text-xl' : 'text-on-surface/30'}>
                      {calcTotal() > 0 ? calcTotal().toLocaleString('ru-RU') + ' ₽' : '—'}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/order${selected.size ? `?size=${encodeURIComponent(selected.size)}&format=${encodeURIComponent(selected.format)}&design=${encodeURIComponent(selected.design)}` : ''}`}
                  className="btn-primary w-full justify-center block text-center">
                  Заказать эту конфигурацию
                </Link>

                <div className="mt-6 space-y-3 text-xs text-on-surface/30">
                  <p>* Доставка оплачивается отдельно (от 300 ₽ по городу, от 350 ₽ по России).</p>
                  <p>* Нестандартные размеры — по запросу.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
