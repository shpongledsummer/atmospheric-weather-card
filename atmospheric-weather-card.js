/**
 * ATMOSPHERIC WEATHER CARD
 * Version: 2.3
 * * A custom Home Assistant card that renders animated weather effects.
 * * https://github.com/shpongledsummer/atmospheric-weather-card
 */

console.info(
    "%c ATMOSPHERIC WEATHER CARD ",
    "color: white; font-weight: 700; background: linear-gradient(90deg, #355C7D 0%, #6C5B7B 50%, #C06C84 100%); padding: 6px 12px; border-radius: 6px; font-family: sans-serif; letter-spacing: 0.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);"
);

// ============================================================================
// 1. CONSTANTS & CONFIGURATION
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
 *   type       — Primary particle system: 'rain', 'snow', 'cloud', 'stars', etc.
 *   atmosphere — Visual mood used for CSS backgrounds and dust mote logic.
 *   count      — Precipitation particle count.
 *   cloud      — Number of cloud objects.
 *   wind       — Base wind speed multiplier.
 *   rays       — Whether to draw sun god-rays.
 *   dark       — Storm darkening flag (affects cloud colors).
 *   thunder    — Enables lightning bolt spawning.
 *   foggy      — Enables fog bank layer.
 *   leaves     — Enables leaf particle system.
 *   stars      — Star particle count (dark theme night only).
 *   scale      — Cloud size multiplier.
 */
