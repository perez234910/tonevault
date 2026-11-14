import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const pw=await import(process.env.TONEVAULT_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.TONEVAULT_TEST_BASE||'http://localhost:3000';
const evidence=resolve(process.env.TONEVAULT_STOREFRONT_EVIDENCE||'docs/evidence/storefront-refinement/after');await mkdir(evidence,{recursive:true});
const results=[];
async function shot(page,name,width) {
 await page.locator('main .product-card').first().waitFor();
 for (const image of await page.locator('main img').all()) { await image.scrollIntoViewIfNeeded(); await image.evaluate(n=>n.decode()); }
 await page.evaluate(()=>window.scrollTo(0,0));await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:join(evidence,`${width}-${name}.png`),fullPage:true,caret:'initial'});
}
try{
for(const engine of ['chromium','webkit'])for(const width of [1440,390])for(const reduced of [false,true]){
 const browser=await pw[engine].launch(engine==='chromium'&&process.env.TONEVAULT_BROWSER_EXECUTABLE?{executablePath:process.env.TONEVAULT_BROWSER_EXECUTABLE}:{});
 try{
 const page=await browser.newPage({viewport:{width,height:900},reducedMotion:reduced?'reduce':'no-preference',hasTouch:width<640});page.setDefaultTimeout(15000);
 const errors=[];const writes=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('request',r=>{if(r.url().startsWith(base+'/api/')&&!['GET','HEAD'].includes(r.method()))writes.push(r.method())});
 const response=await page.request.get(base+'/api/products');assert.equal(response.status(),200);const products=await response.json();assert.equal(products.ok,true);const sample=response.headers()['x-tonevault-data-source']==='local-sample';
 await page.goto(base);await page.getByRole('heading',{name:'Find your sound. Know its story.',exact:true}).waitFor();
 const headline=await page.getByRole('heading',{level:1}).evaluate(n=>parseFloat(getComputedStyle(n).fontSize));assert.ok(headline<=42);
 if(engine==='chromium'&&!reduced)await shot(page,'home',width);
 await page.goto(base+'/browse?offset=0');await page.getByRole('heading',{name:'Browse the vault',exact:true}).waitFor();
 const brand=page.getByRole('combobox',{name:'Brand',exact:true});await brand.click();await page.getByRole('option',{name:'PRS',exact:true}).click();await page.waitForURL(u=>u.searchParams.get('brand')==='PRS'&&!u.searchParams.has('offset'));
 await page.getByRole('combobox',{name:'Price',exact:true}).click();await page.getByRole('option',{name:'Under ₱250,000',exact:true}).click();await page.waitForURL(u=>u.searchParams.get('minPrice')==='0'&&u.searchParams.get('maxPrice')==='250000'&&u.searchParams.get('brand')==='PRS');
 await brand.focus();await page.keyboard.press('Enter');await page.getByRole('listbox').waitFor();await page.keyboard.press('f');await page.waitForFunction(()=>document.activeElement?.textContent==='Fender');await page.keyboard.press('Enter');await page.waitForURL(u=>u.searchParams.get('brand')==='Fender');
 for(const label of ['Brand','Price','Verification','Condition','Availability']){
 const trigger=page.getByRole('combobox',{name:label,exact:true});await trigger.click();const list=page.getByRole('listbox');await list.waitFor();
 if(label==='Brand'&&engine==='chromium'&&!reduced)await page.screenshot({path:join(evidence,`${width}-filter.png`),caret:'initial'});
 const box=await list.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+.5);await page.keyboard.press('End');await page.keyboard.press('Home');await page.keyboard.press('Escape');
 await page.waitForFunction((name)=>document.activeElement?.getAttribute('aria-label')===name,label);
 }
 await brand.click();await page.getByRole('listbox').waitFor();await page.waitForTimeout(60);await page.mouse.click(width-8,150);await page.getByRole('listbox').waitFor({state:'hidden'});
 assert.equal(await page.locator('select:not([aria-hidden="true"]):visible').count(),0);
 if(width>=1024){
 const nav=page.getByRole('navigation',{name:'Main navigation',exact:true});assert.equal(await page.locator('.nav-surface').count(),0);
 for(const name of ['Browse','Verified','Collection']){const item=name==='Collection'?nav.getByRole('button',{name,exact:true}):nav.getByRole('link',{name,exact:true});const before=await item.evaluate(n=>({bg:getComputedStyle(n).backgroundColor,transform:getComputedStyle(n).transform}));await item.hover();assert.deepEqual(await item.evaluate(n=>({bg:getComputedStyle(n).backgroundColor,transform:getComputedStyle(n).transform})),before);}
 await nav.getByRole('button',{name:'Collection',exact:true}).focus();await page.keyboard.press('ArrowDown');await page.waitForFunction(()=>document.activeElement?.textContent?.includes('All instruments'));await page.keyboard.press('End');await page.waitForFunction(()=>document.activeElement?.textContent?.includes('Sold instruments'));await page.keyboard.press('Escape');
 }
 await page.goto(base+'/browse');await page.locator('main .product-card').first().waitFor();
 if(engine==='chromium'&&!reduced)await shot(page,'browse',width);
 const instrument=products.products.find(p=>p.status==='available'&&p.stock>0);assert.ok(instrument,'Storefront requires an available catalog instrument');const title=`${instrument.year} ${instrument.brand} ${instrument.model}`;await page.goto(base+'/products/'+instrument.id);await page.getByRole('heading',{name:title,exact:true}).waitFor();
 const gallery=page.locator('.gallery-image');if(await gallery.count()){for(const image of await gallery.all())await image.evaluate(n=>n.decode());}else{await page.getByRole('img',{name:`No photographs available for ${title}`,exact:true}).waitFor();}
 await page.getByRole('button',{name:'Add to cart',exact:true}).click();await page.locator('.cart-trigger').click();await page.getByRole('dialog',{name:/Your cart/}).waitFor();await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
 await page.goto(base+'/cart');const quantity=page.getByRole('spinbutton',{name:`Quantity for ${title}`,exact:true});await quantity.waitFor();assert.equal(await quantity.inputValue(),'1');await page.reload();await quantity.waitFor();assert.equal(await quantity.inputValue(),'1');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
 results.push({engine,width,reduced,dataSource:sample?'local-sample':'supabase',passed:true});console.log(`PASS storefront ${engine} ${width}px reduced=${reduced} source=${sample?'sample':'supabase'}`);
 }finally{await browser.close();}
}
}finally{await writeFile(join(evidence,'results.json'),JSON.stringify({results,note:'Read-only browser verification. No order submissions or database writes. WebKit is not a manual Safari test.'},null,2)+'\n')}
