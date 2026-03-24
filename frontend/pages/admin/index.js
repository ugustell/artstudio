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
  const [status, setStatus]     = useState(order.status);
  const [issueDate, setIssueDate] = useState(order.issueDate || '');
  const [saving, setSaving]     = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const body = { status };
      // Если статус меняется на "доставлен" и дата выдачи не указана — ставим сегодня
      if (status === 'delivered' && !issueDate) {
        body.issueDate = new Date().toISOString().split('T')[0];
      } else if (issueDate) {
        body.issueDate = issueDate;
      }
      const res = await fetch(`${apiBase}/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Ошибка сохранения: ${err.error || res.status}`);
        setSaving(false);
        return;
      }
      onStatusChange(order.id, status);
      onClose();
    } catch (e) {
      console.error(e);
      alert('Ошибка соединения с сервером');
    }
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
              ['Кол-во',     order.quantity || 1],
              ['Стоимость',  `${order.totalPrice?.toLocaleString('ru-RU')} ₽`],
              ['Аванс',      `${(order.prepayment || 0).toLocaleString('ru-RU')} ₽`],
              ['Остаток',    `${((order.totalPrice || 0) - (order.prepayment || 0)).toLocaleString('ru-RU')} ₽`],
              ['Срок',       order.deadline || '—'],
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

          {/* Issue date */}
          <div className="mb-6">
            <div className="text-xs text-on-surface/40 uppercase tracking-widest mb-3">Дата выдачи</div>
            <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)}
              className="w-full bg-transparent border-b border-on-surface/20 py-2 text-on-surface focus:outline-none focus:border-secondary transition-colors" />
            <p className="text-xs text-on-surface/30 mt-1">Заполняется при передаче работы клиенту</p>
          </div>

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

