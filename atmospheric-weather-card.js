/**
 * ATMOSPHERIC WEATHER CARD
 * Version: 2.8
 * * A custom Home Assistant card that renders animated weather effects.
 * * https://github.com/shpongledsummer/atmospheric-weather-card
 */

console.info(
    "%c ATMOSPHERIC WEATHER CARD ",
    "color: white; font-weight: 700; background: linear-gradient(90deg, #355C7D 0%, #6C5B7B 50%, #C06C84 100%); padding: 6px 12px; border-radius: 6px; font-family: sans-serif; letter-spacing: 0.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);"
);

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

// States that indicate "Night Mode" (used by sun/theme/mode resolution)
const NIGHT_MODES = Object.freeze([
    'dark', 'night', 'evening', 'on', 'true', 'below_horizon'
]);

// States that trigger the Status Image override (e.g. door open, alarm active)
const ACTIVE_STATES = Object.freeze([
    'on', 'true', 'open', 'unlocked', 'home', 'active'
]);

// Used when no weather entity is configured or available
const FALLBACK_WEATHER = Object.freeze({
    state: 'cloudy',
    attributes: {
        temperature: '--',
        temperature_unit: '',
        wind_speed: 0,
        wind_speed_unit: '',
        friendly_name: 'Weather Unavailable'
    }
});

// ============================================================================
// WEATHER CONFIGURATION
// ============================================================================
/**
 * Maps HA weather states to visual parameters.
 *   type/count     — Particle system and count.
 *   atmosphere     — CSS background mood + dust mote logic.
 *   cloud/scale    — Cloud count and size multiplier.
 *   wind           — Base wind speed multiplier.
 *   sunCloudWarm   — Sun-visible flag (warm palette sun clouds).
 *   sunClouds      — Overcast sun cloud layer (cool palette, no disc).
 *   dark/thunder   — Storm darkening + lightning spawning.
 *   foggy          — Fog bank layer.
 *   windVapor      — Volumetric wind vapor streaks.
 *   stars          — Star count (dark theme night only).
 */
const WEATHER_MAP = Object.freeze({
    'clear-night':      Object.freeze({ type: 'stars', count: 280, cloud: 4,  wind: 0.1, sunCloudWarm: false, atmosphere: 'night', stars: 420 }),
    'cloudy':           Object.freeze({ type: 'cloud', count: 0,   cloud: 24, wind: 0.3, dark: false, sunCloudWarm: false, sunClouds: true, atmosphere: 'overcast', stars: 120, scale: 1.2 }),
    'fog':              Object.freeze({ type: 'fog',   count: 0,   cloud: 18, wind: 0.2, sunCloudWarm: false, atmosphere: 'mist', foggy: true, stars: 125, scale: 1.2 }),
    'hail':             Object.freeze({ type: 'hail',  count: 150, cloud: 17, wind: 0.8, dark: true, sunCloudWarm: false, atmosphere: 'storm', stars: 50, scale: 1.2 }),
    'lightning':        Object.freeze({ type: 'rain',  count: 200, cloud: 18, wind: 2.0, thunder: true, dark: true, sunCloudWarm: false, atmosphere: 'storm', stars: 50, scale: 1.0 }),
    'lightning-rainy':  Object.freeze({ type: 'rain',  count: 150, cloud: 14, wind: 2.0, thunder: true, dark: true, sunCloudWarm: false, atmosphere: 'storm', stars: 50, scale: 1.0 }),
    'pouring':          Object.freeze({ type: 'rain',  count: 220, cloud: 16, wind: 0.3, dark: true, sunCloudWarm: false, atmosphere: 'storm', stars: 40, scale: 1.2 }),
    'rainy':            Object.freeze({ type: 'rain',  count: 120, cloud: 22, wind: 0.6, sunCloudWarm: false, atmosphere: 'rain', stars: 60, scale: 1.3 }),
    'snowy':            Object.freeze({ type: 'snow',  count: 60, cloud: 20, wind: 0.3, sunCloudWarm: false, atmosphere: 'snow', stars: 90, scale: 1.3 }),
    'snowy-rainy':      Object.freeze({ type: 'mix',   count: 100, cloud: 18, wind: 0.4, sunCloudWarm: false, atmosphere: 'snow', stars: 125, scale: 1.3 }),
    'partlycloudy':     Object.freeze({ type: 'cloud', count: 0,   cloud: 10, wind: 0.2, sunCloudWarm: true, atmosphere: 'fair', stars: 125, scale: 1.0 }),
    'windy':            Object.freeze({ type: 'cloud', count: 0,   cloud: 18, wind: 2.2, windVapor: true, sunCloudWarm: false, atmosphere: 'windy', stars: 125, scale: 1.2 }),
    'windy-variant':    Object.freeze({ type: 'cloud', count: 0,   cloud: 15, wind: 2.4, dark: false, windVapor: true, sunCloudWarm: false, atmosphere: 'windy', stars: 125, scale: 1.2 }),
    'sunny':            Object.freeze({ type: 'sun',   count: 0,   cloud: 5,  wind: 0.1, sunCloudWarm: true, atmosphere: 'clear', stars: 0 }),
    'exceptional':      Object.freeze({ type: 'sun',   count: 0,   cloud: 0,  wind: 0.1, sunCloudWarm: true, atmosphere: 'exceptional', stars: 420 }),
    'default':          Object.freeze({ type: 'none',  count: 0,   cloud: 6,  wind: 0.1, sunCloudWarm: false, atmosphere: 'fair', stars: 260 })
});

// Moon phase configurations for accurate rendering
const MOON_PHASES = Object.freeze({
    'new_moon':         { illumination: 0.0,  direction: 'right' },
    'waxing_crescent':  { illumination: 0.25, direction: 'right' },
    'first_quarter':    { illumination: 0.5,  direction: 'right' },
    'waxing_gibbous':   { illumination: 0.75, direction: 'right' },
    'full_moon':        { illumination: 1.0,  direction: 'none' },
    'waning_gibbous':   { illumination: 0.75, direction: 'left' },
    'last_quarter':     { illumination: 0.5,  direction: 'left' },
    'waning_crescent':  { illumination: 0.25, direction: 'left' }
});

// Safety limits to prevent unbounded array growth
const LIMITS = Object.freeze({
    MAX_SHOOTING_STARS: 2,
    MAX_BOLTS: 3,
    MAX_COMETS: 1,
    MAX_PLANES: 2,
    MAX_DUST: 40,
    MAX_SUN_CLOUDS: 5
});

// Particle array names — shared by constructor init and _clearAllParticles
const PARTICLE_ARRAYS = Object.freeze([
    '_rain', '_snow', '_hail', '_clouds', '_fgClouds', '_stars',
    '_bolts', '_fogBanks', '_windVapor', '_shootingStars',
    '_planes', '_birds', '_comets', '_dustMotes', '_sunClouds'
]);

// ============================================================================
// GEOMETRY TABLES — replaces inline magic-number pixel offsets
// ============================================================================

/**
 * Moon crater definitions: each entry is [dx, dy, rx, ry, rotation].
 * Two groups: maria (large dark seas) and detail (small impact craters).
 * Coordinates are offsets from moon center.
 */
const MOON_CRATERS = Object.freeze({
    maria: Object.freeze([
        Object.freeze({ dx: -9, dy:  2, rx: 7, ry: 9, rot:  0.2 }),
        Object.freeze({ dx:  8, dy: -6, rx: 6, ry: 4, rot: -0.3 }),
        Object.freeze({ dx: -2, dy: 10, rx: 5, ry: 3, rot:  0.1 })
    ]),
    mariaInner: Object.freeze([
        Object.freeze({ dx: -9, dy:  2, rx: 4, ry: 6, rot:  0.2 }),
        Object.freeze({ dx:  8, dy: -6, rx: 3, ry: 2, rot: -0.3 }),
        Object.freeze({ dx: -2, dy: 10, rx: 2.5, ry: 1.5, rot: 0.1 })
    ]),
    detail: Object.freeze([
        Object.freeze({ dx:  6, dy:  5, r: 1.2 }),
        Object.freeze({ dx: -5, dy: -8, r: 1.0 })
    ])
});

/**
 * Moon style color lookup tables — replaces 6-branch if/else chains in
 * _drawMoon and _buildMoonCache with keyed object access.
 *
 * Keys: 'yellow' | 'blue' | 'purple' | 'grey' | 'light' | 'dark'
 * Every gradient section (glow, fullDisc, partDisc, newMoonFill,
 * darkSideFill, ringStroke) is described as data here and consumed
 * by a single loop at draw time.
 */
const MOON_STYLE_COLORS = Object.freeze({
    // ── New-moon fill(s): [{ rgb, op }] — drawn when illumination ≤ 0 ──
    newMoon: {
        yellow: [{ rgb: '210,205,190', op: 0.10 }],
        blue:   [{ rgb: '140,155,180', op: 0.10 }],
        purple: [{ rgb: '155,140,170', op: 0.10 }],
        grey:   [{ rgb: '145,148,155', op: 0.10 }],
        light:  [{ rgb: '200,210,225', op: 0.20 }],
        dark:   [{ rgb: '40,45,55', op: 0.80 }, { rgb: '80,90,110', op: 0.15 }]
    },
    // ── Dark side fill: { rgb, op } — drawn for partial phases ──
    darkSide: {
        yellow: { rgb: '210,205,190', op: 0.15 },
        blue:   { rgb: '120,135,165', op: 0.14 },
        purple: { rgb: '138,125,155', op: 0.14 },
        grey:   { rgb: '130,132,140', op: 0.14 },
        light:  { rgb: '175,188,208', op: 0.55 },
        dark:   { rgb: '35,40,50', op: 0.90 }
    },
    // ── Ring stroke (light bg only): { rgb, op } ──
    ringStroke: {
        blue:   { rgb: '100,125,168', op: 0.22 },
        purple: { rgb: '140,118,165', op: 0.22 },
        grey:   { rgb: '110,112,122', op: 0.22 },
        yellow: { rgb: '155,182,228', op: 0.28 }  // default for yellow/light
    },
    // ── Light-bg glow gradient: { peak, stops: [[pos, rgb, alpha], ...] } ──
    glow: {
        yellow: { peak: 1.10, stops: [[0,'255,220,80',1.10],[0.35,'255,180,40',0.60],[0.65,'255,140,0',0.22],[1,'255,140,0',0]] },
        blue:   { peak: 0.75, stops: [[0,'90,115,170',0.75],[0.30,'100,125,175',0.35],[0.60,'115,138,180',0.12],[1,'130,150,190',0]] },
        purple: { peak: 0.75, stops: [[0,'140,115,170',0.75],[0.30,'148,125,172',0.35],[0.60,'155,138,175',0.12],[1,'165,150,180',0]] },
        grey:   { peak: 0.70, stops: [[0,'105,110,120',0.70],[0.30,'115,118,128',0.32],[0.60,'125,128,138',0.10],[1,'140,142,150',0]] },
        light:  { peak: 1.10, stops: [[0,'140,175,255',1.10],[0.35,'155,190,255',0.60],[0.65,'175,205,255',0.22],[1,'200,220,255',0]] }
    },
    // ── Full disc gradient: { peak, stops: [[pos, rgb, alpha], ...] } ──
    fullDisc: {
        yellow: { peak: 0.95, stops: [[0,'245,230,140',0.95],[0.5,'240,210,80',0.85],[1,'235,180,40',0.75]] },
        blue:   { peak: 0.88, stops: [[0,'165,180,210',0.88],[0.5,'125,145,185',0.80],[1,'95,115,160',0.70]] },
        purple: { peak: 0.88, stops: [[0,'185,170,200',0.88],[0.5,'155,138,175',0.80],[1,'125,108,150',0.70]] },
        grey:   { peak: 0.88, stops: [[0,'175,178,185',0.88],[0.5,'140,142,150',0.80],[1,'110,112,120',0.70]] },
        light:  { peak: 0.85, stops: [[0,'255,255,255',0.85],[0.5,'238,242,250',0.78],[1,'210,220,238',0.65]] },
        dark:   { peak: 0.95, stops: [[0,'255,255,250',0.95],[0.7,'230,235,245',0.90],[1,'200,210,230',0.85]] }
    },
    // ── Partial disc gradient: { peak, stops: [[pos, rgb, alpha], ...] } ──
    partDisc: {
        yellow: { peak: 0.90, stops: [[0,'245,230,140',0.90],[0.6,'240,210,80',0.80],[1,'235,180,40',0.70]] },
        blue:   { peak: 0.85, stops: [[0,'165,180,210',0.85],[0.6,'125,145,185',0.75],[1,'95,115,160',0.65]] },
        purple: { peak: 0.85, stops: [[0,'185,170,200',0.85],[0.6,'155,138,175',0.75],[1,'125,108,150',0.65]] },
        grey:   { peak: 0.85, stops: [[0,'175,178,185',0.85],[0.6,'140,142,150',0.75],[1,'110,112,120',0.65]] },
        light:  { peak: 0.82, stops: [[0,'255,255,255',0.82],[0.6,'240,244,252',0.72],[1,'218,228,242',0.58]] },
        dark:   { peak: 0.95, stops: [[0,'255,255,250',0.95],[0.6,'235,240,248',0.90],[1,'210,220,235',0.85]] }
    }
});

/**
 * Plane silhouette path segments (relative to plane origin, unscaled).
 * Each segment is [fromX, fromY, toX, toY] — drawn as stroke lines.
 * `dir` multiplier is applied at draw time to the X coordinates.
 */
const PLANE_PATH = Object.freeze([
    Object.freeze([  6, 0, -6,  0 ]),   // fuselage
    Object.freeze([ -5, 0, -8, -4 ]),   // tail fin
    Object.freeze([  1, 0, -2,  2 ])    // wing stub
]);

// Flash color lookup: dark vs light theme (used by _computeCloudPalette)
const FLASH_COLORS = Object.freeze({
    dark:  { litR:180, litG:200, litB:255, midR:120, midG:145, midB:220, shadowR:60, shadowG:75, shadowB:160 },
    light: { litR:255, litG:250, litB:255, midR:240, midG:238, midB:250, shadowR:210, shadowG:215, shadowB:235 }
});

// Cached constant: avoids TWO_PI multiplication on every arc call
const TWO_PI = Math.PI * 2;

// Hot-path canvas helper: replaces repeated beginPath+arc+fill boilerplate.
// Module-level function avoids `this` property lookup on every call.
function fillCircle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TWO_PI);
    ctx.fill();
}

// Star tier properties (hoisted from _initStars loop):
// [size_base, size_range, brightness_base, brightness_range, twinkle_base, twinkle_range]
const STAR_TIER_PROPS = Object.freeze({
    bg:   Object.freeze([1.2, 0.4, 0.35, 0.2, 0.04, 0.04]),
    mid:  Object.freeze([1.8, 0.6, 0.60, 0.25, 0.02, 0.02]),
    hero: Object.freeze([2.2, 0.8, 0.85, 0.15, 0.005, 0.01])
});

// Star color palettes — golden (light bg immersive) vs glow (dark bg)
// Each: [threshold, hue, saturation, lightness]
const STAR_PALETTE_GOLDEN = Object.freeze([
    Object.freeze([0.3, 45, 70, 65]),
    Object.freeze([0.85, 48, 55, 70]),
    Object.freeze([1, 38, 60, 60])
]);
const STAR_PALETTE_GLOW = Object.freeze([
    Object.freeze([0.3, 215, 30, 88]),
    Object.freeze([0.85, 200, 5, 95]),
    Object.freeze([1, 35, 35, 85])
]);

// Weather type classification sets (used by cloud palette mood resolution)
const DARK_WEATHER_TYPES = Object.freeze(new Set([
    'lightning', 'lightning-rainy', 'pouring', 'rainy', 'hail', 'snowy', 'snowy-rainy'
]));
const BAD_WEATHER_TYPES = Object.freeze(new Set([
    'rain', 'hail', 'fog', 'lightning', 'lightning-rainy', 'pouring', 'rainy', 'snowy-rainy'
]));
const STORM_TYPES = Object.freeze(new Set([
    'lightning', 'lightning-rainy', 'pouring'
]));
const LIGHT_BAD_BOOST_TYPES = Object.freeze(new Set([
    'rain', 'rainy', 'hail', 'snowy-rainy', 'fog'
]));

// Cloud palette lookup table: replaces 60-line if/else chain in _computeCloudPalette.
// Each entry: [litR,litG,litB, midR,midG,midB, shadowR,shadowG,shadowB, ambient, hlBase, hOff]
const CLOUD_PALETTES = Object.freeze({
    darkNight:    Object.freeze([215,225,240,  55, 68, 95,  10, 16, 30,  0.75, 0.65, 0.05]),
    darkDayStorm: Object.freeze([110,118,135,  38, 43, 58,  12, 15, 22,  0.85, 0.50, 0.05]),
    darkDay:      Object.freeze([228,238,255, 125,138,172,  24, 29, 48,  0.82, 0.55, 0.05]),
    lightStorm:   Object.freeze([248,248,252, 195,205,222, 120,132,158,  0.92, 0.75, 0.15]),
    lightRain:    Object.freeze([255,255,255, 210,218,228, 155,166,190,  1.00, 0.75, 0.15]),
    lightFair:    Object.freeze([255,255,255, 230,236,242, 180,190,210,  1.00, 0.75, 0.15]),
    lightOvercast:Object.freeze([255,255,255, 188,196,212, 128,140,166,  1.00, 0.75, 0.15]),
    lightDefault: Object.freeze([255,255,255, 210,218,228, 163,175,200,  1.00, 0.75, 0.15])
});

// Cloud type distribution arrays — pre-built, replaces per-iteration object + .split(',')
const CLOUD_TYPE_POOL = Object.freeze({
    fair:     Object.freeze(['cumulus','cumulus','cumulus','cumulus','organic','organic','organic','stratus','stratus','stratus']),
    clear:    Object.freeze(['cumulus','cumulus','cumulus','cumulus','organic','organic','organic','stratus','stratus','stratus']),
    overcast: Object.freeze(['stratus','stratus','stratus','stratus','stratus','stratus','cumulus','cumulus','cumulus','organic','organic','organic']),
    cloudy:   Object.freeze(['stratus','stratus','stratus','stratus','stratus','stratus','cumulus','cumulus','cumulus','organic','organic','organic']),
    windy:    Object.freeze(['stratus','stratus','stratus','stratus','organic','organic','organic','cumulus','cumulus','cumulus']),
    _default: Object.freeze(['organic','organic','organic','cumulus','cumulus','cumulus','cumulus','stratus','stratus','stratus'])
});

// Performance tuning
const PERFORMANCE_CONFIG = Object.freeze({
    RESIZE_DEBOUNCE_MS: 150,
    VISIBILITY_THRESHOLD: 0.01,
    REVEAL_TRANSITION_MS: 0,
    MAX_DPR: 2.0,
    TARGET_FPS: 30,
    MAX_PIXELS: 2073600
});

// Canvas filter presets for visual mood adjustment
const FILTER_PRESETS = Object.freeze({
    'darken':  'brightness(0.72) contrast(1.1)',
    'vivid':   'saturate(1.5) contrast(1.12) brightness(1.02)',
    'muted':   'saturate(0.55) brightness(1.08)',
    'warm':    'sepia(0.25) saturate(1.15) brightness(1.0)'
});

// ============================================================================
// CLOUD SHAPE GENERATOR
// ============================================================================
class CloudShapeGenerator {
    static generateOrganicPuffs(isStorm, seed) {
        const puffs = [];
        const seededRandom = this._seededRandom(seed);
        const puffCount = isStorm ? 20 : 18;
        const baseWidth = isStorm ? 110 : 105;
        const baseHeight = isStorm ? 60 : 42;

        for (let i = 0; i < puffCount; i++) {
            const angle = (i / puffCount) * TWO_PI + seededRandom() * 0.5;
            const distFromCenter = seededRandom() * 0.6 + 0.2;
            const dx = Math.cos(angle) * (baseWidth / 2) * distFromCenter;
            const dy = Math.sin(angle) * (baseHeight / 2) * distFromCenter * 0.6;
            const centerDist = Math.sqrt(dx * dx + dy * dy) / (baseWidth / 2);
            const baseRad = isStorm ? 55 : 36;
            const radVariation = isStorm ? 20 : 14;
            const rad = baseRad + seededRandom() * radVariation - centerDist * 15;
            const verticalShade = 0.4 + (1 - (dy + baseHeight / 2) / baseHeight) * 0.4;
            const shade = verticalShade + seededRandom() * 0.2;
            const softness = 0.3 + seededRandom() * 0.4;
            const squash = 0.75 + seededRandom() * 0.25;
            const rotation = (seededRandom() - 0.5) * 1.5;
            puffs.push({
                offsetX: dx, offsetY: dy,
                rad: Math.max(15, rad),
                shade: Math.min(1, shade),
                softness, squash, rotation,
                depth: seededRandom()
            });
        }

        const detailCount = isStorm ? 12 : 10;
        for (let i = 0; i < detailCount; i++) {
            const angle = seededRandom() * TWO_PI;
            const dist = 0.7 + seededRandom() * 0.4;
            puffs.push({
                offsetX: Math.cos(angle) * (baseWidth / 2) * dist,
                offsetY: Math.sin(angle) * (baseHeight / 2) * dist * 0.5 - 10,
                rad: 10 + seededRandom() * 14,
                shade: 0.5 + seededRandom() * 0.3,
                softness: 0.5 + seededRandom() * 0.3,
                squash: 0.6 + seededRandom() * 0.3,
                rotation: (seededRandom() - 0.5) * 2.0,
                depth: 0.8 + seededRandom() * 0.2
            });
        }

        puffs.sort((a, b) => a.depth - b.depth);
        return puffs;
    }

    static generateWispyPuffs(seed) {
        const puffs = [];
        const seededRandom = this._seededRandom(seed);
        const puffCount = 8 + Math.floor(seededRandom() * 4);

        for (let i = 0; i < puffCount; i++) {
            const angle = (i / puffCount) * TWO_PI + seededRandom() * 0.8;
            const dist = 0.3 + seededRandom() * 0.5;
            puffs.push({
                offsetX: Math.cos(angle) * 45 * dist,
                offsetY: Math.sin(angle) * 25 * dist,
                rad: 12 + seededRandom() * 18,
                shade: 0.5 + seededRandom() * 0.4,
                softness: 0.4 + seededRandom() * 0.4,
                squash: 0.8 + seededRandom() * 0.2,
                rotation: seededRandom() * 0.5,
                depth: seededRandom()
            });
        }

        puffs.sort((a, b) => a.depth - b.depth);
        return puffs;
    }

    static generateSunEnhancementPuffs(seed) {
        const puffs = [];
        const seededRandom = this._seededRandom(seed);
        const puffCount = 5 + Math.floor(seededRandom() * 3);

        for (let i = 0; i < puffCount; i++) {
            const spreadX = (i - puffCount / 2) * 12 + (seededRandom() - 0.5) * 8;
            const spreadY = (seededRandom() - 0.5) * 10;
            puffs.push({
                offsetX: spreadX,
                offsetY: spreadY,
                rad: 8 + seededRandom() * 10,
                shade: 0.7 + seededRandom() * 0.3,
                softness: 0.3 + seededRandom() * 0.3,
                squash: 0.9 + seededRandom() * 0.1,
                rotation: (seededRandom() - 0.5) * 0.5,
                depth: seededRandom()
            });
        }

        for (let i = 0; i < 3; i++) {
            puffs.push({
                offsetX: (seededRandom() - 0.5) * 50,
                offsetY: (seededRandom() - 0.5) * 15,
                rad: 5 + seededRandom() * 6,
                shade: 0.6 + seededRandom() * 0.3,
                softness: 0.4 + seededRandom() * 0.3,
                squash: 0.8,
                rotation: seededRandom(),
                depth: 0.5 + seededRandom() * 0.5
            });
        }

        puffs.sort((a, b) => a.depth - b.depth);
        return puffs;
    }

