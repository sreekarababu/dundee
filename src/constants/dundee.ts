export const FRAMING_SHOTS = [
  "Extreme Wide Shot (EWS)",
  "Wide Shot (WS)",
  "Full Shot",
  "Medium Wide Shot",
  "Cowboy Shot",
  "Medium Shot (MS)",
  "Medium Close-Up (MCU)",
  "Close-Up (CU)",
  "Extreme Close-Up (ECU)",
  "Two Shot",
  "Three Shot",
  "Group Shot",
  "Insert Shot",
  "Cutaway Shot",
  "Over-The-Shoulder Shot (OTS)",
  "Point of View Shot (POV)"
];

export const CAMERA_ANGLES = [
  "Eye-Level Shot",
  "Low Angle Shot",
  "High Angle Shot",
  "Bird’s Eye View",
  "Top Shot",
  "Dutch Angle",
  "Canted Angle",
  "Worm’s Eye View",
  "Shoulder Level Shot",
  "Hip Level Shot",
  "Knee Level Shot",
  "Ground Level Shot"
];

export const CAMERA_MOVEMENTS = [
  "Static / None",
  "Pan Shot",
  "Tilt Shot",
  "Dolly Shot",
  "Tracking Shot",
  "Truck Shot",
  "Push-In Shot",
  "Pull-Out Shot",
  "Zoom In",
  "Zoom Out",
  "Crash Zoom",
  "Arc Shot",
  "Crane Shot",
  "Jib Shot",
  "Steadicam Shot",
  "Handheld Shot",
  "Drone Shot",
  "Whip Pan",
  "Roll Shot",
  "Orbit Shot",
  "Slider Shot"
];

export const SPECIALTY_SHOTS = [
  "None",
  "Hero Entry Shot",
  "Silhouette Shot",
  "Reflection Shot",
  "Mirror Shot",
  "Rack Focus Shot",
  "Split Diopter Shot",
  "Lens Flare Shot",
  "Slow Motion Shot",
  "Time-Lapse Shot",
  "Hyperlapse Shot",
  "Freeze Frame",
  "Bullet Time Shot",
  "Long Take",
  "One Shot",
  "Continuous Shot",
  "360 Degree Shot",
  "Hidden Cut Shot",
  "Macro Shot",
  "Deep Focus Shot",
  "Shallow Focus Shot"
];

export const LIGHTING_STYLES = [
  "Cinematic Lighting",
  "Natural Daylight",
  "Soft Studio",
  "Silhouette",
  "Cyberpunk",
  "High Key",
  "Low Key",
  "Neon",
  "Golden Hour Lighting",
  "Harsh Sunlight",
  "Mood Lighting"
];

export const TIME_OF_DAY = [
  "Day",
  "Night",
  "Golden Hour",
  "Morning",
  "Evening",
  "Twilight",
  "Midnight",
  "Dawn",
  "Dusk",
  "Unspecified"
];

export const IMAGE_STYLES = [
  'Cinematic Realism',
  'Hyper Realistic',
  'Anime Style',
  'Graphic Novel',
  'Hollywood Film Look',
  'Indian Commercial Cinema',
  'Neo Noir',
  'Cyberpunk',
  'Vintage Film',
  'Black and White',
  'Watercolor Concept Art',
  '3D Pixar Style',
  'Dark Thriller',
  'Epic Fantasy',
  'Sci-Fi Concept Art',
  'Moody Drama'
];

export const CINEMATIC_TONES = [
  'None / Default',
  'Neo-Noir / Cynical Urban Darkness',
  'Dreamlike / Surreal',
  'Hyper-Stylized Cool',
  'Whimsical / Storybook',
  'Slow Cinema / Meditative',
  'Existential / Philosophical',
  'Atmospheric Horror',
  'Grand Epic / Spectacle',
  'Mass Masala (Indian)',
  'Rustic Raw Realism (Indian)',
  'Urban Grit / Gangster Realism (Indian)',
  'Poetic Humanism (Indian)',
  'Romantic-Political Lyrical (Mani Ratnam Style)',
  'Spiritual / Philosophical Art Cinema',
  'Feel-Good Slice of Life',
  'Mythic / Devotional Grandeur'
];

