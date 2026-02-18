/**
 * ATMOSPHERIC WEATHER CARD
 * Version: 2.2
 * A custom Home Assistant card that renders animated weather effects.
 */

console.info(
    "%c ATMOSPHERIC WEATHER CARD ",
    "color: white; font-weight: 700; background: linear-gradient(90deg, #355C7D 0%, #6C5B7B 50%, #C06C84 100%); padding: 6px 12px; border-radius: 6px; font-family: sans-serif; letter-spacing: 0.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);"
);


// ============================================================================
// #region 1. CONSTANTS & CONFIGURATION
// ============================================================================

// List of states that indicate "Night Mode"
const NIGHT_MODES = Object.freeze([
    'dark', 'night', 'evening', 'on', 'true', 'below_horizon'
]);

// States that trigger the "Status" image (e.g., Status Image Day/Night)
const ACTIVE_STATES = Object.freeze([
    'on', 'true', 'open', 'unlocked', 'home', 'active'
]);

// FALLBACK: Used when no weather entity is provided or found
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
 *
 * Key properties explained:
 *   type       — The primary particle system to activate ('rain', 'snow', 'cloud', 'stars', etc.).
 *                Used by _initParticles and draw methods to decide WHAT to render.
 *   atmosphere — The visual "mood" of the scene ('storm', 'overcast', 'clear', 'fair', etc.).
 *                Used by standalone mode CSS backgrounds and dust mote logic.
 *   (raw state)— The original HA weather state string (e.g. 'cloudy', 'partlycloudy').
 *                Stored in this._lastState. Used by _shouldShowSun / _shouldShowCloudySun
 *                to decide if the sun/moon body is visible.
 *
 * Other properties:
 *   count  — Number of precipitation particles
 *   cloud  — Number of cloud objects to generate
 *   wind   — Base wind speed multiplier
 *   rays   — Whether to draw sun rays
 *   dark   — Storm darkening flag (affects cloud colors)
 *   thunder— Enables lightning bolt spawning
 *   foggy  — Enables fog bank layer
 *   leaves — Enables leaf particle system
 *   stars  — Number of star particles (night only)
 *   scale  — Cloud scale multiplier
 */
