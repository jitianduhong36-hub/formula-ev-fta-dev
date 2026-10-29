import {configurePerformance} from './performance-config.js?v=capacity1';
import {analyze} from './engine.js?v=capacity1';
import {renderDiagram} from './diagram.js?v=capacity1';
import {generateFmea} from './fmea-engine.js?v=capacity1';
self.onmessage=async({data})=>{const started=Date.now();try{configurePerformance(data.settings);const progress=p=>self.postMessage({type:'progress',...p});progress({stage:'開始'});const deadline=started+data.settings.seconds*1000;let result;
 if(data.kind==='analysis')result=analyze(data.model,{deadline,onProgress:progress});
 else if(data.kind==='diagram'){progress({stage:'図の配置'});result=renderDiagram(data.model,data.options);}
 else if(data.kind==='fmea'){result=await generateFmea(data.model,{maxRows:data.settings.fmeaRows,maxPathsPerRow:data.settings.pathsPerRow,maxDetailPaths:data.settings.detailPaths,onProgress:progress,analyzeTop:m=>analyze(m,{deadline,importance:false,onProgress:progress})});delete result.config.analyzeTop;delete result.config.onProgress;}
 else throw Error('計算の種類が不正です');self.postMessage({type:'result',result,elapsed:Date.now()-started});
 }catch(e){self.postMessage({type:'error',message:e.message||String(e)});}};
