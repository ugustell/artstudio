import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(''); };
  const API = process.env.NEXT_PUBLIC_API_URL;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return setError('Заполните все поля');
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/users/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email, password: form.password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      login(data.token, data.user);
      router.push(router.query.redirect || '/account');
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.email || !form.password) return setError('Заполните все поля');
    if (form.password !== form.confirm) return setError('Пароли не совпадают');
    if (form.password.length < 6) return setError('Пароль — минимум 6 символов');
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/users/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, phone: form.phone, email: form.email, password: form.password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      login(data.token, data.user);
      router.push('/account');
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <>
      <Head><title>{tab === 'login' ? 'Вход' : 'Регистрация'} — ArtStudio</title></Head>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, #1e2a42 0%, #0b1326 70%)' }}>
        <div className="w-full max-w-md animate-fade-up">
          <div className="text-center mb-10">
            <h1 className="font-serif text-4xl font-black text-on-surface">
              {tab === 'login' ? 'Добро пожаловать' : 'Создать аккаунт'}
            </h1>
            <p className="text-on-surface/50 mt-2">
              {tab === 'login' ? 'Войдите, чтобы видеть свои заказы' : 'Регистрация займёт меньше минуты'}
            </p>
          </div>

          {/* Tabs */}
          <div className="glass rounded-xl p-1 flex mb-8">
            {[['login','Вход'], ['register','Регистрация']].map(([v, l]) => (
              <button key={v} onClick={() => { setTab(v); setError(''); }}
                className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all duration-200
                  ${tab === v ? 'bg-primary text-on-primary' : 'text-on-surface/50 hover:text-on-surface'}`}>
                {l}
              </button>
            ))}
          </div>

          <div className="glass p-8 rounded-xl">
            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="text-xs text-on-surface/40 uppercase tracking-widest block mb-2">Email</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="you@example.com" className="input-field" autoComplete="email" />
                </div>
                <div>
                  <label className="text-xs text-on-surface/40 uppercase tracking-widest block mb-2">Пароль</label>
                  <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                    placeholder="••••••••" className="input-field" autoComplete="current-password" />
                </div>
                {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-lg p-3">{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-4 disabled:opacity-50">
                  {loading ? 'Входим...' : 'Войти →'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="text-xs text-on-surface/40 uppercase tracking-widest block mb-2">Имя и фамилия</label>
                  <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="Иванова Марина" className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-on-surface/40 uppercase tracking-widest block mb-2">Телефон</label>
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                    placeholder="+7 900 000-00-00" className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-on-surface/40 uppercase tracking-widest block mb-2">Email</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="you@example.com" className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-on-surface/40 uppercase tracking-widest block mb-2">Пароль</label>
                  <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                    placeholder="Минимум 6 символов" className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-on-surface/40 uppercase tracking-widest block mb-2">Повторите пароль</label>
                  <input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)}
                    placeholder="••••••••" className="input-field" />
                </div>
                {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-lg p-3">{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-4 disabled:opacity-50">
                  {loading ? 'Регистрируемся...' : 'Создать аккаунт →'}
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-on-surface/30 text-xs mt-6">
            <Link href="/" className="hover:text-on-surface/60 transition-colors">← Вернуться на сайт</Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
