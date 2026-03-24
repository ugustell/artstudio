import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function PricesPage() {
  const [prices, setPrices]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);

  useEffect(() => {
    axios.get(`${API}/api/prices`)
      .then(r => setPrices(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectedPrice = prices.find(p => p.size === selectedSize);

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
              Базовая цена зависит от размера холста. Итоговая стоимость рассчитывается с учётом
              техники живописи, оформления, срока и количества картин — используйте калькулятор в форме заказа.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">

            <div className="lg:col-span-2">
              <h2 className="font-serif text-2xl font-bold text-on-surface mb-6">Базовые цены по размерам холста</h2>

              {loading ? (
                <div className="glass rounded p-12 text-center text-on-surface/40">Загружаем прайс...</div>
              ) : (
                <div className="glass rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-6 py-4 text-on-surface/40 font-semibold uppercase tracking-widest text-xs">Размер холста</th>
                        <th className="text-right px-6 py-4 text-on-surface/40 font-semibold uppercase tracking-widest text-xs">Цена от</th>
                        <th className="px-4 py-4 w-24" />
                      </tr>
                    </thead>
                    <tbody>
                      {prices.map(p => (
                        <tr key={p.id}
                          onClick={() => setSelectedSize(p.size)}
                          className={`border-b border-white/5 cursor-pointer transition-colors duration-200 ${
                            selectedSize === p.size ? 'bg-primary/10 border-primary/20' : 'hover:bg-white/5'
                          }`}>
                          <td className="px-6 py-4 font-bold text-on-surface">{p.size}</td>
                          <td className="px-6 py-4 text-right text-secondary font-bold">
                            {p.price.toLocaleString('ru-RU')} ₽
                          </td>
                          <td className="px-4 py-4 text-center">
                            {selectedSize === p.size && <span className="text-xs text-primary">✓ выбрано</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h2 className="font-serif text-2xl font-bold text-on-surface mt-12 mb-6">Техники живописи</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { name: 'Масло',             desc: 'Классическая масляная живопись. Насыщенные цвета, долговечность, глубина.' },
                  { name: 'Акрил',             desc: 'Быстрое высыхание, яркие цвета. Идеально для абстракций и текстур.' },
                  { name: 'Акварель',          desc: 'Прозрачные воздушные переливы. Пейзажи, ботаника, портреты.' },
                  { name: 'Пастель',           desc: 'Мягкие тона и бархатистая фактура. Портреты, цветы, интерьеры.' },
                  { name: 'Гуашь',             desc: 'Насыщенные матовые цвета. Иллюстрации и декоративные работы.' },
                  { name: 'Смешанная техника', desc: 'Сочетание нескольких материалов для уникального результата.' },
                ].map(t => (
                  <div key={t.name} className="glass rounded p-6 border border-transparent hover:border-white/20 transition-all duration-200">
                    <div className="font-bold text-on-surface mb-2">{t.name}</div>
                    <p className="text-on-surface/40 text-xs leading-relaxed">{t.desc}</p>
                  </div>
                ))}
              </div>

              <h2 className="font-serif text-2xl font-bold text-on-surface mt-12 mb-6">Виды оформления</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { name: 'Без оформления',      extra: 0,    desc: 'Только работа — холст или бумага. Вы оформляете сами.' },
                  { name: 'Холст на подрамнике',  extra: 800,  desc: 'Натянутый на деревянный подрамник. Готов к повешению.' },
                  { name: 'В раме',              extra: 2500, desc: 'Деревянная рама на выбор — классика, модерн, скандинавский стиль.' },
                  { name: 'Рамка с паспарту',    extra: 2500, desc: 'Белое или чёрное паспарту с рамой. Идеально для акварели и графики.' },
                  { name: 'Плавающая рама',       extra: 2500, desc: 'Float frame — холст парит в раме. Современный галерейный вид.' },
                  { name: 'Под стеклом',          extra: 1500, desc: 'Рама со стеклом — защита для пастели, акварели и графики.' },
                ].map(f => (
                  <div key={f.name} className="glass rounded p-6 border border-transparent hover:border-white/20 transition-all duration-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-on-surface">{f.name}</span>
                      <span className={`text-sm font-bold ${f.extra > 0 ? 'text-secondary' : 'text-on-surface/40'}`}>
                        {f.extra > 0 ? `+${f.extra.toLocaleString('ru-RU')} ₽` : 'включено'}
                      </span>
                    </div>
                    <p className="text-on-surface/40 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>

              <h2 className="font-serif text-2xl font-bold text-on-surface mt-12 mb-6">Скидки и надбавки</h2>
              <div className="glass rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-6 py-4 text-on-surface/40 font-semibold uppercase tracking-widest text-xs">Условие</th>
                      <th className="text-right px-6 py-4 text-on-surface/40 font-semibold uppercase tracking-widest text-xs">Размер</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: '2 картины в одном заказе',                     val: '−5%',  color: 'text-green-400' },
                      { label: '3–4 картины',                                  val: '−10%', color: 'text-green-400' },
                      { label: '5–9 картин',                                   val: '−15%', color: 'text-green-400' },
                      { label: '10 и более картин',                            val: '−20%', color: 'text-green-400' },
                      { label: 'Срок исполнения 30+ дней',                     val: '−5%',  color: 'text-green-400' },
                      { label: 'Срок 7–13 дней (ускоренный)',                  val: '+15%', color: 'text-secondary' },
                      { label: 'Срок 3–6 дней (срочный)',                      val: '+30%', color: 'text-primary'   },
                      { label: 'Срок менее 3 дней (очень срочно)',              val: '+60%', color: 'text-red-400'   },
                      { label: 'Портрет / реализм (сложный сюжет)',            val: '+20%', color: 'text-secondary' },
                      { label: 'Копия в стиле мастера (Ван Гог, Моне и др.)',  val: '+30%', color: 'text-secondary' },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="px-6 py-3 text-on-surface/70">{row.label}</td>
                        <td className={`px-6 py-3 text-right font-bold ${row.color}`}>{row.val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div className="glass rounded p-8 sticky top-28">
                <h2 className="font-serif text-xl font-bold text-on-surface mb-4">Выбранный размер</h2>
                {selectedPrice ? (
                  <div className="mb-6">
                    <div className="text-on-surface/50 text-sm mb-1">Холст</div>
                    <div className="font-bold text-on-surface text-2xl font-serif">{selectedPrice.size}</div>
                    <div className="text-primary font-black text-4xl font-serif mt-3">
                      {selectedPrice.price.toLocaleString('ru-RU')} ₽
                    </div>
                    <div className="text-on-surface/30 text-xs mt-1">базовая цена</div>
                  </div>
                ) : (
                  <div className="text-on-surface/30 text-sm mb-6">
                    Нажмите на строку таблицы, чтобы выбрать размер
                  </div>
                )}

                <Link
                  href={selectedSize ? `/order?size=${encodeURIComponent(selectedSize)}` : '/order'}
                  className="btn-primary w-full justify-center block text-center mb-6">
                  Заказать картину →
                </Link>

                <div className="space-y-4 text-xs text-on-surface/30">
                  <p>Цена зависит от размера, техники, оформления, срока и количества. Точный расчёт — в форме заказа.</p>
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
