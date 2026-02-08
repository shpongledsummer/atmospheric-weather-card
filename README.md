![Contains](https://img.shields.io/badge/contains-★_shooting_stars-333?style=flat-square)



### ATMOSPHERIC WEATHER CARD

I started this because I wanted a weather card that looked nice, but I ended up building a physics engine. The code generates the clouds and rain so they move naturally and never repeat. It also adds random details based on the current weather like wind-blown leaves, planes, birds and shooting stars to make the dashboard feel alive. And if you're lucky, you might even see the rare aurora borealis.

https://github.com/user-attachments/assets/b7462f32-f193-4b5f-81c6-c6de321b8c42

> **AI Disclaimer** — This card was created with the help of AI tools. I would never have the patience to create those weather effects myself.

<br>

### TABLE OF CONTENTS

[`Usage Modes`](#usage-modes) · [`Installation`](#installation) · [`Configuration Reference`](#configuration-reference) <br>
[`Day / Night Logic`](#day--night-logic) · [`Custom House Image`](#custom-house-image) · [`Smart Status Entity`](#smart-status-entity) <br>
[`Adding Buttons`](#adding-buttons) · [`Supported Weather States`](#supported-weather-states) · [`Performance`](#performance)

<br>

<br>

---

### USAGE MODES

The card has two modes that affect how it renders and what kind of dashboard setup it expects.

<br>

### Standalone Mode

<img width="400" alt="image" src="https://github.com/user-attachments/assets/00be4670-d259-4690-92ba-e440e71244ef" />

A self-contained card with its own weather-aware background gradients. The card renders the current temperature and bottom detail pulled from your entities (defaults to Wind Speed). The text automatically positions itself on the opposite side of the sun/moon to avoid overlap.

<details>
<summary><b>Example 1 — Basic Card</b></summary>
<br>



| Day | Night |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/a1518dd3-d533-4be5-a5d5-1ea6f4fd9748" width="100%"> | <img src="https://github.com/user-attachments/assets/6f533325-5a08-43ec-8523-44f51d0d2aa3" width="100%"> |
| <img src="https://github.com/user-attachments/assets/fa07c203-feae-4bb0-941d-d14edd9d2feb" width="100%"> | <img src="https://github.com/user-attachments/assets/b5660eeb-b980-434d-b17d-12612754e2f3" width="100%"> |

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.forecast_home
card_style: standalone
card_height: 110
sun_moon_x_position: -55
sun_moon_y_position: 55
sun_entity: sun.sun
tap_action:
  action: more-info
  entity: weather.forecast_home
```

> **Tip** — By default, the bottom text displays **Wind Speed**. You can change this to show any sensor (like `sensor.humidity` or your address) using the `bottom_text_sensor` option. The temperature is formatted automatically based on your Home Assistant language setting (e.g. `4.5` in English, `4,5` in German).

</details>

<details>
<summary><b>Example 2 — Grid Layout</b></summary>
<br>

| Grid |
| :---: |
| <img width="400" src="https://github.com/user-attachments/assets/cf6121ab-b8d0-43c4-89e6-a29faaa62fdd" /> |

You can use a taller card height to fit the card into a grid or horizontal stack alongside other cards. This example pairs the weather card with a graph and a tile card.

```yaml
type: grid
columns: 2
cards:
  - type: custom:atmospheric-weather-card
    weather_entity: weather.forecast_home
    card_style: standalone
    card_height: 200
    sun_moon_x_position: -30
    sun_moon_y_position: 30
    sun_entity: sun.sun
    tap_action:
      action: more-info
      entity: weather.forecast_home
  - type: vertical-stack
    cards:
      - type: sensor
        graph: line
        entity: sensor.temperature_indoor
        detail: 1
        name: Indoor Temp
      - type: tile
        entity: sensor.climate_sensor
        name: Air Quality
        icon: mdi:leaf
        state_content: state
        vertical: false
```

</details>

<br>

### Immersive Mode *(Default)*

<img width="400" alt="image" src="https://github.com/user-attachments/assets/df6cd241-4a9e-4690-a99d-4cc90b861910" />

Renders with a fully transparent background so it blends seamlessly into your dashboard.

<details>
<summary><b>Example 1 — Header Integration</b></summary>
<br>

| Day | Night |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/d810a910-0df0-4b7d-ae0e-a6a4c739f47a" width="100%"> | <img src="https://github.com/user-attachments/assets/5196c877-21c6-4a63-b273-99538cdbe970" width="100%"> |

This layout gives the weather effects space to breathe. Combine it with any other card and place it at the top of your dashboard, to get a nice header.

**How to do it:** Place your card (Markdown, tile or whatever you prefer) *before* the Atmospheric Weather Card. Then, use the `offset` feature on the weather card to layer it *behind* the other card.

```yaml
# 1. The Content Card (Foreground)
type: markdown
content: |
  <br>
  ⛅ Enjoy the weather!
  # {{states('sensor.time') }}

# 2. The Weather Card (Background Layer)
type: custom:atmospheric-weather-card
weather_entity: weather.forecast_home
full_width: true
card_height: 240
# Pulls the card up 120px to sit behind the Markdown card
offset: "-120px 0px 0px 0px"
sun_moon_x_position: -100
sun_moon_y_position: 100
sun_entity: sun.sun
moon_phase_entity: sensor.moon_phase
tap_action:
  action: none
```

</details>

<details>
<summary><b>Example 2 — Full Setup</b></summary>
<br>

| Day | Night |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/6d07c654-c791-483a-9351-ce3ec33ff083" width="100%" /> | <img src="https://github.com/user-attachments/assets/f6fa7d65-8777-4746-9878-b32a1960b470" width="100%" /> |

This setup shows how I use this card. It uses it as a dynamic backdrop for the entire top section of the view, combining it with a custom image and overlay buttons. The card provides the animated weather and image; the buttons shown in the screenshots are separate elements layered on top. [See Adding Buttons](#adding-buttons) and [Custom House Image](#custom-house-image) for details.

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.forecast_home
full_width: true
card_height: 200
image_scale: 100
image_alignment: bottom
offset: "-50px 0px 0px 0px"
sun_moon_x_position: 100
sun_moon_y_position: 100
sun_entity: sun.sun
moon_phase_entity: sensor.moon_phase
# Custom Images
day: /local/images/dashboard/home-day.png
night: /local/images/dashboard/home-night.png
# Status Features (e.g., Door Open)
status_entity: binary_sensor.front_door
status_image_day: /local/images/dashboard/home-day-door-open.png
status_image_night: /local/images/dashboard/home-night-door-open.png
tap_action:
  action: navigate
  navigation_path: "#popup_climate"
```

</details>


> [!IMPORTANT]
> **Immersive mode needs to match your dashboard theme to work correctly.** If you use a fixed theme (like dark mode all day), the card will still switch between light and dark based on the sun. This mismatch makes weather effects look broken. To fix this: use `theme_entity` if your theme automatically switches between light and dark, or use `mode: dark` or `mode: light` to force the card to match your fixed theme. See [Day / Night Logic](#day--night-logic) for details.

<br>

---

### INSTALLATION

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

<br>

---

### CONFIGURATION REFERENCE

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `weather_entity` | `string` | **required** | Your weather integration entity. The only required option. |
| | | | |
| **Layout & Appearance** | | | |
| `card_style` | `string\|boolean` | `false` | Set to `standalone` to enable standalone mode with built-in backgrounds and text. Omit or set to `false` for immersive (transparent) mode. |
| `card_height` | `number\|string` | `200px` | Card height. Numbers are treated as pixels (`110` → `110px`). Strings are used as-is. |
| `full_width` | `boolean` | `false` | Stretches the card edge-to-edge by removing side margins. Mainly useful in immersive mode. |
| `offset` | `string` | `0px` | CSS margin shorthand applied to the card. Format: `"Top Right Bottom Left"`. Negative values pull the card behind adjacent elements (e.g. `"-50px 0px 0px 0px"`). |
| | | | |
| **Sun & Moon Position** | | | |
| `sun_moon_x_position` | `number` | `100` | Horizontal position. **Positive** = offset from the left edge. **Negative** = offset from the right edge (e.g. `-55` places it 55 units from the right). |
| `sun_moon_y_position` | `number` | `100` | Vertical distance from the top. |
| | | | |
| **Custom Image** | | | |
| `day` | `string` | — | Path to a daytime image (e.g. `/local/images/house-day.png`). Transparent PNGs work best. |
| `night` | `string` | — | Path to a nighttime image. Falls back to `day` if not set. |
| `image_scale` | `number` | `100` | Image height as a percentage of the card height. |
| `image_alignment` | `string` | `top-right` | Image position. Combine vertical (`top`, `center`, `bottom`) + horizontal (`left`, `right`). Examples: `bottom-right`, `center-left`, `bottom`. |
| | | | |
| `offset` | `string` | `0px` | CSS margin shorthand applied to the card. Format: `"Top Right Bottom Left"`. Negative values pull the card behind adjacent elements (e.g. `"-50px 0px 0px 0px"`). |
| | | | |
| **Standalone Text** | | | |
| `bottom_text_sensor` | `string` | — | Entity ID of a sensor to display at the bottom instead of wind speed (e.g. `sensor.humidity`). |
| `bottom_text_icon` | `string` | *Auto* | Force a specific icon (e.g. `mdi:home`). Defaults to `mdi:weather-windy` or the sensor's native icon. |
| `disable_text` | `boolean` | `false` | If `true`, hides both the temperature and bottom text completely. |
| `disable_bottom_icon` | `boolean` | `false` | If `true`, hides only the icon in the bottom text. |
| **Smart Status** | | | |
| `status_entity` | `string` | — | Entity to watch (e.g. `binary_sensor.front_door`). Requires at least one status image. Active states for the status feature are: `on`, `open`, `unlocked`, `true`, `home`, `active`. |
| `status_image_day` | `string` | — | Override image for daytime when entity is active. |
| `status_image_night` | `string` | — | Override image for nighttime. Falls back to `status_image_day`. |
| | | | |
| **Entities & Logic** | | | |
| `mode` | `string` | `auto` | Force day/night: `light` or `day` for daytime, `dark` or `night` for nighttime, `auto` to detect automatically. See [Day / Night Logic](#day--night-logic). |
| `sun_entity` | `string` | — | Sun entity for automatic day/night detection (e.g. `sun.sun`). |
| `theme_entity` | `string` | — | An entity whose state indicates the active theme. Night mode triggers when the state is `dark`, `night`, `evening`, `on`, `true`, or `below_horizon`. |
| `moon_phase_entity` | `string` | — | Moon phase sensor (e.g. `sensor.moon_phase`). Renders the moon with accurate illumination and terminator. Supported: `new_moon`, `waxing_crescent`, `first_quarter`, `waxing_gibbous`, `full_moon`, `waning_gibbous`, `last_quarter`, `waning_crescent`. |
| | | | |
| **Interaction** | | | |
| `tap_action` | `object` | — | Standard HA action config. Example: `{ action: more-info, entity: weather.forecast }` |

> **Tip** — The sun and moon share a single position. During the day the sun is drawn there (only in fair weather like sunny, partly cloudy, exceptional); at night the moon takes its place. In standalone mode, the text automatically moves to the opposite side.

<br>

---

### DAY / NIGHT LOGIC

The card determines whether to render a day or night scene using a 4-level priority chain. It checks each level in order and uses the first match.

| Priority | Source | Config Option | Logic |
| :---: | :--- | :--- | :--- |
| **1** | Manual override | `mode` | `dark`/`night` forces night. `light`/`day` forces day. |
| **2** | Theme entity | `theme_entity` | Matches the entity state against night keywords (`dark`, `night`, `evening`, `on`, `true`, `below_horizon`). |
| **3** | Sun entity | `sun_entity` | Checks if `sun.sun` is `below_horizon`. |
| **4** | System dark mode | — | Falls back to the Home Assistant dark mode toggle in the sidebar. |

> [!NOTE]
> For the "Standalone Mode", `sun_entity: sun.sun` is all you need. The `theme_entity` option is useful if you use the "Immersive Mode" with a dark/light theme that you want the card to follow instead of the sun. The `mode` option is meant for using "Immersive Mode" with a fixed theme (permanent dark or light dashboard background).

<br>

---

### CUSTOM HOUSE IMAGE

To get the immersive look with your own home:

1. **Take a reference photo** from a corner angle to capture depth.
2. **Generate a 3D model image** using an AI image tool with a prompt like:
   > Isometric view of a modern minimalist architectural model section from the outside on solid white background. [Describe your floors/rooms]. Materials are matte white and light wood only. No complex textures, studio lighting, very clean, simplified shapes.
3. **Remove the background** and save as a transparent PNG.
4. **Create day and night variants** with adjusted lighting/colors.
5. **Upload** to `config/www/images/` and reference as `/local/images/my-house-day.png`.

<br>

---

### SMART STATUS ENTITY

The status feature swaps the displayed image when an entity becomes active. Some examples:

| Use case | Example entity | Triggers on |
| :--- | :--- | :--- |
| Door / Window | `binary_sensor.front_door` | `open` |
| Lock | `lock.front_door` | `unlocked` |
| Toggle | `input_boolean.party_mode` | `on` |
| Presence | `zone.home` | `active` |

When the entity returns to an inactive state, the card switches back to the default image.

<br>

---

### ADDING BUTTONS

The floating buttons in the dashboard screenshots are built with `custom:paper-buttons-row` placed before the weather card. Use the `offset` option on this card to layer them visually. A reference config is included in `paper-buttons-row-example.yml`.

<br>

---

### SUPPORTED WEATHER STATES

`sunny` · `clear-night` · `partlycloudy` · `cloudy` · `fog` · `rainy` · `pouring` · `snowy` · `snowy-rainy` · `hail` · `lightning` · `lightning-rainy` · `windy` · `windy-variant` · `exceptional`

Each state sets a unique combination of particle type, count, cloud density, wind speed, and atmosphere. Beyond the core weather, the sky is populated with ambient elements that appear on their own — drifting fog banks, wind-blown leaves, sun rays with heat shimmer, lightning bolts, airplanes, birds in formation, shooting stars, comets, and the rare Aurora Borealis at night. The card also reads `wind_speed` from your weather entity to influence particle behavior in real time.

<br>

---

### PERFORMANCE

The card targets 30fps with a max device pixel ratio of 2x. Animations pause automatically when the card scrolls out of view and reinitialize on resize with debouncing. The card is resizable in Section-based dashboards out of the box.
