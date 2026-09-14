import test from 'node:test';import assert from 'node:assert/strict';import {createDatabase} from './helpers/database.mjs';
test('property guides are private and direct client access is blocked',async()=>{const db=await createDatabase();try{
 assert.equal((await db.query("select public from storage.buckets where id='st-property-guides'")).rows[0].public,false);
 assert.equal((await db.query("select relrowsecurity from pg_class where oid='public.st_object_photos'::regclass")).rows[0].relrowsecurity,true);
 assert.equal((await db.query("select permissive from pg_policies where policyname='st_property_guides_backend_only'")).rows[0].permissive,'RESTRICTIVE');
 await db.exec('set role authenticated');await assert.rejects(db.query('select * from st_object_photos'),/permission denied/);
}finally{await db.close()}});
