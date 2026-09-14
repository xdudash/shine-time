import { useState, useEffect, useRef, type ReactNode, type FormEvent } from 'react';
import { useApp } from '../app/context';
import { useMutation } from '../api/query';
export function Icon({ name, size = 20 }: {
    name: string;
    size?: number;
}) { const paths: Record<string, ReactNode> = { jobs: <><rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4m8-4v4M4 11h16m-11 4h2m3 0h2"/></>, properties: <path d="m3 10 9-7 9 7v11H3ZM9 21v-8h6v8"/>, people: <><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-17a3 3 0 0 1 0 6m2 5a5 5 0 0 1 3 4v2"/></>, finance: <><rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 10h18m-6 5h3"/></>, recurring: <path d="M20 9a8 8 0 0 0-14-4L3 8m0-5v5h5m-4 7a8 8 0 0 0 14 4l3-3m0 5v-5h-5"/>, issues: <path d="m12 3 10 18H2Z M12 9v5m0 3v1"/>, account: <><circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/></>, marketplace: <><circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5Z"/></>, arrow: <path d="M5 12h14m-5-5 5 5-5 5"/>, plus: <path d="M12 5v14M5 12h14"/>, close: <path d="m6 6 12 12M6 18 18 6"/>, check: <path d="m5 12 4 4L19 6"/>, logout: <path d="M9 4H4v16h5m3-8h9m-4-4 4 4-4 4"/>, search: <><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></> }; return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.jobs}</svg>; }
export function Button({ kind = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    kind?: string;
}) { return <button {...props} className={`button ${kind} ${props.className || ''}`}/>; }
export function Empty() { const { t } = useApp(); return <div className="empty"><Icon name="jobs" size={32}/><h3>{t('Nothing here yet')}</h3></div>; }
export function QueryState({ loading, error, retry, children }: {
    loading: boolean;
    error?: Error;
    retry: () => void;
    children: ReactNode;
}) { const { t } = useApp(); if (loading)
    return <div className="skeleton" role="status" aria-label={t('Loading…')}><div /><div /><div /></div>; return <>{error && <div className="error" role="alert">{error.message}<Button onClick={retry}>{t('Retry')}</Button></div>}{children}</>; }
export function Badge({ value }: {
    value: string;
}) { const { t } = useApp(); return <span className={`badge status-${value}`}>{t(value)}</span>; }
export function Header({ title, subtitle, children }: {
    title: string;
    subtitle?: string;
    children?: ReactNode;
}) { const { t } = useApp(); return <header className="page-header"><div><h1>{t(title)}</h1>{subtitle && <p>{subtitle}</p>}</div><div className="actions">{children}</div></header>; }
export function Modal({ title, onClose, children }: {
    title: string;
    onClose: () => void;
    children: ReactNode;
}) { const { t } = useApp(), ref = useRef<HTMLDialogElement>(null); useEffect(() => { const focus = document.activeElement as HTMLElement; ref.current?.showModal(); return () => focus?.focus(); }, []); return <dialog ref={ref} className="modal" onCancel={e => { e.preventDefault(); onClose(); }}><div className="modal-head"><h2>{t(title)}</h2><Button kind="icon" aria-label={t('Close')} onClick={onClose}><Icon name="close"/></Button></div>{children}</dialog>; }
export function Feedback({ mutation: m }: {
    mutation: ReturnType<typeof useMutation>;
}) { const { t } = useApp(); return <>{m.error && <p className="error" role="alert">{m.error}</p>}{m.done && <p className="success" role="status">{t('Saved')}</p>}</>; }
export type Field = {
    name: string;
    label: string;
    type?: string;
    required?: boolean;
    options?: {
        value: string | number;
        label: string;
    }[];
    min?: number;
    max?: number;
    wide?: boolean;
};
export type Values = Record<string, string | boolean>;
export function Form({ fields, initial = {}, onSubmit, submit = 'Save', onCancel }: {
    fields: Field[];
    initial?: Record<string, unknown>;
    onSubmit: (v: Values) => Promise<unknown>;
    submit?: string;
    onCancel?: () => void;
}) { const { t } = useApp(); const [v, setV] = useState<Values>(() => Object.fromEntries(fields.map(f => [f.name, f.type === 'checkbox' ? Boolean(initial[f.name]) : String(initial[f.name] ?? '')]))), m = useMutation(); function save(e: FormEvent) { e.preventDefault(); void m.run(() => onSubmit(v)); } return <form className="form" onSubmit={save}><fieldset disabled={m.busy}><div className="form-grid">{fields.map(f => <label key={f.name} className={`${f.wide ? 'wide' : ''} ${f.type === 'checkbox' ? 'check-field' : ''}`}><span>{t(f.label)}{f.required && ' *'}</span>{f.options ? <select required={f.required} value={String(v[f.name])} onChange={e => setV({ ...v, [f.name]: e.target.value })}><option value="">{t('Select…')}</option>{f.options.map(o => <option value={o.value} key={o.value}>{o.label}</option>)}</select> : f.type === 'textarea' ? <textarea required={f.required} rows={3} value={String(v[f.name])} onChange={e => setV({ ...v, [f.name]: e.target.value })}/> : <input type={f.type || 'text'} required={f.required} min={f.min} max={f.max} step={f.type === 'number' ? 'any' : undefined} minLength={f.type === 'password' ? 8 : undefined} checked={f.type === 'checkbox' ? Boolean(v[f.name]) : undefined} value={f.type === 'checkbox' ? undefined : String(v[f.name])} onChange={e => setV({ ...v, [f.name]: f.type === 'checkbox' ? e.target.checked : e.target.value })}/>}</label>)}</div><Feedback mutation={m}/><div className="form-actions">{onCancel && <Button type="button" onClick={onCancel}>{t('Cancel')}</Button>}<Button type="submit" kind="primary">{t(m.busy ? 'Loading…' : submit)}</Button></div></fieldset></form>; }
export function Action({ label, onClick, danger = false }: {
    label: string;
    onClick: () => Promise<unknown>;
    danger?: boolean;
}) { const { t } = useApp(), m = useMutation(); return <div><Button disabled={m.busy} kind={danger ? 'danger' : ''} onClick={() => void m.run(onClick)}>{t(m.busy ? 'Loading…' : label)}</Button><Feedback mutation={m}/></div>; }
export const options = (values: string[], t: (k: string) => string) => values.map(value => ({ value, label: t(value) }));
