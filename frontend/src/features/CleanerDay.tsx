import {useState} from 'react';
import {useApp} from '../app/context';
import {useQuery} from '../api/query';
import {serviceToday} from '../domain/rules.mjs';
import type {Job} from '../domain/models';
import {Availability,JobDetail} from './Jobs';
import {Header,Button,Badge,Modal,QueryState,Empty,Icon} from '../ui/components';
export function CleanerDay(){
 const {t,money}=useApp(),[date,setDate]=useState(serviceToday()),[selected,setSelected]=useState<number|null>(null),[history,setHistory]=useState(false);
 const q=useQuery<{jobs:Job[];availability:{online:boolean;fromTime:string;toTime:string}}>('cleaner/dashboard',{date});
 const jobs=(q.data?.jobs||[]).filter(j=>j.service_date===date);
 const active=jobs.filter(j=>!['COMPLETED','CANCELLED'].includes(j.status)).sort((a,b)=>{
  const rank=(j:Job)=>['CLEANING','ARRIVED','EN_ROUTE','ACCEPTED'].indexOf(j.status);
  return rank(a)-rank(b)||(a.planned_start||a.earliest_start).localeCompare(b.planned_start||b.earliest_start);
 });
 const done=jobs.filter(j=>j.status==='COMPLETED'),next=active[0];
 const earning=done.reduce((n,j)=>n+Number(j.payout||0)+Number(j.bonus||0),0);
 const step=(j:Job)=>j.status==='CLEANING'?'Continue cleaning':'Open cleaning';
 return <div className="cleaner-day"><Header title="My day"><input type="date" aria-label={t('Date')} value={date} onChange={e=>setDate(e.target.value||serviceToday())}/></Header>
 <div className="day-switch"><Button onClick={()=>setDate(serviceToday())}>{t('Today')}</Button><a className="button" href="#marketplace">{t('Find more jobs')}</a><a className="button" href="#finance">{t('My monthly earnings')}</a></div>
 <QueryState {...q} retry={q.reload}>
  <div className="finance-summary"><div><span>{t('Remaining today')}</span><strong>{active.length}</strong></div><div><span>{t('Completed')}</span><strong>{done.length}</strong></div><div><span>{t('Earned on this date')}</span><strong>{money(earning)}</strong></div></div>
  {next?<section className="next-cleaning"><div className="section-heading"><span>{t('Next cleaning')}</span><Badge value={next.status}/></div><h2>{next.object_name}</h2><p>{next.address}</p><div className="next-facts"><strong>{(next.planned_start||next.earliest_start)?.slice(0,5)} — {next.deadline?.slice(0,5)}</strong><span>{next.duration_minutes} {t('minutes')}</span><strong>{money(Number(next.payout||0)+Number(next.bonus||0))}</strong></div><Button kind="primary" onClick={()=>setSelected(next.id)}>{t(step(next))}<Icon name="arrow"/></Button><p className="next-help">{t('Cleaning detail help')}</p></section>:<section className="panel"><h2>{t('No remaining jobs')}</h2><p>{t('No remaining jobs help')}</p></section>}
  {active.length>1&&<section><h2>{t('Then today')}</h2><div className="job-list">{active.slice(1).map(j=><button className="cleaner-upcoming" key={j.id} onClick={()=>setSelected(j.id)}><strong>{(j.planned_start||j.earliest_start)?.slice(0,5)}</strong><span>{j.object_name}<small>{j.address}</small></span><strong>{money(Number(j.payout||0)+Number(j.bonus||0))}</strong><Icon name="arrow"/></button>)}</div></section>}
  <section className="cleaner-history"><Button onClick={()=>setHistory(!history)}>{t('Completed cleanings')} ({done.length})</Button>{history&&(done.length?<div className="job-list">{done.map(j=><button className="cleaner-upcoming" key={j.id} onClick={()=>setSelected(j.id)}><span>{j.object_name}<small>{t('COMPLETED')}</small></span><strong>{money(Number(j.payout||0)+Number(j.bonus||0))}</strong></button>)}</div>:<Empty/>)}</section>
  {q.data?.availability&&<Availability key={date} date={date} initial={q.data.availability}/>}
 </QueryState>{selected!==null&&<Modal title="Cleaning workspace" onClose={()=>setSelected(null)}><JobDetail id={selected} operator={false} cleaner/></Modal>}</div>;
}
