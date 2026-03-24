import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const DENOMINATIONS = [
  { value: 4500,  label: '4 500 ₽',  desc: 'Небольшая картина 30×40 — портрет или натюрморт' },
  { value: 8500,  label: '8 500 ₽',  desc: 'Картина 50×70 — популярный размер для интерьера'  },
  { value: 14000, label: '14 000 ₽', desc: 'Большой пейзаж или портрет 70×100 см'             },
  { value: 25000, label: '25 000 ₽', desc: 'Крупная работа или парный портрет'                },
  { value: 0,     label: 'Своя сумма', desc: 'Введите любую сумму от 1 000 ₽'                  },
];

export default function CertificatesPage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    recipientName: '',
    denomination: 8500,
    customAmount: '',
    message: '',
  });
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState('');

  const amount = form.denomination === 0 ? Number(form.customAmount) : form.denomination;
  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) { setError('Заполните все обязательные поля.'); return; }
    if (amount < 1000) { setError('Минимальная сумма сертификата — 1 000 ₽.'); return; }
    setError('');
    setSent(true);
  };

  if (sent) return (
    <>
      <Head><title>Заявка принята — ArtStudio</title></Head>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-surface pt-20 px-6 pb-16">
        <div className="max-w-lg text-center animate-fade-up">
          <div className="text-7xl mb-8">🎁</div>
          <h1 className="font-serif text-4xl font-bold text-on-surface mb-4">Заявка принята!</h1>
          <p className="text-on-surface/60 mb-8 leading-relaxed">
            Свяжемся с вами в течение 1 рабочего дня для оформления и оплаты сертификата на{' '}
            <span className="text-primary font-bold">{amount.toLocaleString('ru-RU')} ₽</span>.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/" className="btn-outline">На главную</Link>
            <button onClick={() => setSent(false)} className="btn-primary">Ещё один</button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <Head>
        <title>Подарочные сертификаты — ArtStudio</title>
        <meta name="description" content="Подарите картину от художника. Подарочные сертификаты ArtStudio — уникальный подарок на любой случай." />
      </Head>
      <Navbar />

      <div className="min-h-screen bg-surface pt-28 pb-24">
        <div className="max-w-5xl mx-auto px-6 md:px-12">

          {/* Заголовок */}
          <div className="mb-16 animate-fade-up">
            <div className="section-label">Подарок</div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold tracking-tight text-on-surface">Подарочные сертификаты</h1>
            <p className="text-on-surface/50 mt-4 max-w-2xl text-lg">
              Подарите близкому человеку уникальную картину, написанную художником специально для него.
              Получатель сам выберет сюжет, технику и размер.
            </p>
          </div>

          {/* Что входит */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { icon: '🎨', title: 'Личный художник',    desc: 'Профессионал напишет картину по пожеланиям владельца сертификата' },
              { icon: '✏️', title: 'Эскиз и согласование', desc: 'Сначала эскиз — владелец вносит правки, потом начинается работа' },
              { icon: '🖼', title: 'Любая техника',       desc: 'Масло, акварель, акрил, пастель — на выбор получателя'           },
            ].map(f => (
              <div key={f.title} className="glass p-6 rounded-xl">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-serif text-lg font-bold text-on-surface mb-2">{f.title}</h3>
                <p className="text-on-surface/50 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">

            {/* Превью сертификата */}
            <div className="animate-fade-up">
              <div className="glass rounded-xl p-10 border border-secondary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-secondary/5 blur-3xl pointer-events-none" />

                <div className="text-center relative z-10">
                  <div className="text-secondary font-serif text-sm font-bold uppercase tracking-[0.3em] mb-6">Художественная мастерская</div>
                  <div className="font-serif text-4xl font-black italic text-secondary mb-1">Art<span className="text-primary">Studio</span></div>
                  <div className="text-on-surface/30 text-xs mb-10 tracking-widest uppercase">Подарочный сертификат</div>

                  <div className="font-serif text-6xl font-black text-on-surface mb-2">
                    {amount > 0 ? amount.toLocaleString('ru-RU') : '···'}
                    <span className="text-3xl text-secondary ml-2">₽</span>
                  </div>
                  <div className="text-on-surface/40 text-sm mb-10">на создание картины на заказ</div>

                  {form.recipientName && (
                    <div className="mb-8">
                      <div className="text-on-surface/30 text-xs uppercase tracking-widest mb-1">Для</div>
                      <div className="font-serif text-2xl text-on-surface italic">{form.recipientName}</div>
                    </div>
                  )}

                  {form.message && (
                    <div className="glass rounded-lg p-4 text-on-surface/60 text-sm italic text-left">
                      ❝ {form.message}
                    </div>
                  )}

                  <div className="mt-10 pt-6 border-t border-white/10 flex justify-between text-xs text-on-surface/25">
                    <span>Действителен 1 год</span>
                    <span>Не ограничен по технике и размеру</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 glass rounded-xl p-6">
                <div className="text-xs text-on-surface/40 uppercase tracking-widest mb-4">Как работает сертификат</div>
                <ol className="space-y-3 text-sm text-on-surface/60">
                  {[
                    'Вы оплачиваете сертификат — мы присылаем красивый PDF на почту',
                    'Получатель связывается с нами и описывает желаемую картину',
                    'Художник делает эскиз, обсуждает детали',
                    'Картина пишется и доставляется получателю',
                  ].map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="w-5 h-5 rounded-full border border-primary/40 flex items-center justify-center text-xs text-primary shrink-0 mt-0.5">{i+1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Форма */}
            <form onSubmit={handleSubmit} className="space-y-8 animate-fade-up" style={{ animationDelay: '150ms' }}>

              {/* Номинал */}
              <div className="glass p-8 rounded-xl">
                <h2 className="font-serif text-xl font-bold text-on-surface mb-6">Выберите номинал</h2>
                <div className="space-y-3">
                  {DENOMINATIONS.map(d => (
                    <label key={d.value}
                      className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all duration-200
                        ${form.denomination === d.value ? 'bg-secondary/15 border border-secondary/50' : 'glass hover:border-white/20'}`}>
                      <input type="radio" name="denomination" value={d.value}
                        checked={form.denomination === d.value}
                        onChange={() => setForm(p => ({ ...p, denomination: d.value }))}
                        className="accent-secondary" />
                      <div className="flex-1">
                        <div className={`font-bold ${form.denomination === d.value ? 'text-secondary' : 'text-on-surface'}`}>{d.label}</div>
                        <div className="text-xs text-on-surface/40 mt-0.5">{d.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {form.denomination === 0 && (
                  <div className="mt-4">
                    <input type="number" name="customAmount" value={form.customAmount} onChange={handleChange}
                      min="1000" placeholder="Введите сумму в рублях"
                      className="w-full bg-transparent border-b border-secondary/40 py-3 text-on-surface placeholder-on-surface/30 focus:outline-none focus:border-secondary transition-colors" />
                  </div>
                )}
              </div>

              {/* Данные покупателя */}
              <div className="glass p-8 rounded-xl">
                <h2 className="font-serif text-xl font-bold text-on-surface mb-6">Ваши данные</h2>
                <div className="space-y-6">
                  {[
                    { name: 'name',  label: 'Ваше имя *',   type: 'text',  ph: 'Иванова Марина' },
                    { name: 'email', label: 'Email *',       type: 'email', ph: 'you@example.com' },
                    { name: 'phone', label: 'Телефон *',     type: 'tel',   ph: '+7 900 000-00-00' },
                    { name: 'recipientName', label: 'Имя получателя (для сертификата)', type: 'text', ph: 'Александра' },
                  ].map(f => (
                    <div key={f.name}>
                      <label className="text-xs text-on-surface/50 uppercase tracking-widest block mb-2">{f.label}</label>
                      <input type={f.type} name={f.name} value={form[f.name]} onChange={handleChange}
                        placeholder={f.ph} className="input-field" />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs text-on-surface/50 uppercase tracking-widest block mb-2">Пожелание получателю</label>
                    <textarea name="message" value={form.message} onChange={handleChange} rows={3}
                      placeholder="Текст, который будет на сертификате — поздравление или пожелание"
                      className="w-full bg-transparent border-b border-on-surface/20 py-3 text-on-surface placeholder-on-surface/30 focus:outline-none focus:border-secondary transition-colors resize-none text-sm" />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">⚠ {error}</div>
              )}

              <button type="submit" className="btn-primary w-full justify-center text-lg py-5">
                Заказать сертификат на {amount > 0 ? `${amount.toLocaleString('ru-RU')} ₽` : '…'} →
              </button>
              <p className="text-center text-on-surface/25 text-xs">Оплата — после подтверждения заявки менеджером</p>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
