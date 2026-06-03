# Slot Machine Game — Full Design & Project Write-Up

---

## 1. What We're Building

A mobile-first slot machine app targeting Android (Google Play), modelled closely on **Aristocrat-style Australian poker machines**. Fake credits only — entertainment / casual gaming category. Three launch themes, with a future pinball crossover mode as a long-term vision.

---

## 2. Technology Stack Recommendation

### Engine: Unity (Personal Tier — Free)

Unity is the right call for this project for three reasons:

1. **Asset Store** — there are ready-made slot machine kits ($30–$80) that include reel systems, animation rigs, sound, and UI. This closes the biggest risk (art/audio production) without a full team.
2. **Android export** is first-class. One click to build an `.apk` or `.aab` for Google Play.
3. **Pinball crossover** — Unity's physics engine (Rigidbody2D, colliders) handles pinball mechanics natively. You would not be starting over. The slot machine and pinball game share the same project, same codebase.

### Language: C# (via Unity)

Clean, strongly typed, large community. All game logic will be written in C#.

### Minimum Android API: Level 26 (Android 8.0)
Covers ~95% of active devices as of 2025.

---

## 3. Authentic Aristocrat Features (The Details That Matter)

This is the list that separates a real-feeling machine from a generic "spinning reels" app.

### Reel Mechanics
| Feature | Notes |
|---|---|
| **5 reels × 3 rows** | Standard modern Aristocrat layout |
| **20 configurable paylines** | Player can play 1–20 lines |
| **Weighted reel strips** | Each reel has a strip of 40–64 symbol positions with unequal symbol frequency. This is what makes wins feel rare but possible. |
| **Near miss engineering** | High-value symbols appear just above or below the payline more often than pure random would suggest — feels dramatic |
| **Scatter pays** | Bonus symbol pays regardless of payline (appears anywhere on screen) |
| **Wild substitution** | Wild replaces any symbol except scatter/bonus |

### Betting System
| Feature | Notes |
|---|---|
| **Bet per line** | 1, 2, 5, 10, 20, 50 credits |
| **Lines × Bet = Total bet** | Always displayed |
| **MAX BET button** | Sets to 20 lines × max credit bet |
| **Credit denominations** | 1c, 2c, 5c — affects how credits are labelled |

### Australian-Specific Features
| Feature | Notes |
|---|---|
| **HOLD / NUDGE buttons** | After a non-winning spin, player can hold 1+ reels and spin again. Nudge moves a reel up/down one position. Classic pub machine feature. |
| **GAMBLE feature** | After any win, player can gamble the win: pick red/black card (50/50), correct = win doubled, wrong = lose it all. Standard on every Aristocrat machine. |
| **Feature Guarantee** | If the bonus hasn't triggered after N spins (hidden counter, varies), it force-triggers. Keeps engagement. |
| **Free Games (Free Spins)** | Triggered by 3+ scatter symbols. 10–25 free games with multiplier. Reels may behave differently (stacked wilds, etc.) |
| **Bonus Game** | A pick-a-prize screen triggered by a second scatter/bonus combo. Player taps objects to reveal credit prizes. |
| **Win presentation** | Win amount counts up with sound, coins animate, paylines flash in sequence |
| **Autoplay** | Set 5–100 auto-spins with optional stop conditions (win threshold, loss limit) |
| **Info screen** | Paytable showing all symbol values at all bet levels — legal requirement in AU |

### RTP (Return to Player)
- Target: **94–96%** (typical Aristocrat range)
- This is controlled entirely by the weighted reel strips and paytable configuration
- We will build a simulation tool to verify RTP before shipping (run 10 million virtual spins, check the output)

---

## 4. The Three Themes

### Theme 1: GRAND PRIX SLOTS (Motorsport)

**Vibe:** Night race, carbon fibre, adrenaline. Think Formula 1 meets V8 Supercars.

