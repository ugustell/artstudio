import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const features = [
  { icon: '◈', color: 'text-primary',   bg: 'group-hover:bg-primary',   title: 'Giclée-печать',      desc: 'Профессиональная струйная печать с разрешением 1440 dpi на натуральном хлопковом холсте. Цвета остаются живыми десятилетиями.' },
  { icon: '◉', color: 'text-secondary', bg: 'group-hover:bg-secondary', title: 'Любой размер',       desc: 'От миниатюры 20×30 до монументального полотна 120×160 см. Подбираем формат под ваш интерьер и бюджет.' },
  { icon: '◎', color: 'text-tertiary',  bg: 'group-hover:bg-tertiary',  title: 'Архивное качество',  desc: 'Краски на пигментной основе, UV-защитный лак, натуральный подрамник из сосны — срок службы более 75 лет.' },
];

const steps = [
  { num: '01', title: 'Загрузите фото',  desc: 'Принимаем JPEG, PNG, TIFF. Чем выше разрешение — тем лучше результат. Ретушёры помогут улучшить качество.' },
  { num: '02', title: 'Выберите формат', desc: 'Размер, вид оформления (рамка / подрамник / без), тип цветовой обработки.' },
  { num: '03', title: 'Мы печатаем',     desc: 'Производство занимает 1–3 рабочих дня. Срочный заказ готов за 24 часа.' },
  { num: '04', title: 'Доставка',        desc: 'Бережная упаковка и доставка по всей России. Самовывоз из Тольятти — бесплатно.' },
];

const testimonials = [
  { name: 'Марина И.',  text: 'Заказала портрет мамы на юбилей. Качество превзошло ожидания — цвета яркие, детали чёткие. Все гости были в восторге!',          size: '50×70 см'   },
  { name: 'Алексей П.', text: 'Уже третий раз заказываю пейзажи для офиса. Всегда точно в срок, аккуратная упаковка. Рекомендую всем.',                         size: '80×120 см'  },
  { name: 'Ольга С.',   text: 'Подарила мужу на годовщину — сделали срочный заказ, уложились за один день! Рамка красивая, всё идеально упаковано.',              size: '40×60 см'   },
];

