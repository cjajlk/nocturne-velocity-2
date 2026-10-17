# Nocturne Velocity II — Démo mobile V0.2.2

Une bataille spatiale locale jouable sur PC et navigateur Android : trois vaisseaux, Plasma/Dispersion/Missiles, drones, SPECTRA en trois phases et NOVA chargée par les destructions. 21 assets graphiques et 39 variantes audio. Boutique et Campagne non implémentées.

## Jouer

Démo publique : https://cjajlk.github.io/nocturne-velocity-2/

Sur Android : ouvrir le lien dans Chrome, choisir sa difficulté et son vaisseau, puis toucher « Entrer dans la faille ». Ce premier geste autorise le son et charge les effets. Glisser sur la zone de jeu pour piloter. Les boutons changent l’arme, activent NOVA à 100 % et mettent en pause. SON ON/OFF et VOL règlent les effets. Reprendre explicitement après un changement d’application. En cas d’absence de son, vérifier SON ON, le curseur et le volume multimédia du téléphone puis retoucher Reprendre. La V0.2.1 a fait l’objet d’un premier retour sur Android. L’équilibrage de cette V0.2.2 reste à confirmer sur téléphone physique.

Sur PC : flèches/ZQSD/WASD ou souris, C pour l’arme, N pour NOVA, P/Échap pour la pause. Tir automatique.

Facile affiche les trajectoires et réduit les dégâts. Normal resserre les neuf vagues sans augmenter leurs 18 ennemis, varie les trajectoires et alterne les attaques de SPECTRA avec de courts signaux lumineux. Ses phases 2 et 3 accélèrent les déplacements, les projectiles et les enchaînements ; sa vie et le blindage des vaisseaux restent identiques. Difficile accélère les projectiles, augmente les dégâts et raccourcit les annonces sans supprimer les signaux majeurs. Le choix est conservé séparément du profil.

## Exécuter localement

Node 20+ : `npm start`, puis http://127.0.0.1:8312. `npm test` lance les tests présents dans la copie. Aucun paquet à installer pour jouer ou lancer les tests Node. Utiliser le serveur plutôt qu’ouvrir index.html directement.

## Données et audio

Profil indépendant `nv2_save_v1`. Préférences son/difficulté `nv2_preferences_v1`. Aucun moteur CJ, import Velocity 1 ou crédit partagé. Une nouvelle origine web commence avec un profil neuf sans effacer les données de l’ancienne origine. Le stockage reste local au navigateur.

Effets précalculés en WAV mono 32 kHz, 39 fichiers (~2,7 Mo), à partir de sources CC0 ; aucun oscillateur sonore exécuté en jeu. Chargement après interaction, gain et compression de sortie, 12 voix maximum, variantes alternées, nettoyage des voix à la pause/masquage. Les montages sont destinés à cette première démo ; leur restitution et leur équilibre sur un vrai téléphone doivent être évalués à l’écoute.

Provenance et licences : [assets/audio/provenance.json](assets/audio/provenance.json), [licence audio](assets/audio/LICENSE.txt). Le code et les graphismes conservent leurs droits propres : [LICENSE.txt](LICENSE.txt).

Les sauvegardes de travail, sources sonores brutes, captures, rapports locaux et tests historiques ne font pas partie de la publication. Le rapport de validation complet est conservé localement dans docs/lot2.2/.
