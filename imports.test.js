import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {sample} from './sample.js';
import {analyze,validate} from './engine.js';
import {parseDelimited,planTableImport,suggestMapping,guessHeader,tableFromJson} from './table-import.js';
import {mergeTreeModels,addTree,registerRoot,branchOperation,exportBranch,trees} from './tree-library.js';
import {rowId} from './fmea-model.js';
const table=[['過去FMEA・例示'],['部品ID','部品名称','故障モード','S','O','D','基本事象ID'],['P-BAT','電池セル','短絡','8','3','2','LV'],['P-BAT','電池セル','断線','8','2','','LV']];
test('FMEA sheet header mapping retains multiple modes for one explicitly named part',()=>{
 const m=structuredClone(sample);assert.equal(guessHeader(table),1);const p=planTableImport(m,table,suggestMapping(table[1]),{headerRow:1,kind:'fmea',filename:'old.xlsx',sheet:'FMEA',batch:'test'});assert.deepEqual(p.errors,[]);assert.equal(p.created,1);assert.equal(p.records,2);assert.equal(p.model.fmea.importedRows[1].D,undefined);assert.equal(p.model.fmea.importedRows[0].source.row,3);assert.deepEqual(p.model.fmea.parts[0].basicIds,['LV']);assert.equal(m.fmea,undefined);assert.equal(analyze(p.model).q,analyze(m).q);
});
test('invalid scores, text, duplicate updates and unresolved explicit IDs block the entire import',()=>{
 const rows=[...table.map(r=>[...r])];rows[2][3]='99';rows[3][6]='missing';const p=planTableImport(sample,rows,suggestMapping(rows[1]),{headerRow:1,kind:'fmea'});assert.equal(p.errors.length,2);
 const good=planTableImport(sample,table,suggestMapping(table[1]),{headerRow:1,kind:'fmea'});assert.ok(planTableImport(good.model,table,suggestMapping(table[1]),{headerRow:1}).errors.some(e=>e.includes('重複')));
 const update=planTableImport(good.model,[['部品ID','部品名称'],['P-BAT','電池セル改訂']],{partId:0,name:1},{upsert:true});assert.deepEqual(update.errors,[]);assert.equal(update.model.fmea.parts[0].name,'電池セル改訂');assert.deepEqual(update.model.fmea.parts[0].basicIds,['LV']);
});
test('parts without IDs never merge by similar names; JSON arrays and quoted TSV work',()=>{
 const p=planTableImport(sample,[['名称'],['電池'],['電池']],{name:0});assert.equal(p.created,2);assert.notEqual(p.model.fmea.parts[0].id,p.model.fmea.parts[1].id);
 assert.deepEqual(parseDelimited('名称\t機能\r\n"電池\nセル"\t"A""B"'),[['名称','機能'],['電池\nセル','A"B']]);assert.throws(()=>parseDelimited('a,"bad'),/引用符/);assert.deepEqual(tableFromJson([{name:'セル',basicIds:['LV']}]),[['name','basicIds'],['セル','["LV"]']]);
});
test('separate FTA imports remap IDs while preserving internal sharing, groups, FMEA keys and parts',()=>{
 const src=structuredClone(sample);src.fmea={schema:1,topSeverity:{TOP:8},rows:{'FM:LV@TOP':{D:3,note:'保持',reviewedHash:'old'}},parts:[{id:'P1',name:'電源',basicIds:['LV']}]};const m=mergeTreeModels(sample,src,{filename:'battery.json'});validate(m.model);assert.equal(m.model.top,sample.top);assert.equal(m.added,10);assert.equal(m.model.nodes.length,20);assert.equal(trees(m.model).length,2);const lv=m.idMap.get('LV');assert.equal(m.model.nodes.filter(n=>n.children?.includes(lv)).length,2);assert.notEqual(lv,'LV');assert.equal(m.model.fmea.rows[rowId(lv,m.rootId)].D,3);assert.equal(m.model.fmea.rows[rowId(lv,m.rootId)].reviewedHash,undefined);assert.deepEqual(m.model.fmea.parts[0].basicIds,[lv]);assert.equal(analyze(m.model).q,analyze(sample).q);assert.equal(src.fmea.rows['FM:LV@TOP'].reviewedHash,'old');
});
test('import into vehicle, detach, move, reconnect and export a battery subtree without deleting nodes',()=>{
 const vehicle={version:1,title:'車両',mission:'走行',top:'V',nodes:[{id:'V',label:'車両故障',type:'OR',children:['A']},{id:'A',label:'その他',type:'BASIC',p:.01}]};const merged=mergeTreeModels(vehicle,sample,{parent:'V'});assert.equal(merged.model.nodes.find(n=>n.id==='V').children.length,2);const detached=branchOperation(merged.model,{mode:'detach',child:merged.rootId,from:'V'}).model;assert.equal(detached.nodes.length,12);const attached=branchOperation(detached,{mode:'attach',child:merged.rootId,parent:'A'});assert.equal(attached.model.nodes.find(n=>n.id==='A').type,'OR');const moved=branchOperation(attached.model,{mode:'move',child:merged.rootId,from:'A',parent:'V'});assert.ok(moved.warnings.length);assert.equal(moved.model.nodes.find(n=>n.id==='A').type,'BASIC');assert.throws(()=>branchOperation(moved.model,{mode:'attach',child:'V',parent:merged.rootId}),/循環/);const out=exportBranch(moved.model,merged.rootId);assert.equal(out.nodes.length,10);assert.equal(out.top,merged.rootId);validate(out);assert.equal(analyze(out).q,analyze(sample).q);
});
test('registering a root and creating an empty tree leave existing graph untouched; malformed metadata rejects',()=>{
 const r=registerRoot(sample,'HV','高電圧だけ');assert.equal(r.nodes.length,10);assert.equal(r.trees.length,2);const n=addTree(r,'車両全体');assert.equal(n.nodes.length,11);assert.equal(n.trees.length,3);assert.equal(sample.top,'TOP');n.trees[0].rootId='missing';assert.throws(()=>validate(n),/木の登録/);
});
test('merged models enforce limits and malformed archive records cannot bypass validation',()=>{
 const m=structuredClone(sample);m.fmea={schema:1,rows:{},parts:[],importedRows:[{id:'IM-1',partId:'P',S:11}]};assert.throws(()=>validate(m),/S\/O\/D/);const full=structuredClone(sample);for(let i=0;i<291;i++)full.nodes.push({id:'UN'+i,label:'未接続',type:'BASIC',p:0});assert.throws(()=>mergeTreeModels(sample,full),/300/);
});
test('vendored SheetJS reads legacy XLS and XLSX without executing formula or macro code',()=>{
 const context=vm.createContext({console});vm.runInContext(readFileSync(new URL('./vendor/xlsx.full.min.js',import.meta.url),'utf8'),context);const X=context.XLSX;assert.equal(X.version,'0.20.3');const wb=X.utils.book_new();X.utils.book_append_sheet(wb,X.utils.aoa_to_sheet(table),'過去FMEA');for(const bookType of ['xlsx','xls']){const bytes=X.write(wb,{type:'buffer',bookType});const out=X.read(bytes,{type:'array',sheetRows:1051,cellFormula:false,cellHTML:false,dense:true});const data=X.utils.sheet_to_json(out.Sheets[out.SheetNames[0]],{header:1,raw:false,defval:''});assert.equal(data[2][1],'電池セル');assert.equal(guessHeader(data),1);}
});

test('native part JSON IDs and multiple row mappings survive import, including own exported score labels',()=>{
 const rows=tableFromJson({parts:[{id:'P-NATIVE',name:'電源',basicIds:['LV']}]});const result=planTableImport(sample,rows,suggestMapping(rows[0]));assert.deepEqual(result.errors,[]);assert.equal(result.model.fmea.parts[0].id,'P-NATIVE');
 const multi=[['部品ID','部品名称','故障モード','基本事象ID','S（重大度）','O（発生度）','D（検出度）'],['P','電源','故障A','LV',8,3,2],['P','電源','故障B','CAN',8,2,'']];const plan=planTableImport(sample,multi,suggestMapping(multi[0]),{kind:'fmea'});assert.deepEqual(plan.errors,[]);assert.deepEqual(plan.model.fmea.parts[0].basicIds,['LV','CAN']);assert.equal(plan.model.fmea.importedRows[0].S,8);
});
