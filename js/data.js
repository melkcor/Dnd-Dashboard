/* DM's Table — static data: 2024 PHB species/names/features + 5.5e reference tables.
   Exposed as window.DM_DATA. Species follow the 2024 Player's Handbook (10 core species). */
(function () {
  "use strict";

  const SPECIES = [
    {
      id: "human", name: "Human", lineages: null,
      height: { base: 58, dice: 10, count: 2 },      // inches: 58 + 2d10
      weight: { base: 125, perInch: 2.6 },            // lbs + (height-60)*perInch + 2d6
      size: "Medium", speed: 30,
      names: {
        m: ["Aldric", "Bram", "Cedric", "Darian", "Edmund", "Gareth", "Hollis", "Jasper", "Kaelen", "Lorin", "Marrek", "Osric", "Perrin", "Rowan"],
        f: ["Aela", "Brenna", "Celia", "Dagna", "Elspeth", "Freya", "Gwen", "Isolde", "Katya", "Liora", "Maren", "Nerys", "Odile", "Sybil"],
        u: ["Ash", "Bailey", "Casey", "Jules", "Morgan", "Quinn", "Riley", "Sage", "Sam", "Wren"]
      },
      surnames: ["Ashford", "Blackwood", "Crane", "Emberhart", "Fairchild", "Goldthorn", "Hawke", "Ironbark", "Lockhart", "Nightingale", "Oakenshield", "Rivers", "Stormborn", "Thornwick", "Vale", "Whitfield"],
      features: ["Calloused hands from honest work", "A faded scar on one hand", "Always wears a weathered cloak"]
    },
    {
      id: "elf", name: "Elf", lineages: ["Drow", "High Elf", "Wood Elf"],
      height: { base: 56, dice: 8, count: 2 },        // 56 + 2d8
      weight: { base: 105, perInch: 2.2 },
      size: "Medium", speed: 30,
      names: {
        m: ["Aelar", "Caelum", "Eldrin", "Faelar", "Gaelin", "Laurian", "Naeril", "Quithas", "Rouven", "Sylvar", "Thalion", "Varian"],
        f: ["Aelindra", "Caelindra", "Elaria", "Faenya", "Iliana", "Naivara", "Sariel", "Sylmare", "Thalia", "Vesryn", "Ysolt", "Zephyra"],
        u: ["Amrun", "Elyon", "Iri", "Lathien", "Mirel", "Nim", "Oryn", "Sehan", "Talon", "Zev"]
      },
      surnames: ["Amastacia", "Dawnwhisper", "Galinndan", "Holimion", "Liadon", "Meliamne", "Moonpetal", "Naïlo", "Siannodel", "Xiloscient"],
      features: ["Eyes of an unusual color (pale violet, silver, or gold)", "Moves with unnatural, silent grace", "Hair worn long and tied with small bells", "A faint scent of pine or starlight"]
    },
    {
      id: "dwarf", name: "Dwarf", lineages: null,
      height: { base: 44, dice: 4, count: 2 },        // 44 + 2d4
      weight: { base: 130, perInch: 4.5 },
      size: "Medium", speed: 30,
      names: {
        m: ["Baelin", "Borin", "Dain", "Durgan", "Eberk", "Fargrim", "Gimmel", "Hrothgar", "Kazmick", "Morgran", "Rurik", "Thrain", "Throrin", "Tordek"],
        f: ["Bergit", "Brunhilda", "Drifa", "Gerda", "Hilda", "Katla", "Nala", "Ragna", "Solveig", "Thora", "Una", "Yngvild"],
        u: ["Bofi", "Dori", "Grim", "Haki", "Ketti", "Noki", "Ragi", "Sif", "Thordis", "Viggo"]
      },
      surnames: ["Battlehammer", "Dankworth", "Fireforge", "Frostbeard", "Goldgrinder", "Ironfoot", "Orcslayer", "Stonehelm", "Stormcutter", "Thunderfoot"],
      features: ["Beard braided with beads, rings, or small metal charms", "A nose that was broken and reset crooked", "Hands permanently stained with soot or ore dust", "Wears a signet ring of their clan"]
    },
    {
      id: "gnome", name: "Gnome", lineages: ["Forest Gnome", "Rock Gnome"],
      height: { base: 35, dice: 4, count: 2 },        // 35 + 2d4
      weight: { base: 38, perInch: 1.0 },
      size: "Small", speed: 30,
      names: {
        m: ["Aldon", "Bimble", "Clovis", "Eldon", "Fizz", "Jorvin", "Mimble", "Nackle", "Orbin", "Quill", "Razzle", "Tock", "Willowby", "Yannick"],
        f: ["Bess", "Dabble", "Ellan", "Fijet", "Glim", "Halla", "Jessa", "Kessa", "Lolly", "Mabel", "Nissa", "Poppy", "Trixie", "Wren"],
        u: ["Bay", "Cricket", "Diddle", "Pip", "Quib", "Sprocket", "Tiddle", "Widget", "Nix", "Bramble"]
      },
      surnames: ["Burrble", "Cogspinner", "Daergel", "Fizzlebang", "Geargrinder", "Muckle", "Quickstitch", "Sparkplug", "Tinkertop", "Wobble"],
      features: ["Fingers permanently ink-stained", "Goggles pushed up onto the forehead", "A laugh like a tinkling bell", "Carries a notebook full of sketches"]
    },
    {
      id: "halfling", name: "Halfling", lineages: null,
      height: { base: 31, dice: 4, count: 2 },        // 31 + 2d4
      weight: { base: 35, perInch: 1.0 },
      size: "Small", speed: 30,
      names: {
        m: ["Corrin", "Dody", "Errich", "Finnigan", "Garret", "Hob", "Larkin", "Merric", "Noll", "Roscoe", "Tommick", "Wilfred", "Wull", "Yardley"],
        f: ["Bel", "Catt", "Dimity", "Edda", "Falka", "Heila", "Jilly", "Lissa", "Merla", "Nedda", "Rosie", "Tanta", "Willow", "Tilda"],
        u: ["Bam", "Fenn", "Hobb", "Lark", "Moll", "Ned", "Pip", "Tansy", "Sorrel", "Clover"]
      },
      surnames: ["Brushgather", "Goodbarrel", "Greenbottle", "Hilltopple", "Lightfingers", "Meadowbrook", "Oldbarrel", "Thistledown", "Tosscobble", "Underbough", "Whitfoot"],
      features: ["Goes barefoot even in armor or bad weather", "Unusually large, hairy feet", "A laugh that comes easily and often", "Always has a snack in a pocket"]
    },
    {
      id: "orc", name: "Orc", lineages: null,
      height: { base: 68, dice: 8, count: 2 },        // 68 + 2d8
      weight: { base: 175, perInch: 3.4 },
      size: "Medium", speed: 30,
      names: {
        m: ["Brak", "Dorgu", "Gharz", "Gruk", "Hrog", "Karg", "Morg", "Rukh", "Skarr", "Throk", "Ugor", "Vorg", "Yarr", "Zog"],
        f: ["Brakka", "Druka", "Gora", "Gurra", "Hagra", "Mhorga", "Nazra", "Orka", "Rukha", "Shargra", "Urka", "Yrsa", "Zora", "Draka"],
        u: ["Gash", "Grish", "Hogg", "Korg", "Lurg", "Munk", "Ragg", "Shug", "Thok", "Mokka"]
      },
      surnames: ["Blacktusk", "Bloodaxe", "Bonecrusher", "Ironjaw", "Skullsplitter", "Warsinger", "Ashfang", "Grimtooth", "Redmaw", "Stoneskull"],
      features: ["Tusks filed to sharp points", "A notch missing from one ear", "Ritual scars across the chest", "Skin of an unusual green or gray shade", "Wears trophies (teeth, claws) on a cord"]
    },
    {
      id: "goliath", name: "Goliath", lineages: ["Cloud Giant", "Fire Giant", "Frost Giant", "Hill Giant", "Stone Giant", "Storm Giant"],
      height: { base: 84, dice: 8, count: 2 },        // 84 + 2d8  (7'–8'4")
      weight: { base: 280, perInch: 5.5 },
      size: "Medium", speed: 35,
      names: {
        m: ["Aukan", "Eglath", "Ilikan", "Keothi", "Kuori", "Lo-Kag", "Manneo", "Thoth", "Varg", "Oren", "Storik", "Halmar", "Dren", "Yvor"],
        f: ["Gai-Al", "Kal-Ka", "Orilo", "Paavu", "Uthal", "Vanja", "Vesi", "Yrrak", "Sova", "Enna", "Katra", "Liisa"],
        u: ["Haku", "Ilo", "Koth", "Lumo", "Nara", "Osto", "Peru", "Satu", "Toni", "Veli"]
      },
      surnames: ["Cold-Eye", "Longstride", "Mountain-Born", "Sky-Watcher", "Stone-Fist", "Storm-Heart", "Thunder-Step", "Wind-Rider"],
      features: ["Ritual tattoos marking a clan deed", "Eyes like pale ice", "A voice like rumbling stone", "Bare-chested despite the cold", "Carves their name into a walking staff"]
    },
    {
      id: "dragonborn", name: "Dragonborn",
      lineages: ["Black", "Blue", "Brass", "Bronze", "Copper", "Gold", "Green", "Red", "Silver", "White"],
      height: { base: 72, dice: 10, count: 2 },       // 72 + 2d10 (6'+)
      weight: { base: 200, perInch: 4.0 },
      size: "Medium", speed: 30,
      names: {
        m: ["Arjhan", "Balasar", "Bharash", "Donaar", "Ghesh", "Heskan", "Kriv", "Mehen", "Nadarr", "Tarhun", "Vorn", "Garrak", "Surtur", "Krix"],
        f: ["Akra", "Biri", "Daar", "Harann", "Kava", "Miri", "Ovra", "Rai", "Shila", "Vaela", "Zephyx", "Nym", "Issa", "Pyrrha"],
        u: ["Ashk", "Brakken", "Cinder", "Draak", "Ember", "Flint", "Gale", "Onyx", "Pyre", "Slate"]
      },
      surnames: ["Stormscale", "Emberheart", "Frostfang", "Ironwrath", "Moonshadow", "Nightbreath", "Thundermaw", "Windtalon", "Wyrmguard", "Zharaketh"],
      features: ["Scales with a metallic sheen", "Scales dull and matte, like stone", "A frill of spines along the spine", "Eyes with slit pupils that gleam in the dark", "Smoke wisping from nostrils when angry"]
    },
    {
      id: "tiefling", name: "Tiefling", lineages: ["Abyssal", "Chthonic", "Infernal"],
      height: { base: 58, dice: 10, count: 2 },
      weight: { base: 120, perInch: 2.4 },
      size: "Medium", speed: 30,
      names: {
        m: ["Akmenos", "Damakos", "Iados", "Morthos", "Naxis", "Skaath", "Vesper", "Zeth", "Orobas", "Nyx", "Corvin", "Malphas", "Baal", "Rune"],
        f: ["Akta", "Bryseis", "Caela", "Ianthe", "Jeska", "Kallista", "Maeve", "Vaelis", "Ysara", "Lilitu", "Noctis", "Selene", "Vexa", "Zaria"],
        u: ["Ash", "Nyx", "Onyx", "Rune", "Cinder", "Ember", "Shade", "Wisp", "Haze", "Jinx"]
      },
      surnames: ["Ashenveil", "Doomrend", "Emberchain", "Nightwhisper", "Searheart", "Shadowtongue", "Thornvein", "Voidwalker"],
      features: ["Curved horns, polished or chipped", "A tail that lashes when they lie", "Skin of an unusual tone (crimson, violet, blue, jet-black)", "Eyes that glow faintly in dim light", "A faint smell of sulfur or smoke"]
    },
    {
      id: "aasimar", name: "Aasimar", lineages: null,
      height: { base: 58, dice: 10, count: 2 },
      weight: { base: 115, perInch: 2.3 },
      size: "Medium", speed: 30,
      names: {
        m: ["Aurelion", "Caius", "Elian", "Gabriel", "Jophiel", "Lumin", "Seraph", "Thaddeus", "Uriel", "Zorion", "Castian", "Radiant", "Solan", "Aether"],
        f: ["Aurelia", "Celeste", "Divina", "Elara", "Felice", "Lucine", "Mirabel", "Seraphina", "Vespera", "Ysara", "Halcyon", "Liora", "Noor", "Stella"],
        u: ["Amari", "Azeal", "Celes", "Elys", "Lumen", "Nox", "Ori", "Ren", "Sol", "Auren"]
      },
      surnames: ["Dawnshield", "Everlight", "Hallowheart", "Lightbringer", "Moonglow", "Radiantwing", "Starwhisper", "Sunhalo"],
      features: ["Eyes that glow faintly with inner light", "Hair that seems to catch light unnaturally", "A faint halo visible in very dim light", "A voice with a faint echo", "Leaves no footprints on snow"]
    }
  ];

  const GENERIC_FEATURES = [
    "A scar across the left cheek", "A scar on the back of the hand", "Heterochromia (two different-colored eyes)",
    "A prominent birthmark on the neck", "Missing the tip of one finger", "A chipped front tooth",
    "A tattoo of a dragon on the forearm", "A tattoo of a coiled snake around the wrist", "A tattoo of a rose on the shoulder",
    "A tribal knot tattoo on the bicep", "A nose ring", "An eyebrow piercing", "A lip labret",
    "Wears a signet ring", "Wears an amulet on a leather cord", "Wears a locket that won't open",
    "Pale gold eyes", "Deep hazel eyes", "Piercing gray eyes", "White or silver hair", "Unnaturally red hair",
    "Hair worn in a long braid", "Hair worn in a topknot", "A shaved head with one lock left long",
    "A thick foreign accent", "A barking laugh", "A wheezy laugh", "A deep, resonant voice", "A soft, whispery voice",
    "A pronounced limp", "A slight stoop", "Always wears a cloak (deep green)", "Always wears a cloak (travel-stained brown)",
    "Carries a wooden walking stick", "An unusually large nose", "Prominent, pointed ears",
    "Nervous habit: cracks their knuckles", "Nervous habit: twirls a lock of hair", "Nervous habit: hums when thinking",
    "A gold-capped tooth", "A bandaged arm", "Burn scars on both hands", "A gold tooth",
    "Smells faintly of pipe smoke", "Smells faintly of herbs", "Smells faintly of incense",
    "Keeps a pet raven", "Keeps a scruffy cat", "Wears a wide-brimmed hat", "Wears a hood even indoors",
    "A strange birthmark shaped like a crescent moon", "A limp from an old wound", "A tattoo of a compass on the palm",
    "One glove always worn, even in summer", "Jewelry that jingles when they walk", "A voice that carries unnervingly far"
  ];

  /* ---------------- 5.5e (2024) reference tables ---------------- */

  const LEVELS = [
    { level: 1, prof: 2, xp: 0 }, { level: 2, prof: 2, xp: 300 }, { level: 3, prof: 2, xp: 900 },
    { level: 4, prof: 2, xp: 2700 }, { level: 5, prof: 3, xp: 6500 }, { level: 6, prof: 3, xp: 14000 },
    { level: 7, prof: 3, xp: 23000 }, { level: 8, prof: 3, xp: 34000 }, { level: 9, prof: 4, xp: 48000 },
    { level: 10, prof: 4, xp: 64000 }, { level: 11, prof: 4, xp: 85000 }, { level: 12, prof: 4, xp: 100000 },
    { level: 13, prof: 5, xp: 120000 }, { level: 14, prof: 5, xp: 140000 }, { level: 15, prof: 5, xp: 165000 },
    { level: 16, prof: 5, xp: 195000 }, { level: 17, prof: 6, xp: 225000 }, { level: 18, prof: 6, xp: 265000 },
    { level: 19, prof: 6, xp: 305000 }, { level: 20, prof: 6, xp: 355000 }
  ];

  // 2024 DMG "XP Budget per Character" (Low / Moderate / High), SRD 5.2 — no encounter multiplier in 2024.
  const XP_BUDGET = [
    [1, 50, 75, 100], [2, 100, 150, 200], [3, 150, 225, 350], [4, 250, 375, 500],
    [5, 500, 750, 1100], [6, 600, 1000, 1400], [7, 750, 1300, 1700], [8, 1000, 1700, 2200],
    [9, 1300, 2000, 2600], [10, 1600, 2300, 3100], [11, 1900, 2900, 3700], [12, 2200, 3400, 4300],
    [13, 2600, 3900, 5000], [14, 3000, 4500, 5800], [15, 3500, 5100, 6700], [16, 4000, 5900, 7800],
    [17, 4700, 6800, 9500], [18, 5400, 8000, 11500], [19, 6000, 9600, 16000], [20, 6400, 13200, 22000]
  ];

  const CR_XP = [
    ["0", 10], ["1/8", 25], ["1/4", 50], ["1/2", 100], ["1", 200], ["2", 450], ["3", 700], ["4", 1100],
    ["5", 1800], ["6", 2300], ["7", 2900], ["8", 3900], ["9", 5000], ["10", 5900], ["11", 7200], ["12", 8400],
    ["13", 10000], ["14", 11500], ["15", 13000], ["16", 15000], ["17", 18000], ["18", 20000], ["19", 22000],
    ["20", 25000], ["21", 33000], ["22", 41000], ["23", 50000], ["24", 62000], ["25", 75000], ["26", 90000],
    ["27", 105000], ["28", 120000], ["29", 135000], ["30", 155000]
  ];

  const CONDITIONS = [
    ["Blinded", "Can't see; auto-fails sight-based checks; attack rolls against it have Advantage, its attacks have Disadvantage."],
    ["Charmed", "Can't attack the charmer; the charmer has Advantage on social checks against it."],
    ["Deafened", "Can't hear; auto-fails hearing-based checks."],
    ["Exhaustion", "6 cumulative levels. Each level: −2×level to all d20 Tests and −5 ft×level Speed. Level 6 = death. A Long Rest removes 1 level."],
    ["Frightened", "Disadvantage on checks/attacks while the source is in line of sight; can't willingly move closer to it."],
    ["Grappled", "Speed 0 (unless the grappler moves it). Attacks against targets other than the grappler have Disadvantage. Escape: save vs DC 8 + grappler's Str mod + Proficiency. Ends if the grappler is Incapacitated."],
    ["Incapacitated", "Can't take actions or reactions; can't speak; Disadvantage on Initiative; breaks Concentration. (Paralyzed, Petrified, Stunned, Unconscious all include this.)"],
    ["Invisible", "Can't be seen without special sense; Advantage on attacks and Initiative; attacks against it have Disadvantage."],
    ["Paralyzed", "Incapacitated; Speed 0; auto-fails Str and Dex saves; attacks against it have Advantage; hits within 5 ft are automatic criticals."],
    ["Petrified", "Incapacitated; Speed 0; immune to Poisoned; auto-fails Str and Dex saves; attacks have Advantage; resistance to all damage; weight ×10."],
    ["Poisoned", "Disadvantage on attack rolls and ability checks."],
    ["Prone", "Only crawling movement unless it stands up; Disadvantage on attacks; attacks within 5 ft have Advantage, others Disadvantage. (Unconscious includes Prone.)"],
    ["Restrained", "Speed 0; attacks against it have Advantage, its attacks have Disadvantage; Dex saves at Disadvantage."],
    ["Stunned", "Incapacitated; auto-fails Str and Dex saves; attacks against it have Advantage. (2024: no longer sets Speed to 0.)"],
    ["Unconscious", "Incapacitated + Prone; auto-fails Str and Dex saves; attacks against it have Advantage; hits within 5 ft are automatic criticals; unaware of surroundings."]
  ];

  const SKILLS = [
    ["Acrobatics", "Dexterity"], ["Animal Handling", "Wisdom"], ["Arcana", "Intelligence"],
    ["Athletics", "Strength"], ["Deception", "Charisma"], ["History", "Intelligence"],
    ["Insight", "Wisdom"], ["Intimidation", "Charisma"], ["Investigation", "Intelligence"],
    ["Medicine", "Wisdom"], ["Nature", "Intelligence"], ["Perception", "Wisdom"],
    ["Performance", "Charisma"], ["Persuasion", "Charisma"], ["Religion", "Intelligence"],
    ["Sleight of Hand", "Dexterity"], ["Stealth", "Dexterity"], ["Survival", "Wisdom"]
  ];

  const MASTERIES = [
    ["Cleave", "On a hit, make another attack at a second creature within 5 ft."],
    ["Graze", "On a miss, still deal damage equal to the ability modifier used."],
    ["Nick", "Extra attack as part of the Attack action when wielding a Light weapon."],
    ["Push", "On a hit, push the target up to 10 ft away."],
    ["Sap", "On a hit, the target has Disadvantage on its next attack before your next turn."],
    ["Slow", "On a hit, reduce the target's Speed by 10 ft until your next turn."],
    ["Topple", "On a hit, save or be knocked Prone."],
    ["Vex", "On a hit, your next attack against that target has Advantage."]
  ];

  const DAMAGE_TYPES = ["Acid", "Bludgeoning", "Cold", "Fire", "Force", "Lightning", "Necrotic",
    "Piercing", "Poison", "Psychic", "Radiant", "Slashing", "Thunder"];

  const TABLES = [
    {
      id: "ability-mods", title: "Ability Scores & Modifiers",
      note: "Modifier = (score − 10) ÷ 2, rounded down.",
      type: "grid3", rows: Array.from({ length: 30 }, (_, i) => {
        const s = i + 1; return [String(s), String(Math.floor((s - 10) / 2) >= 0 ? "+" + Math.floor((s - 10) / 2) : String(Math.floor((s - 10) / 2)))];
      })
    },
    {
      id: "levels", title: "Level, Proficiency Bonus & XP",
      type: "table", columns: ["Level", "Proficiency", "XP to reach level"],
      rows: LEVELS.map(l => [String(l.level), "+" + l.prof, l.xp.toLocaleString("en-US")])
    },
    {
      id: "dcs", title: "Set a DC",
      type: "table", columns: ["Difficulty", "DC"],
      rows: [["Very Easy", "5"], ["Easy", "10"], ["Medium", "15"], ["Hard", "20"], ["Very Hard", "25"]]
    },
    {
      id: "conditions", title: "Conditions (15, 2024 rules)",
      note: "A condition doesn't stack with itself; different conditions combine. Exhaustion is the only leveled one.",
      type: "condition-list", rows: CONDITIONS
    },
    {
      id: "exhaustion", title: "Exhaustion (2024)",
      type: "table", columns: ["Level", "Effect (cumulative)"],
      rows: [
        ["1", "−2 to all d20 Tests; Speed −5 ft"], ["2", "−4 to all d20 Tests; Speed −10 ft"],
        ["3", "−6 to all d20 Tests; Speed −15 ft"], ["4", "−8 to all d20 Tests; Speed −20 ft"],
        ["5", "−10 to all d20 Tests; Speed −25 ft"], ["6", "Death"]
      ],
      note: "A Long Rest removes 1 level. Greater Restoration also removes levels."
    },
    {
      id: "cover", title: "Cover (2024)",
      type: "table", columns: ["Cover", "Effect"],
      rows: [
        ["Half", "+2 AC and Dex saves"],
        ["Three-Quarters", "+5 AC and Dex saves"],
        ["Total", "Can't be targeted directly by attacks or spells (some area effects still apply)"]
      ]
    },
    {
      id: "skills", title: "Skills & Their Abilities (18)",
      type: "grid2", rows: SKILLS
    },
    {
      id: "combat-actions", title: "On Your Turn in Combat",
      type: "list", rows: [
        "Move up to your Speed (can split movement before/after your Action).",
        "One Action: Attack, Cast a Spell, Dash, Disengage, Dodge, Help, Hide, Ready, Search, Use an Object…",
        "One Bonus Action (only one per turn) if a feature/spell grants one.",
        "One Reaction (resets at the start of your turn): opportunity attack, spell like Shield…",
        "Grapple & Shove are Unarmed Strike options: target saves vs DC 8 + your Str mod + Proficiency.",
        "Two-Weapon Fighting: Bonus Action attack with a Light off-hand weapon.",
        "Surprise (2024): creatures caught unawares; a successful Hide grants the Invisible condition.",
        "Concentration: one concentration spell at a time; taking damage forces a Con save (DC 10 or half damage, whichever is higher) to keep it."
      ]
    },
    {
      id: "travel", title: "Travel Pace (2024)",
      type: "table", columns: ["Pace", "Per minute", "Per hour", "Per day (8 h)", "Effect"],
      rows: [
        ["Fast", "400 ft", "4 mi", "30 mi", "−5 to Passive Perception"],
        ["Normal", "300 ft", "3 mi", "24 mi", "—"],
        ["Slow", "200 ft", "2 mi", "18 mi", "Advantage on Wis (Perception/Survival)"]
      ],
      note: "Terrain caps your maximum pace (a road can raise it one step). Extended Travel: each hour beyond 8 forces a Con save, DC 10 + extra hours; failure = 1 Exhaustion level. Mounts: double distance for 1 hour, then need a Short/Long Rest."
    },
    {
      id: "xp-budget", title: "Encounter XP Budget per Character (2024 DMG)",
      note: "2024 method: multiply the per-character value by party size, then spend it on monster XP. There is NO monster-count multiplier anymore — sum monster XP at face value.",
      type: "table", columns: ["Level", "Low", "Moderate", "High"],
      rows: XP_BUDGET.map(r => [String(r[0]), r[1].toLocaleString("en-US"), r[2].toLocaleString("en-US"), r[3].toLocaleString("en-US")])
    },
    {
      id: "cr-xp", title: "Challenge Rating → XP",
      note: "CR is tuned for a party of four; a single monster whose CR equals the party's average level is a rough Low-to-Moderate fight.",
      type: "grid2", rows: CR_XP
    },
    {
      id: "rests", title: "Rests",
      type: "list", rows: [
        "Short Rest (≥ 1 hour): spend Hit Dice (roll + Con mod each), some features reset.",
        "Long Rest (≥ 8 hours, ≥ 6 hours sleeping): regain all HP, half your max Hit Dice, most uses of features/spell slots, remove 1 Exhaustion level.",
        "No more than one Long Rest per 24 hours to gain benefits.",
        "Sleeping in armor: no HP/Hit Dice recovery unless the armor allows it."
      ]
    },
    {
      id: "mastery", title: "Weapon Mastery Properties (2024)",
      type: "condition-list",
      rows: MASTERIES.map(m => [m[0], m[1]])
    },
    {
      id: "damage", title: "Damage Types (13)",
      type: "tags", rows: DAMAGE_TYPES,
      note: "Resistance = half damage; Immunity = none; Vulnerability = double. Damage Threshold applies to objects only."
    },
    {
      id: "light", title: "Light & Vision",
      type: "list", rows: [
        "Bright light (e.g., torch: 20 ft) and Dim light (20 ft beyond that).",
        "Dim light = lightly obscured: Disadvantage on Wis (Perception) checks relying on sight.",
        "Darkness = heavily obscured: effectively blinded within it.",
        "Darkvision (typically 60 ft): see in dim light as bright, darkness as dim — but only in black and white.",
        "Devil's Sight / magical darkness: see normally in magical darkness within range."
      ]
    },
    {
      id: "inspiration", title: "Heroic Inspiration & Luck",
      type: "list", rows: [
        "Heroic Inspiration (2024): reroll any die, use the new roll; can be passed to another creature; regained on Long Rest or by DM award.",
        "Advantage/Disadvantage don't stack — multiple sources = still just one (adv. or disadv.).",
        "A natural 1 on a d20 Test always fails; a natural 20 always succeeds (and hits critically)."
      ]
    }
  ];

  /* ---------- extended name pools (appended to the base pools above) ---------- */
  const EXTRA_NAMES = {
    human: {
      m: ["Alaric", "Bertram", "Caspian", "Dorian", "Emeric", "Florian", "Godric", "Leofric", "Sten", "Wystan"],
      f: ["Ancel", "Beatrix", "Cerys", "Drusilla", "Elowen", "Honora", "Magda", "Petra", "Sabine", "Thomasin"],
      u: ["Avery", "Blair", "Cleo", "Dorian", "Ember", "Harper", "Ivo", "Jory", "Kiran", "Lark"],
      s: ["Amberly", "Duskmere", "Falconer", "Grimsbane", "Holloway", "Marsh", "Sterling", "Thorne"]
    },
    elf: {
      m: ["Alaric", "Caelum?", "Eldrin?", "Faelan", "Galanduil", "Ithilion", "Lomien", "Nimrodel?", "Orophin", "Seldarine?"],
      f: ["Aerin", "Calenath", "Elanor", "Faerliss", "Ilenya", "Lathariel", "Mirelith", "Naiadra", "Sylaselle", "Thessaly?"],
      u: ["Aelion", "Bryn", "Caelum?", "Elianor", "Faelar?", "Galendir", "Irien", "Laeroth", "Sylvaris", "Thalorin"],
      s: ["Evenstar", "Greywind", "Moonwhisper", "Nightbloom", "Silverleaf", "Starfall", "Thistledown?", "Winterbourne"]
    },
    dwarf: {
      m: ["Baldin", "Duncan", "Fili", "Gorm", "Hakon", "Ingun", "Kazrik", "Mordin", "Rorik", "Thrain?"],
      f: ["Alfhild", "Brynja", "Dagny", "Eira", "Freydis", "Grimhild", "Hrefna", "Sigrid", "Torva", "Yrsa?"],
      u: ["Bragi", "Egil", "Gunnar", "Hervor", "Kjell", "Leif", "Njord", "Orm", "Stenbjorn", "Trym"],
      s: ["Anvilheart", "Deepdelver", "Emberstone", "Gateguard", "Hoarfrost", "Kingsbane", "Oathkeeper", "Rivetshield"]
    },
    gnome: {
      m: ["Albin", "Cedric?", "Dumble", "Ellery", "Fennick", "Garrick?", "Hobnob", "Jasper?", "Milo", "Osgood"],
      f: ["Bibiana", "Clover", "Dot", "Edda?", "Fenella", "Gilda", "Hetty", "Luella", "Mopsy", "Nerissa"],
      u: ["Bamble", "Crumpet", "Fidget", "Galley", "Jinx", "Knick", "Puddle", "Snicker", "Tumble", "Widdershins"],
      s: ["Bouncebrook", "Cogsworth?", "Dazzlewick", "Fumbleton", "Glimmerwick", "Jingleheim", "Poppleton", "Whistlewick"]
    },
    halfling: {
      m: ["Aldous", "Bramwell", "Cedric?", "Derrick", "Elmo", "Hamfast", "Jonquil", "Merry?", "Osgood?", "Perry"],
      f: ["Amabel", "Belinda", "Cecily", "Daisy", "Emmeline", "Flora", "Gill", "Poppy?", "Primrose", "Tansy?"],
      u: ["Bertie", "Cob", "Dobbin", "Fenny", "Hobson", "Merty", "Noll?", "Peony", "Reed", "Sorrel?"],
      s: ["Bramblefoot", "Cottonburrow", "Dewberry", "Foxglove", "Hazelnut", "Millrace", "Rumblesack", "Thornberry"]
    },
    orc: {
      m: ["Arzok", "Brakha?", "Drazh", "Ghash", "Krognak", "Mulgath", "Rashk", "Skullcrusher?", "Thrag", "Urzul"],
      f: ["Azuga", "Draka?", "Ghashka", "Morgha", "Nazgha", "Rugha", "Shaka", "Urzula", "Vrogga", "Yashka"],
      u: ["Ashka", "Brakk", "Druz", "Gromm", "Krash", "Lugga", "Murg", "Razz", "Snag", "Throk?"],
      s: ["Bonepicker", "Carrioncrow", "Doomfang", "Gorehoof", "Ironsnout", "Skulldrinker", "Warboar", "Wolfsbane"]
    },
    goliath: {
      m: ["Aethelgard", "Bjorn?", "Drenko", "Hakon?", "Kaelum", "Lorik", "Mavrek", "Norgath", "Stenvar", "Thorvald"],
      f: ["Astrid", "Brynhild?", "Dagny?", "Eira?", "Freya?", "Grimhild?", "Hilda?", "Kara", "Signe", "Yrsa?"],
      u: ["Alrek", "Bjorn?", "Dain?", "Eirik", "Frosti", "Gunnar?", "Hakoni", "Kettil", "Leif?", "Stygg"],
      s: ["Boulderheart", "Frostheim", "Glacierborn", "Ironheel", "Peakwalker", "Skycleaver", "Stormborn", "Thundertread"]
    },
    dragonborn: {
      m: ["Abaeus", "Caeldrath", "Ghelnar", "Kriv?", "Mezar", "Othor", "Pandjed?", "Rhesk", "Sorz", "Torinn"],
      f: ["Akra?", "Beshka", " Daar?", "Harann?", "Jhelan", "Kessek", "Medesha", "Nadia?", "Ovrun", "Shava"],
      u: ["Azer", "Blaze", "Cinder?", "Draco?", "Fume", "Gale?", "Ignis", "Pyro", "Smoke", "Volt"],
      s: ["Ashwhisper", "Dragonbane?", "Embermaw", "Firescale", "Goldforge", "Scalewarden", "Stormfang", "Wyrmheart"]
    },
    tiefling: {
      m: ["Baalzeb?", "Corvin?", "Drazhem", "Iricular", "Jareth", "Kel'thas?", "Malachar", "Nero", "Oghma?", "Vexis"],
      f: ["Amethyst?", "Caelindra?", "Duskana", "Hellene", "Ilyra", "Jezebel?", "Kaelindra?", "Morriga", "Nyxara", "Seraphine?"],
      u: ["Ashka?", "Brume", "Cinder?", "Duskmere?", "Ember?", "Haze?", "Murk", "Rime", "Shade?", "Smolder"],
      s: ["Ashenfall", "Brimstone", "Darkhollow", "Gloomveil", "Hellfire", "Nightshade?", "Shadowmere", "Soulfrost"]
    },
    aasimar: {
      m: ["Alaric?", "Balthazar", "Cassian", "Dorian?", "Ezekiel", "Gabriel?", "Israfel", "Jorah", "Michael?", "Phoebus"],
      f: ["Angelic?", "Aurelia?", "Celestine", "Elara?", "Gabrielle", "Hope", "Ivory", "Lucia", "Seraphine?", "Valora"],
      u: ["Aeryll", "Dawn", "Elian?", "Glory", "Lumiel", "Morning", "Radiant", "Solara", "Starling", "Vesprine"],
      s: ["Brightshield", "Dawnborn", "Goldensong", "Holyhelm", "Lightwarden", "Sunsworn", "Trueheart", "Wingfeather"]
    }
  };
  for (const s of SPECIES) {
    const x = EXTRA_NAMES[s.id];
    if (!x) continue;
    for (const k of ["m", "f", "u"]) {
      const extra = x[k].filter((n) => !n.endsWith("?") && !s.names[k].includes(n));
      s.names[k] = s.names[k].concat(extra);
    }
    s.surnames = s.surnames.concat(x.s.filter((n) => !n.endsWith("?") && !s.surnames.includes(n)));
  }

  /* ---------- more distinguishing features ---------- */
  const MORE_FEATURES = [
    "A ring on every finger", "A belt pouch that jingles with coins", "A faded map tucked in a boot",
    "A locket with a tiny painted portrait", "A chipped monocle on a chain", "Gloves with the fingers cut off",
    "A belt with an empty scabbard", "A pouch of strange-smelling herbs", "A wooden holy symbol on a cord",
    "A small mirror they check often", "A dented flask in a coat pocket", "Keys on a chain around the neck",
    "A torn wanted poster with their face scratched out", "A lucky coin they flip constantly",
    "A quill tucked behind the ear", "A small drum or flute at the hip", "Boots resoled many times",
    "A cloak lined with many hidden pockets", "A ring that doesn't fit any finger", "A toothpick worn behind the ear",
    "Ink stains on every fingertip", "A cracked hand mirror", "A braid tied with a dead man's hair",
    "Earrings made of monster teeth", "A tattoo that moves when they lie", "A birthmark shaped like a star",
    "Eyes that reflect light like a cat's", "A habit of counting things aloud", "Always chews on a reed or straw",
    "A voice that drops to a whisper for secrets", "Fingers stained with pipe tar", "A scar shaped like a handprint",
    "A missing eyebrow (burned off)", "Ears pierced with small hoops", "A pendant that is warm to the touch",
    "A laugh that sounds like breaking glass", "A limp that comes and goes", "Always smells of rain",
    "A shadow that falls the wrong way", "Talks to their weapon", "Collects buttons in a pouch",
    "A belt made of linked coins", "One boot a different color", "A tooth filed into a point",
    "Freckles only on one cheek", "Hair that stands up no matter what", "A cane with a hidden blade",
    "A ring of mushrooms growing around their boot", "A scar in the shape of a letter", "Wears a veil even indoors",
    "A habit of saluting strangers", "A coin from a foreign land on a string", "Knuckles tattooed with numbers",
    "A small bell sewn into a sleeve", "Eyes that water in the wind", "A birthmark shaped like an arrow",
    "Always barefoot indoors", "A pouch of dice, always loaded?", "A cloak clasp shaped like a skull",
    "A voice that echoes slightly", "A habit of snapping fingers when nervous", "A gold tooth in the back",
    "A ring that turns their finger green", "A tattoo of their own name", "Boots with bells on the toes"
  ];
  GENERIC_FEATURES.push(...MORE_FEATURES);

  /* ---------- voice descriptions ---------- */
  const VOICES = {
    pitch: ["a deep, rumbling", "a high, reedy", "a melodic, sing-song", "a gravelly", "a soft, breathy", "a booming", "a nasal", "a smooth, honeyed"],
    quality: ["gravelly", "clear and bright", "raspy", "warm", "thin", "resonant", "hoarse", "crisp"],
    pace: ["speaks slowly and deliberately", "talks quickly, words tumbling out", "pauses often, choosing words carefully", "rattles off sentences", "draws out the vowels"],
    accent: ["a rolling northern accent", "a clipped, formal diction", "a lilting lilt", "a rough frontier drawl", "a precise, educated manner of speaking", "no accent at all — flat and neutral", "a thick accent you can't place"],
    quirk: ["hums when thinking", "laughs at their own jokes", "trails off mid-sentence", "emphasizes every third word", "whispers when excited", "never uses contractions", "counts things aloud under their breath"],
    speciesQuirk: {
      dragonborn: "Sibilant hisses slip into their speech when angry.",
      tiefling: "A faint, pleasant echo underlies their words.",
      dwarf: "Gruff and to the point; rarely wastes words.",
      elf: "Speaks with an old-world formality and long vowels.",
      goliath: "Booming and proud; booms louder when emotional.",
      orc: "Growls certain consonants.",
      gnome: "Giggles mid-sentence.",
      halfling: "Chuckles constantly, even at bad news.",
      aasimar: "Their voice carries a faint, bell-like chime.",
      human: "Plain, unremarkable speech."
    }
  };

  /* ---------- species combat-relevant traits / resistances (2024 PHB) ---------- */
  const SPECIES_TRAITS = {
    human: "Versatile: an Origin feat of their choice.",
    elf: "Fey Ancestry: Advantage on saves against Charmed; immune to magical sleep. Trance.",
    dwarf: "Dwarven Resilience: Resistance to Poison damage and Advantage on saves vs the Poisoned condition.",
    gnome: "Gnome Cunning: Advantage on Int, Wis, and Cha saves against magic.",
    halfling: "Brave: Advantage on saves against the Frightened condition. Lucky.",
    orc: "Relentless Endurance and Adrenaline Rush (Bonus Action Dash + temp HP).",
    goliath: "Powerful Build; Giant Ancestry (%LINEAGE%).",
    dragonborn: "Draconic Ancestry (%LINEAGE%): Resistance to %LINEAGE% damage; Breath Weapon (%LINEAGE%).",
    tiefling: "Fiendish Legacy (%LINEAGE%): Resistance to %RES% damage; Darkvision.",
    aasimar: "Resistance to Necrotic and Radiant damage; Healing Hands; Celestial Revelation at 3rd level."
  };
  const TIEFLING_RES = { Abyssal: "Poison", Chthonic: "Necrotic", Infernal: "Fire" };

  /* ---------- per-class combat profile for leveled NPC stat blocks ---------- */
  const CLASS_COMBAT = {
    barbarian: { weapon: { name: "Greatsword", dice: 2, sides: 6, type: "slashing", stat: "Str" }, cantrip: null, extraAttackAt: 5, order: ["Str", "Con", "Dex", "Wis", "Cha", "Int"], ac: "unarmoredBarb" },
    bard:      { weapon: { name: "Rapier", dice: 1, sides: 8, type: "piercing", stat: "Dex" }, cantrip: { name: "Vicious Mockery", dice: 1, sides: 4, type: "psychic", stat: "Cha" }, extraAttackAt: null, order: ["Cha", "Dex", "Con", "Int", "Wis", "Str"], ac: 14 },
    cleric:    { weapon: { name: "Warhammer", dice: 1, sides: 8, type: "bludgeoning", stat: "Str" }, cantrip: { name: "Sacred Flame", dice: 1, sides: 8, type: "radiant", stat: "Wis" }, extraAttackAt: null, order: ["Wis", "Str", "Con", "Dex", "Int", "Cha"], ac: 18, shield: true },
    druid:     { weapon: { name: "Scimitar", dice: 1, sides: 6, type: "slashing", stat: "Dex" }, cantrip: { name: "Produce Flame", dice: 1, sides: 8, type: "fire", stat: "Wis" }, extraAttackAt: null, order: ["Wis", "Con", "Dex", "Str", "Int", "Cha"], ac: 16, shield: true },
    fighter:   { weapon: { name: "Longsword", dice: 1, sides: 8, type: "slashing", stat: "Str" }, cantrip: null, extraAttackAt: 5, order: ["Str", "Con", "Dex", "Wis", "Cha", "Int"], ac: 18, shield: true },
    monk:      { weapon: { name: "Spear", dice: 1, sides: 6, type: "piercing", stat: "Dex" }, cantrip: null, extraAttackAt: 5, order: ["Dex", "Wis", "Str", "Con", "Cha", "Int"], ac: "unarmoredMonk" },
    paladin:   { weapon: { name: "Longsword", dice: 1, sides: 8, type: "slashing", stat: "Str" }, cantrip: null, extraAttackAt: 5, order: ["Str", "Cha", "Con", "Wis", "Dex", "Int"], ac: 18, shield: true },
    ranger:    { weapon: { name: "Shortsword", dice: 1, sides: 6, type: "piercing", stat: "Dex" }, cantrip: null, extraAttackAt: 5, order: ["Dex", "Wis", "Str", "Con", "Cha", "Int"], ac: 16, shield: true },
    rogue:     { weapon: { name: "Shortsword", dice: 1, sides: 6, type: "piercing", stat: "Dex" }, cantrip: null, extraAttackAt: null, sneak: true, order: ["Dex", "Con", "Int", "Wis", "Cha", "Str"], ac: 14 },
    sorcerer:  { weapon: { name: "Dagger", dice: 1, sides: 4, type: "piercing", stat: "Dex" }, cantrip: { name: "Fire Bolt", dice: 1, sides: 10, type: "fire", stat: "Cha" }, extraAttackAt: null, order: ["Cha", "Con", "Dex", "Wis", "Int", "Str"], ac: "light" },
    warlock:   { weapon: { name: "Light Crossbow", dice: 1, sides: 8, type: "piercing", stat: "Dex" }, cantrip: { name: "Eldritch Blast", dice: 1, sides: 10, type: "force", stat: "Cha" }, extraAttackAt: null, order: ["Cha", "Con", "Dex", "Wis", "Int", "Str"], ac: "light" },
    wizard:    { weapon: { name: "Dagger", dice: 1, sides: 4, type: "piercing", stat: "Dex" }, cantrip: { name: "Fire Bolt", dice: 1, sides: 10, type: "fire", stat: "Int" }, extraAttackAt: null, order: ["Int", "Con", "Dex", "Wis", "Cha", "Str"], ac: "light" }
  };

  /* ---------- 2024 spell slot tables (full / half casters) + warlock pact slots ---------- */
  // rows are per character level 1..20; entries are slots per slot-level 1..9
  const SLOT_FULL = [
    [2,0,0,0,0,0,0,0,0],[3,0,0,0,0,0,0,0,0],[4,2,0,0,0,0,0,0,0],[4,3,0,0,0,0,0,0,0],
    [4,3,2,0,0,0,0,0,0],[4,3,3,0,0,0,0,0,0],[4,3,3,1,0,0,0,0,0],[4,3,3,2,0,0,0,0,0],
    [4,3,3,3,1,0,0,0,0],[4,3,3,3,2,0,0,0,0],[4,3,3,3,2,1,0,0,0],[4,3,3,3,2,1,0,0,0],
    [4,3,3,3,2,1,1,0,0],[4,3,3,3,2,1,1,0,0],[4,3,3,3,2,1,1,1,0],[4,3,3,3,2,1,1,1,0],
    [4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1],[4,3,3,3,3,2,2,1,1]
  ];
  const SLOT_HALF = [
    [2,0,0,0,0,0,0,0,0],[2,0,0,0,0,0,0,0,0],[3,0,0,0,0,0,0,0,0],[3,0,0,0,0,0,0,0,0],
    [4,2,0,0,0,0,0,0,0],[4,2,0,0,0,0,0,0,0],[4,3,0,0,0,0,0,0,0],[4,3,0,0,0,0,0,0,0],
    [4,3,2,0,0,0,0,0,0],[4,3,2,0,0,0,0,0,0],[4,3,3,0,0,0,0,0,0],[4,3,3,0,0,0,0,0,0],
    [4,3,3,2,0,0,0,0,0],[4,3,3,2,0,0,0,0,0],[4,3,3,3,0,0,0,0,0],[4,3,3,3,0,0,0,0,0],
    [4,3,3,3,0,0,0,0,0],[4,3,3,3,0,0,0,0,0],[4,3,3,3,0,0,0,0,0],[4,3,3,3,0,0,0,0,0]
  ];
  // warlock pact magic: count per level 1..20 and slot level per level 1..20
  const PACT_COUNT = [2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,4,4,4,4];
  const PACT_LEVEL = [1,1,2,2,3,3,4,4,5,5,5,5,5,5,5,5,5,5,5,5];
  const CASTER_TYPE = {
    bard: "full", cleric: "full", druid: "full", sorcerer: "full", wizard: "full",
    paladin: "half", ranger: "half", warlock: "pact"
  };
  const SPELL_SLOTS = { full: SLOT_FULL, half: SLOT_HALF, pactCount: PACT_COUNT, pactLevel: PACT_LEVEL, casterType: CASTER_TYPE };

  window.DM_DATA = { SPECIES, GENERIC_FEATURES, TABLES, LEVELS, VOICES, SPECIES_TRAITS, TIEFLING_RES, CLASS_COMBAT, SPELL_SLOTS };
})();
