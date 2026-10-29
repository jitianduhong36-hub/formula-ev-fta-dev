/* SheetJS CE 0.20.3, vendored from its official CDN; see vendor/SheetJS-LICENSE.txt. */
importScripts('./vendor/xlsx.full.min.js');
self.onmessage=event=>{try{
 const book=XLSX.read(event.data,{type:'array',dense:true,sheetRows:1051,cellFormula:false,cellHTML:false,bookVBA:false,raw:true});
 if(book.SheetNames.length>50)throw Error('Excelのシートは50枚以内にしてください');
 const sheets=book.SheetNames.map(name=>{const sheet=book.Sheets[name];if(!sheet['!ref'])return {name,rows:[]};const range=XLSX.utils.decode_range(sheet['!fullref']||sheet['!ref']);if(range.e.r>=1050||range.e.c>=80)throw Error('シート「'+name+'」は1050行・80列以内に分割してください');return {name,rows:XLSX.utils.sheet_to_json(sheet,{header:1,raw:false,defval:'',blankrows:true})};});
 self.postMessage({sheets});
}catch(e){self.postMessage({error:e.message||'Excelを読み込めませんでした'});}};
