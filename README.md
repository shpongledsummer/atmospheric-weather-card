# Atmospheric Weather Card

I started this because I wanted a weather card that looked nice, but I ended up building a physics engine. The code generates the clouds and rain so they move naturally and never repeat. It also adds random details based on the current weather like wind-blown leaves, planes, birds and shooting stars to make the dashboard feel alive. And if you're lucky, you might even see the rare aurora borealis.

https://github.com/user-attachments/assets/b7462f32-f193-4b5f-81c6-c6de321b8c42

---

## AI Disclaimer
This card was created with the help of AI tools. I would never have the patience to create those weather effects myself.

## Table of Contents

- [Usage Modes](#usage-modes)
- [Installation](#installation)
- [Configuration Reference](#configuration-reference)
- [Day / Night Logic](#day--night-logic)
- [Custom House Image](#custom-house-image)
- [Smart Status Entity](#smart-status-entity)
- [Adding Buttons](#adding-buttons)
- [Supported Weather States](#supported-weather-states)

---

## Usage Modes

The card has two modes that affect how it renders and what kind of dashboard setup it expects.

<br>

### Standalone Mode

A self-contained card with its own weather-aware background gradients. Renders the current temperature pulled from your weather entity. Works on any dashboard, with any theme.

The text automatically positions itself on the opposite side of the sun/moon to avoid overlap.

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.forecast
card_style: standalone
card_height: 110
sun_moon_x_position: -55
sun_moon_y_position: 55
mode: auto
sun_entity: sun.sun
tap_action:
  action: more-info
  entity: weather.forecast
```

<img width="407" height="151" alt="Standalone day" src="https://github.com/user-attachments/assets/be96819b-923a-414d-8bd6-414b2a80cded" />
<img width="386" height="126" alt="Standalone night" src="https://github.com/user-attachments/assets/4b63e40a-286e-48d6-b0e3-e2095493cfd7" />

> [!TIP]
> The text at the bottom of the card just grabs the name of your weather entity. If you want it to say something specific like "London" or "My House" you just need to rename the entity itself in Home Assistant.
<br>

### Immersive Mode *(default)*

Renders with a fully transparent background so it blends in with your theme.

> [!IMPORTANT]
> Because the card itself is transparent, the sky color comes from your dashboard background. For this to look right, **you need a Home Assistant theme that switches between a light and dark background**. Without it, weather effects will float on a static background color.

Pair it with a transparent PNG of your house (or anything else) for the full effect.

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.forecast_home

# --- Layout ---
card_height: 200px
full_width: true
offset: 0px 0px 0px 0px
sun_moon_x_position: 100
sun_moon_y_position: 100

# --- Custom Images ---
image_scale: 100
image_alignment: bottom
day: /local/images/my-house-day.png
night: /local/images/my-house-night.png

# --- Smart Status (Optional) ---
status_entity: binary_sensor.front_door
status_image_day: /local/images/house-open-day.png
status_image_night: /local/images/house-open-night.png

# --- Logic ---
mode: auto
theme_entity: input_select.theme
sun_entity: sun.sun
moon_phase_entity: sensor.moon_phase
```

<br>

| Day (Light Theme) | Night (Dark Theme) |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/df860538-703c-4cf0-8e61-135169ec3145" width="100%" /> | <img src="https://github.com/user-attachments/assets/78327984-0097-4cea-b19e-ef20e3e6f14a" width="100%" /> |
| <img src="https://github.com/user-attachments/assets/6d07c654-c791-483a-9351-ce3ec33ff083" width="100%" /> | <img src="https://github.com/user-attachments/assets/f6fa7d65-8777-4746-9878-b32a1960b470" width="100%" /> |

---

> [!NOTE]
> These images show a full dashboard using immersive mode with a house image and overlay buttons. The card provides the animated weather and house visualization, the buttons are separate (see [Adding Buttons](#adding-buttons)).

## Installation

<details>
<summary><b>Method 1: HACS (Recommended)</b></summary>

1. Open **HACS** in Home Assistant.
2. Go to **Frontend** → **Custom repositories** (top-right menu).
3. Add this repository URL and select the category **Dashboard**.
4. Click **Install**.
5. Reload the dashboard when prompted.
</details>

<details>
<summary><b>Method 2: Manual</b></summary>

1. Download `atmospheric-weather-card.js` from the latest release.
2. Place it in your `config/www/` folder.
3. Go to **Settings** → **Dashboards** → **⋮** → **Resources**.
4. Add a resource:
    - **URL:** `/local/atmospheric-weather-card.js`
    - **Type:** JavaScript Module
5. Hard-refresh your browser.
</details>

---

## Configuration Reference

### Required

| Option | Type | Description |
| :--- | :--- | :--- |
| `weather_entity` | `string` | Your weather integration entity. The only required option. |

### Layout & Appearance

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `card_style` | `string\|boolean` | `false` | Set to `standalone` to enable standalone mode with built-in backgrounds and text. Omit or set to `false` for immersive (transparent) mode. |
| `card_height` | `number\|string` | `200px` | Card height. Numbers are treated as pixels (`110` → `110px`). Strings are used as-is. |
| `full_width` | `boolean` | `false` | Stretches the card edge-to-edge by removing side margins. Mainly useful in immersive mode. |
| `offset` | `string` | `0px` | CSS margin shorthand applied to the card. Format: `"Top Right Bottom Left"`. Negative values pull the card behind adjacent elements (e.g. `"-50px 0px 0px 0px"`). |

### Sun & Moon Position

The sun and moon share a single position. During the day the sun is drawn there (only in fair weather like sunny, partly cloudy, exceptional); at night the moon takes its place.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `sun_moon_x_position` | `number` | `100` | Horizontal position. **Positive** = offset from the left edge. **Negative** = offset from the right edge (e.g. `-55` places it 55 units from the right). |
| `sun_moon_y_position` | `number` | `100` | Vertical distance from the top. |

> [!TIP]
> In standalone mode, the text automatically moves to the opposite side of the sun/moon.

### Custom Image

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `day` | `string` | — | Path to a daytime image (e.g. `/local/images/house-day.png`). Transparent PNGs work best. |
| `night` | `string` | — | Path to a nighttime image. Falls back to `day` if not set. |
| `image_scale` | `number` | `100` | Image height as a percentage of the card height. |
| `image_alignment` | `string` | `top-right` | Image position. Combine vertical (`top`, `center`, `bottom`) + horizontal (`left`, `right`). Examples: `bottom-right`, `center-left`, `bottom`. |

### Smart Status

Swap the displayed image when a Home Assistant entity becomes active. Requires `status_entity` and at least one status image.

| Option | Type | Description |
| :--- | :--- | :--- |
| `status_entity` | `string` | Entity to watch (e.g. `binary_sensor.front_door`). |
| `status_image_day` | `string` | Override image for daytime when entity is active. |
| `status_image_night` | `string` | Override image for nighttime. Falls back to `status_image_day`. |

Active states: `on`, `open`, `unlocked`, `true`, `home`, `active`.

### Entities & Logic

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `mode` | `string` | `auto` | Force day/night: `light` or `day` for daytime, `dark` or `night` for nighttime, `auto` to detect automatically. See [Day / Night Logic](#day--night-logic). |
| `sun_entity` | `string` | — | Sun entity for automatic day/night detection (e.g. `sun.sun`). |
| `theme_entity` | `string` | — | An entity whose state indicates the active theme. Night mode triggers when the state is `dark`, `night`, `evening`, `on`, `true`, or `below_horizon`. |
| `moon_phase_entity` | `string` | — | Moon phase sensor (e.g. `sensor.moon_phase`). Renders the moon with accurate illumination and terminator. Supported: `new_moon`, `waxing_crescent`, `first_quarter`, `waxing_gibbous`, `full_moon`, `waning_gibbous`, `last_quarter`, `waning_crescent`. |

### Interaction

| Option | Type | Description |
| :--- | :--- | :--- |
| `tap_action` | `object` | Standard HA action config. Example: `{ action: more-info, entity: weather.forecast }` |

---

## Day / Night Logic

The card uses a 4-level priority chain. It checks each level in order and uses the first match.

| Priority | Source | Config Option | Logic |
| :---: | :--- | :--- | :--- |
| **1** | Manual override | `mode` | `dark`/`night` forces night. `light`/`day` forces day. |
| **2** | Theme entity | `theme_entity` | Matches the entity state against night keywords (`dark`, `night`, `evening`, `on`, `true`, `below_horizon`). |
| **3** | Sun entity | `sun_entity` | Checks if `sun.sun` is `below_horizon`. |
| **4** | System dark mode | — | Falls back to the Home Assistant dark mode toggle in the sidebar. |

> [!NOTE]
> For most setups, `mode: auto` with `sun_entity: sun.sun` is all you need. The `theme_entity` option is useful if you have a theme automation (e.g. an `input_select`) that you want the card to follow instead of the sun.

---

## Custom House Image

To get the immersive look with your own home:

1. **Take a reference photo** from a corner angle to capture depth.
2. **Generate a 3D model image** using an AI image tool with a prompt like:
   > Isometric view of a modern minimalist architectural model section from the outside on solid white background. [Describe your floors/rooms]. Materials are matte white and light wood only. No complex textures, studio lighting, very clean, simplified shapes.
3. **Remove the background** and save as a transparent PNG.
4. **Create day and night variants** with adjusted lighting/colors.
5. **Upload** to `config/www/images/` and reference as `/local/images/my-house-day.png`.

---

## Smart Status Entity

The status feature swaps the displayed image when an entity becomes active. Some examples:

| Use case | Example entity | Triggers on |
| :--- | :--- | :--- |
| Door / Window | `binary_sensor.front_door` | `open` |
| Lock | `lock.front_door` | `unlocked` |
| Toggle | `input_boolean.party_mode` | `on` |
| Presence | `zone.home` | `active` |

When the entity returns to an inactive state, the card switches back to the default image.

---

## Adding Buttons

The floating buttons in the dashboard screenshots are built with `custom:paper-buttons-row` placed before the weather card. Use the `offset` option on this card to layer them visually. A reference config is included in `paper-buttons-row-example.yml`.

---

## Supported Weather States

`sunny` · `clear-night` · `partlycloudy` · `cloudy` · `fog` · `rainy` · `pouring` · `snowy` · `snowy-rainy` · `hail` · `lightning` · `lightning-rainy` · `windy` · `windy-variant` · `exceptional`

Each state sets a unique combination of particle type, count, cloud density, wind speed, and atmosphere. Beyond the core weather, the sky is populated with ambient elements that appear on their own — drifting fog banks, wind-blown leaves, sun rays with heat shimmer, lightning bolts, airplanes, birds in formation, shooting stars, comets, and the rare Aurora Borealis at night. The card also reads `wind_speed` from your weather entity to influence particle behavior in real time.

---

## Performance

The card targets 30fps with a max device pixel ratio of 2x. Animations pause automatically when the card scrolls out of view and reinitialize on resize with debouncing.
