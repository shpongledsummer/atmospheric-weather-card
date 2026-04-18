/**
 * ATMOSPHERIC WEATHER CARD — VISUAL EDITOR
 * Visual editor for the Atmospheric Weather Card.
 * https://github.com/shpongledsummer/atmospheric-weather-card
 */

// Lit is imported directly from a pinned ESM CDN instead of borrowed from
// Home Assistant's already-registered elements. The borrow pattern crashed
// with "css is not a function" on the Android companion app and any other
// context where the editor loaded before ha-panel-lovelace was registered.
// v4.0 will replace this with a proper bundled import via Vite.
import { LitElement, html, css } from "https://esm.sh/lit@3.2.1";

console.info(
    "%c ATMOSPHERIC WEATHER CARD EDITOR ",
    "color: white; font-weight: 700; background: linear-gradient(90deg, #355C7D 0%, #6C5B7B 50%, #C06C84 100%); padding: 6px 12px; border-radius: 6px; font-family: sans-serif; letter-spacing: 0.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);"
);

const LABELS = Object.freeze({
    weather_entity: "Weather Entity",
    sun_entity: "Sun Entity",
    moon_phase_entity: "Moon Phase Entity",
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
    disable_text: "Hide All Text",

    sun_moon_size: "Sun / Moon Size (px)",
    celestial_position: "Position Mode",
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

    disable_top_text: "Disable Top Text",
    disable_chips: "Disable Chips",
    top_text_sensor: "Top Sensor",
    top_position: "Top Text Position",
    chips_position: "Chips Position",
    top_font_size: "Font Size",
    chips_font_size: "Font Size",
    chips_layout: "Row Layout",
    chips_columns: "Columns",
    chips_align: "Chip Alignment",
    chips_width: "Row Width",
    chips_padding: "Chip Padding",
    chips_gap: "Chip Gap",
    top_text_padding: "Padding",
    top_text_background: "Show background",
    top_text_behind_weather: "Behind weather",
    chips_background: "Show background",
    background_style: "Background Style",

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
    disable_text: "Hides the top text and chips row in one go.",
    filter: "Optional visual filter applied to the entire weather canvas.",

    moon_style:
        "Default follows the theme — a muted blue in light mode, white in dark mode. Picking a specific color applies it in both modes.",
    sun_moon_x_position:
        "Distance from the chosen edge, in pixels.",
    sun_moon_y_position:
        "Distance from the top of the card, in pixels.",
    sun_moon_size: "Diameter in pixels.",
    celestial_position:
        "Dynamic modes animate the sun (and optionally the moon) across the sky following the real solar arc.",

    night: "Falls back to the day image if left empty.",
    image_scale: "Image height as a percentage of the card height.",
    image_alignment:
        "The image distance from the card edges follows the Card Padding — adjusting padding shifts the image accordingly.",

    status_entity:
        "Swaps the background image when this entity is in an active state (on, true, open, unlocked, home, active).",
    status_image_day: "Day image shown when the status entity is active.",
    status_image_night: "Night image shown when the status entity is active.",

    top_text_sensor: "Defaults to the weather entity's temperature.",
    top_position: "Where the top text anchors inside the card.",
    top_text_behind_weather: "Places the top text behind the weather canvases. Text backgrounds are disabled while behind.",
    chips_layout:
        "Wrap moves overflowing chips to a second line, Scroll keeps chips on one line with a hidden scrollbar, Grid arranges them in equal columns.",
    chips_columns:
        "Number of equal-width columns in Grid layout.",
    chips_align:
        "How each chip aligns inside its grid cell.",
    chips_width:
        "Limit the full row width (e.g. 60% or 200px). Useful to place the chip row next to the top text instead of spanning the card.",
    chips_padding:
        "Inner padding of each chip (e.g. 5px 10px).",
    chips_gap:
        "Space between chips (e.g. 8px).",
    top_text_padding:
        "Inner padding around the top text (e.g. 8px 14px).",
    background_style:
        "Frosted is translucent glass with a thin border. Pill is opaque and high-contrast.",

    custom_cards_css_class:
        "CSS class on the container — useful for targeting it with card_mod.",

    custom_cards_position:
        ""
});

// Per-chip labels/helpers used inside the chips list.
const CHIP_LABELS = Object.freeze({
    entity: "Sensor",
    attribute: "Attribute",
    name: "Name",
    width: "Container Width",
    overflow: "Text Overflow",
    marquee_speed: "Marquee Speed",
    marquee_rtl: "Scroll Right-to-Left",
    disable_icon: "Disable Icon",
    icon: "Icon",
    icon_path: "Icon Folder Path",
    tap_action: "Tap Action"
});

const CHIP_HELPERS = Object.freeze({
    entity: "Any sensor, binary_sensor, or weather entity. Use the weather entity to show its state (e.g. Sunny).",
    attribute: "Optional. Read one of this entity's attributes instead of its state (e.g. humidity on a weather entity).",
    name: "Optional label shown before the value, e.g. \"Wind\".",
    width: "Limit this chip's width (e.g. 60% or 200px). Required for the Marquee overflow mode.",
    overflow: "Behavior when this chip's text exceeds its width. Marquee scrolls horizontally like a ticker.",
    marquee_speed: "Scroll speed in pixels per second. Higher values scroll faster.",
    icon: "Pick an MDI icon, leave empty to inherit from the sensor, or type 'weather' for a dynamic weather icon.",
    icon_path: "Folder for custom SVG icons. Example: /local/weather-icons/"
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
    "sun_moon_size", "celestial_position", "sun_moon_x_position", "sun_moon_y_position", "moon_style",
    "day", "night", "image_scale", "image_alignment",
    "status_entity", "status_day", "status_night",
    "top_text_sensor",
    "top_position", "chips_position",
    "disable_text", "disable_top_text", "disable_chips",
    "top_font_size", "top_text_padding",
    "chips_font_size",
    "chips_layout", "chips_columns", "chips_align", "chips_width", "chips_padding", "chips_gap",
    "top_text_background", "chips_background", "background_style",
    "tap_action", "hold_action", "double_tap_action",
    "offset",
    "custom_cards_position", "custom_cards_css_class",
    "chips",
    "custom_cards"
]);

