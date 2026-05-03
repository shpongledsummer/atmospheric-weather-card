/**
 * ATMOSPHERIC WEATHER CARD — VISUAL EDITOR
 * Visual editor for the Atmospheric Weather Card.
 * https://github.com/shpongledsummer/atmospheric-weather-card
 */

import { LitElement, html, css } from "https://esm.sh/lit@3.2.1";

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
    image_alignment: "Image Position",
    image_offset_x: "Horizontal Offset",
    image_offset_y: "Vertical Offset",
    status_entity: "Status Entity",
    status_image_day: "Status Image (Day)",
    status_image_night: "Status Image (Night)",

    disable_top_text: "Disable Top Text",
    disable_chips: "Disable Chips",
    top_text_sensor: "Top Sensor",
    top_position: "Top Text Position",
    chips_position: "Position",
    top_font_size: "Font Size",
    top_unit_format: "Custom Unit",
    chips_font_size: "Value text size",
    chips_name_font_size: "Label text size",
    chips_layout: "Layout",
    chip_format: "Chip style",
    chips_columns: "Columns",
    chips_visible: "Show at once",
    chips_align: "Align content",
    chips_width: "Width",
    chips_height: "Height",
    chips_full_width: "Full width chips",
    chips_padding: "Chip padding",
    chips_container_padding: "Container padding",
    chip_gap: "Chips gap",
    chip_inner_gap: "Icon/text gap",
    chip_icon_width: "Icon size",
    top_text_padding: "Padding",
    top_text_background: "Background",
    top_text_behind_weather: "Behind weather",
    chips_background: "Background",
    chips_grouped: "One shared background",
    chips_separator: "Divider between chips",
    chip_icon_bg: "Icon background",
    chip_icon_padding: "Padding around icon",
    background_style: "Background Style",

    custom_cards_position: "Embedded Cards Position",
    custom_cards_css_class: "Embedded Cards CSS Class"
});

const HELPERS = Object.freeze({
    weather_entity: "The main entity from your weather integration, e.g. weather.home.",
    sun_entity: "Used for day/night cycle, moon phase, and star rendering.",
    moon_phase_entity: "A sensor with the current moon phase.",
    theme_entity: "An entity whose state switches between light and dark mode.",

    card_height: "In pixels, e.g. 220. Use 'auto' for dashboard grid layouts.",
    card_padding: "Inner padding, e.g. 16px or 12px 20px.",
    offset: "Outer margin around the card, e.g. 8px or 0 8px.",
    stack_order: "CSS z-index. Use -1 for immersive cards behind other elements.",
    tap_action: "What happens when the card is tapped.",
    full_width: "Removes side margins so the card fills edge to edge.",
    css_mask_vertical: "Adds a soft fade to the top and bottom edges.",
    css_mask_horizontal: "Adds a soft fade to the left and right edges.",
    disable_text: "Hides all text overlays in one toggle.",
    filter: "A colour filter applied to the animated weather layer.",

    moon_style: "Override the moon glow colour. Defaults to your theme.",
    sun_moon_x_position: "Horizontal offset from the edge, in pixels.",
    sun_moon_y_position: "Vertical offset from the top, in pixels.",
    celestial_position: "Dynamic modes calculate the real solar arc for your location.",

    night: "Shown at night. Falls back to the day image if left empty.",
    image_scale: "Image height as a percentage of the card height.",
    image_alignment: "Where the image is anchored within the card.",
    image_offset_x: "Fine-tune horizontal position. Pixels or CSS, e.g. -20 or 10%.",
    image_offset_y: "Fine-tune vertical position. Pixels or CSS, e.g. 10 or -5%.",

    status_entity: "Shows a different image when this entity is active, open, or home.",
    status_image_day: "Day image shown while the status entity is active.",
    status_image_night: "Night image shown while the status entity is active.",

    top_unit_format: "Replaces the unit shown after the value, e.g. ° to get 21°.",
    top_text_behind_weather: "Renders the text behind the weather animation layer.",
    chips_columns: "Number of equal-width columns in grid layout.",
    chips_align: "Horizontal alignment of chips within the container.",
    top_text_padding: "Padding around the top text, e.g. 8px 14px.",
    background_style: "Frosted: translucent glass effect. Contrast: solid and readable. Theme: follows your HA theme colours.",

    custom_cards_css_class: "Adds a CSS class to the embedded cards container. Useful for targeting with card-mod."
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
    position: "Position",
    forecast: "Forecast type",
    forecast_offset: "Day / Hour offset",
    unit_format: "Custom unit",
    font_size: "Value text size",
    name_font_size: "Label text size",
    inner_gap: "Icon/text gap",
    chip_align: "Content alignment",
    chip_padding: "Chip padding",
    icon_size: "Icon size",
    icon_padding: "Icon padding"
});

const CHIP_HELPERS = Object.freeze({
    name_sensor: "Use a sensor value as the label instead.",
    width: "e.g. 200px or 60%. Required for scrolling text.",
    icon: "MDI icon, or type 'weather' for a dynamic icon.",
    icon_path: "e.g. /local/weather-icons/",
    forecast_offset: "0 = today/now, 1 = tomorrow/next hour, etc.",
    unit_format: "Replaces the unit. Placed directly after the value, e.g. ° for 12°."
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
    "top_font_size", "top_unit_format", "top_text_padding",
    "chips_font_size", "chips_name_font_size",
    "chips_layout", "chips_columns", "chips_visible", "chips_align", "chips_width", "chips_height", "chips_full_width", "chips_padding", "chips_container_padding", "chip_gap", "chip_inner_gap", "chip_icon_width", "chip_format",
    "top_text_background", "chips_background", "chips_grouped", "chips_separator", "background_style",
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
        { value: "end",    label: "Right" },
        { value: "spread", label: "Spread" }
    ]
});

