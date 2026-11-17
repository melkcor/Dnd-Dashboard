# DM's Table — D&D Dungeon Master Dashboard

A single-page, zero-runtime-dependency dashboard for running the table. Open `index.html` in any
modern browser (or enable GitHub Pages on this repo) — no build step, no network needed.
Theme: "arcane night" (slate/indigo/cyan).

## Tabs

### 🔊 Soundboard (Matt Mercer inspired)
A mixing board of ambience and effects. Each channel plays a **real audio loop file** from
`sounds/` (12–20 s seamless WAV loops rendered by `tools/render-sounds.js`); if a file is
missing, a built-in Web Audio synthesizer plays a live-generated fallback instead.

Channels: Tavern Crowd, Town Center, Rain, Thunder, Wind, Fireplace, Forest & Birds,
Night Crickets, Ocean Waves, Dungeon Drone, Battle, Crowd/Cheer.

- Every channel has an ON/OFF button and a **vertical slider that snaps to 25% steps**
  (0/25/50/75/100 — drag, scroll-wheel, or arrow keys; tick marks on the track).
- A vertical **master** slider (also snapped) and **Mute All** sit in the side panel.
- **Your own sounds**: hit **📁** on any channel card to load a local audio file (e.g. free
  CC0/PD recordings from freesound.org, OpenGameArt.org, or Wikimedia Commons) — it's stored in
  IndexedDB and used from then on; **↺** reverts to the built-in loop. You can also drop files
  into `sounds/` directly with the same names.
- **Presets**: nine built-in mixes plus your own named mixes (localStorage) — save, load, delete.

### 🎭 NPC Generator
Generates NPCs using the **10 core species of the 2024 Player's Handbook (5.5e)** — Aasimar,
Dragonborn, Dwarf, Elf, Goliath, Gnome, Halfling, Human, Orc, Tiefling — with a **🎲 Random**
species option and the 2024 sub-choices (Elven lineages, Gnome lineages, Tiefling fiendish
legacies, Goliath giant ancestries, Dragonborn draconic ancestries).

For each NPC you get:
- **Name** (species-flavored pools, ~20+ per gender per species; rerollable)
- **Species** (+ lineage/ancestry) · **Sex** (random / male / female / nonbinary)
- **Height** and **weight** from species-based dice rolls (ft'in"/cm, lb/kg)
- A short **voice description** (pitch, quality, pace)
- **Distinguishing features** (max 2 from a list of 120+; ~20% get "none — strikingly ordinary")
- A free-text **DM notes** field

**Leveled characters:** tick *Make a leveled character*, pick a **level (1–20)** and a **class**
(12 core 2024 classes), and the NPC gets a **stat block**: rolled ability scores assigned by
class priority, HP (2024 rules), AC by class, Speed, proficiency, saving throws, skills,
species **resistances/traits**, **actions** (weapon attack, cantrip with level scaling, Extra
Attack / Sneak Attack where relevant), a selection of **spells appropriate to the class**
(cantrips + leveled spells up to the character's reach), and all **class features up to that
level** in a **collapsed-by-default expandable** list with rules text — extracted from the
*Complete Compendium 5.5e* XML (`tools/build-classes.js` → `js/classes.js`).

**Save NPC** adds the character to your roster (localStorage). Click a saved name to load it
back, ✕ to delete. **Export JSON / Import JSON** moves rosters between browsers or machines.

### ✨ Spells
**455 core 2024 spells** from the compendium (`tools/build-spells.js` → `js/spells-data.js`),
as expandable cards with text, level, and class filters. Expanding a spell shows name, school,
casting time / range / components / duration, class list, and full description — plus a
**level selector** listing the levels the spell is available at (from the compendium's per-level
roll data: e.g. Fireball 3rd–9th, Fire Bolt character levels 1/5/11/17). Selecting a level
rewrites the scaling text for that level ("Cast with a 5th-level slot: 10d6 Fire Damage.").

### 📜 DM Tables (5.5e reference)
**Collapsed-by-default expandable** reference cards based on the **2024 rules (5.5e / SRD 5.2)**
— click a card's title to expand it (expanding one doesn't resize the others); type in the
filter box to narrow them. Covers: ability modifiers, level / proficiency / XP, DC ladder, all
15 conditions with 2024 effects, exhaustion, cover, the 18 skills, combat actions &
concentration, travel pace, the 2024 per-character encounter XP budget + CR→XP, rests, weapon
masteries, damage types, light & vision, and Heroic Inspiration.

## Tech

- Plain HTML/CSS/JS, zero runtime dependencies; works from `file://` or GitHub Pages.
- Sound files: mono 22050 Hz 16-bit WAV loops in `sounds/`, generated offline by
  `tools/render-sounds.js` (pure-Node PCM synthesis — no ffmpeg needed). Custom user files are
  kept in IndexedDB (`dmDashSounds`).
- Data files: `js/classes.js` and `js/spells-data.js` are generated from the Complete
  Compendium 5.5e XML by `tools/build-classes.js` / `tools/build-spells.js`.
- Persistence: `localStorage` keys `dmDash.soundPresets.v1` and `dmDash.npcRoster.v1`.

## Project layout

```
index.html            page shell + four tab panels
css/styles.css        arcane-night theme, vertical sliders (25% snap + ticks), stat block
js/data.js            2024 species/names/voices/features + 5.5e table data
js/classes.js         GENERATED: 12 core 2024 classes with per-level features
js/spells-data.js     GENERATED: 455 core 2024 spells with per-level scaling
js/soundboard.js      audio-file playback + synth fallback, sliders, presets, custom files
js/npc.js             NPC generator + stat blocks + saved roster
js/spellbook.js       spells tab (expandable cards, level selector, filters)
js/tables.js          reference-table renderer + filter
js/app.js             tab switching / boot
sounds/*.wav          real ambience loops (generated)
tools/                render-sounds.js, build-classes.js, build-spells.js
```

## Rules sources

Reference content follows the 2024 Player's Handbook, 2024 Dungeon Master's Guide, and
SRD 5.2; class/spell text comes from the Complete Compendium 5.5e XML (CC BY 4.0 / OGL content
as distributed). D&D and related marks are property of Wizards of the Coast; this project only
references their rules.
