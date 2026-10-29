import {validate} from './engine.js?v=imports1';
import {descendants,connect,disconnect,moveConnection} from './tree-edit.js?v=imports1';
import {ensureFmea,rowId,splitRowId} from './fmea-model.js?v=imports1';
import {nextEventCode,displayId} from './event-codes.js?v=imports1';
const copy=x=>structuredClone(x),fresh=prefix=>prefix+crypto.randomUUID();
import {trees} from './tree-metadata.js?v=imports1';
export {trees} from './tree-metadata.js?v=imports1';
export function registerRoot(model,rootId,title){const m=copy(model);m.trees=copy(trees(m));if(!m.nodes.some(n=>n.id===rootId))throw Error('登録する事象がありません');if(m.trees.some(t=>t.rootId===rootId))throw Error('このルートは登録済みです');m.trees.push({id:fresh('tree-'),rootId,title:title.trim()});validate(m);return m;}
export function addTree(model,title){if(!title.trim())throw Error('木の名前を入力してください');const m=copy(model);m.trees=copy(trees(m));const id=fresh('E_');m.nodes.push({id,code:nextEventCode(m,'EVT'),system:'EVT',label:title.trim(),type:'BASIC',p:0});m.trees.push({id:fresh('tree-'),rootId:id,title:title.trim()});m.top=id;validate(m);return m;}
export function branchOperation(model,{child,parent,from,mode}){
 if(mode==='attach')return connect(model,parent,child);
 if(mode==='move')return moveConnection(model,child,from,parent);
 if(mode==='detach')return disconnect(model,from,child);
 throw Error('接続操作を選択してください');
}
export function mergeTreeModels(destination,source,{parent=null,filename='FTA JSON'}={}){
 validate(destination);validate(source);let m=ensureFmea(destination);m.trees=copy(trees(m));
 const idMap=new Map(),groupMap=new Map(),partMap=new Map(),warnings=[];
 const mapId=id=>{if(!idMap.has(id))idMap.set(id,fresh('E_'));return idMap.get(id);};source.nodes.forEach(n=>mapId(n.id));
 m.groups=m.groups||[];for(const g of source.groups||[]){const id=fresh('G_');groupMap.set(g.id,id);let name=g.name,number=1;while(m.groups.some(x=>x.name.toLowerCase()===name.toLowerCase()))name=g.name.slice(0,30)+' (取込'+number+++')';m.groups.push({...copy(g),id,name});}
 const used=new Set(m.nodes.map(n=>displayId(n).toUpperCase()));let renamed=0;
 for(const n of source.nodes){const node=copy(n);node.id=mapId(n.id);if(n.children)node.children=n.children.map(mapId);if(n.groupId)node.groupId=groupMap.get(n.groupId);let code=n.code||(/^[A-Z0-9][A-Z0-9_-]{0,39}$/i.test(n.id)?n.id:null);if(code){const base=code;let i=1;while(used.has(code.toUpperCase()))code=base.slice(0,32)+'_I'+i++;if(code!==base)renamed++;node.code=code;used.add(code.toUpperCase());}node.importSource={file:filename.slice(0,200),originalId:n.id,originalCode:n.code||n.id};m.nodes.push(node);}
 const sourceTrees=trees(source);for(const t of sourceTrees)m.trees.push({...copy(t),id:fresh('tree-'),rootId:mapId(t.rootId),source:filename.slice(0,200)});
 for(const p of source.fmea?.parts||[]){let id=p.id,i=1;while(m.fmea.parts.some(x=>x.id===id))id=p.id.slice(0,60)+'_I'+i++;partMap.set(p.id,id);m.fmea.parts.push({...copy(p),id,basicIds:p.basicIds.map(mapId)});}
 for(const [key,row]of Object.entries(source.fmea?.rows||{})){const ids=splitRowId(key);if(ids){const r=copy(row);delete r.reviewedHash;m.fmea.rows[rowId(mapId(ids.basicId),mapId(ids.topId))]=r;}}
 for(const [id,s]of Object.entries(source.fmea?.topSeverity||{}))m.fmea.topSeverity[mapId(id)]=s;
 if(source.fmea?.importedRows?.length){m.fmea.importedRows=m.fmea.importedRows||[];for(const r of source.fmea.importedRows)m.fmea.importedRows.push({...copy(r),id:fresh('IM-'),partId:partMap.get(r.partId)||r.partId});}
 const rootId=mapId(source.top);if(renamed)warnings.push(renamed+'件の表示IDの重複を _I番号 で区別しました');
 warnings.push('取り込んだ事象は新しい内部IDです。既存事象とは独立として計算します。同じ物理原因なら取り込み後に既存事象へ明示的につなぎ替えてください。');
 if(source.mission!==destination.mission)warnings.push('評価期間・条件が異なります。接続・確率比較の前に揃えてください。');
 if(parent){const r=connect(m,parent,rootId);m=r.model;warnings.push(...r.warnings);}validate(m);
 return {model:m,rootId,idMap,renamed,warnings,added:source.nodes.length};
}
export function exportBranch(model,root){validate(model);const ids=descendants(model,root),m=copy(model);m.top=root;m.title=model.nodes.find(n=>n.id===root).label;m.nodes=m.nodes.filter(n=>ids.has(n.id));m.trees=trees(model).filter(t=>ids.has(t.rootId));if(!m.trees.some(t=>t.rootId===root))m.trees.unshift({id:'tree:'+root,rootId:root,title:m.title});m.groups=(m.groups||[]).filter(g=>m.nodes.some(n=>n.groupId===g.id));if(m.fmea){m.fmea.targetIds=[root];m.fmea.rows=Object.fromEntries(Object.entries(m.fmea.rows||{}).filter(([id])=>{const r=splitRowId(id);return r&&ids.has(r.basicId)&&ids.has(r.topId);}));m.fmea.topSeverity=Object.fromEntries(Object.entries(m.fmea.topSeverity||{}).filter(([id])=>ids.has(id)));m.fmea.parts=(m.fmea.parts||[]).filter(p=>p.basicIds.some(id=>ids.has(id))).map(p=>({...p,basicIds:p.basicIds.filter(id=>ids.has(id))}));delete m.fmea.importedRows;}validate(m);return m;}
