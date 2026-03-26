import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

const STATUS_MAP = {
  new:         { label: 'Принят',      color: 'text-primary',   bg: 'bg-primary/10'   },
  in_progress: { label: 'В работе',    color: 'text-secondary', bg: 'bg-secondary/10' },
  ready:       { label: 'Готов',       color: 'text-tertiary',  bg: 'bg-tertiary/10'  },
  delivered:   { label: 'Доставлен',   color: 'text-green-400', bg: 'bg-green-500/10' },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, color: 'text-on-surface/50', bg: 'bg-white/5' };
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${s.bg} ${s.color}`}>{s.label}</span>;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}

function displayRef(val, preferredKeys = []) {
  if (!val) return '—';
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    for (const k of preferredKeys) {
      if (val[k] !== undefined && val[k] !== null) return String(val[k]);
    }
  }
  return '—';
}

export default function AccountPage() {
  const router          = useRouter();
  const { user, token, ready, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // orders | profile
  const [profile, setProfile]   = useState({ name: '', phone: '', address: '' });
  const [saveMsg, setSaveMsg]   = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const API = process.env.NEXT_PUBLIC_API_URL;

  // Редирект если не авторизован
  useEffect(() => {
    if (ready && !user) router.replace('/login?redirect=/account');
  }, [ready, user]);

  // Загрузка заказов
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/users/my-orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setOrders(Array.isArray(data) ? data : []); })
      .finally(() => setLoading(false));
  }, [token]);

  // Заполнить форму профиля
  useEffect(() => {
    if (user) setProfile({ name: user.name || '', phone: user.phone || '', address: user.address || '' });
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const res  = await fetch(`${API}/api/users/me`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(profile) });
      const data = await res.json();
      if (res.ok) { setSaveMsg('Сохранено!'); setTimeout(() => setSaveMsg(''), 3000); }
    } catch { setSaveMsg('Ошибка сохранения'); }
  };

  const handleLogout = () => { logout(); router.push('/'); };

  if (!ready || !user) return null;

  // Статистика заказов
  const stats = {
    total:    orders.length,
    active:   orders.filter(o => ['new','in_progress'].includes(o.status)).length,
    ready:    orders.filter(o => o.status === 'ready').length,
    spent:    orders.reduce((s, o) => s + (o.totalPrice || 0), 0),
  };

  return (
    <>
      <Head><title>Личный кабинет — ArtStudio</title></Head>
      <Navbar />

      <div className="min-h-screen pt-28 pb-24 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 animate-fade-up">
            <div>
              <div className="section-label">Личный кабинет</div>
              <h1 className="font-serif text-4xl font-black text-on-surface mt-1">{user.name}</h1>
              <p className="text-on-surface/40 text-sm mt-1">{user.email}</p>
            </div>
            <div className="flex gap-3">
              <Link href="/order" className="btn-primary text-sm">+ Новый заказ</Link>
              <button onClick={handleLogout} className="text-sm px-4 py-2 glass rounded-lg text-on-surface/50 hover:text-red-400 transition-colors">Выйти</button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 animate-fade-up" style={{ animationDelay: '100ms' }}>
            {[
              { label: 'Всего заказов',  val: stats.total,                                 color: 'text-on-surface' },
              { label: 'Активных',       val: stats.active,                                color: 'text-secondary'  },
              { label: 'Готово к выдаче',val: stats.ready,                                 color: 'text-tertiary'   },
              { label: 'Потрачено',      val: `${stats.spent.toLocaleString('ru-RU')} ₽`,  color: 'text-primary'    },
            ].map(s => (
              <div key={s.label} className="glass rounded-xl p-5">
                <div className={`text-2xl md:text-3xl font-serif font-black mb-1 ${s.color}`}>{s.val}</div>
                <div className="text-xs text-on-surface/40 uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="glass rounded-xl p-1 flex mb-8 max-w-xs animate-fade-up" style={{ animationDelay: '150ms' }}>
            {[['orders','Мои заказы'], ['profile','Профиль']].map(([v, l]) => (
              <button key={v} onClick={() => setActiveTab(v)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                  ${activeTab === v ? 'bg-secondary text-surface' : 'text-on-surface/50 hover:text-on-surface'}`}>
                {l}
              </button>
            ))}
          </div>

          {/* ── Заказы ── */}
          {activeTab === 'orders' && (
            <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
              {loading ? (
                <div className="glass rounded-xl p-16 text-center text-on-surface/40">Загружаем заказы...</div>
              ) : orders.length === 0 ? (
                <div className="glass rounded-xl p-16 text-center">
                  <div className="text-on-surface/20 text-5xl mb-4">🖼</div>
                  <p className="text-on-surface/50 mb-6">У вас пока нет заказов</p>
                  <Link href="/order" className="btn-primary">Сделать первый заказ</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map(order => (
                    <div key={order.id} onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                      className="glass rounded-xl p-5 cursor-pointer hover:border-secondary/30 transition-all duration-200 group">
                      {/* Компактная строка */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-on-surface/30 text-sm shrink-0 group-hover:border-secondary/40 transition-colors">
                            #{order.id}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-on-surface text-sm truncate">
                              {displayRef(order.size, ['size', 'name', 'label'])} · {displayRef(order.format, ['format', 'name', 'label'])}
                            </div>
                            <div className="text-on-surface/40 text-xs mt-0.5">{formatDate(order.createdAt)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-secondary font-bold text-sm">{order.totalPrice?.toLocaleString('ru-RU')} ₽</div>
                          <StatusBadge status={order.status} />
                          <div className={`text-on-surface/30 transition-transform duration-200 ${selectedOrder?.id === order.id ? 'rotate-180' : ''}`}>▼</div>
                        </div>
                      </div>

                      {/* Раскрытые детали */}
                      {selectedOrder?.id === order.id && (
                        <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-up">
                          {[
                            ['Размер',     displayRef(order.size,   ['size', 'name', 'label'])],
                            ['Оформление', displayRef(order.format, ['format', 'name', 'label'])],
                            ['Обработка',  displayRef(order.design, ['design', 'name', 'label'])],
                            ['Статус',     <StatusBadge key="s" status={order.status} />],
                          ].map(([label, val]) => (
                            <div key={label}>
                              <div className="text-xs text-on-surface/30 uppercase tracking-widest mb-1">{label}</div>
                              <div className="text-sm text-on-surface/80">{val}</div>
                            </div>
                          ))}
                          {order.comments && (
                            <div className="col-span-2 md:col-span-3">
                              <div className="text-xs text-on-surface/30 uppercase tracking-widest mb-1">Комментарий</div>
                              <div className="text-sm text-on-surface/60">{order.comments}</div>
                            </div>
                          )}
                          {/* Прогресс */}
                          <div className="col-span-2 md:col-span-3">
                            <div className="text-xs text-on-surface/30 uppercase tracking-widest mb-3">Прогресс заказа</div>
                            <div className="flex items-center gap-0">
                              {['new','in_progress','ready','delivered'].map((s, i, arr) => {
                                const statuses = ['new','in_progress','ready','delivered'];
                                const current  = statuses.indexOf(order.status);
                                const isActive = i <= current;
                                const labels   = ['Принят','В работе','Готов','Доставлен'];
                                return (
                                  <div key={s} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center">
                                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition-all ${isActive ? 'border-secondary bg-secondary/20 text-secondary' : 'border-white/20 text-on-surface/20'}`}>
                                        {i < current ? '✓' : i + 1}
                                      </div>
                                      <div className={`text-xs mt-1 whitespace-nowrap ${isActive ? 'text-secondary' : 'text-on-surface/30'}`}>{labels[i]}</div>
                                    </div>
                                    {i < arr.length - 1 && <div className={`h-px flex-1 mx-1 mb-4 ${i < current ? 'bg-secondary' : 'bg-white/10'}`} />}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Профиль ── */}
          {activeTab === 'profile' && (
            <div className="glass rounded-xl p-8 max-w-lg animate-fade-up" style={{ animationDelay: '200ms' }}>
              <h2 className="font-serif text-2xl font-bold text-on-surface mb-8">Данные профиля</h2>
              <form onSubmit={saveProfile} className="space-y-6">
                <div>
                  <label className="text-xs text-on-surface/40 uppercase tracking-widest block mb-2">Имя и фамилия</label>
                  <input type="text" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                    className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-on-surface/40 uppercase tracking-widest block mb-2">Телефон</label>
                  <input type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                    className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-on-surface/40 uppercase tracking-widest block mb-2">Адрес</label>
                  <input type="text" value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
                    placeholder="г. Тольятти, ул. Ленина, 5" className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-on-surface/40 uppercase tracking-widest block mb-2">Email</label>
                  <div className="py-3 text-on-surface/40 text-sm border-b border-white/10">{user.email}</div>
                  <p className="text-xs text-on-surface/30 mt-1">Email изменить нельзя</p>
                </div>
                <div className="flex items-center gap-4">
                  <button type="submit" className="btn-primary py-3">Сохранить изменения</button>
                  {saveMsg && <span className="text-secondary text-sm">{saveMsg}</span>}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
