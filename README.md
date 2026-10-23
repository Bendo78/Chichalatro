# Chichalatro

A poker roguelike in a fluorescent chicha style. Play poker hands to beat score targets over 8 *noches* (3 *tandas* each, the last one is a *Jefe* with a special rule). Between tandas, spend Soles in the Bodega to recruit **super cards**, which are your CHICHA TCG cards, and to level up poker hands with *Cumbias* (vinyl records).

All code, art (clown logo, playing cards, card backs), sounds and music are original and made for this project. Sounds and music are synthesized in the browser, so there are no audio files.

## Run it

It's a static site. Serve the folder with any web server, for example:

```
npx serve .
```

## What's in a run

- **Decks** (8): Rosa is open from the start. The others unlock through achievements (*succès*), for example *Primera tanda* unlocks Deck Fiesta (+1 discard).
- **Difficulty** (*mises*, 6): Blanca → Rosa → Naranja → Verde → Azul → Negra. Each adds a rule on top of the previous ones. Winning a run unlocks the next one.
- **Combos tab**: the pink tab next to the side panel (or *Infos run*) lists every poker hand with its level, chips × Mult and how often you played it.
- **Options**: sound effects, cumbia music, volume, game speed (1×/2×/4×), reduced effects.
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

Cards are read from the CHICHA TCG Supabase project: table `game`, row `id = 1`. A public read policy is in place, so everyone sees all cards. If it is removed, players can still sign in with their CHICHA TCG account, and without either the game uses the 34-card base set in `data/base-cards.js`.

## Files

- `js/poker.js`: deck, hand detection, hand values
- `js/supers.js`: turns a TCG card into a super card effect
- `js/data.js`: Supabase loading and sign-in
- `js/meta.js`: achievements, decks, difficulty levels
- `js/art.js`: clown logo, playing cards, card backs (SVG)
- `js/sfx.js`: sound effects and the cumbia loop (Web Audio)
- `js/bg.js`: animated swirl background (WebGL)
- `js/game.js`: screens, run flow, animated table, scoring, shop
- `css/chicha.css`: the look

Debug in the browser console: `ChichaGame.state()`, `ChichaGame.give(20)` (adds Soles).
