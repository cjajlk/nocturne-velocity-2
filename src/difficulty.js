export const DIFFICULTIES=Object.freeze({
 easy:Object.freeze({name:'Facile',damage:.6,projectileSpeed:.82,warningTime:1.25,cooldown:1.1,trajectories:true,cue:1}),
 normal:Object.freeze({name:'Normal',damage:1,projectileSpeed:1,warningTime:1,cooldown:1,trajectories:false,cue:.22}),
 hard:Object.freeze({name:'Difficile',damage:1.25,projectileSpeed:1.12,warningTime:.75,cooldown:.9,trajectories:false,cue:.14})
});
export const difficultyFor=id=>DIFFICULTIES[Object.hasOwn(DIFFICULTIES,id)?id:'normal'];
export function cueFor(s,e){const d=s.difficulty||DIFFICULTIES.normal;return {lines:d.trajectories,visible:!!e.warning&&(d.trajectories||e.warning.time<=((e.boss||e.type==='heavy')?Math.max(.3,d.cue):d.cue))};}