**Colour Palette:**
- Background: Deep navy / carbon fibre `#111827`
- Title: Racing red `#c62828`
- Accent: Championship gold `#fbbf24`
- Win flash: White/gold burst

**Symbol Set (high → low value):**
| Symbol | Tier | Notes |
|---|---|---|
| WILD (Checkered Flag) | Wild | Substitutes all except scatter |
| TROPHY | High | 5× pays jackpot |
| RACE CAR | High | Stacked on reels 2 & 4 during free spins |
| HELMET | Mid | |
| PODIUM | Mid | |
| PIT STOP | Low | |
| TIRE | Low | |
| FUEL | Low | |
| BONUS (Race Track) | Scatter | 3+ anywhere → Free Spins |

**Bonus Feature: PIT LANE BONUS**
- Trigger: 3 BONUS scatters
- Player picks from 6 "pit boxes" revealing credit prizes + multipliers
- One pit box triggers "SAFETY CAR" = extended free spins mode

**Free Spins Feature: TURBO SPINS**
- 15 free games
- Race Car symbol becomes stacked (fills entire reel) during free games
- Speed-up animation plays between spins

---

### Theme 2: HOME RUN HEROES (MLB)

**Vibe:** Stadium lights, big crowds, classic American baseball nostalgia.

**Colour Palette:**
- Background: Stadium night `#0f1923`
- Title: Baseball blue `#1565c0`
- Accent: Home run red `#dc2626`
- Win flash: Gold confetti

**Symbol Set:**
| Symbol | Tier | Notes |
|---|---|---|
| WILD (Baseball with crown) | Wild | |
| WORLD SERIES TROPHY | High | Jackpot symbol |
| HOME RUN (Ball leaving park) | High | |
| STADIUM | Mid-High | |
| BAT | Mid | |
| GLOVE | Mid | |
| BASEBALL | Mid-Low | |
| HOT DOG | Low | |
| PEANUTS | Low | |
| CAP | Low | |
| ALL-STAR (scatter) | Scatter | 3+ → free games |

**Bonus Feature: GRAND SLAM PICK**
- 4 "bases" to pick — each reveals a multiplier (1×, 2×, 3×)
- Hit all 4 = GRAND SLAM jackpot bonus

**Free Spins Feature: THE STREAK**
- 10 free games base
- Each free game win extends the streak counter
- Streak of 5 = extra free games awarded
- "CROWD GOES WILD" screen when streak hits 10

---

### Theme 3: AUSSIE BITES (Australian Snacks & Ice Cream)

**Vibe:** School canteen, summer holidays, Aussie nostalgia — Golden Gaytime, Paddle Pops, the milk bar era.

**Colour Palette:**
- Background: Summer sky `#0f1d2a` (night mode) / bright sky `#e0f2fe` (day mode toggle)
- Title: Candy pink `#c2185b`
- Accent: Sunshine yellow `#ffd600`
- Win flash: Rainbow burst

**Symbol Set:**
| Symbol | Tier | Notes |
|---|---|---|
| GOLDEN GAYTIME | Wild | The hero symbol. Obviously. |
| PADDLE POP (Lion) | High | Jackpot |
| VIOLET CRUMBLE | High | |
| TIM TAM | Mid | |
| LAMINGTON | Mid | |
| CHIKO ROLL | Mid | |
| ZOOPER DOOPER | Low | |
| FANTALES | Low | |
| SHAPES | Low | |
| DAGWOOD DOG | Scatter | Show Bag Bonus trigger |

**Bonus Feature: SHOW BAG BONUS**
- Pick a showbag from 8 options (Bertie Beetle, mixed lollies, etc.)
- Each reveals a prize: credit amount, free spins, or "JACKPOT ALLEY" mini-game

**Free Spins Feature: SCHOOL CANTEEN FRENZY**
- 12 free games
- Golden Gaytime WILD expands to fill full reel when it lands
- Sound: ice cream truck jingle plays during free spins

---

## 5. Assets — AI-First Approach (Cheap as Possible)

