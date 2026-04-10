/**
 * ATMOSPHERIC WEATHER CARD — VISUAL EDITOR
 * Version: 1.0
 * Visual editor for the Atmospheric Weather Card.
 * https://github.com/shpongledsummer/atmospheric-weather-card
 */

console.info(
    "%c ATMOSPHERIC WEATHER CARD EDITOR ",
    "color: white; font-weight: 700; background: linear-gradient(90deg, #355C7D 0%, #6C5B7B 50%, #C06C84 100%); padding: 6px 12px; border-radius: 6px; font-family: sans-serif; letter-spacing: 0.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);"
);

// LitElement base, borrowed from HA's already-loaded elements.
const LitElement =
    window.LitElement ||
    Object.getPrototypeOf(
        customElements.get("ha-panel-lovelace") ||
        customElements.get("hui-masonry-view") ||
        customElements.get("hc-lovelace") ||
        customElements.get("home-assistant-main")
    );

const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

const LABELS = Object.freeze({
    weather_entity: "Weather Entity",
    sun_entity: "Sun Entity",
    moon_phase_entity: "Moon Phase Entity",
    _color_mode: "Color Mode",
    theme_entity: "Theme Entity",

    card_style: "Card Style",
    square: "Square Mode",
    card_height: "Card Height",
    offset: "Card Offset",
    stack_order: "Layer Order",
    tap_action: "Tap Action",
    filter: "Visual Filter",
    full_width: "Full Width",
    css_mask_vertical: "Fade Top & Bottom Edges",
    css_mask_horizontal: "Fade Left & Right Edges",

    sun_moon_size: "Sun / Moon Size (px)",
    sun_moon_x_position: "Sun / Moon X Position",
    sun_moon_y_position: "Sun / Moon Y Position",
    moon_style: "Moon Glow Color",

    day: "Day Image URL",
    night: "Night Image URL",
    image_scale: "Image Scale (%)",
    image_alignment: "Image Alignment",
    status_entity: "Status Entity",
    status_image_day: "Status Image (Day)",
    status_image_night: "Status Image (Night)",

    disable_text: "Disable All Text",
    combine_text: "Combine Top & Bottom Text",
    swap_text: "Swap Top & Bottom Text",
    top_text_sensor: "Top Sensor",
    top_font_size: "Font Size",
    disable_bottom_text: "Disable Bottom Text",
    bottom_text_sensor: "Bottom Sensor",
    bottom_font_size: "Font Size",
    bottom_text_width: "Container Width",
    disable_bottom_icon: "Disable Icon",
    bottom_text_icon: "Icon",
    bottom_text_icon_path: "Icon Folder Path",
    bottom_text_overflow: "Overflow",
    bottom_text_marquee_speed: "Marquee Speed",
    text_background: "Text Background",
    text_background_style: "Text Background Style",

    custom_cards_position: "Embedded Cards Position",
    custom_cards_css_class: "Embedded Cards CSS Class"
});

const HELPERS = Object.freeze({
    weather_entity: "Your Home Assistant weather integration entity.",
    sun_entity:
        "Drives the sky — without it the moon and stars never appear and the card stays in permanent day.",
    moon_phase_entity: "Renders the correct moon phase.",
    _color_mode:
        "Default: colors follow your Home Assistant theme. Pick 'Follow another entity' to track sunrise and sunset. Force options lock the look regardless.",
    theme_entity:
        "Pick the entity that drives the sun/moon circle. Most setups use sun.sun. The sun disappears and the moon shows up when this entity is on, true, dark, night, evening, or below_horizon.",

    card_style:
        "Immersive (default) is transparent and blends into your dashboard. Standalone gives the card its own solid background.",
    card_height: "Height in pixels, or click Auto to fill grid layouts.",
    offset: "Outer margin in pixels. Useful when layering cards.",
    stack_order: "Raise above 0 to layer the card in front of others. Default: 1 for standalone, -1 for immersive.",
    tap_action: "Action performed when the card is tapped.",
    full_width: "Immersive only. Stretches the card edge-to-edge by removing side margins.",
    css_mask_vertical: "Immersive only. Fades the top and bottom edges of the card.",
    css_mask_horizontal: "Immersive only. Fades the left and right edges of the card.",
    filter: "Optional visual filter applied to the entire weather canvas.",

    moon_style:
        "Glow color for the moon when the card is in immersive light mode.",
    sun_moon_x_position:
        "Pixels from the card edge, or Center. Positive values offset from the left; negative values offset from the right. Leave empty for the default (100 px from the left).",
    sun_moon_y_position:
        "Pixels from the top of the card, or Center. Leave empty for the default (100 px from the top).",
    sun_moon_size: "Diameter in pixels. Leave empty for the automatic default.",

    night: "Falls back to the day image if left empty.",
    image_scale: "Image height as a percentage of the card height.",
    image_alignment:
        "Anchor the background image to one of nine positions. Click the selected cell to clear.",

    status_entity:
        "Swaps the background image when this entity is in an active state (on, true, open, unlocked, home, active).",
    status_image_day: "Day image shown when the status entity is active.",
    status_image_night: "Night image shown when the status entity is active.",

    top_text_sensor: "Defaults to the weather entity's temperature.",
    bottom_text_sensor: "Defaults to the weather entity's wind speed.",
    combine_text:
        "Merge top and bottom text into a single line inside the bottom container, separated by a thin divider.",
    swap_text:
        "Swap the rendering order of the top and bottom text.",
    text_position:
        "Horizontal anchor of the text block. Auto lets the card place text opposite the sun/moon.",
    text_alignment:
        "Vertical distribution of the top and bottom text. Spread pins them to opposite edges.",
    text_layout_mode:
        "Stacked keeps top and bottom text in a column. Split Top / Split Bottom place them side-by-side, pinned to the top or bottom edge of the card.",
    bottom_text_icon:
        "Pick an MDI icon, or type 'weather' to auto-pick by current weather state.",
    bottom_text_icon_path:
        "Folder for custom SVG icons (used with bottom_text_icon). Example: /local/weather-icons/",
    bottom_text_overflow:
        "Behavior when text exceeds the container width. Marquee scrolls horizontally like a ticker and needs a Container Width set smaller than the natural text width. Marquee scrolling can stutter on low-powered devices.",
    bottom_text_marquee_speed:
        "Scroll speed in pixels per second. Higher values scroll faster; default is 30. Only takes effect when Overflow is set to Marquee.",
    bottom_text_width:
        "Limit the container width (e.g. 60% or 200px). Required for the Marquee overflow mode.",
    text_background_style:
        "Frosted is translucent glass with a thin border. Pill is opaque and high-contrast. Fade is a soft blurred halo.",

    custom_cards_position:
        "Dock the embedded cards container. Defaults to the bottom corner opposite the sun/moon.",
    custom_cards_css_class:
        "CSS class on the container — useful for targeting it with card_mod."
});

