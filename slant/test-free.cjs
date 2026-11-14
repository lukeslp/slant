'use strict';
// Free draw: a blank board with no numbers. Every closed section fills, loops
// included; nothing settles, locks, hints, completes or scores; each size keeps
// its own drawing under slant.free.v1 and never touches campaign saves. It is
// opened by the pencil after the puzzle actions, and its size is chosen on its own screen.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const{chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/luke/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core');
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;},eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const out=fs.mkdtempSync(path.join(os.tmpdir(),'slant-free-')),errors=[];
const campaign=JSON.stringify({version:1,at:'intro3',boards:{intro3:[1,0,2,0,0,0,0,0,0]},generated:null});
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/Users/luke/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});try{
const c=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true,reducedMotion:'reduce'});
await c.grantPermissions(['clipboard-read','clipboard-write'],{origin:'https://slant.test'});
await c.route('https://slant.test/**',r=>{const f=new URL(r.request().url()).pathname.slice(1)||'index.html';return !f.includes('..')&&fs.existsSync(path.join(__dirname,f))?r.fulfill({path:path.join(__dirname,f)}):r.fulfill({status:404});});
await c.route('https://stats.dr.eamer.dev/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));
await c.addInitScript(campaign=>{if(sessionStorage.fixture)return;sessionStorage.fixture='1';localStorage.setItem('slant.primer.v1','1');localStorage.setItem('slant.current.v1',campaign);},campaign);
const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
const cell=i=>p.locator('#board .cell').nth(i),state=()=>p.evaluate(()=>({cells:__slant.S.cells.slice(),locks:__slant.S.locks.slice(),settled:__slant.S.settled.slice(),at:__slant.at}));
const inFree=()=>p.evaluate(()=>__slant.at==='free'),size=()=>p.locator('#free-size').inputValue();
const openFree=async n=>{if(!await inFree())await p.locator('#free-btn').click();await p.locator('#free-size').selectOption(String(n));};
await p.goto('https://slant.test/');await p.waitForFunction(()=>window.__slant);
const campaignSave=await p.evaluate(()=>localStorage.getItem('slant.current.v1'));

// The pencil after the puzzle actions goes straight into free draw; nothing about it is left in Settings.
ok(await p.locator('#free-btn').isVisible(),'the pencil is on the play screen');eq([await p.locator('#free-btn').getAttribute('aria-label'),await p.locator('#free-btn').getAttribute('aria-pressed')],['Free draw','false'],'named, and not pressed');
eq(await p.locator('.control-actions .ib').evaluateAll(ns=>ns.map(n=>n.id)),['undo-btn','hint-btn','mark-btn','free-btn'],'it follows Undo, Hint and the lock tool');eq(await p.locator('.control-meta .ib').evaluateAll(ns=>ns.map(n=>n.id)),['settings-btn','help-btn'],'Settings then Help stay together');ok(await p.locator('#free-bar').isHidden(),'no size chooser while playing a puzzle');
eq(await p.locator('#settings #free-size, #settings #free-go').count(),0,'free draw is out of Settings');
await p.locator('#free-btn').click();ok(await inFree(),'one tap opens free draw');eq(await size(),'8','at the size last used, 8 × 8 to begin with');eq(await p.locator('#settings[open]').count(),0,'with no sheet in the way');
eq([await p.locator('#free-btn').getAttribute('aria-label'),await p.locator('#free-btn').getAttribute('aria-pressed'),await p.locator('#free-btn').getAttribute('title')],['Free draw','true','Back to the puzzle'],'the pencil is pressed, and now leads back');
eq(await p.locator('#free-size option').evaluateAll(ns=>ns.map(n=>n.textContent)),['6 × 6','8 × 8','10 × 10','12 × 12','16 × 16'],'five sizes, up to 16 × 16');
await openFree(6);
ok(await p.locator('#readout').isHidden(),'the readout gives way');eq([await p.locator('#free-bar span').textContent(),await size()],['Free draw','6'],'to the name of the mode and its size');
{const g=await p.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect(),bar=r('#free-bar'),sel=r('#free-size'),restart=r('#restart-btn'),btn=r('#free-btn');return{centred:Math.abs((bar.left+bar.right)/2-innerWidth/2),clear:bar.left-restart.right,select:[sel.width,sel.height],font:parseFloat(getComputedStyle(document.querySelector('#free-size')).fontSize),btn:[btn.width,btn.height]};});ok(g.centred<1,'the chooser is centred at the top');ok(g.clear>=8,'clear of Clear drawing');ok(g.select[1]>=44&&g.select[0]>=44,'a 44px target');eq(g.btn,[48,48],'the pencil is a 48px target');}
eq(await p.locator('#board .cell').count(),36,'blank 6 × 6 board');eq(await p.locator('#board .clue').count(),0,'no numbers anywhere');
for(const id of['hint-btn','mark-btn','next-btn','share-btn'])ok(await p.locator('#'+id).isHidden(),id+' hidden in free draw');
ok(await p.locator('#download-btn').isVisible(),'a drawing can always be downloaded');
eq(await p.locator('#restart-btn').getAttribute('aria-label'),'Clear drawing','restart clears the drawing');
ok((await p.locator('#feedback').textContent()).includes('Free draw'),'opening line');

