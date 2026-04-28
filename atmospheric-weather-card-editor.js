/**
 * ATMOSPHERIC WEATHER CARD — VISUAL EDITOR
 * Visual editor for the Atmospheric Weather Card.
 * https://github.com/shpongledsummer/atmospheric-weather-card
 */

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
    _color_mode: "Color Mode",

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

    sun_moon_size: "Size (px)",
    celestial_position: "Position Mode",
    sun_moon_x_position: "X Position",
    sun_moon_y_position: "Y Position",
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
    chips_position: "Position",
    top_font_size: "Font Size",
    chips_font_size: "Font Size",
    chips_layout: "Layout",
    chip_format: "Display",
    chips_columns: "Columns",
    chips_visible: "Show at a time",
    chips_align: "Alignment",
    chips_width: "Row width",
    chips_height: "Height",
    chips_full_width: "Full width chips",
    chips_padding: "Padding",
    chip_gap: "Space between chips",
    chip_inner_gap: "Space inside chips",
    top_text_padding: "Padding",
    top_text_background: "Background",
    top_text_behind_weather: "Behind weather",
    chips_background: "Background",
    chips_grouped: "One shared background",
    chips_scroll_dots: "Scroll indicator dots",
    background_style: "Background Style",

    custom_cards_position: "Embedded Cards Position",
    custom_cards_css_class: "Embedded Cards CSS Class"
});

const HELPERS = Object.freeze({
    weather_entity: "Your weather integration entity.",
    sun_entity: "Controls day/night cycle, moon and stars.",
    moon_phase_entity: "Shows the correct moon phase.",
    theme_entity: "Entity that drives light/dark switching.",

    card_height: "Pixels, or type 'auto' for grid layouts.",
    card_padding: "e.g. 16px",
    offset: "Outer margin for layering cards.",
    stack_order: "Default: 1 (standalone), -1 (immersive).",
    tap_action: "Action on card tap.",
    full_width: "Remove side margins for edge-to-edge.",
    css_mask_vertical: "Fades the top and bottom edges.",
    css_mask_horizontal: "Fades the left and right edges.",
    disable_text: "Hides all overlays at once.",
    filter: "Visual filter on the weather canvas.",

    moon_style:
        "Default follows the theme.",
    sun_moon_x_position: "Distance from edge, in pixels.",
    sun_moon_y_position: "Distance from top, in pixels.",
    celestial_position:
        "Dynamic modes follow the real solar arc.",

    night: "Falls back to day image if empty.",
    image_scale: "Height as % of card.",
    image_alignment: "Follows card padding.",

    status_entity: "Swaps image when active (on, open, home…).",
    status_image_day: "Day image when status is active.",
    status_image_night: "Night image when status is active.",

    top_text_sensor: "Defaults to temperature.",
    top_position: "Where the top text anchors.",
    top_text_behind_weather: "Places text behind weather layers.",
    chips_columns:
        "Number of equal-width columns.",
    chips_align:
        "Content alignment within each chip.",
    top_text_padding:
        "e.g. 8px 14px",
    background_style:
        "Frosted: translucent glass. Contrast: opaque, high contrast.",

    custom_cards_css_class:
        "CSS class on the container — useful for targeting it with card_mod."
});

const CHIP_LABELS = Object.freeze({
    entity: "Entity",
    attribute: "Attribute",
    name: "Label",
    name_sensor: "Label Entity",
    name_attribute: "Label Attribute",
    width: "Width",
    overflow: "When text is too long",
    marquee_speed: "Scroll speed",
    marquee_rtl: "Right-to-left",
    disable_icon: "Hide icon",
    icon: "Icon",
    icon_path: "Icon folder",
    tap_action: "Tap Action",
    position: "Position"
});

const CHIP_HELPERS = Object.freeze({
    attribute: "e.g. humidity, temperature",
    name: "Shown before the value.",
    name_sensor: "Use a sensor value as the label instead of static text.",
    name_attribute: "Attribute of the label entity.",
    width: "e.g. 200px or 60%. Required for scrolling text.",
    icon: "MDI icon, or type 'weather' for a dynamic icon.",
    icon_path: "e.g. /local/weather-icons/"
});

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
    "chips_layout", "chips_columns", "chips_visible", "chips_align", "chips_width", "chips_height", "chips_full_width", "chips_padding", "chip_gap", "chip_inner_gap", "chip_format",
    "chips_scroll_dots", "chips_scroll_dots_position", "chips_scroll_dots_spacing", "chips_scroll_dots_anchor", "chips_scroll_dots_x", "chips_scroll_dots_y",
    "top_text_background", "chips_background", "chips_grouped", "background_style",
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
    chip_format: "inline",
    chips_align: "start"
});

