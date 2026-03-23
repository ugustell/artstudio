import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function AdminLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка входа');
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_login', data.login);
      router.push('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Вход — ArtStudio Admin</title></Head>
      <div className="min-h-screen flex items-center justify-center px-6"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, #1e2a42 0%, #0b1326 70%)' }}>
        <div className="w-full max-w-md animate-fade-up">
          {/* Logo */}
          <div className="text-center mb-12">
            <div className="text-3xl font-serif font-black italic text-secondary tracking-widest">
              Art<span className="text-primary">Studio</span>
            </div>
            <div className="text-on-surface/40 text-sm mt-2 uppercase tracking-widest">Панель управления</div>
          </div>

          <form onSubmit={handleSubmit} className="glass p-10 rounded-xl space-y-8">
            <div>
              <label className="text-xs text-on-surface/50 uppercase tracking-widest block mb-3">Логин</label>
              <input type="text" value={form.login} onChange={e => setForm(p => ({ ...p, login: e.target.value }))}
                placeholder="admin" autoComplete="username" className="input-field" />
            </div>
            <div>
              <label className="text-xs text-on-surface/50 uppercase tracking-widest block mb-3">Пароль</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••" autoComplete="current-password" className="input-field" />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm text-center">{error}</div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-4 disabled:opacity-50">
              {loading ? 'Входим...' : 'Войти в панель'}
            </button>
          </form>

          <p className="text-center text-on-surface/20 text-xs mt-6">
            <a href="/" className="hover:text-on-surface/50 transition-colors">← Вернуться на сайт</a>
          </p>
        </div>
      </div>
    </>
  );
}
