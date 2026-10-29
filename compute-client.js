import {getPerformance} from './performance-config.js?v=capacity2';
const jobs=new Map();function state(owner,running){if(typeof dispatchEvent!=='undefined')dispatchEvent(new CustomEvent('compute:state',{detail:{owner,running}}));}

export function cancelJob(owner,reason='ユーザーが中断しました'){const job=jobs.get(owner);if(job){jobs.delete(owner);state(owner,false);job.worker.terminate();clearTimeout(job.timer);clearInterval(job.ticker);const e=Error(reason);e.code='CANCELLED';job.reject(e);}}
export function runJob(owner,kind,model,options={},onProgress=()=>{}){cancelJob(owner,'新しい計算に切り替えました');return new Promise((resolve,reject)=>{const settings=getPerformance(),started=Date.now();let worker;try{worker=new Worker(new URL('./compute-worker.js',import.meta.url),{type:'module'});}catch(e){reject(Error('バックグラウンド計算を開始できません：'+e.message));return;}let last={stage:'起動中'};const finish=()=>{worker.terminate();clearTimeout(job.timer);clearInterval(job.ticker);if(jobs.get(owner)===job){jobs.delete(owner);state(owner,false);}};const job={worker,reject,timer:null,ticker:null};jobs.set(owner,job);state(owner,true);
 job.timer=setTimeout(()=>{finish();const e=Error('設定した '+settings.seconds+'秒で処理を終了できなかったため中断しました。「動作設定」で変更できます。モデルは保持しています。');e.code='TIME_LIMIT';reject(e);},settings.seconds*1000+1500);
 job.ticker=setInterval(()=>onProgress({...last,elapsed:Date.now()-started}),500);
 worker.onmessage=({data})=>{if(jobs.get(owner)!==job)return;if(data.type==='progress'){last=data;onProgress({...data,elapsed:Date.now()-started});}else if(data.type==='error'){finish();reject(Error(data.message));}else if(data.type==='result'){finish();resolve(data.result);}};
 worker.onerror=e=>{finish();reject(Error('計算を実行できませんでした：'+(e.message||'Workerエラー')));};
 try{worker.postMessage({kind,model,options,settings});}catch(e){finish();reject(e);}
 });}
export const progressText=p=>(p.stage||'計算中')+(p.total?' '+p.processed.toLocaleString()+' / '+p.total.toLocaleString():'')+(p.bddNodes?' ／ BDD '+p.bddNodes.toLocaleString():'')+' ／ '+((p.elapsed||0)/1000).toFixed(1)+'秒';
