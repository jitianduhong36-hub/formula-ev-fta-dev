import {analyze} from './engine.js?v=imports2';
import {displayId,systemText} from './event-codes.js?v=imports2';
export const views=[['home','ホーム','プロジェクトの全体像'],['fta','FTA','故障のつながりを解析'],['fmea','FMEA','故障モードと影響を整理'],['parts','部品一覧','基本事象との対応付け'],['trees','木と接続','独立した木・枝の接続を管理'],['imports','インポート','CSV・Excel・FTA JSONを追加'],['roadmap','今後の機能','ETA・対策管理・レビュー'],['storage','保存とデータ','開発版の端末内保存'],['help','使い方','はじめての解析ガイド']];
export function overview(m){const a=analyze(m);return {nodes:m.nodes.length,basics:m.nodes.filter(n=>n.type==='BASIC').length,groups:m.groups?.length||0,parts:m.fmea?.parts?.length||0,q:a.q,cuts:a.cutSets.length,unreachable:a.unreachable,cutError:a.cutError};}
export function searchWorkspace(m,query){const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/[-_]/g,''),words=norm(query).trim().split(/\s+/);if(!query.trim())return [];
 const rows=[...m.nodes.map(n=>({kind:'事象',id:n.id,code:displayId(n),label:n.label,meta:systemText(n),view:'fta'})),...(m.fmea?.parts||[]).map(p=>({kind:'部品',id:p.id,code:p.id,label:p.name,meta:[p.subsystem,p.function].join(' '),view:'parts'}))];
 return rows.filter(r=>words.every(w=>norm([r.id,r.code,r.label,r.meta].join(' ')).includes(w))).slice(0,40);
}
