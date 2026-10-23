# Chichalatro

A poker roguelike in a fluorescent chicha style. Play poker hands to beat score targets over 8 *nuits* (3 *manches* each: L'Apéro, La Soirée, then a Boss with a special rule, like *La Grève Surprise* or *Le RER B*). Between manches, spend euros in the ChichaClub to recruit **super cards**, which are your CHICHA TCG cards, and to level up poker hands with *Cumbias* (vinyl records).

All code, art (clown logo, playing cards, card backs), sounds and music are original and made for this project. Sounds and music are synthesized in the browser: a punchy funk/breakbeat track on the menu and a laid-back groove during the game.

## Your own music

Put audio files you have the rights to in the `music` folder: `menu.mp3` (menu and collection) and `game.mp3` (during a run). `.ogg` and `.m4a` work too. The game plays them instead of its own tracks. These files are ignored by git.

## Run it

It's a static site. Serve the folder with any web server, for example:

```
npx serve .
```

## What's in a run

- **Decks** (8): Deck Rose is open from the start. The others unlock through achievements (*succès*), for example *Premier apéro* unlocks Deck Teuf (+1 discard).
- **Card unlocks**: 38 super cards are open from the first game. Each other card has its own condition (win rounds, beat bosses, play a hand N times, score X in one hand…), harder for rarer cards. Locked cards show in the Collection; click one to see how to unlock it and your progress. The shop only offers unlocked cards.
- **Difficulty** (*mises*, 6): Blanche → Rose → Orange → Verte → Bleue → Noire. Each adds a rule on top of the previous ones. Winning a run unlocks the next one.
- **Combos tab**: the pink tab next to the side panel (or *Infos run*) lists every poker hand with its level, chips × Mult and how often you played it.
- **Options**: sound effects, music, volume, game speed (1×/2×/4×), reduced effects.
- Keyboard: `Enter` plays the selected hand, `D` discards.

Progress (achievements, decks, difficulty) is saved in the browser.

## Super cards

Each CHICHA TCG card becomes a super card:

| TCG | Game |
|---|---|
| Name, photo or video (`img`, framing `fx/fy/fz`) | Front of the card |
| Attack name (`an`) and description (`f`) | Back of the card, with the effect |
| Rarity `C U` / `H R X` / `E P N I` / `L M S K` | Commune / Rare / Épique / Légendaire |
| Type `feu` / `eau` / `foudre` / `nature` / `psy` / `ombre` | +Mult / +Chips / ×Mult / grows / replays / Soles |

Each type has 3 variants and the card's id picks one, so a card always has the same effect. See `js/supers.js`.

## Card data (Supabase)

Cards are read from the CHICHA TCG Supabase project: table `game`, row `id = 1`. A public read policy is in place, so everyone sees all cards. The game keeps only cards with an illustration, and in the *Legendary Pokemon* series only the unique cards (like *Giratina de Hoshi*). See `usable()` in `js/data.js`. If the read policy is removed, players can still sign in with their CHICHA TCG account, and without either the game uses the 34-card base set in `data/base-cards.js`.

## Files

- `js/poker.js`: deck, hand detection, hand values
- `js/supers.js`: turns a TCG card into a super card effect
- `js/data.js`: Supabase loading and sign-in
- `js/meta.js`: achievements, decks, difficulty levels, lifetime stats
- `js/unlocks.js`: starter cards and the unlock condition of every other card
- `js/art.js`: clown logo, playing cards, card backs (SVG)
- `js/sfx.js`: sound effects, the two music tracks, and playback of your own music files
- `js/bg.js`: animated swirl background (WebGL)
- `js/game.js`: screens, run flow, animated table, scoring, shop
- `css/chicha.css`: the look

Debug in the browser console: `ChichaGame.state()`, `ChichaGame.give(20)` (adds 20 €).
