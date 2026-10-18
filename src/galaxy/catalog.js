import {missionsForSystem} from '../campaign/catalog.js';
function freeze(value){if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}

// Jalons descriptifs, pas des missions. Aucun producteur jouable pour l'instant.
export const PREREQUISITES=freeze({
 'campaign.echo_access':{label:'Campagne principale',description:'Accès à Écho obtenu dans la campagne principale.',implemented:false},
 'secondary.echo_discovery':{label:'Découverte en mission secondaire',description:'Découverte d’Écho obtenue dans une mission secondaire.',implemented:false},
 'campaign.nyx_major_progress':{label:'Progression majeure de campagne',description:'Progression majeure dans la campagne ouvrant Nyx.',implemented:false},
 'recon.nyx_access':{label:'Opération de reconnaissance',description:'Opération de reconnaissance ouvrant Nyx.',implemented:false},
 'spectra.major_accomplishments':{label:'Plusieurs accomplissements majeurs',description:'Ensemble des accomplissements majeurs requis, liste à définir.',implemented:false},
 'conquest.spectra_operation':{label:'Opération de conquête',description:'Opération de conquête requise pour Front SPECTRA.',implemented:false}
});
const fact=id=>({op:'fact',id});
export const SYSTEMS=freeze([
 {id:'nexus',name:'Nexus',description:'Base principale et point de départ.',sectorType:'base',initialAccess:true,visible:true,unlockCondition:null,missionIds:missionsForSystem('nexus').map(m=>m.id),planetIds:[]},
 {id:'aurora',name:'Aurora',description:'Secteur destiné aux futures missions civiles.',sectorType:'civilian',initialAccess:true,visible:true,unlockCondition:null,missionIds:[],planetIds:[]},
 {id:'echo',name:'Écho',description:'Secteur destiné aux ressources et à l’extraction.',sectorType:'extraction',initialAccess:false,visible:true,unlockCondition:{op:'any',conditions:[fact('campaign.echo_access'),fact('secondary.echo_discovery')]},missionIds:[],planetIds:[]},
 {id:'nyx',name:'Nyx',description:'Secteur destiné à la reconnaissance et à la conquête.',sectorType:'reconnaissance_conquest',initialAccess:false,visible:true,unlockCondition:{op:'any',conditions:[fact('campaign.nyx_major_progress'),fact('recon.nyx_access')]},missionIds:[],planetIds:[]},
 {id:'front_spectra',name:'Front SPECTRA',description:'Front destiné aux futures grandes batailles.',sectorType:'frontline',initialAccess:false,visible:true,unlockCondition:{op:'all',conditions:[fact('spectra.major_accomplishments'),fact('conquest.spectra_operation')]},missionIds:[],planetIds:[]}
]);
// Chaque système est sa destination principale. Les listes de planètes restent vides.
export const INITIAL_DESTINATIONS=Object.freeze(SYSTEMS.filter(s=>s.initialAccess).map(s=>s.id));
export const systemById=id=>SYSTEMS.find(s=>s.id===id)||null;