// A diamond loop fills, its interior included, and is never flagged.
for(const[i,taps]of[[0,1],[1,2],[6,2],[7,1]])for(let t=0;t<taps;t++)await cell(i).click();
let s=await state();eq([0,1,6,7].map(i=>s.cells[i]),[1,2,2,1],'diamond drawn');
// Sides are north, east, south, west. Each square fills on its side inside the loop;
// square 0's outer corner is closed by the board edge, the others open onto blank board.
const sides=async i=>(await cell(i).getAttribute('data-section-colors')).split(',').map(Number);
for(const[i,inside,outside]of[[0,[1,2],[0,3]],[1,[2,3],[0,1]],[6,[0,1],[2,3]],[7,[0,3],[1,2]]]){const c=await sides(i);ok(inside.every(k=>c[k]>=0),'loop interior fills in square '+i);if(i===0)ok(outside.every(k=>c[k]>=0),'edge-closed corner fills');else ok(outside.every(k=>c[k]<0),'open side of square '+i+' stays blank');}
eq(new Set([(await sides(0))[1],(await sides(7))[0]]).size,1,'one interior section, one colour');
eq(await p.locator('#board .cycle').count(),0,'loop not flagged');ok(!(await cell(0).getAttribute('aria-label')).includes('loop'),'loop not announced');
ok(s.settled.every(v=>!v),'nothing settles');ok(!await p.locator('#board').evaluate(n=>n.classList.contains('solved')),'never solved');
ok((await cell(8).getAttribute('data-section-colors')).split(',').every(v=>v==='-1'),'open area stays blank');
await p.screenshot({path:path.join(out,'free-loop.png')});

// No locks: hold, right-click and L all leave locks off.
const box=await cell(0).boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.waitForTimeout(700);await p.mouse.up();
await cell(1).click({button:'right'});await cell(7).focus();await p.keyboard.press('l');
s=await state();ok(s.locks.every(v=>!v),'no locks in free draw');eq(await p.locator('#board .lock-frame').count(),0,'no lock frames');
eq(s.cells[0],2,'a hold paints like a tap');await p.locator('#undo-btn').click();eq((await state()).cells[0],1,'Undo restores it');

// Download: 1600 px PNG; filled triangles in the palette, the open area white.
const expected=await p.evaluate(()=>({colors:SlantRegions.sections(__slant.puzzle,__slant.S.cells,false,document.querySelector('#board')._regionColors,null,true).colors,palette:SlantRegions.palette}));
const waiting=p.waitForEvent('download');await p.locator('#download-btn').click();const d=await waiting;
eq(d.suggestedFilename(),'slant-free-6x6.png','download name');const file=path.join(out,'free.png');await d.saveAs(file);const data=fs.readFileSync(file);
eq(data.subarray(1,4).toString(),'PNG','PNG file');eq([data.readUInt32BE(16),data.readUInt32BE(20)],[1596,1596],'whole-pixel squares, 266 px each');
const pixels=await p.evaluate(async b64=>{const image=new Image();image.src='data:image/png;base64,'+b64;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const unit=image.width/6,seam=[];for(let k=1;k<6;k++)seam.push(ctx.getImageData(Math.floor(5.5*unit),k*unit,1,1).data[0],ctx.getImageData(Math.floor(5.5*unit+unit*.25),Math.floor(5.5*unit+unit*.25),1,1).data[0]);const hex=(x,y)=>'#'+[...ctx.getImageData(Math.floor(x*unit),Math.floor(y*unit),1,1).data].slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('');return{east0:hex(.85,.5),north0:hex(.25,.15),blank:hex(5.5,5.5),seamless:seam.every(v=>v===255)};},data.toString('base64'));
eq(pixels.east0,expected.palette[expected.colors[0*4+1]],'loop interior exported in its colour');eq(pixels.north0,expected.palette[expected.colors[0*4+0]],'corner section exported in its colour');eq(pixels.blank,'#ffffff','open area exported white');ok(pixels.seamless,'no seams across blank squares');

