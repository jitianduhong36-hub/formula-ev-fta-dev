import {getPerformance} from './performance-config.js?v=capacity1';
export const limits={get maxNodes(){return getPerformance().maxNodes;},legacyBytes:200000,get maxModelBytes(){return getPerformance().modelMiB*1024*1024;},warningRatio:.85};
export function modelSize(model){return new TextEncoder().encode(JSON.stringify(model,null,2)).length;}
export function sizeMessage(model){const bytes=modelSize(model),size=(bytes/1024/1024).toFixed(2)+'MiB / '+getPerformance().modelMiB+'MiB';return {bytes,over:bytes>limits.maxModelBytes,warning:bytes>=limits.maxModelBytes*limits.warningRatio,text:'モデルサイズ：'+size+' ／ '+model.nodes.length.toLocaleString()+' / '+limits.maxNodes.toLocaleString()+'事象'+(bytes>=limits.maxModelBytes*limits.warningRatio?'。設定上限に近づいています。':'')};}
export function validateSize(model){if(modelSize(model)>limits.maxModelBytes)throw Error('モデル容量が設定上限 '+getPerformance().modelMiB+'MiB を超えています。「動作設定」で増やすか、モデルを分けてください。入力は保持しています。');}
