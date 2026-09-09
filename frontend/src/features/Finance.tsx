import { useState } from 'react';
import { useApp } from '../app/context';
import { api } from '../api/client';
import { useQuery } from '../api/query';
import { serviceToday, parseMoney } from '../domain/rules.mjs';
import { Header, Button, QueryState, Empty, Modal, Form, options } from '../ui/components';
type Totals = {
    chargedCents?: number;
    receivedCents?: number;
    dueCents?: number;
    earnedCents?: number;
    paidCents?: number;
    payableCents?: number;
};
type Row = Totals & {
    id: number;
    service_date: string;
    object_code: string;
    object_name: string;
};
type Report = {
    summary: Totals;
    jobs: Row[];
    hasMore: boolean;
    nextCursor: number;
};
export function Finance() { const { user, t, money } = useApp(), [month, setMonth] = useState(serviceToday().slice(0, 7)), [before, setBefore] = useState<number | undefined>(), [previous, setPrevious] = useState<Row[]>([]), [paying, setPaying] = useState<Row | null>(null), [tab, setTab] = useState('settlements'); const admin = user!.role === 'ADMIN', prefix = admin ? 'admin' : user!.role === 'CLEANER' ? 'cleaner' : 'client', q = useQuery<Report>(`${prefix}/settlements`, { month, ...(before ? { before } : {}) }), summary = q.data?.summary || {}; const keys: {
    key: keyof Totals;
    label: string;
}[] = [{ key: 'chargedCents', label: 'Revenue' }, { key: 'receivedCents', label: 'Received' }, { key: 'dueCents', label: 'Receivable' }, { key: 'earnedCents', label: 'Payout' }, { key: 'paidCents', label: 'Paid' }, { key: 'payableCents', label: 'Payable' }], rows = [...previous, ...q.data?.jobs || []]; return <><Header title="Finance"><input type="month" aria-label={t('Month')} value={month} onChange={e => { setMonth(e.target.value); setBefore(undefined); setPrevious([]); }}/></Header>{admin && <div className="tabs"><button className={tab === 'settlements' ? 'selected' : ''} onClick={() => setTab('settlements')}>{t('Payments')}</button><button className={tab === 'report' ? 'selected' : ''} onClick={() => setTab('report')}>{t('Profit / loss')}</button></div>}{tab === 'report' ? <Profit month={month}/> : <QueryState {...q} retry={q.reload}><div className="finance-summary">{keys.filter(k => summary[k.key] !== undefined).map(k => <div key={k.key}><span>{t(k.label)}</span><strong>{money(Number(summary[k.key]) / 100)}</strong></div>)}</div>{rows.length ? <div className="table-wrap"><table><thead><tr><th>{t('Object')}</th><th>{t('Date')}</th>{keys.filter(k => summary[k.key] !== undefined).map(k => <th key={k.key}>{t(k.label)}</th>)}{admin && <th />}</tr></thead><tbody>{rows.map(r => <tr key={r.id}><td><strong>{r.object_name}</strong><small>{r.object_code} · #{r.id}</small></td><td>{r.service_date}</td>{keys.filter(k => summary[k.key] !== undefined).map(k => <td key={k.key}>{money(Number(r[k.key] || 0) / 100)}</td>)}{admin && <td><Button onClick={() => setPaying(r)}>{t('Record payment')}</Button></td>}</tr>)}</tbody></table></div> : <Empty />}{q.data?.hasMore && <Button onClick={() => { setPrevious(rows); setBefore(q.data?.nextCursor); }}>{t('Load more')}</Button>}</QueryState>}{paying && <Modal title={`${t('Record payment')} · ${paying.object_name}`} onClose={() => setPaying(null)}><Form fields={[{ name: 'kind', label: 'Type', required: true, options: options(['CLIENT_PAYMENT', 'CLEANER_PAYOUT', 'CLIENT_REFUND', 'CLEANER_RETURN'], t) }, { name: 'amount', label: 'Amount', required: true }, { name: 'note', label: 'Notes', type: 'textarea', wide: true }]} initial={{ kind: 'CLIENT_PAYMENT' }} onSubmit={async (v) => { await api('admin/settlements', { method: 'POST', body: { jobId: paying.id, kind: v.kind, amountCents: parseMoney(v.amount), note: v.note } }); setPaying(null); setBefore(undefined); setPrevious([]); }}/></Modal>}</>; }
function Profit({ month }: {
    month: string;
}) { const { t, money } = useApp(), q = useQuery<{
    summary: {
        totalRevenue: number;
        totalExpenses: number;
        profit: number;
    };
    entries: {
        id: number;
        entry_date: string;
        entry_type: string;
        amount: number;
        description: string;
    }[];
}>('admin/finance', { month }), [adding, setAdding] = useState(false); return <><div className="actions"><Button onClick={() => setAdding(true)}>{t('Add entry')}</Button></div><QueryState {...q} retry={q.reload}><div className="finance-summary">{q.data && [['Revenue', q.data.summary.totalRevenue], ['Expenses', q.data.summary.totalExpenses], ['Profit', q.data.summary.profit]].map(([label, value]) => <div key={label}><span>{t(String(label))}</span><strong>{money(Number(value))}</strong></div>)}</div><div className="job-list">{q.data?.entries?.map(e => <article className="issue-card" key={e.id}><h3>{e.description || t(e.entry_type)}</h3><span>{e.entry_date} · {money(Number(e.amount))}</span></article>)}</div></QueryState>{adding && <Modal title="Add entry" onClose={() => setAdding(false)}><Form fields={[{ name: 'entryDate', label: 'Date', type: 'date', required: true }, { name: 'entryType', label: 'Type', required: true, options: options(['INCOME', 'EXPENSE'], t) }, { name: 'amount', label: 'Amount', required: true }, { name: 'description', label: 'Description', type: 'textarea', wide: true, required: true }]} initial={{ entryDate: serviceToday(), entryType: 'EXPENSE' }} onSubmit={async (v) => { await api('admin/finance/entries', { method: 'POST', body: { ...v, amount: parseMoney(v.amount) / 100, category: 'OTHER' } }); setAdding(false); }}/></Modal>}</>; }
