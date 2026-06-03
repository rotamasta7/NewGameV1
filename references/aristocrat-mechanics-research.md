# Aristocrat Pokie Mechanics — Deep Research Report
*Game design reference for Aussie Bites & V8 Supercars themes*

---

## 1. Core Architecture

### The Reel Strip (PARS System)
Every Aristocrat pokie runs on a PARS sheet (Paytable And Reel Strips) — defines
which symbols sit on each virtual reel position. A reel might have 64 virtual stops.
A high-value symbol might occupy only 2 of 64 stops (rare); a low-value symbol
occupies 12 (common). This weighting is invisible to the player but controls everything.

### Two Payline Systems Aristocrat Uses
| System | How It Works | Used In |
|---|---|---|
| Traditional paylines | 20–25 fixed or selectable lines | Where's the Gold, Queen of Nile, More Chilli |
| Reel Power (243 ways) | Buy reels not lines — any adjacent symbol pays | 5 Dragons, Indian Dreaming, Buffalo |

243-ways feels more generous psychologically even at same RTP — wins "just happen"
without needing exact line alignment.

### Stacked Symbols
High-value symbols occupy consecutive positions on reel strip. When reel stops at
right position, 2–4 of same symbol stack on visible window. Full-reel wild stack =
the game's visual climax moment. This is what Aristocrat built their reputation on.

---

## 2. More Chilli — The Escalating Feature Model
*This is the model for Aussie Bites*

**Base game:** 5 reels, 25 paylines, 95.69% RTP, medium volatility.
Wild (Sombrero) stacks up to 3 positions.

### Why the Feature Is Genius
3+ scatter Chilli Peppers trigger free games (12 standard, 15 with +5 option).
The feature is NOT a fixed spin count — it escalates based on what you collect:

```
During free games, the CHILLI PEPPER count builds:
  9 chillies  → 3rd reel set unlocks + reel 5 turns fully WILD
 14 chillies  → 4th reel set unlocks + reels 4+5 fully WILD
 30 chillies  → All reels 3–5 across ALL reel sets fully WILD
```

The key: free games contain a META-GAME. Player isn't passively watching spins —
they're watching a progress meter build. Every chilli feels like progress toward
something bigger. Even when feature ends "early," player wants to trigger again
for more chillies. This loop makes More Chilli one of the most replayed pokies
in Australian pubs.

---

## 3. 5 Dragons — The Player Choice Model

**Base game:** 5 reels, 243 Reel Power ways, 25 coins per spin.

### The Feature
3+ Bonus symbols trigger feature. Player picks one of 5 dragon colours before
any free spin plays — each = different risk/reward profile:

| Dragon | Free Games | Wild Multiplier |
|---|---|---|
| Red | ~25 | Low (2×–5×) |
| Green | ~20 | Medium |
| Blue | ~15 | Medium-high |
| Purple | ~12 | High (15×) |
| Gold | ~10 | Maximum (30×) |

Player is invested because THEY made the call. A 30× multiplier on a stacked wild
reel = one of the biggest hits available on any pub machine.
Spawned 20+ variants — core pick-your-volatility mechanic is endlessly compelling.

---

## 4. Where's the Gold — The Narrative Pick Game Model

**Base game:** 5 reels, 25 paylines, 94.72% RTP. Dynamite = scatter.

### The Feature
Land 3+ dynamite scatters → pick one of 5 miner characters:
- Prof. Gold, Nugget Ned, Fido (dog — crowd favourite), Happy Lucky, Winnie Fortune

Chosen miner reveals: nuggets (= free spins count) + which gold symbols become
wilds during those free spins.

