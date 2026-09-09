import test from 'node:test';
import assert from 'node:assert/strict';
import {createDatabase,seedDatabase} from './helpers/database.mjs';
test('monthly groups cover 1000 jobs and bulk settlement is atomic, scoped and replay safe',async()=>{
 const db=await createDatabase();try{
 await seedDatabase(db);
 await db.exec("insert into st_objects(client_id,code,name,address) select 1,'BULK-'||n,'Synthetic property','Synthetic address' from generate_series(3,1000) n");
 await db.exec("insert into st_jobs(object_id,client_id,service_date,status,assigned_cleaner_id,client_price,payout) select id,1,current_date,'COMPLETED',1,40,20 from st_objects");
 const month=(await db.query("select to_char(current_date,'YYYY-MM') m")).rows[0].m;
 const report=async(actor=1)=>(await db.query('select st_monthly_settlements($1,$2,$3,$4) r',[actor,month,'CLEANER',1])).rows[0].r;
 const r=await report();assert.equal(r.groups[0].count,1000);assert.equal(r.groups[0].dueCents,2000000);assert.equal(r.jobs.length,1000);
 await assert.rejects(report(2),/forbidden/i);
 const pay=(items,key='bulk-a',party=1)=>db.query('select st_settle_batch(1,$1,$2,$3,$4::jsonb,$5,$6) r',[month,'CLEANER',party,JSON.stringify(items),'',key]);
 const items=r.jobs.map(j=>({jobId:j.id,amountCents:j.dueCents}));
 await assert.rejects(pay([{jobId:1,amountCents:2000},{jobId:2,amountCents:2001}],'bad'),/balance/i);
 assert.equal((await db.query('select count(*)::int n from st_settlements')).rows[0].n,0);
 await assert.rejects(pay([items[0]],'wrong',2),/counterparty/i);
 const first=(await pay(items)).rows[0].r;assert.equal(first.amountCents,2000000);assert.equal(first.count,1000);
 assert.deepEqual((await pay([...items].reverse())).rows[0].r,first);
 await assert.rejects(pay(items.slice(1)),/request/i);
 await assert.rejects(pay(items,'duplicate'),/balance/i);
 assert.equal((await report()).groups[0].dueCents,0);
 assert.equal((await db.query('select count(*)::int n from st_settlements')).rows[0].n,1000);
 // Client receipts remain independent of cleaner payouts.
 const clients=(await db.query('select st_monthly_settlements(1,$1,$2,1) r',[month,'CLIENT'])).rows[0].r;
 assert.equal(clients.groups[0].dueCents,4000000);
 }finally{await db.close()}
});