AI tools have completely changed the cost profile for indie game art. Here's the honest picture using the tools you already have access to.

---

### The Only Thing That Costs Money

| Asset | Cost | Notes |
|---|---|---|
| **Google Play Developer Account** | **$25 one-time** | The only unavoidable spend. Covers every app you ever publish on that account, forever. |

That's it. Everything else is free or covered by AI tools you likely already use.

---

### Symbol Art — Use AI Image Generation

This is where the old estimate ballooned to $500+. With AI it's free.

**Recommended tools:**
| Tool | Cost | Best For |
|---|---|---|
| **Gemini** (you mentioned this) | Free tier available | High quality, good at stylised game art |
| **DALL-E 3** (via ChatGPT) | Free tier / $20/mo Plus | Excellent at consistent style per theme |
| **Adobe Firefly** | Free tier | Good for transparent PNG exports (important for sprites) |
| **Stable Diffusion** (local) | Free | Fully offline, unlimited generations, needs decent GPU |

**The workflow:**
1. Generate each symbol at 512×512 or 1024×1024 on a transparent background
2. Prompt example: *"A golden trophy cup, slot machine symbol, flat illustration style, vibrant, transparent background, game art, casino style, isolated object"*
3. Import PNG into Unity as a sprite
4. Done — same result as paying an artist $150

**What to generate per theme (~10 images each):**
- Motorsport: Trophy, Race Car, Helmet, Checkered Flag, Podium, Tire, Fuel Can, Pit Stop sign, Race Track (scatter)
- MLB: World Series Trophy, Baseball, Bat, Glove, Stadium, Hot Dog, Peanuts, Cap, All-Star (scatter)
- Aussie Treats: Golden Gaytime, Paddle Pop, Violet Crumble, Tim Tam, Lamington, Chiko Roll, Zooper Dooper, Fantales, Shapes, Dagwood Dog (scatter)

**I can write the exact AI prompts for every symbol** when you're ready to generate them.

---

### Sound Effects — Free AI + Free Libraries

| Tool | Cost | What to Use It For |
|---|---|---|
| **ElevenLabs** (Sound Effects) | Free tier (100 credits/mo) | Generate custom sounds: "coin rain sound effect", "slot machine spin mechanical" |
| **Freesound.org** | Free | CC-licensed, thousands of slot/casino sounds |
| **Pixabay Audio** | Free | Background music loops, no attribution needed |
| **Suno** | Free tier | Generate full theme-appropriate background tracks |

**Sounds you'll need:**
- Reel spin start + stop (mechanical whirr + click)
- Coin cascade (win animation sound)
- Small win jingle, big win fanfare
- Button tap
- Bonus trigger (dramatic sting)
- Free spins intro music
- Theme-specific ambient loop

---

### Game Engine — Free

| Tool | Cost | Notes |
|---|---|---|
| **Unity Personal** | Free | For projects under $200k annual revenue. Covers everything you need. |
| **Android Studio** | Free | Google's official Android dev tools, for testing builds |

**Important:** Unity recently changed its pricing model. Personal is still free but verify you're on the latest terms at unity.com when you set up. The free tier is fully capable for this project.

---

### Unity Slot Machine Kit — Optional but Time-Saving

The one optional paid item worth considering:

| Option | Cost | Tradeoff |
|---|---|---|
| **Build the reel system yourself** | $0 | 2–3 weeks of C# coding. I can write all of this. |
| **Unity Asset Store kit** | $30–$80 | Pre-tested reel system, saves time but adds dependency |

My recommendation: **let me build it from scratch.** I can write the reel engine, payline logic, RTP system, and bonus triggers in C#. You keep full control, no licensing complications, and it's purpose-built for your exact design. The Unity Asset Store kits are often over-engineered or built for older Unity versions.

---

### True Cost Summary

