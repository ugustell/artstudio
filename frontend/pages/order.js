import Head from 'next/head';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export default function OrderPage() {
  const { user, token } = useAuth();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [options, setOptions] = useState({
    sizes: [],
    formats: [],
    designs: [],
    plots: [],
    discounts: [],
  });

  const [sizeId, setSizeId] = useState('');
  const [formatId, setFormatId] = useState('');
  const [designId, setDesignId] = useState('');
  const [plotId, setPlotId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [deadline, setDeadline] = useState('');

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [calcLoading, setCalcLoading] = useState(false);
  const [priceInfo, setPriceInfo] = useState(null);
  const [comment, setComment] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [error, setError] = useState(null);

  // ─── Загрузка справочников ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        setLoadingOptions(true);

        const [sizes, formats, designs, plots, discounts] = await Promise.all([
          fetch(`${API}/api/sizes`).then(r => r.json()),
          fetch(`${API}/api/formats`).then(r => r.json()),
          fetch(`${API}/api/designs`).then(r => r.json()),
          fetch(`${API}/api/plots`).then(r => r.json()),
          fetch(`${API}/api/discounts`).then(r => r.json()),
        ]);

        if (cancelled) return;

        setOptions({ sizes, formats, designs, plots, discounts });

        if (sizes.length && !sizeId) setSizeId(String(sizes[0].id));
        if (formats.length && !formatId) setFormatId(String(formats[0].id));
        if (designs.length && !designId) setDesignId(String(designs[0].id));
        if (plots.length && !plotId) setPlotId(String(plots[0].id));
      } catch (e) {
        if (!cancelled) setError('Не удалось загрузить параметры заказа');
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    }

    if (API) loadOptions();
    else setError('NEXT_PUBLIC_API_URL не задан');

    return () => {
      cancelled = true;
    };
  }, [API]);

  // ─── Калькулятор backend ───────────────────────────────────────────────────
  async function handleCalculate() {
    if (!sizeId || !formatId || !designId || !plotId || !quantity) {
      setError('Заполните все параметры перед расчётом');
      return;
    }

    try {
      setError(null);
      setCalcLoading(true);

      const params = new URLSearchParams({
        sizeId,
        formatId,
        designId,
        plotId,
        quantity: String(quantity),
      });

      if (deadline) params.append('deadline', deadline);

      const res = await fetch(`${API}/api/calc?${params.toString()}`);
      if (!res.ok) throw new Error('Ошибка расчёта цены');

      const data = await res.json();
      setPriceInfo(data);
    } catch (e) {
      setError(e.message || 'Не удалось рассчитать цену');
    } finally {
      setCalcLoading(false);
    }
  }

  // ─── Создание заказа ───────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();

    if (!user || !token) {
      setError('Для оформления заказа нужно войти в аккаунт');
      return;
    }

    if (!priceInfo) {
      setError('Сначала рассчитайте цену');
      return;
    }

    try {
      setSubmitLoading(true);
      setSubmitMessage(null);
      setError(null);

      const body = {
        sizeId: Number(sizeId),
        formatId: Number(formatId),
        designId: Number(designId),
        plotId: Number(plotId),
        quantity: Number(quantity),
        deadline: deadline || null,
        comment: comment || '',
        imageUrl: imageUrl || '',
      };

      const res = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Ошибка при создании заказа');
      }

      const data = await res.json();
      setSubmitMessage(`Заказ успешно создан. Номер: ${data.id || '—'}`);
    } catch (e) {
      setError(e.message || 'Не удалось создать заказ');
    } finally {
      setSubmitLoading(false);
    }
  }

  // ─── UI ────────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Новый заказ — ArtStudio</title>
      </Head>

      <div className="min-h-screen flex flex-col bg-background text-on-surface">
        <Navbar />

        <main className="flex-1">
          <div className="max-w-5xl mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold mb-6">Оформление заказа</h1>

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {submitMessage && (
              <div className="mb-4 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                {submitMessage}
              </div>
            )}

            {loadingOptions ? (
              <div className="text-sm text-on-surface/60">Загрузка параметров заказа…</div>
            ) : (
              <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
                {/* Левая колонка */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm mb-1">Размер</label>
                    <select
                      className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm"
                      value={sizeId}
                      onChange={e => setSizeId(e.target.value)}
                    >
                      {options.sizes.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} — {s.price} ₽
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Оформление</label>
                    <select
                      className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm"
                      value={formatId}
                      onChange={e => setFormatId(e.target.value)}
                    >
                      {options.formats.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name} {f.priceExtra > 0 ? `(+${f.priceExtra} ₽)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Техника</label>
                    <select
                      className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm"
                      value={designId}
                      onChange={e => setDesignId(e.target.value)}
                    >
                      {options.designs.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} {d.priceExtra > 0 ? `(+${d.priceExtra} ₽)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Сюжет</label>
                    <select
                      className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm"
                      value={plotId}
                      onChange={e => setPlotId(e.target.value)}
                    >
                      {options.plots.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.priceExtra > 0 ? `(+${p.priceExtra} ₽)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Количество</label>
                    <input
                      type="number"
                      min={1}
                      className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm"
                      value={quantity}
                      onChange={e => setQuantity(Number(e.target.value) || 1)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Срок</label>
                    <input
                      type="date"
                      className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm"
                      value={deadline}
                      onChange={e => setDeadline(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Ссылка на референс</label>
                    <input
                      type="url"
                      className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm"
                      placeholder="https://..."
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Комментарий</label>
                    <textarea
                      className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm min-h-[80px]"
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="Опишите пожелания…"
                    />
                  </div>
                </div>

                {/* Правая колонка */}
                <div className="space-y-4">
                  <div className="bg-surface/60 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-semibold">Расчёт стоимости</h2>
                      <button
                        type="button"
                        onClick={handleCalculate}
                        disabled={calcLoading}
                        className="text-xs px-3 py-1 rounded-full bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
                      >
                        {calcLoading ? 'Считаем…' : 'Рассчитать'}
                      </button>
                    </div>

                    {!priceInfo && (
                      <p className="text-sm text-on-surface/60">
                        Выберите параметры и нажмите «Рассчитать».
                      </p>
                    )}

                    {priceInfo && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-on-surface/60">Цена за единицу</span>
                          <span className="font-semibold">{priceInfo.unitPrice} ₽</span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-on-surface/60">Количество</span>
                          <span className="font-medium">{quantity}</span>
                        </div>

                        {priceInfo.deadlineInfo && (
                          <div className="flex justify-between">
                            <span className="text-on-surface/60">Срочность</span>
                            <span className="font-medium">{priceInfo.deadlineInfo}</span>
                          </div>
                        )}

                        {priceInfo.quantityInfo && (
                          <div className="flex justify-between">
                            <span className="text-on-surface/60">Скидка за объём</span>
                            <span className="font-medium">{priceInfo.quantityInfo}</span>
                          </div>
                        )}

                        {Array.isArray(priceInfo.discountsApplied) &&
                          priceInfo.discountsApplied.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs text-on-surface/50 mb-1">
                                Применённые скидки / надбавки:
                              </div>
                              <ul className="text-xs text-on-surface/70 list-disc list-inside space-y-1">
                                {priceInfo.discountsApplied.map((d, i) => (
                                  <li key={i}>{d}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                        <div className="border-t border-white/10 mt-3 pt-3 flex justify-between items-center">
                          <span className="text-sm text-on-surface/80 font-semibold">
                            Итоговая стоимость
                          </span>
                          <span className="text-lg font-bold text-primary">
                            {priceInfo.total} ₽
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitLoading || !priceInfo}
                    className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 disabled:opacity-60"
                  >
                    {submitLoading ? 'Отправляем заказ…' : 'Оформить заказ'}
                  </button>

                  {!user && (
                    <p className="text-xs text-on-surface/50">
                      Чтобы оформить заказ, войдите или зарегистрируйтесь.
                    </p>
                  )}
                </div>
              </form>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
