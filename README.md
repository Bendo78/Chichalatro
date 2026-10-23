# Chicha Poker

A poker roguelike in a chicha-poster style. Play poker hands to beat score targets over 8 *noches* (3 *tandas* each, the last one is a *Jefe* with a special rule). Between rounds, spend Soles in the Bodega to recruit **super cards**, which are your CHICHA TCG cards, and to level up poker hands (*Cumbias*).

All the code here is original. It does not use any code from other games.

## Run it

It's a static site. Serve the folder with any web server, for example:

```
npx serve .
```

Then open the URL it prints. Opening `index.html` directly from disk also works, but sign-in needs a real URL.

## How super cards work

Each CHICHA TCG card becomes a super card:

| TCG | Game |
|---|---|
| Name, photo (`img`) | Front of the card |
| Description (`f`) | Back of the card, with the effect |
| Rarity `C U` / `H R X` / `E P N I` / `L M S K` | Commune / Rare / Épique / Légendaire (strength and price) |
| Type `feu` | +Mult |
| Type `eau` | +Jetons (chips) |
| Type `foudre` | ×Mult |
| Type `nature` | Grows over the run |
| Type `psy` | Replays cards, suit bonuses |
| Type `ombre` | Soles (money) and last-hand bonuses |

Each type has 3 variants. The card's id picks the variant, so a given card always has the same effect. See `js/supers.js`.

## Card data (Supabase)

Cards are read from the CHICHA TCG Supabase project: table `game`, row `id = 1`, column `data`. The merge rule is the same as in the TCG (base set + admin cards). Photos are in the public `cards` storage bucket.

That row can only be read by a signed-in user. So either:

- players sign in with their CHICHA TCG account (the **Connexion TCG** button), or
- you allow anonymous read access in the Supabase SQL editor:

  ```sql
  create policy "chicha poker public read" on public.game
    for select to anon using (id = 1);
  ```

Without either one, the game uses the 34-card base set in `data/base-cards.js`.

## Files

- `js/poker.js`: deck, hand detection, hand values
- `js/supers.js`: turns a TCG card into a super card effect
- `js/data.js`: Supabase loading and sign-in
- `js/game.js`: screens, rounds, scoring animation, shop
- `css/chicha.css`: the chicha look

Debug in the browser console: `ChichaGame.state()`, `ChichaGame.give(20)` (adds Soles). `Alt+F` speeds up the animations.
