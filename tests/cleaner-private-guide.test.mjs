import test from 'node:test';import assert from 'node:assert/strict';
import {projectResponse} from '../supabase/functions/st-api/security.mjs';
const job={id:9,object_id:8,access_instructions:'Door code',key_instructions:'Key safe',parking:'Gate code',linen_location:'Cupboard',supplies_location:'Storage',wifi:'Password',object_notes:'Alarm',payout:25};
for(const status of ['COMPLETED','CANCELLED','UNASSIGNED','RESCUE'])test(`cleaner history does not disclose private guide for ${status}`,()=>{
 const r=projectResponse({jobs:[{...job,status}]},'CLEANER').jobs[0];
 for(const key of ['access_instructions','key_instructions','parking','linen_location','supplies_location','wifi','object_notes'])assert.equal(r[key],undefined);
 assert.equal(r.payout,25);
});
test('accepted cleaner retains instructions and administrator retains history',()=>{
 assert.equal(projectResponse({...job,status:'ACCEPTED'},'CLEANER').key_instructions,'Key safe');
 assert.equal(projectResponse({...job,status:'COMPLETED'},'ADMIN').key_instructions,'Key safe');
});