const WEATHER_MAP = Object.freeze({
    'clear-night':      Object.freeze({ type: 'stars', count: 280, cloud: 4,  wind: 0.1, rays: false, atmosphere: 'night', stars: 420 }), 
    'cloudy':           Object.freeze({ type: 'cloud', count: 0,   cloud: 24, wind: 0.3, dark: false, rays: false, atmosphere: 'overcast', stars: 120, scale: 1.2 }),
    'fog':              Object.freeze({ type: 'fog',   count: 0,   cloud: 18, wind: 0.2, rays: false, atmosphere: 'mist', foggy: true, stars: 125, scale: 1.5 }), 
    'hail':             Object.freeze({ type: 'hail',  count: 150, cloud: 18, wind: 0.8, dark: true, rays: false, atmosphere: 'storm', stars: 50, scale: 1.3 }),
    'lightning':        Object.freeze({ type: 'rain',  count: 200, cloud: 18, wind: 2.0, thunder: true, dark: true, rays: false, atmosphere: 'storm', stars: 20, scale: 1.0 }), 
    'lightning-rainy':  Object.freeze({ type: 'rain',  count: 150, cloud: 14, wind: 2.0, thunder: true, dark: true, rays: false, atmosphere: 'storm', stars: 20, scale: 1.0 }),
    'pouring':          Object.freeze({ type: 'rain',  count: 220, cloud: 16, wind: 0.3, dark: true, rays: false, atmosphere: 'storm', stars: 40, scale: 1.2 }),
    'rainy':            Object.freeze({ type: 'rain',  count: 120, cloud: 22, wind: 0.6, rays: false, atmosphere: 'rain', stars: 60, scale: 1.3 }),
    'snowy':            Object.freeze({ type: 'snow',  count: 50, cloud: 20, wind: 0.3, rays: false, atmosphere: 'snow', stars: 60, scale: 1.3 }),
    'snowy-rainy':      Object.freeze({ type: 'mix',   count: 100, cloud: 18, wind: 0.4, rays: false, atmosphere: 'snow', stars: 125, scale: 1.3 }),
    'partlycloudy':     Object.freeze({ type: 'cloud', count: 0,   cloud: 15, wind: 0.2, rays: true, atmosphere: 'fair', stars: 125, scale: 1.0 }),
    'windy':            Object.freeze({ type: 'cloud', count: 0,   cloud: 18, wind: 2.2, leaves: true, rays: false, atmosphere: 'windy', stars: 125, scale: 1.2 }),
    'windy-variant':    Object.freeze({ type: 'cloud', count: 0,   cloud: 15, wind: 2.4, dark: false, leaves: true, rays: false, atmosphere: 'windy', stars: 125, scale: 1.2 }),
    'sunny':            Object.freeze({ type: 'sun',   count: 0,   cloud: 1,  wind: 0.1, rays: true, atmosphere: 'clear', stars: 0 }),
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

// Performance configuration
const PERFORMANCE_CONFIG = Object.freeze({
    RESIZE_DEBOUNCE_MS: 150,        // Debounce delay for particle reinitialization
    VISIBILITY_THRESHOLD: 0.01,     // IntersectionObserver threshold (1% visible)
    REVEAL_TRANSITION_MS: 0,      // Fade-in duration after initialization
    MAX_DPR: 2.0,                   // PERFORMANCE OPTIMIZED: Lower DPR
    TARGET_FPS: 30                  // Target 30fps instead of 60/120fps
});

// #endregion



// ============================================================================
// CLOUD SHAPE GENERATOR - Creates organic, realistic cloud shapes
// ============================================================================
class CloudShapeGenerator {
    static generateOrganicPuffs(isStorm, seed) {
        const puffs = [];
        const seededRandom = this._seededRandom(seed);

        // Storm clouds: big, dense, menacing
        // Fair-weather clouds: tighter core, more defined edges
        const puffCount = isStorm ? 20 : 18;
        const baseWidth = isStorm ? 110 : 105; 
        const baseHeight = isStorm ? 60 : 42;
        
        // Create main body puffs with organic distribution
        for (let i = 0; i < puffCount; i++) {
            const angle = (i / puffCount) * Math.PI * 2 + seededRandom() * 0.5;
            const distFromCenter = seededRandom() * 0.6 + 0.2;
            
            // Elliptical distribution
            const dx = Math.cos(angle) * (baseWidth / 2) * distFromCenter;
            const dy = Math.sin(angle) * (baseHeight / 2) * distFromCenter * 0.6;
            
            // Vary radius based on position
            const centerDist = Math.sqrt(dx * dx + dy * dy) / (baseWidth / 2);
            const baseRad = isStorm ? 55 : 36;
            const radVariation = isStorm ? 20 : 14;
            const rad = baseRad + seededRandom() * radVariation - centerDist * 15;
            
            // Shade varies by vertical position
            const verticalShade = 0.4 + (1 - (dy + baseHeight/2) / baseHeight) * 0.4;
            const shade = verticalShade + seededRandom() * 0.2;
            
            const softness = 0.3 + seededRandom() * 0.4;
            
            // --- ORGANIC PROPS ---
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
        
        // Add detail puffs at edges for definition
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
    
    // Generate smaller, wispy clouds for sun/moon decoration
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
    
    // Generate light, fluffy sun-enhancement clouds
    static generateSunEnhancementPuffs(seed) {
        const puffs = [];
        const seededRandom = this._seededRandom(seed);
        const puffCount = 5 + Math.floor(seededRandom() * 3);
        
        // Create a horizontal spread of small puffy clouds
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
        
        // Add a few smaller accent puffs
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
    
    // Generate mixed variety clouds (combines puffy cumulus with wispy elements)
    static generateMixedPuffs(seed, variety = 'cumulus') {
        const puffs = [];
        const seededRandom = this._seededRandom(seed);
        
        if (variety === 'cumulus') {
            // Puffy, cotton-ball like clouds — tighter core for better definition
            const mainPuffCount = 14 + Math.floor(seededRandom() * 6);
            const baseWidth = 110;
            const baseHeight = 48;
            
            // Central dense area
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
            
            // Puffy top billows — more of them for a rounder top silhouette
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
            
            // Flatter base
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
            // Stratus: thin horizontal layers, but with enough body to be visible
            const puffCount = 24 + Math.floor(seededRandom() * 10); 
            
            for (let i = 0; i < puffCount; i++) {
                // Horizontal spread
                const spreadX = (i - puffCount / 2) * 16 + (seededRandom() - 0.5) * 18;
                
                // Vertical body — enough to be visible, not just a line
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
            
            // Central density band — overlapping puffs in the middle for a defined core
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
            // Wispy, high-altitude clouds
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


// #endregion
// ============================================================================
// #region 3. MAIN CARD CLASS
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
        this._frameCount = 0;
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
        this._isTimeNight = false;      // Content: sun below horizon → draw stars/moon
        this._isThemeDark = false;      // Contrast: dark background → use light/glowing colors
        this._lastState = null;
        this._stateInitialized = false;
        this._hasReceivedFirstHass = false;
        this._cloudsSorted = false;

        // --- Moon Phase ---
        this._moonPhaseState = 'full_moon';
        this._moonPhaseConfig = MOON_PHASES['full_moon'];

        // --- Wind Simulation ---
        this._windGust = 0;
        this._gustPhase = 0;
        this._windSpeed = 0.1;
        this._microGustPhase = 0;

        // --- Layer Fade (simple fade trackers, keep opacity at 1) ---
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

        // --- Render Gate (prevents flash of empty canvas) ---
        this._renderGate = {
            hasValidDimensions: false,
            hasFirstHass: false,
            isRevealed: false
        };

        // --- Resize Handling ---
        this._canvasBuffersReleased = false;
        this._resizeDebounceTimer = null;
        this._lastResizeTime = 0;
        this._pendingResize = false;
        this._cachedDimensions = { width: 0, height: 0, dpr: 1 };
        this._lastInitWidth = 0; // Width we last generated particles for (prevents "jump")

        // --- DOM Text Cache (prevents DOM thrashing) ---
        this._lastTempStr = null;
        this._lastLocStr = null;

        // --- HA Entity Cache (reference equality for performance shield) ---
        this._cachedWeather = null;
        this._cachedSun = null;
        this._cachedMoon = null;
        this._cachedTheme = null;
        this._cachedStatus = null;
        this._cachedTopSensor = null;
        this._cachedBotSensor = null;
        this._cachedLanguage = null;
        this._cachedSysDark = null;

        // --- Style Cache ---
        this._prevStyleSig = null;
        this._prevSunLeft = null;

        // --- Error Tracking ---
        this._entityErrors = new Map();
        this._lastErrorLog = 0;

        // --- Event Handlers ---
        this._boundVisibilityChange = this._handleVisibilityChange.bind(this);
        this._boundTap = this._handleTap.bind(this);
    }

    // ========================================================================
    // 3.1 DOM & STYLES
    // ========================================================================

    // Convenience getters — derived from the two primary axes above.
    // Using getters eliminates the sync-assignment in set hass.
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
                z-index: -1; /* Immersive mode: pulls behind other cards */
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

            /* Canvas layers with edge-fade masks */
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

            /* Standalone card chrome */
            #card-root.standalone {
                box-shadow: var(--ha-card-box-shadow, 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12));
                border: none; background-color: transparent;
                overflow: hidden; transition: background 0.5s ease;
            }
            #card-root.standalone canvas,
            #card-root.no-mask canvas {
                -webkit-mask-image: none !important; mask-image: none !important;
            }

            /* Day backgrounds */
            #card-root.standalone.scheme-day                      { background: linear-gradient(160deg, #5CA0D3 0%, #C5E0F5 100%); }
            #card-root.standalone.scheme-day.weather-exceptional  { background: linear-gradient(160deg, #4a8dbd 0%, #b3d9f2 100%) !important; }
            #card-root.standalone.scheme-day.weather-partly       { background: linear-gradient(160deg, #8ABCE4 0%, #E6F2FA 100%) !important; }
            #card-root.standalone.scheme-day.weather-overcast     { background: linear-gradient(160deg, #ccdcf9 0%, #def6ff 100%) !important; }
            #card-root.standalone.scheme-day.weather-rainy        { background: linear-gradient(160deg, #E6EFF3 0%, #ACBDCA 100%) !important; }
            #card-root.standalone.scheme-day.weather-storm        { background: linear-gradient(160deg, #D3E0DC 0%, #9BB4B2 100%) !important; }
            #card-root.standalone.scheme-day.weather-snow         { background: linear-gradient(160deg, #ffffff 0%, #d6e1f0 100%) !important; }
            #card-root.standalone.scheme-day.weather-fog          { background: linear-gradient(160deg, #f2f4f8 0%, #f8faff 100%) !important; }

            /* Night backgrounds */
            #card-root.standalone.scheme-night                    { background: linear-gradient(160deg, #000000 40%, #080c18 100%); }
            #card-root.standalone.scheme-night.weather-partly     { background: linear-gradient(160deg, #010203 30%, #111822 100%) !important; }
            #card-root.standalone.scheme-night.weather-overcast   { background: linear-gradient(160deg, #010203 30%, #111822 100%) !important; }
            #card-root.standalone.scheme-night.weather-rainy      { background: linear-gradient(160deg, #020305 20%, #0d1a30 100%) !important; }
            #card-root.standalone.scheme-night.weather-storm      { background: linear-gradient(160deg, #020305 20%, #0d1a30 100%) !important; }
            #card-root.standalone.scheme-night.weather-snow       { background: linear-gradient(160deg, #080c11 10%, #1d2733 100%) !important; }
            #card-root.standalone.scheme-night.weather-fog        { background: linear-gradient(160deg, #0d0f11 0%, #16191c 100%) !important; }

            /* Text overlays (standalone only) */
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
        // Set up ResizeObserver with debounced handling
        if (!this._resizeObserver) {
            this._resizeObserver = new ResizeObserver((entries) => {
                if (!entries.length) return;
                
                // Full-width layout note:
                // We DO NOT use entry.contentRect (w/h) here. 
                // contentRect excludes padding/margins which are essential for the 
                // full-width negative margin hack. 
                // By calling this with NO arguments, we force it to use getBoundingClientRect()
                const changed = this._updateCanvasDimensions(); 
                
                // First-time initialization
                if (!this._initializationComplete) {
                    this._tryInitialize();
                }
                // Subsequent resizes
                else if (changed) {
                    this._scheduleParticleReinit();
                }
            });
        }
        
        // Set up IntersectionObserver for visibility-based animation control
        if (!this._intersectionObserver) {
            this._intersectionObserver = new IntersectionObserver(
                this._boundVisibilityChange,
                {
                    threshold: PERFORMANCE_CONFIG.VISIBILITY_THRESHOLD,
                    // Use root margin to start animation slightly before visible
                    rootMargin: '50px'
                }
            );
        }
        
        if (this._elements?.root) {
            this._resizeObserver.observe(this._elements.root);
            this.addEventListener('click', this._boundTap);
            this._intersectionObserver.observe(this._elements.root);
        }

        // Restore particles when reconnecting after navigation
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
        
        // Clear debounce timer
        if (this._resizeDebounceTimer) {
            clearTimeout(this._resizeDebounceTimer);
            this._resizeDebounceTimer = null;
        }
        
        // Reset visibility state
        this._isVisible = false;
        this.removeEventListener('click', this._boundTap);
        
        // Clear all arrays
        this._clearAllParticles();
        
        // Reset initialization so particles rebuild on reconnect
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
    // HOME ASSISTANT API (setConfig, set hass, getCardSize, etc.)
    // ========================================================================
    setConfig(config) {
        this._config = config;

        // 1. Build DOM (only runs once)
        this._initDOM();

        // 2. Card dimensions
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

        // 3. Image configuration
        if (this._elements?.img) {
            const img = this._elements.img;
            const scale = config.image_scale !== undefined ? config.image_scale : 100;
            img.style.height = `${scale}%`;

            const align = (config.image_alignment || 'top-right').toLowerCase();

            // Reset positioning for clean state
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

        // 4. CSS mask settings
        const root = this._elements.root;
        root.classList.toggle('no-mask-v', config.css_mask_vertical === false);
        root.classList.toggle('no-mask-h', config.css_mask_horizontal === false);
        
        

        // 5. Entity shortcuts
        this._sunEntity = config.sun_entity;
        this._hasStatusFeature = !!(config.status_entity && (config.status_image_day || config.status_image_night));
    }

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

        // 2. Performance shield — skip if nothing changed (HA replaces objects on change)
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
		
		// --- FULL WIDTH LOGIC ---
        const useFullWidth = this._config.full_width === true;
        if (this._elements?.root) {
            if (useFullWidth && !this._elements.root.classList.contains('full-width')) {
                this._elements.root.classList.add('full-width');
            } else if (!useFullWidth && this._elements.root.classList.contains('full-width')) {
                this._elements.root.classList.remove('full-width');
            }
        }

        if (!wEntity) return;

        // 4. Moon phase
        if (moonEntity && moonEntity.state !== this._moonPhaseState) {
            this._moonPhaseState = moonEntity.state;
            this._moonPhaseConfig = MOON_PHASES[moonEntity.state] || MOON_PHASES['full_moon'];
        }

        // 5. Day/Night & Theme resolution — SPLIT into two independent axes
        //    isTimeNight = Is the sun actually below the horizon? (Content: stars vs sun)
        //    isThemeDark = Is the background dark?               (Contrast: glow vs ink)
        const isTimeNight = this._resolveTimeNight(sunEntity, themeEntity);
        const isThemeDark = this._resolveThemeDark(themeEntity, sunEntity, sysDark);
        const hasNightChanged = this._isTimeNight !== isTimeNight || this._isThemeDark !== isThemeDark;
        
        this._isTimeNight = isTimeNight;
        this._isThemeDark = isThemeDark;

        // 6. Weather parameters
        let weatherState = (wEntity.state || 'default').toLowerCase();
        if (isTimeNight && weatherState === 'sunny') weatherState = 'clear-night';
        if (!isTimeNight && weatherState === 'clear-night') weatherState = 'sunny';

        let newParams = { ...(WEATHER_MAP[weatherState] || WEATHER_MAP['default']) };
        if (isTimeNight && (weatherState === 'sunny' || weatherState === 'clear-night')) {
            newParams = { ...newParams, type: 'stars', count: 280 };
        }

        // 7. Standalone CSS classes
        this._updateStandaloneStyles(isTimeNight, newParams);

        // 8. Text overlays (standalone only)
        this._updateTextElements(hass, wEntity, lang);

        // 9. Wind
        const windSpeedRaw = this._getEntityAttribute(wEntity, 'wind_speed', 0);
        const windSpeed = typeof windSpeedRaw === 'number' ? windSpeedRaw : parseFloat(windSpeedRaw) || 0;
        this._windSpeed = Math.min(Math.max(windSpeed / 10, 0), 2);

        // 10. Image
        const imageNight = this._resolveImageNight(themeEntity, sunEntity, sysDark);
        this._updateImage(hass, imageNight);

        // 11. First load gate
        if (!this._hasReceivedFirstHass) {
            this._hasReceivedFirstHass = true;
            this._renderGate.hasFirstHass = true;
            this._lastState = weatherState;
            this._params = newParams;
            this._stateInitialized = true;
            this._cloudsSorted = false;
            this._tryInitialize();
            return;
        }

        // 12. Change detection → particle reboot
        this._handleWeatherChange(weatherState, newParams, hasNightChanged);
    }

    // --- IMAGE AXIS: Original combined resolution for day/night image switching ---
    // This preserves the exact pre-refactor priority so custom images are unaffected.
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
    // Priority: YAML forced mode → Sun Entity → Theme Entity hint → System dark
    _resolveTimeNight(sunEntity, themeEntity) {
        // 1. YAML forced mode (explicit time override)
        if (this._config.mode) {
            const m = this._config.mode.toLowerCase();
            if (m === 'night') return true;
            if (m === 'day') return false;
            // 'dark', 'light', 'auto' fall through — those are theme, not time
        }
        // 2. Sun entity (best signal for actual time of day)
        if (sunEntity) {
            const state = sunEntity.state.toLowerCase();
            return state === 'below_horizon';
        }
        // 3. Theme entity can hint at time if no sun entity exists
        if (themeEntity && !['unavailable', 'unknown'].includes(themeEntity.state)) {
            return NIGHT_MODES.includes(themeEntity.state.toLowerCase());
        }
        // 4. Fallback: assume day
        return false;
    }

    // --- THEME AXIS: Is the background dark? ---
    // Priority: YAML forced mode → Theme Entity → System Dark Mode → follow time
    _resolveThemeDark(themeEntity, sunEntity, sysDark) {
        // 1. YAML forced mode (explicit theme override)
        if (this._config.mode) {
            const m = this._config.mode.toLowerCase();
            if (m === 'dark') return true;
            if (m === 'light') return false;
            // 'day', 'night', 'auto' fall through
        }
        // 2. Theme entity (explicit theme control)
        if (themeEntity && !['unavailable', 'unknown'].includes(themeEntity.state)) {
            return NIGHT_MODES.includes(themeEntity.state.toLowerCase());
        }
        // 3. System dark mode from HA
        if (sysDark !== undefined && sysDark !== null) {
            return !!sysDark;
        }
        // 4. Fallback: follow time of day (original behavior)
        return this._resolveTimeNight(sunEntity, themeEntity);
    }

    // --- Standalone card CSS class management ---
    _updateStandaloneStyles(isNight, newParams) {
        if (!this._config.card_style) {
            // Not standalone — remove all classes if previously applied
            if (this._prevStyleSig !== null) {
                this._elements.root.classList.remove(
                    'standalone', 'scheme-day', 'scheme-night',
                    'weather-overcast', 'weather-rainy', 'weather-storm',
                    'weather-snow', 'weather-partly', 'weather-fog', 'weather-exceptional'
                );
                this._prevStyleSig = null;
            }
            return;
        }

        // Use _isThemeDark for background scheme, not time
        const isDarkScheme = this._isThemeDark;
        const styleSig = `${isDarkScheme}_${newParams.atmosphere}`;
        if (this._prevStyleSig === styleSig) return;
        this._prevStyleSig = styleSig;

        const root = this._elements.root;
        root.classList.add('standalone');

        // Clear all weather classes
        root.classList.remove(
            'weather-overcast', 'weather-rainy', 'weather-storm',
            'weather-snow', 'weather-partly', 'weather-fog', 'weather-exceptional'
        );

        // Day/Night scheme — follows THEME not TIME
        root.classList.toggle('scheme-night', isDarkScheme);
        root.classList.toggle('scheme-day', !isDarkScheme);

        // Weather mood → CSS class
        const atmosphereToClass = {
            'mist': 'weather-fog', 'fog': 'weather-fog',
            'overcast': 'weather-overcast', 'windy': 'weather-overcast',
            'fair': 'weather-partly',
            'rain': 'weather-rainy',
            'storm': 'weather-storm',
            'snow': 'weather-snow',
            'exceptional': 'weather-exceptional'
        };
        const weatherClass = atmosphereToClass[newParams.atmosphere];
        if (weatherClass) root.classList.add(weatherClass);
    }

    // --- Top/bottom text rendering for standalone mode ---
    _updateTextElements(hass, wEntity, lang) {
        if (!this._config.card_style || !wEntity) return;
        if (!this._elements?.tempText || !this._elements?.bottomText) return;

        // Visibility
        const showText = this._config.disable_text !== true;
        const showIcon = this._config.disable_bottom_icon !== true;
        this._elements.tempText.style.display = showText ? '' : 'none';
        this._elements.bottomText.style.display = showText ? '' : 'none';

        // --- Top text ---
        let topVal, topUnit;
        if (this._config.top_text_sensor) {
            const s = hass.states[this._config.top_text_sensor];
            topVal = s ? s.state : 'N/A';
            topUnit = s?.attributes.unit_of_measurement || '';
        } else {
            topVal = wEntity.attributes.temperature;
            topUnit = wEntity.attributes.temperature_unit || '';
        }

        const currentTopSig = `${topVal}_${topUnit}_${lang}`;
        if (this._lastTempStr !== currentTopSig) {
            this._lastTempStr = currentTopSig;
            let fmt = topVal;
            const isNumeric = topVal !== null && topVal !== '' && !isNaN(parseFloat(topVal)) && isFinite(topVal);
            if (isNumeric) {
                fmt = new Intl.NumberFormat(lang, { maximumFractionDigits: 1, minimumFractionDigits: 0 }).format(topVal);
            }
            this._elements.tempText.innerHTML = `<span class="temp-val">${fmt}</span><span class="temp-unit">${topUnit}</span>`;
        }

        // --- Bottom text ---
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
                    iconStrategy = 'native';
                }
            } else {
                bottomValue = 'N/A'; bottomUnit = '';
            }
        } else {
            // Default: wind from weather attributes (must use static icon)
            bottomValue = wEntity.attributes.wind_speed;
            bottomUnit = wEntity.attributes.wind_speed_unit || 'km/h';
            iconValue = this._config.bottom_text_icon || 'mdi:weather-windy';
        }

        let formattedBottom = bottomValue;
        if (bottomValue !== null && !isNaN(parseFloat(bottomValue))) {
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

            // CRITICAL: Inject state into native component immediately after creation
            if (showIcon && iconStrategy === 'native') {
                const iconEl = this._elements.bottomText.querySelector('ha-state-icon');
                if (iconEl) { iconEl.hass = hass; iconEl.stateObj = sensorObj; }
            }
        }
        // Update native icon state even when HTML didn't change (handles dynamic icons like battery)
        else if (showIcon && iconStrategy === 'native') {
            const iconEl = this._elements.bottomText.querySelector('ha-state-icon');
            if (iconEl && iconEl.stateObj !== sensorObj) {
                iconEl.hass = hass; iconEl.stateObj = sensorObj;
            }
        }

        // Text positioning (opposite side from sun/moon)
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

    // --- Image source switching (day/night + status override) ---
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

    // --- Weather change detection → particle reboot ---
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

    // Enable resizing in Section views
    static getGridOptions() {
        return {
            columns: 12, rows: 3,
            min_columns: 2, min_rows: 2,
        };
    }

    // ========================================================================
    // LOGIC // 3.3 LOGIC & STATE (Calculations) STATE
    // ========================================================================

    // ENTITY HELPER METHODS WITH ERROR HANDLING
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
        
        // Clear error state if entity is now available
        this._entityErrors.delete(entityId);
        return entity;
    }
    
    _trackEntityError(entityId, errorType) {
        const now = Date.now();
        const existing = this._entityErrors.get(entityId);
        
        if (!existing || existing.type !== errorType) {
            this._entityErrors.set(entityId, { type: errorType, since: now });
            
            // Log errors at most once per minute to avoid spam
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

    // NOTE: Day/Night logic is handled inline in `set hass` with the hierarchy:
    // Mode (YAML force) → Theme Entity → Sun Entity → System Dark Mode

    // CELESTIAL POSITION LOGIC
    _getCelestialPosition(w) {
        // Default values
        const result = { x: 100, y: 100 };
        
        // 1. Horizontal Position (X) - RENAMED from sun_moon_position
        if (this._config.sun_moon_x_position !== undefined) {
            const posX = parseInt(this._config.sun_moon_x_position, 10);
            if (!isNaN(posX)) {
                // If positive, offset from left. If negative, offset from right.
                result.x = posX >= 0 ? posX : w + posX;
            }
        }

        // 2. Vertical Position (Y)
        if (this._config.sun_moon_y_position !== undefined) {
            const posY = parseInt(this._config.sun_moon_y_position, 10);
            if (!isNaN(posY)) {
                result.y = posY;
            }
        }
        
        return result;
    }

    // LOGIC: STATUS IMAGE (Generic Override)
    _calculateStatusImage(hass, isNight) {
        if (!this._hasStatusFeature) return null;

        const entityId = this._config.status_entity;
        const stateObj = this._getEntityState(hass, entityId); // Safe getter

        if (!stateObj || !stateObj.state) return null;

        const state = stateObj.state.toLowerCase();
        
        // Check if the entity is in an "active" state (e.g. Open, On, Unlocked)
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
            // Restore GPU backing stores from cached dimensions
            this._restoreCanvasBuffers();
            this._startAnimation();
        } else if (!this._isVisible && wasVisible) {
            this._stopAnimation();
            // Release GPU texture memory (compositor savings)
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
        
        // If the element resized while off-screen (e.g. rotation), reinit particles
        const currentCSSWidth = width / dpr;
        if (this._lastInitWidth > 0 && Math.abs(currentCSSWidth - this._lastInitWidth) >= 100) {
            this._initParticles();
            this._lastInitWidth = currentCSSWidth;
        }
    }
    
    // HOME ASSISTANT TAP ACTION SUPPORT
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
        // Guard: Already initialized
        if (this._initializationComplete) return;
        
        // Guard: Missing prerequisites
        if (!this._renderGate.hasFirstHass) return;
        if (!this._renderGate.hasValidDimensions) return;
        
        // Guard: No valid dimensions cached
        if (!this._cachedDimensions.width || !this._cachedDimensions.height) return;
        
        // Mark as complete FIRST (prevent re-entry)
        this._initializationComplete = true;
        
        // Use ResizeObserver's cached dimensions (already has DPR scaling)
        const w = this._cachedDimensions.width / this._cachedDimensions.dpr;
        const h = this._cachedDimensions.height / this._cachedDimensions.dpr;
        
        // Store for future tolerance checks
        this._width = w;
        this._height = h;
        this._lastInitWidth = w;
        
        // Defer to next frame to ensure CSS transition registers
        requestAnimationFrame(() => {
            if (!this.isConnected) return;
            
            this._initParticles(w, h);
            this._checkRenderGate();
        });
    }

    _updateCanvasDimensions(forceW = null, forceH = null) {
        if (!this._elements?.root || !this._ctxs) return false;
        
        // --- SQUARE MODE ENFORCER ---
        if (this._config.square && forceW === null) {
            const currentW = this._elements.root.clientWidth;
            if (currentW > 0 && Math.abs(this.clientHeight - currentW) > 1) {
                this.style.height = `${currentW}px`;
            }
        }
        
        let scaledWidth, scaledHeight, dpr;

        if (forceW !== null && forceH !== null) {
            dpr = Math.min(window.devicePixelRatio || 1, PERFORMANCE_CONFIG.MAX_DPR);
            scaledWidth = Math.floor(forceW * dpr);
            scaledHeight = Math.floor(forceH * dpr);
        } else {
            const rect = this._elements.root.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return false;
            
            dpr = Math.min(window.devicePixelRatio || 1, PERFORMANCE_CONFIG.MAX_DPR);
            scaledWidth = Math.floor(rect.width * dpr);
            scaledHeight = Math.floor(rect.height * dpr);
        }
        
        // --- MOBILE SCROLL LAG FIX ---
        // 1. Did the Width change? (Rotation or Layout change = Must Resize)
        const widthChanged = this._cachedDimensions.width !== scaledWidth;
        // 2. Did the DPR (Zoom level) change? (Must Resize)
        const dprChanged = this._cachedDimensions.dpr !== dpr;
        // 3. How much did the Height change?
        const heightDiff = Math.abs(this._cachedDimensions.height - scaledHeight);

        // LOGIC: If width is stable, and height changed by less than 150px (URL bar),
        // IGNORE IT. Let CSS stretch the canvas. This stops the lag.
        if (!widthChanged && !dprChanged && heightDiff < 150) {
            return false;
        }
        
        // Update cached dimensions
        this._cachedDimensions = { width: scaledWidth, height: scaledHeight, dpr };
        
        // Don't allocate GPU buffers while off-screen (they were freed for compositor savings).
        // Cached dimensions ARE updated above so _restoreCanvasBuffers uses the correct size.
        if (this._canvasBuffersReleased) {
            return false;
        }
        
        // Update canvas sizes
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
            this._renderGate.hasValidDimensions = true;
            this._checkRenderGate();
        }
        
        return true;
    }
    
    _scheduleParticleReinit() {
        this._pendingResize = true;
        this._lastResizeTime = Date.now();
        
        // Clear any existing debounce timer
        if (this._resizeDebounceTimer) {
            clearTimeout(this._resizeDebounceTimer);
        }
        
        // Schedule particle reinitialization after resize settles
        this._resizeDebounceTimer = setTimeout(() => {
            this._resizeDebounceTimer = null;
            
            // Check Tolerance
            // If we have initialized before, check how much the size actually changed.
            // If the width change is small (< 100px), we assume the canvas CSS scaling 
            // is sufficient and we DO NOT regenerate the particles.
            if (this._lastInitWidth > 0 && this._cachedDimensions.width > 0) {
                // width is stored scaled by dpr, so divide back to get CSS pixels
                const currentCSSWidth = this._cachedDimensions.width / this._cachedDimensions.dpr;
                const diff = Math.abs(currentCSSWidth - this._lastInitWidth);
                
                if (diff < 100) {
                    this._pendingResize = false;
                    return; 
                }
            }

            if (this._pendingResize && this._stateInitialized) {
                this._pendingResize = false;
                
                // Capture the new width for next time
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
            // This forces the browser to register the "Before" state (Opacity 0)
            // before applying the "After" state (Opacity 1).
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
        
        // Use passed dimensions to avoid re-reading DOM
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

        // Clear existing particles
        this._clearAllParticles();

        // Aurora (very rare) - Requires Dark Theme AND Night Time
        if (this._isThemeDark && this._isTimeNight && (p.type === 'stars' || p.type === 'cloud') && (p.cloud || 0) <= 5 && Math.random() < 0.04) {
            this._initAurora(w, h);
        }
        
        // Comet (rare)
        if (this._isNight && p.type === 'stars' && Math.random() < 0.001) {
            this._comets.push(this._createComet(w, h));
        }
        
        // Airplane
        // 50% chance to start with one on load
        if (Math.random() < 0.5) {
            this._planes.push(this._createPlane(w, h));
        }

        // Fog banks
        if (p.type === 'fog' || p.foggy) {
            this._initFogBanks(w, h);
        }

        // Precipitation particles
        if ((p.count || 0) > 0 && p.type !== 'stars' && p.type !== 'fog') {
            this._initPrecipitation(w, h, p);
        }

        // Clouds with organic shapes
        if ((p.cloud || 0) > 0) {
            this._initClouds(w, h, p);
        }

        // Ambient night clouds
        if (this._isNight && (p.cloud || 0) < 5) {
            this._initNightClouds(w, h);
        }

        // Sun clouds for ray visibility on light backgrounds - repositioned
        if (p.rays && !this._isNight && this._isLightBackground) {
            this._initSunClouds(w, h);
        }

        // Stars — only on dark themes (ink-mode dots on light bg look unnatural)
        const starCount = (this._isTimeNight && this._isThemeDark) ? (p.stars || 0) : 0;
        if (starCount > 0) {
            this._initStars(w, h, starCount);
        }

        // Leaves for windy weather
        if (p.leaves) {
            this._initLeaves(w, h);
        }

        // Dust motes for sunny/fair weather
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
    
      // 33% chance of slight upward flight path (1-5 degrees)
      const climbAngle = Math.random() < 0.33
          ? (1 + Math.random() * 4) * (Math.PI / 180)
          : 0;
    
      return {
        // Start well off-screen
        x: goingRight ? -100 : w + 100,
        y: h * 0.15 + Math.random() * (h * 0.4), // Higher altitude
        vx: dir * Math.cos(climbAngle) * baseSpeed, // Varied speed
        vy: -Math.sin(climbAngle) * baseSpeed, // Negative = upward in canvas coords
        climbAngle: climbAngle, // Always >= 0; direction handled by vx sign
        scale: 0.5 + Math.random() * 0.4,
        blinkPhase: Math.random() * 10,
        // The Trail Buffer
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
            
            // Depth layer (0.5-1.5) affects size, speed, opacity
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
            } else { // snow
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

            // Sort into new optimized arrays
            if (particle.type === 'rain') this._rain.push(particle);
            else if (particle.type === 'snow') this._snow.push(particle);
            else if (particle.type === 'hail') this._hail.push(particle);
        }
    }

    _initClouds(w, h, p) {
        // 1. SETUP
        const isStandalone = this._config.card_style === 'standalone';
        const heightLimit = isStandalone ? 0.75 : 0.5;

        const totalClouds = p.cloud || 0;
        if (totalClouds <= 0) return;

        // 2. FILLER CLOUDS (Background texture — mixed types for variety)
        const fillerCount = Math.floor(totalClouds * 0.15);

        for (let i = 0; i < fillerCount; i++) {
            const seed = Math.random() * 10000;
            // Alternate between stratus wisps and small cumulus for texture
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

        // 3. MAIN HERO CLOUDS
        const mainCount = totalClouds - fillerCount;
        const configScale = p.scale || 1.0;
        const isStorm = p.dark;

        for (let i = 0; i < mainCount; i++) {
            const layer = 1 + (i % 4);
            const seed = Math.random() * 10000;

            let puffs;
            let type;

            // --- CLOUD TYPE SELECTION: Atmosphere-aware distribution ---
            if (isStorm) {
                type = 'storm';
                puffs = CloudShapeGenerator.generateOrganicPuffs(true, seed);
            } else {
                let types;
                if (p.atmosphere === 'fair' || p.atmosphere === 'clear') {
                    // Partly cloudy: mostly puffy cumulus + organic, some stratus wisps
                    types = [
                        'cumulus', 'cumulus', 'cumulus', 'cumulus',
                        'organic', 'organic', 'organic',
                        'stratus', 'stratus', 'stratus'
                    ];
                } else if (p.atmosphere === 'overcast' || p.atmosphere === 'cloudy') {
                    // Heavy coverage: dense organic + cumulus, fewer stratus
                    types = [
                        'organic', 'organic', 'organic', 'organic',
                        'cumulus', 'cumulus', 'cumulus', 'cumulus',
                        'stratus', 'stratus'
                    ];
                } else if (p.atmosphere === 'windy') {
                    // Wind-driven: more stratus (wind-stretched), organic for bulk
                    types = [
                        'stratus', 'stratus', 'stratus', 'stratus',
                        'organic', 'organic', 'organic',
                        'cumulus', 'cumulus', 'cumulus'
                    ];
                } else {
                    // Default (rain, snow, mist, etc): balanced mix
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

            // --- TYPE-SPECIFIC TRANSFORMS ---
            // 10% less width, 5% more height applied at source
            let scaleX = 1.0;
            let scaleY = 1.0;
            let radiusMod = 1.0;

            if (type === 'stratus') {
                scaleX = 1.98 + Math.random() * 0.9;   // Was 2.2 + 1.0
                scaleY = 0.525 + Math.random() * 0.26; // Was 0.5 + 0.25
                radiusMod = 0.55;
            } else if (type === 'organic' || type === 'storm') {
                scaleX = 0.855 + Math.random() * 0.18; // Was 0.95 + 0.2
                scaleY = 0.945 + Math.random() * 0.21; // Was 0.9 + 0.2
                radiusMod = 1.0;
            } else {
                // Cumulus
                scaleX = 0.9 + Math.random() * 0.27;   // Was 1.0 + 0.3
                scaleY = 0.84 + Math.random() * 0.315; // Was 0.8 + 0.3
                radiusMod = 0.9;
            }

            // Apply modifications to puffs in-place
            if (puffs) {
                for (let k = 0; k < puffs.length; k++) {
                    puffs[k].dx *= scaleX;
                    puffs[k].dy *= scaleY;
                    puffs[k].rad *= radiusMod;
                }
            }

            // --- SIZE HIERARCHY ---
            // Creates natural variation: a few large clouds, many medium, some small accents
            let cloudScale;
            const sizeRoll = Math.random();
            if (sizeRoll < 0.20) {
                // Hero clouds — large, prominent
                cloudScale = (1.1 + Math.random() * 0.35) * configScale;
            } else if (sizeRoll < 0.65) {
                // Medium clouds — the bulk of the sky
                cloudScale = (0.7 + Math.random() * 0.35) * configScale;
            } else {
                // Accent clouds — small, add depth and fill gaps
                cloudScale = (0.45 + Math.random() * 0.25) * configScale;
            }

            // --- ALTITUDE ZONES (type-aware) ---
            let yPos;
            if (type === 'stratus') {
                // Stratus sit high
                yPos = h * 0.05 + Math.random() * (h * 0.35);
            } else if (type === 'cumulus') {
                // Cumulus in the mid-sky
                yPos = h * 0.10 + Math.random() * (h * (heightLimit - 0.10));
            } else {
                // Organic spread across the visible range
                yPos = h * 0.08 + Math.random() * (h * (heightLimit - 0.05));
            }

            this._clouds.push({
                x: Math.random() * w,
                y: yPos,
                scale: cloudScale,
                speed: (0.02 + Math.random() * 0.03) * (layer * 0.4 + 1),
                puffs,
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

        // 4. SCUD CLOUDS (Foreground Details)
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
            const puffs = CloudShapeGenerator.generateOrganicPuffs(false, seed);
            
            this._clouds.push({
                x: Math.random() * w,
                y: Math.random() * (h * 0.35),
                scale: 0.7,
                speed: 0.04,
                puffs,
                layer: 4,
                opacity: 0.12,
                seed,
                breathPhase: Math.random() * Math.PI * 2,
                breathSpeed: 0.002
            });
        }
    }

    // Sun clouds
    _initSunClouds(w, h) {
        const celestial = this._getCelestialPosition(w);
        const sunX = celestial.x;
        const sunY = celestial.y;
        const isExceptional = (this._params.cloud || 0) === 0;

        // LAYER 1: DEEP ATMOSPHERE (Static background glow)
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

        // LAYER 2: THE BASE (The "Bed" of clouds)
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

        // LAYER 3: THE DIFFUSERS (Center "Pop")
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
        
        // LAYER 4: UPPER HAZE (Verticality)
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
        // 1. STRICT TIERS
        // Push most stars into the background for depth.
        // Hero stars (very rare, approx 4-5 stars total).
        const tier1Count = Math.floor(count * 0.70); // Background (Depth)
        const tier2Count = Math.floor(count * 0.285); // Mid (Structure)
        
        for (let i = 0; i < count; i++) {
            const isCluster = Math.random() < 0.3;
            let x = Math.random() * w;
            let y = Math.random() * h * 0.85; 
            
            if (isCluster) {
                x += (Math.random() - 0.5) * 90;
                y += (Math.random() - 0.5) * 60;
            }

            // DETERMINE TIER
            let tier;
            if (i < tier1Count) tier = 'bg';        
            else if (i < tier1Count + tier2Count) tier = 'mid'; 
            else tier = 'hero';                     

            // PHYSICAL PROPERTIES
            let size, brightness, twinkleSpeed;
            
            if (tier === 'bg') {
                size = 1.2 + Math.random() * 0.4;
                brightness = 0.35 + Math.random() * 0.2;
                twinkleSpeed = 0.04 + Math.random() * 0.04; 
            } else if (tier === 'mid') {
                size = 1.8 + Math.random() * 0.6;
                brightness = 0.6 + Math.random() * 0.25;
                twinkleSpeed = 0.02 + Math.random() * 0.02; 
            } else { // Hero
                size = 2.2 + Math.random() * 0.8;
                brightness = 0.85 + Math.random() * 0.15;
                twinkleSpeed = 0.005 + Math.random() * 0.01; 
            }

            // COLOR DATA (Stored raw for chromatic shifting)
            const k = Math.random();
            let hColor, sColor, lColor;
            
            if (k < 0.3) { // Blue
                hColor = 215; sColor = 30; lColor = 88; 
            } else if (k > 0.85) { // Gold/Red
                hColor = 35; sColor = 35; lColor = 85; 
            } else { // White
                hColor = 200; sColor = 5; lColor = 95; 
            }

            this._stars.push({
                x, y,
                baseSize: size, 
                phase: Math.random() * Math.PI * 2,
                rate: twinkleSpeed,
                brightness, 
                tier, 
                // Store raw HSL values so we can animate them in the render loop
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
        // Only show if the sun is actually supposed to be visible
        if (!this._shouldShowSun()) return;
        
        // 1. Get Sun Position
        const celestial = this._getCelestialPosition(w);
        
        const count = Math.min(LIMITS.MAX_DUST, 30);
        for (let i = 0; i < count; i++) {
            // 2. Cluster around the sun
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
        
        // Main bolt
        while (curY < h && iter < 80) {
            const nextY = curY + 15 + Math.random() * 25;
            const nextX = curX + (Math.random() * 50 - 25);
            segments.push({ x: curX, y: curY, nx: nextX, ny: nextY, branch: false });
            
            // Occasional branches
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
    // RENDERING
    // ========================================================================
    
    // ========================================================================
    // DRAWING HELPERS
    // ========================================================================
    
    // SUN RAYS - Theme-aware: multiply on light, screen on dark
    _drawLightRays(ctx, w, h) {
        const rayCount = 8;
        const fadeOpacity = this._layerFadeProgress.effects;
        
        // Dynamic Position
        const celestial = this._getCelestialPosition(w);
        const centerX = celestial.x; 
        const centerY = celestial.y;
        
        const baseAngle = Math.PI * 0.2;
        const spread = Math.PI * 0.45;

        ctx.save();
        
        for (let i = 0; i < rayCount; i++) {
            const angleOffset = Math.sin(this._rayPhase + i * 0.7) * 0.08;
            const angle = baseAngle + (i / rayCount) * spread + angleOffset;
            const length = h * 1.4;
            
            const endX = centerX + Math.cos(angle) * length;
            const endY = centerY + Math.sin(angle) * length;
            
            const rayWidth = 35 + Math.sin(this._rayPhase * 0.8 + i * 1.2) * 15;
            const intensity = (0.25 + Math.sin(this._rayPhase * 0.5 + i * 0.8) * 0.05) * fadeOpacity;
            
            // Draw ray shape
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            
            const perpAngle = angle + Math.PI / 2;
            const perpX = Math.cos(perpAngle) * rayWidth;
            const perpY = Math.sin(perpAngle) * rayWidth;
            
            ctx.lineTo(endX - perpX, endY - perpY);
            ctx.lineTo(endX + perpX, endY + perpY);
            ctx.closePath();
            
            const g = ctx.createLinearGradient(centerX, centerY, endX, endY);
            
            if (this._isLightBackground) {
                // LIGHT THEME: multiply darkens — warm golden tint
                ctx.globalCompositeOperation = 'multiply';
                g.addColorStop(0, `rgba(255, 200, 80, ${intensity * 0.5})`);
                g.addColorStop(0.15, `rgba(255, 210, 100, ${intensity * 0.4})`);
                g.addColorStop(0.4, `rgba(255, 230, 160, ${intensity * 0.2})`);
                g.addColorStop(1, 'rgba(255, 255, 255, 0)');
            } else {
                // DARK THEME: screen adds light — bright visible beams
                ctx.globalCompositeOperation = 'screen';
                g.addColorStop(0, `rgba(255, 240, 180, ${intensity * 2.0})`);
                g.addColorStop(0.2, `rgba(255, 245, 200, ${intensity * 1.4})`);
                g.addColorStop(0.5, `rgba(255, 250, 220, ${intensity * 0.6})`);
                g.addColorStop(1, 'rgba(255, 255, 255, 0)');
            }
            
            ctx.fillStyle = g;
            ctx.fill();
        }
        
        // Second pass — boosted accent rays
        if (this._isLightBackground) {
            // Light theme: overlay pass for warmth
            ctx.globalCompositeOperation = 'overlay';
            for (let i = 0; i < rayCount; i += 2) {
                const angle = baseAngle + (i / rayCount) * spread + Math.sin(this._rayPhase + i * 0.7) * 0.08;
                const length = h * 1.2;
                const endX = centerX + Math.cos(angle) * length;
                const endY = centerY + Math.sin(angle) * length;
                const rayWidth = 25 + Math.sin(this._rayPhase * 0.8 + i * 1.2) * 10;
                
                const perpAngle = angle + Math.PI / 2;
                const perpX = Math.cos(perpAngle) * rayWidth;
                const perpY = Math.sin(perpAngle) * rayWidth;
                
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(endX - perpX, endY - perpY);
                ctx.lineTo(endX + perpX, endY + perpY);
                ctx.closePath();
                
                const g2 = ctx.createLinearGradient(centerX, centerY, endX, endY);
                g2.addColorStop(0, `rgba(255, 180, 50, ${0.15 * fadeOpacity})`);
                g2.addColorStop(0.3, `rgba(255, 200, 100, ${0.08 * fadeOpacity})`);
                g2.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = g2;
                ctx.fill();
            }
        } else {
            // Dark theme: additive accent pass for visible god-rays
            ctx.globalCompositeOperation = 'lighter';
            for (let i = 1; i < rayCount; i += 2) {
                const angle = baseAngle + (i / rayCount) * spread + Math.sin(this._rayPhase + i * 0.7) * 0.08;
                const length = h * 1.3;
                const endX = centerX + Math.cos(angle) * length;
                const endY = centerY + Math.sin(angle) * length;
                const rayWidth = 20 + Math.sin(this._rayPhase * 0.8 + i * 1.2) * 8;
                
                const perpAngle = angle + Math.PI / 2;
                const perpX = Math.cos(perpAngle) * rayWidth;
                const perpY = Math.sin(perpAngle) * rayWidth;
                
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(endX - perpX, endY - perpY);
                ctx.lineTo(endX + perpX, endY + perpY);
                ctx.closePath();
                
                const g2 = ctx.createLinearGradient(centerX, centerY, endX, endY);
                g2.addColorStop(0, `rgba(255, 230, 150, ${0.20 * fadeOpacity})`);
                g2.addColorStop(0.3, `rgba(255, 240, 180, ${0.10 * fadeOpacity})`);
                g2.addColorStop(1, 'rgba(255, 255, 220, 0)');
                ctx.fillStyle = g2;
                ctx.fill();
            }
        }
        
        ctx.restore();
    }



    // Sun Cloud Renderer
    _drawSunClouds(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.clouds;
        if (fadeOpacity <= 0) return;
        
        for (let i = 0; i < this._sunClouds.length; i++) {
            const cloud = this._sunClouds[i];
            
            // 1. PHYSICS
            cloud.driftPhase += 0.008;
            cloud.breathPhase += cloud.breathSpeed;
            
            const driftX = Math.sin(cloud.driftPhase) * 12;
            const driftY = Math.cos(cloud.driftPhase * 0.7) * 4;
            
            cloud.x = cloud.baseX + driftX + effectiveWind * 0.3;
            cloud.y = cloud.baseY + driftY;
            
            // Bounds check
            if (cloud.x > cloud.baseX + 60) cloud.x = cloud.baseX + 60;
            if (cloud.x < cloud.baseX - 60) cloud.x = cloud.baseX - 60;
            
            const breathScale = 1 + Math.sin(cloud.breathPhase) * 0.02;
            
            // 2. RAW STATE
            ctx.save();
            ctx.translate(cloud.x, cloud.y);
            ctx.scale(cloud.scale * breathScale, cloud.scale * 0.55 * breathScale);
            
            // 3. DRAW PUFFS (Inlined Gradient)
            const puffs = cloud.puffs;
            const len = puffs.length;
            
            for (let j = 0; j < len; j++) {
                const puff = puffs[j];
                const baseOp = cloud.opacity * puff.shade * fadeOpacity;
                // Colors are hardcoded for Sun Clouds (Warm/Gold scheme)
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

    // SUN GLOW
    _drawSunGlow(ctx, w, h) {
        const fadeOpacity = this._layerFadeProgress.effects;
        const celestial = this._getCelestialPosition(w);
        const centerX = celestial.x;
        const centerY = celestial.y;

        ctx.save();

        // 1. DARK MODE: 3D SPHERE (Glassy Rim + Offset Gradient)
        // --------------------------------------------------------------------
        if (!this._isLightBackground) {
            
            // Pulse physics
            const pulse = Math.sin(this._rayPhase * 0.4) * 0.02 + 0.98;
            const sunRadius = 25 * pulse; 

            // FORCE SOLID COMPOSITING
            ctx.globalCompositeOperation = 'source-over';
            
            // A. SUBTLE CORONA (The faint outer glow ring)
            ctx.beginPath();
            ctx.arc(centerX, centerY, sunRadius + 5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 180, 40, ${0.12 * fadeOpacity})`;
            ctx.fill();

            // B. THE CORE (3D Sphere Gradient - Offset Top-Left)
            const bodyGrad = ctx.createRadialGradient(
                centerX - sunRadius * 0.35, centerY - sunRadius * 0.35, 0,
                centerX, centerY, sunRadius
            );
            bodyGrad.addColorStop(0.0, `rgba(255, 255, 220, ${1.0 * fadeOpacity})`); // Specular Highlight
            bodyGrad.addColorStop(0.4, `rgba(255, 210, 60,  ${1.0 * fadeOpacity})`); // Gold Body
            bodyGrad.addColorStop(1.0, `rgba(255, 130, 0,   ${1.0 * fadeOpacity})`); // Amber Shadow

            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.arc(centerX, centerY, sunRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // C. THE GLASSY RIM (Matches Cloudy Sun)
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = `rgba(255, 230, 180, ${0.6 * fadeOpacity})`;
            ctx.stroke();

            ctx.restore();
            return;
        }

        // --------------------------------------------------------------------
        // 2. LIGHT MODE: Original Atmosphere
        // --------------------------------------------------------------------
        const glowBreath = 1 + Math.sin(this._rayPhase * 0.3) * 0.03;
        const g = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, w * 0.6 * glowBreath);
        g.addColorStop(0, `rgba(255, 175, 60, ${0.65 * fadeOpacity})`); 
        g.addColorStop(0.2, `rgba(255, 205, 100, ${0.45 * fadeOpacity})`); 
        g.addColorStop(0.5, `rgba(255, 235, 180, ${0.15 * fadeOpacity})`);
        g.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);

        const pulse = Math.sin(this._rayPhase * 0.4) * 0.08 + 0.92;
        const coreRadius = 65 * pulse; 
        ctx.globalCompositeOperation = 'overlay';
        const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius);
        coreGrad.addColorStop(0,    `rgba(255, 250, 230, ${0.70 * fadeOpacity})`);
        coreGrad.addColorStop(0.20, `rgba(255, 245, 200, ${0.40 * fadeOpacity})`);
        coreGrad.addColorStop(0.55, `rgba(255, 240, 180, ${0.12 * fadeOpacity})`);
        coreGrad.addColorStop(1,    'rgba(255, 255, 220, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
    
    // Helper to check if we should show the diffuse sun (Cloudy days)
    _shouldShowCloudySun() {
        // Block ONLY if it's "True Dark" (Night + Dark Theme).
        // Allow it for Light Theme + Night (to draw Moon Glow).
        if (this._isNight && this._isThemeDark) return false;
        
        const p = this._params;
        const currentState = (this._lastState || '').toLowerCase();
        
        // Exclude bad weather where sun is completely gone
        const isBad = p.dark || ['rain', 'hail', 'lightning', 'pouring', 'snowy', 'snowy-rainy'].includes(p.type);
        
        // Include overcast types
        const overcastTypes = ['cloudy', 'windy', 'windy-variant', 'fog'];
        
        return overcastTypes.includes(currentState) && !isBad;
    }

    // CLOUDY SUN (For Cloudy/Windy/Fog)
    _drawCloudySun(ctx, w, h) {
        const fadeOpacity = this._layerFadeProgress.effects;
        const celestial = this._getCelestialPosition(w);
        
        ctx.save();

        if (this._isThemeDark) {
            // DARK MODE: PRO "SPHERE" STYLE (Unified Design)
            ctx.globalCompositeOperation = 'source-over';
            
            const pulse = Math.sin(this._rayPhase * 0.4) * 0.02 + 0.98;
            const sunRadius = 25 * pulse;
            
            // A. SUBTLE CORONA (Faint outer glow)
            ctx.beginPath();
            ctx.arc(celestial.x, celestial.y, sunRadius + 5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 180, 40, ${0.12 * fadeOpacity})`;
            ctx.fill();

            // B. THE CORE (3D Sphere Gradient - Offset Top-Left)
            const g = ctx.createRadialGradient(
                celestial.x - sunRadius * 0.35, celestial.y - sunRadius * 0.35, 0,
                celestial.x, celestial.y, sunRadius
            );
            g.addColorStop(0.0, `rgba(255, 255, 220, ${1.0 * fadeOpacity})`); // Specular Highlight
            g.addColorStop(0.4, `rgba(255, 210, 60,  ${1.0 * fadeOpacity})`); // Gold Body
            g.addColorStop(1.0, `rgba(255, 130, 0,   ${1.0 * fadeOpacity})`); // Amber Shadow
            
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(celestial.x, celestial.y, sunRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // C. THE GLASSY RIM (Replaces the "Red Ring")
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = `rgba(255, 230, 180, ${0.6 * fadeOpacity})`;
            ctx.stroke();
            
            ctx.restore();
            return;
        }

        // LIGHT MODE: Diffuse Haze (Sun or Moon)
        ctx.globalCompositeOperation = 'overlay';

        // 1. CHOOSE PALETTE
        // Sun: Warm White -> Pale Yellow -> Transparent
        // Moon: Cool White -> Pale Blue -> Transparent
        const isMoon = this._isNight;
        const c1 = isMoon ? '240, 245, 255' : '255, 255, 240';
        const c2 = isMoon ? '220, 230, 250' : '255, 245, 210';
        const c3 = isMoon ? '210, 220, 240' : '255, 245, 220';
        const cCore = isMoon ? '200, 220, 255' : '255, 220, 100';

        // 2. OUTER GLOW
        const g = ctx.createRadialGradient(celestial.x, celestial.y, 0, celestial.x, celestial.y, 140);
        g.addColorStop(0,   `rgba(${c1}, ${0.7 * fadeOpacity})`);
        g.addColorStop(0.4, `rgba(${c2}, ${0.4 * fadeOpacity})`);
        g.addColorStop(1,   `rgba(${c3}, 0)`);
        
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(celestial.x, celestial.y, 140, 0, Math.PI * 2);
        ctx.fill();
        
        // 3. CORE HIGHLIGHT
        const core = ctx.createRadialGradient(celestial.x, celestial.y, 0, celestial.x, celestial.y, 45);
        core.addColorStop(0, `rgba(${cCore}, ${0.35 * fadeOpacity})`);
        core.addColorStop(1, `rgba(${c1}, 0)`);
        
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(celestial.x, celestial.y, 45, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }


    // High-Performance Cloud Renderer
    _drawClouds(ctx, cloudList, w, h, effectiveWind, globalOpacity) {
        if (cloudList.length === 0) return;

        const fadeOpacity = this._layerFadeProgress.clouds;
        if (fadeOpacity <= 0) return;

        // =================================================================
        // SHEET LIGHTNING — Independent trigger
        // =================================================================
        const isStormy = this._params?.thunder ||
            this._params?.type === 'lightning' ||
            this._params?.type === 'lightning-rainy' ||
            this._params?.type === 'pouring';

        if (isStormy && cloudList.length > 0 && Math.random() < 0.03) {
            // Filter to hero clouds (layer >= 1) so filler stratus don't eat rolls
            const candidates = cloudList.filter(c => c.layer >= 1 && c.puffs && c.puffs.length > 5);
            const pool = candidates.length > 0 ? candidates : cloudList;
            const target = pool[Math.floor(Math.random() * pool.length)];
            target.flashIntensity = 1.0;

            // Pick a random puff as the flash epicenter
            if (target.puffs && target.puffs.length > 0) {
                const originPuff = target.puffs[Math.floor(Math.random() * target.puffs.length)];
                target.flashOriginX = originPuff.dx;
                target.flashOriginY = originPuff.dy;
            }
        }

        // Flash color palettes — theme-aware for correct contrast
        let flashLitR, flashLitG, flashLitB;
        let flashMidR, flashMidG, flashMidB;
        let flashShadowR, flashShadowG, flashShadowB;

        if (this._isThemeDark) {
            // Dark theme: cool blue-violet interior glow
            flashLitR = 180; flashLitG = 200; flashLitB = 255;
            flashMidR = 120; flashMidG = 145; flashMidB = 220;
            flashShadowR = 60; flashShadowG = 75; flashShadowB = 160;
        } else {
            // Light theme: warm electric white
            flashLitR = 255; flashLitG = 250; flashLitB = 255;
            flashMidR = 240; flashMidG = 238; flashMidB = 250;
            flashShadowR = 210; flashShadowG = 215; flashShadowB = 235;
        }

        // 1. PRE-CALCULATE CONSTANTS (Tuned for 3D Volume & Edge Definition)
        let litR, litG, litB;
        let midR, midG, midB;
        let shadowR, shadowG, shadowB;
        let ambient;

        let highlightOffsetBase;
        let hOffset;

        // --- A. DARK THEME + NIGHTTIME (Moonlit Volume - Corrected) ---
        if (this._isThemeDark && this._isTimeNight) {
            litR=195; litG=208; litB=225;       // Silver-blue rim
            midR=32;  midG=42;  midB=65;        // Deep indigo core
            shadowR=8;  shadowG=14; shadowB=26; // Navy edge
            ambient=0.75;
            highlightOffsetBase = 0.45; 
            hOffset = 0.02; 
        }
        // --- A2. DARK THEME + DAYTIME STORM (Corrected) ---
        else if (this._isThemeDark && !this._isTimeNight && (this._params?.dark || this._params?.thunder || ['lightning', 'lightning-rainy', 'pouring', 'rainy', 'hail', 'snowy', 'snowy-rainy'].includes(this._params?.type))) {
            litR=110; litG=118; litB=135;
            midR=38;  midG=43;  midB=58;
            shadowR=12; shadowG=15; shadowB=22;
            ambient=0.85;
            highlightOffsetBase = 0.50; 
            hOffset = 0.05; 
        }
        // --- A2. DARK THEME + DAYTIME FAIR (Corrected) ---
        else if (this._isThemeDark && !this._isTimeNight) {
            litR=228; litG=238; litB=255;
            midR=62;  midG=72;  midB=95;
            shadowR=15; shadowG=18; shadowB=30;
            ambient=0.88;
            highlightOffsetBase = 0.55; 
            hOffset = 0.05; 
        }
        // --- B. DAY: BAD WEATHER (High Contrast & Solid) ---
        else if (this._params?.dark || ['rain', 'hail', 'fog', 'lightning', 'lightning-rainy', 'pouring', 'rainy', 'snowy-rainy'].includes(this._params?.type) || this._params?.foggy) {

            if (this._isLightBackground) {
                const isStorm = this._params?.thunder || ['lightning', 'lightning-rainy', 'pouring'].includes(this._params?.type);

                if (isStorm) {
                    // Storms: Keep them dark gray
                    const dim = 0.88;
                    litR = 255 * dim; litG = 255 * dim; litB = 255 * dim;
                    midR = 205 * dim; midG = 215 * dim; midB = 230 * dim;
                    shadowR = 145 * dim; shadowG = 155 * dim; shadowB = 175 * dim;
                    ambient = 0.88;
                } else {
                    // Rain/Snow: Bright white tops (like Cloudy), but ~5% darker bottoms
                    litR = 255; litG = 255; litB = 255;
                    midR = 210; midG = 218; midB = 228;
                    shadowR = 155; shadowG = 166; shadowB = 190;
                    ambient = 1.0;
                }
            } else {
                // Dark Mode Storm (Unchanged)
                const stormDarken = this._params?.thunder ? 10 : 0;
                litR=145 - stormDarken; litG=158 - stormDarken; litB=182 - stormDarken;
                midR=70 - stormDarken; midG=80 - stormDarken; midB=100 - stormDarken;
                shadowR=20 - stormDarken; shadowG=25 - stormDarken; shadowB=35 - stormDarken;
                ambient=0.90;
            }
            highlightOffsetBase = 0.75;
            hOffset = 0.15;
        }
        // --- C. DAY: STANDARD ---
        else if (this._isLightBackground) {
            // Logic: Differentiate "Fair/Partly Cloudy" from "Overcast/Cloudy"
            const isFairWeather = this._params?.atmosphere === 'fair' || this._params?.atmosphere === 'clear';

            // Top of cloud is always pure white
            litR = 255; litG = 255; litB = 255;

            if (isFairWeather) {
                midR = 230; midG = 236; midB = 242;
                shadowR = 180; shadowG = 190; shadowB = 210;
            } else {
                midR = 210; midG = 218; midB = 228;
                shadowR = 163; shadowG = 175; shadowB = 200;
            }

            // Standard Day settings
            ambient = 1.0;
            highlightOffsetBase = 0.75;
            hOffset = 0.15;
        }


        // 2. RENDER LOOP
        for (let i = 0; i < cloudList.length; i++) {
            const cloud = cloudList[i];

            // =============================================================
            // SHEET LIGHTNING DECAY
            // 0.93^n → 50% at ~10 frames (~330ms), near-zero at ~60 (~2s)
            // Slower than 0.9 for a more natural, rolling illumination.
            // =============================================================
            if (cloud.flashIntensity > 0.005) {
                cloud.flashIntensity *= 0.93;
            } else {
                cloud.flashIntensity = 0;
            }

            const fi = cloud.flashIntensity;
            const hasFlash = fi > 0.005;

            // Physics
            const depthFactor = 1 + cloud.layer * 0.2;
            cloud.x += cloud.speed * effectiveWind * depthFactor;
            if (cloud.x > w + 280) cloud.x = -280;
            if (cloud.x < -280) cloud.x = w + 280;

            cloud.breathPhase += cloud.breathSpeed;
            const breathScale = 1 + Math.sin(cloud.breathPhase) * 0.015;

            ctx.save();
            ctx.translate(cloud.x, cloud.y - (h * 0.1));
            
            // FIX: Less vertical squashing for Dark Mode (was 0.38 -> now 0.48)
            // This makes them look like clouds again, not stretched bubbles.
            const vScale = this._isThemeDark ? 0.48 : (this._params?.dark ? 0.40 : 0.55);
            ctx.scale(cloud.scale * breathScale, cloud.scale * vScale * breathScale);

            const puffs = cloud.puffs;
            const len = puffs.length;

            const layerHighlightOffset = (cloud.layer === 5 && !this._isThemeDark) ? 0.50 : highlightOffsetBase;

            // =============================================================
            // Pre-calculate the maximum puff distance for this cloud so we
            // can normalise the falloff curve. Only computed when flashing.
            // =============================================================
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

                // Turbulence
                const flowSpeed = cloud.breathPhase * 0.7;
                const noiseX = Math.sin(flowSpeed + j * 0.5) * (puff.rad * 0.1);
                const noiseY = Math.cos(flowSpeed * 0.8 + j * 0.3) * (puff.rad * 0.05);

                const drawX = puff.dx + noiseX;
                const drawY = puff.dy + noiseY;

                // Shading Interpolation
                const normalizedY = (puff.dy + 50) / 100;
                const shadeFactor = Math.max(0.3, 1 - normalizedY * 0.5);
                const invShade = 1 - shadeFactor;

                // Base colors from the existing palette
                let r = (litR * shadeFactor + shadowR * invShade) | 0;
                let g = (litG * shadeFactor + shadowG * invShade) | 0;
                let b = (litB * shadeFactor + shadowB * invShade) | 0;

                let useMidR = midR;
                let useMidG = midG;
                let useMidB = midB;
                let useShadowR = shadowR;
                let useShadowG = shadowG;
                let useShadowB = shadowB;

                // Ambient — default 1x, boosted per-puff when flashing
                let puffAmbientBoost = 1.0;

                // ==========================================================
                // PER-PUFF FLASH: Distance-based falloff from flash origin
                // Exponential decay: e^(-3 * normalised_distance)
                // Puffs AT the origin get full fi, distant edges get ~5%.
                // ==========================================================
                if (hasFlash) {
                    const pdx = puff.dx - cloud.flashOriginX;
                    const pdy = puff.dy - cloud.flashOriginY;
                    const dist = Math.sqrt(pdx * pdx + pdy * pdy);
                    const normDist = dist / maxPuffDist;

                    // Soft exponential falloff — keeps a gentle rim glow
                    const falloff = Math.exp(-3.0 * normDist);
                    const puffFi = fi * falloff;

                    // Lerp each colour stop independently toward flash palette
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

                    // Ambient boost — strongest at the core, gentle at edges
                    puffAmbientBoost = 1.0 + puffFi * 0.5;
                }

                let finalOpacity = (globalOpacity * cloud.opacity * ambient * fadeOpacity * puffAmbientBoost) * puff.shade;
                
                // FIX: Anti-Banding for Night Clouds.
                // Boost opacity 2.5x and darken colors 40% to force smoother interpolation.
                let dR=r, dG=g, dB=b;
                let dMidR=useMidR, dMidG=useMidG, dMidB=useMidB;
                let dShadR=useShadowR, dShadG=useShadowG, dShadB=useShadowB;

                if (this._isThemeDark && finalOpacity < 0.20) {
                    finalOpacity = Math.min(1.0, finalOpacity * 2.5); 
                    const dim = 0.4; 
                    dR *= dim; dG *= dim; dB *= dim;
                    dMidR *= dim; dMidG *= dim; dMidB *= dim;
                    dShadR *= dim; dShadG *= dim; dShadB *= dim;
                }

                if (finalOpacity < 0.005) continue;

                // Gradient Construction
                const grad = ctx.createRadialGradient(
                    drawX - puff.rad * hOffset,
                    drawY - puff.rad * layerHighlightOffset,
                    0,
                    drawX,
                    drawY,
                    puff.rad
                );

                // Use the adjusted (dither-ready) colors
                grad.addColorStop(0, `rgba(${dR|0}, ${dG|0}, ${dB|0}, ${finalOpacity})`);
                grad.addColorStop(0.4, `rgba(${dMidR|0}, ${dMidG|0}, ${dMidB|0}, ${finalOpacity * 0.85})`);
                if (this._isLightBackground) {
                    grad.addColorStop(1.0, `rgba(${dShadR|0}, ${dShadG|0}, ${dShadB|0}, 0)`);
                } else {
                    grad.addColorStop(0.98, `rgba(${dShadR|0}, ${dShadG|0}, ${dShadB|0}, 0)`);
                }
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(drawX, drawY, puff.rad, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }
    
    



    // Rain (Dynamic Motion Blur)
    _drawRain(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.precipitation;
        if (fadeOpacity <= 0) return;

        const isDay = this._isLightBackground;
        
        // Colors (Standard Blue-Grey)
        const rC = isDay ? 85 : 210; 
        const gC = isDay ? 95 : 225;
        const bC = isDay ? 110 : 255;
        const rgbBase = `${rC}, ${gC}, ${bC}`;

        const len = this._rain.length;

        for (let i = 0; i < len; i++) {
            const pt = this._rain[i];
            
            // 1. PHYSICS
            pt.turbulence += 0.025;
            const turbX = Math.sin(pt.turbulence) * 0.4;
            
            const speedFactor = (1 + this._windSpeed * 0.25) * (pt.z * 0.8 + 0.2);
            const moveX = (effectiveWind * 1.8 + turbX);
            const moveY = (pt.speedY * speedFactor);

            pt.x += moveX;
            pt.y += moveY;

            // Wrapping
            if (pt.y > h + 10) {
                pt.y = -40 - (Math.random() * 20);
                pt.x = Math.random() * w;
            }
            if (pt.x > w + 20) pt.x = -20;
            else if (pt.x < -20) pt.x = w + 20;

            // 2. VISUALS
            
            // Calculate stretch based on Z-depth
            const depthStretch = 0.5 + (pt.z * 1.0);
            const stretch = (1.0 + (this._windSpeed * 0.5)) * depthStretch * 0.7;
            
            // Calculate tail using the RAW movement
            const tailX = pt.x - (moveX * stretch);
            const tailY = pt.y - (moveY * stretch);

            const baseOp = isDay ? 0.75 : 0.60; 
            const finalOp = (pt.z * baseOp) * fadeOpacity * pt.op;

            if (finalOp < 0.02) continue;

            // Keep it thick enough to see
            const width = Math.max(0.8, pt.z * 1.4);

            // --- GRADIENT WITH HIGHLIGHT ---
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
    
    
    // Snow Renderer
    _drawSnow(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.precipitation;
        if (fadeOpacity <= 0) return;
        
        const len = this._snow.length;

        for (let i = 0; i < len; i++) {
            const pt = this._snow[i];
            
            // 1. PHYSICS
            pt.wobblePhase += pt.wobbleSpeed;
            const wobble = Math.sin(pt.wobblePhase) * 1.5; 
            
            pt.turbulence += 0.01;
            const turbX = Math.sin(pt.turbulence) * 0.5;
            
            pt.y += pt.speedY;
            pt.x += wobble + turbX + effectiveWind * 0.8; 
            
            // Wrapping
            if (pt.y > h + 5) {
                pt.y = -5;
                pt.x = Math.random() * w;
            }
            if (pt.x > w + 10) pt.x = -10;
            else if (pt.x < -10) pt.x = w + 10;
            
            // 2. VISUALS
            const glimmer = 0.8 + Math.sin(pt.wobblePhase * 3) * 0.2;
            const finalOpacity = pt.op * fadeOpacity * glimmer;
            if (pt.z > 0.7) {
                // --- FOREGROUND: Soft Fluffy Gradient ---
                const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.size * 1.5);
                g.addColorStop(0, `rgba(255, 255, 255, ${finalOpacity})`);
                g.addColorStop(0.4, `rgba(255, 255, 255, ${finalOpacity * 0.6})`);
                g.addColorStop(1, `rgba(255, 255, 255, 0)`);
                
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, pt.size * 1.5, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // --- BACKGROUND: Simple Dot ---
                ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity * 0.8})`;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    

   

    // Hail
    _drawHail(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.precipitation;
        if (fadeOpacity <= 0) return;
        
        // Cache length
        const len = this._hail.length;
        
        for (let i = 0; i < len; i++) {
            const pt = this._hail[i];
            
            // 1. INLINED PHYSICS
            pt.turbulence += 0.035;
            const turbX = Math.sin(pt.turbulence) * 1.2;
            
            pt.y += pt.speedY * (1 + this._windSpeed * 0.35);
            pt.x += effectiveWind * 2.5 + turbX;
            pt.rotation += pt.rotationSpeed;
            
            // Wrapping
            if (pt.y > h + 10) {
                pt.y = -15 - (Math.random() * 20); 
                pt.x = Math.random() * w;
            }
            
            // 2. RAW DRAWING
            ctx.save();
            ctx.translate(pt.x, pt.y);
            ctx.rotate(pt.rotation);
            
            const depthOpacity = (pt.z > 1.1 ? pt.op * 1.1 : pt.op * 0.75) * fadeOpacity;
            
            // Gradient (Inlined)
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
            
            // Hexagon Shape
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
            
            // Highlight dot
            if (pt.z > 1.05) {
                ctx.fillStyle = `rgba(255, 255, 255, ${depthOpacity * 0.4})`;
                ctx.beginPath();
                ctx.arc(-pt.size * 0.3, -pt.size * 0.3, pt.size * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    }

    // LIGHTNING
    _drawLightning(ctx, w, h) {
        if (!this._params?.thunder) return;
        
        const fadeOpacity = this._layerFadeProgress.effects;
        
        // Spawn new bolts
        if (Math.random() < 0.007 && this._bolts.length < LIMITS.MAX_BOLTS) {
            this._flashOpacity = 0.4;
            this._bolts.push(this._createBolt(w, h));
        }
        
        // 1. FLASH EFFECT
        if (this._flashOpacity > 0) {
            ctx.save();
            // 'screen' flash invisible on light bg
            ctx.globalCompositeOperation = this._isThemeDark ? 'screen' : 'source-over';
            const flashColor = this._isLightBackground 
                ? `rgba(200, 210, 230, ${this._flashOpacity * fadeOpacity * 0.3})`
                : `rgba(220, 235, 255, ${this._flashOpacity * fadeOpacity})`;
            ctx.fillStyle = flashColor;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
            
            this._flashOpacity *= 0.78;
        }
        
        // 2. BOLT DRAWING
        if (this._bolts.length > 0) {
            ctx.save();
            // 'lighter' invisible on light bg
            ctx.globalCompositeOperation = this._isThemeDark ? 'lighter' : 'source-over';
            
            // Loop backwards to allow splicing
            for (let i = this._bolts.length - 1; i >= 0; i--) {
                const bolt = this._bolts[i];
                
                // Outer glow
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
                
                // Inner core
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
                
                // Branches
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
                
                // Fade out
                bolt.alpha -= 0.1;
                bolt.glow -= 0.15;
                if (bolt.alpha <= 0) this._bolts.splice(i, 1);
            }
            
            ctx.shadowBlur = 0; // Reset shadow
            ctx.restore();
        }
    }
    
    // AURORA
    _drawAurora(ctx, w, h) {
        if (!this._aurora) return;
        
        const fadeOpacity = this._layerFadeProgress.effects;
        this._aurora.phase += 0.006;
        
        // 1. RAW STATE
        ctx.save();
        // 'lighter' invisible on light bg
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
            
            // Draw Wave
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


    // FOG
    _drawFog(ctx, w, h) {
        const fadeOpacity = this._layerFadeProgress.effects;
        const len = this._fogBanks.length;
        
        for (let i = 0; i < len; i++) {
            const f = this._fogBanks[i];
            
            // Physics
            f.x += f.speed;
            f.phase += 0.008;
            
            if (f.x > w + f.w / 2) f.x = -f.w / 2;
            if (f.x < -f.w / 2) f.x = w + f.w / 2;
            
            const undulation = Math.sin(f.phase) * 5;
            
            let color;
            let opModifier = 1.0;

            if (this._isLightBackground) {
                // --- LIGHT THEME ---
                // Always use light day color on light backgrounds (regardless of time)
                color = '190, 200, 215';
                opModifier = 0.60;
            } else {
                // --- DARK THEME ---
                color = this._isTimeNight  
                    ? '85, 90, 105'    
                    : '72, 81, 95';   
            }
            
            const layerOpacity = f.opacity * (1 + f.layer * 0.2) * fadeOpacity * opModifier;
            
            // RAW STATE
            ctx.save();
            
            // --- Dynamic Vertical Squashing ---
            const vSquash = 0.1 + f.layer * 0.18; 
            ctx.scale(1, vSquash);
            
            // Gradient (Inlined)
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
        


    // SHOOTING STARS
    _drawShootingStars(ctx, w, h) {
        const fadeOpacity = this._layerFadeProgress.stars;

        // 1. SPAWN LOGIC
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

        // 2. DRAW LOOP
        ctx.save();
        
        for (let i = this._shootingStars.length - 1; i >= 0; i--) {
            const s = this._shootingStars[i];

            // Movement
            s.x += s.vx;
            s.y += s.vy;
            s.life -= 0.045; 

            // Tail Management
            s.tail.unshift({ x: s.x, y: s.y });
            if (s.tail.length > 22) s.tail.pop();

            if (s.life <= 0) {
                this._shootingStars.splice(i, 1);
                continue;
            }

            const opacity = s.life * fadeOpacity;

            // Theme-aware colors
            const isInkMode = !this._isThemeDark;
            const headColor = isInkMode ? '50, 55, 65' : '255, 255, 255';
            const tailColor = isInkMode ? '60, 65, 80' : '255, 255, 240';

            // Draw Head
            ctx.fillStyle = `rgba(${headColor}, ${opacity})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();

            // Draw Tail
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

    // COMETS
    // (Compact, High-Altitude, Tapered Tail)
    _drawComets(ctx, w, h) {
        // 1. SPAWN LOGIC
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

        // 2. DRAW LOOP
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
            
            // Theme-aware colors
            const isInkMode = !this._isThemeDark;
            
            // Head Gradient
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
            
            // Tail Loop
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


    // PLANES (Twin-Engine Contrails + Turbulence + High Visibility)
    _drawPlanes(ctx, w, h) {
        const p = this._params;
        // Don't spawn planes in bad weather
        const badWeather = ['rain', 'hail', 'lightning', 'pouring', 'snowy', 'fog'].includes(p.type);
    
        // Spawn logic: 0.5% chance per frame if array is empty
        if (!badWeather && this._planes.length === 0 && Math.random() < 0.005) {
            this._planes.push(this._createPlane(w, h));
        }
    
        // Iterate backwards to allow safe removal
        for (let i = this._planes.length - 1; i >= 0; i--) {
            const plane = this._planes[i];
    
            // Pre-compute direction and climb trig for this plane
            const dir = plane.vx > 0 ? 1 : -1;
            const sinA = Math.sin(plane.climbAngle);
            const cosA = Math.cos(plane.climbAngle);
    
            // --- 1. UPDATE PHYSICS ---
            plane.x += plane.vx;
            plane.y += plane.vy;
            
            // Gap Logic: Create clusters of "dry air"
            if (plane.gapTimer > 0) {
                plane.gapTimer--;
            } else if (Math.random() < 0.005) {
                plane.gapTimer = 5 + Math.random() * 10; 
            }
    
            // Add position to history
            plane.history.unshift({ 
                x: plane.x, 
                y: plane.y + (Math.random() - 0.5) * 1.5, // Y-Jitter for turbulence
                gap: plane.gapTimer > 0 
            });
    
            // Wind Shear: Drift the old trail points
            const windShift = (this._windSpeed || 0) * 0.15;
            for (let j = 1; j < plane.history.length; j++) {
                plane.history[j].x += windShift;
                plane.history[j].y += 0.02; // Gravity settling
            }
    
            // Limit trail length (Increased to 400 for long, majestic trails)
            if (plane.history.length > 500) plane.history.pop();
    
    
            // --- 2. DRAW VAPOR TRAIL (Layer 0: Behind Plane) ---
            if (plane.history.length > 2) {
                ctx.save();
                
                // Color & Opacity
                const baseOp = this._isThemeDark ? 0.25 : 0.50;
                const trailColor = this._isThemeDark ? "210, 220, 240" : "255, 255, 255";
    
                // Gradient Fade (Head to Tail)
                const head = plane.history[0];
                const tail = plane.history[plane.history.length - 1];
                const grad = ctx.createLinearGradient(head.x, head.y, tail.x, tail.y);
                
                grad.addColorStop(0, `rgba(${trailColor}, 0)`);       // Transparent start
                grad.addColorStop(0.05, `rgba(${trailColor}, ${baseOp})`); // Fade in
                grad.addColorStop(0.6, `rgba(${trailColor}, ${baseOp * 0.6})`); 
                grad.addColorStop(1, `rgba(${trailColor}, 0)`);       // Fade out
    
                ctx.strokeStyle = grad;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.lineWidth = 3 * plane.scale; 
    
                // Draw path twice (Twin Engines) offset by +/- 3 pixels
                // Rotation matrix applied to perpendicular offset so trails
                // stay attached to wings when the plane is tilted
                [3, -3].forEach(offset => {
                    ctx.beginPath();
                    let isDrawing = false;
                    
                    for (let k = 0; k < plane.history.length; k++) {
                        const pt = plane.history[k];
                        
                        // Lift pen if we hit a gap
                        if (pt.gap) {
                            isDrawing = false;
                            continue;
                        }
    
                        // Rotated perpendicular engine offset
                        const oX = sinA * offset * plane.scale * dir;
                        const oY = cosA * offset * plane.scale;
                        const drawX = pt.x + oX;
                        const drawY = pt.y + oY;
    
                        if (!isDrawing) {
                            ctx.moveTo(drawX, drawY);
                            isDrawing = true;
                        } else {
                            ctx.lineTo(drawX, drawY);
                        }
                    }
                    ctx.stroke();
                });
                ctx.restore();
            }


        // --- 3. DRAW PLANE BODY (Layer 1: On Top) ---
        // This restores your EXACT original geometry logic
        ctx.save();
        ctx.translate(plane.x, plane.y);
        ctx.scale(plane.scale, plane.scale);

        // Rotate body so the nose points along the flight path
        if (plane.climbAngle > 0) {
            ctx.rotate(-plane.climbAngle * dir);
        }
        
        // Body Color:
        // Light Theme: Dark Steel (visible against sky)
        // Dark Theme: Lighter Grey (visible against dark)
        const bodyColor = this._isThemeDark ? '100, 110, 120' : '80, 85, 95';
        
        ctx.strokeStyle = `rgba(${bodyColor}, 0.9)`;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Original Geometry
        ctx.beginPath();
        ctx.moveTo(6 * dir, 0);       // Nose
        ctx.lineTo(-6 * dir, 0);      // Body
        ctx.moveTo(-5 * dir, 0);
        ctx.lineTo(-8 * dir, -4);     // Tail Fin
        ctx.moveTo(1 * dir, 0);
        ctx.lineTo(-2 * dir, 2);      // Near Wing
        ctx.stroke();
        
        // Strobe Light
        plane.blinkPhase += 0.12;
        if (Math.sin(plane.blinkPhase) > 0.8) {
            const strobeColor = plane.vx > 0 ? "50, 255, 80" : "255, 50, 50";
            ctx.fillStyle = `rgba(${strobeColor}, 0.9)`;
            ctx.beginPath(); 
            ctx.arc(0, 1, 1.5, 0, Math.PI * 2); 
            ctx.fill();
        }
        
        ctx.restore(); // Undo translate/scale


        // --- 4. CLEANUP ---
        // Despawn if far off screen (buffer increased for long trails)
        if (plane.x < -450 || plane.x > w + 450) {
            this._planes.splice(i, 1);
        }
    }
}




    
    
    // BIRDS (Bi-Directional + Dynamic Depth/Size/Speed)
    _drawBirds(ctx, w, h) {
        // 1. Clean Up Off-Screen Birds First
        for (let i = this._birds.length - 1; i >= 0; i--) {
            const b = this._birds[i];
            b.x += b.vx;
            b.y += b.vy;
            b.flapPhase += b.flapSpeed;

            // Despawn if fully off-screen (with buffer)
            const isOffRight = b.vx > 0 && b.x > w + 100;
            const isOffLeft = b.vx < 0 && b.x < -100;

            if (isOffRight || isOffLeft) {
                this._birds.splice(i, 1);
            }
        }

        // 2. Spawn Logic
        const p = this._params;
        const isSevereWeather = p.thunder || p.type === 'hail' || p.type === 'pouring';
        const maxBirds = 20; // Safety limit

        // Spawn if background is light (regardless of time) and weather permits
        if (this._isLightBackground && !isSevereWeather && this._birds.length === 0) {
            
            // A. Direction (1 = Right, -1 = Left)
            const dir = Math.random() > 0.5 ? 1 : -1;
            const startX = dir === 1 ? -60 : w + 60;
            
            // B. Depth Scale (0.9x to 1.2x) - Applies to Size, Speed, AND Formation spacing
            const depthScale = 0.9 + Math.random() * 0.5; 
            
            // C. Speed (Linked to depth: Closer = Faster)
            const baseSpeed = (0.9 + Math.random() * 0.5);
            const finalSpeed = baseSpeed * depthScale * dir;

            // D. Flock Config
            const isSingle = Math.random() < 0.3;
            const flockSize = isSingle ? 1 : 5 + Math.floor(Math.random() * 8);
            const startY = h * 0.20 + Math.random() * (h * 0.30);
            
            // LEADER
            this._birds.push({
                x: startX, 
                y: startY, 
                vx: finalSpeed, 
                vy: (Math.random() - 0.5) * 0.1,
                flapPhase: 0, 
                flapSpeed: 0.15 + Math.random() * 0.05,
                // Base Leader Size is 2.4 -> Scaled
                size: 2.4 * depthScale
            });

            // FOLLOWERS
            if (!isSingle) {
                const formation = Math.floor(Math.random() * 3); // 0:V-Shape, 1:Line, 2:Cluster
                const ySlope = Math.random() > 0.5 ? 1 : -1;     // Slope direction for lines

                for (let i = 1; i < flockSize; i++) {
                    // Calculate raw offsets
                    let offX = 0, offY = 0;

                    if (formation === 0) { // V-Shape
                        const row = Math.floor((i + 1) / 2);
                        const side = i % 2 === 0 ? 1 : -1;
                        offX = -15 * row; 
                        offY = 8 * row * side;
                    } else if (formation === 1) { // Line
                        offX = -18 * i;
                        offY = 10 * i * ySlope;
                    } else { // Cluster
                        offX = -15 * i + (Math.random() - 0.5) * 20;
                        offY = (Math.random() - 0.5) * 40;
                    }

                    // Apply Depth Scale to offsets too (Perspective correctness)
                    // If bird is 50% size, it should be 50% closer to neighbor
                    const scaledOffX = offX * depthScale;
                    const scaledOffY = offY * depthScale;

                    this._birds.push({
                        // Flip X offset based on direction so they always trail behind
                        x: startX + (scaledOffX * dir), 
                        y: startY + scaledOffY,
                        vx: finalSpeed, 
                        vy: (Math.random() - 0.5) * 0.05,
                        flapPhase: i + Math.random(),
                        flapSpeed: 0.15 + Math.random() * 0.05,
                        // Base Follower Size is 1.8 -> Scaled
                        size: (1.8 + Math.random() * 0.6) * depthScale
                    });
                }
            }
        }

        if (this._birds.length === 0) return;

        // 3. Draw Loop
        const birdColor = this._isLightBackground ? 'rgba(40, 45, 50, 0.8)' : 'rgba(200, 210, 220, 0.6)'; 

        ctx.save();
        ctx.strokeStyle = birdColor;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        const len = this._birds.length;
        for (let i = 0; i < len; i++) {
            const b = this._birds[i];

            // PHYSICS: Natural Gliding
            const envelope = Math.sin(b.flapPhase * 0.35); 
            // Scale wing offset by size so big birds flap bigger
            const wingOffset = Math.sin(b.flapPhase) * b.size * Math.max(0, envelope);
            
            // Draw Direction: Tail opposite to velocity
            // If vx > 0 (Right), Tail is Left (-size).
            const dir = b.vx > 0 ? 1 : -1;

            // Line Width relative to size (0.5 * size)
            ctx.lineWidth = Math.max(0.8, b.size * 0.5);

            ctx.beginPath();
            // Tail/Left Wing
            ctx.moveTo(b.x - (b.size * dir), b.y + wingOffset - (1 * (b.size/2.4))); 
            // Nose
            ctx.lineTo(b.x, b.y);
            // Tail/Right Wing
            ctx.lineTo(b.x - (b.size * dir), b.y + wingOffset + (1 * (b.size/2.4))); 
            ctx.stroke();
        }
        
        ctx.restore();
    }
    

    // LEAVES
    _drawLeaves(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.effects;
        if (fadeOpacity <= 0) return;
        
        for (let i = 0; i < this._leaves.length; i++) {
            const leaf = this._leaves[i];
            
            // 1. INLINED PHYSICS
            leaf.wobblePhase += 0.04;
            const wobble = Math.sin(leaf.wobblePhase) * 0.5;
            
            leaf.y += (1 + Math.sin(leaf.wobblePhase * 0.5) * 0.5) * (1 + this._windSpeed * 0.4) * leaf.z;
            leaf.x += (effectiveWind * 2 + wobble) * leaf.z;
            leaf.rotation += leaf.spinSpeed * (1 + this._windSpeed * 0.25);
            
            // Vertical Wrap (Inlined)
            if (leaf.y > h + 15) {
                leaf.y = -15 - (Math.random() * 20);
                leaf.x = Math.random() * w;
                // Reset turbulence if it exists (leaves don't usually track it, but good practice)
            }
            
            // Horizontal Wrap (Inlined)
            if (leaf.x > w + 15) leaf.x = -15;
            if (leaf.x < -15) leaf.x = w + 15;
            
            // 2. RAW DRAWING
            ctx.save();
            ctx.translate(leaf.x, leaf.y);
            ctx.rotate(leaf.rotation);
            
            ctx.globalAlpha = (0.7 + leaf.z * 0.3) * fadeOpacity;
            ctx.fillStyle = leaf.color;
            
            // Leaf shape
            ctx.beginPath();
            ctx.ellipse(0, 0, leaf.size * 0.6, leaf.size * 1.6, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Vein
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(0, -leaf.size * 1.4);
            ctx.lineTo(0, leaf.size * 1.4);
            ctx.stroke();
            
            ctx.restore();
        }
    }


    // DUST MOTES
    _drawDustMotes(ctx, w, h) {
        if (!this._shouldShowSun()) return;
        
        const fadeOpacity = this._layerFadeProgress.effects;
        
        // 1. RAW STATE
        ctx.save();
        // 'lighter' invisible on light backgrounds
        ctx.globalCompositeOperation = this._isThemeDark ? 'lighter' : 'source-over';
        
        const len = this._dustMotes.length;
        // Mote color depends on theme
        const moteColor = this._isLightBackground ? '180, 160, 100' : '255, 250, 220';
        
        for (let i = 0; i < len; i++) {
            const mote = this._dustMotes[i];
            
            // 2. PHYSICS
            mote.phase += 0.015;
            mote.x += mote.speedX + Math.sin(mote.phase) * 0.15;
            mote.y += mote.speedY + Math.cos(mote.phase * 0.7) * 0.1;
            
            // 3. INLINED WRAPPING
            if (mote.x > w + 5) mote.x = -5;
            if (mote.x < -5) mote.x = w + 5;
            
            // Vertical Wrap
            if (mote.y > h + 5) mote.y = -5;
            if (mote.y < -5) mote.y = h + 5;
            
            const twinkle = Math.sin(mote.phase * 2) * 0.3 + 0.7;
            const finalOpacity = mote.opacity * twinkle * fadeOpacity * 2.0;
            
            // 4. RAW DRAWING
            ctx.fillStyle = `rgba(${moteColor}, ${finalOpacity})`;
            ctx.beginPath();
            ctx.arc(mote.x, mote.y, mote.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }


    // MOON: Fixed Body, Dynamic Glow
    // Daylight moon (pale ghostly disc) on light backgrounds
    _drawMoon(ctx, w, h) {
        if (!this._isTimeNight) return;
        
        // 1. Safety Checks
        if (!this._stateInitialized || !this._renderGate.isRevealed) return;
        
        // 2. Visibility Logic
        const cloudCover = this._params?.cloud || 0;
        const moonVisibility = cloudCover > 30 ? 0.4 : cloudCover > 20 ? 0.6 : cloudCover > 10 ? 0.8 : 1;
        
        const fadeOpacity = this._layerFadeProgress.stars * moonVisibility;
        if (fadeOpacity <= 0.05) return;
        
        this._moonAnimPhase += 0.003;
        
        // 3. Position & Sizes
        const celestial = this._getCelestialPosition(w);
        const moonX = celestial.x;
        const moonY = celestial.y;
        const moonRadius = 18; 
        const glowRadius = h * 0.65;

        // Rendering mode
        const isDayMoon = !this._isThemeDark; // Light background → pale daylight moon

        ctx.save();
        
        // --- A. ATMOSPHERIC GLOW ---
        const glowIntensity = 0.23 + this._moonPhaseConfig.illumination * 0.18;
        const effectiveGlow = glowIntensity * fadeOpacity * moonVisibility;
        
        if (isDayMoon) {
            // DAYLIGHT MOON: Very subtle pale brightening — barely there
            ctx.globalCompositeOperation = 'source-over';
            const glowRadiusDM = glowRadius * 0.3;
            const dmGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, glowRadiusDM);
            dmGlow.addColorStop(0,   `rgba(255, 255, 255, ${effectiveGlow * 0.10})`);
            dmGlow.addColorStop(0.5, `rgba(240, 245, 255, ${effectiveGlow * 0.04})`);
            dmGlow.addColorStop(1,   'rgba(230, 240, 255, 0)');
            
            ctx.fillStyle = dmGlow;
            ctx.beginPath();
            ctx.arc(moonX, moonY, glowRadiusDM, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // NIGHT GLOW: Original screen-blended atmospheric glow
            ctx.globalCompositeOperation = 'screen';
            const glowGrad = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, glowRadius);
            
            glowGrad.addColorStop(0, `rgba(180, 200, 255, ${effectiveGlow})`);
            glowGrad.addColorStop(0.5, `rgba(165, 195, 245, ${effectiveGlow * 0.4})`);
            glowGrad.addColorStop(1, 'rgba(150, 180, 220, 0)');
            
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(moonX, moonY, glowRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalCompositeOperation = 'source-over';

        // --- B. STAR BLOCKER (Clean Cutout) ---
        // Skip on daylight moon (no stars to block) 
        if (!isDayMoon && this._moonPhaseConfig.illumination > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(moonX, moonY, moonRadius - 0.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 1)';
            ctx.fill();
            ctx.restore();
        }
        
        // --- C. MOON BODY ---
        ctx.save();
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
        ctx.clip();
        
        const illumination = this._moonPhaseConfig.illumination;
        const direction = this._moonPhaseConfig.direction;
        
        if (illumination <= 0) {
            // New Moon
            if (isDayMoon) {
                // Daylight new moon: almost invisible faint grey outline
                ctx.fillStyle = `rgba(200, 210, 225, ${0.20 * fadeOpacity})`;
                ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2); ctx.fill();
            } else {
                ctx.fillStyle = `rgba(40, 45, 55, ${0.8 * fadeOpacity})`; 
                ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = `rgba(80, 90, 110, ${0.15 * fadeOpacity})`;
                ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2); ctx.fill();
            }
        } else if (illumination >= 1) {
            // Full Moon
            const moonGrad = ctx.createRadialGradient(
                moonX - moonRadius * 0.3, moonY - moonRadius * 0.3, 0,
                moonX, moonY, moonRadius
            );
            if (isDayMoon) {
                // Daylight full moon: visible pale disc, blue-gray at edges
                moonGrad.addColorStop(0,   `rgba(255, 255, 255, ${0.85 * fadeOpacity})`);
                moonGrad.addColorStop(0.5, `rgba(238, 242, 250, ${0.78 * fadeOpacity})`);
                moonGrad.addColorStop(1,   `rgba(210, 220, 238, ${0.65 * fadeOpacity})`);
            } else {
                moonGrad.addColorStop(0, `rgba(255, 255, 250, ${0.95 * fadeOpacity})`);
                moonGrad.addColorStop(0.7, `rgba(230, 235, 245, ${0.9 * fadeOpacity})`);
                moonGrad.addColorStop(1, `rgba(200, 210, 230, ${0.85 * fadeOpacity})`);
            }
            
            ctx.fillStyle = moonGrad;
            ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2); ctx.fill();
        } else {
            // Partial Phases — shadow side first
            if (isDayMoon) {
                // Daylight: shadow side is soft gray, visible but receded
                ctx.fillStyle = `rgba(195, 205, 220, ${0.45 * fadeOpacity})`;
            } else {
                ctx.fillStyle = `rgba(35, 40, 50, ${0.9 * fadeOpacity})`;
            }
            ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2); ctx.fill();

            if (!isDayMoon) {
                // Earthshine (night only — invisible on daylight moon)
                const earthshineOp = (1 - illumination) * 0.08 * fadeOpacity;
                ctx.fillStyle = `rgba(100, 115, 145, ${earthshineOp})`;
                ctx.beginPath();
                ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
                ctx.fill();
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
            if (isDayMoon) {
                // Daylight: lit face is pale white, clearly visible
                moonGrad.addColorStop(0,   `rgba(255, 255, 255, ${0.82 * fadeOpacity})`);
                moonGrad.addColorStop(0.6, `rgba(240, 244, 252, ${0.72 * fadeOpacity})`);
                moonGrad.addColorStop(1,   `rgba(218, 228, 242, ${0.58 * fadeOpacity})`);
            } else {
                moonGrad.addColorStop(0, `rgba(255, 255, 250, ${0.95 * fadeOpacity})`);
                moonGrad.addColorStop(0.6, `rgba(235, 240, 248, ${0.9 * fadeOpacity})`);
                moonGrad.addColorStop(1, `rgba(210, 220, 235, ${0.85 * fadeOpacity})`);
            }
            
            ctx.fillStyle = moonGrad;
            ctx.fill();
        }
        
        ctx.restore(); // End Clipping
        
        // --- D. CRATERS ---
        if (illumination > 0.05) {
            const op = fadeOpacity * Math.min(1, illumination * 4.0); 
            
            if (isDayMoon) {
                // Daylight craters: very subtle gray marks on the pale disc
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
                // Night craters: original dark marks on bright body
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


    // HEAT SHIMMER FOR HOT SUNNY DAYS
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
        
        // Loop unrolled? No, simple loop of 3 is fine to keep structure
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
        // Check visibility - don't animate if not visible
        if (!this.isConnected || this._animID === null || !this._isVisible) {
            this._stopAnimation();
            return;
        }

        // --- OPTIMIZATION: FPS THROTTLE ---
        const targetInterval = 1000 / PERFORMANCE_CONFIG.TARGET_FPS;
        const deltaTime = timestamp - this._lastFrameTime;

        if (deltaTime < targetInterval) {
            this._animID = requestAnimationFrame(this._boundAnimate);
            return;
        }
        
        // Update lastFrameTime to maintain steady pace
        this._lastFrameTime = timestamp - (deltaTime % targetInterval);
        this._frameCount++;
        
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

        // Clear canvases
        bg.clearRect(0, 0, w * 2, h * 2);
        mid.clearRect(0, 0, w * 2, h * 2);
        fg.clearRect(0, 0, w * 2, h * 2);

        // Skip rendering celestial bodies until render gate is open
        if (!this._stateInitialized || !this._renderGate.isRevealed) {
            this._animID = requestAnimationFrame(this._boundAnimate);
            return;
        }

        // Update wind
        this._gustPhase += 0.012;
        this._microGustPhase += 0.03;
        this._windGust = Math.sin(this._gustPhase) * 0.35 + 
                         Math.sin(this._gustPhase * 2.1) * 0.15 +
                         Math.sin(this._microGustPhase) * 0.08;
        const effectiveWind = ((p.wind || 0.1) + this._windGust) * (1 + this._windSpeed);
        
        // Update phase counters
        this._rayPhase += 0.008;
        this._atmospherePhase += 0.005;
        const cloudGlobalOp = this._isThemeDark ? 0.75 : 0.85;

        // ---- BACKGROUND LAYER ----
        
        // Sun atmosphere (sunny days)
        if (this._shouldShowSun()) {
            this._drawSunGlow(bg, w, h);
        }

        // Aurora
        this._drawAurora(mid, w, h);

        // Stars
        const starFade = this._layerFadeProgress.stars;
        // Determine ink mode (night sky on light background)
        const isInkMode = !this._isThemeDark; // Light background → draw dark stars
        
        if (starFade > 0.01) {
            // Cache length
            const len = this._stars.length;
            
            for (let i = 0; i < len; i++) {
                const s = this._stars[i];
                
                // 1. PHYSICS
                s.phase += s.rate;
                const twinkleVal = Math.sin(s.phase) + (Math.sin(s.phase * 3) * 0.5);
                
                // 2. DYNAMIC PROPERTIES
                const sizePulse = 1 + (twinkleVal * 0.25);
                const currentSize = s.baseSize * sizePulse;
                
                // PHYSICS: Atmospheric Extinction
                // Stars near the bottom (y approaches h) fade out.
                // Power of 3 makes the fade exponential (only affects very low stars)
                // DISABLE fade in standalone mode (so stars are visible at bottom)
                const horizonFade = (this._config.card_style === 'standalone') 
                    ? 1.0 
                    : (1 - Math.pow(s.y / (h * 0.95), 3));
                
                const opacityPulse = 1 + (twinkleVal * 0.15);
                // Apply horizonFade to the final calculation
                const finalOpacity = Math.min(1, Math.max(0.0, s.brightness * opacityPulse * starFade * horizonFade));
                
                if (finalOpacity <= 0.05) continue;

                // 3. COLOR
                let dynamicColor;
                if (isInkMode) {
                    // INK MODE: Dark charcoal dots on light background
                    // Subtle hue variation: warm-gray to cool-gray
                    const inkLight = 25 + (twinkleVal * 3); // 22-28% lightness
                    const inkSat = 8 + (twinkleVal * 2);     // Low saturation
                    dynamicColor = `hsla(220, ${inkSat}%, ${inkLight}%,`;
                } else {
                    // GLOW MODE: Original bright star colors
                    const shift = twinkleVal * 5;
                    const dynamicHue = s.hsl.h + shift;
                    const dynamicLight = s.hsl.l + (twinkleVal * 2); 
                    dynamicColor = `hsla(${dynamicHue}, ${s.hsl.s}%, ${dynamicLight}%,`;
                }

                // 4. DRAWING
                if (s.tier === 'hero') {
                    bg.save();
                    
                    if (isInkMode) {
                        // INK MODE: No additive blending on light backgrounds
                        bg.globalCompositeOperation = 'source-over';
                        
                        // Solid core (slightly larger for visibility)
                        bg.fillStyle = `${dynamicColor} ${finalOpacity * 0.9})`;
                        bg.beginPath();
                        bg.arc(s.x, s.y, currentSize * 0.7, 0, Math.PI * 2);
                        bg.fill();

                        // Subtle dark halo instead of bloom
                        const haloGrad = bg.createRadialGradient(s.x, s.y, currentSize * 0.7, s.x, s.y, currentSize * 2.0);
                        haloGrad.addColorStop(0, `${dynamicColor} ${finalOpacity * 0.15})`);
                        haloGrad.addColorStop(1, `${dynamicColor} 0)`);
                        
                        bg.fillStyle = haloGrad;
                        bg.beginPath();
                        bg.arc(s.x, s.y, currentSize * 2.0, 0, Math.PI * 2);
                        bg.fill();
                    } else {
                        // GLOW MODE: Original additive blending
                        bg.globalCompositeOperation = 'lighter';
                        
                        // Solid Core
                        bg.fillStyle = `${dynamicColor} ${finalOpacity})`;
                        bg.beginPath();
                        bg.arc(s.x, s.y, currentSize * 0.6, 0, Math.PI * 2);
                        bg.fill();

                        // Bloom
                        const grad = bg.createRadialGradient(s.x, s.y, currentSize * 0.6, s.x, s.y, currentSize * 3.0);
                        grad.addColorStop(0, `${dynamicColor} ${finalOpacity * 0.25})`); 
                        grad.addColorStop(1, `${dynamicColor} 0)`);
                        
                        bg.fillStyle = grad;
                        bg.beginPath();
                        bg.arc(s.x, s.y, currentSize * 3.0, 0, Math.PI * 2);
                        bg.fill();

                        // --- DIFFRACTION SPIKES ---
                        const spikeLen = currentSize * 2.0;
                        const spikeOp = finalOpacity * 0.3; 
                        
                        bg.strokeStyle = `${dynamicColor} ${spikeOp})`;
                        bg.lineWidth = 0.5;
                        bg.beginPath();
                        // Horizontal
                        bg.moveTo(s.x - spikeLen, s.y);
                        bg.lineTo(s.x + spikeLen, s.y);
                        // Vertical
                        bg.moveTo(s.x, s.y - spikeLen);
                        bg.lineTo(s.x, s.y + spikeLen);
                        bg.stroke();
                        // -------------------------------
                    }
                    
                    bg.restore();
                } else {
                    // Standard Stars
                    bg.fillStyle = `${dynamicColor} ${finalOpacity})`;
                    bg.beginPath();
                    bg.arc(s.x, s.y, currentSize * (isInkMode ? 0.6 : 0.5), 0, Math.PI * 2);
                    bg.fill();
                }
            }
        }

        // Moon (needs to cover the stars!)
        this._drawMoon(bg, w, h);

        // Night sky effects — only on dark theme (invisible/ugly on light bg)
        if (this._isNight && this._isThemeDark && this._stars.length > 0) {
            this._drawShootingStars(bg, w, h);
        }
        if (this._isThemeDark) {
            this._drawComets(bg, w, h);
        }
        

        // Sun rays — skip on dark theme (rays designed for light sky only)
        if (p.rays && !this._isNight && !this._isThemeDark) {
            this._drawLightRays(bg, w, h);
        }

        // Heat shimmer
        this._drawHeatShimmer(mid, w, h);

        // ---- MIDDLE LAYER ----
        
        // Sun clouds (for ray visibility on light theme) - drawn before main clouds
        if (this._sunClouds.length > 0) {
            this._drawSunClouds(mid, w, h, effectiveWind);
        }
        
        // --- DIFFUSE SUN FOR CLOUDY DAYS ---
        // Dark theme: draw on bg (behind all clouds). Light theme: draw on mid (between bg/fg clouds).
        if (this._shouldShowCloudySun()) {
            if (this._isThemeDark) {
                this._drawCloudySun(bg, w, h);
            }
        }

        // ---- MIDDLE LAYER (bg -> birds -> scud) ----
        // 1. Heavy Background Clouds (Furthest)
        this._drawClouds(mid, this._clouds, w, h, effectiveWind, cloudGlobalOp);
        
        // Light theme cloudy sun: between bg clouds and fg clouds (diffuse glow through cloud layer)
        if (this._shouldShowCloudySun() && !this._isThemeDark) {
            this._drawCloudySun(mid, w, h);
        }
        
        // 2. Birds (In the middle of the sky volume)
        // Drawing them here puts them IN FRONT of the big clouds...
        this._drawBirds(mid, w, h);

        // 3. Fast Scud Clouds (Closest)
        // ...but BEHIND the fast moving scud clouds.
        this._drawClouds(mid, this._fgClouds, w, h, effectiveWind, cloudGlobalOp);
        
        // Planes
        this._drawPlanes(mid, w, h);

        // Fog banks
        if (this._fogBanks.length > 0) {
            this._drawFog(mid, w, h);
        }

        // Dust motes
        this._drawDustMotes(mid, w, h);

        // ---- FOREGROUND LAYER ----
        
        // Lightning
        this._drawLightning(fg, w, h);

        // Rain
        this._drawRain(fg, w, h, effectiveWind);

        // Hail
        this._drawHail(fg, w, h, effectiveWind);

        // Snow
        this._drawSnow(fg, w, h, effectiveWind);

        // Leaves
        if (this._leaves.length > 0) {
            this._drawLeaves(fg, w, h, effectiveWind);
        }

        // Schedule next frame
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

// #endregion


const CARD_NAME = 'atmospheric-weather-card';

// SAFETY CHECK: Only define if it doesn't exist yet
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
