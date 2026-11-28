// Test isolato: npm install --no-save @sparticuz/chromium@158.0.0 playwright@1.62.1
// Avvio dalla radice del repository: node test-storico-ipad.mjs
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import chromium from '@sparticuz/chromium';
import { chromium as playwright, devices } from 'playwright';

const root = resolve(process.argv[2] || '.');
const archive = [{record_id:'FG-LOT-COLLAUDO',revision:1,payload:{
  id:'FG-LOT-COLLAUDO',module:'Produzione',at:new Date().toISOString(),data:{Preparazione:'Lotto sintetico'},
}}];
const server = createServer(async (req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/test-archive'){
      if(req.method==='POST'){
        const chunks=[];
        for await(const chunk of req)chunks.push(chunk);
        archive.push(...JSON.parse(Buffer.concat(chunks)));
      }
      res.setHeader('Content-Type','application/json');
      res.end(JSON.stringify(archive));
      return;
    }
    const path=resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
    if(!path.startsWith(root+sep)){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',path.endsWith('.mjs')?'text/javascript':'text/html');
    res.end(await readFile(path));
  }catch{res.writeHead(500).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
  browser=await playwright.launch({executablePath:await chromium.executablePath(),args:chromium.args,headless:true});
  const context=await browser.newContext({...devices['iPad Pro 11'],defaultBrowserType:'chromium'});
  await context.route(/cdn\.jsdelivr\.net.*supabase/,r=>r.fulfill({contentType:'application/javascript',body:`
    window.supabase={createClient:()=>({
      auth:{getUser:async()=>({data:{user:{id:'test'}}})},
      rpc:async()=>({data:[]}),
      from:()=>({
        select:()=>({eq(){return this},order(){return this},range:async()=>({data:await (await fetch('/test-archive')).json()})}),
        insert:async rows=>{const response=await fetch('/test-archive',{method:'POST',body:JSON.stringify(rows)});return response.ok?{}:{error:true}}
      })
    })}
  `}));
  const page=await context.newPage();
  const dialogs=[], errors=[];
  page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss()});
  page.on('pageerror',e=>errors.push(e.message));
  const url='http://127.0.0.1:'+server.address().port;
  await page.goto(url);
  await page.getByText('Archivio online caricato',{exact:true}).waitFor();
  const cases=['Temperature','Abbattimento positivo','Conservazione refrigerata','Registro fatture'];
  for(const [index,module] of cases.entries()){
    const marker='OPERATORE-COLLAUDO-'+index;
    await page.evaluate(m=>go(m),module);
    await page.locator('#entry').evaluate((form,operator)=>{
      for(const el of form.elements){
        if(el.tagName==='SELECT'){
          const option=[...el.options].find(o=>o.value && o.value!=='Non conforme');
          if(option)el.value=option.value;
        }else if(el.type==='number')el.value='3';
        else if(el.type==='datetime-local')el.value='2098-01-01T09:00';
        else if(el.type==='date')el.value='2026-11-28';
        else if(el.name)el.value=el.name==='Operatore'?operator:el.name==='Tipo documento'?'DDT':'PROVA';
      }
      form.requestSubmit();
    },marker);
    await page.getByText('Registrazioni salvate online',{exact:true}).waitFor();
    assert.equal(archive.filter(row=>row.payload.data.Operatore===marker && row.payload.module===module).length,1);
  }
  await page.close();
  const reopened=await context.newPage();
  await reopened.goto(url);
  await reopened.getByText('Archivio online caricato',{exact:true}).waitFor();
  for(const [index,module] of cases.entries()){
    await reopened.evaluate(m=>go(m),module);
    await reopened.locator('#archive').getByText('Operatore: OPERATORE-COLLAUDO-'+index,{exact:true}).waitFor();
  }
  assert.deepEqual(dialogs,[]);
  assert.deepEqual(errors,[]);
  console.log('PASS: quattro registri salvati via HTTP e ritrovati dopo riapertura con profilo iPad.');
}finally{
  await browser?.close();
  server.closeAllConnections();
  await new Promise(r=>server.close(r));
}
