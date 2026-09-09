import { useApp } from '../app/context';
import { api } from '../api/client';
import { useQuery } from '../api/query';
import { Header, Form, QueryState, Action, Empty } from '../ui/components';
import { LanguagePicker } from './Auth';
export function Account() { const { user, t, reloadUser, language, logout } = useApp(), client = ['OWNER', 'PROPERTY_MANAGER'].includes(user!.role), q = useQuery<{
    client: Record<string, unknown>;
}>(client ? 'client/profile' : null); return <><Header title="Profile"><Action label="Sign out" onClick={logout}/></Header><div className="account-grid"><section className="panel"><div className="avatar large">{user!.full_name.slice(0, 1)}</div><h2>{user!.full_name}</h2><p>{user!.email}</p><p>{t(user!.role)}</p><label>{t('Language')}<LanguagePicker /></label></section><div><section className="panel"><h2>{t('New password')}</h2><Form fields={[{ name: 'currentPassword', label: 'Current password', type: 'password', required: true }, { name: 'newPassword', label: 'New password', type: 'password', required: true }]} onSubmit={v => api('account/password', { method: 'POST', body: v })}/></section>{client && <section className="panel"><QueryState {...q} retry={q.reload}>{q.data && <Form fields={[{ name: 'fullName', label: 'Full name', required: true }, { name: 'phone', label: 'Phone', type: 'tel' }, { name: 'companyName', label: 'Company' }, { name: 'billingName', label: 'Billing name' }, { name: 'billingAddress', label: 'Billing address', wide: true }]} initial={{ fullName: user!.full_name, phone: user!.phone, companyName: q.data.client.company_name, billingName: q.data.client.billing_name, billingAddress: q.data.client.billing_address }} onSubmit={async (v) => { await api('client/profile', { method: 'PATCH', body: { ...v, language } }); await reloadUser(); }}/>}</QueryState></section>}</div></div></>; }
export function Settings() { const q = useQuery<{
    settings: Record<string, unknown>;
}>('admin/settings'); return <><Header title="Settings"/><section className="panel"><QueryState {...q} retry={q.reload}>{q.data && <Form fields={[{ name: 'companyName', label: 'Company', required: true }, ...[['travelBuffer', 'Travel buffer'], ['safetyBuffer', 'Safety buffer'], ['clientBookingStepMinutes', 'Booking interval'], ['clientCancellationCutoffHours', 'Client cancellation cutoff (hours)'], ['cleanerCancellationCutoffMinutes', 'Cleaner cancellation cutoff (minutes)']].map(([name, label]) => ({ name, label, type: 'number', min: name === 'clientBookingStepMinutes' ? 5 : 0, required: true }))]} initial={q.data.settings} onSubmit={v => api('admin/settings', { method: 'PATCH', body: Object.fromEntries(Object.entries(v).map(([k, value]) => [k, k === 'companyName' ? value : Number(value)])) })}/>}</QueryState></section></>; }
export function Notifications() { const { t, language } = useApp(), q = useQuery<{
    notifications: {
        id: number;
        title: string;
        message: string;
        created_at: string;
    }[];
    unread: number;
}>('notifications'); return <><Header title="Notifications">{!!q.data?.unread && <Action label="Mark all read" onClick={() => api('notifications/read', { method: 'POST' })}/>}</Header><QueryState {...q} retry={q.reload}>{q.data?.notifications.length ? <div className="job-list">{q.data.notifications.map(n => <article className="issue-card" key={n.id}><h3>{t(n.title)}</h3><p>{n.message}</p><small>{new Date(n.created_at).toLocaleString(language)}</small></article>)}</div> : <Empty />}</QueryState></>; }
