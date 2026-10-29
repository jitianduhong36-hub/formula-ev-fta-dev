import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sample} from './sample.js';
import {overview,searchWorkspace,views} from './workspace-model.js';
import {localKey} from './sheets.js';
test('development storage never addresses the current app local storage',()=>{
 assert.equal(localKey(''),'formula-ev-fta-dev-v1');assert.equal(localKey('#local=11111111-1111-1111-1111-111111111111&view=fta'),'fta-dev-local:11111111-1111-1111-1111-111111111111');
 const config=readFileSync(new URL('./collaboration-config.js',import.meta.url),'utf8');assert.ok(config.includes('disabled:true'));assert.ok(!config.includes('supabase.co'));const ui=readFileSync(new URL('./collaboration-ui.js',import.meta.url),'utf8');assert.ok(!ui.includes('fetch('));assert.ok(!ui.includes('RoomClient'));
 assert.match(readFileSync(new URL('./index.html',import.meta.url),'utf8'),/connect-src &#39;none&#39;/);
});
test('workspace overview uses the real model analysis',()=>{const s=overview(sample);assert.equal(s.nodes,10);assert.equal(s.basics,6);assert.equal(s.cuts,5);assert.ok(s.q>0);assert.ok(views.some(v=>v[0]==='fmea'));});
test('workspace search covers event aliases and explicitly registered parts without changing data',()=>{
 const m=structuredClone(sample);Object.assign(m.nodes.find(n=>n.id==='LV'),{system:'BAT',code:'BAT-001'});m.fmea={parts:[{id:'P-001',name:'冷却ポンプ',function:'循環',subsystem:'冷却',basicIds:[]}]};const before=JSON.stringify(m);
 assert.equal(searchWorkspace(m,'電池')[0].id,'LV');assert.equal(searchWorkspace(m,'bat001')[0].id,'LV');assert.equal(searchWorkspace(m,'ポンプ')[0].kind,'部品');assert.deepEqual(searchWorkspace(m,''),[]);assert.equal(JSON.stringify(m),before);
});
