import {ENEMY} from '../content.js';
import {H} from '../core.js';
// Propositions de laboratoire, dérivées des chasseurs (66) et lourds (52) actuels.
export const DEFENSE_LIMIT=.84;
export const BOMBERS=Object.freeze({
 light:Object.freeze({type:'fighter',...ENEMY.fighter,speed:66,damage:10}),
 heavy:Object.freeze({type:'heavy',...ENEMY.heavy,speed:52,damage:20})
});
export const DEFENSE_COUNTS=Object.freeze({easy:Object.freeze({light:4,heavy:1}),normal:Object.freeze({light:6,heavy:2}),hard:Object.freeze({light:8,heavy:3})});
export const flightRate=kind=>BOMBERS[kind].speed/(H*DEFENSE_LIMIT+BOMBERS[kind].size);
