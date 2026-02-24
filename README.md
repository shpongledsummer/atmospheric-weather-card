![Contains](https://img.shields.io/badge/contains-★_shooting_stars-333?style=flat-square)

<br>

# Atmospheric Weather Card

I started this because I wanted a weather card that looked nice, but I ended up building a physics engine. The code generates clouds and rain so they move naturally and never repeat. It also adds random ambient details like wind-blown leaves, planes, birds in formation, shooting stars, and if you're lucky, the rare aurora borealis.

https://github.com/user-attachments/assets/b7462f32-f193-4b5f-81c6-c6de321b8c42

> **AI Disclaimer** — This card was created with the help of AI tools. I would never have the patience to create those weather effects myself.

<br>

## Contents

[Usage Modes](#usage-modes)<br>
[Installation](#installation)<br>
[Configuration](#configuration)<br>
[Day / Night Logic](#day--night-logic)<br>
[Styling](#styling)<br>
[Custom House Image](#custom-house-image)<br>
[Smart Status Entity](#smart-status-entity)<br>
[Adding Buttons](#adding-buttons)<br>
[Weather States](#weather-states)<br>
[Performance](#performance)<br>

<br>

## Usage Modes

<br>

The card has two modes that affect how it renders.

### Standalone

<img width="400" alt="Standalone mode" src="https://github.com/user-attachments/assets/00be4670-d259-4690-92ba-e440e71244ef" />

A self-contained card with weather-aware background gradients, temperature display, and a detail line (defaults to wind speed). Text automatically positions itself on the opposite side of the sun/moon to avoid overlap.

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

> **Tip:** Use `bottom_text_sensor` to replace the default wind speed with any entity. Use `text_position` to manually override where the text appears instead of letting it auto-position opposite the sun/moon.


</details>

<details>
<summary><b>Example 2 — Grid Layout</b></summary>
<br>

| Grid |
| :---: |
| <img width="400" src="https://github.com/user-attachments/assets/cf6121ab-b8d0-43c4-89e6-a29faaa62fdd" /> |

A taller card fits nicely into a grid or horizontal stack alongside other cards.

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

### Immersive

<img width="400" alt="Immersive mode" src="https://github.com/user-attachments/assets/df6cd241-4a9e-4690-a99d-4cc90b861910" />

Transparent background — blends into your dashboard as a dynamic weather layer. You can also display text overlays in this mode (see [Text Settings](#text-settings)).

> [!NOTE]
> Looks best with themes that auto-switch between light and dark. If you use a fixed theme, set `theme: dark` or `theme: light` so the card matches. See [Day / Night Logic](#day--night-logic).

<details>
<summary><b>Example 1 — Header Integration</b></summary>
<br>

| Day | Night |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/d810a910-0df0-4b7d-ae0e-a6a4c739f47a" width="100%"> | <img src="https://github.com/user-attachments/assets/5196c877-21c6-4a63-b273-99538cdbe970" width="100%"> |

Layer the weather card behind another card using the `offset` feature.

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
card_style: immersive
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

<details>
<summary>💡 Tip — Faster Initial Load</summary>

If your dashboard loads slowly, try `custom:paper-buttons-row` from HACS instead of standard HA cards. For some reason it loads significantly faster.

```yaml
type: custom:paper-buttons-row
styles:
  margin: 0px 0px -80px 0px
  justify-content: flex-start
base_config:
  layout: name
  styles:
    button:
      padding: 0px
    name:
      font-size: 26px
      padding: 0px
      font-weight: 700
buttons:
  - name: Sternschnuppe ✨
```

</details>

<br>

</details>

<details>
<summary><b>Example 2 — Full Setup</b></summary>
<br>

| Day | Night |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/6d07c654-c791-483a-9351-ce3ec33ff083" width="100%" /> | <img src="https://github.com/user-attachments/assets/f6fa7d65-8777-4746-9878-b32a1960b470" width="100%" /> |

This is how I personally use this card — as a dynamic backdrop for the entire top section, combining it with a custom house image and overlay buttons. The buttons are separate elements layered on top. See [Adding Buttons](#adding-buttons) and [Custom House Image](#custom-house-image).

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.forecast_home
full_width: true
card_height: 200
card_style: immersive
image_scale: 100
image_alignment: bottom
offset: "-50px 0px 0px 0px"
sun_moon_x_position: 100
sun_moon_y_position: 100
sun_entity: sun.sun
moon_phase_entity: sensor.moon_phase
css_mask_horizontal: false
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

<br>



<br>

## Installation

<details>
<summary><b>Method 1 — HACS (Recommended)</b></summary>

1. Open **HACS** in Home Assistant
2. Go to **Frontend** → **Custom repositories** (top-right menu)
3. Add this repository URL, category **Dashboard**
4. Click **Install**
5. Reload your dashboard

</details>

<details>
<summary><b>Method 2 — Manual</b></summary>

1. Download `atmospheric-weather-card.js` from the latest release
2. Place it in your `config/www/` folder
3. Go to **Settings** → **Dashboards** → **⋮** → **Resources**
4. Add a resource:
    - **URL:** `/local/atmospheric-weather-card.js`
    - **Type:** JavaScript Module
5. Hard-refresh your browser

</details>

<br>



<br>

## Configuration

#### Required & Recommended

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **`weather_entity`** | `string` | — | **Required.** Your weather integration entity (e.g., `weather.forecast_home`). |
| `sun_entity` | `string` | — | *Recommended.* Tracks the sun to auto-switch between day and night. |
| `moon_phase_entity` | `string` | — | *Recommended.* Shows the correct moon phase (e.g., `sensor.moon_phase`). |

<br>

<details>
<summary><strong>Layout & Dimensions</strong></summary>

<br>

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `card_style` | `string` | `immersive` | `standalone` for a solid background with text, or `immersive` for transparent. |
| `card_height` | `number` · `string` | `200` | Height in pixels. Numbers are treated as px (`110` = `110px`). |
| `square` | `boolean` | `false` | Forces the card into a perfect square. Useful for grid layouts. |
| `full_width` | `boolean` | `false` | Stretches the card edge-to-edge by removing side margins. |
| `offset` | `string` | `0px` | Shifts the card using CSS margin (e.g., `"-50px 0px 0px 0px"`). Useful for layering cards. |

</details>

<details>
<summary><strong>Sun & Moon</strong></summary>

<br>

The sun and moon share a single position — the card automatically swaps between them based on time of day.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `sun_moon_size` | `number` | *auto* | Override the sun/moon diameter in pixels. |
| `sun_moon_x_position` | `number` · `string` | `100` | Horizontal position in px from the left edge. **Negative values** position from the right edge (`-55` = 55px from right). Also accepts `center`. |
| `sun_moon_y_position` | `number` · `string` | `100` | Vertical position in px from the top. Also accepts `center`. |

</details>

<details>
<summary><strong>Visual Styling</strong></summary>

<br>

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `theme` | `string` | `auto` | Force the card appearance. See [Day / Night Logic](#day--night-logic). Values: `dark`, `light`, `night`, `day`. |
| `filter` | `string` | — | Apply a visual filter preset to the weather canvas. Options: `darken`, `vivid`, `muted`, `warm`. |
| `moon_style` | `string` | `blue` | Moon glow color in **immersive light** mode. Options: `blue`, `yellow`, `purple`, `grey`. |
| `css_mask_vertical` | `boolean` | `true` | *(Immersive only)* Fades the top and bottom edges. Set `false` to disable. |
| `css_mask_horizontal` | `boolean` | `true` | *(Immersive only)* Fades the left and right edges. Set `false` to disable. |

</details>

<details>
<summary><strong>Custom Images & Status</strong></summary>

<br>

Add your own images (e.g., a house model) to the card. Works in both modes.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `day` | `string` | — | Image path for daytime (e.g., `/local/house-day.png`). |
| `night` | `string` | — | Image path for nighttime. Falls back to the day image if empty. |
| `image_scale` | `number` | `100` | Image size as a percentage of card height. |
| `image_alignment` | `string` | `top-right` | Image placement. Options: `center`, `top-right`, `top-left`, `top-center`, `bottom`, `bottom-center`, `bottom-left`, `bottom-right`. |
| `status_entity` | `string` | — | Entity to watch (e.g., a door sensor). See [Smart Status Entity](#smart-status-entity). |
| `status_image_day` | `string` | — | Day image to show when the status entity is active. |
| `status_image_night` | `string` | — | Night image to show when the status entity is active. |

</details>

<details>
<summary><strong>Text Settings</strong></summary>

<br>

Text overlays work in **both standalone and immersive** mode. In standalone, text is enabled by default. In immersive, you can use it to add temperature or sensor readouts over the weather layer.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `top_text_sensor` | `string` | — | Entity to display as the large top text. Defaults to temperature from the weather entity. |
| `bottom_text_sensor` | `string` | — | Entity to display as the bottom detail line. Defaults to wind speed. |
| `bottom_text_icon` | `string` | *auto* | Force a specific icon next to the bottom text (e.g., `mdi:water-percent`). |
| `disable_text` | `boolean` | `false` | Hides all text. |
| `disable_bottom_text` | `boolean` | `false` | Hides only the bottom detail line. |
| `disable_bottom_icon` | `boolean` | `false` | Hides only the icon next to the bottom text. |

<br>

**Text positioning** — by default, text auto-positions opposite the sun/moon. You can override this:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `text_position` | `string` | *auto* | Where to place the text. Simple: `left`, `right`, `center`. Compound: `top-left`, `bottom-right`, `center-top`, etc. |
| `text_alignment` | `string` | `spread` | Vertical distribution when using a simple `text_position`. Values: `spread`, `top`, `center`, `bottom`. |

> [!TIP]
> **Compound values** like `top-left` or `bottom-center` set both horizontal and vertical position in one go. The order doesn't matter — `top-left` and `left-top` both work. If you also set `text_alignment`, it overrides the vertical component.

<br>

</details>

<details>
<summary><strong>Logic & Interactivity</strong></summary>

<br>

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `theme_entity` | `string` | — | Entity whose state controls the card's appearance. See [Day / Night Logic](#day--night-logic). |
| `tap_action` | `object` | — | Standard Home Assistant [tap action](https://www.home-assistant.io/dashboards/actions/). |

</details>

<br>

> [!TIP]
> **Play Weather God** — To preview different weather visuals, go to **Developer Tools → States** in Home Assistant and manually change your weather entity's state.

<br>



<br>

## Day / Night Logic

The card controls two things independently:

| | What it controls | Example |
| :--- | :--- | :--- |
| **Time** | Sun or moon? Stars or no stars? | *"Show the moon and stars"* |
| **Color scheme** | Dark or light backgrounds and particle colors? | *"Use dark cloud colors"* |

**For most setups, just set `sun_entity: sun.sun`** and both follow the real sun automatically. The split only matters when you want to mix them, like showing a moon on a light dashboard background in immersive mode.

<br>

#### How each axis is resolved

The card checks these sources **in order** and uses the first match.

<details>
<summary><strong>Time axis</strong> — sun or moon?</summary>

<br>

| Priority | Source | Triggers night when… |
| :---: | :--- | :--- |
| 1 | `theme: night` or `theme: day` | Forced by config |
| 2 | `sun_entity` | State is `below_horizon` |
| 3 | `theme_entity` | State matches a night value* |
| 4 | *Fallback* | Always day |

</details>

<details>
<summary><strong>Color scheme axis</strong> — dark or light?</summary>

<br>

| Priority | Source | Triggers dark when… |
| :---: | :--- | :--- |
| 1 | `theme: dark` or `theme: light` | Forced by config |
| 2 | `theme_entity` | State matches a night value* |
| 3 | `sun_entity` | State is `below_horizon` |
| 4 | *System* | Home Assistant's dark mode toggle in sidebar |

</details>

<br>

*\* Night values: `dark`, `night`, `evening`, `on`, `true`, `below_horizon`*

<br>

> [!NOTE]
> **Which setting should I use?**
>
> | Setting | Best for |
> | :--- | :--- |
> | `sun_entity` | Most setups. Everything follows the real sunrise and sunset. |
> | `theme_entity` | Dashboards that switch themes on a schedule or toggle. |
> | `theme: dark` / `theme: light` | Locking the card to one look permanently. |
> | `theme: night` / `theme: day` | Forcing only the time axis (moon vs. sun). The color scheme still follows your other settings. |

<br>

---

<br>

## Styling

Fine-tune the appearance via CSS variables in your theme or through `card-mod`. Text colors automatically adapt to day/night in both standalone and immersive mode.

<br>

#### Card

| Variable | Default | |
| :--- | :--- | :--- |
| `--awc-card-border-radius` | `12px` | Corner radius |
| `--awc-card-padding` | `16px` | Padding around text |
| `--awc-canvas-filter` | `none` | Custom CSS filter on the canvas (overrides the `filter` config option) |

<br>

#### Text

| Variable | Default | |
| :--- | :--- | :--- |
| `--awc-text-day` | `#333333` | Text color during day |
| `--awc-text-night` | `#FFFFFF` | Text color during night |
| `--awc-text-shadow-day` | `0 1px 2px rgba(255,255,255,0.6)` | Day text shadow |
| `--awc-text-shadow-night` | `0 1px 3px rgba(0,0,0,0.6)` | Night text shadow |
| `--awc-top-font-size` | `clamp(24px, 11cqw, 52px)` | Temperature size (responsive) |
| `--awc-top-font-weight` | `600` | Temperature weight |
| `--awc-bottom-font-size` | `clamp(15px, 5cqmin, 26px)` | Bottom text size (responsive) |
| `--awc-bottom-font-weight` | `500` | Bottom text weight |
| `--awc-bottom-opacity` | `0.7` | Bottom text opacity |
| `--awc-icon-size` | `1.1em` | Bottom icon size |
| `--awc-text-gap` | `10px` | Vertical space between top and bottom text |

---

<br>

## Custom House Image

To get the immersive look with your own home:

1. **Take a reference photo** from a corner angle to capture depth
2. **Generate a 3D model** using an AI image tool with a prompt like:
   > *Isometric view of a modern minimalist architectural model section from the outside on solid white background. [Describe your floors/rooms]. Materials are matte white and light only. No complex textures, studio lighting, very clean, simplified shapes.*
3. **Remove the background** and save as a transparent PNG
4. **Create day and night variants** with adjusted lighting and colors
5. **Upload** to `config/www/images/` and reference as `/local/images/my-house-day.png`

<br>

---

<br>

## Smart Status Entity

The status feature swaps the displayed image when an entity becomes active. The card recognizes these states as active: `on`, `true`, `open`, `unlocked`, `home`, `active`.

| Use case | Example entity | Triggers on |
| :--- | :--- | :--- |
| Door / Window | `binary_sensor.front_door` | `open` |
| Lock | `lock.front_door` | `unlocked` |
| Toggle | `input_boolean.party_mode` | `on` |
| Presence | `person.me` | `home` |

<br>

---

<br>

## Adding Buttons

The card doesn't include built-in buttons — the floating buttons in the example screenshots are separate cards layered on top.

Place a button card (like `custom:paper-buttons-row`) before the weather card, then use the `offset` setting to pull the weather card up behind it. A simplified example config is included as `paper-buttons-row-example.yaml` in the repository.

<br>

---

<br>

## Weather States

`sunny` · `clear-night` · `partlycloudy` · `cloudy` · `fog` · `rainy` · `pouring` · `snowy` · `snowy-rainy` · `hail` · `lightning` · `lightning-rainy` · `windy` · `windy-variant` · `exceptional`

Each state produces a unique combination of particle type, cloud density, wind behavior, and atmosphere. The card also reads `wind_speed` from your weather entity to influence particle movement in real-time. If the weather reports `sunny` at night, the card automatically switches to `clear-night` (and vice versa).

Beyond the core weather, ambient details appear randomly — drifting fog banks, sun rays with heat shimmer, lightning bolts, airplanes, birds in formation, shooting stars, comets, and the rare aurora borealis on clear dark nights.

<br>

---

<br>

## Performance

All weather effects are rendered by the browser using HTML5 Canvas — your Home Assistant server only handles normal entity state updates.

The animation targets 30 FPS with resolution capped at 2× device pixel ratio. When the card scrolls out of view or the browser tab is backgrounded, the animation stops completely and canvas memory is released.

> [!IMPORTANT]
> This card requires **GPU hardware acceleration** in the browser. If you notice high CPU usage, verify that hardware acceleration is enabled in your browser or kiosk settings.

<details>
<summary>⚠️ Linux / Nvidia users</summary>

Some Linux browsers default to software rendering which forces the CPU to handle animations intended for the GPU. Check your browser's hardware acceleration settings.
</details>