export const COLOR_PALETTES = [
  'None / Default',
  'Teal & Orange',
  'Desaturated Gray / Bleach Bypass',
  'Warm Golden Palette',
  'Cold Blue / Cyan Palette',
  'Neon Cyberpunk Palette',
  'Earthy Natural Palette',
  'High Saturation Pop Palette',
  'Green-Tinted Palette',
  'Monochrome / Limited Palette',
  'Pastel Palette',
  'Dark Contrast / Chiaroscuro',
  'Dusty Desert Palette',
  'Telugu/Tamil Mass Cinema',
  'Mani Ratnam Romantic Palette',
  'Malayalam Realist Palette'
];

export const FILM_STOCKS = [
  'Digital Clean (No Stock)',
  'Kodak Vision3 250D',
  'Kodak Vision3 500T',
  'Kodak Portra 400',
  'Kodak Ektachrome E100',
  'CineStill 800T',
  'Fuji Eterna 250D',
  'Fuji Pro 400H',
  'Ilford HP5 (B&W)',
  'Kodak Tri-X (B&W)',
  'Polaroid / Instant',
  'Technicolor 3-Strip'
];

export const DIFFUSION_FILTERS = [
  'None (Clean)',
  'Black Pro-Mist 1/8',
  'Black Pro-Mist 1/4',
  'Black Pro-Mist 1/2',
  'Glimmerglass 1/4',
  'Hollywood Black Magic 1/4',
  'Classic Soft 1/2',
  'Polarizer (CPL)',
  'Split Diopter',
  'Vintage Uncoated Flare'
];

export const DOF_STYLES = [
  'Auto / Lens-Based',
  'Deep Focus (Everything Sharp)',
  'Medium Depth',
  'Shallow Focus',
  'Razor-Shallow Bokeh',
  'Tilt-Shift Miniature',
  'Macro Detail'
];

export const BOARD_STYLES = [
  'Photoreal Frame',
  'Pencil Sketch Storyboard',
  'Marker Rendering',
  'Black & White Line Art',
  'Color Concept Sketch',
  'Ink & Wash',
  'Comic / Graphic Panel'
];

export const GENRE_PRESETS = [
  { name: 'Noir Thriller', style: 'Neo Noir', tone: 'Neo-Noir / Cynical Urban Darkness', palette: 'Dark Contrast / Chiaroscuro', time: 'Night' },
  { name: 'Mass Action', style: 'Indian Commercial Cinema', tone: 'Mass Masala (Indian)', palette: 'Teal & Orange', time: 'Golden Hour' },
  { name: 'Romance', style: 'Cinematic Realism', tone: 'Romantic-Political Lyrical (Mani Ratnam Style)', palette: 'Mani Ratnam Romantic Palette', time: 'Golden Hour' },
  { name: 'Horror', style: 'Dark Thriller', tone: 'Atmospheric Horror', palette: 'Green-Tinted Palette', time: 'Night' },
  { name: 'Period Drama', style: 'Hollywood Film Look', tone: 'Poetic Humanism (Indian)', palette: 'Warm Golden Palette', time: 'Day' },
  { name: 'Sci-Fi', style: 'Sci-Fi Concept Art', tone: 'Grand Epic / Spectacle', palette: 'Cold Blue / Cyan Palette', time: 'Night' },
  { name: 'Epic Fantasy', style: 'Epic Fantasy', tone: 'Mythic / Devotional Grandeur', palette: 'High Saturation Pop Palette', time: 'Golden Hour' }
];

export const AI_DIRECTORS = [
  "None / Auto",
  "Christopher Nolan",
  "S.S. Rajamouli",
  "Denis Villeneuve",
  "Mani Ratnam",
  "Lokesh Kanagaraj",
  "Quentin Tarantino",
  "David Fincher",
  "Wes Anderson",
  "Sanjay Leela Bhansali",
  "Vetrimaaran",
  "Steven Spielberg",
  "Martin Scorsese",
  "Zack Snyder",
  "Prashanth Neel"
];

export const CAMERAS = [
  "Auto / Any",
  "ARRI Alexa 35",
  "ARRI Alexa Mini LF",
  "ARRI Alexa 65",
  "RED V-Raptor 8K VV",
  "RED Komodo 6K",
  "RED Monstro 8K VV",
  "Sony Venice 2",
  "Sony FX9",
  "Sony FX3",
  "Sony A7S III",
  "Sony A1",
  "Sony A7R V",
  "Canon C300 Mark III",
  "Canon C500 Mark II",
  "Canon EOS R5 C",
  "Canon EOS R3",
  "Panavision Millennium DXL2",
  "Blackmagic URSA Mini Pro 12K",
  "Blackmagic Pocket 6K",
  "Nikon Cinema / Z9",
  "Leica Z / Cinema",
  "Hasselblad SL"
];

