import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function PricesPage() {
  const [options, setOptions]   = useState({ canvasSizes: [], designTypes: [], techniques: [], subjects: [], discounts: [] });
  const [loading, setLoading]   = useState(true);
  const [selectedSizeId, setSelectedSizeId] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/prices/options`)
      .then(r => r.json())
      .then(data => setOptions(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectedSize = options.canvasSizes.find(s => s.id === selectedSizeId);

  // Разделяем скидки и надбавки
  const discountRows = options.discounts.filter(d => d.percent < 0);
  const surchargeRows = options.discounts.filter(d => d.percent > 0);

  return (
    <>
      <Head>
        <title>Прайс-лист — ArtStudio</title>
        <meta name="description" content="Цены на картины, написанные вручную художником. Масло, акварель, акрил. Различные размеры и виды оформления." />
      </Head>
      <Navbar />

      <div className="min-h-screen bg-surface pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">

          <div className="mb-16 animate-fade-up">
            <div className="section-label">Стоимость</div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold tracking-tight text-on-surface">Прайс-лист</h1>
            <p className="text-on-surface/50 mt-4 max-w-xl">
              Итоговая стоимость зависит от размера холста, техники живописи, вида оформления, сюжета и сроков.
              Точный расчёт — в форме заказа.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">

            <div className="lg:col-span-2">

              {/* Размеры */}
              <h2 className="font-serif text-2xl font-bold text-on-surface mb-6">Размеры холста</h2>
              {loading ? (
                <div className="glass rounded p-12 text-center text-on-surface/40">Загружаем прайс...</div>
              ) : (
                <div className="glass rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-6 py-4 text-on-surface/40 font-semibold uppercase tracking-widest text-xs">Размер холста</th>
                        <th className="px-4 py-4 w-24" />
                      </tr>
                    </thead>
                    <tbody>
                      {options.canvasSizes.map(s => (
                        <tr key={s.id}
                          onClick={() => setSelectedSizeId(s.id)}
                          className={`border-b border-white/5 cursor-pointer transition-colors duration-200 ${
                            selectedSizeId === s.id ? 'bg-primary/10 border-primary/20' : 'hover:bg-white/5'
                          }`}>
                          <td className="px-6 py-4 font-bold text-on-surface">{s.size}</td>
                          <td className="px-4 py-4 text-center">
                            {selectedSizeId === s.id && <span className="text-xs text-primary">✓ выбрано</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Техники из БД */}
              <h2 className="font-serif text-2xl font-bold text-on-surface mt-12 mb-6">Техники живописи</h2>
              {loading ? (
                <div className="text-on-surface/30 text-sm py-4">Загрузка...</div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {options.techniques.map(t => (
                    <div key={t.id} className="glass rounded p-5 border border-transparent hover:border-white/20 transition-all duration-200">
                      <div className="font-bold text-on-surface text-sm">{t.name}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Виды оформления из БД */}
              <h2 className="font-serif text-2xl font-bold text-on-surface mt-12 mb-6">Виды оформления</h2>
              {loading ? (
                <div className="text-on-surface/30 text-sm py-4">Загрузка...</div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {options.designTypes.map(d => (
                    <div key={d.id} className="glass rounded p-5 border border-transparent hover:border-white/20 transition-all duration-200">
                      <div className="font-bold text-on-surface text-sm">{d.name}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Сюжеты из БД */}
              <h2 className="font-serif text-2xl font-bold text-on-surface mt-12 mb-6">Сюжеты</h2>
              {loading ? (
                <div className="text-on-surface/30 text-sm py-4">Загрузка...</div>
              ) : (
                <div className="grid sm:grid-cols-3 gap-3">
                  {options.subjects.map(s => (
                    <div key={s.id} className="glass rounded p-4 border border-transparent hover:border-white/20 transition-all duration-200">
                      <div className="font-medium text-on-surface text-sm">{s.name}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Скидки и надбавки из БД */}
              <h2 className="font-serif text-2xl font-bold text-on-surface mt-12 mb-6">Скидки и надбавки</h2>
              {loading ? (
                <div className="text-on-surface/30 text-sm py-4">Загрузка...</div>
              ) : (
                <div className="glass rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-6 py-4 text-on-surface/40 font-semibold uppercase tracking-widest text-xs">Условие</th>
                        <th className="text-right px-6 py-4 text-on-surface/40 font-semibold uppercase tracking-widest text-xs">Размер</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discountRows.map(d => (
                        <tr key={d.id} className="border-b border-white/5">
                          <td className="px-6 py-3 text-on-surface/70">{d.description}</td>
                          <td className="px-6 py-3 text-right font-bold text-green-400">{d.percent}%</td>
                        </tr>
                      ))}
                      {surchargeRows.map(d => (
                        <tr key={d.id} className="border-b border-white/5">
                          <td className="px-6 py-3 text-on-surface/70">{d.description}</td>
                          <td className="px-6 py-3 text-right font-bold text-secondary">+{d.percent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Боковая панель */}
            <div>
              <div className="glass rounded p-8 sticky top-28">
                <h2 className="font-serif text-xl font-bold text-on-surface mb-4">Выбранный размер</h2>
                {selectedSize ? (
                  <div className="mb-6">
                    <div className="text-on-surface/50 text-sm mb-1">Холст</div>
                    <div className="font-bold text-on-surface text-2xl font-serif">{selectedSize.size}</div>
                    <div className="text-on-surface/40 text-xs mt-3">
                      Точная цена зависит от техники, оформления и сюжета — используйте калькулятор в форме заказа
                    </div>
                  </div>
                ) : (
                  <div className="text-on-surface/30 text-sm mb-6">
                    Нажмите на строку таблицы, чтобы выбрать размер
                  </div>
                )}

                <Link href="/order" className="btn-primary w-full justify-center block text-center mb-6">
                  Заказать картину →
                </Link>

                <div className="space-y-4 text-xs text-on-surface/30">
                  <p>Цена формируется из комбинации: размер × техника × оформление × сюжет.</p>
                  <p>Нестандартные размеры — по запросу.</p>
                  <p>Аванс 30–50% при оформлении. Остаток — при получении.</p>
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
