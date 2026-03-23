import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const DENOMINATIONS = [
  { value: 1500,  label: '1 500 ₽',  desc: 'Миниатюра 20×30 или 30×40 без оформления' },
  { value: 2500,  label: '2 500 ₽',  desc: 'Картина 40×60 на холсте' },
  { value: 3500,  label: '3 500 ₽',  desc: 'Полотно 50×70 или 40×60 в раме' },
  { value: 5000,  label: '5 000 ₽',  desc: 'Большая картина 70×100 или модульная' },
  { value: 0,     label: 'Своя сумма', desc: 'Введите любую сумму от 500 ₽' },
];

export default function CertificatesPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', recipientName: '', denomination: 2500, customAmount: '', message: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const amount = form.denomination === 0 ? Number(form.customAmount) : form.denomination;

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) { setError('Заполните все обязательные поля.'); return; }
    if (amount < 500) { setError('Минимальная сумма сертификата — 500 ₽.'); return; }
    setError('');
    // В реальном проекте — POST на /api/certificates
    setSent(true);
  };

  if (sent) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-surface pt-20 px-6">
          <div className="max-w-lg text-center">
            <div className="text-7xl mb-8">🎁</div>
            <h1 className="font-serif text-4xl font-bold text-on-surface mb-4">Заявка принята!</h1>
            <p className="text-on-surface/60 mb-8 leading-relaxed">
              Мы свяжемся с вами в течение 1 рабочего дня для оформления и оплаты сертификата на{' '}
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
  }

  return (
    <>
      <Head>
        <title>Подарочные сертификаты — ArtStudio</title>
        <meta name="description" content="Подарите картину на холсте. Подарочные сертификаты ArtStudio — идеальный подарок для близких." />
      </Head>
      <Navbar />

      <div className="min-h-screen bg-surface pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-6 md:px-12">

          {/* Заголовок */}
          <div className="mb-16 animate-fade-up">
            <div className="section-label">Подарки</div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold tracking-tight text-on-surface">
              Подарочные сертификаты
            </h1>
            <p className="text-on-surface/50 mt-4 max-w-xl">
              Подарите близкому человеку возможность создать картину из любимого фото. Сертификат не ограничен сроком действия.
            </p>
          </div>

          {/* Почему сертификат */}
          <div className="grid sm:grid-cols-3 gap-6 mb-16">
            {[
              ['🎨', 'Уникальный подарок', 'Не повторяющийся — именно то фото и именно тот формат, который выберет получатель.'],
              ['♾', 'Без срока действия', 'Сертификат действует бессрочно — получатель воспользуется когда удобно.'],
              ['📬', 'Доставка или email', 'Отправляем электронную версию на почту или распечатанный вариант в красивом конверте.'],
            ].map(([icon, title, text]) => (
              <div key={title} className="glass rounded p-8 text-center">
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="font-serif font-bold text-on-surface mb-3">{title}</h3>
                <p className="text-on-surface/50 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-12">

            {/* Форма */}
            <div>
              <h2 className="font-serif text-2xl font-bold text-on-surface mb-8">Оформить сертификат</h2>

              <form onSubmit={handleSubmit} className="space-y-8">

                {/* Номинал */}
                <div>
                  <label className="section-label text-[10px]">Номинал сертификата *</label>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {DENOMINATIONS.map(d => (
                      <label key={d.value}
                        className={`cursor-pointer glass rounded p-4 transition-all duration-200 border ${
                          form.denomination === d.value ? 'border-secondary/50 bg-secondary/10' : 'border-transparent hover:border-white/20'
                        }`}>
                        <input type="radio" name="denomination" value={d.value}
                          checked={form.denomination === d.value}
                          onChange={() => setForm(p => ({ ...p, denomination: d.value }))}
                          className="sr-only" />
                        <div className="font-bold text-secondary text-lg">{d.label}</div>
                        <div className="text-on-surface/40 text-xs mt-1">{d.desc}</div>
                      </label>
                    ))}
                  </div>
                  {form.denomination === 0 && (
                    <input name="customAmount" value={form.customAmount} onChange={handleChange}
                      className="input-field mt-4" placeholder="Введите сумму, например 2000" type="number" min="500" />
                  )}
                </div>

                {/* Данные покупателя */}
                <div className="glass rounded p-6 space-y-5">
                  <h3 className="font-serif font-bold text-on-surface">Ваши данные</h3>
                  <div>
                    <label className="section-label text-[10px]">Имя *</label>
                    <input name="name" value={form.name} onChange={handleChange}
                      className="input-field" placeholder="Ваше имя" />
                  </div>
                  <div>
                    <label className="section-label text-[10px]">Email *</label>
                    <input name="email" value={form.email} onChange={handleChange}
                      className="input-field" placeholder="your@email.ru" type="email" />
                  </div>
                  <div>
                    <label className="section-label text-[10px]">Телефон *</label>
                    <input name="phone" value={form.phone} onChange={handleChange}
                      className="input-field" placeholder="+7 900 000-00-00" type="tel" />
                  </div>
                </div>

                {/* Данные получателя (необязательно) */}
                <div className="glass rounded p-6 space-y-5">
                  <h3 className="font-serif font-bold text-on-surface">
                    Получатель <span className="text-on-surface/30 text-sm font-normal">(необязательно)</span>
                  </h3>
                  <div>
                    <label className="section-label text-[10px]">Имя получателя</label>
                    <input name="recipientName" value={form.recipientName} onChange={handleChange}
                      className="input-field" placeholder="Кому предназначен подарок?" />
                  </div>
                  <div>
                    <label className="section-label text-[10px]">Пожелание на сертификате</label>
                    <textarea name="message" value={form.message} onChange={handleChange}
                      className="input-field resize-none" rows={3}
                      placeholder="Дорогой Маше, с днём рождения! ❤️" />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded p-3">
                    {error}
                  </div>
                )}

                <button type="submit" className="btn-primary w-full justify-center">
                  Оформить сертификат на {amount >= 500 ? amount.toLocaleString('ru-RU') + ' ₽' : '...'}
                </button>
              </form>
            </div>

            {/* Превью сертификата */}
            <div>
              <h2 className="font-serif text-2xl font-bold text-on-surface mb-8">Как выглядит</h2>

              {/* Карточка-превью */}
              <div className="aspect-[16/10] rounded overflow-hidden relative mb-6"
                style={{ background: 'linear-gradient(135deg, #131b2e 0%, #0b1326 100%)', border: '1px solid rgba(233,195,73,0.3)' }}>
                <div className="absolute top-4 left-6 w-px h-16 bg-secondary/50" />
                <div className="absolute top-4 left-7 w-16 h-px bg-secondary/50" />
                <div className="absolute bottom-4 right-6 w-px h-16 bg-secondary/50" />
                <div className="absolute bottom-4 right-7 w-16 h-px bg-secondary/50" />

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <div className="text-xs text-secondary/70 uppercase tracking-[0.3em] mb-3">Подарочный сертификат</div>
                  <div className="font-serif text-4xl font-black italic text-secondary mb-1">ArtStudio</div>
                  <div className="text-xs text-on-surface/30 mb-6">Картины на холсте под заказ</div>
                  <div className="font-serif text-3xl font-bold text-primary mb-4">
                    {amount >= 500 ? amount.toLocaleString('ru-RU') + ' ₽' : '_ _ _ _ ₽'}
                  </div>
                  {form.recipientName && (
                    <div className="text-on-surface/60 text-sm">для {form.recipientName}</div>
                  )}
                  {form.message && (
                    <div className="text-on-surface/40 text-xs mt-2 italic max-w-xs">«{form.message}»</div>
                  )}
                  <div className="text-on-surface/20 text-xs mt-6">Срок действия не ограничен</div>
                </div>
              </div>

              <div className="space-y-4 text-sm text-on-surface/50">
                <p>💌 После оформления и оплаты мы пришлём PDF-сертификат на вашу почту в течение нескольких часов.</p>
                <p>🖨 По желанию можем распечатать и отправить в красивом конверте (+150 ₽ за конверт + доставка).</p>
                <p>✅ Получатель использует сертификат при оформлении заказа — просто назовёт номер при оплате.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