    static generateMixedPuffs(seed, variety = 'cumulus') {
        const puffs = [];
        const seededRandom = this._seededRandom(seed);

        if (variety === 'cumulus') {
            const baseWidth   = 110;
            const towerFactor = 0.5 + seededRandom() * 0.9;
            const asymShift   = (seededRandom() - 0.5) * 22;

            const baseCount = 5 + Math.floor(seededRandom() * 3);
            for (let i = 0; i < baseCount; i++) {
                const t = baseCount > 1 ? (i / (baseCount - 1)) - 0.5 : 0;
                puffs.push({
                    offsetX: t * baseWidth * 0.88 + (seededRandom() - 0.5) * 15,
                    offsetY: 6 + seededRandom() * 10,
                    rad: 20 + seededRandom() * 18,
                    shade: 0.38 + seededRandom() * 0.20,
                    softness: 0.35, squash: 1.0, rotation: 0,
                    depth: seededRandom() * 0.25
                });
            }

            const bodyCount = 11 + Math.floor(seededRandom() * 6);
            for (let i = 0; i < bodyCount; i++) {
                puffs.push({
                    offsetX: (seededRandom() - 0.5) * baseWidth * (0.50 + seededRandom() * 0.40) + asymShift * 0.35,
                    offsetY: -(20 + seededRandom() * 58),
                    rad: 16 + seededRandom() * 18,
                    shade: 0.62 + seededRandom() * 0.28,
                    softness: 0.28, squash: 1.0, rotation: 0,
                    depth: 0.22 + seededRandom() * 0.48
                });
            }

            const crownCount = 5 + Math.floor(seededRandom() * 3 + towerFactor * 2);
            for (let i = 0; i < crownCount; i++) {
                puffs.push({
                    offsetX: (seededRandom() - 0.5) * baseWidth * 0.42 + asymShift * 0.60,
                    offsetY: -(82 + towerFactor * 54 + seededRandom() * 52),
                    rad: 12 + seededRandom() * 16,
                    shade: 0.80 + seededRandom() * 0.20,
                    softness: 0.22, squash: 1.0, rotation: 0,
                    depth: 0.68 + seededRandom() * 0.32
                });
            }

            for (let i = 0; i < 5; i++) {
                const a = seededRandom() * TWO_PI;
                puffs.push({
                    offsetX: Math.cos(a) * (baseWidth * 0.44 + seededRandom() * 14),
                    offsetY: -(28 + seededRandom() * 48),
                    rad: 10 + seededRandom() * 13,
                    shade: 0.60 + seededRandom() * 0.28,
                    softness: 0.38, squash: 1.0, rotation: 0,
                    depth: seededRandom()
                });
            }
        } else if (variety === 'stratus') {
            const puffCount = 24 + Math.floor(seededRandom() * 10);

            for (let i = 0; i < puffCount; i++) {
                const spreadX = (i - puffCount / 2) * 16 + (seededRandom() - 0.5) * 18;
                const spreadY = (seededRandom() - 0.5) * 14;
                puffs.push({
                    offsetX: spreadX,
                    offsetY: spreadY,
                    rad: 10 + seededRandom() * 12,
                    shade: 0.6 + seededRandom() * 0.3,
                    softness: 0.2 + seededRandom() * 0.3,
                    squash: 0.55,
                    rotation: 0,
                    depth: seededRandom()
                });
            }

            const coreCount = 6 + Math.floor(seededRandom() * 4);
            for (let i = 0; i < coreCount; i++) {
                const spreadX = (i - coreCount / 2) * 22 + (seededRandom() - 0.5) * 12;
                puffs.push({
                    offsetX: spreadX,
                    offsetY: (seededRandom() - 0.5) * 6,
                    rad: 12 + seededRandom() * 10,
                    shade: 0.65 + seededRandom() * 0.25,
                    softness: 0.25 + seededRandom() * 0.2,
                    squash: 0.6,
                    rotation: 0,
                    depth: 0.4 + seededRandom() * 0.3
                });
            }
        } else if (variety === 'cirrus') {
            const streakCount = 4 + Math.floor(seededRandom() * 3);

            for (let s = 0; s < streakCount; s++) {
                const streakX = (s - streakCount / 2) * 35;
                const streakAngle = (seededRandom() - 0.5) * 0.3;
                const puffsInStreak = 6 + Math.floor(seededRandom() * 4);

                for (let i = 0; i < puffsInStreak; i++) {
                    const progress = i / puffsInStreak;
                    puffs.push({
                        offsetX: streakX + progress * 40 * Math.cos(streakAngle),
                        offsetY: progress * 30 * Math.sin(streakAngle) + (seededRandom() - 0.5) * 6,
                        rad: 8 + seededRandom() * 8 * (1 - progress * 0.5),
                        shade: 0.5 + seededRandom() * 0.3,
                        softness: 0.5 + seededRandom() * 0.3,
                        squash: 0.4 + seededRandom() * 0.3,
                        rotation: streakAngle + (seededRandom() - 0.5) * 0.5,
                        depth: seededRandom()
                    });
                }
            }
        }

        puffs.sort((a, b) => a.depth - b.depth);
        return puffs;
    }

    static _seededRandom(seed) {
        let s = seed;
        return () => {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };
    }
}

// ============================================================================
// MAIN CARD CLASS
// ============================================================================
class AtmosphericWeatherCard extends HTMLElement {

    // ========================================================================
    // CONSTRUCTOR & LIFECYCLE
    // ========================================================================
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // --- Animation State ---
        this._animID = null;
        this._lastFrameTime = 0;
        this._boundAnimate = this._animate.bind(this);

        // --- Particle Arrays ---
        for (const key of PARTICLE_ARRAYS) this[key] = [];
        this._aurora = null;

        // --- Weather State ---
        this._params = WEATHER_MAP['default'];
        this._flashOpacity = 0;
        this._flashHold = 0;
        // Two independent axes: _isTimeNight (content: stars/moon) vs _isThemeDark (contrast: glow colors)
        this._isTimeNight = false;
        this._isThemeDark = false;
        this._lastState = null;
        this._stateInitialized = false;
        this._hasReceivedFirstHass = false;

        // Pre-computed render state (populated by _buildRenderState)
        this._renderState = null;
        this._celestialSize = null;

        // --- Moon Phase ---
        this._moonPhaseState = 'full_moon';
        this._moonPhaseConfig = MOON_PHASES['full_moon'];

        // --- Wind Simulation ---
        this._windGust = 0;
        this._gustPhase = 0;
        this._windSpeed = 0.1;
        this._windKmh = 0;
        this._microGustPhase = 0;

        // --- Layer Fade Trackers (all 1; future animation hooks) ---
        this._layerFadeProgress = {
            stars: 1,
            clouds: 1,
            precipitation: 1,
            effects: 1
        };

        // --- Special Effects Phase Counters ---
        this._sunPulsePhase = 0;
        this._moonAnimPhase = 0;
        this._heatShimmerPhase = 0;
        this._atmospherePhase = 0;

        // --- Lifecycle & Initialization ---
        this._initialized = false;
        this._initializationComplete = false;
        this._isVisible = false;
        this._intersectionObserver = null;

        // --- Render Gate (prevents blank canvas flash on first load) ---
        this._renderGate = {
            hasValidDimensions: false,
            hasFirstHass: false,
            isRevealed: false
        };

        // --- Resize Handling ---
        this._canvasBuffersReleased = false;
        this._resizeDebounceTimer = null;
        this._pendingResize = false;
        this._cachedDimensions = { width: 0, height: 0, dpr: 1 };
        this._lastInitWidth = 0; // Resize tolerance baseline

        // --- DOM Text Cache (avoids DOM thrashing) ---
        this._lastTempStr = null;
        this._lastLocStr = null;

        // --- HA Entity Cache (reference equality performance shield) ---
        this._cachedWeather = this._cachedSun = this._cachedMoon = null;
        this._cachedTheme = this._cachedStatus = this._cachedTopSensor = null;
        this._cachedBotSensor = this._cachedLanguage = this._cachedSysDark = null;

        this._prevStyleSig = this._prevSunLeft = this._prevTextPosition = null;

        this._entityErrors = new Map();
        this._lastErrorLog = 0;