const DISPLAY_DEFAULTS = Object.freeze({
    card_style: "immersive",
    theme: "auto",
    filter: "none",
    moon_style: "default",
    image_alignment: "top-right",
    background_style: "frosted",
    chips_layout: "wrap",
    chips_align: "start"
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
    chip_overflow: [
        { value: "ellipsis", label: "Ellipsis" },
        { value: "marquee", label: "Marquee (scrolling ticker)" },
        { value: "clip", label: "Clip" },
        { value: "wrap", label: "Wrap" }
    ],
    chips_layout: [
        { value: "wrap",   label: "Wrap" },
        { value: "scroll", label: "Scroll" },
        { value: "grid",   label: "Grid" }
    ],
    chips_align: [
        { value: "start",  label: "Start" },
        { value: "center", label: "Center" },
        { value: "end",    label: "End" }
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
    },
    top_position: {
        cells: [
            ["top-left",    "top-center",    "top-right"],
            ["left",        "center",        "right"],
            ["bottom-left", "bottom-center", "bottom-right"]
        ]
    },
    chips_position: {
        cells: [
            ["top-left",    "top-center",    "top-right"],
            ["left",        "center",        "right"],
            ["bottom-left", "bottom-center", "bottom-right"]
        ]
    }
});

// ============================================================================
// LEGACY MIGRATION — remove entirely in v4.0
// Migrates configs from pre-chips schema. All key renames, derivations, and
// chip synthesis live here. Downstream code reads only current-schema keys.
// Intentionally duplicated in card.js — keeps both entry points self-contained
// without a build step, and deletion later is one grep-and-cut per file.
// ============================================================================

const LEGACY_STRIP_KEYS = Object.freeze([
    "mode", "text_background_style",
    "combine_text", "combine_texts",
    "image_type", "image_icon_path", "image_icon_scale", "image_background",
    "bottom_font_size", "bottom_text_background", "disable_bottom_text", "bottom_position", "bottom_sensors",
    "bottom_text_sensor", "bottom_text_icon", "bottom_text_icon_path",
    "bottom_text_width", "bottom_text_overflow",
    "bottom_text_marquee_speed", "bottom_text_marquee_rtl", "disable_bottom_icon",
    "text_position", "text_alignment", "text_layout_mode", "swap_text", "swap_texts"
]);

function _deriveLegacyPositions(c) {
    const pos = (c.text_position || "").toString().toLowerCase().trim();
    const align = (c.text_alignment || "").toString().toLowerCase().trim();
    const swap = (c.swap_text ?? c.swap_texts) === true;
    if (!pos && !align && !swap) return null;

    if (pos === "split-top")    return { top: "top-left",    chips: "top-right" };
    if (pos === "split-bottom") return { top: "bottom-left", chips: "bottom-right" };

    let h;
    if      (pos.includes("left"))   h = "left";
    else if (pos.includes("right"))  h = "right";
    else if (pos.includes("center")) h = "center";
    else {
        const sunX = parseInt(c.sun_moon_x_position, 10);
        h = (!isNaN(sunX) ? sunX >= 0 : true) ? "right" : "left";
    }

    let topV, chipsV;
    if      (align === "top")        { topV = "top";    chipsV = "top"; }
    else if (align === "center")     { topV = "center"; chipsV = "center"; }
    else if (align === "bottom")     { topV = "bottom"; chipsV = "bottom"; }
    else if (pos.includes("top"))    { topV = "top";    chipsV = "top"; }
    else if (pos.includes("bottom")) { topV = "bottom"; chipsV = "bottom"; }
    else                             { topV = "top";    chipsV = "bottom"; }

    const cell = (v, hAxis) => {
        if (v === "center" && hAxis === "center") return "center";
        if (v === "center") return hAxis;
        if (hAxis === "center") return `${v}-center`;
        return `${v}-${hAxis}`;
    };

    let top = cell(topV, h);
    let chips = cell(chipsV, h);
    if (swap) [top, chips] = [chips, top];
    return { top, chips };
}

function _migrateLegacyConfig(config) {
    if (!config || typeof config !== "object") return config;
    const c = { ...config };

    if (c.mode !== undefined && c.theme === undefined) c.theme = c.mode;
    if (c.text_background_style !== undefined && c.background_style === undefined) c.background_style = c.text_background_style;
    if (c.bottom_font_size !== undefined && c.chips_font_size === undefined) c.chips_font_size = c.bottom_font_size;
    if (c.bottom_text_background !== undefined && c.chips_background === undefined) c.chips_background = c.bottom_text_background;
    if (c.disable_bottom_text !== undefined && c.disable_chips === undefined) c.disable_chips = c.disable_bottom_text;
    if (c.bottom_position !== undefined && c.chips_position === undefined) c.chips_position = c.bottom_position;
    if (Array.isArray(c.bottom_sensors) && !Array.isArray(c.chips)) c.chips = c.bottom_sensors;

    if (!Array.isArray(c.chips) && c.bottom_text_sensor) {
        const chip = { entity: c.bottom_text_sensor };
        if (c.bottom_text_icon)                          chip.icon = c.bottom_text_icon;
        if (c.bottom_text_icon_path)                     chip.icon_path = c.bottom_text_icon_path;
        if (c.bottom_text_width)                         chip.width = c.bottom_text_width;
        if (c.bottom_text_overflow)                      chip.overflow = c.bottom_text_overflow;
        if (c.bottom_text_marquee_speed !== undefined)   chip.marquee_speed = c.bottom_text_marquee_speed;
        if (c.bottom_text_marquee_rtl === true)          chip.marquee_rtl = true;
        if (c.disable_bottom_icon === true)              chip.disable_icon = true;
        c.chips = [chip];
    }

    if (!c.top_position && !c.chips_position) {
        const derived = _deriveLegacyPositions(c);
        if (derived) {
            c.top_position = derived.top;
            c.chips_position = derived.chips;
        }
    }

    for (const k of LEGACY_STRIP_KEYS) delete c[k];
    return c;
}

// ============================================================================
// END LEGACY MIGRATION
// ============================================================================

