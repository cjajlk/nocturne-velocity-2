import {SYSTEMS,PREREQUISITES,INITIAL_DESTINATIONS,systemById} from './catalog.js';

export function createInitialProgress(){return {version:1,unlockedDestinations:[...INITIAL_DESTINATIONS],accomplishments:[]};}
export function evaluateCondition(condition,accomplishments,depth=0){
 if(!condition||depth>8||!Array.isArray(accomplishments))return false;
 if(condition.op==='fact')return typeof condition.id==='string'&&Object.hasOwn(PREREQUISITES,condition.id)&&accomplishments.includes(condition.id);
 if(!['any','all'].includes(condition.op)||!Array.isArray(condition.conditions)||!condition.conditions.length)return false;
 const values=condition.conditions.map(c=>evaluateCondition(c,accomplishments,depth+1));
 return condition.op==='any'?values.some(Boolean):values.every(Boolean);
}
export function destinationAccess(id,progress){
 const system=systemById(id);
 if(!system)return {id,visible:false,accessible:false,status:'unknown',eligible:false,condition:null};
 const permanent=Array.isArray(progress?.unlockedDestinations)&&progress.unlockedDestinations.includes(id);
 const accessible=system.initialAccess||permanent;
 return {id,visible:true,accessible,status:accessible?'accessible':'locked',eligible:accessible||evaluateCondition(system.unlockCondition,progress?.accomplishments),condition:system.unlockCondition};
}
export function listDestinations(progress){return SYSTEMS.map(system=>({...system,access:destinationAccess(system.id,progress)}));}

// Fonction pure : données déjà validées par un futur producteur de progression.
// Elle n'écrit rien. Le magasin persistant refuse les producteurs non implémentés.
export function advanceProgress(progress,validatedAccomplishments){
 if(progress?.version!==1||!Array.isArray(progress.unlockedDestinations)||!Array.isArray(progress.accomplishments)||!Array.isArray(validatedAccomplishments))throw new TypeError('Progression invalide');
 if(progress.unlockedDestinations.some(id=>!systemById(id))||[...progress.accomplishments,...validatedAccomplishments].some(id=>typeof id!=='string'||!Object.hasOwn(PREREQUISITES,id)))throw new TypeError('Identifiant de progression inconnu');
 const accomplishments=[...new Set([...progress.accomplishments,...validatedAccomplishments])];
 const unlocked=new Set([...INITIAL_DESTINATIONS,...progress.unlockedDestinations]);
 for(const system of SYSTEMS)if(evaluateCondition(system.unlockCondition,accomplishments))unlocked.add(system.id);
 return {version:1,unlockedDestinations:[...unlocked],accomplishments};
}
