import { useState } from 'react';
import { useApp } from '../app/context';
import { api } from '../api/client';
import { useQuery } from '../api/query';
import { Button, QueryState, Empty, Modal, Form } from '../ui/components';
type Group = {id:number|null;name:string;count:number;chargedCents:number;paidCents:number;dueCents:number};
type Row = {id:number;object_name:string;service_date:string;chargedCents:number;paidCents:number;dueCents:number};
type Report = {groups:Group[];jobs:Row[];hasMore:boolean};
export function MonthlyFinance({month}:{month:string}) {
 const {t,money}=useApp();
 const [side,setSide]=useState('CLIENT'),[search,setSearch]=useState(''),[party,setParty]=useState<Group|null>(null),[receipt,setReceipt]=useState('');
 const q=useQuery<Report>('admin/settlements/monthly',{month,side});
 const groups=(q.data?.groups||[]).filter(g=>g.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
 const totals=(q.data?.groups||[]).reduce((a,g)=>({charged:a.charged+g.chargedCents,paid:a.paid+g.paidCents,due:a.due+g.dueCents}),{charged:0,paid:0,due:0});
 return <>
  <div className="tabs"><button className={side==='CLIENT'?'selected':''} onClick={()=>{setSide('CLIENT');setReceipt('')}}>{t('Clients')}</button><button className={side==='CLEANER'?'selected':''} onClick={()=>{setSide('CLEANER');setReceipt('')}}>{t('Cleaners')}</button></div>
  <p>{t('Monthly settlement help')}</p>
  {receipt&&<p role="status" className="success">{receipt}</p>}
  <QueryState {...q} retry={q.reload}>
   <div className="finance-summary">{[[t('Accrued'),totals.charged],[t(side==='CLIENT'?'Received':'Paid'),totals.paid],[t(side==='CLIENT'?'Receivable':'Payable'),totals.due]].map(([label,value])=><div key={label}><span>{label}</span><strong>{money(Number(value)/100)}</strong></div>)}</div>
   <label>{t('Search')}<input value={search} onChange={e=>setSearch(e.target.value)}/></label>
   {groups.length?<div className="settlement-groups">{groups.map(g=><article className="settlement-group" key={g.id??'missing'}><div><h3>{g.name}</h3><small>{g.count} · {t('Completed cleanings')}</small></div><div><small>{t('Accrued')}</small><strong>{money(g.chargedCents/100)}</strong></div><div><small>{t(side==='CLIENT'?'Received':'Paid')}</small><strong>{money(g.paidCents/100)}</strong></div><div><small>{t(side==='CLIENT'?'Receivable':'Payable')}</small><strong>{money(g.dueCents/100)}</strong></div><Button disabled={g.id===null} onClick={()=>setParty(g)}>{t('Select cleanings')}</Button></article>)}</div>:<Empty/>}
  </QueryState>
  {party&&<Modal title={`${t(side==='CLIENT'?'Client receipt':'Cleaner payment')} · ${party.name}`} onClose={()=>setParty(null)}><Batch key={`${month}-${side}-${party.id}`} month={month} side={side} party={party} onDone={r=>{setParty(null);setReceipt(`${t('Recorded')}: ${money(r.amountCents/100)} · ${r.count} ${t('Completed cleanings')}`)}}/></Modal>}
 </>;
}
function Batch({month,side,party,onDone}:{month:string;side:string;party:Group;onDone:(r:{amountCents:number;count:number})=>void}) {
 const {t,money}=useApp();
 const q=useQuery<Report>('admin/settlements/monthly',{month,side,partyId:party.id!});
 // Preserve the amounts the administrator reviewed, even if live data changes.
 const [selected,setSelected]=useState<Map<number,number>>(new Map());
 const rows=q.data?.jobs||[],eligible=rows.filter(j=>j.dueCents>0),total=[...selected.values()].reduce((a,b)=>a+b,0);
 const all=eligible.length>0&&eligible.every(j=>selected.has(j.id));
 function toggle(j:Row){setSelected(old=>{const next=new Map(old);if(next.has(j.id))next.delete(j.id);else next.set(j.id,j.dueCents);return next})}
 return <div className="batch-payment"><p>{month} · {t('Record transfer help')}</p><QueryState {...q} retry={q.reload}>
  {q.data?.hasMore&&<p className="error">{t('Batch limit help')}</p>}
  <label className="batch-check"><input type="checkbox" checked={all} disabled={!eligible.length} onChange={()=>setSelected(all?new Map():new Map(eligible.map(j=>[j.id,j.dueCents])))}/>{t('Select all unpaid')} ({eligible.length})</label>
  <div className="batch-jobs">{rows.map(j=><label className="batch-job" key={j.id}><input type="checkbox" checked={selected.has(j.id)} disabled={j.dueCents<=0} onChange={()=>toggle(j)}/><span><strong>{j.object_name}</strong><small>{j.service_date} · #{j.id}</small></span><strong>{money(j.dueCents/100)}</strong></label>)}</div>
  <div className="batch-total"><span>{t('Selected')}: {selected.size}</span><strong>{money(total/100)}</strong></div>
  {selected.size>0&&<Form fields={[{name:'note',label:'Payment note optional',type:'textarea',wide:true}]} submit={side==='CLIENT'?'Record client receipt':'Record cleaner payment'} onSubmit={async v=>{
   try{const result=await api<{count:number;amountCents:number}>('admin/settlements/batch',{method:'POST',body:{month,side,partyId:party.id,items:[...selected].map(([jobId,amountCents])=>({jobId,amountCents})),note:v.note}});onDone(result)}
   catch(e){if(e instanceof Error&&e.message.includes('Balance changed'))throw new Error(t('Balance changed help'));throw e}
  }}/> }
 </QueryState></div>;
}
