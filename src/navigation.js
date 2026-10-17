// Le menu reste le garage existant. Aucun nouvel écran de combat.
export function createNavigation({initial='menu',leave=()=>{},enter=()=>{}}={}){
 const screens=['galaxy','menu','combat'];
 if(!screens.includes(initial))throw new RangeError('Écran inconnu');
 let screen=initial,transitioning=false;
 return {
  get screen(){return screen;},
  show(next){
   if(!screens.includes(next))throw new RangeError('Écran inconnu');
   if(transitioning||next===screen)return false;
   transitioning=true;
   try{const previous=screen;leave(previous,next);screen=next;enter(next,previous);return true;}
   finally{transitioning=false;}
  }
 };
}