// Prefill values used for display only. Keys matching these are stripped on
// save so the persisted YAML stays minimal and only contains user overrides.
const DISPLAY_DEFAULTS = Object.freeze({
    card_style: "immersive",
    theme: "auto",
    filter: "none",
    moon_style: "blue",
    image_alignment: "top-right",
    bottom_text_overflow: "ellipsis",
    text_background_style: "frosted",
    bottom_text_marquee_speed: 30
});

const OPT = Object.freeze({
    card_style: [
        { value: "immersive", label: "Immersive (no background)" },
        { value: "standalone", label: "Standalone (dynamic background)" }
    ],
    color_mode: [
        { value: "ha_theme",    label: "Follow my Home Assistant theme" },
        { value: "entity",      label: "Follow another entity (e.g. the sun)" },
        { value: "force_light", label: "Force light mode" },
        { value: "force_dark",  label: "Force dark mode" }
    ],
    filter: [
        { value: "none", label: "None" },
        { value: "darken", label: "Darken" },
        { value: "vivid", label: "Vivid" },
        { value: "muted", label: "Muted" },
        { value: "warm", label: "Warm" }
    ],
    moon_style: [
        { value: "blue", label: "Blue" },
        { value: "yellow", label: "Yellow" },
        { value: "purple", label: "Purple" },
        { value: "grey", label: "Grey" }
    ],
    bottom_text_overflow: [
        { value: "ellipsis", label: "Ellipsis" },
        { value: "marquee", label: "Marquee (scrolling ticker)" },
        { value: "clip", label: "Clip" },
        { value: "wrap", label: "Wrap" }
    ],
    text_background_style: [
        { value: "frosted", label: "Frosted (translucent glass)" },
        { value: "pill", label: "Pill (opaque, high contrast)" },
        { value: "fade", label: "Fade (soft blurred halo)" }
    ]
});

// Shared format for all 3x3 corner pickers.
//   cells:    3x3 matrix of values (null = empty cell)
//   disabled: optional list of values to render as dim, non-interactive cells
//   extras:   optional row of full-width buttons rendered below the grid
const POSITION_GRIDS = Object.freeze({
    image_alignment: {
        cells: [
            ["top-left",    "top-center",    "top-right"],
            ["center-left", "center",        "center-right"],
            ["bottom-left", "bottom-center", "bottom-right"]
        ]
    },
    custom_cards_position: {
        cells: [
            ["top-left",    "top-center",    "top-right"],
            ["left",        "center",        "right"],
            ["bottom-left", "bottom-center", "bottom-right"]
        ],
        // Card line 2294: the V resolver falls through to 'cc-align-bottom'
        // when the position string contains neither 'top' nor 'center', so
        // plain "left" and "right" render identically to "bottom-left" and
        // "bottom-right". Greyed out to prevent confusion.
        disabled: ["left", "right"]
    }
});

