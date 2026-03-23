import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

const links = [
  { href: '/#about',       label: 'О нас'        },
  { href: '/prices',       label: 'Прайс'        },
  { href: '/faq',          label: 'FAQ'           },
  { href: '/certificates', label: 'Сертификаты'  },
  { href: '/#contacts',    label: 'Контакты'     },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout }        = useAuth();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-surface/80 backdrop-blur-xl shadow-[0_16px_48px_rgba(11,19,38,0.8)]' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between h-20">

        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-serif font-black italic text-secondary tracking-widest group-hover:text-primary transition-colors duration-300">
            Art<span className="text-primary group-hover:text-secondary transition-colors duration-300">Studio</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-10">
          {links.map(l => (
            <Link key={l.href} href={l.href} className="text-sm font-semibold text-on-surface/60 hover:text-secondary transition-colors duration-300 tracking-wide">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/account" className="text-sm text-on-surface/60 hover:text-secondary transition-colors flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center text-secondary text-xs font-bold">
                  {user.name?.[0]?.toUpperCase() || 'У'}
                </span>
                {user.name?.split(' ')[0]}
              </Link>
              <Link href="/order" className="btn-primary text-sm">Новый заказ</Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-on-surface/60 hover:text-secondary transition-colors font-medium">Войти</Link>
              <Link href="/order" className="btn-primary text-sm">Сделать заказ</Link>
            </>
          )}
        </div>

        {/* Burger */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-on-surface/70 hover:text-primary transition-colors">
          <div className={`w-6 h-0.5 bg-current transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
          <div className={`w-6 h-0.5 bg-current my-1.5 transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
          <div className={`w-6 h-0.5 bg-current transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden transition-all duration-500 overflow-hidden ${menuOpen ? 'max-h-[500px]' : 'max-h-0'}`}>
        <div className="glass px-6 pb-6 pt-2 flex flex-col gap-3">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              className="text-on-surface/70 hover:text-secondary transition-colors py-2 border-b border-white/5 text-sm">
              {l.label}
            </Link>
          ))}
          {user ? (
            <Link href="/account" onClick={() => setMenuOpen(false)} className="text-secondary font-medium py-2 text-sm">👤 {user.name}</Link>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)} className="text-on-surface/60 py-2 text-sm">Войти</Link>
          )}
          <Link href="/order" onClick={() => setMenuOpen(false)} className="btn-primary text-center mt-2 text-sm">Сделать заказ</Link>
        </div>
      </div>
    </nav>
  );
}
