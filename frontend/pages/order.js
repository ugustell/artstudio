import Head from 'next/head';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export default function OrderPage() {
  const { user, token } = useAuth();
  const API = process.env.NEXT_PUBLIC_API_URL;

  // --- Состояния для данных из БД ---
  const [options, setOptions] = useState({
    sizes: [],
    formats: [],
    designs: [],
    plots: [],
    discounts: [],
  });

  // --- Выбор пользователя (ID для БД) ---
  const [sizeId, setSizeId] = useState('');
  const [formatId, setFormatId] = useState('');
  const [designId, setDesignId] = useState('');
  const [plotId, setPlotId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [comment, setComment] = useState('');

  // --- Вспомогательные состояния ---
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [priceInfo, setPriceInfo] = useState({ base: 0, extra: 0, total: 0 });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [error, setError] = useState(null);

  // 1. Загрузка справочников (под твой новый бэкенд)
  useEffect(() => {
    async function fetchOptions() {
      try {
        const res = await fetch(`${API}/options`);
        const data = await res.json();
        setOptions(data);
      } catch (err) {
        console.error("Ошибка загрузки справочников:", err);
        setError("Ошибка связи с сервером");
      } finally {
        setLoadingOptions(false);
      }
    }
    fetchOptions();
  }, [API]);

  // 2. Логика расчета стоимости (на лету)
  useEffect(() => {
    const s = options.sizes.find(x => x.id === parseInt(sizeId));
    const f = options.formats.find(x => x.id === parseInt(formatId));
    const d = options.designs.find(x => x.id === parseInt(designId));
    const p = options.plots.find(x => x.id === parseInt(plotId));

    if (s) {
      const base = s.price;
      const extra = (f?.priceExtra || 0) + (d?.priceExtra || 0) + (p?.priceExtra || 0);
      setPriceInfo({
        base,
        extra,
        total: (base + extra) * quantity
      });
    }
  }, [sizeId, formatId, designId, plotId, quantity, options]);

  // 3. Отправка заказа
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return setError("Сначала войдите в систему");

    setSubmitLoading(true);
    setError(null);

    const payload = {
      sizeId: parseInt(sizeId),
      formatId: parseInt(formatId),
      designId: parseInt(designId),
      plotId: parseInt(plotId),
      quantity,
      comments: comment,
      totalPrice: priceInfo.total,
      clientName: user.name,
      phone: user.phone,
      email: user.email
    };

    try {
      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Ошибка при создании");
      setSubmitMessage("Заказ оформлен! Проверьте личный кабинет.");
    } catch (err) {
      setError("Не удалось отправить заказ.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <>
      <Head><title>ArtStudio | Оформление заказа</title></Head>
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
        <Navbar />
        
        <main className="flex-grow flex items-center justify-center py-16 px-4">
          <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* ЛЕВАЯ ЧАСТЬ: ФОРМА (ТВОЙ ДИЗАЙН) */}
            <div className="lg:col-span-7 space-y-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                  Создайте свой шедевр
                </h1>
                <p className="text-gray-400 mt-2 text-lg">Заполните детали, и я воплощу вашу идею на холсте.</p>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Размер */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Размер картины</label>
                  <select 
                    value={sizeId} onChange={(e) => setSizeId(e.target.value)} required
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                  >
                    <option value="" className="bg-black">Выберите формат...</option>
                    {options.sizes.map(s => <option key={s.id} value={s.id} className="bg-black">{s.size}</option>)}
                  </select>
                </div>

                {/* Техника */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Техника исполнения</label>
                  <select 
                    value={designId} onChange={(e) => setDesignId(e.target.value)}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:border-primary outline-none appearance-none"
                  >
                    <option value="" className="bg-black">Любая техника...</option>
                    {options.designs.map(d => <option key={d.id} value={d.id} className="bg-black">{d.design}</option>)}
                  </select>
                </div>

                {/* Сюжет */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-300">Желаемый сюжет</label>
                  <select 
                    value={plotId} onChange={(e) => setPlotId(e.target.value)} required
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:border-primary outline-none appearance-none"
                  >
                    <option value="" className="bg-black">Выберите категорию сюжета...</option>
                    {options.plots.map(p => <option key={p.id} value={p.id} className="bg-black">{p.plot}</option>)}
                  </select>
                </div>

                {/* Оформление */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-300">Вариант оформления</label>
                  <select 
                    value={formatId} onChange={(e) => setFormatId(e.target.value)}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:border-primary outline-none appearance-none"
                  >
                    <option value="" className="bg-black">Без дополнительного оформления</option>
                    {options.formats.map(f => <option key={f.id} value={f.id} className="bg-black">{f.format}</option>)}
                  </select>
                </div>

                {/* Комментарий */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-300">Пожелания к работе</label>
                  <textarea 
                    value={comment} onChange={(e) => setComment(e.target.value)}
                    placeholder="Напишите, что именно вы хотите видеть на картине..."
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl h-32 focus:border-primary outline-none resize-none"
                  />
                </div>

                <button 
                  type="submit" disabled={submitLoading || !user}
                  className="md:col-span-2 w-full py-4 bg-primary rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  {submitLoading ? "Создаем заказ..." : `Оформить заказ за ${priceInfo.total} ₽`}
                </button>
                
                {error && <p className="text-red-400 text-center md:col-span-2">{error}</p>}
                {submitMessage && <p className="text-green-400 text-center md:col-span-2">{submitMessage}</p>}
              </form>
            </div>

            {/* ПРАВАЯ ЧАСТЬ: ЧЕК (ТВОЙ ДИЗАЙН) */}
            <div className="lg:col-span-5 flex items-start justify-center">
              <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                
                <h3 className="text-xl font-bold mb-6">Ваш заказ</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-gray-400 text-sm">
                    <span>Базовая стоимость:</span>
                    <span className="text-white font-medium">{priceInfo.base} ₽</span>
                  </div>
                  <div className="flex justify-between text-gray-400 text-sm">
                    <span>Доп. услуги и наценки:</span>
                    <span className="text-white font-medium">+{priceInfo.extra} ₽</span>
                  </div>
                  
                  <div className="h-[1px] bg-white/10 my-6"></div>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Итоговая цена</p>
                      <p className="text-4xl font-black text-primary mt-1">{priceInfo.total} ₽</p>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-primary/10 rounded-2xl border border-primary/20">
                    <p className="text-[11px] text-primary-light leading-relaxed">
                      * После оформления я свяжусь с вами для обсуждения деталей и вышлю счет на аванс (30%).
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}