class AtmosphericWeatherCardEditor extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            _config: { type: Object, state: true },
            _colorModeState: { type: String, state: true },
            _expandedCard: { type: Number, state: true },
            _expandedChip: { type: Number, state: true },
            _openPanel: { type: String, state: true }
        };
    }

    static get styles() {
        return css`
            :host {
                /* Spacing rhythm (4px base). Used for padding, margin, gap. */
                --awc-e-s1: 4px;
                --awc-e-s2: 8px;
                --awc-e-s3: 12px;
                --awc-e-s4: 16px;

                /* Radius scale */
                --awc-e-r-box:   10px;
                --awc-e-r-ctrl:   8px;
                --awc-e-r-inline: 6px;

                /* Typography scale */
                --awc-e-f-meta:   12px;
                --awc-e-f-label:  13px;
                --awc-e-f-body:   14px;
                --awc-e-f-header: 15px;

                /* Motion — single system-wide transition */
                --awc-e-t: 150ms ease;

                display: block;
            }
            ha-form { display: block; }

            /* ============ Panels (top-level HA chrome) ============ */
            ha-expansion-panel {
                display: block;
                margin-top: var(--awc-e-s3);
                --ha-card-border-radius: var(--awc-e-r-box);
            }
            ha-expansion-panel ha-form { margin-top: var(--awc-e-s2); }
            ha-form + ha-form { margin-top: var(--awc-e-s1); }
            .panel-header {
                display: flex;
                align-items: center;
                gap: var(--awc-e-s2);
                font-size: var(--awc-e-f-header);
                font-weight: 500;
                color: var(--primary-text-color);
            }
            .panel-header ha-icon {
                --mdc-icon-size: 20px;
                color: var(--secondary-text-color);
            }

            /* ============ VISUAL TIERS ============
               Consistent surfaces. Hierarchy comes from nesting.
               Tier A (secondary-bg): structural panels — info banners,
                    outer disclosures, card list rows, empty states.
               Tier A+ (secondary-bg + 5% overlay): nested disclosures.
               Tier B (9% overlay): grouped option containers —
                    composite, grid-picker, toggle-group.
               Tier C (16% overlay): interactive tiles inside Tier B —
                    grid-cell, inactive segmented buttons. */
            .info,
            .cards-empty,
            .card-row,
            details.disclosure {
                background: var(--secondary-background-color);
                border-radius: var(--awc-e-r-box);
            }
            details.disclosure details.disclosure {
                background:
                    linear-gradient(
                        rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.05),
                        rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.05)
                    ),
                    var(--secondary-background-color);
            }
            .composite,
            .grid-picker,
            .toggle-group {
                background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.09);
                border-radius: var(--awc-e-r-box);
            }

            /* ============ Info banner ============ */
            .info {
                padding: var(--awc-e-s3) var(--awc-e-s4);
                margin: 0 0 var(--awc-e-s3) 0;
                font-size: var(--awc-e-f-label);
                line-height: 1.5;
                color: var(--secondary-text-color);
            }
            .info b { color: var(--primary-text-color); font-weight: 500; }
            .info code {
                background: var(--primary-background-color);
                padding: 1px 6px;
                border-radius: 4px;
                font-size: var(--awc-e-f-meta);
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            }
            .info.inline-action {
                display: flex;
                align-items: center;
                gap: var(--awc-e-s3);
                justify-content: space-between;
            }
            .info.inline-action > span { flex: 1; }

            /* ============ Inline action button (primary CTA, e.g. "Set to 90px") ============ */
            .inline-action-btn {
                flex-shrink: 0;
                padding: var(--awc-e-s2) var(--awc-e-s3);
                border: 0;
                background: var(--primary-color);
                color: var(--text-primary-color, white);
                border-radius: var(--awc-e-r-ctrl);
                font-size: var(--awc-e-f-label);
                font-weight: 500;
                cursor: pointer;
                white-space: nowrap;
                transition: opacity var(--awc-e-t);
            }
            .inline-action-btn:hover { opacity: 0.85; }

            /* ============ Labels & helpers ============ */
            .grid-picker-label,
            .composite-label {
                display: block;
                font-size: var(--awc-e-f-label);
                font-weight: 500;
                margin-bottom: var(--awc-e-s2);
                color: var(--primary-text-color);
            }
            .grid-helper,
            .composite-helper {
                margin-top: var(--awc-e-s2);
                font-size: var(--awc-e-f-meta);
                color: var(--secondary-text-color);
                line-height: 1.5;
            }
            .scope-note {
                margin-top: var(--awc-e-s1);
                font-size: var(--awc-e-f-meta);
                color: var(--secondary-text-color);
                display: flex;
                align-items: center;
                gap: var(--awc-e-s1);
            }
            .scope-note ha-icon { --mdc-icon-size: 14px; }

            /* ============ Card size row (top-level 2-col) ============ */
            .card-size-row {
                display: grid;
                grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                gap: var(--awc-e-s2);
                margin-bottom: var(--awc-e-s3);
            }
            .card-size-row ha-textfield { display: block; width: 100%; min-width: 0; }

            /* ============ 3x3 position grid picker ============ */
            .grid-picker {
                margin: var(--awc-e-s3) 0 var(--awc-e-s4) 0;
                padding: var(--awc-e-s3) var(--awc-e-s4);
            }
            .grid-3x3 {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: var(--awc-e-s1);
                width: 144px;
                aspect-ratio: 1;
            }
            .grid-cell {
                border: 0;
                background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.16);
                border-radius: var(--awc-e-r-inline);
                cursor: pointer;
                padding: 0;
                transition: background var(--awc-e-t);
            }
            .grid-cell:hover:not(.disabled):not(.active) { background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.28); }
            .grid-cell.active { background: var(--primary-color); }
            .grid-cell.empty { visibility: hidden; pointer-events: none; }
            .grid-cell.disabled {
                opacity: 0.4;
                cursor: not-allowed;
                background:
                    repeating-linear-gradient(
                        45deg,
                        rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.16) 0 6px,
                        var(--divider-color) 6px 7px
                    );
            }
            .grid-extras {
                display: flex;
                gap: var(--awc-e-s1);
                margin-top: var(--awc-e-s2);
                flex-wrap: wrap;
            }
            .grid-extra {
                flex: 1;
                min-width: 100px;
                padding: var(--awc-e-s2) var(--awc-e-s3);
                border: 0;
                background: var(--secondary-background-color);
                border-radius: var(--awc-e-r-inline);
                color: var(--primary-text-color);
                font-size: var(--awc-e-f-label);
                cursor: pointer;
                transition: background var(--awc-e-t), color var(--awc-e-t);
            }
            .grid-extra:hover:not(.active) { background: var(--divider-color); }
            .grid-extra.active {
                background: var(--primary-color);
                color: var(--text-primary-color, white);
            }

            /* ============ Composite field group ============ */
            .composite {
                margin: var(--awc-e-s3) 0 var(--awc-e-s4) 0;
                padding: var(--awc-e-s3) var(--awc-e-s4);
            }
            .composite-row {
                display: flex;
                align-items: center;
                gap: var(--awc-e-s2);
                flex-wrap: wrap;
            }
            .composite-unit {
                font-size: var(--awc-e-f-label);
                color: var(--secondary-text-color);
            }
            .composite-number,
            .composite-grid-4 input {
                flex: 1;
                min-width: 120px;
                padding: var(--awc-e-s2) var(--awc-e-s3);
                border: 1px solid transparent;
                background: var(--primary-background-color);
                color: var(--primary-text-color);
                border-radius: var(--awc-e-r-ctrl);
                font-size: var(--awc-e-f-body);
                box-sizing: border-box;
                transition: border-color var(--awc-e-t);
            }
            .composite-number:focus,
            .composite-grid-4 input:focus {
                outline: none;
                border-color: var(--primary-color);
            }
            .composite-number:disabled { opacity: 0.5; cursor: not-allowed; }
            .composite-grid-4 {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: var(--awc-e-s2);
            }
            .composite-grid-4 label {
                display: flex;
                flex-direction: column;
                gap: var(--awc-e-s1);
                font-size: var(--awc-e-f-meta);
                color: var(--secondary-text-color);
            }
            .composite-grid-4 input { flex: none; min-width: 0; width: 100%; }
            .composite-textfield { flex: 1; min-width: 0; }
            .composite-chip {
                padding: var(--awc-e-s2) var(--awc-e-s3);
                border: 0;
                background: var(--primary-background-color);
                color: var(--primary-text-color);
                border-radius: var(--awc-e-r-ctrl);
                font-size: var(--awc-e-f-body);
                cursor: pointer;
                transition: background var(--awc-e-t), color var(--awc-e-t);
                white-space: nowrap;
            }
            .composite-chip:hover:not(.active) { background: var(--divider-color); }
            .composite-chip.active {
                background: var(--primary-color);
                color: var(--text-primary-color, white);
            }

            /* ============ Segmented control (Apple-style pill, padded track + inner buttons) ============ */
            .segmented {
                display: flex;
                flex-wrap: wrap;
                width: 100%;
                background: var(--primary-background-color);
                border-radius: var(--awc-e-r-ctrl);
                padding: 3px;
                gap: 2px;
                box-sizing: border-box;
            }
            .segmented button {
                flex: 1 1 0;
                min-width: 0;
                padding: var(--awc-e-s2) var(--awc-e-s3);
                border: 0;
                background: transparent;
                color: var(--primary-text-color);
                font-size: var(--awc-e-f-body);
                cursor: pointer;
                transition: background var(--awc-e-t), color var(--awc-e-t);
                text-align: center;
                border-radius: calc(var(--awc-e-r-ctrl) - 3px);
            }
            .segmented button:hover:not(.active) { background: var(--divider-color); }
            .segmented button.active {
                background: var(--primary-color);
                color: var(--text-primary-color, white);
            }
            .composite-row .segmented { flex: 1; min-width: 0; }

            /* ============ Disclosures (nested grouping inside panels) ============ */
            details.disclosure {
                margin-top: var(--awc-e-s3);
                overflow: hidden;
            }
            details.disclosure > summary {
                list-style: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: var(--awc-e-s2);
                padding: var(--awc-e-s3) var(--awc-e-s4);
                font-size: var(--awc-e-f-label);
                font-weight: 500;
                color: var(--primary-text-color);
                user-select: none;
                transition: background var(--awc-e-t);
            }
            details.disclosure > summary::-webkit-details-marker { display: none; }
            details.disclosure > summary:hover { background: var(--divider-color); }
            details.disclosure > summary ha-icon {
                --mdc-icon-size: 18px;
                color: var(--secondary-text-color);
                transition: transform var(--awc-e-t);
            }
            details.disclosure[open] > summary ha-icon { transform: rotate(90deg); }
            details.disclosure > .disclosure-body {
                padding: 0 var(--awc-e-s4) var(--awc-e-s3) var(--awc-e-s4);
            }

            /* ============ Empty state ============ */
            .cards-empty {
                padding: var(--awc-e-s4);
                text-align: center;
                font-size: var(--awc-e-f-label);
                color: var(--secondary-text-color);
                margin-bottom: var(--awc-e-s3);
            }

            /* ============ Expandable list rows (embedded cards, chips) ============ */
            .card-row {
                margin-bottom: var(--awc-e-s2);
                overflow: hidden;
            }
            .card-row-head {
                display: flex;
                align-items: center;
                gap: var(--awc-e-s2);
                padding: var(--awc-e-s3) var(--awc-e-s4);
                cursor: pointer;
                user-select: none;
                transition: background var(--awc-e-t);
            }
            .card-row-head:hover { background: var(--divider-color); }
            .card-row-head > ha-icon:first-child {
                --mdc-icon-size: 20px;
                color: var(--secondary-text-color);
                transition: transform var(--awc-e-t);
            }
            .card-row.expanded .card-row-head > ha-icon:first-child {
                transform: rotate(90deg);
            }
            .card-row-title {
                flex: 1;
                font-size: var(--awc-e-f-body);
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
                border-radius: var(--awc-e-r-inline);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background var(--awc-e-t), color var(--awc-e-t);
            }
            .card-row-actions button:hover:not(:disabled) {
                background: var(--primary-background-color);
                color: var(--primary-text-color);
            }
            .card-row-actions button:disabled {
                opacity: 0.3;
                cursor: not-allowed;
            }
            .card-row-actions ha-icon { --mdc-icon-size: 18px; }
            .card-row-body {
                padding: var(--awc-e-s3) var(--awc-e-s4) var(--awc-e-s4);
                background: var(--primary-background-color);
            }

            /* ============ Add button (dashed CTA, "empty action slot") ============ */
            .add-card-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: var(--awc-e-s2);
                width: 100%;
                padding: var(--awc-e-s3);
                border: 1.5px dashed var(--divider-color);
                background: transparent;
                color: var(--secondary-text-color);
                border-radius: var(--awc-e-r-box);
                font-size: var(--awc-e-f-body);
                font-weight: 500;
                cursor: pointer;
                transition: background var(--awc-e-t), border-color var(--awc-e-t), color var(--awc-e-t);
            }
            .add-card-btn:hover {
                border-color: var(--primary-color);
                color: var(--primary-color);
                background: var(--secondary-background-color);
            }
            .add-card-btn ha-icon { --mdc-icon-size: 20px; }

            .sensor-list { margin-top: var(--awc-e-s3); }
            .sensor-list:empty { display: none; }

            /* Grouped toggles — compact, boxed, iOS-style. Replaces ha-form booleans
               where we want tight pairs like "Disable / Show background". */
            .toggle-group {
                background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.09);
                border-radius: var(--awc-e-r-box);
                overflow: hidden;
                margin: var(--awc-e-s3) 0 var(--awc-e-s4) 0;
            }
            .toggle-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: var(--awc-e-s3);
                padding: var(--awc-e-s2) var(--awc-e-s4);
                cursor: pointer;
                min-height: 44px;
                box-sizing: border-box;
            }
            .toggle-row + .toggle-row {
                border-top: 1px solid var(--divider-color);
            }
            .toggle-row > span {
                font-size: var(--awc-e-f-body);
                color: var(--primary-text-color);
            }
        `;
    }

    setConfig(config) {
        const c = _migrateLegacyConfig(config);

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
            ]),
            { name: "disable_text", selector: { boolean: {} } }
        ];
    }

    _renderBgStylePicker() {
        const current = this._formData.background_style || "frosted";
        const styles = [
            { value: "frosted", label: "Frosted" },
            { value: "pill",    label: "Pill" },
            { value: "theme",   label: "Theme" }
        ];
        return html`
            <div class="grid-picker">
                <div class="grid-picker-label">${LABELS.background_style}</div>
                <div class="segmented" role="radiogroup" aria-label=${LABELS.background_style}>
                    ${styles.map(s => html`
                        <button type="button" role="radio"
                            class=${current === s.value ? "active" : ""}
                            aria-checked=${current === s.value ? "true" : "false"}
                            @click=${() => this._updateField("background_style", s.value)}
                        >${s.label}</button>
                    `)}
                </div>
            </div>
        `;
    }

    // Compact iOS-style grouped toggles; one box, rows separated by hairlines.
    // Uses ha-switch directly — avoids the tall vertical rhythm of ha-form booleans.
    _renderToggleGroup(toggles) {
        return html`
            <div class="toggle-group">
                ${toggles.map(t => html`
                    <label class="toggle-row">
                        <span>${t.label}</span>
                        <ha-switch
                            .checked=${this._formData[t.key] === true}
                            @change=${(e) => this._updateField(t.key, e.target.checked)}
                        ></ha-switch>
                    </label>
                `)}
            </div>
        `;
    }

    _textTopSchema() {
        return [
            { name: "top_text_sensor", selector: { entity: {} } }
        ];
    }

    _getChips() {
        const c = this._config || {};
        if (Array.isArray(c.chips) && c.chips.length > 0) {
            return c.chips.map(s => (s && typeof s === "object") ? s : {});
        }
        return [{}];
    }

    _chipSchema(chip) {
        const isMarquee = (chip.overflow || "").toString().toLowerCase() === "marquee";
        const iconDisabled = chip.disable_icon === true;
        const entityId = (chip.entity || "").toString().trim();
        return [
            { name: "entity", selector: { entity: {} } },
            ...(entityId
                ? [{ name: "attribute", selector: { attribute: { entity_id: entityId } } }]
                : []
            ),
            { name: "name",   selector: { text: {} } },
            { name: "width",  selector: { text: {} } },
            { name: "overflow", selector: { select: { mode: "dropdown", options: OPT.chip_overflow } } },
            ...(isMarquee ? [
                { name: "marquee_speed", selector: { number: { mode: "box", min: 5, step: 1 } } },
                { name: "marquee_rtl",   selector: { boolean: {} } }
            ] : []),
            { name: "disable_icon", selector: { boolean: {} } },
            ...(iconDisabled ? [] : [
                {
                    type: "grid", name: "",
                    schema: [
                        { name: "icon",      selector: { icon: {} } },
                        { name: "icon_path", selector: { text: {} } }
                    ]
                }
            ]),
            { name: "tap_action", selector: { ui_action: {} } }
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

    _renderCelestialPosition() {
        const mode = this._formData.celestial_position || "fixed";
        const set = (v) => this._updateField("celestial_position", v);
        return html`
            <div class="composite">
                <div class="composite-label">${LABELS.celestial_position}</div>
                <div class="composite-row">
                    <div class="segmented">
                        <button
                            type="button"
                            class=${mode === "fixed" ? "active" : ""}
                            @click=${() => set("fixed")}
                        >Fixed</button>
                        <button
                            type="button"
                            class=${mode === "dynamic_sun" ? "active" : ""}
                            @click=${() => set("dynamic_sun")}
                        >Dynamic Sun</button>
                        <button
                            type="button"
                            class=${mode === "dynamic_both" ? "active" : ""}
                            @click=${() => set("dynamic_both")}
                        >Dynamic Sun &amp; Moon</button>
                    </div>
                </div>
                ${HELPERS.celestial_position
                    ? html`<div class="composite-helper">${HELPERS.celestial_position}</div>`
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
        const strip = [];

        if (incoming._color_mode !== undefined) {
            this._colorModeState = incoming._color_mode;
            switch (incoming._color_mode) {
                case "ha_theme":
                    strip.push("theme_entity", "theme");
                    break;
                case "entity":
                    strip.push("theme");
                    if (!incoming.theme_entity) {
                        incoming.theme_entity = incoming.sun_entity
                            || (this.hass && this.hass.states && this.hass.states["sun.sun"] ? "sun.sun" : "");
                    }
                    break;
                case "force_light":
                    strip.push("theme_entity");
                    incoming.theme = "light";
                    break;
                case "force_dark":
                    strip.push("theme_entity");
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
            strip.push("card_height");
        }

        this._patch(incoming, { replace: true, strip });
    }

    _patch(changes, opts) {
        const options = opts || {};
        const base = options.replace ? {} : { ...(this._config || {}) };
        const next = { ...base, ...changes };
        if (Array.isArray(options.strip)) {
            for (const k of options.strip) delete next[k];
        }
        this._config = this._cleanConfig(next);
        this._emit();
    }

    _computeInactiveKeys(c) {
        const out = new Set();

        if (c.theme === "light" || c.theme === "dark") {
            out.add("theme_entity");
        }

        // background_style has no effect unless at least one surface opted in.
        if (c.top_text_background !== true && c.chips_background !== true) {
            out.add("background_style");
        }

        // Chip layout modifiers are meaningless outside grid mode.
        if (c.chips_layout !== "grid") {
            out.add("chips_columns");
            out.add("chips_align");
        }

        return out;
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

        const inactive = this._computeInactiveKeys(out);
        for (const k of inactive) delete out[k];

        // _color_mode is editor-only UI state, never persisted.
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

    // Native <details>; toggle handler closes sibling disclosures.
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
        if (current[field] === value) {
            this._patch({}, { strip: [field] });
            return;
        }
        this._patch({ [field]: value });
    }

    // Plain setter used by the composite pickers.
    _updateField(field, value) {
        if (value === "" || value === null || value === undefined) {
            this._patch({}, { strip: [field] });
            return;
        }
        this._patch({ [field]: value });
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
        if (value === "standalone") {
            this._patch(
                { card_style: value },
                { strip: ["full_width", "css_mask_vertical", "css_mask_horizontal"] }
            );
            return;
        }
        this._patch({ card_style: value });
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
            <div class="grid-picker">
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
                <div class="composite-helper">
                    Immersive has no background. Standalone gives the card its own dynamic background.
                </div>
            </div>
        `;
    }

    // Returns "center" | number (pixels) | null (unset).
    _parseSunMoonAxis(raw) {
        if (raw === undefined || raw === null || raw === "") return null;
        if (String(raw).trim().toLowerCase() === "center") return "center";
        const n = parseInt(String(raw), 10);
        return Number.isNaN(n) ? null : n;
    }

    _getAxisAnchor(field, axis) {
        const parsed = this._parseSunMoonAxis(this._formData[field]);
        if (parsed === "center") return "center";
        if (typeof parsed !== "number") return null;
        if (axis === "x") return parsed < 0 ? "right" : "left";
        return "top";
    }

    _setAxisAnchor(field, axis, anchor) {
        const parsed = this._parseSunMoonAxis(this._formData[field]);
        if (anchor === "center") {
            this._updateField(field, "center");
            return;
        }
        const currentNumeric = typeof parsed === "number" ? Math.abs(parsed) : 0;
        if (axis === "x") {
            const signed = anchor === "right" ? -currentNumeric : currentNumeric;
            this._updateField(field, String(signed));
            return;
        }
        this._updateField(field, String(currentNumeric));
    }

    _renderSunMoonPosition(field, axis, labelOverride) {
        const parsed = this._parseSunMoonAxis(this._formData[field]);
        const isCenter = parsed === "center";
        const anchor = this._getAxisAnchor(field, axis) || (axis === "x" ? "left" : "top");
        const numericAbs = typeof parsed === "number" ? String(Math.abs(parsed)) : "";

        const opts = axis === "x"
            ? [
                { value: "left",   label: "Left edge" },
                { value: "center", label: "Center" },
                { value: "right",  label: "Right edge" }
              ]
            : [
                { value: "top",    label: "From top" },
                { value: "center", label: "Center" }
              ];

        return html`
            <div class="composite">
                <div class="composite-label">${labelOverride || LABELS[field]}</div>
                <div class="composite-row">
                    <div class="segmented" role="radiogroup" aria-label=${labelOverride || LABELS[field]}>
                        ${opts.map((o) => html`
                            <button
                                type="button"
                                role="radio"
                                class=${(isCenter ? "center" : anchor) === o.value ? "active" : ""}
                                aria-checked=${(isCenter ? "center" : anchor) === o.value ? "true" : "false"}
                                @click=${() => this._setAxisAnchor(field, axis, o.value)}
                            >${o.label}</button>
                        `)}
                    </div>
                </div>
                <div class="composite-row" style="margin-top: 8px;">
                    <input
                        type="number"
                        class="composite-number"
                        step="1"
                        min="0"
                        placeholder="e.g. 65"
                        ?disabled=${isCenter}
                        .value=${numericAbs}
                        @change=${(e) => {
                            const n = Math.abs(parseInt(e.target.value, 10) || 0);
                            if (e.target.value === "") {
                                this._updateField(field, "");
                                return;
                            }
                            const signed = (axis === "x" && anchor === "right") ? -n : n;
                            this._updateField(field, String(signed));
                        }}
                    >
                    <span class="composite-unit">px</span>
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

    // Inline YAML editing per card; hui-card-picker avoided (inconsistent across HA versions).
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

    // Shared row chrome for reorderable lists. Consumers pass in the title and
    // body content; CRUD and expand handlers are wired through callbacks.
    _renderListRow({ idx, total, expanded, title, onToggle, onMoveUp, onMoveDown, onRemove, body }) {
        return html`
            <div class="card-row ${expanded ? "expanded" : ""}">
                <div class="card-row-head" @click=${onToggle}>
                    <ha-icon icon="mdi:chevron-right"></ha-icon>
                    <span class="card-row-title">${title}</span>
                    <div class="card-row-actions" @click=${(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            title="Move up"
                            ?disabled=${idx === 0}
                            @click=${onMoveUp}
                        ><ha-icon icon="mdi:arrow-up"></ha-icon></button>
                        <button
                            type="button"
                            title="Move down"
                            ?disabled=${idx === total - 1}
                            @click=${onMoveDown}
                        ><ha-icon icon="mdi:arrow-down"></ha-icon></button>
                        <button
                            type="button"
                            title="Delete"
                            @click=${onRemove}
                        ><ha-icon icon="mdi:delete-outline"></ha-icon></button>
                    </div>
                </div>
                ${expanded ? html`<div class="card-row-body">${body}</div>` : ""}
            </div>
        `;
    }

    _renderCardRow(card, idx, total) {
        const expanded = this._expandedCard === idx;
        const title = (card && card.type) ? String(card.type).replace(/^custom:/, "") : "card";

        const body = html`
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
        `;

        return this._renderListRow({
            idx, total, expanded, title, body,
            onToggle:   () => this._toggleCardExpanded(idx),
            onMoveUp:   () => this._moveCard(idx, -1),
            onMoveDown: () => this._moveCard(idx, 1),
            onRemove:   () => this._removeCard(idx),
        });
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

    _chipTitle(chip) {
        const name = (chip && chip.name || "").toString().trim();
        const entity = (chip && chip.entity || "").toString().trim();
        const attribute = (chip && chip.attribute || "").toString().trim();

        if (!entity) return name ? `${name} — (no entity)` : "(choose an entity)";
        const st = this.hass && this.hass.states && this.hass.states[entity];
        const friendly = st && st.attributes && st.attributes.friendly_name;
        const label = friendly || entity;
        const withAttr = attribute ? `${label} [${attribute}]` : label;
        return name ? `${name} — ${withAttr}` : withAttr;
    }

    _cleanChip(chip) {
        const out = { ...chip };
        // attribute only meaningful when an entity is set.
        if (!out.entity) delete out.attribute;
        for (const k of Object.keys(out)) {
            const v = out[k];
            if (v === "" || v === null || v === undefined || v === false) {
                delete out[k];
            }
        }
        return out;
    }

    _updateChipAt(idx, newChip) {
        const list = this._getChips().map((c, i) => i === idx ? this._cleanChip(newChip) : c);
        this._commitChips(list);
    }

    _addChip = () => {
        const list = this._getChips();
        const next = [...list, {}];
        this._expandedChip = next.length - 1;
        this._commitChips(next);
    };

    _moveChip(idx, delta) {
        const list = [...this._getChips()];
        const target = idx + delta;
        if (target < 0 || target >= list.length) return;
        [list[idx], list[target]] = [list[target], list[idx]];
        if (this._expandedChip === idx) this._expandedChip = target;
        else if (this._expandedChip === target) this._expandedChip = idx;
        this._commitChips(list);
    }

    _removeChip(idx) {
        const list = [...this._getChips()];
        list.splice(idx, 1);
        if (this._expandedChip === idx) this._expandedChip = null;
        else if (typeof this._expandedChip === "number" && this._expandedChip > idx) {
            this._expandedChip = this._expandedChip - 1;
        }
        this._commitChips(list);
    }

    _toggleChipExpanded(idx) {
        this._expandedChip = this._expandedChip === idx ? null : idx;
    }

    _commitChips(list) {
        if (!Array.isArray(list) || list.length === 0) {
            this._patch({}, { strip: ["chips"] });
            return;
        }
        this._patch({ chips: list });
    }

    _setChipsLayout = (value) => {
        this._updateField("chips_layout", value);
    };

    _chipLabel = (schema) => {
        if (!schema || !schema.name) return "";
        return CHIP_LABELS[schema.name] || schema.name;
    };

    _chipHelper = (schema) => {
        if (!schema || !schema.name) return undefined;
        return CHIP_HELPERS[schema.name] || undefined;
    };

    _renderChipRow(chip, idx, total) {
        const expanded = this._expandedChip === idx;

        const body = html`
            <ha-form
                .hass=${this.hass}
                .data=${chip}
                .schema=${this._chipSchema(chip)}
                .computeLabel=${this._chipLabel}
                .computeHelper=${this._chipHelper}
                @value-changed=${(e) => {
                    e.stopPropagation();
                    this._updateChipAt(idx, (e.detail && e.detail.value) || {});
                }}
            ></ha-form>
        `;

        return this._renderListRow({
            idx, total, expanded, body,
            title: this._chipTitle(chip),
            onToggle:   () => this._toggleChipExpanded(idx),
            onMoveUp:   () => this._moveChip(idx, -1),
            onMoveDown: () => this._moveChip(idx, 1),
            onRemove:   () => this._removeChip(idx)
        });
    }

    _renderChipsEditor() {
        const c = this._formData;
        const list = this._getChips();
        const multi = list.length > 1;
        const layout = (c.chips_layout || "wrap").toString().toLowerCase();
        const align = (c.chips_align || "start").toString().toLowerCase();
        const layoutOpts = OPT.chips_layout;

        const settingsBody = this._renderToggleGroup([
            { key: "disable_chips", label: LABELS.disable_chips }
        ]);

        const stylesBody = html`
            ${this._renderToggleGroup([
                { key: "chips_background", label: LABELS.chips_background }
            ])}
            ${c.chips_background === true ? this._renderBgStylePicker() : ""}
            ${this._renderPositionGrid("chips_position", POSITION_GRIDS.chips_position)}
            ${this._renderCssTextField("chips_font_size", "e.g. 16px or 1em")}
            ${this._renderCssTextField("chips_width", "e.g. 60% or 300px (default: full width)")}
            ${this._renderCssTextField("chips_padding", "e.g. 5px 10px (default)")}
            ${this._renderCssTextField("chips_gap", "e.g. 8px (default)")}
            ${multi ? html`
                <div class="grid-picker">
                    <div class="grid-picker-label">${LABELS.chips_layout}</div>
                    <div class="segmented" role="radiogroup" aria-label=${LABELS.chips_layout}>
                        ${layoutOpts.map(o => html`
                            <button
                                type="button"
                                role="radio"
                                class=${layout === o.value ? "active" : ""}
                                aria-checked=${layout === o.value ? "true" : "false"}
                                @click=${() => this._setChipsLayout(o.value)}
                            >${o.label}</button>
                        `)}
                    </div>
                    ${HELPERS.chips_layout
                        ? html`<div class="composite-helper">${HELPERS.chips_layout}</div>`
                        : ""}
                </div>
                ${layout === "grid" ? html`
                    ${this._renderForm([{
                        name: "chips_columns",
                        selector: { number: { mode: "box", min: 1, max: 12, step: 1 } }
                    }])}
                    <div class="grid-picker">
                        <div class="grid-picker-label">${LABELS.chips_align}</div>
                        <div class="segmented" role="radiogroup" aria-label=${LABELS.chips_align}>
                            ${OPT.chips_align.map(o => html`
                                <button
                                    type="button"
                                    role="radio"
                                    class=${align === o.value ? "active" : ""}
                                    aria-checked=${align === o.value ? "true" : "false"}
                                    @click=${() => this._updateField("chips_align", o.value)}
                                >${o.label}</button>
                            `)}
                        </div>
                        ${HELPERS.chips_align
                            ? html`<div class="composite-helper">${HELPERS.chips_align}</div>`
                            : ""}
                    </div>
                ` : ""}
            ` : ""}
        `;

        const listBody = html`
            <div class="sensor-list">
                ${list.map((chip, idx) => this._renderChipRow(chip, idx, list.length))}
            </div>
            <button type="button" class="add-card-btn" @click=${this._addChip}>
                <ha-icon icon="mdi:plus"></ha-icon>
                <span>Add chip</span>
            </button>
        `;

        return html`
            ${this._renderDisclosure("Chip Settings", settingsBody)}
            ${this._renderDisclosure("Chip Styles", stylesBody)}
            ${this._renderDisclosure("Chip List", listBody)}
        `;
    }

    render() {
        if (!this.hass || !this._config) {
            return html``;
        }

        const c = this._formData;
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
                    The <b>Sun Entity</b> drives the day/night cycle and the
                    arc the sun and moon travel across the card. The
                    <b>Moon Phase Entity</b> renders the correct phase, oriented
                    by your latitude.
                </div>
                ${this._renderDisclosure(
                    "Entities",
                    this._renderForm(this._sunMoonEntitiesSchema())
                )}
                ${this._renderDisclosure(
                    "Position & Size",
                    (() => {
                        const mode = this._formData.celestial_position || "fixed";
                        return html`
                            ${this._renderSunMoonSize()}
                            ${this._renderCelestialPosition()}
                            ${mode === "fixed" ? html`
                                ${this._renderSunMoonPosition("sun_moon_x_position", "x")}
                                ${this._renderSunMoonPosition("sun_moon_y_position", "y")}
                            ` : ""}
                            ${mode === "dynamic_sun" ? html`
                                ${this._renderSunMoonPosition("sun_moon_x_position", "x", "Moon X Position")}
                                ${this._renderSunMoonPosition("sun_moon_y_position", "y", "Moon Y Position")}
                            ` : ""}
                        `;
                    })()
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
                    <ha-icon icon="mdi:layers-outline"></ha-icon>
                    <span>Overlays</span>
                </div>
                ${c.disable_text === true
                    ? html`
                        <div class="info inline-action">
                            <span>Top text and chips are hidden by <b>Hide All Text</b> in Card Style → Advanced options. Your settings are preserved.</span>
                            <button
                                type="button"
                                class="inline-action-btn"
                                @click=${() => this._updateField("disable_text", "")}
                            >Show again</button>
                        </div>
                    `
                    : html`
                        ${this._renderDisclosure(
                            "Top Text",
                            html`
                                ${c.disable_top_text === true
                                    ? this._renderToggleGroup([{ key: "disable_top_text", label: LABELS.disable_top_text }])
                                    : html`
                                        ${this._renderToggleGroup([
                                            { key: "disable_top_text",         label: LABELS.disable_top_text },
                                            { key: "top_text_background",      label: LABELS.top_text_background },
                                            { key: "top_text_behind_weather",  label: LABELS.top_text_behind_weather }
                                        ])}
                                        ${c.top_text_background === true && c.top_text_behind_weather !== true ? this._renderBgStylePicker() : ""}
                                        ${this._renderPositionGrid("top_position", POSITION_GRIDS.top_position)}
                                        ${this._renderForm(this._textTopSchema())}
                                        ${this._renderCssTextField("top_font_size", "e.g. 3em or 24px")}
                                        ${this._renderCssTextField("top_text_padding", "e.g. 8px 14px")}
                                    `}
                            `
                        )}
                        ${this._renderDisclosure(
                            "Chips",
                            this._renderChipsEditor()
                        )}
                    `
                }
                ${this._renderDisclosure(
                    "Image",
                    html`
                        ${this._renderForm(this._imageTopSchema())}
                        ${this._renderPositionGrid("image_alignment", POSITION_GRIDS.image_alignment)}
                        ${this._renderDisclosure(
                            "Status Override",
                            this._renderForm(this._imageStatusSchema())
                        )}
                    `
                )}
                ${this._renderDisclosure(
                    "Embedded Cards",
                    html`
                        <div class="info">
                            Embed any Home Assistant card inside the weather card —
                            including grids and stacks.
                        </div>
                        ${this._renderPositionGrid("custom_cards_position", POSITION_GRIDS.custom_cards_position)}
                        ${this._renderCustomCardsEditor()}
                        ${this._renderDisclosure(
                            "Advanced options",
                            this._renderForm(this._embeddedCardsAdvancedSchema())
                        )}
                    `
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
        `;
    }
}

if (!customElements.get("atmospheric-weather-card-editor")) {
    customElements.define(
        "atmospheric-weather-card-editor",
        AtmosphericWeatherCardEditor
    );
}
