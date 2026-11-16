# StoryStudio – Modern Comic & Cartoon Maker

**▶ Try it online: https://opivankristovi.github.io/StoryStudio/**

A modernized fork of [StickStudio](https://github.com/opivankristovi/StickStudio) featuring a fluid, layered glassmorphic studio UI and a completely rebuilt library of detailed characters, objects, animals, and scenes — while keeping all 42 classic character poses.

Open **`index.html`** in Chrome, Edge or Firefox. Nothing to install and no internet needed.
`index.html` is a single self-contained file (all styles and code inlined), so you can copy it anywhere.

### Editing the source
The source lives in `src/index.template.html`, `css/` and `js/`. After changing anything, rebuild the single file:

    powershell -ExecutionPolicy Bypass -File build.ps1

(Optional: `powershell -ExecutionPolicy Bypass -File serve.ps1` serves it at http://localhost:8765.)

## What's new in StoryStudio
- **Modern Fluid Studio UI**: Layered dark surfaces with frosted glass (`backdrop-filter`), tactile 3D controls, floating inspector cards, springy library thumbnails, and a radial-lit dot-grid stage with deep paper shadows.
- **24 Detailed Characters**: Volumetric limbs, layered outfits, boots, gloves, multi-layered hair, and expressive faces with pupils and catchlights — *Maya, Leo, Zoe, Sam, Executive, Professor, Cyberpunk, Space Ranger, Android, Secret Agent, Shinobi, Paladin, Archmage, Rogue, Valkyrie, Barista, Field Medic, Master Chef, Rockstar, Explorer, Detective, Monarch, Corsair,* and *Celestial*.
- **Same 42 Poses**: Walk, run, panic, jump, cheer, wave, point, think, confused, shocked, shrug, angry, fight, punch, kick, sit, kneel, bow, fly, victory, flex, facepalm, dab, salute, clap, meditate, crouch, reach, star jump, sleep, and more — plus 17 facial expressions, 12 effects, and 26 held items.
- **70 Detailed Objects**:
  - **Furniture**: Armchair, Barstool, Dining Table, Workstation, Sectional Sofa, Modern Bed, Bookcase, OLED TV, Arc Lamp, Arched Door, Bay Window, Framed Art, Wall Clock, Monstera, Royal Throne.
  - **Tech & Sci-Fi**: Holo Terminal, Server Rack, Arcade, Cryo Pod, Hover Drone, Sci-Fi Crate, Portal Gate.
  - **Outdoors**: Oak Tree, Pine Tree, Flowering Bush, Mossy Rocks, Cottage, Skyscraper, Castle Keep, Streetlight, Park Bench, Signpost, Camping Tent, Campfire.
  - **Vehicles**: Sports Coupe, Patrol Cruiser, Motorcycle, Hoverbike, Rocket Ship, Sailboat.
  - **Animals (21)**: Cat, Dog, Rabbit, Fox, Bear, Lion, Elephant, Monkey, Frog, Duck, Owl, Pig, Cow, Penguin, Bluebird, Clownfish, Snake, Butterfly, Spider, Horse, Dragon.
  - **Props & FX**: Treasure Chest, Potion Flask, Electric Guitar, Trophy, Pizza Box, Explosion, Smoke Cloud, Magic Circle, Sparkles.
- **25 Layered Scenes**: Blank, Horizon Line, Neon City, Sunny Park, Suburban Street, Modern Loft, Cozy Café, Tech Office, High-Tech Lab, Classroom, Grand Library, Cozy Bedroom, Modern Kitchen, City Rooftop, Enchanted Forest, Alpine Peaks, Tropical Sunset, Canyon Desert, Deep Space, Starship Bridge, Castle Courtyard, Royal Hall, Torchlit Dungeon, Concert Stage, and Snowy Village.

## Core Features
- **Layout**: 16 quick layouts (classic page, splash, staggered, 4-koma, …), custom rows/columns/heights, panel splitting & merging, margins, gutter, border styling, rounded corners, and per-page formats.
- **Pages**: Add, duplicate, delete, and drag page thumbnails to reorder (`PgUp`/`PgDn` to switch).
- **Balloons**: Speech, boxed speech, thought, shout, whisper, caption, plain text, and sound effects with draggable tails and inline double-click editing (`*bold*`, `_italic_`).
- **Editing & Storage**: Drag-and-drop with smart snapping (hold `Ctrl` to disable), corner resize, rotation handle, flip, layer ordering, opacity, B&W mode, *My characters* presets, and isolated `stickstudio2.*` browser auto-save + `.json` file save/open.
- **Export**: Image-based PDF (150/220/300 dpi + crop marks), vector PDF (browser print), PNG per page, `.zip` bundle, or one long vertical strip image.

## Shortcuts
Del delete · Ctrl+D duplicate · Ctrl+C/V copy/paste · Alt+drag copy · arrows nudge (Shift ×10) · H/V flip · +/− bigger/smaller · P/F pick pose/face · [ ] layer · Esc deselect · Enter / double-click edit balloon text · Ctrl+Z/Y undo/redo · Ctrl+S save · Ctrl+O open · Ctrl+E export · Ctrl+P print · PgUp/PgDn page · F1 or ? help · Ctrl+wheel zoom
