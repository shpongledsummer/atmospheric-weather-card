# Atmospheric Weather Card

> **AI-DISCLAIMER:**
> This card was created with the help of AI.

## Table of Contents

* [Screenshots (The Complete Scene)](#screenshots-the-complete-scene)
* [Screenshots (Standalone Weather Visuals)](#screenshots-standalone-weather-visuals)
* [Technical Features](#technical-features)
* [Installation](#installation)
* [Configuration](#configuration)
* [Feature Documentation](#feature-documentation)
* [Custom House Image Generation](#custom-house-image-generation)
* [Adding Buttons](#adding-buttons)

---

## Screenshots (The Complete Scene)

| Day (Light Mode) | Night (Dark Mode) |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/df860538-703c-4cf0-8e61-135169ec3145" width="100%" alt="Dashboard Day View 1" /> | <img src="https://github.com/user-attachments/assets/78327984-0097-4cea-b19e-ef20e3e6f14a" width="100%" alt="Dashboard Night View 1" /> |
| <img src="https://github.com/user-attachments/assets/6d07c654-c791-483a-9351-ce3ec33ff083" width="100%" alt="Dashboard Day View 2" /> | <img src="https://github.com/user-attachments/assets/f6fa7d65-8777-4746-9878-b32a1960b470" width="100%" alt="Dashboard Night View 2" /> |

<details>
  <summary>About the screenshots</summary>

  These images display a complete dashboard layout. Please note that this component provides the **animated weather background and house visualization only**. The overlay buttons shown are separate elements; to replicate them, please refer to the included `paper-buttons-row-example.yml`.
</details>

## Screenshots (Standalone Weather Visuals)

| Day | Night |
| :---: | :---: |
| **Partly Cloudy** <br> <img src="https://github.com/user-attachments/assets/ff05d0f2-87d2-4dd9-9253-e1fa99d7c7b7" width="100%" alt="Day - Partly Cloudy" /> | **Stormy Weather** <br> <img src="https://github.com/user-attachments/assets/efb3ed85-16c2-494c-bc10-65c3006b2c6f" width="100%" alt="Night - Stormy" /> |
| **Windy Weather** <br> <img src="https://github.com/user-attachments/assets/9e2606a7-5838-4d32-9031-f95dc0f03fe4" width="100%" alt="Day - Windy" /> | **Partly Cloudy (a Comet!)** <br> <img src="https://github.com/user-attachments/assets/814dc888-2601-4c3c-91c5-a9ff6bcdc578" width="100%" alt="Night - Comet" /> |
| **Rainy Weather** <br> <img src="https://github.com/user-attachments/assets/0fa2a2eb-d869-4d84-a6aa-b0b1999d49ea" width="100%" alt="Day - Rainy" /> | **Aurora Borealis** <br> <img src="https://github.com/user-attachments/assets/9591e9ef-50a6-4d67-be23-a6f51b92efd6" width="100%" alt="Night - Aurora" /> |

## Technical Features

* **Animated Ambient Environment:** Includes wind-blown leaves, drifting fog banks, randomized lightning bolts, and sun rays with heat shimmer. The sky stays busy with airplanes, birds in various formations, shooting stars, comets, and the rare Aurora Borealis.
* **Organic Cloud Generation:** Uses a custom generator to create unique, realistic cloud shapes every time, ensuring your sky never looks repetitive.
* **Dynamic Weather Physics:** Individual particles for rain, snow, and hail with custom physics for speed, turbulence, and wobbling.
* **Real-Time Moon Rendering:** Calculates and draws the exact moon illumination and terminator line based on your sensor data.
* **Supports using your own custom image:** Personalize the card by displaying your own image on the right side. It’s perfect for a transparent PNG of your home, boat, or wherever your Home Assistant is running.
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
mode: auto
theme_entity: input_select.theme
sun_entity: sun.sun
moon_phase_entity: sensor.moon_phase

# --- Layout ---
full_width: true
offset: "-50px 0px 0px 0px"
sun_moon_x_position: -50
sun_moon_y_position: 40 

# --- Images ---
day: /local/images/my-house-day.png
night: /local/images/my-house-night.png

# --- Smart Status (Optional) ---
status_entity: binary_sensor.front_door
status_image_day: /local/images/house-open-day.png
status_image_night: /local/images/house-open-night.png
```

## Feature Documentation

### Smart Day/Night Logic
The card uses a strict 3-layer priority system to decide between Night and Day effects.

| Priority | Name | Config Option | Logic |
| :--- | :--- | :--- | :--- |
| **1** | **Manual Mode** | `mode` | If set to `light` or `dark`, it overrides everything. |
| **2** | **Theme Entity** | `theme_entity` | Applies night visuals if state is "Dark" or "Night". |
| **3** | **Automation** | `sun_entity` | Fallback. Checks if sun is `below_horizon`. |

### Celestial Positioning
* **`sun_moon_x_position`**: Horizontal placement. Positive = from Left, Negative = from Right.
* **`sun_moon_y_position`**: Vertical distance from the Top.

### Generic Status Entity
Trigger an image change if the entity is in any active state: `on`, `open`, `unlocked`, `true`, `home`, `active`.

| Category | Example Entity | Active State |
| :--- | :--- | :--- |
| **Door/Window** | `binary_sensor.front_door` | `open` |
| **Locks** | `lock.front_door` | `unlocked` |
| **Modes** | `input_boolean.party_mode` | `on` |
| **Presence** | `zone.home` | `active` |

### Layout Offset
* **Syntax:** `"Top Right Bottom Left"` (e.g., `"-50px 0px 0px 0px"`).
* **Purpose:** Use negative values to pull the weather card behind other elements.

## Custom House Image Generation

1. **Capture a Reference:** Take a photo from a corner to help the AI understand depth.
2. **Generate the Image:** Use the prompt below for a clean 3D architectural look.

> **Prompt Template:**
> Isometric view of a modern minimalist architectural model section from the outside on solid white background. [Describe your specific floors or rooms here]. Materials are matte white and light wood only. No complex textures, studio lighting, very clean, simplified shapes.

3. **Remove the Background:** Save as a transparent PNG so weather effects appear behind the house.

## Adding Buttons
To achieve the floating button look, place a `custom:paper-buttons-row` card before this card and use the `offset` feature to layer them.
