/* Reproducible original campaign construction. No answer search. */
const fs=require('node:fs'),E=require('./engine');
const levels=[],seen=new Set(),records=[];
for(const [difficulty,total]of[['Easy',10],['Normal',20],['Hard',20]]){let added=0;for(let seed=1000;added<total&&seed<10000;seed++){
const p=E.generate(seed,difficulty);if(p.status)continue;
const signature=Array.from({length:8},(_,i)=>E.transform(p,i).clues.join(',')).sort()[0];if(seen.has(signature))continue;
// Keep all three advanced sizes represented, including the largest board last.
if(difficulty==='Hard'&&levels.filter(q=>q.difficulty==='Hard'&&q.w===p.w).length>=[7,8,9].map(n=>n===7?7:n===8?7:6)[p.w-7])continue;
const l=E.logical(p);if(l.status!=='solved')throw Error('not logical');seen.add(signature);added++;
levels.push({id:'s'+String(levels.length+1).padStart(2,'0'),difficulty,w:p.w,h:p.h,clues:p.clues,trace:l.trace});records.push({difficulty,seed,operations:p.operations,size:p.w});
}if(added!==total)throw Error('campaign budget exhausted');}
// Put a 9x9 at the end for geometry validation.
const last=levels.findLastIndex(p=>p.w===9);[levels[last],levels[49]]=[levels[49],levels[last]];levels.forEach((p,i)=>p.id='s'+String(i+1).padStart(2,'0'));
// Preserve original IDs and generator fallback order while teaching smaller boards first.
const seedPool=levels.slice();
function difficultyScore(p){const trace=E.logical(p).trace;return trace.filter(m=>m.rule!=='clue').length*12+(1-p.clues.filter(v=>v>=0).length/p.clues.length)*10;}
levels.sort((a,b)=>E.DIFFICULTIES.indexOf(a.difficulty)-E.DIFFICULTIES.indexOf(b.difficulty)||a.w-b.w||difficultyScore(a)-difficultyScore(b)||a.id.localeCompare(b.id));
const warmups=[];
for(let k=0;k<4;k++){
 const n=k<2?2:3,r=E.rng(21000+k),p=E.candidate(n,r,E.budget());
 if(k===0){p.clues=p.clues.map((v,i)=>[0,n,n*(n+1),(n+1)**2-1].includes(i)?v:-1);}
 else {for(let a=0;a<p.clues.length;a++){if((a+k)%3===0)continue;const old=p.clues[a];p.clues[a]=-1;if(E.logical(p,null,null,{basic:true}).status!=='solved')p.clues[a]=old;}}
 const l=E.logical(p);if(l.status!=='solved'||l.trace.some(m=>m.rule!=='clue'))throw Error('Intro must use direct clues');
 warmups.push({id:'intro'+(k+1),difficulty:'Easy',w:n,h:n,clues:p.clues,trace:l.trace});
}
levels.unshift(...warmups);
const wrapper="(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.SlantLevels=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){";
fs.writeFileSync(__dirname+'/levels.js','/* 54 original Slant boards by Luke Steuber; four small lead-ins and a graded campaign. */\n'+wrapper+'const levels='+JSON.stringify(levels)+';Object.defineProperty(levels,\'seedPool\',{value:'+JSON.stringify(seedPool.map(p=>p.id))+'.map(id=>levels.find(p=>p.id===id))});return levels;});\n');
fs.mkdirSync('/tmp/minimal-classics-slant',{recursive:true});fs.writeFileSync('/tmp/minimal-classics-slant/campaign-construction.json',JSON.stringify({records,order:levels.map(p=>({id:p.id,size:p.w,score:difficultyScore(p)}))},null,2));console.log(levels.map(p=>p.id+':'+p.w).join(' '));
