![Contains](https://img.shields.io/badge/contains-★_shooting_stars-333?style=flat-square)

# Atmospheric Weather Card

I started this project wanting a visually appealing weather card, but I ended up building a full physics engine. The code generates dynamically moving clouds and rain that never repeat. It also includes random ambient details like wind-blown leaves, airplanes, bird formations, shooting stars, and, if you're lucky, the rare aurora borealis.

https://github.com/user-attachments/assets/b7462f32-f193-4b5f-81c6-c6de321b8c42

> **AI Disclaimer** — This card was created with the help of AI tools. I would never have had the patience to create these weather effects myself.

## Contents

* [Usage Modes](#usage-modes)
* [Installation](#installation)
* [Configuration](#configuration)
* [Day / Night Logic](#day--night-logic)
* [Styling](#styling)
* [Custom House Image](#custom-house-image)
* [Smart Status Entity](#smart-status-entity)
* [Adding Buttons](#adding-buttons)
* [Weather States](#weather-states)
* [Performance](#performance)

<br>

## Usage Modes

The card features two primary modes that change how it renders on your dashboard.

<br>

### Standalone

<img width="400" alt="Standalone mode" src="https://github.com/user-attachments/assets/00be4670-d259-4690-92ba-e440e71244ef" />

This is a self-contained card featuring weather-aware background gradients.

<details>
<summary><b>Example 1 — Basic Card</b></summary>

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

> [!TIP]
> Use `bottom_text_sensor` to replace the default wind speed with any entity. Use `text_position` to manually override where the text appears instead of letting it auto-position opposite the sun/moon.

</details>

<details markdown="1">
<summary><b>Example 2 — Square Card</b></summary>

<img width="400" src="https://github.com/user-attachments/assets/5cb58257-4fae-4661-86f9-671b279e3eaf" alt="Grid Layout Example" />

Setting `square: true` allows the card to fit perfectly within a grid. If you want, you can also get a totally round card by adding `--awc-card-border-radius: 100%` to your Home Assistant theme.

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.forecast_home
card_style: standalone
theme: light
sun_moon_size: 70
square: true
text_alignment: center
text_position: center
sun_entity: sun.sun
disable_text: true
sun_moon_x_position: center
sun_moon_y_position: center
tap_action:
  action: more-info
  entity: weather.forecast_home
```

<details>
<summary><b>YAML for the buttons (advanced)</b></summary>

The buttons shown in the screenshot use the `paper-buttons-row` card. While it is highly flexible, configuring it can be slightly complex. The following example demonstrates how to create the buttons within the grid layout.

```yaml
type: custom:paper-buttons-row
styles:
  display: grid
  grid-template-columns: 1fr
  grid-template-rows: 1fr 1fr
  aspect-ratio: 1
  align-items: stretch
  gap: 12px
base_config:
  layout: icon|name_state
  styles:
    button:
      background-color: var(--ha-card-background)
      box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.08)
      border-radius: var(--ha-card-border-radius)
      justify-content: flex-start
      align-items: center
      padding: 16px
    state:
      font-size: 24px
      font-weight: 700
      white-space: nowrap
      align-self: flex-start
      padding: 0px
    name:
      font-size: 12px
      font-weight: 700
      white-space: nowrap
      align-self: flex-start
      padding: 0px
      opacity: 0.5
    icon:
      border-radius: var(--ha-card-border-radius)
      background-color: "#F6F5F3"
      display: flex
      justify-content: center
      align-items: center
      height: 100%
      aspect-ratio: 1
      "--mdc-icon-size": 26px
      color: "#BDBBB8"
      margin-right: 20px
buttons:
  - name: Innen
    icon: mdi:home-thermometer-outline
    entity: sensor.your_indoor_temperature_sensor
    state:
      postfix: °
  - name: Außen
    icon: mdi:cloud-outline
    entity: sensor.your_outdoor_temperature_sensor
    state:
      postfix: °
```

</details>
</details>

<br>

### Immersive

<img width="400" alt="Immersive mode" src="https://github.com/user-attachments/assets/df6cd241-4a9e-4690-a99d-4cc90b861910" />

This mode uses a transparent background, allowing the card to blend seamlessly into your dashboard as a dynamic weather layer.

> [!NOTE]
> This mode looks best with themes that automatically switch between light and dark. If you use a fixed theme, set `theme: dark` or `theme: light` in the card configuration so it matches. See [Day / Night Logic](#day--night-logic).

<details>
<summary><b>Example 1 — Header Card</b></summary>

| Day | Night |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/f5308bc6-c5da-495f-8cc3-b8816aaa758e" width="100%"> | <img src="https://github.com/user-attachments/assets/d954f22e-a083-4570-9779-1b8935f5d07a" width="100%"> |

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.forecast_home
card_style: immersive
card_height: 160
sun_moon_size: 40
text_position: top-left
top_text_sensor: sensor.time
bottom_text_sensor: sensor.weather_description
sun_entity: sun.sun
offset: 24px 0px 12px 0px
sun_moon_x_position: -80
sun_moon_y_position: 80
moon_phase_entity: sensor.moon_phase
tap_action:
  action: none

```


</details>

<details>
<summary><b>Example 2 — Full Setup</b></summary>

| Day | Night |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/6d07c654-c791-483a-9351-ce3ec33ff083" width="100%" /> | <img src="https://github.com/user-attachments/assets/f6fa7d65-8777-4746-9878-b32a1960b470" width="100%" /> |

This is how I personally use this card: as a dynamic backdrop for the entire top section of my dashboard, combined with a custom house image and overlay buttons. Note that the buttons are separate elements layered on top. See [Adding Buttons](#adding-buttons) and [Custom House Image](#custom-house-image).

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.forecast_home
full_width: true
card_height: 200
card_style: immersive
image_scale: 100
image_alignment: bottom
disable_text: true
offset: "-50px 0px 0px 0px"
sun_moon_x_position: 100
sun_moon_y_position: 100
sun_entity: sun.sun
moon_phase_entity: sensor.moon_phase
css_mask_horizontal: false
day: /local/images/dashboard/home-day.png
night: /local/images/dashboard/home-night.png
status_entity: binary_sensor.front_door
status_image_day: /local/images/dashboard/home-day-door-open.png
status_image_night: /local/images/dashboard/home-night-door-open.png
tap_action:
  action: navigate
  navigation_path: "#popup_climate"
```

</details>

<br>

## Installation

<details>
<summary><b>Method 1 — HACS (Recommended)</b></summary>

1. Open **HACS** in Home Assistant.
2. Navigate to **Frontend** → **Custom repositories** (via the top-right menu).
3. Add this repository URL and select the **Dashboard** category.
4. Click **Install**.
5. Reload your dashboard.

</details>

<details>
<summary><b>Method 2 — Manual</b></summary>

1. Download `atmospheric-weather-card.js` from the latest release.
2. Place the file in your `config/www/` folder.
3. Navigate to **Settings** → **Dashboards** → **⋮** → **Resources**.
4. Add a new resource:
    * **URL:** `/local/atmospheric-weather-card.js`
    * **Type:** JavaScript Module
5. Hard-refresh your browser.

</details>

<br>

## Configuration

#### Required & Recommended

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **`weather_entity`** | `string` | — | **Required.** Your weather integration entity (e.g., `weather.forecast_home`). |
| `sun_entity` | `string` | — | *Recommended.* Tracks the sun to auto-switch between day and night. |
| `moon_phase_entity` | `string` | — | *Recommended.* Displays the correct moon phase (e.g., `sensor.moon_phase`). |

<details>
<summary><strong>Layout & Dimensions</strong></summary>

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `card_style` | `string` | `immersive` | Set to `standalone` for a solid background with text, or `immersive` for a transparent background. |
| `card_height` | `number` · `string` | `200` | Height in pixels. Numbers are automatically treated as px (e.g., `110` becomes `110px`). |
| `square` | `boolean` | `false` | Forces the card into a perfect square. Highly useful for grid layouts. |
| `full_width` | `boolean` | `false` | Stretches the card edge-to-edge by removing side margins. |
| `offset` | `string` | `0px` | Shifts the card using CSS margin (e.g., `"-50px 0px 0px 0px"`). Useful when layering cards. |

</details>

<details>
<summary><strong>Sun & Moon</strong></summary>

The sun and moon share a single coordinate; the card automatically swaps them based on the time of day.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `sun_moon_size` | `number` | *auto* | Overrides the sun/moon diameter in pixels. |
| `sun_moon_x_position` | `number` · `string` | `100` | Horizontal position in pixels from the left edge. **Negative values** position it from the right edge (e.g., `-55` means 55px from the right). Also accepts `center`. |
| `sun_moon_y_position` | `number` · `string` | `100` | Vertical position in pixels from the top. Also accepts `center`. |

</details>

<details>
<summary><strong>Visual Styling</strong></summary>

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `theme` | `string` | `auto` | Forces the card's appearance. See [Day / Night Logic](#day--night-logic). Accepted values: `dark`, `light`, `night`, `day`. |
| `filter` | `string` | — | Applies a visual filter preset to the weather canvas. Options: `darken`, `vivid`, `muted`, `warm`. |
| `moon_style` | `string` | `blue` | The moon's glow color when in **immersive light** mode. Options: `blue`, `yellow`, `purple`, `grey`. |
| `css_mask_vertical` | `boolean` | `true` | *(Immersive only)* Fades the top and bottom edges. Set to `false` to disable. |
| `css_mask_horizontal` | `boolean` | `true` | *(Immersive only)* Fades the left and right edges. Set to `false` to disable. |

</details>

<details>
<summary><strong>Custom Images & Status</strong></summary>

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
<summary><strong>Text Settings</strong></summary>

Text overlays work seamlessly in **both standalone and immersive** modes. In standalone mode, text is enabled by default. In immersive mode, you can use text settings to add temperature or sensor readouts over the animated weather layer.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `top_text_sensor` | `string` | — | The entity to display as the large top text. Defaults to the temperature from your weather entity. |
| `bottom_text_sensor` | `string` | — | The entity to display as the bottom detail line. Defaults to wind speed. |
| `bottom_text_icon` | `string` | *auto* | Forces a specific icon next to the bottom text (e.g., `mdi:water-percent`). |
| `disable_text` | `boolean` | `false` | Hides all text overlays entirely. |
| `disable_bottom_text` | `boolean` | `false` | Hides only the bottom detail line. |
| `disable_bottom_icon` | `boolean` | `false` | Hides only the icon next to the bottom text. |

**Text Positioning**
By default, text auto-positions to the side opposite the sun or moon. You can manually override this:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `text_position` | `string` | *auto* | Where to place the text. Simple values: `left`, `right`, `center`. Compound values: `top-left`, `bottom-right`, `center-top`, etc. |
| `text_alignment` | `string` | `spread` | Controls vertical distribution when using a simple `text_position`. Values: `spread`, `top`, `center`, `bottom`. |

> [!TIP]
> **Compound values** like `top-left` or `bottom-center` configure both horizontal and vertical positions simultaneously. The order of the words doesn't matter (e.g., `top-left` and `left-top` work exactly the same). If you set `text_alignment` alongside a compound value, it will override the vertical component of the compound setting.

</details>

<details>
<summary><strong>Logic & Interactivity</strong></summary>

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `theme_entity` | `string` | — | An entity whose state dictates the card's appearance. See [Day / Night Logic](#day--night-logic). |
| `tap_action` | `object` | — | A standard Home Assistant [tap action](https://www.home-assistant.io/dashboards/actions/). |

</details>

> [!TIP]
> **Play Weather God** — To easily preview different weather visuals, navigate to **Developer Tools → States** in Home Assistant and manually change the state of your weather entity.

<br>

## Day / Night Logic

This card handles two separate aspects of its appearance independently:

| | What it controls | Example |
| :--- | :--- | :--- |
| **Time** | Sun vs. moon, stars vs. no stars. | *"Show the moon and stars"* |
| **Color Scheme** | Dark vs. light backgrounds and particle colors. | *"Use dark cloud colors"* |

**For the majority of setups, simply setting `sun_entity: sun.sun` is enough.** Both aspects will automatically follow the real-world sun. The distinction between time and color scheme is only important if you want to mix states, such as displaying a moon on a light dashboard background in immersive mode.

<br>

#### How Each Axis is Resolved

The card evaluates these sources **in exact order** and applies the first match it finds.

<details>
<summary><strong>Time Axis</strong> — Sun or Moon?</summary>

| Priority | Source | Triggers Night When… |
| :---: | :--- | :--- |
| 1 | `theme: night` or `theme: day` | Forced manually via config. |
| 2 | `sun_entity` | State is `below_horizon`. |
| 3 | `theme_entity` | State matches a defined night value.* |
| 4 | *Fallback* | Always defaults to day. |

</details>

<details>
<summary><strong>Color Scheme Axis</strong> — Dark or Light?</summary>

| Priority | Source | Triggers Dark When… |
| :---: | :--- | :--- |
| 1 | `theme: dark` or `theme: light` | Forced manually via config. |
| 2 | `theme_entity` | State matches a defined night value.* |
| 3 | `sun_entity` | State is `below_horizon`. |
| 4 | *System* | Follows Home Assistant's dark mode toggle in the sidebar. |

</details>

*\* Defined night values include: `dark`, `night`, `evening`, `on`, `true`, `below_horizon`*

> [!NOTE]
> **Which setting should I use?**
>
> * **`sun_entity`**: Best for most setups. Everything aligns with the real sunrise and sunset.
> * **`theme_entity`**: Ideal for dashboards that switch themes based on schedules or toggles.
> * **`theme: dark` / `theme: light`**: Use this to permanently lock the card to one specific color scheme.
> * **`theme: night` / `theme: day`**: Use this to force the time axis (moon vs. sun) while letting the color scheme follow your other environment settings.

<br>

## Styling

You can fine-tune the card's appearance using CSS variables in your theme or via `card-mod`. Text colors automatically adapt to day and night states in both standalone and immersive modes.

#### Card Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `--awc-card-border-radius` | `12px` | Adjusts the corner radius. |
| `--awc-card-padding` | `16px` | Padding space around the text. |
| `--awc-canvas-filter` | `none` | Applies a custom CSS filter to the canvas (this overrides the `filter` config option). |

#### Text Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `--awc-text-day` | `#333333` | Text color during the daytime. |
| `--awc-text-night` | `#FFFFFF` | Text color during the nighttime. |
| `--awc-text-shadow-day` | `0 1px 2px rgba(255,255,255,0.6)` | Text shadow effect for daytime. |
| `--awc-text-shadow-night` | `0 1px 3px rgba(0,0,0,0.6)` | Text shadow effect for nighttime. |
| `--awc-top-font-size` | `clamp(24px, 11cqw, 52px)` | Temperature text size (dynamically responsive). |
| `--awc-top-font-weight` | `600` | Temperature text weight. |
| `--awc-bottom-font-size` | `clamp(15px, 5cqmin, 26px)` | Bottom text size (dynamically responsive). |
| `--awc-bottom-font-weight` | `500` | Bottom text weight. |
| `--awc-bottom-opacity` | `0.7` | Opacity of the bottom text. |
| `--awc-icon-size` | `1.1em` | Size of the bottom icon. |
| `--awc-text-gap` | `10px` | Vertical spacing between the top and bottom text elements. |

<br>

## Custom House Image

To achieve the immersive look featuring your own home, follow these steps:

1. **Take a reference photo** from a corner angle to properly capture the depth of the house.
2. **Generate a 3D model** using an AI image tool. Use a prompt similar to:
   > *Isometric view of a modern minimalist architectural model section from the outside on solid white background. [Describe your floors/rooms]. Materials are matte white and light only. No complex textures, studio lighting, very clean, simplified shapes.*
3. **Remove the background** and save the resulting image as a transparent PNG.
4. **Create day and night variants** by adjusting the lighting and colors appropriately.
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

The weather card itself does not include built-in buttons. The floating buttons seen in the example screenshots are separate cards layered over the weather animation.

To replicate this, place a button card (such as `custom:paper-buttons-row`) immediately before the weather card in your dashboard config. Then, use the weather card's `offset` setting to pull the weather background up and directly behind the buttons. A simplified configuration example is included as `paper-buttons-row-example.yaml` in the repository.

<br>

## Weather States

The card supports the following weather states: `sunny` · `clear-night` · `partlycloudy` · `cloudy` · `fog` · `rainy` · `pouring` · `snowy` · `snowy-rainy` · `hail` · `lightning` · `lightning-rainy` · `windy` · `windy-variant` · `exceptional`

Each state triggers a unique combination of particle types, cloud densities, wind behaviors, and atmospheric lighting. The card also reads the `wind_speed` directly from your weather entity to dynamically influence particle movement in real-time. If your weather integration reports `sunny` during the night, the card is smart enough to automatically switch to `clear-night` (and vice versa).

In addition to core weather conditions, ambient details will appear randomly. Keep an eye out for drifting fog banks, sun rays with heat shimmer, lightning bolts, airplanes, bird formations, shooting stars, comets, and the rare aurora borealis on clear, dark nights.

<br>

## Performance

All weather effects are rendered by your browser using HTML5 Canvas—this means your Home Assistant server only handles normal entity state updates without taking on any graphical load.

The animation targets 30 FPS and caps the resolution at a 2× device pixel ratio. Whenever the card scrolls out of view or the browser tab is sent to the background, the animation pauses entirely and the canvas memory is gracefully released to save resources.

> [!IMPORTANT]
> This card requires **GPU hardware acceleration** in the browser to function smoothly. If you experience high CPU usage, please verify that hardware acceleration is enabled in your browser or kiosk settings.

<details>
<summary>⚠️ Linux / Nvidia Users</summary>

Some Linux browsers default to software rendering, which forces the CPU to process animations intended for the GPU. If you are experiencing performance drops on Linux, carefully check your browser's hardware acceleration configuration.

</details>
