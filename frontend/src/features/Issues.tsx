import { useState } from 'react';
import { useApp } from '../app/context';
import { api } from '../api/client';
import { useQuery } from '../api/query';
import type { Issue } from '../domain/models';
import { Header, Button, QueryState, Empty, Badge, Modal, Form } from '../ui/components';
export function Issues() { const { t } = useApp(), q = useQuery<{
    issues: Issue[];
}>('admin/issues'), [selected, setSelected] = useState<Issue | null>(null), [all, setAll] = useState(false); const rows = q.data?.issues.filter(i => all || i.status !== 'RESOLVED') || []; return <><Header title="Issues"><label className="inline-check"><input type="checkbox" checked={all} onChange={e => setAll(e.target.checked)}/>{t('All')}</label></Header><QueryState {...q} retry={q.reload}>{rows.length ? <div className="job-list">{rows.map(i => <article className="issue-card" key={i.id}><div className="actions"><Badge value={i.priority}/><Badge value={i.status}/><span>{i.object_code} · #{i.job_id}</span></div><h3>{t(i.type)}</h3><p>{i.description}</p><small>{i.address}</small>{i.resolution_note && <blockquote>{i.resolution_note}</blockquote>}<Button onClick={() => setSelected(i)}>{t('Edit')}</Button></article>)}</div> : <Empty />}</QueryState>{selected && <Modal title="Resolution" onClose={() => setSelected(null)}><Form fields={[{ name: 'status', label: 'Status', options: [{ value: 'OPEN', label: t('Open') }, { value: 'RESOLVED', label: t('Resolved') }] }, { name: 'resolutionNote', label: 'Resolution', type: 'textarea', wide: true }]} initial={{ status: selected.status, resolutionNote: selected.resolution_note }} onSubmit={async (v) => { await api(`admin/issues/${selected.id}`, { method: 'PATCH', body: v }); setSelected(null); }}/></Modal>}</>; }