// ─── Модальное окно отчётов ──────────────────────────────────────────────────
function ReportsModal({ onClose, apiBase, token }) {
  const [activeReport, setActiveReport] = useState('receipt'); // receipt | unfinished | accepted | completed | byTechnique
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [onDate, setOnDate]     = useState('');
  const [technique, setTechnique] = useState('');
  const [orderId, setOrderId]   = useState('');
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const fetchReport = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      let url = '';
      const params = new URLSearchParams();
      params.set('limit', '1000');

      if (activeReport === 'receipt') {
        if (!orderId) { setError('Укажите номер заказа'); setLoading(false); return; }
        url = `${apiBase}/api/orders/${orderId}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) { setError('Заказ не найден'); setLoading(false); return; }
        const data = await res.json();
        setResult({ type: 'receipt', order: data });
        setLoading(false); return;
      }

      if (activeReport === 'unfinished') {
        if (!onDate) { setError('Укажите дату'); setLoading(false); return; }
      }
      if (['accepted', 'completed', 'byTechnique'].includes(activeReport)) {
        if (!dateFrom || !dateTo) { setError('Укажите период'); setLoading(false); return; }
      }
      if (activeReport === 'byTechnique' && !technique) {
        setError('Укажите технику исполнения'); setLoading(false); return;
      }

      // Загружаем все заказы и фильтруем на клиенте
      url = `${apiBase}/api/orders?${params}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const orders = data.orders || [];

      if (activeReport === 'unfinished') {
        const d = new Date(onDate); d.setHours(23,59,59,999);
        const filtered = orders.filter(o =>
          o.status !== 'delivered' && o.deadline && new Date(o.deadline) <= d
        );
        setResult({ type: 'unfinished', orders: filtered, onDate });
      }

      if (activeReport === 'accepted') {
        const from = new Date(dateFrom); from.setHours(0,0,0,0);
        const to   = new Date(dateTo);   to.setHours(23,59,59,999);
        const filtered = orders.filter(o => {
          const d = new Date(o.createdAt);
          return d >= from && d <= to && o.status !== 'delivered';
        });
        setResult({ type: 'accepted', orders: filtered, dateFrom, dateTo });
      }

      if (activeReport === 'completed') {
        const from = new Date(dateFrom); from.setHours(0,0,0,0);
        const to   = new Date(dateTo);   to.setHours(23,59,59,999);
        const filtered = orders.filter(o => {
          if (o.status !== 'delivered') return false;
          // Используем issueDate если есть, иначе createdAt
          const d = o.issueDate ? new Date(o.issueDate) : new Date(o.createdAt);
          return d >= from && d <= to;
        });
        setResult({ type: 'completed', orders: filtered, dateFrom, dateTo });
      }

      if (activeReport === 'byTechnique') {
        const from = new Date(dateFrom); from.setHours(0,0,0,0);
        const to   = new Date(dateTo);   to.setHours(23,59,59,999);
        const filtered = orders.filter(o => {
          const d = new Date(o.createdAt);
          return d >= from && d <= to &&
            (o.design || '').toLowerCase().includes(technique.toLowerCase());
        });
        setResult({ type: 'byTechnique', orders: filtered, dateFrom, dateTo, technique });
      }
    } catch (e) {
      setError('Ошибка загрузки данных');
    }
    setLoading(false);
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—';
  const money = (n) => Number(n || 0).toLocaleString('ru-RU') + ' ₽';
  const total = (arr) => arr.reduce((s, o) => s + (o.totalPrice || 0), 0);

  const printReport = () => window.print();

  const TABS = [
    { id: 'receipt',    label: 'В-01 Квитанция'                     },
    { id: 'unfinished', label: 'В-02 Невыполненные на дату'          },
    { id: 'accepted',   label: 'В-03 Принятые за период'             },
    { id: 'completed',  label: 'В-04 Выполненные за период'          },
    { id: 'byTechnique',label: 'В-05 По технике за период'           },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 md:p-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-bold text-on-surface">Отчёты</h2>
            <div className="flex gap-3">
              {result && (
                <button onClick={printReport} className="text-sm px-4 py-2 bg-secondary/20 text-secondary rounded-lg hover:bg-secondary/30 transition-colors">
                  🖨 Печать
                </button>
              )}
              <button onClick={onClose} className="text-on-surface/40 hover:text-on-surface text-2xl leading-none">×</button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {TABS.map(t => (
              <button key={t.id} onClick={() => { setActiveReport(t.id); setResult(null); setError(''); }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  activeReport === t.id ? 'bg-secondary text-surface' : 'bg-white/5 text-on-surface/60 hover:bg-white/10'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Form inputs */}
          <div className="bg-white/5 rounded-xl p-5 mb-6">
            {activeReport === 'receipt' && (
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs text-on-surface/40 uppercase tracking-widest block mb-2">Номер заказа</label>
                  <input type="number" value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="Например: 5"
                    className="w-full bg-transparent border-b border-on-surface/20 py-2 text-on-surface focus:outline-none focus:border-secondary transition-colors" />
                </div>
                <button onClick={fetchReport} disabled={loading}
                  className="btn-primary py-2 px-6 disabled:opacity-50">
                  {loading ? '...' : 'Сформировать'}
                </button>
              </div>
            )}

            {activeReport === 'unfinished' && (
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs text-on-surface/40 uppercase tracking-widest block mb-2">На дату</label>
                  <input type="date" value={onDate} onChange={e => setOnDate(e.target.value)}
                    className="w-full bg-transparent border-b border-on-surface/20 py-2 text-on-surface focus:outline-none focus:border-secondary transition-colors" />
                </div>
                <button onClick={fetchReport} disabled={loading} className="btn-primary py-2 px-6 disabled:opacity-50">
                  {loading ? '...' : 'Сформировать'}
                </button>
              </div>
            )}

            {['accepted', 'completed'].includes(activeReport) && (
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[140px]">
                  <label className="text-xs text-on-surface/40 uppercase tracking-widest block mb-2">С</label>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    className="w-full bg-transparent border-b border-on-surface/20 py-2 text-on-surface focus:outline-none focus:border-secondary transition-colors" />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="text-xs text-on-surface/40 uppercase tracking-widest block mb-2">По</label>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    className="w-full bg-transparent border-b border-on-surface/20 py-2 text-on-surface focus:outline-none focus:border-secondary transition-colors" />
                </div>
                <button onClick={fetchReport} disabled={loading} className="btn-primary py-2 px-6 disabled:opacity-50">
                  {loading ? '...' : 'Сформировать'}
                </button>
              </div>
            )}

            {activeReport === 'byTechnique' && (
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[180px]">
                  <label className="text-xs text-on-surface/40 uppercase tracking-widest block mb-2">Техника исполнения</label>
                  <input type="text" value={technique} onChange={e => setTechnique(e.target.value)} placeholder="Масло, Акварель..."
                    className="w-full bg-transparent border-b border-on-surface/20 py-2 text-on-surface focus:outline-none focus:border-secondary transition-colors" />
                </div>
                <div className="flex-1 min-w-[130px]">
                  <label className="text-xs text-on-surface/40 uppercase tracking-widest block mb-2">С</label>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    className="w-full bg-transparent border-b border-on-surface/20 py-2 text-on-surface focus:outline-none focus:border-secondary transition-colors" />
                </div>
                <div className="flex-1 min-w-[130px]">
                  <label className="text-xs text-on-surface/40 uppercase tracking-widest block mb-2">По</label>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    className="w-full bg-transparent border-b border-on-surface/20 py-2 text-on-surface focus:outline-none focus:border-secondary transition-colors" />
                </div>
                <button onClick={fetchReport} disabled={loading} className="btn-primary py-2 px-6 disabled:opacity-50">
                  {loading ? '...' : 'Сформировать'}
                </button>
              </div>
            )}

            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          </div>

          {/* ─── Результаты ─── */}
          {result && (

            <div className="print-area">

              {/* В-01: Квитанция */}
              {result.type === 'receipt' && (() => {
                const o = result.order;
                const remainder = (o.totalPrice || 0) - 0; // аванс не хранится пока
                return (
                  <div className="bg-white/5 rounded-xl p-6">
                    <div className="text-center mb-6">
                      <div className="font-serif text-xl font-bold text-on-surface">КВИТАНЦИЯ №{o.id}</div>
                      <div className="text-on-surface/50 text-sm">от {fmt(o.createdAt)}</div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mb-6 text-sm">
                      <div><span className="text-on-surface/40">ФИО клиента:</span> <span className="text-on-surface font-medium">{o.clientName}</span></div>
                      <div><span className="text-on-surface/40">Телефон:</span> <span className="text-on-surface font-medium">{o.phone}</span></div>
                      <div><span className="text-on-surface/40">Email:</span> <span className="text-on-surface font-medium">{o.email}</span></div>
                      <div><span className="text-on-surface/40">Дата исполнения:</span> <span className="text-on-surface font-medium">{o.deadline || '—'}</span></div>
                    </div>
                    <div className="overflow-x-auto mb-4">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-white/20">
                            {['№', 'Размер', 'Оформление', 'Техника', 'Кол-во', 'Цена за ед.', 'Скидка/надбавка', 'Итого'].map(h => (
                              <th key={h} className="text-left px-3 py-2 text-on-surface/40 text-xs font-semibold">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-white/10">
                            <td className="px-3 py-3 text-on-surface/70">1</td>
                            <td className="px-3 py-3 text-on-surface">{o.size}</td>
                            <td className="px-3 py-3 text-on-surface">{o.format}</td>
                            <td className="px-3 py-3 text-on-surface">{o.design}</td>
                            <td className="px-3 py-3 text-on-surface">{o.quantity}</td>
                            <td className="px-3 py-3 text-on-surface">{money(o.basePrice)}</td>
                            <td className="px-3 py-3 text-on-surface">
                              {o.discountPercent > 0 && <span className="text-green-400">−{o.discountPercent}%</span>}
                              {o.surchargePercent > 0 && <span className="text-secondary"> +{o.surchargePercent}%</span>}
                              {!o.discountPercent && !o.surchargePercent && '—'}
                            </td>
                            <td className="px-3 py-3 font-bold text-secondary">{money(o.totalPrice)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/20 pt-4">
                      <span className="text-on-surface/50 text-sm">Итого по квитанции:</span>
                      <span className="font-black text-2xl text-primary font-serif">{money(o.totalPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-on-surface/50 text-sm">Аванс:</span>
                      <span className="font-bold text-green-400">{money(o.prepayment || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-on-surface/50 text-sm">Остаток:</span>
                      <span className="font-bold text-secondary">{money((o.totalPrice || 0) - (o.prepayment || 0))}</span>
                    </div>
                    {(o.discountPercent > 0 || o.discountReason) && (
                      <div className="mt-2 text-green-400 text-xs">Скидка: {o.discountReason} ({o.discountPercent}%)</div>
                    )}
                    {(o.surchargePercent > 0 || o.surchargeReason) && (
                      <div className="mt-1 text-secondary text-xs">Надбавка: {o.surchargeReason} (+{o.surchargePercent}%)</div>
                    )}
                    {o.comments && (
                      <div className="mt-4 text-on-surface/40 text-xs">Примечание: {o.comments}</div>
                    )}
                  </div>
                );
              })()}

              {/* В-02: Невыполненные на дату */}
              {result.type === 'unfinished' && (
                <div className="bg-white/5 rounded-xl p-6">
                  <div className="font-serif text-lg font-bold text-on-surface mb-1">Список невыполненных заказов</div>
                  <div className="text-on-surface/40 text-sm mb-5">на дату: {fmt(result.onDate)}</div>
                  {result.orders.length === 0 ? (
                    <div className="text-on-surface/30 text-sm text-center py-8">Нет невыполненных заказов на эту дату</div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/20">
                              {['№ заказа', 'Дата заказа', 'Дата исполнения', 'ФИО клиента', 'Телефон', 'Сумма'].map(h => (
                                <th key={h} className="text-left px-3 py-2 text-on-surface/40 text-xs font-semibold">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.orders.map(o => (
                              <tr key={o.id} className="border-b border-white/5">
                                <td className="px-3 py-3 text-on-surface font-medium">#{o.id}</td>
                                <td className="px-3 py-3 text-on-surface/70">{fmt(o.createdAt)}</td>
                                <td className="px-3 py-3 text-on-surface/70">{o.deadline || '—'}</td>
                                <td className="px-3 py-3 text-on-surface">{o.clientName}</td>
                                <td className="px-3 py-3 text-on-surface/70">{o.phone}</td>
                                <td className="px-3 py-3 text-secondary font-bold">{money(o.totalPrice)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex justify-between items-center border-t border-white/20 pt-4 mt-2">
                        <span className="text-on-surface/50 text-sm">Итого по невыполненным ({result.orders.length}):</span>
                        <span className="font-black text-xl text-primary font-serif">{money(total(result.orders))}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* В-03: Принятые за период */}
              {result.type === 'accepted' && (
                <div className="bg-white/5 rounded-xl p-6">
                  <div className="font-serif text-lg font-bold text-on-surface mb-1">Список принятых заказов за период</div>
                  <div className="text-on-surface/40 text-sm mb-5">с {fmt(result.dateFrom)} по {fmt(result.dateTo)}</div>
                  {result.orders.length === 0 ? (
                    <div className="text-on-surface/30 text-sm text-center py-8">Нет заказов за этот период</div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/20">
                              {['Дата заказа', '№ заказа', 'ФИО клиента', 'Email', 'Телефон', 'Сумма'].map(h => (
                                <th key={h} className="text-left px-3 py-2 text-on-surface/40 text-xs font-semibold">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.orders.map(o => (
                              <tr key={o.id} className="border-b border-white/5">
                                <td className="px-3 py-3 text-on-surface/70">{fmt(o.createdAt)}</td>
                                <td className="px-3 py-3 text-on-surface font-medium">#{o.id}</td>
                                <td className="px-3 py-3 text-on-surface">{o.clientName}</td>
                                <td className="px-3 py-3 text-on-surface/70">{o.email}</td>
                                <td className="px-3 py-3 text-on-surface/70">{o.phone}</td>
                                <td className="px-3 py-3 text-secondary font-bold">{money(o.totalPrice)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex justify-between items-center border-t border-white/20 pt-4 mt-2">
                        <span className="text-on-surface/50 text-sm">Итого по принятым заказам ({result.orders.length}):</span>
                        <span className="font-black text-xl text-primary font-serif">{money(total(result.orders))}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* В-04: Выполненные за период */}
              {result.type === 'completed' && (
                <div className="bg-white/5 rounded-xl p-6">
                  <div className="font-serif text-lg font-bold text-on-surface mb-1">Список выполненных заказов за период</div>
                  <div className="text-on-surface/40 text-sm mb-5">с {fmt(result.dateFrom)} по {fmt(result.dateTo)}</div>
                  {result.orders.length === 0 ? (
                    <div className="text-on-surface/30 text-sm text-center py-8">Нет выполненных заказов за этот период</div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/20">
                              {['№ заказа', 'Дата заказа', 'Дата исполнения', 'ФИО клиента', 'Телефон', 'Дата выдачи', 'Сумма'].map(h => (
                                <th key={h} className="text-left px-3 py-2 text-on-surface/40 text-xs font-semibold">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.orders.map(o => (
                              <tr key={o.id} className="border-b border-white/5">
                                <td className="px-3 py-3 text-on-surface font-medium">#{o.id}</td>
                                <td className="px-3 py-3 text-on-surface/70">{fmt(o.createdAt)}</td>
                                <td className="px-3 py-3 text-on-surface/70">{o.deadline || '—'}</td>
                                <td className="px-3 py-3 text-on-surface">{o.clientName}</td>
                                <td className="px-3 py-3 text-on-surface/70">{o.phone}</td>
                                <td className="px-3 py-3 text-on-surface/70">{o.issueDate ? fmt(o.issueDate) : '—'}</td>
                                <td className="px-3 py-3 text-secondary font-bold">{money(o.totalPrice)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex justify-between items-center border-t border-white/20 pt-4 mt-2">
                        <span className="text-on-surface/50 text-sm">Итого по выполненным ({result.orders.length}):</span>
                        <span className="font-black text-xl text-primary font-serif">{money(total(result.orders))}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* В-05: По технике за период */}
              {result.type === 'byTechnique' && (
                <div className="bg-white/5 rounded-xl p-6">
                  <div className="font-serif text-lg font-bold text-on-surface mb-1">Список картин по технике исполнения</div>
                  <div className="text-on-surface/40 text-sm mb-1">Техника: <span className="text-on-surface">{result.technique}</span></div>
                  <div className="text-on-surface/40 text-sm mb-5">с {fmt(result.dateFrom)} по {fmt(result.dateTo)}</div>
                  {result.orders.length === 0 ? (
                    <div className="text-on-surface/30 text-sm text-center py-8">Нет заказов с такой техникой за этот период</div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/20">
                              {['№ заказа', 'Дата заказа', 'ФИО клиента', 'Размер холста', 'Количество'].map(h => (
                                <th key={h} className="text-left px-3 py-2 text-on-surface/40 text-xs font-semibold">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.orders.map(o => (
                              <tr key={o.id} className="border-b border-white/5">
                                <td className="px-3 py-3 text-on-surface font-medium">#{o.id}</td>
                                <td className="px-3 py-3 text-on-surface/70">{fmt(o.createdAt)}</td>
                                <td className="px-3 py-3 text-on-surface">{o.clientName}</td>
                                <td className="px-3 py-3 text-on-surface/70">{o.size}</td>
                                <td className="px-3 py-3 text-on-surface">{o.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex justify-between items-center border-t border-white/20 pt-4 mt-2">
                        <span className="text-on-surface/50 text-sm">
                          Итого картин: {result.orders.reduce((s, o) => s + (o.quantity || 1), 0)} шт. ({result.orders.length} заказов)
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

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
  const [showReports, setShowReports] = useState(false);
  const [showReports, setShowReports] = useState(false);
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
            <button onClick={() => setShowReports(true)} className="btn-outline text-sm py-2 px-5 hidden md:flex">
              📊 Отчёты
            </button>
            <button onClick={() => setShowReports(true)} className="btn-outline text-sm py-2 px-5 hidden md:flex">
              📊 Отчёты
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

          {/* Mobile buttons */}
          <div className="md:hidden mb-4 flex gap-3">
            <button onClick={() => setShowPrices(true)} className="btn-outline text-sm py-2 flex-1 justify-center">Прайс</button>
            <button onClick={() => setShowReports(true)} className="btn-outline text-sm py-2 flex-1 justify-center">📊 Отчёты</button>
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
      {showReports && (
        <ReportsModal onClose={() => setShowReports(false)} apiBase={API} token={token} />
      )}
    </>
  );
}