// Saves: free draw resumes after a reload; each size keeps its own drawing; campaign saves are untouched.
eq(await p.evaluate(()=>localStorage.getItem('slant.current.v1')),campaignSave,'campaign save untouched by free draw');
await p.reload();await p.waitForFunction(()=>window.__slant);
ok(await inFree()&&await p.locator('#free-bar').isVisible(),'reload resumes free draw');eq(await size(),'6','at its size');eq((await state()).cells.slice(0,2),[1,2],'drawing restored');
await openFree(8);eq(await p.locator('#board .cell').count(),64,'8 × 8 board');ok((await state()).cells.every(v=>v===0),'new size starts blank');await cell(9).click();
await openFree(6);eq((await state()).cells.slice(0,2),[1,2],'6 × 6 drawing kept');
eq(await p.evaluate(()=>__slant.free.boards[8][9]),1,'8 × 8 drawing kept');

// The larger boards: 12 × 12 and 16 × 16 draw, fill, save and download like the others.
await openFree(12);eq(await p.locator('#board .cell').count(),144,'12 × 12 board');
await openFree(16);eq(await p.locator('#board .cell').count(),256,'16 × 16 board');eq(await p.locator('#board .clue').count(),0,'still no numbers');
for(const[i,taps]of[[0,1],[1,2],[16,2],[17,1]])for(let t=0;t<taps;t++)await cell(i).click();eq(await p.locator('#board').getAttribute('data-sections'),'2','a loop fills on the large board');
{const b=await p.evaluate(()=>{const c=document.querySelector('#board .cell').getBoundingClientRect(),board=document.querySelector('#board').getBoundingClientRect(),shell=document.querySelector('#board-shell').getBoundingClientRect();return{cell:c.width,fits:board.left>=shell.left&&board.right<=shell.right&&board.top>=shell.top&&board.bottom<=shell.bottom};});ok(b.cell>=20,'squares of '+b.cell.toFixed(1)+'px on a phone');ok(b.fits,'the whole board is on screen');}
{const w=p.waitForEvent('download');await p.locator('#download-btn').click();const d=await w,f=path.join(out,'free-16.png');eq(d.suggestedFilename(),'slant-free-16x16.png','large download name');await d.saveAs(f);const data=fs.readFileSync(f);eq([data.readUInt32BE(16),data.readUInt32BE(20)],[1600,1600],'100 px squares');}
await p.screenshot({path:path.join(out,'free-16.png')});await p.reload();await p.waitForFunction(()=>window.__slant);eq(await size(),'16','a reload comes back to 16 × 16');eq((await state()).cells.slice(0,2),[1,2],'with its drawing');
await openFree(6);eq((await state()).cells.slice(0,2),[1,2],'and 6 × 6 still has its own');

// The shared link opens free draw at this size, never the drawing.
await p.locator('#settings-btn').click();await p.locator('#share').click();
const link=await p.evaluate(()=>navigator.clipboard.readText()).catch(()=>p.locator('#settings-feedback a').getAttribute('href'));
eq(new URL(link).search,'?free=6','copy link opens free draw at 6 × 6');await p.locator('#settings').evaluate(n=>n.close());
const q=await c.newPage();q.on('pageerror',e=>errors.push(e.message));await q.goto('https://slant.test/?free=10');await q.waitForFunction(()=>window.__slant);
eq([await q.evaluate(()=>__slant.at),await q.locator('#free-size').inputValue(),await q.locator('#board .cell').count()],['free','10',100],'?free=10 opens a 10 × 10 board');await q.screenshot({path:path.join(out,'free-10.png')});
await q.goto('https://slant.test/?free=16');await q.waitForFunction(()=>window.__slant);eq([await q.locator('#free-size').inputValue(),await q.locator('#board .cell').count()],['16',256],'?free=16 opens the largest');
await q.goto('https://slant.test/?free=7');await q.waitForFunction(()=>window.__slant);eq([await q.evaluate(()=>__slant.at),await q.locator('#free-size').inputValue()],['free','16'],'a size that is not offered opens free draw at the size last used');await q.close();

