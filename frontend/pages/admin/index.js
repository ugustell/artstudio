import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

const STATUS_MAP = {
  new:         { label: 'Новый',      color: 'bg-primary/20 text-primary' },
  in_progress: { label: 'В работе',   color: 'bg-secondary/20 text-secondary' },
  ready:       { label: 'Готов',      color: 'bg-tertiary/20 text-tertiary' },
  delivered:   { label: 'Доставлен',  color: 'bg-green-500/20 text-green-400' },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, color: 'bg-white/10 text-on-surface/50' };
  return <span className={`status-badge ${s.color}`}>{s.label}</span>;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Модальное окно деталей заказа ──────────────────────────────────────────
function OrderModal({ order, onClose, onStatusChange, onDelete, apiBase, token }) {
  const [status, setStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${apiBase}/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      onStatusChange(order.id, status);
      onClose();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const del = async () => {
    if (!confirm('Удалить заказ? Это действие необратимо.')) return;
    await fetch(`${apiBase}/api/orders/${order.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    onDelete(order.id);
    onClose();
  };

  const photos = Array.isArray(order.photoPaths) ? order.photoPaths : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-up" onClick={e => e.stopPropagation()}>
        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="text-xs text-on-surface/40 uppercase tracking-widest mb-1">Заказ #{order.id}</div>
              <h2 className="font-serif text-2xl font-bold text-on-surface">{order.clientName}</h2>
              <div className="text-on-surface/50 text-sm mt-1">{formatDate(order.createdAt)}</div>
            </div>
            <button onClick={onClose} className="text-on-surface/40 hover:text-on-surface transition-colors text-2xl leading-none">×</button>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              ['Телефон',    order.phone],
              ['Email',      order.email],
              ['Размер',     order.size],
              ['Оформление', order.format],
              ['Обработка',  order.design],
              ['Стоимость',  `${order.totalPrice?.toLocaleString('ru-RU')} ₽`],
            ].map(([label, val]) => (
              <div key={label} className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-on-surface/40 uppercase tracking-widest mb-1">{label}</div>
                <div className="text-on-surface font-medium text-sm">{val}</div>
              </div>
            ))}
          </div>

          {order.comments && (
            <div className="bg-white/5 rounded-lg p-4 mb-8">
              <div className="text-xs text-on-surface/40 uppercase tracking-widest mb-2">Комментарий</div>
              <p className="text-on-surface/70 text-sm leading-relaxed">{order.comments}</p>
            </div>
          )}

          {/* Photos */}
          {photos.length > 0 && (
            <div className="mb-8">
              <div className="text-xs text-on-surface/40 uppercase tracking-widest mb-3">Фотографии ({photos.length})</div>
              <div className="flex flex-wrap gap-3">
                {photos.map((p, i) => (
                  <a key={i} href={`${process.env.NEXT_PUBLIC_API_URL}${p}`} target="_blank" rel="noreferrer">
                    <img src={`${process.env.NEXT_PUBLIC_API_URL}${p}`} alt={`Фото ${i+1}`}
                      className="w-24 h-24 object-cover rounded-lg border border-white/10 hover:border-primary/50 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Status change */}
          <div className="mb-6">
            <div className="text-xs text-on-surface/40 uppercase tracking-widest mb-3">Изменить статус</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(STATUS_MAP).map(([key, val]) => (
                <button key={key} onClick={() => setStatus(key)}
                  className={`py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 text-left
                    ${status === key ? `${val.color} border border-current` : 'bg-white/5 text-on-surface/50 hover:bg-white/10'}`}>
                  {val.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="btn-primary flex-1 justify-center disabled:opacity-50">
              {saving ? 'Сохраняем...' : 'Сохранить статус'}
            </button>
            <button onClick={del} className="px-4 py-3 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium">
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Модальное окно прайса ───────────────────────────────────────────────────
function PricesModal({ onClose, apiBase, token }) {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [newSize, setNewSize] = useState('');
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    fetch(`${apiBase}/api/prices`).then(r => r.json()).then(setPrices).finally(() => setLoading(false));
  }, []);

  const saveEdit = async (id) => {
    const res = await fetch(`${apiBase}/api/prices/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ price: Number(editVal) }),
    });
    const updated = await res.json();
    setPrices(p => p.map(x => x.id === id ? updated : x));
    setEditId(null);
  };

  const addPrice = async () => {
    if (!newSize || !newPrice) return;
    const res = await fetch(`${apiBase}/api/prices`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ size: newSize, price: Number(newPrice) }),
    });
    const created = await res.json();
    setPrices(p => [...p, created]);
    setNewSize(''); setNewPrice('');
  };

  const deletePrice = async (id) => {
    if (!confirm('Удалить позицию?')) return;
    await fetch(`${apiBase}/api/prices/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setPrices(p => p.filter(x => x.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-up" onClick={e => e.stopPropagation()}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-2xl font-bold text-on-surface">Редактировать прайс</h2>
            <button onClick={onClose} className="text-on-surface/40 hover:text-on-surface text-2xl">×</button>
          </div>

          {loading ? <div className="text-center py-8 text-on-surface/40">Загрузка...</div> : (
            <div className="space-y-2 mb-8">
              {prices.map(p => (
                <div key={p.id} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3">
                  <span className="text-on-surface/70 text-sm flex-1">{p.size}</span>
                  {editId === p.id ? (
                    <>
                      <input type="number" value={editVal} onChange={e => setEditVal(e.target.value)}
                        className="w-24 bg-surface border border-secondary/40 rounded px-2 py-1 text-sm text-on-surface text-right focus:outline-none" />
                      <span className="text-on-surface/40 text-sm">₽</span>
                      <button onClick={() => saveEdit(p.id)} className="text-secondary text-sm font-medium hover:text-secondary/80">✓</button>
                      <button onClick={() => setEditId(null)} className="text-on-surface/40 text-sm hover:text-on-surface">✕</button>
                    </>
                  ) : (
                    <>
                      <span className="text-secondary font-bold text-sm">{p.price.toLocaleString('ru-RU')} ₽</span>
                      <button onClick={() => { setEditId(p.id); setEditVal(p.price); }} className="text-on-surface/40 hover:text-secondary text-xs transition-colors">✎</button>
                      <button onClick={() => deletePrice(p.id)} className="text-on-surface/40 hover:text-red-400 text-xs transition-colors">✕</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add new */}
          <div className="border-t border-white/10 pt-6">
            <div className="text-xs text-on-surface/40 uppercase tracking-widest mb-3">Добавить позицию</div>
            <div className="flex gap-2">
              <input value={newSize} onChange={e => setNewSize(e.target.value)} placeholder="Размер (напр. 90×120 см)"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface placeholder-on-surface/30 focus:outline-none focus:border-secondary/50" />
              <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="Цена"
                className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface placeholder-on-surface/30 focus:outline-none focus:border-secondary/50" />
              <button onClick={addPrice} className="btn-primary px-4 py-2 text-sm">+</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Главная страница админки ────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPrices, setShowPrices] = useState(false);
  const [token, setToken] = useState('');
  const [adminLogin, setAdminLogin] = useState('');

  const API = process.env.NEXT_PUBLIC_API_URL;

  // Auth check
  useEffect(() => {
    const t = localStorage.getItem('admin_token');
    const l = localStorage.getItem('admin_login');
    if (!t) { router.replace('/admin/login'); return; }
    setToken(t); setAdminLogin(l || 'admin');
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15, status: statusFilter });
      if (search) params.set('search', search);
      const res = await fetch(`${API}/api/orders?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401 || res.status === 403) { router.replace('/admin/login'); return; }
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [token, page, statusFilter, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const logout = () => { localStorage.removeItem('admin_token'); localStorage.removeItem('admin_login'); router.push('/admin/login'); };

  const onStatusChange = (id, status) => setOrders(o => o.map(x => x.id === id ? { ...x, status } : x));
  const onDelete = (id) => { setOrders(o => o.filter(x => x.id !== id)); setTotal(t => t - 1); };

  // Stats
  const stats = {
    total: total,
    new: orders.filter(o => o.status === 'new').length,
    in_progress: orders.filter(o => o.status === 'in_progress').length,
    ready: orders.filter(o => o.status === 'ready').length,
  };

  return (
    <>
      <Head><title>Панель управления — ArtStudio</title></Head>

      <div className="min-h-screen bg-surface">
        {/* Topbar */}
        <header className="bg-surface-container border-b border-white/5 px-6 md:px-12 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <span className="font-serif text-xl font-black italic text-secondary">Art<span className="text-primary">Studio</span></span>
            <span className="hidden md:block text-on-surface/30 text-sm">/ Панель управления</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowPrices(true)} className="btn-outline text-sm py-2 px-5 hidden md:flex">
              Редактировать прайс
            </button>
            <a href="/" target="_blank" className="text-on-surface/40 hover:text-secondary text-sm transition-colors hidden md:block">Сайт ↗</a>
            <div className="flex items-center gap-2">
              <span className="text-on-surface/40 text-sm hidden md:block">{adminLogin}</span>
              <button onClick={logout} className="text-xs text-on-surface/40 hover:text-red-400 transition-colors px-3 py-1 glass rounded">Выйти</button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 md:px-12 py-10">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Всего заказов', val: total,              color: 'text-on-surface' },
              { label: 'Новых',         val: stats.new,          color: 'text-primary'    },
              { label: 'В работе',      val: stats.in_progress,  color: 'text-secondary'  },
              { label: 'Готово',        val: stats.ready,        color: 'text-tertiary'   },
            ].map(s => (
              <div key={s.label} className="glass rounded-xl p-6">
                <div className={`text-4xl font-serif font-black mb-1 ${s.color}`}>{s.val}</div>
                <div className="text-xs text-on-surface/40 uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Поиск по имени, телефону, email..."
              className="flex-1 bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-on-surface placeholder-on-surface/30 focus:outline-none focus:border-secondary/50 transition-colors text-sm" />
            <div className="flex gap-2 flex-wrap">
              {[['all','Все'], ['new','Новые'], ['in_progress','В работе'], ['ready','Готовы'], ['delivered','Доставлены']].map(([v, l]) => (
                <button key={v} onClick={() => { setStatusFilter(v); setPage(1); }}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${statusFilter === v ? 'bg-secondary text-surface' : 'glass text-on-surface/60 hover:text-secondary'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile prices button */}
          <div className="md:hidden mb-4">
            <button onClick={() => setShowPrices(true)} className="btn-outline text-sm py-2 w-full justify-center">Редактировать прайс</button>
          </div>

          {/* Table */}
          <div className="glass rounded-xl overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['#', 'Клиент', 'Контакты', 'Заказ', 'Сумма', 'Статус', 'Дата', ''].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-xs text-on-surface/40 uppercase tracking-widest font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="px-6 py-16 text-center text-on-surface/40">Загрузка заказов...</td></tr>
                  ) : orders.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-16 text-center text-on-surface/40">Заказы не найдены</td></tr>
                  ) : orders.map((o, i) => (
                    <tr key={o.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
                      onClick={() => setSelectedOrder(o)}>
                      <td className="px-6 py-4 text-on-surface/40 text-sm font-mono">#{o.id}</td>
                      <td className="px-6 py-4 text-on-surface font-medium text-sm">{o.clientName}</td>
                      <td className="px-6 py-4">
                        <div className="text-on-surface/60 text-xs">{o.phone}</div>
                        <div className="text-on-surface/40 text-xs">{o.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-on-surface/70 text-xs">{o.size}</div>
                        <div className="text-on-surface/40 text-xs">{o.format}</div>
                      </td>
                      <td className="px-6 py-4 text-secondary font-bold text-sm">{o.totalPrice?.toLocaleString('ru-RU')} ₽</td>
                      <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
                      <td className="px-6 py-4 text-on-surface/40 text-xs">{formatDate(o.createdAt)}</td>
                      <td className="px-6 py-4">
                        <button className="text-on-surface/30 hover:text-secondary transition-colors text-sm">→</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-white/5">
              {loading ? (
                <div className="p-8 text-center text-on-surface/40">Загрузка...</div>
              ) : orders.length === 0 ? (
                <div className="p-8 text-center text-on-surface/40">Заказы не найдены</div>
              ) : orders.map(o => (
                <div key={o.id} className="p-5 hover:bg-white/[0.02] cursor-pointer transition-colors" onClick={() => setSelectedOrder(o)}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium text-on-surface text-sm">{o.clientName}</div>
                      <div className="text-on-surface/40 text-xs mt-0.5">#{o.id} · {formatDate(o.createdAt)}</div>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-on-surface/50 text-xs">{o.size} · {o.format}</div>
                    <div className="text-secondary font-bold text-sm">{o.totalPrice?.toLocaleString('ru-RU')} ₽</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="glass px-4 py-2 rounded-lg text-sm disabled:opacity-30 hover:border-secondary/40 transition-colors">
                ← Назад
              </button>
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-lg text-sm transition-all ${page === p ? 'bg-secondary text-surface font-bold' : 'glass text-on-surface/60 hover:text-secondary'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="glass px-4 py-2 rounded-lg text-sm disabled:opacity-30 hover:border-secondary/40 transition-colors">
                Далее →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedOrder && (
        <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)}
          onStatusChange={onStatusChange} onDelete={onDelete} apiBase={API} token={token} />
      )}
      {showPrices && (
        <PricesModal onClose={() => setShowPrices(false)} apiBase={API} token={token} />
      )}
    </>
  );
}
