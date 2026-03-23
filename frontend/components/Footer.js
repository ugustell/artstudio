import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-surface-container border-t border-white/5 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="text-2xl font-serif font-black italic text-secondary tracking-widest mb-4">
              Art<span className="text-primary">Studio</span>
            </div>
            <p className="text-on-surface/50 text-sm leading-relaxed max-w-xs">
              Картины на холсте под заказ — Giclée-печать высокого разрешения, архивные материалы, бережная упаковка.
            </p>
          </div>
          <div>
            <div className="section-label">Разделы</div>
            <ul className="space-y-2 text-sm text-on-surface/50">
              {[['/', 'Главная'], ['/prices', 'Прайс'], ['/order', 'Сделать заказ'],
                ['/faq', 'Вопрос–Ответ'], ['/certificates', 'Сертификаты']].map(([h, l]) => (
                <li key={h}><Link href={h} className="hover:text-secondary transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="section-label">Контакты</div>
            <ul className="space-y-3 text-sm text-on-surface/50">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✉</span>
                <a href="mailto:info@artstudio.ru" className="hover:text-secondary transition-colors">info@artstudio.ru</a>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✆</span>
                <a href="tel:+78001234567" className="hover:text-secondary transition-colors">8 800 123-45-67</a>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-secondary mt-0.5">◎</span>
                <span>Тольятти, ул. Победы, 32</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-on-surface/30">
          <span>© {new Date().getFullYear()} ArtStudio. Все права защищены.</span>
          <Link href="/admin/login" className="hover:text-primary transition-colors">Панель управления</Link>
        </div>
      </div>
    </footer>
  );
}
