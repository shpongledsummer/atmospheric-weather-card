/**
 * ATMOSPHERIC WEATHER CARD
 * Version: 1.0
 * * A custom Home Assistant card that renders animated weather effects.
 * * https://github.com/shpongledsummer/atmospheric-weather-card
 */
 
 console.info("%c ATMOSPHERIC-WEATHER-CARD %c V1.0", "color: white; background: #2980b9; font-weight: bold;", "color: #2980b9; background: white; font-weight: bold;");

// ============================================================================
// WEATHER CONFIGURATION
// ============================================================================
const WEATHER_MAP = Object.freeze({
    'clear-night':      Object.freeze({ type: 'stars', count: 280, cloud: 0,  wind: 0.1, rays: false, atmosphere: 'night' }), 
    'cloudy':           Object.freeze({ type: 'cloud', count: 0,   cloud: 70, wind: 0.3, dark: false, rays: false, atmosphere: 'overcast' }), 
    'fog':              Object.freeze({ type: 'fog',   count: 0,   cloud: 15, wind: 0.1, rays: false, atmosphere: 'mist', foggy: true }), 
    'hail':             Object.freeze({ type: 'hail',  count: 150, cloud: 28, wind: 0.8, dark: true, rays: false, atmosphere: 'storm' }),
    'lightning':        Object.freeze({ type: 'rain',  count: 200, cloud: 32, wind: 2.0, thunder: true, dark: true, rays: false, atmosphere: 'storm' }), 
    'lightning-rainy':  Object.freeze({ type: 'rain',  count: 300, cloud: 36, wind: 2.5, thunder: true, dark: true, rays: false, atmosphere: 'storm' }),
    'partlycloudy':     Object.freeze({ type: 'cloud', count: 0,   cloud: 20, wind: 0.2, rays: true, atmosphere: 'fair' }), 
    'pouring':          Object.freeze({ type: 'rain',  count: 350, cloud: 32, wind: 1.5, dark: true, rays: false, puddles: true, atmosphere: 'storm' }),
    'rainy':            Object.freeze({ type: 'rain',  count: 120, cloud: 50, wind: 0.6, rays: false, puddles: true, atmosphere: 'rain' }),
    'snowy':            Object.freeze({ type: 'snow',  count: 50, cloud: 40, wind: 0.3, rays: false, atmosphere: 'snow' }),
    'snowy-rainy':      Object.freeze({ type: 'mix',   count: 100, cloud: 24, wind: 0.4, rays: false, atmosphere: 'snow' }),
    'sunny':            Object.freeze({ type: 'sun',   count: 0,   cloud: 4,  wind: 0.1, rays: true, atmosphere: 'clear' }),
    'windy':            Object.freeze({ type: 'cloud', count: 0,   cloud: 16, wind: 1.8, leaves: true, rays: false, atmosphere: 'windy' }),
    'windy-variant':    Object.freeze({ type: 'cloud', count: 0,   cloud: 22, wind: 2.0, dark: false, leaves: true, rays: false, atmosphere: 'windy' }),
    'exceptional':      Object.freeze({ type: 'sun',   count: 0,   cloud: 0,  wind: 0.1, rays: true, atmosphere: 'clear' }),
    'default':          Object.freeze({ type: 'none',  count: 0,   cloud: 4,  wind: 0.1, rays: false, atmosphere: 'fair' })
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
    MAX_RIPPLES: 25,
    MAX_SHOOTING_STARS: 2,
    MAX_BOLTS: 3,
    MAX_COMETS: 1,
    MAX_PLANES: 2,
    MAX_DUST: 40,
    MAX_MIST_WISPS: 15,
    MAX_SUN_CLOUDS: 5,
    MAX_MOON_CLOUDS: 4
});

// V4.1: Celestial body position constants - defined once for consistency
const CELESTIAL_POSITION = Object.freeze({
    x: 90,
    y: 90
});

// V4.2: Performance configuration
const PERFORMANCE_CONFIG = Object.freeze({
    RESIZE_DEBOUNCE_MS: 150,        // Debounce delay for particle reinitialization
    VISIBILITY_THRESHOLD: 0.01,     // IntersectionObserver threshold (1% visible)
    REVEAL_TRANSITION_MS: 300,      // Fade-in duration after initialization
    MAX_DPR: 2.0,                   // OPTIMIZED: Reduced from 2 to 1.5 (Massive performance gain)
    TARGET_FPS: 30                  // OPTIMIZED: Target 30fps instead of 60/120fps
});

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

// ============================================================================
// PARTICLE POOL - Reuses particles to reduce garbage collection
// ============================================================================
class ParticlePool {
    constructor(createFn, resetFn, initialSize = 100) {
        this._pool = [];
        this._active = [];
        this._createFn = createFn;
        this._resetFn = resetFn;
        
        // Pre-allocate
        for (let i = 0; i < initialSize; i++) {
            this._pool.push(this._createFn());
        }
    }
    
    acquire(initData) {
        let particle = this._pool.pop();
        if (!particle) {
            particle = this._createFn();
        }
        this._resetFn(particle, initData);
        particle._poolActive = true;
        particle._fadeIn = 0; // For smooth transitions
        this._active.push(particle);
        return particle;
    }
    
    release(particle) {
        particle._poolActive = false;
        const idx = this._active.indexOf(particle);
        if (idx !== -1) {
            this._active.splice(idx, 1);
            this._pool.push(particle);
        }
    }
    
    releaseAll() {
        while (this._active.length > 0) {
            const p = this._active.pop();
            p._poolActive = false;
            this._pool.push(p);
        }
    }
    
    getActive() {
        return this._active;
    }
    
    get activeCount() {
        return this._active.length;
    }
}

