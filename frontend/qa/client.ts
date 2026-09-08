// Synthetic browser QA transport, resolved ONLY by Vite --mode qa. Never bundled for production.
import {serviceToday} from '../src/domain/rules.mjs';
const role=new URLSearchParams(location.search).get('role')||'ADMIN';let language='ru';let active=role!=='LOGIN';const callbacks:((event:string)=>void)[]=[];let live=()=>{};
export const supabase:any={
 auth:{
  getSession:async()=>({data:{session:active?{}:null}}),
  onAuthStateChange:(fn:(e:string)=>void)=>{callbacks.push(fn);return {data:{subscription:{unsubscribe(){}}}};}
 },
 channel:()=>{const channel={on:(event:string,_:unknown,fn:()=>void)=>{if(event==='postgres_changes')live=fn;return channel;},subscribe:()=>channel};return channel;},
 removeChannel:async()=>{}
};
supabase.auth.signOut=async()=>{active=false;callbacks.forEach(f=>f('SIGNED_OUT'));return{}};
supabase.auth.signInWithPassword=async()=>({error:new Error('Synthetic login is disabled')});supabase.auth.resetPasswordForEmail=async()=>({});
document.getElementById('refresh-qa')?.addEventListener('click',()=>live());
const properties=[{id:10,code:'ST-010',name:'Riverside Residence',address:'Pribinova 24, Bratislava',zone:'Staré Mesto',client_id:21,service_category:'SHORT_STAY',bedrooms:2,bathrooms:1,checkout_time:'10:00',deadline_time:'17:00',duration_minutes:120,payout:27,client_price:59,active:true,approval_status:'APPROVED',access_instructions:'QA: use the main entrance',key_instructions:'QA: key box at reception'},{id:11,code:'ST-011',name:'Parkside Apartment',address:'Račianska 15, Bratislava',zone:'Nové Mesto',client_id:21,service_category:'HOME',bedrooms:1,bathrooms:1,checkout_time:'12:00',deadline_time:'19:00',duration_minutes:90,payout:21,client_price:45,active:true,approval_status:'APPROVED'}];
const jobs=properties.map((o,i)=>({id:i+1,object_id:o.id,object_name:o.name,object_code:o.code,address:o.address,service_date:serviceToday(),earliest_start:i?'14:00':'10:00',planned_start:i?'14:00':'10:00',deadline:o.deadline_time,duration_minutes:o.duration_minutes,status:i?'UNASSIGNED':'ACCEPTED',assigned_cleaner_id:i?null:7,cleaner_name:i?null:'QA Cleaner',payout:o.payout,bonus:0,client_price:o.client_price,access_instructions:o.access_instructions,key_instructions:o.key_instructions,checklist:[{id:101+i,label:'Final quality inspection',required:true,completed:false,photo_required:false}],photos:[],issues:[],events:[]}));
const cleaners=[{id:7,full_name:'QA Cleaner',email:'cleaner@example.invalid',phone:'',active:true,mode:'FLEX',transport:'PUBLIC',max_jobs_day:5}];const clients=[{id:21,full_name:'QA Owner',email:'owner@example.invalid',active:true,account_type:'OWNER'},{id:22,full_name:'QA Manager',email:'manager@example.invalid',active:true,account_type:'PROPERTY_MANAGER'}];let objectIds=[10];let availability={online:true,fromTime:'09:00',toTime:'19:00'};
export class ApiError extends Error{constructor(message:string,public status:number){super(message)}}export function clearApiSession(){}
export async function api<T>(route:string,{method='GET',body={},query={}}:any={}):Promise<T>{await new Promise(r=>setTimeout(r,150));let data:any;
 if(route==='me')data={user:{id:1,full_name:'QA User',email:'qa@example.invalid',role,language,phone:''}};
 else if(route==='account/language'){language=body.language;data={language}}
 else if(route==='admin/jobs'||route==='cleaner/dashboard'||route==='cleaner/marketplace'||route==='client/bookings'){if(method==='POST'){jobs.push({...jobs[0],id:jobs.length+1,object_id:Number(body.objectId),service_date:body.serviceDate,planned_start:body.plannedStart||body.startTime,status:'UNASSIGNED'});data={ok:true}}else{const items=jobs.filter(j=>route==='cleaner/marketplace'?!j.assigned_cleaner_id:route==='cleaner/dashboard'?j.assigned_cleaner_id===7:true);data=route==='client/bookings'?{bookings:items}:{jobs:items,availability}}}
 else if(/^(admin|client)\/objects$/.test(route)){if(method==='POST'){properties.push({...properties[0],...body,id:12});data={ok:true}}else data={objects:properties.map(o=>role==='OPERATIONS_MANAGER'?{...o,client_price:undefined}:o)}}
 else if(/^admin\/objects\/\d+\/checklist$/.test(route))data={items:jobs[0].checklist};
 else if(/^(admin|client)\/objects\/\d+$/.test(route)){const o=properties.find(o=>o.id===Number(route.split('/')[2]))!;Object.entries(body).forEach(([k,v])=>(o as any)[k.replace(/[A-Z]/g,c=>'_'+c.toLowerCase())]=v);data={object:o}}
 else if(route==='admin/cleaners')data={cleaners};else if(route==='admin/clients')data={clients};
 else if(/^admin\/clients\/\d+\/properties/.test(route)){if(method==='POST')objectIds=[...new Set([...objectIds,body.objectId])];if(method==='DELETE')objectIds=objectIds.filter(id=>id!==Number(route.split('/')[4]));data={objectIds}}
 else if(route==='cleaner/availability'){availability={...availability,...body};data={availability}}
 else if(route==='client/slots')data={slots:['10:00','12:00','14:00']};
 else if(/^(admin|cleaner)\/jobs\/\d+/.test(route)||/^client\/bookings\/\d+/.test(route)){const parts=route.split('/'),j=jobs.find(j=>j.id===Number(parts[2]))!;if(parts[3]==='status')j.status=body.status;if(parts[3]==='checklist')j.checklist=j.checklist.map(i=>({...i,completed:body.completed}));if(parts[3]==='complete'){if(j.checklist.some(i=>i.required&&!i.completed))throw new Error('Checklist is incomplete');j.status='COMPLETED'}if(parts[3]==='cancel')j.status='CANCELLED';if(parts[3]==='assign'||parts[3]==='accept'){j.assigned_cleaner_id=7;j.cleaner_name='QA Cleaner';j.status='ACCEPTED'}if(parts[3]==='rescue')j.status='RESCUE';data=route.startsWith('client/')?{booking:j,photos:j.photos,issues:j.issues}:j}
 else if(route.endsWith('/settlements'))data={summary:role==='CLEANER'?{earnedCents:2700,paidCents:0,payableCents:2700}:{chargedCents:5900,receivedCents:0,dueCents:5900},jobs:[],hasMore:false};
 else if(route==='admin/finance')data={summary:{totalRevenue:59,totalExpenses:27,profit:32},entries:[]};
 else if(route==='admin/recurring')data={schedules:[]};else if(route==='admin/issues')data={issues:[]};else if(route==='notifications')data={notifications:[],unread:0};
 else if(route==='admin/settings')data={settings:{companyName:'Shine Time',travelBuffer:15,safetyBuffer:10,clientBookingStepMinutes:30,clientCancellationCutoffHours:12,cleanerCancellationCutoffMinutes:90}};
 else if(route==='client/profile')data={client:{company_name:'QA Company'},user:{}};
 else if(method!=='GET')data={ok:true};else throw new Error(`Unimplemented QA route ${route}`);
 return structuredClone(data) as T;
}
export async function uploadProof(){throw new Error('Use isolated Supabase integration for real media upload verification')}