const OPT = Object.freeze({
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
        { value: "ellipsis", label: "Ellipsis (…)" },
        { value: "marquee", label: "Scrolling text" },
        { value: "clip", label: "Clip" },
        { value: "wrap", label: "Wrap" }
    ],
    chips_layout: [
        { value: "wrap",              label: "Wrap" },
        { value: "grid",              label: "Grid" },
        { value: "horizontal-scroll", label: "Scroll X" },
        { value: "vertical-scroll",   label: "Scroll Y" }
    ],
    chips_align: [
        { value: "start",  label: "Left" },
        { value: "center", label: "Center" },
        { value: "end",    label: "Right" }
    ]
});

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
        cells: [["top-left","top-center","top-right"],["left","center","right"],["bottom-left","bottom-center","bottom-right"]],
        valueMap: { "left": "center-left", "right": "center-right" }
    },
    top_position: {
        cells: [
            ["top-left",    "top-center",    "top-right"],
            ["left",        "center",        "right"],
            ["bottom-left", "bottom-center", "bottom-right"]
        ]
    },
    chips_position: { cells: [["top-left","top-center","top-right"],["left","center","right"],["bottom-left","bottom-center","bottom-right"]] }
});

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
                --awc-e-s1: 4px; --awc-e-s2: 8px; --awc-e-s3: 12px; --awc-e-s4: 16px;
                --awc-e-r-box: 10px; --awc-e-r-ctrl: 8px; --awc-e-r-inline: 6px;
                --awc-e-f-meta: 12px; --awc-e-f-label: 13px; --awc-e-f-body: 14px; --awc-e-f-header: 15px;
                --awc-e-t: 150ms ease;
                display: block;
            }
            ha-form { display: block; }
            ha-expansion-panel {
                display: block; margin-top: var(--awc-e-s3);
                --ha-card-border-radius: var(--awc-e-r-box);
                & ha-form { margin-top: var(--awc-e-s2); }
            }
            ha-form + ha-form { margin-top: var(--awc-e-s1); }
            .panel-header {
                display: flex; align-items: center; gap: var(--awc-e-s2);
                font-size: var(--awc-e-f-header); font-weight: 500; color: var(--primary-text-color);
                & ha-icon { --mdc-icon-size: 20px; color: var(--secondary-text-color); }
            }
            .info, .cards-empty, .card-row, details.disclosure {
                background: var(--secondary-background-color); border-radius: var(--awc-e-r-box);
            }
            details.disclosure details.disclosure {
                background: linear-gradient(rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.05), rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.05)), var(--secondary-background-color);
            }
            .composite, .grid-picker, .toggle-group {
                background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.09); border-radius: var(--awc-e-r-box);
            }
            .info {
                padding: var(--awc-e-s3) var(--awc-e-s4); margin: 0 0 var(--awc-e-s3) 0;
                font-size: var(--awc-e-f-label); line-height: 1.5; color: var(--secondary-text-color);
                & b { color: var(--primary-text-color); font-weight: 500; }
                & code { background: var(--primary-background-color); padding: 1px 6px; border-radius: 4px; font-size: var(--awc-e-f-meta); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
                &.inline-action { display: flex; align-items: center; gap: var(--awc-e-s3); justify-content: space-between; & > span { flex: 1; } }
            }
            .inline-action-btn {
                flex-shrink: 0; padding: var(--awc-e-s2) var(--awc-e-s3); border: 0;
                background: var(--primary-color); color: var(--text-primary-color, white);
                border-radius: var(--awc-e-r-ctrl); font-size: var(--awc-e-f-label); font-weight: 500;
                cursor: pointer; white-space: nowrap; transition: opacity var(--awc-e-t);
                &:hover { opacity: 0.85; }
            }
            .grid-picker-label, .composite-label {
                display: block; font-size: var(--awc-e-f-label); font-weight: 500;
                margin-bottom: var(--awc-e-s2); color: var(--primary-text-color);
            }
            .grid-helper, .composite-helper {
                margin-top: var(--awc-e-s2); font-size: var(--awc-e-f-meta);
                color: var(--secondary-text-color); line-height: 1.5;
            }
            .scope-note {
                margin-top: var(--awc-e-s1); font-size: var(--awc-e-f-meta); color: var(--secondary-text-color);
                display: flex; align-items: center; gap: var(--awc-e-s1);
                & ha-icon { --mdc-icon-size: 14px; }
            }
            .card-size-row {
                display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                gap: var(--awc-e-s2); margin-bottom: var(--awc-e-s3);
                & ha-textfield { display: block; width: 100%; min-width: 0; }
            }
            .grid-picker { margin: var(--awc-e-s3) 0 var(--awc-e-s4) 0; padding: var(--awc-e-s3) var(--awc-e-s4); }
            .grid-3x3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--awc-e-s1); width: 144px; aspect-ratio: 1; }
            .grid-cell {
                border: 0; background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.16);
                border-radius: var(--awc-e-r-inline); cursor: pointer; padding: 0; transition: background var(--awc-e-t);
                &:hover:not(.disabled):not(.active) { background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.28); }
                &.active { background: var(--primary-color); }
                &.empty { visibility: hidden; pointer-events: none; }
                &.disabled { opacity: 0.4; cursor: not-allowed; background: repeating-linear-gradient(45deg, rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.16) 0 6px, var(--divider-color) 6px 7px); }
            }
            .grid-extras { display: flex; gap: var(--awc-e-s1); margin-top: var(--awc-e-s2); flex-wrap: wrap; }
            .grid-extra {
                flex: 1; min-width: 100px; padding: var(--awc-e-s2) var(--awc-e-s3); border: 0;
                background: var(--secondary-background-color); border-radius: var(--awc-e-r-inline);
                color: var(--primary-text-color); font-size: var(--awc-e-f-label); cursor: pointer;
                transition: background var(--awc-e-t), color var(--awc-e-t);
                &:hover:not(.active) { background: var(--divider-color); }
                &.active { background: var(--primary-color); color: var(--text-primary-color, white); }
            }
            .composite { margin: var(--awc-e-s3) 0 var(--awc-e-s4) 0; padding: var(--awc-e-s3) var(--awc-e-s4); }
            .composite-row { display: flex; align-items: center; gap: var(--awc-e-s2); flex-wrap: wrap; }
            .composite-unit { font-size: var(--awc-e-f-label); color: var(--secondary-text-color); }
            .composite-number, .composite-grid-4 input {
                flex: 1; min-width: 120px; padding: var(--awc-e-s2) var(--awc-e-s3);
                border: 1px solid transparent; background: var(--primary-background-color);
                color: var(--primary-text-color); border-radius: var(--awc-e-r-ctrl);
                font-size: var(--awc-e-f-body); box-sizing: border-box; transition: border-color var(--awc-e-t);
                &:focus { outline: none; border-color: var(--primary-color); }
            }
            .composite-number:disabled { opacity: 0.5; cursor: not-allowed; }
            .composite-grid-4 {
                display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--awc-e-s2);
                & label { display: flex; flex-direction: column; gap: var(--awc-e-s1); font-size: var(--awc-e-f-meta); color: var(--secondary-text-color); }
                & input { flex: none; min-width: 0; width: 100%; }
            }
            .composite-textfield { flex: 1; min-width: 0; }
            .composite-chip {
                padding: var(--awc-e-s2) var(--awc-e-s3); border: 0;
                background: var(--primary-background-color); color: var(--primary-text-color);
                border-radius: var(--awc-e-r-ctrl); font-size: var(--awc-e-f-body);
                cursor: pointer; transition: background var(--awc-e-t), color var(--awc-e-t); white-space: nowrap;
                &:hover:not(.active) { background: var(--divider-color); }
                &.active { background: var(--primary-color); color: var(--text-primary-color, white); }
            }
            .segmented {
                display: flex; flex-wrap: wrap; width: 100%;
                background: var(--primary-background-color); border-radius: var(--awc-e-r-ctrl);
                padding: 3px; gap: 2px; box-sizing: border-box;
                & button {
                    flex: 1 1 0; min-width: 0; padding: var(--awc-e-s2) var(--awc-e-s3); border: 0;
                    background: transparent; color: var(--primary-text-color); font-size: var(--awc-e-f-body);
                    cursor: pointer; transition: background var(--awc-e-t), color var(--awc-e-t);
                    text-align: center; border-radius: calc(var(--awc-e-r-ctrl) - 3px);
                    &:hover:not(.active) { background: var(--divider-color); }
                    &.active { background: var(--primary-color); color: var(--text-primary-color, white); }
                }
                &.segmented-2col { display: grid; grid-template-columns: 1fr 1fr; }
            }
            .composite-row .segmented { flex: 1; min-width: 0; }
            details.disclosure {
                margin-top: var(--awc-e-s3); overflow: hidden;
                & > summary {
                    list-style: none; cursor: pointer; display: flex; align-items: center;
                    gap: var(--awc-e-s2); padding: var(--awc-e-s3) var(--awc-e-s4);
                    font-size: var(--awc-e-f-label); font-weight: 500; color: var(--primary-text-color);
                    user-select: none; transition: background var(--awc-e-t);
                    &::-webkit-details-marker { display: none; }
                    &:hover { background: var(--divider-color); }
                    & ha-icon { --mdc-icon-size: 18px; color: var(--secondary-text-color); }
                    & .chevron { transition: transform var(--awc-e-t); }
                }
                &[open] > summary .chevron { transform: rotate(90deg); }
                & > .disclosure-body { padding: 0 var(--awc-e-s4) var(--awc-e-s3) var(--awc-e-s4); }
            }
            .cards-empty {
                padding: var(--awc-e-s4); text-align: center;
                font-size: var(--awc-e-f-label); color: var(--secondary-text-color); margin-bottom: var(--awc-e-s3);
            }
            .card-row {
                margin-bottom: var(--awc-e-s2); overflow: hidden;
                & .card-row-head {
                    display: flex; align-items: center; gap: var(--awc-e-s2);
                    padding: var(--awc-e-s3) var(--awc-e-s4); cursor: pointer; user-select: none;
                    transition: background var(--awc-e-t);
                    &:hover { background: var(--divider-color); }
                    & > .chevron { --mdc-icon-size: 20px; color: var(--secondary-text-color); transition: transform var(--awc-e-t); }
                }
                &.expanded .card-row-head > .chevron { transform: rotate(90deg); }
                & .card-row-title {
                    flex: 1; font-size: var(--awc-e-f-body); font-weight: 500; color: var(--primary-text-color);
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                & .card-row-actions {
                    display: flex; gap: 2px;
                    & button {
                        width: 32px; height: 32px; border: 0; background: transparent;
                        color: var(--secondary-text-color); border-radius: var(--awc-e-r-inline);
                        cursor: pointer; display: flex; align-items: center; justify-content: center;
                        transition: background var(--awc-e-t), color var(--awc-e-t);
                        &:hover:not(:disabled) { background: var(--primary-background-color); color: var(--primary-text-color); }
                        &:disabled { opacity: 0.3; cursor: not-allowed; }
                    }
                    & ha-icon { --mdc-icon-size: 18px; }
                }
                & .card-row-body { padding: var(--awc-e-s3) var(--awc-e-s4) var(--awc-e-s4); background: var(--primary-background-color); }
            }
            .add-card-btn {
                display: flex; align-items: center; justify-content: center; gap: var(--awc-e-s2);
                width: 100%; padding: var(--awc-e-s3);
                border: 1.5px dashed var(--divider-color); background: transparent;
                color: var(--secondary-text-color); border-radius: var(--awc-e-r-box);
                font-size: var(--awc-e-f-body); font-weight: 500; cursor: pointer;
                transition: background var(--awc-e-t), border-color var(--awc-e-t), color var(--awc-e-t);
                &:hover { border-color: var(--primary-color); color: var(--primary-color); background: var(--secondary-background-color); }
                & ha-icon { --mdc-icon-size: 20px; }
            }
            .sensor-list { margin-top: var(--awc-e-s3); &:empty { display: none; } }
            .compact-fields {
                display: grid; grid-template-columns: 1fr 1fr; gap: var(--awc-e-s2); margin: var(--awc-e-s3) 0;
            }
            .compact-field {
                display: flex; flex-direction: column; gap: 2px;
                & .compact-field-label { font-size: var(--awc-e-f-meta); color: var(--secondary-text-color); padding-left: 2px; }
                & input, & ha-textfield { width: 100%; min-width: 0; box-sizing: border-box; }
                & input {
                    padding: var(--awc-e-s2) var(--awc-e-s3); border: 1px solid transparent;
                    background: var(--primary-background-color); color: var(--primary-text-color);
                    border-radius: var(--awc-e-r-ctrl); font-size: var(--awc-e-f-body); transition: border-color var(--awc-e-t);
                    &:focus { outline: none; border-color: var(--primary-color); }
                }
            }
            .section-head {
                display: flex; align-items: center; gap: var(--awc-e-s2);
                & ha-icon { --mdc-icon-size: 16px; color: var(--secondary-text-color); }
            }
            .toggle-group {
                background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.09);
                border-radius: var(--awc-e-r-box); overflow: hidden; margin: var(--awc-e-s3) 0 var(--awc-e-s4) 0;
            }
            .toggle-row {
                display: flex; align-items: center; justify-content: space-between;
                gap: var(--awc-e-s3); padding: var(--awc-e-s2) var(--awc-e-s4);
                cursor: pointer; min-height: 44px; box-sizing: border-box;
                & + .toggle-row { border-top: 1px solid var(--divider-color); }
                & > span { font-size: var(--awc-e-f-body); color: var(--primary-text-color); }
            }
        `;
    }

    setConfig(config) {
        const c = { ...(config || {}) };
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
        if (autofilled) Promise.resolve().then(() => this._emit());
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

    _colorModeAdvancedSchema() {
        return [
            { name: "filter", selector: { select: { mode: "dropdown", options: OPT.filter } } }
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
            { value: "contrast",    label: "Contrast" },
            { value: "theme",   label: "Theme" }
        ];
        return html`
            <div class="grid-picker">
                <div class="grid-picker-label">${LABELS.background_style}</div>
                <div class="segmented" role="radiogroup" aria-label=${LABELS.background_style}>
                    ${styles.map(s => html`
                        <button type="button" role="radio"
                            class=${current === s.value ? "active" : ""}
                            @click=${() => this._updateField("background_style", s.value)}
                        >${s.label}</button>
                    `)}
                </div>
            </div>
        `;
    }

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

    _chipPrimarySchema(chip) {
        const entityId = (chip.entity || "").toString().trim();
        const nameSensorId = (chip.name_sensor || "").toString().trim();
        return [
            { name: "entity", selector: { entity: {} } },
            ...(entityId
                ? [{ name: "attribute", selector: { attribute: { entity_id: entityId } } }]
                : []
            ),
            {
                type: "grid", name: "",
                schema: [
                    { name: "name", selector: { text: {} } },
                    { name: "width", selector: { text: {} } }
                ]
            },
            { name: "name_sensor", selector: { entity: {} } },
            ...(nameSensorId
                ? [{ name: "name_attribute", selector: { attribute: { entity_id: nameSensorId } } }]
                : []
            )
        ];
    }

    _chipIconSchema(chip) {
        const iconDisabled = chip.disable_icon === true;
        return [
            { name: "disable_icon", selector: { boolean: {} } },
            ...(iconDisabled ? [] : [
                {
                    type: "grid", name: "",
                    schema: [
                        { name: "icon",      selector: { icon: {} } },
                        { name: "icon_path", selector: { text: {} } }
                    ]
                }
            ])
        ];
    }

    _chipAdvancedSchema(chip) {
        const isMarquee = (chip.overflow || "").toString().toLowerCase() === "marquee";
        return [
            { name: "overflow", selector: { select: { mode: "dropdown", options: OPT.chip_overflow } } },
            ...(isMarquee ? [
                {
                    type: "grid", name: "",
                    schema: [
                        { name: "marquee_speed", selector: { number: { mode: "box", min: 5, step: 1 } } },
                        { name: "marquee_rtl",   selector: { boolean: {} } }
                    ]
                }
            ] : []),
            { name: "tap_action", selector: { ui_action: {} } }
        ];
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
            delete incoming._color_mode;
        if (incoming.status_entity && !prev.status_entity) {
            if (!incoming.status_image_day && incoming.day) incoming.status_image_day = incoming.day;
            if (!incoming.status_image_night && incoming.night) incoming.status_image_night = incoming.night;
        }
        if (incoming.square === true && prev.square !== true) strip.push("card_height");
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
        if (c.theme === "light" || c.theme === "dark") out.add("theme_entity");
        if (c.top_text_background !== true && c.chips_background !== true) out.add("background_style");
        const chipLayout = (c.chips_layout === "scroll" ? "horizontal-scroll" : c.chips_layout) || "wrap";
        if (chipLayout !== "grid") out.add("chips_columns");
        if (chipLayout !== "horizontal-scroll" && chipLayout !== "vertical-scroll") out.add("chips_visible");
        if (chipLayout !== "vertical-scroll") {
            out.add("chips_height");
            out.add("chips_full_width");
        }
        const isScroll = chipLayout === "horizontal-scroll" || chipLayout === "vertical-scroll";
        if (!isScroll || c.chips_scroll_dots !== true) {
            out.add("chips_scroll_dots_position");
            out.add("chips_scroll_dots_spacing");
            out.add("chips_scroll_dots_anchor");
            out.add("chips_scroll_dots_x");
            out.add("chips_scroll_dots_y");
        }
        if (!isScroll) out.add("chips_scroll_dots");

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
            if (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0) delete out[key];
        }
        for (const [k, defVal] of Object.entries(DISPLAY_DEFAULTS)) {
            if (out[k] === defVal) delete out[k];
        }
        const inactive = this._computeInactiveKeys(out);
        for (const k of inactive) delete out[k];
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

    _renderDisclosure(label, content) {
        const isAdvanced = label === "Advanced options";
        return html`
            <details class="disclosure" @toggle=${this._onDisclosureToggle}>
                <summary>
                    <ha-icon class="chevron" icon="mdi:chevron-right"></ha-icon>
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
                        if (val === null) return html`<div class="grid-cell empty"></div>`;
                        const isDisabled = disabledSet.has(val);
                        return html`
                            <button
                                type="button"
                                role="radio"
                                class="grid-cell ${value === val ? "active" : ""} ${isDisabled ? "disabled" : ""}"
                                ?disabled=${isDisabled}
                                title=${isDisabled ? `${val} (not supported here)` : val}
                                aria-label=${val}
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

    _setField(field, value) {
        const current = this._config || {};
        if (current[field] === value) {
            this._patch({}, { strip: [field] });
            return;
        }
        this._patch({ [field]: value });
    }

    _updateField(field, value) {
        if (value === "" || value === null || value === undefined) {
            this._patch({}, { strip: [field] });
            return;
        }
        this._patch({ [field]: value });
    }

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
                            @click=${() => this._setCardStyle(o.value)}
                        >${o.label}</button>
                    `)}
                </div>
                <div class="composite-helper">
                    Immersive: no background. Standalone: own sky background.
                </div>
            </div>
        `;
    }

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

    _renderListRow({ idx, total, expanded, title, onToggle, onMoveUp, onMoveDown, onRemove, body }) {
        return html`
            <div class="card-row ${expanded ? "expanded" : ""}">
                <div class="card-row-head" @click=${onToggle}>
                    <ha-icon class="chevron" icon="mdi:chevron-right"></ha-icon>
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
        if (!out.entity) delete out.attribute;
        for (const k of Object.keys(out)) {
            const v = out[k];
            if (v === "" || v === null || v === undefined || v === false) delete out[k];
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
        const isFree = (chip.position || "").toString().toLowerCase() === "custom";
        const chipChanged = (e) => {
            e.stopPropagation();
            this._updateChipAt(idx, (e.detail && e.detail.value) || {});
        };
        const mkForm = (schema) => html`
            <ha-form
                .hass=${this.hass}
                .data=${chip}
                .schema=${schema}
                .computeLabel=${this._chipLabel}
                .computeHelper=${this._chipHelper}
                @value-changed=${chipChanged}
            ></ha-form>
        `;
        const positionBody = html`
            <div class="grid-picker">
                <div class="segmented" role="radiogroup" aria-label=${CHIP_LABELS.position}>
                    ${[
                        { value: "row", label: "In Row" },
                        { value: "custom", label: "Free" }
                    ].map(o => html`
                        <button
                            type="button"
                            role="radio"
                            class=${(isFree ? "custom" : "row") === o.value ? "active" : ""}
                            @click=${() => {
                                const next = { ...chip };
                                if (o.value === "custom") { next.position = "custom"; }
                                else { delete next.position; delete next.position_anchor; delete next.position_x; delete next.position_y; }
                                this._updateChipAt(idx, next);
                            }}
                        >${o.label}</button>
                    `)}
                </div>
            </div>
            ${isFree ? html`
                <div class="grid-picker">
                    <div class="grid-picker-label">Anchor</div>
                    <div class="grid-3x3" role="radiogroup" aria-label="Anchor">
                        ${["top-left","top-center","top-right","left","center","right","bottom-left","bottom-center","bottom-right"].map(v => html`
                            <button type="button" role="radio"
                                class="grid-cell ${(chip.position_anchor || "top-left") === v ? "active" : ""}"
                                aria-label=${v}
                                @click=${() => {
                                    const next = { ...chip, position_anchor: v };
                                    this._updateChipAt(idx, next);
                                }}
                            ></button>
                        `)}
                    </div>
                </div>
                <div class="composite">
                    <div class="composite-label">Offset</div>
                    <div class="composite-row" style="flex-wrap:nowrap">
                        <span class="composite-unit">X</span>
                        <ha-textfield class="composite-textfield" placeholder="0" style="flex:1;min-width:0"
                            .value=${String(chip.position_x || "")}
                            @change=${(e) => {
                                const next = { ...chip };
                                const v = e.target.value.trim();
                                if (!v) delete next.position_x; else next.position_x = v;
                                this._updateChipAt(idx, next);
                            }}
                        ></ha-textfield>
                        <span class="composite-unit">Y</span>
                        <ha-textfield class="composite-textfield" placeholder="0" style="flex:1;min-width:0"
                            .value=${String(chip.position_y || "")}
                            @change=${(e) => {
                                const next = { ...chip };
                                const v = e.target.value.trim();
                                if (!v) delete next.position_y; else next.position_y = v;
                                this._updateChipAt(idx, next);
                            }}
                        ></ha-textfield>
                    </div>
                </div>
            ` : ""}
        `;
        const body = html`
            ${mkForm(this._chipPrimarySchema(chip))}
            ${this._renderDisclosure("Icon", mkForm(this._chipIconSchema(chip)))}
            ${this._renderDisclosure("Advanced", html`
                ${mkForm(this._chipAdvancedSchema(chip))}
                ${positionBody}
            `)}
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

    _renderCompactField(field, placeholder) {
        const current = String(this._formData[field] || "");
        const label = LABELS[field] || field;
        return html`
            <div class="compact-field">
                <span class="compact-field-label">${label}</span>
                <input
                    type="text"
                    placeholder=${placeholder}
                    .value=${current}
                    @change=${(e) => this._updateField(field, e.target.value || "")}
                >
            </div>
        `;
    }

    _renderScrollDotsUI(c) {
        const enabled = c.chips_scroll_dots === true;
        const isFree = (c.chips_scroll_dots_position || '').toLowerCase() === 'custom';
        const anchor = c.chips_scroll_dots_anchor || 'bottom-center';

        return html`
            ${this._renderToggleGroup([
                { key: "chips_scroll_dots", label: "Scroll indicator dots" }
            ])}
            ${enabled ? html`
                <div class="grid-picker">
                    <div class="grid-picker-label">Dots position</div>
                    <div class="segmented segmented-2col" role="radiogroup" aria-label="Dots position">
                        ${[
                            { value: "inline", label: "Below chips" },
                            { value: "custom", label: "Free" }
                        ].map(o => html`
                            <button type="button" role="radio"
                                class=${(isFree ? "custom" : "inline") === o.value ? "active" : ""}
                                @click=${() => this._updateField("chips_scroll_dots_position", o.value === "custom" ? "custom" : "")}
                            >${o.label}</button>
                        `)}
                    </div>
                </div>
                ${isFree ? html`
                    <div class="grid-picker">
                        <div class="grid-picker-label">Anchor</div>
                        <div class="grid-3x3" role="radiogroup" aria-label="Dots anchor">
                            ${["top-left","top-center","top-right","left","center","right","bottom-left","bottom-center","bottom-right"].map(v => html`
                                <button type="button" role="radio"
                                    class="grid-cell ${anchor === v ? "active" : ""}"
                                    aria-label=${v}
                                    @click=${() => this._updateField("chips_scroll_dots_anchor", v)}
                                ></button>
                            `)}
                        </div>
                    </div>
                    <div class="composite">
                        <div class="composite-label">Offset</div>
                        <div class="composite-row" style="flex-wrap:nowrap">
                            <span class="composite-unit">X</span>
                            <ha-textfield class="composite-textfield" placeholder="0" style="flex:1;min-width:0"
                                .value=${String(c.chips_scroll_dots_x || "")}
                                @change=${(e) => this._updateField("chips_scroll_dots_x", e.target.value.trim() || "")}
                            ></ha-textfield>
                            <span class="composite-unit">Y</span>
                            <ha-textfield class="composite-textfield" placeholder="0" style="flex:1;min-width:0"
                                .value=${String(c.chips_scroll_dots_y || "")}
                                @change=${(e) => this._updateField("chips_scroll_dots_y", e.target.value.trim() || "")}
                            ></ha-textfield>
                        </div>
                    </div>
                ` : html`
                    <div class="compact-fields" style="grid-template-columns: 1fr">
                        <div class="compact-field">
                            <span class="compact-field-label">Spacing from chips</span>
                            <input type="text"
                                placeholder="auto (e.g. 16px)"
                                .value=${String(c.chips_scroll_dots_spacing || "")}
                                @change=${(e) => this._updateField("chips_scroll_dots_spacing", e.target.value.trim() || "")}
                            >
                        </div>
                    </div>
                `}
            ` : ""}
        `;
    }

    _renderChipsEditor() {
        const c = this._formData;
        const list = this._getChips();
        let layout = (c.chips_layout || "wrap").toString().toLowerCase();
        if (layout === "scroll") layout = "horizontal-scroll";
        const align = (c.chips_align || "start").toString().toLowerCase();
        const layoutOpts = OPT.chips_layout;
        const isGrid = layout === "grid";
        const isVertical = layout === "vertical-scroll";
        const isScroll = layout === "horizontal-scroll" || isVertical;
        if (c.disable_chips === true) {
            return this._renderToggleGroup([{ key: "disable_chips", label: LABELS.disable_chips }]);
        }
        const chipFormat = (c.chip_format || "inline").toString().toLowerCase();

        // ── Chip list (primary task, shown first) ──
        const listBody = html`
            <div class="sensor-list">
                ${list.map((chip, idx) => this._renderChipRow(chip, idx, list.length))}
            </div>
            <button type="button" class="add-card-btn" @click=${this._addChip}>
                <ha-icon icon="mdi:plus"></ha-icon>
                <span>Add chip</span>
            </button>
        `;

        // ── Position & Layout ──
        const layoutBody = html`
            ${this._renderPositionGrid("chips_position", POSITION_GRIDS.chips_position)}
            <div class="grid-picker">
                <div class="grid-picker-label">${LABELS.chip_format}</div>
                <div class="segmented" role="radiogroup" aria-label=${LABELS.chip_format}>
                    ${[
                        { value: "inline", label: "Inline" },
                        { value: "stacked", label: "Stacked" },
                        { value: "vertical", label: "Vertical" }
                    ].map(o => html`
                        <button type="button" role="radio"
                            class=${chipFormat === o.value ? "active" : ""}
                            @click=${() => this._updateField("chip_format", o.value)}
                        >${o.label}</button>
                    `)}
                </div>
            </div>
            <div class="grid-picker">
                <div class="grid-picker-label">${LABELS.chips_layout}</div>
                <div class="segmented" role="radiogroup" aria-label=${LABELS.chips_layout}>
                    ${layoutOpts.map(o => html`
                        <button type="button" role="radio"
                            class=${layout === o.value ? "active" : ""}
                            @click=${() => this._setChipsLayout(o.value)}
                        >${o.label}</button>
                    `)}
                </div>
            </div>
            ${isGrid ? this._renderForm([{
                name: "chips_columns",
                selector: { number: { mode: "box", min: 1, max: 12, step: 1 } }
            }]) : ""}
            ${isScroll ? this._renderForm([{
                name: "chips_visible",
                selector: { number: { mode: "slider", min: 1, max: 10, step: 1 } }
            }]) : ""}
            ${isVertical ? html`
                ${this._renderCssTextField("chips_height", "auto (e.g. 120px)")}
                ${this._renderToggleGroup([
                    { key: "chips_full_width", label: LABELS.chips_full_width }
                ])}
            ` : ""}
            ${isGrid || (isVertical && c.chips_full_width) || (isScroll && c.chips_visible) ? html`
                <div class="grid-picker">
                    <div class="grid-picker-label">${LABELS.chips_align}</div>
                    <div class="segmented" role="radiogroup" aria-label=${LABELS.chips_align}>
                        ${OPT.chips_align.map(o => html`
                            <button type="button" role="radio"
                                class=${align === o.value ? "active" : ""}
                                @click=${() => this._updateField("chips_align", o.value)}
                            >${o.label}</button>
                        `)}
                    </div>
                </div>
            ` : ""}
            ${isScroll ? this._renderScrollDotsUI(c) : ""}
        `;

        // ── Appearance (background + spacing in compact grid) ──
        const appearanceBody = html`
            ${this._renderToggleGroup([
                { key: "chips_background", label: LABELS.chips_background }
            ])}
            ${c.chips_background === true ? html`
                ${this._renderBgStylePicker()}
                ${this._renderToggleGroup([
                    { key: "chips_grouped", label: LABELS.chips_grouped }
                ])}
            ` : ""}
            <div class="compact-fields">
                ${this._renderCompactField("chips_font_size", "inherit")}
                ${this._renderCompactField("chips_padding", "default")}
                ${this._renderCompactField("chip_gap", "8px")}
                ${this._renderCompactField("chip_inner_gap", "6px")}
            </div>
            ${this._renderCompactField("chips_width", "auto (e.g. 300px)")}
        `;

        return html`
            ${this._renderToggleGroup([{ key: "disable_chips", label: LABELS.disable_chips }])}
            ${this._renderDisclosure(
                html`<span class="section-head"><ha-icon icon="mdi:format-list-bulleted"></ha-icon> Chips</span>`,
                listBody
            )}
            ${this._renderDisclosure(
                html`<span class="section-head"><ha-icon icon="mdi:view-grid-outline"></ha-icon> Position & Layout</span>`,
                layoutBody
            )}
            ${this._renderDisclosure(
                html`<span class="section-head"><ha-icon icon="mdi:palette-swatch-outline"></ha-icon> Appearance</span>`,
                appearanceBody
            )}
        `;
    }

    render() {
        if (!this.hass || !this._config) return html``;
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
                ${this._renderForm(this._sunMoonEntitiesSchema())}
                ${this._renderDisclosure(
                    "Position & Size",
                    (() => {
                        const mode = this._formData.celestial_position || "fixed";
                        return html`
                            ${this._renderCelestialPosition()}
                            ${this._renderCompactField("sun_moon_size", "e.g. 50")}
                            ${mode === "fixed" ? html`
                                ${this._renderSunMoonPosition("sun_moon_x_position", "x")}
                                ${this._renderSunMoonPosition("sun_moon_y_position", "y")}
                            ` : ""}
                            ${mode === "dynamic_sun" ? html`
                                ${this._renderSunMoonPosition("sun_moon_x_position", "x", "Moon X")}
                                ${this._renderSunMoonPosition("sun_moon_y_position", "y", "Moon Y")}
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
                <div class="compact-fields">
                    ${isSquare ? "" : this._renderCompactField("card_height", "e.g. 220 or auto")}
                    ${this._renderCompactField("card_padding", "e.g. 16px")}
                </div>
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
                                        <div class="compact-fields">
                                            ${this._renderCompactField("top_font_size", "e.g. 3em")}
                                            ${this._renderCompactField("top_text_padding", "e.g. 8px 14px")}
                                        </div>
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