| Scenario | Cost |
|---|---|
| **Minimum viable launch** (1 theme, AI art, free sounds) | **$25** |
| **Full 3-theme launch** (AI art, free sounds, free music) | **$25** |
| **If you want to add a paid sounds pack** | $25 + $20 |
| **If you want to buy a Unity slot kit instead of custom build** | $25 + $50 |

The hard ceiling here is $100 if you want every possible optional shortcut. The floor is literally $25.

---

### AI Art Tips for Slot Machine Symbols

A few things that matter for quality:

1. **Consistent style prompt:** Add a style tag to every symbol prompt to keep them cohesive — e.g. *"…in the style of a vibrant 2D vector game icon, bold outlines, casino card game art style"*

2. **Transparent backgrounds:** Always request *"isolated on transparent background, PNG"* — not all AI tools honor this but Firefly and newer DALL-E do

3. **Multiple variations:** Generate 4–6 per symbol and pick the best. Free tiers give enough credits for this.

4. **Upscaling:** If symbols look slightly blurry at game size, run them through a free upscaler (Topaz Gigapixel has a free trial, or use the free waifu2x online tool)

5. **I can write the prompt list:** When you're ready to start generating, tell me which theme to start with and I'll give you a complete copy-paste prompt for every symbol in that theme.

---

## 6. Development Phases

### Phase 0 — Setup (Week 1)
- Unity project created, Android build configured
- Slot machine kit purchased and imported
- Git repository structured
- Basic reel spinning working (placeholder symbols)

### Phase 1 — Core Engine (Weeks 2–4)
- Weighted reel strips implemented for Theme 1
- Payline evaluation logic (20 lines)
- Credit / bet system
- Basic win presentation (count-up, flash)
- Hold / Nudge buttons
- Gamble feature

### Phase 2 — Theme 1: Grand Prix (Weeks 5–8)
- All 9 symbols integrated with final art
- Pit Lane Bonus game built
- Turbo Spins free games mode
- Sound / music integrated
- UI polished (title screen, info/paytable screen)
- RTP verification simulation run

### Phase 3 — Store Prep (Week 9)
- App icon, splash screen, Play Store screenshots
- Privacy policy page (required by Google)
- Rating: submit for IARC rating (free, in-console process)
- Internal test track release

### Phase 4 — Themes 2 & 3 (Weeks 10–16)
- Theme engine re-used, only art/audio/config changes
- Each theme gets its own bonus game variant
- A/B test which theme to feature first on store listing

### Phase 5 — Pinball Crossover Research (Future)
- Begin prototyping pinball physics in same Unity project
- Design the "mashup" mechanic (reel win unlocks pinball mode?)
- This deserves its own design doc when we get there

---

## 7. Google Play Submission Notes

- **Category:** Casino (even with fake money — Google requires this)
- **Rating:** Will receive a "Simulated Gambling" content descriptor from IARC (not an 18+ adult-only rating, but must display prominently that no real money is involved)
- **Required disclosures in store listing:**
  - "For entertainment only — no real money gambling"
  - "Does not offer real money gambling or prizes"
  - "Not available to persons under 18 in some jurisdictions" (recommended disclaimer)
- **No real-money IAP:** If you ever add in-app purchases for credit bundles, this triggers additional Google policies and potentially AU regulatory requirements. Keep it free or use a one-time purchase model.

---

## 8. Future Vision — Pinball Crossover

The dream mechanic I'd suggest exploring:

**"JACKPOT LANE" mode** — Triggered by a special jackpot symbol combo on the slot reels. The screen transitions to a pinball table. You get 3 balls. The pinball table has:
- Slot machine reels as bumpers (hitting them spins the reel)
- A "COLLECT" drain at bottom — drain intentionally to collect your win
- Multiplier lanes at top
- Bonus ramp that triggers more free reel spins

The slot machine IS the pinball machine. One game, two modes.

This is buildable in Unity. Physics-based pinball + the reel engine you've already built. Realistically this is a 6–8 week add-on once the slot engine is solid.

---

*Document version: 1.0 — June 2026*
*Prepared for: NewGameV1 project*
