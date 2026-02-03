# Atmospheric Weather Card

> **AI-DISCLAIMER:**
> This card was created with the help of AI.

| Night View | Day View |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/78327984-0097-4cea-b19e-ef20e3e6f14a" width="410"> | <img src="https://github.com/user-attachments/assets/df860538-703c-4cf0-8e61-135169ec3145" width="410"> |
| <img src="https://github.com/user-attachments/assets/f6fa7d65-8777-4746-9878-b32a1960b470" width="410"> | <img width="410" alt="image" src="https://github.com/user-attachments/assets/6d07c654-c791-483a-9351-ce3ec33ff083" />


<details>
  <summary>About the screenshots</summary>

  These images display a complete dashboard layout. Please note that this component provides the **animated weather background and house visualization only**. The overlay buttons shown are separate elements; to replicate them, please refer to the included `paper-buttons-row-example.yml`.
</details>

## Technical Features

* **Animated Ambient Environment:** Includes wind-blown leaves, drifting fog banks, randomized lightning bolts, sun rays with heat shimmer, airplanes, birds in various formations, shooting stars, comets and rare aurora borealis effects.
* **Organic Cloud Generation:** Uses a custom generator to create unique, realistic cloud shapes.
* **Dynamic Weather Physics:** Individual particles for rain, snow, and hail with custom physics for speed, turbulence, and wobbling.
* **Real-Time Moon Rendering:** Calculates and draws the exact moon illumination and terminator line based on your sensor data.
* **Performance & Battery Optimized:** Automatically pauses animations when the card is hidden from view and uses debounced resizing to prevent dashboard lag.

## Installation

<details>
<summary><b>Method 1: HACS (Recommended)</b></summary>

1. Open **HACS** in Home Assistant.
2. Go to **Frontend** > **Custom repositories** (via the top-right menu).
3. Add this repository URL and select the category **Dashboard**.
4. Click **Install**.
5. When prompted, accept the option to reload the dashboard.
</details>

<details>
<summary><b>Method 2: Manual Installation</b></summary>

1. Download the `atmospheric-weather-card.js` file from the latest release.
2. Upload the file to your Home Assistant `config/www/` folder.
3. Go to **Settings** > **Dashboards** > **Three Dots Icon** > **Resources**.
4. Click **Add Resource**:
    * **URL:** `/local/atmospheric-weather-card.js`
    * **Resource Type:** JavaScript Module
5. Refresh your browser (clear cache) to load the card.
</details>


## Configuration

### Basic Usage
The only strict requirement is a weather entity.

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.forecast_home
```

### Full Configuration (Recommended)
To get the full effect with your own home image, smart status, and moon phases:

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.forecast_home

# --- Logic & Automation ---
# Optional: Force "light" or "dark" mode manually (Priority 1)
mode: auto
# Optional: For theme-based automatic toggling (Priority 2)
theme_entity: input_select.theme
# Optional: For automatic day/night detection (Priority 3)
sun_entity: sun.sun
# Optional: For accurate moon phases
moon_phase_entity: sensor.moon_phase

# --- Layout --- 
# Optional: Detects dashboard margins and expands to use full width
full_width: true
# Optional: Move the card via margins to overlap other elements (supports negative values)
offset: "-50px 0px 0px 0px"
# Optional: Move Sun/Moon position (90 = default). 
# Positive = Distance from Left. Negative (-90) = Distance from Right.
sun_moon_x_position: -50
# Optional: Vertical distance from top (90 = default)
sun_moon_y_position: 40 

# --- Images ---
# Optional: Your custom images (transparent PNGs recommended)
day: /local/images/my-house-day.png
night: /local/images/my-house-night.png

# --- Smart Status (Optional) ---
# Changes the house image when this entity is active (e.g. on, open, unlocked, home)
status_entity: binary_sensor.front_door
status_image_day: /local/images/house-open-day.png
status_image_night: /local/images/house-open-night.png
```

## Feature Documentation

### Smart Day/Night Logic
The card uses a strict 3-layer priority system to decide if it should render Night (moon and stars, darker clouds) or Day (sun, lighter clouds) effects. This ensures your weather effects always match the background.

| Priority | Name | Config Option | Logic |
| :--- | :--- | :--- | :--- |
| **1** | **Manual Mode** | `mode` | If set to `light` or `dark`, it overrides **everything**. Perfect for fixed themes. |
| **2** | **Theme Entity** | `theme_entity` | If the entity state is "Dark" or "Night", night visuals are applied. |
| **3** | **Automation** | `sun_entity` | Fallback. Checks if sun is `below_horizon`. |

### Celestial Positioning
You can precisely control where the Sun and Moon appear.
* **`sun_moon_x_position`**: Controls horizontal placement.
    * **Positive (e.g., `90`)**: Measures pixels from the **Left**.
    * **Negative (e.g., `-90`)**: Measures pixels from the **Right**.
* **`sun_moon_y_position`**: Measures pixels from the **Top**.

### Generic Status Entity
You can override the default house image based on **any** entity's state using `status_entity`.

* **Trigger:** The image changes if the entity is in any active state: `on`, `open`, `unlocked`, `true`, `home`, `active`.

**Use Case Examples:**

| Category | Example Entity | Active State |
| :--- | :--- | :--- |
| **Door/Window** | `binary_sensor.front_door` | `open` |
| **Locks** | `lock.front_door` | `unlocked` |
| **Modes** | `input_boolean.party_mode` | `on` |
| **Presence** | `zone.home` | `active` |

### Layout Offset
You can control the exact positioning of the card using the `offset` option. This applies standard CSS margins to the card container.

* **Syntax:** `"Top Right Bottom Left"` (e.g., `"-50px 0px 0px 0px"`).
* **Purpose:** Use negative values to pull the weather card *behind* other dashboard cards, allowing for seamless layering effects.

## Custom House Image Generation

You can create a personalized 3D-style image for this card using AI image generators.

**1. Capture a Reference:** Take a clear photo of your house or the specific area you want to display. Aim for a wide shot that shows the overall layout. Taking the photo from a corner usually helps the AI understand the perspective and depth better.

**2. Generate the Image:** Use a prompt that focuses on a "clean model" aesthetic. You can use the template below, adjusting the description to match your specific home layout.

**Prompt Template:**
> Isometric view of a modern minimalist architectural model section from the outside on solid white background. [Describe your specific floors or rooms here]. Materials are matte white and light wood only. No complex textures, studio lighting, very clean, simplified shapes.

**3. Remove the Background:** The card requires a transparent PNG so that clouds and stars are visible behind the house. Use a free tool like remove.bg or Photoshop to remove the background from your generated image. 

## Adding Buttons
To achieve the exact look in the screenshots (where buttons and weather data "float" over the weather visuals), you can add a `custom:paper-buttons-row` card **before** this weather card.

There's a simplified card example in the repository which mimics the style in the screenshots. You can use the `offset` feature to achieve the overlay effect.
