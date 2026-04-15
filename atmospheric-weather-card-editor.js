/**
 * ATMOSPHERIC WEATHER CARD — VISUAL EDITOR
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
    card_padding: "Card Padding",
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
    bottom_text_marquee_rtl: "Scroll Right-to-Left",
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
    theme_entity:
        "Pick the entity that drives the dark/light cycle. Most setups use sun.sun, so if the sun sets, the moon shows up in its place and the card\'s colors turn dark.",

    card_height: "Height in pixels, or click Auto to fill grid layouts.",
    card_padding: "CSS padding value, e.g. 16px.",
    offset: "Outer margin in pixels. Useful when layering cards.",
    stack_order: "Raise above 0 to layer the card in front of others. Default: 1 for standalone, -1 for immersive.",
    tap_action: "Action performed when the card is tapped.",
    full_width: "Immersive only. Stretches the card edge-to-edge by removing side margins.",
    css_mask_vertical: "Immersive only. Fades the top and bottom edges of the card.",
    css_mask_horizontal: "Immersive only. Fades the left and right edges of the card.",
    filter: "Optional visual filter applied to the entire weather canvas.",

    moon_style:
        "Default follows the theme — a muted blue in light mode, white in dark mode. Picking a specific color applies it in both modes.",
    sun_moon_x_position:
        "Pixels from the card edge, or Center. Positive values offset from the left; negative values offset from the right.",
    sun_moon_y_position:
        "Pixels from the top of the card, or Center.",
    sun_moon_size: "Diameter in pixels.",

    night: "Falls back to the day image if left empty.",
    image_scale: "Image height as a percentage of the card height.",
    image_alignment:
        "The image distance from the card edges follows the Card Padding — adjusting padding shifts the image accordingly.",

    status_entity:
        "Swaps the background image when this entity is in an active state (on, true, open, unlocked, home, active).",
    status_image_day: "Day image shown when the status entity is active.",
    status_image_night: "Night image shown when the status entity is active.",

    top_text_sensor: "Defaults to the weather entity's temperature.",
    bottom_text_sensor: "Defaults to the weather entity's wind speed.",
    combine_text: "",
    swap_text: "",
    text_position:
        "Horizontal alignment of the text block. Auto lets the card place text opposite the sun/moon.",
    text_alignment:
        "Vertical alignment of the top and bottom text. Spread pins them to opposite edges.",
    text_layout_mode:
        "Stacked keeps top and bottom text in a column. Split Top / Split Bottom place them side-by-side.",
    bottom_text_icon:
        "Pick an MDI icon, or type 'weather' to auto-pick by current weather state.",
    bottom_text_icon_path:
        "Folder for custom SVG icons (used with bottom_text_icon). Example: /local/weather-icons/",
    bottom_text_overflow:
        "Behavior when text exceeds the container width. Marquee scrolls horizontally like a ticker and needs a Container Width set smaller than the natural text width. Marquee scrolling can stutter on low-powered devices.",
    bottom_text_marquee_speed:
        "Scroll speed in pixels per second. Higher values scroll faster. This only takes effect when Overflow is set to Marquee.",
    bottom_text_width:
        "Limit the container width (e.g. 60% or 200px). Required for the Marquee overflow mode.",
    text_background_style:
        "Frosted is translucent glass with a thin border. Pill is opaque and high-contrast. Fade is a soft blurred halo.",

    custom_cards_css_class:
        "CSS class on the container — useful for targeting it with card_mod.",

    custom_cards_position:
        ""
});

// Display defaults. Stripped on save so persisted YAML only contains user overrides.

const KEY_ORDER = Object.freeze([
    "type",
    "name",
    "entity",
    "weather_entity",
    "sun_entity", "moon_phase_entity",
    "color_mode", "theme", "theme_entity",
    "card_style", "card_height", "card_padding", "square",
    "sun_moon_size", "sun_moon_x_position", "sun_moon_y_position", "moon_style",
    "day", "night", "image_scale", "image_alignment",
    "status_entity", "status_day", "status_night",
    "top_text_sensor", "bottom_text_sensor",
    "combine_text", "swap_text", "disable_bottom_text", "disable_bottom_icon",
    "top_font_size", "bottom_font_size", "bottom_text_width",
    "bottom_text_icon", "bottom_text_icon_path",
    "bottom_text_overflow", "bottom_text_marquee_speed",
    "text_bg_style",
    "tap_action", "hold_action", "double_tap_action",
    "offset",
    "custom_cards_position", "custom_cards_css_class",
    "custom_cards"
]);

const DISPLAY_DEFAULTS = Object.freeze({
    card_style: "immersive",
    theme: "auto",
    filter: "none",
    moon_style: "default",
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
        { value: "default", label: "Default (follows theme)" },
        { value: "blue",    label: "Blue" },
        { value: "yellow",  label: "Yellow" },
        { value: "purple",  label: "Purple" },
        { value: "grey",    label: "Grey" }
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

// 3x3 corner pickers: cells is a 3x3 matrix (null = empty cell),
// disabled dims non-interactive values, extras renders buttons below the grid.
const POSITION_GRIDS = Object.freeze({
    image_alignment: {
        cells: [
            ["top-left",    "top-center",    "top-right"],
            ["left",        "center",        "right"]       ,
            ["bottom-left", "bottom-center", "bottom-right"]
        ],
        valueMap: { "left": "center-left", "right": "center-right" }
    },
    custom_cards_position: {
        cells: [
            ["top-left",    "top-center",    "top-right"],
            ["left",        "center",        "right"],
            ["bottom-left", "bottom-center", "bottom-right"]
        ],
        valueMap: { "left": "center-left", "right": "center-right" }
    }
});

class AtmosphericWeatherCardEditor extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            _config: { type: Object, state: true },
            _colorModeState: { type: String, state: true },
            _expandedCard: { type: Number, state: true },
            _openPanel: { type: String, state: true }
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

            .card-size-row {
                display: grid;
                grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                gap: 8px;
                margin-bottom: 12px;
            }
            .card-size-row ha-textfield {
                display: block;
                width: 100%;
                min-width: 0;
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
            .info.inline-action {
                display: flex;
                align-items: center;
                gap: 12px;
                justify-content: space-between;
            }
            .info.inline-action > span { flex: 1; }
            .inline-action-btn {
                flex-shrink: 0;
                padding: 6px 12px;
                border: 1.5px solid var(--primary-color);
                background: transparent;
                color: var(--primary-color);
                border-radius: 4px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                white-space: nowrap;
                transition: background 0.12s;
            }
            .inline-action-btn:hover {
                background: var(--primary-color);
                color: var(--text-primary-color, white);
            }

            /* Grid position picker */
            .grid-picker { margin: 16px 0 8px; }
            .grid-picker-label,
            .composite-label {
                font-size: 12px;
                font-weight: 400;
                margin-bottom: 6px;
                color: var(--secondary-text-color);
                letter-spacing: 0.0333em;
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
            .composite-textfield {
                flex: 1;
                min-width: 0;
            }
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

    setConfig(config) {
        const c = { ...(config || {}) };

        // Legacy alias migration — card reads both forms, editor persists the canonical key.
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

        this._config = this._cleanConfig(c);

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

    // Required entities only.
    _weatherEntitySchema() {
        return [
            { name: "weather_entity", selector: { entity: { domain: "weather" } } }
        ];
    }

    _sunMoonEntitiesSchema() {
        return [
            {
                type: "grid", name: "",
                schema: [
                    { name: "sun_entity",        selector: { entity: { domain: "sun" } } },
                    { name: "moon_phase_entity", selector: { entity: { domain: "sensor" } } }
                ]
            }
        ];
    }

    // Color Mode select + conditional theme entity. Info boxes are rendered in render().
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

    // Visual filter grouped with color decisions.
    _colorModeAdvancedSchema() {
        return [
            { name: "filter", selector: { select: { mode: "dropdown", options: OPT.filter } } }
        ];
    }

    // card_height is a composite (see render) and not part of this schema.
    _tapActionSchema() {
        return [
            { name: "tap_action", selector: { ui_action: {} } }
        ];
    }

    _layoutAdvancedSchema() {
        const c = this._formData;
        const isStandalone = c.card_style === "standalone";
        return [
            {
                type: "grid", name: "",
                schema: [
                    { name: "square",      selector: { boolean: {} } },
                    { name: "stack_order", selector: { number: { mode: "box", step: 1 } } }
                ]
            },
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

    // When combine_text is on, Top is hidden and top_text_sensor moves into Bottom.
    // top_font_size is omitted when combined: card applies --awc-top-font-size to
    // the hidden #temp-text element only, so it has no effect on the combined span.

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
            { name: "top_text_sensor", selector: { entity: {} } }
        ];
    }

    // Head/tail split lets the composite CSS-text fields render between them.
    _textBottomSchemaHead() {
        const c = this._formData;
        const combined = c.combine_text === true;
        const head = combined
            ? [{ name: "top_text_sensor", selector: { entity: {} } }]
            : [{ name: "disable_bottom_text", selector: { boolean: {} } }];
        const bottomDisabled = !combined && c.disable_bottom_text === true;
        if (bottomDisabled) return head;
        return [
            ...head,
            { name: "bottom_text_sensor", selector: { entity: {} } }
        ];
    }

    _textBottomSchemaTail() {
        const c = this._formData;
        const combined = c.combine_text === true;
        const bottomDisabled = !combined && c.disable_bottom_text === true;
        if (bottomDisabled) return [];
        const iconDisabled = c.disable_bottom_icon === true;
        const isMarquee    = (c.bottom_text_overflow || "").toLowerCase() === "marquee";
        return [
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
                { name: "bottom_text_marquee_speed", selector: { number: { mode: "box", min: 5, step: 1 } } },
                { name: "bottom_text_marquee_rtl",   selector: { boolean: {} } }
            ] : [])
        ];
    }

    // Card accepts bare integers or "Npx" on read; editor always writes "Npx".
    _renderSunMoonSize() {
        const raw = String(this._formData.sun_moon_size || "").trim();
        const numeric = raw.replace(/px$/i, "");
        return html`
            <div class="composite">
                <div class="composite-label">${LABELS.sun_moon_size}</div>
                <div class="composite-row">
                    <input
                        type="number"
                        class="composite-number"
                        min="0"
                        step="1"
                        placeholder="e.g. 50"
                        .value=${numeric}
                        @change=${(e) => {
                            const v = e.target.value;
                            this._updateField("sun_moon_size", v ? `${parseInt(v, 10)}px` : "");
                        }}
                    >
                    <span class="composite-unit">px</span>
                </div>
                ${HELPERS.sun_moon_size
                    ? html`<div class="composite-helper">${HELPERS.sun_moon_size}</div>`
                    : ""}
            </div>
        `;
    }

    _sunMoonMoonStyleSchema() {
        return [
            { name: "moon_style", selector: { select: { mode: "dropdown", options: OPT.moon_style } } }
        ];
    }

    _imageTopSchema() {
        return [
            {
                type: "grid", name: "",
                schema: [
                    { name: "day",   selector: { text: {} } },
                    { name: "night", selector: { text: {} } }
                ]
            },
            { name: "image_scale", selector: { number: { mode: "slider", min: 0, max: 200, step: 1 } } }
        ];
    }

    // status_entity always present; image fields appear once an entity is picked.
    _imageStatusSchema() {
        const c = this._formData;
        const hasStatus = !!c.status_entity;
        return [
            { name: "status_entity", selector: { entity: {} } },
            ...(hasStatus ? [
                {
                    type: "grid", name: "",
                    schema: [
                        { name: "status_image_day",   selector: { text: {} } },
                        { name: "status_image_night", selector: { text: {} } }
                    ]
                }
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

        const ordered = {};
        for (const k of KEY_ORDER) {
            if (k === "custom_cards") continue;
            if (k in out) ordered[k] = out[k];
        }
        for (const k of Object.keys(out)) {
            if (k === "custom_cards") continue;
            if (!(k in ordered)) ordered[k] = out[k];
        }
        if ("custom_cards" in out) ordered.custom_cards = out.custom_cards;
        return ordered;
    }

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

    // Three orthogonal controls: Layout (Stacked | Split Top | Split Bottom),
    // Horizontal (Auto | Left | Center | Right), Vertical (Spread | Top | Center | Bottom).
    // Horizontal/Vertical hide in Split modes. Card resolver (lines 2222-2262) matches
    // text_position by substring and reads text_alignment when set; legacy combined
    // values like "top-left" still parse on read.
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

    // Drives top_text_background and bottom_text_background through one control.
    // In combined mode the top/bottom distinction collapses (card lines 2073-2074),
    // so the picker degrades to On/None.
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

    // Native <details> stays browser-handled (no Lit re-render). The toggle
    // handler closes any sibling disclosure inside the same parent so only one
    // is open at a time within each panel.
    _renderDisclosure(label, content) {
        const isAdvanced = label === "Advanced options";
        return html`
            <details class="disclosure" @toggle=${this._onDisclosureToggle}>
                <summary>
                    <ha-icon icon="mdi:chevron-right"></ha-icon>
                    ${isAdvanced ? html`<ha-icon icon="mdi:cog-outline"></ha-icon>` : ""}
                    <span>${label}</span>
                </summary>
                <div class="disclosure-body">${content}</div>
            </details>
        `;
    }

    _onDisclosureToggle(e) {
        const el = e.currentTarget;
        if (!el.open) return;
        const parent = el.parentElement;
        if (!parent) return;
        parent.querySelectorAll(":scope > details.disclosure[open]").forEach((d) => {
            if (d !== el) d.open = false;
        });
    }

    // 3x3 position grid picker. Reads from _formData so DISPLAY_DEFAULTS are
    // reflected in the active cell on a fresh config.
    _renderPositionGrid(field, gridDef) {
        const valueMap = gridDef.valueMap || {};
        const reverseMap = Object.fromEntries(Object.entries(valueMap).map(([k, v]) => [v, k]));
        const stored = this._formData[field] || "";
        const value = reverseMap[stored] || stored;
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
                                @click=${isDisabled ? null : () => this._setField(field, valueMap[val] || val)}
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

    // Stored as "Npx" or literal "auto". Accepts bare numbers on read, writes "Npx".
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

    // Shared renderer for flexible CSS-value inputs (font size, width, padding).
    // Accepts px, %, em, rem, or shorthand — same composite wrapper as px-only fields.
    _renderCssTextField(field, placeholder) {
        const current = String(this._formData[field] || "");
        const label = LABELS[field] || field;
        const helper = HELPERS[field] || "";
        return html`
            <div class="composite">
                <div class="composite-label">${label}</div>
                <div class="composite-row">
                    <ha-textfield
                        class="composite-textfield"
                        placeholder=${placeholder}
                        .value=${current}
                        @change=${(e) => {
                            const v = e.target.value;
                            this._updateField(field, v ? v : "");
                        }}
                    ></ha-textfield>
                </div>
                ${helper
                    ? html`<div class="composite-helper">${helper}</div>`
                    : ""}
            </div>
        `;
    }

    _renderCardPaddingField() {
        return this._renderCssTextField("card_padding", "e.g. 16px.");
    }

    // full_width and edge-fade masks are immersive-only; strip on switch to standalone
    // to avoid stale true values leaking into the other mode.
    _setCardStyle(value) {
        const next = { ...(this._config || {}) };
        next.card_style = value;
        if (value === "standalone") {
            delete next.full_width;
            delete next.css_mask_vertical;
            delete next.css_mask_horizontal;
        }
        this._config = this._cleanConfig(next);
        this._emit();
    }

    _onPanelToggle(id, expanded) {
        if (expanded) this._openPanel = id;
        else if (this._openPanel === id) this._openPanel = null;
    }

    // Segmented buttons for the two mutually-exclusive card styles.
    _renderCardStyleSegmented() {
        const current = this._formData.card_style || "immersive";
        const opts = [
            { value: "immersive",  label: "Immersive"  },
            { value: "standalone", label: "Standalone" }
        ];
        return html`
            <div class="composite">
                <div class="composite-label">${LABELS.card_style}</div>
                <div class="composite-row">
                    <div class="segmented" role="radiogroup" aria-label=${LABELS.card_style}>
                        ${opts.map((o) => html`
                            <button
                                type="button"
                                role="radio"
                                class=${current === o.value ? "active" : ""}
                                aria-checked=${current === o.value ? "true" : "false"}
                                @click=${() => this._setCardStyle(o.value)}
                            >${o.label}</button>
                        `)}
                    </div>
                </div>
            </div>
        `;
    }

    // Card parseAxis (line 2572) accepts "center" or an integer (pixels). For X,
    // negative values wrap to the right edge; Y is constrained to >= 0. Anything
    // else falls back to 100px internally.
    //
    // Parser returns: "center" | number (valid px) | null (empty/unset).
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
                        : (axis === "x"
                            ? (() => {
                                const numeric = typeof parsed === "number" ? parsed : 0;
                                const fromRight = numeric < 0;
                                const absVal = String(Math.abs(numeric));
                                const setSide = (side) => {
                                    const cur = parseInt(absVal, 10) || 0;
                                    this._updateField(field, String(side === "right" ? -cur : cur));
                                };
                                return html`
                                    <input
                                        type="number"
                                        class="composite-number"
                                        step="1"
                                        min="0"
                                        placeholder="e.g. 65"
                                        .value=${absVal}
                                        @change=${(e) => {
                                            const n = Math.abs(parseInt(e.target.value, 10) || 0);
                                            this._updateField(field, String(fromRight ? -n : n));
                                        }}
                                    >
                                    <span class="composite-unit">px</span>
                                    <div class="segmented">
                                        <button type="button" class=${fromRight ? "" : "active"} @click=${() => setSide("left")}>From left</button>
                                        <button type="button" class=${fromRight ? "active" : ""} @click=${() => setSide("right")}>From right</button>
                                    </div>
                                `;
                              })()
                            : html`
                                <input
                                    type="number"
                                    class="composite-number"
                                    step="1"
                                    min="0"
                                    placeholder=${placeholder}
                                    .value=${inputValue}
                                    @change=${(e) => this._setSunMoonAxisValue(field, e.target.value, axis)}
                                >
                                <span class="composite-unit">px from top</span>
                              `)}
                </div>
                ${HELPERS[field]
                    ? html`<div class="composite-helper">${HELPERS[field]}</div>`
                    : ""}
            </div>
        `;
    }

    // Four per-edge inputs serialised to CSS margin shorthand. Reads 1/2/3/4-value
    // forms for legacy YAML compatibility.
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

    // Each configured card renders as a row with reorder/delete; clicking expands
    // an inline YAML editor. Add inserts a blank entity card for editing.
    // hui-card-picker is deliberately avoided — integration was unreliable across
    // HA versions and the YAML flow handles all card types uniformly.
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
                              <div class="card-size-row">
                                  <div class="composite">
                                      <div class="composite-label">Custom Width</div>
                                      <div class="composite-row">
                                          <ha-textfield
                                              class="composite-textfield"
                                              placeholder="e.g. 140px or 60%"
                                              .value=${card.custom_width || ""}
                                              @input=${(e)=>{const v=e.target.value; const nc={...card}; if(v) nc.custom_width=v; else delete nc.custom_width; this._updateCardAt(idx,nc);}}
                                          ></ha-textfield>
                                      </div>
                                  </div>
                                  <div class="composite">
                                      <div class="composite-label">Custom Height</div>
                                      <div class="composite-row">
                                          <ha-textfield
                                              class="composite-textfield"
                                              placeholder="e.g. 110px"
                                              .value=${card.custom_height || ""}
                                              @input=${(e)=>{const v=e.target.value; const nc={...card}; if(v) nc.custom_height=v; else delete nc.custom_height; this._updateCardAt(idx,nc);}}
                                          ></ha-textfield>
                                      </div>
                                  </div>
                              </div>
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
        const cards = [...((this._config && this._config.custom_cards) || []), { type: "entity", entity: "", custom_width: "100%" }];
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

            <ha-expansion-panel
                outlined
                .expanded=${this._openPanel === "sun_moon"}
                @expanded-changed=${(e) => this._onPanelToggle("sun_moon", e.detail.expanded)}
            >
                <div slot="header" class="panel-header">
                    <ha-icon icon="mdi:theme-light-dark"></ha-icon>
                    <span>Sun &amp; Moon</span>
                </div>
                <div class="info">
                    The <b>Sun Entity</b> drives the day/night cycle. The
                    <b>Moon Phase Entity</b> renders the correct phase, oriented
                    by your latitude.
                </div>
                ${this._renderDisclosure(
                    "Entities",
                    this._renderForm(this._sunMoonEntitiesSchema())
                )}
                ${this._renderDisclosure(
                    "Position & Size",
                    html`
                        ${this._renderSunMoonSize()}
                        ${this._renderSunMoonPosition("sun_moon_x_position", "x")}
                        ${this._renderSunMoonPosition("sun_moon_y_position", "y")}
                    `
                )}
                ${this._renderDisclosure(
                    "Moon Style",
                    this._renderForm(this._sunMoonMoonStyleSchema())
                )}
            </ha-expansion-panel>

            <ha-expansion-panel
                outlined
                .expanded=${this._openPanel === "color_mode"}
                @expanded-changed=${(e) => this._onPanelToggle("color_mode", e.detail.expanded)}
            >
                <div slot="header" class="panel-header">
                    <ha-icon icon="mdi:palette-outline"></ha-icon>
                    <span>Color Mode</span>
                </div>
                <div class="info">
                    This setting lets you choose how the card switches between light and dark.
                    <br><br>
                    <b>Note for dark themes:</b> Running the card in dark mode
                    during the day is always a compromise and hard to get right.
                    The card looks best with themes that provide both a light
                    and dark variant.
                </div>
                ${this._renderForm(this._colorModeSchema())}
                ${this._renderDisclosure(
                    "Advanced options",
                    this._renderForm(this._colorModeAdvancedSchema())
                )}
            </ha-expansion-panel>

            <ha-expansion-panel
                outlined
                .expanded=${this._openPanel === "layout"}
                @expanded-changed=${(e) => this._onPanelToggle("layout", e.detail.expanded)}
            >
                <div slot="header" class="panel-header">
                    <ha-icon icon="mdi:page-layout-body"></ha-icon>
                    <span>Card Style</span>
                </div>
                <div class="info">
                    <b>Immersive</b> has no background at all. <b>Standalone</b>
                    gives the card its own dynamic background color.
                </div>
                ${this._renderCardStyleSegmented()}
                ${isSquare
                    ? this._renderCardPaddingField()
                    : html`
                        ${this._renderCardHeightField()}
                        ${this._renderCardPaddingField()}
                    `}
                ${this._renderDisclosure(
                    "Advanced options",
                    html`
                        ${this._renderOffsetPicker()}
                        ${this._renderForm(this._layoutAdvancedSchema())}
                    `
                )}
            </ha-expansion-panel>

            <ha-expansion-panel
                outlined
                .expanded=${this._openPanel === "text"}
                @expanded-changed=${(e) => this._onPanelToggle("text", e.detail.expanded)}
            >
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
                                    html`
                                        ${this._renderForm(this._textTopSchema())}
                                        ${this._renderCssTextField("top_font_size", "e.g. 3em or 24px")}
                                    `
                                )}
                          ${this._renderDisclosure(
                              this._formData.combine_text === true ? "Combined Text" : "Bottom Text",
                              html`
                                  ${this._formData.combine_text === true
                                      ? html`<div class="info">All settings below apply to the whole combined container (top value + bottom value + icon).</div>`
                                      : ""}
                                  ${this._renderForm(this._textBottomSchemaHead())}
                                  ${(this._formData.combine_text === true || this._formData.disable_bottom_text !== true)
                                      ? html`
                                          ${this._renderCssTextField("bottom_font_size",  "e.g. 16px or 1em")}
                                          ${this._renderCssTextField("bottom_text_width", "e.g. 60% or 200px")}
                                      `
                                      : ""}
                                  ${this._renderForm(this._textBottomSchemaTail())}
                                  ${(this._formData.bottom_text_overflow || "").toLowerCase() === "marquee" && !this._formData.bottom_text_width
                                      ? html`
                                          <div class="info inline-action">
                                              <span>Marquee needs a Container Width to scroll. Without it the text stays static.</span>
                                              <button
                                                  type="button"
                                                  class="inline-action-btn"
                                                  @click=${() => this._updateField("bottom_text_width", "90px")}
                                              >Set to 90px</button>
                                          </div>
                                      `
                                      : ""}
                              `
                          )}
                      `}
            </ha-expansion-panel>

            <ha-expansion-panel
                outlined
                .expanded=${this._openPanel === "image"}
                @expanded-changed=${(e) => this._onPanelToggle("image", e.detail.expanded)}
            >
                <div slot="header" class="panel-header">
                    <ha-icon icon="mdi:image-outline"></ha-icon>
                    <span>Custom Image</span>
                </div>
                ${this._renderForm(this._imageTopSchema())}
                ${this._renderPositionGrid("image_alignment", POSITION_GRIDS.image_alignment)}
                ${this._renderDisclosure(
                    "Status Override",
                    this._renderForm(this._imageStatusSchema())
                )}
            </ha-expansion-panel>

            <ha-expansion-panel
                outlined
                .expanded=${this._openPanel === "tap_action"}
                @expanded-changed=${(e) => this._onPanelToggle("tap_action", e.detail.expanded)}
            >
                <div slot="header" class="panel-header">
                    <ha-icon icon="mdi:gesture-tap"></ha-icon>
                    <span>Tap Action</span>
                </div>
                ${this._renderForm(this._tapActionSchema())}
            </ha-expansion-panel>

            <ha-expansion-panel
                outlined
                .expanded=${this._openPanel === "embedded"}
                @expanded-changed=${(e) => this._onPanelToggle("embedded", e.detail.expanded)}
            >
                <div slot="header" class="panel-header">
                    <ha-icon icon="mdi:card-multiple-outline"></ha-icon>
                    <span>Embedded Cards</span>
                </div>
                <div class="info">
                    Embed any Home Assistant card inside the weather card —
                    including grids and stacks. Each card has its own width
                    and height inputs for fine-tuning.
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