// The pencil leads back to the puzzle that was left, and in again with one tap; choosing a campaign board leaves too. A reload stays where it was left.
await p.reload();await p.waitForFunction(()=>window.__slant);
await p.locator('#free-btn').click();eq(await p.evaluate(()=>__slant.at),'intro3','the pencil returns to the puzzle that was left');ok(await p.locator('#readout').isVisible()&&await p.locator('#free-bar').isHidden(),'with its readout');eq((await state()).cells.slice(0,3),[1,0,2],'and its lines');eq(await p.locator('#free-btn').getAttribute('aria-pressed'),'false','the pencil is up again');
await p.locator('#free-btn').focus();await p.keyboard.press('Enter');ok(await inFree(),'Enter on the pencil opens free draw');eq(await size(),'16','at the size last used, which the 16 × 16 link above left behind');
await p.locator('#settings-btn').click();await p.locator('#campaign').selectOption('intro3');
ok((await p.locator('#readout').textContent()).startsWith(String(require('./levels').findIndex(b=>b.id==='intro3')+1)+' / '),'campaign board again');
ok(await p.locator('#hint-btn').isVisible(),'hint returns');ok(await p.locator('#board .clue').count()>0,'numbers return');
await p.reload();await p.waitForFunction(()=>window.__slant);eq(await p.evaluate(()=>__slant.at),'intro3','a reload stays on the campaign');eq(await p.evaluate(()=>__slant.free.open),false,'free draw closed');