const FC_ATTRIBUTES = Object.freeze([
    { value: "condition",                  label: "Condition" },
    { value: "temperature",                label: "Temperature (high)" },
    { value: "templow",                    label: "Temperature (low)" },
    { value: "precipitation_probability",  label: "Rain probability" },
    { value: "precipitation",              label: "Precipitation" },
    { value: "humidity",                   label: "Humidity" },
    { value: "wind_speed",                 label: "Wind speed" },
    { value: "wind_bearing",               label: "Wind bearing" },
    { value: "pressure",                   label: "Pressure" },
    { value: "cloud_coverage",             label: "Cloud coverage" },
    { value: "uv_index",                   label: "UV index" },
]);

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
            _openPanel: { type: String, state: true },
        };
    }

    static get styles() {
        return css`
            :host {
                --awc-e-s1: 4px; --awc-e-s2: 8px; --awc-e-s3: 12px; --awc-e-s4: 16px;
                --awc-e-r-box: 10px; --awc-e-r-ctrl: 8px; --awc-e-r-inline: 6px;
                --awc-e-f-meta: 12px; --awc-e-f-label: 13px; --awc-e-f-body: 14px; --awc-e-f-header: 15px;
                --awc-e-t: 150ms ease;
                --mdc-text-field-fill-color: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06);
                --mdc-select-fill-color: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06);
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
            .composite:last-child, .grid-picker:last-child, .toggle-group:last-child,
            .section-box:last-child { margin-bottom: 0; }
            .disclosure-body > :last-child { margin-bottom: 0; }
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
            .section-box .grid-picker { margin: var(--awc-e-s2) 0 0 0; background: transparent; padding: 0; }
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
                border: 1px solid transparent; background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.07);
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
                background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.07); color: var(--primary-text-color);
                border-radius: var(--awc-e-r-ctrl); font-size: var(--awc-e-f-body);
                cursor: pointer; transition: background var(--awc-e-t), color var(--awc-e-t); white-space: nowrap;
                &:hover:not(.active) { background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.14); }
                &.active { background: var(--primary-color); color: var(--text-primary-color, white); }
            }
            .segmented {
                display: flex; flex-wrap: wrap; width: 100%;
                background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.07);
                border-radius: var(--awc-e-r-ctrl); padding: 0; gap: 1px; box-sizing: border-box;
                & button {
                    flex: 1 1 auto; min-width: 52px; padding: var(--awc-e-s2) var(--awc-e-s3); border: 0;
                    background: transparent; color: var(--primary-text-color); font-size: var(--awc-e-f-body);
                    cursor: pointer; transition: background var(--awc-e-t), color var(--awc-e-t);
                    text-align: center; border-radius: var(--awc-e-r-ctrl);
                    &:hover:not(.active) { background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.07); }
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
                & > .disclosure-body { padding: var(--awc-e-s4) var(--awc-e-s4) var(--awc-e-s3) var(--awc-e-s4); }
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
                    &:hover { background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.05); }
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
                        &:hover:not(:disabled) { background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.07); color: var(--primary-text-color); }
                        &:disabled { opacity: 0.3; cursor: not-allowed; }
                    }
                    & ha-icon { --mdc-icon-size: 18px; }
                }
                & .card-row-body { padding: var(--awc-e-s3) var(--awc-e-s4) var(--awc-e-s4); background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.03); }
            }
            .add-card-btn {
                display: flex; align-items: center; justify-content: center; gap: var(--awc-e-s2);
                width: 100%; padding: var(--awc-e-s3);
                border: 1.5px dashed var(--divider-color); background: transparent;
                color: var(--secondary-text-color); border-radius: var(--awc-e-r-box);
                font-size: var(--awc-e-f-body); font-weight: 500; cursor: pointer;
                transition: background var(--awc-e-t), border-color var(--awc-e-t), color var(--awc-e-t);
                &:hover { border-color: var(--primary-color); color: var(--primary-color); background: rgba(var(--rgb-primary-color, 0, 120, 212), 0.06); }
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
                    background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.07); color: var(--primary-text-color);
                    border-radius: var(--awc-e-r-ctrl); font-size: var(--awc-e-f-body); transition: border-color var(--awc-e-t);
                    &:focus { outline: none; border-color: var(--primary-color); }
                }
            }
            .section-head {
                display: flex; align-items: center; gap: var(--awc-e-s2);
                & ha-icon { --mdc-icon-size: 16px; color: var(--secondary-text-color); }
            }
            .toggle-group {
                background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.04);
                border-radius: var(--awc-e-r-box); overflow: hidden; margin: var(--awc-e-s2) 0;
            }
            .toggle-row {
                display: flex; align-items: center; justify-content: space-between;
                gap: var(--awc-e-s3); padding: var(--awc-e-s2) var(--awc-e-s3);
                cursor: pointer; min-height: 40px; box-sizing: border-box;
                & + .toggle-row { border-top: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06); }
                & > span { font-size: var(--awc-e-f-body); color: var(--primary-text-color); }
            }
            .section-box {
                background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.09);
                border-radius: var(--awc-e-r-box); overflow: hidden;
                margin: var(--awc-e-s3) 0 var(--awc-e-s4) 0;
                padding: var(--awc-e-s3) var(--awc-e-s4);
                & .compact-fields { margin: 0; }
            }
            .section-box.no-pad { padding: var(--awc-e-s4); }
            .section-box.no-pad > .card-row:first-child { border-radius: 0; }
            .section-box.no-pad > .card-row:last-child { border-radius: 0; }
            .section-box.no-pad > .add-card-btn {
                border: none; border-top: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.08);
                border-radius: 0 0 var(--awc-e-r-box) var(--awc-e-r-box);
                background: transparent; margin: 0;
            }
            .section-box.no-pad > .sensor-list { margin-top: 0; }
            .fc-box {
                margin: var(--awc-e-s3) 0; padding: var(--awc-e-s3) var(--awc-e-s4);
                background: rgba(var(--rgb-primary-color, 0, 120, 212), 0.08);
                border: 1px solid rgba(var(--rgb-primary-color, 0, 120, 212), 0.18);
                border-radius: var(--awc-e-r-box);
            }
            .fc-box-head {
                display: flex; align-items: center; gap: var(--awc-e-s2);
                font-size: var(--awc-e-f-label); font-weight: 500; color: var(--primary-color);
                margin-bottom: var(--awc-e-s2);
                & ha-icon { --mdc-icon-size: 16px; }
            }
            .fc-box ha-form { margin-top: var(--awc-e-s2); }
            .icon-combo {
                display: flex; align-items: center; gap: var(--awc-e-s1);
                & ha-icon-picker { flex: 1; min-width: 0; }
                & .icon-weather-btn {
                    flex-shrink: 0; padding: var(--awc-e-s2) var(--awc-e-s3); border: 0;
                    border-radius: var(--awc-e-r-ctrl); font-size: var(--awc-e-f-meta); cursor: pointer;
                    transition: background var(--awc-e-t), color var(--awc-e-t);
                    &.active { background: var(--primary-color); color: var(--text-primary-color, white); }
                    &:not(.active) { background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.09); color: var(--primary-text-color); }
                    &:hover:not(.active) { background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.16); }
                }
            }
            .weather-icon-active {
                display: flex; align-items: center; gap: var(--awc-e-s2);
                padding: var(--awc-e-s2) var(--awc-e-s3);
                background: rgba(var(--rgb-primary-color, 0, 120, 212), 0.07);
                border: 1px solid rgba(var(--rgb-primary-color, 0, 120, 212), 0.18);
                border-radius: var(--awc-e-r-ctrl);
            }
            .weather-icon-active-text {
                flex: 1; display: flex; flex-direction: column; gap: 1px;
                & span:first-child { font-size: var(--awc-e-f-label); font-weight: 500; color: var(--primary-text-color); }
            }
            .weather-icon-active-sub { font-size: var(--awc-e-f-meta); color: var(--secondary-text-color); }
            .weather-icon-active .icon-weather-btn {
                flex-shrink: 0; padding: var(--awc-e-s1) var(--awc-e-s2); border: 0;
                border-radius: var(--awc-e-r-ctrl); font-size: var(--awc-e-f-meta); cursor: pointer;
                background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.09); color: var(--primary-text-color);
                transition: background var(--awc-e-t);
                &:hover { background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.16); }
            }
            /* ── Chip type picker ── */
            .chip-type-picker { display: grid; grid-template-columns: 1fr 1fr; gap: var(--awc-e-s2); margin: 0 0 var(--awc-e-s3) 0; }
            .chip-type-btn { display: flex; align-items: center; gap: var(--awc-e-s2); padding: var(--awc-e-s2) var(--awc-e-s3); border: 1.5px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.12); border-radius: var(--awc-e-r-box); background: transparent; color: var(--primary-text-color); text-align: left; cursor: pointer; transition: border-color var(--awc-e-t), background var(--awc-e-t); &:hover { border-color: var(--primary-color); background: rgba(var(--rgb-primary-color, 0, 120, 212), 0.05); } &.active { border-color: var(--primary-color); background: rgba(var(--rgb-primary-color, 0, 120, 212), 0.08); } & .chip-type-icon { --mdc-icon-size: 18px; color: var(--secondary-text-color); flex-shrink: 0; } & .chip-type-icon.active-icon { color: var(--primary-color); } & .chip-type-text { display: flex; flex-direction: column; gap: 1px; } & .chip-type-name { font-size: var(--awc-e-f-label); font-weight: 500; line-height: 1.2; } & .chip-type-desc { font-size: var(--awc-e-f-meta); color: var(--secondary-text-color); line-height: 1.2; } }

            /* ── Chip header badges: icon-based, no text ── */
            .chip-badge-row { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 4px; background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.08); color: var(--secondary-text-color); flex-shrink: 0; & ha-icon { --mdc-icon-size: 13px; } }
            .chip-badge-free { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 4px; background: rgba(var(--rgb-primary-color, 0, 120, 212), 0.15); color: var(--primary-color); flex-shrink: 0; & ha-icon { --mdc-icon-size: 13px; } }

            /* ── Position grid + align ── */
            .chips-pos-align-row { display: flex; gap: var(--awc-e-s3); align-items: flex-start; }
            .chips-pos-align-row .grid-picker { margin: 0; padding: 0; background: transparent; flex-shrink: 0; }
            /* ── CSS value fields ── */
            .css-field-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: var(--awc-e-s2); margin-top: var(--awc-e-s2); }
            .css-field-row.cols-2 { grid-template-columns: 1fr 1fr; }
            .css-field { display: flex; flex-direction: column; gap: 3px; & .css-field-label { font-size: 11px; color: var(--secondary-text-color); font-weight: 500; padding-left: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } & input { width: 100%; box-sizing: border-box; height: 36px; padding: 0 10px; border: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.18); background: var(--mdc-text-field-fill-color, rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06)); color: var(--primary-text-color); border-radius: var(--awc-e-r-ctrl); font-size: var(--awc-e-f-body); font-family: inherit; transition: border-color var(--awc-e-t); &:focus { outline: none; border-color: var(--primary-color); } &::placeholder { color: var(--secondary-text-color); opacity: 0.7; } } }

            .settings-group { margin-top: 16px; }
            .settings-group-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--secondary-text-color); margin-bottom: var(--awc-e-s2); display: flex; align-items: center; gap: var(--awc-e-s1); }
            .chip-accordion-body > .settings-group:first-child { margin-top: 0; }
            .chip-accordion-body .settings-group + .settings-group { margin-top: var(--awc-e-s3); }
            .chip-accordion-body .settings-group-label { margin-top: var(--awc-e-s2); }

            .chip-accordion { border: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.09); border-radius: var(--awc-e-r-box); overflow: hidden; margin-top: var(--awc-e-s2); }
            .chip-accordion + .chip-accordion { margin-top: var(--awc-e-s1); }
            .chip-accordion-head { display: flex; align-items: center; justify-content: space-between; padding: var(--awc-e-s2) var(--awc-e-s3); cursor: pointer; background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.03); user-select: none; -webkit-user-select: none; & .chip-accordion-title { font-size: var(--awc-e-f-label); font-weight: 500; color: var(--primary-text-color); } & ha-icon { --mdc-icon-size: 16px; color: var(--secondary-text-color); transition: transform var(--awc-e-t); flex-shrink: 0; } &.open ha-icon.chevron { transform: rotate(90deg); } &:hover { background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06); } }
            .chip-accordion-body { padding: var(--awc-e-s3); border-top: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.09); & .settings-group:first-child { margin-top: 0; } }

            /* ── Nudge strips ── */
            .chip-nudge { display: flex; align-items: flex-start; gap: var(--awc-e-s2); padding: var(--awc-e-s2) var(--awc-e-s3); margin: var(--awc-e-s1) 0; border-radius: var(--awc-e-r-ctrl); font-size: var(--awc-e-f-meta); color: var(--secondary-text-color); line-height: 1.5; & code { background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.08); padding: 0 4px; border-radius: 3px; } }
            .chip-nudge.warning { background: rgba(var(--rgb-warning-color, 255, 152, 0), 0.10); border: 1px solid rgba(var(--rgb-warning-color, 255, 152, 0), 0.25); }
            .chip-nudge.info { background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.04); border: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.09); }


            /* ── Toggle row ── */
            .chip-toggle-row { display: flex; align-items: center; justify-content: space-between; padding: var(--awc-e-s2) var(--awc-e-s3); background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.04); border-radius: var(--awc-e-r-ctrl); margin-top: var(--awc-e-s2); & span { font-size: var(--awc-e-f-body); color: var(--primary-text-color); } }

            /* ── Chip background color picker ── */
            .chip-color-box { margin-top: var(--awc-e-s2); padding: var(--awc-e-s2) var(--awc-e-s3); border: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.10); border-radius: var(--awc-e-r-ctrl); background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.03); }
            .chip-color-row { display: flex; align-items: center; gap: var(--awc-e-s2); }
            .chip-color-label { flex: 1; font-size: var(--awc-e-f-label); color: var(--primary-text-color); }
            .chip-color-swatch { width: 36px; height: 28px; border: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.18); border-radius: var(--awc-e-r-inline); padding: 1px 2px; background: none; cursor: pointer; flex-shrink: 0; }
            .chip-color-clear { width: 24px; height: 24px; border: 0; border-radius: 50%; padding: 0; background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.08); color: var(--secondary-text-color); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background var(--awc-e-t); &:hover { background: rgba(var(--rgb-error-color, 211, 47, 47), 0.15); color: var(--error-color); } }
            .chip-color-opacity-row { display: flex; align-items: center; gap: var(--awc-e-s2); margin-top: var(--awc-e-s2); }
            .chip-color-opacity-label { font-size: 11px; color: var(--secondary-text-color); white-space: nowrap; }
            .chip-color-opacity { flex: 1; height: 4px; accent-color: var(--primary-color); cursor: pointer; }
            .chip-color-opacity-val { font-size: 11px; color: var(--secondary-text-color); width: 32px; text-align: right; flex-shrink: 0; }

            /* ── Free chip positioning grid ── */
            .free-pos-layout { display: grid; grid-template-columns: auto 1fr; gap: var(--awc-e-s3); align-items: start; }
            .offset-fields { display: grid; grid-template-columns: 1fr 1fr; gap: var(--awc-e-s2); }
            .offset-field { display: flex; flex-direction: column; gap: 3px; & .offset-field-label { font-size: 11px; color: var(--secondary-text-color); font-weight: 500; padding-left: 2px; } & input { width: 100%; box-sizing: border-box; height: 36px; padding: 0 10px; border: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.18); background: var(--mdc-text-field-fill-color, rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06)); color: var(--primary-text-color); border-radius: var(--awc-e-r-ctrl); font-size: var(--awc-e-f-body); font-family: inherit; &:focus { outline: none; border-color: var(--primary-color); } &::placeholder { color: var(--secondary-text-color); opacity: 0.7; } } }

            /* ── Free positioning — unified expanding box ── */
            .free-mode-box {
                margin-top: var(--awc-e-s3);
                background: rgba(var(--rgb-primary-color, 0, 120, 212), 0.05);
                border: 1px solid rgba(var(--rgb-primary-color, 0, 120, 212), 0.14);
                border-radius: var(--awc-e-r-box); overflow: hidden;
            }
            .free-mode-row { display: flex; align-items: center; justify-content: space-between; padding: var(--awc-e-s2) var(--awc-e-s3); }
            .free-mode-label { font-size: var(--awc-e-f-label); font-weight: 500; color: var(--primary-text-color); display: flex; align-items: center; gap: var(--awc-e-s1); }
            .free-pos-subpanel { padding: 0 var(--awc-e-s3) var(--awc-e-s3); }
            .free-pos-subpanel::before { content: ""; display: block; height: 10px; }

            .anchor-grid { display: grid; grid-template-columns: repeat(3, 30px); grid-template-rows: repeat(3, 30px); gap: 4px; }
            .anchor-cell { width: 30px; height: 30px; border: 1.5px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.15); border-radius: var(--awc-e-r-ctrl); background: transparent; cursor: pointer; transition: border-color var(--awc-e-t), background var(--awc-e-t); &:hover:not(.active) { border-color: var(--primary-color); background: rgba(var(--rgb-primary-color, 0, 120, 212), 0.07); } &.active { border-color: var(--primary-color); background: var(--primary-color); } }

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

    _layoutAdvancedSchema() {
        const c = this._formData;
        const isStandalone = c.card_style === "standalone";
        return [
            { name: "disable_text", selector: { boolean: {} } },
            { name: "square", selector: { boolean: {} } },
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
            { name: "stack_order", selector: { number: { mode: "slider", min: -10, max: 10, step: 1 } } }
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

    _getChips() {
        const c = this._config || {};
        if (Array.isArray(c.chips) && c.chips.length > 0) {
            return c.chips.map(s => (s && typeof s === "object") ? s : {});
        }
        return [{}];
    }

    _renderCelestialPosition() {
        return this._renderForm([{
            name: "celestial_position",
            selector: { select: { mode: "dropdown", options: [
                { value: "fixed", label: "Fixed Sun & Moon" },
                { value: "dynamic_sun", label: "Dynamic Sun" },
                { value: "dynamic_both", label: "Dynamic Sun & Moon" }
            ]}}
        }]);
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
        const isScroll = chipLayout === "horizontal-scroll" || chipLayout === "vertical-scroll";
        if (!isScroll) {
            out.add("chips_height");
            out.add("chips_full_width");
        }
        // chips_separator is always available
        if (c.top_text_sensor && !c.top_text_sensor.startsWith("weather.")) out.add("top_unit_format");

        return out;
    }

    _cleanConfig(config) {
        const out = { ...config };
        for (const key of Object.keys(out)) {
            const v = out[key];
            if (v === "" || v === null || v === undefined) {
                if (key === 'top_unit_format' && v === "") continue;
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
        const isEmpty = value === null || value === undefined || (value === "" && field !== 'top_unit_format');
        if (isEmpty) { this._patch({}, { strip: [field] }); return; }
        this._patch({ [field]: value });
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
        const c = this._formData;
        const isSquare = c.square === true;
        const current = c.card_style || "immersive";
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
                    Immersive seamlessly integrates into your dashboard, while Standalone displays weather-based background colors.
                </div>
                <div class="compact-fields" style="margin-bottom:0">
                    ${isSquare ? "" : this._renderCompactField("card_height", "e.g. 220 or auto")}
                    ${this._renderCompactField("card_padding", "e.g. 16px")}
                </div>
            </div>
        `;
    }

    _getSunMoonAnchor() {
        const rx = this._formData.sun_moon_x_position, ry = this._formData.sun_moon_y_position;
        const xStr = String(rx ?? "").trim().toLowerCase(), yStr = String(ry ?? "").trim().toLowerCase();
        const xSide = xStr === "center" ? "center" : (xStr && parseInt(xStr, 10) < 0) ? "right" : "left";
        const ySide = yStr === "center" ? "center" : "top";
        if (xSide === "center" && ySide === "center") return "center";
        if (ySide === "center") return xSide; // "left" or "right"
        return `${ySide}-${xSide}`;
    }

    _setSunMoonAnchor(anchor) {
        const [v, h] = anchor === "center" ? ["center","center"]
            : anchor === "left" ? ["center","left"] : anchor === "right" ? ["center","right"]
            : anchor.split("-");
        const curX = Math.abs(parseInt(this._formData.sun_moon_x_position, 10)) || 0;
        const curY = Math.abs(parseInt(this._formData.sun_moon_y_position, 10)) || 0;
        const fallback = 65; // sensible default when switching from center
        const xVal = h === "center" ? "center" : h === "right" ? String(-(curX || fallback)) : String(curX || fallback);
        const yVal = v === "center" ? "center" : String(curY || fallback);
        this._patch({ sun_moon_x_position: xVal, sun_moon_y_position: yVal });
    }

    _renderSunMoonGrid(labelPrefix) {
        const anchor = this._getSunMoonAnchor();
        const rx = this._formData.sun_moon_x_position, ry = this._formData.sun_moon_y_position;
        const xStr = String(rx ?? "").trim().toLowerCase(), yStr = String(ry ?? "").trim().toLowerCase();
        const xIsCenter = xStr === "center", yIsCenter = yStr === "center";
        const absX = xIsCenter ? "" : String(Math.abs(parseInt(rx, 10) || 0));
        const absY = yIsCenter ? "" : String(Math.abs(parseInt(ry, 10) || 0));
        const xSide = xIsCenter ? "center" : (parseInt(rx, 10) < 0 ? "right" : "left");
        const cells = ["top-left","top-center","top-right","left","center","right","bottom-left","bottom-center","bottom-right"];
        const disabled = new Set(["bottom-left","bottom-center","bottom-right"]);

        return html`
            <div class="grid-picker">
                <div class="grid-picker-label">${labelPrefix || ""}Position</div>
                <div class="grid-3x3" role="radiogroup" aria-label="Sun/Moon position">
                    ${cells.map(v => html`
                        <button type="button" role="radio"
                            class="grid-cell ${anchor === v ? "active" : ""} ${disabled.has(v) ? "disabled" : ""}"
                            ?disabled=${disabled.has(v)}
                            title=${disabled.has(v) ? `${v} (not available)` : v}
                            aria-label=${v}
                            @click=${disabled.has(v) ? null : () => this._setSunMoonAnchor(v)}
                        ></button>
                    `)}
                </div>
                <div class="grid-helper">Bottom positions are not supported by the card's coordinate system.</div>
            </div>
            <div class="composite">
                <div class="composite-label">Offset from edge</div>
                <div class="composite-row" style="flex-wrap:nowrap">
                    <span class="composite-unit">X</span>
                    <ha-textfield class="composite-textfield" placeholder="65" style="flex:1;min-width:0"
                        .value=${absX} ?disabled=${xIsCenter}
                        @change=${(e) => {
                            const n = Math.abs(parseInt(e.target.value, 10) || 0);
                            this._updateField("sun_moon_x_position", xSide === "right" ? String(-n) : String(n));
                        }}
                    ></ha-textfield>
                    <span class="composite-unit">Y</span>
                    <ha-textfield class="composite-textfield" placeholder="65" style="flex:1;min-width:0"
                        .value=${absY} ?disabled=${yIsCenter}
                        @change=${(e) => {
                            const n = Math.abs(parseInt(e.target.value, 10) || 0);
                            this._updateField("sun_moon_y_position", String(n));
                        }}
                    ></ha-textfield>
                    <span class="composite-unit">px</span>
                </div>
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

    _renderImageOffsetPicker() {
        const c = this._formData;
        if (!c.day && !c.night) return "";
        return html`
            <div class="composite">
                <div class="composite-label">Image Offset</div>
                <div class="composite-row" style="flex-wrap:nowrap">
                    <span class="composite-unit">X</span>
                    <ha-textfield class="composite-textfield" placeholder="0" style="flex:1;min-width:0"
                        .value=${String(c.image_offset_x || "")}
                        @change=${(e) => this._updateField("image_offset_x", e.target.value.trim())}
                    ></ha-textfield>
                    <span class="composite-unit">Y</span>
                    <ha-textfield class="composite-textfield" placeholder="0" style="flex:1;min-width:0"
                        .value=${String(c.image_offset_y || "")}
                        @change=${(e) => this._updateField("image_offset_y", e.target.value.trim())}
                    ></ha-textfield>
                </div>
                <div class="composite-helper">Fine-tune image position. Pixels or CSS values, e.g. -20 or 10%.</div>
            </div>
        `;
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

    _renderListRow({ idx, total, expanded, title, badge, onToggle, onMoveUp, onMoveDown, onRemove, onDuplicate, body }) {
        return html`
            <div class="card-row ${expanded ? "expanded" : ""}">
                <div class="card-row-head" @click=${onToggle}>
                    <ha-icon class="chevron" icon="mdi:chevron-right"></ha-icon>
                    ${badge ? badge : ""}
                    <span class="card-row-title">${title}</span>
                    <div class="card-row-actions" @click=${(e) => e.stopPropagation()}>
                        <button type="button" title="Move up" ?disabled=${idx === 0} @click=${onMoveUp}><ha-icon icon="mdi:arrow-up"></ha-icon></button>
                        <button type="button" title="Move down" ?disabled=${idx === total - 1} @click=${onMoveDown}><ha-icon icon="mdi:arrow-down"></ha-icon></button>
                        ${onDuplicate ? html`<button type="button" title="Duplicate" @click=${onDuplicate}><ha-icon icon="mdi:content-copy"></ha-icon></button>` : ""}
                        <button type="button" title="Delete" @click=${onRemove}><ha-icon icon="mdi:delete-outline"></ha-icon></button>
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
        if (chip.forecast) {
            const type = chip.forecast === "hourly" ? "Hourly" : "Daily";
            const offset = parseInt(chip.forecast_offset, 10) || 0;
            const offsetLabel = chip.forecast === "hourly"
                ? (offset === 0 ? "now" : `+${offset}h`)
                : (offset === 0 ? "today" : offset === 1 ? "tomorrow" : `+${offset}d`);
            const attrLabel = attribute || "condition";
            const base = `${label} · ${type} ${offsetLabel} [${attrLabel}]`;
            return name ? `${name} — ${base}` : base;
        }
        const withAttr = attribute ? `${label} [${attribute}]` : label;
        return name ? `${name} — ${withAttr}` : withAttr;
    }

    _cleanChip(chip) {
        const out = { ...chip };
        if (!out.entity) { delete out.attribute; delete out.forecast; delete out.forecast_offset; }
        if (!out.forecast) { delete out.forecast_offset; delete out.forecast_precision; delete out.forecast_show_min; }
        if (out.forecast_offset === 0) delete out.forecast_offset;
        for (const k of Object.keys(out)) {
            const v = out[k];
            if (k === 'unit_format') { if (v === null || v === undefined) delete out[k]; continue; }
            if (k === 'chip_background' && v === false) continue;
            if (k === 'icon_bg' && v === false) continue;
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

    _duplicateChip(idx) {
        const list = [...this._getChips()];
        list.splice(idx + 1, 0, { ...list[idx] });
        this._expandedChip = idx + 1;
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
        const isFc = !!chip.forecast;
        const hasEntity = !!(chip.entity || "").toString().trim();
        const entityId = (chip.entity || "").toString().trim();
        const nameSensorId = (chip.name_sensor || "").toString().trim();
        const fcEntityMissing = isFc && entityId && !entityId.startsWith("weather.");
        const cardWeatherEntity = (this._config && this._config.weather_entity) || "";

        const accOpen = this[`_acc_open_${idx}`] || null;

        const update = (next) => this._updateChipAt(idx, next);

        const chipForm = (schema) => html`
            <ha-form .hass=${this.hass} .data=${chip}
                .schema=${schema}
                .computeLabel=${this._chipLabel} .computeHelper=${this._chipHelper}
                @value-changed=${(e) => { e.stopPropagation(); update((e.detail && e.detail.value) || {}); }}
            ></ha-form>`;

        const cssField = (key, label, placeholder) => html`
            <div class="css-field">
                <span class="css-field-label">${label}</span>
                <input type="text" placeholder=${placeholder}
                    .value=${chip[key] !== undefined ? String(chip[key]) : ""}
                    @change=${(e) => {
                        const v = e.target.value;
                        const next = { ...chip };
                        if (key === "unit_format") { next[key] = v; }
                        else if (v.trim()) next[key] = v.trim();
                        else delete next[key];
                        update(next);
                    }}
                >
            </div>`;

        const accordion = (key, title, content) => {
            const isOpen = accOpen === key;
            return html`
                <div class="chip-accordion">
                    <div class="chip-accordion-head ${isOpen ? "open" : ""}"
                        @click=${() => { this[`_acc_open_${idx}`] = isOpen ? null : key; this.requestUpdate(); }}
                    >
                        <span class="chip-accordion-title">${title}</span>
                        <ha-icon class="chevron" icon="mdi:chevron-right"></ha-icon>
                    </div>
                    ${isOpen ? html`<div class="chip-accordion-body">${content}</div>` : ""}
                </div>`;
        };

        const entitySection = isFc
            ? chipForm([{ name: "entity", selector: { entity: { domain: "weather" } } }])
            : chipForm([
                { name: "entity", selector: { entity: {} } },
                ...(entityId ? [{ name: "attribute", selector: { attribute: { entity_id: entityId } } }] : [])
              ]);

        const typePicker = html`
            <div class="chip-type-picker">
                <button type="button" class="chip-type-btn ${!isFc ? "active" : ""}"
                    @click=${() => { const n = { ...chip }; delete n.forecast; delete n.forecast_offset; delete n.forecast_precision; delete n.forecast_show_min; update(n); }}
                >
                    <ha-icon class="chip-type-icon ${!isFc ? "active-icon" : ""}" icon="mdi:gauge"></ha-icon>
                    <div class="chip-type-text"><span class="chip-type-name">Sensor</span><span class="chip-type-desc">Live entity value</span></div>
                </button>
                <button type="button" class="chip-type-btn ${isFc ? "active" : ""}"
                    @click=${() => {
                        const cur = (chip.entity || "").toString().trim();
                        const ent = (cur && cur.startsWith("weather.")) ? cur : (cardWeatherEntity || cur);
                        const n = { ...chip, forecast: "daily", attribute: "temperature", forecast_offset: 1 };
                        if (ent) n.entity = ent;
                        update(n);
                    }}
                >
                    <ha-icon class="chip-type-icon ${isFc ? "active-icon" : ""}" icon="mdi:calendar-clock"></ha-icon>
                    <div class="chip-type-text"><span class="chip-type-name">Forecast</span><span class="chip-type-desc">Weather forecast</span></div>
                </button>
            </div>
        `;

        const emptyNudge = !hasEntity ? html`
            <div class="chip-nudge info">
                <ha-icon icon="mdi:information-outline" style="--mdc-icon-size:14px;flex-shrink:0"></ha-icon>
                Pick any entity to display its value or attribute.
            </div>` : "";

        const fcWarning = fcEntityMissing ? html`
            <div class="chip-nudge warning">
                <ha-icon icon="mdi:alert-circle-outline" style="--mdc-icon-size:14px;flex-shrink:0"></ha-icon>
                Forecast requires a weather entity, e.g. <code>weather.home</code>.
            </div>` : "";

        const fcAttr = chip.attribute || "condition";
        const isMarquee = (chip.overflow || "").toLowerCase() === "marquee";
        const overflowSection = html`
            <div class="settings-group">
                <div class="settings-group-label">Text Overflow</div>
                ${chipForm([{ name: "overflow", selector: { select: { mode: "dropdown", options: OPT.chip_overflow } } }])}
                ${isMarquee ? chipForm([{ type: "grid", name: "", schema: [
                    { name: "marquee_speed", selector: { number: { mode: "box", min: 5, step: 1 } } },
                    { name: "marquee_rtl",   selector: { boolean: {} } }
                ] }]) : ""}
            </div>
        `;

        const fcOff  = parseInt(chip.forecast_offset, 10) || 0;
        const settingsContent = html`
            <div class="settings-group">
                <div class="settings-group-label">Label</div>
                ${chipForm([{ name: "name", selector: { text: {} } }])}
                ${chipForm([{ name: "name_sensor", selector: { entity: {} } }])}
                ${nameSensorId ? chipForm([{ name: "name_attribute", selector: { attribute: { entity_id: nameSensorId } } }]) : ""}
            </div>
            ${!isFc ? html`
                <div style="margin-top:var(--awc-e-s3)">
                    ${chipForm([{ name: "unit_format", selector: { text: {} } }])}
                </div>` : ""}
            ${isFc && !fcEntityMissing ? html`
                <div class="settings-group">
                    <div class="settings-group-label">Forecast</div>
                    <div class="segmented" role="radiogroup" aria-label="Forecast type" style="margin-bottom:var(--awc-e-s2)">
                        ${[{ value: "daily", label: "Daily" }, { value: "hourly", label: "Hourly" }].map(o => html`
                            <button type="button" role="radio" class=${chip.forecast === o.value ? "active" : ""}
                                @click=${() => update({ ...chip, forecast: o.value, forecast_offset: 0 })}
                            >${o.label}</button>`)}
                    </div>
                    <ha-form .hass=${this.hass}
                        .data=${{ forecast_offset: fcOff }}
                        .schema=${[{ name: "forecast_offset", selector: { number: { mode: "slider", min: 0, max: chip.forecast === "hourly" ? 23 : 6, step: 1 } } }]}
                        .computeLabel=${() => chip.forecast === "hourly" ? "Hours ahead" : "Days ahead"}
                        .computeHelper=${() => chip.forecast === "hourly" ? (fcOff === 0 ? "Now" : `+${fcOff}h`) : (fcOff === 0 ? "Today" : fcOff === 1 ? "Tomorrow" : `+${fcOff} days`)}
                        @value-changed=${(e) => { e.stopPropagation(); const v = e.detail?.value?.forecast_offset; if (v !== undefined) update({ ...chip, forecast_offset: v }); }}
                    ></ha-form>
                    <ha-form style="margin-top:var(--awc-e-s1)" .hass=${this.hass}
                        .data=${{ attribute: fcAttr }}
                        .schema=${[{ name: "attribute", selector: { select: { mode: "dropdown", options: FC_ATTRIBUTES } } }]}
                        .computeLabel=${() => "Show"}
                        @value-changed=${(e) => { e.stopPropagation(); const v = e.detail?.value?.attribute; if (v !== undefined) update({ ...chip, attribute: v }); }}
                    ></ha-form>
                    ${fcAttr !== "condition" ? html`
                        <ha-form style="margin-top:var(--awc-e-s1)" .hass=${this.hass}
                            .data=${{ forecast_precision: chip.forecast_precision !== undefined ? chip.forecast_precision : 1 }}
                            .schema=${[{ name: "forecast_precision", selector: { number: { mode: "slider", min: 0, max: 2, step: 1 } } }]}
                            .computeLabel=${() => "Decimal places"}
                            @value-changed=${(e) => { e.stopPropagation(); const v = e.detail?.value?.forecast_precision; if (v !== undefined) update({ ...chip, forecast_precision: v }); }}
                        ></ha-form>
                        <div style="margin-top:var(--awc-e-s2)">
                            ${chipForm([{ name: "unit_format", selector: { text: {} } }])}
                        </div>
                        ${fcAttr === "temperature" ? html`
                            <div class="chip-toggle-row">
                                <span>Show low temperature</span>
                                <ha-switch .checked=${chip.forecast_show_min === true}
                                    @change=${(e) => update({ ...chip, forecast_show_min: e.target.checked || false })}
                                ></ha-switch>
                            </div>` : ""}
                    ` : ""}
                </div>
            ` : ""}
            ${overflowSection}
        `;

        const isWeatherIcon = (chip.icon || "").toString().trim().toLowerCase() === "weather";
        const iconContent = html`
            <div class="settings-group">
                <div class="settings-group-label">Icon</div>
                ${isWeatherIcon
                    ? html`
                        <div class="weather-icon-active">
                            <ha-icon icon="mdi:weather-partly-cloudy" style="--mdc-icon-size:20px;color:var(--primary-color)"></ha-icon>
                            <div class="weather-icon-active-text">
                                <span>Weather icon</span>
                                <span class="weather-icon-active-sub">${isFc ? "Matches the forecast condition" : "Matches the current weather condition"}</span>
                            </div>
                            <button type="button" class="icon-weather-btn"
                                @click=${() => { const n = { ...chip }; delete n.icon; update(n); }}
                            >Remove</button>
                        </div>`
                    : html`
                        <div class="icon-combo">
                            <ha-form style="flex:1;min-width:0" .hass=${this.hass} .data=${{ icon: chip.icon || "" }}
                                .schema=${[{ name: "icon", selector: { icon: {} } }]}
                                .computeLabel=${() => ""}
                                @value-changed=${(e) => { e.stopPropagation(); update({ ...chip, icon: e.detail?.value?.icon || "" }); }}
                            ></ha-form>
                            <button type="button" class="icon-weather-btn"
                                title="Use dynamic weather icon"
                                @click=${() => { update({ ...chip, icon: "weather" }); }}
                            ><ha-icon icon="mdi:weather-partly-cloudy" style="--mdc-icon-size:18px"></ha-icon></button>
                        </div>
                        <div class="composite-helper">The cloud button sets a dynamic icon that matches the current${isFc ? " forecast" : ""} weather condition.</div>`}
            </div>
            <div class="settings-group">
                <div class="settings-group-label">
                    SVG Icon Folder 
                    <a href="https://github.com/shpongledsummer/atmospheric-weather-card#fonts--icons" target="_blank" rel="noopener"
                        style="margin-left:auto;color:var(--primary-color);font-size:var(--awc-e-f-meta);font-weight:400;text-transform:none;letter-spacing:normal;white-space:nowrap;text-decoration:none"
                    >How to add ↗</a>
                </div>
                ${chipForm([{ name: "icon_path", selector: { text: {} } }])}
            </div>
            <div class="chip-toggle-row" style="margin-top:var(--awc-e-s3)">
                <span>Hide icon</span>
                <ha-switch .checked=${chip.disable_icon === true}
                    @change=${(e) => { const n = { ...chip }; if (e.target.checked) n.disable_icon = true; else delete n.disable_icon; update(n); }}
                ></ha-switch>
            </div>
        `;

        const styleContent = html`
            <div class="settings-group">
                <div class="settings-group-label">Chip Layout </div>
                <div class="segmented" role="radiogroup" aria-label="Chip layout">
                    ${[{ value: "inline", label: "Inline" }, { value: "stacked", label: "Stacked" }, { value: "vertical", label: "Vertical" }].map(o => html`
                        <button type="button" role="radio"
                            class=${chip.chip_format === o.value ? "active" : ""}
                            @click=${() => { const n = { ...chip }; if (chip.chip_format === o.value) delete n.chip_format; else n.chip_format = o.value; update(n); }}
                        >${o.label}</button>`)}
                </div>
            </div>
            <div class="settings-group">
                <div class="settings-group-label">Content Alignment </div>
                <div class="segmented" role="radiogroup" aria-label="Content alignment" style="flex-wrap:nowrap">
                    ${[{ value: "start", label: "Left" }, { value: "center", label: "Center" }, { value: "end", label: "Right" }, { value: "spread", label: "Spread" }].map(o => html`
                        <button type="button" role="radio"
                            class=${chip.chip_align === o.value ? "active" : ""}
                            @click=${() => { const n = { ...chip }; if (chip.chip_align === o.value) delete n.chip_align; else n.chip_align = o.value; update(n); }}
                        >${o.label}</button>`)}
                </div>
            </div>
            <div class="settings-group">
                <div class="settings-group-label">Chip Background</div>
                <div class="segmented" role="radiogroup" aria-label="Chip background">
                    ${[{ value: "on", label: "On" }, { value: "off", label: "Off" }].map(o => html`
                        <button type="button" role="radio"
                            class=${((o.value === "off") === (chip.chip_background === false)) ? "active" : ""}
                            @click=${() => { const n = { ...chip }; if (o.value === "off") n.chip_background = false; else delete n.chip_background; update(n); }}
                        >${o.label}</button>`)}
                </div>
            </div>
            <div class="settings-group">
                <div class="settings-group-label">Icon Background </div>
                <div class="segmented" role="radiogroup" aria-label="Icon background">
                    ${[{ value: true, label: "On" }, { value: false, label: "Off" }].map(o => {
                        const isActive = chip.icon_bg === o.value;
                        return html`<button type="button" role="radio" class=${isActive ? "active" : ""}
                            @click=${() => { const n = { ...chip }; if (isActive) delete n.icon_bg; else n.icon_bg = o.value; update(n); }}
                        >${o.label}</button>`;
                    })}
                </div>
            </div>
            <div class="settings-group">
                <div class="settings-group-label">Style</div>
                <div class="chip-color-box">
                    <div class="chip-color-row">
                        <ha-icon icon="mdi:palette-outline" style="--mdc-icon-size:15px;color:var(--secondary-text-color);flex-shrink:0"></ha-icon>
                        <span class="chip-color-label">Background color</span>
                        ${(() => {
                            const raw = (chip.chip_bg_color || "").toString().trim();
                            const m = raw.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/i);
                            let hex = "#ffffff", opacity = 0;
                            if (m) {
                                const r = parseInt(m[1]).toString(16).padStart(2,"0");
                                const g = parseInt(m[2]).toString(16).padStart(2,"0");
                                const b = parseInt(m[3]).toString(16).padStart(2,"0");
                                hex = `#${r}${g}${b}`;
                                opacity = m[4] !== undefined ? parseFloat(m[4]) : 1;
                            } else if (/^#[0-9a-f]{3,8}$/i.test(raw)) {
                                hex = raw.slice(0,7);
                                opacity = 1;
                            }
                            const hasColor = !!raw;
                            const write = (h, o) => {
                                const next = { ...chip };
                                if (!h) { delete next.chip_bg_color; }
                                else if (o >= 1) { next.chip_bg_color = h; }
                                else {
                                    const r = parseInt(h.slice(1,3),16);
                                    const g = parseInt(h.slice(3,5),16);
                                    const b = parseInt(h.slice(5,7),16);
                                    next.chip_bg_color = `rgba(${r},${g},${b},${parseFloat(o.toFixed(2))})`;
                                }
                                update(next);
                            };
                            return html`
                                <input type="color" class="chip-color-swatch"
                                    .value=${hex}
                                    @input=${(e) => write(e.target.value, opacity || 1)}
                                >
                                ${hasColor ? html`
                                    <button type="button" class="chip-color-clear"
                                        title="Clear color"
                                        @click=${() => { const n={...chip}; delete n.chip_bg_color; update(n); }}
                                    ><ha-icon icon="mdi:close" style="--mdc-icon-size:14px"></ha-icon></button>
                                ` : ""}
                            `;
                        })()}
                    </div>
                    ${(() => {
                        const raw = (chip.chip_bg_color || "").toString().trim();
                        if (!raw) return "";
                        const m = raw.match(/^rgba?\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/i);
                        const opacity = m ? parseFloat(m[1]) : (raw ? 1 : 0);
                        const hex = raw.match(/^#[0-9a-f]{3,8}$/i) ? raw.slice(0,7)
                            : (() => { const n=raw.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i); return n?`#${parseInt(n[1]).toString(16).padStart(2,"0")}${parseInt(n[2]).toString(16).padStart(2,"0")}${parseInt(n[3]).toString(16).padStart(2,"0")}`:"#ffffff"; })();
                        const write = (h, o) => {
                            const next = { ...chip };
                            if (o >= 1) { next.chip_bg_color = h; }
                            else {
                                const r = parseInt(h.slice(1,3),16);
                                const g = parseInt(h.slice(3,5),16);
                                const b = parseInt(h.slice(5,7),16);
                                next.chip_bg_color = `rgba(${r},${g},${b},${parseFloat(o.toFixed(2))})`;
                            }
                            update(next);
                        };
                        return html`
                            <div class="chip-color-opacity-row">
                                <span class="chip-color-opacity-label">Opacity</span>
                                <input type="range" min="0" max="1" step="0.05"
                                    class="chip-color-opacity"
                                    .value=${String(opacity)}
                                    @input=${(e) => write(hex, parseFloat(e.target.value))}
                                >
                                <span class="chip-color-opacity-val">${Math.round(opacity*100)}%</span>
                            </div>
                        `;
                    })()}
                </div>
                <div class="css-field-row cols-2" style="margin-top:var(--awc-e-s2)">
                    ${cssField("chip_padding", CHIP_LABELS.chip_padding, "auto")}
                </div>
                <div class="css-field-row cols-2">
                    ${cssField("font_size", CHIP_LABELS.font_size, "auto")}
                    ${cssField("name_font_size", CHIP_LABELS.name_font_size, "auto")}
                </div>
                <div class="css-field-row cols-2">
                    ${cssField("icon_size", "Icon size", "auto")}
                    ${cssField("icon_padding", "Icon padding", "auto")}
                </div>
                <div class="css-field-row cols-2">
                    ${cssField("inner_gap", CHIP_LABELS.inner_gap, "auto")}
                    ${cssField("width", CHIP_LABELS.width, "e.g. 200px")}
                </div>
            </div>
        `;

        const ANCHORS = ["top-left","top-center","top-right","left","center","right","bottom-left","bottom-center","bottom-right"];
        const currentAnchor = chip.position_anchor || "top-left";

        const freeSection = html`
            <div class="free-mode-box">
                <div class="free-mode-row">
                    <div class="free-mode-label">
                        <ha-icon icon="mdi:cursor-move" style="--mdc-icon-size:14px;color:var(--primary-color)"></ha-icon>
                        Free positioning
                    </div>
                    <ha-switch .checked=${isFree}
                        @change=${(e) => {
                            const n = { ...chip };
                            if (e.target.checked) {
                                n.position = "custom";
                                if (!n.position_anchor) n.position_anchor = "top-left";
                            } else {
                                ["position","position_anchor","position_x","position_y"].forEach(k => delete n[k]);
                            }
                            update(n);
                        }}
                    ></ha-switch>
                </div>
                ${isFree ? html`
                    <div class="free-pos-subpanel">
                        <div class="free-pos-layout">
                            <div>
                                <div class="settings-group-label">Position</div>
                                <div class="anchor-grid" role="radiogroup" aria-label="Position">
                                    ${ANCHORS.map(v => html`
                                        <button type="button" role="radio"
                                            class="anchor-cell ${currentAnchor === v ? "active" : ""}"
                                            title=${v} aria-label=${v}
                                            @click=${() => update({ ...chip, position_anchor: v })}
                                        ></button>`)}
                                </div>
                            </div>
                            <div>
                                <div class="settings-group-label">Offset</div>
                                <div class="offset-fields">
                                    <div class="offset-field">
                                        <span class="offset-field-label">X</span>
                                        <input type="text" placeholder="0"
                                            .value=${String(chip.position_x || "")}
                                            @change=${(e) => { const n = { ...chip }; const v = e.target.value.trim(); if (v) n.position_x = v; else delete n.position_x; update(n); }}
                                        >
                                    </div>
                                    <div class="offset-field">
                                        <span class="offset-field-label">Y</span>
                                        <input type="text" placeholder="0"
                                            .value=${String(chip.position_y || "")}
                                            @change=${(e) => { const n = { ...chip }; const v = e.target.value.trim(); if (v) n.position_y = v; else delete n.position_y; update(n); }}
                                        >
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ""}
            </div>
        `;

        const body = html`
            ${typePicker}
            ${entitySection}
            ${emptyNudge}
            ${fcWarning}
            ${accordion("settings", "Settings",   settingsContent)}
            ${accordion("icon",     "Icon",       iconContent)}
            ${accordion("style",    "Style",      styleContent)}
            ${accordion("action",   "Tap Action", html`<div class="settings-group">${chipForm([{ name: "tap_action", selector: { ui_action: {} } }])}</div>`)}
            ${freeSection}
        `;

        const badge = isFree
            ? html`<span class="chip-badge-free"><ha-icon icon="mdi:cursor-move"></ha-icon></span>`
            : html`<span class="chip-badge-row"><ha-icon icon="mdi:view-grid-outline"></ha-icon></span>`;

        return this._renderListRow({
            idx, total, expanded, body, badge,
            title: this._chipTitle(chip),
            onToggle:    () => this._toggleChipExpanded(idx),
            onMoveUp:    () => this._moveChip(idx, -1),
            onMoveDown:  () => this._moveChip(idx, 1),
            onDuplicate: () => this._duplicateChip(idx),
            onRemove:    () => this._removeChip(idx)
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

    _renderChipsEditor() {
        const c = this._formData;
        const list = this._getChips();

        let layout = (c.chips_layout || "wrap").toString().toLowerCase();
        if (layout === "scroll") layout = "horizontal-scroll";
        const isGrid   = layout === "grid";
        const isScroll = layout === "horizontal-scroll" || layout === "vertical-scroll";
        const align    = (c.chips_align || "start").toString().toLowerCase();
        const chipFormat = (c.chip_format || "inline").toString().toLowerCase();

        const bgStyle = c.background_style || "frosted";
        const bgActive = !!c.chips_background;

        const sf = (key, label, placeholder) => html`
            <div class="css-field">
                <span class="css-field-label">${label}</span>
                <input type="text" placeholder=${placeholder}
                    .value=${String(c[key] || "")}
                    @change=${(e) => this._updateField(key, e.target.value || "")}
                >
            </div>`;

        const containerContent = html`
            <div class="settings-group" style="margin-top:0">
                <div class="settings-group-label">Chips Container Position &amp; Size</div>
                <div class="chips-pos-align-row">
                    ${this._renderPositionGrid("chips_position", POSITION_GRIDS.chips_position)}
                    <div class="css-field-row cols-2" style="margin-top:0;align-self:start">
                        <div class="css-field">
                            <span class="css-field-label">${LABELS.chips_width}</span>
                            <input type="text" placeholder="auto"
                                .value=${String(c.chips_width || "")}
                                @change=${(e) => this._updateField("chips_width", e.target.value || "")}
                            >
                        </div>
                        <div class="css-field">
                            <span class="css-field-label">${LABELS.chips_height}</span>
                            <input type="text" placeholder="auto"
                                .value=${String(c.chips_height || "")}
                                @change=${(e) => this._updateField("chips_height", e.target.value || "")}
                            >
                        </div>
                    </div>
                </div>
            </div>

            <div class="settings-group">
                <div class="settings-group-label">
                    Chip Container Layout 
                </div>
                <div class="segmented" role="radiogroup" aria-label="Layout">
                    ${OPT.chips_layout.map(o => html`
                        <button type="button" role="radio"
                            class=${layout === o.value ? "active" : ""}
                            @click=${() => this._setChipsLayout(o.value)}
                        >${o.label}</button>`)}
                </div>
                ${isGrid ? this._renderForm([{ name: "chips_columns", selector: { number: { mode: "slider", min: 1, max: 12, step: 1 } } }]) : ""}
                ${isScroll ? html`
                    ${this._renderForm([{ name: "chips_visible", selector: { number: { mode: "slider", min: 1, max: 10, step: 1 } } }])}
                    ${this._renderToggleGroup([{ key: "chips_full_width", label: LABELS.chips_full_width }])}
                ` : ""}
            </div>

            <div class="settings-group">
                <div class="settings-group-label">Spacing</div>
                <div class="css-field-row cols-2">
                    ${sf("chip_gap", LABELS.chip_gap, "8px")}
                    ${sf("chips_container_padding", LABELS.chips_container_padding, "0")}
                </div>
            </div>
        `;

        const chipsContent = html`
            <div class="settings-group" style="margin-top:0">
                <div class="settings-group-label">Chip Layout</div>
                <div class="segmented" role="radiogroup" aria-label="Chip style">
                    ${[{ value: "inline", label: "Inline" }, { value: "stacked", label: "Stacked" }, { value: "vertical", label: "Vertical" }].map(o => html`
                        <button type="button" role="radio"
                            class=${chipFormat === o.value ? "active" : ""}
                            @click=${() => this._updateField("chip_format", o.value)}
                        >${o.label}</button>`)}
                </div>
            </div>

            <div class="settings-group">
                <div class="settings-group-label">Chip Content Alignment</div>
                <div class="segmented" role="radiogroup" aria-label="Chip content alignment" style="flex-wrap:nowrap">
                    ${OPT.chips_align.map(o => html`
                        <button type="button" role="radio"
                            class=${align === o.value ? "active" : ""}
                            @click=${() => this._updateField("chips_align", o.value)}
                        >${o.label}</button>`)}
                </div>
            </div>

            <div class="settings-group">
                <div class="settings-group-label">Chip Background</div>
                <div class="segmented" role="radiogroup" aria-label="Background">
                    <button type="button" role="radio" class=${!bgActive ? "active" : ""}
                        @click=${() => { this._updateField("chips_background", false); }}
                    >Off</button>
                    ${[{ value: "frosted", label: "Frosted" }, { value: "contrast", label: "Contrast" }, { value: "theme", label: "Theme" }].map(o => html`
                        <button type="button" role="radio"
                            class=${bgActive && bgStyle === o.value ? "active" : ""}
                            @click=${() => { this._updateField("chips_background", true); this._updateField("background_style", o.value); }}
                        >${o.label}</button>`)}
                </div>
                ${this._renderToggleGroup([
                    { key: "chips_grouped", label: LABELS.chips_grouped },
                    { key: "chips_separator", label: LABELS.chips_separator }
                ])}
            </div>

            <div class="settings-group">
                <div class="settings-group-label">Chip Icon Background</div>
                <div class="segmented" role="radiogroup" aria-label=${LABELS.chip_icon_bg}>
                    ${[{ value: undefined, label: "Default" }, { value: true, label: "On" }, { value: false, label: "Off" }].map(o => html`
                        <button type="button" role="radio"
                            class=${(c.chip_icon_bg === o.value || (o.value === undefined && c.chip_icon_bg === undefined)) ? "active" : ""}
                            @click=${() => this._updateField("chip_icon_bg", o.value === undefined ? "" : o.value)}
                        >${o.label}</button>`)}
                </div>
            </div>

            <div class="settings-group">
                <div class="settings-group-label">Chip Dimensions</div>
                <div class="css-field-row cols-2">
                    ${sf("chips_font_size", LABELS.chips_font_size, "auto")}
                    ${sf("chips_name_font_size", LABELS.chips_name_font_size, "auto")}
                </div>
                <div class="css-field-row cols-2">
                    ${sf("chip_icon_width", LABELS.chip_icon_width, "auto")}
                    ${sf("chip_icon_padding", LABELS.chip_icon_padding, "auto")}
                </div>
                <div class="css-field-row cols-2">
                    ${sf("chip_inner_gap", LABELS.chip_inner_gap, "6px")}
                    ${sf("chips_padding", LABELS.chips_padding, "auto")}
                </div>
            </div>
        `;

        return html`
            <div class="section-box no-pad">
                <div class="sensor-list">
                    ${list.map((chip, idx) => this._renderChipRow(chip, idx, list.length))}
                </div>
                <button type="button" class="add-card-btn" @click=${this._addChip}>
                    <ha-icon icon="mdi:plus"></ha-icon>
                    <span>Add chip</span>
                </button>
            </div>

            ${this._renderDisclosure("Chips Container", containerContent)}
            ${this._renderDisclosure("Chip Style", chipsContent)}

            <div class="fc-box" style="margin-top:var(--awc-e-s3);background:rgba(var(--rgb-primary-text-color,0,0,0),0.03)">
                <div style="display:flex;align-items:center;gap:var(--awc-e-s2);font-size:var(--awc-e-f-meta);color:var(--secondary-text-color)">
                    <ha-icon icon="mdi:lightbulb-outline" style="--mdc-icon-size:16px;flex-shrink:0"></ha-icon>
                    <span>SVG icons: <a href="https://github.com/shpongledsummer/atmospheric-weather-card#fonts--icons" target="_blank" rel="noopener" style="color:var(--primary-color)">How to add them</a></span>
                </div>
            </div>
        `;
    }

    render() {
        if (!this.hass || !this._config) return html``;
        const c = this._formData;
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
                            ${this._renderForm([{ name: "sun_moon_size", selector: { number: { mode: "slider", min: 20, max: 200, step: 1 } } }])}
                            ${mode === "fixed" ? this._renderSunMoonGrid() : ""}
                            ${mode === "dynamic_sun" ? this._renderSunMoonGrid("Moon ") : ""}
                        `;
                    })()
                )}
                ${this._renderDisclosure(
                    "Moon Style",
                    this._renderForm([{ name: "moon_style", selector: { select: { mode: "dropdown", options: OPT.moon_style } } }])
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
                    this._renderForm([{ name: "filter", selector: { select: { mode: "dropdown", options: OPT.filter } } }])
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
                ${this._renderDisclosure(
                    "Advanced options",
                    html`
                        ${this._renderToggleGroup([
                            { key: "disable_text",  label: LABELS.disable_text },
                            { key: "square",        label: LABELS.square },
                            ...(!((this._formData.card_style || "") === "standalone") ? [
                                { key: "full_width",          label: LABELS.full_width },
                                { key: "css_mask_vertical",   label: LABELS.css_mask_vertical },
                                { key: "css_mask_horizontal", label: LABELS.css_mask_horizontal }
                            ] : [])
                        ])}
                        ${this._renderForm([{ name: "stack_order", selector: { number: { mode: "slider", min: -10, max: 10, step: 1 } } }])}
                        ${this._renderOffsetPicker()}
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
                                        <div class="section-box" style="margin-top:var(--awc-e-s3)">
                                            <div class="settings-group" style="margin-top:0">
                                                <div class="settings-group-label">Entity</div>
                                                ${this._renderForm([{ name: "top_text_sensor", selector: { entity: {} } }])}
                                            </div>
                                            <div class="settings-group">
                                                <div class="settings-group-label">Position</div>
                                                ${this._renderPositionGrid("top_position", POSITION_GRIDS.top_position)}
                                            </div>
                                            <div class="settings-group">
                                                <div class="settings-group-label">Size &amp; Spacing</div>
                                                <div class="compact-fields" style="margin:0">
                                                    ${this._renderCompactField("top_font_size", "e.g. 3em")}
                                                    ${this._renderCompactField("top_text_padding", "e.g. 8px 14px")}
                                                    ${!c.top_text_sensor || (c.top_text_sensor || "").startsWith("weather.")
                                                        ? this._renderCompactField("top_unit_format", "e.g. °")
                                                        : ""}
                                                </div>
                                            </div>
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
                        ${this._renderImageOffsetPicker()}
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
                            this._renderForm([{ name: "custom_cards_css_class", selector: { text: {} } }])
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
                ${this._renderForm([{ name: "tap_action", selector: { ui_action: {} } }])}
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
