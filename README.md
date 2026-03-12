![Contains](https://img.shields.io/badge/contains-★_shooting_stars-333?style=flat-square)

## Atmospheric Weather Card

<img width="400" alt="image" src="https://github.com/user-attachments/assets/03197044-ca08-4b18-b866-5e02eed86b9a" />

A flexible, detail-oriented weather card for Home Assistant. It uses your local weather (and much more) to create live visuals, blending effects like wind gusts and thunderstorms with little details like passing planes, birds and shooting stars. You can run it standalone, embed other cards inside it, or use it as an immersive background.

<details>
  <summary><strong>Watch a demo</strong></summary>

  https://github.com/user-attachments/assets/1005c3cb-9422-4d30-b67a-dca154397c7a
</details>

<br>

> **A note on AI:** I've been pretty skeptical of projects that use AI tools because they often end up as a mess. This project is basically a personal challenge to figure out why that is, and to see what happens when AI is forced to act strictly as an amplifier for things you are already good at.

## Contents

[Installation](#installation)<br>
[Usage Modes (examples)](#usage-modes)<br>
[Configuration](#configuration)<br>
[Day / Night Logic](#day--night-logic)<br>
[Styling](#styling)<br>
[Custom House Image](#custom-house-image)<br>
[Smart Status Entity](#smart-status-entity)<br>
[Adding Buttons](#adding-buttons)<br>
[Weather States](#weather-states)<br>
[Performance](#performance)

<br>


## Installation

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=shpongledsummer&repository=atmospheric-weather-card&category=plugin)

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

## Usage Modes

You can use either `card_style: standalone` for a self-contained card with dynamic weather backgrounds, or `card_style: immersive` so the card has no background at all and blends into your dashboard.

<br>

### Standalone

<img width="400" alt="Image" src="https://github.com/user-attachments/assets/97c90ea6-e7e8-4eb6-b84e-7e161c274c28" /><br>
<img width="400" alt="Image" src="https://github.com/user-attachments/assets/d3ee2420-d315-4391-81cb-2b44d1c9abb8" />


<details>
<summary><b>Example 1 — Basic Card (Default)</b></summary>

<br>

| Day | Night |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/a1518dd3-d533-4be5-a5d5-1ea6f4fd9748" width="100%"> | <img src="https://github.com/user-attachments/assets/6f533325-5a08-43ec-8523-44f51d0d2aa3" width="100%"> |
| <img src="https://github.com/user-attachments/assets/fa07c203-feae-4bb0-941d-d14edd9d2feb" width="100%"> | <img src="https://github.com/user-attachments/assets/b5660eeb-b980-434d-b17d-12612754e2f3" width="100%"> |

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.your_weather_entity
theme: auto # Change to 'light' or 'dark' if your theme is always the same color
card_style: standalone
card_height: 110
text_position: left
sun_moon_x_position: -55
sun_moon_y_position: 55
sun_entity: sun.sun
moon_phase_entity: sensor.moon_phase
tap_action:
  action: more-info
  entity: weather.your_weather_entity
```

</details>

<details>
<summary><b>Example 2 — Vertical Forecast</b></summary>

<br>

<img width="400" alt="Image" src="https://github.com/user-attachments/assets/cfd16ab0-d639-4d55-92c6-6a74b717ef0e" />

This example shows how to use the `custom_cards` feature to embed the Minimal Forecast Card (the little sister to this project, found [here](https://github.com/shpongledsummer/minimal-forecast-card)) in a vertical scroll. You can customize it however you'd like.

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.your_weather_entity
theme: auto # Change to 'light' or 'dark' if your theme is always the same color
card_style: standalone
card_height: 136
text_position: left
swap_texts: false
bottom_text_sensor: weather.your_weather_entity
bottom_text_icon: weather
sun_entity: sun.sun
sun_moon_size: 50
sun_moon_x_position: 100
sun_moon_y_position: center
moon_phase_entity: sensor.moon_phase
tap_action:
  action: none
custom_cards_position: top-right
custom_cards:
  - type: custom:minimal-forecast-card
    custom_width: 170px
    entity: weather.your_weather_entity
    forecast_type: hourly
    items_to_show: 12
    visible: 2
    style: glass
    hide_min_temp: true
    dividers: true
    divider_color: rgba(255,255,255,0.3)
    divider_width: 2px
    divider_inset: 0px
    item_spacing: 4px
    inner_spacing: 12px
    card_padding: 0px
    item_padding: 1em 20px
    item_height: 50px
    card_shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.15)
    direction: vertical
    font_size: 16px
    icon_size: 22px
    custom_icon_path: /local/weather-icons/ # for your own custom SVG icons (delete this if you want regular icons)
```

</details>


<details>
<summary><b>Example 3 — Horizontal Forecast</b></summary>

<br>
<img width="400" alt="image" src="https://github.com/user-attachments/assets/c8d5c4cb-d78a-44ae-9d77-9b3bf0bbe127" />

This example use the `custom_cards` feature to embed the Minimal Forecast Card (found [here](https://github.com/shpongledsummer/minimal-forecast-card)) in a horizontal scroll.

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.your_weather_entity
theme: auto # Change to 'light' or 'dark' if your theme is always the same color
card_style: standalone
card_height: 142
text_position: left
swap_texts: false
sun_entity: sun.sun
sun_moon_size: 50
sun_moon_x_position: 100
sun_moon_y_position: center
moon_phase_entity: sensor.moon_phase
bottom_text_sensor: sensor.your_weather_description_sensor
bottom_text_icon: weather
bottom_text_icon_path: /local/weather-icons/
tap_action:
  action: none
custom_cards_position: top-right
custom_cards:
  - custom_width: 60%
    type: custom:minimal-forecast-card
    entity: weather.your_weather_entity
    forecast_type: daily
    items_to_show: 7
    visible: 3
    hide_min_temp: true
    item_spacing: 8px
    inner_spacing: 10px
    item_height: 110px
    item_shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.15)
    embedded: true
    style: glass
    font_size: 13px
    sparkline: false
    icon_size: 26px
    custom_icon_path: /local/weather-icons/ # for your own custom SVG icons (delete this if you want regular icons)
```
</details>

</details>


<details>
<summary><b>Example 4 — Big Weather Forecast</b></summary>

<br>

<img width="400" alt="Image" src="https://github.com/user-attachments/assets/5063407d-2ae1-4ed2-9beb-f41f587e5d0f" />

This is similar to Example 3, but it's larger and uses a horizontal scroll to display a daily forecast. To use this, install the companion forecast card found [here](https://github.com/shpongledsummer/minimal-forecast-card)).

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.your_weather_entity
theme: auto # Change to 'light' or 'dark' if your theme is always the same color
card_style: standalone
card_height: 260
sun_entity: sun.sun
text_position: top-left
theme: auto
sun_moon_size: 60
sun_moon_x_position: -55
sun_moon_y_position: 55
moon_phase_entity: sensor.moon_phase
bottom_text_sensor: sensor.your_weather_description
bottom_text_icon: weather
tap_action:
  action: none
custom_cards_position: bottom
custom_cards:
  - custom_width: 100%
    type: custom:minimal-forecast-card
    entity: weather.your_weather_entity
    forecast_type: daily
    items_to_show: 7
    visible: 4
    divider_color: rgba(255, 255, 255, 0.1)
    divider_inset: 0px
    divider_width: 3px
    hide_min_temp: false
    item_spacing: 3px
    inner_spacing: 6px
    item_padding: 10px 0px
    embedded: true
    style: clean
    font_size: 13px
    sparkline: true
    sparkline_color: rgba(213, 184, 82, 0.2)
    icon_size: 44px
    custom_icon_path: /local/weather-icons/ # for your own custom SVG icons (delete this if you want regular icons)
```

</details>


<details>
<summary><b>Example 5 — Details Slider (Advanced)</b></summary>

<br>

<img width="400" alt="Image" src="https://github.com/user-attachments/assets/d9678ce9-6c23-4e70-a3bc-c5aa46468a5d" />

This example embeds a `paper-buttons-row` card using the `custom_cards` feature. Because the buttons can be scrolled vertically, it can hold a lot of information without looking cluttered. It also snaps into place on scroll, and there are a few different approaches included already that you can adapt to your needs.

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.your_weather_entity
theme: auto # Change to 'light' or 'dark' if your theme is always the same color
card_style: standalone
card_height: 134
text_position: left
sun_entity: sun.sun
sun_moon_size: 60
sun_moon_x_position: center
sun_moon_y_position: center
moon_phase_entity: sensor.moon_phase
tap_action:
  action: more-info
  entity: weather.your_weather_entity
custom_cards_position: top-right
custom_cards:
  - type: custom:paper-buttons-row
    custom_width: 120px
    styles:
      display: grid
      grid-template-columns: 1fr
      max-height: 102px
      overflow-y: auto
      box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.65)
      backdrop-filter: blur(8px)
      scrollbar-width: none
      border-radius: 24px
      scroll-padding-block-start: 0px
      overscroll-behavior-y: contain
      scroll-snap-type: y mandatory
    base_config:
      layout: icon|state
      styles:
        button:
          padding: 0px 10px
          height: 50px
          border-bottom: 2px solid rgba(255, 255, 255, 0.15)
          scroll-snap-align: start
          background-color: rgba(255, 255, 255, 0.01)
        state:
          font-weight: 700
          font-size: 16px
          color: white
          white-space: nowrap
        icon:
          "--mdc-icon-size": 18px
          color: white
          opacity: 0.5
          padding: 0px
          margin-right: 4px
    buttons:
      - entity: weather.your_weather_entity
        state_text:
          clear-day: Sonne!
          clear-night: Klar
          cloudy: Wolkig
          fog: Nebel
          hail: Hagel
          lightning: Blitz
          lightning-rainy: Gewitter
          partlycloudy: Heiter
          pouring: Schauer
          rainy: Regen
          snowy: Schnee
          snowy-rainy: Schneeregen
          sunny: Sonne
          windy: Wind
          windy-variant: Böen
          exceptional: Sonne!
        state_icons:
          clear-day: mdi:weather-sunny
          clear-night: mdi:weather-night
          cloudy: mdi:weather-cloudy
          fog: mdi:weather-fog
          hail: mdi:weather-hail
          lightning: mdi:weather-lightning
          lightning-rainy: mdi:weather-lightning-rainy
          partlycloudy: mdi:weather-partly-cloudy
          pouring: mdi:weather-pouring
          rainy: mdi:weather-rainy
          snowy: mdi:weather-snowy
          snowy-rainy: mdi:weather-snowy-rainy
          sunny: mdi:weather-sunny
          windy: mdi:weather-windy
          windy-variant: mdi:weather-windy-variant
          exceptional: mdi:weather-sunny
        icon: mdi:weather-cloudy
        state:
          case: first
      - entity: sun.sun
        icon: |
          {% if is_state('sun.sun', 'above_horizon') %}
            mdi:weather-sunset
          {% else %}
            mdi:weather-sunset-up
          {% endif %}
        state: >
          {% set next_setting = as_timestamp(state_attr('sun.sun',
          'next_setting')) %} {% set next_rising =
          as_timestamp(state_attr('sun.sun', 'next_rising')) %} {% set
          next_event = next_setting if next_setting < next_rising else
          next_rising %} {% set mins = ((next_event - as_timestamp(now())) / 60)
          | int %} {% if mins >= 60 %}
            > {{ (mins / 60) | int }} Std
          {% else %}
            in {{ mins }} Min
          {% endif %}
      - entity: sensor.your_humidity_sensor
        icon: mdi:water
        state:
          postfix: " %"
        styles:
          button:
            border: none
```

</details>


<br>

### Immersive

<img width="400" alt="Immersive mode" src="https://github.com/user-attachments/assets/d4ee6971-53b4-462e-87af-83fb5d94e45f" />


<br>

<details>
<summary><b>Example 1 — Simple Header Card</b></summary>

<br>

| Day | Night |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/a4b69e07-f1e9-4ac4-8f51-f4c4130b959d" width="100%"> | <img src="https://github.com/user-attachments/assets/2b34d41f-28c7-483b-8f08-98e7a197b129" width="100%"> |

```yaml


type: custom:atmospheric-weather-card
weather_entity: weather.your_weather_entity
theme: auto # Change to 'light' or 'dark' if your theme is always the same color
card_style: immersive
card_height: 150
stack_order: 1
sun_moon_size: 35
text_position: left
text_alignment: center
top_text_sensor: sensor.time
disable_bottom_icon: true
bottom_text_sensor: sensor.weather_description
bottom_text_icon: mdi:weather-cloudy
offset: 0px 0px 0px 0px
sun_moon_x_position: -80
sun_moon_y_position: 80
moon_phase_entity: sensor.moon_phase
tap_action:
  action: none


```


</details>

<details>
<summary><strong>Example 2 — Full Setup (Advanced)</strong></summary>

<br>

| Day | Night |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/11b74980-adb0-456e-a54b-548efbf908de" width="100%" /> | <img src="https://github.com/user-attachments/assets/1d9fb735-c7d5-479f-b4eb-a084d702f678" width="100%" /> |

This example is a bit advanced and shows basically all the features of the card at once. It uses the `custom_cards` feature to overlay the fantastic `custom:paper-buttons-row` directly onto your own house image, complete with dynamic status images and custom-positioned sensors.

To get this working in your setup, make sure you have `paper-buttons-row` installed via HACS, and remember to swap out the entities with your own. You can read how to get your own custom house image [here.](#custom-house-image)


> This setup (and immersive mode in general) looks best with themes that automatically switch between light and dark. If you use a fixed theme, you can set `theme: dark` or `theme: light` so it matches. See [Day / Night Logic](#day--night-logic)


```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.your_weather_entity
theme: auto # Change to 'light' or 'dark' if your theme is always the same color
full_width: true
css_mask_horizontal: false
css_mask_vertical: false
disable_text: true
sun_moon_size: 50
card_height: 240
image_scale: 90
moon_style: blue
image_alignment: bottom
offset: 0px 0px 12px 0px
sun_moon_x_position: 100
sun_moon_y_position: 100
stack_order: 0
sun_entity: sun.sun
moon_phase_entity: sensor.moon_phase
day: /local/house-day.png
night: /local/house-night.png
status_entity: binary_sensor.front_door
status_image_day: /local/house-day-door-open.png
status_image_night: /local/house-night-door-open.png
tap_action:
  action: none
custom_cards_position: top-right
custom_cards:
  - type: custom:paper-buttons-row
    custom_width: 100%
    styles:
      display: flex
      justify-content: flex-end
      flex-wrap: wrap
      grid-gap: 8px
      margin: 12px 12px 0px 0px
    base_config:
      layout: icon|state
      tap_action:
        action: more-info
      styles:
        button:
          padding: 0px 10px
          height: 34px
          border-radius: var(--ha-card-border-radius)
          background-color: rgba(255, 255, 255, 0.3)
          backdrop-filter: blur(12px)
          box-shadow: 0 1px 2px rgba(60, 50, 40, 0.15)
        state:
          font-weight: 700
          font-size: 14px
          color: var(--text-color)
          white-space: nowrap
        icon:
          "--mdc-icon-size": 20px
          color: var(--text-color)
          opacity: 0.5
          padding: 0px
          margin-right: 4px
    buttons:
      - entity: sensor.your_subtext_sensor
        layout: state
        state:
          case: first
        styles:
          button:
            pointer-events: none
            position: absolute
            box-shadow: none
            background-color: transparent
            backdrop-filter: none
            bottom: 70px
            left: 24px
          state:
            font-size: 15px
            text-align: left
            max-width: 200px
            white-space: wrap
            opacity: 0.5
            align-self: flex-end
            margin-left: 0px
      - entity: sensor.time
        layout: state
        state:
          case: first
          postfix: ""
        styles:
          button:
            pointer-events: none
            position: absolute
            box-shadow: none
            background-color: transparent
            backdrop-filter: none
            bottom: 24px
            left: 24px
          state:
            font-size: 42px
            font-weight: 800
      - entity: sensor.indoor_temperature
        icon: mdi:thermometer
        state:
          postfix: " °C"
      - entity: sensor.indoor_humidity
        icon: mdi:water
        state:
          postfix: " %"
      - entity: sensor.indoor_air_quality
        icon: mdi:leaf
        state:
          case: first
        styles:
          button:
            position: absolute
            background-color: rgba(59, 123, 69, 0.2)
            bottom: 30px
            right: 50px
          state:
            color: white
          icon:
            color: white
```

</details>
<br>


> [!TIP]
> You can embed any Home Assistant card if you need specific features (extra details, a forecast, graph, buttons, etc.).
> 
> <details>
> <summary><strong>Customizing Fonts, Icons & More</strong></summary>
> <br>
> 
> * **Custom Fonts:** The examples use the **Montserrat** font, which you can download or embed directly from [Google Fonts](https://fonts.google.com/specimen/Montserrat).
> * **Custom Icons:** You can replace the default icons with your own custom SVG weather icons. See the [Text & Icon Settings](#configuration) for instructions. You can find the icons from the examples [here.](https://github.com/basmilius/weather-icons)
> * **Embedded Cards:** To keep this card somewhat lightweight and focused on weather visuals, it relies on an embedded custom cards approach. You can read more about this feature [here](#configuration). 
> * **Companion Card:** There is also a companion card built specifically to sit in a scrollable row alongside this one, which you can find [here](https://github.com/shpongledsummer/minimal-forecast-card).
> </details>

<br>

## Configuration

#### Required & Recommended

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **`weather_entity`** | `string` | — | **Required.** Your weather integration entity (e.g., `weather.your_weather_entity`). |
| **`sun_entity`** | `string` | — | **Required.** Tracks the sun to auto-switch between day and night. Without this, the card will default to permanent day. |
| `moon_phase_entity` | `string` | — | *Recommended.* Displays the correct moon phase (e.g., `sensor.moon_phase`). |

> [!IMPORTANT]
> If you keep your dashboard in dark mode or light mode all the time, remember to set `theme: dark` or `theme: light`. This makes sure the card colors match the rest of your dashboard.

<br>

<details>
<summary><strong>Layout & Dimensions</strong></summary>

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `card_style` | `string` | `immersive` | Set to `standalone` for a solid background with text, or `immersive` for a transparent background. |
| `card_height` | `number` · `string` | `200` | Height in pixels. Numbers are automatically treated as px (e.g., `110` becomes `110px`). |
| `square` | `boolean` | `false` | Forces the card into a perfect square. Highly useful for grid layouts. |
| `full_width` | `boolean` | `false` | Stretches the card edge-to-edge by removing side margins. |
| `offset` | `string` | `0px` | Shifts the card using CSS margin (e.g., `"-50px 0px 0px 0px"`). Useful when layering cards. |
| `stack_order` | `number` | *auto* | Manually sets the z-index (e.g., `1`, `0`, `-1`). Useful for forcing an immersive card to display in front of cards with solid backgrounds. |

</details>

<details>
<summary><strong>Sun & Moon</strong></summary>

The sun and moon share a single position and the card automatically swaps them based on how you [configure the card.](#day--night-logic)
 

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
<summary><strong>Custom Cards</strong></summary>

You can embed other Home Assistant cards directly inside this card. This is useful for adding additional details like buttons, specific sensors, weather forecasts, graphs etc.

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

<details>
<summary><strong>Text & Icon Settings</strong></summary>

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `top_text_sensor` | `string` | — | The entity to display as the large top text. Defaults to the temperature from your weather entity. |
| `bottom_text_sensor` | `string` | — | The entity to display as the bottom detail line. Defaults to wind speed. |
| `bottom_text_icon` | `string` | *auto* | Forces a specific icon next to the bottom text. Accepts any `mdi:` icon (e.g., `mdi:water-percent`) or the keyword `weather` to automatically show the icon matching the current weather state. Can be combined with `bottom_text_icon_path` to use custom image files instead. You can find the animated SVG icons from the examples [here](https://github.com/basmilius/weather-icons). |
| `bottom_text_icon_path` | `string` | — | A directory path to custom icon images (e.g., `/local/weather_icons/`). When set, the value of `bottom_text_icon` resolves to an image file instead of an MDI icon. For example, `bottom_text_icon: weather` with `bottom_text_icon_path: /local/weather_icons/` loads `/local/weather_icons/rainy.svg` for rainy weather. |
| `disable_text` | `boolean` | `false` | Hides all text overlays entirely. |
| `disable_bottom_text` | `boolean` | `false` | Hides only the bottom detail line. |
| `disable_bottom_icon` | `boolean` | `false` | Hides only the icon next to the bottom text. |

**Text Positioning**
By default, text auto-positions to the side opposite the sun and moon. You can manually override this:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `text_position` | `string` | *auto* | Where to place the text. Simple values: `left`, `right`, `center`. Compound values: `top-left`, `bottom-right`, etc. **Split values:** `split-top`, `split-bottom` (anchors text to opposite corners). |
| `text_alignment` | `string` | `spread` | Controls vertical distribution when using a simple `text_position`. Values: `spread`, `top`, `center`, `bottom`. |
| `swap_texts` | `boolean` | `false` | Inverts the rendering order of the top and bottom text elements. Combine this with the split layout options for total control over corner placement. |

> **Compound values** like `top-left` or `bottom-center` configure both horizontal and vertical positions simultaneously. The order of the words doesn't matter (e.g., `top-left` and `left-top` work exactly the same). If you set `text_alignment` alongside a compound value, it will override the vertical component of the compound setting.

</details>

<details>
<summary><strong>Logic & Interactivity</strong></summary>

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `theme_entity` | `string` | — | An entity whose state dictates the card's appearance. See [Day / Night Logic](#day--night-logic). |
| `tap_action` | `object` | — | A standard Home Assistant [tap action](https://www.home-assistant.io/dashboards/actions/). |

</details>

<br>

## Day / Night Logic

This card handles two separate aspects of its appearance independently:

| | What it controls | Example |
| :--- | :--- | :--- |
| **Time** | Sun vs. moon, stars vs. no stars. | *"Show the moon and stars"* |
| **Color Scheme** | Dark vs. light backgrounds and particle colors. | *"Use dark cloud colors"* |

<br>

### Which setting should I use?

**The Base Requirement**
* **`sun_entity`**: This aligns the timeline with your actual sunrise and sunset. Without it, the card just defaults to a constant "day" state.

**Optional Add-ons** *(Use these alongside `sun_entity` to customize behavior)*

* **`theme: dark` / `theme: light`**: Add this if your dashboard is permanently set to dark or light mode. It locks the card to that specific color scheme.
* **`theme_entity`**: Add this if your dashboard dynamically switches themes based on schedules or toggles. *(Note: This is a very rare setup, I'm not even sure if anyone else uses this approach. Unless you specifically built your dashboard to do this, you can skip this setting!)*
* **`theme: night` / `theme: day`**: Add this to force the time axis (permanently showing moon or sun) while letting the color scheme follow your global environment settings. *(Note: This is an unusual edge case, included mostly for the sake of completeness.)*

<br>

<details>
<summary><strong>How Each Axis is Resolved</strong></summary>

The card evaluates these sources **in exact order** and applies the first match it finds.

<strong>Time Axis</strong> — Sun or Moon?

| Priority | Source | Triggers Night When… |
| :---: | :--- | :--- |
| 1 | `theme: night` or `theme: day` | Forced manually via config. |
| 2 | `sun_entity` | State is `below_horizon`. |
| 3 | `theme_entity` | State matches a defined night value.* |
| 4 | *Fallback* | Always defaults to day. |

<strong>Color Scheme Axis</strong> — Dark or Light?

| Priority | Source | Triggers Dark When… |
| :---: | :--- | :--- |
| 1 | `theme: dark` or `theme: light` | Forced manually via config. |
| 2 | `theme_entity` | State matches a defined night value.* |
| 3 | `sun_entity` | State is `below_horizon`. |
| 4 | *System* | Follows Home Assistant's dark mode toggle in the sidebar. |

*\* Defined night values include: `dark`, `night`, `evening`, `on`, `true`, `below_horizon`*

</details>

<br>

## Styling

In addition to the [Style Settings](#configuration) detailed above, you can fine-tune the card's appearance using CSS variables in your theme or via `card-mod`.

<details>
<summary><b>Card Variables</b></summary>

| Variable | Default | Description |
| :--- | :--- | :--- |
| `--awc-card-border-radius` | `12px` | Adjusts the corner radius. |
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
| `--awc-text-side-offset` | `4px` | Extra horizontal inset added to the text padding. |
| `--awc-icon-drop-shadow` | `drop-shadow(0px 3px 6px rgba(0,0,0,0.3))` | Drop shadow filter applied to custom image icons set via `bottom_text_icon_path`. |

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

You can embed buttons (or any other Home Assistant card like a graph, another weather card, sensors etc.) directly inside this card using the `custom_cards` feature. The **Custom Cards** block in the [Configuration](#configuration) section shows how to set this up and explains the layout options. Also mostly all card [examples](#usage-modes) make use of the feature and show different use cases.

> [!TIP]
> For custom layouts, I highly recommend using `paper-buttons-row` from HACS. It gives you the flexibility to build incredibly detailed and beautiful designs. If you want to get creative, check out the advanced [examples](#usage-modes) for a few prebuilt layouts you can customize.

<br>

## Weather States

The card supports the following weather states: `sunny` · `clear-night` · `partlycloudy` · `cloudy` · `fog` · `rainy` · `pouring` · `snowy` · `snowy-rainy` · `hail` · `lightning` · `lightning-rainy` · `windy` · `windy-variant` · `exceptional`

Each state triggers a unique combination of particle types, cloud densities, wind behaviors, and atmospheric lighting. The card also reads details like the `wind_speed` or `elevation` to dynamically influence the animations.

<br>

## Performance

Because this card is built around heavy visual animations, it requires more processing power than a standard text dashboard. **It is not recommended for very old or slow wall tablets**, as the animations will likely stutter.

To keep your dashboard running smoothly, the card uses several tricks behind the scenes:
* **Reusing Graphics:** Complex effects (like clouds, rain, snow, and glows) are drawn just once in the background. The card simply moves these flat pictures around instead of calculating the complicated math 30 times a second.
* **Smart Pausing:** When you scroll the card out of view, the animations completely pause to save CPU. It keeps the graphics ready in memory so it doesn't freeze your screen when you scroll back up.
* **Stutter Prevention:** It manages memory very strictly, which stops the browser from having to randomly pause the animations to clean things up.
* **Fewer Updates:** It tracks exactly what Home Assistant is doing and only updates the text and weather graphics when something actually changes.
* **Speed Limits:** The animation speed is capped at 30 frames per second. On extremely high-resolution screens (like 4K or Retina), it automatically scales down the internal graphics so it doesn't overload your device.

> [!IMPORTANT]  
> The card relies on standard **Hardware Acceleration** to run smoothly. If you experience heavy lag or high CPU usage (especially on Linux or Firefox setups where software rendering is often the default), please double-check that hardware acceleration is enabled in your browser or kiosk app.
