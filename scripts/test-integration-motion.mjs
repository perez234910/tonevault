import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve, join} from 'node:path';
const pw = await import(process.env.TONEVAULT_PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TONEVAULT_TEST_BASE || 'http://localhost:3000';
const evidence = resolve(process.env.TONEVAULT_MOTION_EVIDENCE || 'docs/evidence/integration-step2/motion');
await mkdir(evidence, {recursive:true});
const results = [];
try {
 for (const engine of ['chromium','webkit']) {
  const cases = [...(engine==='chromium'?[1440,390,320]:[1440,390]).map(width=>({width,reduced:false})), ...[1440,390].map(width=>({width,reduced:true}))];
  for (const {width,reduced} of cases) {
   const browser = await pw[engine].launch(engine==='chromium'&&process.env.TONEVAULT_BROWSER_EXECUTABLE?{executablePath:process.env.TONEVAULT_BROWSER_EXECUTABLE}:{});
   try {
    const page = await browser.newPage({viewport:{width,height:900},hasTouch:width<640,reducedMotion:reduced?'reduce':'no-preference'});
    page.setDefaultTimeout(15000);
    const errors=[],writes=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    page.on('request',r=>{if(r.url().startsWith(base+'/api/')&&!['GET','HEAD'].includes(r.method()))writes.push(r.method())});
    const response=await page.request.get(base+'/api/products');assert.equal(response.status(),200);
    assert.notEqual(response.headers()['x-tonevault-data-source'],'local-sample');
    const {products}=await response.json();
    const product=products.find(p=>p.brand==='Fender'&&p.model==='Stratocaster'&&p.finish?.toLowerCase()==='olympic white'&&p.status==='available'&&p.stock>0) || products.find(p=>p.status==='available'&&p.stock>0);
    assert.ok(product,'An available real catalog listing is required');
    const title=`${product.year} ${product.brand} ${product.model}`;
    await page.goto(base+'/browse');await page.getByRole('heading',{name:'Browse the vault',exact:true}).waitFor();
    const style=await page.locator('body').evaluate(n=>({background:getComputedStyle(n).backgroundColor,font:getComputedStyle(n).fontFamily}));
    assert.equal(style.background,'rgb(255, 255, 255)');assert.match(style.font,/dmSans/i);
    if(width>=1024){
     const collection=page.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('button',{name:'Collection',exact:true});
     await collection.focus();await page.keyboard.press('ArrowDown');await page.getByRole('region',{name:'Collection links',exact:true}).waitFor();
     await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-controls')==='collection-popover');
    }else{
     const menu=page.getByRole('button',{name:'Open navigation',exact:true});await menu.tap();const dialog=page.getByRole('dialog',{name:'Explore ToneVault',exact:true});await dialog.waitFor();
     for(let i=0;i<14;i++){await page.keyboard.press('Tab');assert.equal(await dialog.evaluate(n=>n.contains(document.activeElement)),true)}
     await dialog.getByRole('button',{name:'Close navigation',exact:true}).tap();await dialog.waitFor({state:'hidden'});
    }
    await page.goto(base+'/products/'+product.id);await page.getByRole('heading',{name:title,exact:true}).waitFor();
    const gallery=page.locator('.gallery-image');const imageCount=await gallery.count();if(!imageCount)await page.getByRole('img',{name:`No photographs available for ${title}`,exact:true}).waitFor();
    for(const image of await gallery.all())await image.evaluate(n=>n.decode());
    if(imageCount>1){await page.getByRole('button',{name:`Show photo 1 of ${title}`,exact:true}).focus();await page.keyboard.press('ArrowRight');assert.equal(await page.getByRole('button',{name:`Show photo 2 of ${title}`,exact:true}).getAttribute('aria-pressed'),'true')}
    await page.getByRole('button',{name:'Add to cart',exact:true}).click();
    await page.getByRole('button',{name:'Dismiss cart confirmation',exact:true}).click();
    await page.evaluate(()=>window.scrollTo(0,Math.min(500,document.documentElement.scrollHeight-innerHeight)));
    const viewport=()=>page.evaluate(()=>({y:scrollY,mainTop:document.querySelector('main').getBoundingClientRect().top,headerTop:document.querySelector('header').getBoundingClientRect().top,root:document.documentElement.style.overflow,body:Object.fromEntries(['position','top','left','width','overflow'].map(k=>[k,document.body.style[k]]))}));
    const before=await viewport();await page.locator('.cart-trigger').click();const drawer=page.getByRole('dialog',{name:/Your cart/});await drawer.waitFor();
    const locked=await viewport();assert.equal(locked.body.position,'fixed');assert.equal(locked.root,'hidden');assert.ok(Math.abs(locked.mainTop-before.mainTop)<.5);assert.ok(Math.abs(locked.headerTop-before.headerTop)<.5);
    assert.equal(await drawer.locator('.drawer-content').evaluate(n=>getComputedStyle(n).overflowY),'auto');
    await page.mouse.move(5,Math.min(600,850));await page.mouse.wheel(0,500);await page.waitForTimeout(200);
    const wheeled=await viewport();assert.equal(wheeled.mainTop,locked.mainTop);assert.equal(wheeled.headerTop,locked.headerTop);assert.equal(wheeled.y,locked.y);
    for(let i=0;i<12;i++){await page.keyboard.press('Tab');assert.equal(await drawer.evaluate(n=>n.contains(document.activeElement)),true)}
    await page.keyboard.press('Escape');await drawer.waitFor({state:'hidden'});await page.waitForFunction(()=>document.activeElement===document.querySelector('.cart-trigger'));
    const restored=await viewport();assert.deepEqual(restored.body,before.body);assert.equal(restored.root,before.root);assert.ok(Math.abs(restored.y-before.y)<.5);
    await page.locator('.cart-trigger').click();await drawer.waitFor();await drawer.getByRole('link',{name:'Review cart',exact:true}).click();await page.waitForURL(base+'/cart');await drawer.waitFor({state:'hidden'});await page.waitForFunction(()=>scrollY===0);
    const quantity=page.getByRole('spinbutton',{name:`Quantity for ${title}`,exact:true});await quantity.waitFor();assert.equal(await quantity.inputValue(),'1');
    const max=Number(await quantity.getAttribute('max'));await quantity.fill(String(max+1));await quantity.press('Enter');await page.getByText(`Enter a whole number from 1 to ${max}.`,{exact:true}).waitFor();assert.equal(await quantity.inputValue(),'1');
    await page.reload();await quantity.waitFor();assert.equal(await quantity.inputValue(),'1');
    if(max===1)assert.equal(await page.getByRole('button',{name:`Increase quantity for ${title}`,exact:true}).isDisabled(),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
    results.push({engine,width,reduced,passed:true,dataSource:'real-catalog',galleryImages:imageCount,twoImageKeyboardChecked:imageCount>1,stockLimit:max,apiWrites:0,interceptedResponses:0});
    console.log(`PASS real motion ${engine} ${width}px reduced=${reduced}: navigation, dialog focus/scroll restore, actual gallery (${imageCount}), quantity bounds/persistence.`);
   }finally{await browser.close()}
  }
 }
}finally{await writeFile(join(evidence,'results.json'),JSON.stringify({results,note:'Real catalog only; no API interception, injected gallery views or order writes. Foundational two-image fixture source is retained separately, not claimed executed by this suite.'},null,2)+'\n')}