class AtmosphericWeatherCardEditor extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            _config: { type: Object, state: true },
            // Explicit Color Mode dropdown choice, kept separate from theme /
            // theme_entity so the picker doesn't revert to ha_theme while the
            // user is still filling in an override.
            _colorModeState: { type: String, state: true },
            // Index of the embedded card currently expanded in the editor
            // list, or null.
            _expandedCard: { type: Number, state: true }
        };
    }

    static get styles() {
        return css`
            :host { display: block; }
            ha-form { display: block; }
            ha-expansion-panel {
                display: block;
                margin-top: 12px;
                --ha-card-border-radius: 6px;
            }
            ha-expansion-panel ha-form { margin-top: 8px; }
            .panel-header {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 15px;
                font-weight: 500;
                color: var(--primary-text-color);
            }
            .panel-header ha-icon {
                --mdc-icon-size: 22px;
                color: var(--secondary-text-color);
            }

            .info {
                padding: 10px 14px;
                margin: 0 0 12px 0;
                font-size: 13px;
                line-height: 1.5;
                color: var(--secondary-text-color);
                background: var(--secondary-background-color);
                border-radius: 8px;
            }
            .info b { color: var(--primary-text-color); }
            .info code {
                background: var(--primary-background-color);
                padding: 1px 5px;
                border-radius: 3px;
                font-size: 12px;
            }

            /* Grid position picker */
            .grid-picker { margin: 16px 0 8px; }
            .grid-picker-label,
            .composite-label {
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 8px;
                color: var(--primary-text-color);
            }
            .grid-3x3 {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 4px;
                width: 144px;
                aspect-ratio: 1;
            }
            .grid-cell {
                border: 1.5px solid var(--divider-color);
                background: var(--secondary-background-color);
                border-radius: 4px;
                cursor: pointer;
                padding: 0;
                transition: background 0.12s, border-color 0.12s;
            }
            .grid-cell:hover { border-color: var(--primary-color); }
            .grid-cell.active {
                background: var(--primary-color);
                border-color: var(--primary-color);
            }
            .grid-cell.empty {
                visibility: hidden;
                pointer-events: none;
            }
            .grid-cell.disabled {
                opacity: 0.25;
                cursor: not-allowed;
                background:
                    repeating-linear-gradient(
                        45deg,
                        var(--secondary-background-color) 0 6px,
                        var(--divider-color) 6px 7px
                    );
            }
            .grid-cell.disabled:hover { border-color: var(--divider-color); }
            .grid-extras {
                display: flex;
                gap: 6px;
                margin-top: 8px;
                flex-wrap: wrap;
            }
            .grid-extra {
                flex: 1;
                min-width: 100px;
                padding: 6px 12px;
                border: 1.5px solid var(--divider-color);
                background: var(--secondary-background-color);
                border-radius: 4px;
                color: var(--primary-text-color);
                font-size: 13px;
                cursor: pointer;
                transition: background 0.12s, border-color 0.12s;
            }
            .grid-extra:hover { border-color: var(--primary-color); }
            .grid-extra.active {
                background: var(--primary-color);
                border-color: var(--primary-color);
                color: var(--text-primary-color, white);
            }
            .grid-helper,
            .composite-helper {
                margin-top: 8px;
                font-size: 12px;
                color: var(--secondary-text-color);
                line-height: 1.4;
            }

            /* Composite fields (offset, card height, sun/moon positions) */
            .composite { margin: 16px 0 8px; }
            .composite-row {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
            }
            .composite-unit {
                font-size: 13px;
                color: var(--secondary-text-color);
            }
            .composite-number,
            .composite-grid-4 input {
                width: 90px;
                padding: 8px 10px;
                border: 1.5px solid var(--divider-color);
                background: var(--secondary-background-color);
                color: var(--primary-text-color);
                border-radius: 4px;
                font-size: 13px;
                box-sizing: border-box;
            }
            .composite-number:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            .composite-grid-4 {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
            }
            .composite-grid-4 label {
                display: flex;
                flex-direction: column;
                gap: 4px;
                font-size: 12px;
                color: var(--secondary-text-color);
            }
            .composite-grid-4 input { width: 100%; }
            .composite-chip {
                padding: 8px 14px;
                border: 1.5px solid var(--divider-color);
                background: var(--secondary-background-color);
                color: var(--primary-text-color);
                border-radius: 4px;
                font-size: 13px;
                cursor: pointer;
                transition: background 0.12s, border-color 0.12s;
            }
            .composite-chip:hover { border-color: var(--primary-color); }
            .composite-chip.active {
                background: var(--primary-color);
                border-color: var(--primary-color);
                color: var(--text-primary-color, white);
            }
            .segmented {
                display: inline-flex;
                border: 1.5px solid var(--divider-color);
                border-radius: 4px;
                overflow: hidden;
            }
            .segmented button {
                padding: 8px 14px;
                border: 0;
                border-right: 1.5px solid var(--divider-color);
                background: var(--secondary-background-color);
                color: var(--primary-text-color);
                font-size: 13px;
                cursor: pointer;
                transition: background 0.12s;
            }
            .segmented button:last-child { border-right: 0; }
            .segmented button:hover { background: var(--divider-color); }
            .segmented button.active {
                background: var(--primary-color);
                color: var(--text-primary-color, white);
            }

            /* Disclosure: native <details>, zero reactive cost on toggle */
            details.disclosure { margin-top: 10px; }
            details.disclosure > summary {
                list-style: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 8px 0;
                font-size: 13px;
                font-weight: 500;
                color: var(--secondary-text-color);
                user-select: none;
            }
            details.disclosure > summary::-webkit-details-marker { display: none; }
            details.disclosure > summary:hover { color: var(--primary-text-color); }
            details.disclosure > summary ha-icon {
                --mdc-icon-size: 18px;
                transition: transform 0.15s ease;
            }
            details.disclosure[open] > summary ha-icon { transform: rotate(90deg); }
            details.disclosure > .disclosure-body { padding-top: 4px; }

            /* Embedded cards editor */
            .cards-empty {
                padding: 14px;
                text-align: center;
                font-size: 13px;
                color: var(--secondary-text-color);
                background: var(--secondary-background-color);
                border-radius: 8px;
                margin-bottom: 12px;
            }
            .card-row {
                border: 1.5px solid var(--divider-color);
                border-radius: 6px;
                margin-bottom: 8px;
                background: var(--secondary-background-color);
                overflow: hidden;
            }
            .card-row-head {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 12px;
                cursor: pointer;
                user-select: none;
            }
            .card-row-head:hover { background: var(--divider-color); }
            .card-row-head > ha-icon:first-child {
                --mdc-icon-size: 20px;
                color: var(--secondary-text-color);
                transition: transform 0.15s ease;
            }
            .card-row.expanded .card-row-head > ha-icon:first-child {
                transform: rotate(90deg);
            }
            .card-row-title {
                flex: 1;
                font-size: 14px;
                font-weight: 500;
                color: var(--primary-text-color);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .card-row-actions { display: flex; gap: 2px; }
            .card-row-actions button {
                width: 32px;
                height: 32px;
                border: 0;
                background: transparent;
                color: var(--secondary-text-color);
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .card-row-actions button:hover:not(:disabled) {
                background: var(--divider-color);
                color: var(--primary-text-color);
            }
            .card-row-actions button:disabled {
                opacity: 0.35;
                cursor: not-allowed;
            }
            .card-row-actions ha-icon { --mdc-icon-size: 18px; }
            .card-row-body {
                padding: 0 12px 12px 12px;
                border-top: 1px solid var(--divider-color);
                background: var(--primary-background-color);
            }
            .add-card-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                width: 100%;
                padding: 12px;
                border: 1.5px dashed var(--divider-color);
                background: transparent;
                color: var(--primary-text-color);
                border-radius: 6px;
                font-size: 14px;
                cursor: pointer;
                transition: background 0.12s, border-color 0.12s;
            }
            .add-card-btn:hover {
                border-color: var(--primary-color);
                background: var(--secondary-background-color);
            }
        `;
    }

    // Normalize legacy aliases, seed Color Mode state, and auto-fill sensible
    // entity defaults on a fresh config so new users get a working preview
    // immediately.
    setConfig(config) {
        const c = { ...(config || {}) };

        // Legacy alias migration. The card itself still reads both forms;
        // the editor always persists the canonical keys.
        if (c.combine_texts !== undefined && c.combine_text === undefined) c.combine_text = c.combine_texts;
        if (c.swap_texts !== undefined && c.swap_text === undefined) c.swap_text = c.swap_texts;
        if (c.mode !== undefined && c.theme === undefined) c.theme = c.mode;
        delete c.combine_texts;
        delete c.swap_texts;
        delete c.mode;

        let autofilled = false;
        if (!c.weather_entity && this.hass && this.hass.states) {
            const firstWeather = Object.keys(this.hass.states).find((id) => id.startsWith("weather."));
            if (firstWeather) { c.weather_entity = firstWeather; autofilled = true; }
        }
        if (!c.sun_entity && this.hass && this.hass.states && this.hass.states["sun.sun"]) {
            c.sun_entity = "sun.sun";
            autofilled = true;
        }

        this._config = c;

        if (c.theme === "light")      this._colorModeState = "force_light";
        else if (c.theme === "dark")  this._colorModeState = "force_dark";
        else if (c.theme_entity)      this._colorModeState = "entity";
        else                          this._colorModeState = "ha_theme";

        if (autofilled) {
            Promise.resolve().then(() => this._emit());
        }
    }

    get _formData() {
        const c = { ...DISPLAY_DEFAULTS, ...(this._config || {}) };
        c._color_mode = this._colorModeState || (
            c.theme === "light" ? "force_light" :
            c.theme === "dark"  ? "force_dark"  :
            c.theme_entity      ? "entity"      : "ha_theme"
        );
        return c;
    }

    // Card Settings — required entities only. Color Mode lives in its own
    // panel right after this one because it's important enough to deserve
    // dedicated context, and we don't want it buried among entity pickers.
    _weatherEntitySchema() {
        return [
            { name: "weather_entity", selector: { entity: { domain: "weather" } } }
        ];
    }

    _sunMoonEntitiesSchema() {
        return [
            { name: "sun_entity",        selector: { entity: { domain: "sun" } } },
            { name: "moon_phase_entity", selector: { entity: { domain: "sensor" } } }
        ];
    }

    // Color Mode panel — the select plus its conditional theme entity. The
    // explanatory info boxes around this form are rendered in render() so
    // they can use rich content (bold emphasis, paragraphs).
    _colorModeSchema() {
        const c = this._formData;
        const showThemeEntity = c._color_mode === "entity";
        return [
            {
                name: "_color_mode",
                selector: { select: { mode: "dropdown", options: OPT.color_mode } }
            },
            ...(showThemeEntity ? [{ name: "theme_entity", selector: { entity: {} } }] : [])
        ];
    }

    // Color Mode advanced — the visual filter lives here because it's a
    // global look adjustment that conceptually belongs with the rest of the
    // color decisions.
    _colorModeAdvancedSchema() {
        return [
            { name: "filter", selector: { select: { mode: "dropdown", options: OPT.filter } } }
        ];
    }

    // Layout core. card_height is rendered as a composite picker in render()
    // so the Auto chip sits next to the number input, so it is NOT in this
    // schema.
    _layoutCoreSchema() {
        return [
            { name: "card_style", selector: { select: { mode: "dropdown", options: OPT.card_style } } }
        ];
    }

    _tapActionSchema() {
        return [
            { name: "tap_action", selector: { ui_action: {} } }
        ];
    }

    _layoutAdvancedSchema() {
        const c = this._formData;
        const isStandalone = c.card_style === "standalone";
        return [
            { name: "square", selector: { boolean: {} } },
            { name: "stack_order", selector: { number: { mode: "box", step: 1 } } },
            ...(isStandalone ? [] : [
                {
                    type: "grid", name: "",
                    schema: [
                        { name: "full_width",          selector: { boolean: {} } },
                        { name: "css_mask_vertical",   selector: { boolean: {} } },
                        { name: "css_mask_horizontal", selector: { boolean: {} } }
                    ]
                }
            ])
        ];
    }

    _textMasterSchema() {
        return [{ name: "disable_text", selector: { boolean: {} } }];
    }

    // Each text subsection is a small focused schema rendered inside its own
    // disclosure. Layout and background controls affecting both texts live
    // in their own sections; Top and Bottom sections hold only fields
    // specific to that text. When combine_text is on, the Top section is
    // hidden and the bottom section is relabelled "Combined Text" and
    // receives top_text_sensor at the top (top_font_size is intentionally
    // omitted — the card's CSS applies --awc-top-font-size only to the
    // hidden #temp-text element and has no effect on the combined span).

    _textLayoutSchema() {
        return [
            { name: "combine_text", selector: { boolean: {} } },
            { name: "swap_text",    selector: { boolean: {} } }
        ];
    }

    _textBgStyleSchema() {
        return [
            { name: "text_background_style", selector: { select: { mode: "dropdown", options: OPT.text_background_style } } }
        ];
    }

    _textTopSchema() {
        return [
            { name: "top_text_sensor", selector: { entity: {} } },
            { name: "top_font_size",   selector: { text: {} } }
        ];
    }

    _textBottomSchema() {
        const c = this._formData;
        const combined       = c.combine_text === true;
        const bottomDisabled = !combined && c.disable_bottom_text === true;
        const iconDisabled   = c.disable_bottom_icon === true;
        const isMarquee      = (c.bottom_text_overflow || "").toLowerCase() === "marquee";

        // disable_bottom_text has no effect when combined (card line 2072:
        // bottom container is always rendered if combineText). Hide it.
        const head = combined
            ? [{ name: "top_text_sensor", selector: { entity: {} } }]
            : [{ name: "disable_bottom_text", selector: { boolean: {} } }];

        if (bottomDisabled) return head;

        return [
            ...head,
            { name: "bottom_text_sensor", selector: { entity: {} } },
            {
                type: "grid", name: "",
                schema: [
                    { name: "bottom_font_size",  selector: { text: {} } },
                    { name: "bottom_text_width", selector: { text: {} } }
                ]
            },
            { name: "disable_bottom_icon", selector: { boolean: {} } },
            ...(iconDisabled ? [] : [
                {
                    type: "grid", name: "",
                    schema: [
                        { 
                            name: "bottom_text_icon",      
                            selector: { 
                                select: { 
                                    mode: "dropdown",
                                    options: [
                                        { value: "weather", label: "Dynamic Weather Icon" }
                                    ],
                                    custom_value: true 
                                } 
                            } 
                        },
                        { name: "bottom_text_icon_path", selector: { text: {} } }
                    ]
                }
            ]),
            { name: "bottom_text_overflow", selector: { select: { mode: "dropdown", options: OPT.bottom_text_overflow } } },
            ...(isMarquee ? [
                { name: "bottom_text_marquee_speed", selector: { number: { mode: "box", min: 5, step: 1 } } }
            ] : [])
        ];
    }

    _sunMoonSizeSchema() {
        return [
            { name: "sun_moon_size", selector: { number: { mode: "box", min: 0, step: 1 } } }
        ];
    }

    _sunMoonMoonStyleSchema() {
        const c = this._formData;
        if (c.card_style === "standalone") return [];
        return [
            { name: "moon_style", selector: { select: { mode: "dropdown", options: OPT.moon_style } } }
        ];
    }

    _imageTopSchema() {
        return [
            { name: "day",         selector: { text: {} } },
            { name: "night",       selector: { text: {} } },
            { name: "image_scale", selector: { number: { mode: "slider", min: 0, max: 200, step: 1 } } }
        ];
    }

    // Status override — plain schema with status_entity always present,
    // image fields appearing once an entity is picked. Rendered inside a
    // native <details> disclosure (see render()).
    _imageStatusSchema() {
        const c = this._formData;
        const hasStatus = !!c.status_entity;
        return [
            { name: "status_entity", selector: { entity: {} } },
            ...(hasStatus ? [
                { name: "status_image_day",   selector: { text: {} } },
                { name: "status_image_night", selector: { text: {} } }
            ] : [])
        ];
    }

    _embeddedCardsAdvancedSchema() {
        return [
            { name: "custom_cards_css_class", selector: { text: {} } }
        ];
    }

    _computeLabel = (schema) => {
        if (!schema || !schema.name) return "";
        return LABELS[schema.name] || schema.name;
    };

    _computeHelper = (schema) => {
        if (!schema || !schema.name) return undefined;
        return HELPERS[schema.name] || undefined;
    };

    // ha-form returns the full data object on every change. Side-effects:
    //   - Color Mode drives both theme_entity and theme.
    //   - Picking "entity" mode auto-fills theme_entity from sun_entity.
    //   - First-time status_entity prefills status images from day/night.
    //   - Turning on Square clears any lingering card_height.
    _valueChanged(ev) {
        ev.stopPropagation();
        if (!this._config) return;
        const prev = this._config;
        const incoming = { ...((ev.detail && ev.detail.value) || {}) };

        if (incoming._color_mode !== undefined) {
            this._colorModeState = incoming._color_mode;
            switch (incoming._color_mode) {
                case "ha_theme":
                    delete incoming.theme_entity;
                    delete incoming.theme;
                    break;
                case "entity":
                    delete incoming.theme;
                    if (!incoming.theme_entity) {
                        incoming.theme_entity = incoming.sun_entity
                            || (this.hass && this.hass.states && this.hass.states["sun.sun"] ? "sun.sun" : "");
                    }
                    break;
                case "force_light":
                    delete incoming.theme_entity;
                    incoming.theme = "light";
                    break;
                case "force_dark":
                    delete incoming.theme_entity;
                    incoming.theme = "dark";
                    break;
            }
        }
        // _color_mode is a virtual UI-only key; it never persists to YAML.
        delete incoming._color_mode;

        if (incoming.status_entity && !prev.status_entity) {
            if (!incoming.status_image_day && incoming.day) {
                incoming.status_image_day = incoming.day;
            }
            if (!incoming.status_image_night && incoming.night) {
                incoming.status_image_night = incoming.night;
            }
        }

        if (incoming.square === true && prev.square !== true) {
            delete incoming.card_height;
        }

        this._config = this._cleanConfig(incoming);
        this._emit();
    }

    // Cleanup before emit:
    //   1. Drop empty strings, null, undefined, empty arrays/objects.
    //   2. Drop values that match DISPLAY_DEFAULTS so YAML stays minimal.
    //   3. Drop legacy aliases and virtual fields defensively in case a
    //      stale one slipped in through a paste-in YAML config.
    _cleanConfig(config) {
        const out = { ...config };

        for (const key of Object.keys(out)) {
            const v = out[key];
            if (v === "" || v === null || v === undefined) {
                delete out[key];
                continue;
            }
            if (Array.isArray(v) && v.length === 0) {
                delete out[key];
                continue;
            }
            if (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0) {
                delete out[key];
            }
        }

        for (const [k, defVal] of Object.entries(DISPLAY_DEFAULTS)) {
            if (out[k] === defVal) delete out[k];
        }

        delete out.combine_texts;
        delete out.swap_texts;
        delete out.mode;
        delete out._color_mode;

        return out;
    }

    // Defensive shallow-copy of _config so downstream listeners can't mutate
    // editor state through the event detail.
    _emit() {
        this.dispatchEvent(new CustomEvent("config-changed", {
            detail: { config: { ...(this._config || {}) } },
            bubbles: true,
            composed: true
        }));
    }

    _renderForm(schema) {
        if (!schema || schema.length === 0) return "";
        return html`
            <ha-form
                .hass=${this.hass}
                .data=${this._formData}
                .schema=${schema}
                .computeLabel=${this._computeLabel}
                .computeHelper=${this._computeHelper}
                @value-changed=${this._valueChanged}
            ></ha-form>
        `;
    }

    // Unified text positioning — three orthogonal controls:
    //
    //   Layout:     Stacked | Split Top | Split Bottom
    //   Horizontal: Auto | Left | Center | Right       (hidden in split)
    //   Vertical:   Spread | Top | Center | Bottom     (hidden in split)
    //
    // Card data model (card lines 2222-2262): horizontal is resolved by
    // substring match against text_position, vertical is resolved from
    // text_alignment when set, and split-top / split-bottom override
    // everything else. Writing H to text_position and V to text_alignment
    // separately is therefore fully supported, and legacy combined values
    // like "top-left" still parse correctly on read.
    _parseTextPositioning() {
        const c = this._formData;
        const rawPos = (c.text_position || "").toString().toLowerCase().trim();
        const rawAlign = (c.text_alignment || "").toString().toLowerCase().trim();

        if (rawPos === "split-top" || rawPos === "split-bottom") {
            return { layout: rawPos, h: "auto", v: "spread" };
        }

        let h = "auto";
        if (rawPos.includes("left")) h = "left";
        else if (rawPos.includes("right")) h = "right";
        else if (rawPos.includes("center")) h = "center";

        let v;
        // text_alignment wins over any vertical implied by text_position.
        // Mirrors the card's resolver at card lines 2241-2247.
        if (rawAlign === "top" || rawAlign === "center" || rawAlign === "bottom" || rawAlign === "spread") {
            v = rawAlign;
        } else if (rawPos.includes("top")) {
            v = "top";
        } else if (rawPos.includes("bottom")) {
            v = "bottom";
        } else {
            v = "spread";
        }

        return { layout: "stacked", h, v };
    }

    _setTextLayout(layout) {
        const next = { ...(this._config || {}) };
        if (layout === "stacked") {
            // Drop split; restore stacked mode. Preserve existing H/V.
            const parsed = this._parseTextPositioning();
            if (parsed.h === "auto") {
                delete next.text_position;
            } else {
                next.text_position = parsed.h;
            }
        } else {
            next.text_position = layout;
        }
        this._config = this._cleanConfig(next);
        this._emit();
    }

    _setTextHorizontal(h) {
        const next = { ...(this._config || {}) };
        // Only applies in stacked mode; ignore if currently split.
        const currentPos = (next.text_position || "").toString().toLowerCase().trim();
        if (currentPos === "split-top" || currentPos === "split-bottom") return;
        if (h === "auto") {
            delete next.text_position;
        } else {
            next.text_position = h;
        }
        this._config = this._cleanConfig(next);
        this._emit();
    }

    _setTextVertical(v) {
        const next = { ...(this._config || {}) };
        next.text_alignment = v;
        this._config = this._cleanConfig(next);
        this._emit();
    }

    _renderTextLayoutControls() {
        const parsed = this._parseTextPositioning();
        const isSplit = parsed.layout !== "stacked";

        const layoutOpts = [
            { value: "stacked",      label: "Stacked" },
            { value: "split-top",    label: "Split Top" },
            { value: "split-bottom", label: "Split Bottom" }
        ];
        const hOpts = [
            { value: "auto",   label: "Auto" },
            { value: "left",   label: "Left" },
            { value: "center", label: "Center" },
            { value: "right",  label: "Right" }
        ];
        const vOpts = [
            { value: "spread", label: "Spread" },
            { value: "top",    label: "Top" },
            { value: "center", label: "Center" },
            { value: "bottom", label: "Bottom" }
        ];

        const renderRow = (labelKey, label, opts, current, onClick) => html`
            <div class="composite">
                <div class="composite-label">${label}</div>
                <div class="composite-row">
                    <div class="segmented" role="radiogroup" aria-label=${label}>
                        ${opts.map((o) => html`
                            <button
                                type="button"
                                role="radio"
                                class=${current === o.value ? "active" : ""}
                                aria-checked=${current === o.value ? "true" : "false"}
                                @click=${() => onClick(o.value)}
                            >${o.label}</button>
                        `)}
                    </div>
                </div>
                ${HELPERS[labelKey]
                    ? html`<div class="composite-helper">${HELPERS[labelKey]}</div>`
                    : ""}
            </div>
        `;

        return html`
            ${renderRow("text_layout_mode", "Layout", layoutOpts, parsed.layout, (v) => this._setTextLayout(v))}
            ${isSplit
                ? ""
                : html`
                      ${renderRow("text_position", "Horizontal", hOpts, parsed.h, (v) => this._setTextHorizontal(v))}
                      ${renderRow("text_alignment", "Vertical", vOpts, parsed.v, (v) => this._setTextVertical(v))}
                  `}
        `;
    }

    // Text Background segmented control. Drives the two independent card
    // flags (top_text_background, bottom_text_background) through a single
    // user-facing choice. In combined mode the distinction between top/
    // bottom/both collapses (card line 2073: bg = showBottomBg||showTopBg,
    // line 2074: temp-text never gets bg when combined), so the picker
    // degrades to a 2-option On/None.
    _renderTextBackgroundSection() {
        const c = this._formData;
        const combined = c.combine_text === true;
        const top = c.top_text_background === true;
        const bot = c.bottom_text_background === true;

        let mode;
        if (combined) {
            mode = (top || bot) ? "on" : "none";
        } else {
            mode = (top && bot) ? "both" : top ? "top" : bot ? "bottom" : "none";
        }

        const opts = combined
            ? [
                { value: "on",   label: "On" },
                { value: "none", label: "None" }
              ]
            : [
                { value: "both",   label: "Both" },
                { value: "top",    label: "Top" },
                { value: "bottom", label: "Bottom" },
                { value: "none",   label: "None" }
              ];

        const showStyle = mode !== "none";

        return html`
            <div class="grid-picker">
                <div class="grid-picker-label">${LABELS.text_background}</div>
                <div class="segmented" role="radiogroup" aria-label=${LABELS.text_background}>
                    ${opts.map((o) => html`
                        <button
                            type="button"
                            role="radio"
                            class=${mode === o.value ? "active" : ""}
                            aria-checked=${mode === o.value ? "true" : "false"}
                            @click=${() => this._setTextBgMode(o.value)}
                        >${o.label}</button>
                    `)}
                </div>
            </div>
            ${showStyle ? this._renderForm(this._textBgStyleSchema()) : ""}
        `;
    }

    _setTextBgMode(mode) {
        const next = { ...(this._config || {}) };
        switch (mode) {
            case "both":
                next.top_text_background = true;
                next.bottom_text_background = true;
                break;
            case "top":
                next.top_text_background = true;
                next.bottom_text_background = false;
                break;
            case "bottom":
                next.top_text_background = false;
                next.bottom_text_background = true;
                break;
            case "on":
                // Combined mode: route through bottom flag since that's the
                // visible container. Clear top flag to avoid stale state.
                next.top_text_background = false;
                next.bottom_text_background = true;
                break;
            case "none":
                next.top_text_background = false;
                next.bottom_text_background = false;
                break;
        }
        this._config = this._cleanConfig(next);
        this._emit();
    }

    // Native <details> disclosure: state is handled by the browser, so
    // toggling does not trigger a Lit re-render.
    _renderDisclosure(label, content) {
        return html`
            <details class="disclosure">
                <summary>
                    <ha-icon icon="mdi:chevron-right"></ha-icon>
                    <span>${label}</span>
                </summary>
                <div class="disclosure-body">${content}</div>
            </details>
        `;
    }

    // 3x3 position grid picker. Reads from _formData so DISPLAY_DEFAULTS are
    // reflected in the active cell on a fresh config.
    _renderPositionGrid(field, gridDef) {
        const value = this._formData[field] || "";
        const cells = gridDef.cells.flat();
        const disabledSet = new Set(gridDef.disabled || []);
        const helper = HELPERS[field];
        const labelText = LABELS[field] || field;

        return html`
            <div class="grid-picker">
                <div class="grid-picker-label">${labelText}</div>
                <div class="grid-3x3" role="radiogroup" aria-label=${labelText}>
                    ${cells.map((val) => {
                        if (val === null) {
                            return html`<div class="grid-cell empty"></div>`;
                        }
                        const isDisabled = disabledSet.has(val);
                        return html`
                            <button
                                type="button"
                                role="radio"
                                class="grid-cell ${value === val ? "active" : ""} ${isDisabled ? "disabled" : ""}"
                                ?disabled=${isDisabled}
                                title=${isDisabled ? `${val} (not supported here)` : val}
                                aria-label=${val}
                                aria-checked=${value === val ? "true" : "false"}
                                @click=${isDisabled ? null : () => this._setField(field, val)}
                            ></button>
                        `;
                    })}
                </div>
                ${gridDef.extras
                    ? html`
                          <div class="grid-extras">
                              ${gridDef.extras.map(
                                  (ex) => html`
                                      <button
                                          type="button"
                                          class="grid-extra ${value === ex.value ? "active" : ""}"
                                          aria-pressed=${value === ex.value ? "true" : "false"}
                                          @click=${() => this._setField(field, ex.value)}
                                      >
                                          ${ex.label}
                                      </button>
                                  `
                              )}
                          </div>
                      `
                    : ""}
                ${helper ? html`<div class="grid-helper">${helper}</div>` : ""}
            </div>
        `;
    }

    // Toggle-on-click setter used by the grid picker: clicking the active
    // cell clears the field back to its default.
    _setField(field, value) {
        const current = this._config || {};
        let next;
        if (current[field] === value) {
            next = { ...current };
            delete next[field];
        } else {
            next = { ...current, [field]: value };
        }
        this._config = this._cleanConfig(next);
        this._emit();
    }

    // Plain setter used by the composite pickers.
    _updateField(field, value) {
        const next = { ...(this._config || {}) };
        if (value === "" || value === null || value === undefined) {
            delete next[field];
        } else {
            next[field] = value;
        }
        this._config = this._cleanConfig(next);
        this._emit();
    }

    // Card Height composite — number input plus an "Auto" chip. Stored as
    // either a numeric string ("220" or "220px") or the literal "auto". The
    // composite accepts either on read and always writes the "Npx" form for
    // numeric values, matching the card's expectations.
    _renderCardHeightField() {
        const current = String(this._formData.card_height || "").trim();
        const isAuto = current === "auto";
        const numeric = isAuto ? "" : current.replace(/px$/i, "");

        return html`
            <div class="composite">
                <div class="composite-label">${LABELS.card_height}</div>
                <div class="composite-row">
                    <input
                        type="number"
                        class="composite-number"
                        min="0"
                        step="1"
                        placeholder="e.g. 220"
                        .value=${numeric}
                        ?disabled=${isAuto}
                        @change=${(e) => {
                            const v = e.target.value;
                            this._updateField("card_height", v ? `${parseInt(v, 10)}px` : "");
                        }}
                    >
                    <span class="composite-unit">px</span>
                    <button
                        type="button"
                        class="composite-chip ${isAuto ? "active" : ""}"
                        @click=${() => this._updateField("card_height", isAuto ? "" : "auto")}
                    >Auto</button>
                </div>
                ${HELPERS.card_height
                    ? html`<div class="composite-helper">${HELPERS.card_height}</div>`
                    : ""}
            </div>
        `;
    }

    // Sun / Moon position — the card's parseAxis (card line 2572) accepts
    // exactly two forms:
    //   "center"          → centered on that axis
    //   integer (pixels)  → for X, negative wraps to (width + v) so
    //                       negative numbers = offset from the right edge;
    //                       for Y, negative is a literal negative pixel
    //                       offset and effectively invalid, so the input
    //                       for Y is constrained to >= 0.
    // Anything else (undefined, empty) falls back to 100 px internally.
    //
    // Returns one of:
    //   "center"  — center mode
    //   number    — custom mode with a valid pixel value
    //   null      — custom mode, empty/unset input
    _parseSunMoonAxis(raw) {
        if (raw === undefined || raw === null || raw === "") return null;
        if (String(raw).trim().toLowerCase() === "center") return "center";
        const n = parseInt(String(raw), 10);
        return Number.isNaN(n) ? null : n;
    }

    _setSunMoonAxisMode(field, mode) {
        if (mode === "center") {
            this._updateField(field, "center");
        } else {
            this._updateField(field, "");
        }
    }

    _setSunMoonAxisValue(field, rawValue, axis) {
        const trimmed = String(rawValue).trim();
        if (trimmed === "" || trimmed === "-") {
            this._updateField(field, "");
            return;
        }
        let n = parseInt(trimmed, 10);
        if (Number.isNaN(n)) {
            this._updateField(field, "");
            return;
        }
        // Y axis does not support negative pixels.
        if (axis === "y" && n < 0) n = 0;
        this._updateField(field, String(n));
    }

    _renderSunMoonPosition(field, axis) {
        const parsed = this._parseSunMoonAxis(this._formData[field]);
        const isCenter = parsed === "center";
        const inputValue = typeof parsed === "number" ? String(parsed) : "";
        const placeholder = axis === "x" ? "e.g. -65" : "e.g. 100";
        const unitHint = axis === "x"
            ? "px (negative = from right edge)"
            : "px from top";

        return html`
            <div class="composite">
                <div class="composite-label">${LABELS[field]}</div>
                <div class="composite-row">
                    <div class="segmented">
                        <button
                            type="button"
                            class=${isCenter ? "active" : ""}
                            @click=${() => this._setSunMoonAxisMode(field, "center")}
                        >Center</button>
                        <button
                            type="button"
                            class=${isCenter ? "" : "active"}
                            @click=${() => this._setSunMoonAxisMode(field, "custom")}
                        >Pixels</button>
                    </div>
                    ${isCenter
                        ? ""
                        : html`
                              <input
                                  type="number"
                                  class="composite-number"
                                  step="1"
                                  min=${axis === "y" ? "0" : undefined}
                                  placeholder=${placeholder}
                                  .value=${inputValue}
                                  @change=${(e) => this._setSunMoonAxisValue(field, e.target.value, axis)}
                              >
                              <span class="composite-unit">${unitHint}</span>
                          `}
                </div>
                ${HELPERS[field]
                    ? html`<div class="composite-helper">${HELPERS[field]}</div>`
                    : ""}
            </div>
        `;
    }

    // Offset composite — four per-edge number inputs serialised to CSS
    // margin shorthand. Supports the 1/2/3/4-value forms when reading
    // existing YAML so legacy configs keep working.
    _parseOffset(raw) {
        if (!raw || typeof raw !== "string") return [0, 0, 0, 0];
        const parts = raw.trim().split(/\s+/).map((p) => parseInt(p, 10) || 0);
        switch (parts.length) {
            case 0:  return [0, 0, 0, 0];
            case 1:  return [parts[0], parts[0], parts[0], parts[0]];
            case 2:  return [parts[0], parts[1], parts[0], parts[1]];
            case 3:  return [parts[0], parts[1], parts[2], parts[1]];
            default: return [parts[0], parts[1], parts[2], parts[3]];
        }
    }

    _serializeOffset(arr) {
        if (arr.every((v) => v === 0)) return "";
        return arr.map((v) => `${v}px`).join(" ");
    }

    _setOffsetPart(index, rawValue) {
        const parts = this._parseOffset(this._formData.offset);
        parts[index] = parseInt(rawValue, 10) || 0;
        this._updateField("offset", this._serializeOffset(parts));
    }

    _renderOffsetPicker() {
        const parts = this._parseOffset(this._formData.offset);
        const edges = ["Top", "Right", "Bottom", "Left"];
        return html`
            <div class="composite">
                <div class="composite-label">${LABELS.offset}</div>
                <div class="composite-grid-4">
                    ${edges.map(
                        (label, i) => html`
                            <label>
                                <span>${label}</span>
                                <input
                                    type="number"
                                    step="1"
                                    .value=${String(parts[i])}
                                    @change=${(e) =>
                                        this._setOffsetPart(i, e.target.value)}
                                >
                            </label>
                        `
                    )}
                </div>
                ${HELPERS.offset
                    ? html`<div class="composite-helper">${HELPERS.offset}</div>`
                    : ""}
            </div>
        `;
    }

    // Embedded cards editor. Shows each configured card as a row with
    // reorder/delete actions; clicking a row expands an inline YAML editor.
    // New cards are added via a plain Add button that inserts a blank entity
    // card (the user then edits its YAML). HA's hui-card-picker is
    // intentionally not used — a previous attempt at integration was
    // unreliable across HA versions, and the YAML flow covers all card types
    // uniformly.
    _renderCustomCardsEditor() {
        const cards = Array.isArray(this._config && this._config.custom_cards)
            ? this._config.custom_cards
            : [];

        return html`
            ${cards.length === 0
                ? html`<div class="cards-empty">No cards yet. Click Add card below to get started.</div>`
                : cards.map((card, idx) => this._renderCardRow(card, idx, cards.length))}
            ${this._renderCardPicker()}
        `;
    }

    _renderCardRow(card, idx, total) {
        const expanded = this._expandedCard === idx;
        const title = (card && card.type) ? String(card.type).replace(/^custom:/, "") : "card";

        return html`
            <div class="card-row ${expanded ? "expanded" : ""}">
                <div class="card-row-head" @click=${() => this._toggleCardExpanded(idx)}>
                    <ha-icon icon="mdi:chevron-right"></ha-icon>
                    <span class="card-row-title">${title}</span>
                    <div class="card-row-actions" @click=${(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            title="Move up"
                            ?disabled=${idx === 0}
                            @click=${() => this._moveCard(idx, -1)}
                        ><ha-icon icon="mdi:arrow-up"></ha-icon></button>
                        <button
                            type="button"
                            title="Move down"
                            ?disabled=${idx === total - 1}
                            @click=${() => this._moveCard(idx, 1)}
                        ><ha-icon icon="mdi:arrow-down"></ha-icon></button>
                        <button
                            type="button"
                            title="Delete"
                            @click=${() => this._removeCard(idx)}
                        ><ha-icon icon="mdi:delete-outline"></ha-icon></button>
                    </div>
                </div>
                ${expanded
                    ? html`
                          <div class="card-row-body">
                              <ha-form
                                  .hass=${this.hass}
                                  .data=${{ _card: card }}
                                  .schema=${[{ name: "_card", selector: { object: {} } }]}
                                  .computeLabel=${() => ""}
                                  @value-changed=${(e) => {
                                      e.stopPropagation();
                                      this._updateCardAt(idx, (e.detail && e.detail.value && e.detail.value._card) || {});
                                  }}
                              ></ha-form>
                          </div>
                      `
                    : ""}
            </div>
        `;
    }

    _renderCardPicker() {
        return html`
            <button type="button" class="add-card-btn" @click=${this._addBlankCard}>
                <ha-icon icon="mdi:plus"></ha-icon>
                <span>Add card</span>
            </button>
        `;
    }

    _toggleCardExpanded(idx) {
        this._expandedCard = this._expandedCard === idx ? null : idx;
    }

    _moveCard(idx, delta) {
        const cards = [...((this._config && this._config.custom_cards) || [])];
        const target = idx + delta;
        if (target < 0 || target >= cards.length) return;
        [cards[idx], cards[target]] = [cards[target], cards[idx]];
        if (this._expandedCard === idx) this._expandedCard = target;
        else if (this._expandedCard === target) this._expandedCard = idx;
        this._updateField("custom_cards", cards);
    }

    _removeCard(idx) {
        const cards = [...((this._config && this._config.custom_cards) || [])];
        cards.splice(idx, 1);
        if (this._expandedCard === idx) this._expandedCard = null;
        else if (typeof this._expandedCard === "number" && this._expandedCard > idx) {
            this._expandedCard = this._expandedCard - 1;
        }
        this._updateField("custom_cards", cards);
    }

    _updateCardAt(idx, newCard) {
        const cards = [...((this._config && this._config.custom_cards) || [])];
        cards[idx] = newCard;
        this._updateField("custom_cards", cards);
    }

    _addBlankCard = () => {
        const cards = [...((this._config && this._config.custom_cards) || []), { type: "entity", entity: "" }];
        this._expandedCard = cards.length - 1;
        this._updateField("custom_cards", cards);
    };

    render() {
        if (!this.hass || !this._config) {
            return html``;
        }

        const c = this._formData;
        const textDisabled = c.disable_text === true;
        const isSquare = c.square === true;

        return html`
            ${this._renderForm(this._weatherEntitySchema())}

            <ha-expansion-panel outlined>
                <div slot="header" class="panel-header">
                    <ha-icon icon="mdi:palette-outline"></ha-icon>
                    <span>Color Mode</span>
                </div>
                <div class="info">
                    <b>Important — please read:</b> this card looks best
                    with themes that switch between dark and light based on
                    the sun, which is why the default is to follow your
                    Home Assistant theme. Many HA themes don't work that
                    way, so the default can look wrong in your setup
                    (permanently dark or permanently light). The options
                    below let you override that — the most common choice
                    is to follow the sun directly instead.
                </div>
                ${this._renderForm(this._colorModeSchema())}
                ${this._renderDisclosure(
                    "Advanced options",
                    this._renderForm(this._colorModeAdvancedSchema())
                )}
            </ha-expansion-panel>

            <ha-expansion-panel outlined>
                <div slot="header" class="panel-header">
                    <ha-icon icon="mdi:theme-light-dark"></ha-icon>
                    <span>Sun &amp; Moon</span>
                </div>
                <div class="info">
                    <b>Strongly recommended:</b> set a Sun Entity for the
                    full day/night sky, and a Moon Phase sensor for accurate
                    moon rendering.
                </div>
                ${this._renderForm(this._sunMoonEntitiesSchema())}
                ${this._renderForm(this._sunMoonSizeSchema())}
                ${this._renderSunMoonPosition("sun_moon_x_position", "x")}
                ${this._renderSunMoonPosition("sun_moon_y_position", "y")}
                ${this._renderForm(this._sunMoonMoonStyleSchema())}
            </ha-expansion-panel>

            <ha-expansion-panel outlined>
                <div slot="header" class="panel-header">
                    <ha-icon icon="mdi:page-layout-body"></ha-icon>
                    <span>Card Style &amp; Layout</span>
                </div>
                ${this._renderForm(this._layoutCoreSchema())}
                ${isSquare ? "" : this._renderCardHeightField()}
                ${this._renderDisclosure(
                    "Advanced options",
                    html`
                        ${this._renderOffsetPicker()}
                        ${this._renderForm(this._layoutAdvancedSchema())}
                    `
                )}
            </ha-expansion-panel>

            <ha-expansion-panel outlined>
                <div slot="header" class="panel-header">
                    <ha-icon icon="mdi:format-text"></ha-icon>
                    <span>Text &amp; Icons</span>
                </div>
                ${this._renderForm(this._textMasterSchema())}
                ${textDisabled
                    ? ""
                    : html`
                          ${this._renderDisclosure(
                              "Text Position & Layout",
                              html`
                                  ${this._renderTextLayoutControls()}
                                  ${this._renderForm(this._textLayoutSchema())}
                              `
                          )}
                          ${this._renderDisclosure(
                              "Text Background",
                              this._renderTextBackgroundSection()
                          )}
                          ${this._formData.combine_text === true
                              ? ""
                              : this._renderDisclosure(
                                    "Top Text",
                                    this._renderForm(this._textTopSchema())
                                )}
                          ${this._renderDisclosure(
                              this._formData.combine_text === true ? "Combined Text" : "Bottom Text",
                              html`
                                  ${this._formData.combine_text === true
                                      ? html`<div class="info">All settings below apply to the whole combined container (top value + bottom value + icon).</div>`
                                      : ""}
                                  ${this._renderForm(this._textBottomSchema())}
                              `
                          )}
                      `}
            </ha-expansion-panel>

            <ha-expansion-panel outlined>
                <div slot="header" class="panel-header">
                    <ha-icon icon="mdi:image-outline"></ha-icon>
                    <span>Background Image</span>
                </div>
                ${this._renderForm(this._imageTopSchema())}
                ${this._renderPositionGrid("image_alignment", POSITION_GRIDS.image_alignment)}
                ${this._renderDisclosure(
                    "Status Override",
                    this._renderForm(this._imageStatusSchema())
                )}
            </ha-expansion-panel>

            <ha-expansion-panel outlined>
                <div slot="header" class="panel-header">
                    <ha-icon icon="mdi:gesture-tap"></ha-icon>
                    <span>Tap Action</span>
                </div>
                ${this._renderForm(this._tapActionSchema())}
            </ha-expansion-panel>

            <ha-expansion-panel outlined>
                <div slot="header" class="panel-header">
                    <ha-icon icon="mdi:card-multiple-outline"></ha-icon>
                    <span>Embedded Cards</span>
                </div>
                <div class="info">
                    Each card accepts two optional keys beyond its normal
                    configuration: <code>custom_width</code>
                    (e.g. <code>140px</code> or <code>60%</code>) fixes the
                    card's width, and <code>custom_height</code>
                    (e.g. <code>110px</code>) fixes its height.
                </div>
                ${this._renderPositionGrid("custom_cards_position", POSITION_GRIDS.custom_cards_position)}
                ${this._renderCustomCardsEditor()}
                ${this._renderDisclosure(
                    "Advanced options",
                    this._renderForm(this._embeddedCardsAdvancedSchema())
                )}
            </ha-expansion-panel>
        `;
    }
}

if (!customElements.get("atmospheric-weather-card-editor")) {
    customElements.define(
        "atmospheric-weather-card-editor",
        AtmosphericWeatherCardEditor
    );
}