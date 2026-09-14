import test from 'node:test';
import assert from 'node:assert/strict';
import {propertyPhotosRoute} from '../supabase/functions/st-api/property-photos.mjs';
function fixture(role='CLEANER',status='ACCEPTED',assigned=2){
 let downloads=0;
 const ctx={appUser:{id:1,role},cleaner:{id:2},client:{id:3}};
 const service={from(table){const q={select(){return q},eq(){return q},order(){return q},maybeSingle(){return Promise.resolve({data:table==='st_object_photos'?{id:1,object_id:8,mime:'image/png',storage_path:'private.png'}:null})},then(resolve){resolve({data:[{id:1,caption:'Entrance',mime:'image/png'}]})}};return q},storage:{from(){return {download(){downloads++;return {data:new Blob([new Uint8Array([1,2,3])])}}}}}};
 const result=async p=>(await p).data;
 const args={ctx,service,result,ApiError:class extends Error{constructor(m,s){super(m);this.status=s}},jobFor:async()=>({object_id:8,status,assigned_cleaner_id:assigned}),clientObject:async()=>({id:8}),route:'cleaner/jobs/9/reference-photos',method:'GET',body:{}};
 return {args,downloads:()=>downloads};
}
for(const status of ['UNASSIGNED','RESCUE','CANCELLED','COMPLETED'])test(`reference photos denied for ${status}`,async()=>{
 const f=fixture('CLEANER',status);await assert.rejects(propertyPhotosRoute(f.args),e=>e.status===403);
 f.args.route+='/1';await assert.rejects(propertyPhotosRoute(f.args),e=>e.status===403);assert.equal(f.downloads(),0);
});
test('another cleaner cannot fetch a known photo ID',async()=>{const f=fixture('CLEANER','ACCEPTED',3);f.args.route+='/1';await assert.rejects(propertyPhotosRoute(f.args),e=>e.status===403);assert.equal(f.downloads(),0)});
test('accepted cleaner can read but cannot upload',async()=>{const f=fixture();assert.equal((await propertyPhotosRoute(f.args)).photos.length,1);f.args.method='POST';await assert.rejects(propertyPhotosRoute(f.args),e=>e.status===403)});
test('cleaner cannot bypass job authorization via property route',async()=>{const f=fixture();f.args.route='objects/8/reference-photos/1';await assert.rejects(propertyPhotosRoute(f.args),e=>e.status===403)});
test('file request rechecks job status after listing',async()=>{const f=fixture();await propertyPhotosRoute(f.args);f.args.jobFor=async()=>({object_id:8,status:'CANCELLED',assigned_cleaner_id:2});f.args.route+='/1';await assert.rejects(propertyPhotosRoute(f.args),e=>e.status===403);assert.equal(f.downloads(),0)});
test('accepted cleaner receives bytes without a shareable storage URL',async()=>{const f=fixture();f.args.route+='/1';const r=await propertyPhotosRoute(f.args);assert.equal(r.dataUrl,'data:image/png;base64,AQID');assert.equal(f.downloads(),1)});
test('owner is subject to existing object ownership check',async()=>{const f=fixture('OWNER');f.args.route='objects/8/reference-photos';f.args.clientObject=async()=>{throw new f.args.ApiError('Forbidden',403)};await assert.rejects(propertyPhotosRoute(f.args),e=>e.status===403)});
test('property managers cannot change guide photos',async()=>{const f=fixture('PROPERTY_MANAGER');f.args.route='objects/8/reference-photos';f.args.method='POST';await assert.rejects(propertyPhotosRoute(f.args),e=>e.status===403)});
