# Nettoyer Supabase et installer le jeu proprement

Le jeu lit ses cartes (noms, descriptions, photos) dans Supabase. Aujourd'hui elles viennent de l'ancienne appli CHICHA TCG.
Ce guide supprime tout le reste et installe une base faite uniquement pour Chichalatro.

## 0. La sauvegarde (déjà faite)

Le dossier `supabase/backup/` contient tout ce dont le jeu a besoin. Il n'est pas envoyé sur GitHub.

| Fichier | Contenu |
|---|---|
| `game.json` | toutes les données de l'ancienne appli (cartes, séries, réglages) |
| `cards/` | les 232 photos du stockage + les 9 cartes animées (241 fichiers, 17 Mo) |
| `seed-cards.sql` | les 3 séries et les 231 cartes, prêtes à importer |

Ce qui n'est **pas** sauvegardé : les comptes, collections, échanges et duels des joueurs de CHICHA TCG. Ils disparaîtront.
Pour régénérer `seed-cards.sql` : `node supabase/make-seed.js`.

## Choix A — nettoyer le projet actuel (conseillé, le plus simple)

On garde la même adresse et la même clé, et les photos restent en place : rien à changer dans le jeu.

1. **Supabase → SQL Editor → New query** : colle `supabase/clean.sql` → **Run**.
   Ça supprime toutes les tables, vues et fonctions de l'ancienne appli, et tous les comptes.
2. **Storage** : garde le bucket `cards` (les photos du jeu). Supprime les autres buckets s'il y en a.
3. **SQL Editor** : colle `supabase/schema.sql` → **Run** (crée les tables du jeu).
4. **SQL Editor** : colle `supabase/backup/seed-cards.sql` → **Run** (importe les cartes).
5. **Authentication → Providers** : tu peux désactiver ce que l'ancienne appli utilisait (Google, e-mail…). Le jeu n'en a pas besoin.
6. Ouvre le jeu : l'accueil doit afficher « 144 super cartes CHICHA TCG chargées ».

## Choix B — repartir d'un projet tout neuf

1. **Supabase → ancien projet → Project Settings → General → Delete project**.
   S'il y a d'autres projets dans l'organisation dont tu ne veux plus, supprime-les de la même façon.
2. **New project** dans l'organisation : nom `chichalatro`, région Paris (eu-west-3).
3. **SQL Editor** : colle `supabase/schema.sql` → **Run**.
4. **Storage → cards → Upload files** : sélectionne les 241 fichiers de `supabase/backup/cards/`.
5. **SQL Editor** : colle `supabase/backup/seed-cards.sql` → **Run**.
6. **Project Settings → API Keys** : copie l'URL du projet et la clé **publishable** (pas la secrète) dans `js/config.js`.
7. Envoie le changement sur GitHub (`git commit` puis `git push`), le site se met à jour tout seul.

## Ajouter ou modifier des cartes plus tard

- Dépose la photo dans **Storage → cards**.
- Ajoute une ligne dans **Table Editor → cards** : `id` (unique), `name`, `rarity` (C U H R X E P N I L M S K), `type` (feu eau nature foudre psy ombre), `description`, `attack_name`, `image` (nom du fichier), `series_id`.
- Le jeu la prend en compte au prochain chargement (elle reçoit son propre pouvoir et une condition de déblocage).