function FadeIn({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.12 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}
      style={{ transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
               opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)' }}>
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Head>
        <title>ArtStudio — Картины на холсте под заказ</title>
        <meta name="description" content="Профессиональная Giclée-печать на холсте. Любой размер, любой сюжет. Доставка по всей России." />
      </Head>
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-24 overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 70% 40%, #1e2a42 0%, #0b1326 60%)' }}>
        <div className="absolute top-24 right-[8%] w-56 h-72 bg-surface-container border border-white/10 rotate-6 animate-float rounded-lg overflow-hidden hidden lg:block opacity-60">
          <img src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=80" alt="" className="w-full h-full object-cover grayscale" />
        </div>
        <div className="absolute bottom-24 left-[4%] w-40 h-52 bg-surface-container border border-white/10 -rotate-12 animate-float-delayed rounded-lg overflow-hidden hidden lg:block opacity-40">
          <img src="https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=300&q=80" alt="" className="w-full h-full object-cover grayscale" />
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full relative z-10">
          <div className="max-w-3xl">
            <div className="section-label animate-fade-up">Производство · Тольятти</div>
            <h1 className="font-serif text-5xl md:text-8xl font-black tracking-tight leading-none mb-8 text-on-surface animate-fade-up" style={{ animationDelay: '100ms' }}>
              Ваше фото —<br /><span className="text-primary" style={{ textShadow: '0 0 60px rgba(255,180,165,0.25)' }}>на холсте</span>
            </h1>
            <p className="text-on-surface/60 text-xl leading-relaxed mb-12 max-w-xl animate-fade-up" style={{ animationDelay: '200ms' }}>
              Giclée-печать высокого разрешения. Любой размер, любой сюжет. Готово за 1–3 дня, доставка по всей России.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{ animationDelay: '300ms' }}>
              <Link href="/order" className="btn-primary text-base">Сделать заказ →</Link>
              <Link href="/prices" className="btn-outline text-base">Открыть прайс</Link>
            </div>
            <div className="mt-20 flex flex-wrap gap-12 animate-fade-up" style={{ animationDelay: '400ms' }}>
              {[['1200+', 'картин выполнено'], ['3 дня', 'срок изготовления'], ['75 лет', 'гарантия качества']].map(([n, l]) => (
                <div key={l}>
                  <div className="text-3xl font-serif font-black text-secondary">{n}</div>
                  <div className="text-xs text-on-surface/40 mt-1 tracking-wide uppercase">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface to-transparent" />
      </section>

      {/* О НАС */}
      <section id="about" className="py-40 bg-surface relative overflow-hidden">
        <div className="absolute -right-16 top-0 text-[16rem] font-black text-white/[0.025] font-serif leading-none select-none pointer-events-none">ART</div>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <FadeIn>
              <div className="relative">
                <div className="aspect-[4/5] bg-white/5 p-4 rounded-lg transform -rotate-2 hover:rotate-0 transition-transform duration-700">
                  <img src="https://images.unsplash.com/photo-1581619460462-1c3e5a3f03b5?w=700&q=85" alt="Студия" className="w-full h-full object-cover rounded grayscale hover:grayscale-0 transition-all duration-1000" />
                </div>
                <div className="glass absolute -bottom-8 -right-8 p-6 rounded-lg hidden lg:block max-w-[220px]">
                  <div className="text-4xl font-serif font-black text-primary mb-1">2019</div>
                  <div className="text-xs text-on-surface/50 leading-relaxed">Работаем с 2019 года. Более 1200 довольных клиентов</div>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={150}>
              <div className="section-label">01 / О компании</div>
              <h2 className="font-serif text-5xl font-bold tracking-tight mb-8 leading-tight text-on-surface">Мастерская для тех, кто ценит детали</h2>
              <div className="space-y-5 text-on-surface/55 text-lg leading-relaxed">
                <p>Специализируемся на производстве картин на холсте методом Giclée — технологии, которую используют ведущие галереи мира для архивного воспроизведения произведений искусства.</p>
                <p>Каждый заказ проходит ручной контроль качества. Только сертифицированные материалы: хлопковый холст, пигментные чернила, натуральная сосна для подрамника.</p>
                <p>Принимаем файлы в любом формате. Если разрешение недостаточное — наши ретушёры улучшат изображение перед печатью.</p>
              </div>
              <div className="mt-10 flex gap-6">
                <Link href="/order" className="btn-primary">Заказать картину</Link>
                <Link href="/faq" className="btn-outline">Частые вопросы</Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ПРЕИМУЩЕСТВА */}
      <section className="py-32 bg-surface-container">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <FadeIn className="text-center mb-20">
            <div className="section-label">02 / Почему мы</div>
            <h2 className="font-serif text-5xl font-bold tracking-tight text-on-surface">Безупречность в деталях</h2>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 120}>
                <div className="glass p-10 rounded-lg hover:border-primary/30 transition-all duration-500 group h-full">
                  <div className={`w-14 h-14 flex items-center justify-center rounded-full bg-white/5 ${f.bg} transition-colors duration-500 mb-8 text-2xl ${f.color}`}>{f.icon}</div>
                  <h3 className="font-serif text-2xl font-bold mb-4 text-on-surface">{f.title}</h3>
                  <p className="text-on-surface/50 leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* КАК РАБОТАЕМ */}
      <section className="py-40 bg-surface">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <FadeIn className="mb-20">
            <div className="section-label">03 / Процесс</div>
            <h2 className="font-serif text-5xl font-bold tracking-tight text-on-surface max-w-xl">Как мы работаем</h2>
          </FadeIn>
          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            {steps.map((s, i) => (
              <FadeIn key={s.num} delay={i * 100}>
                <div className="relative">
                  <div className="text-[4rem] font-serif font-black text-white/[0.04] leading-none mb-4 -ml-2">{s.num}</div>
                  <div className="w-16 h-16 rounded-full border border-primary/30 flex items-center justify-center text-primary font-bold mb-6 bg-surface">{i + 1}</div>
                  <h3 className="font-serif text-xl font-bold mb-3 text-on-surface">{s.title}</h3>
                  <p className="text-on-surface/50 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ЦЕНЫ ПРЕВЬЮ */}
      <section className="py-32 bg-surface-container" id="pricing">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <FadeIn className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <div className="section-label">04 / Цены</div>
              <h2 className="font-serif text-5xl font-bold tracking-tight text-on-surface">Прозрачное ценообразование</h2>
            </div>
            <Link href="/prices" className="btn-outline self-start">Открыть полный прайс →</Link>
          </FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[{ size: '30×40 см', price: '1 300 ₽', pop: false }, { size: '40×60 см', price: '1 800 ₽', pop: true }, { size: '50×70 см', price: '2 200 ₽', pop: false }, { size: '70×100 см', price: '3 500 ₽', pop: false }].map(item => (
              <FadeIn key={item.size}>
                <div className={`p-8 rounded-lg text-center transition-all duration-300 ${item.pop ? 'bg-primary text-on-primary shadow-[0_24px_48px_rgba(255,180,165,0.2)] md:-translate-y-4' : 'glass hover:border-secondary/30'}`}>
                  {item.pop && <div className="text-xs font-bold uppercase tracking-widest mb-4 opacity-70">Популярный</div>}
                  <div className={`font-serif text-3xl font-black mb-2 ${item.pop ? 'text-on-primary' : 'text-secondary'}`}>{item.price}</div>
                  <div className={`text-sm ${item.pop ? 'text-on-primary/70' : 'text-on-surface/50'}`}>{item.size}</div>
                </div>
              </FadeIn>
            ))}
          </div>
          <p className="text-center text-on-surface/40 text-sm mt-8">Цены указаны за печать без оформления. Рамка / подрамник — от 500 ₽</p>
        </div>
      </section>

      {/* ДОСТАВКА */}
      <section className="py-32 bg-surface" id="delivery">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <FadeIn className="mb-16">
            <div className="section-label">05 / Доставка</div>
            <h2 className="font-serif text-5xl font-bold tracking-tight text-on-surface">Довезём в целости</h2>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '◈', title: 'Упаковка',     desc: 'Стрейч-плёнка, пузырчатая упаковка, плотный картон, угловые уголки. Картина доедет без единой царапины.', color: 'text-primary' },
              { icon: '◉', title: 'По России',    desc: 'Отправляем СДЭК, Почтой России, Boxberry. Доставка 2–7 дней. Трек-номер сообщаем в день отправки.', color: 'text-secondary' },
              { icon: '◎', title: 'Самовывоз',    desc: 'Бесплатный самовывоз из нашей мастерской в Тольятти. Адрес и часы работы — в разделе Контакты.', color: 'text-tertiary' },
            ].map((d, i) => (
              <FadeIn key={d.title} delay={i * 100}>
                <div className="glass p-10 rounded-lg h-full">
                  <div className={`text-3xl mb-6 ${d.color}`}>{d.icon}</div>
                  <h3 className="font-serif text-2xl font-bold mb-4 text-on-surface">{d.title}</h3>
                  <p className="text-on-surface/50 leading-relaxed">{d.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ОТЗЫВЫ */}
      <section className="py-32 bg-surface-container">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <FadeIn className="mb-16 text-center">
            <div className="section-label">06 / Отзывы</div>
            <h2 className="font-serif text-5xl font-bold tracking-tight text-on-surface">Нам доверяют</h2>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <FadeIn key={t.name} delay={i * 120}>
                <div className="glass p-8 rounded-lg h-full flex flex-col">
                  <div className="text-secondary text-2xl mb-4">❝</div>
                  <p className="text-on-surface/70 leading-relaxed flex-1 mb-6">{t.text}</p>
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-on-surface text-sm">{t.name}</div>
                    <div className="text-xs text-on-surface/40 bg-white/5 px-3 py-1 rounded-full">{t.size}</div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-40 bg-surface relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,180,165,0.06) 0%, transparent 70%)' }} />
        </div>
        <FadeIn className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <div className="section-label">07 / Начнём</div>
          <h2 className="font-serif text-6xl md:text-7xl font-black tracking-tight text-on-surface mb-6 leading-none">
            Ваша история —<br /><span className="text-primary">на стене</span>
          </h2>
          <p className="text-on-surface/50 text-xl mb-12">Загрузите фото и получите картину уже через 3 дня</p>
          <Link href="/order" className="btn-primary text-lg px-12 py-5">Создать картину →</Link>
        </FadeIn>
      </section>

      {/* КОНТАКТЫ */}
      <section id="contacts" className="py-32 bg-surface-container">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="glass rounded-xl overflow-hidden grid md:grid-cols-2">
            <div className="p-16">
              <div className="section-label">08 / Контакты</div>
              <h2 className="font-serif text-4xl font-bold mb-10 text-on-surface">Свяжитесь с нами</h2>
              <ul className="space-y-8">
                {[
                  { icon: '✉', label: 'Email',          val: 'info@artstudio.ru',     href: 'mailto:info@artstudio.ru', color: 'text-primary'   },
                  { icon: '✆', label: 'Телефон',        val: '8 800 123-45-67',       href: 'tel:+78001234567',         color: 'text-secondary' },
                  { icon: '⌚', label: 'Режим работы',  val: 'Пн–Пт: 9:00–18:00',    href: null,                       color: 'text-tertiary'  },
                  { icon: '◎', label: 'Адрес',          val: 'Тольятти, ул. Победы, 32', href: null,                   color: 'text-primary'   },
                ].map(c => (
                  <li key={c.label} className="flex items-start gap-6 group">
                    <div className={`w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0 ${c.color} group-hover:scale-110 transition-transform`}>{c.icon}</div>
                    <div>
                      <div className="text-xs text-on-surface/40 uppercase tracking-widest mb-1">{c.label}</div>
                      {c.href
                        ? <a href={c.href} className="text-on-surface hover:text-secondary transition-colors font-medium">{c.val}</a>
                        : <span className="text-on-surface font-medium">{c.val}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative min-h-[400px] hidden md:block">
              <img src="https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&q=80" alt="Мастерская" className="w-full h-full object-cover opacity-30 grayscale" />
              <div className="absolute inset-0 bg-gradient-to-r from-surface-container via-transparent to-transparent" />
              <div className="absolute bottom-12 right-12 text-right">
                <div className="font-serif text-6xl font-black text-white/10">ART</div>
                <div className="font-serif text-6xl font-black text-white/10 -mt-4">STUDIO</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
