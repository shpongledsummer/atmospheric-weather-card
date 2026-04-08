/**
 * ATMOSPHERIC WEATHER CARD
 * Version: 3.5
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
 *   sunCloudWarm   — Warm palette celestial accent clouds (partlycloudy only).
 *   dark/thunder   — Storm darkening + lightning spawning.
 *   foggy          — Fog bank layer.
 *   windVapor      — Volumetric wind vapor streaks.
 *   stars          — Star count (dark theme night only).
 */
const WEATHER_MAP = Object.freeze({
    'clear-night':      Object.freeze({ type: 'stars', count: 280, cloud: 0,  wind: 0.1, sunCloudWarm: false, atmosphere: 'night', stars: 420 }),
    'cloudy':           Object.freeze({ type: 'cloud', count: 0,   cloud: 24, wind: 0.3, dark: false, sunCloudWarm: false, atmosphere: 'overcast', stars: 120, scale: 1.5 }),
    'fog':              Object.freeze({ type: 'fog',   count: 0,   cloud: 18, wind: 0.2, sunCloudWarm: false, atmosphere: 'mist', foggy: true, stars: 125, scale: 1.4 }),
    'hail':             Object.freeze({ type: 'hail',  count: 150, cloud: 18, wind: 0.8, dark: true, sunCloudWarm: false, atmosphere: 'storm', stars: 50, scale: 1.6 }),
    'lightning':        Object.freeze({ type: 'rain',  count: 200, cloud: 24, wind: 1.0, thunder: true, dark: true, sunCloudWarm: false, atmosphere: 'storm', stars: 50, scale: 1.6 }),
    'lightning-rainy':  Object.freeze({ type: 'rain',  count: 150, cloud: 18, wind: 1.0, thunder: true, dark: true, sunCloudWarm: false, atmosphere: 'storm', stars: 50, scale: 1.6 }),
    'pouring':          Object.freeze({ type: 'rain',  count: 220, cloud: 24, wind: 0.6, dark: true, sunCloudWarm: false, atmosphere: 'pouring', stars: 40, scale: 1.5 }),
    'rainy':            Object.freeze({ type: 'rain',  count: 120, cloud: 24, wind: 0.3, sunCloudWarm: false, atmosphere: 'rain', stars: 60, scale: 1.5 }),
    'snowy':            Object.freeze({ type: 'snow',  count: 60, cloud: 24, wind: 0.3, sunCloudWarm: false, atmosphere: 'snow', stars: 90, scale: 1.5 }),
    'snowy-rainy':      Object.freeze({ type: 'mix',   count: 100, cloud: 16, wind: 0.4, sunCloudWarm: false, atmosphere: 'snow', stars: 125, scale: 1.4 }),
    'partlycloudy':     Object.freeze({ type: 'cloud', count: 0,   cloud: 18, wind: 0.2, sunCloudWarm: true, atmosphere: 'fair', stars: 125, scale: 1.2 }),
    'windy':            Object.freeze({ type: 'cloud', count: 0,   cloud: 22, wind: 2.2, windVapor: true, sunCloudWarm: false, atmosphere: 'windy', stars: 125, scale: 1.3 }),
    'windy-variant':    Object.freeze({ type: 'cloud', count: 0,   cloud: 15, wind: 2.4, dark: false, windVapor: true, sunCloudWarm: false, atmosphere: 'windy', stars: 125, scale: 1.2 }),
    'sunny':            Object.freeze({ type: 'sun',   count: 0,   cloud: 8,  wind: 0.1, sunCloudWarm: false, atmosphere: 'clear', stars: 0 }),
    'exceptional':      Object.freeze({ type: 'sun',   count: 0,   cloud: 1,  wind: 0.1, sunCloudWarm: false, atmosphere: 'exceptional', stars: 420 }),
    'default':          Object.freeze({ type: 'none',  count: 0,   cloud: 6,  wind: 0.1, sunCloudWarm: false, atmosphere: 'fair', stars: 260 })
});

// Default MDI icons for weather states (used when bottom_text_icon: weather)
const WEATHER_ICONS = Object.freeze({
    'clear-night': 'mdi:weather-night',
    'cloudy': 'mdi:weather-cloudy',
    'fog': 'mdi:weather-fog',
    'hail': 'mdi:weather-hail',
    'lightning': 'mdi:weather-lightning',
    'lightning-rainy': 'mdi:weather-lightning-rainy',
    'partlycloudy': 'mdi:weather-partly-cloudy',
    'pouring': 'mdi:weather-pouring',
    'rainy': 'mdi:weather-rainy',
    'snowy': 'mdi:weather-snowy',
    'snowy-rainy': 'mdi:weather-snowy-rainy',
    'sunny': 'mdi:weather-sunny',
    'windy': 'mdi:weather-windy',
    'windy-variant': 'mdi:weather-windy-variant',
    'exceptional': 'mdi:weather-sunny-alert',
    'default': 'mdi:weather-cloudy'
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
    MAX_BOLTS: 4
});

// Decorative celestial cloud parameters keyed by atmosphere mood.
// Drives cool-palette wispy accents for all non-partlycloudy daytime states.
const CELESTIAL_DECOR = Object.freeze({
    overcast: Object.freeze({ count: 5, baseScale: 0.60, baseOpacity: 0.70 }),
    rain:     Object.freeze({ count: 4, baseScale: 0.55, baseOpacity: 0.62 }),
    pouring:  Object.freeze({ count: 3, baseScale: 0.50, baseOpacity: 0.55 }),
    storm:    Object.freeze({ count: 3, baseScale: 0.55, baseOpacity: 0.58 }),
    snow:     Object.freeze({ count: 5, baseScale: 0.58, baseOpacity: 0.68 }),
    mist:     Object.freeze({ count: 3, baseScale: 0.65, baseOpacity: 0.60 }),
    windy:    Object.freeze({ count: 3, baseScale: 0.45, baseOpacity: 0.55 }),
});

// Particle array names — shared by constructor init and _clearAllParticles
const PARTICLE_ARRAYS = Object.freeze([
    '_rain', '_snow', '_hail', '_clouds', '_fgClouds', '_stars',
    '_bolts', '_fogBanks', '_windVapor', '_shootingStars',
    '_planes', '_birds', '_comets', '_celestialClouds'
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

// Hot-path canvas helper for circular fills.
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
    Object.freeze([0.3,  42, 90, 42]),  // Rich dark gold
    Object.freeze([0.85, 36, 85, 46]),  // Deep warm orange
    Object.freeze([1,    28, 90, 38])   // Burnt amber
]);
const STAR_PALETTE_GLOW = Object.freeze([
    Object.freeze([0.3, 215, 30, 88]),
    Object.freeze([0.85, 200, 5, 95]),
    Object.freeze([1, 35, 35, 85])
]);

// HSL → RGB conversion (returns r,g,b in 0-255). Used at star init time.
function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [(r * 255 + 0.5) | 0, (g * 255 + 0.5) | 0, (b * 255 + 0.5) | 0];
}

// Contrail stripe offsets (positive/negative for twin trails)
const CONTRAIL_OFFSETS = Object.freeze([3, -3]);

// Weather type classification sets (used by cloud palette mood resolution)
const BAD_WEATHER_TYPES = Object.freeze(new Set([
    'rain', 'hail', 'fog', 'lightning', 'lightning-rainy', 'pouring', 'rainy', 'snowy-rainy'
]));
const STORM_TYPES = Object.freeze(new Set([
    'lightning', 'lightning-rainy', 'pouring'
]));
const LIGHT_BAD_BOOST_TYPES = Object.freeze(new Set([
    'rain', 'rainy', 'hail', 'snowy-rainy', 'fog'
]));

// Cloud palette lookup table
// Each entry: [litR,litG,litB, midR,midG,midB, shadowR,shadowG,shadowB, ambient, hlBase, hOff]
const CLOUD_PALETTES = Object.freeze({
    darkNight:    Object.freeze([210,222,244,  48, 60, 96,   8, 13, 32,  0.75, 0.66, 0.05]),
    darkDay:      Object.freeze([218,228,250, 110,128,176,  52, 66,114,  0.86, 0.62, 0.07]),
    lightStorm:   Object.freeze([255,255,255, 192,200,222, 110,124,164,  1.00, 0.78, 0.16]),
    lightRain:    Object.freeze([255,255,255, 202,212,232, 120,136,174,  1.00, 0.80, 0.14]),
    lightFair:    Object.freeze([255,255,255, 222,228,240, 138,152,190,  1.00, 0.76, 0.14]),
    lightOvercast:Object.freeze([255,255,255, 222,228,240, 138,152,190,  1.00, 0.76, 0.14]),
    lightDefault: Object.freeze([252,254,255, 210,218,234, 118,134,174,  1.00, 0.77, 0.14])
});

// Depth-tiered cloud rendering profiles: [shadowCut, surfaceCut, hlMul, shadowRadMul, surfaceRadMul]
const CLOUD_TYPE_PROFILES = Object.freeze({
    cumulus:  Object.freeze([0.25, 0.68, 1.15, 1.12, 0.90]),
    stratus: Object.freeze([0.15, 0.85, 0.55, 1.18, 0.95]),
    cirrus:  Object.freeze([0.00, 0.40, 0.40, 1.00, 0.88]),
    storm:   Object.freeze([0.40, 0.78, 1.05, 1.15, 0.88]),
    organic: Object.freeze([0.30, 0.72, 0.90, 1.10, 0.92]),
    scud:    Object.freeze([0.20, 0.65, 1.00, 1.08, 0.93]),
});

// Sky composition variants — randomly selected per init for visual variety
const SKY_COMPOSITIONS = Object.freeze({
    fair: Object.freeze([
        Object.freeze(['cirrus','cirrus','cirrus','cumulus','cumulus','organic']),
        Object.freeze(['cumulus','cumulus','cumulus','organic','organic','cirrus']),
        Object.freeze(['organic','organic','cirrus','cirrus','cumulus','stratus']),
        Object.freeze(['cumulus','cumulus','cumulus','cumulus','organic','stratus']),
    ]),
    clear: Object.freeze([
        Object.freeze(['cirrus','cirrus','cirrus','cumulus','organic']),
        Object.freeze(['cumulus','cumulus','organic','cirrus','cirrus']),
        Object.freeze(['cirrus','cirrus','organic','organic','cumulus']),
    ]),
    overcast: Object.freeze([
        Object.freeze(['stratus','stratus','stratus','stratus','organic','organic']),
        Object.freeze(['stratus','stratus','stratus','organic','cumulus','cumulus']),
        Object.freeze(['stratus','stratus','stratus','stratus','stratus','cumulus']),
        Object.freeze(['organic','organic','organic','stratus','stratus','stratus']),
    ]),
    cloudy: Object.freeze([
        Object.freeze(['stratus','stratus','stratus','stratus','organic','cumulus']),
        Object.freeze(['stratus','stratus','organic','organic','cumulus','cumulus']),
        Object.freeze(['stratus','stratus','stratus','cumulus','cumulus','organic']),
        Object.freeze(['organic','organic','stratus','stratus','stratus','cumulus']),
    ]),
    windy: Object.freeze([
        Object.freeze(['cirrus','cirrus','cirrus','stratus','stratus','organic']),
        Object.freeze(['stratus','stratus','cirrus','cirrus','organic','organic']),
        Object.freeze(['cirrus','cirrus','cirrus','cirrus','stratus','stratus']),
    ]),
    snow: Object.freeze([
        Object.freeze(['stratus','stratus','stratus','organic','organic','cumulus']),
        Object.freeze(['stratus','stratus','organic','organic','organic','stratus']),
        Object.freeze(['organic','organic','stratus','stratus','cumulus','stratus']),
    ]),
    rain: Object.freeze([
        Object.freeze(['stratus','stratus','stratus','organic','organic','cumulus']),
        Object.freeze(['organic','organic','stratus','stratus','stratus','cumulus']),
        Object.freeze(['stratus','stratus','organic','cumulus','cumulus','stratus']),
    ]),
    _default: Object.freeze([
        Object.freeze(['cumulus','cumulus','organic','organic','stratus','cirrus']),
        Object.freeze(['organic','organic','cumulus','cumulus','stratus','stratus']),
        Object.freeze(['cirrus','cirrus','cumulus','organic','stratus','stratus']),
    ])
});

