// Only use a NEW, disposable test database. This refuses populated databases.
import pg from 'pg';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {writeFile,mkdir} from 'node:fs/promises';
import {createDatabase,seedDatabase} from '../tests/helpers/database.mjs';
const url=process.env.SHINE_TEST_DATABASE_URL;
if(!url)throw new Error('Set SHINE_TEST_DATABASE_URL to a new disposable PostgreSQL database named shine_test_*');
const pool=new pg.Pool({connectionString:url,max:50,connectionTimeoutMillis:10000});
try {
 const {rows:[info]}=await pool.query("select current_database() name,(select count(*)::int from pg_tables where schemaname not in ('pg_catalog','information_schema')) tables");
 assert.match(info.name,/^shine_test_/,'Refusing a database without the shine_test_ prefix');assert.equal(info.tables,0,'Refusing a populated database');
 const db={query:(...args)=>pool.query(...args),exec:sql=>pool.query(sql)};
 await createDatabase({database:db});await seedDatabase(db);
 const {rows:[job]}=await db.query("insert into st_jobs(object_id,client_id,service_date,earliest_start,deadline,duration_minutes,planned_start,status) values(1,1,current_date+1,'08:00','20:00',60,'10:00','UNASSIGNED') returning id");
 const began=performance.now();
 const results=await Promise.allSettled(Array.from({length:50},(_,i)=>db.query("select st_job_command($1,$2,'accept','{}',$3)",[i%2?2:3,job.id,crypto.randomUUID()])));
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1,'Exactly one claim must win');
 for(const r of results.filter(r=>r.status==='rejected'))assert.match(r.reason.message,/not available|already accepted/i);
 const {rows:[winner]}=await db.query('select assigned_cleaner_id from st_jobs where id=$1',[job.id]);
 const actor=Number(winner.assigned_cleaner_id)===1?2:3;
 await db.query("update st_jobs set status='CLEANING' where id=$1",[job.id]);
 const key=crypto.randomUUID();
 await Promise.all(Array.from({length:50},()=>db.query("select st_job_command($1,$2,'complete','{}',$3)",[actor,job.id,key])));
 assert.equal((await db.query("select count(*)::int n from st_job_events where job_id=$1 and event_type='COMPLETED'",[job.id])).rows[0].n,1);
 assert.equal((await db.query('select completed_jobs from st_cleaners where id=$1',[winner.assigned_cleaner_id])).rows[0].completed_jobs,1);
 const report={engine:'Native PostgreSQL',simultaneousRequests:50,claimWinners:1,duplicateCompletions:50,completionEvents:1,durationMs:Math.round(performance.now()-began)};
 await mkdir('artifacts',{recursive:true});await writeFile('artifacts/concurrency.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{await pool.end();}
