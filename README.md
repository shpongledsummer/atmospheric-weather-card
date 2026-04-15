![Contains](https://img.shields.io/badge/contains-★_shooting_stars-333?style=flat-square)
[![hacs_badge](https://img.shields.io/badge/HACS-Default-41BDF5.svg?style=flat-square)](https://github.com/hacs/integration)
![GitHub release (latest by date)](https://img.shields.io/github/v/release/shpongledsummer/atmospheric-weather-card?style=flat-square)

## Atmospheric Weather Card

<img width="400" alt="image" src="https://github.com/user-attachments/assets/17da3677-70be-4da1-946b-2d06bf544af5" />


A flexible, detail-oriented weather card for Home Assistant. It generates live, animated weather visuals based on your local conditions. You can run it standalone, embed other cards inside it, or use it as an immersive background.

<br>

## Contents

**Getting Started** · [Installation](#installation) · [Usage Modes (examples)](#usage-modes) · [Setup](#setup)

**Customization** · [Appearance](#appearance) · [Colors](#colors) · [Fonts & Icons](#fonts--icons) · [CSS Reference](#css-reference)

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

<img width="400" alt="Image" src="https://github.com/user-attachments/assets/5cf69ebe-b4e3-49ad-b540-5e50f2b07412" /><br>
<img width="400" alt="Image" src="https://github.com/user-attachments/assets/fa42821a-ac3a-4973-b678-602748e29bb9" />

<details>
<summary><b>Example 1 — Basic Card (Default)</b></summary>

<br>

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.your_weather_entity
theme_entity: sun.sun # Makes the card follow your sun cycle. Remove this if you'd rather it follow your HA theme — whichever fits your setup best.
card_style: standalone
card_height: 130
text_position: left
text_alignment: spread
sun_moon_size: 50
sun_moon_x_position: -65
sun_moon_y_position: center
top_font_size: 3em
bottom_font_size: 16px
combine_text: false
top_text_background: false
bottom_text_background: true
text_background_style: frosted
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
theme_entity: sun.sun # Makes the card follow your sun cycle. Remove this if you'd rather it follow your HA theme — whichever fits your setup best.
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
theme_entity: sun.sun # Makes the card follow your sun cycle. Remove this if you'd rather it follow your HA theme — whichever fits your setup best.
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
theme_entity: sun.sun # Makes the card follow your sun cycle. Remove this if you'd rather it follow your HA theme — whichever fits your setup best.
card_style: standalone
card_height: 260
sun_entity: sun.sun
text_position: top-left
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
theme_entity: sun.sun # Makes the card follow your sun cycle. Remove this if you'd rather it follow your HA theme — whichever fits your setup best.
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

<img width="400" alt="Image" src="https://github.com/user-attachments/assets/dd716851-b09a-4112-ad74-bbf605361857" />

*(A look at my dashboard: Immersive mode, a custom background, and a few buttons. The theme and card follow the sun in sync.)*

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
theme_entity: sun.sun # Makes the card follow your sun cycle. Remove this if you'd rather it follow your HA theme — whichever fits your setup best.
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


```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.your_weather_entity
theme_entity: sun.sun # Makes the card follow your sun cycle. Remove this if you'd rather it follow your HA theme — whichever fits your setup best.
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
> <details>
> <summary><strong>Fonts & Icons</strong></summary>
> <br>
> 
> * **Custom Fonts:** The examples use the **Montserrat** font, which you can download or embed directly from [Google Fonts](https://fonts.google.com/specimen/Montserrat).
> * **Custom Icons:** You can replace the default icons with your own custom SVG weather icons. See the [Text & Icons](#appearance) section for instructions. You can find the icons from the examples [here.](https://github.com/basmilius/weather-icons)
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
> The `sun_entity` controls the timing of the sun and moon. Without it, the card defaults to permanent day. Additionally, card colors change based on your [configuration](#colors).

<br>

## Appearance

Everything that controls how your card looks — layout, colors, sun/moon, text, and images.

<details>
<summary><strong>Card Style & Layout</strong></summary>

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `card_style` | `string` | `immersive` | Set to `standalone` for a solid background with text, or `immersive` for a transparent background. |
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
| `theme` | `string` | `auto` | Forces the card's color scheme. Accepts `dark` or `light` to lock the look, or `night` / `day` to force the sky content. See [Colors](#colors). |
| `filter` | `string` | — | Applies a visual filter preset to the weather canvas. Options: `darken`, `vivid`, `muted`, `warm`. |
| `moon_style` | `string` | `blue` | The moon's glow color when in **immersive light** mode. Options: `blue`, `yellow`, `purple`, `grey`. |
| `css_mask_vertical` | `boolean` | `true` | *(Immersive only)* Fades the top and bottom edges. Set to `false` to disable. |
| `css_mask_horizontal` | `boolean` | `true` | *(Immersive only)* Fades the left and right edges. Set to `false` to disable. |
| `theme_entity` | `string` | — | Drives the card's color scheme from any entity's state instead of your HA theme. Commonly set to `sun.sun` to sync the card with sunrise/sunset. See [Colors](#colors). |

</details>

<details>
<summary><strong>Sun & Moon</strong></summary>

The sun and moon share a single position and the card automatically swaps them based on your `sun_entity`. See [Colors](#colors) for the full picture. The card also automatically generates a dynamic **sunrise and sunset effect** based on the sun's elevation, and **rotates the moon** accurately based on your Home Assistant latitude setting.
 

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `sun_moon_size` | `number` | *auto* | Overrides the sun/moon diameter in pixels. |
| `sun_moon_x_position` | `number` · `string` | `100` | Horizontal position in pixels from the left edge. **Negative values** position it from the right edge (e.g., `-55` means 55px from the right). Also accepts `center`. |
| `sun_moon_y_position` | `number` · `string` | `100` | Vertical position in pixels from the top. Also accepts `center`. |

</details>

<details>
<summary><strong>Text & Icons</strong></summary>

**Content**

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `top_text_sensor` | `string` | — | The entity to display as the large top text. Defaults to the temperature from your weather entity. Standard entities will automatically translate to your HA language. |
| `bottom_text_sensor` | `string` | — | The entity to display as the bottom detail line. Defaults to wind speed. Standard entities will automatically translate to your HA language. |
| `top_text_background` | `boolean` | `false` | Adds a styled background behind the top text (the temperature) to improve readability against the weather visuals. |
| `bottom_text_background` | `boolean` | `true` | Adds a styled background behind the bottom text to improve readability against the weather visuals. |
| `text_background_style` | `string` | `frosted` | Picks the style used by the text backgrounds. Options: `frosted` (translucent fill with a thin border, looks like a small glass container), `pill` (more opaque and higher contrast), `fade` (a soft blurred halo that blends the text into the weather visuals). |
| `combine_text` | `boolean` | `false` | Places the top text and the bottom text right next to each other inside a single container, separated by a thin divider. Looks great combined with a text background. |
| `top_font_size` | `string` | — | Sets the font size of the top text directly without needing a custom theme or `card_mod`. Accepts any CSS size value (e.g., `3em`, `48px`). |
| `bottom_font_size` | `string` | — | Sets the font size of the bottom text directly without needing a custom theme or `card_mod`. Accepts any CSS size value (e.g., `16px`, `1.2em`). |
| `bottom_text_width` | `string` | — | Limits the width of the bottom text. Accepts any CSS value — percentages (e.g., `60%`) scale with the card width, or use fixed values like `200px`. Useful when a long sensor value would otherwise push into the sun/moon area. |
| `bottom_text_overflow` | `string` | `ellipsis` | How long bottom text is handled when it exceeds `bottom_text_width`. Options: `ellipsis` (cuts off with `…`), `clip` (cuts off without indicator), `wrap` (breaks onto a second line), `marquee` (scrolls horizontally). |
| `bottom_text_marquee_speed` | `number` | `30` | Scroll speed in pixels per second when `bottom_text_overflow: marquee` is active. Minimum `5`. |
| `bottom_text_icon` | `string` | *auto* | Forces a specific icon next to the bottom text. Accepts any `mdi:` icon (e.g., `mdi:water-percent`) or the keyword `weather` to automatically show the icon matching the current weather state. Can be combined with `bottom_text_icon_path` to use custom image files instead. You can find the animated SVG icons from the examples [here](https://github.com/basmilius/weather-icons). |
| `bottom_text_icon_path` | `string` | — | A directory path to custom icon images (e.g., `/local/weather_icons/`). When set, the value of `bottom_text_icon` resolves to an image file instead of an MDI icon. For example, `bottom_text_icon: weather` with `bottom_text_icon_path: /local/weather_icons/` loads `/local/weather_icons/rainy.svg` for rainy weather. |
| `disable_text` | `boolean` | `false` | Hides all text overlays entirely. |
| `disable_bottom_text` | `boolean` | `false` | Hides only the bottom detail line. |
| `disable_bottom_icon` | `boolean` | `false` | Hides only the icon next to the bottom text. |

**Positioning**

By default, text auto-positions to the side opposite the sun and moon. You can manually override this:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `text_position` | `string` | *auto* | Where to place the text. Simple values: `left`, `right`, `center`. Compound values: `top-left`, `bottom-right`, etc. **Split values:** `split-top`, `split-bottom` (anchors text to opposite corners). |
| `text_alignment` | `string` | `spread` | Controls vertical distribution when using a simple `text_position`. Values: `spread`, `top`, `center`, `bottom`. |
| `swap_texts` | `boolean` | `false` | Inverts the rendering order of the top and bottom text elements. Combine this with the split layout options for total control over corner placement. |

> **Compound values** like `top-left` or `bottom-center` configure both horizontal and vertical positions simultaneously. The order of the words doesn't matter (e.g., `top-left` and `left-top` work exactly the same). If you set `text_alignment` alongside a compound value, it will override the vertical component of the compound setting.

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

## Colors

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

You can replace the default MDI icon next to the bottom text with your own animated SVG files. The examples use the set from [basmilius/weather-icons](https://github.com/basmilius/weather-icons).

1. Download the SVG files and place them in a folder under `config/www/`, for example `config/www/weather-icons/`.
2. In your card config, set `bottom_text_icon` to `weather` and point `bottom_text_icon_path` to that folder:

```yaml
bottom_text_icon: weather
bottom_text_icon_path: /local/weather-icons/
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
| `--awc-top-bg-color` | *auto* | Background color when `top_text_background` is enabled. Defaults to the active text background style. |
| `--awc-top-bg-padding` | `8px 14px` | Padding for the top text background. |
| `--awc-top-bg-radius` | *card radius* | Border radius for the top text background. |
| `--awc-top-bg-filter` | `blur(10px)` | Backdrop filter for the top text background (only used by the `frosted` style). |
| `--awc-bottom-bg-color` | *auto* | Background color when `bottom_text_background` is enabled. Defaults to the active text background style. |
| `--awc-bottom-bg-padding` | `5px 10px` | Padding for the bottom text background. |
| `--awc-bottom-bg-radius` | *card radius* | Border radius for the bottom text background. |
| `--awc-bottom-bg-filter` | `blur(10px)` | Backdrop filter for the bottom text background (only used by the `frosted` style). |
| `--awc-bg-shadow` | *auto* | Overrides the shadow used by the `pill` background style. |
| `--awc-bg-border` | `1px solid …` | Overrides the border used by the `frosted` background style. |
| `--awc-bg-fade-extend` | `-8px` | How far the `fade` background reaches past the text edges. |
| `--awc-bg-fade-blur` | `16px` | Blur amount for the `fade` background style. |
| `--awc-bg-fade-opacity` | `1` | Opacity of the `fade` background style. |
| `--awc-combine-separator` | `"\|"` | Character shown between the top and bottom text when `combine_text` is enabled. |
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

You can embed buttons (or any other Home Assistant card like a graph, another weather card, sensors etc.) directly inside this card using the `custom_cards` feature. See [Embedded Cards](#appearance) in the Appearance section for setup and layout options, and the [examples](#usage-modes) for different use cases.

<br>

## Companion Forecast Card

This card is focused on live visuals and current conditions. If you want to show a weather forecast alongside it, there is a companion card available: the [Minimal Forecast Card](https://github.com/shpongledsummer/minimal-forecast-card).

It is built to be embedded inside this card using the `custom_cards` feature. You can set it up as a vertical or horizontal scroll and show daily or hourly data. You can find the YAML for this in Examples 2, 3, and 4 in the [Usage Modes](#usage-modes) section.

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
