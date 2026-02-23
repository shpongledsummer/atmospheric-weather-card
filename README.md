![Contains](https://img.shields.io/badge/contains-★_shooting_stars-333?style=flat-square)



### ATMOSPHERIC WEATHER CARD

I started this because I wanted a weather card that looked nice, but I ended up building a physics engine. The code generates the clouds and rain so they move naturally and never repeat. It also adds random details based on the current weather like wind-blown leaves, planes, birds and shooting stars to make the dashboard feel alive. And if you're lucky, you might even see the rare aurora borealis.

https://github.com/user-attachments/assets/b7462f32-f193-4b5f-81c6-c6de321b8c42

> **AI Disclaimer** — This card was created with the help of AI tools. I would never have the patience to create those weather effects myself.

<br>

#### CONTENTS

[Usage Modes](#usage-modes)<br>
[Installation](#installation)<br>
[Configuration](#configuration)<br>
[Styling the Card](#styling-the-card)<br>
[Day / Night Logic](#day--night-logic)<br>
[Custom House Image](#custom-house-image)<br>
[Smart Status Entity](#smart-status-entity)<br>
[Adding Buttons](#adding-buttons)<br>
[Weather States](#supported-weather-states)<br>
[Performance](#performance)

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

> **Tip:** Use `bottom_text_sensor` to replace the default **Wind Speed** with any entity (e.g., humidity or address). The sun and moon share a single position, swapping based on time and weather. In standalone mode, the text automatically shifts to the opposite side.


</details>

<details>
<summary><b>Example 2 — Grid Layout</b></summary>
<br>

| Grid |
| :---: |
| <img width="400" src="https://github.com/user-attachments/assets/cf6121ab-b8d0-43c4-89e6-a29faaa62fdd" /> |

You can use a taller card height to fit the card into a grid or horizontal stack alongside other cards. This example pairs it with a graph and a tile card.

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

### Immersive Mode

<img width="400" alt="image" src="https://github.com/user-attachments/assets/df6cd241-4a9e-4690-a99d-4cc90b861910" />

Renders with a fully transparent background so it blends seamlessly into your dashboard.

> [!IMPORTANT]
> Immersive mode works best with themes that **automatically switch between light and dark.** If you prefer a fixed theme (always light or always dark), you can manually force the card to match. While this avoids a jarring contrast, it lacks the full visual depth of the auto-switching mode. See [Day / Night Logic](#day--night-logic).

<details>
<summary><b>Example 1 — Header Integration</b></summary>
<br>

| Day | Night |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/d810a910-0df0-4b7d-ae0e-a6a4c739f47a" width="100%"> | <img src="https://github.com/user-attachments/assets/5196c877-21c6-4a63-b273-99538cdbe970" width="100%"> |

This layout gives the weather effects space to breathe. You can combine it with any other card and layer both cards with the `offset` feature.

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
<summary><b>💡 Tip: Faster Initial Load Times</b></summary>

If your dashboard loads slowly, try using the `paper-buttons-row` custom card from HACS instead of standard Home Assistant cards. For some reason it loads significantly faster.

**Example configuration for a simple header:**
```yaml
type: custom:paper-buttons-row
styles:
  margin: 0px 0px -80px 0px  # Use negative margin here instead of on weather card (faster)
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

This setup shows how I use this card. It uses it as a dynamic backdrop for the entire top section of the view, combining it with a custom image and overlay buttons. The card provides the animated weather and image; the buttons shown in the screenshots are separate elements layered on top. [See Adding Buttons](#adding-buttons) and [Custom House Image](#custom-house-image) for details.

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


### CONFIGURATION

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **`weather_entity`** | `string` | **Required** | Your weather integration entity (e.g., `weather.forecast_home`). |
| **`sun_entity`** | `string` | *Recommended* | Used to automatically track the sun and switch between day and night. |
| **`moon_phase_entity`** | `string` | *Recommended* | Used to show the correct moon phase. |

<details>
<summary><strong>Style & Appearance</strong></summary>

*Settings that change the visual look of the card.*

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `card_style` | `string` | `immersive` | Set to `standalone` for a solid background with text, or `immersive` for a transparent background. |
| `theme` | `string` | `auto` | Force the card to always look dark or light (`dark`, `light`, `night`, `day`). |
| `moon_style` | `string` | `blue` | Choose the moon color for the light theme (`blue` or `yellow`). |

</details>

<details>
<summary><strong>Layout & Dimensions</strong></summary>

*Settings to control the size, shape, and placement of the card.*

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `card_height` | `number\|string` | `110` | Height of the card in pixels (`110` means `110px`). |
| `square` | `boolean` | `false` | Forces the card into a perfect square. Great for grid layouts. |
| `full_width` | `boolean` | `false` | Stretches the card edge-to-edge by removing the side margins. |
| `offset` | `string` | `0px` | Move the card around using CSS margins (e.g., `"-50px 0px 0px 0px"`). |

</details>

<details>
<summary><strong>Sky & Elements</strong></summary>

*Adjust the positioning and scale of the sky objects.*

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `sun_moon_size` | `number` | `100` | Change the overall size of the sun and moon. |
| `sun_moon_x_position` | `number` | `100` | Move the sun/moon left or right. |
| `sun_moon_y_position` | `number` | `100` | Move the sun/moon up or down. |

</details>

<details>
<summary><strong>Custom Images & Status</strong></summary>

*Add your own home images to the card (works in both standalone and immersive modes).*

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `day` | `string` | — | Image to show during the day (e.g., `/local/house-day.png`). |
| `night` | `string` | — | Image to show at night. Uses the day image if you leave this empty. |
| `image_scale` | `number` | `100` | Change the image size (percentage of the card height). |
| `image_alignment` | `string` | `top-right` | Where to place the image (`center`, `bottom-center`, `top-right`, etc.). |
| `status_entity` | `string` | — | An entity to watch (like a door sensor or lock). |
| `status_image_day` | `string` | — | Image to show during the day when the status entity is active. |
| `status_image_night` | `string` | — | Image to show at night when the status entity is active. |

</details>

<details>
<summary><strong>Text & Data (Standalone Only)</strong></summary>

*Settings that only apply when `card_style: standalone` is active.*

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `top_text_sensor` | `string` | — | Sensor to show at the top (defaults to Temperature). |
| `bottom_text_sensor` | `string` | — | Sensor to show at the bottom (defaults to Wind Speed). |
| `bottom_text_icon` | `string` | *Auto* | Force a specific icon to show next to the bottom text. |
| `disable_text` | `boolean` | `false` | Hides all text completely. |
| `disable_bottom_icon` | `boolean` | `false` | Hides only the icon next to the bottom text. |

</details>

<details>
<summary><strong>Edge Fades (Immersive Only)</strong></summary>

*Settings that only apply when `card_style: immersive` is active.*

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `css_mask_vertical` | `boolean` | `true` | Turns off the top/bottom fade effect. Useful for tall headers. |
| `css_mask_horizontal` | `boolean` | `true` | Turns off the left/right fade effect. Useful for full-width headers. |

</details>

<details>
<summary><strong>Interaction & Logic</strong></summary>

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `theme_entity` | `string` | — | An entity that triggers night mode (e.g., a custom toggle). |
| `tap_action` | `object` | — | Standard Home Assistant click actions. |

</details>


<br>

> [!TIP]
> **Play Weather God**<br>
> To test out how different weather visuals look, you can manually override the weather at any time by navigating to the **Developer Tools > States** tab in Home Assistant.

---

### STYLING THE CARD

In addition to the **[Layout & Appearance](#configuration)** settings detailed above, you can use these CSS variables within your theme or via `card-mod` to fine-tune the appearance. These are primarily used when `card_style: standalone` is active.

| Variable | Default | Description |
| :--- | :--- | :--- |
| `--awc-text-day` | `#333333` | **Day Mode:** Color of all text and icons. |
| `--awc-text-night` | `#FFFFFF` | **Night Mode:** Color of all text and icons. |
| `--awc-card-border-radius` | `12px` | Corner radius of the card container. |
| `--awc-card-padding` | `16px` | Padding around the internal text elements. |
| `--awc-top-font-size` | `52px` | Font size of the temperature text. |
| `--awc-bottom-font-size` | `26px` | Font size of the bottom text. |
| `--awc-icon-size` | `1.1em` | Scaling factor for the bottom status icon. |

<br>

---

### DAY / NIGHT LOGIC

The card determines whether to render a day or night scene using a 4-level priority chain. It checks each level in order and uses the first match.

| Priority | Source | Config Option | Logic |
| :---: | :--- | :--- | :--- |
| **1** | **Manual Override** | `theme` | Directly forces the look. Set to `dark`/`night` for a dark card or `light`/`day` for a light card. |
| **2** | **Theme Entity** | `theme_entity` | Tracks a specific entity (e.g., a "Dark Mode" toggle). Activates dark mode if the state is `dark`, `night`, `evening`, `on`, `true`, or `below_horizon`. |
| **3** | **Sun Entity** | `sun_entity` | Automatically switches based on the sun's position. Uses `below_horizon` to trigger the dark theme. |
| **4** | **System Setting** | — | The final fallback. It simply matches your global Home Assistant dark mode toggle in the sidebar. |

> [!NOTE]
> **Which setting should you use?**
> * **`sun_entity`:** Best for most setups. The card will naturally change with the real-world sunrise and sunset.
> * **`theme_entity`:** Best if your dashboard switches between light and dark mode based on a custom toggle or schedule, rather than the actual sun.
> * **`theme`:** Best for fixed dashboards. Use this to permanently lock the card to either dark or light mode so it matches a static background.

<br>

---

### CUSTOM HOUSE IMAGE

To get the immersive look with your own home:

1. **Take a reference photo** from a corner angle to capture depth.
2. **Generate a 3D model image** using an AI image tool with a prompt like:
   > Isometric view of a modern minimalist architectural model section from the outside on solid white background. [Describe your floors/rooms]. Materials are matte white and light only. No complex textures, studio lighting, very clean, simplified shapes.
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

<br>

---

### ADDING BUTTONS

To keep this card fast and focused strictly on the weather engine, it does not include built-in buttons. Instead, the floating buttons you see in the example immersive mode screenshots are a visual trick using separate cards layered on top. 

This is a somewhat advanced dashboard technique. You achieve this look by placing a separate button card (like `custom:paper-buttons-row`) directly before the weather card in your dashboard layout. You then use the `offset` setting on the weather card to pull it up, sliding it underneath the buttons so it acts as a dynamic background. You can find a simplified version of the configuration used in the screenshots in the included `paper-buttons-row-example.yaml` file in the repository.

<br>

---

### SUPPORTED WEATHER STATES

`sunny` · `clear-night` · `partlycloudy` · `cloudy` · `fog` · `rainy` · `pouring` · `snowy` · `snowy-rainy` · `hail` · `lightning` · `lightning-rainy` · `windy` · `windy-variant` · `exceptional`

Each state sets a unique combination of particle type, count, cloud density, wind speed, and atmosphere. Beyond the core weather, the sky is populated with ambient elements that appear on their own — drifting fog banks, wind-blown leaves, sun rays with heat shimmer, lightning bolts, airplanes, birds in formation, shooting stars, comets, and the rare Aurora Borealis at night. The card also reads `wind_speed` from your weather entity to influence particle behavior in real time.

<br>

---

### PERFORMANCE

<details>
  <summary><b>⚠️ Note for Linux/Nvidia users</b></summary>

  Please verify that <b>Hardware Acceleration</b> is enabled in your browser. Some Linux browsers default to software rendering which forces the CPU to handle animations intended for the GPU.
</details>

Rendering of the weather animations is handled entirely by the client browser using HTML5 Canvas. Server impact is limited to standard state updates.

* **Resource Management**
  Target framerate is capped at 30 FPS and resolution at 2x DPR to limit GPU usage on the client device.
* **Visibility Control**
  The animation loop stops completely when the card is not visible or the tab is backgrounded.
* **Responsive**
  Native support for Section-based dashboards with debounced resizing.

> [!NOTE]
> **Hardware Requirement:** This card relies on GPU Hardware Acceleration. If high CPU usage is observed, verify that hardware acceleration is enabled in the browser or kiosk settings. Software-only rendering will significantly degrade performance.
