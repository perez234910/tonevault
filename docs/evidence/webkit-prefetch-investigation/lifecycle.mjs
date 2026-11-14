import {createServer} from 'node:http';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
const {webkit}=await import(process.env.TONEVAULT_PLAYWRIGHT_MODULE || 'playwright');
const output=resolve(process.env.TONEVAULT_LIFECYCLE_OUTPUT || 'lifecycle.json');
const events=[];let releaseReplacement,notifyReplacement;let ingress=0;
const server=createServer((req,res)=>{
 if(req.url==='/replacement'){events.push({event:'replacement-server-arrival',at:Date.now()});notifyReplacement();releaseReplacement=()=>{res.writeHead(200,{'content-type':'text/html'});res.end('<h1>replacement</h1>')};return}
 if(req.url==='/probe'){ingress++;res.writeHead(200,{'content-type':'text/plain'});res.end('probe');return}
 res.writeHead(200,{'content-type':'text/html'});res.end('<h1>control document</h1>');
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await webkit.launch();const cells=[];
try{
 for(const replacement of [false,true]){
  const page=await browser.newPage();const logs=[];page.on('console',m=>{if(m.type()==='error')logs.push({type:'console',text:m.text()})});page.on('pageerror',e=>logs.push({type:'pageerror',text:e.message}));
  await page.goto(base+'/initial');
  const oldWindow=await page.evaluateHandle(()=>window);
  let navigation;
  if(replacement){const received=new Promise(r=>notifyReplacement=r);navigation=page.goto(base+'/replacement');await received}
  const before=ingress;
  const result=await oldWindow.evaluate(async()=>{try{const r=await fetch('/probe');return {ok:r.ok,status:r.status}}catch(e){return {ok:false,name:e.name,message:e.message}}});
  if(replacement){releaseReplacement();await navigation}
  cells.push({replacement,result,probeReachedServer:ingress>before,logs});
  if(!replacement){assert.equal(result.status,200);assert.equal(ingress>before,true);assert.deepEqual(logs,[])}
  await page.close();
 }
}finally{await browser.close();await new Promise(r=>server.close(r))}
const result={note:'Isolated GET-only local HTTP lifecycle control, no Next.js/application/database/credentials. Matching Playwright 1.65/WebKit r2388.',cells};console.log(JSON.stringify(result,null,2));await writeFile(output,JSON.stringify(result,null,2)+'\n');