// Ring buffer capacities for trail management
const TRAIL_CAP_SHOOTING_STAR = 22;
const TRAIL_CAP_COMET = 100;
const TRAIL_CAP_PLANE = 500;

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
    static generateOrganicPuffs(isStorm, seed, baseUnit = 100) {
        const puffs = [];
        const seededRandom = this._seededRandom(seed);
        const s = baseUnit / 100;
        const puffCount = isStorm ? 14 : 12;
        const baseWidth = (isStorm ? 110 : 105) * s;
        const baseHeight = (isStorm ? 60 : 42) * s;

        for (let i = 0; i < puffCount; i++) {
            const angle = (i / puffCount) * TWO_PI + seededRandom() * 0.5;
            const distFromCenter = seededRandom() * 0.6 + 0.2;
            
            let dx = Math.cos(angle) * (baseWidth / 2) * distFromCenter;
            let dy = Math.sin(angle) * (baseHeight / 2) * distFromCenter * 0.6;

            if (isStorm) {
                if (dy > 0) {
                    dy *= 0.4;
                } else if (Math.abs(dx) < baseWidth * 0.4) {
                    dy -= (seededRandom() * 28 * s);
                }
            }

            const centerDist = Math.sqrt(dx * dx + dy * dy) / (baseWidth / 2);
            const baseRad = (isStorm ? 62 : 50) * s;
            const radVariation = (isStorm ? 22 : 16) * s;
            const rad = baseRad + seededRandom() * radVariation - centerDist * 12 * s;
            const verticalShade = 0.4 + (1 - (dy + baseHeight / 2) / baseHeight) * 0.4;
            const shade = verticalShade + seededRandom() * 0.05;
            const softness = 0.3 + seededRandom() * 0.4;
            const squash = 0.75 + seededRandom() * 0.25;
            const rotation = (seededRandom() - 0.5) * 1.5;
            
            puffs.push({
                offsetX: dx, offsetY: dy,
                rad: Math.max(15 * s, rad),
                shade: Math.min(1, shade),
                softness, squash, rotation,
                depth: seededRandom()
            });
        }

        const detailCount = isStorm ? 8 : 6;
        for (let i = 0; i < detailCount; i++) {
            const angle = seededRandom() * TWO_PI;
            const dist = 0.3 + seededRandom() * 0.45;
            puffs.push({
                offsetX: Math.cos(angle) * (baseWidth / 2) * dist,
                offsetY: Math.sin(angle) * (baseHeight / 2) * dist * 0.5 - 10 * s,
                rad: (14 + seededRandom() * 16) * s,
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

    static generateWispyPuffs(seed, baseUnit = 100) {
        const puffs = [];
        const seededRandom = this._seededRandom(seed);
        const s = baseUnit / 100;
        const puffCount = 8 + Math.floor(seededRandom() * 4);

        for (let i = 0; i < puffCount; i++) {
            const angle = (i / puffCount) * TWO_PI + seededRandom() * 0.8;
            const dist = 0.3 + seededRandom() * 0.5;
            puffs.push({
                offsetX: Math.cos(angle) * 45 * s * dist,
                offsetY: Math.sin(angle) * 25 * s * dist,
                rad: (12 + seededRandom() * 18) * s,
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

    static generateSunEnhancementPuffs(seed, baseUnit = 100) {
        const puffs = [];
        const seededRandom = this._seededRandom(seed);
        const s = baseUnit / 100;
        const puffCount = 5 + Math.floor(seededRandom() * 3);

        for (let i = 0; i < puffCount; i++) {
            const spreadX = (i - puffCount / 2) * 12 * s + (seededRandom() - 0.5) * 8 * s;
            const spreadY = (seededRandom() - 0.5) * 10 * s;
            puffs.push({
                offsetX: spreadX,
                offsetY: spreadY,
                rad: (10 + seededRandom() * 12) * s,
                shade: 0.7 + seededRandom() * 0.3,
                softness: 0.3 + seededRandom() * 0.3,
                squash: 0.9 + seededRandom() * 0.1,
                rotation: (seededRandom() - 0.5) * 0.5,
                depth: seededRandom()
            });
        }

        for (let i = 0; i < 3; i++) {
            puffs.push({
                offsetX: (seededRandom() - 0.5) * 40 * s,
                offsetY: (seededRandom() - 0.5) * 15 * s,
                rad: (7 + seededRandom() * 7) * s,
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

    static generateMixedPuffs(seed, variety = 'cumulus', baseUnit = 100) {
        const puffs = [];
        const seededRandom = this._seededRandom(seed);
        const s = baseUnit / 100;

        if (variety === 'cumulus') {
            const baseWidth   = 110 * s;
            const towerFactor = 0.5 + seededRandom() * 0.9;
            const asymShift   = (seededRandom() - 0.5) * 22 * s;

            const baseCount = 4 + Math.floor(seededRandom() * 2);
            for (let i = 0; i < baseCount; i++) {
                const t = baseCount > 1 ? (i / (baseCount - 1)) - 0.5 : 0;
                puffs.push({
                    offsetX: t * baseWidth * 0.88 + (seededRandom() - 0.5) * 15 * s,
                    offsetY: (6 + seededRandom() * 10) * s,
                    rad: (26 + seededRandom() * 18) * s,
                    shade: 0.38 + seededRandom() * 0.05,
                    softness: 0.35, squash: 1.0, rotation: 0,
                    depth: seededRandom() * 0.25
                });
            }

            const bodyCount = 8 + Math.floor(seededRandom() * 4);
            for (let i = 0; i < bodyCount; i++) {
                puffs.push({
                    offsetX: (seededRandom() - 0.5) * baseWidth * (0.50 + seededRandom() * 0.40) + asymShift * 0.35,
                    offsetY: -(20 + seededRandom() * 58) * s,
                    rad: (22 + seededRandom() * 20) * s,
                    shade: 0.62 + seededRandom() * 0.08,
                    softness: 0.28, squash: 1.0, rotation: 0,
                    depth: 0.22 + seededRandom() * 0.48
                });
            }

            const crownCount = 4 + Math.floor(seededRandom() * 2 + towerFactor * 1.5);
            for (let i = 0; i < crownCount; i++) {
                puffs.push({
                    offsetX: (seededRandom() - 0.5) * baseWidth * 0.42 + asymShift * 0.60,
                    offsetY: -(82 + towerFactor * 54 + seededRandom() * 52) * s,
                    rad: (16 + seededRandom() * 18) * s,
                    shade: 0.80 + seededRandom() * 0.05,
                    softness: 0.22, squash: 1.0, rotation: 0,
                    depth: 0.68 + seededRandom() * 0.32
                });
            }

            for (let i = 0; i < 3; i++) {
                const a = seededRandom() * TWO_PI;
                puffs.push({
                    offsetX: Math.cos(a) * (baseWidth * 0.44 + seededRandom() * 14 * s),
                    offsetY: -(28 + seededRandom() * 48) * s,
                    rad: (14 + seededRandom() * 15) * s,
                    shade: 0.60 + seededRandom() * 0.10,
                    softness: 0.38, squash: 1.0, rotation: 0,
                    depth: seededRandom()
                });
            }
        } else if (variety === 'stratus') {
            const puffCount = 14 + Math.floor(seededRandom() * 6);

            for (let i = 0; i < puffCount; i++) {
                const spreadX = (i - puffCount / 2) * 22 * s + (seededRandom() - 0.5) * 18 * s;
                const spreadY = (seededRandom() - 0.5) * 14 * s;
                const normalY = (spreadY + 7 * s) / (14 * s);
                puffs.push({
                    offsetX: spreadX,
                    offsetY: spreadY,
                    rad: (16 + seededRandom() * 14) * s,
                    shade: 0.48 + (1 - normalY) * 0.30 + seededRandom() * 0.06,
                    softness: 0.2 + seededRandom() * 0.3,
                    squash: 0.55,
                    rotation: 0,
                    depth: seededRandom()
                });
            }

            const coreCount = 4 + Math.floor(seededRandom() * 3);
            for (let i = 0; i < coreCount; i++) {
                const spreadX = (i - coreCount / 2) * 26 * s + (seededRandom() - 0.5) * 12 * s;
                puffs.push({
                    offsetX: spreadX,
                    offsetY: (seededRandom() - 0.5) * 6 * s,
                    rad: (18 + seededRandom() * 12) * s,
                    shade: 0.60 + seededRandom() * 0.15,
                    softness: 0.25 + seededRandom() * 0.2,
                    squash: 0.6,
                    rotation: 0,
                    depth: 0.4 + seededRandom() * 0.3
                });
            }
        } else if (variety === 'cirrus') {
            const streakCount = 4 + Math.floor(seededRandom() * 3);

            for (let sc = 0; sc < streakCount; sc++) {
                const streakX = (sc - streakCount / 2) * 35 * s;
                const streakAngle = (seededRandom() - 0.5) * 0.3;
                const puffsInStreak = 6 + Math.floor(seededRandom() * 4);

                for (let i = 0; i < puffsInStreak; i++) {
                    const progress = i / puffsInStreak;
                    puffs.push({
                        offsetX: streakX + progress * 40 * s * Math.cos(streakAngle),
                        offsetY: progress * 30 * s * Math.sin(streakAngle) + (seededRandom() - 0.5) * 6 * s,
                        rad: (8 + seededRandom() * 8 * (1 - progress * 0.5)) * s,
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
        // _isTimeNight drives content (stars/moon), _isThemeDark drives visual contrast
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
        this._resizeDebounceTimer = null;
        this._pendingResize = false;
        this._needsReinit = false;
        this._cachedDimensions = { width: 0, height: 0, dpr: 1 };
        this._lastInitWidth = 0; // Resize tolerance baseline

        // --- DOM Text Cache ---
        this._lastTempVal = null;
        this._lastTempUnit = null;
        this._lastLocStr = null;

        // --- HA Entity Cache (shallow comparison of tracked values) ---
        this._lastSnapshot = null;

        this._prevStyleSig = this._prevSunLeft = this._prevTextPosition = this._prevCcSig = null;

        this._entityErrors = new Map();
        this._lastErrorLog = 0;

        // --- Custom Cards Container ---
        this._customCardElements = [];
        this._hass = null;
        this._prevCustomCssClasses = null;

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
            

            /* --- BASE STANDALONE CARD --- */
            #card-root.standalone {
                box-shadow: var(--ha-card-box-shadow, 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12));
                background-color: transparent;
                overflow: hidden;
                background-size: 100% 100%;
				border-width: var(--awc-card-border-width, var(--ha-card-border-width, 0px));
				border-style: solid;
				border-color: var(--ha-card-border-color, var(--divider-color, #e0e0e0));
				box-sizing: border-box;
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
                        rgba(var(--g-rgb, 245,245,240), 0.88) 0%,
                        rgba(var(--g-rgb, 245,245,240), 0.45) 18%,
                        rgba(var(--g-rgb, 245,245,240), 0.12) 48%,
                        rgba(var(--g-rgb, 245,245,240), 0) 100%
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
                opacity: var(--g-op, 0);
            }
			
			/* --- IMMERSIVE MODE OVERRIDE: Shrink the huge glows so they don't cut off --- */
            #card-root:not(.standalone)::after {
                background-image: 
                    radial-gradient(
                        circle calc(var(--c-r, 10cqmax) * 0.5) at var(--c-x, 60%) var(--c-y, 40%),
                        rgba(var(--g-rgb, 245,245,240), 0.88) 0%,
                        rgba(var(--g-rgb, 245,245,240), 0.45) 18%,
                        rgba(var(--g-rgb, 245,245,240), 0.12) 48%,
                        rgba(var(--g-rgb, 245,245,240), 0) 100%
                    ),
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

            /* Day backgrounds — driven by CSS custom properties
               Each weather state has its own hue character, not just blue variations.
               --bg-hl is mood-tinted (not white) for atmospheric top glow.
               --bg-hz/--bg-hz-a control the horizon atmosphere glow from the bottom. */
            #card-root.standalone.scheme-day {
                --bg-hl: 255,248,228; --bg-a1: 0.38; --bg-a2: 0.05; --bg-s2: 18%; --bg-s3: 42%;
                --bg-c1: #164FA6; --bg-c2: #4480C8; --bg-c3: #8CB9DD;
                --bg-hz: 255,222,172; --bg-hz-a: 0.10;
            }
            #card-root.standalone.scheme-day.weather-exceptional { --bg-hl:255,244,210; --bg-a1:0.48; --bg-a2:0.08; --bg-c1:#0D4194; --bg-c2:#3470BD; --bg-c3:#7CB0DC; --bg-hz:255,228,162; --bg-hz-a:0.16; }
            #card-root.standalone.scheme-day.weather-partly { --bg-hl:250,248,236; --bg-a1:0.36; --bg-a2:0.05; --bg-s2:20%; --bg-s3:45%; --bg-c1:#1955A7; --bg-c2:#4683C8; --bg-c3:#90B8DD; --bg-hz:255,226,182; --bg-hz-a:0.08; }
            #card-root.standalone.scheme-day.weather-overcast { --bg-hl:245,248,252; --bg-a1:0.35; --bg-a2:0.05; --bg-s2:22%; --bg-s3:48%; --bg-c1:#37709D; --bg-c2:#618EB4; --bg-c3:#ADC8DC; --bg-hz:240,230,210; --bg-hz-a:0.06; }
			#card-root.standalone.scheme-day.weather-rainy { --bg-hl:225,240,245; --bg-a1:0.35; --bg-a2:0.05; --bg-s2:20%; --bg-s3:45%; --bg-c1:#426A93; --bg-c2:#658FBA; --bg-c3:#B3D6E1; --bg-hz:190,210,225; --bg-hz-a:0.10; }
			#card-root.standalone.scheme-day.weather-pouring { --bg-hl:210,225,235; --bg-a1:0.32; --bg-a2:0.05; --bg-s2:20%; --bg-s3:45%; --bg-c1:#325478; --bg-c2:#527A9E; --bg-c3:#92B8C6; --bg-hz:170,190,210; --bg-hz-a:0.08; }
			#card-root.standalone.scheme-day.weather-storm { --bg-hl:250,252,255; --bg-a1:0.45; --bg-a2:0.08; --bg-s2:24%; --bg-s3:52%; --bg-c1:#436181; --bg-c2:#516B83; --bg-c3:#B6C5D4; --bg-hz:185,200,215; --bg-hz-a:0.05; }
			#card-root.standalone.scheme-day.weather-snow { --bg-hl:234,240,252; --bg-a1:0.36; --bg-a2:0.06; --bg-s2:20%; --bg-s3:45%; --bg-c1:#4887AB; --bg-c2:#77A4C1; --bg-c3:#ABC4D4; --bg-hz:226,234,250; --bg-hz-a:0.10; }
            #card-root.standalone.scheme-day.weather-fog { --bg-hl:235,240,245; --bg-a1:0.38; --bg-a2:0.05; --bg-s2:20%; --bg-s3:45%; --bg-c1:#3C5E78; --bg-c2:#5F84A0; --bg-c3:#A3BDCD; --bg-hz:205,215,225; --bg-hz-a:0.15; }
			
			/* Night backgrounds — same template, dark palette */
            #card-root.standalone.scheme-night {
                --bg-hl: 155,185,252; --bg-a1: 0.14; --bg-a2: 0.04; --bg-s2: 40%; --bg-s3: 70%;
                --bg-c1: #000000; --bg-c2: #050E1A; --bg-c3: #122438;
            }
            #card-root.standalone.scheme-night.weather-exceptional { --bg-a1:0.17; --bg-a2:0.05; --bg-c1:#000000; --bg-c2:#050E1A; --bg-c3:#10223A; }
            #card-root.standalone.scheme-night.weather-partly { --bg-a1:0.12; --bg-a2:0.03; --bg-s2:45%; --bg-s3:75%; --bg-c1:#010204; --bg-c2:#091420; --bg-c3:#182A3E; }
            #card-root.standalone.scheme-night.weather-overcast { --bg-hl:135,155,188; --bg-a1:0.10; --bg-a2:0.02; --bg-s2:50%; --bg-s3:80%; --bg-c1:#020304; --bg-c2:#0C1016; --bg-c3:#1A2028; }
            #card-root.standalone.scheme-night.weather-rainy { --bg-hl:130,145,168; --bg-a1:0.11; --bg-a2:0.03; --bg-s2:45%; --bg-s3:75%; --bg-c1:#020406; --bg-c2:#0C141C; --bg-c3:#1A2630; }
			#card-root.standalone.scheme-night.weather-pouring { --bg-hl:112,132,162; --bg-a1:0.09; --bg-a2:0.02; --bg-s2:45%; --bg-s3:75%; --bg-c1:#010203; --bg-c2:#060C14; --bg-c3:#0E1822; }
			#card-root.standalone.scheme-night.weather-storm { --bg-hl:95,108,148; --bg-a1:0.07; --bg-a2:0.02; --bg-s2:45%; --bg-s3:75%; --bg-c1:#000000; --bg-c2:#030508; --bg-c3:#0A1018; }
            #card-root.standalone.scheme-night.weather-snow { --bg-hl:175,198,232; --bg-a1:0.14; --bg-a2:0.04; --bg-s2:45%; --bg-s3:75%; --bg-c1:#030508; --bg-c2:#0E1822; --bg-c3:#1E2C3A; }
            #card-root.standalone.scheme-night.weather-fog { --bg-hl:145,155,178; --bg-a1:0.14; --bg-a2:0.04; --bg-s2:50%; --bg-s3:85%; --bg-c1:#040506; --bg-c2:#101216; --bg-c3:#1E2228; }

			/* Forced dark day backgrounds — differentiated by hue family, not desaturation.
               Navy: sunny/exceptional/partly/overcast. Teal-blue: rainy/pouring.
               Indigo: storm. Cold blue: snow. Violet-grey: fog. */
            #card-root.standalone.scheme-night.time-day {
                --bg-hl: 148,184,242; --bg-a1: 0.22; --bg-a2: 0.06; --bg-s2: 20%; --bg-s3: 48%;
                --bg-c1: #0A1C42; --bg-c2: #1A3268; --bg-c3: #2E5090;
                --bg-hz: 130,160,215; --bg-hz-a: 0.05;
            }
            #card-root.standalone.scheme-night.time-day.weather-exceptional { --bg-hl:141,175,230; --bg-a1:0.22; --bg-a2:0.06; --bg-s2:20%; --bg-s3:48%; --bg-c1:#091A3F; --bg-c2:#182F63; --bg-c3:#2B4C89; --bg-hz:124,152,205; --bg-hz-a:0.05; }
            #card-root.standalone.scheme-night.time-day.weather-partly { --bg-hl:150,184,240; --bg-a1:0.20; --bg-a2:0.06; --bg-s2:22%; --bg-s3:50%; --bg-c1:#0C2048; --bg-c2:#1C386A; --bg-c3:#305692; --bg-hz:128,158,214; --bg-hz-a:0.04; }
            #card-root.standalone.scheme-night.time-day.weather-overcast { --bg-hl:148,172,210; --bg-a1:0.18; --bg-a2:0.05; --bg-s2:22%; --bg-s3:50%; --bg-c1:#0B1D40; --bg-c2:#19325A; --bg-c3:#2B4B7C; --bg-hz-a:0; }
			#card-root.standalone.scheme-night.time-day.weather-rainy { --bg-hl:130,160,185; --bg-a1:0.17; --bg-a2:0.05; --bg-s2:24%; --bg-s3:55%; --bg-c1:#081C28; --bg-c2:#16344A; --bg-c3:#285270; --bg-hz-a:0; }
			#card-root.standalone.scheme-night.time-day.weather-pouring { --bg-hl:110,135,165; --bg-a1:0.15; --bg-a2:0.04; --bg-s2:24%; --bg-s3:55%; --bg-c1:#061822; --bg-c2:#122E40; --bg-c3:#224C66; --bg-hz-a:0; }
			#card-root.standalone.scheme-night.time-day.weather-storm { --bg-hl:130,138,185; --bg-a1:0.17; --bg-a2:0.05; --bg-s2:22%; --bg-s3:52%; --bg-c1:#0C1028; --bg-c2:#1A1E48; --bg-c3:#42506E; --bg-hz:105,112,160; --bg-hz-a:0.04; }
			#card-root.standalone.scheme-night.time-day.weather-snow { --bg-hl:165,195,235; --bg-a1:0.22; --bg-a2:0.06; --bg-s2:20%; --bg-s3:48%; --bg-c1:#0C1C38; --bg-c2:#1E3656; --bg-c3:#405C82; --bg-hz:140,160,208; --bg-hz-a:0.06; }
            #card-root.standalone.scheme-night.time-day.weather-fog { --bg-hl:140,142,170; --bg-a1:0.18; --bg-a2:0.05; --bg-s2:28%; --bg-s3:60%; --bg-c1:#14162A; --bg-c2:#262A44; --bg-c3:#42466A; --bg-hz-a:0; }

            /* Day background — radial gradient centered on sun position for natural sky lighting */
            #card-root.standalone.scheme-day {
                background-image:
                    radial-gradient(ellipse 160% 42% at 50% -18%, rgba(var(--bg-hl), var(--bg-a1)) 0%, rgba(var(--bg-hl), 0) 80%),
                    linear-gradient(0deg, rgba(var(--bg-hz, 255,200,150), var(--bg-hz-a, 0)) 0%, transparent 30%),
                    radial-gradient(circle farthest-corner at var(--c-x, 65%) var(--c-y, 35%), var(--bg-c3) 10%, var(--bg-c2) 75%, var(--bg-c1) 100%);
            }
            /* Night background — radial gradient centered on moon position for moonlit sky */
            #card-root.standalone.scheme-night {
                background-image:
                    radial-gradient(ellipse 160% 42% at 50% -18%, rgba(var(--bg-hl), var(--bg-a1)) 0%, rgba(var(--bg-hl), 0) 80%),
                    linear-gradient(0deg, rgba(var(--bg-hz, 155,168,200), var(--bg-hz-a, 0)) 0%, transparent 30%),
                    radial-gradient(circle farthest-corner at var(--c-x, 35%) var(--c-y, 25%), var(--bg-c3) 0%, var(--bg-c2) 75%, var(--bg-c1) 100%);
            }
            /* Forced-dark day background — radial gradient centered on sun position */
            #card-root.standalone.scheme-night.time-day {
                background-image:
                    radial-gradient(ellipse 160% 42% at 50% -18%, rgba(var(--bg-hl), var(--bg-a1)) 0%, rgba(var(--bg-hl), 0) 80%),
                    linear-gradient(0deg, rgba(var(--bg-hz, 140,160,210), var(--bg-hz-a, 0)) 0%, transparent 30%),
                    radial-gradient(circle farthest-corner at var(--c-x, 65%) var(--c-y, 35%), var(--bg-c3) 0%, var(--bg-c2) 75%, var(--bg-c1) 100%);
            }
			
			
            #text-wrapper {
                position: absolute; inset: 0; z-index: 10;
                pointer-events: none; display: none;
                flex-direction: column; box-sizing: border-box;
                padding: var(--awc-card-padding, var(--ha-space-4, 16px)) calc(var(--awc-card-padding, var(--ha-space-4, 16px)) + var(--awc-text-side-offset, 4px));
                gap: var(--awc-text-gap, 10px);
                overflow: visible;
            }
			
            #card-root #text-wrapper { display: flex; }
            #temp-text, #bottom-text {
                pointer-events: none;
                font-family: var(--ha-font-family, var(--paper-font-body1_-_font-family, sans-serif));
                transition: color 0.3s ease, text-shadow 0.3s ease;
                min-width: 0; max-width: 100%;
            }
            #temp-text {
                font-size: var(--awc-top-font-size, clamp(24px, 11cqw, 52px));
                font-weight: var(--awc-top-font-weight, 600); line-height: 1;
                letter-spacing: -1px; display: flex; align-items: flex-start; gap: 6px;
                white-space: nowrap;
            }
            .temp-val { overflow: visible; text-overflow: ellipsis; min-width: 0; }
            .temp-unit { font-size: 0.5em; font-weight: 500; padding-top: 6px; opacity: 0.7; flex-shrink: 0; }
            #bottom-text {
                font-size: var(--awc-bottom-font-size, clamp(15px, 5cqmin, 26px));
                font-weight: var(--awc-bottom-font-weight, 500); opacity: var(--awc-bottom-opacity, 0.7);
                letter-spacing: 0.5px; white-space: nowrap; display: flex; gap: 6px;
            }
            #bottom-text > span { overflow: visible; text-overflow: ellipsis; min-width: 0; }
            #bottom-text ha-icon,
            #bottom-text ha-state-icon { --mdc-icon-size: var(--awc-icon-size, 1.1em); opacity: 0.9; }
            /* MDI glyphs have built-in whitespace; pull leading icons left
               so the visual padding matches the right edge. Only applies
               when the icon is the first child (i.e. it isn't hidden). */
            #bottom-text > ha-icon:first-child,
            #bottom-text > ha-state-icon:first-child,
            #bottom-text > img.custom-bottom-icon:first-child { margin-left: -2px; }
			
			/* --- Text Background Presets (text_background_style) --- */

            #temp-text.with-bg { --_bg: var(--awc-top-bg-color, var(--_text-bg)); }
            #bottom-text.with-bg { --_bg: var(--awc-bottom-bg-color, var(--_text-bg)); }

            #temp-text.with-bg {
                padding: var(--awc-top-bg-padding, 8px 14px);
                border-radius: var(--awc-top-bg-radius, var(--awc-card-border-radius, var(--ha-card-border-radius, 12px)));
                width: fit-content; align-items: flex-start;
                text-shadow: none !important;
            }
            #bottom-text.with-bg {
                padding: var(--awc-bottom-bg-padding, 5px 10px);
                border-radius: var(--awc-bottom-bg-radius, var(--awc-card-border-radius, var(--ha-card-border-radius, 12px)));
                width: fit-content; align-items: center;
                text-shadow: none !important;
            }

            /* Per-style scheme fills */
            #card-root.scheme-day .pill    { --_text-bg: rgba(255,255,255,0.52); --_pill-shadow: inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.08); }
            #card-root.scheme-day .frosted { --_text-bg: rgba(255,255,255,0.18); --_text-bg-border: rgba(255,255,255,0.32); }
            #card-root.scheme-day .fade    { --_text-bg: rgba(255,255,255,0.65); }
            #card-root.scheme-night .pill    { --_text-bg: rgba(0,0,0,0.58); --_pill-shadow: inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.3); }
            #card-root.scheme-night .frosted { --_text-bg: rgba(0,0,0,0.26); --_text-bg-border: rgba(255,255,255,0.10); }
            #card-root.scheme-night .fade    { --_text-bg: rgba(0,0,0,0.70); }

            /* pill — opaque fill, inset + drop shadow, no blur, no border */
            .with-bg.pill {
                background: var(--_bg);
                box-shadow: var(--awc-bg-shadow, var(--_pill-shadow));
            }

            /* frosted — translucent fill, backdrop blur, hairline border */
            .with-bg.frosted {
                background: var(--_bg);
                border: var(--awc-bg-border, 1px solid var(--_text-bg-border));
            }
            #temp-text.with-bg.frosted {
                backdrop-filter: var(--awc-top-bg-filter, blur(10px));
                -webkit-backdrop-filter: var(--awc-top-bg-filter, blur(10px));
            }
            #bottom-text.with-bg.frosted {
                backdrop-filter: var(--awc-bottom-bg-filter, blur(10px));
                -webkit-backdrop-filter: var(--awc-bottom-bg-filter, blur(10px));
            }

            /* fade — blurred pseudo, feathered edges, no hard boundary */
            .with-bg.fade { position: relative; isolation: isolate; }
            .with-bg.fade::before {
                content: ""; position: absolute;
                inset: var(--awc-bg-fade-extend, -8px);
                border-radius: inherit; z-index: -1; pointer-events: none;
                background: var(--_bg);
                filter: blur(var(--awc-bg-fade-blur, 16px));
                opacity: var(--awc-bg-fade-opacity, 1);
            }

            /* --- Combined Text Mode --- */
            #bottom-text.combined { opacity: 1; gap: 5px; }
            #bottom-text .combined-top { font-weight: var(--awc-top-font-weight, 600); }
            #bottom-text .combined-unit { font-weight: 500; opacity: 0.55; margin-right: 1px; }
            #bottom-text .combined-sep { opacity: 0.45; font-weight: 300; }
            #bottom-text .combined-sep::before { content: var(--awc-combine-separator, "|"); }
            #bottom-text .combined-bottom { opacity: var(--awc-bottom-opacity, 0.7); }
            
			#bottom-text img.custom-bottom-icon {
                position: relative;
                height: var(--awc-icon-size, 1.5em);
                width: var(--awc-icon-size, 1.5em);
                object-fit: contain;
                flex-shrink: 0;
				filter: var(--awc-icon-drop-shadow, drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.3)));
            }
			
			#text-wrapper.swap-texts #temp-text { order: 2; }
            #text-wrapper.swap-texts #bottom-text { order: 1; }
			
			/* --- SPLIT LAYOUTS --- */
            #text-wrapper.split-top, 
            #text-wrapper.split-bottom {
                flex-direction: row;
                justify-content: space-between;
            }
            #text-wrapper.split-top { align-items: flex-start; }
            #text-wrapper.split-bottom { align-items: flex-end; }

            /* --- CUSTOM CARDS WRAPPER --- */
            #custom-cards-wrapper {
                position: absolute; inset: 0; box-sizing: border-box; z-index: 10;
                display: none;
                flex-wrap: wrap;
                flex-direction: var(--awc-custom-cards-direction, row);
                gap: var(--awc-custom-cards-gap, 8px);
                justify-content: var(--awc-custom-cards-justify, flex-start);
                align-items: var(--awc-custom-cards-align, flex-start);
                padding: var(--awc-card-padding, var(--ha-space-4, 16px));
                pointer-events: none;
                overflow: visible;
            }
            #custom-cards-wrapper.has-cards { display: flex; }
            #custom-cards-wrapper > * { pointer-events: auto; }

            /* custom_cards_position: horizontal alignment */
            #custom-cards-wrapper.cc-text-left    { justify-content: flex-start; }
            #custom-cards-wrapper.cc-text-right   { justify-content: flex-end; }
            #custom-cards-wrapper.cc-text-hcenter { justify-content: center; }
            /* custom_cards_position: vertical alignment */
            #custom-cards-wrapper.cc-align-top    { align-content: flex-start; }
            #custom-cards-wrapper.cc-align-center { align-content: center; }
            #custom-cards-wrapper.cc-align-bottom { align-content: flex-end; }

            /* text_position: horizontal alignment */
            .text-left    { align-items: flex-start; text-align: left; }
            .text-right   { align-items: flex-end;   text-align: right; }
            .text-hcenter { align-items: center;     text-align: center; }
            /* text_alignment: vertical distribution */
            .align-spread { justify-content: space-between; }
            .align-top    { justify-content: flex-start; }
            .align-center { justify-content: center; }
            .align-bottom { justify-content: flex-end; }
            /* --- Scheme defaults: text + background fills --- */
            #card-root.scheme-day {
                --awc-text-color: var(--awc-text-day, #2c2c2e);
                --awc-text-shadow-active: var(--awc-text-shadow-day, 0 1px 2px rgba(255, 255, 255, 0.9), 0 0 8px rgba(255, 255, 255, 0.7), 0 0 14px rgba(255, 255, 255, 0.5));
                --_text-bg: rgba(255, 255, 255, 0.25);
                --_text-bg-border: rgba(255, 255, 255, 0.2);
            }
            #card-root.scheme-night {
                --awc-text-color: var(--awc-text-night, #ffffff);
                --awc-text-shadow-active: var(--awc-text-shadow-night, 0 1px 3px rgba(0, 0, 0, 0.9), 0 2px 8px rgba(0, 0, 0, 0.7), 0 0 16px rgba(0, 0, 0, 0.5));
                --_text-bg: rgba(0, 0, 0, 0.35);
                --_text-bg-border: rgba(255, 255, 255, 0.08);
            }
            #temp-text, #bottom-text {
                color: var(--awc-text-color);
                text-shadow: var(--awc-text-shadow-active);
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

        // Create persistent child elements for temp display
        const tempVal = document.createElement('span'); tempVal.className = 'temp-val';
        const tempUnit = document.createElement('span'); tempUnit.className = 'temp-unit';
        tempText.append(tempVal, tempUnit);

        // Bottom text gets its children rebuilt per-mode (combined vs separate)
        // but we track the container for class toggling
        textWrapper.append(tempText, bottomText);

        const customCardsWrapper = document.createElement('div'); customCardsWrapper.id = 'custom-cards-wrapper';

        root.append(bg, mid, img, fg, textWrapper, customCardsWrapper);
        this.shadowRoot.append(style, root);

        this._elements = { root, bg, mid, img, fg, tempText, bottomText, textWrapper, customCardsWrapper, tempVal, tempUnit };

        const ctxOpts = { alpha: true, willReadFrequently: false };
        const bgCtx  = bg.getContext('2d', ctxOpts);
        const midCtx = mid.getContext('2d', ctxOpts);
        const fgCtx  = fg.getContext('2d', ctxOpts);

        if (!bgCtx || !midCtx || !fgCtx) {
            console.error('ATMOSPHERIC-WEATHER-CARD: Failed to get canvas context');
            return;
        }
        bgCtx.imageSmoothingQuality = 'high';
        midCtx.imageSmoothingQuality = 'high';
        fgCtx.imageSmoothingQuality = 'high';
        this._ctxs = { bg: bgCtx, mid: midCtx, fg: fgCtx };
    }

    connectedCallback() {
        if (!this._resizeObserver) {
            this._resizeObserver = new ResizeObserver((entries) => {
                if (!entries.length) return;
                // Use borderBoxSize to capture the full visual dimension including
                // padding. contentRect strips padding, which breaks full-width mode
                // where negative margins + positive padding create edge-to-edge bleed.
                // borderBoxSize is layout-free (no forced reflow). Fallback to
                // offsetWidth/Height for older Safari WebViews that lack borderBoxSize.
                const entry = entries[0];
                let w, h;
                if (entry.borderBoxSize && entry.borderBoxSize[0]) {
                    w = entry.borderBoxSize[0].inlineSize;
                    h = entry.borderBoxSize[0].blockSize;
                } else {
                    w = entry.target.offsetWidth;
                    h = entry.target.offsetHeight;
                }
                const changed = this._updateCanvasDimensions(w, h);
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
                    rootMargin: '200px'
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
        this._customCardElements = [];
        this._initializationComplete = false;
    }

    _clearAllParticles() {
        if (this._cloudAtlas) {
            this._cloudAtlas.width = 0;
            this._cloudAtlas.height = 0;
            this._cloudAtlas = null;
        }
        
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
        } else if (String(config.card_height).toLowerCase() === 'auto') {
            this.style.height = '100%';
            this.style.minHeight = '0';
            this.style.aspectRatio = 'auto';
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

        // --- Custom Cards: clear previous and rebuild ---
        this._customCardElements = [];
        this._prevCcSig = null;
        if (this._elements?.customCardsWrapper) {
            this._elements.customCardsWrapper.innerHTML = '';
            this._elements.customCardsWrapper.classList.toggle('has-cards', false);
            // Remove previous user CSS class(es) if any, then apply new one(s)
            if (this._prevCustomCssClasses && this._prevCustomCssClasses.length) {
                this._elements.customCardsWrapper.classList.remove(...this._prevCustomCssClasses);
            }
            const userClasses = (config.custom_cards_css_class || '').split(' ').filter(Boolean);
            this._prevCustomCssClasses = userClasses.length ? userClasses : null;
            if (userClasses.length) {
                this._elements.customCardsWrapper.classList.add(...userClasses);
            }
        }

        const customCards = config.custom_cards;
        if (Array.isArray(customCards) && customCards.length > 0 && this._elements?.customCardsWrapper) {
            this._elements.customCardsWrapper.classList.add('has-cards');
            window.loadCardHelpers().then(helpers => {
                const wrapper = this._elements?.customCardsWrapper;
                if (!wrapper) return;
                // Guard against stale promise: if setConfig fired again, bail
                if (this._config !== config) return;
                for (const cardConfig of customCards) {
                    if (!cardConfig || !cardConfig.type) continue;
                    const el = helpers.createCardElement(cardConfig);
                    if (cardConfig.custom_width) {
                        el.style.width = cardConfig.custom_width;
                        el.style.flex = 'none';
                    }
                    if (cardConfig.custom_height !== undefined) {
                        let ch = String(cardConfig.custom_height).trim();
                        if (!isNaN(ch) && ch !== '') ch += 'px';
                        el.style.height = ch;
                    }
                    this._customCardElements.push(el);
                    wrapper.appendChild(el);
                    if (this._hass) el.hass = this._hass;
                }
            });
        }
    }

    // ========================================================================
    // HOME ASSISTANT API
    // ========================================================================
    set hass(hass) {
        if (!hass || !this._config) return;

        // Cache hass for custom cards (always store, even before bail-out)
        this._hass = hass;

        // Propagate hass to nested custom cards
        if (this._customCardElements.length > 0) {
            for (const child of this._customCardElements) child.hass = hass;
        }

        // Moon rotation
        if (this._moonRotationRad === undefined && hass.config && hass.config.latitude !== undefined) {
            this._moonRotationRad = (51 - hass.config.latitude) * (Math.PI / 180);
        }

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

        // Quick bail-out: only process when tracked entity values actually change
        const snapshot = {
            weather: wEntity?.state || '',
            temp: wEntity?.attributes?.temperature ?? '',
            windSpeed: wEntity?.attributes?.wind_speed ?? '',
            windUnit: wEntity?.attributes?.wind_speed_unit || '',
            sun: sunEntity?.state || '',
            sunElev: sunEntity?.attributes?.elevation ?? '',
            moon: moonEntity?.state || '',
            theme: themeEntity?.state || '',
            status: statusEntity?.state || '',
            topState: topSensor?.state || '',
            topUnit: topSensor?.attributes?.unit_of_measurement || '',
            botState: botSensor?.state || '',
            botUnit: botSensor?.attributes?.unit_of_measurement || '',
            sysDark: !!sysDark,
            lang
        };

        if (this._lastSnapshot && !this._hasSnapshotChanged(this._lastSnapshot, snapshot)) return;
        this._lastSnapshot = snapshot;

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
        this._updateTextElements(hass, wEntity, lang, weatherState);

        const windSpeedRaw = this._getEntityAttribute(wEntity, 'wind_speed', 0);
        const windSpeed = typeof windSpeedRaw === 'number' ? windSpeedRaw : parseFloat(windSpeedRaw) || 0;
        this._windSpeed = Math.min(Math.max(windSpeed / 10, 0), 2);

        // Normalize to km/h for wind vapor threshold
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
    // Unified axis resolution. Returns { isTimeNight, isThemeDark, isImageNight }.
    // Axes share entity reads but differ in priority:
    //   Time:  mode → sun → theme → false
    //   Theme: mode → theme → sysDark → sun → false
    //   Image: mode → theme → sysDark → sun → false
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

        // Time axis: mode → sun → theme → false  (unchanged — sun drives content)
        let isTimeNight;
        if      (mode === 'night') isTimeNight = true;
        else if (mode === 'day')   isTimeNight = false;
        else if (sunEntity)        isTimeNight = sunIsBelowHorizon;
        else if (themeValid)       isTimeNight = themeIsNight;
        else                       isTimeNight = false;

        // Theme axis: mode → theme → sysDark → sun → false
        // sysDark (hass.themes.darkMode) now outranks sun for visual contrast,
        // so the card respects the HA system/profile dark-mode setting.
        // Sun remains a fallback for setups where hass.themes is unavailable.
        let isThemeDark;
        if      (mode === 'dark')          isThemeDark = true;
        else if (mode === 'light')         isThemeDark = false;
        else if (themeValid)               isThemeDark = themeIsNight;
        else if (sysDark !== undefined)    isThemeDark = !!sysDark;
        else if (sunEntity)                isThemeDark = sunIsNight;
        else                               isThemeDark = false;

        // Image axis: mode → theme → sysDark → sun → false
        let isImageNight;
        if      (mode === 'dark' || mode === 'night')  isImageNight = true;
        else if (mode === 'light' || mode === 'day')   isImageNight = false;
        else if (themeValid)                           isImageNight = themeIsNight;
        else if (sysDark !== undefined)                isImageNight = !!sysDark;
        else if (sunEntity)                            isImageNight = sunIsNight;
        else                                           isImageNight = false;

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
        const isBadWeatherForComets =
            type === 'rain' || type === 'hail' || type === 'lightning' ||
            type === 'pouring' || type === 'snowy' || type === 'snowy-rainy';
        const isSevereWeather = !!(p?.thunder) || type === 'hail' || type === 'pouring';

        // --- Visibility flags ---
        const goodWeather = state === 'sunny' || state === 'partlycloudy' ||
                            state === 'clear-night' || state === 'exceptional';
        const showSun = !isNight && goodWeather;

        let showCloudySun = false;
        if (!isNight) {
            const isBad = !!(p?.dark) ||
                type === 'rain' || type === 'hail' || type === 'lightning' ||
                type === 'pouring' || type === 'snowy' || type === 'snowy-rainy';
            const isOvercastType = state === 'cloudy' || state === 'windy' ||
                                   state === 'windy-variant' || state === 'fog';
            const isStandalone = this._config.card_style === 'standalone';

            if (isStandalone) {
                // logic for standalone so it doesn't fight the CSS gradients
                showCloudySun = !isDark && isOvercastType && !isBad;
            } else {
                // Immersive mode: render the diffuse glow anytime it's not clear skies
                showCloudySun = !goodWeather;
            }
        }

        // --- Rain color base ---
        const rainRgb = isLight ? '58, 72, 100' : '210, 225, 255';

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
        const cloudGlobalOp = isDark ? 0.70 : 0.84;

        // --- Celestial cloud palette: warm (sun-lit), cool (overcast day), darkDay (forced dark), moon (night) ---
        let celestialCloudPalette;
        if (isNight) celestialCloudPalette = 'moon';
        else if (isDark) celestialCloudPalette = 'darkDay';
        else celestialCloudPalette = p?.sunCloudWarm ? 'warm' : 'cool';

        // Invalidate cached gradients; lazily rebuilt on next frame
        this._sunDiscGrad = this._sunDiscGradR = null;
        this._haloGrad = this._haloGradR = null;
        this._cloudySunGradDark = this._cloudySunGradDarkR = null;
        this._csCoronaGrad = this._csCoronaGradR = null;
        this._csGlowMoon = this._csGlowDay = this._moonCache = this._rainGrad = null;

        this._renderState = {
            isBadWeatherForComets,
            isSevereWeather,
            showSun,
            showCloudySun,
            rainRgb,
            cloudGlobalOp,
            starMode,
            celestialCloudPalette,
            cp  // cloud palette
        };

        // Pre-build all particle sprite textures for the current theme/weather
        this._buildTextures();
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
            mood = 'darkDay';
        } else if (p?.dark || BAD_WEATHER_TYPES.has(type) || p?.foggy) {
            mood = (p?.thunder || STORM_TYPES.has(type)) ? 'lightStorm' : 'lightRain';
        } else if (atm === 'fair' || atm === 'clear') {
            mood = 'lightFair';
        } else if (atm === 'overcast' || atm === 'cloudy') {
            mood = 'lightOvercast';
        } else {
            mood = 'lightDefault';
        }

        // Unpack palette values
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
        const rainyOpacityMul = (isRainyBoost && !isStormOverride) ? 1.10 : 1.0;

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

    /**
     * Pre-builds all particle sprite textures for the current theme/weather.
     * Called once per state change from _buildRenderState, so the render loop
     * only draws — no canvas creation or gradient setup at 60fps.
     */
    _buildTextures() {
        const isLight = this._isLightBackground;
        const rs = this._renderState;
        if (!rs) return;

        // --- Rain sprite (64x4 gradient streak) ---
        const rainRgb = rs.rainRgb;
        if (!this._rainTex || this._rainTexRgb !== rainRgb) {
            this._rainTexRgb = rainRgb;
            const rc = document.createElement('canvas');
            rc.width = 64; rc.height = 4;
            const rCtx = rc.getContext('2d', { willReadFrequently: false });
            const g = rCtx.createLinearGradient(64, 0, 0, 0);
            g.addColorStop(0,   `rgba(${rainRgb}, 0.85)`);
            g.addColorStop(0.5, `rgba(${rainRgb}, 0.2)`);
            g.addColorStop(1,   `rgba(${rainRgb}, 0)`);
            rCtx.fillStyle = g;
            rCtx.fillRect(0, 0, 64, 4);
            this._rainTex = rc;
        }

        // --- Snow sprites (foreground 32x32, background 16x16) ---
        if (!this._snowTexFg || this._snowTexLight !== isLight) {
            this._snowTexLight = isLight;

            const sf = document.createElement('canvas');
            sf.width = 32; sf.height = 32;
            const sfCtx = sf.getContext('2d', { willReadFrequently: false });
            const sg = sfCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
            if (isLight) {
                sg.addColorStop(0, 'rgba(255,255,255,1)');
                sg.addColorStop(0.5, 'rgba(255,255,255,0.786)');
                sg.addColorStop(1, 'rgba(255,255,255,0)');
            } else {
                sg.addColorStop(0, 'rgba(255,255,255,1)');
                sg.addColorStop(0.5, 'rgba(255,255,255,0.55)');
                sg.addColorStop(1, 'rgba(255,255,255,0)');
            }
            sfCtx.fillStyle = sg;
            sfCtx.beginPath(); sfCtx.arc(16, 16, 16, 0, Math.PI * 2); sfCtx.fill();
            this._snowTexFg = sf;

            const sb = document.createElement('canvas');
            sb.width = 16; sb.height = 16;
            const sbCtx = sb.getContext('2d', { willReadFrequently: false });
            if (isLight) {
                const sbg = sbCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
                sbg.addColorStop(0, 'rgba(255,255,255,1)');
                sbg.addColorStop(1, 'rgba(255,255,255,0)');
                sbCtx.fillStyle = sbg;
            } else {
                sbCtx.fillStyle = 'rgba(255,255,255,1)';
            }
            sbCtx.beginPath(); sbCtx.arc(8, 8, 8, 0, Math.PI * 2); sbCtx.fill();
            this._snowTexBg = sb;
        }

        // --- Hail sprite (32x32 hexagonal ice pellet) ---
        if (!this._hailTex || this._hailTexLight !== isLight) {
            this._hailTexLight = isLight;
            const hc = document.createElement('canvas');
            hc.width = 32; hc.height = 32;
            const hcCtx = hc.getContext('2d', { willReadFrequently: false });
            const center = 16, size = 14;

            const iceGradient = hcCtx.createRadialGradient(center, center - size * 0.3, 0, center, center, size);
            if (isLight) {
                iceGradient.addColorStop(0, 'rgba(240,250,255,1)');
                iceGradient.addColorStop(0.5, 'rgba(210,230,250,0.85)');
                iceGradient.addColorStop(1, 'rgba(170,200,240,0.5)');
            } else {
                iceGradient.addColorStop(0, 'rgba(255,255,255,1)');
                iceGradient.addColorStop(0.5, 'rgba(230,245,255,0.85)');
                iceGradient.addColorStop(1, 'rgba(200,225,250,0.5)');
            }
            hcCtx.fillStyle = iceGradient;
            hcCtx.beginPath();
            for (let j = 0; j < 6; j++) {
                const angle = (Math.PI * 2 * j) / 6;
                const x = center + Math.cos(angle) * size;
                const y = center + Math.sin(angle) * size;
                if (j === 0) hcCtx.moveTo(x, y);
                else hcCtx.lineTo(x, y);
            }
            hcCtx.closePath();
            hcCtx.fill();

            hcCtx.fillStyle = 'rgba(255,255,255,0.6)';
            hcCtx.beginPath();
            hcCtx.arc(center - size * 0.3, center - size * 0.3, size * 0.3, 0, Math.PI * 2);
            hcCtx.fill();
            this._hailTex = hc;
        }

        // --- Wind vapor sprite (128x24 streaked wisp) ---
        const isDark = this._isThemeDark;
        const cp = rs.cp;
        const colorKey = isDark ? `${cp.litR},${cp.litG},${cp.litB}` : `${cp.midR},${cp.midG},${cp.midB}`;

        if (!this._vaporTex || this._vaporTexColor !== colorKey || this._vaporTexDark !== isDark) {
            this._vaporTexColor = colorKey;
            this._vaporTexDark = isDark;

            const vc = document.createElement('canvas');
            vc.width = 128; vc.height = 24;
            const vCtx = vc.getContext('2d', { willReadFrequently: false });
            const peakAlpha = isDark ? 0.40 : 0.55;

            const hGrad = vCtx.createLinearGradient(0, 12, 128, 12);
            hGrad.addColorStop(0,    `rgba(${colorKey}, 0)`);
            hGrad.addColorStop(0.06, `rgba(${colorKey}, ${peakAlpha * 0.12})`);
            hGrad.addColorStop(0.22, `rgba(${colorKey}, ${peakAlpha * 0.85})`);
            hGrad.addColorStop(0.38, `rgba(${colorKey}, ${peakAlpha * 0.60})`);
            hGrad.addColorStop(0.55, `rgba(${colorKey}, ${peakAlpha * 0.78})`);
            hGrad.addColorStop(0.78, `rgba(${colorKey}, ${peakAlpha * 0.40})`);
            hGrad.addColorStop(0.93, `rgba(${colorKey}, ${peakAlpha * 0.06})`);
            hGrad.addColorStop(1,    `rgba(${colorKey}, 0)`);
            vCtx.fillStyle = hGrad;
            vCtx.fillRect(0, 0, 128, 24);

            vCtx.globalCompositeOperation = 'destination-in';
            const vGrad = vCtx.createLinearGradient(0, 0, 0, 24);
            vGrad.addColorStop(0,    'rgba(255,255,255,0)');
            vGrad.addColorStop(0.38, 'rgba(255,255,255,1)');
            vGrad.addColorStop(0.62, 'rgba(255,255,255,1)');
            vGrad.addColorStop(1,    'rgba(255,255,255,0)');
            vCtx.fillStyle = vGrad;
            vCtx.fillRect(0, 0, 128, 24);
            this._vaporTex = vc;
        }
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
            const cxVal = `${celestial.x}px`;
            const cyVal = `${celestial.y}px`;
            if (this._prevCx !== cxVal) { root.style.setProperty('--c-x', cxVal); this._prevCx = cxVal; }
            if (this._prevCy !== cyVal) { root.style.setProperty('--c-y', cyVal); this._prevCy = cyVal; }
            if (h > 0) {
                const dx = Math.max(celestial.x, w - celestial.x);
                const dy = Math.max(celestial.y, h - celestial.y);
                const crVal = `${Math.ceil(Math.sqrt(dx * dx + dy * dy) * 0.3)}px`;
                if (this._prevCr !== crVal) { root.style.setProperty('--c-r', crVal); this._prevCr = crVal; }
            }
        }

        if (this._isTimeNight) {
            const illum = this._moonPhaseConfig?.illumination ?? 1.0;
            const nightWeatherOp = { storm: 0.08, pouring: 0.10, rain: 0.14, snow: 0.22, overcast: 0.28, windy: 0.28, mist: 0.20, fog: 0.20, fair: 0.80 };
            const weatherFactor = nightWeatherOp[atm] ?? 1.0;
            const nightOp = (0.20 + illum * 0.30) * weatherFactor;
            const isStandalone = this._config.card_style === 'standalone';
            const isImmersiveLight = !this._isThemeDark && !isStandalone;

            const moonStyle = (this._config.moon_style || 'blue').toLowerCase();
            let moonRgb;
            if (isImmersiveLight) {
                const moonRgbMap = { yellow: '255,200,50', purple: '140,115,175', grey: '105,110,120' };
                moonRgb = moonRgbMap[moonStyle] || '100,125,175';
            } else {
                moonRgb = this._isLightBackground ? '218,228,255' : '190,210,255';
            }
            const gOpVal = nightOp.toFixed(3);
            if (this._prevGRgb !== moonRgb) { root.style.setProperty('--g-rgb', moonRgb); this._prevGRgb = moonRgb; }
            if (this._prevGOp !== gOpVal) { root.style.setProperty('--g-op', gOpVal); this._prevGOp = gOpVal; }
        } else {
            const dayWeatherOp = { storm: 0.06, pouring: 0.08, rain: 0.10, snow: 0.16, mist: 0.16, fog: 0.16, overcast: 0.26, windy: 0.24, fair: 0.38, clear: 0.55, exceptional: 0.55 };
            const dayOp = dayWeatherOp[atm] ?? 0.45;
            const coolGlow = atm === 'overcast' || atm === 'mist' || atm === 'windy' || atm === 'fog';
            const badGlow = atm === 'storm' || atm === 'pouring' || atm === 'rain' || atm === 'snow';
            const dayRgb = badGlow ? '232, 240, 252' : coolGlow ? '240, 245, 255' : '255, 248, 232';
            const dayOpVal = dayOp.toFixed(3);
            if (this._prevGRgb !== dayRgb) { root.style.setProperty('--g-rgb', dayRgb); this._prevGRgb = dayRgb; }
            if (this._prevGOp !== dayOpVal) { root.style.setProperty('--g-op', dayOpVal); this._prevGOp = dayOpVal; }
        }

        // === SCHEME CLASSES — applied for ALL modes (used by text colors) ===
        const isDarkScheme = this._isThemeDark;
        root.classList.toggle('scheme-night', isDarkScheme);
        root.classList.toggle('scheme-day', !isDarkScheme);
        root.classList.toggle('time-day', !this._isTimeNight);

        // === STANDALONE-ONLY: background gradients, weather classes, film grain ===
        if (this._config.card_style !== 'standalone') {
            if (this._prevStyleSig !== null) {
                root.classList.remove(
                    'standalone',
                    'weather-overcast', 'weather-rainy', 'weather-storm',
                    'weather-snow', 'weather-partly', 'weather-fog', 'weather-exceptional', 'weather-pouring'
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
            'weather-snow', 'weather-partly', 'weather-fog', 'weather-exceptional', 'weather-pouring'
        );

        const atmosphereToClass = {
            'mist': 'weather-fog', 'fog': 'weather-fog',
			'overcast': 'weather-overcast', 'windy': 'weather-overcast',
			'fair': 'weather-partly',
			'rain': 'weather-rainy',
			'pouring': 'weather-pouring',
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
    _updateTextElements(hass, wEntity, lang, weatherState = 'default') {
        if (!wEntity) return;
        if (!this._elements?.tempText || !this._elements?.bottomText) return;

        const showText = this._config.disable_text !== true;
        const showIcon = this._config.disable_bottom_icon !== true;
        const showBottom = this._config.disable_bottom_text !== true;
        const showBottomBg = this._config.bottom_text_background === true;
        const showTopBg = this._config.top_text_background === true;
        // Accept both singular (canonical) and plural (legacy) keys
        const combineText = (this._config.combine_text ?? this._config.combine_texts) === true;
        const swapTexts = (this._config.swap_text ?? this._config.swap_texts) === true;
        const bgStyle = ({ pill: 'pill', frosted: 'frosted', fade: 'fade' })[(this._config.text_background_style || 'frosted').toLowerCase()] || 'frosted';

        // Font size config → CSS custom property
        const root = this._elements.root;
        const topFS = this._config.top_font_size || '';
        const bottomFS = this._config.bottom_font_size || '';
        if (this._prevTopFS !== topFS) { this._prevTopFS = topFS; topFS ? root.style.setProperty('--awc-top-font-size', topFS) : root.style.removeProperty('--awc-top-font-size'); }
        if (this._prevBottomFS !== bottomFS) { this._prevBottomFS = bottomFS; bottomFS ? root.style.setProperty('--awc-bottom-font-size', bottomFS) : root.style.removeProperty('--awc-bottom-font-size'); }

        this._elements.textWrapper.style.display = showText ? '' : 'none';
        this._elements.tempText.style.display = combineText ? 'none' : '';
        this._elements.bottomText.style.display = (combineText || showBottom) ? '' : 'none';
        this._elements.bottomText.classList.toggle('with-bg', combineText ? (showBottomBg || showTopBg) : showBottomBg);
        this._elements.tempText.classList.toggle('with-bg', combineText ? false : showTopBg);
        this._elements.bottomText.classList.toggle('combined', combineText);
        for (const el of [this._elements.tempText, this._elements.bottomText]) {
            const on = el.classList.contains('with-bg');
            el.classList.toggle('pill', on && bgStyle === 'pill');
            el.classList.toggle('frosted', on && bgStyle === 'frosted');
            el.classList.toggle('fade', on && bgStyle === 'fade');
        }

        // --- Top value ---
        let topVal, topUnit;
        const hasCustomTop = !!this._config.top_text_sensor;
        if (hasCustomTop) {
            const s = hass.states[this._config.top_text_sensor];
            if (s) {
                const raw = s.state;
                const isTextState = !raw || isNaN(parseFloat(raw)) || !isFinite(raw);
                topVal = (isTextState && hass.formatEntityState) ? hass.formatEntityState(s) : raw;
            } else {
                topVal = 'N/A';
            }
            topUnit = s?.attributes.unit_of_measurement || '';
        } else {
            topVal = wEntity.attributes.temperature;
            topUnit = wEntity.attributes.temperature_unit || '';
        }

        let fmtTop = topVal;
        const isTopNumeric = topVal !== null && topVal !== '' && !isNaN(parseFloat(topVal)) && isFinite(topVal);
        if (isTopNumeric) {
            fmtTop = new Intl.NumberFormat(lang, { maximumFractionDigits: 1, minimumFractionDigits: 0 }).format(topVal);
        }

        if (!combineText) {
            if (this._lastTempVal !== fmtTop) {
                this._lastTempVal = fmtTop;
                this._elements.tempVal.textContent = fmtTop;
            }
            if (this._lastTempUnit !== topUnit) {
                this._lastTempUnit = topUnit;
                this._elements.tempUnit.textContent = topUnit;
            }
        }

        // --- Bottom value ---
        let bottomValue, bottomUnit;
        let iconStrategy = 'static';
        let iconValue = 'mdi:weather-windy';
        let sensorObj = null;

        if (this._config.bottom_text_sensor) {
            const sensor = hass.states[this._config.bottom_text_sensor];
            if (sensor) {
                const raw = sensor.state;
                const isTextState = !raw || isNaN(parseFloat(raw)) || !isFinite(raw);
                bottomValue = (isTextState && hass.formatEntityState) ? hass.formatEntityState(sensor) : raw;
                bottomUnit = sensor.attributes.unit_of_measurement || '';
                sensorObj = sensor;
                iconStrategy = 'native';
            } else {
                bottomValue = 'N/A'; bottomUnit = '';
            }
        } else {
            bottomValue = wEntity.attributes.wind_speed;
            bottomUnit = wEntity.attributes.wind_speed_unit || 'km/h';
        }

        const configIcon = this._config.bottom_text_icon;
        const configPath = this._config.bottom_text_icon_path;

        if (configIcon) {
            const resolvedBase = (configIcon === 'weather') ? weatherState : configIcon;
            if (configPath) {
                iconStrategy = 'image';
                const basePath = configPath.endsWith('/') ? configPath : configPath + '/';
                const ext = resolvedBase.includes('.') ? '' : '.svg';
                iconValue = `${basePath}${resolvedBase}${ext}`;
            } else {
                iconStrategy = 'static';
                iconValue = (configIcon === 'weather') ? (WEATHER_ICONS[resolvedBase] || WEATHER_ICONS['default']) : configIcon;
            }
        }

        let formattedBottom = bottomValue;
        const isBottomNumeric = bottomValue !== null && bottomValue !== '' && !isNaN(parseFloat(bottomValue)) && isFinite(bottomValue);
        if (isBottomNumeric) {
            formattedBottom = new Intl.NumberFormat(lang, { maximumFractionDigits: 1, minimumFractionDigits: 0 }).format(bottomValue);
        }

        // --- Icon HTML (shared) ---
        let iconHtml = '';
        if (showIcon) {
            if (iconStrategy === 'native') {
                iconHtml = '<ha-state-icon></ha-state-icon>';
            } else if (iconStrategy === 'image') {
                iconHtml = `<img src="${iconValue}" class="custom-bottom-icon" />`;
            } else {
                iconHtml = `<ha-icon icon="${iconValue}"></ha-icon>`;
            }
        }

        // --- DOM write: combined or separate ---
        let locSig;
        if (combineText) {
            const unitHtml = (!hasCustomTop && topUnit) ? `<span class="combined-unit">${topUnit}</span>` : '';
            const topHtml = `<span class="combined-top">${fmtTop}</span>${unitHtml}`;
            const bottomHtml = showBottom ? `<span class="combined-bottom">${formattedBottom} ${bottomUnit}</span>` : '';
            const sepHtml = (topHtml && bottomHtml) ? '<span class="combined-sep"></span>' : '';
            const content = swapTexts ? `${bottomHtml}${sepHtml}${topHtml}` : `${topHtml}${sepHtml}${bottomHtml}`;
            locSig = `C|${fmtTop}|${topUnit}|${formattedBottom}|${bottomUnit}|${iconValue}|${iconStrategy}|${showIcon}|${showBottom}|${swapTexts}`;
            if (this._lastLocStr !== locSig) {
                this._lastLocStr = locSig;
                this._lastTempVal = null;
                this._lastTempUnit = null;
                this._elements.bottomText.innerHTML = `${iconHtml}${content}`;
            }
        } else {
            locSig = `${formattedBottom}_${bottomUnit}_${iconValue}_${iconStrategy}_${showIcon}`;
            if (this._lastLocStr !== locSig) {
                this._lastLocStr = locSig;
                this._elements.bottomText.innerHTML = `${iconHtml}<span>${formattedBottom} ${bottomUnit}</span>`;
            }
        }

        // Native icon binding (after any innerHTML write)
        if (showIcon && iconStrategy === 'native') {
            const iconEl = this._elements.bottomText.querySelector('ha-state-icon');
            if (iconEl && (iconEl.hass !== hass || iconEl.stateObj !== sensorObj)) {
                iconEl.hass = hass; iconEl.stateObj = sensorObj;
            }
        }

        const textPos = (this._config.text_position || '').toLowerCase().trim();
        const textAlign = (this._config.text_alignment || '').toLowerCase().trim();

        const textSig = `${textPos}|${textAlign}|${swapTexts}|${combineText}`;


        
        const allPosClasses = ['text-left', 'text-right', 'text-hcenter', 'align-spread', 'align-top', 'align-center', 'align-bottom', 'swap-texts', 'split-top', 'split-bottom'];
		
        if (textPos) {
            if (this._prevTextPosition !== textSig) {
                this._prevTextPosition = textSig;
                const w = this._elements.textWrapper;
                w.classList.remove(...allPosClasses);
                
                w.classList.toggle('swap-texts', swapTexts);

                if (textPos === 'split-top' || textPos === 'split-bottom') {
                    w.classList.add(textPos);
                } else {
                    // Resolve horizontal alignment from position string
                    const resolvedH = textPos.includes('left') ? 'text-left'
                                    : textPos.includes('right') ? 'text-right'
                                    : textPos.includes('center') ? 'text-hcenter'
                                    : null;

                    // Resolve vertical: text_alignment overrides, then position string, then default
                    const resolvedV = textAlign === 'top' ? 'align-top'
                                    : textAlign === 'center' ? 'align-center'
                                    : textAlign === 'bottom' ? 'align-bottom'
                                    : textPos.includes('top') ? 'align-top'
                                    : textPos.includes('bottom') ? 'align-bottom'
                                    : 'align-spread';

                    if (resolvedH) w.classList.add(resolvedH);
                    w.classList.add(resolvedV);
                }
            }
        } else {
            // Default auto behavior: text opposite the sun/moon position
            if (this._prevTextPosition !== textSig) {
                this._prevTextPosition = textSig;
                const w = this._elements.textWrapper;
                w.classList.remove('align-spread', 'align-top', 'align-center', 'align-bottom', 'swap-texts');
                const vClass = textAlign === 'top' ? 'align-top'
                             : textAlign === 'center' ? 'align-center'
                             : textAlign === 'bottom' ? 'align-bottom'
                             : 'align-spread';
                w.classList.add(vClass);
                w.classList.toggle('swap-texts', swapTexts);
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

        // --- Custom Cards Wrapper Positioning ---
        if (this._elements?.customCardsWrapper) {
            const ccPos = (this._config.custom_cards_position || '').toLowerCase().trim();
            const ccSig = `${ccPos}|${this._prevSunLeft}`;

            if (this._prevCcSig !== ccSig) {
                this._prevCcSig = ccSig;
                const ccw = this._elements.customCardsWrapper;
                const allCcClasses = ['cc-text-left', 'cc-text-right', 'cc-text-hcenter', 'cc-align-top', 'cc-align-center', 'cc-align-bottom'];

                ccw.classList.remove(...allCcClasses);

                if (ccPos) {
                    // Resolve horizontal and vertical from position string
                    const hClass = ccPos.includes('left') ? 'cc-text-left'
                                 : ccPos.includes('right') ? 'cc-text-right'
                                 : ccPos.includes('center') ? 'cc-text-hcenter'
                                 : null;
                    const vClass = ccPos.includes('top') ? 'cc-align-top'
                                 : ccPos.includes('center') ? 'cc-align-center'
                                 : 'cc-align-bottom';
                    if (hClass) ccw.classList.add(hClass);
                    ccw.classList.add(vClass);
                } else {
                    // Default: bottom vertically, horizontal opposite to text layer
                    ccw.classList.add('cc-align-bottom');
                    ccw.classList.add(this._prevSunLeft ? 'cc-text-left' : 'cc-text-right');
                }
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
                // Defer heavy _initParticles (includes _bakeAllClouds) when the
                // card is off-screen. The dirty flag is consumed by
                // _handleVisibilityChange when the card scrolls into view.
                if (this._isVisible) {
                    setTimeout(() => {
                        this._initParticles();
                        if (this._width > 0) this._lastInitWidth = this._width;
                        this._startAnimation();
                    }, 0);
                } else {
                    this._needsReinit = true;
                }
            }
        } else {
            this._params = newParams;
        }
    }

    getCardSize() {
        return 4;
    }

    static getStubConfig() {
        return {
            weather_entity: 'weather.your_weather_entity',
            card_style: 'standalone',
			sun_entity: 'sun.sun',
            moon_phase_entity: 'sensor.your_moon_phase_entity',
			card_height: 130,
			theme: 'auto',
			text_position: 'left',
			text_alignment: 'spread',
			sun_moon_size: '50px',
            sun_moon_x_position: -65,
            sun_moon_y_position: 'center',
			top_font_size: '3em',
			bottom_font_size: '16px',
			disable_text: false,
			disable_bottom_text: false,
			disable_bottom_icon: false,
			swap_text: false,
			combine_text: false,
			top_text_background: false,
			bottom_text_background: true,
			text_background_style: 'frosted',
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

    _hasSnapshotChanged(prev, next) {
        // Explicit per-field comparison — V8 inlines and short-circuits.
        // Faster than for...in over an object literal in the hot path.
        return prev.weather    !== next.weather
            || prev.temp       !== next.temp
            || prev.windSpeed  !== next.windSpeed
            || prev.windUnit   !== next.windUnit
            || prev.sun        !== next.sun
            || prev.sunElev    !== next.sunElev
            || prev.moon       !== next.moon
            || prev.theme      !== next.theme
            || prev.status     !== next.status
            || prev.topState   !== next.topState
            || prev.topUnit    !== next.topUnit
            || prev.botState   !== next.botState
            || prev.botUnit    !== next.botUnit
            || prev.sysDark    !== next.sysDark
            || prev.lang       !== next.lang;
    }
	
    /**
     * Golden Hour — warms glow, adds ambient wash, and slightly dims the blue sky.
     * Clear/fair/exceptional only. Eases in from 15° -> peaks at 2° -> fades by -6°.
     * Applies symmetrically to both sunrise and sunset; the intensity curve
     * is elevation-based so direction is irrelevant.
     * Vars: --g-rgb, --g-op, --c-r, --gh-wash, --ambient-dim.
     */
    _applyGoldenHour(sunEntity, params) {
        if (!this._elements?.root) return;
        const root = this._elements.root;
        const atm = params?.atmosphere || '';

        // Clear all golden hour CSS vars when inactive (night or non-clear weather)
        const inactive = this._isTimeNight || (atm !== 'clear' && atm !== 'fair' && atm !== 'exceptional');
        if (inactive) {
            if (this._prevGhWash !== '0') { root.style.setProperty('--gh-wash', '0'); this._prevGhWash = '0'; }
            if (this._prevAmbDim !== '0') { root.style.setProperty('--ambient-dim', '0'); this._prevAmbDim = '0'; }
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
                // Peak zone through sub-horizon glow (sunrise dawn / sunset afterglow)
                t = (e + 6) / 8; 
            }
        }
        
        if (t < 0.01) { 
            root.style.setProperty('--gh-wash', '0'); 
            root.style.setProperty('--ambient-dim', '0');
            return; 
        }

        // Unclamped intensity for clear/fair skies
        const i = Math.min(1, t);

        // 1. Color: Warm white base -> Soft sunset orange (255, 170, 50)
        const ghRgb = `255, ${Math.round(248 - 78 * i)}, ${Math.round(232 - 182 * i)}`;
        if (this._prevGRgb !== ghRgb) { root.style.setProperty('--g-rgb', ghRgb); this._prevGRgb = ghRgb; }

        // 2. Opacity: Give the sun glow an extra 25% punch at peak
        const baseOp = parseFloat(this._prevGOp || '0.45') || 0.45;
        const ghOp = Math.min(0.95, baseOp + 0.25 * i).toFixed(3);
        if (this._prevGOp !== ghOp) { root.style.setProperty('--g-op', ghOp); this._prevGOp = ghOp; }

        // 3. Radius: Expand the sun's influence by 80% at sunset
        const cw = this._cachedDimensions.width  / (this._cachedDimensions.dpr || 1);
        const ch = this._cachedDimensions.height / (this._cachedDimensions.dpr || 1);
        if (cw > 0 && ch > 0) {
            const cel = this._getCelestialPosition(cw, ch);
            const dx = Math.max(cel.x, cw - cel.x);
            const dy = Math.max(cel.y, ch - cel.y);
            const baseR = Math.ceil(Math.sqrt(dx * dx + dy * dy) * 0.3);
            const ghCr = `${Math.round(baseR * (1 + 0.8 * i))}px`;
            if (this._prevCr !== ghCr) { root.style.setProperty('--c-r', ghCr); this._prevCr = ghCr; }
        }

        // 4. Evening Wash: The orange horizon gradient (peaks at 30% opacity)
        const ghWash = (0.30 * i).toFixed(3);
        if (this._prevGhWash !== ghWash) { root.style.setProperty('--gh-wash', ghWash); this._prevGhWash = ghWash; }

        // 5. Ambient Dimming: Subtly darkens the daytime blue sky (peaks at 18% opacity)
        const ghDim = (0.18 * i).toFixed(3);
        if (this._prevAmbDim !== ghDim) { root.style.setProperty('--ambient-dim', ghDim); this._prevAmbDim = ghDim; }
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

    _handleVisibilityChange(entries) {
        const entry = entries[0];
        const wasVisible = this._isVisible;
        this._isVisible = entry.isIntersecting;
        if (this._isVisible && !wasVisible) {
            if (this._needsReinit) {
                this._needsReinit = false;
                this._initParticles();
                if (this._width > 0) this._lastInitWidth = this._width;
            }
            this._startAnimation();
        } else if (!this._isVisible && wasVisible) {
            this._stopAnimation();
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

        let rawW = forceW !== null ? forceW : this._elements.root.clientWidth;
        let rawH = forceH !== null ? forceH : this._elements.root.clientHeight;

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
                ctx.imageSmoothingQuality = 'high';
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

        if (Math.random() < 0.25) {
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

        // Celestial accent clouds: warm (partlycloudy), decorative (table-driven day), or night wisps
        const celestialDecor = !this._isNight ? CELESTIAL_DECOR[p.atmosphere] : null;
        const wantsCelestialClouds = p.sunCloudWarm || celestialDecor
            || (this._isNight && !p.thunder && p.type !== 'hail' && p.atmosphere !== 'night');
        if (wantsCelestialClouds) {
            this._initCelestialClouds(w, h, p.sunCloudWarm ? null : celestialDecor);
        }

        const starCount = (this._renderState && this._renderState.starMode !== 'hidden') ? (p.stars || 0) : 0;
        if (starCount > 0) {
            this._initStars(w, h, starCount);
        }

        // Wind vapor: spawn a pool of 24 streaks; visibility controlled at draw time
        this._initWindVapor(w, h, 24);

        // Bake cloud puff compositions onto offscreen canvases
        this._bakeAllClouds();
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
            tailBuf: new Float32Array(TRAIL_CAP_COMET * 2),
            tailHead: 0,
            tailLen: 0,
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
            histBuf: new Float32Array(TRAIL_CAP_PLANE * 3),
            histHead: 0,
            histLen: 0,
            gapTimer: 0
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
        const isHeavy     = totalClouds >= 18;

        // ── Height-proportional cloud anatomy ──
        // baseUnit drives the CloudShapeGenerator so internal puff proportions
        // (radii, spacing, tower height) scale with the card.  Sub-linear power
        // prevents clouds from dominating short cards or becoming specks on tall ones.
        const REFERENCE_HEIGHT = 350;
        const baseUnit = 100 * Math.pow(Math.max(h, 80) / REFERENCE_HEIGHT, 0.7);

        // Per-cloud silhouette compression.  Applied to puff POSITIONS in _bakeCloud
        // so the cloud shape is wide and flat, but individual puffs stay un-squashed.
        const baseVCompress = isStorm ? 0.40 : 0.55;

        // ── Cluster-based placement ──
        // Fewer, tighter clusters create visible banks separated by open sky.
        // Heavy coverage uses more clusters to fill the sky naturally.
        const clusterCount = isHeavy ? Math.max(3, Math.floor(totalClouds / 6)) : (2 + Math.floor(Math.random() * 2));

        const clusters = [];
        for (let c = 0; c < clusterCount; c++) {
            const baseX = w * ((c + 0.5) / clusterCount);
            clusters.push({
                x: baseX + (Math.random() - 0.5) * w * 0.6,
                y: h * (0.11 + Math.random() * (heightLimit - 0.16)),
                spreadX: w * (0.12 + Math.random() * 0.18),
                spreadY: h * (0.06 + Math.random() * 0.10),
                weight: 0.5 + Math.random()
            });
        }
        const totalWeight = clusters.reduce((sum, c) => sum + c.weight, 0);

        // Weighted cluster picker (closure reused per cloud)
        const pickCluster = () => {
            let roll = Math.random() * totalWeight;
            for (let c = 0; c < clusters.length; c++) {
                roll -= clusters[c].weight;
                if (roll <= 0) return clusters[c];
            }
            return clusters[clusters.length - 1];
        };

        // Approximate Gaussian via Irwin-Hall (sum of 3 uniforms)
        const gaussRand = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

        // ── Filler wisps (background stratus) ──
        const fillerRatio = isHeavy ? 0.18 : 0.10;
        const fillerCount = Math.floor(totalClouds * fillerRatio);
        for (let i = 0; i < fillerCount; i++) {
            const seed = Math.random() * 10000;
            this._clouds.push({
                x: Math.random() * w,
                y: h * (0.08 + Math.random() * (heightLimit * 0.6 - 0.08)),
                scale: (0.65 + Math.random() * 0.45) * configScale * 1.8,
                speed: 0.002 + Math.random() * 0.002,
                puffs: CloudShapeGenerator.generateMixedPuffs(seed, 'stratus', baseUnit),
                cloudType: 'stratus', layer: 0,
                opacity: 0.35 + Math.random() * 0.20,
                seed, breathPhase: Math.random() * TWO_PI,
                breathSpeed: 0.001, flashIntensity: 0,
                flashOriginX: 0, flashOriginY: 0,
                _hStretch: 1.0,
                _vCompress: baseVCompress
            });
        }

        // ── Main clouds ──
        const mainCount  = totalClouds - fillerCount;
        const companions = [];

        // Pick a sky composition for this session — drives variety across reloads
        const compositions = SKY_COMPOSITIONS[p.atmosphere] || SKY_COMPOSITIONS._default;
        const typePool = compositions[Math.floor(Math.random() * compositions.length)];

        for (let i = 0; i < mainCount; i++) {
            const layer = 1 + (i % 4);
            const seed  = Math.random() * 10000;

            // ── Cluster-based X/Y with loner escape ──
            let xPos, yPos;
            const isLoner = Math.random() < (isHeavy ? 0.40 : 0.20);
            const cluster = pickCluster();

            if (isLoner) {
                xPos = Math.random() * w;
            } else {
                xPos = cluster.x + gaussRand() * cluster.spreadX;
            }

            let type;
            if (isStorm) {
                const stormRoll = Math.random();
                if (stormRoll < 0.50) type = 'storm';
                else if (stormRoll < 0.85) type = 'stratus';
                else type = 'organic';
            } else {
                type = typePool[Math.floor(Math.random() * typePool.length)];
            }

            let puffs;
            switch (type) {
                case 'storm':   puffs = CloudShapeGenerator.generateOrganicPuffs(true, seed, baseUnit); break;
                case 'stratus': puffs = CloudShapeGenerator.generateMixedPuffs(seed, 'stratus', baseUnit); break;
                case 'cirrus':  puffs = CloudShapeGenerator.generateMixedPuffs(seed, 'cirrus', baseUnit); break;
                case 'organic': puffs = CloudShapeGenerator.generateOrganicPuffs(false, seed, baseUnit); break;
                default:        puffs = CloudShapeGenerator.generateMixedPuffs(seed, 'cumulus', baseUnit); break;
            }

            let scaleX, scaleY, radiusMod;
            switch (type) {
                case 'stratus':
                    scaleX = 1.98 + Math.random() * 0.9;
                    scaleY = 0.525 + Math.random() * 0.26;
                    radiusMod = 0.95;
                    break;
                case 'cirrus':
                    scaleX = 2.5 + Math.random() * 1.2;
                    scaleY = 0.3 + Math.random() * 0.15;
                    radiusMod = 0.85;
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

            // Per-cloud draw-time shape properties (consumed by _bakeCloud/_drawClouds)
            let hStretch, vCompress;
            switch (type) {
                case 'cirrus':
                    hStretch  = 1.4;
                    vCompress = baseVCompress * 0.82;
                    break;
                case 'cumulus':
                    hStretch  = 1.0;
                    vCompress = isStorm ? baseVCompress : baseVCompress * 1.35;
                    break;
                case 'organic':
                    hStretch  = 1.0;
                    vCompress = baseVCompress * 1.15;
                    break;
                default:
                    hStretch  = 1.0;
                    vCompress = baseVCompress;
                    break;
            }

            let cloudScale;
            const sizeRoll = Math.random();
            const layerSizeBias = 0.85 + layer * 0.05; 
            
            const sizeBoost = configScale * 1.0; 
            
            const rollLarge = isHeavy ? 0.40 : 0.20;
            const rollMedium = isHeavy ? 0.85 : 0.65;

            if (sizeRoll < rollLarge)       cloudScale = (1.2  + Math.random() * 0.60) * sizeBoost * layerSizeBias;
            else if (sizeRoll < rollMedium) cloudScale = (0.7  + Math.random() * 0.35) * sizeBoost * layerSizeBias;
            else                            cloudScale = (0.58 + Math.random() * 0.18) * sizeBoost * layerSizeBias;
            cloudScale = Math.min(cloudScale, 2.8);

            if (cloudScale < 0.75 && puffs) {
                const t = (0.75 - cloudScale) / 0.75;
                const spread = 1.0 + t * 2.2;
                const shrink = 1.0 - t * 0.3;
                for (let k = 0; k < puffs.length; k++) {
                    puffs[k].offsetX *= spread;
                    puffs[k].offsetY *= spread;
                    puffs[k].rad *= shrink;
                }
            }

            // ── Type-dependent vertical band ──
            let yMin, yMax;
            switch (type) {
                case 'cirrus':  yMin = 0.04; yMax = 0.22; break;
                case 'stratus': yMin = 0.08; yMax = 0.38; break;
                case 'cumulus': yMin = 0.16; yMax = heightLimit - 0.06; break;
                default:        yMin = 0.10; yMax = heightLimit - 0.04; break;
            }

            // Y from type range, biased slightly toward cluster center
            if (isLoner) {
                yPos = h * (yMin + Math.random() * (yMax - yMin));
            } else {
                const typeY = h * (yMin + Math.random() * (yMax - yMin));
                const clusterBias = cluster.y + gaussRand() * cluster.spreadY * 0.3;
                const clamped = Math.max(h * yMin, Math.min(h * yMax, clusterBias));
                yPos = typeY * 0.6 + clamped * 0.4;
            }
            yPos = Math.max(h * 0.08, yPos);

            this._clouds.push({
                x: xPos,
                y: yPos,
                scale: cloudScale,
                speed: (0.02 + Math.random() * 0.03) * (layer * 0.4 + 1),
                puffs, cloudType: type, layer,
                opacity: 1 - (layer * 0.12),
                seed, breathPhase: Math.random() * TWO_PI,
                breathSpeed: 0.002 + Math.random() * 0.004,
                flashIntensity: 0, flashOriginX: 0, flashOriginY: 0,
                _hStretch: hStretch,
                _vCompress: vCompress
            });

            // Companion stratus: spawn a thin wide cloud behind larger cumulus/organic.
            // Creates the natural "layered" look of different cloud types together.
            if (!isStorm && (type === 'cumulus' || type === 'organic') &&
                cloudScale > 0.75 * configScale && Math.random() < 0.20) {
                const cSeed = Math.random() * 10000;
                const cPuffs = CloudShapeGenerator.generateMixedPuffs(cSeed, 'stratus', baseUnit);
                const cScaleX = 2.2 + Math.random() * 0.8;
                const cScaleY = 0.45 + Math.random() * 0.2;
                for (let k = 0; k < cPuffs.length; k++) {
                    cPuffs[k].offsetX *= cScaleX;
                    cPuffs[k].offsetY *= cScaleY;
                    cPuffs[k].rad *= 0.5;
                }
                companions.push({
                    x: xPos + (Math.random() - 0.5) * 60,
                    y: yPos + (Math.random() - 0.5) * 20,
                    scale: cloudScale * (0.7 + Math.random() * 0.3),
                    speed: 0.01 + Math.random() * 0.02,
                    puffs: cPuffs, cloudType: 'stratus',
                    layer: Math.max(0, layer - 1),
                    opacity: 0.45 + Math.random() * 0.20,
                    seed: cSeed, breathPhase: Math.random() * TWO_PI,
                    breathSpeed: 0.002,
                    flashIntensity: 0, flashOriginX: 0, flashOriginY: 0,
                    _hStretch: 1.0,
                    _vCompress: baseVCompress
                });
            }
        }

        // Add companions to cloud list
        for (let c = 0; c < companions.length; c++) {
            this._clouds.push(companions[c]);
        }

        if (!isStorm && totalClouds >= 12) {
            const accentCount = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < accentCount; i++) {
                const seed = Math.random() * 10000;
                const cPuffs = CloudShapeGenerator.generateMixedPuffs(seed, 'cirrus', baseUnit);
                const cScaleX = 2.2 + Math.random() * 1.0;
                const cScaleY = 0.3 + Math.random() * 0.15;
                for (let k = 0; k < cPuffs.length; k++) {
                    cPuffs[k].offsetX *= cScaleX;
                    cPuffs[k].offsetY *= cScaleY;
                    cPuffs[k].rad *= 0.85;
                }
                this._clouds.push({
                    x: Math.random() * w,
                    y: h * (0.04 + Math.random() * 0.14),
                    scale: (0.9 + Math.random() * 0.5) * configScale,
                    speed: 0.015 + Math.random() * 0.01,
                    puffs: cPuffs, cloudType: 'cirrus',
                    layer: Math.floor(Math.random() * 2),
                    opacity: 0.45 + Math.random() * 0.20,
                    seed, breathPhase: Math.random() * TWO_PI,
                    breathSpeed: 0.002, flashIntensity: 0,
                    flashOriginX: 0, flashOriginY: 0,
                    _hStretch: 1.4,
                    _vCompress: baseVCompress * 0.82
                });
            }
        }

        this._clouds.sort((a, b) => a.layer - b.layer);

        if (totalClouds > 0) {
            const scudCount = 2 + Math.floor(Math.random() * 3);
            for (let i = 0; i < scudCount; i++) {
                const seed = Math.random() * 10000;
                this._fgClouds.push({
                    x: Math.random() * w,
                    y: Math.random() * (h * heightLimit) - 40,
                    scale: (0.8 + Math.random() * 0.4) * configScale * 1.8,
                    speed: 0.1 + Math.random() * 0.06,
                    puffs: CloudShapeGenerator.generateMixedPuffs(seed, 'cumulus', baseUnit),
                    cloudType: 'scud', layer: 5,
                    opacity: 0.65,
                    seed, breathPhase: Math.random() * TWO_PI,
                    breathSpeed: 0.004,
                    flashIntensity: 0, flashOriginX: 0, flashOriginY: 0,
                    _hStretch: 1.0,
                    _vCompress: baseVCompress
                });
            }
        }
    }

    _initNightClouds(w, h) {
        for (let i = 0; i < 4; i++) {
            const seed = Math.random() * 10000;
            const puffs = CloudShapeGenerator.generateMixedPuffs(seed, 'stratus');
            
            this._clouds.push({
                x: Math.random() * w,
                y: Math.random() * (h * 0.35),
                scale: 0.85 + Math.random() * 0.3,
                speed: 0.02 + Math.random() * 0.02,
                puffs,
                cloudType: 'stratus',
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

    _initCelestialClouds(w, h, decorStyle = null) {
        const celestial = this._getCelestialPosition(w, h);
        const cx = celestial.x;
        const cy = celestial.y;
        const isExceptional = (this._params.cloud || 0) === 0;
        const isNight = this._isNight;
        const isDarkDay = !isNight && this._isThemeDark;

        const opMul = isNight
            ? (this._isThemeDark ? 0.35 : 0.55)
            : (isDarkDay ? 0.45 : 1.0);

        // Centered halo cloud: diffuse glow around the celestial body
        if (!isNight) {
            this._celestialClouds.push({
                x: cx,
                y: cy,
                scale: decorStyle ? 2.2 : 1.8,
                speed: 0.002,
                puffs: CloudShapeGenerator.generateWispyPuffs(Math.random() * 10000),
                opacity: isDarkDay ? 0.10 : (decorStyle ? 0.20 : 0.15),
                seed: Math.random(),
                breathPhase: 0,
                breathSpeed: 0.001,
                baseX: cx,
                baseY: cy,
                driftPhase: 0,
                _vSquash: 0.68
            });
        }

        // Decorative wisps for non-warm daytime states (overcast, rain, snow, etc.)
        if (decorStyle) {
            const count = isDarkDay ? Math.max(2, decorStyle.count - 2) : decorStyle.count;
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * TWO_PI + (Math.random() - 0.5) * 0.8;
                const dist = 35 + Math.random() * 30;
                const dx = Math.cos(angle) * dist;
                const dy = Math.sin(angle) * dist * 0.45 + 8;
                const useCirrus = Math.random() < 0.35;
                this._celestialClouds.push({
                    x: cx + dx,
                    y: cy + dy,
                    scale: decorStyle.baseScale + Math.random() * 0.15,
                    speed: 0.006,
                    puffs: useCirrus
                        ? CloudShapeGenerator.generateMixedPuffs(Math.random() * 10000, 'cirrus')
                        : CloudShapeGenerator.generateWispyPuffs(Math.random() * 10000),
                    opacity: (decorStyle.baseOpacity + Math.random() * 0.10) * opMul,
                    seed: Math.random(),
                    breathPhase: Math.random() * TWO_PI,
                    breathSpeed: 0.002,
                    baseX: cx + dx,
                    baseY: cy + dy,
                    driftPhase: Math.random() * TWO_PI,
                    _vSquash: useCirrus ? 0.48 : 0.65
                });
            }
        }

        const scatterBase = decorStyle ? Math.max(3, decorStyle.count) : 7;
        const scatterCount = isExceptional ? 2 : (isNight ? 4 : (isDarkDay ? 4 : scatterBase));
        const scatterOpMul = decorStyle ? opMul * 0.70 : opMul;

        for (let i = 0; i < scatterCount; i++) {
            const dx = (Math.random() - 0.5) * 140;
            const dy = 10 + Math.random() * 65;
            const sizeRoll = Math.random();
            const shapeRoll = Math.random();

            let puffs, vSquash;
            if (isNight || isDarkDay) {
                puffs = CloudShapeGenerator.generateWispyPuffs(Math.random() * 10000);
                vSquash = 0.66;
            } else if (shapeRoll < 0.35) {
                puffs = CloudShapeGenerator.generateOrganicPuffs(false, Math.random() * 10000);
                vSquash = 0.68;
            } else if (shapeRoll < 0.55) {
                puffs = CloudShapeGenerator.generateMixedPuffs(Math.random() * 10000, 'cirrus');
                vSquash = 0.50;
            } else if (shapeRoll < 0.75) {
                puffs = CloudShapeGenerator.generateWispyPuffs(Math.random() * 10000);
                vSquash = 0.68;
            } else {
                puffs = CloudShapeGenerator.generateSunEnhancementPuffs(Math.random() * 10000);
                vSquash = 0.70;
            }

            const scale = sizeRoll < 0.20 ? (0.25 + Math.random() * 0.15)
                        : sizeRoll > 0.85 ? (0.70 + Math.random() * 0.22)
                        :                    (0.35 + Math.random() * 0.35);

            this._celestialClouds.push({
                x: cx + dx,
                y: cy + dy,
                scale,
                speed: 0.004 + Math.random() * 0.004,
                puffs,
                opacity: (0.35 + Math.random() * 0.40) * scatterOpMul,
                seed: Math.random(),
                breathPhase: Math.random() * TWO_PI,
                breathSpeed: 0.002 + Math.random() * 0.002,
                baseX: cx + dx,
                baseY: cy + dy,
                driftPhase: Math.random() * TWO_PI,
                _vSquash: vSquash
            });
        }

        const wispCount = isExceptional ? 0 : ((isNight || isDarkDay) ? 2 : (decorStyle ? 2 : 3));
        for (let i = 0; i < wispCount; i++) {
            this._celestialClouds.push({
                x: cx + (Math.random() - 0.5) * 90,
                y: cy - 25 - Math.random() * 25,
                scale: 0.35,
                speed: 0.01,
                puffs: CloudShapeGenerator.generateWispyPuffs(Math.random() * 10000),
                opacity: 0.3 * opMul,
                seed: Math.random(),
                breathPhase: Math.random() * TWO_PI,
                breathSpeed: 0.002,
                baseX: cx + (Math.random() - 0.5) * 90,
                baseY: cy - 25 - Math.random() * 25,
                driftPhase: Math.random() * TWO_PI,
                _vSquash: 0.65
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

            // Pre-compute RGB from HSL at init time
            const rgb = hslToRgb(pc[1], pc[2], pc[3]);
            const fillStr = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;

            const star = {
                x, y,
                baseSize: size,
                phase: Math.random() * TWO_PI,
                rate: twinkleSpeed,
                brightness,
                tier,
                _fill: fillStr,
                _stroke: fillStr,
                _r: rgb[0], _g: rgb[1], _b: rgb[2]
            };

            // Hero stars: pre-compute gradient and halo properties
            if (tier === 'hero') {
                if (isGolden) {
                    star._bodyAlphaRatio = 0.85;
                    star._haloInner = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.35)`;
                    star._haloOuter = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`;
                    star._haloInnerR = 0.6;
                    star._haloOuterR = 2.2;
                    star._bodyR = 0.65;
                    star._spikeRatio = 0.22;
                    star._spikeLen = 1.4;
                } else {
                    star._bodyAlphaRatio = 1.0;
                    star._haloInner = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.25)`;
                    star._haloOuter = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`;
                    star._haloInnerR = 0.6;
                    star._haloOuterR = 3.0;
                    star._bodyR = 0.6;
                    star._spikeRatio = 0.3;
                    star._spikeLen = 2.0;
                    star._crownRatio = 0.28;
                    star._crownLen = 2.5;
                }
            }

            this._stars.push(star);
        }
    }

    _initWindVapor(w, h, count = 18) {
        for (let i = 0; i < count; i++) {
            const tier = i % 3;
            const depthScale = 0.5 + tier * 0.25;
            const vw = w * (0.8 + Math.random() * 0.8) * depthScale;
            this._windVapor.push({
                x: Math.random() * (w + vw) - vw * 0.5,
                y: Math.random() * (h * 0.55),
                w: vw,
                speed: (1.5 + Math.random() * 2.0) * depthScale,
                tier,
                phase: Math.random() * TWO_PI,
                phaseSpeed: 0.005 + Math.random() * 0.005,
                drift: 2 + Math.random() * 4,
                gustWeight: 0.5 + Math.random() * 0.5,
                squash: 0.03 + tier * 0.015 + Math.random() * 0.01,
                baseRotation: (Math.random() - 0.5) * 0.18
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

        return {
            segments, life: 1.0, alpha: 1.0, glow: 1.0,

            _outerStroke: 'rgb(160, 190, 255)',
            _glowStroke: 'rgb(180, 210, 255)',
            _coreStroke: 'rgb(255, 255, 255)',
            _branchStroke: 'rgb(200, 220, 255)'
        };
    }

    // ========================================================================
    // RENDERING — DRAWING HELPERS
    // ========================================================================

    _drawCelestialClouds(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.clouds;
        if (fadeOpacity <= 0) return;
        
        const palette = this._renderState.celestialCloudPalette;
        const len = this._celestialClouds.length;

        for (let i = 0; i < len; i++) {
            const cloud = this._celestialClouds[i];

            // Bake puffs into an offscreen canvas on first encounter
            if (!cloud._bakedCanvas) {
                const puffs = cloud.puffs;
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                
                // Find bounding box of all unscaled puffs
                for (let j = 0; j < puffs.length; j++) {
                    const p = puffs[j];
                    if (p.offsetX - p.rad < minX) minX = p.offsetX - p.rad;
                    if (p.offsetX + p.rad > maxX) maxX = p.offsetX + p.rad;
                    if (p.offsetY - p.rad < minY) minY = p.offsetY - p.rad;
                    if (p.offsetY + p.rad > maxY) maxY = p.offsetY + p.rad;
                }
                
                const pad = 4;
                minX -= pad; minY -= pad; maxX += pad; maxY += pad;
                const bakeW = Math.ceil(maxX - minX);
                const bakeH = Math.ceil(maxY - minY);
                
                const oc = document.createElement('canvas');
                oc.width = bakeW;
                oc.height = bakeH;
                const oCtx = oc.getContext('2d', { willReadFrequently: false });
                
                for (let j = 0; j < puffs.length; j++) {
                    const puff = puffs[j];
                    const baseOp = cloud.opacity * puff.shade;
                    
                    const drawX = puff.offsetX - minX;
                    const drawY = puff.offsetY - minY;
                    
                    const grad = oCtx.createRadialGradient(
                        drawX - puff.rad * 0.35, drawY - puff.rad * 0.45, 0,
                        drawX, drawY, puff.rad
                    );
                    
                    if (palette === 'warm') {
                        grad.addColorStop(0, `rgba(255,255,250,${baseOp})`);
                        grad.addColorStop(0.3, `rgba(255,245,225,${baseOp * 0.9})`);
                        grad.addColorStop(0.6, `rgba(250,235,200,${baseOp * 0.75})`);
                        grad.addColorStop(0.85, `rgba(240,220,180,${baseOp * 0.5})`);
                        grad.addColorStop(1, 'rgba(235,210,160,0)');
                    } else if (palette === 'moon') {
                        // Silver-blue lit edge with fast falloff into night sky.
                        // Matches darkNight cloud palette mood (lit: 210,222,244 / shadow: 8,13,32).
                        grad.addColorStop(0, `rgba(192,208,238,${baseOp * 0.9})`);
                        grad.addColorStop(0.25, `rgba(135,155,195,${baseOp * 0.5})`);
                        grad.addColorStop(0.5, `rgba(72,88,128,${baseOp * 0.2})`);
                        grad.addColorStop(0.75, `rgba(35,45,72,${baseOp * 0.05})`);
                        grad.addColorStop(1, 'rgba(16,24,48,0)');
                    } else if (palette === 'darkDay') {
                        // Forced dark day — shadow tones raised to separate from
                        // dark-blue bg while preserving lit→shadow definition
                        grad.addColorStop(0, `rgba(218,230,252,${baseOp * 0.85})`);
                        grad.addColorStop(0.3, `rgba(155,172,215,${baseOp * 0.58})`);
                        grad.addColorStop(0.6, `rgba(98,118,168,${baseOp * 0.30})`);
                        grad.addColorStop(0.85, `rgba(62,76,124,${baseOp * 0.10})`);
                        grad.addColorStop(1, 'rgba(44,56,96,0)');
                    } else {
                        grad.addColorStop(0, `rgba(232,238,252,${baseOp})`);
                        grad.addColorStop(0.3, `rgba(218,226,248,${baseOp * 0.9})`);
                        grad.addColorStop(0.6, `rgba(200,212,238,${baseOp * 0.75})`);
                        grad.addColorStop(0.85, `rgba(185,198,228,${baseOp * 0.5})`);
                        grad.addColorStop(1, 'rgba(170,184,218,0)');
                    }
                    
                    oCtx.fillStyle = grad;
                    fillCircle(oCtx, drawX, drawY, puff.rad);
                }
                
                cloud._bakedCanvas = oc;
                cloud._bakeOffX = minX;
                cloud._bakeOffY = minY;
                cloud._bakeW = bakeW;
                cloud._bakeH = bakeH;
            }

            // Update position and draw
            cloud.driftPhase += 0.008;
            cloud.breathPhase += cloud.breathSpeed;
            const driftX = Math.sin(cloud.driftPhase) * 12;
            const driftY = Math.cos(cloud.driftPhase * 0.7) * 4;
            
            cloud.x = cloud.baseX + driftX + effectiveWind * 0.3;
            cloud.y = cloud.baseY + driftY;
            
            if (cloud.x > cloud.baseX + 60) cloud.x = cloud.baseX + 60;
            if (cloud.x < cloud.baseX - 60) cloud.x = cloud.baseX - 60;
            
            const breathScale = 1 + Math.sin(cloud.breathPhase) * 0.02;
            
            const vSquash = cloud._vSquash !== undefined ? cloud._vSquash : 0.55;
            const scaleX = cloud.scale * breathScale;
            const scaleY = cloud.scale * vSquash * breathScale;
            
            // Shift the drawing position by the bounding-box offset, multiplied by scale
            const drawX = cloud.x + (cloud._bakeOffX * scaleX);
            const drawY = cloud.y + (cloud._bakeOffY * scaleY);
            const drawW = cloud._bakeW * scaleX;
            const drawH = cloud._bakeH * scaleY;

            ctx.globalAlpha = fadeOpacity;
            
            ctx.drawImage(cloud._bakedCanvas, drawX, drawY, drawW, drawH);
        }
        
        ctx.globalAlpha = 1;
    }

    /**
     * Draws the sun in three passes:
     *   1. Breath glow — fresh gradient per frame, outer radius morphs 1.5×↔2.4× sunBaseR.
     *      (Cached gradients don't visibly morph under ctx.scale; the star-halo code
     *      uses the same fresh-per-frame pattern. Static caches were the bug.)
     *   2. Sun disc — cached, static, crisp body.
     *   3. Atmospheric halo rings — cached, standalone-only (skipped in immersive
     *      where they'd be cut off), opacity gently synced to the breath wave.
     */
    _drawSunGlow(ctx, w, h) {
        const fadeOpacity = this._layerFadeProgress.effects;
        const { x: cx, y: cy } = this._getCelestialPosition(w, h);
        const dpr = this._cachedDimensions.dpr;
        const sunBaseR = this._celestialSize ? this._celestialSize / 2 : 31;

        // Breath wave: ~4.7s period (0.008/frame × 2.8), normalized 0..1
        const t = (Math.sin(this._sunPulsePhase * 2.8) + 1) / 2;

        // ---- 1. BREATH GLOW (fresh gradient per frame, morphing radius) ----
        const breathOuterR = sunBaseR * (1.5 + t * 0.9);          // 1.5× → 2.4× sunBaseR
        const bodyStop = Math.min(sunBaseR / breathOuterR, 0.72); // sun body cutoff
        
        // Position the peak proportionally in the remaining space so it doesn't bunch up
        const peakStop = bodyStop + (1 - bodyStop) * 0.45; 
        
        // Scale peak opacity dynamically. Fainter when shrunk, brighter when expanded.
        const peakAlphaDay = (0.15 + t * 0.27).toFixed(3);   // 0.15 shrunk → 0.42 expanded
        const peakAlphaNight = (0.10 + t * 0.26).toFixed(3); // 0.10 shrunk → 0.36 expanded

        const breathGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, breathOuterR);
        if (this._isLightBackground) {
            breathGrad.addColorStop(0,        'rgba(255, 220, 130, 0)');
            breathGrad.addColorStop(bodyStop, 'rgba(255, 218, 128, 0)');
            breathGrad.addColorStop(peakStop, `rgba(255, 212, 118, ${peakAlphaDay})`);
            breathGrad.addColorStop(1,        'rgba(255, 175, 55, 0)');
        } else {
            breathGrad.addColorStop(0,        'rgba(255, 210, 120, 0)');
            breathGrad.addColorStop(bodyStop, 'rgba(255, 208, 118, 0)');
            breathGrad.addColorStop(peakStop, `rgba(255, 200, 108, ${peakAlphaNight})`);
            breathGrad.addColorStop(1,        'rgba(255, 165, 50, 0)');
        }

        ctx.translate(cx, cy);
        ctx.globalAlpha = fadeOpacity;
        ctx.fillStyle = breathGrad;
        fillCircle(ctx, 0, 0, breathOuterR);
        ctx.globalAlpha = 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // ---- 2. SUN DISC (cached, static, crisp) ----
        if (!this._sunDiscGrad || this._sunDiscGradR !== sunBaseR) {
            const g = ctx.createRadialGradient(0, 0, 0, 0, 0, sunBaseR * 3.0);
            if (this._isLightBackground) {
                g.addColorStop(0.00, 'rgba(255, 255, 255, 1)');
                g.addColorStop(0.10, 'rgba(255, 255, 240, 0.98)');
                g.addColorStop(0.28, 'rgba(255, 242, 170, 0.94)');
                g.addColorStop(0.33, 'rgba(255, 210, 90, 0.82)');
                g.addColorStop(0.36, 'rgba(255, 198, 65, 0.60)');
                g.addColorStop(0.42, 'rgba(255, 188, 52, 0.38)');
                g.addColorStop(0.70, 'rgba(255, 178, 42, 0.20)');
                g.addColorStop(1.00, 'rgba(255, 162, 32, 0)');
            } else {
                g.addColorStop(0.00, 'rgba(255, 238, 200, 1)');
                g.addColorStop(0.10, 'rgba(255, 230, 178, 0.96)');
                g.addColorStop(0.28, 'rgba(255, 214, 130, 0.90)');
                g.addColorStop(0.33, 'rgba(255, 188, 72, 0.78)');
                g.addColorStop(0.36, 'rgba(255, 176, 54, 0.56)');
                g.addColorStop(0.42, 'rgba(255, 188, 52, 0.38)');
                g.addColorStop(0.70, 'rgba(255, 178, 42, 0.20)');
                g.addColorStop(1.00, 'rgba(255, 162, 32, 0)');
            }
            this._sunDiscGrad = g;
            this._sunDiscGradR = sunBaseR;
        }

        ctx.translate(cx, cy);
        ctx.globalAlpha = fadeOpacity;
        ctx.fillStyle = this._sunDiscGrad;
        fillCircle(ctx, 0, 0, sunBaseR * 3.0);
        ctx.globalAlpha = 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // ---- 3. ATMOSPHERIC HALO RINGS (standalone only — skipped in immersive) ----
        if (this._config.card_style === 'standalone') {
            if (!this._haloGrad || this._haloGradR !== sunBaseR) {
                const r1Inner = sunBaseR * 2.0, r1Outer = sunBaseR * 3.6;
                const r2Inner = sunBaseR * 3.8, r2Outer = sunBaseR * 5.8;

                const g1 = ctx.createRadialGradient(0, 0, r1Inner, 0, 0, r1Outer);
                g1.addColorStop(0,    'rgba(255, 250, 235, 0)');
                g1.addColorStop(0.25, 'rgba(255, 248, 230, 0.08)');
                g1.addColorStop(0.45, 'rgba(255, 250, 240, 0.14)');
                g1.addColorStop(0.65, 'rgba(255, 248, 235, 0.09)');
                g1.addColorStop(1,    'rgba(255, 245, 225, 0)');

                const g2 = ctx.createRadialGradient(0, 0, r2Inner, 0, 0, r2Outer);
                g2.addColorStop(0,   'rgba(240, 245, 255, 0)');
                g2.addColorStop(0.3, 'rgba(245, 248, 255, 0.04)');
                g2.addColorStop(0.5, 'rgba(248, 250, 255, 0.07)');
                g2.addColorStop(0.7, 'rgba(242, 246, 255, 0.035)');
                g2.addColorStop(1,   'rgba(238, 242, 255, 0)');

                this._haloGrad = { g1, g2, r1: r1Outer, r2: r2Outer };
                this._haloGradR = sunBaseR;
            }

            // Subtle breath-synced opacity modulation (0.6 → 1.0)
            ctx.translate(cx, cy);
            ctx.globalAlpha = fadeOpacity * (0.6 + t * 0.4);
            ctx.fillStyle = this._haloGrad.g1;
            fillCircle(ctx, 0, 0, this._haloGrad.r1);
            ctx.fillStyle = this._haloGrad.g2;
            fillCircle(ctx, 0, 0, this._haloGrad.r2);
            ctx.globalAlpha = 1;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
    }

    _drawCloudySun(ctx, w, h) {
        const fadeOpacity = this._layerFadeProgress.effects;
        const celestial = this._getCelestialPosition(w, h);
        const dpr = this._cachedDimensions.dpr;

        if (this._isThemeDark) {
            ctx.globalCompositeOperation = 'source-over';
            const pulse = Math.sin(this._sunPulsePhase * 0.4) * 0.02 + 0.98;
            const sunBaseR = this._celestialSize ? this._celestialSize / 2 : 31;

            // Atmospheric corona — icy silver bloom
            if (!this._csCoronaGrad || this._csCoronaGradR !== sunBaseR) {
                const coronaR = sunBaseR * 3.2;
                const cg = ctx.createRadialGradient(0, 0, sunBaseR * 0.5, 0, 0, coronaR);
                cg.addColorStop(0.0,  'rgba(255,255,255,0.24)');
                cg.addColorStop(0.12, 'rgba(242,248,255,0.14)');
                cg.addColorStop(0.32, 'rgba(228,238,252,0.05)');
                cg.addColorStop(0.62, 'rgba(218,230,250,0.012)');
                cg.addColorStop(1.0,  'rgba(212,225,245,0)');
                this._csCoronaGrad = cg;
                this._csCoronaGradR = sunBaseR;
                this._csCoronaOuterR = coronaR;
            }

            // Disc body — piercing white core, cool silver feathered edge
            if (!this._cloudySunGradDark || this._cloudySunGradDarkR !== sunBaseR) {
                const g = ctx.createRadialGradient(
                    -sunBaseR * 0.35, -sunBaseR * 0.35, 0,
                    0, 0, sunBaseR
                );
                g.addColorStop(0.0,  'rgba(255,255,255,1)');
                g.addColorStop(0.28, 'rgba(244,248,255,1)');
                g.addColorStop(0.58, 'rgba(230,240,252,1)');
                g.addColorStop(0.85, 'rgba(220,232,250,1)');
                g.addColorStop(1.0,  'rgba(212,226,246,0.35)');
                this._cloudySunGradDark = g;
                this._cloudySunGradDarkR = sunBaseR;
            }

            const isStandalone = this._config.card_style === 'standalone';
            const darkDayAtten = this._isTimeNight ? 1.0 : (isStandalone ? 0.38 : 0.85);
            ctx.globalAlpha = fadeOpacity * darkDayAtten;
            ctx.scale(pulse, pulse);

            ctx.fillStyle = this._csCoronaGrad;
            fillCircle(ctx, 0, 0, this._csCoronaOuterR);

            ctx.fillStyle = this._cloudySunGradDark;
            fillCircle(ctx, 0, 0, sunBaseR);

            // 8-point light rays — faint icy white
            const rayLen = sunBaseR * 4.2;
            const diagLen = rayLen * 0.65;
            ctx.globalAlpha = 0.06 * fadeOpacity * darkDayAtten;
            ctx.strokeStyle = 'rgba(235,242,255,1)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-rayLen, 0); ctx.lineTo(rayLen, 0);
            ctx.moveTo(0, -rayLen); ctx.lineTo(0, rayLen);
            const d = diagLen * 0.707;
            ctx.moveTo(-d, -d); ctx.lineTo(d, d);
            ctx.moveTo(d, -d); ctx.lineTo(-d, d);
            ctx.stroke();

            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            return;
        }

        ctx.globalCompositeOperation = 'screen';
        const isMoon = this._isNight;
        const c1 = isMoon ? '240,245,255' : '255,255,255';
        const c2 = isMoon ? '225,235,252' : '240,246,255';
        const c3 = isMoon ? '215,228,248' : '228,238,252';
        const cCore = isMoon ? '210,225,255' : '255,255,255';

        const sunBaseR = this._celestialSize ? this._celestialSize / 2 : 31;
        const csGlowScale = sunBaseR / 26;
        const outerR = 92 * csGlowScale;
        const coreR  = 42 * csGlowScale;

        const cacheKey = isMoon ? '_csGlowMoon' : '_csGlowDay';
        if (!this[cacheKey] || this[cacheKey].sr !== sunBaseR) {
            const g = ctx.createRadialGradient(0, 0, 0, 0, 0, outerR);
            g.addColorStop(0,    `rgba(${c1},0.58)`);
            g.addColorStop(0.14, `rgba(${c1},0.32)`);
            g.addColorStop(0.32, `rgba(${c2},0.12)`);
            g.addColorStop(0.60, `rgba(${c3},0.025)`);
            g.addColorStop(1,    `rgba(${c3},0)`);

            const core = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
            core.addColorStop(0,   `rgba(${cCore},0.48)`);
            core.addColorStop(0.35, `rgba(${c1},0.18)`);
            core.addColorStop(1,    `rgba(${c2},0)`);

            this[cacheKey] = { outer: g, core: core, outerR, coreR, sr: sunBaseR };
        }

        const isStandalone = this._config.card_style === 'standalone';
        const cached = this[cacheKey];
        ctx.globalAlpha = Math.min(1.0, fadeOpacity * (isStandalone ? 1.0 : 1.4));
        ctx.translate(celestial.x, celestial.y);

        ctx.fillStyle = cached.outer;
        fillCircle(ctx, 0, 0, cached.outerR);

        ctx.fillStyle = cached.core;
        fillCircle(ctx, 0, 0, cached.coreR);

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ========================================================================
    // PHASE 2: RUNTIME CLOUD BAKING (OffscreenCanvas / hidden <canvas> fallback)
    // ========================================================================
    /**
     * Pre-renders all puffs of a single cloud onto the shared texture atlas.
     * Called once per cloud during _initParticles. The baked image is drawn
     * as a single drawImage() call per cloud in _drawClouds.
     */
    _bakeCloud(cloud, cp, isLightBg, isThemeDark, isTimeNight, highlightOffsetBase, hOffset, rainyOpacityMul, globalOpacity, ambient, dpr, packer) {
        const puffs = cloud.puffs;
        if (!puffs || puffs.length === 0) return;

        const hStretch  = cloud._hStretch  !== undefined ? cloud._hStretch  : 1.0;
        const vCompress = cloud._vCompress !== undefined ? cloud._vCompress : 0.55;
        const layerHighlightOffset = (cloud.layer === 5 && !isThemeDark) ? 0.50 : highlightOffsetBase;

        const prof = CLOUD_TYPE_PROFILES[cloud.cloudType] || CLOUD_TYPE_PROFILES.organic;
        const shadowCut = prof[0], surfaceCut = prof[1], hlMul = prof[2];
        const shadowRad = prof[3], surfaceRad = prof[4];
        const maxRadMul = Math.max(shadowRad, surfaceRad, 1.0);

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let j = 0; j < puffs.length; j++) {
            const p = puffs[j];
            const px = p.offsetX * hStretch;
            const py = p.offsetY * vCompress;
            const sq = p.squash !== undefined ? p.squash : 1.0;

            const radH = p.rad * hStretch * maxRadMul;
            const radV = p.rad * sq * vCompress * maxRadMul;

            if (px - radH < minX) minX = px - radH;
            if (px + radH > maxX) maxX = px + radH;
            if (py - radV < minY) minY = py - radV;
            if (py + radV > maxY) maxY = py + radV;
        }

        const margin = 6;
        minX -= margin; minY -= margin;
        maxX += margin; maxY += margin;

        const bakeW = Math.ceil(maxX - minX);
        const bakeH = Math.ceil(maxY - minY);
        if (bakeW <= 0 || bakeH <= 0) return;

        const physW = Math.ceil(bakeW * dpr);
        const physH = Math.ceil(bakeH * dpr);

        if (packer.x + physW + 2 > packer.maxWidth) {
            packer.x = 0;
            packer.y += packer.rowHeight + 2;
            packer.rowHeight = 0;
        }

        if (packer.y + physH > 2048) return;

        const atlasX = packer.x;
        const atlasY = packer.y;
        packer.x += physW + 2;
        if (physH > packer.rowHeight) packer.rowHeight = physH;

        const oc = packer.ctx;
        oc.save();
        oc.translate(atlasX, atlasY);
        oc.scale(dpr, dpr);

        const { litR, litG, litB, midR, midG, midB, shadowR, shadowG, shadowB } = cp;
        const shadeH = bakeH || 1;
        const bodyHlScale = hlMul * 0.4;
        const baseOpacity = globalOpacity * cloud.opacity * ambient;

        for (let j = 0; j < puffs.length; j++) {
            const puff = puffs[j];
            const sq = puff.squash !== undefined ? puff.squash : 1.0;

            const drawX = puff.offsetX * hStretch  - minX;
            const drawY = puff.offsetY * vCompress - minY;

            const normalizedY = drawY / shadeH;
            const posFactor = Math.max(0.20, 1 - normalizedY * 0.68);

            const depth = puff.depth;
            const isShadow  = depth < shadowCut;
            const isSurface = !isShadow && depth > surfaceCut;

            let pR, pG, pB, finalOpacity, pRadius, pHlX = 0, pHlY = 0;

            if (isShadow) {
                const sf = posFactor * 0.30;
                pR = (midR * sf + shadowR * (1 - sf)) | 0;
                pG = (midG * sf + shadowG * (1 - sf)) | 0;
                pB = (midB * sf + shadowB * (1 - sf)) | 0;
                finalOpacity = baseOpacity * 0.72;
                pRadius = puff.rad * shadowRad;
            } else if (isSurface) {
                const sf = posFactor * (0.55 + puff.shade * 0.45);
                pR = (litR * sf + midR * (1 - sf)) | 0;
                pG = (litG * sf + midG * (1 - sf)) | 0;
                pB = (litB * sf + midB * (1 - sf)) | 0;
                finalOpacity = baseOpacity * (0.68 + puff.shade * 0.30);
                pRadius = puff.rad * surfaceRad;
                const diffuse = normalizedY * normalizedY * 0.65;
                pHlX = -puff.rad * hOffset * hlMul * (1 - diffuse);
                pHlY = -puff.rad * layerHighlightOffset * hlMul * (1 - diffuse * 0.5);
            } else {
                const sf = posFactor * (0.40 + puff.shade * 0.50);
                pR = (litR * sf + midR * (1 - sf)) | 0;
                pG = (litG * sf + midG * (1 - sf)) | 0;
                pB = (litB * sf + midB * (1 - sf)) | 0;
                finalOpacity = baseOpacity * (0.55 + puff.shade * 0.35);
                pRadius = puff.rad;
                const diffuse = normalizedY * normalizedY * 0.65;
                pHlX = -puff.rad * hOffset * bodyHlScale * (1 - diffuse);
                pHlY = -puff.rad * layerHighlightOffset * bodyHlScale * (1 - diffuse * 0.5);
            }

            if (rainyOpacityMul !== 1.0) {
                finalOpacity = Math.min(1.0, finalOpacity * rainyOpacityMul);
            }

            let dR = pR, dG = pG, dB = pB;
            let dMidR = midR, dMidG = midG, dMidB = midB;
            let dShadR = shadowR, dShadG = shadowG, dShadB = shadowB;

            if (isThemeDark && finalOpacity < 0.20) {
                const dim = isTimeNight ? 0.40 : 0.75;
                finalOpacity = Math.min(1.0, finalOpacity * (isTimeNight ? 2.5 : 2.0));
                dR = (dR * dim) | 0; dG = (dG * dim) | 0; dB = (dB * dim) | 0;
                dMidR = (dMidR * dim) | 0; dMidG = (dMidG * dim) | 0; dMidB = (dMidB * dim) | 0;
                dShadR = (dShadR * dim) | 0; dShadG = (dShadG * dim) | 0; dShadB = (dShadB * dim) | 0;
            }

            if (finalOpacity < 0.005) continue;

            oc.save();
            oc.translate(drawX, drawY);
            if (puff.rotation) oc.rotate(puff.rotation);
            oc.scale(hStretch, sq * vCompress);

            const grad = oc.createRadialGradient(pHlX, pHlY, 0, 0, 0, pRadius);

            if (isShadow) {
                grad.addColorStop(0,    `rgba(${dR},${dG},${dB},${finalOpacity})`);
                grad.addColorStop(0.45, `rgba(${dShadR},${dShadG},${dShadB},${finalOpacity * 0.58})`);
                grad.addColorStop(1.0,  `rgba(${dShadR},${dShadG},${dShadB},0)`);
            } else if (isSurface) {
                grad.addColorStop(0,    `rgba(${dR},${dG},${dB},${finalOpacity})`);
                grad.addColorStop(0.22, `rgba(${dR},${dG},${dB},${finalOpacity * 0.90})`);
                if (isLightBg) {
                    grad.addColorStop(0.45, `rgba(${dMidR},${dMidG},${dMidB},${finalOpacity * 0.50})`);
                    grad.addColorStop(0.68, `rgba(${dShadR},${dShadG},${dShadB},${finalOpacity * 0.12})`);
                    grad.addColorStop(0.90, `rgba(${dShadR},${dShadG},${dShadB},${finalOpacity * 0.01})`);
                } else {
                    grad.addColorStop(0.40, `rgba(${dMidR},${dMidG},${dMidB},${finalOpacity * 0.42})`);
                    grad.addColorStop(0.65, `rgba(${dShadR},${dShadG},${dShadB},${finalOpacity * 0.10})`);
                }
                grad.addColorStop(1.0, `rgba(${dShadR},${dShadG},${dShadB},0)`);
            } else {
                const midStop = 0.28 + puff.softness * 0.22;
                grad.addColorStop(0, `rgba(${dR},${dG},${dB},${finalOpacity})`);
                if (isLightBg) {
                    grad.addColorStop(midStop, `rgba(${dMidR},${dMidG},${dMidB},${finalOpacity * 0.72})`);
                    const shelf = midStop + (1.0 - midStop) * 0.40;
                    grad.addColorStop(shelf, `rgba(${dShadR},${dShadG},${dShadB},${finalOpacity * 0.20})`);
                    grad.addColorStop(shelf + (1.0 - shelf) * 0.55, `rgba(${dShadR},${dShadG},${dShadB},${finalOpacity * 0.02})`);
                    grad.addColorStop(1.0, `rgba(${dShadR},${dShadG},${dShadB},0)`);
                } else {
                    grad.addColorStop(midStop, `rgba(${dMidR},${dMidG},${dMidB},${finalOpacity * 0.78})`);
                    grad.addColorStop(0.65, `rgba(${dShadR},${dShadG},${dShadB},${finalOpacity * 0.28})`);
                    grad.addColorStop(0.85, `rgba(${dShadR},${dShadG},${dShadB},0)`);
                }
            }

            oc.fillStyle = grad;
            oc.beginPath();
            oc.arc(0, 0, pRadius, 0, TWO_PI);
            oc.fill();
            oc.restore();
        }

        oc.restore();

        cloud._bakedCanvas  = this._cloudAtlas;
        cloud._atlasX       = atlasX;
        cloud._atlasY       = atlasY;
        cloud._atlasW       = physW;
        cloud._atlasH       = physH;

        cloud._bakeOffX     = minX;
        cloud._bakeOffY     = minY;
        cloud._bakeLogicalW = bakeW;
        cloud._bakeLogicalH = bakeH;
    }

    /**
     * Bakes all clouds and foreground clouds after initialization.
     * Must be called after _buildRenderState so cp is available.
     */
    _bakeAllClouds() {
        const rs = this._renderState;
        if (!rs) return;
        const cp = rs.cp;
        const isLightBg = this._isLightBackground;
        const isThemeDark = this._isThemeDark;
        const isTimeNight = this._isTimeNight;
        const globalOpacity = rs.cloudGlobalOp;
        const dpr = this._cachedDimensions.dpr;
		const textureDpr = Math.min(1.5, dpr);

        // --- Initialize Master Texture Atlas ---
        if (!this._cloudAtlas) {
            try {
                // 2048x2048 is universally safe for all mobile/desktop GPUs
                this._cloudAtlas = new OffscreenCanvas(2048, 2048);
            } catch (e) {
                this._cloudAtlas = document.createElement('canvas');
                this._cloudAtlas.width = 2048;
                this._cloudAtlas.height = 2048;
            }
        }
        
        const atlasCtx = this._cloudAtlas.getContext('2d', { willReadFrequently: false });
        atlasCtx.clearRect(0, 0, 2048, 2048);

        // Simple shelf-packing tracker to organize clouds on the canvas
        const packer = {
            x: 0,
            y: 0,
            rowHeight: 0,
            maxWidth: 2048,
            ctx: atlasCtx
        };

        const bakeList = (list) => {
            for (let i = 0; i < list.length; i++) {
                this._bakeCloud(
                    list[i], cp, isLightBg, isThemeDark, isTimeNight,
                    cp.highlightOffsetBase, cp.hOffset, cp.rainyOpacityMul,
                    globalOpacity, cp.ambient, textureDpr, packer
                );
            }
        };

        bakeList(this._clouds);
        bakeList(this._fgClouds);
    }

    _drawClouds(ctx, cloudList, w, h, effectiveWind, globalOpacity) {
        if (cloudList.length === 0) return;
        const fadeOpacity = this._layerFadeProgress.clouds;
        if (fadeOpacity <= 0) return;

        const rs = this._renderState;
        if (!rs) return;
        const dpr = this._cachedDimensions.dpr;

        for (let i = 0; i < cloudList.length; i++) {
            const cloud = cloudList[i];

            const depthFactor = 1 + cloud.layer * 0.2;
            cloud.x += cloud.speed * effectiveWind * depthFactor;
            
            if (cloud.x > w + 280) cloud.x = -280;
            if (cloud.x < -280) cloud.x = w + 280;

            cloud.breathPhase += cloud.breathSpeed;
            const breathScale = 1 + Math.sin(cloud.breathPhase) * 0.022;
            const drawScale = cloud.scale * breathScale;

            if (cloud._bakedCanvas) {
                // Vertical thermal drift — ~22s cycle per cloud, phase-offset naturally
                const yDrift = Math.sin(cloud.breathPhase * 2.4) * 3.5;
                ctx.translate(cloud.x, cloud.y - (h * 0.06) + yDrift);
                ctx.scale(drawScale, drawScale);
                ctx.globalAlpha = fadeOpacity;
                
                // Slice the exact cloud bounding box from the master atlas
                ctx.drawImage(
                    cloud._bakedCanvas, 
                    cloud._atlasX, cloud._atlasY, cloud._atlasW, cloud._atlasH, // Source coordinates
                    cloud._bakeOffX, cloud._bakeOffY, cloud._bakeLogicalW, cloud._bakeLogicalH // Destination coordinates
                );
                
                ctx.globalAlpha = 1;
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            }
        }
    }

    _drawRain(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.precipitation;
        if (fadeOpacity <= 0) return;

        const isDay = this._isLightBackground;
        const rgbBase = this._renderState.rainRgb;
        const len = this._rain.length;
        const dpr = this._cachedDimensions.dpr;

        if (!this._rainTex) return;

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

            // 1. Move to the head of the drop
            ctx.translate(pt.x, pt.y);
            
            // 2. Point along the velocity vector
            ctx.rotate(Math.atan2(moveY, moveX)); 
            
            ctx.globalAlpha = finalOp;
            
            ctx.drawImage(this._rainTex, -dropLen, -width / 2, dropLen, width);
            
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        
        ctx.globalAlpha = 1;
    }

    _drawSnow(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.precipitation;
        if (fadeOpacity <= 0) return;
        const len = this._snow.length;
        const isLight = this._isLightBackground;
        
        if (!this._snowTexFg) return;

        // --- STEP 2: LOOP & DRAW ---
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
                // Foreground flakes
                const gMul = isLight ? 1.4 : 1.0;
                const gRad = isLight ? 0.9 : 1.5;
                const r = drawSize * gRad;
                
                ctx.globalAlpha = Math.min(1, finalOpacity * gMul);
                ctx.drawImage(this._snowTexFg, pt.x - r, pt.y - r, r * 2, r * 2);
                
            } else {
                // Background flakes
                const smallR = drawSize * 0.75;
                const alphaOp = isLight ? 1.3 : 0.8;
                
                ctx.globalAlpha = Math.min(1, finalOpacity * alphaOp);
                ctx.drawImage(this._snowTexBg, pt.x - smallR, pt.y - smallR, smallR * 2, smallR * 2);
            }
        }
        
        ctx.globalAlpha = 1;
    }

    _drawHail(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.precipitation;
        if (fadeOpacity <= 0) return;
        const len = this._hail.length;
        const isLight = this._isLightBackground;
        const dpr = this._cachedDimensions.dpr;

        if (!this._hailTex) return;

        // --- STEP 2: LOOP & DRAW ---
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

            const baseOp = pt.z > 1.1 ? pt.op * 1.1 : pt.op * 0.75;
            ctx.globalAlpha = baseOp * fadeOpacity;

            ctx.translate(pt.x, pt.y);
            ctx.rotate(pt.rotation);
            
            ctx.drawImage(this._hailTex, -pt.size, -pt.size, pt.size * 2, pt.size * 2);
            
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        
        ctx.globalAlpha = 1;
    }

    _drawLightning(ctx, w, h) {
        if (!this._params?.thunder) return;
        const fadeOpacity = this._layerFadeProgress.effects;
        const isStandalone = this._config.card_style === 'standalone';

        if (Math.random() < 0.0072 && this._bolts.length < LIMITS.MAX_BOLTS) {
            this._flashOpacity = 0.92;
            this._flashHold = this._isLightBackground ? 7 : 6;
            this._bolts.push(this._createBolt(w, h));
            if (Math.random() < 0.25 && this._bolts.length < LIMITS.MAX_BOLTS) {
                this._bolts.push(this._createBolt(w, h));
            }
        }

        // Inter-flash storm darkness — persistent brooding veil between flashes
        if (!this._isLightBackground && isStandalone) {
            ctx.save();
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 0.18 * fadeOpacity;
            ctx.fillStyle = 'rgb(0, 0, 10)';
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }

        if (this._flashOpacity > 0) {
            if (this._flashHold > 0) {
                this._flashHold--;
            } else {
                this._flashOpacity *= this._isLightBackground ? 0.72 : 0.62;
            }
            
            if (isStandalone) {
                ctx.save();
                ctx.globalCompositeOperation = this._isThemeDark ? 'screen' : 'source-over';
                ctx.globalAlpha = this._flashOpacity * fadeOpacity * (this._isLightBackground ? 0.80 : 0.50);
                ctx.fillStyle = this._isLightBackground ? 'rgb(255, 255, 255)' : 'rgb(220, 235, 255)';
                ctx.fillRect(0, 0, w, h);
                ctx.restore();
            }
            
            if (this._flashOpacity < 0.005) this._flashOpacity = 0;
        }

        if (this._bolts.length > 0) {
            ctx.save();
            ctx.globalCompositeOperation = this._isThemeDark ? 'lighter' : 'source-over';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            for (let i = this._bolts.length - 1; i >= 0; i--) {
                const bolt = this._bolts[i];
                const segs = bolt.segments;
                const segLen = segs.length;

                // Build trunk path once, stroke multiple times for glow layers
                ctx.beginPath();
                for (let j = 0; j < segLen; j++) {
                    const seg = segs[j];
                    if (!seg.branch) {
                        if (seg.y === 0) ctx.moveTo(seg.x, seg.y);
                        ctx.lineTo(seg.nx, seg.ny);
                    }
                }

                // Glow passes (skip when glow has decayed to zero)
                if (bolt.glow > 0) {
                    // Pass 1: Wide diffuse glow (replaces shadowBlur = 20)
                    ctx.globalAlpha = bolt.glow * fadeOpacity * 0.15;
                    ctx.strokeStyle = bolt._glowStroke;
                    ctx.lineWidth = 24;
                    ctx.stroke();

                    // Pass 2: Medium glow halo
                    ctx.globalAlpha = bolt.glow * fadeOpacity * 0.3;
                    ctx.lineWidth = 14;
                    ctx.stroke();
                }

                // Pass 3: Outer visible stroke (always active while bolt lives)
                ctx.globalAlpha = bolt.alpha * 0.35 * fadeOpacity;
                ctx.strokeStyle = bolt._outerStroke;
                ctx.lineWidth = 8;
                ctx.stroke();

                // Pass 4: Hot white core (re-strokes same trunk path)
                ctx.globalAlpha = bolt.alpha * fadeOpacity;
                ctx.strokeStyle = bolt._coreStroke;
                ctx.lineWidth = 2.5;
                ctx.stroke();

                // Branches — thin secondary forks
                ctx.globalAlpha = bolt.alpha * 0.6 * fadeOpacity;
                ctx.strokeStyle = bolt._branchStroke;
                ctx.lineWidth = 1.5;
                for (let j = 0; j < segLen; j++) {
                    const seg = segs[j];
                    if (seg.branch) {
                        ctx.beginPath();
                        ctx.moveTo(seg.x, seg.y);
                        ctx.lineTo(seg.nx, seg.ny);
                        ctx.stroke();
                    }
                }

                bolt.alpha -= 0.05;
                if (bolt.glow > 0) bolt.glow -= 0.075;
                if (bolt.alpha <= 0) this._bolts.splice(i, 1);
            }

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

        const waves = this._aurora.waves;
        const waveLen = waves.length;
        for (let wi = 0; wi < waveLen; wi++) {
            const wave = waves[wi];
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
        const dpr = this._cachedDimensions.dpr;

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

            const vSquash = 0.1 + f.layer * 0.18;
            ctx.scale(1, vSquash);
            const drawY = (f.y + undulation) / vSquash;

            ctx.globalAlpha = f._baseOp * fadeOpacity;
            ctx.translate(f.x, drawY);
            ctx.fillStyle = f._g;
            ctx.beginPath();
            ctx.ellipse(0, 0, f.w / 2, f.h, 0, 0, TWO_PI);
            ctx.fill();
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        ctx.globalAlpha = 1;
    }

    _drawShootingStars(ctx, w, h) {
        const fadeOpacity = this._layerFadeProgress.stars;
        const dpr = this._cachedDimensions.dpr;

        if (Math.random() < 0.00177 && this._shootingStars.length < LIMITS.MAX_SHOOTING_STARS) {
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
                tailBuf: new Float32Array(TRAIL_CAP_SHOOTING_STAR * 2),
                tailHead: 0,
                tailLen: 0
            });
        }

        ctx.lineCap = 'round';

        for (let i = this._shootingStars.length - 1; i >= 0; i--) {
            const s = this._shootingStars[i];
            s.x += s.vx;
            s.y += s.vy;
            s.life -= 0.045;

            // Ring buffer push (replaces unshift + pop)
            s.tailBuf[s.tailHead * 2] = s.x;
            s.tailBuf[s.tailHead * 2 + 1] = s.y;
            s.tailHead = (s.tailHead + 1) % TRAIL_CAP_SHOOTING_STAR;
            if (s.tailLen < TRAIL_CAP_SHOOTING_STAR) s.tailLen++;

            if (s.life <= 0) {
                this._shootingStars.splice(i, 1);
                continue;
            }

            const opacity = s.life * fadeOpacity;
            const isInkMode = !this._isThemeDark;
            const headColorRgb = isInkMode ? 'rgb(50, 55, 65)' : 'rgb(255, 255, 255)';
            const tailColorRgb = isInkMode ? 'rgb(60, 65, 80)' : 'rgb(255, 255, 240)';

            ctx.globalAlpha = opacity;
            ctx.fillStyle = headColorRgb;
            fillCircle(ctx, s.x, s.y, s.size);

            ctx.lineWidth = s.size * 0.8;
            ctx.strokeStyle = tailColorRgb;

            // Alpha-banded shooting star tail: 4 bands (22 segments → 4 strokes).
            // Linear alpha fade approximated at band midpoints.
            const tailSegs = s.tailLen - 1;
            for (let band = 0; band < 4; band++) {
                const jStart = (band * tailSegs / 4) | 0;
                const jEnd = ((band + 1) * tailSegs / 4) | 0;
                if (jStart >= jEnd) continue;

                const midJ = (jStart + jEnd) * 0.5;
                ctx.globalAlpha = opacity * (1 - midJ / s.tailLen);

                ctx.beginPath();
                for (let j = jStart; j <= jEnd; j++) {
                    const idx = (((s.tailHead - 1 - j) % TRAIL_CAP_SHOOTING_STAR) + TRAIL_CAP_SHOOTING_STAR) % TRAIL_CAP_SHOOTING_STAR;
                    const px = s.tailBuf[idx * 2], py = s.tailBuf[idx * 2 + 1];
                    if (j === jStart) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.stroke();
            }
        }

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalAlpha = 1;
    }

    _drawComets(ctx, w, h) {
        const badWeather = this._renderState.isBadWeatherForComets;
        const dpr = this._cachedDimensions.dpr;

        if (this._isNight && !badWeather && this._comets.length === 0 && Math.random() < 0.000225) {
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
                tailBuf: new Float32Array(TRAIL_CAP_COMET * 2),
                tailHead: 0,
                tailLen: 0
            });
        }

        const fadeOpacity = this._layerFadeProgress.stars;
        if (fadeOpacity <= 0) return;

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

            // Ring buffer push
            c.tailBuf[c.tailHead * 2] = c.x;
            c.tailBuf[c.tailHead * 2 + 1] = c.y;
            c.tailHead = (c.tailHead + 1) % TRAIL_CAP_COMET;
            if (c.tailLen < TRAIL_CAP_COMET) c.tailLen++;

            // Distance-based tail trimming (replaces old pop-when-distance>170)
            if (c.tailLen > 2) {
                const newestIdx = (((c.tailHead - 1) % TRAIL_CAP_COMET) + TRAIL_CAP_COMET) % TRAIL_CAP_COMET;
                const oldestIdx = (((c.tailHead - c.tailLen) % TRAIL_CAP_COMET) + TRAIL_CAP_COMET) % TRAIL_CAP_COMET;
                const hx = c.tailBuf[newestIdx * 2], hy = c.tailBuf[newestIdx * 2 + 1];
                const tx = c.tailBuf[oldestIdx * 2], ty = c.tailBuf[oldestIdx * 2 + 1];
                const currentDist = Math.sqrt((hx - tx) ** 2 + (hy - ty) ** 2);
                if (currentDist > 170) c.tailLen--;
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
            ctx.strokeStyle = isInkMode ? 'rgb(65,80,100)' : 'rgb(160,210,255)';

            // Draw comet tail in alpha bands
            const tailSegs = c.tailLen - 1;
            for (let band = 0; band < 8; band++) {
                const jStart = (band * tailSegs / 8) | 0;
                const jEnd = ((band + 1) * tailSegs / 8) | 0;
                if (jStart >= jEnd) continue;

                const midP = (jStart + jEnd) * 0.5 / c.tailLen;
                ctx.lineWidth = c.size * (1 - midP * 0.8);
                ctx.globalAlpha = opacity * (1 - midP) * 0.6;

                ctx.beginPath();
                for (let j = jStart; j <= jEnd; j++) {
                    const idx = (((c.tailHead - 1 - j) % TRAIL_CAP_COMET) + TRAIL_CAP_COMET) % TRAIL_CAP_COMET;
                    const px = c.tailBuf[idx * 2], py = c.tailBuf[idx * 2 + 1];
                    if (j === jStart) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.stroke();
            }
        }

        ctx.globalAlpha = 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    _drawPlanes(ctx, w, h) {
        const dpr = this._cachedDimensions.dpr;

        if (this._planes.length === 0 && Math.random() < 0.0025) {
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
                plane.gapTimer = 8 + Math.random() * 14;
            }

            const wi = plane.histHead;
            plane.histBuf[wi * 3] = plane.x;
            plane.histBuf[wi * 3 + 1] = plane.y + (Math.random() - 0.5) * 1.5;
            plane.histBuf[wi * 3 + 2] = plane.gapTimer > 0 ? 1 : 0;
            plane.histHead = (wi + 1) % TRAIL_CAP_PLANE;
            if (plane.histLen < TRAIL_CAP_PLANE) plane.histLen++;

            const windShift = (this._windSpeed || 0) * 0.15;
            for (let j = 1; j < plane.histLen; j++) {
                const ridx = (((plane.histHead - 1 - j) % TRAIL_CAP_PLANE) + TRAIL_CAP_PLANE) % TRAIL_CAP_PLANE;
                plane.histBuf[ridx * 3] += windShift;
                plane.histBuf[ridx * 3 + 1] += 0.02;
            }

            if (plane.histLen > 2) {
                const baseOp = this._isThemeDark ? 0.12 : 0.23;
                const trailColor = this._isThemeDark ? 'rgb(210,220,240)' : 'rgb(255,255,255)';
                const histLen = plane.histLen;

                ctx.strokeStyle = trailColor;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.lineWidth = 3 * plane.scale;

                // Draw contrail as alpha-banded polylines
                const trailSegs = histLen - 1;
                for (let oi = 0; oi < 2; oi++) {
                    const offset = CONTRAIL_OFFSETS[oi];
                    const oX = sinA * offset * plane.scale * dir;
                    const oY = cosA * offset * plane.scale;

                    for (let band = 0; band < 10; band++) {
                        const kStart = (band * trailSegs / 10) | 0;
                        const kEnd = ((band + 1) * trailSegs / 10) | 0;
                        if (kStart >= kEnd) continue;

                        // Alpha from the original 3-piece curve at band midpoint
                        const midP = (kStart + kEnd) * 0.5 / histLen;
                        let bandAlpha;
                        if (midP < 0.05) bandAlpha = (midP / 0.05) * baseOp;
                        else if (midP < 0.6) bandAlpha = baseOp * (1 - (midP - 0.05) * 0.727);
                        else bandAlpha = baseOp * 0.6 * (1 - (midP - 0.6) / 0.4);
                        if (bandAlpha < 0.005) continue;

                        ctx.globalAlpha = bandAlpha;
                        ctx.beginPath();
                        let drawing = false;

                        // Walk points kStart..kEnd as a polyline, breaking at gaps
                        for (let k = kStart; k <= kEnd; k++) {
                            const ridx = (((plane.histHead - 1 - k) % TRAIL_CAP_PLANE) + TRAIL_CAP_PLANE) % TRAIL_CAP_PLANE;
                            const gap = plane.histBuf[ridx * 3 + 2];
                            if (gap > 0.5) {
                                drawing = false;
                            } else {
                                const px = plane.histBuf[ridx * 3] + oX;
                                const py = plane.histBuf[ridx * 3 + 1] + oY;
                                if (!drawing) { ctx.moveTo(px, py); drawing = true; }
                                else { ctx.lineTo(px, py); }
                            }
                        }
                        ctx.stroke();
                    }
                }
                ctx.globalAlpha = 1;
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            }

            ctx.translate(plane.x, plane.y);
            ctx.scale(plane.scale, plane.scale);
            if (plane.climbAngle > 0) {
                ctx.rotate(-plane.climbAngle * dir);
            }

            ctx.globalAlpha = 0.9;
            ctx.strokeStyle = this._isThemeDark ? 'rgb(125, 135, 145)' : 'rgb(105, 110, 120)';
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            for (let seg = 0; seg < PLANE_PATH.length; seg++) {
                const s = PLANE_PATH[seg];
                ctx.moveTo(s[0] * dir, s[1]);
                ctx.lineTo(s[2] * dir, s[3]);
            }
            ctx.stroke();
            ctx.globalAlpha = 1;

            plane.blinkPhase += 0.12;
            
            if (Math.sin(plane.blinkPhase) > 0.75) {
                ctx.globalAlpha = 1.0;
                if (this._isThemeDark) {
                    ctx.fillStyle = plane.vx > 0 ? 'rgb(90, 255, 130)' : 'rgb(255, 100, 100)';
                    fillCircle(ctx, 0, 1, 1.5);
                } else {
                    ctx.fillStyle = plane.vx > 0 ? 'rgb(50, 255, 80)' : 'rgb(255, 50, 50)';
                    fillCircle(ctx, 0, 1, 1.8);
                }
                ctx.globalAlpha = 1;
            }

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            if (plane.x < -450 || plane.x > w + 450) {
                this._planes.splice(i, 1);
            }
        }
        ctx.globalAlpha = 1;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
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
        const dpr = this._cachedDimensions.dpr;

        const windNorm = Math.min(1.0, Math.max(0, windKmh / 50));
        const windIntensity = windNorm * windNorm;

        const speedScale = 0.02 + (1.48 * windIntensity);
        
        let activeCount, vaporIntensity;
        if (p.windVapor && windKmh >= 15) {
            activeCount = 24;
            vaporIntensity = 1.0;
        } else if (p.windVapor || windKmh >= 20) {
            activeCount = Math.floor(6 + (18 * windIntensity));
            vaporIntensity = 0.6 + windIntensity * 0.4;
        } else {
            activeCount = Math.floor(8 + windIntensity * 4);
            vaporIntensity = 0.85 + windIntensity * 0.15;
        }

        const len = Math.min(this._windVapor.length, activeCount);
        if (len <= 0) return;
        if (!this._vaporTex) return;
        const cp = this._renderState.cp;
        const gustVal = this._windGust * windIntensity;
        const isDark = this._isThemeDark;

        ctx.globalCompositeOperation = 'source-over';
        const rotFade = 1 - windIntensity * 0.85;

        for (let i = 0; i < len; i++) {
            const v = this._windVapor[i];
            
            v.phase += v.phaseSpeed * speedScale;
            const gustBoost = Math.max(0, gustVal) * v.gustWeight * 2.5;
            
            const localEffective = effectiveWind * speedScale;
            const baseVelocity = (v.speed * speedScale) + localEffective;
            
            const moveX = (baseVelocity + gustBoost) * (1 + this._windSpeed * 0.3);
            v.x += moveX;

            const undulation = Math.sin(v.phase) * v.drift;

            if (v.x > w + v.w) v.x = -v.w;
            if (v.x < -v.w * 1.5) v.x = w + v.w;

            const baseOp = isDark ? (0.48 + v.tier * 0.24) : (0.66 + v.tier * 0.22);
            const gustOpBump = Math.max(0, gustVal) * 0.2;
            
            const baseStretch = 0.85 + (1.15 * windIntensity);
            const gustStretch = baseStretch + Math.max(0, gustVal) * 0.3;
            
            const calmSquash = 0.7;
            const windySquash = 0.5;
            const dynamicSquash = calmSquash - ((calmSquash - windySquash) * windIntensity);

            const drawW = v.w * gustStretch;
            const drawH = v.w * v.squash * dynamicSquash;

            const centerX = v.x;
            const centerY = v.y + undulation;
            const rotAngle = v.baseRotation * rotFade;

            ctx.globalAlpha = Math.min(1.0, (baseOp + gustOpBump) * fadeOpacity * vaporIntensity);

            ctx.translate(centerX, centerY);
            ctx.rotate(rotAngle);
            ctx.drawImage(this._vaporTex, -drawW * 0.5, -drawH * 0.5, drawW, drawH);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }

    _drawMoon(ctx, w, h) {
        if (!this._isTimeNight) return;
        if (!this._stateInitialized || !this._renderGate.isRevealed) return;

        const fadeOpacity = this._layerFadeProgress.stars;
        if (fadeOpacity <= 0.05) return;

        const celestial = this._getCelestialPosition(w, h);
        const moonX = celestial.x;
        const moonY = celestial.y;

        // 15% rule: Moon radius is always 85% of the Sun's base radius.
        // sun_moon_size sets the Sun diameter; Moon is derived proportionally.
        // Unconfigured: sunBaseR = 26 → moonRadius = 22.1
        // Configured (sun_moon_size: 50): sunBaseR = 25 → moonRadius = 21.25
        const sunBaseR = this._celestialSize ? this._celestialSize / 2 : 31;
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

        if (this._moonRotationRad) {
            ctx.translate(moonX, moonY);
            ctx.rotate(this._moonRotationRad);
            ctx.translate(-moonX, -moonY);
        }

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
            ctx.globalAlpha = ringCfg.op * fadeOpacity;
            ctx.strokeStyle = ringCfg._rgb || (ringCfg._rgb = `rgb(${ringCfg.rgb})`);
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.globalAlpha = 1;
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
            const nmFills = MOON_STYLE_COLORS.newMoon[nmKey];
            for (let fi = 0; fi < nmFills.length; fi++) {
                const fill = nmFills[fi];
                ctx.globalAlpha = fill.op * fadeOpacity;
                ctx.fillStyle = fill._rgb || (fill._rgb = `rgb(${fill.rgb})`);
                fillCircle(ctx, moonX, moonY, moonRadius);
            }
            ctx.globalAlpha = 1;
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
            ctx.globalAlpha = ds.op * fadeOpacity;
            ctx.fillStyle = ds._rgb || (ds._rgb = `rgb(${ds.rgb})`);
            fillCircle(ctx, moonX, moonY, moonRadius);
            ctx.globalAlpha = 1;

            if (!useLightColors) {
                const earthshineOp = (1 - illumination) * 0.08 * fadeOpacity;
                ctx.globalAlpha = earthshineOp;
                ctx.fillStyle = 'rgb(100, 115, 145)';
                fillCircle(ctx, moonX, moonY, moonRadius);
                ctx.globalAlpha = 1;
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
            ctx.globalAlpha = op * (lc ? 0.12 : 0.13);
            ctx.fillStyle = lc ? 'rgb(180,190,210)' : 'rgb(30,35,50)';
            for (let m = 0; m < MOON_CRATERS.maria.length; m++) {
                const c = MOON_CRATERS.maria[m];
                ctx.beginPath();
                ctx.ellipse(moonX + c.dx * ms, moonY + c.dy * ms, c.rx * ms, c.ry * ms, c.rot, 0, TWO_PI);
                ctx.fill();
            }

            // Maria inner (darker cores)
            ctx.globalAlpha = op * (lc ? 0.16 : 0.22);
            ctx.fillStyle = lc ? 'rgb(170,180,200)' : 'rgb(25,30,45)';
            for (let m = 0; m < MOON_CRATERS.mariaInner.length; m++) {
                const c = MOON_CRATERS.mariaInner[m];
                ctx.beginPath();
                ctx.ellipse(moonX + c.dx * ms, moonY + c.dy * ms, c.rx * ms, c.ry * ms, c.rot, 0, TWO_PI);
                ctx.fill();
            }

            // Detail craters (small circular impacts)
            ctx.globalAlpha = op * (lc ? 0.10 : 0.13);
            ctx.fillStyle = lc ? 'rgb(175,185,205)' : 'rgb(25,30,45)';
            for (let m = 0; m < MOON_CRATERS.detail.length; m++) {
                const c = MOON_CRATERS.detail[m];
                fillCircle(ctx, moonX + c.dx * ms, moonY + c.dy * ms, c.r * ms);
            }
            ctx.globalAlpha = 1;
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
            for (let si = 0; si < cfg.length; si++) {
                const stop = cfg[si];
                grad.addColorStop(stop[0], stop[2] === 0 ? `rgba(${stop[1]}, 0)` : `rgba(${stop[1]}, ${stop[2] / peak})`);
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

        if (!this._ctxs) {
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

        bg.clearRect(0, 0, w, h);
        mid.clearRect(0, 0, w, h);
        fg.clearRect(0, 0, w, h);

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

                if (s.tier === 'hero') {
                    if (isGolden) {
                        bg.globalCompositeOperation = 'source-over';
                        bg.globalAlpha = finalOpacity * s._bodyAlphaRatio;
                        bg.fillStyle = s._fill;
                        fillCircle(bg, s.x, s.y, currentSize * s._bodyR);

                        // Halo gradient
                        const haloGrad = bg.createRadialGradient(s.x, s.y, currentSize * s._haloInnerR, s.x, s.y, currentSize * s._haloOuterR);
                        haloGrad.addColorStop(0, s._haloInner);
                        haloGrad.addColorStop(1, s._haloOuter);
                        bg.globalAlpha = finalOpacity;
                        bg.fillStyle = haloGrad;
                        fillCircle(bg, s.x, s.y, currentSize * s._haloOuterR);

                        // Cross spikes
                        const spikeLen = currentSize * s._spikeLen;
                        bg.globalAlpha = finalOpacity * s._spikeRatio;
                        bg.strokeStyle = s._stroke;
                        bg.lineWidth = 0.5;
                        bg.beginPath();
                        bg.moveTo(s.x - spikeLen, s.y);
                        bg.lineTo(s.x + spikeLen, s.y);
                        bg.moveTo(s.x, s.y - spikeLen);
                        bg.lineTo(s.x, s.y + spikeLen);
                        bg.stroke();
                        bg.globalAlpha = 1;
                        bg.globalCompositeOperation = 'source-over';
                    } else {
                        bg.globalCompositeOperation = 'lighter';
                        bg.globalAlpha = finalOpacity;
                        bg.fillStyle = s._fill;
                        fillCircle(bg, s.x, s.y, currentSize * s._bodyR);

                        const grad = bg.createRadialGradient(s.x, s.y, currentSize * s._haloInnerR, s.x, s.y, currentSize * s._haloOuterR);
                        grad.addColorStop(0, s._haloInner);
                        grad.addColorStop(1, s._haloOuter);
                        bg.globalAlpha = finalOpacity;
                        bg.fillStyle = grad;
                        fillCircle(bg, s.x, s.y, currentSize * s._haloOuterR);

                        const spikeLen = currentSize * s._spikeLen;
                        bg.globalAlpha = finalOpacity * s._spikeRatio;
                        bg.strokeStyle = s._stroke;
                        bg.lineWidth = 0.5;
                        bg.beginPath();
                        bg.moveTo(s.x - spikeLen, s.y);
                        bg.lineTo(s.x + spikeLen, s.y);
                        bg.moveTo(s.x, s.y - spikeLen);
                        bg.lineTo(s.x, s.y + spikeLen);
                        bg.stroke();

                        // Rotating crown — 4 diagonal rays
                        const crownLen = currentSize * s._crownLen;
                        bg.globalAlpha = finalOpacity * s._crownRatio;
                        bg.translate(s.x, s.y);
                        bg.rotate(s.phase * 0.18);
                        bg.strokeStyle = s._stroke;
                        bg.lineWidth = 0.8;
                        bg.beginPath();
                        for (let r = 0; r < 4; r++) {
                            const a = (r / 4) * TWO_PI + Math.PI / 4;
                            bg.moveTo(0, 0);
                            bg.lineTo(Math.cos(a) * crownLen, Math.sin(a) * crownLen);
                        }
                        bg.stroke();
                        bg.setTransform(dpr, 0, 0, dpr, 0, 0);
                        bg.globalAlpha = 1;
                        bg.globalCompositeOperation = 'source-over';
                    }
                } else {
                    if (isGolden) {
                        bg.globalCompositeOperation = 'source-over';
                    }
                    bg.globalAlpha = finalOpacity;
                    bg.fillStyle = s._fill;
                    fillCircle(bg, s.x, s.y, currentSize * (isGolden ? 0.55 : 0.5));
                    bg.globalAlpha = 1;
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
        // Celestial accent clouds before main clouds — rays bleed through
        if (this._celestialClouds.length > 0) {
            this._drawCelestialClouds(mid, w, h, effectiveWind);
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