// ============================================================================
// MAIN CARD CLASS
// ============================================================================
class AtmosphericWeatherCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Animation state
        this._animID = null;
        this._lastFrameTime = 0;
        this._frameCount = 0;
        
        // Particle arrays (using pools where beneficial)
        this._particles = [];
        this._clouds = [];
        this._stars = [];
        this._bolts = [];
        this._fogBanks = [];
        this._leaves = [];
        this._ripples = [];
        this._shootingStars = [];
        this._planes = [];
        this._comets = [];
        this._dustMotes = [];
        this._mistWisps = [];
        this._sunClouds = [];      // V4: Clouds near sun for ray visibility
        this._moonClouds = [];     // V4: Clouds in front of moon
        
        // Weather parameters
        this._params = WEATHER_MAP['default'];
        this._flashOpacity = 0;
        this._isNight = false;
        this._lastState = null;
        
        // State initialization tracking - prevents sun/moon position pop
        this._stateInitialized = false;
        this._hasReceivedFirstHass = false;
        
        // Moon phase tracking
        this._moonPhaseState = 'full_moon';
        this._moonPhaseConfig = MOON_PHASES['full_moon'];
        
        // Wind simulation
        this._windGust = 0;
        this._gustPhase = 0;
        this._windSpeed = 0.1;
        this._microGustPhase = 0;
        
        // Smooth transitions - for smoother layer transitions
        this._transitionProgress = 1;
        this._oldParams = null;
        this._newParams = null;
        this._transitionDuration = 2500;
        this._transitionStart = 0;
        this._particleFadeState = 'stable'; // 'stable', 'fading-out', 'fading-in'
        this._particleFadeProgress = 1;
        this._globalFadeProgress = 1;       // V4: Global fade for all elements
        this._layerFadeProgress = {         // V4: Per-layer fade tracking
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
        
        // Enhanced resize handling - debounced to prevent scroll jank
        this._resizeDebounceTimer = null;
        this._lastResizeTime = 0;
        this._pendingResize = false;
        this._cachedDimensions = { width: 0, height: 0, dpr: 1 };
        
        // Zero-pop initialization gate
        this._renderGate = {
            hasValidDimensions: false,
            hasFirstHass: false,
            isRevealed: false
        };
        
        // Visibility-based animation control (battery optimization)
        this._isVisible = false;
        this._intersectionObserver = null;
        
        // Error state tracking
        this._entityErrors = new Map();
        this._lastErrorLog = 0;
        
        // Bind methods
        this._boundAnimate = this._animate.bind(this);
        this._boundResize = this._handleResize.bind(this);
        this._boundVisibilityChange = this._handleVisibilityChange.bind(this);
    }

    // ========================================================================
    // DOM INITIALIZATION
    // ========================================================================
    _initDOM() {
        if (this._initialized) return;
        this._initialized = true;

        const style = document.createElement('style');
        style.textContent = `
            :host { 
                display: block; 
                width: 100%;
                background: transparent;
                --card-background-color: var(--ha-card-background, #e4e4e4);
            }

            #card-root {
                z-index: 0 !important;
                pointer-events: none;
                position: relative;
                width: 100%;
                height: 200px;
                overflow: hidden;
                border-radius: var(--ha-card-border-radius, 12px);
                background: transparent; 
                display: flex;
                justify-content: flex-end;
                transform: translateZ(0);
                will-change: transform, opacity;
                contain: layout style paint;
                /* V4.2: Start hidden to prevent pop glitch */
                opacity: 0;
                transition: opacity ${PERFORMANCE_CONFIG.REVEAL_TRANSITION_MS}ms ease-out;
            }

            /* FULL WIDTH MODE */
            #card-root.full-width {
                margin: 0px calc(var(--ha-view-sections-narrow-column-gap, var(--ha-card-margin, 8px)) * -1) !important;
                padding: 0px var(--ha-view-sections-narrow-column-gap, var(--ha-card-margin, 8px)) !important;
            }
            
            #card-root.revealed {
                opacity: 1;
            }
            
            canvas { 
                position: absolute; 
                top: 0; 
                left: 0; 
                width: 100%; 
                height: 100%; 
                pointer-events: none;
                
                --mask-vertical: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
                --mask-horizontal: linear-gradient(to right, transparent, black 20%, black 80%, transparent);
                -webkit-mask-image: var(--mask-vertical), var(--mask-horizontal);
                mask-image: var(--mask-vertical), var(--mask-horizontal);
                -webkit-mask-composite: source-in;
                mask-composite: intersect;
            }
            
            img {
                position: relative;
                height: 100%;
                width: auto;
                object-fit: contain;
                z-index: 2; 
                pointer-events: none;
                user-select: none;
                transition: opacity 0.3s ease-in-out;
            }
            
            #bg-canvas { 
                z-index: 0; 
                -webkit-mask-image: none !important; 
                mask-image: none !important; 
            }
            #mid-canvas { z-index: 1; }
            #fg-canvas { z-index: 3; }
        `;

        const root = document.createElement('div');
        root.id = 'card-root';
        
        const bg = document.createElement('canvas');
        bg.id = 'bg-canvas';
        
        const mid = document.createElement('canvas');
        mid.id = 'mid-canvas';
        
        const fg = document.createElement('canvas');
        fg.id = 'fg-canvas';
        
        const img = document.createElement('img');
        img.onerror = () => { img.style.opacity = '0'; };
        img.onload = () => { img.style.opacity = '1'; };

        root.append(bg, mid, img, fg);
        this.shadowRoot.append(style, root);

        this._elements = { root, bg, mid, img, fg };
        
        // Get canvas contexts with optimization hints
        const ctxOptions = { 
            alpha: true, 
            // desynchronized: true,
            willReadFrequently: false 
        };
        
        const bgCtx = bg.getContext('2d', ctxOptions);
        const midCtx = mid.getContext('2d', ctxOptions);
        const fgCtx = fg.getContext('2d', ctxOptions);
        
        if (!bgCtx || !midCtx || !fgCtx) {
            console.error('HOME-CARD: Failed to get canvas context');
            return;
        }
        
        this._ctxs = { bg: bgCtx, mid: midCtx, fg: fgCtx };
        this._updateBackgroundColor();
    }

    // ========================================================================
    // THEME/BACKGROUND DETECTION
    // ========================================================================
    _updateBackgroundColor() {
        if (!this._elements?.root) return;
        
        try {
            const computedStyle = getComputedStyle(this);
            let bgColor = computedStyle.getPropertyValue('--card-background-color').trim() || '#e4e4e4';
            
            if (bgColor !== this._bgColor) {
                this._bgColor = bgColor;
                this._bgLuminance = this._calculateLuminance(bgColor);
                this._isLightBackground = this._bgLuminance > 0.45;
            }
        } catch (e) {
            // Fallback if getComputedStyle fails
            this._isLightBackground = false;
        }
    }

    _calculateLuminance(color) {
        if (!color || typeof color !== 'string') return 0.5;
        
        let r, g, b;
        
        try {
            if (color.startsWith('rgb')) {
                const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                if (match) {
                    r = parseInt(match[1], 10) / 255;
                    g = parseInt(match[2], 10) / 255;
                    b = parseInt(match[3], 10) / 255;
                } else {
                    return 0.5;
                }
            } else {
                let hex = color.replace('#', '');
                if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
                if (hex.length !== 6) return 0.5;
                r = parseInt(hex.substr(0, 2), 16) / 255;
                g = parseInt(hex.substr(2, 2), 16) / 255;
                b = parseInt(hex.substr(4, 2), 16) / 255;
            }
            
            // sRGB luminance calculation
            const toLinear = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
        } catch (e) {
            return 0.5;
        }
    }

    // ========================================================================
    // ENTITY HELPER METHODS WITH ERROR HANDLING
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

    // ========================================================================
    // CONFIGURATION & LIFECYCLE
    // ========================================================================
    setConfig(config) {
        if (!config.weather_entity) throw new Error("Define 'weather_entity'");
        this._config = config;
        this._initDOM();
    }

    connectedCallback() {
        // Set up ResizeObserver with debounced handling
        if (!this._resizeObserver) {
            this._resizeObserver = new ResizeObserver((entries) => {
                // Immediately update canvas dimensions (cheap operation)
                this._updateCanvasDimensions();
                
                // Debounce the expensive particle reinitialization
                this._scheduleParticleReinit();
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
            this._intersectionObserver.observe(this._elements.root);
        }
        
        // Don't start animation until visible (handled by IntersectionObserver)
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
        
        // Clear all arrays
        this._clearAllParticles();
    }
    
    _clearAllParticles() {
        this._particles = [];
        this._clouds = [];
        this._stars = [];
        this._bolts = [];
        this._fogBanks = [];
        this._leaves = [];
        this._ripples = [];
        this._shootingStars = [];
        this._planes = [];
        this._comets = [];
        this._dustMotes = [];
        this._mistWisps = [];
        this._sunClouds = [];
        this._moonClouds = [];
        this._aurora = null;
    }

    // ========================================================================
    // VISIBILITY-BASED ANIMATION CONTROL (Battery Optimization)
    // ========================================================================
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

    // ========================================================================
    // DEBOUNCED RESIZE HANDLING (Scroll Jank Prevention)
    // ========================================================================
    _handleResize() {
        // This is now only called for legacy compatibility
        this._updateCanvasDimensions();
        this._scheduleParticleReinit();
    }
    
    /**
     * Immediately update canvas dimensions without particle reinitialization.
     * This is a cheap operation that can run on every resize event.
     */
    _updateCanvasDimensions() {
        if (!this._elements?.root || !this._ctxs) return;
        
        const rect = this._elements.root.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        
        const dpr = Math.min(window.devicePixelRatio || 1, PERFORMANCE_CONFIG.MAX_DPR);
        const scaledWidth = Math.floor(rect.width * dpr);
        const scaledHeight = Math.floor(rect.height * dpr);
        
        // Check if dimensions actually changed
        const dimensionsChanged = 
            this._cachedDimensions.width !== scaledWidth ||
            this._cachedDimensions.height !== scaledHeight ||
            this._cachedDimensions.dpr !== dpr;
        
        if (!dimensionsChanged) return;
        
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
                canvas.style.width = `${rect.width}px`;
                canvas.style.height = `${rect.height}px`;
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.scale(dpr, dpr);
            }
        });
        
        // Mark that we have valid dimensions for the render gate
        if (scaledWidth > 0 && scaledHeight > 0) {
            this._renderGate.hasValidDimensions = true;
            this._checkRenderGate();
        }
    }
    
    /**
     * Schedule particle reinitialization with debounce.
     * This prevents main thread locking during rapid resize events (e.g., mobile address bar).
     */
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
            
            if (this._pendingResize && this._transitionProgress >= 1 && this._stateInitialized) {
                this._pendingResize = false;
                this._initParticles();
            }
        }, PERFORMANCE_CONFIG.RESIZE_DEBOUNCE_MS);
    }
    
    /**
     * Check if all conditions are met to reveal the card.
     * This prevents the "pop" glitch by ensuring no frames render at wrong coordinates.
     */
    _checkRenderGate() {
        if (this._renderGate.isRevealed) return;
        
        const canReveal = 
            this._renderGate.hasValidDimensions &&
            this._renderGate.hasFirstHass &&
            this._stateInitialized;
        
        if (canReveal) {
            this._renderGate.isRevealed = true;
            
            // Reveal the card with a smooth transition
            if (this._elements?.root) {
                // Use requestAnimationFrame to ensure the browser has painted
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        this._elements.root.classList.add('revealed');
                    });
                });
            }
        }
    }

    // ========================================================================
    // HOME ASSISTANT STATE UPDATES
    // ========================================================================
    set hass(hass) {
        if (!hass || !this._config) return;
        
        // --- FULL WIDTH MODE ---
        // 1. Check if the user set "full_width: true" in YAML
        const useFullWidth = this._config.full_width === true;

        // 2. Apply or remove the class on the root element
        if (this._elements?.root) {
            if (useFullWidth) {
                this._elements.root.classList.add('full-width');
            } else {
                this._elements.root.classList.remove('full-width');
            }
        }

        // Use safe entity getter with error handling
        const wEntity = this._getEntityState(hass, this._config.weather_entity);
        if (!wEntity) {
            // Weather entity unavailable - keep current state
            return;
        }
        
        // Safe entity access for optional entities
        const dEntity = this._config.door_entity 
            ? this._getEntityState(hass, this._config.door_entity) 
            : null;

        const themeEntity = this._config.theme_entity 
            ? this._getEntityState(hass, this._config.theme_entity)
            : null;
        
        // Moon phase entity support (Optional)
        // If not defined, defaults to null (logic below will fallback to full moon)
        const moonEntityId = this._config.moon_phase_entity;
        const moonEntity = moonEntityId ? this._getEntityState(hass, moonEntityId) : null; 
        
		if (moonEntity && moonEntity.state !== this._moonPhaseState) {
            this._moonPhaseState = moonEntity.state;
            this._moonPhaseConfig = MOON_PHASES[moonEntity.state] || MOON_PHASES['full_moon'];
        }

        // Safe boolean checks
        const doorOpen = dEntity && dEntity.state === 'on';
        const isNight = themeEntity ? /dark|night/i.test(themeEntity.state || '') : false;

        // Safe attribute access with validation
        const windSpeedRaw = this._getEntityAttribute(wEntity, 'wind_speed', 0);
        const windSpeed = typeof windSpeedRaw === 'number' ? windSpeedRaw : parseFloat(windSpeedRaw) || 0;
        this._windSpeed = Math.min(Math.max(windSpeed / 10, 0), 2);

        // Image selection with null checks
        let src = doorOpen 
            ? (isNight ? this._config.door_open_night : this._config.door_open_day)
            : (isNight ? this._config.night : this._config.day);
        if (!src) src = this._config.day || '';

        if (this._elements?.img && src && this._elements.img.getAttribute('src') !== src) {
            this._elements.img.src = src;
        }

        // Track first hass reception for render gate
        const isFirstHass = !this._hasReceivedFirstHass;
        this._hasReceivedFirstHass = true;
        this._renderGate.hasFirstHass = true;

        // Weather state change handling
        const weatherState = wEntity.state || 'default';
        if (this._lastState !== weatherState || this._isNight !== isNight) {
            const prevState = this._lastState;
            this._lastState = weatherState;
            this._isNight = isNight;
            
            const key = weatherState.toLowerCase();
            let newParams = { ...(WEATHER_MAP[key] || WEATHER_MAP['default']) };
            
            // Night sky override
            if (this._isNight && (key === 'sunny' || key === 'clear-night')) {
                newParams = { ...newParams, type: 'stars', count: 280 };
            }
            
            // On first hass, immediately set state without transition to prevent pop
            if (isFirstHass) {
                this._params = newParams;
                this._stateInitialized = true;
                this._cloudsSorted = false;
                
                // Initialize particles if we have valid dimensions
                if (this._renderGate.hasValidDimensions) {
                    this._initParticles();
                }
                
                // Check render gate
                this._checkRenderGate();
            }
            // Smooth transition handling - V4: Enhanced
            else if (this.isConnected && prevState !== null && this._params) {
                this._oldParams = { ...this._params };
                this._newParams = newParams;
                this._transitionProgress = 0;
                this._transitionStart = performance.now();
                this._particleFadeState = 'fading-out';
                this._particleFadeProgress = 1;
                this._globalFadeProgress = 1;
                // Reset layer fades
                Object.keys(this._layerFadeProgress).forEach(k => {
                    this._layerFadeProgress[k] = 1;
                });
                this._cloudsSorted = false;
            } else {
                this._params = newParams;
                this._stateInitialized = true;
                this._cloudsSorted = false;
                
                if (this._renderGate.hasValidDimensions) {
                    this._initParticles();
                }
                
                this._checkRenderGate();
            }
        }
        
        this._updateBackgroundColor();
    }

    // ========================================================================
    // CANVAS RESIZE
    // ========================================================================
    _resize() {
        this._handleResize();
    }

    // ========================================================================
    // SMOOTH PARAMETER TRANSITIONS - smoother layer handling
    // ========================================================================
    _lerpParams(old, newer, t) {
        if (!old || !newer) return newer || old || this._params;
        
        // Smooth easing function
        const eased = t < 0.5 
            ? 4 * t * t * t 
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
        
        return {
            type: eased < 0.5 ? old.type : newer.type,
            count: Math.floor((old.count || 0) + ((newer.count || 0) - (old.count || 0)) * eased),
            cloud: Math.floor((old.cloud || 0) + ((newer.cloud || 0) - (old.cloud || 0)) * eased),
            wind: (old.wind || 0.1) + ((newer.wind || 0.1) - (old.wind || 0.1)) * eased,
            dark: eased < 0.5 ? old.dark : newer.dark,
            thunder: eased < 0.5 ? old.thunder : newer.thunder,
            rays: eased < 0.5 ? old.rays : newer.rays,
            puddles: eased < 0.5 ? old.puddles : newer.puddles,
            leaves: eased < 0.5 ? old.leaves : newer.leaves,
            atmosphere: eased < 0.5 ? old.atmosphere : newer.atmosphere,
            foggy: eased < 0.5 ? old.foggy : newer.foggy
        };
    }

    _updateTransition() {
        if (this._transitionProgress >= 1) return;
        
        const elapsed = performance.now() - this._transitionStart;
        this._transitionProgress = Math.min(elapsed / this._transitionDuration, 1);
        
        // Smoother easing for global fade
        const smoothStep = (t) => t * t * (3 - 2 * t);
        
        // Handle particle fade states for smooth transitions
        if (this._particleFadeState === 'fading-out') {
            const fadeOutDuration = this._transitionDuration * 0.35;
            this._particleFadeProgress = Math.max(0, 1 - smoothStep(elapsed / fadeOutDuration));
            this._globalFadeProgress = this._particleFadeProgress;
            
            // Stagger layer fades for smoother transition
            this._layerFadeProgress.precipitation = Math.max(0, 1 - smoothStep(elapsed / (fadeOutDuration * 0.8)));
            this._layerFadeProgress.effects = Math.max(0, 1 - smoothStep(elapsed / (fadeOutDuration * 0.9)));
            this._layerFadeProgress.clouds = Math.max(0, 1 - smoothStep(elapsed / fadeOutDuration));
            this._layerFadeProgress.stars = Math.max(0, 1 - smoothStep(elapsed / (fadeOutDuration * 1.1)));
            
            if (this._particleFadeProgress <= 0) {
                this._particleFadeState = 'fading-in';
                this._params = this._lerpParams(this._oldParams, this._newParams, 0.5);
                this._stateInitialized = true;
                this._initParticles();
            }
        } else if (this._particleFadeState === 'fading-in') {
            const fadeInStart = this._transitionDuration * 0.35;
            const fadeInDuration = this._transitionDuration * 0.45;
            const fadeInElapsed = Math.max(0, elapsed - fadeInStart);
            this._particleFadeProgress = Math.min(1, smoothStep(fadeInElapsed / fadeInDuration));
            this._globalFadeProgress = this._particleFadeProgress;
            
            // Stagger layer fade-ins
            this._layerFadeProgress.stars = Math.min(1, smoothStep(fadeInElapsed / (fadeInDuration * 0.9)));
            this._layerFadeProgress.clouds = Math.min(1, smoothStep(fadeInElapsed / fadeInDuration));
            this._layerFadeProgress.effects = Math.min(1, smoothStep(fadeInElapsed / (fadeInDuration * 1.1)));
            this._layerFadeProgress.precipitation = Math.min(1, smoothStep(fadeInElapsed / (fadeInDuration * 1.2)));
        }
        
        if (this._transitionProgress >= 1) {
            this._transitionProgress = 1;
            this._params = this._newParams;
            this._oldParams = null;
            this._newParams = null;
            this._particleFadeState = 'stable';
            this._particleFadeProgress = 1;
            this._globalFadeProgress = 1;
            Object.keys(this._layerFadeProgress).forEach(k => {
                this._layerFadeProgress[k] = 1;
            });
            this._stateInitialized = true;
            this._initParticles();
        } else {
            this._params = this._lerpParams(this._oldParams, this._newParams, this._transitionProgress);
        }
    }

    // ========================================================================
    // STAR COUNT CALCULATION
    // ========================================================================
    _getStarCountForWeather(baseParams) {
        if (!this._isNight) return 0;
        if (!baseParams) return 0;
        
        const cloudCoverage = baseParams.cloud || 0;
        const isDark = baseParams.dark || false;
        
        if (baseParams.type === 'stars' || cloudCoverage === 0) return 280;
        if (cloudCoverage < 5) return 220;
        if (cloudCoverage < 10) return 160;
        if (cloudCoverage < 15) return 100;
        if (cloudCoverage < 25) return 60;
        return isDark ? 15 : 30;
    }

    // ========================================================================
    // PARTICLE INITIALIZATION
    // ========================================================================
    _initParticles() {
        if (!this._elements?.root) return;
        
        const w = this._elements.root.clientWidth;
        const h = this._elements.root.clientHeight;
        const p = this._params;
        
        if (w === 0 || h === 0 || !p) return;

        // Clear existing particles
        this._clearAllParticles();

        // Aurora (much more rare - only on very clear nights)
        if (this._isNight && p.type === 'stars' && (p.cloud || 0) < 3 && Math.random() < 0.06) {
            this._initAurora(w, h);
        }

        // Comet (very rare)
        if (this._isNight && p.type === 'stars' && Math.random() < 0.008) {
            this._comets.push(this._createComet(w, h));
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
        const starCount = this._getStarCountForWeather(p);
        if (starCount > 0) {
            this._initStars(w, h, starCount);
        }

        // Leaves for windy weather
        if (p.leaves) {
            this._initLeaves(w, h);
        }

        // Dust motes for sunny/fair weather
        if (p.atmosphere === 'clear' || p.atmosphere === 'fair') {
            this._initDustMotes(w, h);
        }

        // Mist wisps for fog/rain
        if (p.atmosphere === 'mist' || p.atmosphere === 'rain') {
            this._initMistWisps(w, h);
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
            x: w * 0.85,
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
        return {
            x: goingRight ? -50 : w + 50,
            y: h * 0.15 + Math.random() * (h * 0.25),
            vx: goingRight ? 0.6 : -0.6,
            blink: 0,
            blinkPhase: Math.random() * Math.PI * 2
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
                    ? (0.2 + layer * 0.15 + Math.random() * 0.1)
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
                    speedY: (9 + Math.random() * 7) * z,
                    len: (14 + Math.random() * 14) * z,
                    op: this._isLightBackground ? 0.35 + Math.random() * 0.35 : 0.25 + Math.random() * 0.35
                });
            } else { // snow
                Object.assign(particle, {
                    speedY: (0.6 + Math.random() * 1.2) * z,
                    size: (1.5 + Math.random() * 2.5) * z,
                    wobblePhase: Math.random() * Math.PI * 2,
                    wobbleSpeed: 0.02 + Math.random() * 0.02,
                    op: 0.5 + Math.random() * 0.4
                });
            }
            
            this._particles.push(particle);
        }
    }

    // Enhanced cloud initialization with variety
    _initClouds(w, h, p) {
        const cloudCount = p.cloud || 0;
        for (let i = 0; i < cloudCount; i++) {
            const layer = Math.floor(Math.random() * 5);
            const isStorm = p.dark;
            const seed = Math.random() * 10000;
            
            // V4.1: Choose cloud variety based on weather and randomness
            let puffs;
            const varietyRoll = Math.random();
            
            if (isStorm) {
                // Storm clouds are always dense organic
                puffs = CloudShapeGenerator.generateOrganicPuffs(true, seed);
            } else if (varietyRoll < 0.4) {
                // 40% puffy cumulus
                puffs = CloudShapeGenerator.generateMixedPuffs(seed, 'cumulus');
            } else if (varietyRoll < 0.6) {
                // 20% stratus (flat layers)
                puffs = CloudShapeGenerator.generateMixedPuffs(seed, 'stratus');
            } else if (varietyRoll < 0.75 && layer > 2) {
                // 15% cirrus (only higher layers)
                puffs = CloudShapeGenerator.generateMixedPuffs(seed, 'cirrus');
            } else {
                // 25% classic organic
                puffs = CloudShapeGenerator.generateOrganicPuffs(false, seed);
            }
            
            this._clouds.push({
                x: Math.random() * w,
                y: Math.random() * (h * 0.45),
                scale: 0.65 + layer * 0.12,
                speed: (0.03 + Math.random() * 0.06) * (layer + 1),
                puffs,
                layer,
                opacity: 1 - layer * 0.12,
                seed,
                // For subtle animation
                breathPhase: Math.random() * Math.PI * 2,
                breathSpeed: 0.003 + Math.random() * 0.004
            });
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

    // Repositioned sun clouds - now 20px below sun with increased opacity
    _initSunClouds(w, h) {
        const count = Math.min(LIMITS.MAX_SUN_CLOUDS, 3 + Math.floor(Math.random() * 2));
        const sunX = CELESTIAL_POSITION.x;
        const sunY = CELESTIAL_POSITION.y;
        
        for (let i = 0; i < count; i++) {
            const seed = Math.random() * 10000;
            // Use special sun enhancement puffs for better visibility
            const puffs = CloudShapeGenerator.generateSunEnhancementPuffs(seed);
            
            // Position clouds about 20px below the sun, spread horizontally
            const horizontalSpread = (i - (count - 1) / 2) * 35 + (Math.random() - 0.5) * 20;
            const verticalOffset = 20 + Math.random() * 15; // 20-35px below sun
            
            this._sunClouds.push({
                x: sunX + horizontalSpread,
                y: sunY + verticalOffset,
                scale: 0.6 + Math.random() * 0.25, // Slightly larger
                speed: 0.015 + Math.random() * 0.015,
                puffs,
                opacity: 0.55 + Math.random() * 0.2, // V4.1: Increased opacity (was 0.4 + 0.25)
                seed,
                breathPhase: Math.random() * Math.PI * 2,
                breathSpeed: 0.004,
                // V4.1: Track base position for gentle movement
                baseX: sunX + horizontalSpread,
                baseY: sunY + verticalOffset,
                driftPhase: Math.random() * Math.PI * 2
            });
        }
    }

    // Moon clouds for cloudy nights
    _initMoonClouds(w, h) {
        const cloudiness = Math.min((this._params?.cloud || 0) / 40, 1);
        const count = Math.min(LIMITS.MAX_MOON_CLOUDS, 1 + Math.floor(cloudiness * 3));
        
        for (let i = 0; i < count; i++) {
            const seed = Math.random() * 10000;
            const puffs = CloudShapeGenerator.generateWispyPuffs(seed);
            
            // Position clouds around/in front of moon
            const angle = (i / count) * Math.PI * 0.8 + Math.PI * 0.1 + (Math.random() - 0.5) * 0.4;
            const dist = 30 + Math.random() * 40;
            
            this._moonClouds.push({
                x: CELESTIAL_POSITION.x + Math.cos(angle) * dist,
                y: CELESTIAL_POSITION.y + Math.sin(angle) * dist,
                scale: 0.4 + Math.random() * 0.3,
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
        for (let i = 0; i < count; i++) {
            // Create star clusters for more natural look
            const isCluster = Math.random() < 0.3;
            const baseX = Math.random() * w;
            const baseY = Math.random() * h * 0.75;
            
            this._stars.push({
                x: isCluster ? baseX + (Math.random() - 0.5) * 30 : baseX,
                y: isCluster ? baseY + (Math.random() - 0.5) * 20 : baseY,
                size: Math.random() * 1.8 + 0.4,
                phase: Math.random() * Math.PI * 2,
                speed: 0.008 + Math.random() * 0.04,
                brightness: 0.4 + Math.random() * 0.6,
                // Some stars have subtle color tints
                color: Math.random() < 0.15 
                    ? `hsl(${Math.random() * 60 + 200}, 30%, 90%)` 
                    : 'rgba(255, 255, 250, 1)'
            });
        }
    }

    _initLeaves(w, h) {
        for (let i = 0; i < 35; i++) {
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
        const count = Math.min(LIMITS.MAX_DUST, 30);
        for (let i = 0; i < count; i++) {
            this._dustMotes.push({
                x: Math.random() * w,
                y: Math.random() * h,
                size: 0.5 + Math.random() * 1.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.2,
                phase: Math.random() * Math.PI * 2,
                opacity: 0.15 + Math.random() * 0.25
            });
        }
    }

    _initMistWisps(w, h) {
        const count = Math.min(LIMITS.MAX_MIST_WISPS, 12);
        for (let i = 0; i < count; i++) {
            this._mistWisps.push({
                x: Math.random() * w,
                y: h * 0.5 + Math.random() * (h * 0.5),
                width: 80 + Math.random() * 120,
                height: 20 + Math.random() * 30,
                speed: (Math.random() - 0.5) * 0.4,
                opacity: 0.08 + Math.random() * 0.12,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    // ========================================================================
    // LIGHTNING BOLT GENERATOR
    // ========================================================================
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
    // DRAWING HELPERS
    // ========================================================================
    _shouldShowSun() {
        if (this._isNight) return false;
        const goodWeather = ['sunny', 'partlycloudy', 'clear-night', 'exceptional'];
        const currentWeather = (this._lastState || '').toLowerCase();
        return goodWeather.includes(currentWeather);
    }

    // ========================================================================
    // SUN RAYS - Enhanced with cloud interaction for light theme visibility
    // ========================================================================
    _drawLightRays(ctx, w, h) {
        const rayCount = 8;
        const fadeOpacity = this._layerFadeProgress.effects;
        
        ctx.save();
        
        const centerX = CELESTIAL_POSITION.x; 
        const centerY = CELESTIAL_POSITION.y; 
        
        const baseAngle = Math.PI * 0.2;
        const spread = Math.PI * 0.45;

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
            
            // Calculate perpendicular offset for ray width
            const perpAngle = angle + Math.PI / 2;
            const perpX = Math.cos(perpAngle) * rayWidth;
            const perpY = Math.sin(perpAngle) * rayWidth;
            
            ctx.lineTo(endX - perpX, endY - perpY);
            ctx.lineTo(endX + perpX, endY + perpY);
            ctx.closePath();
            
            // Create gradient
            const g = ctx.createLinearGradient(centerX, centerY, endX, endY);
            
            if (this._isLightBackground) {
                // Enhanced contrast for light backgrounds
                ctx.globalCompositeOperation = 'multiply';
                g.addColorStop(0, `rgba(255, 200, 80, ${intensity * 0.5})`);
                g.addColorStop(0.15, `rgba(255, 210, 100, ${intensity * 0.4})`);
                g.addColorStop(0.4, `rgba(255, 230, 160, ${intensity * 0.2})`);
                g.addColorStop(1, 'rgba(255, 255, 255, 0)');
            } else {
                // For dark backgrounds: use screen blend for bright rays
                ctx.globalCompositeOperation = 'screen';
                g.addColorStop(0, `rgba(255, 245, 200, ${intensity * 1.5})`);
                g.addColorStop(0.4, `rgba(255, 250, 230, ${intensity * 0.8})`);
                g.addColorStop(1, 'rgba(255, 255, 255, 0)');
            }
            
            ctx.fillStyle = g;
            ctx.fill();
        }
        
        // Second pass with overlay for light theme - creates more visible golden glow
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

    // ========================================================================
    // Sun clouds - Draw wispy clouds near sun to enhance ray visibility
    // ========================================================================
    _drawSunClouds(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.clouds;
        if (fadeOpacity <= 0) return;
        
        for (let i = 0; i < this._sunClouds.length; i++) {
            const cloud = this._sunClouds[i];
            
            // Gentle drifting movement that keeps clouds near the sun
            cloud.driftPhase += 0.008;
            cloud.breathPhase += cloud.breathSpeed;
            
            // Gentle horizontal drift with return to base position
            const driftX = Math.sin(cloud.driftPhase) * 12;
            const driftY = Math.cos(cloud.driftPhase * 0.7) * 4;
            
            cloud.x = cloud.baseX + driftX + effectiveWind * 0.3;
            cloud.y = cloud.baseY + driftY;
            
            // Keep clouds in reasonable bounds near sun
            if (cloud.x > cloud.baseX + 60) cloud.x = cloud.baseX + 60;
            if (cloud.x < cloud.baseX - 60) cloud.x = cloud.baseX - 60;
            
            const breathScale = 1 + Math.sin(cloud.breathPhase) * 0.02;
            
            ctx.save();
            ctx.translate(cloud.x, cloud.y);
            ctx.scale(cloud.scale * breathScale, cloud.scale * 0.55 * breathScale);
            
            // Draw with special sun-lit colors - lighter and more visible
            for (let j = 0; j < cloud.puffs.length; j++) {
                const puff = cloud.puffs[j];
                
                const gradient = ctx.createRadialGradient(
                    puff.dx - puff.rad * 0.2, puff.dy - puff.rad * 0.2, 0,
                    puff.dx, puff.dy, puff.rad
                );
                
                // Brighter, more visible sun-lit cloud colors
                const opacity = cloud.opacity * puff.shade * fadeOpacity;
                gradient.addColorStop(0, `rgba(255, 252, 245, ${opacity * 0.95})`);
                gradient.addColorStop(0.25, `rgba(255, 248, 235, ${opacity * 0.8})`);
                gradient.addColorStop(0.5, `rgba(252, 242, 218, ${opacity * 0.55})`);
                gradient.addColorStop(0.75, `rgba(248, 235, 200, ${opacity * 0.3})`);
                gradient.addColorStop(1, `rgba(245, 228, 185, 0)`);
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(puff.dx, puff.dy, puff.rad, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    }

    // ========================================================================
    // SUN GLOW
    // ========================================================================
    _drawSunGlow(ctx, w, h) {
        if (!this._shouldShowSun()) return;
        
        const fadeOpacity = this._layerFadeProgress.effects;
        
        ctx.save();
        
        const centerX = CELESTIAL_POSITION.x;
        const centerY = CELESTIAL_POSITION.y;
        
        // Outer atmospheric glow
        ctx.globalCompositeOperation = this._isLightBackground ? 'overlay' : 'lighter';
        
        const maxRadius = Math.max(w, h) * 0.6;
        const g = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
        
        if (this._isLightBackground) {
            g.addColorStop(0, `rgba(255, 240, 180, ${0.35 * fadeOpacity})`);
            g.addColorStop(0.2, `rgba(255, 245, 200, ${0.2 * fadeOpacity})`);
            g.addColorStop(0.5, `rgba(255, 250, 230, ${0.08 * fadeOpacity})`);
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
        const pulse = Math.sin(this._rayPhase * 0.4) * 0.12 + 0.88;
        const coreRadius = 70 * pulse;
        
        ctx.globalCompositeOperation = 'lighter';
        const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius);
        coreGrad.addColorStop(0, `rgba(255, 250, 200, ${0.7 * fadeOpacity})`);
        coreGrad.addColorStop(0.4, `rgba(255, 245, 180, ${0.35 * fadeOpacity})`);
        coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    // ========================================================================
    // ENHANCED CLOUD RENDERING
    // ========================================================================
    _drawClouds(ctx, w, h, effectiveWind, globalOpacity) {
        // Sort clouds by layer only when needed
        if (!this._cloudsSorted && this._clouds.length > 0) {
            this._clouds.sort((a, b) => a.layer - b.layer);
            this._cloudsSorted = true;
        }
        
        const fadeOpacity = this._layerFadeProgress.clouds;
        
        for (let i = 0; i < this._clouds.length; i++) {
            const cloud = this._clouds[i];
            
            // Movement with parallax
            cloud.x += cloud.speed * effectiveWind * (1 + cloud.layer * 0.1);
            if (cloud.x > w + 280) cloud.x = -280;
            if (cloud.x < -280) cloud.x = w + 280;
            
            // Subtle breathing animation
            cloud.breathPhase += cloud.breathSpeed;
            const breathScale = 1 + Math.sin(cloud.breathPhase) * 0.015;
            
            ctx.save();
            ctx.translate(cloud.x, cloud.y);
            
            const vScale = this._params?.dark ? 0.45 : 0.65;
            ctx.scale(cloud.scale * breathScale, cloud.scale * vScale * breathScale);
            
            // Determine cloud colors based on conditions
            const colors = this._getCloudColors(cloud);
            
            // Draw cloud puffs with improved rendering
            for (let j = 0; j < cloud.puffs.length; j++) {
                const puff = cloud.puffs[j];
                
                // Calculate shading based on vertical position
                const normalizedY = (puff.dy + 50) / 100;
                const shadeFactor = Math.max(0.3, 1 - normalizedY * 0.5);
                
                // Interpolate colors
                const litR = colors.lit[0] * shadeFactor + colors.shadow[0] * (1 - shadeFactor);
                const litG = colors.lit[1] * shadeFactor + colors.shadow[1] * (1 - shadeFactor);
                const litB = colors.lit[2] * shadeFactor + colors.shadow[2] * (1 - shadeFactor);
                
                const layerOpacity = cloud.opacity * (1 - cloud.layer * 0.1);
                const finalOpacity = globalOpacity * layerOpacity * colors.ambient * puff.shade * fadeOpacity;
                
                // Multi-stop gradient for volume
                const gradient = ctx.createRadialGradient(
                    puff.dx - puff.rad * 0.2, puff.dy - puff.rad * 0.3, 0,
                    puff.dx, puff.dy, puff.rad
                );
                
                gradient.addColorStop(0, `rgba(${litR|0}, ${litG|0}, ${litB|0}, ${finalOpacity})`);
                gradient.addColorStop(0.4, `rgba(${colors.mid[0]}, ${colors.mid[1]}, ${colors.mid[2]}, ${finalOpacity * 0.85})`);
                gradient.addColorStop(0.7, `rgba(${colors.shadow[0]|0}, ${colors.shadow[1]|0}, ${colors.shadow[2]|0}, ${finalOpacity * 0.6})`);
                gradient.addColorStop(1, `rgba(${colors.shadow[0]|0}, ${colors.shadow[1]|0}, ${colors.shadow[2]|0}, 0)`);
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(puff.dx, puff.dy, puff.rad * (1 + puff.softness * 0.1), 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    }

    _getCloudColors(cloud) {
        const isNightCloud = this._isNight && (this._params?.cloud || 0) < 5;
        
        if (isNightCloud) {
            return {
                lit: [50, 60, 85],
                mid: [40, 50, 70],
                shadow: [25, 32, 50],
                ambient: 0.15
            };
        }
        
        if (this._params?.dark) {
            if (this._isLightBackground) {
                return {
                    lit: [130, 135, 145],
                    mid: [105, 110, 120],
                    shadow: [80, 85, 95],
                    ambient: 0.88
                };
            }
            return {
                lit: [150, 155, 165],
                mid: [120, 125, 140],
                shadow: [90, 95, 115],
                ambient: 0.75
            };
        }
        
        if (this._isLightBackground) {
            return {
                lit: [252, 254, 255],
                mid: [235, 240, 248],
                shadow: [195, 205, 220],
                ambient: 0.92
            };
        }
        
        return {
            lit: [250, 252, 255],
            mid: [225, 235, 248],
            shadow: [160, 175, 200],
            ambient: 0.28
        };
    }

    // ========================================================================
    // RAIN RENDERING (OPTIMIZED)
    // ========================================================================
    _drawRain(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.precipitation;
        
        for (let i = 0; i < this._particles.length; i++) {
            const pt = this._particles[i];
            if (pt.type !== 'rain') continue;
            
            // Physics update
            pt.turbulence += 0.025;
            const turbX = Math.sin(pt.turbulence) * 0.4;
            pt.y += pt.speedY * (1 + this._windSpeed * 0.25);
            pt.x += effectiveWind * 1.8 + turbX;
            
            // Reset when off screen
            if (pt.y > h + 10) {
                pt.y = -15 - Math.random() * 20;
                pt.x = Math.random() * w;
                pt.turbulence = Math.random() * Math.PI * 2;
            }
            if (pt.x > w + 20) pt.x = -20;
            if (pt.x < -20) pt.x = w + 20;
            
            // Draw rain streak
            const streakLength = pt.len * 1.1;
            const endX = pt.x - effectiveWind * 1.5;
            const endY = pt.y + streakLength;
            
            const depthOpacity = (pt.z > 1.1 ? pt.op * 1.15 : pt.op * 0.7) * fadeOpacity;
            
            // OPTIMIZATION: Use solid color instead of gradient
            if (this._isLightBackground) {
                ctx.strokeStyle = `rgba(80, 110, 150, ${depthOpacity})`;
            } else {
                ctx.strokeStyle = `rgba(160, 185, 220, ${depthOpacity})`;
            }
            
            ctx.lineWidth = pt.z > 1.1 ? 1.5 : 1.0;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // Depth blur for close drops (optional - could be removed for more perf, kept for now)
            if (pt.z > 1.25) {
                ctx.strokeStyle = this._isLightBackground
                    ? `rgba(120, 150, 190, ${depthOpacity * 0.15})`
                    : `rgba(190, 210, 240, ${depthOpacity * 0.2})`;
                ctx.lineWidth = pt.z * 2.5;
                ctx.beginPath();
                ctx.moveTo(pt.x, pt.y);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }
        }
    }

    // ========================================================================
    // HAIL RENDERING
    // ========================================================================
    _drawHail(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.precipitation;
        
        for (let i = 0; i < this._particles.length; i++) {
            const pt = this._particles[i];
            if (pt.type !== 'hail') continue;
            
            // Physics
            pt.turbulence += 0.035;
            const turbX = Math.sin(pt.turbulence) * 1.2;
            pt.y += pt.speedY * (1 + this._windSpeed * 0.35);
            pt.x += effectiveWind * 2.5 + turbX;
            pt.rotation += pt.rotationSpeed;
            
            if (pt.y > h + 10) {
                pt.y = -15;
                pt.x = Math.random() * w;
                pt.turbulence = Math.random() * Math.PI * 2;
            }
            
            ctx.save();
            ctx.translate(pt.x, pt.y);
            ctx.rotate(pt.rotation);
            
            const depthOpacity = (pt.z > 1.1 ? pt.op * 1.1 : pt.op * 0.75) * fadeOpacity;
            
            // Ice gradient
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
            
            // Hexagonal shape
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
            
            // Highlight
            if (pt.z > 1.05) {
                ctx.fillStyle = `rgba(255, 255, 255, ${depthOpacity * 0.4})`;
                ctx.beginPath();
                ctx.arc(-pt.size * 0.3, -pt.size * 0.3, pt.size * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    }

    // ========================================================================
    // SNOW RENDERING (OPTIMIZED)
    // ========================================================================
    _drawSnow(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.precipitation;
        
        for (let i = 0; i < this._particles.length; i++) {
            const pt = this._particles[i];
            if (pt.type !== 'snow') continue;
            
            // Gentle floating motion
            pt.wobblePhase += pt.wobbleSpeed;
            pt.turbulence += 0.012;
            
            pt.y += pt.speedY;
            pt.x += Math.sin(pt.wobblePhase) * 0.8 + Math.sin(pt.turbulence) * 0.4 + effectiveWind * 0.4;
            
            if (pt.y > h + 5) {
                pt.y = -5;
                pt.x = Math.random() * w;
                pt.turbulence = Math.random() * Math.PI * 2;
            }
            if (pt.x > w + 10) pt.x = -10;
            if (pt.x < -10) pt.x = w + 10;
            
            const finalOpacity = pt.op * fadeOpacity * (pt.z > 1 ? 1 : 0.7);
            
            // OPTIMIZATION: Replaced Gradient with solid fill
            ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity * 0.8})`; 
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size * 1.2, 0, Math.PI * 2);
            ctx.fill();
            
            // Core
            ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity * 0.9})`;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ========================================================================
    // LIGHTNING
    // ========================================================================
    _drawLightning(ctx, w, h) {
        if (!this._params?.thunder) return;
        
        const fadeOpacity = this._layerFadeProgress.effects;
        
        // Spawn new bolts
        if (Math.random() < 0.007 && this._bolts.length < LIMITS.MAX_BOLTS) {
            this._flashOpacity = 0.4;
            this._bolts.push(this._createBolt(w, h));
        }
        
        // Flash effect
        if (this._flashOpacity > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = `rgba(220, 235, 255, ${this._flashOpacity * fadeOpacity})`;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
            this._flashOpacity *= 0.78;
        }
        
        // Draw bolts
        if (this._bolts.length > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            
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
            
            ctx.shadowBlur = 0;
            ctx.restore();
        }
    }

    // ========================================================================
    // AURORA
    // ========================================================================
    _drawAurora(ctx, w, h) {
        if (!this._aurora) return;
        
        const fadeOpacity = this._layerFadeProgress.effects;
        
        this._aurora.phase += 0.006;
        
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
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

    // ========================================================================
    // FOG
    // ========================================================================
    _drawFog(ctx, w, h) {
        const fadeOpacity = this._layerFadeProgress.effects;
        
        for (let i = 0; i < this._fogBanks.length; i++) {
            const f = this._fogBanks[i];
            
            f.x += f.speed;
            f.phase += 0.008;
            
            if (f.x > w + f.w / 2) f.x = -f.w / 2;
            if (f.x < -f.w / 2) f.x = w + f.w / 2;
            
            // Undulating height
            const undulation = Math.sin(f.phase) * 5;
            
            const g = ctx.createRadialGradient(f.x, f.y + undulation, 0, f.x, f.y + undulation, f.w / 2);
            
            let color;
            if (this._isLightBackground) {
                color = this._isNight ? '95, 105, 120' : '110, 120, 135';
            } else {
                color = this._isNight ? '170, 190, 215' : '195, 215, 235';
            }
            
            const layerOpacity = f.opacity * (1 + f.layer * 0.2) * fadeOpacity;
            g.addColorStop(0, `rgba(${color}, ${layerOpacity})`);
            g.addColorStop(0.5, `rgba(${color}, ${layerOpacity * 0.6})`);
            g.addColorStop(1, `rgba(${color}, 0)`);
            
            ctx.save();
            ctx.scale(1, 0.35);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(f.x, (f.y + undulation) / 0.35, f.w / 2, f.h, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // ========================================================================
    // PUDDLES
    // ========================================================================
    _drawPuddles(ctx, w, h) {
        const fadeOpacity = this._layerFadeProgress.effects;
        
        ctx.save();
        ctx.globalAlpha = 0.2 * fadeOpacity;
        
        // Static puddle positions
        const puddleCount = 5;
        for (let i = 0; i < puddleCount; i++) {
            const px = (w / puddleCount) * i + (w / puddleCount / 2);
            const py = h - 12;
            const pw = 55 + (i % 2) * 20;
            
            const g = ctx.createRadialGradient(px, py, 0, px, py, pw / 2);
            g.addColorStop(0, 'rgba(180, 210, 250, 0.35)');
            g.addColorStop(0.6, 'rgba(160, 195, 240, 0.2)');
            g.addColorStop(1, 'rgba(140, 175, 220, 0)');
            
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(px, py, pw / 2, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        
        // Ripples
        if (Math.random() < 0.025 && this._ripples.length < LIMITS.MAX_RIPPLES) {
            this._ripples.push({
                x: Math.random() * w,
                y: h - 12 + (Math.random() - 0.5) * 4,
                radius: 3,
                maxRadius: 20 + Math.random() * 15,
                alpha: 0.45
            });
        }
        
        for (let i = this._ripples.length - 1; i >= 0; i--) {
            const r = this._ripples[i];
            r.radius += 0.6;
            r.alpha -= 0.012;
            
            if (r.alpha <= 0 || r.radius >= r.maxRadius) {
                this._ripples.splice(i, 1);
                continue;
            }
            
            ctx.strokeStyle = `rgba(255, 255, 255, ${r.alpha * 0.35 * fadeOpacity})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.ellipse(r.x, r.y, r.radius, r.radius * 0.35, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    // ========================================================================
    // SHOOTING STARS
    // ========================================================================
    _drawShootingStars(ctx, w, h) {
        const fadeOpacity = this._layerFadeProgress.stars;
        
        // spawn rate
        if (Math.random() < 0.0012 && this._shootingStars.length < LIMITS.MAX_SHOOTING_STARS) {
            this._shootingStars.push({
                x: Math.random() * w * 0.7 + w * 0.15,
                y: Math.random() * h * 0.4,
                vx: 3.5 + Math.random() * 2.5,
                vy: 1.5 + Math.random() * 1.5,
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
            s.life -= 0.018;
            
            s.tail.unshift({ x: s.x, y: s.y });
            if (s.tail.length > 25) s.tail.pop();
            
            if (s.life <= 0) {
                this._shootingStars.splice(i, 1);
                continue;
            }
            
            const opacity = s.life * fadeOpacity;
            
            // Head
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Tail
            ctx.lineWidth = s.size * 0.7;
            for (let j = 0; j < s.tail.length - 1; j++) {
                const p1 = s.tail[j];
                const p2 = s.tail[j + 1];
                const tailOp = opacity * (1 - j / s.tail.length) * 0.8;
                
                ctx.strokeStyle = `rgba(255, 255, 240, ${tailOp})`;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }

    // ========================================================================
    // COMETS
    // ========================================================================
    _drawComets(ctx, w, h) {
        const fadeOpacity = this._layerFadeProgress.stars;
        
        ctx.save();
        
        for (let i = this._comets.length - 1; i >= 0; i--) {
            const c = this._comets[i];
            
            c.x += c.vx;
            c.y += c.vy;
            c.life -= 0.006;
            
            c.tail.unshift({ x: c.x, y: c.y });
            if (c.tail.length > 50) c.tail.pop();
            
            if (c.life <= 0 || c.x < -120 || c.y > h + 120) {
                this._comets.splice(i, 1);
                continue;
            }
            
            const opacity = c.life * fadeOpacity;
            
            // Head with coma
            const headGrad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.size * 2.5);
            headGrad.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
            headGrad.addColorStop(0.3, `rgba(200, 230, 255, ${opacity * 0.6})`);
            headGrad.addColorStop(1, 'rgba(150, 200, 255, 0)');
            
            ctx.fillStyle = headGrad;
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.size * 2.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Tail
            ctx.lineWidth = c.size;
            for (let j = 0; j < c.tail.length - 1; j++) {
                const p1 = c.tail[j];
                const p2 = c.tail[j + 1];
                const tailOp = opacity * (1 - j / c.tail.length) * 0.5;
                
                ctx.strokeStyle = `rgba(180, 210, 255, ${tailOp})`;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }

    // ========================================================================
    // PLANES
    // ========================================================================
    _drawPlanes(ctx, w, h) {
        const fadeOpacity = this._layerFadeProgress.stars;
        
        ctx.save();
        
        for (let i = this._planes.length - 1; i >= 0; i--) {
            const p = this._planes[i];
            
            p.x += p.vx;
            p.blinkPhase += 0.12;
            p.blink = Math.sin(p.blinkPhase) > 0.75 ? 1 : 0;
            
            if (p.x < -80 || p.x > w + 80) {
                this._planes.splice(i, 1);
                continue;
            }
            
            // Body
            ctx.fillStyle = `rgba(180, 180, 190, ${0.35 * fadeOpacity})`;
            ctx.fillRect(p.x - 5, p.y - 1, 10, 2);
            
            // Blinking light
            if (p.blink) {
                ctx.fillStyle = `rgba(255, 80, 80, ${0.9 * fadeOpacity})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
                ctx.fill();
                
                // Light glow
                ctx.fillStyle = `rgba(255, 100, 100, ${0.3 * fadeOpacity})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }

    // ========================================================================
    // LEAVES
    // ========================================================================
    _drawLeaves(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.effects;
        
        for (let i = 0; i < this._leaves.length; i++) {
            const leaf = this._leaves[i];
            
            leaf.wobblePhase += 0.04;
            const wobble = Math.sin(leaf.wobblePhase) * 0.5;
            
            leaf.y += (1 + Math.sin(leaf.wobblePhase * 0.5) * 0.5) * (1 + this._windSpeed * 0.4) * leaf.z;
            leaf.x += (effectiveWind * 2 + wobble) * leaf.z;
            leaf.rotation += leaf.spinSpeed * (1 + this._windSpeed * 0.25);
            
            if (leaf.y > h + 15) {
                leaf.y = -15;
                leaf.x = Math.random() * w;
            }
            if (leaf.x > w + 15) leaf.x = -15;
            if (leaf.x < -15) leaf.x = w + 15;
            
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

    // ========================================================================
    // DUST MOTES (sunny/fair weather ambience)
    // ========================================================================
    _drawDustMotes(ctx, w, h) {
        if (!this._shouldShowSun()) return;
        
        const fadeOpacity = this._layerFadeProgress.effects;
        
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        
        for (let i = 0; i < this._dustMotes.length; i++) {
            const mote = this._dustMotes[i];
            
            mote.phase += 0.015;
            mote.x += mote.speedX + Math.sin(mote.phase) * 0.15;
            mote.y += mote.speedY + Math.cos(mote.phase * 0.7) * 0.1;
            
            // Wrap around
            if (mote.x > w + 5) mote.x = -5;
            if (mote.x < -5) mote.x = w + 5;
            if (mote.y > h + 5) mote.y = -5;
            if (mote.y < -5) mote.y = h + 5;
            
            const twinkle = Math.sin(mote.phase * 2) * 0.3 + 0.7;
            const finalOpacity = mote.opacity * twinkle * fadeOpacity;
            
            ctx.fillStyle = `rgba(255, 250, 220, ${finalOpacity})`;
            ctx.beginPath();
            ctx.arc(mote.x, mote.y, mote.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    // ========================================================================
    // MIST WISPS (fog/rain atmosphere)
    // ========================================================================
    _drawMistWisps(ctx, w, h) {
        const fadeOpacity = this._layerFadeProgress.effects;
        
        for (let i = 0; i < this._mistWisps.length; i++) {
            const wisp = this._mistWisps[i];
            
            wisp.x += wisp.speed;
            wisp.phase += 0.01;
            
            if (wisp.x > w + wisp.width) wisp.x = -wisp.width;
            if (wisp.x < -wisp.width) wisp.x = w + wisp.width;
            
            const undulation = Math.sin(wisp.phase) * 8;
            
            const g = ctx.createRadialGradient(
                wisp.x, wisp.y + undulation, 0,
                wisp.x, wisp.y + undulation, wisp.width / 2
            );
            
            const color = this._isLightBackground ? '100, 115, 130' : '180, 200, 220';
            g.addColorStop(0, `rgba(${color}, ${wisp.opacity * fadeOpacity})`);
            g.addColorStop(0.6, `rgba(${color}, ${wisp.opacity * 0.4 * fadeOpacity})`);
            g.addColorStop(1, `rgba(${color}, 0)`);
            
            ctx.save();
            ctx.scale(1, 0.3);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(wisp.x, (wisp.y + undulation) / 0.3, wisp.width / 2, wisp.height, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // ========================================================================
    // MOON WITH ACCURATE PHASE RENDERING
    // Uses CELESTIAL_POSITION constant for consistent positioning
    // ========================================================================
    _drawMoon(ctx, w, h) {
        if (!this._isNight) return;
        
        // Don't draw until state is initialized to prevent position pop
        if (!this._stateInitialized || !this._renderGate.isRevealed) return;
        
        // Moon visible in all night conditions, but may be partially obscured
        const cloudCover = this._params?.cloud || 0;
        const moonVisibility = cloudCover > 30 ? 0.4 : cloudCover > 20 ? 0.6 : cloudCover > 10 ? 0.8 : 1;
        
        const fadeOpacity = this._layerFadeProgress.stars * moonVisibility;
        if (fadeOpacity <= 0.05) return;
        
        this._moonAnimPhase += 0.003;
        
        // Use constant for consistent positioning
        const moonX = CELESTIAL_POSITION.x;
        const moonY = CELESTIAL_POSITION.y;
        const moonRadius = 18;
        
        const phase = this._moonPhaseConfig;
        
        ctx.save();
        
        // Outer glow (varies with phase)
        const glowIntensity = 0.08 + phase.illumination * 0.12;
        ctx.globalCompositeOperation = 'lighter';
        const glowGrad = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonRadius * 4);
        glowGrad.addColorStop(0, `rgba(200, 220, 255, ${glowIntensity * fadeOpacity})`);
        glowGrad.addColorStop(0.3, `rgba(180, 200, 240, ${glowIntensity * 0.5 * fadeOpacity})`);
        glowGrad.addColorStop(1, 'rgba(150, 180, 220, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius * 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Moon body - base circle
        ctx.globalCompositeOperation = 'source-over';
        
        // Create clipping region for moon
        ctx.save();
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
        ctx.clip();
        
        // Draw the lit portion based on phase
        const illumination = phase.illumination;
        const direction = phase.direction;
        
        if (illumination <= 0) {
            // New moon - very faint outline
            ctx.fillStyle = `rgba(40, 45, 55, ${0.3 * fadeOpacity})`;
            ctx.beginPath();
            ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Subtle earthshine
            ctx.fillStyle = `rgba(80, 90, 110, ${0.15 * fadeOpacity})`;
            ctx.beginPath();
            ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
            ctx.fill();
        } else if (illumination >= 1) {
            // Full moon
            const moonGrad = ctx.createRadialGradient(
                moonX - moonRadius * 0.3, moonY - moonRadius * 0.3, 0,
                moonX, moonY, moonRadius
            );
            moonGrad.addColorStop(0, `rgba(255, 255, 250, ${0.95 * fadeOpacity})`);
            moonGrad.addColorStop(0.7, `rgba(230, 235, 245, ${0.9 * fadeOpacity})`);
            moonGrad.addColorStop(1, `rgba(200, 210, 230, ${0.85 * fadeOpacity})`);
            
            ctx.fillStyle = moonGrad;
            ctx.beginPath();
            ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Partial phases - crescent, quarter, gibbous
            
            // First draw the dark side
            ctx.fillStyle = `rgba(35, 40, 50, ${0.4 * fadeOpacity})`;
            ctx.beginPath();
            ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Subtle earthshine on dark side
            ctx.fillStyle = `rgba(60, 70, 90, ${0.12 * fadeOpacity})`;
            ctx.beginPath();
            ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Now draw the lit portion
            ctx.beginPath();
            
            // The terminator (line between light and dark) is an ellipse
            // For waxing (right side lit): start from top, go right, come back left
            // For waning (left side lit): start from top, go left, come back right
            
            const terminatorWidth = Math.abs(1 - illumination * 2) * moonRadius;
            const isGibbous = illumination > 0.5;
            
            if (direction === 'right') {
                // Waxing - right side is lit
                ctx.arc(moonX, moonY, moonRadius, -Math.PI / 2, Math.PI / 2, false);
                if (isGibbous) {
                    // Gibbous: terminator bulges left (into dark side)
                    ctx.ellipse(moonX, moonY, terminatorWidth, moonRadius, 0, Math.PI / 2, -Math.PI / 2, false);
                } else {
                    // Crescent: terminator bulges right (into lit side)
                    ctx.ellipse(moonX, moonY, terminatorWidth, moonRadius, 0, Math.PI / 2, -Math.PI / 2, true);
                }
            } else {
                // Waning - left side is lit
                ctx.arc(moonX, moonY, moonRadius, Math.PI / 2, -Math.PI / 2, false);
                if (isGibbous) {
                    // Gibbous: terminator bulges right
                    ctx.ellipse(moonX, moonY, terminatorWidth, moonRadius, 0, -Math.PI / 2, Math.PI / 2, false);
                } else {
                    // Crescent: terminator bulges left
                    ctx.ellipse(moonX, moonY, terminatorWidth, moonRadius, 0, -Math.PI / 2, Math.PI / 2, true);
                }
            }
            ctx.closePath();
            
            // Fill with moon gradient
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
        
        ctx.restore(); // Remove clip
        
        // Subtle craters (only visible on lit portions for non-new moons)
        if (illumination > 0.1) {
            ctx.globalAlpha = fadeOpacity * Math.min(1, illumination * 1.5);
            ctx.fillStyle = 'rgba(180, 190, 210, 0.2)';
            
            // Position craters based on phase visibility
            if (phase.direction === 'right' || illumination >= 1) {
                ctx.beginPath();
                ctx.arc(moonX + 4, moonY + 2, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(moonX + 2, moonY - 5, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
            if (phase.direction === 'left' || illumination >= 1) {
                ctx.beginPath();
                ctx.arc(moonX - 5, moonY + 4, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(moonX - 3, moonY - 3, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }

    // ========================================================================
    // Moon clouds - Draw clouds partially in front of moon
    // ========================================================================
    _drawMoonClouds(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.clouds;
        if (fadeOpacity <= 0 || this._moonClouds.length === 0) return;
        
        for (let i = 0; i < this._moonClouds.length; i++) {
            const cloud = this._moonClouds[i];
            
            // Gentle movement
            cloud.x += cloud.speed * effectiveWind;
            cloud.breathPhase += cloud.breathSpeed;
            
            // Keep clouds in moon area with wrap
            if (cloud.x > 180) cloud.x = 0;
            if (cloud.x < 0) cloud.x = 180;
            
            const breathScale = 1 + Math.sin(cloud.breathPhase) * 0.02;
            
            ctx.save();
            ctx.translate(cloud.x, cloud.y);
            ctx.scale(cloud.scale * breathScale, cloud.scale * 0.5 * breathScale);
            
            // Night cloud colors (silvery, moon-lit)
            for (let j = 0; j < cloud.puffs.length; j++) {
                const puff = cloud.puffs[j];
                
                const gradient = ctx.createRadialGradient(
                    puff.dx - puff.rad * 0.15, puff.dy - puff.rad * 0.15, 0,
                    puff.dx, puff.dy, puff.rad
                );
                
                const opacity = cloud.opacity * puff.shade * fadeOpacity;
                
                // Silvery moon-lit cloud colors
                gradient.addColorStop(0, `rgba(140, 155, 180, ${opacity * 0.7})`);
                gradient.addColorStop(0.4, `rgba(100, 115, 145, ${opacity * 0.5})`);
                gradient.addColorStop(0.7, `rgba(70, 85, 115, ${opacity * 0.3})`);
                gradient.addColorStop(1, `rgba(50, 65, 95, 0)`);
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(puff.dx, puff.dy, puff.rad, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    }

    // ========================================================================
    // HEAT SHIMMER (hot sunny days)
    // ========================================================================
    _drawHeatShimmer(ctx, w, h) {
        if (!this._shouldShowSun() || this._isNight) return;
        
        const fadeOpacity = this._layerFadeProgress.effects;
        
        this._heatShimmerPhase += 0.02;
        
        ctx.save();
        ctx.globalAlpha = 0.03 * fadeOpacity;
        
        // Subtle wavy distortion lines at bottom
        for (let i = 0; i < 3; i++) {
            ctx.strokeStyle = this._isLightBackground 
                ? 'rgba(255, 200, 100, 0.15)' 
                : 'rgba(255, 255, 200, 0.1)';
            ctx.lineWidth = 2;
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
    // MAIN ANIMATION LOOP (OPTIMIZED)
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
        
        // Update transitions
        this._updateTransition();
        
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
            const sunGlow = mid.createRadialGradient(CELESTIAL_POSITION.x, 0, 0, CELESTIAL_POSITION.x, 0, w * 0.7);
            sunGlow.addColorStop(0, `rgba(255, 200, 100, ${0.12 * this._layerFadeProgress.effects})`);
            sunGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
            mid.fillStyle = sunGlow;
            mid.fillRect(0, 0, w, h);
            this._drawSunGlow(mid, w, h);
        }

        // Moon (always visible at night with accurate phase)
        this._drawMoon(bg, w, h);

        // Aurora
        this._drawAurora(mid, w, h);

        // Stars
        const starFade = this._layerFadeProgress.stars;
        for (let i = 0; i < this._stars.length; i++) {
            const s = this._stars[i];
            s.phase += s.speed;
            const twinkle = Math.sin(s.phase) * 0.4 + 0.6;
            const opacity = twinkle * s.brightness * starFade;
            
            bg.fillStyle = typeof s.color === 'string' && s.color.startsWith('hsl')
                ? s.color.replace('1)', `${opacity})`)
                : `rgba(255, 255, 250, ${opacity})`;
            bg.beginPath();
            bg.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            bg.fill();
        }

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
        
        // Clouds
        this._drawClouds(mid, w, h, effectiveWind, cloudGlobalOp);

        // Moon clouds (for cloudy nights)
        if (this._isNight && this._moonClouds.length > 0) {
            this._drawMoonClouds(mid, w, h, effectiveWind);
        }

        // Fog banks
        if (this._fogBanks.length > 0) {
            this._drawFog(mid, w, h);
        }

        // Mist wisps
        this._drawMistWisps(mid, w, h);

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

        // Puddles
        if (p.puddles) {
            this._drawPuddles(fg, w, h);
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

    // ========================================================================
    // HOME ASSISTANT CARD API
    // ========================================================================
    getCardSize() {
        return 4;
    }

    // static getConfigElement() {
    //     // Custom editor not implemented yet, defaulting to YAML
    //     return document.createElement('atmospheric-weather-card-editor');
    // }

    static getStubConfig() {
        return {
            weather_entity: 'weather.forecast_home',
            full_width: false,
            // Optional parameters:
            // moon_phase_entity: 'sensor.moon_phase',
            // day: '/local/community/atmospheric-weather-card/day.png',
            // night: '/local/community/atmospheric-weather-card/night.png',
            // door_entity: 'binary_sensor.front_door',
            // door_open_day: '...',
            // door_open_night: '...'
        };
    }
}

customElements.define('atmospheric-weather-card', AtmosphericWeatherCard);