// The line turns: one persistent path per square, always clockwise, timed by CSS; reduced motion is instant.
for(const reduce of[false,true]){const m=await browser.newContext({viewport:{width:390,height:844},reducedMotion:reduce?'reduce':'no-preference'});
 await m.route('https://slant.test/**',r=>{const f=new URL(r.request().url()).pathname.slice(1)||'index.html';return !f.includes('..')&&fs.existsSync(path.join(__dirname,f))?r.fulfill({path:path.join(__dirname,f)}):r.fulfill({status:404});});
 await m.route('https://stats.dr.eamer.dev/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));
 const t=await m.newPage();t.on('pageerror',e=>errors.push(e.message));await t.goto('https://slant.test/?free=6');await t.waitForFunction(()=>window.__slant);
 const turn=()=>t.evaluate(()=>{const path=document.querySelectorAll('#board .cell')[0].querySelector('svg.line path'),a=path.getAnimations();a.forEach(x=>x.finish());const m=new DOMMatrix(getComputedStyle(path).transform);return{same:path===window.__line,running:a.map(x=>x.transitionProperty),angle:Math.round(Math.atan2(m.b,m.a)*180/Math.PI),scale:Math.round(Math.hypot(m.a,m.b)*100)/100};});
 await t.evaluate(()=>{window.__line=document.querySelectorAll('#board .cell')[0].querySelector('svg.line path');});
 const tap=()=>t.locator('#board .cell').first().click();
 await tap();let r=await turn();eq([r.angle,r.scale],[0,1],'/ rests at 0°');ok(r.same,'one line per square, kept across changes');eq(r.running,reduce?[]:['transform'],reduce?'reduced motion draws instantly':'a new line grows');
 await tap();if(!reduce){const mid=await t.evaluate(()=>{const path=document.querySelectorAll('#board .cell')[0].querySelector('svg.line path');path.getAnimations().forEach(x=>{x.pause();x.currentTime=60;});const m=new DOMMatrix(getComputedStyle(path).transform);return Math.atan2(m.b,m.a)*180/Math.PI;});ok(mid>20&&mid<85,'mid-turn the line is part way round, clockwise ('+Math.round(mid)+'°)');}
 r=await turn();eq([r.angle,r.scale],[90,1],'\\ rests at 90°');eq(r.running,reduce?[]:['transform'],reduce?'reduced motion turns instantly':'/ to \\ turns');
 await tap();r=await turn();eq(r.scale,0,'clearing shrinks the line away');await tap();r=await turn();eq([r.angle,r.scale],[180,1],'the next / keeps turning clockwise (180°), never unwinding');
 await m.close();}
// The pencil is there from the first screen. Someone who has not passed the opening boards goes back to them on leaving.
{const f=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});await f.route('https://slant.test/**',r=>{const n=new URL(r.request().url()).pathname.slice(1)||'index.html';return !n.includes('..')&&fs.existsSync(path.join(__dirname,n))?r.fulfill({path:path.join(__dirname,n)}):r.fulfill({status:404});});await f.route('https://stats.dr.eamer.dev/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));
 const t=await f.newPage();t.on('pageerror',e=>errors.push(e.message));await t.goto('https://slant.test/');await t.waitForFunction(()=>window.__slant);eq(await t.evaluate(()=>__slant.at),'p1','a first visit starts on the opening boards');ok(await t.locator('#free-btn').isVisible(),'with the pencil already there');
 await t.locator('#free-btn').click();ok(await t.evaluate(()=>__slant.at==='free'),'one tap from the first screen opens free draw');eq(await t.locator('#free-size').inputValue(),'8','at 8 × 8');await t.locator('#board .cell').first().click();
 await t.locator('#free-btn').click();eq(await t.evaluate(()=>__slant.at),'p1','leaving goes back to the opening boards');eq(await t.evaluate(()=>localStorage.getItem('slant.primer.v1')),null,'which are still to be passed');eq(await t.evaluate(()=>localStorage.getItem('slant.current.v1')),null,'and no campaign save was made');
 await t.locator('#free-btn').click();eq(await t.evaluate(()=>__slant.S.cells[0]),1,'the drawing is kept');await t.reload();await t.waitForFunction(()=>window.__slant);ok(await t.evaluate(()=>__slant.at==='free'),'a reload in free draw stays in free draw, opening boards passed or not');
 await t.goto('https://slant.test/?free=8');await t.waitForFunction(()=>window.__slant);ok(await t.evaluate(()=>__slant.at==='free'),'a link opens free draw for a first-time visitor');await t.locator('#free-btn').click();eq(await t.evaluate(()=>__slant.at),'p1','and the pencil leads out to the opening boards');await f.close();}
// On a phone held sideways the tools are a column and the pencil is in it.
{const f=await browser.newContext({viewport:{width:844,height:390},reducedMotion:'reduce'});await f.route('https://slant.test/**',r=>{const n=new URL(r.request().url()).pathname.slice(1)||'index.html';return !n.includes('..')&&fs.existsSync(path.join(__dirname,n))?r.fulfill({path:path.join(__dirname,n)}):r.fulfill({status:404});});await f.route('https://stats.dr.eamer.dev/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));await f.addInitScript(()=>{localStorage.setItem('slant.primer.v1','1');});
 const t=await f.newPage();t.on('pageerror',e=>errors.push(e.message));await t.goto('https://slant.test/?free=16');await t.waitForFunction(()=>window.__slant);const g=await t.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect(),tools=[...document.querySelectorAll('.toolbar .ib')].filter(n=>!n.hidden).map(n=>n.getBoundingClientRect()),bar=r('#free-bar'),board=r('#board');return{column:tools.every(b=>Math.abs(b.left-tools[0].left)<1),onScreen:tools.every(b=>b.top>=0&&b.bottom<=innerHeight),apart:tools.every((b,i)=>!i||b.top>=tools[i-1].bottom-1),barClear:bar.bottom<=board.top+1&&bar.right<=tools[0].left};});ok(g.column&&g.onScreen&&g.apart,'the tools fit in one column, pencil included');ok(g.barClear,'the size chooser is clear of the board and the tools');await t.screenshot({path:path.join(out,'free-16-sideways.png')});await f.close();}
eq(errors,[],'no page errors');console.log('PASS',checks,'Slant free draw checks; screens:',out);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
