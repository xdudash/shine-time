import test from 'node:test';
Error.stackTraceLimit=0;
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createClient} from '@supabase/supabase-js';
const bundle=await build({entryPoints:['supabase/functions/st-api/admin.ts'],bundle:true,write:false,format:'esm',platform:'node',external:['npm:*']});
const {createAdmin}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
function setup(){
 const rows={st_objects:{id:7,name:'Flat'},st_client_accounts:{id:7,user_id:2,notes:null},st_users:{id:2,full_name:'Owner',phone:'',language:'ru',active:true}};
 const service=createClient('https://fixture.invalid','test-key',{global:{fetch:async(url,init)=>{
  const table=new URL(url).pathname.split('/').pop(), body=init.body?JSON.parse(init.body):null;
  if(init.method==='PATCH'&&!Object.keys(body).length)return new Response(JSON.stringify({code:'PGRST116',message:'Cannot coerce the result to a single JSON object',details:'The result contains 0 rows'}),{status:406});
  if(body)Object.assign(rows[table],body);
  return new Response(JSON.stringify(rows[table]),{status:200,headers:{'Content-Type':'application/json'}});
 }}});
 const result=async p=>{const {data,error}=await p;if(error)throw new Error(error.message);return data};
 return createAdmin({service,result,one:result,number:Number,ApiError:Error,today:()=>'2026-09-09'}).routeAdmin;
}
for(const route of ['admin/objects/7','admin/clients/7'])test(`${route} accepts saving without changed fields`,async()=>{
 const response=await setup()({appUser:{role:'ADMIN'}},route,'PATCH',{}, {requestId:'repeat-save'});
 assert.equal((response.object||response.client).id,7);
});
test('changed property fields are still persisted',async()=>{
 const r=await setup()({appUser:{role:'ADMIN'}},'admin/objects/7','PATCH',{}, {name:'Updated'});
 assert.equal(r.object.name,'Updated');
});
