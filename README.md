# Chichalatro

A poker roguelike in a fluorescent chicha style. Play poker hands to beat score targets over 8 *nuits* (3 *manches* each: L'Apéro, La Soirée, then a Boss with a special rule, like *La Grève Surprise* or *Le RER B*). Between manches, spend euros in the ChichaClub to recruit **super cards**, which are your CHICHA TCG cards, plus Voyance cards, Vinyles, Tickets VIP and Pochettes (boosters).

All code, art (clown logo, playing cards, card backs), sounds and music are original and made for this project. Sounds and music are synthesized in the browser: a punchy funk/breakbeat track on the menu and a laid-back groove during the game.

## Your own music

Put audio files you have the rights to in the `music` folder: `menu.mp3` (menu and collection) and `game.mp3` (during a run). `.ogg` and `.m4a` work too. The game plays them instead of its own tracks. These files are ignored by git.

## Run it

It's a static site. Serve the folder with any web server, for example:

```
npx serve .
```

## What's in a run

- **Decks** (16): Deck Rose and Deck Teuf are open from the start. The others unlock through special achievements (*succès*), or by winning a game with another deck at a given stake (e.g. win with Deck Rose to unlock Deck Patron).
- **Rounds**: each night, the first two rounds get random meme names (Le Kebab de 2h, Le Tacos 3 Viandes…) and the boss has a special rule (12 bosses: Le Contrôleur RATP, La CAF, Le Mode Avion, Le Ratio, Apagnan…).
- **Card unlocks**: 38 super cards are open from the first game. Each other card has its own condition (win rounds, beat bosses, play a hand N times, score X in one hand…), harder for rarer cards. Locked cards show in the Collection; click one to see how to unlock it and your progress. The shop only offers unlocked cards.
- **Difficulty** (*mises*, 8): Blanche → Rose → Orange → Verte → Violette → Bleue → Dorée → Noire. Each adds a rule on top of the previous ones. Winning a full game (beating the boss of night 8) at a stake unlocks the next one.
- **ChichaClub (shop)**: a row of super cards, Voyance cards and Vinyles; one Ticket VIP per night; a Vinyles shelf; two Pochettes to open. Tickets take effect immediately.
  - **Voyance** (16 cards): change cards of your hand or deck (Piment, Bonus, Caméléon, Verre, Acier, Or, Chance, Pierre…), or give money, super cards, Vinyles.
  - **Vinyles**: level up one poker hand.
  - **Tickets VIP** (12): permanent bonuses for the run (+1 hand, +1 discard, +1 card in hand, +1 super card slot, discounts…).
  - **Pochettes**: choose 1 card among 4 (or 2 among 5 for the Méga ones): super cards, Voyance, Vinyles or new playing cards for your deck.
- **Mutations**: playing cards can get an enhancement (Bonus, Piment, Caméléon, Verre, Acier, Or, Chance, Pierre); super cards can come with an edition (Néon +50 chips, Holo +10 Mult, Arc-en-ciel ×1.5 Mult, Négatif +1 slot).
- **Combos tab**: the pink tab next to the side panel (or *Infos run*) lists every poker hand with its level, chips × Mult and how often you played it.
- **Winning**: beat the boss of night 8 to win the game. You can then continue in endless mode (targets keep growing) to push your record.
- **Stats** (title menu): best hand, best game score, record night, games played/won, favourite hand, decks won per stake, and more.
- **Info bubbles**: hover a playing card (or an item in the shop) for a moment to see what it does.
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

There are 146 different effects (Mult, Jetons, ×Mult, growing effects, replays, passive bonuses, money). Every card gets its own effect, never shared with another card, preferably from the family of its TCG type. See `js/supers.js`.

## Card data (Supabase)

Cards are read from the CHICHA TCG Supabase project: table `game`, row `id = 1`. A public read policy is in place, so everyone sees all cards. The game keeps only cards with an illustration, and in the *Legendary Pokemon* series only the unique cards (like *Giratina de Hoshi*). See `usable()` in `js/data.js`. If the read policy is removed, players can still sign in with their CHICHA TCG account, and without either the game uses the 34-card base set in `data/base-cards.js`.

## Files

- `js/poker.js`: deck, hand detection, hand values
- `js/supers.js`: turns a TCG card into a super card effect
- `js/data.js`: Supabase loading and sign-in
- `js/meta.js`: achievements, decks, difficulty levels, lifetime stats
- `js/unlocks.js`: starter cards and the unlock condition of every other card
- `js/icons.js`: original icon set (SVG) used on enhanced cards, Voyance, Tickets and Pochettes
- `js/items.js`: Voyance, Vinyles, Tickets VIP, Pochettes, enhancements and editions (data and artwork)
- `js/art.js`: clown logo, playing cards, card backs (SVG)
- `js/sfx.js`: sound effects, the two music tracks, and playback of your own music files
- `js/bg.js`: animated swirl background (WebGL)
- `js/game.js`: screens, run flow, animated table, scoring, shop
- `css/chicha.css`: the look

Debug in the browser console: `ChichaGame.state()`, `ChichaGame.give(20)` (adds 20 €).
