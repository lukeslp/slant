'use strict';
// Slant scores end to end: a real score service, a real solve, share and removal.
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/luke/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core'),E=require('./engine'),L=require('./levels');
(async()=>{const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'slant-scores-')),server=spawn('python3',['-B',path.join(__dirname,'../bridges/leaderboard/server.py'),'--port','0','--db',path.join(tmp,'scores.sqlite3')]);
 const api=await new Promise((resolve,reject)=>{server.stdout.once('data',d=>resolve(d.toString().trim()));server.once('error',reject);server.once('exit',code=>reject(Error('Server exited '+code)));});
 const site='http://localhost:5998',types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png'};
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/Users/luke/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
 let checks=0,posts=0,starts=0;
 // The service files a run faster than a person could tap as practice, so these robot solves are aged past that floor first.
 const age=()=>require('node:child_process').spawnSync('sqlite3',[path.join(tmp,'scores.sqlite3'),'UPDATE runs SET started=started-120000 WHERE seconds IS NULL']),waitFor=async f=>{for(let k=0;k<200&&!f();k++)await new Promise(r=>setTimeout(r,25));if(!f())throw Error('run did not start');};const ok=(v,m)=>{assert.ok(v,m);checks++;},errors=[];
 async function open(query='',primer=false){const c=await browser.newContext({viewport:{width:390,height:844},colorScheme:'dark',reducedMotion:'reduce'});
  await c.route(site+'/**',async r=>{const u=new URL(r.request().url());
   if(u.pathname.startsWith('/scores-api/')){const q=r.request();if(q.method()==='POST'&&u.pathname==='/scores-api/scores')posts++;const headers={...q.headers()};delete headers.origin;delete headers.host;const res=await fetch(api+u.pathname+u.search,{method:q.method(),headers,body:q.method()==='GET'?undefined:q.postData()});const body=await res.text();if(q.method()==='POST'&&u.pathname==='/scores-api/runs')starts++;return r.fulfill({status:res.status,contentType:'application/json',body});}
   const f=u.pathname.slice(1)||'index.html',file=path.join(__dirname,f);return !f.includes('..')&&fs.existsSync(file)?r.fulfill({path:file,contentType:types[path.extname(f)]}):r.fulfill({status:404,body:''});});
  await c.route('https://stats.dr.eamer.dev/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));if(!primer)await c.addInitScript(()=>localStorage.setItem('slant.primer.v1','1'));const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));const before=starts;await p.goto(site+'/'+query);await p.waitForFunction(()=>window.__slant);if(!primer){await waitFor(()=>starts>before);age();}return{p,c};}
 const answer=p=>E.count(p,2).answer;
 async function solve(p,skip=[]){const want=answer(await p.evaluate(()=>__slant.puzzle));for(let i=0;i<want.length;i++){if(skip.includes(i))continue;for(let k=0;k<3&&await p.evaluate(i=>__slant.S.cells[i],i)!==want[i];k++)await p.locator('#board .cell').nth(i).click();}}
 try{
  let {p,c}=await open('?puzzle='+L[4].id);
  ok(await p.evaluate(()=>!!window.BridgesScores&&__slant.score==null),'scores load with no result before solving');
  await solve(p);ok(await p.evaluate(()=>__slant.S.solved),'board solved by taps');
  await p.waitForFunction(()=>__slant.score&&__slant.score.run!==undefined);const first=await p.evaluate(()=>__slant.score);ok(first&&first.category==='unassisted'&&first.mode==='slant-standard-v1'&&first.puzzle===L_ID(),'fresh unaided solve is unassisted');
  function L_ID(){return L[4].id;}
  ok(posts===0&&starts===1,'opening the board starts one timed run and solving shares nothing');
  await p.locator('#settings-btn').click();await p.locator('#settings .row button',{hasText:'Scores for this puzzle'}).click();ok(await p.locator('#scores').evaluate(n=>n.open),'Scores opens from the finished board');
  await p.waitForFunction(()=>document.querySelector('#scores-status').textContent==='No scores yet.');ok(posts===0,'reading the list sends no score');
  ok((await p.locator('#scores-board').textContent())==='Puzzle 5 · Standard','sheet names the campaign puzzle');
  await p.locator('#score-submit').waitFor({state:'visible'});ok(/^Your time \d+:\d\d · Unassisted$/.test(await p.locator('#scores-result').textContent()),'the sheet shows the service\'s time');ok(await p.evaluate(()=>typeof __slant.score.run==='string'&&__slant.score.run.length===32),'the result carries the service run');await p.locator('#score-alias').fill('Tester');await p.locator('#score-submit button').click();await p.waitForFunction(()=>document.querySelectorAll('#scores-list li').length===1);
  ok(posts===1&&(await p.locator('#scores-list li').textContent()).includes('Tester'),'sharing posts once and lists the nickname');
  await p.locator('#score-remove').click();await p.waitForFunction(()=>document.querySelectorAll('#scores-list li').length===0);ok(true,'the player can remove their score');
  await c.close();
  ({p,c}=await open('?puzzle='+L[5].id));await p.locator('#hint-btn').click();await p.locator('#hint-btn').click();await solve(p);
  await p.waitForFunction(()=>__slant.score.run!==undefined);ok(await p.evaluate(()=>__slant.score.category==='assisted'&&!!__slant.score.run),'a hinted solve is listed apart');await c.close();
  ({p,c}=await open('?puzzle='+L[6].id));await p.locator('#board .cell').first().click();await p.locator('#restart-btn').click();await solve(p);
  await p.waitForFunction(()=>__slant.score.run!==undefined);ok(await p.evaluate(()=>__slant.score.category==='repeat'&&!!__slant.score.run),'a restarted solve is a repeat');await c.close();
  ({p,c}=await open('?puzzle='+L[7].id));{const before=starts;await p.reload();await p.waitForFunction(()=>window.__slant);await waitFor(()=>starts>before);age();}await solve(p);
  await p.waitForFunction(()=>__slant.score.run!==undefined);ok(await p.evaluate(()=>__slant.score.category==='practice'&&!!__slant.score.run),'a reloaded board is practice');
  await p.locator('#settings-btn').click();ok(await p.locator('#settings .row button',{hasText:'Scores for this puzzle'}).count()===1,'Scores is reachable from Settings');await c.close();
  ({p,c}=await open('?puzzle='+L[8].id));await p.locator('#board .cell').first().click();{const before=starts;await p.locator('#settings-btn').click();await p.locator('#mode').selectOption('Hard');await p.locator('#settings').evaluate(n=>n.close());await waitFor(()=>starts>before);age();}await solve(p);await p.waitForFunction(()=>__slant.score&&__slant.score.run!==undefined);ok(await p.evaluate(()=>__slant.score.category==='practice'&&__slant.score.mode==='slant-v1'),'a mode change starts a practice run in Hard');await p.locator('#settings-btn').click();await p.locator('#settings .row button',{hasText:'Scores for this puzzle'}).click();ok(await p.locator('#scores-board').textContent()==='Puzzle 9 · Hard','Hard sheet names its mode');await c.close();
  const before=starts;({p,c}=await open('',true));ok(await p.evaluate(()=>__slant.at==='p1'),'a first visit opens on the first opening board');await p.locator('#board .cell').first().click();await p.locator('#next-btn').click();await p.locator('#board .cell').first().click();await p.locator('#hint-btn').click();await p.locator('#restart-btn').click();
  ok(starts===before&&await p.evaluate(()=>__slant.score==null&&document.querySelector('#scores-btn').hidden),'opening boards start no timed run and offer no Scores');await p.locator('#settings-btn').click();ok(await p.locator('#settings .row button',{hasText:'Scores for this puzzle'}).isHidden(),'Settings has no opening score');await c.close();
  ok(!errors.length,'no page errors: '+errors.join('; '));
  console.log('PASS '+checks+' Slant score checks: service-timed runs, share and removal, run categories');
 }finally{await browser.close();server.kill();fs.rmSync(tmp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exit(1);});
