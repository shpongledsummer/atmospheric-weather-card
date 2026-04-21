[![hacs_badge](https://img.shields.io/badge/HACS-Default-41BDF5.svg?style=flat-square)](https://github.com/hacs/integration)
![GitHub release (latest by date)](https://img.shields.io/github/v/release/shpongledsummer/atmospheric-weather-card?style=flat-square)<br>
![Contains](https://img.shields.io/badge/contains-★_shooting_stars-333?style=flat-square)

## Atmospheric Weather Card

<img width="400" alt="Image" src="https://github.com/user-attachments/assets/2b161780-2d14-4bbf-b620-721ec239cca0" />

A flexible, detail-oriented weather card for Home Assistant. It generates live, animated weather visuals based on your local conditions. You can run it standalone, embed other cards inside it, or use it as an immersive background.

<br>

## Contents

**Getting Started** · [Installation](#installation) · [Usage Modes (examples)](#usage-modes) · [Setup](#setup)

**Customization** · [Appearance](#appearance) · [Color Mode](#color-mode) · [Fonts & Icons](#fonts--icons) · [CSS Reference](#css-reference)

**Guides** · [Custom House Image](#custom-house-image) · [Smart Status Entity](#smart-status-entity) · [Companion Card](#companion-forecast-card)

**Reference** · [Adding Buttons](#adding-buttons) · [Weather States](#weather-states) · [Performance](#performance)

<br>

> **How I use AI here:** I like pretty design and always wanted a nice, visual HA weather card. I strictly use AI in this project for code I actually understand, but would never have the patience or time to write manually.

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

## Usage Modes

You can use either `card_style: standalone` for a self-contained card with dynamic weather backgrounds, or `card_style: immersive` so the card has no background at all and blends into your dashboard.

<br>

### Standalone

<img width="400" alt="Image" src="https://github.com/user-attachments/assets/fe604ab8-bd69-4710-9ec4-bf21d85a1c67" /><br>
<img width="400" alt="Image" src="https://github.com/user-attachments/assets/bea6c454-97bb-4122-851d-5f13b0a7bea1" />

<details>
<summary><b>Example 1 — Basic Card</b></summary>

<br>

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.your_weather_entity
sun_entity: sun.sun
moon_phase_entity: sensor.moon_phase
theme_entity: sun.sun
card_style: standalone
card_height: 140px
card_padding: 20px
top_position: left
chips_position: bottom-left
sun_moon_size: 50
sun_moon_x_position: -70
sun_moon_y_position: center
top_font_size: 34px
chips_font_size: 16px
top_text_background: false
chips_background: true
background_style: pill
chips:
  - entity: weather.your_weather_entity
    icon: weather
tap_action:
  action: more-info
  entity: weather.your_weather_entity
```

</details>


<details>
<summary><b>Example 2 — Chip Cards</b></summary>

<br>
<img width="400" alt="Image" src="https://github.com/user-attachments/assets/f5b0afbb-8f88-4a28-8cbc-34007c3d29c6" />

<br>

<details>
<summary><b>View YAML</b></summary>

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.your_weather_entity
sun_entity: sun.sun
moon_phase_entity: sensor.moon_phase
card_style: standalone
card_height: 120px
card_padding: 20px
sun_moon_size: 50
celestial_position: fixed
sun_moon_x_position: "100"
sun_moon_y_position: center
top_position: top-left
chips_position: right
top_font_size: 40px
top_text_padding: 8px
chips_font_size: 14px
chips_width: 70%
chips_padding: 8px 12px
chips_gap: 8px
chips_background: true
background_style: pill
chips:
  - entity: weather.your_weather_entity
    attribute: wind_speed
  - entity: weather.your_weather_entity
    attribute: humidity
  - entity: weather.your_weather_entity
    icon: weather
  - entity: weather.your_weather_entity
    attribute: uv_index
    name: UV
```

</details>

<br>

<img width="400" alt="Image" src="https://github.com/user-attachments/assets/cbd285fa-75d0-4a83-98c3-f100c9c9d0bf" />

<br>

<details>
<summary><b>View YAML</b></summary>

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.your_weather_entity
sun_entity: sun.sun
moon_phase_entity: sensor.moon_phase
card_style: standalone
card_height: 160px
card_padding: 20px
sun_moon_size: 50
celestial_position: fixed
sun_moon_x_position: "-60"
sun_moon_y_position: "60"
top_position: top-left
chips_position: bottom-left
top_font_size: 36px
top_text_padding: 10px
chips_font_size: 16px
chips_layout: scroll
chips_width: 100%
chips_padding: 12px 16px
chips_gap: 8px
chips_background: true
chips:
  - entity: weather.your_weather_entity
    attribute: uv_index
    name: UV-Index
  - entity: weather.your_weather_entity
    attribute: humidity
  - entity: weather.your_weather_entity
    attribute: wind_speed
    name: Wind
  - entity: weather.your_weather_entity
    attribute: pressure
```

</details>

<br>

</details>


<details>
<summary><b>Example 3 — Forecast Card</b></summary>

<br>

<img width="400" alt="Image" src="https://github.com/user-attachments/assets/d32a8b84-76b7-4baa-9dce-0b5826f7f441" />

This example uses the `custom_cards` feature to embed a [scrollable forecast](https://github.com/shpongledsummer/minimal-forecast-card).

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.your_weather_entity
sun_entity: sun.sun
moon_phase_entity: sensor.moon_phase
card_style: standalone
card_height: 150px
card_padding: 20px
sun_moon_size: 50
sun_moon_x_position: "80"
sun_moon_y_position: center
top_position: top-left
chips_position: bottom-left
top_font_size: 36px
top_text_padding: 4px 8px
chips_font_size: 14px
chips_layout: scroll
chips_width: 30%
chips_padding: 4px 8px
chips_gap: 8px
chips_background: false
chips:
  - entity: weather.your_weather_entity
    icon: weather
    width: 100px
    icon_path: /local/your-icon-path/
custom_cards_position: center-right
custom_cards:
  - custom_width: 190px
    type: custom:minimal-forecast-card
    entity: weather.your_weather_entity
    forecast_type: daily
    items_to_show: 7
    visible: 3
    hide_min_temp: true
    item_spacing: 8px
    inner_spacing: 6px
    item_height: 110px
    card_shadow: inset 0 2px 4px 0 var(--card-shadow-color)
    card_padding: 0px
    embedded: true
    style: glass
    font_size: 15px
    icon_size: 34px
    icon_filter: brightness(0.95) drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.1))
    custom_icon_path: /local/your-icon-path/
```

</details>

<br>

### Immersive

<img width="400" alt="Image" src="https://github.com/user-attachments/assets/dd716851-b09a-4112-ad74-bbf605361857" />

*(A look at my dashboard: Immersive mode, a custom image, and a few buttons. The theme and card follow the sun in sync.)*

<br>

<details>
<summary><b>Example 1 — Header Card</b></summary>

<br>

<img width="400" alt="Image" src="https://github.com/user-attachments/assets/ddc2788b-f0f0-4c19-90f6-f0151a8fc06a" /><br>
<img width="400" alt="Image" src="https://github.com/user-attachments/assets/73427776-89f1-4831-9a71-fea18e8a2aff" />

```yaml


type: custom:atmospheric-weather-card
weather_entity: weather.your_weather_entity
sun_entity: sun.sun
sun_moon_x_position: -60
sun_moon_y_position: center
card_style: immersive
moon_phase_entity: sensor.moon_phase
card_height: 120px
card_padding: 16px
sun_moon_size: 40
top_position: top-left
top_text_sensor: sensor.time
chips_position: bottom-left
chips:
  - entity: weather.your_weather_entity
    icon: weather


```


</details>

<details>
<summary><strong>Example 2 — Custom Image</strong></summary>

<br>

<img width="400" alt="Image" src="https://github.com/user-attachments/assets/305972c9-35f2-4705-94b1-30111ea07d03" />

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.your_weather_entity
sun_entity: sun.sun
moon_phase_entity: sensor.moon_phase
card_padding: 24px
sun_moon_size: 55
celestial_position: fixed
sun_moon_x_position: 100
sun_moon_y_position: 80
day: /local/home-day.png
night: /local/home-night.png
image_scale: 90
status_entity: binary_sensor.contact_sensor_door
top_text_sensor: sensor.time
top_position: bottom-left
chips_position: top-right
disable_top_text: false
top_text_padding: 0px 16px
chips_width: 70%
chips_padding: 10px 14px
chips_background: true
custom_cards_position: top-right
chips:
  - entity: sensor.temperature
  - entity: sensor.humidity
  - entity: sensor.open_windows
    attribute: fenster_offen
    icon: mdi:window-open-variant
    name: Windows
full_width: true
status_image_day: /local/home-day-door-open.png
status_image_night: /local/home-night-door-open.png

```


</details>
<br>


> [!TIP]
> <details>
> <summary><strong>Fonts & Icons</strong></summary>
> <br>
> 
> * **Custom Fonts:** The examples use the **Montserrat** font, which you can download or embed directly from [Google Fonts](https://fonts.google.com/specimen/Montserrat).
> * **Custom Icons:** You can replace the default icons with your own custom SVG weather icons. See the [Chips](#appearance) section for instructions. You can find the icons from the examples [here.](https://github.com/basmilius/weather-icons)
> * **Embedded Cards:** To keep this card somewhat lightweight and focused on weather visuals, it relies on an embedded custom cards approach. You can read more about this feature [here](#appearance). 
> * **Companion Card:** There is also a companion card built specifically to sit in a scrollable row alongside this one, which you can find [here](https://github.com/shpongledsummer/minimal-forecast-card).
> </details>

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

## Appearance

Everything that controls how your card looks — layout, colors, sun/moon, text, chips, and images.

<details>
<summary><strong>Card Style & Layout</strong></summary>

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `card_style` | `string` | `immersive` | Set to `standalone` for a solid background with dynamic weather visuals, or `immersive` for a transparent background. |
| `card_height` | `number` · `string` | `200` | Height in pixels. Numbers are automatically treated as px (e.g., `110` becomes `110px`). **Set to `auto`** to dynamically fill the available height (for grid layouts). |
| `card_padding` | `string` | `16px` | Inner padding around the text. Accepts any CSS padding value (e.g., `8px`, `12px 20px`). |
| `square` | `boolean` | `false` | Forces the card into a perfect square. Highly useful for grid layouts. |
| `full_width` | `boolean` | `false` | Stretches the card edge-to-edge by removing side margins. |
| `offset` | `string` | `0px` | Shifts the card using CSS margin (e.g., `"-50px 0px 0px 0px"`). Useful when layering cards. |
| `stack_order` | `number` | *auto* | Manually sets the z-index (e.g., `1`, `0`, `-1`). Useful for forcing an immersive card to display in front of cards with solid backgrounds. |
| `tap_action` | `object` | — | A standard Home Assistant [tap action](https://www.home-assistant.io/dashboards/actions/). |

</details>

<details>
<summary><strong>Theme & Filters</strong></summary>

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `theme` | `string` | `auto` | Forces the card's color scheme. Accepts `dark` or `light` to lock the look, or `night` / `day` to force the sky content. See [Colors](#color-mode). |
| `filter` | `string` | — | Applies a visual filter preset to the weather canvas. Options: `darken`, `vivid`, `muted`, `warm`. |
| `moon_style` | `string` | `default` | The moon's glow color. `default` follows the theme (muted blue in light mode, white in dark mode). Other options: `blue`, `yellow`, `purple`, `grey`. |
| `css_mask_vertical` | `boolean` | `true` | *(Immersive only)* Fades the top and bottom edges. Set to `false` to disable. |
| `css_mask_horizontal` | `boolean` | `true` | *(Immersive only)* Fades the left and right edges. Set to `false` to disable. |
| `theme_entity` | `string` | — | Drives the card's color scheme from any entity's state instead of your HA theme. Commonly set to `sun.sun` to sync the card with sunrise/sunset. See [Colors](#color-mode). |

</details>

<details>
<summary><strong>Sun & Moon</strong></summary>

The sun and moon share a single position and the card automatically swaps them based on your `sun_entity`. See [Colors](#color-mode) for the full picture. The card also automatically generates a dynamic **sunrise and sunset effect** based on the sun's elevation, and **rotates the moon** accurately based on your Home Assistant latitude setting.
 

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `sun_moon_size` | `number` | *auto* | Overrides the sun/moon diameter in pixels. |
| `celestial_position` | `string` | `fixed` | How the sun and moon are positioned. `fixed` uses the `sun_moon_x_position` and `sun_moon_y_position` values. `dynamic_sun` animates the sun across the sky following the real solar arc (moon stays fixed). `dynamic_both` animates both the sun and the moon. |
| `sun_moon_x_position` | `number` · `string` | `100` | Horizontal position in pixels from the left edge. **Negative values** position it from the right edge (e.g., `-55` means 55px from the right). Also accepts `center`. Ignored when `celestial_position` is dynamic. |
| `sun_moon_y_position` | `number` · `string` | `100` | Vertical position in pixels from the top. Also accepts `center`. Ignored when `celestial_position` is dynamic. |

</details>

<details>
<summary><strong>Top Text</strong></summary>

The top text is the large primary line (temperature by default).

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `top_text_sensor` | `string` | — | The entity to display as the large top text. Defaults to the temperature from your weather entity. Standard entities will automatically translate to your HA language. |
| `top_position` | `string` | `top-left` | Where the top text anchors inside the card. 9-cell grid: `top-left`, `top-center`, `top-right`, `left`, `center`, `right`, `bottom-left`, `bottom-center`, `bottom-right`. |
| `top_font_size` | `string` | — | Sets the font size of the top text directly without needing a custom theme or `card_mod`. Accepts any CSS size value (e.g., `3em`, `48px`). |
| `top_text_padding` | `string` | `8px 14px` | Inner padding around the top text (e.g., `8px 14px`). |
| `top_text_background` | `boolean` | `false` | Adds a styled background behind the top text to improve readability against the weather visuals. |
| `top_text_behind_weather` | `boolean` | `false` | Places the top text behind the weather canvases so clouds, rain and particles pass over it. Text backgrounds are disabled while behind. |
| `background_style` | `string` | `frosted` | Style used by the text and chips backgrounds. Options: `frosted` (translucent fill with a thin border, looks like a small glass container), `pill` (more opaque and higher contrast), `theme` (uses your current Home Assistant card styling). |
| `disable_top_text` | `boolean` | `false` | Hides only the top text. |
| `disable_text` | `boolean` | `false` | Hides the top text and the chips row in one go. |

</details>

<details>
<summary><strong>Chips</strong></summary>

Chips are the small detail sensors below (or next to) the top text. You can define as many as you want — each one is its own entity reading, with optional icon, label, width, overflow behavior, and tap action. The row layout controls whether they wrap, scroll horizontally, or sit in a fixed grid.

**Row options**

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `chips` | `list` | — | The list of chips to display. Each entry is an object with its own settings (see below). |
| `chips_position` | `string` | `bottom-left` | Where the chips row anchors. Same 9-cell grid as `top_position`. |
| `chips_layout` | `string` | `wrap` | Row behavior. `wrap` moves overflowing chips to a new line, `scroll` keeps them on one line with a hidden scrollbar and edge fades, `grid` arranges them in equal columns. |
| `chips_columns` | `number` | `3` | Number of equal-width columns when `chips_layout: grid` is active. |
| `chips_align` | `string` | `start` | How each chip aligns inside its grid cell. Options: `start`, `center`, `end`. Grid layout only. |
| `chips_width` | `string` | — | Limits the full row width (e.g., `60%` or `200px`). Useful to place the chips row next to the top text instead of spanning the card. |
| `chips_padding` | `string` | `5px 10px` | Inner padding of each chip (e.g., `5px 10px`). |
| `chips_gap` | `string` | `8px` | Space between chips. |
| `chips_font_size` | `string` | — | Font size of the chip text. Accepts any CSS size value (e.g., `16px`, `1.2em`). |
| `chips_background` | `boolean` | `false` | Adds a styled background behind each chip (the style is controlled by `background_style`). |
| `disable_chips` | `boolean` | `false` | Hides the chips row entirely. |

**Per-chip options**

Each entry inside the `chips` list accepts the following keys.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `entity` | `string` | — | **Required.** Any sensor, binary_sensor, or weather entity. Pointing it at the weather entity shows the current state (e.g., `Sunny`). |
| `attribute` | `string` | — | Optional. Read a specific attribute of the entity instead of its state (e.g., `humidity` on a weather entity). |
| `name` | `string` | — | Optional label shown before the value (e.g., `Wind`). |
| `icon` | `string` | *auto* | An `mdi:` icon (e.g., `mdi:water-percent`), the keyword `weather` to automatically show the icon matching the current weather state, or empty to inherit the sensor's own icon. |
| `icon_path` | `string` | — | Folder for custom SVG icons (e.g., `/local/weather-icons/`). When set, the value of `icon` resolves to an image file instead of an MDI icon. For example, `icon: weather` combined with `icon_path: /local/weather-icons/` loads `/local/weather-icons/rainy.svg` for rainy weather. You can find the animated SVG icons from the examples [here](https://github.com/basmilius/weather-icons). |
| `disable_icon` | `boolean` | `false` | Hides the icon for this chip. |
| `width` | `string` | — | Limits the chip's width (e.g., `60%` or `200px`). Required for marquee overflow. |
| `overflow` | `string` | `ellipsis` | How text exceeding `width` is handled. Options: `ellipsis` (cuts off with `…`), `clip` (cuts off without indicator), `wrap` (breaks onto a second line), `marquee` (scrolls horizontally). |
| `marquee_speed` | `number` | `30` | Scroll speed in pixels per second when `overflow: marquee` is active. Minimum `5`. |
| `marquee_rtl` | `boolean` | `false` | Reverses the marquee direction (scrolls right-to-left). |
| `tap_action` | `object` | `more-info` | A standard Home Assistant [tap action](https://www.home-assistant.io/dashboards/actions/) scoped to this chip. |

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

You can add your own images (such as a 3D house model) to the card. This works in both standalone and immersive modes.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `day` | `string` | — | File path for the daytime image (e.g., `/local/house-day.png`). |
| `night` | `string` | — | File path for the nighttime image. Falls back to the day image if left empty. |
| `image_scale` | `number` | `100` | Image size as a percentage of the total card height. |
| `image_alignment` | `string` | `top-right` | Image placement. Options: `center`, `top-right`, `top-left`, `top-center`, `bottom`, `bottom-center`, `bottom-left`, `bottom-right`. |
| `status_entity` | `string` | — | An entity to monitor (e.g., a door sensor). See [Smart Status Entity](#smart-status-entity). |
| `status_image_day` | `string` | — | The day image to display when the status entity becomes active. |
| `status_image_night` | `string` | — | The night image to display when the status entity becomes active. |

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

> [!TIP]
> For custom button layouts, I highly recommend using `paper-buttons-row` from HACS. It gives you the flexibility to build incredibly detailed and beautiful designs. Check out the advanced [examples](#usage-modes) for a few prebuilt layouts you can customize.

</details>

<br>

## Color Mode

The card's look is controlled by two things: your **`sun_entity`**, which handles the sun, moon, and stars in the sky, and your **theme**, which decides whether the card looks light or dark. Here are the ways you can set this up.

<details>
<summary><strong>Follow your Home Assistant theme</strong></summary>

<br>

Android and iOS can auto-toggle dark mode based on sunrise and sunset, and this use case is exactly what this card was designed for. With `sun_entity` configured, the card shows the sun during the day and the moon at night, automatically syncing its colors to whatever your Home Assistant theme is doing.

```yaml
sun_entity: sun.sun
```

</details>

<details>
<summary><strong>Follow the sun instead of your theme</strong></summary>

<br>

If you want the card to switch between light and dark at the real sunrise and sunset regardless of what your Home Assistant theme is doing, point `theme_entity` at your sun entity:

```yaml
sun_entity: sun.sun
theme_entity: sun.sun
```

Now the card goes light at sunrise and dark at sunset on its own, and its colors match the time of day no matter what the rest of your dashboard is doing.

</details>

<details>
<summary><strong>Force a fixed light or dark look</strong></summary>

<br>

If you want to lock the card's colors to one value and never change them:

```yaml
theme: dark   # or: light
```

The sky still follows `sun_entity`, so you still get the moon and stars at night — only the card's colors are forced.

Most users don't need this. If your Home Assistant theme is always the same color, the default already handles it correctly.

</details>

<details>
<summary><strong>Custom logic via any entity</strong></summary>

<br>

`theme_entity` can point at any entity, not just the sun. Use a template sensor, an `input_boolean`, a helper toggled by an automation — anything you want. The card switches to its dark look when the entity's state is one of: `dark`, `night`, `evening`, `on`, `true`, or `below_horizon`. Anything else counts as light.

```yaml
theme_entity: sensor.my_custom_mode
```

Useful if you want something like "dark after 9pm", "dark when it's overcast", or any other rule you can express in a template or automation.

</details>

<br>

## Fonts & Icons

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

The card then resolves the icon by the current weather state — for example, `rainy` weather loads `/local/weather-icons/rainy.svg`. Make sure the filenames match the supported [weather states](#weather-states).

The same approach works inside the embedded [Minimal Forecast Card](https://github.com/shpongledsummer/minimal-forecast-card) via its `custom_icon_path` option, which is why several examples in this README set both at once.

</details>

<br>

## CSS Reference

> [!NOTE]
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
| `--awc-top-font-size` | `clamp(24px, 11cqw, 52px)` | Top text size (dynamically responsive). |
| `--awc-top-font-weight` | `600` | Top text weight. |
| `--awc-top-padding` | `0` (`8px 14px` with background) | Padding around the top text. |
| `--awc-bottom-font-size` | `clamp(15px, 5cqmin, 26px)` | Chip text size (dynamically responsive). |
| `--awc-bottom-font-weight` | `500` | Chip text weight. |
| `--awc-bottom-gap` | `8px` | Gap between chips in the row. |
| `--awc-bottom-opacity` | `0.7` | Opacity of chips without a background. |
| `--awc-chip-name-weight` | `700` | Font weight of the chip name label. |
| `--awc-chips-padding` | `0` (`5px 10px` with background) | Inner padding of each chip. |
| `--awc-row-width` | `calc(100% - padding)` | Width of the chips row. Overrides the `chips_width` option. |
| `--awc-row-columns` | `3` | Number of columns when `chips_layout: grid` is active. |
| `--awc-row-fade-l` | *auto* | Left edge fade width for the scrolling chip row. |
| `--awc-row-fade-r` | *auto* | Right edge fade width for the scrolling chip row. |
| `--awc-top-bg-color` | *auto* | Background color when `top_text_background` is enabled. Defaults to the active background style. |
| `--awc-top-bg-radius` | *card radius* | Border radius for the top text background. |
| `--awc-top-bg-filter` | `blur(10px)` | Backdrop filter for the top text background (only used by the `frosted` style). |
| `--awc-bottom-bg-color` | *auto* | Background color when `chips_background` is enabled. Defaults to the active background style. |
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


<br>

## Custom House Image

To achieve the immersive look featuring your own home, follow these steps:

1. **Take a reference photo** from a corner angle to properly capture the depth of the house.
2. **Generate a 3D model** using an AI image tool. Use a prompt similar to:
   > *Isometric view of a modern minimalist architectural model section from the outside on solid white background. [Describe your floors/rooms]. Materials are matte white and light only. No complex textures, studio lighting, very clean, simplified shapes.*
3. **Remove the background** with an online tool or image editor and save the resulting image as a transparent PNG.
4. **Create day and night variants** by adjusting the prompt appropriately.
5. **Upload the files** to your `config/www/images/` directory and reference them in the card config as `/local/images/my-house-day.png`.

<br>

## Smart Status Entity

The status feature dynamically swaps the displayed house/custom image when a monitored entity becomes active. The card recognizes the following states as "active": `on`, `true`, `open`, `unlocked`, `home`, and `active`.

| Use Case | Example Entity | Triggers On |
| :--- | :--- | :--- |
| Door / Window | `binary_sensor.front_door` | `open` |
| Lock | `lock.front_door` | `unlocked` |
| Toggle | `input_boolean.party_mode` | `on` |
| Presence | `person.me` | `home` |

<br>

## Adding Buttons

You can embed buttons (or any other Home Assistant card like a graph, another weather card, sensors etc.) directly inside this card using the `custom_cards` feature. See [Embedded Cards](#appearance) in the Appearance section for setup and layout options, and the [examples](#usage-modes) for different use cases.

<br>

## Companion Forecast Card

This card is focused on live visuals and current conditions. If you want to show a weather forecast alongside it, there is a companion card available: the [Minimal Forecast Card](https://github.com/shpongledsummer/minimal-forecast-card).

It is built to be embedded inside this card using the `custom_cards` feature. You can set it up as a vertical or horizontal scroll and show daily or hourly data. You can find the YAML for this in Example 2 in the [Usage Modes](#usage-modes) section.

<br>

## Weather States

The card supports the following weather states: `sunny` · `clear-night` · `partlycloudy` · `cloudy` · `fog` · `rainy` · `pouring` · `snowy` · `snowy-rainy` · `hail` · `lightning` · `lightning-rainy` · `windy` · `windy-variant` · `exceptional`

Each state triggers a unique combination of particle types, cloud densities, wind behaviors, and atmospheric lighting. The card also reads details like the `wind_speed` or `elevation` to dynamically influence the animations.

<br>

## Performance

Because this card uses dynamic animations, it naturally requires more power than a standard HA card. To compensate, a large part of the codebase is dedicated simply to keeping resource usage down. It runs conservative graphics settings by default to balance visuals and performance, but even with these efforts, it is not recommended for very old or slow devices.

<details>
<summary><b>Performance Optimizations</b></summary>

<br>

To keep your dashboard running smoothly, the card uses a few behind-the-scenes techniques:

* **Smart Graphics:** Complex weather effects are drawn once and reused, rather than being redrawn constantly.
* **Auto-Pausing:** Animations stop completely when you scroll the card out of view to save power.
* **Smooth Operation:** The code is optimized to prevent random freezing or stuttering.
* **Efficient Updates:** The card only refreshes when your HA data actually changes.
* **Display Adjustments:** It automatically limits animation speeds and scales down for high-resolution screens to avoid overloading your device.

</details>

> [!IMPORTANT]  
> The card relies on standard **Hardware Acceleration** to run smoothly. If you experience heavy lag or high CPU usage (especially on Linux or Firefox setups where software rendering is often the default), please double-check that hardware acceleration is enabled in your browser or kiosk app.

<br>

## Support the project

If you enjoy using this card and want to say thanks, a coffee is always appreciated :)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/X8X31WXQHF)
