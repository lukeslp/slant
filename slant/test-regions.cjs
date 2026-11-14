'use strict';
const assert=require('node:assert/strict'),R=require('./regions'),E=require('./engine'),L=require('./levels');let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;},eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const p={w:2,h:2,clues:Array(9).fill(-1)};
eq(R.sections(p,[0,0,0,0]).regions.length,0,'blank board unfilled');
const one=R.sections(p,[1,0,0,0]);eq(one.regions.length,1,'edge triangle closes immediately');eq(one.regions[0].triangles,[0,3],'only upper-left triangle fills');
eq(R.sections(p,[0,0,0,0],false,one.memory).regions.length,0,'Undo reopens section');
eq(R.sections(p,[2,1,1,2],true).regions.length,0,'invalid loop never gets completion fill');
const withClue=(vertex,value)=>({...p,clues:p.clues.map((n,i)=>i===vertex?value:n)});
eq(R.sections(withClue(1,2),[1,0,0,0]).regions.length,0,'underfilled bordering clue suppresses section');
eq(R.sections(withClue(1,0),[1,0,0,0]).regions.length,0,'overfilled bordering clue suppresses section');
eq(R.sections(withClue(1,1),[1,0,0,0]).regions.length,1,'exact bordering clue permits section');
eq(R.sections(withClue(8,1),[1,0,0,0]).regions.length,1,'unrelated incomplete clue does not suppress section');
// Free draw: no numbers and no edge rule, so every closed section fills, loop interiors included.
const freeSections=(board,cells,hasLoop=false)=>R.sections(board,cells,hasLoop,new Map(),null,true),diamond=[1,2,2,1];
eq(R.sections(p,diamond,true).regions.length,0,'a loop blocks every fill outside free draw');
const loop=freeSections(p,diamond,true);eq(loop.regions.length,5,'free draw fills the loop interior and its four corners');ok(loop.colors.every(c=>c>=0),'a fully drawn free board fills every triangle');ok(loop.settled.every(v=>!v),'nothing settles in free draw');
eq(freeSections(withClue(1,2),[1,0,0,0]).regions.length,1,'free draw ignores numbers');eq(freeSections(p,[1,0,0,0]).regions[0].triangles,[0,3],'free draw never fills an undecided square');
{let seed=7;const rnd=()=>(seed=(seed*1103515245+12345)>>>0)/4294967296;
 for(const size of[6,8,10,12,16]){const board={w:size,h:size,clues:Array((size+1)**2).fill(-1)},lattice=Array.from({length:size*size},(_,i)=>(i%size+Math.floor(i/size))%2?2:1);
  for(let k=0;k<=120;k++){const cells=k===120?lattice:Array.from({length:size*size},()=>rnd()<.85?(rnd()<.5?1:2):0),r=freeSections(board,cells);
   for(const g of r.regions){ok(g.color>=0&&g.triangles.every(t=>cells[Math.floor(t/4)]),'free section coloured and fully drawn');for(const n of g.neighbors)ok(n.color!==g.color,'free neighbours distinct');}}
  ok(freeSections(board,lattice).colors.every(c=>c>=0),'diamond lattice of loops fills completely '+size);}}
let all=0;const start=performance.now();
for(const board of L){const result=E.logical(board);eq(result.status,'solved','campaign solvable');const s=result.state,full=R.sections(board,s);eq(full.colors.filter(c=>c>=0).length,s.length*4,'whole solved board filled');
 for(const g of full.regions)for(const n of g.neighbors)ok(n.color!==g.color,'adjacent regions different');
 for(let cut=0;cut<s.length;cut+=Math.max(1,Math.floor(s.length/5))){const partial=s.slice();partial[cut]=0;const r=R.sections(board,partial,false,full.memory);eq(r.colors.slice(cut*4,cut*4+4),[-1,-1,-1,-1],'undecided square never colored');for(const g of r.regions){ok(g.triangles.every(t=>partial[Math.floor(t/4)]),'no undecided triangles in section');for(const neighbor of g.neighbors)ok(g.color!==neighbor.color,'partial neighbors distinct');}all+=r.regions.length;}
 const again=R.sections(board,s,false,full.memory);eq(again.colors,full.colors,'stable colors without changes');
}
console.log('PASS',checks,'section checks;',L.length,'boards;',all,'partial sections;',Math.round(performance.now()-start)+'ms');
