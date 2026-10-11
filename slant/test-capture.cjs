'use strict';
/* A mouse can lose pointer capture a moment before its pointerup: when a move
   with no button held reaches the page first, Chromium releases capture early
   and lostpointercapture arrives ahead of pointerup. These checks send that
   exact order through the browser's input pipeline. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/luke/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core');
const base=process.env.PUBLIC_BASE||'http://slant.test/';
let checks=0,browser;const errors=[];
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;},ok=(a,m)=>{assert.ok(a,m);checks++;};
async function open(){const c=await browser.newContext({viewport:{width:900,height:1000}});if(!process.env.PUBLIC_BASE)await c.route('http://slant.test/**',r=>{const f=new URL(r.request().url()).pathname.slice(1)||'index.html';return !f.includes('..')&&fs.existsSync(path.join(__dirname,f))?r.fulfill({path:path.join(__dirname,f)}):r.fulfill({status:404});});await c.route('https://stats.dr.eamer.dev/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));await c.addInitScript(()=>{try{localStorage.setItem('slant.primer.v1','1');}catch(_){}});const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'?puzzle=s10');await p.waitForFunction(()=>window.__slant&&document.querySelectorAll('#board .cell').length===25);await p.evaluate(()=>{window.__order=[];for(const t of['pointerup','lostpointercapture'])document.addEventListener(t,()=>window.__order.push(t),true);});return{p,c,cdp:await c.newCDPSession(p)};}
(async()=>{browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/Users/luke/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});try{
const {p,c,cdp}=await open();
const at=i=>p.evaluate(i=>{const r=document.querySelectorAll('#board .cell')[i].getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};},i);
const row=n=>p.evaluate(n=>Array.from(__slant.S.cells.slice(n*5,n*5+3)),n);
const mouse=(type,pt,held,extra={})=>cdp.send('Input.dispatchMouseEvent',{type,...pt,button:held?'left':'none',buttons:held?1:0,...extra});
async function stroke(n,early){await p.evaluate(()=>{window.__order.length=0;});const a=await at(n*5),b=await at(n*5+2);await mouse('mouseMoved',a,false);await mouse('mousePressed',a,true,{clickCount:1});for(let k=1;k<=6;k++)await mouse('mouseMoved',{x:a.x+(b.x-a.x)*k/6,y:a.y},true);if(early)await mouse('mouseMoved',{x:b.x+2,y:b.y+1},false);await mouse('mouseReleased',b,false,{button:'left',clickCount:1});await p.waitForTimeout(100);return p.evaluate(()=>window.__order.join(' '));}
eq(await stroke(0,false),'pointerup lostpointercapture','the usual order: release, then capture goes');
eq(await row(0),[1,1,1],'a stroke is kept after an ordinary release');
const undo=await p.evaluate(()=>__slant.S.undo.length);
eq(await stroke(1,true),'lostpointercapture pointerup','a buttonless move ahead of the release loses capture first');
eq(await row(1),[1,1,1],'the stroke is kept when capture is lost just before release');
eq(await p.evaluate(()=>__slant.S.undo.length),undo+1,'and it is one undoable move');
await p.locator('#undo-btn').click();eq(await row(1),[0,0,0],'Undo takes that stroke back');
// Capture lost while the button is still down is still a cancel.
const a=await at(10),b=await at(12);await mouse('mouseMoved',a,false);await mouse('mousePressed',a,true,{clickCount:1});await mouse('mouseMoved',b,true);
eq(await row(2),[1,1,1],'the stroke shows while the button is down');
await p.evaluate(()=>document.querySelector('#board').dispatchEvent(new PointerEvent('lostpointercapture',{pointerId:1,bubbles:true,buttons:1})));
eq(await row(2),[0,0,0],'capture lost with the button held restores the board');
await mouse('mouseReleased',b,false,{button:'left',clickCount:1});
await c.close();
eq(errors,[],'no browser errors');console.log('PASS',checks,'Slant lost-capture checks');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
