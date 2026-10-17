// File bornée de notifications ; aucune dépendance audio dans la simulation.
export function emit(s,type,options={}){if(s.events.length<128)s.events.push({type,at:s.t,x:s.x,...options});}
export function takeEvents(s){return s.events.splice(0);}
