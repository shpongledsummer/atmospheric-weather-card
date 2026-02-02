/**
 * ATMOSPHERIC WEATHER CARD
 * Version: 1.3
 * A custom Home Assistant card that renders animated weather effects.
 */
 
 console.info("%c ATMOSPHERIC-WEATHER-CARD %c V1.3", "color: white; background: #2980b9; font-weight: bold;", "color: #2980b9; background: white; font-weight: bold;");

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
    'clear-night':      Object.freeze({ type: 'stars', count: 280, cloud: 0,  wind: 0.1, rays: false, atmosphere: 'night' }), 
    'cloudy':           Object.freeze({ type: 'cloud', count: 0,   cloud: 70, wind: 0.3, dark: false, rays: false, atmosphere: 'overcast' }), 
    'fog':              Object.freeze({ type: 'fog',   count: 0,   cloud: 15, wind: 0.1, rays: false, atmosphere: 'mist', foggy: true }), 
    'hail':             Object.freeze({ type: 'hail',  count: 150, cloud: 28, wind: 0.8, dark: true, rays: false, atmosphere: 'storm' }),
    'lightning':        Object.freeze({ type: 'rain',  count: 200, cloud: 32, wind: 2.0, thunder: true, dark: true, rays: false, atmosphere: 'storm' }), 
    'lightning-rainy':  Object.freeze({ type: 'rain',  count: 300, cloud: 36, wind: 2.5, thunder: true, dark: true, rays: false, atmosphere: 'storm' }),
    'partlycloudy':     Object.freeze({ type: 'cloud', count: 0,   cloud: 20, wind: 0.2, rays: true, atmosphere: 'fair' }), 
    'pouring':          Object.freeze({ type: 'rain',  count: 350, cloud: 32, wind: 1.5, dark: true, rays: false, atmosphere: 'storm' }),
    'rainy':            Object.freeze({ type: 'rain',  count: 120, cloud: 50, wind: 0.6, rays: false, atmosphere: 'rain' }),
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
    MAX_SHOOTING_STARS: 2,
    MAX_BOLTS: 3,
    MAX_COMETS: 1,
    MAX_PLANES: 2,
    MAX_DUST: 40,
    MAX_MIST_WISPS: 15,
    MAX_SUN_CLOUDS: 5,
    MAX_MOON_CLOUDS: 4
});

// Performance configuration
const PERFORMANCE_CONFIG = Object.freeze({
    RESIZE_DEBOUNCE_MS: 150,        // Debounce delay for particle reinitialization
    VISIBILITY_THRESHOLD: 0.01,     // IntersectionObserver threshold (1% visible)
    REVEAL_TRANSITION_MS: 300,      // Fade-in duration after initialization
    MAX_DPR: 2.0,                   // OPTIMIZED: Reduced from 2 to 1.5 (Massive performance gain)
    TARGET_FPS: 30                  // OPTIMIZED: Target 30fps instead of 60/120fps
});

// //#endregion

// ============================================================================
// #region 2. HELPER CLASSES (Physics, Canvas, Shapes, Pools)
// ============================================================================

// ============================================================================
// PARTICLE PHYSICS HELPER - Handles repetitive movement and boundary logic
// ============================================================================
class ParticlePhysics {
    /**
     * Update particle position with wind and turbulence
     * @param {Object} particle - The particle to update
     * @param {number} effectiveWind - Current wind value
     * @param {number} windMultiplier - Multiplier for wind effect on X
     * @param {number} windSpeedBoost - Additional wind speed factor (0-1)
     */
    static applyWind(particle, effectiveWind, windMultiplier = 1.0, windSpeedBoost = 0) {
        particle.x += effectiveWind * windMultiplier;
        if (windSpeedBoost > 0 && particle.speedY !== undefined) {
            particle.y += particle.speedY * (1 + windSpeedBoost);
        } else if (particle.speedY !== undefined) {
            particle.y += particle.speedY;
        }
    }

    /**
     * Apply turbulence to particle movement
     * @param {Object} particle - The particle to update
     * @param {number} turbulenceIncrement - How much to increment turbulence phase
     * @param {number} turbulenceStrength - Strength of turbulence effect
     * @returns {number} The calculated turbulence X offset
     */
    static applyTurbulence(particle, turbulenceIncrement, turbulenceStrength) {
        particle.turbulence += turbulenceIncrement;
        return Math.sin(particle.turbulence) * turbulenceStrength;
    }

    /**
     * Apply wobble effect (for snow, leaves)
     * @param {Object} particle - The particle with wobblePhase and wobbleSpeed
     * @param {number} wobbleStrength - Strength of wobble effect
     * @returns {number} The calculated wobble X offset
     */
    static applyWobble(particle, wobbleStrength = 0.8) {
        if (particle.wobblePhase !== undefined && particle.wobbleSpeed !== undefined) {
            particle.wobblePhase += particle.wobbleSpeed;
            return Math.sin(particle.wobblePhase) * wobbleStrength;
        }
        return 0;
    }

    /**
     * Wrap particle position at boundaries (vertical)
     * @param {Object} particle - The particle to check
     * @param {number} height - Canvas height
     * @param {number} width - Canvas width
     * @param {number} topOffset - Offset for respawn position at top
     * @param {number} bottomOffset - Offset for detection at bottom
     * @param {boolean} randomizeX - Whether to randomize X on wrap
     */
    static wrapVertical(particle, height, width, topOffset = 15, bottomOffset = 10, randomizeX = true) {
        if (particle.y > height + bottomOffset) {
            particle.y = -topOffset - (randomizeX ? Math.random() * 20 : 0);
            if (randomizeX) {
                particle.x = Math.random() * width;
            }
            if (particle.turbulence !== undefined) {
                particle.turbulence = Math.random() * Math.PI * 2;
            }
        }
    }

    /**
     * Wrap particle position at boundaries (horizontal)
     * @param {Object} particle - The particle to check
     * @param {number} width - Canvas width
     * @param {number} offset - Offset for wrap detection
     */
    static wrapHorizontal(particle, width, offset = 20) {
        if (particle.x > width + offset) particle.x = -offset;
        if (particle.x < -offset) particle.x = width + offset;
    }

    /**
     * Combined wrap for both axes
     * @param {Object} particle - The particle to check
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {Object} offsets - { top, bottom, left, right } offsets
     * @param {boolean} randomizeXOnVerticalWrap - Whether to randomize X when wrapping vertically
     */
    static wrapBoth(particle, width, height, offsets = {}, randomizeXOnVerticalWrap = true) {
        const { top = 15, bottom = 10, left = 20, right = 20 } = offsets;
        ParticlePhysics.wrapVertical(particle, height, width, top, bottom, randomizeXOnVerticalWrap);
        ParticlePhysics.wrapHorizontal(particle, width, Math.max(left, right));
    }
}

// ============================================================================
// CANVAS UTILS HELPER - Handles repetitive canvas boilerplate
// ============================================================================
class CanvasUtils {
    /**
     * Execute drawing operations within a save/restore block
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Function} drawFn - Drawing function to execute
     */
    static withState(ctx, drawFn) {
        ctx.save();
        try {
            drawFn(ctx);
        } finally {
            ctx.restore();
        }
    }

