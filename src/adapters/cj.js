// Port réservé. Aucun moteur, compte, portefeuille ou crédit CJ chargé au lot 0.
// Toute intégration future exige un identifiant NV2 validé et un contrat officiel.
export function createCJAdapter(){return Object.freeze({enabled:false,tick(){return 0;},suspend(){}});}