const WEATHER_MAP = Object.freeze({
    'clear-night':      Object.freeze({ type: 'stars', count: 280, cloud: 4,  wind: 0.1, rays: false, atmosphere: 'night', stars: 420 }),
    'cloudy':           Object.freeze({ type: 'cloud', count: 0,   cloud: 26, wind: 0.3, dark: false, rays: false, atmosphere: 'overcast', stars: 120, scale: 1.2 }),
    'fog':              Object.freeze({ type: 'fog',   count: 0,   cloud: 18, wind: 0.2, rays: false, atmosphere: 'mist', foggy: true, stars: 125, scale: 1.5 }),
    'hail':             Object.freeze({ type: 'hail',  count: 150, cloud: 18, wind: 0.8, dark: true, rays: false, atmosphere: 'storm', stars: 50, scale: 1.3 }),
    'lightning':        Object.freeze({ type: 'rain',  count: 200, cloud: 18, wind: 2.0, thunder: true, dark: true, rays: false, atmosphere: 'storm', stars: 20, scale: 1.0 }),
    'lightning-rainy':  Object.freeze({ type: 'rain',  count: 150, cloud: 14, wind: 2.0, thunder: true, dark: true, rays: false, atmosphere: 'storm', stars: 20, scale: 1.0 }),
    'pouring':          Object.freeze({ type: 'rain',  count: 220, cloud: 16, wind: 0.3, dark: true, rays: false, atmosphere: 'storm', stars: 40, scale: 1.2 }),
    'rainy':            Object.freeze({ type: 'rain',  count: 120, cloud: 22, wind: 0.6, rays: false, atmosphere: 'rain', stars: 60, scale: 1.3 }),
    'snowy':            Object.freeze({ type: 'snow',  count: 50, cloud: 20, wind: 0.3, rays: false, atmosphere: 'snow', stars: 60, scale: 1.3 }),
    'snowy-rainy':      Object.freeze({ type: 'mix',   count: 100, cloud: 18, wind: 0.4, rays: false, atmosphere: 'snow', stars: 125, scale: 1.3 }),
    'partlycloudy':     Object.freeze({ type: 'cloud', count: 0,   cloud: 18, wind: 0.2, rays: true, atmosphere: 'fair', stars: 125, scale: 1.0 }),
    'windy':            Object.freeze({ type: 'cloud', count: 0,   cloud: 18, wind: 2.2, leaves: true, rays: false, atmosphere: 'windy', stars: 125, scale: 1.2 }),
    'windy-variant':    Object.freeze({ type: 'cloud', count: 0,   cloud: 15, wind: 2.4, dark: false, leaves: true, rays: false, atmosphere: 'windy', stars: 125, scale: 1.2 }),
    'sunny':            Object.freeze({ type: 'sun',   count: 0,   cloud: 5,  wind: 0.1, rays: true, atmosphere: 'clear', stars: 0 }),
    'exceptional':      Object.freeze({ type: 'sun',   count: 0,   cloud: 0,  wind: 0.1, rays: true, atmosphere: 'exceptional', stars: 420 }),
    'default':          Object.freeze({ type: 'none',  count: 0,   cloud: 6,  wind: 0.1, rays: false, atmosphere: 'fair', stars: 260 })
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

// Performance tuning
const PERFORMANCE_CONFIG = Object.freeze({
    RESIZE_DEBOUNCE_MS: 150,
    VISIBILITY_THRESHOLD: 0.01,
    REVEAL_TRANSITION_MS: 0,
    MAX_DPR: 2.0,
    TARGET_FPS: 30,
    MAX_PIXELS: 2073600
});

// ============================================================================
// 2. CLOUD SHAPE GENERATOR
// Creates organic, randomized cloud puff layouts used by the renderer.
// ============================================================================
class CloudShapeGenerator {
    static generateOrganicPuffs(isStorm, seed) {
        const puffs = [];
        const seededRandom = this._seededRandom(seed);
        const puffCount = isStorm ? 20 : 18;
        const baseWidth = isStorm ? 110 : 105;
        const baseHeight = isStorm ? 60 : 42;

        for (let i = 0; i < puffCount; i++) {
            const angle = (i / puffCount) * Math.PI * 2 + seededRandom() * 0.5;
            const distFromCenter = seededRandom() * 0.6 + 0.2;
            const dx = Math.cos(angle) * (baseWidth / 2) * distFromCenter;
            const dy = Math.sin(angle) * (baseHeight / 2) * distFromCenter * 0.6;
            const centerDist = Math.sqrt(dx * dx + dy * dy) / (baseWidth / 2);
            const baseRad = isStorm ? 55 : 36;
            const radVariation = isStorm ? 20 : 14;
            const rad = baseRad + seededRandom() * radVariation - centerDist * 15;
            const verticalShade = 0.4 + (1 - (dy + baseHeight/2) / baseHeight) * 0.4;
            const shade = verticalShade + seededRandom() * 0.2;
            const softness = 0.3 + seededRandom() * 0.4;
            const squash = 0.75 + seededRandom() * 0.25;
            const rotation = (seededRandom() - 0.5) * 1.5;
            puffs.push({
                dx, dy,
                rad: Math.max(15, rad),
                shade: Math.min(1, shade),
                softness,
                squash,
                rotation,
                depth: seededRandom()
            });
        }

        const detailCount = isStorm ? 12 : 10;
        for (let i = 0; i < detailCount; i++) {
            const angle = seededRandom() * Math.PI * 2;
            const dist = 0.7 + seededRandom() * 0.4;
            puffs.push({
                dx: Math.cos(angle) * (baseWidth / 2) * dist,
                dy: Math.sin(angle) * (baseHeight / 2) * dist * 0.5 - 10,
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
            const angle = (i / puffCount) * Math.PI * 2 + seededRandom() * 0.8;
            const dist = 0.3 + seededRandom() * 0.5;
            puffs.push({
                dx: Math.cos(angle) * 45 * dist,
                dy: Math.sin(angle) * 25 * dist,
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
                dx: spreadX,
                dy: spreadY,
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
                dx: (seededRandom() - 0.5) * 50,
                dy: (seededRandom() - 0.5) * 15,
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
            const mainPuffCount = 14 + Math.floor(seededRandom() * 6);
            const baseWidth = 110;
            const baseHeight = 48;

            for (let i = 0; i < mainPuffCount; i++) {
                const angle = (i / mainPuffCount) * Math.PI * 2 + seededRandom() * 0.6;
                const dist = seededRandom() * 0.30 + 0.05;
                const dx = Math.cos(angle) * (baseWidth / 2) * dist;
                const dy = Math.sin(angle) * (baseHeight / 2) * dist * 0.5;
                puffs.push({
                    dx,
                    dy: dy - 5,
                    rad: 18 + seededRandom() * 16,
                    shade: 0.6 + seededRandom() * 0.35,
                    softness: 0.25 + seededRandom() * 0.25,
                    squash: 0.85 + seededRandom() * 0.15,
                    rotation: (seededRandom() - 0.5) * 0.5,
                    depth: seededRandom() * 0.6
                });
            }

            for (let i = 0; i < 7; i++) {
                const angle = Math.PI * 0.15 + seededRandom() * Math.PI * 0.7;
                puffs.push({
                    dx: Math.cos(angle) * (baseWidth / 2) * (0.3 + seededRandom() * 0.35),
                    dy: -baseHeight / 2 * (0.25 + seededRandom() * 0.45),
                    rad: 14 + seededRandom() * 12,
                    shade: 0.75 + seededRandom() * 0.25,
                    softness: 0.2 + seededRandom() * 0.2,
                    squash: 0.9,
                    rotation: (seededRandom() - 0.5) * 1.0,
                    depth: 0.7 + seededRandom() * 0.3
                });
            }

            for (let i = 0; i < 5; i++) {
                puffs.push({
                    dx: (seededRandom() - 0.5) * baseWidth * 0.7,
                    dy: baseHeight / 2 * 0.3 + seededRandom() * 5,
                    rad: 16 + seededRandom() * 12,
                    shade: 0.4 + seededRandom() * 0.2,
                    softness: 0.35 + seededRandom() * 0.25,
                    squash: 0.6 + seededRandom() * 0.2,
                    rotation: 0,
                    depth: 0.2 + seededRandom() * 0.3
                });
            }
        } else if (variety === 'stratus') {
            const puffCount = 24 + Math.floor(seededRandom() * 10);

            for (let i = 0; i < puffCount; i++) {
                const spreadX = (i - puffCount / 2) * 16 + (seededRandom() - 0.5) * 18;
                const spreadY = (seededRandom() - 0.5) * 14;
                puffs.push({
                    dx: spreadX,
                    dy: spreadY,
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
                    dx: spreadX,
                    dy: (seededRandom() - 0.5) * 6,
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
                        dx: streakX + progress * 40 * Math.cos(streakAngle),
                        dy: progress * 30 * Math.sin(streakAngle) + (seededRandom() - 0.5) * 6,
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
// 3. MAIN CARD CLASS
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
        this._rain = [];
        this._snow = [];
        this._hail = [];
        this._clouds = [];
        this._fgClouds = [];
        this._stars = [];
        this._bolts = [];
        this._fogBanks = [];
        this._leaves = [];
        this._shootingStars = [];
        this._planes = [];
        this._birds = [];
        this._comets = [];
        this._dustMotes = [];
        this._sunClouds = [];
        this._aurora = null;

        // --- Weather State ---
        this._params = WEATHER_MAP['default'];
        this._flashOpacity = 0;
        // Two independent axes:
        //   _isTimeNight → Content axis: sun below horizon → draw stars/moon
        //   _isThemeDark → Contrast axis: dark background → use glowing colors
        this._isTimeNight = false;
        this._isThemeDark = false;
        this._lastState = null;
        this._stateInitialized = false;
        this._hasReceivedFirstHass = false;

        // --- Moon Phase ---
        this._moonPhaseState = 'full_moon';
        this._moonPhaseConfig = MOON_PHASES['full_moon'];

        // --- Wind Simulation ---
        this._windGust = 0;
        this._gustPhase = 0;
        this._windSpeed = 0.1;
        this._microGustPhase = 0;

        // --- Layer Fade Trackers (kept at 1 — future animation hooks) ---
        this._layerFadeProgress = {
            stars: 1,
            clouds: 1,
            precipitation: 1,
            effects: 1
        };

        // --- Special Effects Phase Counters ---
        this._rayPhase = 0;
        this._moonAnimPhase = 0;
        this._heatShimmerPhase = 0;
        this._atmospherePhase = 0;

        // --- Lifecycle & Initialization ---
        this._initialized = false;
        this._initializationComplete = false;
        this._isVisible = false;
        this._intersectionObserver = null;

        // --- Render Gate (prevents flash of empty canvas on first load) ---
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
        this._lastInitWidth = 0; // Width at last particle init — used for resize tolerance check

        // --- DOM Text Cache (prevents DOM thrashing) ---
        this._lastTempStr = null;
        this._lastLocStr = null;

        // --- HA Entity Cache (reference equality performance shield) ---
        this._cachedWeather = null;
        this._cachedSun = null;
        this._cachedMoon = null;
        this._cachedTheme = null;
        this._cachedStatus = null;
        this._cachedTopSensor = null;
        this._cachedBotSensor = null;
        this._cachedLanguage = null;
        this._cachedSysDark = null;

        this._prevStyleSig = null;
        this._prevSunLeft = null;

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
                z-index: -1;
                overflow: hidden; background: transparent;
                display: block; transform: translateZ(0);
                will-change: transform, opacity;
                opacity: 0;
                transition: opacity ${PERFORMANCE_CONFIG.REVEAL_TRANSITION_MS}ms ease-out;
            }
            #card-root.standalone {
                z-index: 1;
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

            /* --- DYNAMIC CELESTIAL GLOW — all modes --- */
            #card-root::after {
                content: "";
                position: absolute;
                inset: 0;
                z-index: -1;
                pointer-events: none;
                background-image: radial-gradient(
                    circle var(--c-r, 30cqmax) at var(--c-x, 60%) var(--c-y, 40%),
                    rgba(var(--g-rgb, 255,240,190), 0.80) 0%,
                    rgba(var(--g-rgb, 255,240,190), 0.55) 35%,
                    rgba(var(--g-rgb, 255,240,190), 0.18) 62%,
                    rgba(var(--g-rgb, 255,240,190), 0) 100%
                );
                animation: celestialPulse 4s ease-in-out infinite;
                opacity: var(--g-op, 0);
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

            /* Day backgrounds */
            #card-root.standalone.scheme-day                      { background-image: radial-gradient(ellipse at top, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.10) 40%, transparent 70%), linear-gradient(160deg, #5CA0D3 0%, #C5E0F5 100%); }
            #card-root.standalone.scheme-day.weather-exceptional  { background-image: radial-gradient(ellipse at top, rgba(255,255,255,0.50) 0%, rgba(255,255,255,0.15) 40%, transparent 70%), linear-gradient(160deg, #4a8dbd 0%, #b3d9f2 100%) !important; }
            #card-root.standalone.scheme-day.weather-partly       { background-image: radial-gradient(ellipse at top, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.10) 45%, transparent 75%), linear-gradient(160deg, #74AEDF 0%, #DCEEFA 100%) !important; }
            #card-root.standalone.scheme-day.weather-overcast     { background-image: radial-gradient(ellipse at top, rgba(240,245,255,0.50) 0%, rgba(240,245,255,0.15) 50%, transparent 80%), linear-gradient(160deg, #ccdcf9 0%, #def6ff 100%) !important; }
            #card-root.standalone.scheme-day.weather-rainy        { background-image: radial-gradient(ellipse at top, rgba(210,225,240,0.45) 0%, rgba(210,225,240,0.10) 45%, transparent 75%), linear-gradient(160deg, #F0F6F8 0%, #B8C7D3 100%) !important; }
            #card-root.standalone.scheme-day.weather-storm        { background-image: radial-gradient(ellipse at top, rgba(180,195,210,0.40) 0%, rgba(180,195,210,0.08) 45%, transparent 75%), linear-gradient(160deg, #D8E5E0 0%, #A8C0BC 100%) !important; }
            #card-root.standalone.scheme-day.weather-snow         { background-image: radial-gradient(ellipse at top, rgba(255,255,255,0.60) 0%, rgba(255,255,255,0.20) 45%, transparent 75%), linear-gradient(160deg, #ffffff 0%, #d6e1f0 100%) !important; }
            #card-root.standalone.scheme-day.weather-fog          { background-image: radial-gradient(ellipse at top, rgba(245,250,255,0.70) 0%, rgba(245,250,255,0.25) 50%, transparent 85%), linear-gradient(160deg, #f2f4f8 0%, #f8faff 100%) !important; }
			
			/* Night backgrounds */
            #card-root.standalone.scheme-night                    { background: radial-gradient(ellipse at top, rgba(160,190,255,0.12) 0%, rgba(160,190,255,0.02) 40%, transparent 70%), linear-gradient(160deg, #000000 40%, #080c18 100%); }
            #card-root.standalone.scheme-night.weather-partly     { background: radial-gradient(ellipse at top, rgba(160,190,255,0.14) 0%, rgba(160,190,255,0.03) 45%, transparent 75%), linear-gradient(160deg, #010203 30%, #111822 100%) !important; }
            #card-root.standalone.scheme-night.weather-overcast   { background: radial-gradient(ellipse at top, rgba(140,170,220,0.18) 0%, rgba(140,170,220,0.04) 50%, transparent 80%), linear-gradient(160deg, #010203 30%, #111822 100%) !important; }
            #card-root.standalone.scheme-night.weather-rainy      { background: radial-gradient(ellipse at top, rgba(120,150,200,0.15) 0%, rgba(120,150,200,0.03) 45%, transparent 75%), linear-gradient(160deg, #020305 20%, #0d1a30 100%) !important; }
            #card-root.standalone.scheme-night.weather-storm      { background: radial-gradient(ellipse at top, rgba(100,130,180,0.12) 0%, rgba(100,130,180,0.02) 45%, transparent 75%), linear-gradient(160deg, #020305 20%, #0d1a30 100%) !important; }
            #card-root.standalone.scheme-night.weather-snow       { background: radial-gradient(ellipse at top, rgba(180,210,255,0.22) 0%, rgba(180,210,255,0.05) 45%, transparent 75%), linear-gradient(160deg, #080c11 10%, #1d2733 100%) !important; }
            #card-root.standalone.scheme-night.weather-fog        { background: radial-gradient(ellipse at top, rgba(150,170,200,0.25) 0%, rgba(150,170,200,0.06) 50%, transparent 85%), linear-gradient(160deg, #0d0f11 0%, #16191c 100%) !important; }
			
			
            #temp-text, #bottom-text {
                position: absolute; z-index: 10; pointer-events: none;
                font-family: var(--ha-font-family, var(--paper-font-body1_-_font-family, sans-serif));
                transition: color 0.3s ease; display: none;
            }
            #card-root.standalone #temp-text,
            #card-root.standalone #bottom-text { display: flex; }
            #temp-text {
                top: var(--awc-card-padding, var(--ha-space-4, 16px));
                font-size: var(--awc-top-font-size, clamp(24px, 12cqw, 52px));
                font-weight: 600; line-height: 1;
                letter-spacing: -1px; align-items: flex-start; gap: 6px;
            }
            .temp-unit { font-size: 0.5em; font-weight: 500; padding-top: 6px; opacity: 0.7; }
            #bottom-text {
                bottom: var(--awc-card-padding, var(--ha-space-4, 16px));
                font-size: var(--awc-bottom-font-size, clamp(15px, 5cqmin, 26px));
                font-weight: 500; opacity: 0.7;
                letter-spacing: 0.5px; white-space: nowrap; gap: 6px;
            }
            #bottom-text ha-icon,
            #bottom-text ha-state-icon { --mdc-icon-size: var(--awc-icon-size, 1.1em); opacity: 0.9; }
            .text-left  { left:  calc(var(--awc-card-padding, var(--ha-space-4, 16px)) + 4px); text-align: left; }
            .text-right { right: calc(var(--awc-card-padding, var(--ha-space-4, 16px)) + 4px); text-align: right; }
            #card-root.standalone.scheme-day #temp-text,
            #card-root.standalone.scheme-day #bottom-text {
                color: var(--awc-text-day, #333333);
                text-shadow: 0 1px 2px rgba(255,255,255,0.6);
            }
            #card-root.standalone.scheme-night #temp-text,
            #card-root.standalone.scheme-night #bottom-text {
                color: var(--awc-text-night, #ffffff);
                text-shadow: 0 1px 3px rgba(0,0,0,0.6);
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

        root.append(bg, mid, img, fg, tempText, bottomText);
        this.shadowRoot.append(style, root);

        this._elements = { root, bg, mid, img, fg, tempText, bottomText };

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

        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }

        if (this._intersectionObserver) {
            this._intersectionObserver.disconnect();
        }

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
        this._rain = [];
        this._snow = [];
        this._hail = [];
        this._clouds = [];
        this._fgClouds = [];
        this._stars = [];
        this._bolts = [];
        this._fogBanks = [];
        this._leaves = [];
        this._shootingStars = [];
        this._planes = [];
        this._birds = [];
        this._comets = [];
        this._dustMotes = [];
        this._sunClouds = [];
        this._aurora = null;
    }

    // ========================================================================
    // HOME ASSISTANT CARD API (setConfig, set hass, getCardSize, etc.)
    // ========================================================================
    setConfig(config) {
        this._config = config;
        this._initDOM();

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
            if (align.includes('left')) {
                img.style.left = marginVar; img.style.right = 'auto';
            } else {
                img.style.right = marginVar; img.style.left = 'auto';
            }

            if (align.includes('bottom')) {
                img.style.bottom = '0'; img.style.top = 'auto';
            } else if (align.includes('center')) {
                img.style.top = '50%'; img.style.transform = 'translateY(-50%)';
            } else {
                img.style.top = '0'; img.style.bottom = 'auto';
            }
        }

        const root = this._elements.root;
        root.classList.toggle('no-mask-v', config.css_mask_vertical === false);
        root.classList.toggle('no-mask-h', config.css_mask_horizontal === false);

        this._hasStatusFeature = !!(config.status_entity && (config.status_image_day || config.status_image_night));
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

        // 2. Performance shield — HA replaces entity objects on change, so reference
        //    equality is sufficient to bail out early when nothing has changed.
        if (this._cachedWeather === wEntity && this._cachedSun === sunEntity &&
            this._cachedMoon === moonEntity && this._cachedTheme === themeEntity &&
            this._cachedStatus === statusEntity && this._cachedTopSensor === topSensor &&
            this._cachedBotSensor === botSensor && this._cachedLanguage === lang &&
            this._cachedSysDark === sysDark) {
            return;
        }
        this._cachedWeather = wEntity;   this._cachedSun = sunEntity;
        this._cachedMoon = moonEntity;   this._cachedTheme = themeEntity;
        this._cachedStatus = statusEntity; this._cachedTopSensor = topSensor;
        this._cachedBotSensor = botSensor; this._cachedLanguage = lang;
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

        // 3. Moon phase
        if (moonEntity && moonEntity.state !== this._moonPhaseState) {
            this._moonPhaseState = moonEntity.state;
            this._moonPhaseConfig = MOON_PHASES[moonEntity.state] || MOON_PHASES['full_moon'];
        }

        // 4. Day/Night & Theme resolution — two independent axes
        //    isTimeNight = Is the sun actually below the horizon? (Content: stars vs sun)
        //    isThemeDark = Is the background dark?               (Contrast: glow vs ink)
        const isTimeNight = this._resolveTimeNight(sunEntity, themeEntity);
        const isThemeDark = this._resolveThemeDark(themeEntity, sunEntity, sysDark);
        const hasNightChanged = this._isTimeNight !== isTimeNight || this._isThemeDark !== isThemeDark;

        this._isTimeNight = isTimeNight;
        this._isThemeDark = isThemeDark;

        // 5. Weather state normalization
        let weatherState = (wEntity.state || 'default').toLowerCase();
        if (isTimeNight && weatherState === 'sunny') weatherState = 'clear-night';
        if (!isTimeNight && weatherState === 'clear-night') weatherState = 'sunny';

        let newParams = { ...(WEATHER_MAP[weatherState] || WEATHER_MAP['default']) };
        if (isTimeNight && (weatherState === 'sunny' || weatherState === 'clear-night')) {
            newParams = { ...newParams, type: 'stars', count: 280 };
        }

        // 6. UI updates
        this._updateStandaloneStyles(isTimeNight, newParams);
        this._updateTextElements(hass, wEntity, lang);

        const windSpeedRaw = this._getEntityAttribute(wEntity, 'wind_speed', 0);
        const windSpeed = typeof windSpeedRaw === 'number' ? windSpeedRaw : parseFloat(windSpeedRaw) || 0;
        this._windSpeed = Math.min(Math.max(windSpeed / 10, 0), 2);

        const imageNight = this._resolveImageNight(themeEntity, sunEntity, sysDark);
        this._updateImage(hass, imageNight);

        // 7. First load gate
        if (!this._hasReceivedFirstHass) {
            this._hasReceivedFirstHass = true;
            this._renderGate.hasFirstHass = true;
            this._lastState = weatherState;
            this._params = newParams;
            this._stateInitialized = true;
            this._tryInitialize();
            return;
        }

        // 8. Change detection → particle reboot
        this._handleWeatherChange(weatherState, newParams, hasNightChanged);
    }

    // Image axis: Original combined resolution for day/night image switching.
    // Priority: YAML forced mode → Theme Entity → Sun Entity → System Dark
    _resolveImageNight(themeEntity, sunEntity, sysDark) {
        if (this._config.mode) {
            const m = this._config.mode.toLowerCase();
            if (m === 'dark' || m === 'night') return true;
            if (m === 'light' || m === 'day') return false;
        }
        if (themeEntity && !['unavailable', 'unknown'].includes(themeEntity.state)) {
            return NIGHT_MODES.includes(themeEntity.state.toLowerCase());
        }
        if (sunEntity) {
            const state = sunEntity.state.toLowerCase();
            return state === 'below_horizon' || NIGHT_MODES.includes(state);
        }
        return !!sysDark;
    }

    // Time axis: Is the sun below the horizon?
    // Priority: YAML forced mode → Sun Entity → Theme Entity hint → fallback day
    _resolveTimeNight(sunEntity, themeEntity) {
        if (this._config.mode) {
            const m = this._config.mode.toLowerCase();
            if (m === 'night') return true;
            if (m === 'day') return false;
        }
        if (sunEntity) {
            return sunEntity.state.toLowerCase() === 'below_horizon';
        }
        if (themeEntity && !['unavailable', 'unknown'].includes(themeEntity.state)) {
            return NIGHT_MODES.includes(themeEntity.state.toLowerCase());
        }
        return false;
    }

    // Theme axis: Is the background dark?
	_resolveThemeDark(themeEntity, sunEntity, sysDark) {
		if (this._config.mode) {
			const m = this._config.mode.toLowerCase();
			if (m === 'dark') return true;
			if (m === 'light') return false;
		}
		if (themeEntity && !['unavailable', 'unknown'].includes(themeEntity.state)) {
			return NIGHT_MODES.includes(themeEntity.state.toLowerCase());
		}
		if (sunEntity) {
			const state = sunEntity.state.toLowerCase();
			return state === 'below_horizon' || NIGHT_MODES.includes(state);
		}
		return !!sysDark;
	}

    _updateStandaloneStyles(isNight, newParams) {
        const root = this._elements.root;
        const atm = newParams.atmosphere || '';
        const w = this._cachedDimensions.width / (this._cachedDimensions.dpr || 1);

        // === GLOW VARIABLES — injected for ALL modes (standalone + immersive) ===
        // In immersive, the card is transparent so the glow composites against the
        // HA dashboard background — same as the JS canvas glow does. Both work.
        // Default --g-op: 0 in CSS so nothing shows until JS fires.
        if (w > 0) {
            const celestial = this._getCelestialPosition(w);
            root.style.setProperty('--c-x', `${celestial.x}px`);
            root.style.setProperty('--c-y', `${celestial.y}px`);
        }

        if (this._isTimeNight) {
            // Moon glow — cool blue, opacity scales with moon phase and weather
            const illum = this._moonPhaseConfig?.illumination ?? 1.0;
            const weatherFactor =
                (atm === 'storm')                          ? 0.08 :
                (atm === 'rain')                           ? 0.14 :
                (atm === 'snow')                           ? 0.22 :
                (atm === 'overcast' || atm === 'windy')   ? 0.28 :
                (atm === 'mist' || atm === 'fog')         ? 0.20 :
                (atm === 'fair')                           ? 0.80 :
                1.0; // clear/exceptional/night
            const nightOp = (0.18 + illum * 0.28) * weatherFactor;
            root.style.setProperty('--g-rgb', '190, 210, 255');
            root.style.setProperty('--g-op', nightOp.toFixed(3));
        } else {
            // Sun glow — warm yellow/amber. These opacity values work WITHOUT
            // blend mode: the radial gradient inner stop is 0.90 * --g-op,
            // so sunny clear = 0.90 * 0.55 = ~50% warm tint at center.
            const dayOp =
                (atm === 'storm')                          ? 0.06 :
                (atm === 'rain')                           ? 0.10 :
                (atm === 'snow')                           ? 0.16 :
                (atm === 'mist' || atm === 'fog')         ? 0.12 :
                (atm === 'overcast' || atm === 'windy')   ? 0.18 :
                (atm === 'fair')                           ? 0.38 :
                (atm === 'clear' || atm === 'exceptional') ? 0.55 :
                0.45; // sunny default
            root.style.setProperty('--g-rgb', '255, 235, 150');
            root.style.setProperty('--g-op', dayOp.toFixed(3));
        }

        // === STANDALONE-ONLY: scheme classes, background gradients, film grain ===
        if (!this._config.card_style) {
            if (this._prevStyleSig !== null) {
                root.classList.remove(
                    'standalone', 'scheme-day', 'scheme-night',
                    'weather-overcast', 'weather-rainy', 'weather-storm',
                    'weather-snow', 'weather-partly', 'weather-fog', 'weather-exceptional'
                );
                this._prevStyleSig = null;
            }
            return;
        }

        const isDarkScheme = this._isThemeDark;
        const styleSig = `${isDarkScheme}_${this._isTimeNight}_${atm}_${this._moonPhaseState}`;
        if (this._prevStyleSig === styleSig) return;
        this._prevStyleSig = styleSig;

        root.classList.add('standalone');
        root.classList.remove(
            'weather-overcast', 'weather-rainy', 'weather-storm',
            'weather-snow', 'weather-partly', 'weather-fog', 'weather-exceptional'
        );
        root.classList.toggle('scheme-night', isDarkScheme);
        root.classList.toggle('scheme-day', !isDarkScheme);

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
        if (!this._config.card_style || !wEntity) return;
        if (!this._elements?.tempText || !this._elements?.bottomText) return;

        const showText = this._config.disable_text !== true;
        const showIcon = this._config.disable_bottom_icon !== true;
        this._elements.tempText.style.display = showText ? '' : 'none';
        this._elements.bottomText.style.display = showText ? '' : 'none';

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

        // Cache string signature — skip DOM write if nothing changed
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
        // Guard: only format numeric strings — prevents NaN for sensor.date/sensor.time
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

        const sunPos = parseInt(this._config.sun_moon_x_position, 10);
        const isSunLeft = !isNaN(sunPos) ? sunPos >= 0 : true;
        if (this._prevSunLeft !== isSunLeft) {
            this._prevSunLeft = isSunLeft;
            const add = isSunLeft ? 'text-right' : 'text-left';
            const remove = isSunLeft ? 'text-left' : 'text-right';
            this._elements.tempText.classList.remove(remove);
            this._elements.tempText.classList.add(add);
            this._elements.bottomText.classList.remove(remove);
            this._elements.bottomText.classList.add(add);
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
            if (this.isConnected) {
                setTimeout(() => {
                    this._initParticles();
                    if (this._width > 0) this._lastInitWidth = this._width;
                    this._startAnimation();
                }, 0);
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

    _getCelestialPosition(w) {
        const result = { x: 100, y: 100 };
        if (this._config.sun_moon_x_position !== undefined) {
            const posX = parseInt(this._config.sun_moon_x_position, 10);
            if (!isNaN(posX)) {
                result.x = posX >= 0 ? posX : w + posX;
            }
        }
        if (this._config.sun_moon_y_position !== undefined) {
            const posY = parseInt(this._config.sun_moon_y_position, 10);
            if (!isNaN(posY)) {
                result.y = posY;
            }
        }
        return result;
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

        // Mobile scroll lag fix: if width is stable and height changed < 150px
        // (URL bar hide/show), skip the resize — let CSS stretch the canvas.
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
            const celestial = this._getCelestialPosition(cssW);
            
            const glowRadius = cssH * 0.75;
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

        if (p.rays && !this._isNight && this._isLightBackground) {
            this._initSunClouds(w, h);
        }

        const starCount = (this._isTimeNight && this._isThemeDark) ? (p.stars || 0) : 0;
        if (starCount > 0) {
            this._initStars(w, h, starCount);
        }

        if (p.leaves) {
            this._initLeaves(w, h);
        }

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
                offset: Math.random() * Math.PI * 2
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
                phase: Math.random() * Math.PI * 2
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
                turbulence: Math.random() * Math.PI * 2,
                _fadeIn: 1
            };

            if (type === 'hail') {
                Object.assign(particle, {
                    speedY: (12 + Math.random() * 8) * z,
                    size: (2 + Math.random() * 2) * z,
                    rotation: Math.random() * Math.PI * 2,
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
                const flakeSize = (1.5 + Math.random() * 2.5) * z;
                Object.assign(particle, {
                    speedY: (0.4 + Math.random() * 0.8) * z * (flakeSize / 3),
                    size: flakeSize,
                    wobblePhase: Math.random() * Math.PI * 2,
                    wobbleSpeed: 0.02 + Math.random() * 0.02,
                    rotation: Math.random() * Math.PI * 2,
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
        const heightLimit = isStandalone ? 0.75 : 0.5;
        const totalClouds = p.cloud || 0;
        if (totalClouds <= 0) return;

        const fillerCount = Math.floor(totalClouds * 0.15);
        for (let i = 0; i < fillerCount; i++) {
            const seed = Math.random() * 10000;
            const useStratus = i % 2 === 0;
            const puffs = useStratus
                ? CloudShapeGenerator.generateMixedPuffs(seed, 'stratus')
                : CloudShapeGenerator.generateMixedPuffs(seed, 'cumulus');
            this._clouds.push({
                x: Math.random() * w,
                y: Math.random() * (h * heightLimit * 0.6),
                scale: useStratus ? (0.35 + Math.random() * 0.25) : (0.3 + Math.random() * 0.2),
                speed: 0.002 + Math.random() * 0.002,
                puffs,
                cloudType: useStratus ? 'stratus' : 'cumulus',
                layer: 0,
                opacity: 0.4 + Math.random() * 0.2,
                seed,
                breathPhase: Math.random() * Math.PI * 2,
                breathSpeed: 0.001,
                flashIntensity: 0,
                flashOriginX: 0,
                flashOriginY: 0
            });
        }

        const mainCount = totalClouds - fillerCount;
        const configScale = p.scale || 1.0;
        const isStorm = p.dark;

        for (let i = 0; i < mainCount; i++) {
            const layer = 1 + (i % 4);
            const seed = Math.random() * 10000;

            let puffs;
            let type;

            if (isStorm) {
                type = 'storm';
                puffs = CloudShapeGenerator.generateOrganicPuffs(true, seed);
            } else {
                // Atmosphere-aware cloud type distribution
                let types;
                if (p.atmosphere === 'fair' || p.atmosphere === 'clear') {
                    types = [
                        'cumulus', 'cumulus', 'cumulus', 'cumulus',
                        'organic', 'organic', 'organic',
                        'stratus', 'stratus', 'stratus'
                    ];
                } else if (p.atmosphere === 'overcast' || p.atmosphere === 'cloudy') {
                    types = [
                        'organic', 'organic', 'organic', 'organic',
                        'cumulus', 'cumulus', 'cumulus', 'cumulus',
                        'stratus', 'stratus'
                    ];
                } else if (p.atmosphere === 'windy') {
                    types = [
                        'stratus', 'stratus', 'stratus', 'stratus',
                        'organic', 'organic', 'organic',
                        'cumulus', 'cumulus', 'cumulus'
                    ];
                } else {
                    types = [
                        'organic', 'organic', 'organic',
                        'cumulus', 'cumulus', 'cumulus', 'cumulus',
                        'stratus', 'stratus', 'stratus'
                    ];
                }

                type = types[Math.floor(Math.random() * types.length)];

                if (type === 'stratus') {
                    puffs = CloudShapeGenerator.generateMixedPuffs(seed, 'stratus');
                } else if (type === 'organic') {
                    puffs = CloudShapeGenerator.generateOrganicPuffs(false, seed);
                } else {
                    puffs = CloudShapeGenerator.generateMixedPuffs(seed, 'cumulus');
                }
            }

            let scaleX = 1.0;
            let scaleY = 1.0;
            let radiusMod = 1.0;

            if (type === 'stratus') {
                scaleX = 1.98 + Math.random() * 0.9;
                scaleY = 0.525 + Math.random() * 0.26;
                radiusMod = 0.55;
            } else if (type === 'organic' || type === 'storm') {
                scaleX = 0.855 + Math.random() * 0.18;
                scaleY = 0.945 + Math.random() * 0.21;
                radiusMod = 1.0;
            } else {
                scaleX = 0.9 + Math.random() * 0.27;
                scaleY = 0.84 + Math.random() * 0.315;
                radiusMod = 0.9;
            }

            if (puffs) {
                for (let k = 0; k < puffs.length; k++) {
                    puffs[k].dx *= scaleX;
                    puffs[k].dy *= scaleY;
                    puffs[k].rad *= radiusMod;
                }
            }

            let cloudScale;
            const sizeRoll = Math.random();
            if (sizeRoll < 0.20) {
                cloudScale = (1.1 + Math.random() * 0.35) * configScale;
            } else if (sizeRoll < 0.65) {
                cloudScale = (0.7 + Math.random() * 0.35) * configScale;
            } else {
                cloudScale = (0.45 + Math.random() * 0.25) * configScale;
            }

            let yPos;
            if (type === 'stratus') {
                yPos = h * 0.05 + Math.random() * (h * 0.35);
            } else if (type === 'cumulus') {
                yPos = h * 0.10 + Math.random() * (h * (heightLimit - 0.10));
            } else {
                yPos = h * 0.08 + Math.random() * (h * (heightLimit - 0.05));
            }

            this._clouds.push({
                x: Math.random() * w,
                y: yPos,
                scale: cloudScale,
                speed: (0.02 + Math.random() * 0.03) * (layer * 0.4 + 1),
                puffs,
                cloudType: type,
                layer,
                opacity: 1 - (layer * 0.08),
                seed,
                breathPhase: Math.random() * Math.PI * 2,
                breathSpeed: 0.002 + Math.random() * 0.004,
                flashIntensity: 0,
                flashOriginX: 0,
                flashOriginY: 0
            });
        }

        this._clouds.sort((a, b) => a.layer - b.layer);

        if (totalClouds > 0) {
            const scudCount = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < scudCount; i++) {
                const seed = Math.random() * 10000;
                const puffs = CloudShapeGenerator.generateMixedPuffs(seed, 'cumulus');
                this._fgClouds.push({
                    x: Math.random() * w,
                    y: Math.random() * (h * heightLimit) - 40,
                    scale: 0.7 + Math.random() * 0.3,
                    speed: 0.1 + Math.random() * 0.06,
                    puffs,
                    cloudType: 'scud',
                    layer: 5,
                    opacity: 0.65,
                    seed,
                    breathPhase: Math.random() * Math.PI * 2,
                    breathSpeed: 0.004,
                    flashIntensity: 0,
                    flashOriginX: 0,
                    flashOriginY: 0
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
                opacity: 0.35, // Boosted from 0.12 so the 3D shading actually has room to render
                seed,
                breathPhase: Math.random() * Math.PI * 2,
                breathSpeed: 0.002,
                flashIntensity: 0,
                flashOriginX: 0,
                flashOriginY: 0
            });
        }
    }

    _initSunClouds(w, h) {
        const celestial = this._getCelestialPosition(w);
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
                breathPhase: Math.random() * Math.PI * 2,
                breathSpeed: 0.003,
                baseX: sunX + spreadX,
                baseY: sunY + spreadY,
                driftPhase: Math.random() * Math.PI * 2
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
                breathPhase: Math.random() * Math.PI * 2,
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
                breathPhase: Math.random() * Math.PI * 2,
                breathSpeed: 0.002,
                baseX: sunX + (Math.random() - 0.5) * 90,
                baseY: sunY - 25 - Math.random() * 25,
                driftPhase: Math.random() * Math.PI * 2
            });
        }
    }

    _initStars(w, h, count) {
        const tier1Count = Math.floor(count * 0.70);
        const tier2Count = Math.floor(count * 0.285);

        for (let i = 0; i < count; i++) {
            const isCluster = Math.random() < 0.3;
            let x = Math.random() * w;
            let y = Math.random() * h * 0.85;

            if (isCluster) {
                x += (Math.random() - 0.5) * 90;
                y += (Math.random() - 0.5) * 60;
            }

            let tier;
            if (i < tier1Count) tier = 'bg';
            else if (i < tier1Count + tier2Count) tier = 'mid';
            else tier = 'hero';

            let size, brightness, twinkleSpeed;

            if (tier === 'bg') {
                size = 1.2 + Math.random() * 0.4;
                brightness = 0.35 + Math.random() * 0.2;
                twinkleSpeed = 0.04 + Math.random() * 0.04;
            } else if (tier === 'mid') {
                size = 1.8 + Math.random() * 0.6;
                brightness = 0.6 + Math.random() * 0.25;
                twinkleSpeed = 0.02 + Math.random() * 0.02;
            } else {
                size = 2.2 + Math.random() * 0.8;
                brightness = 0.85 + Math.random() * 0.15;
                twinkleSpeed = 0.005 + Math.random() * 0.01;
            }

            const k = Math.random();
            let hColor, sColor, lColor;
            if (k < 0.3) {
                hColor = 215; sColor = 30; lColor = 88;
            } else if (k > 0.85) {
                hColor = 35; sColor = 35; lColor = 85;
            } else {
                hColor = 200; sColor = 5; lColor = 95;
            }

            this._stars.push({
                x, y,
                baseSize: size,
                phase: Math.random() * Math.PI * 2,
                rate: twinkleSpeed,
                brightness,
                tier,
                hsl: { h: hColor, s: sColor, l: lColor }
            });
        }
    }

    _initLeaves(w, h, count = 35) {
        for (let i = 0; i < count; i++) {
            this._leaves.push({
                x: Math.random() * w,
                y: Math.random() * h,
                rotation: Math.random() * Math.PI * 2,
                spinSpeed: (Math.random() - 0.5) * 0.12,
                size: 3 + Math.random() * 4,
                color: `hsl(${15 + Math.random() * 45}, ${55 + Math.random() * 25}%, ${35 + Math.random() * 25}%)`,
                wobblePhase: Math.random() * Math.PI * 2,
                z: 0.6 + Math.random() * 0.8
            });
        }
    }

    _initDustMotes(w, h) {
        if (!this._shouldShowSun()) return;
        const celestial = this._getCelestialPosition(w);
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
                phase: Math.random() * Math.PI * 2,
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

        while (curY < h && iter < 80) {
            const nextY = curY + 15 + Math.random() * 25;
            const nextX = curX + (Math.random() * 50 - 25);
            segments.push({ x: curX, y: curY, nx: nextX, ny: nextY, branch: false });
            if (Math.random() < 0.25 && curY > 20) {
                const branchDir = Math.random() > 0.5 ? 1 : -1;
                const branchLen = 20 + Math.random() * 40;
                segments.push({
                    x: curX,
                    y: curY,
                    nx: curX + branchDir * branchLen,
                    ny: curY + branchLen * 0.7,
                    branch: true
                });
            }
            curX = nextX;
            curY = nextY;
            iter++;
        }

        return { segments, alpha: 1.0, glow: 1.0 };
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

            for (let j = 0; j < len; j++) {
                const puff = puffs[j];
                const baseOp = cloud.opacity * puff.shade * fadeOpacity;
                const grad = ctx.createRadialGradient(
                    puff.dx - puff.rad * 0.35, puff.dy - puff.rad * 0.45, 0,
                    puff.dx, puff.dy, puff.rad
                );
                grad.addColorStop(0, `rgba(255, 255, 250, ${baseOp})`);
                grad.addColorStop(0.3, `rgba(255, 245, 225, ${baseOp * 0.9})`);
                grad.addColorStop(0.6, `rgba(250, 235, 200, ${baseOp * 0.75})`);
                grad.addColorStop(0.85, `rgba(240, 220, 180, ${baseOp * 0.5})`);
                grad.addColorStop(1, `rgba(235, 210, 160, 0)`);
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(puff.dx, puff.dy, puff.rad, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    _drawSunGlow(ctx, w, h) {
        const fadeOpacity = this._layerFadeProgress.effects;
        const celestial = this._getCelestialPosition(w);
        const centerX = celestial.x;
        const centerY = celestial.y;

        ctx.save();

        if (!this._isLightBackground) {
            const pulse = Math.sin(this._rayPhase * 0.4) * 0.02 + 0.98;
            const sunRadius = 25 * pulse;
            ctx.globalCompositeOperation = 'source-over';

            ctx.beginPath();
            ctx.arc(centerX, centerY, sunRadius + 5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 180, 40, ${0.12 * fadeOpacity})`;
            ctx.fill();

            const bodyGrad = ctx.createRadialGradient(
                centerX - sunRadius * 0.35, centerY - sunRadius * 0.35, 0,
                centerX, centerY, sunRadius
            );
            bodyGrad.addColorStop(0.0, `rgba(255, 255, 220, ${1.0 * fadeOpacity})`);
            bodyGrad.addColorStop(0.4, `rgba(255, 210, 60,  ${1.0 * fadeOpacity})`);
            bodyGrad.addColorStop(1.0, `rgba(255, 130, 0,   ${1.0 * fadeOpacity})`);

            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.arc(centerX, centerY, sunRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.lineWidth = 1.5;
            ctx.strokeStyle = `rgba(255, 230, 180, ${0.6 * fadeOpacity})`;
            ctx.stroke();

            ctx.restore();
            return;
        }

        const glowBreath = 1 + Math.sin(this._rayPhase * 0.3) * 0.025;
        const pulse = Math.sin(this._rayPhase * 0.4) * 0.04 + 0.96;
        const sunRadius = 26 * pulse; // Match dark-bg sun size as reference

        // Sky haze is now handled entirely by the CSS ::after pseudo-element
        // (--g-rgb / --g-op injected from _updateStandaloneStyles) for ALL modes.
        // Sun disc — source-over, locatable warm body with soft edge.
        const discGrad = ctx.createRadialGradient(
            centerX - sunRadius * 0.20, centerY - sunRadius * 0.22, 0,
            centerX, centerY, sunRadius * 2.2
        );
        discGrad.addColorStop(0.00, `rgba(255, 255, 238, ${0.95 * fadeOpacity})`);
        discGrad.addColorStop(0.28, `rgba(255, 245, 185, ${0.88 * fadeOpacity})`);
        discGrad.addColorStop(0.45, `rgba(255, 218, 100, ${0.65 * fadeOpacity})`);
        discGrad.addColorStop(0.68, `rgba(255, 185, 48,  ${0.22 * fadeOpacity})`);
        discGrad.addColorStop(1.00, 'rgba(255, 160, 30, 0)');
        ctx.fillStyle = discGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, sunRadius * 2.2, 0, Math.PI * 2);
        ctx.fill();

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
        const celestial = this._getCelestialPosition(w);

        ctx.save();

        if (this._isThemeDark) {
            ctx.globalCompositeOperation = 'source-over';
            const pulse = Math.sin(this._rayPhase * 0.4) * 0.02 + 0.98;
            const sunRadius = 25 * pulse;

            ctx.beginPath();
            ctx.arc(celestial.x, celestial.y, sunRadius + 5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 180, 40, ${0.12 * fadeOpacity})`;
            ctx.fill();

            const g = ctx.createRadialGradient(
                celestial.x - sunRadius * 0.35, celestial.y - sunRadius * 0.35, 0,
                celestial.x, celestial.y, sunRadius
            );
            g.addColorStop(0.0, `rgba(255, 255, 220, ${1.0 * fadeOpacity})`);
            g.addColorStop(0.4, `rgba(255, 210, 60,  ${1.0 * fadeOpacity})`);
            g.addColorStop(1.0, `rgba(255, 130, 0,   ${1.0 * fadeOpacity})`);

            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(celestial.x, celestial.y, sunRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.lineWidth = 1.5;
            ctx.strokeStyle = `rgba(255, 230, 180, ${0.6 * fadeOpacity})`;
            ctx.stroke();

            ctx.restore();
            return;
        }

        ctx.globalCompositeOperation = 'overlay';
        const isMoon = this._isNight;
        const c1 = isMoon ? '240, 245, 255' : '255, 255, 240';
        const c2 = isMoon ? '220, 230, 250' : '255, 245, 210';
        const c3 = isMoon ? '210, 220, 240' : '255, 245, 220';
        const cCore = isMoon ? '200, 220, 255' : '255, 220, 100';

        const g = ctx.createRadialGradient(celestial.x, celestial.y, 0, celestial.x, celestial.y, 140);
        g.addColorStop(0,   `rgba(${c1}, ${0.7 * fadeOpacity})`);
        g.addColorStop(0.4, `rgba(${c2}, ${0.4 * fadeOpacity})`);
        g.addColorStop(1,   `rgba(${c3}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(celestial.x, celestial.y, 140, 0, Math.PI * 2);
        ctx.fill();

        const core = ctx.createRadialGradient(celestial.x, celestial.y, 0, celestial.x, celestial.y, 45);
        core.addColorStop(0, `rgba(${cCore}, ${0.35 * fadeOpacity})`);
        core.addColorStop(1, `rgba(${c1}, 0)`);
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(celestial.x, celestial.y, 45, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    _drawClouds(ctx, cloudList, w, h, effectiveWind, globalOpacity) {
        if (cloudList.length === 0) return;
        const fadeOpacity = this._layerFadeProgress.clouds;
        if (fadeOpacity <= 0) return;

        const isStormy = this._params?.thunder ||
            this._params?.type === 'lightning' ||
            this._params?.type === 'lightning-rainy' ||
            this._params?.type === 'pouring';

        if (isStormy && cloudList.length > 0 && Math.random() < 0.03) {
            const candidates = cloudList.filter(c => c.layer >= 1 && c.puffs && c.puffs.length > 5);
            const pool = candidates.length > 0 ? candidates : cloudList;
            const target = pool[Math.floor(Math.random() * pool.length)];
            target.flashIntensity = 1.0;
            if (target.puffs && target.puffs.length > 0) {
                const originPuff = target.puffs[Math.floor(Math.random() * target.puffs.length)];
                target.flashOriginX = originPuff.dx;
                target.flashOriginY = originPuff.dy;
            }
        }

        let flashLitR, flashLitG, flashLitB;
        let flashMidR, flashMidG, flashMidB;
        let flashShadowR, flashShadowG, flashShadowB;

        if (this._isThemeDark) {
            flashLitR = 180; flashLitG = 200; flashLitB = 255;
            flashMidR = 120; flashMidG = 145; flashMidB = 220;
            flashShadowR = 60; flashShadowG = 75; flashShadowB = 160;
        } else {
            flashLitR = 255; flashLitG = 250; flashLitB = 255;
            flashMidR = 240; flashMidG = 238; flashMidB = 250;
            flashShadowR = 210; flashShadowG = 215; flashShadowB = 235;
        }

        let litR, litG, litB;
        let midR, midG, midB;
        let shadowR, shadowG, shadowB;
        let ambient;
        let highlightOffsetBase;
        let hOffset;

        if (this._isThemeDark && this._isTimeNight) {
            litR=195; litG=208; litB=225;
            midR=32;  midG=42;  midB=65;
            shadowR=8;  shadowG=14; shadowB=26;
            ambient=0.75;
            highlightOffsetBase = 0.45;
            hOffset = 0.02;
        } else if (this._isThemeDark && !this._isTimeNight && (this._params?.dark || this._params?.thunder || ['lightning', 'lightning-rainy', 'pouring', 'rainy', 'hail', 'snowy', 'snowy-rainy'].includes(this._params?.type))) {
            litR=110; litG=118; litB=135;
            midR=38;  midG=43;  midB=58;
            shadowR=12; shadowG=15; shadowB=22;
            ambient=0.85;
            highlightOffsetBase = 0.50;
            hOffset = 0.05;
        } else if (this._isThemeDark && !this._isTimeNight) {
            // Day clouds on dark/black background.
            // Mid must be substantially darker than lit to create visible 3D puff shaping.
            // mid=168 (too close to lit=228) produced a flat bright blob. mid=125 gives
            // real center-to-edge contrast without creating dark rings on opaque puffs.
            litR=228; litG=238; litB=255;
            midR=125; midG=138; midB=172;
            shadowR=24; shadowG=29; shadowB=48;
            ambient=0.82;
            highlightOffsetBase = 0.55;
            hOffset = 0.05;
        } else if (this._params?.dark || ['rain', 'hail', 'fog', 'lightning', 'lightning-rainy', 'pouring', 'rainy', 'snowy-rainy'].includes(this._params?.type) || this._params?.foggy) {
            if (this._isLightBackground) {
                const isStorm = this._params?.thunder || ['lightning', 'lightning-rainy', 'pouring'].includes(this._params?.type);
                if (isStorm) {
                    const dim = 0.88;
                    litR = 255 * dim; litG = 255 * dim; litB = 255 * dim;
                    midR = 205 * dim; midG = 215 * dim; midB = 230 * dim;
                    shadowR = 145 * dim; shadowG = 155 * dim; shadowB = 175 * dim;
                    ambient = 0.88;
                } else {
                    litR = 255; litG = 255; litB = 255;
                    midR = 210; midG = 218; midB = 228;
                    shadowR = 155; shadowG = 166; shadowB = 190;
                    ambient = 1.0;
                }
            } else {
                const stormDarken = this._params?.thunder ? 10 : 0;
                litR=145 - stormDarken; litG=158 - stormDarken; litB=182 - stormDarken;
                midR=70 - stormDarken; midG=80 - stormDarken; midB=100 - stormDarken;
                shadowR=20 - stormDarken; shadowG=25 - stormDarken; shadowB=35 - stormDarken;
                ambient=0.90;
            }
            highlightOffsetBase = 0.75;
            hOffset = 0.15;
        } else if (this._isLightBackground) {
            const isFairWeather = this._params?.atmosphere === 'fair' || this._params?.atmosphere === 'clear';
            litR = 255; litG = 255; litB = 255;
            if (isFairWeather) {
                midR = 230; midG = 236; midB = 242;
                shadowR = 180; shadowG = 190; shadowB = 210;
            } else {
                midR = 210; midG = 218; midB = 228;
                shadowR = 163; shadowG = 175; shadowB = 200;
            }
            ambient = 1.0;
            highlightOffsetBase = 0.75;
            hOffset = 0.15;
        }

        for (let i = 0; i < cloudList.length; i++) {
            const cloud = cloudList[i];

            // Sheet lightning: decay each cloud's flash intensity per frame
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
            ctx.translate(cloud.x, cloud.y - (h * 0.1));
            const vScale = this._params?.dark ? 0.40 : 0.55;
            ctx.scale(cloud.scale * breathScale, cloud.scale * vScale * breathScale);

            const puffs = cloud.puffs;
            const len = puffs.length;
            const layerHighlightOffset = (cloud.layer === 5 && !this._isThemeDark) ? 0.50 : highlightOffsetBase;

            let maxPuffDist = 1;
            if (hasFlash) {
                for (let j = 0; j < len; j++) {
                    const pdx = puffs[j].dx - cloud.flashOriginX;
                    const pdy = puffs[j].dy - cloud.flashOriginY;
                    const d = Math.sqrt(pdx * pdx + pdy * pdy);
                    if (d > maxPuffDist) maxPuffDist = d;
                }
            }

            for (let j = 0; j < len; j++) {
                const puff = puffs[j];
                const flowSpeed = cloud.breathPhase * 0.7;
                const noiseX = Math.sin(flowSpeed + j * 0.5) * (puff.rad * 0.1);
                const noiseY = Math.cos(flowSpeed * 0.8 + j * 0.3) * (puff.rad * 0.05);
                const drawX = puff.dx + noiseX;
                const drawY = puff.dy + noiseY;
                const normalizedY = (puff.dy + 50) / 100;
                const shadeFactor = Math.max(0.3, 1 - normalizedY * 0.5);
                const invShade = 1 - shadeFactor;

                let r = (litR * shadeFactor + shadowR * invShade) | 0;
                let g = (litG * shadeFactor + shadowG * invShade) | 0;
                let b = (litB * shadeFactor + shadowB * invShade) | 0;

                let useMidR = midR;
                let useMidG = midG;
                let useMidB = midB;
                let useShadowR = shadowR;
                let useShadowG = shadowG;
                let useShadowB = shadowB;

                let puffAmbientBoost = 1.0;

                if (hasFlash) {
                    const pdx = puff.dx - cloud.flashOriginX;
                    const pdy = puff.dy - cloud.flashOriginY;
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

                let finalOpacity = (globalOpacity * cloud.opacity * ambient * fadeOpacity * puffAmbientBoost) * puff.shade;

                let dR=r, dG=g, dB=b;
                let dMidR=useMidR, dMidG=useMidG, dMidB=useMidB;
                let dShadR=useShadowR, dShadG=useShadowG, dShadB=useShadowB;

                if (this._isThemeDark && finalOpacity < 0.20) {
                    if (this._isTimeNight) {
                        // Night clouds: dim-and-boost preserves soft moonlit haze depth.
                        finalOpacity = Math.min(1.0, finalOpacity * 2.5);
                        const dim = 0.40;
                        dR *= dim; dG *= dim; dB *= dim;
                        dMidR *= dim; dMidG *= dim; dMidB *= dim;
                        dShadR *= dim; dShadG *= dim; dShadB *= dim;
                    } else {
                        // Day-dark: Remove the hard clip. Use a smooth quadratic fade to 
                        // eliminate dark rings while preserving the soft, 3D bubbly edges.
                        finalOpacity = finalOpacity * (finalOpacity / 0.20); 
                    }
                }
                

                // Stratus on dark background: the architecture (24-34 tiny puffs spread
                // 800px+ wide) always looks like a flat smear on black. Draw at very low
                // opacity so it reads as a faint background haze, not a dominant bright band.
                if (this._isThemeDark && !this._isTimeNight && cloud.cloudType === 'stratus') {
                    finalOpacity *= 0.28;
                    if (finalOpacity < 0.005) continue;
                }

                if (finalOpacity < 0.005) continue;

                const grad = ctx.createRadialGradient(
                    drawX - puff.rad * hOffset,
                    drawY - puff.rad * layerHighlightOffset,
                    0,
                    drawX,
                    drawY,
                    puff.rad
                );

                grad.addColorStop(0, `rgba(${dR|0}, ${dG|0}, ${dB|0}, ${finalOpacity})`);
                grad.addColorStop(0.40, `rgba(${dMidR|0}, ${dMidG|0}, ${dMidB|0}, ${finalOpacity * 0.85})`);
                if (this._isLightBackground) {
                    // Light bg: wide soft fade — transparent edge blends into sky invisibly
                    grad.addColorStop(1.0, `rgba(${dShadR|0}, ${dShadG|0}, ${dShadB|0}, 0)`);
                } else {
                    // Dark bg: hold opacity until 0.68, cut to 0 by 0.88 — tighter edge,
                    // less visible glow-halo on the black background
                    grad.addColorStop(0.68, `rgba(${dShadR|0}, ${dShadG|0}, ${dShadB|0}, ${finalOpacity * 0.25})`);
                    grad.addColorStop(0.88, `rgba(${dShadR|0}, ${dShadG|0}, ${dShadB|0}, 0)`);
                }
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(drawX, drawY, puff.rad, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    _drawRain(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.precipitation;
        if (fadeOpacity <= 0) return;

        const isDay = this._isLightBackground;
        const rC = isDay ? 85 : 210;
        const gC = isDay ? 95 : 225;
        const bC = isDay ? 110 : 255;
        const rgbBase = `${rC}, ${gC}, ${bC}`;
        const len = this._rain.length;

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

            const depthStretch = 0.5 + (pt.z * 1.0);
            const stretch = (1.0 + (this._windSpeed * 0.5)) * depthStretch * 0.7;
            const tailX = pt.x - (moveX * stretch);
            const tailY = pt.y - (moveY * stretch);
            const baseOp = isDay ? 0.75 : 0.60;
            const finalOp = (pt.z * baseOp) * fadeOpacity * pt.op;

            if (finalOp < 0.02) continue;

            const width = Math.max(0.8, pt.z * 1.4);
            const grad = ctx.createLinearGradient(tailX, tailY, pt.x, pt.y);
            grad.addColorStop(0, `rgba(${rgbBase}, 0)`);
            grad.addColorStop(0.5, `rgba(${rgbBase}, ${finalOp * 0.4})`);
            grad.addColorStop(0.9, `rgba(${rgbBase}, ${finalOp})`);
            grad.addColorStop(1, `rgba(255, 255, 255, ${finalOp})`);

            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.strokeStyle = grad;
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(pt.x, pt.y);
            ctx.stroke();
        }
    }

    _drawSnow(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.precipitation;
        if (fadeOpacity <= 0) return;
        const len = this._snow.length;

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

            const glimmer = 0.8 + Math.sin(pt.wobblePhase * 3) * 0.2;
            const finalOpacity = pt.op * fadeOpacity * glimmer;

            if (pt.z > 0.7) {
                // Large foreground flake — soft glow disc.
                // On light bg: tighter radius so white is concentrated and visible
                // rather than diffuse (a small crisp white dot reads better than a large faint blob).
                const glowR = this._isLightBackground ? pt.size * 0.95 : pt.size * 1.5;
                const innerOp = this._isLightBackground ? finalOpacity * 1.1 : finalOpacity;
                const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, glowR);
                g.addColorStop(0,   `rgba(255, 255, 255, ${Math.min(1, innerOp)})`);
                g.addColorStop(0.5, `rgba(255, 255, 255, ${innerOp * 0.55})`);
                g.addColorStop(1,   `rgba(255, 255, 255, 0)`);
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, glowR, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Small background flake — solid disc, slightly boosted opacity on light bg
                const smallOp = this._isLightBackground ? finalOpacity * 1.15 : finalOpacity * 0.8;
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, smallOp)})`;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    _drawHail(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.precipitation;
        if (fadeOpacity <= 0) return;
        const len = this._hail.length;

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

            const depthOpacity = (pt.z > 1.1 ? pt.op * 1.1 : pt.op * 0.75) * fadeOpacity;
            const iceGradient = ctx.createRadialGradient(0, -pt.size * 0.3, 0, 0, 0, pt.size);

            if (this._isLightBackground) {
                iceGradient.addColorStop(0, `rgba(240, 250, 255, ${depthOpacity})`);
                iceGradient.addColorStop(0.5, `rgba(210, 230, 250, ${depthOpacity * 0.85})`);
                iceGradient.addColorStop(1, `rgba(170, 200, 240, ${depthOpacity * 0.5})`);
            } else {
                iceGradient.addColorStop(0, `rgba(255, 255, 255, ${depthOpacity})`);
                iceGradient.addColorStop(0.5, `rgba(230, 245, 255, ${depthOpacity * 0.85})`);
                iceGradient.addColorStop(1, `rgba(200, 225, 250, ${depthOpacity * 0.5})`);
            }

            ctx.fillStyle = iceGradient;
            ctx.beginPath();
            for (let j = 0; j < 6; j++) {
                const angle = (Math.PI * 2 * j) / 6;
                const x = Math.cos(angle) * pt.size;
                const y = Math.sin(angle) * pt.size;
                if (j === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();

            if (pt.z > 1.05) {
                ctx.fillStyle = `rgba(255, 255, 255, ${depthOpacity * 0.4})`;
                ctx.beginPath();
                ctx.arc(-pt.size * 0.3, -pt.size * 0.3, pt.size * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    _drawLightning(ctx, w, h) {
        if (!this._params?.thunder) return;
        const fadeOpacity = this._layerFadeProgress.effects;

        if (Math.random() < 0.007 && this._bolts.length < LIMITS.MAX_BOLTS) {
            this._flashOpacity = 0.4;
            this._bolts.push(this._createBolt(w, h));
        }

        if (this._flashOpacity > 0) {
            ctx.save();
            ctx.globalCompositeOperation = this._isThemeDark ? 'screen' : 'source-over';
            const flashColor = this._isLightBackground
                ? `rgba(200, 210, 230, ${this._flashOpacity * fadeOpacity * 0.3})`
                : `rgba(220, 235, 255, ${this._flashOpacity * fadeOpacity})`;
            ctx.fillStyle = flashColor;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
            this._flashOpacity *= 0.78;
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
            const g = ctx.createLinearGradient(0, wave.y - 20, 0, wave.y + 50);
            g.addColorStop(0, 'rgba(0, 0, 0, 0)');
            g.addColorStop(0.3, wave.color);
            g.addColorStop(0.6, wave.color.replace(/[\d.]+\)$/, '0.1)'));
            g.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = g;
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

            let color;
            let opModifier = 1.0;

            if (this._isLightBackground) {
                color = '190, 200, 215';
                opModifier = 0.60;
            } else {
                color = this._isTimeNight
                    ? '85, 90, 105'
                    : '72, 81, 95';
            }

            const layerOpacity = f.opacity * (1 + f.layer * 0.2) * fadeOpacity * opModifier;

            ctx.save();
            const vSquash = 0.1 + f.layer * 0.18;
            ctx.scale(1, vSquash);
            const drawY = (f.y + undulation) / vSquash;

            const g = ctx.createRadialGradient(f.x, drawY, 0, f.x, drawY, f.w / 2);
            g.addColorStop(0, `rgba(${color}, ${layerOpacity})`);
            g.addColorStop(0.5, `rgba(${color}, ${layerOpacity * 0.6})`);
            g.addColorStop(1, `rgba(${color}, 0)`);

            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(f.x, drawY, f.w / 2, f.h, 0, 0, Math.PI * 2);
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
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();

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
        const p = this._params;
        const badWeather = ['rain', 'hail', 'lightning', 'pouring', 'snowy', 'snowy-rainy'].includes(p.type);

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
            c.tail.unshift({ x: c.x, y: c.y });

            if (c.tail.length > 2) {
                const head = c.tail[0];
                const tip = c.tail[c.tail.length - 1];
                const currentDist = Math.sqrt((head.x - tip.x)**2 + (head.y - tip.y)**2);
                if (currentDist > 170) c.tail.pop();
            }

            const opacity = Math.min(1, c.life) * fadeOpacity;
            const isInkMode = !this._isThemeDark;

            const headGrad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.size * 4);
            if (isInkMode) {
                headGrad.addColorStop(0, `rgba(50, 60, 75, ${opacity})`);
                headGrad.addColorStop(0.4, `rgba(70, 85, 105, ${opacity * 0.4})`);
                headGrad.addColorStop(1, 'rgba(70, 85, 105, 0)');
            } else {
                headGrad.addColorStop(0, `rgba(220, 240, 255, ${opacity})`);
                headGrad.addColorStop(0.4, `rgba(100, 200, 255, ${opacity * 0.4})`);
                headGrad.addColorStop(1, 'rgba(100, 200, 255, 0)');
            }

            ctx.fillStyle = headGrad;
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.size * 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.lineCap = 'round';

            for (let j = 0; j < c.tail.length - 1; j++) {
                const p1 = c.tail[j];
                const p2 = c.tail[j + 1];
                const progress = j / c.tail.length;
                ctx.lineWidth = c.size * (1 - progress * 0.8);
                const tailOp = opacity * (1 - progress) * 0.6;
                ctx.strokeStyle = isInkMode
                    ? `rgba(65, 80, 100, ${tailOp})`
                    : `rgba(160, 210, 255, ${tailOp})`;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    _drawPlanes(ctx, w, h) {
        const p = this._params;
        const badWeather = ['rain', 'hail', 'lightning', 'pouring', 'snowy', 'fog'].includes(p.type);

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
                const trailColor = this._isThemeDark ? "210, 220, 240" : "255, 255, 255";
                const head = plane.history[0];
                const tail = plane.history[plane.history.length - 1];
                const grad = ctx.createLinearGradient(head.x, head.y, tail.x, tail.y);
                grad.addColorStop(0, `rgba(${trailColor}, 0)`);
                grad.addColorStop(0.05, `rgba(${trailColor}, ${baseOp})`);
                grad.addColorStop(0.6, `rgba(${trailColor}, ${baseOp * 0.6})`);
                grad.addColorStop(1, `rgba(${trailColor}, 0)`);

                ctx.strokeStyle = grad;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.lineWidth = 3 * plane.scale;

                [3, -3].forEach(offset => {
                    ctx.beginPath();
                    let isDrawing = false;
                    for (let k = 0; k < plane.history.length; k++) {
                        const pt = plane.history[k];
                        if (pt.gap) { isDrawing = false; continue; }
                        const oX = sinA * offset * plane.scale * dir;
                        const oY = cosA * offset * plane.scale;
                        const drawX = pt.x + oX;
                        const drawY = pt.y + oY;
                        if (!isDrawing) { ctx.moveTo(drawX, drawY); isDrawing = true; }
                        else ctx.lineTo(drawX, drawY);
                    }
                    ctx.stroke();
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

            ctx.beginPath();
            ctx.moveTo(6 * dir, 0);
            ctx.lineTo(-6 * dir, 0);
            ctx.moveTo(-5 * dir, 0);
            ctx.lineTo(-8 * dir, -4);
            ctx.moveTo(1 * dir, 0);
            ctx.lineTo(-2 * dir, 2);
            ctx.stroke();

            plane.blinkPhase += 0.12;
            if (Math.sin(plane.blinkPhase) > 0.8) {
                const strobeColor = plane.vx > 0 ? "50, 255, 80" : "255, 50, 50";
                ctx.fillStyle = `rgba(${strobeColor}, 0.9)`;
                ctx.beginPath();
                ctx.arc(0, 1, 1.5, 0, Math.PI * 2);
                ctx.fill();
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
        const isSevereWeather = p.thunder || p.type === 'hail' || p.type === 'pouring';

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

    _drawLeaves(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.effects;
        if (fadeOpacity <= 0) return;

        for (let i = 0; i < this._leaves.length; i++) {
            const leaf = this._leaves[i];
            leaf.wobblePhase += 0.04;
            const wobble = Math.sin(leaf.wobblePhase) * 0.5;
            leaf.y += (1 + Math.sin(leaf.wobblePhase * 0.5) * 0.5) * (1 + this._windSpeed * 0.4) * leaf.z;
            leaf.x += (effectiveWind * 2 + wobble) * leaf.z;
            leaf.rotation += leaf.spinSpeed * (1 + this._windSpeed * 0.25);

            if (leaf.y > h + 15) {
                leaf.y = -15 - (Math.random() * 20);
                leaf.x = Math.random() * w;
            }
            if (leaf.x > w + 15) leaf.x = -15;
            if (leaf.x < -15) leaf.x = w + 15;

            ctx.save();
            ctx.translate(leaf.x, leaf.y);
            ctx.rotate(leaf.rotation);
            ctx.globalAlpha = (0.7 + leaf.z * 0.3) * fadeOpacity;
            ctx.fillStyle = leaf.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, leaf.size * 0.6, leaf.size * 1.6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(0, -leaf.size * 1.4);
            ctx.lineTo(0, leaf.size * 1.4);
            ctx.stroke();
            ctx.restore();
        }
    }

    _drawDustMotes(ctx, w, h) {
        if (!this._shouldShowSun()) return;
        const fadeOpacity = this._layerFadeProgress.effects;

        ctx.save();
        ctx.globalCompositeOperation = this._isThemeDark ? 'lighter' : 'source-over';

        const len = this._dustMotes.length;
        // Dark bg: near-white warm cream catches the eye as tiny light sparks (lighter composited).
        // Light bg: warm white — sunlit atmospheric particles against bright sky.
        //   Near-white so they're visible but not a distracting gold color.
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
            ctx.beginPath();
            ctx.arc(mote.x, mote.y, mote.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    _drawMoon(ctx, w, h) {
        if (!this._isTimeNight) return;
        if (!this._stateInitialized || !this._renderGate.isRevealed) return;

        const cloudCover = this._params?.cloud || 0;
        const moonVisibility = cloudCover > 30 ? 0.4 : cloudCover > 20 ? 0.6 : cloudCover > 10 ? 0.8 : 1;
        const fadeOpacity = this._layerFadeProgress.stars * moonVisibility;
        if (fadeOpacity <= 0.05) return;

        this._moonAnimPhase += 0.003;

        const celestial = this._getCelestialPosition(w);
        const moonX = celestial.x;
        const moonY = celestial.y;
        const moonRadius = 18;
        // Cap glow radius so it never overflows the card even at small heights (e.g. 110px).
        // Use the smaller of w/h so a portrait card doesn't spill sideways either.
        const glowRadius = Math.min(h, w) * 0.48;

        // _drawMoon only runs when _isTimeNight is true, so isDayMoon is always false here.
        // useLightColors: any light theme (including forced light at night).
        // Governs ALL disc, shadow and crater colors so the moon reads against a light background.
        const useLightColors = !this._isThemeDark;

        ctx.save();

        const glowIntensity = 0.23 + this._moonPhaseConfig.illumination * 0.18;
        const effectiveGlow = glowIntensity * fadeOpacity * moonVisibility;

        if (useLightColors) {
            // Light bg: source-over blue-periwinkle halo. screen is invisible on white.
            // Needs strong opacity since it competes against an already light background.
            ctx.globalCompositeOperation = 'source-over';
            const lightGlowR = Math.min(h, w) * 0.42;
            const dmGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, lightGlowR);
            dmGlow.addColorStop(0,    `rgba(140, 175, 255, ${effectiveGlow * 0.85})`);
            dmGlow.addColorStop(0.35, `rgba(155, 190, 255, ${effectiveGlow * 0.45})`);
            dmGlow.addColorStop(0.65, `rgba(175, 205, 255, ${effectiveGlow * 0.16})`);
            dmGlow.addColorStop(1,    'rgba(200, 220, 255, 0)');
            ctx.fillStyle = dmGlow;
            ctx.beginPath();
            ctx.arc(moonX, moonY, lightGlowR, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Dark background: large screen-blend blue corona.
            ctx.globalCompositeOperation = 'screen';
            const glowGrad = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, glowRadius);
            glowGrad.addColorStop(0,   `rgba(180, 200, 255, ${effectiveGlow})`);
            glowGrad.addColorStop(0.5, `rgba(165, 195, 245, ${effectiveGlow * 0.4})`);
            glowGrad.addColorStop(1,   'rgba(150, 180, 220, 0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(moonX, moonY, glowRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalCompositeOperation = 'source-over';

        // destination-out punch: only on dark theme, creates crisp disc edge for screen-blend glow.
        if (!useLightColors && this._moonPhaseConfig.illumination > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(moonX, moonY, moonRadius - 0.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 1)';
            ctx.fill();
            ctx.restore();
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
        ctx.clip();

        const illumination = this._moonPhaseConfig.illumination;
        const direction = this._moonPhaseConfig.direction;

        if (illumination <= 0) {
            if (useLightColors) {
                ctx.fillStyle = `rgba(200, 210, 225, ${0.20 * fadeOpacity})`;
                ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2); ctx.fill();
            } else {
                ctx.fillStyle = `rgba(40, 45, 55, ${0.8 * fadeOpacity})`;
                ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = `rgba(80, 90, 110, ${0.15 * fadeOpacity})`;
                ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2); ctx.fill();
            }
        } else if (illumination >= 1) {
            const moonGrad = ctx.createRadialGradient(
                moonX - moonRadius * 0.3, moonY - moonRadius * 0.3, 0,
                moonX, moonY, moonRadius
            );
            if (useLightColors) {
                moonGrad.addColorStop(0,   `rgba(255, 255, 255, ${0.85 * fadeOpacity})`);
                moonGrad.addColorStop(0.5, `rgba(238, 242, 250, ${0.78 * fadeOpacity})`);
                moonGrad.addColorStop(1,   `rgba(210, 220, 238, ${0.65 * fadeOpacity})`);
            } else {
                moonGrad.addColorStop(0,   `rgba(255, 255, 250, ${0.95 * fadeOpacity})`);
                moonGrad.addColorStop(0.7, `rgba(230, 235, 245, ${0.9  * fadeOpacity})`);
                moonGrad.addColorStop(1,   `rgba(200, 210, 230, ${0.85 * fadeOpacity})`);
            }
            ctx.fillStyle = moonGrad;
            ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2); ctx.fill();
        } else {
            // Shadow/dark side of disc
            if (useLightColors) {
                ctx.fillStyle = `rgba(175, 188, 208, ${0.55 * fadeOpacity})`;
            } else {
                ctx.fillStyle = `rgba(35, 40, 50, ${0.9 * fadeOpacity})`;
            }
            ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2); ctx.fill();

            if (!useLightColors) {
                const earthshineOp = (1 - illumination) * 0.08 * fadeOpacity;
                ctx.fillStyle = `rgba(100, 115, 145, ${earthshineOp})`;
                ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2); ctx.fill();
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

            const moonGrad = ctx.createRadialGradient(
                moonX - moonRadius * 0.2, moonY - moonRadius * 0.2, 0,
                moonX, moonY, moonRadius
            );
            if (useLightColors) {
                moonGrad.addColorStop(0,   `rgba(255, 255, 255, ${0.82 * fadeOpacity})`);
                moonGrad.addColorStop(0.6, `rgba(240, 244, 252, ${0.72 * fadeOpacity})`);
                moonGrad.addColorStop(1,   `rgba(218, 228, 242, ${0.58 * fadeOpacity})`);
            } else {
                moonGrad.addColorStop(0,   `rgba(255, 255, 250, ${0.95 * fadeOpacity})`);
                moonGrad.addColorStop(0.6, `rgba(235, 240, 248, ${0.9  * fadeOpacity})`);
                moonGrad.addColorStop(1,   `rgba(210, 220, 235, ${0.85 * fadeOpacity})`);
            }
            ctx.fillStyle = moonGrad;
            ctx.fill();
        }

        ctx.restore();

        // Craters
        if (illumination > 0.05) {
            const op = fadeOpacity * Math.min(1, illumination * 4.0);
            if (useLightColors) {
                ctx.fillStyle = `rgba(180, 190, 210, ${0.12 * op})`;
                ctx.beginPath(); ctx.ellipse(moonX - 9, moonY + 2, 7, 9, 0.2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(moonX + 8, moonY - 6, 6, 4, -0.3, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(moonX - 2, moonY + 10, 5, 3, 0.1, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = `rgba(170, 180, 200, ${0.16 * op})`;
                ctx.beginPath(); ctx.ellipse(moonX - 9, moonY + 2, 4, 6, 0.2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(moonX + 8, moonY - 6, 3, 2, -0.3, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(moonX - 2, moonY + 10, 2.5, 1.5, 0.1, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = `rgba(175, 185, 205, ${0.10 * op})`;
                ctx.beginPath(); ctx.arc(moonX + 6, moonY + 5, 1.2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(moonX - 5, moonY - 8, 1.0, 0, Math.PI * 2); ctx.fill();
            } else {
                ctx.fillStyle = `rgba(30, 35, 50, ${0.13 * op})`;
                ctx.beginPath(); ctx.ellipse(moonX - 9, moonY + 2, 7, 9, 0.2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(moonX + 8, moonY - 6, 6, 4, -0.3, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(moonX - 2, moonY + 10, 5, 3, 0.1, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = `rgba(25, 30, 45, ${0.22 * op})`;
                ctx.beginPath(); ctx.ellipse(moonX - 9, moonY + 2, 4, 6, 0.2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(moonX + 8, moonY - 6, 3, 2, -0.3, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(moonX - 2, moonY + 10, 2.5, 1.5, 0.1, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = `rgba(25, 30, 45, ${0.13 * op})`;
                ctx.beginPath(); ctx.arc(moonX + 6, moonY + 5, 1.2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(moonX - 5, moonY - 8, 1.0, 0, Math.PI * 2); ctx.fill();
            }
        }

        ctx.restore();
    }

    _drawHeatShimmer(ctx, w, h) {
        if (!this._shouldShowSun() || this._isNight) return;
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

        // FPS Throttle: cap to TARGET_FPS regardless of display refresh rate
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

        this._rayPhase += 0.008;
        this._atmospherePhase += 0.005;
        const cloudGlobalOp = this._isThemeDark ? 0.64 : 0.85;

        // ---- BACKGROUND LAYER ----
        if (this._shouldShowSun()) {
            this._drawSunGlow(bg, w, h);
        }
        // Sky haze for all weather states is handled by CSS ::after (--g-rgb/--g-op)
        // for both standalone and immersive modes.

        this._drawAurora(mid, w, h);

        // Stars — isInkMode: dark dots on light bg rather than glowing on dark
        const starFade = this._layerFadeProgress.stars;
        const isInkMode = !this._isThemeDark;

        if (starFade > 0.01) {
            const len = this._stars.length;

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

                let dynamicColor;
                if (isInkMode) {
                    const inkLight = 25 + (twinkleVal * 3);
                    const inkSat = 8 + (twinkleVal * 2);
                    dynamicColor = `hsla(220, ${inkSat}%, ${inkLight}%,`;
                } else {
                    const shift = twinkleVal * 5;
                    const dynamicHue = s.hsl.h + shift;
                    const dynamicLight = s.hsl.l + (twinkleVal * 2);
                    dynamicColor = `hsla(${dynamicHue}, ${s.hsl.s}%, ${dynamicLight}%,`;
                }

                if (s.tier === 'hero') {
                    bg.save();

                    if (isInkMode) {
                        bg.globalCompositeOperation = 'source-over';
                        bg.fillStyle = `${dynamicColor} ${finalOpacity * 0.9})`;
                        bg.beginPath();
                        bg.arc(s.x, s.y, currentSize * 0.7, 0, Math.PI * 2);
                        bg.fill();

                        const haloGrad = bg.createRadialGradient(s.x, s.y, currentSize * 0.7, s.x, s.y, currentSize * 2.0);
                        haloGrad.addColorStop(0, `${dynamicColor} ${finalOpacity * 0.15})`);
                        haloGrad.addColorStop(1, `${dynamicColor} 0)`);
                        bg.fillStyle = haloGrad;
                        bg.beginPath();
                        bg.arc(s.x, s.y, currentSize * 2.0, 0, Math.PI * 2);
                        bg.fill();
                    } else {
                        bg.globalCompositeOperation = 'lighter';
                        bg.fillStyle = `${dynamicColor} ${finalOpacity})`;
                        bg.beginPath();
                        bg.arc(s.x, s.y, currentSize * 0.6, 0, Math.PI * 2);
                        bg.fill();

                        const grad = bg.createRadialGradient(s.x, s.y, currentSize * 0.6, s.x, s.y, currentSize * 3.0);
                        grad.addColorStop(0, `${dynamicColor} ${finalOpacity * 0.25})`);
                        grad.addColorStop(1, `${dynamicColor} 0)`);
                        bg.fillStyle = grad;
                        bg.beginPath();
                        bg.arc(s.x, s.y, currentSize * 3.0, 0, Math.PI * 2);
                        bg.fill();

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
                    }

                    bg.restore();
                } else {
                    bg.fillStyle = `${dynamicColor} ${finalOpacity})`;
                    bg.beginPath();
                    bg.arc(s.x, s.y, currentSize * (isInkMode ? 0.6 : 0.5), 0, Math.PI * 2);
                    bg.fill();
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

        // Sun clouds drawn before main clouds so rays bleed through them
        if (this._sunClouds.length > 0) {
            this._drawSunClouds(mid, w, h, effectiveWind);
        }

        // Dark theme cloudy-sun drawn on bg (behind all clouds)
        if (this._shouldShowCloudySun()) {
            if (this._isThemeDark) {
                this._drawCloudySun(bg, w, h);
            }
        }

        this._drawClouds(mid, this._clouds, w, h, effectiveWind, cloudGlobalOp);

        // Light theme cloudy-sun drawn on mid (diffuse glow through cloud layer)
        if (this._shouldShowCloudySun() && !this._isThemeDark) {
            this._drawCloudySun(mid, w, h);
        }

        // Draw order: bg clouds → birds → scud clouds (birds inside the sky volume)
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

        if (this._leaves.length > 0) {
            this._drawLeaves(fg, w, h, effectiveWind);
        }

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

