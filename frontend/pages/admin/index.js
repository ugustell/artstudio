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

// ─── Вспомогательная функция — итог позиций ──────────────────────────────────
function itemsSummary(items) {
  if (!Array.isArray(items) || !items.length) return null;
  return items.map(item => {
    const p = item.price || {};
    const parts = [
      p.canvasSize?.size,
      p.designType?.name,
      p.technique?.name,
      p.subject?.name,
    ].filter(Boolean).join(' · ');
    return `${parts} × ${item.quantity} шт.`;
  }).join('\n');
}

// ─── Модальное окно деталей заказа ───────────────────────────────────────────
function OrderModal({ order, onClose, onStatusChange, onDelete, apiBase, token }) {
  const [status,    setStatus]    = useState(order.status);
  const [issueDate, setIssueDate] = useState(order.issueDate || '');
  const [saving,    setSaving]    = useState(false);

  const clientName = order.user?.name  || '—';
  const phone      = order.user?.phone || '—';
  const email      = order.user?.email || '—';
  const photos     = Array.isArray(order.photoPaths) ? order.photoPaths : [];

  // Первая позиция для отображения параметров
  const firstItem  = order.items?.[0];
  const firstPrice = firstItem?.price || {};

  const save = async () => {
    setSaving(true);
    try {
      const body = { status };
      if (status === 'delivered' && !issueDate)
        body.issueDate = new Date().toISOString().split('T')[0];
      else if (issueDate)
        body.issueDate = issueDate;

      const res = await fetch(`${apiBase}/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { alert(`Ошибка: ${(await res.json().catch(() => ({}))).error || res.status}`); setSaving(false); return; }
      onStatusChange(order.id, status);
      onClose();
    } catch { alert('Ошибка соединения'); }
    setSaving(false);
  };

  const del = async () => {
    if (!confirm('Удалить заказ? Это действие необратимо.')) return;
    await fetch(`${apiBase}/api/orders/${order.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    onDelete(order.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-up" onClick={e => e.stopPropagation()}>
        <div className="p-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="text-xs text-on-surface/40 uppercase tracking-widest mb-1">Заказ #{order.id}</div>
              <h2 className="font-serif text-2xl font-bold text-on-surface">{clientName}</h2>
              <div className="text-on-surface/50 text-sm mt-1">{formatDate(order.createdAt)}</div>
            </div>
            <button onClick={onClose} className="text-on-surface/40 hover:text-on-surface text-2xl leading-none">×</button>
          </div>

          {/* Клиент */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              ['Телефон',  phone],
              ['Email',    email],
              ['Стоимость', `${order.totalPrice?.toLocaleString('ru-RU')} ₽`],
              ['Аванс',    `${(order.prepayment || 0).toLocaleString('ru-RU')} ₽`],
              ['Остаток',  `${((order.totalPrice || 0) - (order.prepayment || 0)).toLocaleString('ru-RU')} ₽`],
              ['Срок',     order.deadline || '—'],
            ].map(([label, val]) => (
              <div key={label} className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-on-surface/40 uppercase tracking-widest mb-1">{label}</div>
                <div className="text-on-surface font-medium text-sm">{val}</div>
              </div>
            ))}
          </div>

          {/* Позиции заказа */}
          {order.items?.length > 0 && (
            <div className="mb-6">
              <div className="text-xs text-on-surface/40 uppercase tracking-widest mb-3">Позиции заказа</div>
              <div className="space-y-2">
                {order.items.map((item, i) => {
                  const p = item.price || {};
                  return (
                    <div key={i} className="bg-white/5 rounded-lg p-4 text-sm">
                      <div className="text-on-surface font-medium mb-1">
                        {p.canvasSize?.size} · {p.technique?.name}
                      </div>
                      <div className="text-on-surface/50 text-xs mb-1">
                        {p.designType?.name} · {p.subject?.name}
                      </div>
                      <div className="flex justify-between text-xs mt-2">
                        <span className="text-on-surface/40">{item.quantity} шт. × {item.pricePerUnit?.toLocaleString('ru-RU')} ₽</span>
                        <span className="text-secondary font-bold">{item.total?.toLocaleString('ru-RU')} ₽</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Скидка */}
          {order.discount && (
            <div className="mb-6 bg-white/5 rounded-lg p-4">
              <div className="text-xs text-on-surface/40 uppercase tracking-widest mb-1">Скидка / надбавка</div>
              <div className={`text-sm font-medium ${order.discount.percent < 0 ? 'text-green-400' : 'text-secondary'}`}>
                {order.discount.percent > 0 ? '+' : ''}{order.discount.percent}% — {order.discount.description}
              </div>
            </div>
          )}

          {/* Комментарий */}
          {order.comments && (
            <div className="bg-white/5 rounded-lg p-4 mb-6">
              <div className="text-xs text-on-surface/40 uppercase tracking-widest mb-2">Комментарий</div>
              <p className="text-on-surface/70 text-sm leading-relaxed">{order.comments}</p>
            </div>
          )}

          {/* Фото */}
          {photos.length > 0 && (
            <div className="mb-6">
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

          {/* Дата выдачи */}
          <div className="mb-6">
            <div className="text-xs text-on-surface/40 uppercase tracking-widest mb-3">Дата выдачи</div>
            <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)}
              className="w-full bg-transparent border-b border-on-surface/20 py-2 text-on-surface focus:outline-none focus:border-secondary transition-colors" />
          </div>

          {/* Статус */}
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

// ─── Модальное окно прайса ────────────────────────────────────────────────────
function PricesModal({ onClose, apiBase, token }) {
  const [options, setOptions] = useState({ canvasSizes: [], designTypes: [], techniques: [], subjects: [], discounts: [] });
  const [activeTab, setActiveTab] = useState('canvasSizes');
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');

  const TABS = [
    { id: 'canvasSizes', label: 'Размеры' },
    { id: 'designTypes', label: 'Оформление' },
    { id: 'techniques',  label: 'Техники' },
    { id: 'subjects',    label: 'Сюжеты' },
    { id: 'discounts',   label: 'Скидки/надбавки' },
  ];

  // Endpoint mapping
  const ENDPOINT = {
    canvasSizes: 'sizes',
    designTypes: 'formats',
    techniques:  'designs',
    subjects:    'plots',
    discounts:   'discounts',
  };

  useEffect(() => {
    fetch(`${apiBase}/api/prices/options`)
      .then(r => r.json())
      .then(setOptions)
      .finally(() => setLoading(false));
  }, []);

  const addItem = async () => {
    if (!newName.trim()) return;
    const num = newNumber === '' ? 0 : Number(newNumber);
    if (activeTab === 'canvasSizes' && (newNumber === '' || Number.isNaN(num))) return;
    if (activeTab !== 'discounts' && Number.isNaN(num)) return;

    const body =
      activeTab === 'canvasSizes' ? { size: newName, price: num } :
      activeTab === 'designTypes' ? { format: newName, priceExtra: num } :
      activeTab === 'techniques'  ? { design: newName, priceExtra: num } :
      activeTab === 'subjects'    ? { plot: newName, priceExtra: num } :
      { name: newName }; // not used for discounts here

    const res = await fetch(`${apiBase}/api/prices/${ENDPOINT[activeTab]}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const created = await res.json();
    setOptions(o => ({ ...o, [activeTab]: [...o[activeTab], created] }));
    setNewName('');
    setNewNumber('');
  };

  const deleteItem = async (id) => {
    if (!confirm('Удалить запись?')) return;
    await fetch(`${apiBase}/api/prices/${ENDPOINT[activeTab]}/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    setOptions(o => ({ ...o, [activeTab]: o[activeTab].filter(x => x.id !== id) }));
  };

  const currentItems = options[activeTab] || [];

  const displayName = (item) => {
    if (activeTab === 'canvasSizes') return `${item.size} — ${Number(item.price || 0).toLocaleString('ru-RU')} ₽`;
    if (activeTab === 'designTypes') return `${item.name} ${item.priceExtra ? `(+${Number(item.priceExtra).toLocaleString('ru-RU')} ₽)` : ''}`.trim();
    if (activeTab === 'techniques')  return `${item.name} ${item.priceExtra ? `(+${Number(item.priceExtra).toLocaleString('ru-RU')} ₽)` : ''}`.trim();
    if (activeTab === 'subjects')    return `${item.name} ${item.priceExtra ? `(+${Number(item.priceExtra).toLocaleString('ru-RU')} ₽)` : ''}`.trim();
    if (activeTab === 'discounts')   return `${item.percent > 0 ? '+' : ''}${item.percent}% — ${item.description}`;
    return item.name || '—';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-up" onClick={e => e.stopPropagation()}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-bold text-on-surface">Справочники</h2>
            <button onClick={onClose} className="text-on-surface/40 hover:text-on-surface text-2xl">×</button>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {TABS.map(t => (
              <button key={t.id} onClick={() => { setActiveTab(t.id); setNewName(''); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === t.id ? 'bg-secondary text-surface' : 'bg-white/5 text-on-surface/60 hover:bg-white/10'
                }`}>{t.label}</button>
            ))}
          </div>

          {loading ? <div className="text-center py-8 text-on-surface/40">Загрузка...</div> : (
            <div className="space-y-2 mb-6 max-h-72 overflow-y-auto">
              {currentItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3">
                  <span className="text-on-surface/70 text-sm flex-1">{displayName(item)}</span>
                  {activeTab !== 'discounts' && (
                    <button onClick={() => deleteItem(item.id)} className="text-on-surface/30 hover:text-red-400 text-xs transition-colors">✕</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Добавить — только для простых справочников */}
          {activeTab !== 'discounts' && (
            <div className="border-t border-white/10 pt-5">
              <div className="text-xs text-on-surface/40 uppercase tracking-widest mb-3">
                Добавить {TABS.find(t => t.id === activeTab)?.label.toLowerCase()}
              </div>
              <div className="flex gap-2">
                <input value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder={activeTab === 'canvasSizes' ? 'Например: 90×120 см' : 'Название...'}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface placeholder-on-surface/30 focus:outline-none focus:border-secondary/50"
                  onKeyDown={e => e.key === 'Enter' && addItem()} />
                <input value={newNumber} onChange={e => setNewNumber(e.target.value)}
                  placeholder={activeTab === 'canvasSizes' ? 'Цена (₽)' : 'Надбавка (₽)'}
                  inputMode="numeric"
                  className="w-40 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface placeholder-on-surface/30 focus:outline-none focus:border-secondary/50"
                  onKeyDown={e => e.key === 'Enter' && addItem()} />
                <button onClick={addItem} className="btn-primary px-4 py-2 text-sm">+</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Модальное окно отчётов ───────────────────────────────────────────────────
function ReportsModal({ onClose, apiBase, token }) {
  const [activeReport, setActiveReport] = useState('receipt');
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');
  const [onDate,     setOnDate]     = useState('');
  const [orderId,    setOrderId]    = useState('');
  const [techniqueQ, setTechniqueQ] = useState('');
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const fetchReport = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      if (activeReport === 'receipt') {
        if (!orderId) { setError('Укажите номер заказа'); setLoading(false); return; }
        const res  = await fetch(`${apiBase}/api/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) { setError('Заказ не найден'); setLoading(false); return; }
        setResult({ type: 'receipt', order: await res.json() });
        setLoading(false); return;
      }

      if (activeReport === 'unfinished' && !onDate) { setError('Укажите дату'); setLoading(false); return; }
      if (['accepted','completed','byTechnique'].includes(activeReport) && (!dateFrom || !dateTo)) {
        setError('Укажите период'); setLoading(false); return;
      }
      if (activeReport === 'byTechnique' && !techniqueQ) { setError('Укажите технику'); setLoading(false); return; }

      const res = await fetch(`${apiBase}/api/orders?limit=1000`, { headers: { Authorization: `Bearer ${token}` } });
      const { orders = [] } = await res.json();

      if (activeReport === 'unfinished') {
        const d = new Date(onDate); d.setHours(23,59,59,999);
        setResult({ type: 'unfinished', onDate, orders: orders.filter(o =>
          o.status !== 'delivered' && o.deadline && new Date(o.deadline) <= d) });
      }
      if (activeReport === 'accepted') {
        const from = new Date(dateFrom); from.setHours(0,0,0,0);
        const to   = new Date(dateTo);   to.setHours(23,59,59,999);
        setResult({ type: 'accepted', dateFrom, dateTo, orders: orders.filter(o => {
          const d = new Date(o.createdAt); return d >= from && d <= to && o.status !== 'delivered';
        })});
      }
      if (activeReport === 'completed') {
        const from = new Date(dateFrom); from.setHours(0,0,0,0);
        const to   = new Date(dateTo);   to.setHours(23,59,59,999);
        setResult({ type: 'completed', dateFrom, dateTo, orders: orders.filter(o => {
          if (o.status !== 'delivered') return false;
          const d = o.issueDate ? new Date(o.issueDate) : new Date(o.createdAt);
          return d >= from && d <= to;
        })});
      }
      if (activeReport === 'byTechnique') {
        const from = new Date(dateFrom); from.setHours(0,0,0,0);
        const to   = new Date(dateTo);   to.setHours(23,59,59,999);
        const q    = techniqueQ.toLowerCase();
        setResult({ type: 'byTechnique', dateFrom, dateTo, technique: techniqueQ,
          orders: orders.filter(o => {
            const d = new Date(o.createdAt);
            if (d < from || d > to) return false;
            // Ищем технику в items
            return o.items?.some(item => (item.price?.technique?.name || '').toLowerCase().includes(q));
          })
        });
      }
    } catch { setError('Ошибка загрузки данных'); }
    setLoading(false);
  };

  const fmt   = d => d ? new Date(d).toLocaleDateString('ru-RU') : '—';
  const money = n => Number(n || 0).toLocaleString('ru-RU') + ' ₽';
  const total = arr => arr.reduce((s, o) => s + (o.totalPrice || 0), 0);

  // Имя клиента из order.user или первичных полей
  const clientName = o => o.user?.name || o.clientName || '—';
  const clientPhone = o => o.user?.phone || o.phone || '—';

  const TABS = [
    { id: 'receipt',     label: 'В-01 Квитанция' },
    { id: 'unfinished',  label: 'В-02 Невыполненные на дату' },
    { id: 'accepted',    label: 'В-03 Принятые за период' },
    { id: 'completed',   label: 'В-04 Выполненные за период' },
    { id: 'byTechnique', label: 'В-05 По технике за период' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-bold text-on-surface">Отчёты</h2>
            <div className="flex gap-3">
              {result && <button onClick={() => window.print()} className="text-sm px-4 py-2 bg-secondary/20 text-secondary rounded-lg">🖨 Печать</button>}
              <button onClick={onClose} className="text-on-surface/40 hover:text-on-surface text-2xl leading-none">×</button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {TABS.map(t => (
              <button key={t.id} onClick={() => { setActiveReport(t.id); setResult(null); setError(''); }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeReport === t.id ? 'bg-secondary text-surface' : 'bg-white/5 text-on-surface/60 hover:bg-white/10'
                }`}>{t.label}</button>
            ))}
          </div>

          <div className="bg-white/5 rounded-xl p-5 mb-6">
            {activeReport === 'receipt' && (
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs text-on-surface/40 uppercase tracking-widest block mb-2">Номер заказа</label>
                  <input type="number" value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="Например: 5"
                    className="w-full bg-transparent border-b border-on-surface/20 py-2 text-on-surface focus:outline-none focus:border-secondary transition-colors" />
                </div>
                <button onClick={fetchReport} disabled={loading} className="btn-primary py-2 px-6 disabled:opacity-50">{loading ? '...' : 'Сформировать'}</button>
              </div>
            )}
            {activeReport === 'unfinished' && (
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs text-on-surface/40 uppercase tracking-widest block mb-2">На дату</label>
                  <input type="date" value={onDate} onChange={e => setOnDate(e.target.value)}
                    className="w-full bg-transparent border-b border-on-surface/20 py-2 text-on-surface focus:outline-none focus:border-secondary transition-colors" />
                </div>
                <button onClick={fetchReport} disabled={loading} className="btn-primary py-2 px-6 disabled:opacity-50">{loading ? '...' : 'Сформировать'}</button>
              </div>
            )}
            {['accepted','completed'].includes(activeReport) && (
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
                <button onClick={fetchReport} disabled={loading} className="btn-primary py-2 px-6 disabled:opacity-50">{loading ? '...' : 'Сформировать'}</button>
              </div>
            )}
            {activeReport === 'byTechnique' && (
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[180px]">
                  <label className="text-xs text-on-surface/40 uppercase tracking-widest block mb-2">Техника исполнения</label>
                  <input type="text" value={techniqueQ} onChange={e => setTechniqueQ(e.target.value)} placeholder="Масло, Акварель..."
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
                <button onClick={fetchReport} disabled={loading} className="btn-primary py-2 px-6 disabled:opacity-50">{loading ? '...' : 'Сформировать'}</button>
              </div>
            )}
            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          </div>

          {/* Результаты */}
          {result && (
            <div>
              {/* В-01: Квитанция */}
              {result.type === 'receipt' && (() => {
                const o = result.order;
                return (
                  <div className="bg-white/5 rounded-xl p-6">
                    <div className="text-center mb-6">
                      <div className="font-serif text-xl font-bold text-on-surface">КВИТАНЦИЯ №{o.id}</div>
                      <div className="text-on-surface/50 text-sm">от {fmt(o.createdAt)}</div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mb-6 text-sm">
                      <div><span className="text-on-surface/40">ФИО клиента:</span> <span className="text-on-surface font-medium">{clientName(o)}</span></div>
                      <div><span className="text-on-surface/40">Телефон:</span> <span className="text-on-surface font-medium">{clientPhone(o)}</span></div>
                      <div><span className="text-on-surface/40">Email:</span> <span className="text-on-surface font-medium">{o.user?.email || '—'}</span></div>
                      <div><span className="text-on-surface/40">Дата исполнения:</span> <span className="text-on-surface font-medium">{o.deadline || '—'}</span></div>
                    </div>
                    {/* Таблица позиций */}
                    <div className="overflow-x-auto mb-4">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-white/20">
                            {['№', 'Размер', 'Техника', 'Оформление', 'Сюжет', 'Кол-во', 'Цена за ед.', 'Итого'].map(h => (
                              <th key={h} className="text-left px-3 py-2 text-on-surface/40 text-xs font-semibold">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {o.items?.map((item, i) => {
                            const p = item.price || {};
                            return (
                              <tr key={i} className="border-b border-white/10">
                                <td className="px-3 py-3 text-on-surface/70">{i+1}</td>
                                <td className="px-3 py-3 text-on-surface">{p.canvasSize?.size}</td>
                                <td className="px-3 py-3 text-on-surface">{p.technique?.name}</td>
                                <td className="px-3 py-3 text-on-surface">{p.designType?.name}</td>
                                <td className="px-3 py-3 text-on-surface">{p.subject?.name}</td>
                                <td className="px-3 py-3 text-on-surface">{item.quantity}</td>
                                <td className="px-3 py-3 text-on-surface">{money(item.pricePerUnit)}</td>
                                <td className="px-3 py-3 font-bold text-secondary">{money(item.total)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {o.discount && (
                      <div className={`text-sm mb-2 ${o.discount.percent < 0 ? 'text-green-400' : 'text-secondary'}`}>
                        {o.discount.percent > 0 ? 'Надбавка' : 'Скидка'}: {o.discount.description} ({o.discount.percent > 0 ? '+' : ''}{o.discount.percent}%)
                      </div>
                    )}
                    <div className="flex justify-between items-center border-t border-white/20 pt-4">
                      <span className="text-on-surface/50 text-sm">Итого:</span>
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
                    {o.comments && <div className="mt-4 text-on-surface/40 text-xs">Примечание: {o.comments}</div>}
                  </div>
                );
              })()}

              {/* В-02: Невыполненные */}
              {result.type === 'unfinished' && (
                <div className="bg-white/5 rounded-xl p-6">
                  <div className="font-serif text-lg font-bold text-on-surface mb-1">Список невыполненных заказов</div>
                  <div className="text-on-surface/40 text-sm mb-5">на дату: {fmt(result.onDate)}</div>
                  {result.orders.length === 0 ? <div className="text-on-surface/30 text-center py-8">Нет невыполненных заказов</div> : (
                    <>
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-white/20">
                          {['№ заказа','Дата заказа','Дата исполнения','ФИО клиента','Телефон','Сумма'].map(h => (
                            <th key={h} className="text-left px-3 py-2 text-on-surface/40 text-xs">{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>{result.orders.map(o => (
                          <tr key={o.id} className="border-b border-white/5">
                            <td className="px-3 py-3 text-on-surface font-medium">#{o.id}</td>
                            <td className="px-3 py-3 text-on-surface/70">{fmt(o.createdAt)}</td>
                            <td className="px-3 py-3 text-on-surface/70">{o.deadline || '—'}</td>
                            <td className="px-3 py-3 text-on-surface">{clientName(o)}</td>
                            <td className="px-3 py-3 text-on-surface/70">{clientPhone(o)}</td>
                            <td className="px-3 py-3 text-secondary font-bold">{money(o.totalPrice)}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                      <div className="flex justify-between border-t border-white/20 pt-4 mt-2">
                        <span className="text-on-surface/50 text-sm">Итого ({result.orders.length}):</span>
                        <span className="font-black text-xl text-primary font-serif">{money(total(result.orders))}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* В-03 и В-04 — одинаковая таблица */}
              {['accepted','completed'].includes(result.type) && (
                <div className="bg-white/5 rounded-xl p-6">
                  <div className="font-serif text-lg font-bold text-on-surface mb-1">
                    {result.type === 'accepted' ? 'Принятые заказы за период' : 'Выполненные заказы за период'}
                  </div>
                  <div className="text-on-surface/40 text-sm mb-5">с {fmt(result.dateFrom)} по {fmt(result.dateTo)}</div>
                  {result.orders.length === 0 ? <div className="text-on-surface/30 text-center py-8">Нет заказов за период</div> : (
                    <>
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-white/20">
                          {['Дата заказа','№ заказа','ФИО клиента','Email','Телефон','Сумма'].map(h => (
                            <th key={h} className="text-left px-3 py-2 text-on-surface/40 text-xs">{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>{result.orders.map(o => (
                          <tr key={o.id} className="border-b border-white/5">
                            <td className="px-3 py-3 text-on-surface/70">{fmt(o.createdAt)}</td>
                            <td className="px-3 py-3 text-on-surface font-medium">#{o.id}</td>
                            <td className="px-3 py-3 text-on-surface">{clientName(o)}</td>
                            <td className="px-3 py-3 text-on-surface/70">{o.user?.email || '—'}</td>
                            <td className="px-3 py-3 text-on-surface/70">{clientPhone(o)}</td>
                            <td className="px-3 py-3 text-secondary font-bold">{money(o.totalPrice)}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                      <div className="flex justify-between border-t border-white/20 pt-4 mt-2">
                        <span className="text-on-surface/50 text-sm">Итого ({result.orders.length}):</span>
                        <span className="font-black text-xl text-primary font-serif">{money(total(result.orders))}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* В-05: По технике */}
              {result.type === 'byTechnique' && (
                <div className="bg-white/5 rounded-xl p-6">
                  <div className="font-serif text-lg font-bold text-on-surface mb-1">По технике исполнения</div>
                  <div className="text-on-surface/40 text-sm mb-1">Техника: <span className="text-on-surface">{result.technique}</span></div>
                  <div className="text-on-surface/40 text-sm mb-5">с {fmt(result.dateFrom)} по {fmt(result.dateTo)}</div>
                  {result.orders.length === 0 ? <div className="text-on-surface/30 text-center py-8">Нет заказов с такой техникой</div> : (
                    <>
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-white/20">
                          {['№ заказа','Дата заказа','ФИО клиента','Размер холста','Количество'].map(h => (
                            <th key={h} className="text-left px-3 py-2 text-on-surface/40 text-xs">{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>{result.orders.map(o => {
                          const totalQty = o.items?.reduce((s, i) => s + i.quantity, 0) || 1;
                          const sizes    = o.items?.map(i => i.price?.canvasSize?.size).filter(Boolean).join(', ') || '—';
                          return (
                            <tr key={o.id} className="border-b border-white/5">
                              <td className="px-3 py-3 text-on-surface font-medium">#{o.id}</td>
                              <td className="px-3 py-3 text-on-surface/70">{fmt(o.createdAt)}</td>
                              <td className="px-3 py-3 text-on-surface">{clientName(o)}</td>
                              <td className="px-3 py-3 text-on-surface/70">{sizes}</td>
                              <td className="px-3 py-3 text-on-surface">{totalQty}</td>
                            </tr>
                          );
                        })}</tbody>
                      </table>
                      <div className="flex justify-between border-t border-white/20 pt-4 mt-2">
                        <span className="text-on-surface/50 text-sm">
                          Итого картин: {result.orders.reduce((s, o) => s + (o.items?.reduce((q, i) => q + i.quantity, 0) || 1), 0)} шт. ({result.orders.length} заказов)
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

// ─── Главная страница ─────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [orders,        setOrders]        = useState([]);
  const [total,         setTotal]         = useState(0);
  const [pages,         setPages]         = useState(1);
  const [page,          setPage]          = useState(1);
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [search,        setSearch]        = useState('');
  const [loading,       setLoading]       = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPrices,    setShowPrices]    = useState(false);
  const [showReports,   setShowReports]   = useState(false);
  const [token,         setToken]         = useState('');
  const [adminLogin,    setAdminLogin]    = useState('');

  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (typeof window === 'undefined') return;
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

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_login');
    }
    router.push('/admin/login');
  };

  const onStatusChange = (id, status) => setOrders(o => o.map(x => x.id === id ? { ...x, status } : x));
  const onDelete = (id) => { setOrders(o => o.filter(x => x.id !== id)); setTotal(t => t - 1); };

  const stats = {
    total, new: orders.filter(o => o.status === 'new').length,
    in_progress: orders.filter(o => o.status === 'in_progress').length,
    ready: orders.filter(o => o.status === 'ready').length,
  };

  // Для таблицы — первая позиция заказа
  const orderSummary = (o) => {
    const item = o.items?.[0];
    if (!item) return '—';
    const p = item.price || {};
    return [p.canvasSize?.size, p.technique?.name].filter(Boolean).join(' · ');
  };

  return (
    <>
      <Head><title>Панель управления — ArtStudio</title></Head>

      <div className="min-h-screen bg-surface">
        <header className="bg-surface-container border-b border-white/5 px-6 md:px-12 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <span className="font-serif text-xl font-black italic text-secondary">Art<span className="text-primary">Studio</span></span>
            <span className="hidden md:block text-on-surface/30 text-sm">/ Панель управления</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowPrices(true)} className="btn-outline text-sm py-2 px-5 hidden md:flex">Справочники</button>
            <button onClick={() => setShowReports(true)} className="btn-outline text-sm py-2 px-5 hidden md:flex">📊 Отчёты</button>
            <a href="/" target="_blank" className="text-on-surface/40 hover:text-secondary text-sm transition-colors hidden md:block">Сайт ↗</a>
            <div className="flex items-center gap-2">
              <span className="text-on-surface/40 text-sm hidden md:block">{adminLogin}</span>
              <button onClick={logout} className="text-xs text-on-surface/40 hover:text-red-400 transition-colors px-3 py-1 glass rounded">Выйти</button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 md:px-12 py-10">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Всего заказов', val: total,             color: 'text-on-surface' },
              { label: 'Новых',         val: stats.new,         color: 'text-primary'    },
              { label: 'В работе',      val: stats.in_progress, color: 'text-secondary'  },
              { label: 'Готово',        val: stats.ready,       color: 'text-tertiary'   },
            ].map(s => (
              <div key={s.label} className="glass rounded-xl p-6">
                <div className={`text-4xl font-serif font-black mb-1 ${s.color}`}>{s.val}</div>
                <div className="text-xs text-on-surface/40 uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Поиск по имени, телефону, email..."
              className="flex-1 bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-on-surface placeholder-on-surface/30 focus:outline-none focus:border-secondary/50 transition-colors text-sm" />
            <div className="flex gap-2 flex-wrap">
              {[['all','Все'],['new','Новые'],['in_progress','В работе'],['ready','Готовы'],['delivered','Доставлены']].map(([v,l]) => (
                <button key={v} onClick={() => { setStatusFilter(v); setPage(1); }}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${statusFilter === v ? 'bg-secondary text-surface' : 'glass text-on-surface/60 hover:text-secondary'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="md:hidden mb-4 flex gap-3">
            <button onClick={() => setShowPrices(true)} className="btn-outline text-sm py-2 flex-1 justify-center">Справочники</button>
            <button onClick={() => setShowReports(true)} className="btn-outline text-sm py-2 flex-1 justify-center">📊 Отчёты</button>
          </div>

          <div className="glass rounded-xl overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['#','Клиент','Контакты','Заказ','Сумма','Статус','Дата',''].map(h => (
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
                      <td className="px-6 py-4 text-on-surface font-medium text-sm">{o.user?.name || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="text-on-surface/60 text-xs">{o.user?.phone || '—'}</div>
                        <div className="text-on-surface/40 text-xs">{o.user?.email || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-on-surface/70 text-xs">{orderSummary(o)}</div>
                        {o.discount && (
                          <div className={`text-xs ${o.discount.percent < 0 ? 'text-green-400' : 'text-secondary'}`}>
                            {o.discount.percent > 0 ? '+' : ''}{o.discount.percent}%
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-secondary font-bold text-sm">{o.totalPrice?.toLocaleString('ru-RU')} ₽</td>
                      <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
                      <td className="px-6 py-4 text-on-surface/40 text-xs">{formatDate(o.createdAt)}</td>
                      <td className="px-6 py-4"><button className="text-on-surface/30 hover:text-secondary transition-colors text-sm">→</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-white/5">
              {loading ? (
                <div className="p-8 text-center text-on-surface/40">Загрузка...</div>
              ) : orders.length === 0 ? (
                <div className="p-8 text-center text-on-surface/40">Заказы не найдены</div>
              ) : orders.map(o => (
                <div key={o.id} className="p-5 hover:bg-white/[0.02] cursor-pointer transition-colors" onClick={() => setSelectedOrder(o)}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium text-on-surface text-sm">{o.user?.name || '—'}</div>
                      <div className="text-on-surface/40 text-xs mt-0.5">#{o.id} · {formatDate(o.createdAt)}</div>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-on-surface/50 text-xs">{orderSummary(o)}</div>
                    <div className="text-secondary font-bold text-sm">{o.totalPrice?.toLocaleString('ru-RU')} ₽</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="glass px-4 py-2 rounded-lg text-sm disabled:opacity-30 hover:border-secondary/40 transition-colors">← Назад</button>
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-lg text-sm transition-all ${page === p ? 'bg-secondary text-surface font-bold' : 'glass text-on-surface/60 hover:text-secondary'}`}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="glass px-4 py-2 rounded-lg text-sm disabled:opacity-30 hover:border-secondary/40 transition-colors">Далее →</button>
            </div>
          )}
        </div>
      </div>

      {selectedOrder && (
        <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)}
          onStatusChange={onStatusChange} onDelete={onDelete} apiBase={API} token={token} />
      )}
      {showPrices  && <PricesModal  onClose={() => setShowPrices(false)}  apiBase={API} token={token} />}
      {showReports && <ReportsModal onClose={() => setShowReports(false)} apiBase={API} token={token} />}
    </>
  );
}