        this._boundVisibilityChange = this._handleVisibilityChange.bind(this);
        this._boundTap = this._handleTap.bind(this);
    }

    get _isLightBackground() { return !this._isThemeDark; }
    get _isNight()           { return this._isTimeNight; }

    static _buildStyles() {
        return `
            :host {
                display: block;
                width: 100%; position: relative;
                background: transparent !important;
                min-height: 200px;
            }
            #card-root {
                position: relative; width: 100%; height: 100%;
                container-type: size;
                z-index: var(--awc-stack-order, -1);
                overflow: hidden; background: transparent;
                display: block; transform: translateZ(0);
                will-change: transform, opacity;
                opacity: 0;
                transition: opacity ${PERFORMANCE_CONFIG.REVEAL_TRANSITION_MS}ms ease-out;
            }
            #card-root.standalone {
                z-index: var(--awc-stack-order, 1);
                border-radius: var(--awc-card-border-radius, var(--ha-card-border-radius, 12px));
            }
            #card-root.revealed { opacity: 1; }
            #card-root.full-width {
                margin: 0px calc(var(--ha-view-sections-narrow-column-gap, var(--ha-card-margin, 8px)) * -1) !important;
                padding: 0px var(--ha-view-sections-narrow-column-gap, var(--ha-card-margin, 8px)) !important;
            }
            canvas {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                pointer-events: none;
                filter: var(--awc-canvas-filter, var(--_canvas-filter, none));
                --mask-v: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
                --mask-h: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
                -webkit-mask-image: var(--mask-v), var(--mask-h);
                mask-image: var(--mask-v), var(--mask-h);
                -webkit-mask-composite: source-in;
                mask-composite: intersect;
            }
            #card-root.no-mask-v canvas { --mask-v: linear-gradient(#000, #000); }
            #card-root.no-mask-h canvas { --mask-h: linear-gradient(#000, #000); }
            #bg-canvas  { z-index: 0; -webkit-mask-image: none !important; mask-image: none !important; }
            #mid-canvas { z-index: 1; }
            #fg-canvas  { z-index: 3; }
            img {
                position: absolute; top: 0;
                height: 100%; width: auto; max-width: 100%;
                object-fit: contain; z-index: 2;
                user-select: none; pointer-events: none;
                border: none; outline: none;
            }
            img[src=""], img:not([src]) { display: none; visibility: hidden; }
            
			@keyframes premiumDrift {
                0% { background-position: 0% 0%; }
                100% { background-position: 100% 100%; }
            }
            @keyframes celestialPulse {
                0%, 100% { opacity: var(--g-op, 1); }
                50%       { opacity: calc(var(--g-op, 1) * 1.22); }
            }

            /* --- BASE STANDALONE CARD --- */
            #card-root.standalone {
                box-shadow: var(--ha-card-box-shadow, 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12));
                border: none;
                background-color: transparent;
                overflow: hidden;
                background-size: 200% 200%;
                animation: premiumDrift 5s ease-in-out infinite alternate;
            }

            /* --- DYNAMIC CELESTIAL GLOW + GOLDEN HOUR WASH --- */
            #card-root::after {
                content: "";
                position: absolute;
                inset: 0;
                z-index: -1;
                pointer-events: none;
                background-image:
                    radial-gradient(
                        circle var(--c-r, 10cqmax) at var(--c-x, 60%) var(--c-y, 40%),
                        rgba(var(--g-rgb, 255,240,190), 0.80) 0%,
                        rgba(var(--g-rgb, 255,240,190), 0.55) 35%,
                        rgba(var(--g-rgb, 255,240,190), 0.18) 62%,
                        rgba(var(--g-rgb, 255,240,190), 0) 100%
                    ),
                    radial-gradient(
                        ellipse 140% 80% at var(--c-x, 60%) 100%,
                        rgba(255, 140, 40, var(--gh-wash, 0)) 0%,
                        rgba(255, 120, 20, var(--gh-wash, 0)) 25%,
                        transparent 70%
                    ),
                    /* Subtle sky dimming layer (renders behind the glow/wash) */
                    linear-gradient(
                        rgba(15, 20, 35, var(--ambient-dim, 0)), 
                        rgba(15, 20, 35, var(--ambient-dim, 0))
                    );
                animation: celestialPulse 4s ease-in-out infinite;
                opacity: var(--g-op, 0);
            }
			
			/* --- IMMERSIVE MODE OVERRIDE: Shrink the huge glows so they don't cut off --- */
            #card-root:not(.standalone)::after {
                background-image: 
                    /* 1. Core Sun Glow (Dynamic Yellow/White) - Scaled to 0.5 to handle peak sunset swell */
                    radial-gradient(
                        circle calc(var(--c-r, 10cqmax) * 0.5) at var(--c-x, 60%) var(--c-y, 40%),
                        rgba(var(--g-rgb, 255,240,190), 0.80) 0%,
                        rgba(var(--g-rgb, 255,240,190), 0.55) 35%,
                        rgba(var(--g-rgb, 255,240,190), 0.18) 62%,
                        rgba(var(--g-rgb, 255,240,190), 0) 100%
                    ),
                    /* 2. Immersive Golden Hour Wash (Deep Orange Corona) */
                    radial-gradient(
                        circle calc(var(--c-r, 10cqmax) * 0.5) at var(--c-x, 60%) var(--c-y, 40%),
                        rgba(255, 140, 40, var(--gh-wash, 0)) 0%,
                        rgba(255, 100, 10, var(--gh-wash, 0)) 50%,
                        transparent 100%
                    );
            }

            /* --- FILM GRAIN — standalone only --- */
            /* z-index: 4 — above all canvases (fg is z:3) */
            #card-root.standalone::before {
                content: "";
                position: absolute;
                inset: 0;
                z-index: 4;
                opacity: 0.1;
                pointer-events: none;
                background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            }

            #card-root.standalone canvas,
            #card-root.no-mask canvas {
                -webkit-mask-image: none !important; mask-image: none !important;
            }

            /* Day backgrounds — driven by CSS custom properties */
            #card-root.standalone.scheme-day {
                --bg-hl: 255,255,255; --bg-a1: 0.45; --bg-a2: 0.10; --bg-s2: 40%; --bg-s3: 70%;
                --bg-c1: #4A95D6; --bg-c2: #89C4F4; --bg-c3: #D8F0FE;
            }
            #card-root.standalone.scheme-day.weather-exceptional { --bg-a1:0.50; --bg-a2:0.15; --bg-c1:#3B82C4; --bg-c2:#7CB9E8; --bg-c3:#CDE8FD; }
            #card-root.standalone.scheme-day.weather-partly { --bg-a2:0.10; --bg-s2:45%; --bg-s3:75%; --bg-c1:#66A5D9; --bg-c2:#9BCBEE; --bg-c3:#E6F4FB; }
            #card-root.standalone.scheme-day.weather-overcast { --bg-hl:225,230,235; --bg-a1:0.28; --bg-a2:0.06; --bg-s2:50%; --bg-s3:80%; --bg-c1:#A6BDD9; --bg-c2:#CBD8EB; --bg-c3:#E8F0F9; }
			#card-root.standalone.scheme-day.weather-rainy { --bg-hl:208,223,238; --bg-a1:0.45; --bg-a2:0.10; --bg-s2:45%; --bg-s3:75%; --bg-c1:#F2F7F9; --bg-c2:#DDE9EE; --bg-c3:#C7D4DF; }
            #card-root.standalone.scheme-day.weather-storm { --bg-hl:180,195,210; --bg-a1:0.40; --bg-a2:0.08; --bg-s2:45%; --bg-s3:75%; --bg-c1:#92A5B0; --bg-c2:#B3C5CE; --bg-c3:#DDEBEE; }
            #card-root.standalone.scheme-day.weather-snow { --bg-hl:240,245,250; --bg-a1:0.45; --bg-a2:0.15; --bg-s2:45%; --bg-s3:75%; --bg-c1:#B5C8DA; --bg-c2:#D8E5F0; --bg-c3:#F2F7FB; }
            #card-root.standalone.scheme-day.weather-fog { --bg-hl:245,250,255; --bg-a1:0.70; --bg-a2:0.25; --bg-s2:50%; --bg-s3:85%; --bg-c1:#D9E3ED; --bg-c2:#EDF2F7; --bg-c3:#FDFEFF; }
			
			/* Night backgrounds — same template, dark palette */
            #card-root.standalone.scheme-night {
                --bg-hl: 160,190,255; --bg-a1: 0.15; --bg-a2: 0.04; --bg-s2: 40%; --bg-s3: 70%;
                --bg-c1: #000000; --bg-c2: #050c18; --bg-c3: #0e1a30;
            }
            #card-root.standalone.scheme-night.weather-exceptional { --bg-a1:0.18; --bg-a2:0.05; --bg-c1:#000000; --bg-c2:#040b16; --bg-c3:#0b182b; }
            #card-root.standalone.scheme-night.weather-partly { --bg-a1:0.12; --bg-a2:0.03; --bg-s2:45%; --bg-s3:75%; --bg-c1:#010204; --bg-c2:#0a1320; --bg-c3:#152236; }
            #card-root.standalone.scheme-night.weather-overcast { --bg-hl:140,160,190; --bg-a1:0.10; --bg-a2:0.02; --bg-s2:50%; --bg-s3:80%; --bg-c1:#030406; --bg-c2:#0e1218; --bg-c3:#1a202a; }
            #card-root.standalone.scheme-night.weather-rainy { --bg-hl:130,150,180; --bg-a1:0.12; --bg-a2:0.03; --bg-s2:45%; --bg-s3:75%; --bg-c1:#020406; --bg-c2:#09121a; --bg-c3:#121e2e; }
            #card-root.standalone.scheme-night.weather-storm { --bg-hl:100,120,150; --bg-a1:0.08; --bg-a2:0.02; --bg-s2:45%; --bg-s3:75%; --bg-c1:#000000; --bg-c2:#04070a; --bg-c3:#091018; }
            #card-root.standalone.scheme-night.weather-snow { --bg-hl:180,200,230; --bg-a1:0.15; --bg-a2:0.04; --bg-s2:45%; --bg-s3:75%; --bg-c1:#040609; --bg-c2:#101722; --bg-c3:#1d2738; }
            #card-root.standalone.scheme-night.weather-fog { --bg-hl:150,160,180; --bg-a1:0.15; --bg-a2:0.04; --bg-s2:50%; --bg-s3:85%; --bg-c1:#050608; --bg-c2:#121418; --bg-c3:#1f232a; }

            /* Shared background template consuming the CSS variables above */
            #card-root.standalone.scheme-day,
            #card-root.standalone.scheme-night {
                background-image:
                    radial-gradient(ellipse at top, rgba(var(--bg-hl), var(--bg-a1)) 0%, rgba(var(--bg-hl), var(--bg-a2)) var(--bg-s2), transparent var(--bg-s3)),
                    linear-gradient(160deg, var(--bg-c1) 0%, var(--bg-c2) 50%, var(--bg-c3) 100%);
            }
			
			
            #text-wrapper {
                position: absolute; inset: 0; z-index: 10;
                pointer-events: none; display: none;
                flex-direction: column; box-sizing: border-box;
                padding: var(--awc-card-padding, var(--ha-space-4, 16px)) calc(var(--awc-card-padding, var(--ha-space-4, 16px)) + 4px);
                gap: var(--awc-text-gap, 10px);
                overflow: hidden;
            }
            #card-root #text-wrapper { display: flex; }
            #temp-text, #bottom-text {
                pointer-events: none;
                font-family: var(--ha-font-family, var(--paper-font-body1_-_font-family, sans-serif));
                transition: color 0.3s ease;
                min-width: 0; max-width: 100%;
            }
            #temp-text {
                font-size: var(--awc-top-font-size, clamp(24px, 11cqw, 52px));
                font-weight: var(--awc-top-font-weight, 600); line-height: 1;
                letter-spacing: -1px; display: flex; align-items: flex-start; gap: 6px;
                white-space: nowrap;
            }
            .temp-val { overflow: hidden; text-overflow: ellipsis; min-width: 0; }
            .temp-unit { font-size: 0.5em; font-weight: 500; padding-top: 6px; opacity: 0.7; flex-shrink: 0; }
            #bottom-text {
                font-size: var(--awc-bottom-font-size, clamp(15px, 5cqmin, 26px));
                font-weight: var(--awc-bottom-font-weight, 500); opacity: var(--awc-bottom-opacity, 0.7);
                letter-spacing: 0.5px; white-space: nowrap; display: flex; gap: 6px;
            }
            #bottom-text > span { overflow: hidden; text-overflow: ellipsis; min-width: 0; }
            #bottom-text ha-icon,
            #bottom-text ha-state-icon { --mdc-icon-size: var(--awc-icon-size, 1.1em); opacity: 0.9; }
            /* text_position: horizontal alignment */
            .text-left    { align-items: flex-start; text-align: left; }
            .text-right   { align-items: flex-end;   text-align: right; }
            .text-hcenter { align-items: center;     text-align: center; }
            /* text_alignment: vertical distribution */
            .align-spread { justify-content: space-between; }
            .align-top    { justify-content: flex-start; }
            .align-center { justify-content: center; }
            .align-bottom { justify-content: flex-end; }
            #card-root.scheme-day #temp-text,
            #card-root.scheme-day #bottom-text {
                color: var(--awc-text-day, #333333);
                text-shadow: var(--awc-text-shadow-day, 0 1px 2px rgba(255,255,255,0.6));
            }
            #card-root.scheme-night #temp-text,
            #card-root.scheme-night #bottom-text {
                color: var(--awc-text-night, #ffffff);
                text-shadow: var(--awc-text-shadow-night, 0 1px 3px rgba(0,0,0,0.6));
            }
        `;
    }

    // ========================================================================
    // DOM & STYLES
    // ========================================================================
    _initDOM() {
        if (this._initialized) return;
        this._initialized = true;

        if (this._config.offset) this.style.margin = this._config.offset;

        const style = document.createElement('style');
        style.textContent = AtmosphericWeatherCard._buildStyles();

        const root = document.createElement('div');
        root.id = 'card-root';

        const bg  = document.createElement('canvas'); bg.id  = 'bg-canvas';
        const mid = document.createElement('canvas'); mid.id = 'mid-canvas';
        const fg  = document.createElement('canvas'); fg.id  = 'fg-canvas';

        const img = document.createElement('img');
        img.onerror = () => { img.style.opacity = '0'; };
        img.onload  = () => { img.style.opacity = '1'; };

        const tempText   = document.createElement('div'); tempText.id   = 'temp-text';
        const bottomText = document.createElement('div'); bottomText.id = 'bottom-text';
        const textWrapper = document.createElement('div'); textWrapper.id = 'text-wrapper';
        textWrapper.append(tempText, bottomText);

        root.append(bg, mid, img, fg, textWrapper);
        this.shadowRoot.append(style, root);

        this._elements = { root, bg, mid, img, fg, tempText, bottomText, textWrapper };

        const ctxOpts = { alpha: true, willReadFrequently: false };
        const bgCtx  = bg.getContext('2d', ctxOpts);
        const midCtx = mid.getContext('2d', ctxOpts);
        const fgCtx  = fg.getContext('2d', ctxOpts);

        if (!bgCtx || !midCtx || !fgCtx) {
            console.error('ATMOSPHERIC-WEATHER-CARD: Failed to get canvas context');
            return;
        }
        this._ctxs = { bg: bgCtx, mid: midCtx, fg: fgCtx };
    }

    connectedCallback() {
        if (!this._resizeObserver) {
            this._resizeObserver = new ResizeObserver((entries) => {
                if (!entries.length) return;
                const changed = this._updateCanvasDimensions();
                if (!this._initializationComplete) {
                    this._tryInitialize();
                } else if (changed) {
                    this._scheduleParticleReinit();
                }
            });
        }

        if (!this._intersectionObserver) {
            this._intersectionObserver = new IntersectionObserver(
                this._boundVisibilityChange,
                {
                    threshold: PERFORMANCE_CONFIG.VISIBILITY_THRESHOLD,
                    rootMargin: '50px'
                }
            );
        }

        if (this._elements?.root) {
            this._resizeObserver.observe(this._elements.root);
            this.addEventListener('click', this._boundTap);
            this._intersectionObserver.observe(this._elements.root);
        }

        if (this._initializationComplete) {
            this._startAnimation();
        } else if (this._renderGate.hasFirstHass) {
            this._tryInitialize();
        }
    }

    disconnectedCallback() {
        this._stopAnimation();
        this._resizeObserver?.disconnect();
        this._intersectionObserver?.disconnect();
        if (this._resizeDebounceTimer) {
            clearTimeout(this._resizeDebounceTimer);
            this._resizeDebounceTimer = null;
        }
        this._isVisible = false;
        this.removeEventListener('click', this._boundTap);
        this._clearAllParticles();
        this._initializationComplete = false;
    }

    _clearAllParticles() {
        for (const key of PARTICLE_ARRAYS) this[key] = [];
        this._flashHold = 0;
        this._aurora = null;
    }

    // ========================================================================
    // HOME ASSISTANT CARD API (setConfig, set hass, getCardSize, etc.)
    // ========================================================================
    setConfig(config) {
        this._config = config;
        this._initDOM();
		
		if (config.stack_order !== undefined) {
            this.style.setProperty('--awc-stack-order', config.stack_order);
        } else {
            this.style.removeProperty('--awc-stack-order');
        }

        if (config.square) {
            this.style.height = 'auto';
            this.style.minHeight = '0';
            this.style.aspectRatio = '1 / 1';
        } else {
            const heightConfig = config.card_height || '200px';
            const cssHeight = typeof heightConfig === 'number' ? `${heightConfig}px` : heightConfig;
            this.style.height = cssHeight;
            this.style.minHeight = cssHeight;
            this.style.aspectRatio = 'auto';
        }

        if (this._elements?.img) {
            const img = this._elements.img;
            const scale = config.image_scale !== undefined ? config.image_scale : 100;
            img.style.height = `${scale}%`;

            const align = (config.image_alignment || 'top-right').toLowerCase();
            img.style.top = ''; img.style.bottom = '';
            img.style.left = ''; img.style.right = '';
            img.style.transform = '';

            const marginVar = 'calc(var(--ha-view-sections-narrow-column-gap, var(--ha-card-margin, 16px)) * 1)';
            const isCenterH = align === 'center' || align.includes('-center') ||
                               (!align.includes('left') && !align.includes('right') && align === 'center');
            const isCenterV = align.includes('center') && !align.includes('left') && !align.includes('right');
            const isLeft    = align.includes('left');
            const isBottom  = align.includes('bottom');

            if (isLeft) {
                img.style.left = marginVar; img.style.right = 'auto';
            } else if (align === 'center' || align === 'top-center' || align === 'bottom-center' || align === 'center-left' || align === 'center-right') {
                img.style.left = '50%'; img.style.right = 'auto';
                img.style.transform = 'translateX(-50%)';
            } else {
                img.style.right = marginVar; img.style.left = 'auto';
            }

            if (isBottom) {
                img.style.bottom = '0'; img.style.top = 'auto';
            } else if (align === 'center') {
                img.style.top = '50%';
                img.style.transform = 'translateX(-50%) translateY(-50%)';
            } else if (align.includes('center') && !align.includes('top') && !align.includes('bottom')) {
                img.style.top = '50%'; img.style.transform = 'translateX(-50%) translateY(-50%)';
            } else {
                img.style.top = '0'; img.style.bottom = 'auto';
            }
        }

        const root = this._elements.root;
        root.classList.toggle('no-mask-v', config.css_mask_vertical === false);
        root.classList.toggle('no-mask-h', config.css_mask_horizontal === false);

        // Canvas filter: preset name resolves to a CSS filter string.
        // User can override via --awc-canvas-filter CSS variable.
        const filterVal = FILTER_PRESETS[(config.filter || '').toLowerCase()] || '';
        root.style.setProperty('--_canvas-filter', filterVal || 'none');

        this._hasStatusFeature = !!(config.status_entity && (config.status_image_day || config.status_image_night));

        // Unified celestial body size: when sun_moon_size is set, all celestial
        // bodies (sun disc, moon disc) use this diameter in pixels.
        // When null, each body keeps its natural default size.
        const csz = config.sun_moon_size != null ? parseInt(config.sun_moon_size, 10) : null;
        this._celestialSize = (csz && csz > 0) ? csz : null;
    }

    // ========================================================================
    // HOME ASSISTANT API
    // ========================================================================
    set hass(hass) {
        if (!hass || !this._config) return;

        // 1. Resolve entity references
        const wEntity = (this._config.weather_entity && hass.states[this._config.weather_entity]) || FALLBACK_WEATHER;
        const sunEntity = this._config.sun_entity ? hass.states[this._config.sun_entity] : null;
        const moonEntity = this._config.moon_phase_entity ? hass.states[this._config.moon_phase_entity] : null;
        const themeEntity = this._config.theme_entity ? hass.states[this._config.theme_entity] : null;
        const statusEntity = this._config.status_entity ? hass.states[this._config.status_entity] : null;
        const topSensor = this._config.top_text_sensor ? hass.states[this._config.top_text_sensor] : null;
        const botSensor = this._config.bottom_text_sensor ? hass.states[this._config.bottom_text_sensor] : null;
        const sysDark = hass.themes?.darkMode;
        const lang = hass.locale?.language || 'en';

        // Reference equality bail-out — HA replaces entity objects on change
        if (this._cachedWeather === wEntity && this._cachedSun === sunEntity &&
            this._cachedMoon === moonEntity && this._cachedTheme === themeEntity &&
            this._cachedStatus === statusEntity && this._cachedTopSensor === topSensor &&
            this._cachedBotSensor === botSensor && this._cachedLanguage === lang &&
            this._cachedSysDark === sysDark) {
            return;
        }
        this._cachedWeather = wEntity;
        this._cachedSun = sunEntity;
        this._cachedMoon = moonEntity;
        this._cachedTheme = themeEntity;
        this._cachedStatus = statusEntity;
        this._cachedTopSensor = topSensor;
        this._cachedBotSensor = botSensor;
        this._cachedLanguage = lang;
        this._cachedSysDark = sysDark;

        const useFullWidth = this._config.full_width === true;
        if (this._elements?.root) {
            if (useFullWidth && !this._elements.root.classList.contains('full-width')) {
                this._elements.root.classList.add('full-width');
            } else if (!useFullWidth && this._elements.root.classList.contains('full-width')) {
                this._elements.root.classList.remove('full-width');
            }
        }

        if (!wEntity) return;

        // Moon phase
        if (moonEntity && moonEntity.state !== this._moonPhaseState) {
            this._moonPhaseState = moonEntity.state;
            this._moonPhaseConfig = MOON_PHASES[moonEntity.state] || MOON_PHASES['full_moon'];
        }
		
        // Day/Night & Theme resolution — single pass over entities
        const axes = this._resolveAxes(sunEntity, themeEntity, sysDark);
        const isTimeNight = axes.isTimeNight;
        const isThemeDark = axes.isThemeDark;
        const hasNightChanged = this._isTimeNight !== isTimeNight || this._isThemeDark !== isThemeDark;

        this._isTimeNight = isTimeNight;
        this._isThemeDark = isThemeDark;

        // Weather state normalization
        let weatherState = (wEntity.state || 'default').toLowerCase();
        if (isTimeNight && weatherState === 'sunny') weatherState = 'clear-night';
        if (!isTimeNight && weatherState === 'clear-night') weatherState = 'sunny';

        let newParams = { ...(WEATHER_MAP[weatherState] || WEATHER_MAP['default']) };
        if (isTimeNight && (weatherState === 'sunny' || weatherState === 'clear-night')) {
            newParams.type = 'stars';
            newParams.count = 280;
        }

        // UI updates
        this._updateStandaloneStyles(isTimeNight, newParams);
        this._updateTextElements(hass, wEntity, lang);

        const windSpeedRaw = this._getEntityAttribute(wEntity, 'wind_speed', 0);
        const windSpeed = typeof windSpeedRaw === 'number' ? windSpeedRaw : parseFloat(windSpeedRaw) || 0;
        this._windSpeed = Math.min(Math.max(windSpeed / 10, 0), 2);

        // Normalize to km/h for wind vapor threshold (zero-allocation conversion)
        const wsu = (wEntity?.attributes?.wind_speed_unit || 'km/h').toLowerCase();
        let toKmh = 1;
        if (wsu.includes('m/s')) toKmh = 3.6;
        else if (wsu.includes('mph')) toKmh = 1.609;
        else if (wsu.includes('kn')) toKmh = 1.852;
        this._windKmh = windSpeed * toKmh;

        const imageNight = axes.isImageNight;
        this._updateImage(hass, imageNight);

        // Golden hour: warm glow + ambient wash (after base styles are set)
        this._applyGoldenHour(sunEntity || hass.states['sun.sun'], newParams);

        // First load gate
        if (!this._hasReceivedFirstHass) {
            this._hasReceivedFirstHass = true;
            this._renderGate.hasFirstHass = true;
            this._lastState = weatherState;
            this._params = newParams;
            this._stateInitialized = true;
            this._buildRenderState();
            this._tryInitialize();
            return;
        }

        // Change detection → particle reboot
        this._handleWeatherChange(weatherState, newParams, hasNightChanged);
    }

    // ========================================================================
    // UNIFIED STATE AXIS RESOLUTION
    // ========================================================================
    // Replaces three WET methods with a single pass. Returns { isTimeNight, isThemeDark, isImageNight }.
    // Axes share entity reads but differ in priority:
    //   Time:  mode → sun → theme → false
    //   Theme: mode → theme → sun → sysDark
    //   Image: mode → theme → sun → sysDark
    _resolveAxes(sunEntity, themeEntity, sysDark) {
        // 'theme' is the canonical config key; 'mode' kept as legacy fallback
        const modeRaw = this._config.theme || this._config.mode;
        const mode = modeRaw ? modeRaw.toLowerCase() : null;

        // Shared entity booleans evaluated once
        const themeValid = themeEntity &&
            themeEntity.state !== 'unavailable' &&
            themeEntity.state !== 'unknown';
        const themeIsNight = themeValid &&
            NIGHT_MODES.includes(themeEntity.state.toLowerCase());

        const sunState = sunEntity ? sunEntity.state.toLowerCase() : null;
        const sunIsBelowHorizon = sunState === 'below_horizon';
        const sunIsNight = sunIsBelowHorizon || (sunState !== null && NIGHT_MODES.includes(sunState));

        // Time axis: mode → sun → theme → false
        let isTimeNight;
        if      (mode === 'night') isTimeNight = true;
        else if (mode === 'day')   isTimeNight = false;
        else if (sunEntity)        isTimeNight = sunIsBelowHorizon;
        else if (themeValid)       isTimeNight = themeIsNight;
        else                       isTimeNight = false;

        // Theme axis: mode → theme → sun → sysDark
        let isThemeDark;
        if      (mode === 'dark')  isThemeDark = true;
        else if (mode === 'light') isThemeDark = false;
        else if (themeValid)       isThemeDark = themeIsNight;
        else if (sunEntity)        isThemeDark = sunIsNight;
        else                       isThemeDark = !!sysDark;

        // Image axis: mode → theme → sun → sysDark
        let isImageNight;
        if      (mode === 'dark' || mode === 'night') isImageNight = true;
        else if (mode === 'light' || mode === 'day')  isImageNight = false;
        else if (themeValid)                          isImageNight = themeIsNight;
        else if (sunEntity)                           isImageNight = sunIsNight;
        else                                          isImageNight = !!sysDark;

        return { isTimeNight, isThemeDark, isImageNight };
    }

    // ========================================================================
    // PRE-COMPUTED RENDER STATE
    // ========================================================================
    // Built once per weather/theme change; render loop reads flat values instead of branching per frame.
    _buildRenderState() {
        const p = this._params;
        const isDark  = this._isThemeDark;
        const isNight = this._isTimeNight;
        const isLight = !isDark; // === this._isLightBackground
        const type    = p?.type || 'none';
        const atm     = p?.atmosphere || '';
        const state   = (this._lastState || '').toLowerCase();

        // --- Weather classification flags ---
        const isStormy = !!(p?.thunder) ||
            type === 'lightning' || type === 'lightning-rainy' || type === 'pouring';
        const isBadWeatherForPlanes =
            type === 'rain' || type === 'hail' || type === 'lightning' ||
            type === 'pouring' || type === 'snowy' || type === 'fog';
        const isBadWeatherForComets =
            type === 'rain' || type === 'hail' || type === 'lightning' ||
            type === 'pouring' || type === 'snowy' || type === 'snowy-rainy';
        const isSevereWeather = !!(p?.thunder) || type === 'hail' || type === 'pouring';

        // --- Visibility flags (replace per-frame _shouldShowSun / _shouldShowCloudySun) ---
        const goodWeather = state === 'sunny' || state === 'partlycloudy' ||
                            state === 'clear-night' || state === 'exceptional';
        const showSun = !isNight && goodWeather;

        let showCloudySun = false;
        if (!(isNight && isDark)) {
            if (!(isDark && state === 'cloudy')) {
                const isBad = !!(p?.dark) ||
                    type === 'rain' || type === 'hail' || type === 'lightning' ||
                    type === 'pouring' || type === 'snowy' || type === 'snowy-rainy';
                const isOvercastType = state === 'cloudy' || state === 'windy' ||
                                       state === 'windy-variant' || state === 'fog';
                showCloudySun = isOvercastType && !isBad;
            }
        }

        // --- Rain color base ---
        const rainRgb = isLight ? '85, 95, 110' : '210, 225, 255';

        // Star mode: glow (dark night), golden (light immersive night), hidden
        const isStandalone = this._config.card_style === 'standalone';
        let starMode = 'hidden';
        if (isNight) {
            if (isDark) {
                starMode = 'glow';
            } else if (!isStandalone) {
                starMode = 'golden';
            }
        }

        // Cloud palette evaluated once; render loop reads flat values
        const cp = this._computeCloudPalette(isDark, isNight, isLight, p, type, atm);

        // --- Cloud global opacity ---
        const cloudGlobalOp = isDark ? 0.64 : 0.85;

        // --- Sun cloud palette: warm (sun-lit) vs cool (overcast accent) ---
        const sunCloudWarm = !!(p?.sunCloudWarm);

        // Invalidate cached gradients; lazily rebuilt on next frame
        this._sunBodyGradDark = this._sunBodyGradDarkR = null;
        this._sunDiscGradLight = this._sunDiscGradLightR = null;
        this._cloudySunGradDark = this._cloudySunGradDarkR = null;
        this._csGlowMoon = this._csGlowDay = this._moonCache = this._rainGrad = null;

        this._renderState = {
            isStormy,
            isBadWeatherForPlanes,
            isBadWeatherForComets,
            isSevereWeather,
            showSun,
            showCloudySun,
            rainRgb,
            cloudGlobalOp,
            starMode,
            sunCloudWarm,
            cp  // cloud palette
        };
    }

    /**
     * Computes the cloud rendering color palette.
     * Returns a flat object with lit/mid/shadow/flash RGB channels,
     * ambient, highlightOffsetBase, hOffset, and per-puff modifier flags.
     */
    _computeCloudPalette(isDark, isNight, isLight, p, type, atm) {
        // --- Flash colors (lightning sheet flash) ---
        const fc = isDark ? FLASH_COLORS.dark : FLASH_COLORS.light;
        const { litR: flashLitR, litG: flashLitG, litB: flashLitB,
                midR: flashMidR, midG: flashMidG, midB: flashMidB,
                shadowR: flashShadowR, shadowG: flashShadowG, shadowB: flashShadowB } = fc;

        // --- Mood classification: single pass → palette key ---
        let mood;
        if (isDark && isNight) {
            mood = 'darkNight';
        } else if (isDark) {
            mood = (p?.dark || p?.thunder || DARK_WEATHER_TYPES.has(type)) ? 'darkDayStorm' : 'darkDay';
        } else if (p?.dark || BAD_WEATHER_TYPES.has(type) || p?.foggy) {
            mood = (p?.thunder || STORM_TYPES.has(type)) ? 'lightStorm' : 'lightRain';
        } else if (atm === 'fair' || atm === 'clear') {
            mood = 'lightFair';
        } else if (atm === 'overcast' || atm === 'cloudy') {
            mood = 'lightOvercast';
        } else {
            mood = 'lightDefault';
        }

        // --- Unpack from frozen lookup (zero allocation: reads from pre-built array) ---
        const pal = CLOUD_PALETTES[mood];
        const litR = pal[0], litG = pal[1], litB = pal[2];
        const midR = pal[3], midG = pal[4], midB = pal[5];
        const shadowR = pal[6], shadowG = pal[7], shadowB = pal[8];
        const ambient = pal[9];
        const highlightOffsetBase = pal[10];
        const hOffset = pal[11];

        // --- Per-puff modifier flags (constant for the frame) ---
        const isBadType = LIGHT_BAD_BOOST_TYPES.has(type) || p?.foggy;
        const isRainyBoost = isLight && !isDark && isBadType;
        const isStormOverride = isRainyBoost && (p?.thunder || STORM_TYPES.has(type));
        const rainyOpacityMul = (isRainyBoost && !isStormOverride) ? 1.22 : 1.0;

        return {
            litR, litG, litB,
            midR, midG, midB,
            shadowR, shadowG, shadowB,
            flashLitR, flashLitG, flashLitB,
            flashMidR, flashMidG, flashMidB,
            flashShadowR, flashShadowG, flashShadowB,
            ambient,
            highlightOffsetBase,
            hOffset,
            rainyOpacityMul
        };
    }

    _updateStandaloneStyles(isNight, newParams) {
        const root = this._elements.root;
        const atm = newParams.atmosphere || '';
        const w = this._cachedDimensions.width / (this._cachedDimensions.dpr || 1);

        // === GLOW VARIABLES — all modes (standalone + immersive) ===
        // Default --g-op: 0 in CSS; nothing shows until JS sets values.
        if (w > 0) {
            const h = this._cachedDimensions.height / (this._cachedDimensions.dpr || 1);
            const celestial = this._getCelestialPosition(w, h);
            root.style.setProperty('--c-x', `${celestial.x}px`);
            root.style.setProperty('--c-y', `${celestial.y}px`);
            if (h > 0) {
                const dx = Math.max(celestial.x, w - celestial.x);
                const dy = Math.max(celestial.y, h - celestial.y);
                const minSafeRadius = Math.ceil(Math.sqrt(dx * dx + dy * dy) * 0.3);
                root.style.setProperty('--c-r', `${minSafeRadius}px`);
            }
        }

        if (this._isTimeNight) {
            // Moon glow — cool blue, opacity scales with moon phase and weather
            const illum = this._moonPhaseConfig?.illumination ?? 1.0;
            const nightWeatherOp = { storm: 0.08, rain: 0.14, snow: 0.22, overcast: 0.28, windy: 0.28, mist: 0.20, fog: 0.20, fair: 0.80 };
            const weatherFactor = nightWeatherOp[atm] ?? 1.0;
            const nightOp = (0.20 + illum * 0.30) * weatherFactor;
            const isStandalone = this._config.card_style === 'standalone';
			const isImmersiveLight = !this._isThemeDark && !isStandalone;

			// Moon glow color: respects moon_style config
			const moonStyle = (this._config.moon_style || 'blue').toLowerCase();
			let moonRgb;
			if (isImmersiveLight) {
				const moonRgbMap = { yellow: '255,200,50', purple: '140,115,175', grey: '105,110,120' };
				moonRgb = moonRgbMap[moonStyle] || '100,125,175'; // blue (default)
			} else {
				moonRgb = this._isLightBackground ? '218,228,255' : '190,210,255';
			}
            root.style.setProperty('--g-rgb', moonRgb);
            root.style.setProperty('--g-op', nightOp.toFixed(3));
        } else {
            // Sun glow — warm yellow/amber via CSS radial gradient
            const dayWeatherOp = { storm: 0.06, rain: 0.10, snow: 0.16, mist: 0.12, fog: 0.12, overcast: 0.18, windy: 0.18, fair: 0.38, clear: 0.55, exceptional: 0.55 };
            const dayOp = dayWeatherOp[atm] ?? 0.45;
            root.style.setProperty('--g-rgb', '255, 235, 150');
            root.style.setProperty('--g-op', dayOp.toFixed(3));
        }

        // === SCHEME CLASSES — applied for ALL modes (used by text colors) ===
        const isDarkScheme = this._isThemeDark;
        root.classList.toggle('scheme-night', isDarkScheme);
        root.classList.toggle('scheme-day', !isDarkScheme);

        // === STANDALONE-ONLY: background gradients, weather classes, film grain ===
        if (this._config.card_style !== 'standalone') {
            if (this._prevStyleSig !== null) {
                root.classList.remove(
                    'standalone',
                    'weather-overcast', 'weather-rainy', 'weather-storm',
                    'weather-snow', 'weather-partly', 'weather-fog', 'weather-exceptional'
                );
                this._prevStyleSig = null;
            }
            return;
        }

        const styleSig = `${isDarkScheme}_${this._isTimeNight}_${atm}_${this._moonPhaseState}`;
        if (this._prevStyleSig === styleSig) return;
        this._prevStyleSig = styleSig;

        root.classList.add('standalone');
        root.classList.remove(
            'weather-overcast', 'weather-rainy', 'weather-storm',
            'weather-snow', 'weather-partly', 'weather-fog', 'weather-exceptional'
        );

        const atmosphereToClass = {
            'mist': 'weather-fog', 'fog': 'weather-fog',
            'overcast': 'weather-overcast', 'windy': 'weather-overcast',
            'fair': 'weather-partly',
            'rain': 'weather-rainy',
            'storm': 'weather-storm',
            'snow': 'weather-snow',
            'exceptional': 'weather-exceptional'
        };
        const weatherClass = atmosphereToClass[atm];
        if (weatherClass) root.classList.add(weatherClass);
    }

    // ========================================================================
    // TEXT DISPLAY
    // ========================================================================
    _updateTextElements(hass, wEntity, lang) {
        if (!wEntity) return;
        if (!this._elements?.tempText || !this._elements?.bottomText) return;

        const showText = this._config.disable_text !== true;
        const showIcon = this._config.disable_bottom_icon !== true;
        const showBottom = this._config.disable_bottom_text !== true;
        this._elements.textWrapper.style.display = showText ? '' : 'none';
        this._elements.bottomText.style.display = showBottom ? '' : 'none';

        // Top text: custom sensor (any state type) or temperature attribute
        let topVal, topUnit;
        if (this._config.top_text_sensor) {
            const s = hass.states[this._config.top_text_sensor];
            topVal = s ? s.state : 'N/A';
            topUnit = s?.attributes.unit_of_measurement || '';
        } else {
            topVal = wEntity.attributes.temperature;
            topUnit = wEntity.attributes.temperature_unit || '';
        }

        // Skip DOM write if signature unchanged
        const currentTopSig = `${topVal}_${topUnit}_${lang}`;
        if (this._lastTempStr !== currentTopSig) {
            this._lastTempStr = currentTopSig;
            let fmt = topVal;
            // Only format as number if it IS a number (sensor.date/time etc. must pass through as-is)
            const isNumeric = topVal !== null && topVal !== '' && !isNaN(parseFloat(topVal)) && isFinite(topVal);
            if (isNumeric) {
                fmt = new Intl.NumberFormat(lang, { maximumFractionDigits: 1, minimumFractionDigits: 0 }).format(topVal);
            }
            this._elements.tempText.innerHTML = `<span class="temp-val">${fmt}</span><span class="temp-unit">${topUnit}</span>`;
        }

        // Bottom text: custom sensor, wind speed, or N/A fallback
        let bottomValue, bottomUnit;
        let iconStrategy = 'static';
        let iconValue = 'mdi:alert-circle';
        let sensorObj = null;

        if (this._config.bottom_text_sensor) {
            const sensor = hass.states[this._config.bottom_text_sensor];
            if (sensor) {
                bottomValue = sensor.state;
                bottomUnit = sensor.attributes.unit_of_measurement || '';
                sensorObj = sensor;
                if (this._config.bottom_text_icon) {
                    iconValue = this._config.bottom_text_icon;
                } else {
                    iconStrategy = 'native'; // Use HA's native icon for the sensor's domain
                }
            } else {
                bottomValue = 'N/A'; bottomUnit = '';
            }
        } else {
            bottomValue = wEntity.attributes.wind_speed;
            bottomUnit = wEntity.attributes.wind_speed_unit || 'km/h';
            iconValue = this._config.bottom_text_icon || 'mdi:weather-windy';
        }

        let formattedBottom = bottomValue;
        // Only format numeric strings; prevents NaN for date/time sensors
        const isBottomNumeric = bottomValue !== null && bottomValue !== '' && !isNaN(parseFloat(bottomValue)) && isFinite(bottomValue);
        if (isBottomNumeric) {
            formattedBottom = new Intl.NumberFormat(lang, { maximumFractionDigits: 1, minimumFractionDigits: 0 }).format(bottomValue);
        }

        const currentLocSig = `${formattedBottom}_${bottomUnit}_${iconValue}_${iconStrategy}_${showIcon}`;
        if (this._lastLocStr !== currentLocSig) {
            this._lastLocStr = currentLocSig;
            let iconHtml = '';
            if (showIcon) {
                iconHtml = iconStrategy === 'native'
                    ? '<ha-state-icon></ha-state-icon>'
                    : `<ha-icon icon="${iconValue}"></ha-icon>`;
            }
            this._elements.bottomText.innerHTML = `${iconHtml}<span>${formattedBottom} ${bottomUnit}</span>`;
            if (showIcon && iconStrategy === 'native') {
                const iconEl = this._elements.bottomText.querySelector('ha-state-icon');
                if (iconEl) { iconEl.hass = hass; iconEl.stateObj = sensorObj; }
            }
        } else if (showIcon && iconStrategy === 'native') {
            const iconEl = this._elements.bottomText.querySelector('ha-state-icon');
            if (iconEl && iconEl.stateObj !== sensorObj) {
                iconEl.hass = hass; iconEl.stateObj = sensorObj;
            }
        }

        const textPos = (this._config.text_position || '').toLowerCase().trim();
        const textAlign = (this._config.text_alignment || '').toLowerCase().trim();

        const textSig = `${textPos}|${textAlign}`;

        const hMap = { left: 'text-left', right: 'text-right', center: 'text-hcenter' };
        const vMap = { top: 'align-top', center: 'align-center', bottom: 'align-bottom' };
        const allPosClasses = ['text-left', 'text-right', 'text-hcenter', 'align-spread', 'align-top', 'align-center', 'align-bottom'];

        if (textPos) {
            if (this._prevTextPosition !== textSig) {
                this._prevTextPosition = textSig;
                const w = this._elements.textWrapper;
                w.classList.remove(...allPosClasses);

                // Parse compound "vertical-horizontal" or single value
                let posH, posV;
                const parts = textPos.split('-');
                if (parts.length === 2 && vMap[parts[0]] && hMap[parts[1]]) {
                    posV = parts[0];
                    posH = parts[1];
                } else if (parts.length === 2 && hMap[parts[0]] && vMap[parts[1]]) {
                    // Allow reversed order e.g. "left-top"
                    posH = parts[0];
                    posV = parts[1];
                } else {
                    // Single value: horizontal only
                    posH = textPos;
                }

                // text_alignment overrides vertical component if explicitly set
                const resolvedV = vMap[textAlign] || vMap[posV] || 'align-spread';
                const resolvedH = hMap[posH];

                if (resolvedH) w.classList.add(resolvedH);
                w.classList.add(resolvedV);
            }
        } else {
            // Default auto behavior: text opposite the sun/moon position
            if (this._prevTextPosition !== textSig) {
                this._prevTextPosition = textSig;
                const w = this._elements.textWrapper;
                w.classList.remove('align-spread', 'align-top', 'align-center', 'align-bottom');
                w.classList.add(vMap[textAlign] || 'align-spread');
            }
            const sunPos = parseInt(this._config.sun_moon_x_position, 10);
            const isSunLeft = !isNaN(sunPos) ? sunPos >= 0 : true;
            if (this._prevSunLeft !== isSunLeft) {
                this._prevSunLeft = isSunLeft;
                const w = this._elements.textWrapper;
                w.classList.remove('text-left', 'text-right');
                w.classList.add(isSunLeft ? 'text-right' : 'text-left');
            }
        }
    }

    _updateImage(hass, isNight) {
        const baseSrc = isNight ? this._config.night : this._config.day;
        const statusSrc = this._calculateStatusImage(hass, isNight);
        const src = statusSrc || baseSrc || this._config.day || '';

        if (!this._elements?.img) return;
        const currentSrc = this._elements.img.getAttribute('src');
        if (src) {
            if (currentSrc !== src) {
                this._elements.img.style.display = 'block';
                this._elements.img.src = src;
            }
        } else if (currentSrc) {
            this._elements.img.removeAttribute('src');
            this._elements.img.style.display = 'none';
        }
    }

    _handleWeatherChange(weatherState, newParams, hasNightChanged) {
        const oldParams = this._params;
        const typeChanged = !oldParams || oldParams.type !== newParams.type;
        const stateChanged = this._lastState !== weatherState;

        this._lastState = weatherState;

        if (typeChanged || stateChanged || hasNightChanged) {
            this._params = newParams;
            this._buildRenderState();
            if (this.isConnected) {
                setTimeout(() => {
                    this._initParticles();
                    if (this._width > 0) this._lastInitWidth = this._width;
                    this._startAnimation();
                }, 0);
            }
        } else {
            this._params = newParams;
            this._buildRenderState();
        }
    }

    getCardSize() {
        return 4;
    }

    static getStubConfig() {
        return {
            weather_entity: 'weather.your_weather_entity',
            card_style: 'standalone',
            card_height: 110,
            sun_moon_x_position: -55,
            sun_moon_y_position: 55,
            top_text_sensor: 'sensor.your_custom_sensor',
            disable_text: false,
            sun_entity: 'sun.sun',
            moon_phase_entity: 'sensor.your_moon_phase_entity',
            tap_action: {
                action: 'more-info',
                entity: 'weather.your_weather_entity'
            }
        };
    }

    static getGridOptions() {
        return {
            columns: 12, rows: 3,
            min_columns: 2, min_rows: 2,
        };
    }

    // ========================================================================
    // LOGIC & STATE (Calculations, Entity Helpers, Visibility)
    // ========================================================================
    _getEntityState(hass, entityId, defaultValue = null) {
        if (!hass || !entityId) return defaultValue;
        const entity = hass.states[entityId];
        if (!entity) {
            this._trackEntityError(entityId, 'not_found');
            return defaultValue;
        }
        if (entity.state === 'unavailable' || entity.state === 'unknown') {
            this._trackEntityError(entityId, entity.state);
            return defaultValue;
        }
        this._entityErrors.delete(entityId);
        return entity;
    }

    _trackEntityError(entityId, errorType) {
        const now = Date.now();
        const existing = this._entityErrors.get(entityId);
        if (!existing || existing.type !== errorType) {
            this._entityErrors.set(entityId, { type: errorType, since: now });
            if (now - this._lastErrorLog > 60000) {
                console.warn(`HOME-CARD: Entity "${entityId}" is ${errorType}`);
                this._lastErrorLog = now;
            }
        }
    }

    _getEntityAttribute(entity, attribute, defaultValue = null) {
        if (!entity || !entity.attributes) return defaultValue;
        const value = entity.attributes[attribute];
        return value !== undefined && value !== null ? value : defaultValue;
    }
	
    /**
     * Golden Hour — warms glow, adds ambient wash, and slightly dims the blue sky.
     * Clear/fair/exceptional only. Eases in from 15° -> peaks at 2° -> fades by -6°.
     * Vars: --g-rgb, --g-op, --c-r, --gh-wash, --ambient-dim.
     */
    _applyGoldenHour(sunEntity, params) {
        if (!this._elements?.root) return;
        const root = this._elements.root;
        const atm = params?.atmosphere || '';

        // Clear all golden hour CSS vars when inactive
        const inactive = this._isTimeNight ||
            (atm !== 'clear' && atm !== 'fair' && atm !== 'exceptional');
        if (inactive) { 
            root.style.setProperty('--gh-wash', '0'); 
            root.style.setProperty('--ambient-dim', '0');
            return; 
        }

        // Intensity curve (t): 0.0 at 15°, 1.0 at 2°, 0.0 at -6°
        let t = 0;
        if (sunEntity?.attributes?.elevation !== undefined) {
            const e = parseFloat(sunEntity.attributes.elevation);
            if (e <= 15 && e > 2) { 
                // Ease-in: Starts extremely subtle at 15°, ramps up heavily near 2°
                const s = 1 - ((e - 2) / 13); 
                t = s * s; 
            }
            else if (e <= 2 && e >= -6) { 
                // Linear fade out into the night
                t = (e + 6) / 8; 
            }
        }
        
        if (t < 0.01) { 
            root.style.setProperty('--gh-wash', '0'); 
            root.style.setProperty('--ambient-dim', '0');
            return; 
        }

        // THE FIX: Allow full 100% intensity for fair/partlycloudy skies.
        // This unleashes the dramatic, colorful sunsets those weather states deserve!
        const i = Math.min(1, t);

        // 1. Color: Base yellow -> Soft sunset orange (255, 170, 50)
        root.style.setProperty('--g-rgb',
            `255, ${Math.round(235 - 65 * i)}, ${Math.round(150 - 100 * i)}`);

        // 2. Opacity: Give the sun glow an extra 25% punch at peak
        const baseOp = parseFloat(root.style.getPropertyValue('--g-op')) || 0.45;
        root.style.setProperty('--g-op', Math.min(0.95, baseOp + 0.25 * i).toFixed(3));

        // 3. Radius: Expand the sun's influence by 80% at sunset
        const cw = this._cachedDimensions.width  / (this._cachedDimensions.dpr || 1);
        const ch = this._cachedDimensions.height / (this._cachedDimensions.dpr || 1);
        if (cw > 0 && ch > 0) {
            const cel = this._getCelestialPosition(cw, ch);
            const dx = Math.max(cel.x, cw - cel.x);
            const dy = Math.max(cel.y, ch - cel.y);
            const baseR = Math.ceil(Math.sqrt(dx * dx + dy * dy) * 0.3);
            root.style.setProperty('--c-r', `${Math.round(baseR * (1 + 0.8 * i))}px`);
        }

        // 4. Evening Wash: The orange horizon gradient (peaks at 30% opacity)
        root.style.setProperty('--gh-wash', (0.30 * i).toFixed(3));

        // 5. Ambient Dimming: Subtly darkens the daytime blue sky (peaks at 18% opacity)
        // This makes the glow and wash stand out naturally without making the card pitch black
        root.style.setProperty('--ambient-dim', (0.18 * i).toFixed(3));
    }
    _getCelestialPosition(w, h) {
        const parseAxis = (raw, size, wrapNeg, fallback) => {
            if (raw === undefined) return fallback;
            const s = String(raw).trim().toLowerCase();
            if (s === 'center') return size / 2;
            const v = parseInt(s, 10);
            return isNaN(v) ? fallback : (wrapNeg && v < 0 ? size + v : v);
        };
        return {
            x: parseAxis(this._config.sun_moon_x_position, w, true, 100),
            y: parseAxis(this._config.sun_moon_y_position, h, false, 100)
        };
    }

    _calculateStatusImage(hass, isNight) {
        if (!this._hasStatusFeature) return null;
        const entityId = this._config.status_entity;
        const stateObj = this._getEntityState(hass, entityId);
        if (!stateObj || !stateObj.state) return null;
        const state = stateObj.state.toLowerCase();
        if (ACTIVE_STATES.includes(state)) {
            return isNight
                ? (this._config.status_image_night || this._config.status_image_day)
                : (this._config.status_image_day || this._config.status_image_night);
        }
        return null;
    }

    _shouldShowSun() {
        if (this._isNight) return false;
        const goodWeather = ['sunny', 'partlycloudy', 'clear-night', 'exceptional'];
        const currentWeather = (this._lastState || '').toLowerCase();
        return goodWeather.includes(currentWeather);
    }

    _handleVisibilityChange(entries) {
        const entry = entries[0];
        const wasVisible = this._isVisible;
        this._isVisible = entry.isIntersecting;
        if (this._isVisible && !wasVisible) {
            this._restoreCanvasBuffers();
            this._startAnimation();
        } else if (!this._isVisible && wasVisible) {
            this._stopAnimation();
            this._releaseCanvasBuffers();
        }
    }

    _releaseCanvasBuffers() {
        if (!this._elements) return;
        this._canvasBuffersReleased = true;
        ['bg', 'mid', 'fg'].forEach(k => {
            const canvas = this._elements[k];
            if (canvas) {
                canvas.width = 0;
                canvas.height = 0;
            }
        });
    }

    _restoreCanvasBuffers() {
        const { width, height, dpr } = this._cachedDimensions;
        if (!width || !height || !this._elements || !this._ctxs) return;
        this._canvasBuffersReleased = false;
        ['bg', 'mid', 'fg'].forEach(k => {
            const canvas = this._elements[k];
            const ctx = this._ctxs[k];
            if (!canvas || !ctx) return;
            canvas.width = width;
            canvas.height = height;
            canvas.style.width = `${width / dpr}px`;
            canvas.style.height = `${height / dpr}px`;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
        });
        const currentCSSWidth = width / dpr;
        if (this._lastInitWidth > 0 && Math.abs(currentCSSWidth - this._lastInitWidth) >= 100) {
            this._initParticles();
            this._lastInitWidth = currentCSSWidth;
        }
    }

    _handleTap(e) {
        e.stopPropagation();
        const event = new CustomEvent('hass-action', {
            bubbles: true,
            composed: true,
            detail: {
                config: this._config,
                action: 'tap',
            },
        });
        this.dispatchEvent(event);
    }

    _tryInitialize() {
        if (this._initializationComplete) return;
        if (!this._renderGate.hasFirstHass) return;
        if (!this._renderGate.hasValidDimensions) return;
        if (!this._cachedDimensions.width || !this._cachedDimensions.height) return;

        this._initializationComplete = true;

        const w = this._cachedDimensions.width / this._cachedDimensions.dpr;
        const h = this._cachedDimensions.height / this._cachedDimensions.dpr;

        this._width = w;
        this._lastInitWidth = w;

        requestAnimationFrame(() => {
            if (!this.isConnected) return;
            this._initParticles(w, h);
            this._checkRenderGate();
        });
    }

    _updateCanvasDimensions(forceW = null, forceH = null) {
        if (!this._elements?.root || !this._ctxs) return false;

        if (this._config.square && forceW === null) {
            const currentW = this._elements.root.clientWidth;
            if (currentW > 0 && Math.abs(this.clientHeight - currentW) > 1) {
                this.style.height = `${currentW}px`;
            }
        }

        let scaledWidth, scaledHeight, dpr;

        let rawW = forceW !== null ? forceW : this._elements.root.getBoundingClientRect().width;
        let rawH = forceH !== null ? forceH : this._elements.root.getBoundingClientRect().height;

        if (rawW === 0 || rawH === 0) return false;

        dpr = Math.min(window.devicePixelRatio || 1, PERFORMANCE_CONFIG.MAX_DPR);
        
        scaledWidth = rawW * dpr;
        scaledHeight = rawH * dpr;
        
        const totalPixels = scaledWidth * scaledHeight;
        if (totalPixels > PERFORMANCE_CONFIG.MAX_PIXELS) {
            const scaleDown = Math.sqrt(PERFORMANCE_CONFIG.MAX_PIXELS / totalPixels);
            scaledWidth *= scaleDown;
            scaledHeight *= scaleDown;
            dpr *= scaleDown; // Lowers internal render res while keeping physical CSS size accurate
        }

        scaledWidth = Math.floor(scaledWidth);
        scaledHeight = Math.floor(scaledHeight);

        const widthChanged = this._cachedDimensions.width !== scaledWidth;
        const dprChanged = this._cachedDimensions.dpr !== dpr;
        const heightDiff = Math.abs(this._cachedDimensions.height - scaledHeight);

        // Mobile: skip height-only changes < 150px (URL bar toggle) — let CSS stretch
        if (!widthChanged && !dprChanged && heightDiff < 150 * dpr) {
            return false;
        }

        this._cachedDimensions = { width: scaledWidth, height: scaledHeight, dpr };

        if (this._canvasBuffersReleased) {
            return false;
        }

        ['bg', 'mid', 'fg'].forEach(k => {
            const canvas = this._elements[k];
            const ctx = this._ctxs[k];
            if (!canvas || !ctx) return;
            if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
                canvas.width = scaledWidth;
                canvas.height = scaledHeight;
                if (forceW === null) {
                    canvas.style.width = `${scaledWidth / dpr}px`;
                    canvas.style.height = `${scaledHeight / dpr}px`;
                } else {
                    canvas.style.width = `${forceW}px`;
                    canvas.style.height = `${forceH}px`;
                }
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.scale(dpr, dpr);
            }
        });

        if (scaledWidth > 0 && scaledHeight > 0) {
            const cssW = scaledWidth / dpr;
            const cssH = scaledHeight / dpr;
            const celestial = this._getCelestialPosition(cssW, cssH);
            
            const dx2 = Math.max(celestial.x, cssW - celestial.x);
            const dy2 = Math.max(celestial.y, cssH - celestial.y);
            const glowRadius = Math.ceil(Math.sqrt(dx2 * dx2 + dy2 * dy2) * 0.3);
            this._elements.root.style.setProperty('--c-x', `${celestial.x}px`);
            this._elements.root.style.setProperty('--c-y', `${celestial.y}px`);
            this._elements.root.style.setProperty('--c-r', `${glowRadius}px`);

            this._renderGate.hasValidDimensions = true;
            this._checkRenderGate();
        }

        return true;
    }

    _scheduleParticleReinit() {
        this._pendingResize = true;

        if (this._resizeDebounceTimer) {
            clearTimeout(this._resizeDebounceTimer);
        }

        this._resizeDebounceTimer = setTimeout(() => {
            this._resizeDebounceTimer = null;

            if (this._lastInitWidth > 0 && this._cachedDimensions.width > 0) {
                const currentCSSWidth = this._cachedDimensions.width / this._cachedDimensions.dpr;
                const diff = Math.abs(currentCSSWidth - this._lastInitWidth);
                if (diff < 100) {
                    this._pendingResize = false;
                    return;
                }
            }

            if (this._pendingResize && this._stateInitialized) {
                this._pendingResize = false;
                if (this._elements?.root) {
                    this._lastInitWidth = this._elements.root.clientWidth;
                }
                this._initParticles();
            }
        }, PERFORMANCE_CONFIG.RESIZE_DEBOUNCE_MS);
    }

    _checkRenderGate() {
        if (this._renderGate.isRevealed) return;
        const canReveal =
            this._renderGate.hasValidDimensions &&
            this._renderGate.hasFirstHass &&
            this._stateInitialized;
        if (canReveal) {
            this._renderGate.isRevealed = true;
            requestAnimationFrame(() => {
                if (this._elements?.root) {
                    this._elements.root.classList.add('revealed');
                }
            });
        }
    }

    // ========================================================================
    // PARTICLE FACTORY
    // ========================================================================
    _initParticles(forceW = null, forceH = null) {
        if (!this._elements?.root) return;

        let w, h;
        if (forceW !== null && forceH !== null) {
            w = forceW;
            h = forceH;
        } else {
            w = this._elements.root.clientWidth;
            h = this._elements.root.clientHeight;
        }

        const p = this._params;
        if (w === 0 || h === 0 || !p) return;

        this._clearAllParticles();

        if (this._isThemeDark && this._isTimeNight && (p.type === 'stars' || p.type === 'cloud') && (p.cloud || 0) <= 5 && Math.random() < 0.04) {
            this._initAurora(w, h);
        }

        if (this._isNight && p.type === 'stars' && Math.random() < 0.001) {
            this._comets.push(this._createComet(w, h));
        }

        if (Math.random() < 0.5) {
            this._planes.push(this._createPlane(w, h));
        }

        if (p.type === 'fog' || p.foggy) {
            this._initFogBanks(w, h);
        }

        if ((p.count || 0) > 0 && p.type !== 'stars' && p.type !== 'fog') {
            this._initPrecipitation(w, h, p);
        }

        if ((p.cloud || 0) > 0) {
            this._initClouds(w, h, p);
        }

        if (this._isNight && (p.cloud || 0) < 5) {
            this._initNightClouds(w, h);
        }

        if ((p.sunCloudWarm || p.sunClouds) && !this._isNight && this._isLightBackground) {
            this._initSunClouds(w, h);
        }

        const starCount = (this._renderState && this._renderState.starMode !== 'hidden') ? (p.stars || 0) : 0;
        if (starCount > 0) {
            this._initStars(w, h, starCount);
        }

        // Wind vapor: Always spawn a fixed pool of 24 streaks.
        this._initWindVapor(w, h, 24);

        if (p.atmosphere === 'clear' || p.atmosphere === 'fair' || p.atmosphere === 'exceptional') {
            this._initDustMotes(w, h);
        }
    }

    _initAurora(w, h) {
        this._aurora = {
            phase: 0,
            waves: Array(6).fill().map((_, i) => ({
                y: h * 0.12 + i * 10,
                speed: 0.006 + Math.random() * 0.012,
                amplitude: 6 + Math.random() * 8,
                wavelength: 0.01 + Math.random() * 0.008,
                color: [
                    'rgba(80, 255, 160, 0.22)',
                    'rgba(100, 200, 255, 0.22)',
                    'rgba(180, 100, 255, 0.18)',
                    'rgba(255, 120, 200, 0.15)'
                ][Math.floor(Math.random() * 4)],
                offset: Math.random() * TWO_PI
            }))
        };
    }

    _createComet(w, h) {
        return {
            x: w * 0.15,
            y: h * 0.08,
            vx: -2.2 - Math.random() * 1.2,
            vy: 0.8 + Math.random() * 0.4,
            life: 1.0,
            tail: [],
            size: 3 + Math.random() * 2
        };
    }

    _createPlane(w, h) {
        const goingRight = Math.random() > 0.5;
        const baseSpeed = 0.6 + Math.random() * 0.5;
        const dir = goingRight ? 1 : -1;
        const climbAngle = Math.random() < 0.33
            ? (1 + Math.random() * 4) * (Math.PI / 180)
            : 0;
        return {
            x: goingRight ? -100 : w + 100,
            y: h * 0.15 + Math.random() * (h * 0.4),
            vx: dir * Math.cos(climbAngle) * baseSpeed,
            vy: -Math.sin(climbAngle) * baseSpeed,
            climbAngle: climbAngle,
            scale: 0.5 + Math.random() * 0.4,
            blinkPhase: Math.random() * 10,
            history: []
        };
    }

    _initFogBanks(w, h) {
        for (let i = 0; i < 10; i++) {
            const layer = i / 10;
            this._fogBanks.push({
                x: Math.random() * w,
                y: h - (Math.random() * (h * 0.7)),
                w: w * (1.2 + Math.random() * 0.8),
                h: 40 + Math.random() * 50,
                speed: (Math.random() * 0.15 + 0.03) * (Math.random() > 0.5 ? 1 : -1),
                opacity: this._isLightBackground
                    ? (0.35 + layer * 0.2 + Math.random() * 0.1)
                    : (0.12 + layer * 0.1 + Math.random() * 0.08),
                layer: layer,
                phase: Math.random() * TWO_PI
            });
        }
    }

    _initPrecipitation(w, h, p) {
        const count = p.count || 0;
        for (let i = 0; i < count; i++) {
            let type = p.type;
            if (p.type === 'mix') {
                type = Math.random() > 0.5 ? 'rain' : 'snow';
            } else if (p.type === 'hail') {
                type = Math.random() > 0.55 ? 'hail' : 'rain';
            }

            const z = 0.5 + Math.random();
            const particle = {
                type,
                x: Math.random() * w,
                y: Math.random() * h,
                z,
                turbulence: Math.random() * TWO_PI,
                _fadeIn: 1
            };

            if (type === 'hail') {
                Object.assign(particle, {
                    speedY: (12 + Math.random() * 8) * z,
                    size: (2 + Math.random() * 2) * z,
                    rotation: Math.random() * TWO_PI,
                    rotationSpeed: (Math.random() - 0.5) * 0.25,
                    op: this._isLightBackground ? 0.5 + Math.random() * 0.4 : 0.4 + Math.random() * 0.4
                });
            } else if (type === 'rain') {
                Object.assign(particle, {
                    speedY: (6 + Math.random() * 4) * z,
                    len: (14 + Math.random() * 14) * z,
                    op: this._isLightBackground ? 0.35 + Math.random() * 0.35 : 0.25 + Math.random() * 0.35
                });
            } else {
                // Wide size variance: tiny specks to large soft flakes
                const sizeRoll = Math.random();
                let flakeSize;
                if (sizeRoll < 0.25)      flakeSize = (0.5 + Math.random() * 0.7) * z;  // tiny specks
                else if (sizeRoll < 0.65)  flakeSize = (1.5 + Math.random() * 1.5) * z;  // medium
                else                        flakeSize = (2.8 + Math.random() * 2.7) * z;  // large soft
                Object.assign(particle, {
                    speedY: (0.4 + Math.random() * 0.8) * z * (flakeSize / 3),
                    size: flakeSize,
                    wobblePhase: Math.random() * TWO_PI,
                    wobbleSpeed: 0.02 + Math.random() * 0.02,
                    rotation: Math.random() * TWO_PI,
                    rotationSpeed: (Math.random() - 0.5) * 0.03,
                    op: 0.5 + Math.random() * 0.4
                });
            }

            if (particle.type === 'rain') this._rain.push(particle);
            else if (particle.type === 'snow') this._snow.push(particle);
            else if (particle.type === 'hail') this._hail.push(particle);
        }
    }

    _initClouds(w, h, p) {
        const isStandalone = this._config.card_style === 'standalone';
        const heightLimit  = isStandalone ? 0.75 : 0.55;
        const totalClouds  = p.cloud || 0;
        if (totalClouds <= 0) return;
        const configScale = p.scale || 1.0;
        const isStorm     = p.dark;

        // Spatial rejection: avoid stacking clouds at same position
        const placed = [];
        const tryPlace = (idealX, idealY, radius) => {
            const minSep = radius * 0.8;
            for (let attempt = 0; attempt < 5; attempt++) {
                const tx = attempt === 0 ? idealX : idealX + (Math.random() - 0.5) * w * 0.25;
                const ty = attempt === 0 ? idealY : idealY + (Math.random() - 0.5) * h * 0.12;
                let ok = true;
                for (let p = 0; p < placed.length; p++) {
                    const dx = tx - placed[p].x, dy = ty - placed[p].y;
                    const combined = minSep + placed[p].r * 0.5;
                    if (dx * dx + dy * dy < combined * combined) { ok = false; break; }
                }
                if (ok) return { x: tx, y: ty };
            }
            return { x: idealX, y: idealY };
        };

        // Gap zones: 1-2 vertical columns kept clear for sky breathing room
        const gapZones = [];
        if (!isStorm && totalClouds >= 8) {
            const numGaps = 1 + Math.floor(Math.random() * 2);
            for (let g = 0; g < numGaps; g++) {
                const center = 0.15 + Math.random() * 0.70;
                const width = 0.10 + Math.random() * 0.12;
                gapZones.push({ min: center - width / 2, max: center + width / 2 });
            }
        }

        // Horizontal Y-gap: a clear band creating visible sky between cloud layers
        const yGapCenter = h * (0.18 + Math.random() * 0.22);
        const yGapHalf = h * (0.03 + Math.random() * 0.03);
        const yGapMin = yGapCenter - yGapHalf;
        const yGapMax = yGapCenter + yGapHalf;

        const fillerCount = Math.floor(totalClouds * 0.15);
        for (let i = 0; i < fillerCount; i++) {
            const seed = Math.random() * 10000;
            this._clouds.push({
                x: Math.random() * w,
                y: Math.random() * (h * heightLimit * 0.6),
                scale: 0.35 + Math.random() * 0.25,
                speed: 0.002 + Math.random() * 0.002,
                puffs: CloudShapeGenerator.generateMixedPuffs(seed, 'stratus'),
                cloudType: 'stratus', layer: 0,
                opacity: 0.40 + Math.random() * 0.20,
                seed, breathPhase: Math.random() * TWO_PI,
                breathSpeed: 0.001, flashIntensity: 0,
                flashOriginX: 0, flashOriginY: 0
            });
        }

        const mainCount  = totalClouds - fillerCount;
        const shortCard  = Math.max(0, 1 - h / 200);
        const scaleBoost = 1 + shortCard * 0.70;

        const numAnchors = Math.max(2, Math.round(mainCount / 5));
        const anchors = [];
        for (let a = 0; a < numAnchors; a++) {
            anchors.push(w * ((a + 0.5 + (Math.random() - 0.5) * 0.7) / numAnchors));
        }
        const anchorSpread = w * (0.55 + Math.random() * 0.30);

        // Companion clouds buffer: thin stratus spawned behind larger clouds
        const companions = [];

        for (let i = 0; i < mainCount; i++) {
            const layer = 1 + (i % 4);
            const seed  = Math.random() * 10000;

            let pick    = Math.random() * anchors.length;
            const anchor = anchors[Math.floor(pick)];
            let xPos = anchor + (Math.random() - Math.random()) * anchorSpread * 0.5;

            // Enforce gap zones
            for (const gap of gapZones) {
                const gMin = gap.min * w, gMax = gap.max * w;
                if (xPos > gMin && xPos < gMax) {
                    xPos = (xPos - gMin < gMax - xPos) ? gMin - 25 : gMax + 25;
                }
            }

            let type;
            if (isStorm) {
                type = 'storm';
            } else {
                const types = CLOUD_TYPE_POOL[p.atmosphere] || CLOUD_TYPE_POOL._default;
                type = types[Math.floor(Math.random() * types.length)];
            }

            // Occasionally spawn cirrus wisps (10% chance for eligible layers)
            if (!isStorm && layer <= 2 && Math.random() < 0.10 && totalClouds >= 10) {
                type = 'cirrus';
            }

            let puffs;
            switch (type) {
                case 'storm':   puffs = CloudShapeGenerator.generateOrganicPuffs(true, seed); break;
                case 'stratus': puffs = CloudShapeGenerator.generateMixedPuffs(seed, 'stratus'); break;
                case 'cirrus':  puffs = CloudShapeGenerator.generateMixedPuffs(seed, 'cirrus'); break;
                case 'organic': puffs = CloudShapeGenerator.generateOrganicPuffs(false, seed); break;
                default:        puffs = CloudShapeGenerator.generateMixedPuffs(seed, 'cumulus'); break;
            }

            let scaleX, scaleY, radiusMod;
            switch (type) {
                case 'stratus':
                    scaleX = 1.98 + Math.random() * 0.9;
                    scaleY = 0.525 + Math.random() * 0.26;
                    radiusMod = 0.55;
                    break;
                case 'cirrus':
                    scaleX = 2.5 + Math.random() * 1.2;
                    scaleY = 0.3 + Math.random() * 0.15;
                    radiusMod = 0.6;
                    break;
                case 'organic':
                case 'storm':
                    scaleX = 0.855 + Math.random() * 0.18;
                    scaleY = 0.945 + Math.random() * 0.21;
                    radiusMod = 1.0;
                    break;
                default:
                    scaleX = 0.9 + Math.random() * 0.27;
                    scaleY = 0.84 + Math.random() * 0.315;
                    radiusMod = 0.9;
                    break;
            }

            if (puffs) {
                for (let k = 0; k < puffs.length; k++) {
                    puffs[k].offsetX *= scaleX;
                    puffs[k].offsetY *= scaleY;
                    puffs[k].rad *= radiusMod;
                }
            }

            let cloudScale;
            const sizeRoll = Math.random();
            // Layer-correlated sizing: foreground clouds (layer 3-4) tend larger,
            // background (layer 1-2) tend smaller. Creates natural depth perspective.
            const layerSizeBias = 0.85 + layer * 0.05; // 0.90 at layer 1, 1.05 at layer 4
            if (sizeRoll < 0.20)      cloudScale = (1.1  + Math.random() * 0.35) * configScale * scaleBoost * layerSizeBias;
            else if (sizeRoll < 0.65) cloudScale = (0.7  + Math.random() * 0.35) * configScale * scaleBoost * layerSizeBias;
            else                       cloudScale = (0.45 + Math.random() * 0.25) * configScale * scaleBoost * layerSizeBias;

            let yMin, yMax;
            switch (type) {
                case 'cirrus':  yMin = 0.02; yMax = 0.15; break;
                case 'stratus': yMin = 0.04; yMax = 0.30; break;
                case 'cumulus': yMin = 0.08; yMax = heightLimit - 0.08; break;
                default:        yMin = 0.06; yMax = heightLimit - 0.05; break;
            }
            let yPos = h * yMin + Math.random() * (h * yMax);
            yPos = Math.max(h * 0.02, yPos);

            // Push clouds out of horizontal Y-gap for visible sky between layers
            if (!isStorm && yPos > yGapMin && yPos < yGapMax) {
                yPos = (yPos < yGapCenter) ? yGapMin - 5 : yGapMax + 5;
            }

            // Spatial rejection: account for cloud type width.
            // Stratus/cirrus are stretched 2-3x horizontally, so their visual footprint
            // is much wider than cloudScale alone suggests.
            const typeWidthFactor = (type === 'stratus' || type === 'cirrus') ? 1.8 : 1.0;
            const vr = cloudScale * 40 * typeWidthFactor;
            const pos = tryPlace(xPos, yPos, vr);
            placed.push({ x: pos.x, y: pos.y, r: vr });

            this._clouds.push({
                x: pos.x,
                y: pos.y,
                scale: cloudScale,
                speed: (0.02 + Math.random() * 0.03) * (layer * 0.4 + 1),
                puffs, cloudType: type, layer,
                opacity: 1 - (layer * 0.12),
                seed, breathPhase: Math.random() * TWO_PI,
                breathSpeed: 0.002 + Math.random() * 0.004,
                flashIntensity: 0, flashOriginX: 0, flashOriginY: 0
            });

            // Companion stratus: spawn a thin wide cloud behind larger cumulus/organic.
            // Creates the natural "layered" look of different cloud types together.
            if (!isStorm && (type === 'cumulus' || type === 'organic') &&
                cloudScale > 0.75 * configScale && Math.random() < 0.28) {
                const cSeed = Math.random() * 10000;
                const cPuffs = CloudShapeGenerator.generateMixedPuffs(cSeed, 'stratus');
                const cScaleX = 2.2 + Math.random() * 0.8;
                const cScaleY = 0.45 + Math.random() * 0.2;
                for (let k = 0; k < cPuffs.length; k++) {
                    cPuffs[k].offsetX *= cScaleX;
                    cPuffs[k].offsetY *= cScaleY;
                    cPuffs[k].rad *= 0.5;
                }
                companions.push({
                    x: pos.x + (Math.random() - 0.5) * 60,
                    y: pos.y + (Math.random() - 0.5) * 20,
                    scale: cloudScale * (0.7 + Math.random() * 0.3),
                    speed: 0.01 + Math.random() * 0.02,
                    puffs: cPuffs, cloudType: 'stratus',
                    layer: Math.max(0, layer - 1),
                    opacity: 0.45 + Math.random() * 0.20,
                    seed: cSeed, breathPhase: Math.random() * TWO_PI,
                    breathSpeed: 0.002,
                    flashIntensity: 0, flashOriginX: 0, flashOriginY: 0
                });
            }
        }

        // Add companions to cloud list
        for (let c = 0; c < companions.length; c++) {
            this._clouds.push(companions[c]);
        }

        this._clouds.sort((a, b) => a.layer - b.layer);

        if (totalClouds > 0) {
            const scudCount = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < scudCount; i++) {
                const seed = Math.random() * 10000;
                this._fgClouds.push({
                    x: Math.random() * w,
                    y: Math.random() * (h * heightLimit) - 40,
                    scale: 0.7 + Math.random() * 0.3,
                    speed: 0.1 + Math.random() * 0.06,
                    puffs: CloudShapeGenerator.generateMixedPuffs(seed, 'cumulus'),
                    cloudType: 'scud', layer: 5,
                    opacity: 0.65,
                    seed, breathPhase: Math.random() * TWO_PI,
                    breathSpeed: 0.004,
                    flashIntensity: 0, flashOriginX: 0, flashOriginY: 0
                });
            }
        }
    }

    _initNightClouds(w, h) {
        for (let i = 0; i < 4; i++) {
            const seed = Math.random() * 10000;
            // Swapped to stratus to eliminate the "bubbly" circular clumps
            const puffs = CloudShapeGenerator.generateMixedPuffs(seed, 'stratus');
            
            this._clouds.push({
                x: Math.random() * w,
                y: Math.random() * (h * 0.35),
                scale: 0.85 + Math.random() * 0.3, // Slightly larger for better sky coverage
                speed: 0.02 + Math.random() * 0.02,
                puffs,
                cloudType: 'stratus', // Tells _drawClouds to apply the proper horizontal stretch
                layer: 4,
                opacity: 0.35,
                seed,
                breathPhase: Math.random() * TWO_PI,
                breathSpeed: 0.002,
                flashIntensity: 0,
                flashOriginX: 0,
                flashOriginY: 0
            });
        }
    }

    _initSunClouds(w, h) {
        const celestial = this._getCelestialPosition(w, h);
        const sunX = celestial.x;
        const sunY = celestial.y;
        const isExceptional = (this._params.cloud || 0) === 0;

        this._sunClouds.push({
            x: sunX,
            y: sunY,
            scale: 1.8,
            speed: 0.002,
            puffs: CloudShapeGenerator.generateWispyPuffs(Math.random() * 10000),
            opacity: 0.15,
            seed: Math.random(),
            breathPhase: 0,
            breathSpeed: 0.001,
            baseX: sunX,
            baseY: sunY,
            driftPhase: 0
        });

        for (let i = 0; i < (isExceptional ? 2 : 7); i++) {
            const spreadX = (i - 3) * 22 + (Math.random() - 0.5) * 15;
            const spreadY = 25 + Math.random() * 20;
            this._sunClouds.push({
                x: sunX + spreadX,
                y: sunY + spreadY,
                scale: 0.55 + Math.random() * 0.3,
                speed: 0.005,
                puffs: CloudShapeGenerator.generateSunEnhancementPuffs(Math.random() * 10000),
                opacity: 0.6 + Math.random() * 0.2,
                seed: Math.random(),
                breathPhase: Math.random() * TWO_PI,
                breathSpeed: 0.003,
                baseX: sunX + spreadX,
                baseY: sunY + spreadY,
                driftPhase: Math.random() * TWO_PI
            });
        }

        for (let i = 0; i < (isExceptional ? 1 : 3); i++) {
            this._sunClouds.push({
                x: sunX + (Math.random() - 0.5) * 50,
                y: sunY + 15 + (Math.random() - 0.5) * 12,
                scale: 0.7,
                speed: 0.008,
                puffs: CloudShapeGenerator.generateOrganicPuffs(false, Math.random() * 10000),
                opacity: 0.25,
                seed: Math.random(),
                breathPhase: Math.random() * TWO_PI,
                breathSpeed: 0.004,
                baseX: sunX,
                baseY: sunY + 15,
                driftPhase: i * 2
            });
        }

        for (let i = 0; i < (isExceptional ? 0 : 4); i++) {
            this._sunClouds.push({
                x: sunX + (Math.random() - 0.5) * 90,
                y: sunY - 25 - Math.random() * 25,
                scale: 0.35,
                speed: 0.01,
                puffs: CloudShapeGenerator.generateWispyPuffs(Math.random() * 10000),
                opacity: 0.3,
                seed: Math.random(),
                breathPhase: Math.random() * TWO_PI,
                breathSpeed: 0.002,
                baseX: sunX + (Math.random() - 0.5) * 90,
                baseY: sunY - 25 - Math.random() * 25,
                driftPhase: Math.random() * TWO_PI
            });
        }
    }

    _initStars(w, h, count) {
        const tier1Count = Math.floor(count * 0.70);
        const tier2Count = Math.floor(count * 0.285);
        const isGolden = this._renderState && this._renderState.starMode === 'golden';
        const palette = isGolden ? STAR_PALETTE_GOLDEN : STAR_PALETTE_GLOW;

        for (let i = 0; i < count; i++) {
            const isCluster = Math.random() < 0.3;
            let x = Math.random() * w;
            let y = Math.random() * h * 0.85;

            if (isCluster) {
                x += (Math.random() - 0.5) * 90;
                y += (Math.random() - 0.5) * 60;
            }

            const tier = i < tier1Count ? 'bg' : i < tier1Count + tier2Count ? 'mid' : 'hero';
            const tp = STAR_TIER_PROPS[tier];
            const size = tp[0] + Math.random() * tp[1];
            const brightness = tp[2] + Math.random() * tp[3];
            const twinkleSpeed = tp[4] + Math.random() * tp[5];

            const k = Math.random();
            const pc = k < palette[0][0] ? palette[0] : k > palette[1][0] ? palette[2] : palette[1];

            this._stars.push({
                x, y,
                baseSize: size,
                phase: Math.random() * TWO_PI,
                rate: twinkleSpeed,
                brightness,
                tier,
                hslH: pc[1], hslS: pc[2], hslL: pc[3]
            });
        }
    }

    _initWindVapor(w, h, count = 18) {
        for (let i = 0; i < count; i++) {
            const tier = i < Math.ceil(count * 0.33) ? 0 : i < Math.ceil(count * 0.72) ? 1 : 2;
            const depthScale = 0.5 + tier * 0.25;
            
            this._windVapor.push({
                x: Math.random() * w * 2 - w * 0.5,
                y: h * 0.05 + Math.random() * (h * 0.85),
                w: w * (0.8 + Math.random() * 0.8) * depthScale,
                speed: (1.5 + Math.random() * 2.0) * depthScale,
                tier,
                phase: Math.random() * TWO_PI,
                phaseSpeed: 0.005 + Math.random() * 0.005,
                drift: 2 + Math.random() * 4,
                gustWeight: 0.5 + Math.random() * 0.5,
                squash: 0.08 + tier * 0.04 + Math.random() * 0.02
            });
        }
    }

    _initDustMotes(w, h) {
        if (!this._shouldShowSun()) return;
        const celestial = this._getCelestialPosition(w, h);
        const count = Math.min(LIMITS.MAX_DUST, 30);
        for (let i = 0; i < count; i++) {
            const spreadX = (Math.random() - 0.5) * 300;
            const spreadY = (Math.random() - 0.5) * 150;
            this._dustMotes.push({
                x: celestial.x + spreadX,
                y: celestial.y + spreadY,
                size: 0.5 + Math.random() * 1.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.2,
                phase: Math.random() * TWO_PI,
                opacity: 0.15 + Math.random() * 0.25
            });
        }
    }

    _createBolt(w, h) {
        const x = Math.random() * (w * 0.7) + (w * 0.15);
        const segments = [];
        let curX = x;
        let curY = 0;
        let iter = 0;

        // Diagonal bias for the entire strike
        const mainBias = (Math.random() - 0.5) * 15;

        while (curY < h && iter < 80) {
            const nextY = curY + 12 + Math.random() * 20;
            const nextX = curX + mainBias + (Math.random() * 30 - 15);
            
            segments.push({ x: curX, y: curY, nx: nextX, ny: nextY, branch: false });
            
            if (Math.random() < 0.18 && curY > 20) {
                const branchDir = Math.random() > 0.5 ? 1 : -1;
                segments.push({
                    x: curX,
                    y: curY,
                    nx: curX + branchDir * (15 + Math.random() * 30),
                    ny: curY + 15 + Math.random() * 25,
                    branch: true
                });
            }
            curX = nextX;
            curY = nextY;
            iter++;
        }

        return { segments, life: 1.0, alpha: 1.0, glow: 1.0 };
    }

    // ========================================================================
    // RENDERING — DRAWING HELPERS
    // ========================================================================

    _drawSunClouds(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.clouds;
        if (fadeOpacity <= 0) return;

        for (let i = 0; i < this._sunClouds.length; i++) {
            const cloud = this._sunClouds[i];
            cloud.driftPhase += 0.008;
            cloud.breathPhase += cloud.breathSpeed;
            const driftX = Math.sin(cloud.driftPhase) * 12;
            const driftY = Math.cos(cloud.driftPhase * 0.7) * 4;
            cloud.x = cloud.baseX + driftX + effectiveWind * 0.3;
            cloud.y = cloud.baseY + driftY;
            if (cloud.x > cloud.baseX + 60) cloud.x = cloud.baseX + 60;
            if (cloud.x < cloud.baseX - 60) cloud.x = cloud.baseX - 60;
            const breathScale = 1 + Math.sin(cloud.breathPhase) * 0.02;

            ctx.save();
            ctx.translate(cloud.x, cloud.y);
            ctx.scale(cloud.scale * breathScale, cloud.scale * 0.55 * breathScale);

            const puffs = cloud.puffs;
            const len = puffs.length;
            const warm = this._renderState.sunCloudWarm;

            for (let j = 0; j < len; j++) {
                const puff = puffs[j];

                // Cache gradient at full opacity; fadeOpacity via globalAlpha
                // for transition compatibility. Wiped by _initParticles.
                if (!puff._g) {
                    const baseOp = cloud.opacity * puff.shade;
                    const grad = ctx.createRadialGradient(
                        puff.offsetX - puff.rad * 0.35, puff.offsetY - puff.rad * 0.45, 0,
                        puff.offsetX, puff.offsetY, puff.rad
                    );
                    if (warm) {
                        grad.addColorStop(0, `rgba(255,255,250,${baseOp})`);
                        grad.addColorStop(0.3, `rgba(255,245,225,${baseOp * 0.9})`);
                        grad.addColorStop(0.6, `rgba(250,235,200,${baseOp * 0.75})`);
                        grad.addColorStop(0.85, `rgba(240,220,180,${baseOp * 0.5})`);
                        grad.addColorStop(1, 'rgba(235,210,160,0)');
                    } else {
                        grad.addColorStop(0, `rgba(240,243,250,${baseOp})`);
                        grad.addColorStop(0.3, `rgba(220,225,238,${baseOp * 0.9})`);
                        grad.addColorStop(0.6, `rgba(200,208,225,${baseOp * 0.75})`);
                        grad.addColorStop(0.85, `rgba(180,190,212,${baseOp * 0.5})`);
                        grad.addColorStop(1, 'rgba(165,178,200,0)');
                    }
                    puff._g = grad;
                }

                ctx.globalAlpha = fadeOpacity;
                ctx.fillStyle = puff._g;
                fillCircle(ctx, puff.offsetX, puff.offsetY, puff.rad);
                ctx.globalAlpha = 1;
            }

            ctx.restore();
        }
    }

    _drawSunGlow(ctx, w, h) {
        const fadeOpacity = this._layerFadeProgress.effects;
        const celestial = this._getCelestialPosition(w, h);
        const centerX = celestial.x;
        const centerY = celestial.y;

        ctx.save();

        if (!this._isLightBackground) {
            const pulse = Math.sin(this._sunPulsePhase * 0.4) * 0.02 + 0.98;
            const sunBaseR = this._celestialSize ? this._celestialSize / 2 : 26;
            const sunGlowScale = sunBaseR / 26;
            ctx.globalCompositeOperation = 'source-over';

            // Outer glow ring
            ctx.fillStyle = `rgba(255,180,40,${0.12 * fadeOpacity})`;
            fillCircle(ctx, centerX, centerY, (sunBaseR + 3.6 * sunGlowScale) * pulse);

            // Gradient cached at base radius; pulse applied via ctx.scale.
            // Invalidate when radius changes (dynamic sun_moon_size edits).
            if (!this._sunBodyGradDark || this._sunBodyGradDarkR !== sunBaseR) {
                const g = ctx.createRadialGradient(
                    -sunBaseR * 0.35, -sunBaseR * 0.35, 0,
                    0, 0, sunBaseR
                );
                g.addColorStop(0.0, 'rgba(255,255,220,1)');
                g.addColorStop(0.4, 'rgba(255,210,60,1)');
                g.addColorStop(1.0, 'rgba(255,130,0,1)');
                this._sunBodyGradDark = g;
                this._sunBodyGradDarkR = sunBaseR;
            }

            ctx.globalAlpha = fadeOpacity;
            ctx.translate(centerX, centerY);
            ctx.scale(pulse, pulse);
            ctx.fillStyle = this._sunBodyGradDark;
            fillCircle(ctx, 0, 0, sunBaseR);

            ctx.lineWidth = 1.5 / pulse;
            ctx.strokeStyle = `rgba(255,230,180,${0.6})`;
            ctx.stroke();

            ctx.restore();
            return;
        }

        const pulse = Math.sin(this._sunPulsePhase * 0.4) * 0.04 + 0.96;
        const sunBaseR = this._celestialSize ? this._celestialSize / 2 : 26;

        // Light bg disc gradient cached at base radius.
        // Stops tuned so the visible body (alpha ≥ 0.6) extends to ~1.0×sunBaseR
        // while the soft halo fades beyond it to 1.76×sunBaseR.
        // Invalidate when radius changes (dynamic sun_moon_size edits).
        if (!this._sunDiscGradLight || this._sunDiscGradLightR !== sunBaseR) {
            const g = ctx.createRadialGradient(
                -sunBaseR * 0.20, -sunBaseR * 0.22, 0,
                0, 0, sunBaseR * 1.76
            );
            g.addColorStop(0.00, 'rgba(255,255,238,0.95)');
            g.addColorStop(0.34, 'rgba(255,245,185,0.92)');
            g.addColorStop(0.57, 'rgba(255,218,100,0.70)');
            g.addColorStop(0.80, 'rgba(255,185,48,0.18)');
            g.addColorStop(1.00, 'rgba(255,160,30,0)');
            this._sunDiscGradLight = g;
            this._sunDiscGradLightR = sunBaseR;
        }

        ctx.globalAlpha = fadeOpacity;
        ctx.translate(centerX, centerY);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = this._sunDiscGradLight;
        fillCircle(ctx, 0, 0, sunBaseR * 1.76);

        ctx.restore();
    }

    _shouldShowCloudySun() {
        if (this._isNight && this._isThemeDark) return false;
        const currentState = (this._lastState || '').toLowerCase();
        if (this._isThemeDark && currentState === 'cloudy') return false;

        const p = this._params;
        const isBad = p.dark || ['rain', 'hail', 'lightning', 'pouring', 'snowy', 'snowy-rainy'].includes(p.type);
        const overcastTypes = ['cloudy', 'windy', 'windy-variant', 'fog'];
        
        return overcastTypes.includes(currentState) && !isBad;
    }

    _drawCloudySun(ctx, w, h) {
        const fadeOpacity = this._layerFadeProgress.effects;
        const celestial = this._getCelestialPosition(w, h);

        ctx.save();

        if (this._isThemeDark) {
            ctx.globalCompositeOperation = 'source-over';
            const pulse = Math.sin(this._sunPulsePhase * 0.4) * 0.02 + 0.98;
            const sunBaseR = this._celestialSize ? this._celestialSize / 2 : 26;
            const sunGlowScale = sunBaseR / 26;

            // Outer glow ring — cheap flat fill
            ctx.fillStyle = `rgba(255,180,40,${0.12 * fadeOpacity})`;
            fillCircle(ctx, celestial.x, celestial.y, (sunBaseR + 4 * sunGlowScale) * pulse);

            // Sun body — cache gradient at base size, scale for pulse.
            // Invalidate when radius changes (dynamic sun_moon_size edits).
            if (!this._cloudySunGradDark || this._cloudySunGradDarkR !== sunBaseR) {
                const g = ctx.createRadialGradient(
                    -sunBaseR * 0.35, -sunBaseR * 0.35, 0,
                    0, 0, sunBaseR
                );
                g.addColorStop(0.0, 'rgba(255,255,220,1)');
                g.addColorStop(0.4, 'rgba(255,210,60,1)');
                g.addColorStop(1.0, 'rgba(255,130,0,1)');
                this._cloudySunGradDark = g;
                this._cloudySunGradDarkR = sunBaseR;
            }

            ctx.globalAlpha = fadeOpacity;
            ctx.translate(celestial.x, celestial.y);
            ctx.scale(pulse, pulse);
            ctx.fillStyle = this._cloudySunGradDark;
            fillCircle(ctx, 0, 0, sunBaseR);

            ctx.lineWidth = 1.5 / pulse;
            ctx.strokeStyle = 'rgba(255,230,180,0.6)';
            ctx.stroke();

            ctx.restore();
            return;
        }

        ctx.globalCompositeOperation = 'overlay';
        const isMoon = this._isNight;
        const c1 = isMoon ? '240,245,255' : '255,255,240';
        const c2 = isMoon ? '220,230,250' : '255,245,210';
        const c3 = isMoon ? '210,220,240' : '255,245,220';
        const cCore = isMoon ? '200,220,255' : '255,220,100';

        const sunBaseR = this._celestialSize ? this._celestialSize / 2 : 26;
        const csGlowScale = sunBaseR / 26;
        const outerR = 112 * csGlowScale;
        const coreR  = 36 * csGlowScale;

        // Cache outer and core gradients at local (0,0). Colors are fixed
        // per night/day mode; _buildRenderState handles state transitions.
        // fadeOpacity applied via globalAlpha.
        // Invalidate when radius changes (sr tracks sunBaseR).
        const cacheKey = isMoon ? '_csGlowMoon' : '_csGlowDay';
        if (!this[cacheKey] || this[cacheKey].sr !== sunBaseR) {
            const g = ctx.createRadialGradient(0, 0, 0, 0, 0, outerR);
            g.addColorStop(0,   `rgba(${c1},0.7)`);
            g.addColorStop(0.4, `rgba(${c2},0.4)`);
            g.addColorStop(1,   `rgba(${c3},0)`);

            const core = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
            core.addColorStop(0, `rgba(${cCore},0.35)`);
            core.addColorStop(1, `rgba(${c1},0)`);

            this[cacheKey] = { outer: g, core: core, outerR, coreR, sr: sunBaseR };
        }

        const cached = this[cacheKey];
        ctx.globalAlpha = fadeOpacity;
        ctx.translate(celestial.x, celestial.y);

        ctx.fillStyle = cached.outer;
        fillCircle(ctx, 0, 0, cached.outerR);

        ctx.fillStyle = cached.core;
        fillCircle(ctx, 0, 0, cached.coreR);

        ctx.restore();
    }

    _drawClouds(ctx, cloudList, w, h, effectiveWind, globalOpacity) {
        if (cloudList.length === 0) return;
        const fadeOpacity = this._layerFadeProgress.clouds;
        if (fadeOpacity <= 0) return;

        const rs = this._renderState;
        if (!rs) return;

        const isStormy = rs.isStormy;

        if (isStormy && cloudList.length > 0 && Math.random() < 0.036) {
            // Zero-allocation cloud selection: try 5 random indices for a good candidate,
            // fall back to any random cloud if none qualify.
            let target = null;
            const len = cloudList.length;
            for (let attempt = 0; attempt < 5; attempt++) {
                const c = cloudList[Math.floor(Math.random() * len)];
                if (c.layer >= 1 && c.puffs && c.puffs.length > 5) {
                    target = c;
                    break;
                }
            }
            if (!target) target = cloudList[Math.floor(Math.random() * len)];
            target.flashIntensity = 1.0;
            if (target.puffs && target.puffs.length > 0) {
                const originPuff = target.puffs[Math.floor(Math.random() * target.puffs.length)];
                target.flashOriginX = originPuff.offsetX;
                target.flashOriginY = originPuff.offsetY;
            }
        }

        const cp = rs.cp;
        const { litR, litG, litB, midR, midG, midB, shadowR, shadowG, shadowB,
                flashLitR, flashLitG, flashLitB,
                flashMidR, flashMidG, flashMidB,
                flashShadowR, flashShadowG, flashShadowB,
                ambient, highlightOffsetBase, hOffset, rainyOpacityMul } = cp;

        const isLightBg = this._isLightBackground;
        const isThemeDark = this._isThemeDark;
        const isTimeNight = this._isTimeNight;

        for (let i = 0; i < cloudList.length; i++) {
            const cloud = cloudList[i];

            if (cloud.flashIntensity > 0.005) {
                cloud.flashIntensity *= 0.93;
            } else {
                cloud.flashIntensity = 0;
            }

            const fi = cloud.flashIntensity;
            const hasFlash = fi > 0.005;

            const depthFactor = 1 + cloud.layer * 0.2;
            cloud.x += cloud.speed * effectiveWind * depthFactor;
            if (cloud.x > w + 280) cloud.x = -280;
            if (cloud.x < -280) cloud.x = w + 280;

            cloud.breathPhase += cloud.breathSpeed;
            const breathScale = 1 + Math.sin(cloud.breathPhase) * 0.015;

            ctx.save();
            ctx.translate(cloud.x, cloud.y - (h * 0.06));
            const vScale = this._params?.dark ? 0.40 : 0.55;
            const hStretch = cloud.cloudType === 'cirrus' ? 1.4 : 1.0;
            const vCompress = cloud.cloudType === 'cirrus' ? 0.7 : 1.0;
            ctx.scale(cloud.scale * breathScale * hStretch, cloud.scale * vScale * breathScale * vCompress);

            const puffs = cloud.puffs;
            const len = puffs.length;
            const layerHighlightOffset = (cloud.layer === 5 && !isThemeDark) ? 0.50 : highlightOffsetBase;

            let maxPuffDist = 1;
            if (hasFlash) {
                for (let j = 0; j < len; j++) {
                    const pdx = puffs[j].offsetX - cloud.flashOriginX;
                    const pdy = puffs[j].offsetY - cloud.flashOriginY;
                    const d = Math.sqrt(pdx * pdx + pdy * pdy);
                    if (d > maxPuffDist) maxPuffDist = d;
                }
            }

            for (let j = 0; j < len; j++) {
                const puff = puffs[j];
                const flowSpeed = cloud.breathPhase * 0.7;
                const noiseX = Math.sin(flowSpeed + j * 0.5) * (puff.rad * 0.1);
                const noiseY = Math.cos(flowSpeed * 0.8 + j * 0.3) * (puff.rad * 0.05);
                const drawX = puff.offsetX + noiseX;
                const drawY = puff.offsetY + noiseY;

                // ── HOT PATH: 99%+ of frames ──
                // Cached gradient at local (0,0), repositioned via translate.
                // fadeOpacity applied via globalAlpha (handles transitions).
                // Flash is the only mid-lifetime override — builds ephemeral
                // gradient without touching puff._g. Baseline resumes instantly.
                if (!hasFlash && puff._g) {
                    ctx.globalAlpha = fadeOpacity;
                    ctx.translate(drawX, drawY);
                    ctx.fillStyle = puff._g;
                    fillCircle(ctx, 0, 0, puff.rad);
                    ctx.translate(-drawX, -drawY);
                    ctx.globalAlpha = 1;
                    continue;
                }

                // ── COLD PATH: first render OR active lightning flash ──
                const normalizedY = (puff.offsetY + 50) / 100;
                const shadeFactor = Math.max(0.24, 1 - normalizedY * 0.60);
                const invShade = 1 - shadeFactor;

                let r = (litR * shadeFactor + shadowR * invShade) | 0;
                let g = (litG * shadeFactor + shadowG * invShade) | 0;
                let b = (litB * shadeFactor + shadowB * invShade) | 0;

                let useMidR = midR, useMidG = midG, useMidB = midB;
                let useShadowR = shadowR, useShadowG = shadowG, useShadowB = shadowB;
                let puffAmbientBoost = 1.0;

                if (hasFlash) {
                    const pdx = puff.offsetX - cloud.flashOriginX;
                    const pdy = puff.offsetY - cloud.flashOriginY;
                    const dist = Math.sqrt(pdx * pdx + pdy * pdy);
                    const normDist = dist / maxPuffDist;
                    const falloff = Math.exp(-3.0 * normDist);
                    const puffFi = fi * falloff;

                    const fLitR = litR + (flashLitR - litR) * puffFi;
                    const fLitG = litG + (flashLitG - litG) * puffFi;
                    const fLitB = litB + (flashLitB - litB) * puffFi;

                    r = (fLitR * shadeFactor + (shadowR + (flashShadowR - shadowR) * puffFi) * invShade) | 0;
                    g = (fLitG * shadeFactor + (shadowG + (flashShadowG - shadowG) * puffFi) * invShade) | 0;
                    b = (fLitB * shadeFactor + (shadowB + (flashShadowB - shadowB) * puffFi) * invShade) | 0;

                    useMidR = midR + (flashMidR - midR) * puffFi;
                    useMidG = midG + (flashMidG - midG) * puffFi;
                    useMidB = midB + (flashMidB - midB) * puffFi;
                    useShadowR = shadowR + (flashShadowR - shadowR) * puffFi;
                    useShadowG = shadowG + (flashShadowG - shadowG) * puffFi;
                    useShadowB = shadowB + (flashShadowB - shadowB) * puffFi;

                    puffAmbientBoost = 1.0 + puffFi * 0.5;
                }

                let finalOpacity = (globalOpacity * cloud.opacity * ambient * puffAmbientBoost) * puff.shade;

                if (rainyOpacityMul !== 1.0) {
                    finalOpacity = Math.min(1.0, finalOpacity * rainyOpacityMul);
                }

                let dR=r, dG=g, dB=b;
                let dMidR=useMidR, dMidG=useMidG, dMidB=useMidB;
                let dShadR=useShadowR, dShadG=useShadowG, dShadB=useShadowB;

                if (isThemeDark && finalOpacity < 0.20) {
                    if (isTimeNight) {
                        finalOpacity = Math.min(1.0, finalOpacity * 2.5);
                        const dim = 0.40;
                        dR *= dim; dG *= dim; dB *= dim;
                        dMidR *= dim; dMidG *= dim; dMidB *= dim;
                        dShadR *= dim; dShadG *= dim; dShadB *= dim;
                    } else {
                        finalOpacity = finalOpacity * (finalOpacity / 0.20); 
                    }
                }

                if (isThemeDark && !isTimeNight && (cloud.cloudType === 'stratus' || cloud.cloudType === 'cirrus')) {
                    finalOpacity *= cloud.cloudType === 'cirrus' ? 0.32 : 0.28;
                    if (finalOpacity < 0.005) continue;
                }

                if (finalOpacity < 0.005) continue;

                // Gradient at LOCAL (0,0) coords. ctx.translate positions it.
                const grad = ctx.createRadialGradient(
                    -puff.rad * hOffset,
                    -puff.rad * layerHighlightOffset,
                    0,
                    0, 0,
                    puff.rad
                );

                const midStop = 0.28 + puff.softness * 0.28;
                grad.addColorStop(0,       `rgba(${dR|0},${dG|0},${dB|0},${finalOpacity})`);
                grad.addColorStop(midStop, `rgba(${dMidR|0},${dMidG|0},${dMidB|0},${finalOpacity * 0.85})`);
                if (isLightBg) {
                    grad.addColorStop(1.0, `rgba(${dShadR|0},${dShadG|0},${dShadB|0},0)`);
                } else {
                    grad.addColorStop(0.68, `rgba(${dShadR|0},${dShadG|0},${dShadB|0},${finalOpacity * 0.25})`);
                    grad.addColorStop(0.88, `rgba(${dShadR|0},${dShadG|0},${dShadB|0},0)`);
                }

                // Cache baseline gradients; flash gradients are ephemeral
                if (!hasFlash) {
                    puff._g = grad;
                }

                ctx.globalAlpha = fadeOpacity;
                ctx.translate(drawX, drawY);
                ctx.fillStyle = grad;
                fillCircle(ctx, 0, 0, puff.rad);
                ctx.translate(-drawX, -drawY);
                ctx.globalAlpha = 1;
            }

            ctx.restore();
        }
    }

    _drawRain(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.precipitation;
        if (fadeOpacity <= 0) return;

        const isDay = this._isLightBackground;
        const rgbBase = this._renderState.rainRgb;
        const len = this._rain.length;

        // Gradient lies on the negative X-axis. 
        // 0 is the head (bottom) of the drop, -1 is the tail (top) of the drop.
        if (!this._rainGrad || this._rainGradRgb !== rgbBase) {
            const g = ctx.createLinearGradient(0, 0, -1, 0);
            g.addColorStop(0,   `rgba(${rgbBase}, 0.85)`); // Head (opaque water bead)
            g.addColorStop(0.5, `rgba(${rgbBase}, 0.2)`);  // Mid body
            g.addColorStop(1,   `rgba(${rgbBase}, 0)`);    // Tail (motion blur fade)
            this._rainGrad = g;
            this._rainGradRgb = rgbBase;
        }

        const rainGrad = this._rainGrad;

        for (let i = 0; i < len; i++) {
            const pt = this._rain[i];
            pt.turbulence += 0.025;
            const turbX = Math.sin(pt.turbulence) * 0.4;
            
            const speedFactor = (1 + this._windSpeed * 0.25) * (pt.z * 0.8 + 0.2);
            const moveX = (effectiveWind * 1.8 + turbX);
            const moveY = (pt.speedY * speedFactor);

            pt.x += moveX;
            pt.y += moveY;

            if (pt.y > h + 10) {
                pt.y = -40 - (Math.random() * 20);
                pt.x = Math.random() * w;
            }
            if (pt.x > w + 20) pt.x = -20;
            else if (pt.x < -20) pt.x = w + 20;

            const baseOp = isDay ? 0.75 : 0.60;
            const finalOp = (pt.z * baseOp) * fadeOpacity * pt.op;

            if (finalOp < 0.02) continue;
            const dropLen = pt.len * (1.0 + (this._windSpeed * 0.3));
            const width = Math.max(0.6, pt.z * 1.2); 

            ctx.save();
            
            // 1. Move origin exactly to the HEAD of the drop
            ctx.translate(pt.x, pt.y);
            
            // 2.  Rotate X-axis to point perfectly along the velocity vector
            ctx.rotate(Math.atan2(moveY, moveX)); 
            
            // 3. Stretch the X-axis to the physical length of the drop
            ctx.scale(dropLen, 1);
            
            ctx.globalAlpha = finalOp;
            ctx.lineWidth = width;
            ctx.lineCap = 'butt'; // Keeps tips from turning into laser blobs
            
            ctx.strokeStyle = rainGrad;
            ctx.beginPath();
            // 4. Draw backwards from the head (0,0) to the tail (-1,0)
            ctx.moveTo(0, 0);
            ctx.lineTo(-1, 0);
            ctx.stroke();
            
            ctx.restore();
        }
    }

    _drawSnow(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.precipitation;
        if (fadeOpacity <= 0) return;
        const len = this._snow.length;
        const isLight = this._isLightBackground;

        for (let i = 0; i < len; i++) {
            const pt = this._snow[i];
            pt.wobblePhase += pt.wobbleSpeed;
            const wobble = Math.sin(pt.wobblePhase) * 1.5;
            pt.turbulence += 0.01;
            const turbX = Math.sin(pt.turbulence) * 0.5;
            pt.y += pt.speedY;
            pt.x += wobble + turbX + effectiveWind * 0.8;

            if (pt.y > h + 5) {
                pt.y = -5;
                pt.x = Math.random() * w;
            }
            if (pt.x > w + 10) pt.x = -10;
            else if (pt.x < -10) pt.x = w + 10;

            const shimmer = 0.92 + Math.sin(pt.wobblePhase * 2.5) * 0.08;
            const glimmer = 0.8 + Math.sin(pt.wobblePhase * 3) * 0.2;
            const finalOpacity = pt.op * fadeOpacity * glimmer;
            const drawSize = pt.size * shimmer;

            if (pt.z > 0.7) {
                // Foreground flakes: cached gradient at (0,0) radius 1.
                // Scale handles size, globalAlpha handles opacity.
                if (!pt._g) {
                    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
                    if (isLight) {
                        g.addColorStop(0,   'rgba(255,255,255,1)');
                        g.addColorStop(0.5, 'rgba(255,255,255,0.786)');
                        g.addColorStop(1,   'rgba(255,255,255,0)');
                        pt._gMul = 1.4;  // opacity multiplier
                        pt._gRad = 0.9;  // radius factor
                    } else {
                        g.addColorStop(0,   'rgba(255,255,255,1)');
                        g.addColorStop(0.5, 'rgba(255,255,255,0.55)');
                        g.addColorStop(1,   'rgba(255,255,255,0)');
                        pt._gMul = 1.0;
                        pt._gRad = 1.5;
                    }
                    pt._g = g;
                }
                const r = drawSize * pt._gRad;
                ctx.save();
                ctx.translate(pt.x, pt.y);
                ctx.scale(r, r);
                ctx.globalAlpha = Math.min(1, finalOpacity * pt._gMul);
                ctx.fillStyle = pt._g;
                fillCircle(ctx, 0, 0, 1);
                ctx.restore();
            } else {
                // Background flakes: tiny soft dots
                const smallR = drawSize * 0.75;
                if (isLight) {
                    if (!pt._g) {
                        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
                        g.addColorStop(0, 'rgba(255,255,255,1)');
                        g.addColorStop(1, 'rgba(255,255,255,0)');
                        pt._g = g;
                    }
                    ctx.save();
                    ctx.translate(pt.x, pt.y);
                    ctx.scale(smallR, smallR);
                    ctx.globalAlpha = Math.min(1, finalOpacity * 1.3);
                    ctx.fillStyle = pt._g;
                    fillCircle(ctx, 0, 0, 1);
                    ctx.restore();
                } else {
                    ctx.fillStyle = `rgba(255,255,255,${Math.min(1, finalOpacity * 0.8)})`;
                    fillCircle(ctx, pt.x, pt.y, smallR);
                }
            }
        }
    }

    _drawHail(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.precipitation;
        if (fadeOpacity <= 0) return;
        const len = this._hail.length;
        const isLight = this._isLightBackground;

        for (let i = 0; i < len; i++) {
            const pt = this._hail[i];
            pt.turbulence += 0.035;
            const turbX = Math.sin(pt.turbulence) * 1.2;
            pt.y += pt.speedY * (1 + this._windSpeed * 0.35);
            pt.x += effectiveWind * 2.5 + turbX;
            pt.rotation += pt.rotationSpeed;

            if (pt.y > h + 10) {
                pt.y = -15 - (Math.random() * 20);
                pt.x = Math.random() * w;
            }

            ctx.save();
            ctx.translate(pt.x, pt.y);
            ctx.rotate(pt.rotation);

            // Cache gradient; theme-fixed colors. Wiped by _initParticles.
            if (!pt._g) {
                const iceGradient = ctx.createRadialGradient(0, -pt.size * 0.3, 0, 0, 0, pt.size);
                const baseOp = pt.z > 1.1 ? pt.op * 1.1 : pt.op * 0.75;
                if (isLight) {
                    iceGradient.addColorStop(0, `rgba(240,250,255,${baseOp})`);
                    iceGradient.addColorStop(0.5, `rgba(210,230,250,${baseOp * 0.85})`);
                    iceGradient.addColorStop(1, `rgba(170,200,240,${baseOp * 0.5})`);
                } else {
                    iceGradient.addColorStop(0, `rgba(255,255,255,${baseOp})`);
                    iceGradient.addColorStop(0.5, `rgba(230,245,255,${baseOp * 0.85})`);
                    iceGradient.addColorStop(1, `rgba(200,225,250,${baseOp * 0.5})`);
                }
                pt._g = iceGradient;
            }

            ctx.globalAlpha = fadeOpacity;
            ctx.fillStyle = pt._g;
            ctx.beginPath();
            for (let j = 0; j < 6; j++) {
                const angle = (TWO_PI * j) / 6;
                const x = Math.cos(angle) * pt.size;
                const y = Math.sin(angle) * pt.size;
                if (j === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();

            if (pt.z > 1.05) {
                const highlightOp = (pt.z > 1.1 ? pt.op * 1.1 : pt.op * 0.75) * 0.4;
                ctx.fillStyle = `rgba(255,255,255,${highlightOp})`;
                fillCircle(ctx, -pt.size * 0.3, -pt.size * 0.3, pt.size * 0.3);
            }

            ctx.globalAlpha = 1;
            ctx.restore();
        }
    }

    _drawLightning(ctx, w, h) {
        if (!this._params?.thunder) return;
        const fadeOpacity = this._layerFadeProgress.effects;

        if (Math.random() < 0.0084 && this._bolts.length < LIMITS.MAX_BOLTS) {
            this._flashOpacity = 0.92;
            this._flashHold = this._isLightBackground ? 4 : 2;
            this._bolts.push(this._createBolt(w, h));
        }

        // Inter-flash storm darkness — persistent brooding veil between flashes
        if (!this._isLightBackground) {
            ctx.save();
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = `rgba(0, 0, 10, ${0.18 * fadeOpacity})`;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }

        if (this._flashOpacity > 0) {
            if (this._flashHold > 0) {
                this._flashHold--;
            } else {
                this._flashOpacity *= this._isLightBackground ? 0.78 : 0.65;
            }
            ctx.save();
            ctx.globalCompositeOperation = this._isThemeDark ? 'screen' : 'source-over';
            const flashColor = this._isLightBackground
                ? `rgba(200, 210, 230, ${this._flashOpacity * fadeOpacity * 0.65})`
                : `rgba(220, 235, 255, ${this._flashOpacity * fadeOpacity * 0.85})`;
            ctx.fillStyle = flashColor;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
            if (this._flashOpacity < 0.005) this._flashOpacity = 0;
        }

        if (this._bolts.length > 0) {
            ctx.save();
            ctx.globalCompositeOperation = this._isThemeDark ? 'lighter' : 'source-over';

            for (let i = this._bolts.length - 1; i >= 0; i--) {
                const bolt = this._bolts[i];

                ctx.strokeStyle = `rgba(160, 190, 255, ${bolt.alpha * 0.35 * fadeOpacity})`;
                ctx.lineWidth = 8;
                ctx.shadowBlur = 20;
                ctx.shadowColor = `rgba(180, 210, 255, ${bolt.glow * fadeOpacity})`;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                ctx.beginPath();
                for (const seg of bolt.segments) {
                    if (!seg.branch) {
                        if (seg.y === 0) ctx.moveTo(seg.x, seg.y);
                        ctx.lineTo(seg.nx, seg.ny);
                    }
                }
                ctx.stroke();

                ctx.strokeStyle = `rgba(255, 255, 255, ${bolt.alpha * fadeOpacity})`;
                ctx.lineWidth = 2.5;
                ctx.shadowBlur = 8;
                ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';

                ctx.beginPath();
                for (const seg of bolt.segments) {
                    if (!seg.branch) {
                        if (seg.y === 0) ctx.moveTo(seg.x, seg.y);
                        ctx.lineTo(seg.nx, seg.ny);
                    }
                }
                ctx.stroke();

                ctx.strokeStyle = `rgba(200, 220, 255, ${bolt.alpha * 0.6 * fadeOpacity})`;
                ctx.lineWidth = 1.5;
                for (const seg of bolt.segments) {
                    if (seg.branch) {
                        ctx.beginPath();
                        ctx.moveTo(seg.x, seg.y);
                        ctx.lineTo(seg.nx, seg.ny);
                        ctx.stroke();
                    }
                }

                bolt.alpha -= 0.1;
                bolt.glow -= 0.15;
                if (bolt.alpha <= 0) this._bolts.splice(i, 1);
            }

            ctx.shadowBlur = 0;
            ctx.restore();
        }
    }

    _drawAurora(ctx, w, h) {
        if (!this._aurora) return;
        const fadeOpacity = this._layerFadeProgress.effects;
        this._aurora.phase += 0.006;

        ctx.save();
        ctx.globalCompositeOperation = this._isThemeDark ? 'lighter' : 'source-over';
        ctx.globalAlpha = fadeOpacity;

        for (const wave of this._aurora.waves) {
            // Cached on wave object; destroyed with wave by _initParticles
            if (!wave._g) {
                const g = ctx.createLinearGradient(0, wave.y - 20, 0, wave.y + 50);
                g.addColorStop(0, 'rgba(0, 0, 0, 0)');
                g.addColorStop(0.3, wave.color);
                g.addColorStop(0.6, wave.color.replace(/[\d.]+\)$/, '0.1)'));
                g.addColorStop(1, 'rgba(0, 0, 0, 0)');
                wave._g = g;
            }

            ctx.fillStyle = wave._g;
            ctx.beginPath();

            for (let x = 0; x <= w; x += 6) {
                const y = wave.y + Math.sin(x * wave.wavelength + this._aurora.phase * wave.speed * 100 + wave.offset) * wave.amplitude;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }

            ctx.lineTo(w, wave.y + 60);
            ctx.lineTo(0, wave.y + 60);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }

    _drawFog(ctx, w, h) {
        const fadeOpacity = this._layerFadeProgress.effects;
        const len = this._fogBanks.length;

        for (let i = 0; i < len; i++) {
            const f = this._fogBanks[i];
            f.x += f.speed;
            f.phase += 0.008;

            if (f.x > w + f.w / 2) f.x = -f.w / 2;
            if (f.x < -f.w / 2) f.x = w + f.w / 2;

            const undulation = Math.sin(f.phase) * 5;

            // Cache gradient at local (0,0); color is theme-fixed.
            // _initParticles wipes on state change. Opacity via globalAlpha.
            if (!f._g) {
                let color;
                if (this._isLightBackground) {
                    color = '190,200,215';
                } else {
                    color = this._isTimeNight ? '85,90,105' : '72,81,95';
                }
                const g = ctx.createRadialGradient(0, 0, 0, 0, 0, f.w / 2);
                g.addColorStop(0, `rgba(${color},1)`);
                g.addColorStop(0.5, `rgba(${color},0.6)`);
                g.addColorStop(1, `rgba(${color},0)`);
                f._g = g;
                f._baseOp = f.opacity * (1 + f.layer * 0.2) *
                    (this._isLightBackground ? 0.60 : 1.0);
            }

            ctx.save();
            const vSquash = 0.1 + f.layer * 0.18;
            ctx.scale(1, vSquash);
            const drawY = (f.y + undulation) / vSquash;

            ctx.globalAlpha = f._baseOp * fadeOpacity;
            ctx.translate(f.x, drawY);
            ctx.fillStyle = f._g;
            ctx.beginPath();
            ctx.ellipse(0, 0, f.w / 2, f.h, 0, 0, TWO_PI);
            ctx.fill();
            ctx.restore();
        }
    }

    _drawShootingStars(ctx, w, h) {
        const fadeOpacity = this._layerFadeProgress.stars;

        if (Math.random() < 0.0014 && this._shootingStars.length < LIMITS.MAX_SHOOTING_STARS) {
            let spawnX;
            if (Math.random() < 0.70) {
                spawnX = Math.random() * (w * 0.6);
            } else {
                spawnX = (w * 0.6) + Math.random() * (w * 0.4);
            }
            this._shootingStars.push({
                x: spawnX,
                y: Math.random() * (h * 0.5),
                vx: 5.0 + Math.random() * 3.0,
                vy: 2.0 + Math.random() * 2.0,
                life: 1.0,
                size: 1.5 + Math.random() * 1.5,
                tail: []
            });
        }

        ctx.save();

        for (let i = this._shootingStars.length - 1; i >= 0; i--) {
            const s = this._shootingStars[i];
            s.x += s.vx;
            s.y += s.vy;
            s.life -= 0.045;
            s.tail.unshift({ x: s.x, y: s.y });
            if (s.tail.length > 22) s.tail.pop();

            if (s.life <= 0) {
                this._shootingStars.splice(i, 1);
                continue;
            }

            const opacity = s.life * fadeOpacity;
            const isInkMode = !this._isThemeDark;
            const headColor = isInkMode ? '50, 55, 65' : '255, 255, 255';
            const tailColor = isInkMode ? '60, 65, 80' : '255, 255, 240';

            ctx.fillStyle = `rgba(${headColor}, ${opacity})`;
            fillCircle(ctx, s.x, s.y, s.size);

            ctx.lineWidth = s.size * 0.8;
            ctx.lineCap = 'round';

            for (let j = 0; j < s.tail.length - 1; j++) {
                const p1 = s.tail[j];
                const p2 = s.tail[j + 1];
                const tailOp = opacity * (1 - j / s.tail.length);
                ctx.strokeStyle = `rgba(${tailColor}, ${tailOp})`;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    _drawComets(ctx, w, h) {
        const badWeather = this._renderState.isBadWeatherForComets;

        if (this._isNight && !badWeather && this._comets.length === 0 && Math.random() < 0.00025) {
            const startX = Math.random() < 0.5 ? -60 : w + 60;
            const dir = startX < 0 ? 1 : -1;
            const speed = 2.2 + Math.random() * 1.3;
            this._comets.push({
                x: startX,
                y: Math.random() * (h * 0.4),
                vx: speed * dir,
                vy: speed * 0.15,
                size: 1.5 + Math.random(),
                life: 1.2,
                tail: []
            });
        }

        const fadeOpacity = this._layerFadeProgress.stars;
        if (fadeOpacity <= 0) return;

        ctx.save();

        for (let i = this._comets.length - 1; i >= 0; i--) {
            const c = this._comets[i];
            c.x += c.vx;
            c.y += c.vy;
            c.life -= 0.005;

            // Remove dead comets so new ones can spawn
            if (c.life <= 0) {
                this._comets.splice(i, 1);
                continue;
            }

            c.tail.unshift({ x: c.x, y: c.y });

            if (c.tail.length > 2) {
                const head = c.tail[0];
                const tip = c.tail[c.tail.length - 1];
                const currentDist = Math.sqrt((head.x - tip.x)**2 + (head.y - tip.y)**2);
                if (currentDist > 170) c.tail.pop();
            }

            const opacity = Math.min(1, c.life) * fadeOpacity;
            const isInkMode = !this._isThemeDark;

            // Cache head gradient at local (0,0). Colors are fixed per theme;
            // size is constant per comet. globalAlpha handles decaying opacity.
            if (!c._g) {
                const r = c.size * 4;
                const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
                if (isInkMode) {
                    g.addColorStop(0, 'rgba(50,60,75,1)');
                    g.addColorStop(0.4, 'rgba(70,85,105,0.4)');
                    g.addColorStop(1, 'rgba(70,85,105,0)');
                } else {
                    g.addColorStop(0, 'rgba(220,240,255,1)');
                    g.addColorStop(0.4, 'rgba(100,200,255,0.4)');
                    g.addColorStop(1, 'rgba(100,200,255,0)');
                }
                c._g = g;
            }

            ctx.globalAlpha = opacity;
            ctx.translate(c.x, c.y);
            ctx.fillStyle = c._g;
            fillCircle(ctx, 0, 0, c.size * 4);
            ctx.translate(-c.x, -c.y);

            ctx.lineCap = 'round';

            for (let j = 0; j < c.tail.length - 1; j++) {
                const p1 = c.tail[j];
                const p2 = c.tail[j + 1];
                const progress = j / c.tail.length;
                ctx.lineWidth = c.size * (1 - progress * 0.8);
                const tailOp = opacity * (1 - progress) * 0.6;
                ctx.globalAlpha = tailOp;
                ctx.strokeStyle = isInkMode
                    ? 'rgba(65,80,100,1)'
                    : 'rgba(160,210,255,1)';
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    _drawPlanes(ctx, w, h) {
        const badWeather = this._renderState.isBadWeatherForPlanes;

        if (!badWeather && this._planes.length === 0 && Math.random() < 0.005) {
            this._planes.push(this._createPlane(w, h));
        }

        for (let i = this._planes.length - 1; i >= 0; i--) {
            const plane = this._planes[i];
            const dir = plane.vx > 0 ? 1 : -1;
            const sinA = Math.sin(plane.climbAngle);
            const cosA = Math.cos(plane.climbAngle);

            plane.x += plane.vx;
            plane.y += plane.vy;

            if (plane.gapTimer > 0) {
                plane.gapTimer--;
            } else if (Math.random() < 0.005) {
                plane.gapTimer = 5 + Math.random() * 10;
            }

            plane.history.unshift({
                x: plane.x,
                y: plane.y + (Math.random() - 0.5) * 1.5,
                gap: plane.gapTimer > 0
            });

            const windShift = (this._windSpeed || 0) * 0.15;
            for (let j = 1; j < plane.history.length; j++) {
                plane.history[j].x += windShift;
                plane.history[j].y += 0.02;
            }

            if (plane.history.length > 500) plane.history.pop();

            if (plane.history.length > 2) {
                ctx.save();
                const baseOp = this._isThemeDark ? 0.25 : 0.50;
                const trailColor = this._isThemeDark ? 'rgb(210,220,240)' : 'rgb(255,255,255)';
                const histLen = plane.history.length;

                // Zero-allocation contrail: solid stroke color with per-segment
                // globalAlpha replicating the original gradient fade pattern.
                // Eliminates the per-frame createLinearGradient call.
                ctx.strokeStyle = trailColor;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.lineWidth = 3 * plane.scale;

                [3, -3].forEach(offset => {
                    for (let k = 0; k < histLen - 1; k++) {
                        const pt0 = plane.history[k];
                        const pt1 = plane.history[k + 1];
                        if (pt0.gap || pt1.gap) continue;

                        // Map segment position to the original gradient curve:
                        // 0→0.05: ramp in, 0.05→0.6: hold, 0.6→1.0: fade out
                        const progress = k / histLen;
                        let segOp;
                        if (progress < 0.05) segOp = (progress / 0.05) * baseOp;
                        else if (progress < 0.6) segOp = baseOp * (1 - (progress - 0.05) * 0.727);
                        else segOp = baseOp * 0.6 * (1 - (progress - 0.6) / 0.4);

                        if (segOp < 0.005) continue;
                        ctx.globalAlpha = segOp;

                        const oX = sinA * offset * plane.scale * dir;
                        const oY = cosA * offset * plane.scale;
                        ctx.beginPath();
                        ctx.moveTo(pt0.x + oX, pt0.y + oY);
                        ctx.lineTo(pt1.x + oX, pt1.y + oY);
                        ctx.stroke();
                    }
                });
                ctx.restore();
            }

            ctx.save();
            ctx.translate(plane.x, plane.y);
            ctx.scale(plane.scale, plane.scale);
            if (plane.climbAngle > 0) {
                ctx.rotate(-plane.climbAngle * dir);
            }

            const bodyColor = this._isThemeDark ? '100, 110, 120' : '80, 85, 95';
            ctx.strokeStyle = `rgba(${bodyColor}, 0.9)`;
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Draw plane silhouette from geometry table
            ctx.beginPath();
            for (let seg = 0; seg < PLANE_PATH.length; seg++) {
                const s = PLANE_PATH[seg];
                ctx.moveTo(s[0] * dir, s[1]);
                ctx.lineTo(s[2] * dir, s[3]);
            }
            ctx.stroke();

            plane.blinkPhase += 0.12;
            if (Math.sin(plane.blinkPhase) > 0.8) {
                const strobeColor = plane.vx > 0 ? "50, 255, 80" : "255, 50, 50";
                ctx.fillStyle = `rgba(${strobeColor}, 0.9)`;
                fillCircle(ctx, 0, 1, 1.5);
            }

            ctx.restore();

            if (plane.x < -450 || plane.x > w + 450) {
                this._planes.splice(i, 1);
            }
        }
    }

    _drawBirds(ctx, w, h) {
        for (let i = this._birds.length - 1; i >= 0; i--) {
            const b = this._birds[i];
            b.x += b.vx;
            b.y += b.vy;
            b.flapPhase += b.flapSpeed;
            const isOffRight = b.vx > 0 && b.x > w + 100;
            const isOffLeft = b.vx < 0 && b.x < -100;
            if (isOffRight || isOffLeft) {
                this._birds.splice(i, 1);
            }
        }

        const p = this._params;
        const isSevereWeather = this._renderState.isSevereWeather;

        if (this._isLightBackground && !isSevereWeather && this._birds.length === 0) {
            const dir = Math.random() > 0.5 ? 1 : -1;
            const startX = dir === 1 ? -60 : w + 60;
            const depthScale = 0.9 + Math.random() * 0.5;
            const baseSpeed = (0.9 + Math.random() * 0.5);
            const finalSpeed = baseSpeed * depthScale * dir;
            const isSingle = Math.random() < 0.3;
            const flockSize = isSingle ? 1 : 5 + Math.floor(Math.random() * 8);
            const startY = h * 0.20 + Math.random() * (h * 0.30);

            this._birds.push({
                x: startX,
                y: startY,
                vx: finalSpeed,
                vy: (Math.random() - 0.5) * 0.1,
                flapPhase: 0,
                flapSpeed: 0.15 + Math.random() * 0.05,
                size: 2.4 * depthScale
            });

            if (!isSingle) {
                const formation = Math.floor(Math.random() * 3);
                const ySlope = Math.random() > 0.5 ? 1 : -1;

                for (let i = 1; i < flockSize; i++) {
                    let offX = 0, offY = 0;
                    if (formation === 0) {
                        const row = Math.floor((i + 1) / 2);
                        const side = i % 2 === 0 ? 1 : -1;
                        offX = -15 * row;
                        offY = 8 * row * side;
                    } else if (formation === 1) {
                        offX = -18 * i;
                        offY = 10 * i * ySlope;
                    } else {
                        offX = -15 * i + (Math.random() - 0.5) * 20;
                        offY = (Math.random() - 0.5) * 40;
                    }

                    const scaledOffX = offX * depthScale;
                    const scaledOffY = offY * depthScale;

                    this._birds.push({
                        x: startX + (scaledOffX * dir),
                        y: startY + scaledOffY,
                        vx: finalSpeed,
                        vy: (Math.random() - 0.5) * 0.05,
                        flapPhase: i + Math.random(),
                        flapSpeed: 0.15 + Math.random() * 0.05,
                        size: (1.8 + Math.random() * 0.6) * depthScale
                    });
                }
            }
        }

        if (this._birds.length === 0) return;

        const birdColor = this._isLightBackground ? 'rgba(40, 45, 50, 0.8)' : 'rgba(200, 210, 220, 0.6)';
        ctx.save();
        ctx.strokeStyle = birdColor;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        const len = this._birds.length;
        for (let i = 0; i < len; i++) {
            const b = this._birds[i];
            const envelope = Math.sin(b.flapPhase * 0.35);
            const wingOffset = Math.sin(b.flapPhase) * b.size * Math.max(0, envelope);
            const dir = b.vx > 0 ? 1 : -1;
            ctx.lineWidth = Math.max(0.8, b.size * 0.5);
            ctx.beginPath();
            ctx.moveTo(b.x - (b.size * dir), b.y + wingOffset - (1 * (b.size/2.4)));
            ctx.lineTo(b.x, b.y);
            ctx.lineTo(b.x - (b.size * dir), b.y + wingOffset + (1 * (b.size/2.4)));
            ctx.stroke();
        }

        ctx.restore();
    }

    _drawWindVapor(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.effects;
        if (fadeOpacity <= 0) return;
        
        const p = this._params;
        const windKmh = this._windKmh || 0;

        // Wind intensity: quadratic curve over 0–80 km/h range.
        // Squared mapping makes low wind nearly static while high wind is dramatic.
        //   10 km/h → 0.016 (practically frozen)
        //   30 km/h → 0.141 (gentle drift)
        //   50 km/h → 0.391 (moderate)
        //   80+ km/h → 1.0  (full speed)
        const windNorm = Math.min(1.0, Math.max(0, windKmh / 80));
        const windIntensity = windNorm * windNorm;

        // Speed multiplier: 0.5% floor at dead calm → 120% ceiling (20% above previous max)
        const speedScale = 0.005 + (1.195 * windIntensity);
        
        let activeCount;
        if (p.windVapor && windKmh >= 15) {
            activeCount = 24;
        } else {
            // Minimum 12 streaks dispersed through the sky
            activeCount = Math.floor(12 + (12 * windIntensity));
        }

        // Distinct visibility floors for light/dark themes
        const opacityScale = this._isThemeDark 
            ? 0.85 + (0.15 * windIntensity) 
            : 0.65 + (0.35 * windIntensity);

        const len = Math.min(this._windVapor.length, activeCount);
        const cp = this._renderState.cp;

        // THE FIX: The global wind gust is a perpetual sine wave. 
        // We MUST scale it by wind intensity so gusts physically die down in calm weather.
        const gustVal = this._windGust * windIntensity;

        ctx.save();
        ctx.globalCompositeOperation = 'source-over';

        for (let i = 0; i < len; i++) {
            const v = this._windVapor[i];
            
            v.phase += v.phaseSpeed * speedScale;

            const gustBoost = Math.max(0, gustVal) * v.gustWeight * 2.5;
            
            // Base velocity respects both the particle speed and global effective wind, safely scaled down
            const localEffective = effectiveWind * speedScale;
            const baseVelocity = (v.speed * speedScale) + localEffective;
            
            // MoveX now correctly approaches near-zero at low winds
            const moveX = (baseVelocity + gustBoost) * (1 + this._windSpeed * 0.3);
            v.x += moveX;

            const undulation = Math.sin(v.phase) * v.drift;

            if (v.x > w + v.w) v.x = -v.w;
            if (v.x < -v.w * 1.5) v.x = w + v.w;

            if (!v._g) {
                let color, peakAlpha;

                if (this._isThemeDark) {
                    color = `${cp.litR},${cp.litG},${cp.litB}`;
                    peakAlpha = 0.185; 
                } else {
                    color = '250,252,255';
                    peakAlpha = 0.44;
                }

                const halfW = v.w / 2;
                const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, halfW);
                
                grad.addColorStop(0,   `rgba(${color}, ${peakAlpha})`); 
                grad.addColorStop(0.1, `rgba(${color}, ${peakAlpha * 0.7})`); 
                grad.addColorStop(0.4, `rgba(${color}, ${peakAlpha * 0.2})`); 
                grad.addColorStop(1,   `rgba(${color}, 0)`);
                
                v._g = grad;
                
                v._baseOp = this._isThemeDark 
                    ? (0.48 + v.tier * 0.24) 
                    : (0.66 + v.tier * 0.22);
            }

            const gustOpBump = Math.max(0, gustVal) * 0.2;
            const gustStretch = 1 + Math.max(0, gustVal) * 0.3;
            
            // Dynamic heights: Profile assigns varying initial squashes, blending to flat at high wind
            const profile = (i % 3 === 0) ? 1.8 : (i % 3 === 1) ? 1.0 : 0.5;
            const dynamicSquash = profile - ((profile - 1.0) * windIntensity);

            ctx.save();
            ctx.translate(v.x, v.y + undulation);
            ctx.scale(gustStretch, v.squash * dynamicSquash);
            
            ctx.globalAlpha = Math.min(1.0, (v._baseOp + gustOpBump) * fadeOpacity * opacityScale);
            ctx.fillStyle = v._g;
            
            fillCircle(ctx, 0, 0, v.w / 2);
            
            ctx.restore();
        }
        ctx.restore();
    }

    _drawDustMotes(ctx, w, h) {
        if (!this._renderState.showSun) return;
        const fadeOpacity = this._layerFadeProgress.effects;

        ctx.save();
        ctx.globalCompositeOperation = this._isThemeDark ? 'lighter' : 'source-over';

        const len = this._dustMotes.length;
        // Theme-aware mote color: warm cream (light bg source-over, dark bg lighter)
        const moteColor = this._isLightBackground ? '255, 248, 225' : '255, 250, 220';
        const opacityMult = this._isLightBackground ? 1.6 : 2.0;

        for (let i = 0; i < len; i++) {
            const mote = this._dustMotes[i];
            mote.phase += 0.015;
            mote.x += mote.speedX + Math.sin(mote.phase) * 0.15;
            mote.y += mote.speedY + Math.cos(mote.phase * 0.7) * 0.1;

            if (mote.x > w + 5) mote.x = -5;
            if (mote.x < -5) mote.x = w + 5;
            if (mote.y > h + 5) mote.y = -5;
            if (mote.y < -5) mote.y = h + 5;

            const twinkle = Math.sin(mote.phase * 2) * 0.3 + 0.7;
            const finalOpacity = mote.opacity * twinkle * fadeOpacity * opacityMult;

            ctx.fillStyle = `rgba(${moteColor}, ${finalOpacity})`;
            fillCircle(ctx, mote.x, mote.y, mote.size);
        }

        ctx.restore();
    }

    _drawMoon(ctx, w, h) {
        if (!this._isTimeNight) return;
        if (!this._stateInitialized || !this._renderGate.isRevealed) return;

        const fadeOpacity = this._layerFadeProgress.stars;
        if (fadeOpacity <= 0.05) return;

        this._moonAnimPhase += 0.003;

        const celestial = this._getCelestialPosition(w, h);
        const moonX = celestial.x;
        const moonY = celestial.y;

        // 15% rule: Moon radius is always 85% of the Sun's base radius.
        // sun_moon_size sets the Sun diameter; Moon is derived proportionally.
        // Unconfigured: sunBaseR = 26 → moonRadius = 22.1
        // Configured (sun_moon_size: 50): sunBaseR = 25 → moonRadius = 21.25
        const sunBaseR = this._celestialSize ? this._celestialSize / 2 : 26;
        const moonRadius = sunBaseR * 0.85;

        // Crater geometry authored against a radius-18 reference moon.
        // This divisor MUST stay 18 to keep MOON_CRATERS proportional.
        const moonScale = moonRadius / 18;

        const useLightColors = !this._isThemeDark;
        const isImmersiveLight = useLightColors && this._config.card_style !== 'standalone';

        const moonStyle = (this._config.moon_style || 'blue').toLowerCase();
        const useBlue = isImmersiveLight && moonStyle === 'blue';
        const useYellow = isImmersiveLight && moonStyle === 'yellow';
        const usePurple = isImmersiveLight && moonStyle === 'purple';
        const useGrey = isImmersiveLight && moonStyle === 'grey';
        // Resolved style key for MOON_STYLE_COLORS lookups
        const mStyleKey = useYellow ? 'yellow' : useBlue ? 'blue' : usePurple ? 'purple' : useGrey ? 'grey' : useLightColors ? 'light' : 'dark';
		
        ctx.save();

        // Glow intensity: weather-dependent (clouds dim the glow, not the disc)
        const cloudCover = this._params?.cloud || 0;
        const glowWeatherScale = cloudCover > 30 ? 0.4 : cloudCover > 20 ? 0.6 : cloudCover > 10 ? 0.8 : 1;
        const glowIntensity = 0.23 + this._moonPhaseConfig.illumination * 0.18;
        const atmScale = (!useLightColors && this._params?.atmosphere === 'fair') ? 0.79 : 1.0;
        let effectiveGlow = glowIntensity * fadeOpacity * glowWeatherScale * atmScale;

        if (isImmersiveLight) {
            effectiveGlow *= 0.85;
        }

        // ── Moon gradient cache ──
        // All gradients built at local (0,0) with normalized opacity (peak=1).
        // globalAlpha scales effectiveGlow/fadeOpacity per frame.
        // Cache key = style+theme+radius. _buildRenderState nulls this._moonCache
        // on state/theme change. Canvas dimensions checked via glowR.
        const cacheKey = moonStyle + (useLightColors ? 'L' : 'D');
        if (!this._moonCache || this._moonCache.key !== cacheKey || this._moonCache.mr !== moonRadius) {
            this._moonCache = this._buildMoonCache(ctx, moonRadius, moonScale, w, h,
                useLightColors, useYellow, useBlue, usePurple, useGrey, isImmersiveLight);
            this._moonCache.key = cacheKey;
            this._moonCache.mr = moonRadius;
        }
        const mc = this._moonCache;

        if (useLightColors) {
            ctx.globalCompositeOperation = 'source-over';
            const lightGlowR = mc.glowR;

            ctx.save();
            ctx.translate(moonX, moonY);
            ctx.globalAlpha = effectiveGlow * mc.glowPeak;
            ctx.fillStyle = mc.glow;
            fillCircle(ctx, 0, 0, lightGlowR);
            ctx.restore();

            ctx.beginPath();
            ctx.arc(moonX, moonY, moonRadius + 1.5, 0, TWO_PI);
            const rsKey = MOON_STYLE_COLORS.ringStroke[mStyleKey] ? mStyleKey : 'yellow';
            const ringCfg = MOON_STYLE_COLORS.ringStroke[rsKey];
            ctx.strokeStyle = `rgba(${ringCfg.rgb}, ${ringCfg.op * fadeOpacity})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        } else {
            // Dark bg: screen-blend corona. Cap radius so the circle never extends
            // beyond canvas edges (prevents hard clip on small/short cards).
            // Glow radius reduced 20% from original (0.35 → 0.28)
            const maxR = Math.min(
                Math.min(h, w) * 0.28 * moonScale,
                moonX, w - moonX, moonY, h - moonY
            );

            // Dark glow depends on maxR which varies per frame (canvas edges).
            // Cheap to rebuild: only 1 gradient, only for dark theme.
            if (!mc.darkGlow || mc.darkGlowR !== maxR) {
                const g = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR);
                g.addColorStop(0,   'rgba(180, 200, 255, 1)');
                g.addColorStop(0.5, 'rgba(165, 195, 245, 0.4)');
                g.addColorStop(1,   'rgba(150, 180, 220, 0)');
                mc.darkGlow = g;
                mc.darkGlowR = maxR;
            }

            ctx.globalCompositeOperation = 'screen';
            ctx.save();
            ctx.translate(moonX, moonY);
            ctx.globalAlpha = effectiveGlow;
            ctx.fillStyle = mc.darkGlow;
            fillCircle(ctx, 0, 0, maxR);
            ctx.restore();
        }

        ctx.globalCompositeOperation = 'source-over';

        // destination-out punch: only on dark theme
        if (!useLightColors && this._moonPhaseConfig.illumination > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(0, 0, 0, 1)';
            fillCircle(ctx, moonX, moonY, moonRadius - 0.5);
            ctx.restore();
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius, 0, TWO_PI);
        ctx.clip();

        const illumination = this._moonPhaseConfig.illumination;
        const direction = this._moonPhaseConfig.direction;

        if (illumination <= 0) {
            const nmKey = mStyleKey;
            for (const fill of MOON_STYLE_COLORS.newMoon[nmKey]) {
                ctx.fillStyle = `rgba(${fill.rgb}, ${fill.op * fadeOpacity})`;
                fillCircle(ctx, moonX, moonY, moonRadius);
            }
        } else if (illumination >= 1) {
            // Full moon disc — cached gradient at local (0,0), translate + globalAlpha
            ctx.save();
            ctx.translate(moonX, moonY);
            ctx.globalAlpha = fadeOpacity * mc.fullDiscPeak;
            ctx.fillStyle = mc.fullDisc;
            fillCircle(ctx, 0, 0, moonRadius);
            ctx.restore();
        } else {
            // Shadow/dark side of disc
            const dsKey = mStyleKey;
            const ds = MOON_STYLE_COLORS.darkSide[dsKey];
            ctx.fillStyle = `rgba(${ds.rgb}, ${ds.op * fadeOpacity})`;
            fillCircle(ctx, moonX, moonY, moonRadius);

            if (!useLightColors) {
                const earthshineOp = (1 - illumination) * 0.08 * fadeOpacity;
                ctx.fillStyle = `rgba(100, 115, 145, ${earthshineOp})`;
                fillCircle(ctx, moonX, moonY, moonRadius);
            }

            const terminatorWidth = Math.abs(1 - illumination * 2) * moonRadius;
            const isGibbous = illumination > 0.5;

            ctx.beginPath();
            if (direction === 'right') {
                ctx.arc(moonX, moonY, moonRadius, -Math.PI / 2, Math.PI / 2, false);
                ctx.ellipse(moonX, moonY, terminatorWidth, moonRadius, 0, Math.PI / 2, -Math.PI / 2, !isGibbous);
            } else {
                ctx.arc(moonX, moonY, moonRadius, Math.PI / 2, -Math.PI / 2, false);
                ctx.ellipse(moonX, moonY, terminatorWidth, moonRadius, 0, -Math.PI / 2, Math.PI / 2, !isGibbous);
            }
            ctx.closePath();

            // Partial moon disc — cached gradient, translate + globalAlpha
            ctx.save();
            ctx.translate(moonX, moonY);
            ctx.globalAlpha = fadeOpacity * mc.partDiscPeak;
            ctx.fillStyle = mc.partDisc;
            ctx.fill();
            ctx.restore();
        }

        ctx.restore();

        // Craters — drawn from MOON_CRATERS geometry table, scaled with moon size.
        // Unrolled: avoids per-frame array allocation in hot path.
        if (illumination > 0.05) {
            const op = fadeOpacity * Math.min(1, illumination * 4.0);
            const ms = moonScale;
            const lc = useLightColors;

            // Maria (large dark seas)
            ctx.fillStyle = lc ? `rgba(180,190,210,${0.12*op})` : `rgba(30,35,50,${0.13*op})`;
            for (let m = 0; m < MOON_CRATERS.maria.length; m++) {
                const c = MOON_CRATERS.maria[m];
                ctx.beginPath();
                ctx.ellipse(moonX + c.dx * ms, moonY + c.dy * ms, c.rx * ms, c.ry * ms, c.rot, 0, TWO_PI);
                ctx.fill();
            }

            // Maria inner (darker cores)
            ctx.fillStyle = lc ? `rgba(170,180,200,${0.16*op})` : `rgba(25,30,45,${0.22*op})`;
            for (let m = 0; m < MOON_CRATERS.mariaInner.length; m++) {
                const c = MOON_CRATERS.mariaInner[m];
                ctx.beginPath();
                ctx.ellipse(moonX + c.dx * ms, moonY + c.dy * ms, c.rx * ms, c.ry * ms, c.rot, 0, TWO_PI);
                ctx.fill();
            }

            // Detail craters (small circular impacts)
            ctx.fillStyle = lc ? `rgba(175,185,205,${0.10*op})` : `rgba(25,30,45,${0.13*op})`;
            for (let m = 0; m < MOON_CRATERS.detail.length; m++) {
                const c = MOON_CRATERS.detail[m];
                fillCircle(ctx, moonX + c.dx * ms, moonY + c.dy * ms, c.r * ms);
            }
        }

        ctx.restore();
    }

    // Builds all moon gradient caches for the current style/theme combo.
    // Called once, then reused until _buildRenderState nulls _moonCache.
    _buildMoonCache(ctx, moonRadius, moonScale, w, h, useLightColors, useYellow, useBlue, usePurple, useGrey, isImmersiveLight) {
        const mc = {};
        const styleKey = useYellow ? 'yellow' : useBlue ? 'blue' : usePurple ? 'purple' : useGrey ? 'grey' : useLightColors ? 'light' : 'dark';

        // Helper: populate gradient from LUT stops array { peak, stops: [[pos, rgb, alpha], ...] }
        const applyStops = (grad, cfg, peak) => {
            for (const [pos, rgb, alpha] of cfg) {
                grad.addColorStop(pos, alpha === 0 ? `rgba(${rgb}, 0)` : `rgba(${rgb}, ${alpha / peak})`);
            }
        };

        // ── Light bg glow (reduced 20%: 0.42 → 0.336) ──
        if (useLightColors) {
            const lightGlowR = Math.min(h, w) * 0.336 * moonScale;
            const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, lightGlowR);
            const cfg = MOON_STYLE_COLORS.glow[styleKey];
            applyStops(glow, cfg.stops, cfg.peak);
            mc.glow = glow;
            mc.glowR = lightGlowR;
            mc.glowPeak = cfg.peak;
        }

        // ── Full moon disc gradient (local coords, offset highlight) ──
        {
            const g = ctx.createRadialGradient(-moonRadius * 0.3, -moonRadius * 0.3, 0, 0, 0, moonRadius);
            const cfg = MOON_STYLE_COLORS.fullDisc[styleKey];
            applyStops(g, cfg.stops, cfg.peak);
            mc.fullDisc = g;
            mc.fullDiscPeak = cfg.peak;
        }

        // ── Partial moon disc gradient (slightly different offset) ──
        {
            const g = ctx.createRadialGradient(-moonRadius * 0.2, -moonRadius * 0.2, 0, 0, 0, moonRadius);
            const cfg = MOON_STYLE_COLORS.partDisc[styleKey];
            applyStops(g, cfg.stops, cfg.peak);
            mc.partDisc = g;
            mc.partDiscPeak = cfg.peak;
        }

        return mc;
    }

    _drawHeatShimmer(ctx, w, h) {
        if (!this._renderState.showSun || this._isNight) return;
        const fadeOpacity = this._layerFadeProgress.effects;
        this._heatShimmerPhase += 0.02;

        ctx.save();
        ctx.globalAlpha = 0.03 * fadeOpacity;
        ctx.strokeStyle = this._isLightBackground
            ? 'rgba(255, 200, 100, 0.15)'
            : 'rgba(255, 255, 200, 0.1)';
        ctx.lineWidth = 2;

        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            const baseY = h - 30 + i * 8;
            for (let x = 0; x <= w; x += 4) {
                const y = baseY + Math.sin(x * 0.03 + this._heatShimmerPhase + i * 0.5) * 3;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        ctx.restore();
    }

    // ========================================================================
    // ANIMATION LOOP
    // ========================================================================
    _animate(timestamp) {
        if (!this.isConnected || this._animID === null || !this._isVisible) {
            this._stopAnimation();
            return;
        }

        // FPS cap: skip frame if under target interval
        const targetInterval = 1000 / PERFORMANCE_CONFIG.TARGET_FPS;
        const deltaTime = timestamp - this._lastFrameTime;

        if (deltaTime < targetInterval) {
            this._animID = requestAnimationFrame(this._boundAnimate);
            return;
        }

        this._lastFrameTime = timestamp - (deltaTime % targetInterval);

        if (!this._ctxs || !this._elements?.bg) {
            this._animID = requestAnimationFrame(this._boundAnimate);
            return;
        }

        const { bg, mid, fg } = this._ctxs;
        const dpr = this._cachedDimensions.dpr || (window.devicePixelRatio || 1);
        const w = this._elements.bg.width / dpr;
        const h = this._elements.bg.height / dpr;
        const p = this._params;

        if (!p || w === 0 || h === 0) {
            this._animID = requestAnimationFrame(this._boundAnimate);
            return;
        }

        bg.clearRect(0, 0, w * 2, h * 2);
        mid.clearRect(0, 0, w * 2, h * 2);
        fg.clearRect(0, 0, w * 2, h * 2);

        if (!this._stateInitialized || !this._renderGate.isRevealed) {
            this._animID = requestAnimationFrame(this._boundAnimate);
            return;
        }

        this._gustPhase += 0.012;
        this._microGustPhase += 0.03;
        this._windGust = Math.sin(this._gustPhase) * 0.35 +
                         Math.sin(this._gustPhase * 2.1) * 0.15 +
                         Math.sin(this._microGustPhase) * 0.08;
        const effectiveWind = ((p.wind || 0.1) + this._windGust) * (1 + this._windSpeed);

        this._sunPulsePhase += 0.008;
        this._atmospherePhase += 0.005;
        const cloudGlobalOp = this._renderState.cloudGlobalOp;
        const rs = this._renderState;

        // ---- BACKGROUND LAYER ----
        if (rs.showSun) {
            this._drawSunGlow(bg, w, h);
        }
        // Sky haze handled by CSS ::after (--g-rgb/--g-op/--gh-wash)

        this._drawAurora(mid, w, h);

        // Stars — render mode set by _buildRenderState: 'glow' | 'golden' | 'hidden'
        const starFade = this._layerFadeProgress.stars;
        const starMode = rs.starMode;

        if (starFade > 0.01 && starMode !== 'hidden') {
            const len = this._stars.length;
            const isGolden = starMode === 'golden';

            for (let i = 0; i < len; i++) {
                const s = this._stars[i];
                s.phase += s.rate;
                const twinkleVal = Math.sin(s.phase) + (Math.sin(s.phase * 3) * 0.5);
                const sizePulse = 1 + (twinkleVal * 0.25);
                const currentSize = s.baseSize * sizePulse;
                const horizonFade = (this._config.card_style === 'standalone')
                    ? 1.0
                    : (1 - Math.pow(s.y / (h * 0.95), 3));
                const opacityPulse = 1 + (twinkleVal * 0.15);
                const finalOpacity = Math.min(1, Math.max(0.0, s.brightness * opacityPulse * starFade * horizonFade));

                if (finalOpacity <= 0.05) continue;

                // Star palette keyed to HSL; golden = warm amber, glow = cool blue
                const shift = twinkleVal * 5;
                const dynamicHue = s.hslH + shift;
                const dynamicLight = s.hslL + (twinkleVal * 2);
                const dynamicColor = `hsla(${dynamicHue}, ${s.hslS}%, ${dynamicLight}%,`;

                if (s.tier === 'hero') {
                    bg.save();

                    if (isGolden) {
                        // Golden hero: warm glow on light background
                        bg.globalCompositeOperation = 'source-over';
                        bg.fillStyle = `${dynamicColor} ${finalOpacity * 0.85})`;
                        fillCircle(bg, s.x, s.y, currentSize * 0.65);

                        // Soft warm halo
                        const haloGrad = bg.createRadialGradient(s.x, s.y, currentSize * 0.6, s.x, s.y, currentSize * 2.2);
                        haloGrad.addColorStop(0, `${dynamicColor} ${finalOpacity * 0.18})`);
                        haloGrad.addColorStop(1, `${dynamicColor} 0)`);
                        bg.fillStyle = haloGrad;
                        fillCircle(bg, s.x, s.y, currentSize * 2.2);

                        // Subtle short cross spikes for painterly sparkle
                        const spikeLen = currentSize * 1.4;
                        const spikeOp = finalOpacity * 0.22;
                        bg.strokeStyle = `${dynamicColor} ${spikeOp})`;
                        bg.lineWidth = 0.5;
                        bg.beginPath();
                        bg.moveTo(s.x - spikeLen, s.y);
                        bg.lineTo(s.x + spikeLen, s.y);
                        bg.moveTo(s.x, s.y - spikeLen);
                        bg.lineTo(s.x, s.y + spikeLen);
                        bg.stroke();
                    } else {
                        // Glow hero: additive star on dark background
                        bg.globalCompositeOperation = 'lighter';
                        bg.fillStyle = `${dynamicColor} ${finalOpacity})`;
                        fillCircle(bg, s.x, s.y, currentSize * 0.6);

                        const grad = bg.createRadialGradient(s.x, s.y, currentSize * 0.6, s.x, s.y, currentSize * 3.0);
                        grad.addColorStop(0, `${dynamicColor} ${finalOpacity * 0.25})`);
                        grad.addColorStop(1, `${dynamicColor} 0)`);
                        bg.fillStyle = grad;
                        fillCircle(bg, s.x, s.y, currentSize * 3.0);

                        const spikeLen = currentSize * 2.0;
                        const spikeOp = finalOpacity * 0.3;
                        bg.strokeStyle = `${dynamicColor} ${spikeOp})`;
                        bg.lineWidth = 0.5;
                        bg.beginPath();
                        bg.moveTo(s.x - spikeLen, s.y);
                        bg.lineTo(s.x + spikeLen, s.y);
                        bg.moveTo(s.x, s.y - spikeLen);
                        bg.lineTo(s.x, s.y + spikeLen);
                        bg.stroke();

                        // Rotating crown — 4 diagonal rays
                        const crownPhase = s.phase * 0.18;
                        const crownLen  = currentSize * 2.5;
                        const crownOp   = finalOpacity * 0.28;
                        bg.save();
                        bg.translate(s.x, s.y);
                        bg.rotate(crownPhase);
                        bg.strokeStyle = `${dynamicColor} ${crownOp})`;
                        bg.lineWidth = 0.8;
                        bg.beginPath();
                        for (let r = 0; r < 4; r++) {
                            const a = (r / 4) * TWO_PI + Math.PI / 4;
                            bg.moveTo(0, 0);
                            bg.lineTo(Math.cos(a) * crownLen, Math.sin(a) * crownLen);
                        }
                        bg.stroke();
                        bg.restore();
                    }

                    bg.restore();
                } else {
                    if (isGolden) {
                        bg.globalCompositeOperation = 'source-over';
                    }
                    bg.fillStyle = `${dynamicColor} ${finalOpacity})`;
                    fillCircle(bg, s.x, s.y, currentSize * (isGolden ? 0.55 : 0.5));
                    if (isGolden) {
                        bg.globalCompositeOperation = 'source-over';
                    }
                }
            }
        }

        this._drawMoon(bg, w, h);

        if (this._isNight && this._isThemeDark && this._stars.length > 0) {
            this._drawShootingStars(bg, w, h);
        }
        if (this._isThemeDark) {
            this._drawComets(bg, w, h);
        }

        // ---- MIDDLE LAYER ----
        this._drawHeatShimmer(mid, w, h);

        // Sun clouds before main clouds — rays bleed through
        if (this._sunClouds.length > 0) {
            this._drawSunClouds(mid, w, h, effectiveWind);
        }

        // Dark theme cloudy-sun on bg (behind clouds)
        const showCloudySun = rs.showCloudySun;
        if (showCloudySun) {
            if (this._isThemeDark) {
                this._drawCloudySun(bg, w, h);
            }
        }
		
		// Wind vapor streaks
        if (this._windVapor.length > 0) {
            this._drawWindVapor(mid, w, h, effectiveWind);
        }

        this._drawClouds(mid, this._clouds, w, h, effectiveWind, cloudGlobalOp);

        // Light theme cloudy-sun on mid (diffuse glow through clouds)
        if (showCloudySun && !this._isThemeDark) {
            this._drawCloudySun(mid, w, h);
        }

        // Birds sandwiched between bg and scud cloud layers
        this._drawBirds(mid, w, h);
        this._drawClouds(mid, this._fgClouds, w, h, effectiveWind, cloudGlobalOp);
        this._drawPlanes(mid, w, h);

        if (this._fogBanks.length > 0) {
            this._drawFog(mid, w, h);
        }

        this._drawDustMotes(mid, w, h);

        // ---- FOREGROUND LAYER ----
        this._drawLightning(fg, w, h);
        this._drawRain(fg, w, h, effectiveWind);
        this._drawHail(fg, w, h, effectiveWind);
        this._drawSnow(fg, w, h, effectiveWind);

        this._animID = requestAnimationFrame(this._boundAnimate);
    }

    _startAnimation() {
        if (this._animID === null && this._isVisible) {
            this._lastFrameTime = performance.now();
            this._animID = requestAnimationFrame(this._boundAnimate);
        }
    }

    _stopAnimation() {
        if (this._animID !== null) {
            cancelAnimationFrame(this._animID);
            this._animID = null;
        }
    }
}

const CARD_NAME = 'atmospheric-weather-card';

if (!customElements.get(CARD_NAME)) {
    customElements.define(CARD_NAME, AtmosphericWeatherCard);
    window.customCards = window.customCards || [];
    window.customCards.push({
        type: CARD_NAME,
        name: 'Atmospheric Weather Card',
        description: 'Animated weather effects with rain, snow, clouds, stars and more'
    });
} else {
    console.info(`%c ${CARD_NAME} already defined - skipping registration`, 'color: orange; font-weight: bold;');
}
