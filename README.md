# DM's Table — D&D Dungeon Master Dashboard

A single-page, zero-runtime-dependency dashboard for running the table. Open `index.html` in any
modern browser (or enable GitHub Pages on this repo) — no build step, no network needed.

## Tabs

### 🔊 Soundboard (Matt Mercer inspired)
A mixing board of ambience and effects. Each channel plays a **real audio loop file** from
`sounds/` (12–20 s seamless WAV loops, rendered by `tools/render-sounds.js`); if a file is
missing, a built-in Web Audio synthesizer plays a live-generated fallback instead.

Channels: Tavern Crowd, **Town Center**, Rain, Thunder, Wind, Fireplace, Forest & Birds,
Night Crickets, Ocean Waves, Dungeon Drone, Battle, Crowd/Cheer.

- Every channel has an ON/OFF button and a **vertical slider** (drag, scroll-wheel, or arrow keys).
- A vertical **master** slider and **Mute All** button sit in the side panel.
- **Presets**: nine built-in mixes (Tavern Night, Town Square, Rainstorm, Dungeon Delve, Battle,
  Forest Calm, Ocean Voyage, Market Crowd, Silence) plus your own — type a name, hit **Save**,
  click to load, ✕ to delete. Presets persist in `localStorage`.

### 🎭 NPC Generator
Generates NPCs using the **10 core species of the 2024 Player's Handbook (5.5e)** — Aasimar,
Dragonborn, Dwarf, Elf, Goliath, Gnome, Halfling, Human, Orc, Tiefling — with a **🎲 Random**
species option and the 2024 sub-choices (Elven lineages, Gnome lineages, Tiefling fiendish
legacies, Goliath giant ancestries, Dragonborn draconic ancestries).

For each NPC you get:
- **Name** (species-flavored first name + surname from enlarged pools; rerollable)
- **Species** (+ lineage/ancestry) · **Sex** (random / male / female / nonbinary)
- **Height** and **weight** from species-based dice rolls (ft'in"/cm, lb/kg)
- **Voice description** (pitch, quality, pace, accent, quirk + a species-flavored note)
- **Distinguishing features** (0–3 from a list of 120+; ~20% get "none — strikingly ordinary")
- A free-text **DM notes** field

**Leveled characters:** tick *Make a leveled character*, pick a **level (1–20)** and a **class**
(12 core 2024 classes), and the NPC gets a **stat block**: rolled ability scores assigned by
class priority, HP (2024 rules: max die at 1st level), AC by class, Speed, proficiency, saving
throws, skills, species **resistances/traits**, **actions** (weapon attack, cantrip with level
scaling, Extra Attack / Sneak Attack where relevant), and all **class features up to that level**
with their rules text — extracted from the *Complete Compendium 5.5e* XML (see `tools/build-classes.js`).

**Save NPC** adds the character to your roster (persisted in `localStorage`). Click a saved
name to load it back, ✕ to delete. **Export JSON / Import JSON** moves rosters between browsers
or machines.

### 📜 DM Tables (5.5e reference)
**Expandable** reference cards based on the **2024 rules (5.5e / SRD 5.2)** — click a card's
title to collapse/expand it; type in the filter box to narrow them. Covers: ability modifiers,
level / proficiency / XP, DC ladder, all 15 conditions with 2024 effects, exhaustion (2024
scaling), cover, the 18 skills, combat actions & concentration, travel pace, the 2024
per-character encounter XP budget (Low/Moderate/High — no more monster-count multiplier) + CR→XP,
rests, weapon masteries, damage types, light & vision, and Heroic Inspiration.

## Tech

- Plain HTML/CSS/JS, zero runtime dependencies; works from `file://` or GitHub Pages.
- Sound files: mono 22050 Hz 16-bit WAV loops in `sounds/`, generated offline by
  `tools/render-sounds.js` (pure-Node PCM synthesis — no ffmpeg needed). Re-run it any time to
  re-render the loops.
- Class data: `js/classes.js` is generated from the Complete Compendium 5.5e XML by
  `tools/build-classes.js` (`node tools/build-classes.js <compendium.xml>`).
- Persistence: `localStorage` keys `dmDash.soundPresets.v1` and `dmDash.npcRoster.v1`.

## Project layout

```
index.html            page shell + three tab panels
css/styles.css        tavern-dark theme, vertical sliders, stat block, expandable cards
js/data.js            2024 species/names/voices/features + 5.5e table data
js/classes.js         GENERATED: 12 core 2024 classes with per-level features
js/soundboard.js      audio-file playback + synth fallback, vertical sliders, presets
js/npc.js             NPC generator + stat blocks + saved roster
js/tables.js          reference-table renderer + filter
js/app.js             tab switching / boot
sounds/*.wav          real ambience loops (generated)
tools/render-sounds.js  renders sounds/*.wav
tools/build-classes.js  builds js/classes.js from the compendium XML
```

## Rules sources

Reference content follows the 2024 Player's Handbook, 2024 Dungeon Master's Guide, and
SRD 5.2; class feature text comes from the Complete Compendium 5.5e XML (CC BY 4.0 / OGL
content as distributed). D&D and related marks are property of Wizards of the Coast; this
project only references their rules.