Why it works: players develop personal relationships with characters ("I always
pick Fido"). Mining narrative carries through entire feature. Wild-reveal moment
is visually dramatic. Retrigger keeps every spin in feature feeling important.

---

## 5. Other Key Aristocrat Titles

| Game | Paylines | Wild | Feature | Free Games | Unique Hook |
|---|---|---|---|---|---|
| Queen of the Nile | 20 | 2× multiplier | 3+ pyramid | 15 spins × 3× all wins | Wild doubles AND multiplier stacks |
| Indian Dreaming | 243 ways | Tepee | 3+ dream catcher | Choose multiplier (3×–15×) | Player sets own variance |
| Miss Kitty | 50 | Standard | 3+ scatter | Extra wilds | High line count = more small wins |
| Buffalo | 1024 ways | Standard | 3+ scatter | Stacked buffalo | Coin-pop sound design is iconic |

---

## 6. The Psychological Engine

### Anticipation Reels (Most Powerful Mechanic)
When 1–2 scatters land, reels 4 and 5 visibly SLOW DOWN. Tick sound changes tempo.
Music shifts. Heart rate genuinely increases. Dopamine response is nearly identical
to an actual win — whether the scatter lands or misses.

### Near-Miss Architecture
Scatter symbols appear on rows above/below the payline more frequently than pure
random probability would place them. Two scatters visible + third just misses =
activates same brain reward pathways as a win.

### Variable Reinforcement
Wins are unpredictable in timing and size — the most powerful reward schedule for
habit formation. Players can't predict the next feature so they keep spinning.

### Feature Guarantee (Australian Regulation)
AU states require bonus feature to trigger within a maximum number of games
(typically 50–200 spins, exact threshold in PARS sheet). Players develop folk
understanding — "it's been 80 spins, it's due" — psychologically keeps them
playing through dry stretches.

### Loss Disguised as Win (LDW)
Bet 20, win 5 back — machine plays win animation. Net -15 feels like a win.
For fake-money apps: this just means every small return feels celebratory. Use it.

### Sound as Core Mechanic (PMC Research Finding)
- Win sounds increase subjective value of wins
- Near-miss sounds increase urge to play on even with no win
- Turning sounds off significantly reduces psychological pull
- Buffalo (Aristocrat): coin-by-coin pop sound as coins appear = micro-dopamine per coin
- Each sound event is a designed moment, not an afterthought

---

## 7. Design Application to Our Games

### Aussie Bites — More Chilli Model (CONFIRMED)
- Scatter = ARGO CONE (3+ triggers Feature)
- During Canteen Frenzy free games: collect ARGO CONES to expand reel sets
  ```
    9 Argo Cones → 3rd reel set + reel 5 all WILD
   14 Argo Cones → 4th reel set + reels 4+5 all WILD
   30 Argo Cones → reels 3–5 all WILD across all reel sets
  ```
- Golden Gaytime = expanding wild (fills whole reel when it lands)
- Free games count: 12 standard, 15 with +5 option
- 3× multiplier on all free game wins
- Retrigger possible during feature

### V8 Supercars — 5 Dragons Model (PROPOSED)
- Scatter = Bathurst Mountain (3+ triggers Feature)
- Pick a Driver's Helmet before free games:
  - Brock-inspired = moderate spins, medium multiplier
  - Moffat-inspired = fewer spins, high multiplier
  - Lowndes-inspired = most spins, low multiplier
  - Johnson-inspired = medium spins, medium-high multiplier
- Stacked race cars = expanding wilds during free games
- Anticipation: 2 scatters → reel 5 slows with engine-revving sound
- Retrigger via chequered flag symbols

---

## 8. Sound Requirements (Full List)

Every one of these is a distinct audio asset needed:

### Base Game Sounds
- [ ] Reel spin start (mechanical whirr begin)
- [ ] Reel 1 stop click
- [ ] Reel 2 stop click
- [ ] Reel 3 stop click
- [ ] Reel 4 stop click (slightly different tone)
- [ ] Reel 5 stop click (slightly different tone)
- [ ] Button tap (generic UI)
- [ ] Hold button activate
- [ ] Hold button deactivate
- [ ] Bet increase/decrease click
- [ ] Max bet press
- [ ] Collect/cashout sound

### Win Sounds (tiered by win size)
- [ ] Tiny win (less than bet) — short, minor jingle
- [ ] Small win (1×–5× bet) — light coin sounds
- [ ] Medium win (5×–20× bet) — coin cascade, short fanfare
- [ ] Big win (20×–50× bet) — extended fanfare, coin shower
- [ ] Super win (50×–100× bet) — big celebration, screen effects
- [ ] MEGA WIN (100×+ bet) — full orchestral hit, long celebration

### Win Line Sounds
- [ ] Single payline flash sound
- [ ] Multiple paylines flash sound

### Scatter / Feature Sounds
- [ ] 1st scatter lands (subtle musical sting)
- [ ] 2nd scatter lands (louder sting, anticipation builds)
- [ ] Anticipation mode start (reels slow — unique looping sound)
- [ ] 3rd scatter LANDS (feature trigger fanfare — big moment)
- [ ] Feature not triggered (3rd scatter misses — deflation sound)
- [ ] Feature trigger celebration (screen explosion, unique to each theme)

### Aussie Bites Specific
- [ ] Argo Cone collect sound (each one picked up during free games)
- [ ] Reel set expansion (9 Argos unlocked) — "level up" style sound
- [ ] Reel set expansion (14 Argos unlocked) — bigger version
- [ ] Reel set expansion (30 Argos unlocked) — maximum celebration
- [ ] Golden Gaytime expanding wild sound
- [ ] Free games start jingle (school canteen / ice cream truck flavour)
- [ ] Free games background music loop (different from base game)
- [ ] Free games end sound
- [ ] Retrigger sound (feature extends)

### V8 Supercars Specific
- [ ] Engine rev anticipation sound (reel slowdown)
- [ ] Helmet pick screen music
- [ ] Race start countdown sound (3-2-1-GO for free games begin)
- [ ] Free games background music (race broadcast flavour)
- [ ] Chequered flag retrigger sound
- [ ] Stacked car wild lands sound

### Ambient
- [ ] Base game background music loop (theme-specific)
- [ ] Idle loop (if player doesn't spin for 30+ seconds)

**Total distinct audio assets needed: ~40–50 per theme**
All generatable via ElevenLabs sound effects + Suno for music tracks. Cost: $0.

---

*Sources:*
- Slot machine — Wikipedia
- More Chilli mechanics — freeslotshub.com, telvista.com
- 5 Dragons — vegasslotsonline.com, aristocratgaming.com
- Where's the Gold — gambling911.com, gamingslots.com
- Indian Dreaming — pokieslab2.com, pokiesman1.net
- Queen of the Nile — pokiesman1.net, pokiesecrets.com
- Anticipation/psychology — mapilots.org, cdcgaming.com
- Sound research — PMC/NIH Journal of Gambling Studies
- Aristocrat programming — wizardofvegas.com forum
