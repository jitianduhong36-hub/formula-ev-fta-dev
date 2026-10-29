import {localKey} from './sheets.js?v=imports2';
export function setupCollaboration({isDraft}){
 const $=id=>document.getElementById(id);
 function status(){$('sync-status').textContent='開発版 / 端末内保存';$('cloud-state').textContent=isDraft()?'入力中 · 変更の反映待ち':'開発版専用の端末内保存';}
 for(const id of ['create-room','copy-room','sync-now','leave-room','room-link','presence-panel','drive-panel'])$(id).hidden=true;
 document.querySelector('.collaboration > .hint').textContent='開発版の保存領域は現行版と分離されています。この版はクラウド・Google Driveへの接続を停止しており、共同編集はできません。JSONを書き出してバックアップできます。';
 $('sheet-identity').textContent='現行の共有ルームには接続しません';status();
 if(new URLSearchParams(location.hash.slice(1)).has('room')){$('cloud-state').textContent='現行の共有リンクは開発版では接続できません。JSON読込を利用してください。';}
 return {changed:status,draftChanged:status,get unsaved(){return isDraft();},get storageKey(){return localKey(location.hash);},active:false};
}
