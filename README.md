![Contains](https://img.shields.io/badge/contains-★_shooting_stars-333?style=flat-square)

## Atmospheric Weather Card

<img width="400" alt="image" src="https://github.com/user-attachments/assets/03197044-ca08-4b18-b866-5e02eed86b9a" />

A flexible, detail-oriented weather card for Home Assistant. It uses your local weather (and much more) to create live visuals, blending effects like wind gusts and thunderstorms with little details like passing planes, birds and shooting stars. You can run it standalone, embed other cards inside it, or use it as an immersive background.

<details>
  <summary><strong>Watch a demo</strong></summary>

  https://github.com/user-attachments/assets/1005c3cb-9422-4d30-b67a-dca154397c7a
</details>

<br>

> **AI Disclaimer** — This card was created with the help of AI tools. I never would’ve had the patience to create these effects myself.

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
[Performance](#performance)

<br>

## Usage Modes

You can use either `card_style: standalone` for a self-contained card with dynamic weather backgrounds, or `card_style: immersive` so the card has no background at all and blends into your dashboard.

<br>

### Standalone

<img width="400" alt="image" src="https://github.com/user-attachments/assets/6535137e-253f-4afa-bd9f-ff1c514b406f" />

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
<summary><b>Example 2 — Simple Weather Forecast</b></summary>

<br>

<img width="400" alt="image" src="https://github.com/user-attachments/assets/cd689f80-08bb-4ff2-8ec8-29797797c992" />

This example uses the `custom_cards` feature to embed a standard Home Assistant weather card. You can also use a bit of `card_mod` to style the forecast.

```yaml
type: custom:atmospheric-weather-card
weather_entity:  weather.your_weather_entity
card_style: standalone
card_height: 175
text_position: left
sun_entity: sun.sun
sun_moon_size: 50
sun_moon_x_position: 100
sun_moon_y_position: center
moon_phase_entity: sensor.moon_phase
tap_action:
  action: none
custom_cards_position: top-right
custom_cards:
  - custom_width: 160px
    show_current: false
    show_forecast: true
    type: weather-forecast
    entity: weather.meteo
    forecast_type: daily
    round_temperature: true
    forecast_slots: 3
    card_mod:
      style: |
        ha-card {
          background: rgba(255, 255, 255, 0.03) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          border: none !important;
          box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.2);
        }
```

</details>

<details>
<summary><b>Example 3 — Big Weather Forecast</b></summary>

<br>

<img width="400" alt="Image" src="https://github.com/user-attachments/assets/6a737fa6-6d35-4e15-b41b-d623e266485a" />

Using `custom_cards`, you can embed a standard Home Assistant weather forecast directly into the bottom of the weather card. This example uses a bit of `card_mod` to give the embedded forecast a clean, blurred glass effect that blends nicely with the background.

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.your_weather_entity
card_style: standalone
sun_entity: sun.sun
card_height: 275
sun_moon_size: 55
text_alignment: space-between
text_position: top-left
sun_moon_x_position: -55
sun_moon_y_position: 55
moon_phase_entity: sensor.moon_phase
tap_action:
  action: none
custom_cards_position: bottom
custom_cards_css_class: weather-forecast
custom_cards:
  - custom_width: 100%
    custom_height: 150px
    show_current: false
    show_forecast: true
    type: weather-forecast
    entity: weather.your_weather_entity
    forecast_type: daily
    round_temperature: true
    tap_action:
      action: more-info
      entity: weather.your_weather_entity
    card_mod:
      style: |
        ha-card {
          background: rgba(255, 255, 255, 0.08) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          border: none !important;
        }
```

</details>

<details>
<summary><b>Example 4 — Details Slider (Advanced)</b></summary>

<br>

<img width="400" alt="Image" src="https://github.com/user-attachments/assets/d9678ce9-6c23-4e70-a3bc-c5aa46468a5d" />

This example embeds a `paper-buttons-row` card using the `custom_cards` feature. Because the buttons can be scrolled vertically, it can hold a lot of information without looking cluttered. It also snaps into place on scroll, and there are a few different approaches included already that you can adapt to your needs.

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.your_weather_entity
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

<details>
<summary><b>Example 5 — Forecast Slider (Advanced)</b></summary>

<br>

<img width="400" alt="image" src="https://github.com/user-attachments/assets/ddeabba7-1c24-4703-ba48-79c4bd2a7636" /><br>
<img width="400" alt="image" src="https://github.com/user-attachments/assets/090d989c-254d-4db0-b56c-5eb11c4162ca" />


This example uses the `custom_cards` feature to create a scrollable weather forecast card with animated SVG icons.

> **Note:** This takes some extra effort to set up and honestly isn't the most elegant approach, so it's not ideal if you want something quick and easy. The tradeoff is a nice looking card that gives you complete control over the design and the data it displays.

<br>

### 1. Create the Weather Forecast Sensor

Since weather forecasts aren't directly available as sensor states, you need to create a custom trigger template sensor to store this data in its attributes. Just swap in your own weather entity, the rest works as-is. The sensor will update itself once every hour.

<details>
<summary><b>YAML for the weather forecast sensor</b></summary>

```yaml
template:

  # AWC Weather Forecast Sensor
  - trigger:
      - trigger: time_pattern
        hours: "/1"
      - trigger: homeassistant
        event: start
    action:
      - action: weather.get_forecasts
        data:
          type: daily
        target:
          entity_id: weather.your_weather_entity
        response_variable: response
    sensor:
      - name: "Weather Forecast"
        unique_id: weather_forecast
        state: "{{ now().isoformat() }}"
        attributes:
          day_1_datetime: >
            {% set f = response.get('weather.your_weather_entity', {}).get('forecast', []) %}
            {{ f[0].datetime if f | length > 0 else 'unknown' }}
          day_1_condition: >
            {% set f = response.get('weather.your_weather_entity', {}).get('forecast', []) %}
            {{ f[0].condition if f | length > 0 else 'unknown' }}
          day_1_temperature: >
            {% set f = response.get('weather.your_weather_entity', {}).get('forecast', []) %}
            {{ f[0].temperature if f | length > 0 else 'unknown' }}
          day_1_templow: >
            {% set f = response.get('weather.your_weather_entity', {}).get('forecast', []) %}
            {{ f[0].templow if f | length > 0 else 'unknown' }}
          day_2_datetime: >
            {% set f = response.get('weather.your_weather_entity', {}).get('forecast', []) %}
            {{ f[1].datetime if f | length > 1 else 'unknown' }}
          day_2_condition: >
            {% set f = response.get('weather.your_weather_entity', {}).get('forecast', []) %}
            {{ f[1].condition if f | length > 1 else 'unknown' }}
          day_2_temperature: >
            {% set f = response.get('weather.your_weather_entity', {}).get('forecast', []) %}
            {{ f[1].temperature if f | length > 1 else 'unknown' }}
          day_2_templow: >
            {% set f = response.get('weather.your_weather_entity', {}).get('forecast', []) %}
            {{ f[1].templow if f | length > 1 else 'unknown' }}
          day_3_datetime: >
            {% set f = response.get('weather.your_weather_entity', {}).get('forecast', []) %}
            {{ f[2].datetime if f | length > 2 else 'unknown' }}
          day_3_condition: >
            {% set f = response.get('weather.your_weather_entity', {}).get('forecast', []) %}
            {{ f[2].condition if f | length > 2 else 'unknown' }}
          day_3_temperature: >
            {% set f = response.get('weather.your_weather_entity', {}).get('forecast', []) %}
            {{ f[2].temperature if f | length > 2 else 'unknown' }}
          day_3_templow: >
            {% set f = response.get('weather.your_weather_entity', {}).get('forecast', []) %}
            {{ f[2].templow if f | length > 2 else 'unknown' }}
          day_4_datetime: >
            {% set f = response.get('weather.your_weather_entity', {}).get('forecast', []) %}
            {{ f[3].datetime if f | length > 3 else 'unknown' }}
          day_4_condition: >
            {% set f = response.get('weather.your_weather_entity', {}).get('forecast', []) %}
            {{ f[3].condition if f | length > 3 else 'unknown' }}
          day_4_temperature: >
            {% set f = response.get('weather.your_weather_entity', {}).get('forecast', []) %}
            {{ f[3].temperature if f | length > 3 else 'unknown' }}
          day_4_templow: >
            {% set f = response.get('weather.your_weather_entity', {}).get('forecast', []) %}
            {{ f[3].templow if f | length > 3 else 'unknown' }}
          day_5_datetime: >
            {% set f = response.get('weather.your_weather_entity', {}).get('forecast', []) %}
            {{ f[4].datetime if f | length > 4 else 'unknown' }}
          day_5_condition: >
            {% set f = response.get('weather.your_weather_entity', {}).get('forecast', []) %}
            {{ f[4].condition if f | length > 4 else 'unknown' }}
          day_5_temperature: >
            {% set f = response.get('weather.your_weather_entity', {}).get('forecast', []) %}
            {{ f[4].temperature if f | length > 4 else 'unknown' }}
          day_5_templow: >
            {% set f = response.get('weather.your_weather_entity', {}).get('forecast', []) %}
            {{ f[4].templow if f | length > 4 else 'unknown' }}
```

</details>

If you haven't made a template sensor before, you can read about how to do it in the [Home Assistant documentation](https://www.home-assistant.io/integrations/template/).

### 2. Set Up the Weather Icons

Get an SVG weather icon set, such as the [basmilius/weather-icons](https://github.com/basmilius/weather-icons) pack. You will need to manually rename each icon to match the exact names of the [Home Assistant weather states](#weather-states) (like `cloudy.svg`). Yes, it is tedious! Once that is done, put all the icons into a folder named `weather_icons` inside your Home Assistant `www` directory.

### 3. Add the Card

Finally, add the card to your dashboard. Make sure you have `paper-buttons-row` installed and replace the weather entity with your own. If you want, you can translate the text in the templates to your language.

<details>
<summary><b>YAML for the weather card</b></summary>
  
```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.your_weather_entity
card_style: standalone
sun_entity: sun.sun
card_height: 132px
sun_moon_size: 60
text_position: left
sun_moon_x_position: center
sun_moon_y_position: center
moon_phase_entity: sensor.moon_phase
tap_action:
  action: more-info
  entity: weather.your_weather_entity
custom_cards_position: top-right
custom_cards:
  - type: custom:paper-buttons-row
    custom_width: 122px
    styles:
      border-radius: var(--ha-card-border-radius)
      justify-content: flex-start
      overflow-x: auto
      height: 100px
      box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.65)
      backdrop-filter: blur(8px)
      scrollbar-width: none
      scroll-padding-block-start: 0px
      overscroll-behavior-x: contain
      scroll-snap-type: x mandatory
    base_config:
      entity: sensor.weather_forecast
      layout: icon_name_state
      styles:
        button:
          pointer-events: none
          min-width: 60px
          height: 100%
          padding: 0px
          align-items: center
          scroll-snap-align: start
          border-right: 2px solid rgba(255, 255, 255, 0.15)
        icon:
          width: 40px
          height: 40px
          "--mdc-icon-size": 0px
          filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.5))
        name:
          font-size: 14px
          font-weight: 500
          color: var(--primary-text-color)
          padding: 0px 0px 2px 0px
          opacity: 0.5
          white-space: nowrap
          max-width: 40px
          overflow: hidden
          text-overflow: ellipsis
        state:
          font-size: 16px
          font-weight: 700
          color: var(--primary-text-color)
          padding: 0px
          white-space: nowrap
          max-width: 40px
          overflow: hidden
          text-overflow: ellipsis
    buttons:
      - image: >-
          /local/weather_icons/{{ state_attr(config.entity,
          'day_1_condition') }}.svg
        name: >-
          {% set days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] %} {% set d =
          state_attr(config.entity, 'day_1_datetime') %} {{ days[as_timestamp(d)
          | timestamp_custom('%w') | int] }}
        state: >-
          {{ state_attr(config.entity, 'day_1_temperature') | string | round(0)
          | replace('.', ',') }}°
      - image: >-
          /local/weather_icons/{{ state_attr(config.entity,
          'day_2_condition') }}.svg
        name: >-
          {% set days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] %} {% set d =
          state_attr(config.entity, 'day_2_datetime') %} {{ days[as_timestamp(d)
          | timestamp_custom('%w') | int] }}
        state: >-
          {{ state_attr(config.entity, 'day_2_temperature') | string | round(0)
          | replace('.', ',') }}°
      - image: >-
          /local/weather_icons/{{ state_attr(config.entity,
          'day_3_condition') }}.svg
        name: >-
          {% set days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] %} {% set d =
          state_attr(config.entity, 'day_3_datetime') %} {{ days[as_timestamp(d)
          | timestamp_custom('%w') | int] }}
        state: >-
          {{ state_attr(config.entity, 'day_3_temperature') | string | round(0)
          | replace('.', ',') }}°
      - image: >-
          /local/weather_icons/{{ state_attr(config.entity,
          'day_4_condition') }}.svg
        name: >-
          {% set days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] %} {% set d =
          state_attr(config.entity, 'day_4_datetime') %} {{ days[as_timestamp(d)
          | timestamp_custom('%w') | int] }}
        state: >-
          {{ state_attr(config.entity, 'day_4_temperature') | string | round(0)
          | replace('.', ',') }}°
      - image: >-
          /local/weather_icons/{{ state_attr(config.entity,
          'day_5_condition') }}.svg
        name: >-
          {% set days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] %} {% set d =
          state_attr(config.entity, 'day_5_datetime') %} {{ days[as_timestamp(d)
          | timestamp_custom('%w') | int] }}
        state: >-
          {{ state_attr(config.entity, 'day_5_temperature') | string | round(0)
          | replace('.', ',') }}°
        styles:
          button:
            border: none
