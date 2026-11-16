# DM's Table — D&D Dungeon Master Dashboard

A single-page, fully offline dashboard for running the table. Open `index.html` in any modern
browser (or serve the folder / enable GitHub Pages) — no build step, no dependencies, no network.

## Tabs

### 🔊 Soundboard (Matt Mercer inspired)
A mixing board of ambience and effects, all **synthesized live with the Web Audio API**
(no audio files to ship): Tavern Crowd, Rain, Thunder, Wind, Fireplace, Forest & Birds,
Night Crickets, Ocean Waves, Dungeon Drone, Battle, Crowd/Cheer, and Ship at Sea.

- Every channel has a **vertical slider** (drag, scroll-wheel, or arrow keys) plus an ON/OFF button.
- A vertical **master** slider and a **Mute All** button sit in the side panel.
- **Presets**: eight built-in mixes (Tavern Night, Rainstorm, Dungeon Delve, Battle, Forest Calm,
  Ocean Voyage, Market Crowd, Silence) plus your own — type a name, hit **Save**, click to load,
  ✕ to delete. Presets persist in `localStorage`.

### 🎭 NPC Generator
Generates NPCs using the **10 core species of the 2024 Player's Handbook (5.5e)** — Aasimar,
Dragonborn, Dwarf, Elf, Goliath, Gnome, Halfling, Human, Orc, Tiefling — including their 2024
sub-choices (Elven lineages, Gnome lineages, Tiefling fiendish legacies, Goliath giant ancestries,
Dragonborn draconic ancestries).

For each NPC you get:
- **Name** (species-flavored first name + surname; rerollable)
- **Species** (+ lineage/ancestry)
- **Sex** (random, or pick male / female / nonbinary — drives the name pool)
- **Height** (species-based dice roll, shown in ft'in" and cm)
- **Weight** (correlated to height, in lb and kg)
- **Distinguishing features** (0–3; ~20% of NPCs have none — "strikingly ordinary")
- A free-text **DM notes** field

**Save NPC** adds the character to your roster (persisted in `localStorage`). Click a saved
name to load it back, ✕ to delete. **Export JSON / Import JSON** moves rosters between browsers
or machines.

### 📜 DM Tables (5.5e reference)
Quick-reference cards based on the **2024 rules (5.5e / SRD 5.2)**: ability modifiers, level /
proficiency / XP, DC ladder, all 15 conditions with 2024 effects, exhaustion (2024 scaling),
cover, the 18 skills, combat actions & concentration, travel pace, the 2024 per-character
encounter XP budget (Low/Moderate/High — no more monster-count multiplier), CR→XP, rests,
weapon masteries, damage types, light & vision, and Heroic Inspiration. A filter box narrows
the cards as you type.

## Tech

- Plain HTML/CSS/JS, zero dependencies, works from `file://` or GitHub Pages.
- Audio: Web Audio API procedural synthesis (noise buffers, filtered bursts, LFOs, a feedback
  delay for dungeon drips). Audio starts only after a user gesture (browser autoplay policy).
- Persistence: `localStorage` keys `dmDash.soundPresets.v1` and `dmDash.npcRoster.v1`.

## Project layout

```
index.html          page shell + three tab panels
css/styles.css      tavern-dark theme, vertical slider styles
js/data.js          2024 species/name/feature data + 5.5e table data
js/soundboard.js    Web Audio engine, vertical sliders, presets
js/npc.js           NPC generator + saved roster
js/tables.js        reference-table renderer + filter
js/app.js           tab switching / boot
```

## Rules sources

Reference content follows the 2024 Player's Handbook, 2024 Dungeon Master's Guide, and
SRD 5.2 (CC BY 4.0 where applicable). D&D and related marks are property of Wizards of the Coast;
this project only references their rules.
