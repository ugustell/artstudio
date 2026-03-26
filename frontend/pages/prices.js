import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function PricesPage() {
  const [sizes,   setSizes]   = useState([]);
  const [formats, setFormats] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [plots,   setPlots]   = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSizeId, setSelectedSizeId] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/sizes`).then(r => r.json()),
      fetch(`${API}/api/formats`).then(r => r.json()),
      fetch(`${API}/api/designs`).then(r => r.json()),
      fetch(`${API}/api/plots`).then(r => r.json()),
      fetch(`${API}/api/discounts`).then(r => r.json()),
    ]).then(([s, f, d, p, disc]) => {
      setSizes(s); setFormats(f); setDesigns(d); setPlots(p); setDiscounts(disc);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const selectedSize = sizes.find(s => s.id === selectedSizeId);

  return (
    <>
      <Head>
        <title>Прайс-лист — ArtStudio</title>
        <meta name="description" content="Цены на картины, написанные вручную художником." />
      </Head>
      <Navbar />

      <div className="min-h-screen bg-surface pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">

          <div className="mb-16 animate-fade-up">
            <div className="section-label">Стоимость</div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold tracking-tight text-on-surface">Прайс-лист</h1>
            <p className="text-on-surface/50 mt-4 max-w-xl">
              Базовая цена — по размеру холста. Итоговая стоимость рассчитывается с учётом
              вида оформления, техники, сюжета и условий заказа.
            </p>
          </div>

          {loading ? (
            <div className="glass rounded p-12 text-center text-on-surface/40">Загружаем прайс...</div>
          ) : (
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-12">

              {/* Размеры — базовые цены */}
              <div>
                <h2 className="font-serif text-2xl font-bold text-on-surface mb-6">Базовые цены по размерам холста</h2>
                <div className="glass rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-6 py-4 text-on-surface/40 font-semibold uppercase tracking-widest text-xs">Размер</th>
                        <th className="text-right px-6 py-4 text-on-surface/40 font-semibold uppercase tracking-widest text-xs">Цена от</th>
                        <th className="px-4 py-4 w-24" />
                      </tr>
                    </thead>
                    <tbody>
                      {sizes.map(s => (
                        <tr key={s.id} onClick={() => setSelectedSizeId(s.id)}
                          className={`border-b border-white/5 cursor-pointer transition-colors duration-200 ${
                            selectedSizeId === s.id ? 'bg-primary/10 border-primary/20' : 'hover:bg-white/5'
                          }`}>
                          <td className="px-6 py-4 font-bold text-on-surface">{s.size}</td>
                          <td className="px-6 py-4 text-right text-secondary font-bold">{s.price.toLocaleString('ru-RU')} ₽</td>
                          <td className="px-4 py-4 text-center">
                            {selectedSizeId === s.id && <span className="text-xs text-primary">✓ выбрано</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Виды оформления */}
              <div>
                <h2 className="font-serif text-2xl font-bold text-on-surface mb-6">Виды оформления</h2>
                <div className="glass rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-6 py-4 text-on-surface/40 font-semibold uppercase tracking-widest text-xs">Вид оформления</th>
                        <th className="text-right px-6 py-4 text-on-surface/40 font-semibold uppercase tracking-widest text-xs">Надбавка</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formats.map(f => (
                        <tr key={f.id} className="border-b border-white/5">
                          <td className="px-6 py-3 text-on-surface">{f.format}</td>
                          <td className={`px-6 py-3 text-right font-bold ${f.priceExtra > 0 ? 'text-secondary' : 'text-on-surface/30'}`}>
                            {f.priceExtra > 0 ? `+${f.priceExtra.toLocaleString('ru-RU')} ₽` : 'включено'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Техники */}
              <div>
                <h2 className="font-serif text-2xl font-bold text-on-surface mb-6">Техники исполнения</h2>
                <div className="glass rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-6 py-4 text-on-surface/40 font-semibold uppercase tracking-widest text-xs">Техника</th>
                        <th className="text-right px-6 py-4 text-on-surface/40 font-semibold uppercase tracking-widest text-xs">Надбавка за сложность</th>
                      </tr>
                    </thead>
                    <tbody>
                      {designs.map(d => (
                        <tr key={d.id} className="border-b border-white/5">
                          <td className="px-6 py-3 text-on-surface">{d.design}</td>
                          <td className={`px-6 py-3 text-right font-bold ${d.priceExtra > 0 ? 'text-secondary' : 'text-on-surface/30'}`}>
                            {d.priceExtra > 0 ? `+${d.priceExtra.toLocaleString('ru-RU')} ₽` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Сюжеты */}
              <div>
                <h2 className="font-serif text-2xl font-bold text-on-surface mb-6">Сюжеты</h2>
                <div className="glass rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-6 py-4 text-on-surface/40 font-semibold uppercase tracking-widest text-xs">Сюжет</th>
                        <th className="text-right px-6 py-4 text-on-surface/40 font-semibold uppercase tracking-widest text-xs">Надбавка за сложность</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plots.map(p => (
                        <tr key={p.id} className="border-b border-white/5">
                          <td className="px-6 py-3 text-on-surface">{p.plot}</td>
                          <td className={`px-6 py-3 text-right font-bold ${p.priceExtra > 0 ? 'text-secondary' : 'text-on-surface/30'}`}>
                            {p.priceExtra > 0 ? `+${p.priceExtra.toLocaleString('ru-RU')} ₽` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Скидки и надбавки */}
              <div>
                <h2 className="font-serif text-2xl font-bold text-on-surface mb-6">Скидки и надбавки</h2>
                <div className="glass rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-6 py-4 text-on-surface/40 font-semibold uppercase tracking-widest text-xs">Условие</th>
                        <th className="text-right px-6 py-4 text-on-surface/40 font-semibold uppercase tracking-widest text-xs">Размер</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discounts.filter(d => d.percent !== 0).map(d => (
                        <tr key={d.id} className="border-b border-white/5">
                          <td className="px-6 py-3 text-on-surface/70">{d.description}</td>
                          <td className={`px-6 py-3 text-right font-bold ${d.percent > 0 ? 'text-secondary' : 'text-green-400'}`}>
                            {d.percent > 0 ? `+${d.percent}%` : `${d.percent}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Боковой блок */}
            <div>
              <div className="glass rounded p-8 sticky top-28">
                <h2 className="font-serif text-xl font-bold text-on-surface mb-4">Выбранный размер</h2>
                {selectedSize ? (
                  <div className="mb-6">
                    <div className="font-bold text-on-surface text-2xl font-serif">{selectedSize.size}</div>
                    <div className="text-primary font-black text-4xl font-serif mt-3">
                      {selectedSize.price.toLocaleString('ru-RU')} ₽
                    </div>
                    <div className="text-on-surface/30 text-xs mt-1">базовая цена</div>
                  </div>
                ) : (
                  <div className="text-on-surface/30 text-sm mb-6">Нажмите на строку таблицы, чтобы выбрать размер</div>
                )}
                <Link
                  href={selectedSizeId ? `/order?sizeId=${selectedSizeId}` : '/order'}
                  className="btn-primary w-full justify-center block text-center mb-6">
                  Заказать картину →
                </Link>
                <div className="space-y-3 text-xs text-on-surface/30">
                  <p>Итоговая цена = базовая + надбавки за оформление, технику и сюжет ± скидки.</p>
                  <p>Точный расчёт — в форме заказа.</p>
                  <p>Аванс 30–50% при оформлении. Остаток — при получении.</p>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