```

</details>

<br>

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
| **`weather_entity`** | `string` | — | **Required.** Your weather integration entity (e.g., `weather.your_weather_entity`). |
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
<summary><strong>Text Settings</strong></summary>

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `top_text_sensor` | `string` | — | The entity to display as the large top text. Defaults to the temperature from your weather entity. |
| `bottom_text_sensor` | `string` | — | The entity to display as the bottom detail line. Defaults to wind speed. |
| `bottom_text_icon` | `string` | *auto* | Forces a specific icon next to the bottom text (e.g., `mdi:water-percent`). |
| `disable_text` | `boolean` | `false` | Hides all text overlays entirely. |
| `disable_bottom_text` | `boolean` | `false` | Hides only the bottom detail line. |
| `disable_bottom_icon` | `boolean` | `false` | Hides only the icon next to the bottom text. |

**Text Positioning**
By default, text auto-positions to the side opposite the sun and moon. You can manually override this:

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

<br>

## Day / Night Logic

This card handles two separate aspects of its appearance independently:

| | What it controls | Example |
| :--- | :--- | :--- |
| **Time** | Sun vs. moon, stars vs. no stars. | *"Show the moon and stars"* |
| **Color Scheme** | Dark vs. light backgrounds and particle colors. | *"Use dark cloud colors"* |

> [!NOTE]
> For most setups, simply setting `sun_entity: sun.sun` **is enough** and means both aspects will automatically follow the real-world sun. The distinction between time and color scheme is only important if you want to mix states, such as displaying the sun on a dark dashboard background.

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

<details>
<summary><strong>Which setting should I use?</strong></summary> 

* **`sun_entity`**: Best for most setups. Everything aligns with the real sunrise and sunset.
* **`theme_entity`**: This can be used in combination with the `sun_entity` for dashboards that switch themes based on schedules or toggles.
* **`theme: dark` / `theme: light`**: Use this to permanently lock the card to one specific color scheme.
* **`theme: night` / `theme: day`**: Use this to force the time axis (moon vs. sun) while letting the color scheme follow your other environment settings.

</details>
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

</details>

<details>
  <summary><b>Card Mod Example</b></summary>

  This example shows how you can apply styles to the card using `card_mod`.

  ```yaml
  type: custom:atmospheric-weather-card
  weather_entity: weather.your_weather_entity
  # (... rest of your cards config)
  card_mod:
    style: |
      :host {
        --awc-text-day: #ffffff; # change to your liking
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

You can embed buttons (or any other Home Assistant cards) directly inside this card using the `custom_cards` feature. To see how to set this up and view the available layout options, check out the **Custom Cards** block in the [Configuration](#configuration) section.

<br>

## Weather States

The card supports the following weather states: `sunny` · `clear-night` · `partlycloudy` · `cloudy` · `fog` · `rainy` · `pouring` · `snowy` · `snowy-rainy` · `hail` · `lightning` · `lightning-rainy` · `windy` · `windy-variant` · `exceptional`

Each state triggers a unique combination of particle types, cloud densities, wind behaviors, and atmospheric lighting. The card also reads details like the `wind_speed` or `elevation` to dynamically influence the animations.

<br>

## Performance

To help keep browser CPU and memory usage low, the rendering loop reuses graphics instead of drawing them from scratch every frame.

A few other limits are in place to save resources:

* Animations pause entirely and clear memory when the card is scrolled out of view.
* The framerate is capped at 30 FPS.
* The internal canvas resolution is capped on very high-density displays.

> [!IMPORTANT]
> The card relies on **GPU hardware acceleration** in your browser. If you notice high CPU usage (especially on Linux/Nvidia setups where software rendering might be the default), please verify that hardware acceleration is enabled in your browser or kiosk app.
