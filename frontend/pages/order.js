import Head from 'next/head';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export default function OrderPage() {
  const { user, token } = useAuth();
  const API = process.env.NEXT_PUBLIC_API_URL;

  // 1. Справочники из БД
  const [options, setOptions] = useState({
    sizes: [],
    formats: [],
    designs: [],
    plots: [],
    discounts: [],
  });

  // 2. Выбор пользователя (храним ID)
  const [sizeId, setSizeId] = useState('');
  const [formatId, setFormatId] = useState('');
  const [designId, setDesignId] = useState('');
  const [plotId, setPlotId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [comment, setComment] = useState('');

  // Состояния интерфейса
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [priceInfo, setPriceInfo] = useState({ base: 0, extra: 0, total: 0 });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [error, setError] = useState(null);

  // 3. Загрузка справочников при старте
  useEffect(() => {
    async function loadOptions() {
      try {
        const res = await fetch(`${API}/options`); // Твой эндпоинт со справочниками
        if (!res.ok) throw new Error('Ошибка загрузки данных');
        const data = await res.json();
        setOptions(data);
      } catch (err) {
        setError("Не удалось загрузить параметры заказа");
      } finally {
        setLoadingOptions(false);
      }
    }
    loadOptions();
  }, [API]);

  // 4. Динамический расчет цены на фронте (синхронно с логикой бэка)
  useEffect(() => {
    const selectedSize = options.sizes.find(s => s.id === parseInt(sizeId));
    const selectedFormat = options.formats.find(f => f.id === parseInt(formatId));
    const selectedDesign = options.designs.find(d => d.id === parseInt(designId));
    const selectedPlot = options.plots.find(p => p.id === parseInt(plotId));

    if (selectedSize) {
      const base = selectedSize.price;
      const extra = (selectedFormat?.priceExtra || 0) + 
                    (selectedDesign?.priceExtra || 0) + 
                    (selectedPlot?.priceExtra || 0);
      
      const total = (base + extra) * quantity;
      setPriceInfo({ base, extra, total });
    }
  }, [sizeId, formatId, designId, plotId, quantity, options]);

  // 5. Отправка заказа в БД
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return setError("Необходимо войти в систему");

    setSubmitLoading(true);
    setError(null);

    const orderBody = {
      sizeId: parseInt(sizeId),
      formatId: parseInt(formatId),
      designId: parseInt(designId),
      plotId: parseInt(plotId),
      quantity: parseInt(quantity),
      comments: comment,
      totalPrice: priceInfo.total,
      clientName: user.name, // Берем из контекста аuth
      phone: user.phone,
      email: user.email,
    };

    try {
      const response = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderBody),
      });

      if (!response.ok) throw new Error('Ошибка при создании заказа');
      
      setSubmitMessage("Заказ успешно создан! Художник свяжется с вами.");
      // Сброс формы
      setSizeId(''); setFormatId(''); setDesignId(''); setPlotId(''); setComment('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loadingOptions) return <div className="text-center p-20">Загрузка параметров...</div>;

  return (
    <>
      <Head><title>Оформить заказ | ArtStudio</title></Head>
      <div className="min-h-screen bg-surface flex flex-col text-on-surface">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-10 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Настройка вашей картины</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* ФОРМА */}
            <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 p-6 rounded-2xl border border-white/10">
              
              {/* Выбор размера (обязательно) */}
              <div>
                <label className="block text-sm mb-2">Размер холста *</label>
                <select 
                  required value={sizeId} onChange={e => setSizeId(e.target.value)}
                  className="w-full bg-surface border border-white/20 p-3 rounded-lg focus:border-primary outline-none"
                >
                  <option value="">Выберите размер</option>
                  {options.sizes.map(s => <option key={s.id} value={s.id}>{s.size} — от {s.price} ₽</option>)}
                </select>
              </div>

              {/* Техника */}
              <div>
                <label className="block text-sm mb-2">Техника исполнения</label>
                <select 
                  value={designId} onChange={e => setDesignId(e.target.value)}
                  className="w-full bg-surface border border-white/20 p-3 rounded-lg focus:border-primary outline-none"
                >
                  <option value="">Любая (на усмотрение художника)</option>
                  {options.designs.map(d => <option key={d.id} value={d.id}>{d.design} (+{d.priceExtra} ₽)</option>)}
                </select>
              </div>

              {/* Сюжет */}
              <div>
                <label className="block text-sm mb-2">Сюжет (Жанр)</label>
                <select 
                  value={plotId} onChange={e => setPlotId(e.target.value)}
                  className="w-full bg-surface border border-white/20 p-3 rounded-lg focus:border-primary outline-none"
                >
                  <option value="">Выберите сюжет</option>
                  {options.plots.map(p => <option key={p.id} value={p.id}>{p.plot}</option>)}
                </select>
              </div>

              {/* Оформление */}
              <div>
                <label className="block text-sm mb-2">Вид оформления</label>
                <select 
                  value={formatId} onChange={e => setFormatId(e.target.value)}
                  className="w-full bg-surface border border-white/20 p-3 rounded-lg focus:border-primary outline-none"
                >
                  <option value="">Без оформления</option>
                  {options.formats.map(f => <option key={f.id} value={f.id}>{f.format} (+{f.priceExtra} ₽)</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2">Комментарий к заказу</label>
                <textarea 
                  value={comment} onChange={e => setComment(e.target.value)}
                  className="w-full bg-surface border border-white/20 p-3 rounded-lg h-24"
                  placeholder="Опишите ваши пожелания..."
                />
              </div>

              <button 
                type="submit" 
                disabled={submitLoading || !user}
                className="w-full bg-primary py-4 rounded-xl font-bold hover:opacity-90 disabled:bg-gray-600 transition"
              >
                {submitLoading ? 'Обработка...' : 'Оформить за ' + priceInfo.total + ' ₽'}
              </button>

              {error && <p className="text-red-400 text-sm">{error}</p>}
              {submitMessage && <p className="text-green-400 text-sm">{submitMessage}</p>}
              {!user && <p className="text-yellow-500 text-xs">Войдите, чтобы сделать заказ</p>}
            </form>

            {/* ПРЕВЬЮ ЧЕКА */}
            <div className="bg-white/5 p-6 rounded-2xl border border-dashed border-white/20 h-fit">
              <h2 className="font-bold mb-4 border-bottom pb-2 uppercase tracking-widest text-sm">Спецификация</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Базовая цена:</span>
                  <span>{priceInfo.base} ₽</span>
                </div>
                <div className="flex justify-between text-on-surface/60">
                  <span>Доп. параметры:</span>
                  <span>+{priceInfo.extra} ₽</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between font-bold text-xl text-primary">
                  <span>Итого:</span>
                  <span>{priceInfo.total} ₽</span>
                </div>
                <p className="text-[10px] text-on-surface/40 mt-4 italic">
                  * Окончательная стоимость может быть скорректирована художником после уточнения деталей сюжета.
                </p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}