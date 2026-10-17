export const SHIPS={
 wisp:{name:'Mk-II · Aiguille',speed:360,accel:1800,brake:2400,hp:65,cooldown:.16,damage:1,asset:'mk2',size:86,r:20},
 revenant:{name:'Mk-I · Polyvalent',speed:275,accel:1150,brake:1800,hp:100,cooldown:.24,damage:2,asset:'mk1',size:94,r:27},
 bastion:{name:'Mk-III · Bastion',speed:205,accel:680,brake:1100,hp:155,cooldown:.34,damage:3.2,asset:'mk3',size:112,r:34}
};
// Identifiants lot 0 conservés pour les sauvegardes existantes.
export const WEAPONS={
 flux:{name:'Plasma',multiplier:1.1,cooldown:1,speed:650,life:1.9,description:'Concentré, rapide et précis ; exige de rester aligné.'},
 impact:{name:'Dispersion',multiplier:.62,cooldown:1.65,speed:480,life:1.5,description:'Trois tirs en éventail ; portée courte, dégâts répartis.'},
 missile:{name:'Missiles traqueurs',multiplier:3.4,cooldown:3.4,speed:350,life:3.3,turn:2.4,description:'Guidage progressif ; cadence lente et virages limités.'}
};
export const NOVA={radius:310,bossDamage:12,damage:18,charge:{fighter:12,interceptor:14,heavy:28}};
export const ENEMY={fighter:{hp:6,r:25,size:80},interceptor:{hp:5,r:22,size:76},heavy:{hp:32,r:39,size:118},spectra:{hp:360,r:78,size:240}};
export const DRONES={none:{name:'Aucun'},alpha:{name:'Alpha · Appui'},beta:{name:'Beta · Bouclier'}};
export const CAMPAIGN=Array.from({length:25},(_,i)=>({id:i+1,status:'planned',playable:false}));
export const MODES={survival:{playable:true},campaign:{playable:false,missions:CAMPAIGN}};
export const ASSETS=Object.fromEntries(['mk1','mk2','mk3','fighter','interceptor','heavy','spectra','nebula','asteroid','plasma','spread','missile','engine','impact','explosion','largeExplosion','shield','nova','hostile','debris','drone'].map(id=>[id,`assets/lot1/${id}.png`]));
export const LIMITS=Object.freeze({bullets:160,hostile:100,enemies:20,effects:36,particles:100,trail:8});
