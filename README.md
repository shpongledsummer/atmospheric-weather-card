[![hacs_badge](https://img.shields.io/badge/HACS-Default-41BDF5.svg?style=flat-square)](https://github.com/hacs/integration)
![Contains](https://img.shields.io/badge/Contains-★_Shooting_Stars-333?style=flat-square)

## Atmospheric Weather Card

<img width="400" alt="Image" src="https://github.com/user-attachments/assets/e0781ab6-abee-4783-8ee4-4cd6791cbce7" />


A detail-oriented weather and forecast card.

<br>

## Contents

**Getting Started** · [Installation](#installation) · [Setup](#setup) · [Examples](#examples)

**Customization** · [Appearance](#appearance) · [CSS Variables](#css-variables)

**Guides** · [Chips](#chips) · [Fonts & Icons](#fonts--icons) · [House Image](#custom-house-image)

**Reference** · [Color Mode](#color-mode) · [Performance](#performance)

<br>

> **Note on AI:** I'm using it to speed up what would have taken years manually. I hope the card's quality speaks for itself and shows the experience behind it.

<br>

## Installation

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=shpongledsummer&repository=atmospheric-weather-card&category=plugin)

<details>
<summary><b>Method 1 — HACS (Recommended)</b></summary>

<br>

1. Open **HACS** in Home Assistant.
2. Navigate to the **Frontend** section.
3. Click the **Explore & Download Repositories** button (or the `+` icon).
4. Search for **Atmospheric Weather Card**.
5. Click **Download**.
6. Reload your dashboard.

</details>

<details>
<summary><b>Method 2 — Manual</b></summary>

<br>

[![Open your Home Assistant instance and navigate to your lovelace resources.](https://my.home-assistant.io/badges/lovelace_resources.svg)](https://my.home-assistant.io/redirect/lovelace_resources/)

1. Download `atmospheric-weather-card.js` from the latest release.
2. Place the file in your `config/www/` folder.
3. Navigate to **Settings** → **Dashboards** → **⋮** → **Resources**.
4. Add a new resource:
    * **URL:** `/local/atmospheric-weather-card.js`
    * **Type:** JavaScript Module
5. Hard-refresh your browser.

</details>

<br>

## Setup

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **`weather_entity`** | `string` | — | **Required.** Your weather integration entity (e.g., `weather.your_weather_entity`). |
| **`sun_entity`** | `string` | — | **Required.** Tracks the sun to auto-switch between day and night. Without this, the card will default to permanent day. |
| `moon_phase_entity` | `string` | — | *Recommended.* Displays the correct moon phase (e.g., `sensor.moon_phase`). |

> [!IMPORTANT]
> The `sun_entity` controls the timing of the sun and moon. Without it, the card defaults to permanent day. Additionally, card colors change based on your [configuration](#color-mode).

<br>

## Examples

All examples use scrollable chips and you can change and mix the elements as needed.

<br>

<img width="400" alt="Image" src="https://github.com/user-attachments/assets/7081d651-29ef-4a83-a53f-5b40870a6002" />

<details>
<summary><b>Forecast Slider</b></summary>

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.your_weather_entity
sun_entity: sun.sun
moon_phase_entity: sensor.moon_phase
card_style: standalone
card_height: 160px
card_padding: 16px
celestial_size: 50
celestial_alignment: left
celestial_x: "60"
chip_area_position: top-right
chip_text_size: 14px
chip_label_size: 11px
chip_area_layout: horizontal-scroll
chip_area_scroll_count: 3
chip_area_align: center
chip_area_width: 180px
chip_area_height: 100%
chip_padding: 0px
chip_area_padding: 16px
chip_area_gap: 2px
chip_gap: 6px
chip_icon_size: 32px
chip_style: vertical
chip_area_background: true
chip_area_grouped: true
chip_area_separator: true
chip_icon_background_color: rgba(255,255,255,0.55)
card_offset: 40px 0px 40px 0px
chip_icon_background: false
custom_cards_position: bottom-left
perf_fps: 60
perf_cloud_quality: 2
perf_effects: 2
perf_dpr: 2
chips:
  - entity: weather.your_weather_entity
    position: custom
    position_anchor: top-left
    position_y: 16px
    text_size: 32px
    hide_icon: true
    hide_label: true
    attribute: temperature
    background: false
    position_x: 16px
    padding: 0px 8px
    fancy_unit: true
    value_weight: "700"
  - attribute: uv_index
    entity: weather.your_weather_entity
    position: custom
    position_anchor: bottom-left
    position_x: 20px
    position_y: 20px
    style: vertical
    icon_size: 14px
    padding: 6px
    ring_width: 4px
    text_size: 13px
    type: ring
    align: center
    forecast: daily
    hide_icon: true
    label_size: 8px
    ring_gap: 4px
    ring_min: 0
    ring_max: 11
    ring_color: "#ffffff"
    height: 50px
    marquee_speed: 55
    forecast_precision: 1
    name: UV
  - entity: weather.your_weather_entity
    forecast: daily
    attribute: temperature
    icon: weather
    forecast_precision: 0
    icon_path: /local/your-icon-folder/
    unit_format: °
    forecast_show_min: true
    forecast_low_position: below
  - entity: weather.your_weather_entity
    forecast: daily
    attribute: temperature
    forecast_offset: 1
    icon: weather
    forecast_precision: 0
    icon_path: /local/your-icon-folder/
    unit_format: °
    forecast_show_min: true
    forecast_low_position: below
  - entity: weather.your_weather_entity
    forecast: daily
    attribute: temperature
    forecast_offset: 2
    icon: weather
    forecast_precision: 0
    icon_path: /local/your-icon-folder/
    unit_format: °
    forecast_show_min: true
    forecast_low_position: below
  - entity: weather.your_weather_entity
    forecast: daily
    attribute: temperature
    forecast_offset: 3
    icon: weather
    forecast_precision: 0
    icon_path: /local/your-icon-folder/
    unit_format: °
    forecast_show_min: true
    forecast_low_position: below
  - entity: weather.your_weather_entity
    forecast: daily
    attribute: temperature
    forecast_offset: 4
    icon: weather
    forecast_precision: 0
    icon_path: /local/your-icon-folder/
    unit_format: °
    forecast_show_min: true
    forecast_low_position: below
  - entity: weather.your_weather_entity
    forecast: daily
    attribute: temperature
    forecast_offset: 5
    icon: weather
    forecast_precision: 0
    icon_path: /local/your-icon-folder/
    unit_format: °
    forecast_show_min: true
    forecast_low_position: below
grid_options:
  rows: auto

```

</details>

<br>

<img width="400" alt="Image" src="https://github.com/user-attachments/assets/2baaac73-6f13-4803-8961-0665dcae7beb" />

<details>
<summary><b>Featuring Mini-graph</b></summary>

This example embeds a mini-graph-card with a bit of card-mod styling. For extra drama, the large header text is layered behind the weather elements.

<br>

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.your_weather_entity
sun_entity: sun.sun
moon_phase_entity: sensor.moon_phase
card_style: standalone
card_height: 160px
card_padding: 16px
card_square: false
celestial_size: 50
celestial_alignment: left
celestial_x: "50"
celestial_y: 0
chip_area_position: top-right
card_hide_text: false
chip_text_size: 14px
chip_label_size: 12px
chip_area_layout: horizontal-scroll
chip_area_scroll_count: 1
chip_area_width: 160px
chip_padding: 12px 14px 12px 12px
chip_area_padding: 0px
chip_area_gap: 8px
chip_gap: 12px
chip_text_gap: 5px
chip_icon_size: 32px
chip_style: stacked
chip_area_background: true
chip_area_grouped: false
chip_icon_background_color: rgba(255,255,255,0.1)
card_offset: 40px 0px 40px 0px
card_stack_order: 1
chip_icon_background: true
custom_cards_position: bottom-left
perf_fps: 30
perf_cloud_quality: 2
perf_effects: 2
perf_dpr: 2
chips:
  - entity: weather.your_weather_entity
    position: custom
    position_anchor: top-left
    position_y: 16px
    text_size: 36px
    hide_icon: true
    hide_label: true
    attribute: temperature
    background: false
    position_x: 16px
    padding: 0px 8px
    fancy_unit: true
    behind_effects: true
    value_weight: "700"
  - entity: weather.your_weather_entity
    forecast: daily
    attribute: temperature
    forecast_show_min: true
    forecast_precision: 0
    name: Today
    icon: weather
    label_overflow: marquee
    icon_path: /local/your-icon-folder/
  - entity: weather.your_weather_entity
    forecast: daily
    attribute: temperature
    forecast_show_min: true
    forecast_precision: 0
    forecast_offset: 1
    icon: weather
    label_overflow: marquee
    name: Tomorrow
    icon_path: /local/your-icon-folder/
chip_icon_padding: 0px
grid_options:
  rows: auto
custom_cards:
  - type: custom:mini-graph-card
    custom_width: 100%
    entities:
      - entity: sensor.your_temperature_sensor
    show:
      icon: false
      name: false
      state: false
      labels: true
      fill: false
      labels_secondary: true
      points: false
      legend: false
    animate: false
    height: 70
    line_width: 4
    hours_to_show: 24
    points_per_hour: 2
    color_thresholds:
      - value: -10
        color: rgba(84, 136, 199, 0.6)
      - value: -5
        color: rgba(105, 169, 209, 0.6)
      - value: 0
        color: rgba(131, 196, 207, 0.6)
      - value: 5
        color: rgba(156, 217, 198, 0.6)
      - value: 10
        color: rgba(189, 230, 185, 0.6)
      - value: 15
        color: rgba(224, 237, 171, 0.6)
      - value: 20
        color: rgba(242, 219, 145, 0.6)
      - value: 25
        color: rgba(235, 182, 115, 0.6)
      - value: 30
        color: rgba(224, 143, 94, 0.6)
      - value: 35
        color: rgba(214, 100, 84, 0.6)
    card_mod:
      style: |
        ha-card {
          z-index: -1 !important;
          border-radius: 0px;
          box-shadow: none;
          background-color: transparent;
        }

        .graph__labels {
            opacity: 1 !important;
            align-items: flex-end !important;
            flex-direction: row-reverse !important;
            margin: 0px 14px 0px 0px !important;
            padding: 2px 4px !important;
            gap: 8px !important;
            font-size: 12px !important;
            font-weight: 700 !important;
        }

        .graph__labels span {
            background-color: color-mix(in srgb, var(--ha-card-background, var(--card-background-color, var(--primary-background-color))) 20%, transparent) !important;
            backdrop-filter: blur(10px) !important;
            -webkit-backdrop-filter: blur(10px) !important;
            padding: 4px 8px !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            box-shadow: inset 0 1px 2px rgba(0,0,0,0.18), inset 0 -1px 1px rgba(0,0,0,0.10) !important;
            border-radius: calc(var(--ha-card-border-radius, 12px) - 5px) !important;
        }

        .graph__labels span:after {
            content: " °C";
            opacity: 0.6;
        }
```

</details>

<br>

<img width="400" alt="Image" src="https://github.com/user-attachments/assets/b060b527-5d48-42de-8541-16fc4883ce10" />

<details>
<summary><b>Circular Gauge Chip</b></summary>

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.your_weather_entity
sun_entity: sun.sun
moon_phase_entity: sensor.moon_phase
card_style: standalone
card_height: 120px
card_padding: 16px
celestial_size: 50
celestial_alignment: center
chip_area_position: bottom-left
chip_text_size: 12px
chip_label_size: 8px
chip_area_layout: horizontal-scroll
chip_area_scroll_count: 1
chip_area_align: center
chip_area_width: 160px
chip_padding: 0px
chip_area_padding: 0px
chip_area_gap: 8px
chip_gap: 6px
chip_text_gap: 4px
chip_icon_size: 22px
chip_style: vertical
chip_area_background: true
chip_icon_background_color: rgba(255,255,255,0.55)
chip_icon_background: false
custom_cards_position: bottom-left
perf_fps: 30
perf_cloud_quality: 2
perf_effects: 2
perf_dpr: 2
chips:
  - entity: weather.your_weather_entity
    position: custom
    position_anchor: top-left
    position_y: 16px
    text_size: 30px
    hide_icon: true
    hide_label: true
    attribute: temperature
    background: false
    position_x: 16px
    padding: 0px 8px
    behind_effects: true
    fancy_unit: true
    value_weight: "700"
  - attribute: precipitation_probability
    entity: weather.your_weather_entity
    style: vertical
    icon_size: 16px
    padding: 12px
    ring_width: 6px
    type: ring
    align: center
    forecast: daily
    name: Rain
    ring_gap: 6px
    ring_min: 0
    ring_max: 100
    ring_threshold_mode: gradient
    ring_thresholds:
      - value: 0
        color: rgba(142, 164, 188, 0.9)
      - value: 10
        color: rgba(119, 149, 180, 0.9)
      - value: 20
        color: rgba(96, 134, 172, 0.9)
      - value: 30
        color: rgba(74, 118, 163, 0.9)
      - value: 40
        color: rgba(87, 133, 161, 0.9)
      - value: 50
        color: rgba(68, 126, 156, 0.9)
      - value: 60
        color: rgba(50, 119, 151, 0.9)
      - value: 70
        color: rgba(102, 107, 153, 0.9)
      - value: 80
        color: rgba(86, 88, 138, 0.9)
      - value: 90
        color: rgba(70, 69, 122, 0.9)
    marquee_speed: 55
    forecast_offset: 0
    position: custom
    position_anchor: top-right
    position_x: 16px
    position_y: 16px
    forecast_precision: 0
    height: 78px
  - forecast: daily
    attribute: temperature
    entity: weather.your_weather_entity
    style: inline
    icon: weather
    icon_path: /local/your-icon-folder/
    padding: 6px 10px
    text_size: 13px
    label_size: 13px
    text_gap: 4px
    name: Today
    value_weight: "600"
    overflow: marquee
    label_overflow: ellipsis
    forecast_show_min: true
  - forecast: daily
    attribute: temperature
    forecast_offset: 1
    entity: weather.your_weather_entity
    style: inline
    icon: weather
    icon_path: /local/your-icon-folder/
    padding: 6px 10px
    text_size: 13px
    label_size: 13px
    text_gap: 4px
    value_weight: "600"
    name: Tomorrow
    overflow: marquee
    label_overflow: ellipsis
    forecast_show_min: true
grid_options:
  rows: auto

```

<br>

</details>

<br>

<br>

## Appearance

The card has a visual editor that helps you set up different layouts. For those who prefer YAML, here are all the possible settings and features: 

<details>
<summary><strong>Card Style & Layout</strong></summary>

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `card_style` | `string` | `immersive` | Set to `standalone` for a solid background with dynamic weather visuals, or `immersive` for a transparent background. |
| `card_height` | `number` · `string` | `200` | Height in pixels. Numbers are automatically treated as px (e.g., `110` becomes `110px`). **Set to `auto`** to dynamically fill the available height (for grid layouts). |
| `card_padding` | `string` | `16px` | Inner padding around the text. Accepts any CSS padding value (e.g., `8px`, `12px 20px`). |
| `card_square` | `boolean` | `false` | Forces the card into a perfect square. Highly useful for grid layouts. |
| `card_full_width` | `boolean` | `false` | Stretches the card edge-to-edge by removing side margins. |
| `card_offset` | `string` | `0px` | Shifts the card using CSS margin (e.g., `"-50px 0px 0px 0px"`). Useful when layering cards. |
| `card_stack_order` | `number` | *auto* | Manually sets the z-index (e.g., `1`, `0`, `-1`). Useful for forcing an immersive card to display in front of cards with solid backgrounds. |
| `card_tap_action` | `object` | — | A standard Home Assistant [tap action](https://www.home-assistant.io/dashboards/actions/). |

</details>

<details>
<summary><strong>Theme & Filters</strong></summary>

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `card_color_mode` | `string` | `auto` | Controls the card's color scheme. By default, it follows your Home Assistant theme. Set to `entity` to follow a `theme_entity`, or `force_dark` / `force_light` to lock the look. Also accepts `night` / `day` to override the sky content. See [Colors](#color-mode). |
| `card_filter` | `string` | — | Applies a visual filter preset to the weather canvas. Options: `darken`, `vivid`, `muted`, `warm`. |
| `celestial_moon_style` | `string` | `default` | The moon's glow color. `default` follows the theme (muted blue in light mode, white in dark mode). Other options: `blue`, `yellow`, `purple`, `grey`. |
| `card_mask_vertical` | `boolean` | `true` | *(Immersive only)* Fades the top and bottom edges. Set to `false` to disable. |
| `card_mask_horizontal` | `boolean` | `true` | *(Immersive only)* Fades the left and right edges. Set to `false` to disable. |
| `theme_entity` | `string` | — | Drives the card's color scheme from any entity's state instead of your HA theme. Commonly set to `sun.sun` to sync the card with sunrise/sunset. See [Colors](#color-mode). |

</details>

<details>
<summary><strong>Sun & Moon</strong></summary>

The sun and moon share a single position and the card swaps them based on your `sun_entity`. See [Colors](#color-mode) for the full details. The card also automatically generates a dynamic **sunrise and sunset effect** based on the sun's elevation, and **rotates the moon** accurately based on your Home Assistant latitude setting.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `celestial_size` | `number` | *auto* | Overrides the sun/moon diameter in pixels. |
| `celestial_position` | `string` | `fixed` | How the sun and moon are positioned. `fixed` uses the `celestial_alignment`, `celestial_x`, and `celestial_y` values. `dynamic_sun` animates the sun across the sky following the real solar arc (moon stays fixed). `dynamic_both` animates both the sun and the moon. |
| `celestial_alignment` | `string` | `top-left` | Where the sun and moon anchor inside the card. Same 9-cell grid as `top_text_position` (e.g., `top-left`, `center`, `bottom-right`). Also accepts `left`, `right` as shorthand. |
| `celestial_x` | `number` | `0` | Horizontal offset in pixels from the anchored position. |
| `celestial_y` | `number` | `0` | Vertical offset in pixels from the anchored position. |

</details>

<details>
<summary><strong>Chips</strong></summary>

Each chip can display either live entity data or forecast data, and you can define as many as you want. Every chip has its own entity, optional icon, label, width, overflow behavior, and tap action. The row layout controls whether they wrap, scroll horizontally, or sit in a fixed grid.

For a more detailed walkthrough — including how to set up forecast chips, per-chip styling, and free positioning — see the [Chips guide](#chips).

<details>
<summary><strong>Row options</strong></summary>

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `chips` | `list` | — | The list of chips to display. Each entry is an object with its own settings (see below). |
| `chip_area_position` | `string` | `bottom-left` | Where the chips row is positioned. |
| `chip_area_layout` | `string` | `wrap` | Row behavior. `wrap` moves overflowing chips to a new line, `horizontal-scroll` keeps them on one line with a hidden scrollbar and edge fades, `vertical-scroll` stacks them in a scrollable column, `grid` arranges them in equal columns. `scroll` is accepted as an alias for `horizontal-scroll`. |
| `chip_area_columns` | `number` | `3` | Number of equal-width columns when `chip_area_layout: grid` is active. |
| `chip_area_align` | `string` | `start` | How each chip aligns inside its grid cell. Options: `start`, `center`, `end`. Grid layout only. |
| `chip_area_width` | `string` | — | Limits the full row width (e.g., `60%` or `200px`). Useful to place the chips row next to the top text instead of spanning the card. |
| `chip_area_height` | `string` | — | Sets the height of the chips row (e.g., `120px`). |
| `chip_padding` | `string` | `5px 10px` | Inner padding of each chip (e.g., `5px 10px`). |
| `chip_area_padding` | `string` | — | Padding of the outer chips container (the wrapper around all chips). |
| `chip_area_gap` | `string` | `8px` | Space between chips. |
| `chip_gap` | `string` | `6px` | Space between the icon and text inside each chip. |
| `chip_style` | `string` | `inline` | Controls the chip layout style. `inline` is the default horizontal layout with icon and text side by side. `stacked` arranges the icon, name, and value in a compact two-column grid. `vertical` stacks icon, name, and value in a centered column. |
| `chip_area_scroll_count` | `number` | — | Number of chips visible at once when using a scroll layout. Enables snap-scrolling through pages of chips. |
| `chip_area_grouped` | `boolean` | `false` | Wraps all chips into a single shared background container instead of styling each chip individually. Requires `chip_area_background: true`. |
| `chip_area_full_width` | `boolean` | `false` | Stretches each chip to fill the available row width. Useful in combination with `chip_area_scroll_count` or grid layouts. |
| `chip_text_size` | `string` | — | Font size of the chip value text. Accepts any CSS size value (e.g., `16px`, `1.2em`). |
| `chip_label_size` | `string` | — | Font size of the chip name label. |
| `chip_icon_size` | `string` | — | Global icon size for all chips. |
| `chip_icon_padding` | `string` | — | Global padding around the icon for all chips. |
| `chip_icon_background` | `boolean` | `false` | Adds a background behind the icon area of each chip. |
| `chip_area_background` | `boolean` | `false` | Adds a styled background behind each chip (the style is controlled by `card_background_style`). |
| `chip_area_separator` | `boolean` | `false` | Adds a thin divider line between chips. Only visible when `chip_area_grouped` is enabled. |
| `chip_background_color` | `string` | — | Custom background color applied to all chips. Accepts any CSS color value, including `rgba()`. |
| `chip_icon_background_color` | `string` | — | Custom background color for the icon area of all chips. |
| `chip_area_background_color` | `string` | — | Custom background color for the grouped container when `chip_area_grouped` is enabled. |
| `chip_text_gap` | `string` | `0.35em` | Gap between the name label and the value text inside each chip. |
| `chip_area_hide` | `boolean` | `false` | Hides the chips row entirely. |

</details>

<details>
<summary><strong>Per-chip options</strong></summary>

Each entry inside the `chips` list accepts the following keys.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `entity` | `string` | — | **Required.** Any sensor, binary_sensor, or weather entity. Pointing it at the weather entity shows the current state (e.g., `Sunny`). |
| `attribute` | `string` | — | Read a specific attribute of the entity instead of its state (e.g., `humidity` on a weather entity). |
| `forecast` | `string` | — | Set to `daily` or `hourly` to show forecast data instead of live entity data. The chip's name is generated automatically (day names for daily, time for hourly). Requires the entity to be a weather entity. |
| `forecast_offset` | `number` | `0` | Which forecast entry to display. `0` = today/now, `1` = tomorrow/next hour, and so on. Daily goes up to 6, hourly up to 23. |
| `forecast_precision` | `number` | — | Number of decimal places for forecast values (0–2). |
| `forecast_show_min` | `boolean` | `false` | Shows the low/high temperature range (e.g., `8 – 18`) instead of only the high. Only works with `attribute: temperature` on daily forecasts. |
| `unit_format` | `string` | — | Replaces the unit shown after the value. Placed directly after the value with no space, e.g. `°` turns `12 °C` into `12°`. |
| `name` | `string` | — | Optional label shown before the value (e.g., `Wind`). For forecast chips, this overrides the auto-generated day/time name. |
| `icon` | `string` | *auto* | An `mdi:` icon (e.g., `mdi:water-percent`), the keyword `weather` to automatically show the icon matching the current weather state (or the forecasted condition when using `forecast`), or empty to inherit the sensor's own icon. |
| `icon_path` | `string` | — | Folder for custom SVG icons (e.g., `/local/weather-icons/`). When set, the value of `icon` resolves to an image file instead of an MDI icon. For example, `icon: weather` combined with `icon_path: /local/weather-icons/` loads `/local/weather-icons/rainy.svg` for rainy weather. You can find the animated SVG icons from the examples [here](https://github.com/basmilius/weather-icons). |
| `hide_icon` | `boolean` | `false` | Hides the icon for this chip. |
| `hide_label` | `boolean` | `false` | Hides the name label for this chip. |
| `hide_value` | `boolean` | `false` | Hides the value text for this chip. |
| `fancy_unit` | `boolean` | `false` | Renders the temperature unit as a small superscript next to the value. Only works when reading a `temperature` attribute from a weather entity. |
| `width` | `string` | — | Limits the chip's width (e.g., `60%` or `200px`). Required for marquee overflow. |
| `overflow` | `string` | `ellipsis` | How text exceeding `width` is handled. Options: `ellipsis` (cuts off with `…`), `clip` (cuts off without indicator), `wrap` (breaks onto a second line), `marquee` (scrolls horizontally). |
| `label_overflow` | `string` | `ellipsis` | How the name label handles overflow. Same options as `overflow`. |
| `marquee_speed` | `number` | `30` | Scroll speed in pixels per second when `overflow: marquee` is active. Minimum `5`. |
| `marquee_rtl` | `boolean` | `false` | Reverses the marquee direction (scrolls right-to-left). |
| `card_tap_action` | `object` | `more-info` | A standard Home Assistant [tap action](https://www.home-assistant.io/dashboards/actions/) scoped to this chip. |
| `name_sensor` | `string` | — | An entity whose state (or attribute) is used as the chip's dynamic name label. Updates in real time. |
| `name_attribute` | `string` | — | Reads a specific attribute from the `name_sensor` entity instead of its state. |
| `position` | `string` | — | Set to `custom` to detach this chip from the row and place it freely on the card using `position_anchor`, `position_x`, and `position_y`. |
| `position_anchor` | `string` | `top-left` | Anchor point for a free-positioned chip. Same 9-cell grid as `top_text_position`. |
| `position_x` | `string` | `0` | Horizontal offset for a free-positioned chip (e.g., `20px`, `10%`). |
| `position_y` | `string` | `0` | Vertical offset for a free-positioned chip (e.g., `20px`, `10%`). |
| `behind_effects` | `boolean` | `false` | Places the chip behind the weather animations. Only works on free-positioned chips. |
| `forecast_low_position` | `string` | — | Where to show the low temperature when `forecast_show_min` is active. `beside` places it inline (e.g., `8 – 18`). `below` renders it on a second line under the high. |

</details>

<details>
<summary><strong>Per-chip style overrides</strong></summary>

Every chip can override the global row styles individually. This is what makes it possible to mix completely different-looking chips in a single card — for example, a large stacked forecast chip next to a small inline live sensor.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `chip_style` | `string` | — | Overrides the global `chip_style` for this chip. Accepts `inline`, `stacked`, or `vertical`. |
| `background` | `boolean` | — | Overrides the global `chip_area_background` for this chip. Set to `false` to hide the background on a specific chip even when backgrounds are globally enabled (or the other way around). |
| `background_color` | `string` | — | Custom background color for this chip. Accepts any CSS color value, including `rgba()` for transparency. |
| `padding` | `string` | — | Overrides the chip padding for this chip only. |
| `text_size` | `string` | — | Overrides the value text size for this chip. |
| `label_size` | `string` | — | Overrides the name label text size for this chip. |
| `inner_gap` | `string` | — | Overrides the icon/text gap for this chip. |
| `icon_size` | `string` | — | Overrides the icon size for this chip. |
| `icon_padding` | `string` | — | Overrides the icon padding for this chip. |
| `icon_background` | `boolean` | — | Overrides the global `chip_icon_background` for this chip. |
| `icon_background_color` | `string` | — | Custom background color for the icon area. Accepts any CSS color value, including `rgba()`. |
| `align` | `string` | — | Content alignment within this chip. Options: `start`, `center`, `end`. |
| `value_weight` | `string` | — | Font weight of the value text (e.g., `500`, `600`, `700`). |
| `text_gap` | `string` | — | Overrides the gap between the name label and value for this chip. |
| `chip_round` | `boolean` | `false` | Forces a fully rounded (pill) shape on this chip. |

</details>

**Basic example**

```yaml
chips:
  - entity: weather.your_weather_entity
    icon: weather
  - entity: sensor.outside_humidity
    name: Humidity
  - entity: sensor.wind_speed
    icon: mdi:weather-windy
```

</details>

<details>
<summary><strong>Custom Images</strong></summary>

You can add your own images (such as a house image) to the card. This works in both standalone and immersive modes. See the [Custom House Image](#custom-house-image) tutorial for a step-by-step guide.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `image_day` | `string` | — | File path for the daytime image (e.g., `/local/house-day.png`). |
| `image_night` | `string` | — | File path for the nighttime image. Falls back to the day image if left empty. |
| `image_scale` | `number` | `100` | Image size as a percentage of the total card height. |
| `image_alignment` | `string` | `top-right` | Image placement. Options: `center`, `top-right`, `top-left`, `top-center`, `bottom`, `bottom-center`, `bottom-left`, `bottom-right`. |
| `status_entity` | `string` | — | An entity to monitor (e.g., a door sensor). See [Smart Status Entity](#smart-status-entity). |
| `status_day` | `string` | — | The day image to display when the status entity becomes active. |
| `status_night` | `string` | — | The night image to display when the status entity becomes active. |

</details>

<details>
<summary><strong>Embedded Cards</strong></summary>

You can embed other Home Assistant cards directly inside this card. This is useful for adding buttons, specific sensors, weather forecasts, graphs and more.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `custom_cards` | `list` | — | A list of cards to display. You can use standard Home Assistant cards or custom ones. |
| `custom_cards_position` | `string` | `bottom` | Where to place the container holding your custom cards (e.g., `bottom`, `top`, `bottom-right`). |
| `custom_cards_css_class` | `string` | — | Assigns a custom CSS class to the container, making it easy to style with `card_mod`. |
| `custom_width` | `string` | — | *Used directly on the nested cards.* Forces a specific width for an individual card (e.g., `100%`, `50px`). |
| `custom_height` | `string` | — | *Used directly on the nested cards.* Forces a specific height for an individual card (e.g., `150px`). |

**Basic Example:**
```yaml
custom_cards_position: bottom
custom_cards:
  - type: weather-forecast
    custom_width: 100%
    entity: weather.your_weather_entity
```

</details>

<a name="css-variables"></a>
<details>
<summary><strong>CSS Variables</strong></summary>

> Most users won't need these. The options above cover all common use cases. These CSS variables are here for fine-tuning specific details like font sizes, shadows, and spacing — either in your theme or via `card_mod`.

<details>
<summary><b>Card Variables</b></summary>

| Variable | Default | Description |
| :--- | :--- | :--- |
| `--awc-card-border-radius` | `12px` | Adjusts the corner radius. |
| `--awc-card-border-width` | *HA theme* | Overrides the card's border width. Inherits from the Home Assistant theme by default. |
| `--awc-card-padding` | `16px` | Padding space around the text. |
| `--awc-canvas-filter` | `none` | Applies a custom CSS filter to the canvas (this overrides the `filter` config option). |
| `--awc-stack-order` | `-1` / `1` | Controls the stacking order (z-index) of the card. Defaults to `-1` for immersive and `1` for standalone. |
| `--awc-custom-cards-direction` | `row` | Flex direction of the custom cards container. |
| `--awc-custom-cards-gap` | `8px` | Gap between items in the custom cards container. |
| `--awc-custom-cards-justify` | `flex-start` | Horizontal justification of the custom cards container. |
| `--awc-custom-cards-align` | `flex-start` | Vertical alignment of the custom cards container. |

</details>

<details>
<summary><b>Text Variables</b></summary>

| Variable | Default | Description |
| :--- | :--- | :--- |
| `--awc-text-day` | `#2c2c2e` | Text color during the daytime. |
| `--awc-text-night` | `#FFFFFF` | Text color during the nighttime. |
| `--awc-text-color` | *auto* | Resolved text color for the current scheme. Overrides both day and night colors at once. |
| `--awc-text-shadow-day` | *soft white glow* | Text shadow effect for daytime. |
| `--awc-text-shadow-night` | *soft dark glow* | Text shadow effect for nighttime. |
| `--awc-text-shadow-active` | *auto* | Resolved text shadow for the current scheme. Overrides both day and night shadows at once. |
| `--awc-chip-text-shadow` | `0 1px 2px rgba(0,0,0,0.35)` | Text shadow applied to the chip name label. |
| `--awc-bottom-font-size` | `clamp(15px, 5cqmin, 26px)` | Chip text size (dynamically responsive). |
| `--awc-bottom-font-weight` | `500` | Chip text weight. |
| `--awc-bottom-gap` | `8px` | Gap between chips in the row. |
| `--awc-bottom-opacity` | `0.7` | Opacity of chips without a background. |
| `--awc-chip-name-weight` | `700` | Font weight of the chip name label. |
| `--awc-chip-name-opacity` | `0.7` | Opacity of the chip name label. |
| `--awc-chip-name-color` | `inherit` | Color of the chip name label. |
| `--awc-chip-gap` | `6px` | Gap between the icon and text inside each chip. |
| `--awc-chips-padding` | `0` (`5px 10px` with background) | Inner padding of each chip. |
| `--awc-row-width` | `calc(100% - padding)` | Width of the chips row. Overrides the `chip_area_width` option. |
| `--awc-row-height` | `auto` | Height of the chips row. Overrides the `chips_height` option. |
| `--awc-row-columns` | `3` | Number of columns when `chip_area_layout: grid` is active. |
| `--awc-row-fade-l` | *auto* | Left edge fade width for the scrolling chip row. |
| `--awc-row-fade-r` | *auto* | Right edge fade width for the scrolling chip row. |
| `--awc-bottom-bg-color` | *auto* | Background color when `chip_area_background` is enabled. Defaults to the active background style. |
| `--awc-bottom-bg-radius` | *card radius* | Border radius for the chip background. |
| `--awc-bottom-bg-filter` | `blur(10px)` | Backdrop filter for the chip background (only used by the `frosted` style). |
| `--awc-bg-shadow` | *auto* | Overrides the shadow used by the `pill` background style. |
| `--awc-bg-border` | `1px solid …` | Overrides the border used by the `frosted` background style. |
| `--awc-icon-size` | `1.1em` | Size of the chip icon. |
| `--awc-icon-drop-shadow` | `drop-shadow(0px 3px 6px rgba(0,0,0,0.3))` | Drop shadow filter applied to custom image icons set via `icon_path`. |
| `--awc-marquee-duration` | `20s` | Animation duration for the marquee overflow mode. Longer = slower. |
| `--awc-marquee-fade` | `12px` | Edge fade width on either side of a marquee chip. |
| `--awc-marquee-separator` | `"•"` | Character inserted between marquee repetitions. |
| `--awc-marquee-sep-gap` | `0.4em` | Padding around the marquee separator character. |

</details>

<details>
<summary><b>Stacked & Vertical Chip Variables</b></summary>

These variables only apply when `chip_style` is set to `stacked` or `vertical`.

| Variable | Default | Description |
| :--- | :--- | :--- |
| `--awc-stacked-icon-bg` | *auto* | Background color of the icon area in stacked/vertical chips. |
| `--awc-stacked-icon-radius` | *auto* | Border radius of the icon area. |
| `--awc-stacked-icon-inset` | `3px` | Inset used to calculate the icon area's border radius relative to the chip's border radius. |
| `--awc-stacked-name-size` | `0.85em` | Font size of the name label in stacked/vertical chips. |
| `--awc-stacked-name-weight` | `500` | Font weight of the name label in stacked/vertical chips. |
| `--awc-stacked-name-tracking` | `0.03em` | Letter spacing of the name label in stacked/vertical chips. |
| `--awc-stacked-name-opacity` | `0.6` | Opacity of the name label in stacked/vertical chips. |
| `--awc-stacked-name-color` | `inherit` | Color of the name label in stacked/vertical chips. |
| `--awc-stacked-value-weight` | `700` | Font weight of the value in stacked/vertical chips. |
| `--awc-stacked-column-gap` | `10px` | Horizontal gap between the icon and text columns in stacked chips. |
| `--awc-stacked-row-gap` | `4px` | Vertical gap between the name and value rows in stacked/vertical chips. |
| `--awc-vertical-icon-gap` | `6px` | Bottom margin of the icon in vertical chips. |

</details>

<details>
  <summary><b>Card Mod Example</b></summary>

  This example shows how you can apply styles to the card using `card_mod`.

  ```yaml
  type: custom:atmospheric-weather-card
  weather_entity: weather.your_weather_entity
  card_mod:
    style: |
      :host {
        --awc-text-day: #ffffff;
        --awc-text-night: #ffffff;
        --awc-text-shadow-day: 0 1px 2px rgba(0, 0, 0, 0.15);
        --awc-text-shadow-night: 0 1px 2px rgba(0, 0, 0, 0.8);
      }
  ```
</details>

</details>

<br>

## Color Mode

The card's look is controlled by two things: your **`sun_entity`**, which handles the sun, moon, and stars in the sky, and your **`card_color_mode`**, which decides whether the card looks light or dark.

<details>
<summary><strong>Here are the ways you can set this up</strong></summary>

<br>

| Mode | Config | What it does |
| :--- | :--- | :--- |
| **Follow your HA theme** | `sun_entity: sun.sun` | The card shows the sun during the day and the moon at night, syncing its colors to whatever your Home Assistant theme is doing. Android and iOS can auto-toggle dark mode based on sunrise and sunset — this is exactly what the card was designed for. |
| **Follow the sun** | `sun_entity: sun.sun`<br>`card_color_mode: entity`<br>`theme_entity: sun.sun` | The card switches between light and dark at the real sunrise and sunset, regardless of what your Home Assistant theme is doing. Its colors match the time of day no matter what the rest of your dashboard looks like. |
| **Force light or dark** | `card_color_mode: force_dark`<br>or `card_color_mode: force_light` | Locks the card's colors to one value. The sky still follows `sun_entity`, so you still get the moon and stars at night — only the card's colors are forced. |
| **Custom logic** | `card_color_mode: entity`<br>`theme_entity: sensor.my_custom_mode` | `theme_entity` can point at any entity — a template sensor, an `input_boolean`, or anything else. The card switches to its dark look when the state is `dark`, `night`, `evening`, `on`, `true`, or `below_horizon`. Anything else counts as light. Useful for rules like "dark after 9pm" or "dark when it's overcast". |

</details>

<br>

## Guides

<a name="chips"></a>
<details>
<summary><b>Chips & Forecasts</b></summary>

Chips are basically buttons you can optionally add to the card. You can add as many as you like and show live info, like current weather conditions or data from any Home Assistant entity, but also weather forecasts. You can leave them grouped in a row and make them all look the same (useful for building a daily forecast), or you can style and position each one individually.

<details>
<summary><strong>Forecast chips</strong></summary>

<br>

By default, a chip reads the current state of its entity. Setting `forecast` to `daily` or `hourly` switches it to forecast mode instead. In this mode, the chip subscribes to the weather entity's forecast data and displays a specific future entry.

Use `forecast_offset` to pick which entry: `0` is today (or now), `1` is tomorrow (or the next hour), and so on. The chip automatically generates a name label — day names like "Mon", "Tue" for daily, or times like "14:00" for hourly. You can still override this with `name` if you want a custom label.

When using `icon: weather` on a forecast chip, the icon matches the **forecasted** condition for that entry, not the current weather.

```yaml
chips:
  - entity: weather.your_weather_entity
    forecast: daily
    attribute: temperature
    forecast_offset: 1
    forecast_show_min: true
    icon: weather
    icon_path: /local/weather-icons/
  - entity: weather.your_weather_entity
    forecast: hourly
    attribute: temperature
    forecast_offset: 3
    unit_format: "°"
```

The first chip shows tomorrow's temperature range (low – high) with a weather icon matching tomorrow's condition. The second chip shows the temperature 3 hours from now, with `°` directly after the value instead of the full unit.

**Forecast-specific options at a glance:**

| Option | What it does |
| :--- | :--- |
| `forecast` | `daily` or `hourly` — switches the chip to forecast mode. |
| `forecast_offset` | Which entry to show (0 = today/now, 1 = tomorrow/+1h, etc.). |
| `forecast_precision` | Decimal places for the value (0–2). |
| `forecast_show_min` | Shows the low/high range. Daily temperature only. |
| `unit_format` | Replaces the unit string (e.g., `°`). Works on both live and forecast chips. |

</details>

<details>
<summary><strong>Per-chip styling</strong></summary>

<br>

Every chip can override the global row styles. This means you can mix different chip formats, backgrounds, sizes, and spacing in one card without needing separate rows or CSS hacks.

For example, you might want most chips to be small inline elements but make one specific forecast chip larger with a stacked layout and its own background color:

```yaml
chip_style: inline
chip_area_background: true
chips:
  - entity: sensor.outside_temperature
  - entity: sensor.humidity
  - entity: weather.your_weather_entity
    forecast: daily
    attribute: temperature
    forecast_offset: 1
    style: stacked
    background_color: "rgba(0, 0, 0, 0.3)"
    padding: 12px 16px
    text_size: 18px
    icon: weather
    icon_path: /local/weather-icons/
```

The first two chips follow the global `inline` style and default background. The third chip overrides everything it needs to look different.

All per-chip style overrides are listed in the [Chips reference table](#appearance) under "Per-chip style overrides".

</details>

<details>
<summary><strong>Free positioning</strong></summary>

<br>

Any chip can be pulled out of the row and placed freely on the card. Set `position: custom` and use the anchor/offset system to put it exactly where you want.

```yaml
chips:
  - entity: sensor.outside_temperature
    position: custom
    position_anchor: top-right
    position_x: 20px
    position_y: 10px
    background: true
```

This places the temperature chip 20px from the right and 10px from the top, independent of where the chips row sits. The `position_anchor` uses the same 9-cell grid as the other position options (`top-left`, `center`, `bottom-right`, etc.).

Free-positioned chips can still use all the same styling and forecast options as regular chips.

</details>

<details>
<summary><strong>Ring gauge</strong></summary>

<br>

Any chip can be turned into a circular gauge by setting `type: ring`. The ring fills proportionally based on the entity's value within a min/max range. This works well for things like battery levels, humidity, CPU usage, or any numeric sensor.

```yaml
chips:
  - entity: sensor.living_room_humidity
    type: ring
    ring_min: 0
    ring_max: 100
    ring_width: 4
    ring_gap: 3
    ring_color: "#03a9f4"
    style: vertical
    hide_label: true
    icon: mdi:water-percent
```

You can add color thresholds that change the ring color when the value passes a certain point. Threshold colors support three modes: `solid` fills the entire ring with the matching threshold color, `segments` draws each threshold range as a separate colored arc, and `gradient` blends smoothly between threshold colors.

```yaml
chips:
  - entity: sensor.cpu_temperature
    type: ring
    ring_min: 30
    ring_max: 100
    ring_color: "#4caf50"
    ring_threshold_mode: solid
    ring_thresholds:
      - value: 60
        color: "#ff9800"
      - value: 80
        color: "#f44336"
```

**Ring-specific options:**

| Option | What it does |
| :--- | :--- |
| `type` | Set to `ring` to enable the ring gauge. |
| `ring_min` | Minimum value for the gauge range (default `0`). |
| `ring_max` | Maximum value for the gauge range (default `100`). |
| `ring_width` | Thickness of the ring stroke in pixels (default `4`). |
| `ring_gap` | Gap between the ring and the chip content in pixels (default `3`). |
| `ring_color` | Color of the filled portion. Accepts any CSS color. Defaults to your theme's primary color. |
| `ring_threshold_mode` | How thresholds are applied. `solid` fills the whole ring with the matched color. `segments` draws each range as a separate arc. `gradient` blends between colors. |
| `ring_thresholds` | A list of `{ value, color }` entries. The ring changes color when the value exceeds a threshold. |

</details>

<br>

</details>

<a name="fonts--icons"></a>
<details>
<summary><b>Fonts & Icons</b></summary>

If you want to use the exact fonts and weather icons from the screenshots in your own setup, here's how.

<details>
<summary><strong>Font family used in the examples</strong></summary>

<br>

The screenshots throughout this README use the **Montserrat** font, which you can download or embed directly from [Google Fonts](https://fonts.google.com/specimen/Montserrat). Once it's loaded into your Home Assistant frontend (for example via a custom theme), it applies to this card along with the rest of your dashboard — the card inherits whatever font your theme sets.

</details>

<details>
<summary><strong>Custom SVG weather icons</strong></summary>

<br>

You can replace the default MDI icons inside a chip with your own animated SVG files. The examples use the set from [basmilius/weather-icons](https://github.com/basmilius/weather-icons).

1. Download the SVG files and place them in a folder under `config/www/`, for example `config/www/weather-icons/`.
2. In your chip config, set `icon` to `weather` and point `icon_path` to that folder:

```yaml
chips:
  - entity: weather.your_weather_entity
    icon: weather
    icon_path: /local/weather-icons/
```

The card then resolves the icon by the current weather state. For example, `rainy` weather loads `/local/weather-icons/rainy.svg`.

</details>

<br>

</details>

<a name="custom-house-image"></a>
<details>
<summary><b>Custom House Image</b></summary>

This explains how to create an image for your own home and use it in the card.

1. **Take a reference photo** from a corner angle to properly capture the depth of the house.
2. **Generate a 3D model** using an AI image tool. Use a prompt similar to:
   > *Isometric view of a modern minimalist architectural model section from the outside on solid white background. [Describe your floors/rooms]. Materials are matte white and light only. No complex textures, studio lighting, very clean, simplified shapes.*
3. **Remove the background** with an online tool or image editor and save the resulting image as a transparent PNG.
4. **Create day and night variants** by adjusting the prompt appropriately.
5. **Upload the files** to your `config/www/images/` directory and reference them in the card config as `/local/images/my-house-day.png`.

<br>

</details>

<br>

## Performance

Fast performance and impressive animations are basically natural enemies when building a card for Home Assistant. Changing even a tiny detail, like how the clouds or stars work, can instantly slow the dashboard down. There were so many times I got an effect looking absolutely perfect, only to realize it was too heavy and had to replace it with a simpler version.

The card uses every trick available to keep things running smoothly. Because of this, almost a third of the code exists purely to keep the card fast. I really dislike how much this adds to the size of the code, but that is just how it is.

Even with all this effort, older setups might still struggle, and the birds may stutter. If that happens, try switching `perf_mode` to `low` — it disables the extra effects and lowers the rendering resolution. You can also fine-tune the frame rate, cloud detail, effects intensity, and canvas sharpness individually.

<details>
<summary><b>View stress test results</b></summary>

<br>

<img width="400" alt="image" src="https://github.com/user-attachments/assets/97eebe8f-4718-4186-8400-cb02605759dc" />

This screenshot shows a 30-second stress test running five weather cards in parallel in my test setup, within a dashboard with lots of other HA cards. Weather states were constantly switched and the UI was heavily interacted with to push the performance.

The blue memory line shows a healthy sawtooth pattern. The browser regularly clears memory and returns to the baseline. The bottom left summary breaks down processor usage. Because the graphics are reused, less than 10 percent of the time was spent rendering and just about 5% was spent actually painting the animations. For roughly 75 percent of the test, the device processor was completely idle. It was a long and hard way to achieve this result.

</details>

<details>
<summary><strong>Performance Settings</strong></summary>

The card has three performance presets — `low`, `default`, and `ultra` — which cover most setups. If you need more control, each setting can be changed individually. Any value set manually overrides the preset.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `perf_mode` | `string` | `default` | Performance preset. `low` disables effects and lowers resolution for weak devices. `default` is balanced. `ultra` raises the frame rate and cloud detail to maximum. |
| `perf_fps` | `number` | `30` | Animation frame rate. `30` saves battery, `60` is smoother. |
| `perf_cloud_quality` | `number` | `1.5` | Cloud detail level. Controls how many puffs each cloud shape gets. `0.5` = low, `1` = medium, `1.5` = high, `2` = ultra. |
| `perf_effects` | `number` | `1` | Weather effects intensity. `0` disables birds, planes, shooting stars, aurora, and wind vapor. `1` enables them at default rates. `2` increases spawn rates for all effects. |
| `perf_dpr` | `number` | `2` | Canvas sharpness. Controls the device pixel ratio used for rendering. `0.5` = low, `1` = medium, `1.5` = high, `2` = full retina. Lower values reduce GPU load on high-DPI screens. |

</details>

<br>

## Support the project

If you enjoy using this card and want to say thanks, a coffee is always appreciated :)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/X8X31WXQHF)
