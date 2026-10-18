import {CAMPAIGN_WEAPON_RULES,campaignWeaponIds} from './weapons.js';
import {WEAPONS} from '../content.js';
export function renderCampaignWeapons(host,progress){
 const allowed=campaignWeaponIds(progress);host.replaceChildren();
 for(const rule of CAMPAIGN_WEAPON_RULES){const row=document.createElement('li'),name=document.createElement('strong'),state=document.createElement('span');row.dataset.campaignWeapon=rule.id;row.dataset.locked=String(!allowed.includes(rule.id));name.textContent=WEAPONS[rule.id].name;state.textContent=allowed.includes(rule.id)?'Disponible':`Verrouillée · ${rule.label} (mission à venir)`;row.append(name,state);host.append(row);}
}
