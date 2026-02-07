/**
 * ATMOSPHERIC WEATHER CARD
 * Version: 1.8
 * A custom Home Assistant card that renders animated weather effects.
 */
 
console.info(
  "%c ATMOSPHERIC WEATHER CARD",
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


// ============================================================================
// WEATHER CONFIGURATION
// ============================================================================
const WEATHER_MAP = Object.freeze({
    'clear-night':      Object.freeze({ type: 'stars', count: 280, cloud: 5,  wind: 0.1, rays: false, atmosphere: 'night', stars: 420 }), 
    'cloudy':           Object.freeze({ type: 'cloud', count: 0,   cloud: 50, wind: 0.3, dark: false, rays: false, atmosphere: 'overcast', stars: 40 }),
    'fog':              Object.freeze({ type: 'fog',   count: 0,   cloud: 15, wind: 0.1, rays: false, atmosphere: 'mist', foggy: true, stars: 125 }), 
    'hail':             Object.freeze({ type: 'hail',  count: 150, cloud: 28, wind: 0.8, dark: true, rays: false, atmosphere: 'storm', stars: 20 }),
    'lightning':        Object.freeze({ type: 'rain',  count: 200, cloud: 32, wind: 2.0, thunder: true, dark: true, rays: false, atmosphere: 'storm', stars: 20 }), 
    'lightning-rainy':  Object.freeze({ type: 'rain',  count: 300, cloud: 36, wind: 2.5, thunder: true, dark: true, rays: false, atmosphere: 'storm', stars: 20 }),
    'partlycloudy':     Object.freeze({ type: 'cloud', count: 0,   cloud: 20, wind: 0.2, rays: true, atmosphere: 'fair', stars: 125 }), 
    'pouring':          Object.freeze({ type: 'rain',  count: 350, cloud: 32, wind: 1.5, dark: true, rays: false, atmosphere: 'storm', stars: 20 }),
    'rainy':            Object.freeze({ type: 'rain',  count: 120, cloud: 50, wind: 0.6, rays: false, atmosphere: 'rain', stars: 40 }),
    'snowy':            Object.freeze({ type: 'snow',  count: 50, cloud: 40, wind: 0.3, rays: false, atmosphere: 'snow', stars: 40 }),
    'snowy-rainy':      Object.freeze({ type: 'mix',   count: 100, cloud: 24, wind: 0.4, rays: false, atmosphere: 'snow', stars: 125 }),
    'sunny':            Object.freeze({ type: 'sun',   count: 0,   cloud: 4,  wind: 0.1, rays: true, atmosphere: 'clear', stars: 0 }),
    'windy':            Object.freeze({ type: 'cloud', count: 0,   cloud: 16, wind: 1.8, leaves: true, rays: false, atmosphere: 'windy', stars: 125 }),
    'windy-variant':    Object.freeze({ type: 'cloud', count: 0,   cloud: 22, wind: 2.0, dark: false, leaves: true, rays: false, atmosphere: 'windy', stars: 125 }),
    'exceptional':      Object.freeze({ type: 'sun',   count: 0,   cloud: 0,  wind: 0.1, rays: true, atmosphere: 'clear', stars: 420 }),
    'default':          Object.freeze({ type: 'none',  count: 0,   cloud: 4,  wind: 0.1, rays: false, atmosphere: 'fair', stars: 260 })
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
    MAX_SUN_CLOUDS: 5,
    MAX_MOON_CLOUDS: 5
});

// Performance configuration
const PERFORMANCE_CONFIG = Object.freeze({
    RESIZE_DEBOUNCE_MS: 150,        // Debounce delay for particle reinitialization
    VISIBILITY_THRESHOLD: 0.01,     // IntersectionObserver threshold (1% visible)
    REVEAL_TRANSITION_MS: 0,      // Fade-in duration after initialization
    MAX_DPR: 2.0,                   // PERFORMANCE OPTIMIZED: Lower DPR
    TARGET_FPS: 30                  // Target 30fps instead of 60/120fps
});

// //#endregion



// ============================================================================
// CLOUD SHAPE GENERATOR - Creates organic, realistic cloud shapes
// ============================================================================
class CloudShapeGenerator {
    static generateOrganicPuffs(isStorm, seed) {
        const puffs = [];
        const puffCount = isStorm ? 22 : 16;
        const baseWidth = isStorm ? 220 : 160;
        const baseHeight = isStorm ? 50 : 60;
        
        // Use seeded random for consistent cloud shapes
        const seededRandom = this._seededRandom(seed);
        
        // Create main body puffs with organic distribution
        for (let i = 0; i < puffCount; i++) {
            const angle = (i / puffCount) * Math.PI * 2 + seededRandom() * 0.5;
            const distFromCenter = seededRandom() * 0.6 + 0.2;
            
            // Elliptical distribution
            const dx = Math.cos(angle) * (baseWidth / 2) * distFromCenter;
            const dy = Math.sin(angle) * (baseHeight / 2) * distFromCenter * 0.6;
            
            // Vary radius based on position - larger in center, smaller at edges
            const centerDist = Math.sqrt(dx * dx + dy * dy) / (baseWidth / 2);
            const baseRad = isStorm ? 35 : 28;
            const rad = baseRad + seededRandom() * 20 - centerDist * 15;
            
            // Shade varies by vertical position and randomness
            const verticalShade = 0.4 + (1 - (dy + baseHeight/2) / baseHeight) * 0.4;
            const shade = verticalShade + seededRandom() * 0.2;
            
            // Softness affects edge blur
            const softness = 0.3 + seededRandom() * 0.4;
            
            puffs.push({ 
                dx, 
                dy, 
                rad: Math.max(15, rad), 
                shade: Math.min(1, shade),
                softness,
                depth: seededRandom() // For layering within cloud
            });
        }
        
        // Add detail puffs at edges for more organic look
        const detailCount = isStorm ? 12 : 8;
        for (let i = 0; i < detailCount; i++) {
            const angle = seededRandom() * Math.PI * 2;
            const dist = 0.7 + seededRandom() * 0.4;
            
            puffs.push({
                dx: Math.cos(angle) * (baseWidth / 2) * dist,
                dy: Math.sin(angle) * (baseHeight / 2) * dist * 0.5 - 10,
                rad: 12 + seededRandom() * 15,
                shade: 0.5 + seededRandom() * 0.3,
                softness: 0.5 + seededRandom() * 0.3,
                depth: 0.8 + seededRandom() * 0.2
            });
        }
        
        // Sort by depth for proper layering
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
            // Spread horizontally with slight vertical variance
            const spreadX = (i - puffCount / 2) * 12 + (seededRandom() - 0.5) * 8;
            const spreadY = (seededRandom() - 0.5) * 10;
            
            puffs.push({
                dx: spreadX,
                dy: spreadY,
                rad: 8 + seededRandom() * 10,
                shade: 0.7 + seededRandom() * 0.3,
                softness: 0.3 + seededRandom() * 0.3,
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
            // Puffy, cotton-ball like clouds
            const mainPuffCount = 10 + Math.floor(seededRandom() * 6);
            const baseWidth = 140;
            const baseHeight = 55;
            
            // Central dense area
            for (let i = 0; i < mainPuffCount; i++) {
                const angle = (i / mainPuffCount) * Math.PI * 2 + seededRandom() * 0.6;
                const dist = seededRandom() * 0.5 + 0.1;
                
                const dx = Math.cos(angle) * (baseWidth / 2) * dist;
                const dy = Math.sin(angle) * (baseHeight / 2) * dist * 0.5;
                
                puffs.push({
                    dx,
                    dy: dy - 5, // Slight upward bias for puffy top
                    rad: 20 + seededRandom() * 18,
                    shade: 0.6 + seededRandom() * 0.35,
                    softness: 0.25 + seededRandom() * 0.25,
                    depth: seededRandom() * 0.6
                });
            }
            
            // Puffy top billows
            for (let i = 0; i < 5; i++) {
                const angle = Math.PI * 0.3 + seededRandom() * Math.PI * 0.4;
                puffs.push({
                    dx: Math.cos(angle) * (baseWidth / 2) * (0.4 + seededRandom() * 0.3),
                    dy: -baseHeight / 2 * (0.3 + seededRandom() * 0.4),
                    rad: 15 + seededRandom() * 12,
                    shade: 0.75 + seededRandom() * 0.25,
                    softness: 0.2 + seededRandom() * 0.2,
                    depth: 0.7 + seededRandom() * 0.3
                });
            }
            
            // Flatter base
            for (let i = 0; i < 4; i++) {
                puffs.push({
                    dx: (seededRandom() - 0.5) * baseWidth * 0.7,
                    dy: baseHeight / 2 * 0.3 + seededRandom() * 5,
                    rad: 18 + seededRandom() * 12,
                    shade: 0.4 + seededRandom() * 0.2,
                    softness: 0.35 + seededRandom() * 0.25,
                    depth: 0.2 + seededRandom() * 0.3
                });
            }
        } else if (variety === 'stratus') {
            // Flat, layered clouds
            const layerCount = 3 + Math.floor(seededRandom() * 2);
            const baseWidth = 200;
            
            for (let layer = 0; layer < layerCount; layer++) {
                const layerY = layer * 12 - 10;
                const puffsInLayer = 8 + Math.floor(seededRandom() * 4);
                
                for (let i = 0; i < puffsInLayer; i++) {
                    puffs.push({
                        dx: (seededRandom() - 0.5) * baseWidth,
                        dy: layerY + (seededRandom() - 0.5) * 8,
                        rad: 15 + seededRandom() * 20,
                        shade: 0.5 + seededRandom() * 0.3 + layer * 0.1,
                        softness: 0.4 + seededRandom() * 0.3,
                        depth: layer / layerCount + seededRandom() * 0.2
                    });
                }
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

// //#endregion
// ============================================================================
// #region 3. MAIN CARD CLASS
// ============================================================================

class AtmosphericWeatherCard extends HTMLElement {
    
    // ========================================================================
    // 3.1 SETUP & LIFECYCLE
    // ========================================================================
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Animation state
        this._animID = null;
        this._lastFrameTime = 0;
        this._frameCount = 0;
        
        // Particle arrays
        this._particles = [];
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
        this._satellites = [];
        this._dustMotes = [];
        this._sunClouds = [];
        this._moonClouds = [];
        
        // Weather parameters
        this._params = WEATHER_MAP['default'];
        this._flashOpacity = 0;
        this._isNight = false;
        this._lastState = null;
        
        // State initialization
        this._stateInitialized = false;
        
        // Moon phase tracking
        this._moonPhaseState = 'full_moon';
        this._moonPhaseConfig = MOON_PHASES['full_moon'];
        
        // Wind simulation
        this._windGust = 0;
        this._gustPhase = 0;
        this._windSpeed = 0.1;
        this._microGustPhase = 0;
        
        // Complex transition variables
        // simple fade trackers to ensure opacity stays at 1
        this._layerFadeProgress = {
            stars: 1,
            clouds: 1,
            precipitation: 1,
            effects: 1
        };
        
        // Special effects
        this._aurora = null;
        this._rayPhase = 0;
        this._moonAnimPhase = 0;
        this._heatShimmerPhase = 0;
        this._atmospherePhase = 0;
        
        // Theme detection
        this._bgColor = null;
        this._bgLuminance = 0.5;
        this._isLightBackground = false;
        
        // Lifecycle
        this._initialized = false;
        this._cloudsSorted = false;
        
        // Enhanced resize handling
        this._resizeDebounceTimer = null;
        this._lastResizeTime = 0;
        this._pendingResize = false;
        this._cachedDimensions = { width: 0, height: 0, dpr: 1 };
        
        // Track the width we last generated particles for (Prevents "Jump")
        this._lastInitWidth = 0;
        
        // Zero-pop initialization gate
        this._renderGate = {
            hasValidDimensions: false,
            hasFirstHass: false,
            isRevealed: false
        };
        
        // Visibility-based animation control
        this._isVisible = false;
        this._intersectionObserver = null;
        
        // Error state tracking
        this._entityErrors = new Map();
        this._lastErrorLog = 0;
        
        // Bind methods
        this._boundAnimate = this._animate.bind(this);
        this._boundResize = this._handleResize.bind(this);
        this._boundVisibilityChange = this._handleVisibilityChange.bind(this);
		this._boundTap = this._handleTap.bind(this);
		
		// Single flag to prevent double-initialization
        this._initializationComplete = false;
		
		// Cache for text values to prevent DOM thrashing
        this._lastTempStr = null;
        this._lastLocStr = null;
		
		// PERFORMANCE CACHE
        this._cachedWeather = null;
        this._cachedSun = null;
        this._cachedMoon = null;
        this._cachedTheme = null;
        this._cachedStatus = null;
        this._cachedLanguage = null;
        
        // STYLE CACHE
        this._prevStyleSig = null;
    }

    _initDOM() {
        if (this._initialized) return;
        this._initialized = true;

        // --- OFFSET FEATURE ---
        if (this._config.offset) {
            this.style.margin = this._config.offset;
        }

        const style = document.createElement('style');
        style.textContent = `
            :host { 
                display: flex;
                flex-direction: column;
                width: 100%;
                position: relative;
                background: transparent !important;
                min-height: 200px;
            }

            #card-root {
                position: relative;
                width: 100%;
                height: 100%;
                z-index: -1; /* <--- Immersive Mode, pulls it behind other cards */		
                overflow: hidden;
                border-radius: var(--ha-card-border-radius, 12px);
                background: transparent; 
                display: block;      
                transform: translateZ(0);
                will-change: transform, opacity;
                opacity: 0;
                transition: opacity ${PERFORMANCE_CONFIG.REVEAL_TRANSITION_MS}ms ease-out;
            }
			
			#card-root.standalone {
				z-index: 1;
			}

            #card-root.revealed {
                opacity: 1;
            }

            #card-root.full-width {
                margin: 0px calc(var(--ha-view-sections-narrow-column-gap, var(--ha-card-margin, 8px)) * -1) !important;
                padding: 0px var(--ha-view-sections-narrow-column-gap, var(--ha-card-margin, 8px)) !important;
            }
            
            canvas { 
                position: absolute; 
                top: 0; left: 0; 
                width: 100%; height: 100%;
                pointer-events: none;
                --mask-vertical: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
                --mask-horizontal: linear-gradient(to right, transparent, black 20%, black 80%, transparent);
                -webkit-mask-image: var(--mask-vertical), var(--mask-horizontal);
                mask-image: var(--mask-vertical), var(--mask-horizontal);
                -webkit-mask-composite: source-in;
                mask-composite: intersect;
            }
            
            img {
                position: absolute; top: 0;
                height: 100%; width: auto; max-width: 100%;
                object-fit: contain; z-index: 2;
                user-select: none; pointer-events: none;
                border: none; outline: none;
                transition: height 0.3s ease, top 0.3s ease;
            }
            
            img[src=""], img:not([src]) { display: none; visibility: hidden; }
            
            #bg-canvas { z-index: 0; -webkit-mask-image: none !important; mask-image: none !important; }
            #mid-canvas { z-index: 1; }
            #fg-canvas { z-index: 3; }
            
            /* ============================================== */
            /* STANDALONE / CARD MODE STYLES                  */
            /* ============================================== */
            
            #card-root.standalone {
                box-shadow: var(--ha-card-box-shadow, 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12));
                border: none;
                background-color: var(--ha-card-background, var(--card-background-color, white));
                overflow: hidden;
                transition: background 0.5s ease;
            }

            /* Disable mask in standalone mode for edge-to-edge colors */
            #card-root.standalone canvas { 
                -webkit-mask-image: none !important;
                mask-image: none !important;
                --mask-vertical: none; 
                --mask-horizontal: none;
            }

            /* --- DAY MODE (SOFT & AIRY) ----------------------------- */
            /* Adjusted to be lighter and less saturated */
            
            /* Day Default: Realistic Soft Sky */
            #card-root.standalone.scheme-day {
                background: linear-gradient(160deg, #8ABCE4 0%, #E6F2FA 100%);
            }
            
            /* Day: Partly Cloudy (Very Light Blue/Grey) */
            #card-root.standalone.scheme-day.weather-partly {
                background: linear-gradient(160deg, #E0EAFC 0%, #CFDEF3 100%) !important;
            }
            
            /* Day: Cloudy (Soft Silver) */
            #card-root.standalone.scheme-day.weather-overcast {
                background: linear-gradient(160deg, #E6E9F0 0%, #eef1f5 100%) !important;
            }
            
            /* Day: Rain (Muted Blue-Grey) */
            #card-root.standalone.scheme-day.weather-rainy {
                background: linear-gradient(160deg, #D9E4EA 0%, #9FB3C0 100%) !important;
            }
            
            /* Day: Storm (Light Moody Grey - Perfectly readable) */
            #card-root.standalone.scheme-day.weather-storm {
                background: linear-gradient(160deg, #D3E5D8 0%, #94Aab5 100%) !important;
            }
            
            /* Day: Snow (Pure White/Ice) */
            #card-root.standalone.scheme-day.weather-snow {
                background: linear-gradient(160deg, #f5f7fa 0%, #c3cfe2 100%) !important;
            }

            /* --- NIGHT MODE (VOID / OLED DARK) ---------------------- */
            /* Desaturated to remove the "Bright Blue" look */

            /* Night Default: Deepest Space Grey */
            #card-root.standalone.scheme-night {
                background: linear-gradient(160deg, #050505 0%, #101018 100%);
            }

            /* Night: Partly Cloudy (Dark Charcoal) */
            #card-root.standalone.scheme-night.weather-partly {
                background: linear-gradient(160deg, #0f0f10 0%, #181820 100%) !important;
            }

            /* Night: Cloudy (Black Mist) */
            #card-root.standalone.scheme-night.weather-overcast {
                background: linear-gradient(160deg, #101010 0%, #202020 100%) !important;
            }

            /* Night: Rain (Very Dark Desaturated Navy) */
            #card-root.standalone.scheme-night.weather-rainy {
                background: linear-gradient(160deg, #050508 0%, #0a0a15 100%) !important;
            }

            /* Night: Storm (Pure Void) */
            #card-root.standalone.scheme-night.weather-storm {
                background: linear-gradient(160deg, #000000 0%, #0a0a0a 100%) !important;
            }
            
            /* Night: Snow (Darkest Frozen Grey) */
            #card-root.standalone.scheme-night.weather-snow {
                background: linear-gradient(160deg, #08080a 0%, #15151a 100%) !important;
            }
            
            /* ============================================== */
            /* TEXT OVERLAY STYLES                            */
            /* ============================================== */

            #temp-text, #loc-text {
                position: absolute; z-index: 10;
                pointer-events: none;
                font-family: var(--ha-font-family, var(--paper-font-body1_-_font-family, sans-serif));
                transition: color 0.3s ease;
                display: none; 
            }

            #card-root.standalone #temp-text,
            #card-root.standalone #loc-text { 
			display: flex;
			}

            /* --- TEMPERATURE --- */
            #temp-text {
                top: var(--ha-space-4, 16px);
                font-size: clamp(26px, 10cqw, 46px); 
                font-weight: 600; 
                line-height: 1;
                letter-spacing: -1px;
				align-items: flex-start;
				gap: 6px;
            }
            
            /* The unit (e.g. °C) - Smaller and lighter */
            .temp-unit {
                font-size: 0.5em;
                font-weight: 500;
                padding-top: 6px;
                opacity: 0.8;
            }

            /* --- LOCATION --- */
            #loc-text {
                bottom: var(--ha-space-4, 16px);
                font-size: 15px;
                font-weight: 500;
                opacity: 0.7;
                letter-spacing: 0.5px;
                white-space: nowrap;
                text-overflow: ellipsis;
                overflow: hidden;
                max-width: 160px;
				align-items: center;
				gap: 6px;
            }
            
            /* Map Marker Icon (SVG Mask) */
            #loc-text::before {
                content: '';
                display: inline-block;
                width: 12px; 
                height: 12px;
                background-color: currentColor;
                opacity: 0.8;
                -webkit-mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13c0,-3.87 -3.13,-7 -7,-7zM12,11.5c-1.38,0 -2.5,-1.12 -2.5,-2.5s1.12,-2.5 2.5,-2.5 2.5,1.12 2.5,2.5 -1.12,2.5 -2.5,2.5z"/></svg>') no-repeat center;
                mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13c0,-3.87 -3.13,-7 -7,-7zM12,11.5c-1.38,0 -2.5,-1.12 -2.5,-2.5s1.12,-2.5 2.5,-2.5 2.5,1.12 2.5,2.5 -1.12,2.5 -2.5,2.5z"/></svg>') no-repeat center;
            }

            /* --- ALIGNMENT --- */
            /* Offset slightly to account for padding */
            .text-left { left: calc(var(--ha-space-4, 16px) + 4px); text-align: left; }
            .text-right { right: calc(var(--ha-space-4, 16px) + 4px); text-align: right; }

            /* --- COLORS --- */
            #card-root.standalone.scheme-day #temp-text,
            #card-root.standalone.scheme-day #loc-text {
                color: var(--primary-text-color, #2c3e50); 
                text-shadow: 0 1px 2px rgba(255,255,255,0.6);
            }

            #card-root.standalone.scheme-night #temp-text,
            #card-root.standalone.scheme-night #loc-text {
                color: #ffffff;
                text-shadow: 0 1px 3px rgba(0,0,0,0.6);
            }
        `;

        const root = document.createElement('div');
        root.id = 'card-root';
        
        const bg = document.createElement('canvas'); bg.id = 'bg-canvas';
        const mid = document.createElement('canvas'); mid.id = 'mid-canvas';
        const fg = document.createElement('canvas'); fg.id = 'fg-canvas';
        
        const img = document.createElement('img');
        img.onerror = () => { img.style.opacity = '0'; };
        img.onload = () => { img.style.opacity = '1'; };

        // --- TEXT ELEMENTS FOR STANDALONE MODE ---
        const tempText = document.createElement('div');
        tempText.id = 'temp-text';
        
        const locText = document.createElement('div');
        locText.id = 'loc-text';

        // 1. Append everything to root (Text added last to sit on top)
        root.append(bg, mid, img, fg, tempText, locText);
        this.shadowRoot.append(style, root);

        // 2. DEFINE CACHE ONCE (The Fix)
        // We do this AFTER creating all variables, and we include everything here.
        this._elements = { root, bg, mid, img, fg, tempText, locText };
        
        // Get canvas contexts with optimization hints
        const ctxOptions = { 
            alpha: true, 
            willReadFrequently: false 
        };
        
        const bgCtx = bg.getContext('2d', ctxOptions);
        const midCtx = mid.getContext('2d', ctxOptions);
        const fgCtx = fg.getContext('2d', ctxOptions);
        
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

        // CRITICAL FIX: Restore particles when navigating back from Settings/Tabs
        // If we have data but arrays are empty (because disconnectedCallback cleared them),
        // we must rebuild them immediately.
        if (this._initializationComplete) {
			// Just restart animation, particles already exist
			this._startAnimation();
		} else if (this._renderGate.hasFirstHass) {
			// Try to complete initialization if we were mid-setup
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
		
		// CRITICAL: Reset initialization flag so particles rebuild on reconnect
		this._initializationComplete = false;
	}
    
    _clearAllParticles() {
        this._particles = [];
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
        this._moonClouds = [];
        this._aurora = null;
    }

    // ========================================================================
    // 3.2 HOME ASSISTANT INPUTS (Public API)
    // ========================================================================
    setConfig(config) {
        if (!config.weather_entity) throw new Error("Please define your 'weather_entity'");
        
        this._config = config;

        // 1. BUILD DOM
        this._initDOM();
        
        // 2. APPLY CARD HEIGHT
        const heightConfig = config.card_height || '200px';
        const cssHeight = typeof heightConfig === 'number' ? `${heightConfig}px` : heightConfig;
        this.style.height = cssHeight;
        this.style.minHeight = cssHeight;
        
        // 3. APPLY IMAGE CONFIGURATION
        if (this._elements && this._elements.img) {
            const img = this._elements.img;
            
            // A. Scale
            const scale = config.image_scale !== undefined ? config.image_scale : 100;
            img.style.height = `${scale}%`;
            
            // B. Alignment Parser
            // Default to 'top-right' if nothing is specified
            const align = (config.image_alignment || 'top-right').toLowerCase();
            
            // Reset ALL positioning styles first to ensure clean state
            img.style.top = '';
            img.style.bottom = '';
            img.style.left = '';
            img.style.right = '';
            img.style.transform = '';

            // --- HORIZONTAL LOGIC ---
            if (align.includes('left')) {
                img.style.left = 'calc(var(--ha-view-sections-narrow-column-gap, var(--ha-card-margin, 16px)) * 1)';
                img.style.right = 'auto';
            } else {
                // Default to Right
                img.style.right = 'calc(var(--ha-view-sections-narrow-column-gap, var(--ha-card-margin, 16px)) * 1)';
                img.style.left = 'auto';
            }

            // --- VERTICAL LOGIC ---
            if (align.includes('bottom')) {
                img.style.bottom = '0';
                img.style.top = 'auto';
            } else if (align.includes('center')) {
                img.style.top = '50%';
                img.style.transform = 'translateY(-50%)';
            } else {
                // Default to Top
                img.style.top = '0';
                img.style.bottom = 'auto';
            }
        }

        // 4. SETUP ENTITIES
        this._sunEntity = config.sun_entity;
        this._hasStatusFeature = !!(config.status_entity && (config.status_image_day || config.status_image_night));
    }

    set hass(hass) {
        if (!hass || !this._config) return;

        // 1. GET ENTITIES (Fast Lookups)
        const wEntity = hass.states[this._config.weather_entity];
        const sunEntity = this._config.sun_entity ? hass.states[this._config.sun_entity] : null;
        const moonEntity = this._config.moon_phase_entity ? hass.states[this._config.moon_phase_entity] : null;
        
        // Track Theme & Status entities so manual toggles work
        const themeEntity = this._config.theme_entity ? hass.states[this._config.theme_entity] : null;
        const statusEntity = this._config.status_entity ? hass.states[this._config.status_entity] : null;
        
        // Track System Dark Mode (Sidebar Toggle)
        const sysDark = hass.themes?.darkMode;
        
        const lang = hass.locale?.language || 'en';

        // 2. PERFORMANCE SHIELD (The Fix for Lag)
        // Only return if ALL relevant inputs are identical to the last frame.
        // MODIFIED: We check .state strings for theme/status to ensure updates fire immediately.
        if (this._cachedWeather === wEntity && 
            this._cachedSun === sunEntity && 
            this._cachedMoon === moonEntity &&
            this._cachedTheme?.state === themeEntity?.state && 
            this._cachedStatus?.state === statusEntity?.state && 
            this._cachedLanguage === lang &&
            this._cachedSysDark === sysDark) {
            return; 
        }

        // Update Cache immediately
        this._cachedWeather = wEntity;
        this._cachedSun = sunEntity;
        this._cachedMoon = moonEntity;
        this._cachedTheme = themeEntity;
        this._cachedStatus = statusEntity;
        this._cachedLanguage = lang;
        this._cachedSysDark = sysDark;

        // -----------------------------------------------------------------
        // LOGIC START
        // -----------------------------------------------------------------

        // --- CONFIG & FULL WIDTH ---
        const useFullWidth = this._config.full_width === true;
        if (this._elements?.root) {
            if (useFullWidth && !this._elements.root.classList.contains('full-width')) {
                this._elements.root.classList.add('full-width');
            } else if (!useFullWidth && this._elements.root.classList.contains('full-width')) {
                this._elements.root.classList.remove('full-width');
            }
        }

        if (!wEntity) return;

        // --- MOON PHASE LOGIC ---
        if (moonEntity && moonEntity.state !== this._moonPhaseState) {
            this._moonPhaseState = moonEntity.state;
            this._moonPhaseConfig = MOON_PHASES[moonEntity.state] || MOON_PHASES['full_moon'];
        }

        // --- CALCULATE STATE (Day/Night) ---
        // We pass variables manually to ensure reactivity
        let isNight = false;
        
        // --- LOGIC CORRECTION: Handle "Auto" properly ---
        let forcedMode = null; // Tristate: true (Night), false (Day), or null (Auto)

        // 1. Check Manual Config first
        if (this._config.mode) {
            const m = this._config.mode.toLowerCase();
            if (m === 'dark' || m === 'night') forcedMode = true;
            else if (m === 'light' || m === 'day') forcedMode = false;
            // If 'auto', forcedMode remains null, allowing us to fall through to entities
        }

        // 2. Apply Hierarchy
        if (forcedMode !== null) {
             // YAML forced 'dark' or 'light' overrides everything
             isNight = forcedMode;
        } 
        else if (themeEntity && !['unavailable', 'unknown'].includes(themeEntity.state)) {
             // Theme Entity is next priority (Fixes the "Auto" bug)
             const state = themeEntity.state.toLowerCase();
             isNight = NIGHT_MODES.includes(state);
        }
        else if (sunEntity) {
             // Sun Entity is next
             const state = sunEntity.state.toLowerCase();
             isNight = state === 'below_horizon' || NIGHT_MODES.includes(state);
        }
        else {
             // Fallback to System Dark Mode
             isNight = !!sysDark;
        }
        
        const hasNightChanged = this._isNight !== isNight;
        this._isNight = isNight;
        this._isLightBackground = !isNight;

        // --- WEATHER PARAMETERS ---
        let weatherState = (wEntity.state || 'default').toLowerCase();

        if (isNight && weatherState === 'sunny') weatherState = 'clear-night';
        if (!isNight && weatherState === 'clear-night') weatherState = 'sunny';

        const key = weatherState.toLowerCase();
        let newParams = { ...(WEATHER_MAP[key] || WEATHER_MAP['default']) };
        
        if (isNight && (key === 'sunny' || key === 'clear-night')) {
            newParams = { ...newParams, type: 'stars', count: 280 };
        }
        
        // --- STANDALONE CARD STYLES (DYNAMIC) ---
        if (this._config.card_style) {
            const styleSig = `${isNight}_${newParams.atmosphere}`;
            
            if (this._prevStyleSig !== styleSig) {
                this._prevStyleSig = styleSig;
                this._elements.root.classList.add('standalone');
                
                // Clear all weather classes
                this._elements.root.classList.remove(
                    'weather-overcast', 'weather-rainy', 'weather-storm', 'weather-snow', 'weather-partly'
                );
                
                if (isNight) {
                    this._elements.root.classList.add('scheme-night');
                    this._elements.root.classList.remove('scheme-day');
                } else {
                    this._elements.root.classList.add('scheme-day');
                    this._elements.root.classList.remove('scheme-night');
                    
                    // Apply Day Moods
                    switch (newParams.atmosphere) {
                        case 'overcast':
                        case 'mist':
                        case 'fog':
                        case 'windy':
                            this._elements.root.classList.add('weather-overcast');
                            break;
                        case 'fair':
                            this._elements.root.classList.add('weather-partly');
                            break;
                        case 'rain':
                            this._elements.root.classList.add('weather-rainy');
                            break;
                        case 'storm':
                            this._elements.root.classList.add('weather-storm');
                            break;
                        case 'snow':
                            this._elements.root.classList.add('weather-snow');
                            break;
                    }
                }
            }
        } else if (this._prevStyleSig !== null) {
            this._elements.root.classList.remove('standalone', 'scheme-day', 'scheme-night', 'weather-overcast', 'weather-rainy', 'weather-storm', 'weather-snow', 'weather-partly');
            this._prevStyleSig = null;
        }
		
	    // --- TEXT DATA & POSITIONING ---
        // Safety check: ensure elements exist before accessing
        if (this._config.card_style && wEntity && this._elements?.tempText && this._elements?.locText) {
            
            // 1. Gather Data
            const temp = wEntity.attributes.temperature;
            const unit = wEntity.attributes.temperature_unit || '';
            const location = wEntity.attributes.friendly_name || '';
            
            // 2. Update Text (Only if changed)
            // Signature check prevents re-formatting numbers unnecessarily
            const currentTempSig = `${temp}_${unit}_${lang}`;
            
            if (this._lastTempStr !== currentTempSig) {
                this._lastTempStr = currentTempSig;
                
                let formattedTemp = temp;
                if (temp !== null && !isNaN(parseFloat(temp))) {
                      // Locale-aware formatting (e.g. 4.5 vs 4,5)
                      formattedTemp = new Intl.NumberFormat(lang, { 
                        maximumFractionDigits: 1, 
                        minimumFractionDigits: 0 
                    }).format(temp);
                }
                
                // HTML update for styling
                this._elements.tempText.innerHTML = `<span class="temp-val">${formattedTemp}</span><span class="temp-unit">${unit}</span>`;
            }

            if (this._lastLocStr !== location) {
                this._lastLocStr = location;
                this._elements.locText.textContent = location;
            }

            // 3. Update Positioning (Cached)
            const sunPos = parseInt(this._config.sun_moon_x_position, 10);
            const isSunLeft = !isNaN(sunPos) ? sunPos >= 0 : true;

            if (this._prevSunLeft !== isSunLeft) {
                this._prevSunLeft = isSunLeft;
                
                const targetClass = isSunLeft ? 'text-right' : 'text-left';
                const removeClass = isSunLeft ? 'text-left' : 'text-right';
                
                // Swap classes
                this._elements.tempText.classList.remove(removeClass);
                this._elements.tempText.classList.add(targetClass);
                
                this._elements.locText.classList.remove(removeClass);
                this._elements.locText.classList.add(targetClass);
            }
        }

        // --- 4. WIND LOGIC ---
        const windSpeedRaw = this._getEntityAttribute(wEntity, 'wind_speed', 0);
        const windSpeed = typeof windSpeedRaw === 'number' ? windSpeedRaw : parseFloat(windSpeedRaw) || 0;
        this._windSpeed = Math.min(Math.max(windSpeed / 10, 0), 2);

        // --- 5. IMAGE LOGIC ---
        const baseSrc = isNight ? this._config.night : this._config.day;
        const statusSrc = this._calculateStatusImage(hass, isNight);
        
        let src = statusSrc || baseSrc || '';
        if (!src) src = this._config.day || '';

        if (this._elements?.img) {
            const currentSrc = this._elements.img.getAttribute('src');
            if (src) {
                if (currentSrc !== src) {
                    this._elements.img.style.display = 'block'; 
                    this._elements.img.src = src;
                }
            } else {
                if (currentSrc) { 
                    this._elements.img.removeAttribute('src');
                    this._elements.img.style.display = 'none';
                }
            }
        }

        // --- 7. FIRST LOAD ---
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

        // --- 8. CHANGE DETECTION (ANIMATION REBOOT) ---
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
            weather_entity: 'weather.forecast_home',
            mode: 'auto',
            sun_entity: 'sun.sun',
			card_style: false,
            full_width: false,
            offset: '0px',
            sun_moon_x_position: 100,  // Positive=Left, Negative=Right
            sun_moon_y_position: 100,  // From Top
        };
    }
	
	// Enable resizing in Section views
    static getGridOptions() {
        return {
            columns: 12,      // Default width (12 = full width)
            rows: 3,          // Default height
            min_columns: 2,   // Minimum width
            min_rows: 2,      // Minimum height
            // max_columns: 12, // Optional
            // max_rows: 10,    // Optional
        };
    }

    // ========================================================================
    // 3.3 LOGIC & STATE (Calculations)
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

    // MASTER DAY / NIGHT LOGIC (Hierarchy: Mode -> Theme -> Sun -> Default)
    _calculateIsNight(hass) {
        // 1. PRIORITY: MANUAL MODE (YAML Force)
        if (this._config.mode) {
            const mode = this._config.mode.toLowerCase();
            if (mode === 'dark' || mode === 'night') return true;
            if (mode === 'light' || mode === 'day') return false;
        }

        // 2. PRIORITY: THEME ENTITY
        if (this._config.theme_entity) {
            const themeEntity = this._getEntityState(hass, this._config.theme_entity);
            if (themeEntity && themeEntity.state && themeEntity.state !== 'unavailable' && themeEntity.state !== 'unknown') {
                const state = themeEntity.state.toLowerCase();
                return NIGHT_MODES.includes(state);
            }
        }

        // 3. PRIORITY: SUN ENTITY
        if (this._config.sun_entity) {
            const sunEntity = this._getEntityState(hass, this._config.sun_entity);
            if (sunEntity && sunEntity.state) {
                const state = sunEntity.state.toLowerCase();
                return state === 'below_horizon' || NIGHT_MODES.includes(state);
            }
        }

        // 4. FALLBACK
        return false;
    }

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

    // VISIBILITY-BASED ANIMATION CONTROL (Battery Optimization)
    _handleVisibilityChange(entries) {
        const entry = entries[0];
        const wasVisible = this._isVisible;
        this._isVisible = entry.isIntersecting;
        
        if (this._isVisible && !wasVisible) {
            // Component became visible - start/resume animation
            this._startAnimation();
        } else if (!this._isVisible && wasVisible) {
            // Component became hidden - pause animation
            this._stopAnimation();
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

    // DEBOUNCED RESIZE HANDLING (Scroll Jank Prevention)
    _handleResize() {
        this._updateCanvasDimensions();
        this._scheduleParticleReinit();
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
        
        // OPTIMIZATION: Use provided dimensions if available to avoid Layout Thrashing
        let scaledWidth, scaledHeight, dpr;

        if (forceW !== null && forceH !== null) {
            dpr = Math.min(window.devicePixelRatio || 1, PERFORMANCE_CONFIG.MAX_DPR);
            scaledWidth = Math.floor(forceW * dpr);
            scaledHeight = Math.floor(forceH * dpr);
        } else {
            // Legacy/ResizeObserver path: Measure DOM
            const rect = this._elements.root.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return false;
            
            dpr = Math.min(window.devicePixelRatio || 1, PERFORMANCE_CONFIG.MAX_DPR);
            scaledWidth = Math.floor(rect.width * dpr);
            scaledHeight = Math.floor(rect.height * dpr);
        }
        
        // Check if dimensions actually changed
        const dimensionsChanged = 
            this._cachedDimensions.width !== scaledWidth ||
            this._cachedDimensions.height !== scaledHeight ||
            this._cachedDimensions.dpr !== dpr;
        
        if (!dimensionsChanged) return false;
        
        // Update cached dimensions
        this._cachedDimensions = { width: scaledWidth, height: scaledHeight, dpr };
        
        // Update canvas sizes (cheap operation)
        ['bg', 'mid', 'fg'].forEach(k => {
            const canvas = this._elements[k];
            const ctx = this._ctxs[k];
            if (!canvas || !ctx) return;
            
            if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
                canvas.width = scaledWidth;
                canvas.height = scaledHeight;
                // Only touch DOM styles if we didn't receive them from an observer
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
        
        // Mark that we have valid dimensions for the render gate
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
            
            // FIX: Use requestAnimationFrame to trigger the CSS transition.
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
    // 3.5 PARTICLE FACTORY (Initialization)
    // ========================================================================
    _initParticles(forceW = null, forceH = null) {
        if (!this._elements?.root) return;
        
        // OPTIMIZATION: Use passed dimensions to avoid re-reading DOM
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

        // Aurora (much more rare - only on very clear nights)
        if (this._isNight && (p.type === 'stars' || p.type === 'cloud') && (p.cloud || 0) <= 15 && Math.random() < 0.01) {
            this._initAurora(w, h);
        }
        
        // Comet (very rare)
        if (this._isNight && p.type === 'stars' && Math.random() < 0.001) {
            this._comets.push(this._createComet(w, h));
        }

        // Satellites (Night Only, Rare)
        if (this._isNight && !p.dark && Math.random() < 0.4) {
             this._satellites.push({
                 x: Math.random() * w,
                 y: Math.random() * (h * 0.4),
                 vx: (Math.random() < 0.5 ? 1 : -1) * (0.05 + Math.random() * 0.05), // Very slow
                 size: 0.8 + Math.random() * 0.4,
                 opacity: 0.6 + Math.random() * 0.4
             });
        }
		
        // Airplane (common at night)
        if (this._isNight && Math.random() < 0.75) {
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

        // Moon clouds (for cloudy nights)
        if (this._isNight && (p.cloud || 0) >= 10) {
            this._initMoonClouds(w, h);
        }

        // Stars
        const starCount = this._isNight ? (p.stars || 0) : 0;
        if (starCount > 0) {
            this._initStars(w, h, starCount);
        }

        // Leaves for windy weather
        if (p.leaves) {
            this._initLeaves(w, h);
        }
        
        // Leaves for stormy weather (less than windy)
        if (p.thunder && !p.leaves) {
            this._initLeaves(w, h, 7);
        }

        // Dust motes for sunny/fair weather
        if (p.atmosphere === 'clear' || p.atmosphere === 'fair') {
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
        const dist = 0.5 + Math.random() * 0.5;
        
        return {
            x: goingRight ? -50 : w + 50,
            y: h * 0.05 + Math.random() * (h * 0.35), // Keep them high up
            vx: (goingRight ? 0.6 : -0.6) * dist,     // Farther = Slower
            blink: 0,
            blinkPhase: Math.random() * Math.PI * 2,
            scale: dist // Store scale for drawing
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

    // Enhanced Cloud Initialization: Layers vs Randomness
    _initClouds(w, h, p) {
        const totalClouds = p.cloud || 0;
        if (totalClouds <= 0) return;

        // 1. BACKGROUND FILLER
        const fillerCount = Math.min(5, Math.floor(totalClouds * 0.25));
        for (let i = 0; i < fillerCount; i++) {
            const seed = Math.random() * 10000;
            const puffs = CloudShapeGenerator.generateMixedPuffs(seed, 'stratus');
            
            this._clouds.push({
                x: Math.random() * w,
                y: Math.random() * (h * 0.35), 
                scale: 0.45 + Math.random() * 0.15, 
                speed: 0.002 + Math.random() * 0.003, 
                puffs,
                layer: 0, 
                opacity: 0.15 + Math.random() * 0.15, 
                seed,
                breathPhase: Math.random() * Math.PI * 2,
                breathSpeed: 0.001 
            });
        }

        // 2. BACKGROUND HERO CLOUDS
        // 2. BACKGROUND HERO CLOUDS (Dramatic Volume)
        // Reduce count by 20% to create gaps
        const heroCount = Math.max(0, Math.floor((totalClouds - fillerCount) * 0.8)); 
        
        for (let i = 0; i < heroCount; i++) {
            const layer = 1 + Math.floor(Math.random() * 4); 
            const isStorm = p.dark;
            const seed = Math.random() * 10000;
            
            let puffs;
            const varietyRoll = Math.random();

            if (isStorm) {
                puffs = CloudShapeGenerator.generateOrganicPuffs(true, seed);
            } else if (layer === 4 && varietyRoll < 0.3) {
                puffs = CloudShapeGenerator.generateMixedPuffs(seed, 'cirrus');
            } else if (varietyRoll < 0.6) {
                puffs = CloudShapeGenerator.generateMixedPuffs(seed, 'cumulus');
            } else {
                puffs = CloudShapeGenerator.generateOrganicPuffs(false, seed);
            }

            this._clouds.push({
                x: Math.random() * w,
                y: Math.random() * (h * 0.5),
                scale: 0.4 + (layer * 0.15) + (Math.random() * 0.3), 
                speed: (0.02 + Math.random() * 0.04) * (layer * 0.5 + 1), 
                puffs,
                layer, 
                opacity: 1 - layer * 0.12, 
                seed,
                breathPhase: Math.random() * Math.PI * 2,
                breathSpeed: 0.003 + Math.random() * 0.004
            });
        }
        
        // Sort Background clouds by depth
        this._clouds.sort((a, b) => a.layer - b.layer);

        // 3. NEW: FAST LOW SCUD CLOUDS (Dynamic Sky Layer)
        if (totalClouds > 20) {
            const scudCount = 3 + Math.floor(Math.random() * 3); 
            for(let i = 0; i < scudCount; i++) {
                const seed = Math.random() * 10000;
                // CHANGED: Use 'cumulus' so they have distinct shapes we can track
                const puffs = CloudShapeGenerator.generateMixedPuffs(seed, 'cumulus');
                
                this._fgClouds.push({
                    x: Math.random() * w,
                    y: Math.random() * (h * 0.5), 
                    
                    // CHANGED: Larger scale to feel closer
                    scale: 0.9 + Math.random() * 0.5,       
                    // CHANGED: SUPER FAST (0.15 is very fast relative to BG)
                    // This creates the "Parallax" effect you are looking for.
                    speed: 0.15 + Math.random() * 0.08,     
                    puffs,
                    layer: 5,
                    opacity: 0.7, 
                    seed,
                    breathPhase: Math.random() * Math.PI * 2,
                    breathSpeed: 0.004
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

    // Sun clouds - Enhanced with layers for depth (Denser & More Visible)
    _initSunClouds(w, h) {
        const celestial = this._getCelestialPosition(w);
        const sunX = celestial.x;
        const sunY = celestial.y;

        // LAYER 1: DEEP ATMOSPHERE (Static background glow)
        // Kept as 1, but slightly larger scale for better backing
        this._sunClouds.push({
            x: sunX,
            y: sunY,
            scale: 1.8, // Slight bump (1.6 -> 1.8)
            speed: 0.002,
            puffs: CloudShapeGenerator.generateWispyPuffs(Math.random() * 10000),
            opacity: 0.15, // Bumped (0.1 -> 0.15)
            seed: Math.random(),
            breathPhase: 0,
            breathSpeed: 0.001,
            baseX: sunX,
            baseY: sunY,
            driftPhase: 0
        });

        // LAYER 2: THE BASE (The "Bed" of clouds)
        // INCREASED: 5 -> 7 clouds.
        // Adjusted spread logic to center the 7 clouds nicely.
        for (let i = 0; i < 7; i++) {
            // New Spread: Centered around 3.5 instead of 2.5
            const spreadX = (i - 3) * 22 + (Math.random() - 0.5) * 15;
            const spreadY = 25 + Math.random() * 20; 
            
            this._sunClouds.push({
                x: sunX + spreadX,
                y: sunY + spreadY,
                scale: 0.55 + Math.random() * 0.3, 
                speed: 0.005, 
                puffs: CloudShapeGenerator.generateSunEnhancementPuffs(Math.random() * 10000),
                opacity: 0.6 + Math.random() * 0.2, // Base opacity boosted (starts at 0.6 now)
                seed: Math.random(),
                breathPhase: Math.random() * Math.PI * 2,
                breathSpeed: 0.003,
                baseX: sunX + spreadX,
                baseY: sunY + spreadY,
                driftPhase: Math.random() * Math.PI * 2
            });
        }

        // LAYER 3: THE DIFFUSERS (Center "Pop")
        // INCREASED: 2 -> 3 clouds for better coverage
        for (let i = 0; i < 3; i++) {
            this._sunClouds.push({
                x: sunX + (Math.random() - 0.5) * 50, // Slightly wider spread
                y: sunY + 15 + (Math.random() - 0.5) * 12,
                scale: 0.7, 
                speed: 0.008,
                puffs: CloudShapeGenerator.generateOrganicPuffs(false, Math.random() * 10000), 
                opacity: 0.25, // BOOSTED: 0.14 -> 0.25 (Much more visible now)
                seed: Math.random(),
                breathPhase: Math.random() * Math.PI * 2,
                breathSpeed: 0.004,
                baseX: sunX,
                baseY: sunY + 15,
                driftPhase: i * 2 // Desynced drift
            });
        }
        
        // LAYER 4: UPPER HAZE (Verticality)
        // INCREASED: 2 -> 4 clouds. 
        // This adds those nice "god ray" blockers above the sun.
        for (let i = 0; i < 4; i++) {
            this._sunClouds.push({
                x: sunX + (Math.random() - 0.5) * 90, 
                y: sunY - 25 - Math.random() * 25, 
                scale: 0.35, // Slightly larger
                speed: 0.01,
                puffs: CloudShapeGenerator.generateWispyPuffs(Math.random() * 10000),
                opacity: 0.3, // BOOSTED: 0.15 -> 0.3
                seed: Math.random(),
                breathPhase: Math.random() * Math.PI * 2,
                breathSpeed: 0.002,
                baseX: sunX + (Math.random() - 0.5) * 90,
                baseY: sunY - 25 - Math.random() * 25,
                driftPhase: Math.random() * Math.PI * 2
            });
        }
    }

    // Moon clouds for cloudy nights - NOW WITH TEXTURE
    _initMoonClouds(w, h) {
        // 1. MORE CLOUDS:
        // Increase base count. Even "Partly Cloudy" will now have ~4-5 clouds.
        // Full cloudy will hit the new max of 8.
        const cloudiness = Math.min((this._params?.cloud || 0) / 40, 1);
        const count = Math.min(LIMITS.MAX_MOON_CLOUDS, 3 + Math.floor(cloudiness * 5));
        
        for (let i = 0; i < count; i++) {
            const seed = Math.random() * 10000;
            
            // Alternate shapes (Organic vs Wispy)
            const puffs = (i % 2 === 0) 
                ? CloudShapeGenerator.generateOrganicPuffs(false, seed) 
                : CloudShapeGenerator.generateWispyPuffs(seed);
            
            const celestial = this._getCelestialPosition(w);
            
            // 2. BETTER POSITIONING:
            // Spread them wider so they don't clump (0.4 -> 0.7 angle spread)
            const angle = (i / count) * Math.PI * 0.7 + Math.PI * 0.15 + (Math.random() - 0.5) * 0.5;
            const dist = 30 + Math.random() * 50;
            
            this._moonClouds.push({
                x: celestial.x + Math.cos(angle) * dist,
                y: celestial.y + Math.sin(angle) * dist,
                
                // 3. DRAMATIC SCALE:
                // Doubled the size! (Was 0.3-0.5 -> Now 0.6-1.1)
                // This makes them feel like "structures" rather than specks.
                scale: (i % 2 === 0) ? 0.6 + Math.random() * 0.4 : 0.7 + Math.random() * 0.4,
                
                speed: 0.015 + Math.random() * 0.015,
                puffs,
                opacity: 0.3 + cloudiness * 0.3,
                seed,
                breathPhase: Math.random() * Math.PI * 2,
                breathSpeed: 0.003
            });
        }
    }

    _initStars(w, h, count) {
        // FINE TUNED REALISM + CHROMATIC DATA
        
        // 1. STRICTER TIERS
        // Push most stars into the background for depth.
        // Hero stars are now very rare (approx 4-5 stars total).
        const tier1Count = Math.floor(count * 0.70); // 70% Background (Depth)
        const tier2Count = Math.floor(count * 0.285); // 28.5% Mid (Structure)
        // Leaving 1.5% for Hero (Highlights)
        
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
                size = 1.2 + Math.random() * 0.4;   // Small but visible (1.2-1.6px)
                brightness = 0.35 + Math.random() * 0.2;
                twinkleSpeed = 0.04 + Math.random() * 0.04; 
            } else if (tier === 'mid') {
                size = 1.8 + Math.random() * 0.6;   // Sharp points (1.8-2.4px)
                brightness = 0.6 + Math.random() * 0.25;
                twinkleSpeed = 0.02 + Math.random() * 0.02; 
            } else { // Hero (Significantly Reduced)
                size = 2.2 + Math.random() * 0.8;   // WAS 3.2-4.2, NOW 2.2-3.0px
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
    // 3.6 RENDERING (The Painter)
    // ========================================================================
    
    // ========================================================================
    // DRAWING HELPERS
    // ========================================================================
    
    // SUN RAYS - With cloud interaction for light theme visibility
    _drawLightRays(ctx, w, h) {
        const rayCount = 8;
        const fadeOpacity = this._layerFadeProgress.effects;
        
        // Dynamic Position
        const celestial = this._getCelestialPosition(w);
        const centerX = celestial.x; 
        const centerY = celestial.y;
        
        const baseAngle = Math.PI * 0.2;
        const spread = Math.PI * 0.45;

        // 1. RAW STATE
        ctx.save();
        
        for (let i = 0; i < rayCount; i++) {
            const angleOffset = Math.sin(this._rayPhase + i * 0.7) * 0.08;
            const angle = baseAngle + (i / rayCount) * spread + angleOffset;
            const length = h * 1.4;
            
            const endX = centerX + Math.cos(angle) * length;
            const endY = centerY + Math.sin(angle) * length;
            
            const rayWidth = 35 + Math.sin(this._rayPhase * 0.8 + i * 1.2) * 15;
            const intensity = (0.12 + Math.sin(this._rayPhase * 0.5 + i * 0.8) * 0.05) * fadeOpacity;
            
            // Draw ray
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            
            // Perpendicular offset
            const perpAngle = angle + Math.PI / 2;
            const perpX = Math.cos(perpAngle) * rayWidth;
            const perpY = Math.sin(perpAngle) * rayWidth;
            
            ctx.lineTo(endX - perpX, endY - perpY);
            ctx.lineTo(endX + perpX, endY + perpY);
            ctx.closePath();
            
            // Gradient (Inlined)
            const g = ctx.createLinearGradient(centerX, centerY, endX, endY);
            
            if (this._isLightBackground) {
                ctx.globalCompositeOperation = 'multiply';
                g.addColorStop(0, `rgba(255, 200, 80, ${intensity * 0.5})`);
                g.addColorStop(0.15, `rgba(255, 210, 100, ${intensity * 0.4})`);
                g.addColorStop(0.4, `rgba(255, 230, 160, ${intensity * 0.2})`);
                g.addColorStop(1, 'rgba(255, 255, 255, 0)');
            } else {
                ctx.globalCompositeOperation = 'screen';
                g.addColorStop(0, `rgba(255, 245, 200, ${intensity * 1.5})`);
                g.addColorStop(0.4, `rgba(255, 250, 230, ${intensity * 0.8})`);
                g.addColorStop(1, 'rgba(255, 255, 255, 0)');
            }
            
            ctx.fillStyle = g;
            ctx.fill();
        }
        
        // Second pass (Overlay for light theme)
        if (this._isLightBackground) {
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
        }
        
        ctx.restore();
    }



    // OPTIMIZED: Sun Cloud Renderer
    _drawSunClouds(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.clouds;
        if (fadeOpacity <= 0) return;
        
        for (let i = 0; i < this._sunClouds.length; i++) {
            const cloud = this._sunClouds[i];
            
            // 1. PHYSICS (Preserved)
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
            
            // 2. RAW STATE (No Helper)
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
                // Stop 0: 255, 255, 250 (Bright White/Yellow)
                // Stop 0.3: 255, 245, 225 (Warm Cream)
                // Stop 0.6: 250, 235, 200 (Gold Midtone)
                // Stop 0.85: 240, 220, 180 (Deep Gold Edge)
                
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
        
        // Main glow
        const g = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, w * 0.6);
        
        if (this._isLightBackground) {
            g.addColorStop(0, `rgba(255, 175, 60, ${0.65 * fadeOpacity})`); 
            g.addColorStop(0.2, `rgba(255, 205, 100, ${0.45 * fadeOpacity})`); 
            g.addColorStop(0.5, `rgba(255, 235, 180, ${0.15 * fadeOpacity})`);
            g.addColorStop(1, 'rgba(255, 255, 255, 0)');
        } else {
            g.addColorStop(0, `rgba(255, 220, 100, ${0.4 * fadeOpacity})`);
            g.addColorStop(0.2, `rgba(255, 235, 150, ${0.2 * fadeOpacity})`);
            g.addColorStop(0.5, `rgba(255, 245, 200, ${0.08 * fadeOpacity})`);
            g.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }
        
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        
        // Pulsing core
        const pulse = Math.sin(this._rayPhase * 0.4) * 0.08 + 0.92;
        const coreRadius = 65 * pulse; 
        
        ctx.globalCompositeOperation = 'lighter';
        const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius);
        
        coreGrad.addColorStop(0, `rgba(255, 255, 255, ${0.95 * fadeOpacity})`); 
        coreGrad.addColorStop(0.25, `rgba(255, 250, 210, ${0.6 * fadeOpacity})`);
        coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
	
	// Helper to check if we should show the diffuse sun (Cloudy days)
    _shouldShowCloudySun() {
        if (this._isNight) return false;
        const p = this._params;
        const currentState = (this._lastState || '').toLowerCase();
        
        // Exclude bad weather where sun is completely gone
        const isBad = p.dark || ['rain', 'hail', 'lightning', 'pouring', 'snowy', 'snowy-rainy'].includes(p.type);
        
        // Include overcast types
        const overcastTypes = ['cloudy', 'windy', 'windy-variant', 'fog'];
        
        return overcastTypes.includes(currentState) && !isBad;
    }

    // Draw a diffuse, blurry sun spot OVER the clouds
    _drawCloudySun(ctx, w, h) {
        const fadeOpacity = this._layerFadeProgress.effects;
        const celestial = this._getCelestialPosition(w);
        
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        
        const g = ctx.createRadialGradient(celestial.x, celestial.y, 0, celestial.x, celestial.y, 140);
        
        g.addColorStop(0, `rgba(255, 255, 240, ${0.7 * fadeOpacity})`);
        g.addColorStop(0.4, `rgba(255, 245, 210, ${0.4 * fadeOpacity})`);
        g.addColorStop(1, `rgba(255, 245, 220, 0)`);
        
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(celestial.x, celestial.y, 140, 0, Math.PI * 2);
        ctx.fill();
        
        // Hot-spot
        ctx.globalCompositeOperation = 'screen';
        const core = ctx.createRadialGradient(celestial.x, celestial.y, 0, celestial.x, celestial.y, 45);
        core.addColorStop(0, `rgba(255, 255, 255, ${0.3 * fadeOpacity})`);
        core.addColorStop(1, `rgba(255, 255, 255, 0)`);
        
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
        // Cache context lookups if possible, but accessing ctx is fast enough
        
        for (let i = 0; i < cloudList.length; i++) {
            const cloud = cloudList[i];
            
            // 1. PHYSICS (Preserved 1:1)
            const depthFactor = 1 + cloud.layer * 0.2; 
            cloud.x += cloud.speed * effectiveWind * depthFactor;
            
            // Wrap logic
            if (cloud.x > w + 280) cloud.x = -280;
            if (cloud.x < -280) cloud.x = w + 280;
            
            // Organic breathing
            cloud.breathPhase += cloud.breathSpeed;
            const breathScale = 1 + Math.sin(cloud.breathPhase) * 0.015;
            
            // 2. RAW STATE MANAGEMENT (No Helper Overhead)
            ctx.save();
            ctx.translate(cloud.x, cloud.y);
            const vScale = this._params?.dark ? 0.45 : 0.65;
            ctx.scale(cloud.scale * breathScale, cloud.scale * vScale * breathScale);
            
            // 3. INLINED COLOR CALCULATION (No Object Creation)
            let litR, litG, litB;
            let midR, midG, midB;
            let shadowR, shadowG, shadowB;
            let ambient;

            // Logic copied strictly from _getCloudColors
            // SCUD LAYER (Layer 5)
            if (cloud.layer === 5) {
                if (this._isLightBackground) {
                    litR=230; litG=240; litB=250; 
                    midR=190; midG=205; midB=225; 
                    shadowR=150; shadowG=165; shadowB=190; 
                    ambient=0.9;
                } else {
                    litR=55; litG=65; litB=80; 
                    midR=35; midG=45; midB=60; 
                    shadowR=15; shadowG=20; shadowB=30; 
                    ambient=0.3;
                }
            }
            // NIGHT CLOUDS
            else if (this._isNight) {
                litR=150; litG=165; litB=190; 
                midR=75; midG=85; midB=105; 
                shadowR=14; shadowG=16; shadowB=25; 
                ambient=0.85;
            }
            // BAD WEATHER
            else if (this._params?.dark || ['rain', 'hail', 'fog', 'lightning', 'lightning-rainy', 'pouring', 'rainy', 'snowy-rainy'].includes(this._params?.type) || this._params?.foggy) {
                if (this._isLightBackground) {
                    litR=230; litG=235; litB=240; 
                    midR=195; midG=200; midB=210; 
                    shadowR=155; shadowG=165; shadowB=180; 
                    ambient=0.85;
                } else {
                    litR=90; litG=95; litB=105; 
                    midR=60; midG=65; midB=75; 
                    shadowR=30; shadowG=35; shadowB=45; 
                    ambient=0.6;
                }
            }
            // DAY STANDARD
            else if (this._isLightBackground) {
                // Lit: Slight Cream (255, 255, 250)
                litR=255; litG=255; litB=250; 
                // Mid: Neutral Warm Grey (225, 225, 235)
                midR=225; midG=225; midB=235; 
                // Shadow: Desaturated Blue (175, 180, 195)
                shadowR=175; shadowG=180; shadowB=195; 
                ambient=0.85;
            }
            // FALLBACK
            else {
                litR=250; litG=252; litB=255; 
                midR=225; midG=235; midB=248; 
                shadowR=160; shadowG=175; shadowB=200; 
                ambient=0.28;
            }

            const layerOpacity = cloud.opacity * (1 - cloud.layer * 0.1);
            const baseOpacity = globalOpacity * layerOpacity * ambient * fadeOpacity;
            
            // 4. DRAW PUFFS (Raw Canvas Commands)
            const puffs = cloud.puffs;
            const len = puffs.length; // Micro-optimization: Cache length
            
            for (let j = 0; j < len; j++) {
                const puff = puffs[j];
                
                // Turbulence Math (Preserved)
                const flowSpeed = cloud.breathPhase * 0.7;
                const noiseX = Math.sin(flowSpeed + j * 0.5) * (puff.rad * 0.1); 
                const noiseY = Math.cos(flowSpeed * 0.8 + j * 0.3) * (puff.rad * 0.05);
                
                const drawX = puff.dx + noiseX;
                const drawY = puff.dy + noiseY;
                
                // Shading Math (Preserved)
                const normalizedY = (puff.dy + 50) / 100;
                const shadeFactor = Math.max(0.3, 1 - normalizedY * 0.5);
                const invShade = 1 - shadeFactor;
                
                // Color Math (Inlined)
                const r = (litR * shadeFactor + shadowR * invShade) | 0;
                const g = (litG * shadeFactor + shadowG * invShade) | 0;
                const b = (litB * shadeFactor + shadowB * invShade) | 0;
                
                const finalOpacity = baseOpacity * puff.shade;
                
                // Gradient (Inlined - No Arrays)
                // Offset is hardcoded from previous: -puff.rad * 0.2, -puff.rad * 0.3
                const grad = ctx.createRadialGradient(
                    drawX - puff.rad * 0.2, drawY - puff.rad * 0.3, 0,
                    drawX, drawY, puff.rad
                );
                
                grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${finalOpacity})`);
                grad.addColorStop(0.4, `rgba(${midR}, ${midG}, ${midB}, ${finalOpacity * 0.85})`);
                grad.addColorStop(0.7, `rgba(${shadowR}, ${shadowG}, ${shadowB}, ${finalOpacity * 0.6})`);
                grad.addColorStop(1, `rgba(${shadowR}, ${shadowG}, ${shadowB}, 0)`);
                
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
        
        // Colors
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

            // 2. VISUALS (The Realism Fix)
            // Calculate stretch based on Z-depth. 
            // Close drops (high Z) stretch 2.5x, Distant drops stretch 1.0x
            const depthStretch = 1.0 + (pt.z * 1.5);
            const stretch = (1.5 + (this._windSpeed * 0.5)) * depthStretch;
            
            const tailX = pt.x - (moveX * stretch);
            const tailY = pt.y - (moveY * stretch);

            const baseOp = isDay ? 0.75 : 0.60; 
            const finalOp = (pt.z * baseOp) * fadeOpacity * pt.op;

            if (finalOp < 0.02) continue;

            const width = Math.max(0.8, pt.z * 1.4);

            const grad = ctx.createLinearGradient(tailX, tailY, pt.x, pt.y);
            grad.addColorStop(0, `rgba(${rgbBase}, 0)`);              
            grad.addColorStop(0.5, `rgba(${rgbBase}, ${finalOp * 0.4})`); 
            grad.addColorStop(1, `rgba(${rgbBase}, ${finalOp})`);     

            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.strokeStyle = grad;

            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(pt.x, pt.y);
            ctx.stroke();
        }
    }
	
	
	// OPTIMIZED: Snow Renderer (Soft Glimmer)
    _drawSnow(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.precipitation;
        if (fadeOpacity <= 0) return;
        
        const len = this._snow.length;

        for (let i = 0; i < len; i++) {
            const pt = this._snow[i];
            
            // 1. PHYSICS (Floaty)
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
            
            // 2. VISUALS (Soft & Shimmering)
            
            // Glimmer: Pulse opacity to simulate light hitting the flake
            const glimmer = 0.8 + Math.sin(pt.wobblePhase * 3) * 0.2;
            const finalOpacity = pt.op * fadeOpacity * glimmer;
            
            ctx.save();
            ctx.translate(pt.x, pt.y);
            
            if (pt.z > 0.7) {
                // --- FOREGROUND: Soft Fluffy Gradient ---
                // Creates a white core that fades to transparent
                const g = ctx.createRadialGradient(0, 0, 0, 0, 0, pt.size * 1.5);
                g.addColorStop(0, `rgba(255, 255, 255, ${finalOpacity})`);
                g.addColorStop(0.4, `rgba(255, 255, 255, ${finalOpacity * 0.6})`);
                g.addColorStop(1, `rgba(255, 255, 255, 0)`);
                
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(0, 0, pt.size * 1.5, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // --- BACKGROUND: Simple Dot (CPU Saver) ---
                ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity * 0.8})`;
                ctx.beginPath();
                ctx.arc(0, 0, pt.size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
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
            
            // 2. RAW DRAWING (Replaces ctx.save/restore loop overhead)
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
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = `rgba(220, 235, 255, ${this._flashOpacity * fadeOpacity})`;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
            
            this._flashOpacity *= 0.78;
        }
        
        // 2. BOLT DRAWING
        if (this._bolts.length > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            
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
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = fadeOpacity;
        
        for (const wave of this._aurora.waves) {
            // Gradient (Inlined)
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

    
	// Satellites
    _drawSatellites(ctx, w, h) {
        if (this._satellites.length === 0) return;
        
        ctx.fillStyle = "white";
        for (let i = 0; i < this._satellites.length; i++) {
            const s = this._satellites[i];
            s.x += s.vx;
            
            ctx.globalAlpha = s.opacity * this._layerFadeProgress.stars;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
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
                // --- DAY (Light Theme) ---
                color = this._isNight ? '86, 95, 108' : '175, 185, 200';
                opModifier = this._isNight ? 1.0 : 0.65; 
            } else {
                // --- NIGHT (Dark Theme) ---
                color = this._isNight  
                    ? '85, 90, 105'    
                    : '72, 81, 95';   
            }
            
            const layerOpacity = f.opacity * (1 + f.layer * 0.2) * fadeOpacity * opModifier;
            
            // RAW STATE
            ctx.save();
            ctx.scale(1, 0.35);
            
            // Gradient (Inlined)
            const drawY = (f.y + undulation) / 0.35;
            
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
    // (Left-Side Bias + Fast Fade)
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

            // Draw Head
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
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

                ctx.strokeStyle = `rgba(255, 255, 240, ${tailOp})`;
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
            
            // Head Gradient
            const headGrad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.size * 4);
            headGrad.addColorStop(0, `rgba(220, 240, 255, ${opacity})`);
            headGrad.addColorStop(0.4, `rgba(100, 200, 255, ${opacity * 0.4})`);
            headGrad.addColorStop(1, 'rgba(100, 200, 255, 0)');
            
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
                
                ctx.strokeStyle = `rgba(160, 210, 255, ${tailOp})`;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }


    // PLANES
    // (With Side Profile + Bird Exclusivity)
    _drawPlanes(ctx, w, h) {
        if (this._birds && this._birds.length > 0) return;

        const p = this._params;
        const badWeather = ['rain', 'hail', 'lightning', 'pouring', 'snowy', 'snowy-rainy'].includes(p.type);
        
        if (!badWeather && this._planes.length === 0 && Math.random() < 0.001) {
            const isRight = Math.random() < 0.5;
            this._planes.push({
                x: isRight ? -60 : w + 60,
                y: h * 0.15 + Math.random() * (h * 0.4),
                vx: (isRight ? 1 : -1) * (0.8 + Math.random() * 0.4),
                blinkPhase: 0,
                blink: 0
            });
        }

        ctx.save();
        
        for (let i = this._planes.length - 1; i >= 0; i--) {
            const p = this._planes[i];

            // Update
            p.x += p.vx;
            p.blinkPhase += 0.12;
            p.blink = Math.sin(p.blinkPhase) > 0.75 ? 1 : 0;

            if (p.x < -80 || p.x > w + 80) {
                this._planes.splice(i, 1);
                continue;
            }
            
            ctx.save(); 
            ctx.translate(p.x, p.y);
            ctx.scale(p.scale, p.scale);
            ctx.translate(-p.x, -p.y);
            // --------------------------------

            const dir = p.vx > 0 ? 1 : -1;
             
            // Day = Light Plane. Night = Dark Silhouette (so it pops against the moon)
            const color = this._isNight ? '80, 85, 95' : '220, 220, 230';
            const opacity = this._isNight ? 0.9 : 0.8;

            ctx.strokeStyle = `rgba(${color}, ${opacity})`;
            ctx.lineWidth = 1.5; 
            ctx.lineCap = 'round';

            // Draw Profile
            ctx.beginPath();
            ctx.moveTo(p.x + 6 * dir, p.y);
            ctx.lineTo(p.x - 6 * dir, p.y);
            ctx.moveTo(p.x - 5 * dir, p.y);
            ctx.lineTo(p.x - 8 * dir, p.y - 4);
            ctx.moveTo(p.x + 1 * dir, p.y);
            ctx.lineTo(p.x - 2 * dir, p.y + 2);
            ctx.stroke();

            // Strobe Light
            if (p.blink) {
                // Directional Colors
                const isMovingRight = p.vx > 0;
                const colorStr = isMovingRight ? '50, 255, 80' : '255, 50, 50'; // Green vs Red

                // 1. THE CORE (The tiny LED bulb)
                const coreOp = this._isLightBackground ? 0.7 : 0.85; 
                ctx.fillStyle = `rgba(${colorStr}, ${coreOp})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y + 1, 1.5, 0, Math.PI * 2);
                ctx.fill();
                
                // 2. THE GLOW (The "Blur")
                if (!this._isLightBackground) {
                    const g = ctx.createRadialGradient(p.x, p.y + 1, 1.5, p.x, p.y + 1, 10);
                    g.addColorStop(0, `rgba(${colorStr}, 0.3)`);
                    g.addColorStop(1, `rgba(${colorStr}, 0)`);
                    
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y + 1, 10, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // DAY MODE: Keep it simple/faint
                    ctx.fillStyle = `rgba(${colorStr}, 0.05)`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y + 1, 6, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
			ctx.restore();
        }
        
        ctx.restore();
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

        if (!this._isNight && !isSevereWeather && this._birds.length === 0) {
            
            // A. Direction (1 = Right, -1 = Left)
            const dir = Math.random() > 0.5 ? 1 : -1;
            const startX = dir === 1 ? -60 : w + 60;
            
            // B. Depth Scale (0.7x to 1.2x) - Applies to Size, Speed, AND Formation spacing
            const depthScale = 0.7 + Math.random() * 0.5; 
            
            // C. Speed (Linked to depth: Closer = Faster)
            const baseSpeed = (0.8 + Math.random() * 0.5);
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
        ctx.globalCompositeOperation = 'lighter';
        
        const len = this._dustMotes.length;
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
            ctx.fillStyle = `rgba(255, 250, 220, ${finalOpacity})`;
            ctx.beginPath();
            ctx.arc(mote.x, mote.y, mote.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }


    // MOON: Fixed Body, Dynamic Glow (50% of Height)
    _drawMoon(ctx, w, h) {
        if (!this._isNight) return;
        
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
        
        // Keep Moon Body Static
        const moonRadius = 18; 
        
        const glowRadius = h * 0.65;

        // RAW STATE
        ctx.save();
        
        // --- A. ATMOSPHERIC GLOW (Dynamic Size) ---
        // 1. Base Intensity
        const glowIntensity = 0.23 + this._moonPhaseConfig.illumination * 0.18;
        const effectiveGlow = glowIntensity * fadeOpacity * moonVisibility;
        
        ctx.globalCompositeOperation = 'screen'; 
        
        // [FIX] Use glowRadius here instead of (moonRadius * 5.5)
        const glowGrad = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, glowRadius);
        
        glowGrad.addColorStop(0, `rgba(180, 200, 255, ${effectiveGlow})`);
        glowGrad.addColorStop(0.5, `rgba(165, 195, 245, ${effectiveGlow * 0.4})`);
        glowGrad.addColorStop(1, 'rgba(150, 180, 220, 0)');
        
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        // [FIX] Use glowRadius here
        ctx.arc(moonX, moonY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalCompositeOperation = 'source-over';

        // --- B. STAR BLOCKER ---
        if (this._moonPhaseConfig.illumination > 0) {
            ctx.fillStyle = `rgba(25, 30, 40, ${fadeOpacity})`; 
            ctx.beginPath();
            ctx.arc(moonX, moonY, moonRadius - 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // --- C. MOON BODY (Standard 18px Logic) ---
        ctx.save();
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
        ctx.clip();
        
        const illumination = this._moonPhaseConfig.illumination;
        const direction = this._moonPhaseConfig.direction;
        
        if (illumination <= 0) {
            // New Moon
            ctx.fillStyle = `rgba(40, 45, 55, ${0.8 * fadeOpacity})`; 
            ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2); ctx.fill();
            
            // Earthshine
            ctx.fillStyle = `rgba(80, 90, 110, ${0.15 * fadeOpacity})`;
            ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2); ctx.fill();
        } else if (illumination >= 1) {
            // Full Moon
            const moonGrad = ctx.createRadialGradient(
                moonX - moonRadius * 0.3, moonY - moonRadius * 0.3, 0,
                moonX, moonY, moonRadius
            );
            moonGrad.addColorStop(0, `rgba(255, 255, 250, ${0.95 * fadeOpacity})`);
            moonGrad.addColorStop(0.7, `rgba(230, 235, 245, ${0.9 * fadeOpacity})`);
            moonGrad.addColorStop(1, `rgba(200, 210, 230, ${0.85 * fadeOpacity})`);
            
            ctx.fillStyle = moonGrad;
            ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2); ctx.fill();
        } else {
            // Partial Phases
            ctx.fillStyle = `rgba(35, 40, 50, ${0.9 * fadeOpacity})`; 
            ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2); ctx.fill();
            
            const terminatorWidth = Math.abs(1 - illumination * 2) * moonRadius;
            const isGibbous = illumination > 0.5;
            
            ctx.beginPath();
            if (direction === 'right') { // Waxing
                ctx.arc(moonX, moonY, moonRadius, -Math.PI / 2, Math.PI / 2, false);
                ctx.ellipse(moonX, moonY, terminatorWidth, moonRadius, 0, Math.PI / 2, -Math.PI / 2, !isGibbous);
            } else { // Waning
                ctx.arc(moonX, moonY, moonRadius, Math.PI / 2, -Math.PI / 2, false);
                ctx.ellipse(moonX, moonY, terminatorWidth, moonRadius, 0, -Math.PI / 2, Math.PI / 2, !isGibbous);
            }
            ctx.closePath();
            
            const moonGrad = ctx.createRadialGradient(
                moonX - moonRadius * 0.2, moonY - moonRadius * 0.2, 0,
                moonX, moonY, moonRadius
            );
            moonGrad.addColorStop(0, `rgba(255, 255, 250, ${0.95 * fadeOpacity})`);
            moonGrad.addColorStop(0.6, `rgba(235, 240, 248, ${0.9 * fadeOpacity})`);
            moonGrad.addColorStop(1, `rgba(210, 220, 235, ${0.85 * fadeOpacity})`);
            
            ctx.fillStyle = moonGrad;
            ctx.fill();
        }
        
        ctx.restore(); // End Clipping
        
        // --- D. CRATERS (Standard Logic - No Scaling) ---
        if (illumination > 0.05) {
            const op = fadeOpacity * Math.min(1, illumination * 4.0); 
            
            // Layer 1
            ctx.fillStyle = `rgba(30, 35, 50, ${0.13 * op})`; 
            ctx.beginPath(); ctx.ellipse(moonX - 9, moonY + 2, 7, 9, 0.2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(moonX + 8, moonY - 6, 6, 4, -0.3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(moonX - 2, moonY + 10, 5, 3, 0.1, 0, Math.PI * 2); ctx.fill();

            // Layer 2
            ctx.fillStyle = `rgba(25, 30, 45, ${0.22 * op})`; 
            ctx.beginPath(); ctx.ellipse(moonX - 9, moonY + 2, 4, 6, 0.2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(moonX + 8, moonY - 6, 3, 2, -0.3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(moonX - 2, moonY + 10, 2.5, 1.5, 0.1, 0, Math.PI * 2); ctx.fill();
            
            // Small Texture
            ctx.fillStyle = `rgba(25, 30, 45, ${0.13 * op})`;
            ctx.beginPath(); ctx.arc(moonX + 6, moonY + 5, 1.2, 0, Math.PI * 2); ctx.fill(); 
            ctx.beginPath(); ctx.arc(moonX - 5, moonY - 8, 1.0, 0, Math.PI * 2); ctx.fill(); 
        }
        
        ctx.restore();
    }

    // OPTIMIZED: Moon Cloud Renderer
    _drawMoonClouds(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.clouds;
        if (fadeOpacity <= 0 || this._moonClouds.length === 0) return;
        
        for (let i = 0; i < this._moonClouds.length; i++) {
            const cloud = this._moonClouds[i];
            
            // 1. PHYSICS (Preserved)
            cloud.x += cloud.speed * effectiveWind;
            cloud.breathPhase += cloud.breathSpeed;
            
            if (cloud.x > 180) cloud.x = 0;
            if (cloud.x < 0) cloud.x = 180;
            
            const breathScale = 1 + Math.sin(cloud.breathPhase) * 0.02;
            
            // 2. RAW STATE (No Helper)
            ctx.save();
            ctx.translate(cloud.x, cloud.y);
            ctx.scale(cloud.scale * breathScale, cloud.scale * 0.5 * breathScale);
            
            // 3. DRAW PUFFS (Inlined Gradient)
            const puffs = cloud.puffs;
            const len = puffs.length;
            
            for (let j = 0; j < len; j++) {
                const puff = puffs[j];
                const opacity = cloud.opacity * puff.shade * fadeOpacity;
                
                // Colors hardcoded for Moon Clouds (Cool/Blue scheme)
                const grad = ctx.createRadialGradient(
                    puff.dx - puff.rad * 0.1, puff.dy - puff.rad * 0.1, 0,
                    puff.dx, puff.dy, puff.rad
                );
                
                grad.addColorStop(0, `rgba(200, 215, 235, ${opacity * 0.4})`);
                grad.addColorStop(0.4, `rgba(100, 115, 140, ${opacity * 0.2})`);
                grad.addColorStop(0.8, `rgba(30, 40, 60, ${opacity * 0.1})`);
                grad.addColorStop(1, `rgba(20, 30, 50, 0)`);
                
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(puff.dx, puff.dy, puff.rad, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
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
    // 3.7 ANIMATION LOOP (The Heartbeat)
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
        
        // REMOVED: _updateTransition() call (No longer needed)
        
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
        
        const cloudGlobalOp = this._isNight ? 0.3 : 0.85;

        // ---- BACKGROUND LAYER ----
        
        // Sun atmosphere (sunny days)
        if (this._shouldShowSun()) {
            this._drawSunGlow(mid, w, h);
        }

        // Aurora
        this._drawAurora(mid, w, h);

        // Stars
        const starFade = this._layerFadeProgress.stars;
        
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
				const horizonFade = 1 - Math.pow(s.y / (h * 0.95), 3);
				
				const opacityPulse = 1 + (twinkleVal * 0.15);
				// Apply horizonFade to the final calculation
				const finalOpacity = Math.min(1, Math.max(0.0, s.brightness * opacityPulse * starFade * horizonFade));
                
                if (finalOpacity <= 0.05) continue;

                // 3. COLOR
                const shift = twinkleVal * 5;
                const dynamicHue = s.hsl.h + shift;
                const dynamicLight = s.hsl.l + (twinkleVal * 2); 
                const dynamicColor = `hsla(${dynamicHue}, ${s.hsl.s}%, ${dynamicLight}%,`;

                // 4. DRAWING
                if (s.tier === 'hero') {
                    bg.save();
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
                    
                    bg.restore();
                } else {
                    // Standard Stars
                    bg.fillStyle = `${dynamicColor} ${finalOpacity})`;
                    bg.beginPath();
                    bg.arc(s.x, s.y, currentSize * 0.5, 0, Math.PI * 2);
                    bg.fill();
                }
            }
        }

        // Satellites
        this._drawSatellites(bg, w, h);

        // Moon (needs to cover the stars!)
        this._drawMoon(bg, w, h);

        // Night sky effects
        if (this._isNight && this._stars.length > 0) {
            this._drawShootingStars(bg, w, h);
        }
        this._drawComets(bg, w, h);
        this._drawPlanes(bg, w, h);

        // Sun rays
        if (p.rays && !this._isNight) {
            this._drawLightRays(bg, w, h);
        }

        // Heat shimmer
        this._drawHeatShimmer(mid, w, h);

        // ---- MIDDLE LAYER ----
        
        // Sun clouds (for ray visibility on light theme) - drawn before main clouds
        if (this._sunClouds.length > 0) {
            this._drawSunClouds(mid, w, h, effectiveWind);
        }
        
        // ---- MIDDLE LAYER (bg -> birds -> scud) ----
        // 1. Heavy Background Clouds (Furthest)
        this._drawClouds(mid, this._clouds, w, h, effectiveWind, cloudGlobalOp);
        
        // --- DIFFUSE SUN FOR CLOUDY DAYS ---
        // Drawn ON TOP of BG clouds, but BEHIND FG clouds
        if (this._shouldShowCloudySun()) {
            this._drawCloudySun(mid, w, h);
        }
        
        // 2. Birds (In the middle of the sky volume)
        // Drawing them here puts them IN FRONT of the big clouds...
        this._drawBirds(mid, w, h);

        // 3. Fast Scud Clouds (Closest)
        // ...but BEHIND the fast moving scud clouds.
        this._drawClouds(mid, this._fgClouds, w, h, effectiveWind, cloudGlobalOp);

        // Moon clouds (for cloudy nights)
        if (this._isNight && this._moonClouds.length > 0) {
            this._drawMoonClouds(mid, w, h, effectiveWind);
        }

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

// //#endregion

customElements.define('atmospheric-weather-card', AtmosphericWeatherCard);
window.customCards = window.customCards || [];
window.customCards.push({
type: 'atmospheric-weather-card',
name: 'Atmospheric Weather Card',
description: 'Animated weather effects with rain, snow, clouds, stars and more'
});