export const LENS_GROUPS: Record<string, string[]> = {
  "Cooke (The Cooke Look)": [
    'Cooke S4/i Prime 14mm', 'Cooke S4/i Prime 18mm', 'Cooke S4/i Prime 25mm', 'Cooke S4/i Prime 35mm', 
    'Cooke S4/i Prime 50mm', 'Cooke S4/i Prime 75mm', 'Cooke S4/i Prime 100mm', 'Cooke S4/i Prime 135mm',
    'Cooke Anamorphic/i 32mm', 'Cooke Anamorphic/i 50mm', 'Cooke Anamorphic/i 75mm', 'Cooke Anamorphic/i 100mm',
    'Cooke Panchro/i Classic 32mm', 'Cooke Panchro/i Classic 50mm', 'Cooke Panchro/i Classic 75mm'
  ],
  "ARRI": [
    'ARRI Signature Prime 12mm', 'ARRI Signature Prime 18mm', 'ARRI Signature Prime 21mm', 'ARRI Signature Prime 35mm', 
    'ARRI Signature Prime 47mm', 'ARRI Signature Prime 75mm', 'ARRI Signature Prime 125mm', 
    'ARRI Master Prime 14mm', 'ARRI Master Prime 27mm', 'ARRI Master Prime 50mm', 'ARRI Master Prime 100mm', 'ARRI Master Prime 150mm',
    'ARRI Master Anamorphic 35mm', 'ARRI Master Anamorphic 50mm', 'ARRI Master Anamorphic 75mm', 'ARRI Master Anamorphic 135mm'
  ],
  "Sony": [
    'Sony FE 14mm F1.8 GM', 'Sony FE 24mm F1.4 GM', 'Sony FE 35mm F1.4 GM', 'Sony FE 50mm F1.2 GM', 
    'Sony FE 85mm F1.4 GM', 'Sony FE 135mm F1.8 GM',
    'Sony CineAlta Prime 20mm', 'Sony CineAlta Prime 35mm', 'Sony CineAlta Prime 50mm', 'Sony CineAlta Prime 85mm'
  ],
  "Canon": [
    'Canon CN-E 14mm T3.1', 'Canon CN-E 24mm T1.5', 'Canon CN-E 35mm T1.5', 
    'Canon CN-E 50mm T1.3', 'Canon CN-E 85mm T1.3', 'Canon CN-E 135mm T2.2',
    'Canon RF 15-35mm F2.8 L IS USM', 'Canon RF 28-70mm F2.8 L IS USM', 'Canon RF 50mm F1.2 L USM', 'Canon RF 85mm F1.2 L USM'
  ],
  "Panavision": [
    'Panavision Primo Prime 14.5mm', 'Panavision Primo Prime 27mm', 'Panavision Primo Prime 35mm', 
    'Panavision Primo Prime 50mm', 'Panavision Primo Prime 75mm', 'Panavision Primo Prime 100mm',
    'Panavision Panatar Anamorphic 35mm', 'Panavision Panatar Anamorphic 50mm', 'Panavision Panatar Anamorphic 75mm'
  ],
  "RED": [
    'RED Pro Prime 18mm', 'RED Pro Prime 25mm', 'RED Pro Prime 35mm', 
    'RED Pro Prime 50mm', 'RED Pro Prime 85mm', 'RED Pro Prime 100mm'
  ],
  "Zeiss": [
    'Zeiss Supreme Prime 21mm', 'Zeiss Supreme Prime 29mm', 'Zeiss Supreme Prime 35mm', 
    'Zeiss Supreme Prime 50mm', 'Zeiss Supreme Prime 85mm', 'Zeiss Supreme Prime 100mm',
    'Zeiss CP.3 15mm', 'Zeiss CP.3 25mm', 'Zeiss CP.3 35mm', 'Zeiss CP.3 50mm', 'Zeiss CP.3 85mm'
  ],
  "Leica/Leitz": [
    'Leitz Summilux-C 18mm', 'Leitz Summilux-C 25mm', 'Leitz Summilux-C 35mm', 
    'Leitz Summilux-C 50mm', 'Leitz Summilux-C 75mm', 'Leitz Summilux-C 100mm'
  ]
};