    /**
     * Execute drawing operations with specific composite operation
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} compositeOp - Composite operation name
     * @param {Function} drawFn - Drawing function to execute
     */
    static withComposite(ctx, compositeOp, drawFn) {
        ctx.save();
        ctx.globalCompositeOperation = compositeOp;
        try {
            drawFn(ctx);
        } finally {
            ctx.restore();
        }
    }

    /**
     * Execute drawing operations with translation
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X translation
     * @param {number} y - Y translation
     * @param {Function} drawFn - Drawing function to execute
     */
    static withTranslation(ctx, x, y, drawFn) {
        ctx.save();
        ctx.translate(x, y);
        try {
            drawFn(ctx);
        } finally {
            ctx.restore();
        }
    }

    /**
     * Execute drawing operations with rotation
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position for rotation center
     * @param {number} y - Y position for rotation center
     * @param {number} angle - Rotation angle in radians
     * @param {Function} drawFn - Drawing function to execute
     */
    static withRotation(ctx, x, y, angle, drawFn) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        try {
            drawFn(ctx);
        } finally {
            ctx.restore();
        }
    }

    /**
     * Create a radial gradient with standard cloud/fog pattern
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} radius - Outer radius
     * @param {Array} colorStops - Array of { stop, color } objects
     * @param {number} innerRadius - Inner radius (default 0)
     * @returns {CanvasGradient} The created gradient
     */
    static createRadialGradient(ctx, cx, cy, radius, colorStops, innerRadius = 0) {
        const gradient = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, radius);
        for (const { stop, color } of colorStops) {
            gradient.addColorStop(stop, color);
        }
        return gradient;
    }

    /**
     * Create a radial gradient with offset highlight (for 3D effect)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} radius - Outer radius
     * @param {number} highlightOffsetX - X offset for highlight center
     * @param {number} highlightOffsetY - Y offset for highlight center
     * @param {Array} colorStops - Array of { stop, color } objects
     * @returns {CanvasGradient} The created gradient
     */
    static createHighlightGradient(ctx, cx, cy, radius, highlightOffsetX, highlightOffsetY, colorStops) {
        const gradient = ctx.createRadialGradient(
            cx + highlightOffsetX, cy + highlightOffsetY, 0,
            cx, cy, radius
        );
        for (const { stop, color } of colorStops) {
            gradient.addColorStop(stop, color);
        }
        return gradient;
    }

    /**
     * Draw a filled circle
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {number} radius - Circle radius
     * @param {string|CanvasGradient} fillStyle - Fill style
     */
    static fillCircle(ctx, x, y, radius, fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw a stroked circle/ellipse
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {number} radiusX - X radius
     * @param {number} radiusY - Y radius (if different from radiusX)
     * @param {string} strokeStyle - Stroke style
     * @param {number} lineWidth - Line width
     */
    static strokeEllipse(ctx, x, y, radiusX, radiusY, strokeStyle, lineWidth) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.ellipse(x, y, radiusX, radiusY || radiusX, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
}

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
        
        // Particle arrays (using pools where beneficial)
        this._particles = [];
        this._clouds = [];
        this._stars = [];
        this._bolts = [];
        this._fogBanks = [];
        this._leaves = [];
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
    // 3.2 HOME ASSISTANT INPUTS (Public API)
    // ========================================================================
    setConfig(config) {
        if (!config.weather_entity) throw new Error("Define 'weather_entity'");
        
        this._config = config;
        
        // Capture Sun Entity (Step 1)
        this._sunEntity = config.sun_entity;
        
        // Dynamic Status Entity
        // We pre-calculate if the status feature is enabled to save time in the render loop
        this._hasStatusFeature = !!(config.status_entity && (config.status_image_day || config.status_image_night));
        
        this._initDOM();
    }

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
        
        // Moon phase entity support (Optional)
        // If not defined, defaults to null (logic below will fallback to full moon)
        const moonEntityId = this._config.moon_phase_entity;
        const moonEntity = moonEntityId ? this._getEntityState(hass, moonEntityId) : null; 
        
        if (moonEntity && moonEntity.state !== this._moonPhaseState) {
            this._moonPhaseState = moonEntity.state;
            this._moonPhaseConfig = MOON_PHASES[moonEntity.state] || MOON_PHASES['full_moon'];
        }

        // Safe boolean checks
        const isNight = this._calculateIsNight(hass);
        
        // FORCE LINK: If it's Night, we assume Dark Background (isLightBackground = false).
        // If it's Day, we assume Light Background (isLightBackground = true).
        this._isLightBackground = !isNight;

        // Safe attribute access with validation
        const windSpeedRaw = this._getEntityAttribute(wEntity, 'wind_speed', 0);
        const windSpeed = typeof windSpeedRaw === 'number' ? windSpeedRaw : parseFloat(windSpeedRaw) || 0;
        this._windSpeed = Math.min(Math.max(windSpeed / 10, 0), 2);

        // --- IMAGE SELECTION LOGIC ---
        // 1. Determine Base Image (Standard Day vs Night)
        const baseSrc = isNight ? this._config.night : this._config.day;

        // 2. Check for Status Override (e.g. Door Open, Party Mode)
        const statusSrc = this._calculateStatusImage(hass, isNight);
        
        // 3. Final Decision
        let src = statusSrc || baseSrc || '';
        if (!src) src = this._config.day || '';

        // 4. Apply to DOM
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
    }

    getCardSize() {
        return 4;
    }

    static getStubConfig() {
        return {
            weather_entity: 'weather.forecast_home',
            mode: 'auto',
            sun_entity: 'sun.sun',
            full_width: false,
            offset: '0px',
            sun_moon_x_position: 90,  // Positive=Left, Negative=Right
            sun_moon_y_position: 90,  // From Top
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
        const result = { x: 90, y: 90 };
        
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

    // STAR COUNT CALCULATION (Boosted +20% for Cloudy/Fog)
    _getStarCountForWeather(baseParams) {
        if (!this._isNight) return 0;
        if (!baseParams) return 0;
        
        const cloudCoverage = baseParams.cloud || 0;
        const isDark = baseParams.dark || false;
        
        // Clear Sky / Excellent Weather
        if (baseParams.type === 'stars' || cloudCoverage === 0) return 420;
        if (cloudCoverage < 5) return 260;
        if (cloudCoverage < 10) return 220;

        // Mist / Light Fog
        if (cloudCoverage < 15) return 190; 

        // Fog
        if (cloudCoverage < 25) return 125; 

        // Heavy Clouds
        return isDark ? 20 : 40; 
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

    // DEBOUNCED RESIZE HANDLING (Scroll Jank Prevention)
    _handleResize() {
        // This is now only called for legacy compatibility
        this._updateCanvasDimensions();
        this._scheduleParticleReinit();
    }
    
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
    // 3.4 TRANSITION SYSTEM (The Morpher)
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
            leaves: eased < 0.5 ? old.leaves : newer.leaves,
            atmosphere: eased < 0.5 ? old.atmosphere : newer.atmosphere,
            foggy: eased < 0.5 ? old.foggy : newer.foggy
        };
    }

    // TRANSITION SYSTEM (Clean "Cross-Dissolve" - No Morphing)
    _updateTransition() {
        if (this._transitionProgress >= 1) return;

        const elapsed = performance.now() - this._transitionStart;
        this._transitionProgress = Math.min(elapsed / this._transitionDuration, 1);

        // Use a smooth easing curve (Ease-In-Out) for elegance
        const smoothStep = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        // PHASE 1: FADING OUT (The Old Scene)
        if (this._particleFadeState === 'fading-out') {
            // Spend the first 40% of the duration fading out
            const fadeOutDuration = this._transitionDuration * 0.4; 
            const progress = Math.min(1, elapsed / fadeOutDuration);
            
            // Opacity goes 1.0 -> 0.0
            const currentOp = 1 - smoothStep(progress);
            
            // Apply to all layers uniformly for a clean exit
            this._globalFadeProgress = currentOp;
            this._particleFadeProgress = currentOp;
            Object.keys(this._layerFadeProgress).forEach(k => this._layerFadeProgress[k] = currentOp);

            // FLIP POINT: When strictly invisible
            if (progress >= 1) {
                this._particleFadeState = 'fading-in';
                
                // HARD SWAP: Instantly switch to new config while invisible
                // We DO NOT interpolate params anymore. This prevents "weird" intermediate states.
                this._params = this._newParams;
                this._stateInitialized = true;
                this._cloudsSorted = false;
                
                // Re-roll the world
                this._initParticles(); 
            }
        } 
        // PHASE 2: FADING IN (The New Scene)
        else if (this._particleFadeState === 'fading-in') {
            const fadeOutDuration = this._transitionDuration * 0.4;
            const fadeInDuration = this._transitionDuration * 0.6; // Remaining 60%
            
            const progress = Math.min(1, (elapsed - fadeOutDuration) / fadeInDuration);
            
            // Opacity goes 0.0 -> 1.0
            const currentOp = smoothStep(progress);
            
            this._globalFadeProgress = currentOp;
            this._particleFadeProgress = currentOp;
            Object.keys(this._layerFadeProgress).forEach(k => this._layerFadeProgress[k] = currentOp);
        }

        // PHASE 3: CLEANUP (Finish)
        if (this._transitionProgress >= 1) {
            this._transitionProgress = 1;
            this._params = this._newParams; // Ensure final state
            this._oldParams = null;
            this._newParams = null;
            this._particleFadeState = 'stable';
            
            // Reset all opacities to full
            this._globalFadeProgress = 1;
            this._particleFadeProgress = 1;
            Object.keys(this._layerFadeProgress).forEach(k => this._layerFadeProgress[k] = 1);
            
            // Final re-init to ensure everything is perfect
            this._initParticles();
        }
    }

    // ========================================================================
    // 3.5 PARTICLE FACTORY (Initialization)
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

    // Enhanced Cloud Initialization: Layers vs Randomness
    _initClouds(w, h, p) {
        const totalClouds = p.cloud || 0;
        if (totalClouds <= 0) return;

        // 1. BACKGROUND FILLER (The "Foggy" Layer)
        // These fills the gaps. They are wide, flat (stratus), slow, and translucent.
        // We dedicate about 20% of the budget to these, or at least 3 if partly cloudy.
        const fillerCount = Math.max(3, Math.floor(totalClouds * 0.25));
        
        for (let i = 0; i < fillerCount; i++) {
            const seed = Math.random() * 10000;
            // Use 'stratus' variety for wide, flat coverage
            const puffs = CloudShapeGenerator.generateMixedPuffs(seed, 'stratus');
            
            this._clouds.push({
                x: Math.random() * w,
                y: Math.random() * (h * 0.35), // Keep them high in the sky
                scale: 0.45 + Math.random() * 0.15, // Smaller (farther away)
                speed: 0.002 + Math.random() * 0.003, // Very slow drift
                puffs,
                layer: 0, // Force Background Layer (Draws first)
                opacity: 0.15 + Math.random() * 0.15, // Subtle/Foggy look
                seed,
                breathPhase: Math.random() * Math.PI * 2,
                breathSpeed: 0.001 // Slower breathing for background
            });
        }

        // 2. HERO CLOUDS (The "Structure")
        // These are the puffy, defined clouds in the foreground.
        const heroCount = Math.max(0, totalClouds - fillerCount);
        
        for (let i = 0; i < heroCount; i++) {
            // Distribute remaining clouds across layers 1-4 (Foreground)
            const layer = 1 + Math.floor(Math.random() * 4); 
            const isStorm = p.dark;
            const seed = Math.random() * 10000;
            
            // Logic for variety based on layer depth
            let puffs;
            const varietyRoll = Math.random();

            if (isStorm) {
                puffs = CloudShapeGenerator.generateOrganicPuffs(true, seed);
            } else if (layer === 4 && varietyRoll < 0.3) {
                // Foreground decoration (wispy bits)
                puffs = CloudShapeGenerator.generateMixedPuffs(seed, 'cirrus');
            } else if (varietyRoll < 0.6) {
                // Standard Puffy
                puffs = CloudShapeGenerator.generateMixedPuffs(seed, 'cumulus');
            } else {
                // Classic
                puffs = CloudShapeGenerator.generateOrganicPuffs(false, seed);
            }

            this._clouds.push({
                x: Math.random() * w,
                y: Math.random() * (h * 0.5), // Allow slightly lower range
                scale: 0.65 + layer * 0.12, // Larger as they get closer
                speed: (0.02 + Math.random() * 0.04) * (layer * 0.5 + 1), // Faster as they get closer (Parallax)
                puffs,
                layer, // 1-4
                opacity: 1 - layer * 0.12, // Slightly more solid in mid-layers
                seed,
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
    // Repositioned sun clouds - Enhanced with layers for depth
    _initSunClouds(w, h) {
        const celestial = this._getCelestialPosition(w);
        const sunX = celestial.x;
        const sunY = celestial.y;

        // LAYER 1: DEEP ATMOSPHERE (Static background glow)
        this._sunClouds.push({
            x: sunX,
            y: sunY,
            scale: 1.6,
            speed: 0.002,
            puffs: CloudShapeGenerator.generateWispyPuffs(Math.random() * 10000),
            opacity: 0.1, 
            seed: Math.random(),
            breathPhase: 0,
            breathSpeed: 0.001,
            baseX: sunX,
            baseY: sunY,
            driftPhase: 0
        });

        // LAYER 2: THE BASE (The "Bed" of clouds)
        for (let i = 0; i < 5; i++) {
            const spreadX = (i - 2.5) * 25 + (Math.random() - 0.5) * 15;
            const spreadY = 25 + Math.random() * 20; 
            
            this._sunClouds.push({
                x: sunX + spreadX,
                y: sunY + spreadY,
                scale: 0.55 + Math.random() * 0.3, 
                speed: 0.005, 
                puffs: CloudShapeGenerator.generateSunEnhancementPuffs(Math.random() * 10000),
                opacity: 0.5 + Math.random() * 0.2, 
                seed: Math.random(),
                breathPhase: Math.random() * Math.PI * 2,
                breathSpeed: 0.003,
                baseX: sunX + spreadX,
                baseY: sunY + spreadY,
                driftPhase: Math.random() * Math.PI * 2
            });
        }

        // LAYER 3: THE DIFFUSERS (The Fix)
        // CHANGED: Moved slightly lower (+15) and reduced opacity (0.25 -> 0.14)
        // This clears the center of the sun so it "pops" again.
        for (let i = 0; i < 2; i++) {
            this._sunClouds.push({
                x: sunX + (Math.random() - 0.5) * 40,
                y: sunY + 15 + (Math.random() - 0.5) * 10, // Shifted DOWN slightly
                scale: 0.7, 
                speed: 0.008,
                puffs: CloudShapeGenerator.generateOrganicPuffs(false, Math.random() * 10000), 
                opacity: 0.14, // CHANGED: Much more transparent (was 0.25)
                seed: Math.random(),
                breathPhase: Math.random() * Math.PI * 2,
                breathSpeed: 0.004,
                baseX: sunX,
                baseY: sunY + 15,
                driftPhase: i * 3
            });
        }
        
        // LAYER 4: UPPER HAZE
        for (let i = 0; i < 2; i++) {
            this._sunClouds.push({
                x: sunX + (Math.random() - 0.5) * 80, 
                y: sunY - 25 - Math.random() * 15, 
                scale: 0.3,
                speed: 0.01,
                puffs: CloudShapeGenerator.generateWispyPuffs(Math.random() * 10000),
                opacity: 0.15, 
                seed: Math.random(),
                breathPhase: Math.random() * Math.PI * 2,
                breathSpeed: 0.002,
                baseX: sunX + (Math.random() - 0.5) * 80,
                baseY: sunY - 25 - Math.random() * 15,
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
            
            // Get dynamic position
            const celestial = this._getCelestialPosition(w);
            
            // Position clouds around/in front of moon
            const angle = (i / count) * Math.PI * 0.8 + Math.PI * 0.1 + (Math.random() - 0.5) * 0.4;
            const dist = 30 + Math.random() * 40;
            
            this._moonClouds.push({
                x: celestial.x + Math.cos(angle) * dist, // UPDATED
                y: celestial.y + Math.sin(angle) * dist, // UPDATED
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
        // V9: FINE TUNED REALISM + CHROMATIC DATA
        
        // 1. STRICTER TIERS
        // We push most stars into the background for depth.
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
    
    // SUN RAYS - Enhanced with cloud interaction for light theme visibility
    _drawLightRays(ctx, w, h) {
        const rayCount = 8;
        const fadeOpacity = this._layerFadeProgress.effects;
        
        // Dynamic Position
        const celestial = this._getCelestialPosition(w);
        const centerX = celestial.x; 
        const centerY = celestial.y;
        
        const baseAngle = Math.PI * 0.2;
        const spread = Math.PI * 0.45;

        CanvasUtils.withState(ctx, () => {
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
        });
    }

    // Sun clouds - Draw wispy clouds near sun to enhance ray visibility
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
            
            CanvasUtils.withState(ctx, () => {
                ctx.translate(cloud.x, cloud.y);
                ctx.scale(cloud.scale * breathScale, cloud.scale * 0.55 * breathScale);
                
                // Draw with special sun-lit colors - lighter and more visible
                for (let j = 0; j < cloud.puffs.length; j++) {
                    const puff = cloud.puffs[j];
                    
                    const gradient = CanvasUtils.createHighlightGradient(
                        ctx, puff.dx, puff.dy, puff.rad,
                        -puff.rad * 0.35, -puff.rad * 0.45,
                        [
                            { stop: 0, color: `rgba(255, 252, 245, ${cloud.opacity * puff.shade * fadeOpacity * 0.95})` },
                            { stop: 0.25, color: `rgba(255, 248, 235, ${cloud.opacity * puff.shade * fadeOpacity * 0.8})` },
                            { stop: 0.5, color: `rgba(252, 242, 218, ${cloud.opacity * puff.shade * fadeOpacity * 0.55})` },
                            { stop: 0.75, color: `rgba(248, 235, 200, ${cloud.opacity * puff.shade * fadeOpacity * 0.3})` },
                            { stop: 1, color: `rgba(245, 228, 185, 0)` }
                        ]
                    );
                    
                    CanvasUtils.fillCircle(ctx, puff.dx, puff.dy, puff.rad, gradient);
                }
            });
        }
    }

    // SUN GLOW
    _drawSunGlow(ctx, w, h) {
        const fadeOpacity = this._layerFadeProgress.effects;
        
        // Dynamic Position
        const celestial = this._getCelestialPosition(w);
        const centerX = celestial.x;
        const centerY = celestial.y;
        
        CanvasUtils.withState(ctx, () => {
            // Main glow
            const g = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, w * 0.5);
            
            if (this._isLightBackground) {
                g.addColorStop(0, `rgba(255, 160, 40, ${0.55 * fadeOpacity})`);
                g.addColorStop(0.15, `rgba(255, 190, 80, ${0.35 * fadeOpacity})`);
                g.addColorStop(0.4, `rgba(255, 220, 150, ${0.12 * fadeOpacity})`);
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
            
            CanvasUtils.fillCircle(ctx, centerX, centerY, coreRadius, coreGrad);
        });
    }

    // ENHANCED CLOUD RENDERING
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
            
            CanvasUtils.withState(ctx, () => {
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
                    const gradient = CanvasUtils.createHighlightGradient(
                        ctx, puff.dx, puff.dy, puff.rad,
                        -puff.rad * 0.2, -puff.rad * 0.3,
                        [
                            { stop: 0, color: `rgba(${litR|0}, ${litG|0}, ${litB|0}, ${finalOpacity})` },
                            { stop: 0.4, color: `rgba(${colors.mid[0]}, ${colors.mid[1]}, ${colors.mid[2]}, ${finalOpacity * 0.85})` },
                            { stop: 0.7, color: `rgba(${colors.shadow[0]|0}, ${colors.shadow[1]|0}, ${colors.shadow[2]|0}, ${finalOpacity * 0.6})` },
                            { stop: 1, color: `rgba(${colors.shadow[0]|0}, ${colors.shadow[1]|0}, ${colors.shadow[2]|0}, 0)` }
                        ]
                    );
                    
                    CanvasUtils.fillCircle(ctx, puff.dx, puff.dy, puff.rad * (1 + puff.softness * 0.1), gradient);
                }
            });
        }
    }

    _getCloudColors(cloud) {
        const isNightCloud = this._isNight && (this._params?.cloud || 0) < 5;
        const p = this._params;
        
        // Helper: Check for "Bad Weather" (Rain, Hail, Fog, Lightning, Storms)
        // We check for the 'dark' flag OR specific weather types you listed.
        const isBadWeather = p?.dark || 
                             ['rain', 'hail', 'fog', 'lightning', 'lightning-rainy', 'pouring', 'rainy', 'snowy-rainy'].includes(p?.type) || 
                             p?.foggy;

        // 1. NIGHT (Standard - Unchanged)
        if (isNightCloud) {
            return {
                lit: [50, 60, 85],
                mid: [40, 50, 70],
                shadow: [25, 32, 50],
                ambient: 0.15
            };
        }

        // 2. BAD WEATHER (Rainy, Lightning, Fog, Hail)
        // TARGET: High contrast, but GREYER (Neutral), Less Blue.
        if (isBadWeather) {
            if (this._isLightBackground) {
                return {
                    lit: [242, 248, 255],
                    mid: [208, 212, 225],
                    shadow: [168, 178, 198],
                    ambient: 0.80
                };
            }
            // Night Bad Weather
            return {
                lit: [150, 155, 165],
                mid: [120, 125, 140],
                shadow: [90, 95, 115],
                ambient: 0.75
            };
        }

        // 3. GOOD WEATHER (Cloudy, Partly Cloudy)
        if (this._isLightBackground) {
            return {
                lit: [255, 255, 255],
                mid: [222, 230, 236],
                shadow: [185, 200, 212], 
                ambient: 0.8
            };
        }

        // 4. NIGHT STANDARD
        if (this._isNight) {
            return {
                lit: [220, 230, 255],
                mid: [140, 155, 185],
                shadow: [30, 40, 60],
                ambient: 0.8
            };
        }

        // 5. FALLBACK
        return {
            lit: [250, 252, 255],
            mid: [225, 235, 248],
            shadow: [160, 175, 200],
            ambient: 0.28
        };
    }

    // RAIN 2.0 (Physics-Based Motion Blur & Refraction)
    _drawRain(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.precipitation;
        if (fadeOpacity <= 0) return;

        // 1. REFRACTION COLORS (Physics-based)
        // Day: Rain blocks light -> Dark Slate Grey (High Contrast on White)
        // Night: Rain reflects light -> Silvery Blue (High Contrast on Dark)
        const isDay = this._isLightBackground;
        
        // Day: Dark Grey/Blue | Night: Bright Ice Blue
        const rC = isDay ? 85 : 210; 
        const gC = isDay ? 95 : 225;
        const bC = isDay ? 110 : 255;

        for (let i = 0; i < this._particles.length; i++) {
            const pt = this._particles[i];
            if (pt.type !== 'rain') continue;

            // --- 2. PHYSICS UPDATE ---
            // Turbulence adds organic "jitter" so it doesn't look like a matrix code
            const turbX = ParticlePhysics.applyTurbulence(pt, 0.025, 0.4);
            
            // Parallax: Drops closer to camera (z > 1) appear to fall faster
            const speedFactor = (1 + this._windSpeed * 0.25) * (pt.z * 0.8 + 0.2);
            
            // Calculate Vector: This is the exact movement of the drop this frame
            const moveX = (effectiveWind * 1.8 + turbX);
            const moveY = (pt.speedY * speedFactor);

            // Move the particle
            pt.x += moveX;
            pt.y += moveY;

            // Wrap Boundaries
            ParticlePhysics.wrapVertical(pt, h, w, 40, 10, true);
            ParticlePhysics.wrapHorizontal(pt, w, 20);

            // --- 3. ELASTIC RENDERING (Motion Blur) ---
            // We draw the "tail" based on where the drop CAME FROM.
            // Faster drops = Longer streaks. Louder wind = Diagonals.
            
            // Stretch factor: Simulates shutter speed. 
            // Higher wind stretches the drops more (Elasticity).
            const stretch = 1.5 + (this._windSpeed * 0.5); 
            
            // Calculate the tail position by reversing the movement vector
            const tailX = pt.x - (moveX * stretch);
            const tailY = pt.y - (moveY * stretch);

            // --- 4. VISIBILITY & DEPTH ---
            const baseOp = isDay ? 0.75 : 0.60; 
            // Distant drops (low z) are much fainter than close ones
            const finalOp = Math.min(1, pt.z * baseOp) * fadeOpacity * pt.op;

            if (finalOp < 0.02) continue;

            // Width: Near drops = thick, Far drops = hairline
            const width = Math.max(0.8, pt.z * 1.4);

            // --- 5. THE COMET GRADIENT ---
            // Tail (0% opacity) -> Head (100% opacity)
            const grad = ctx.createLinearGradient(tailX, tailY, pt.x, pt.y);
            
            grad.addColorStop(0, `rgba(${rC}, ${gC}, ${bC}, 0)`);            // Tail (Gone)
            grad.addColorStop(0.5, `rgba(${rC}, ${gC}, ${bC}, ${finalOp * 0.4})`); // Mid (Faint)
            grad.addColorStop(1, `rgba(${rC}, ${gC}, ${bC}, ${finalOp})`);    // Head (Solid)

            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.strokeStyle = grad;

            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(pt.x, pt.y);
            ctx.stroke();
        }
    }

    // HAIL RENDERING - Using ParticlePhysics helper
    _drawHail(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.precipitation;
        
        for (let i = 0; i < this._particles.length; i++) {
            const pt = this._particles[i];
            if (pt.type !== 'hail') continue;
            
            // Physics using helper
            const turbX = ParticlePhysics.applyTurbulence(pt, 0.035, 1.2);
            pt.y += pt.speedY * (1 + this._windSpeed * 0.35);
            pt.x += effectiveWind * 2.5 + turbX;
            pt.rotation += pt.rotationSpeed;
            
            // Boundary check using helper
            ParticlePhysics.wrapVertical(pt, h, w, 15, 10, true);
            
            CanvasUtils.withRotation(ctx, pt.x, pt.y, pt.rotation, () => {
                const depthOpacity = (pt.z > 1.1 ? pt.op * 1.1 : pt.op * 0.75) * fadeOpacity;
                
                // Ice gradient
                const iceGradient = CanvasUtils.createHighlightGradient(
                    ctx, 0, 0, pt.size,
                    0, -pt.size * 0.3,
                    this._isLightBackground
                        ? [
                            { stop: 0, color: `rgba(240, 250, 255, ${depthOpacity})` },
                            { stop: 0.5, color: `rgba(210, 230, 250, ${depthOpacity * 0.85})` },
                            { stop: 1, color: `rgba(170, 200, 240, ${depthOpacity * 0.5})` }
                        ]
                        : [
                            { stop: 0, color: `rgba(255, 255, 255, ${depthOpacity})` },
                            { stop: 0.5, color: `rgba(230, 245, 255, ${depthOpacity * 0.85})` },
                            { stop: 1, color: `rgba(200, 225, 250, ${depthOpacity * 0.5})` }
                        ]
                );
                
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
                    CanvasUtils.fillCircle(ctx, -pt.size * 0.3, -pt.size * 0.3, pt.size * 0.3, 
                        `rgba(255, 255, 255, ${depthOpacity * 0.4})`);
                }
            });
        }
    }

    // SNOW RENDERING (OPTIMIZED) - Using ParticlePhysics helper
    _drawSnow(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.precipitation;
        
        for (let i = 0; i < this._particles.length; i++) {
            const pt = this._particles[i];
            if (pt.type !== 'snow') continue;
            
            // Gentle floating motion using helpers
            const wobble = ParticlePhysics.applyWobble(pt, 0.8);
            const turbX = ParticlePhysics.applyTurbulence(pt, 0.012, 0.4);
            
            pt.y += pt.speedY;
            pt.x += wobble + turbX + effectiveWind * 0.4;
            
            // Boundary wrapping using helper
            ParticlePhysics.wrapVertical(pt, h, w, 5, 5, true);
            ParticlePhysics.wrapHorizontal(pt, w, 10);
            
            const finalOpacity = pt.op * fadeOpacity * (pt.z > 1 ? 1 : 0.7);
            
            // OPTIMIZATION: Replaced Gradient with solid fill
            CanvasUtils.fillCircle(ctx, pt.x, pt.y, pt.size * 1.2, `rgba(255, 255, 255, ${finalOpacity * 0.8})`);
            
            // Core
            CanvasUtils.fillCircle(ctx, pt.x, pt.y, pt.size * 0.6, `rgba(255, 255, 255, ${finalOpacity * 0.9})`);
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
        
        // Flash effect
        if (this._flashOpacity > 0) {
            CanvasUtils.withComposite(ctx, 'screen', () => {
                ctx.fillStyle = `rgba(220, 235, 255, ${this._flashOpacity * fadeOpacity})`;
                ctx.fillRect(0, 0, w, h);
            });
            this._flashOpacity *= 0.78;
        }
        
        // Draw bolts
        if (this._bolts.length > 0) {
            CanvasUtils.withComposite(ctx, 'lighter', () => {
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
            });
        }
    }
    
   // AURORA
    _drawAurora(ctx, w, h) {
        if (!this._aurora) return;
        
        const fadeOpacity = this._layerFadeProgress.effects;
        
        this._aurora.phase += 0.006;
        
        CanvasUtils.withState(ctx, () => {
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
        });
    }

    // FOG
    _drawFog(ctx, w, h) {
        const fadeOpacity = this._layerFadeProgress.effects;
        
        for (let i = 0; i < this._fogBanks.length; i++) {
            const f = this._fogBanks[i];
            
            f.x += f.speed;
            f.phase += 0.008;
            
            // Horizontal wrapping
            if (f.x > w + f.w / 2) f.x = -f.w / 2;
            if (f.x < -f.w / 2) f.x = w + f.w / 2;
            
            // Undulating height
            const undulation = Math.sin(f.phase) * 5;
            
            let color;
            if (this._isLightBackground) {
                color = this._isNight ? '95, 105, 120' : '150, 160, 175';
            } else {
                color = this._isNight ? '170, 190, 215' : '195, 215, 235';
            }
            
            const layerOpacity = f.opacity * (1 + f.layer * 0.2) * fadeOpacity;
            
            const g = CanvasUtils.createRadialGradient(ctx, f.x, f.y + undulation, f.w / 2, [
                { stop: 0, color: `rgba(${color}, ${layerOpacity})` },
                { stop: 0.5, color: `rgba(${color}, ${layerOpacity * 0.6})` },
                { stop: 1, color: `rgba(${color}, 0)` }
            ]);
            
            CanvasUtils.withState(ctx, () => {
                ctx.scale(1, 0.35);
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.ellipse(f.x, (f.y + undulation) / 0.35, f.w / 2, f.h, 0, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }
        


    // SHOOTING STARS (Left-Side Bias + Fast Fade)
    _drawShootingStars(ctx, w, h) {
        const fadeOpacity = this._layerFadeProgress.stars;

        // 1. SPAWN LOGIC
        if (Math.random() < 0.0014 && this._shootingStars.length < LIMITS.MAX_SHOOTING_STARS) {
            
            // LOGIC: Prefer Left Side (70% chance for left side, 30% for right)
            let spawnX;
            if (Math.random() < 0.70) {
                spawnX = Math.random() * (w * 0.6); // 0% to 60% width
            } else {
                spawnX = (w * 0.6) + Math.random() * (w * 0.4); // 60% to 100% width
            }

            this._shootingStars.push({
                x: spawnX,
                y: Math.random() * (h * 0.5),   // Top 50% only
                vx: 5.0 + Math.random() * 3.0,  // Fast horizontal speed
                vy: 2.0 + Math.random() * 2.0,  // Moderate drop
                life: 1.0,
                size: 1.5 + Math.random() * 1.5,
                tail: []
            });
        }

        CanvasUtils.withState(ctx, () => {
            for (let i = this._shootingStars.length - 1; i >= 0; i--) {
                const s = this._shootingStars[i];

                // 2. MOVEMENT
                s.x += s.vx;
                s.y += s.vy;
                
                // 3. DECAY (Fast fade out)
                s.life -= 0.045; 

                // 4. TAIL MANAGEMENT
                s.tail.unshift({ x: s.x, y: s.y });
                
                // Cap tail length for visual crispness
                if (s.tail.length > 22) s.tail.pop();

                if (s.life <= 0) {
                    this._shootingStars.splice(i, 1);
                    continue;
                }

                const opacity = s.life * fadeOpacity;

                // Draw Head
                CanvasUtils.fillCircle(ctx, s.x, s.y, s.size, `rgba(255, 255, 255, ${opacity})`);

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
        });
    }

    // COMETS
    _drawComets(ctx, w, h) {
        const fadeOpacity = this._layerFadeProgress.stars;
        
        CanvasUtils.withState(ctx, () => {
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
                const headGrad = CanvasUtils.createRadialGradient(ctx, c.x, c.y, c.size * 2.5, [
                    { stop: 0, color: `rgba(255, 255, 255, ${opacity})` },
                    { stop: 0.3, color: `rgba(200, 230, 255, ${opacity * 0.6})` },
                    { stop: 1, color: 'rgba(150, 200, 255, 0)' }
                ]);
                
                CanvasUtils.fillCircle(ctx, c.x, c.y, c.size * 2.5, headGrad);
                
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
        });
    }

    // PLANES (Side-Profile Silhouette)
    _drawPlanes(ctx, w, h) {
        const fadeOpacity = this._layerFadeProgress.stars;

        CanvasUtils.withState(ctx, () => {
            for (let i = this._planes.length - 1; i >= 0; i--) {
                const p = this._planes[i];

                p.x += p.vx;
                p.blinkPhase += 0.12;
                p.blink = Math.sin(p.blinkPhase) > 0.75 ? 1 : 0;

                if (p.x < -80 || p.x > w + 80) {
                    this._planes.splice(i, 1);
                    continue;
                }

                const dir = p.vx > 0 ? 1 : -1; // 1 = Facing Right, -1 = Facing Left
                const opacity = 0.6 * fadeOpacity;

                ctx.strokeStyle = `rgba(220, 220, 230, ${opacity})`;
                ctx.lineWidth = 1.5; 
                ctx.lineCap = 'round'; // Rounds the nose/tail

                // DRAW SIDE PROFILE
                ctx.beginPath();
                
                // 1. Fuselage (Nose to Tail) - Horizontal
                // Nose is at +6, Tail is at -6
                ctx.moveTo(p.x + 6 * dir, p.y);
                ctx.lineTo(p.x - 6 * dir, p.y);

                // 2. Vertical Tail Fin (Sticking UP)
                // Starts at back, goes Up and slightly Back
                ctx.moveTo(p.x - 5 * dir, p.y);
                ctx.lineTo(p.x - 8 * dir, p.y - 4);

                // 3. Wing (Side View) - A small subtle angled line under the belly
                ctx.moveTo(p.x + 1 * dir, p.y);
                ctx.lineTo(p.x - 2 * dir, p.y + 2);
                
                ctx.stroke();

                // STROBE LIGHT (Tail or Belly)
                if (p.blink) {
                    CanvasUtils.fillCircle(ctx, p.x, p.y + 1, 1.5, `rgba(255, 80, 80, ${0.9 * fadeOpacity})`);
                    CanvasUtils.fillCircle(ctx, p.x, p.y + 1, 5, `rgba(255, 50, 50, ${0.25 * fadeOpacity})`);
                }
            }
        });
    }

    // LEAVES - Using ParticlePhysics helper
    _drawLeaves(ctx, w, h, effectiveWind) {
        const fadeOpacity = this._layerFadeProgress.effects;
        
        for (let i = 0; i < this._leaves.length; i++) {
            const leaf = this._leaves[i];
            
            leaf.wobblePhase += 0.04;
            const wobble = Math.sin(leaf.wobblePhase) * 0.5;
            
            // Physics using helpers
            leaf.y += (1 + Math.sin(leaf.wobblePhase * 0.5) * 0.5) * (1 + this._windSpeed * 0.4) * leaf.z;
            leaf.x += (effectiveWind * 2 + wobble) * leaf.z;
            leaf.rotation += leaf.spinSpeed * (1 + this._windSpeed * 0.25);
            
            // Boundary wrapping using helper
            ParticlePhysics.wrapVertical(leaf, h, w, 15, 15, true);
            ParticlePhysics.wrapHorizontal(leaf, w, 15);
            
            CanvasUtils.withRotation(ctx, leaf.x, leaf.y, leaf.rotation, () => {
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
            });
        }
    }

    // DUST MOTES (sunny/fair weather ambience)
    _drawDustMotes(ctx, w, h) {
        if (!this._shouldShowSun()) return;
        
        const fadeOpacity = this._layerFadeProgress.effects;
        
        CanvasUtils.withComposite(ctx, 'lighter', () => {
            for (let i = 0; i < this._dustMotes.length; i++) {
                const mote = this._dustMotes[i];
                
                mote.phase += 0.015;
                mote.x += mote.speedX + Math.sin(mote.phase) * 0.15;
                mote.y += mote.speedY + Math.cos(mote.phase * 0.7) * 0.1;
                
                // Wrap around using helper
                ParticlePhysics.wrapHorizontal(mote, w, 5);
                if (mote.y > h + 5) mote.y = -5;
                if (mote.y < -5) mote.y = h + 5;
                
                const twinkle = Math.sin(mote.phase * 2) * 0.3 + 0.7;
                const finalOpacity = mote.opacity * twinkle * fadeOpacity * 2.0;
                
                CanvasUtils.fillCircle(ctx, mote.x, mote.y, mote.size, `rgba(255, 250, 220, ${finalOpacity})`);
            }
        });
    }

    // MIST WISPS (fog/rain atmosphere)
    _drawMistWisps(ctx, w, h) {
        const fadeOpacity = this._layerFadeProgress.effects;
        
        for (let i = 0; i < this._mistWisps.length; i++) {
            const wisp = this._mistWisps[i];
            
            wisp.x += wisp.speed;
            wisp.phase += 0.01;
            
            // Horizontal wrapping
            if (wisp.x > w + wisp.width) wisp.x = -wisp.width;
            if (wisp.x < -wisp.width) wisp.x = w + wisp.width;
            
            const undulation = Math.sin(wisp.phase) * 8;
            
            const color = this._isLightBackground ? '100, 115, 130' : '180, 200, 220';
            const g = CanvasUtils.createRadialGradient(ctx, wisp.x, wisp.y + undulation, wisp.width / 2, [
                { stop: 0, color: `rgba(${color}, ${wisp.opacity * fadeOpacity})` },
                { stop: 0.6, color: `rgba(${color}, ${wisp.opacity * 0.4 * fadeOpacity})` },
                { stop: 1, color: `rgba(${color}, 0)` }
            ]);
            
            CanvasUtils.withState(ctx, () => {
                ctx.scale(1, 0.3);
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.ellipse(wisp.x, (wisp.y + undulation) / 0.3, wisp.width / 2, wisp.height, 0, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }

    // MOON WITH ACCURATE PHASE RENDERING
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
        
        // Dynamic Position
        const celestial = this._getCelestialPosition(w);
        const moonX = celestial.x;
        const moonY = celestial.y;
        const moonRadius = 18;
        
        const phase = this._moonPhaseConfig;
        
        CanvasUtils.withState(ctx, () => {
            // Outer glow (varies with phase)
            const glowIntensity = 0.08 + phase.illumination * 0.12;
            ctx.globalCompositeOperation = 'lighter';
            const glowGrad = CanvasUtils.createRadialGradient(ctx, moonX, moonY, moonRadius * 4, [
                { stop: 0, color: `rgba(200, 220, 255, ${glowIntensity * fadeOpacity})` },
                { stop: 0.3, color: `rgba(180, 200, 240, ${glowIntensity * 0.5 * fadeOpacity})` },
                { stop: 1, color: 'rgba(150, 180, 220, 0)' }
            ]);
            CanvasUtils.fillCircle(ctx, moonX, moonY, moonRadius * 4, glowGrad);
            
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
                const moonGrad = CanvasUtils.createHighlightGradient(
                    ctx, moonX, moonY, moonRadius,
                    -moonRadius * 0.3, -moonRadius * 0.3,
                    [
                        { stop: 0, color: `rgba(255, 255, 250, ${0.95 * fadeOpacity})` },
                        { stop: 0.7, color: `rgba(230, 235, 245, ${0.9 * fadeOpacity})` },
                        { stop: 1, color: `rgba(200, 210, 230, ${0.85 * fadeOpacity})` }
                    ]
                );
                
                CanvasUtils.fillCircle(ctx, moonX, moonY, moonRadius, moonGrad);
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
                const terminatorWidth = Math.abs(1 - illumination * 2) * moonRadius;
                const isGibbous = illumination > 0.5;
                
                if (direction === 'right') {
                    // Waxing
                    ctx.arc(moonX, moonY, moonRadius, -Math.PI / 2, Math.PI / 2, false);
                    if (isGibbous) {
                        ctx.ellipse(moonX, moonY, terminatorWidth, moonRadius, 0, Math.PI / 2, -Math.PI / 2, false);
                    } else {
                        ctx.ellipse(moonX, moonY, terminatorWidth, moonRadius, 0, Math.PI / 2, -Math.PI / 2, true);
                    }
                } else {
                    // Waning
                    ctx.arc(moonX, moonY, moonRadius, Math.PI / 2, -Math.PI / 2, false);
                    if (isGibbous) {
                        ctx.ellipse(moonX, moonY, terminatorWidth, moonRadius, 0, -Math.PI / 2, Math.PI / 2, false);
                    } else {
                        ctx.ellipse(moonX, moonY, terminatorWidth, moonRadius, 0, -Math.PI / 2, Math.PI / 2, true);
                    }
                }
                ctx.closePath();
                
                // Fill with moon gradient
                const moonGrad = CanvasUtils.createHighlightGradient(
                    ctx, moonX, moonY, moonRadius,
                    -moonRadius * 0.2, -moonRadius * 0.2,
                    [
                        { stop: 0, color: `rgba(255, 255, 250, ${0.95 * fadeOpacity})` },
                        { stop: 0.6, color: `rgba(235, 240, 248, ${0.9 * fadeOpacity})` },
                        { stop: 1, color: `rgba(210, 220, 235, ${0.85 * fadeOpacity})` }
                    ]
                );
                
                ctx.fillStyle = moonGrad;
                ctx.fill();
            }
            
            ctx.restore(); // Remove clip
            
            // Subtle craters (only visible on lit portions for non-new moons)
            // REALISTIC CRATERS (Lunar Maria / "Seas")
            // We draw these as dark transparent washes. 
            // Since they are dark, they stand out on the lit white side 
            // but blend invisibly into the dark side, mimicking real lighting.
            // TEXTURED CRATERS (Small impact craters)
            // We use many small, simple circles to create a "rocky" look
            // instead of large weird blob shapes.
            // REALISTIC LUNAR MARIA (The "Man in the Moon" shapes)
            if (illumination > 0.05) {
                const op = fadeOpacity * Math.min(1, illumination * 3.0);
                
                // LAYER 1: Large Faint Wash (The soft edges)
                // Reduced opacity (0.15 -> 0.12)
                ctx.fillStyle = `rgba(30, 35, 50, ${0.12 * op})`;
                
                // Oceanus Procellarum (Left) - Pushed further left (-5 -> -9)
                ctx.beginPath(); ctx.ellipse(moonX - 9, moonY + 2, 7, 9, 0.2, 0, Math.PI * 2); ctx.fill();
                
                // Mare Serenitatis (Top Right) - Pushed further right/up (+5 -> +8)
                ctx.beginPath(); ctx.ellipse(moonX + 8, moonY - 6, 6, 4, -0.3, 0, Math.PI * 2); ctx.fill();
                
                // Mare Nubium (Bottom) - Pushed down (+6 -> +10)
                ctx.beginPath(); ctx.ellipse(moonX - 2, moonY + 10, 5, 3, 0.1, 0, Math.PI * 2); ctx.fill();

                // LAYER 2: Inner Core (The depth)
                // Reduced opacity (0.25 -> 0.18) -> This is the key to making it "5-10% less visible"
                ctx.fillStyle = `rgba(25, 30, 45, ${0.18 * op})`; 
                
                // Inner Left
                ctx.beginPath(); ctx.ellipse(moonX - 9, moonY + 2, 4, 6, 0.2, 0, Math.PI * 2); ctx.fill();
                // Inner Top Right
                ctx.beginPath(); ctx.ellipse(moonX + 8, moonY - 6, 3, 2, -0.3, 0, Math.PI * 2); ctx.fill();
                // Inner Bottom
                ctx.beginPath(); ctx.ellipse(moonX - 2, moonY + 10, 2.5, 1.5, 0.1, 0, Math.PI * 2); ctx.fill();
                
                // Small Texture Details (Scattered edges)
                ctx.fillStyle = `rgba(25, 30, 45, ${0.12 * op})`;
                ctx.beginPath(); ctx.arc(moonX + 6, moonY + 5, 1.2, 0, Math.PI * 2); ctx.fill(); // Mid right
                ctx.beginPath(); ctx.arc(moonX - 5, moonY - 8, 1.0, 0, Math.PI * 2); ctx.fill(); // Top left
            }
        });
    }

    // Moon clouds - Draw clouds partially in front of moon
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
            
            CanvasUtils.withState(ctx, () => {
                ctx.translate(cloud.x, cloud.y);
                ctx.scale(cloud.scale * breathScale, cloud.scale * 0.5 * breathScale);
                
                // Night cloud colors (silvery, moon-lit)
                for (let j = 0; j < cloud.puffs.length; j++) {
                    const puff = cloud.puffs[j];
                    
                    const opacity = cloud.opacity * puff.shade * fadeOpacity;
                    
                    const gradient = CanvasUtils.createHighlightGradient(
                        ctx, puff.dx, puff.dy, puff.rad,
                        -puff.rad * 0.15, -puff.rad * 0.15,
                        [
                            { stop: 0, color: `rgba(140, 155, 180, ${opacity * 0.7})` },
                            { stop: 0.4, color: `rgba(100, 115, 145, ${opacity * 0.5})` },
                            { stop: 0.7, color: `rgba(70, 85, 115, ${opacity * 0.3})` },
                            { stop: 1, color: `rgba(50, 65, 95, 0)` }
                        ]
                    );
                    
                    CanvasUtils.fillCircle(ctx, puff.dx, puff.dy, puff.rad, gradient);
                }
            });
        }
    }

    // HEAT SHIMMER (hot sunny days)
    _drawHeatShimmer(ctx, w, h) {
        if (!this._shouldShowSun() || this._isNight) return;
        
        const fadeOpacity = this._layerFadeProgress.effects;
        
        this._heatShimmerPhase += 0.02;
        
        CanvasUtils.withState(ctx, () => {
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
        });
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
            this._drawSunGlow(mid, w, h);
        }

        // Aurora
        this._drawAurora(mid, w, h);

        // Stars
        // ---- BACKGROUND LAYER: STARS (V9: Chromatic Realism) ----
        const starFade = this._layerFadeProgress.stars;
        
        if (starFade > 0.01) {
            for (let i = 0; i < this._stars.length; i++) {
                const s = this._stars[i];
                
                // 1. PHYSICS (Breathing)
                s.phase += s.rate;
                // Complex wave for organic feel
                const twinkleVal = Math.sin(s.phase) + (Math.sin(s.phase * 3) * 0.5);
                
                // 2. DYNAMIC PROPERTIES
                // Gentle pulse
                const sizePulse = 1 + (twinkleVal * 0.12); 
                const currentSize = s.baseSize * sizePulse;
                
                const opacityPulse = 1 + (twinkleVal * 0.15);
                const finalOpacity = Math.min(1, Math.max(0.15, s.brightness * opacityPulse * starFade));
                
                if (finalOpacity <= 0.05) continue;

                // 3. NEXT LEVEL: CHROMATIC SHIFT
                // Instead of a static color, we shift it based on the twinkle phase.
                // Brighter = Whiter/Hotter. Dimmer = Deeper Color.
                const shift = twinkleVal * 5; // Shift hue by +/- 5 degrees
                const dynamicHue = s.hsl.h + shift;
                const dynamicLight = s.hsl.l + (twinkleVal * 2); // Shift lightness
                
                // Construct color string on the fly (Cheap enough for 300 stars)
                const dynamicColor = `hsla(${dynamicHue}, ${s.hsl.s}%, ${dynamicLight}%,`;

                if (s.tier === 'hero') {
                    CanvasUtils.withState(bg, () => {
                        bg.globalCompositeOperation = 'lighter';
                        
                        // Solid Core (Sharp)
                        bg.fillStyle = `${dynamicColor} ${finalOpacity})`;
                        bg.beginPath();
                        bg.arc(s.x, s.y, currentSize * 0.6, 0, Math.PI * 2);
                        bg.fill();

                        // Bloom (Very Subtle now)
                        // REDUCED: Opacity multiplier 0.25 (was 0.4)
                        const grad = bg.createRadialGradient(s.x, s.y, currentSize * 0.6, s.x, s.y, currentSize * 3.0);
                        grad.addColorStop(0, `${dynamicColor} ${finalOpacity * 0.25})`); 
                        grad.addColorStop(1, `${dynamicColor} 0)`);
                        
                        bg.fillStyle = grad;
                        bg.beginPath();
                        bg.arc(s.x, s.y, currentSize * 3.0, 0, Math.PI * 2);
                        bg.fill();
                    });

                } else {
                    // Standard & Mid Stars
                    bg.fillStyle = `${dynamicColor} ${finalOpacity})`;
                    bg.beginPath();
                    // Draw tiny sharp dots
                    bg.arc(s.x, s.y, currentSize * 0.5, 0, Math.PI * 2);
                    bg.fill();
                }
            }
        }
		
        // Moon (moved here so it covers the stars)
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
