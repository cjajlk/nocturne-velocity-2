import {ENEMY} from '../content.js';
// Un lourd renforcé, sans le drapeau boss réservé à la finale SPECTRA.
export const BREAKER=Object.freeze({hp:ENEMY.heavy.hp*3,size:ENEMY.heavy.size*1.2,r:ENEMY.heavy.r*1.2,announcement:3});
export const M01_LIMITS=Object.freeze({bombers:2,enemies:7});
const row=(light,heavy,interval)=>Object.freeze({light,heavy,interval});
export const M01_PLAN=Object.freeze({
 easy:Object.freeze([row(2,0,7),row(2,1,7)]),
 normal:Object.freeze([row(3,1,6.5),row(3,1,6.5)]),
 hard:Object.freeze([row(4,1,6),row(4,2,6)])
});
export const M01_LABELS=Object.freeze(['INTERCEPTION','DÉFENSE DE NEXUS','DERNIÈRE PERCÉE']);
// Les dates autorisent une apparition ; elles ne résolvent jamais une phase.
export function missionSchedule(difficulty,phase){
 const schedule=[];
 if(phase<3)for(let wave=0;wave<2;wave++)schedule.push({at:.6+wave*7,kind:'formation',group:(phase-1)*2+wave});
 if(phase===3)schedule.push({at:BREAKER.announcement,kind:'breaker'});
 if(phase>1){const plan=M01_PLAN[difficulty][phase-2],kinds=Array(plan.light).fill('light');
  for(let i=0;i<plan.heavy;i++)kinds.splice(Math.min(kinds.length,1+i*3),0,'heavy');
  kinds.forEach((kind,i)=>schedule.push({at:(phase===3?6:3)+i*plan.interval,kind}));
 }
 return schedule.sort((a,b)=>a.at-b.at);
}
