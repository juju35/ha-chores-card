# ha-chores-card

[![Marketplace](https://img.shields.io/badge/Marketplace-Custom-41BDF5.svg)](https://www.home-assistant.io/integrations/marketplace/)
[![HACS Validation](https://github.com/juju35/ha-chores-card/actions/workflows/hacs.yml/badge.svg)](https://github.com/juju35/ha-chores-card/actions/workflows/hacs.yml)
[![Validate](https://github.com/juju35/ha-chores-card/actions/workflows/validate.yml/badge.svg)](https://github.com/juju35/ha-chores-card/actions/workflows/validate.yml)
[![Lint](https://github.com/juju35/ha-chores-card/actions/workflows/lint.yml/badge.svg)](https://github.com/juju35/ha-chores-card/actions/workflows/lint.yml)
[![Release](https://img.shields.io/github/v/release/juju35/ha-chores-card)](https://github.com/juju35/ha-chores-card/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/juju35/ha-chores-card/blob/main/LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/julienstep9)

<p align="center"><img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/images/icon.svg" alt="Chores Card" width="120"></p>

<p align="center">
  <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/images/donetick.png" alt="Donetick" height="24">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/images/grocy.png" alt="Grocy" height="24">
</p>

A Lovelace card for **household chores**: the day's chores of the whole family in one checklist, ticked off with a tap, the overdue ones first, a filter per person, and the kids' points with the reward in reach.

[![Open your Home Assistant instance and open a repository inside the Marketplace.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-chores-card&category=plugin)

| Card | Type | What it shows |
|---|---|---|
| [Chores](#screenshots) | `custom:chores-card` | The day's chores in one checklist, the overdue ones first, a filter per person, and the kids' points. |
| [Chores mini](#chores-mini) | `custom:chores-mini-card` | A progress ring with the chores done, what is left and the overdue ones, with a zoom to the full card. |

| Overdue chores | One person |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/screenshots/chores-overdue.png" alt="Overdue chores" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/screenshots/chores-kid.png" alt="One person" width="400"> |

## Features

- **One checklist for the day**: every person's chores due today, the undated ones still to do and the ones done today, each with its person's avatar (their picture, else their initials) and its points
- **Overdue first**: the chores past their day in a red box at the top, the oldest first, with how long they have waited (*since yesterday*, *since Monday*)
- **Tick off with a tap**: a to-do item is completed (or reopened), a Chore Helper chore is completed, a Grocy chore is executed; the row shows it at once
- **A filter per person**: *All*, or one person's chores and points
- **The kids' points**: each kid's total from its points sensor, and how many are left before the reward (*15 to Cinema trip*, *Cinema trip: ready!*)
- **Illustrated header**: a tidy room with a picture, a shelf and the laundry basket; the broom sweeps while chores are left, three stars twinkle once everything is done; the dark theme darkens the room
- **Mini card**: the chores done as a ring around the badge with the count inside, the state, and what is left today; its zoom button opens the full card in place
- Visual editor for both cards, light and dark themes, 22 languages, no external dependency

## Supported integrations

The card reads the chores of these integrations, and any `todo` list (a person's own, found by its name, and shared ones):

| | Integration | What the cards show |
|:---:|---|---|
|  | [Chore Helper](https://github.com/bmcclure/ha-chore-helper) (Marketplace) | Recurring and manual chores with their due date, completed from the card |
| <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/images/donetick.png" alt="Donetick" height="16"> | [Donetick](https://github.com/donetick/donetick-hass-integration) (Marketplace) | Its to-do lists, one per person, ticked off from the card |
| <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/images/grocy.png" alt="Grocy" height="16"> | [Grocy](https://github.com/custom-components/grocy) (Marketplace) | The chores of its chores sensor, their assigned user, executed from the card |
|  | [KidsChores](https://github.com/ad-ha/kidschores-ha) / ChoreOps (Marketplace) | Each kid's points, from its points sensor (`people[].points`) |

## Installation

### Via the Marketplace (recommended)

Click the button below to add the repository directly:

[![Add to the Marketplace](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-chores-card&category=plugin)

Or manually:

1. Open **Settings → Marketplace → Add from link** (top right; this needs a GitHub account connected)
2. Add `https://github.com/juju35/ha-chores-card` — Type: **Dashboard**
3. Open **Chores Card** and click **Install**
4. Clear your browser cache and refresh

The Marketplace registers the dashboard resource for you.

### Manual

1. Download `ha-chores-card.js` and the `ha-chores-card.i18n.*.js` translation files from the [latest release](https://github.com/juju35/ha-chores-card/releases/latest)
2. Copy them all to `/config/www/` (without the translation files, the cards show in English)
3. Go to **Settings → Dashboards → Resources** → Add resource:
   - URL: `/local/ha-chores-card.js`
   - Type: **JavaScript Module**
4. Clear your browser cache and refresh

## Configuration

Every option is in the visual editor; `people` and `chores` are YAML only. In YAML:

```yaml
# Every person of the home, each with the to-do list named after them
type: custom:chores-card

# The family, the kids' points and rewards, a shared list and a Chore Helper chore
type: custom:chores-card
people:
  - person.alex
  - person.sam
  - person: person.kid_1
    todo: todo.kid_1_chores
    points: sensor.kidschores_kid_1_points
    reward: Cinema trip
    reward_points: 60
todo:
  - todo.house
chores:
  - entity: sensor.water_the_plants
    person: person.alex
    points: 5
  - entity: grocy:7
    person: person.sam

# Two lines on a phone dashboard
type: custom:chores-mini-card
```

| Option | Type | Default | Description |
|---|---|---|---|
| `title` | string | `Chores` | Both: card title |
| `show_title` | boolean | `true` | Both: show the title |
| `show_subtitle` | boolean | `true` | Both: *2 of 9 done today* under the title |
| `navigation_path` | string | | Both: a tap on the header opens this dashboard path |
| `people` | list | every person | YAML only: person entities, or `{ person, todo, points, reward, reward_points, name, color }` (`color`: a hex colour, `rgb()`, `hsl()` or `var(--…)`) |
| `todo` | list | | Shared to-do lists, whose chores belong to no one in particular |
| `chores` | list | | YAML only: Chore Helper sensors (`entity`) or Grocy chores (`grocy:<id>`) with their `person`, `points` and `name` |
| `show_done` | boolean | `true` | The chores done today, struck through |
| `show_points` | boolean | `true` | The kids' points and their reward |
| `illustration` | boolean | `true` | Both: the illustrated header (`false`: the classic header) |
| `illustration_theme` | string | `auto` | Both: `auto` (follows the Home Assistant theme: night with a dark theme, day with a light theme), `day` or `night` |
| `animations` | boolean | `true` | Both: the sweeping broom and the twinkling stars |
| `zoom` | boolean | `true` | Mini card: the zoom button |
| `language` | string | Home Assistant's | Advanced: one of the [languages](#translations) |

## Screenshots

| Overdue chores | One person (filter) | Nothing overdue |
|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/screenshots/chores-overdue.png" alt="Overdue chores" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/screenshots/chores-kid.png" alt="One person" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/screenshots/chores-plain.png" alt="Nothing overdue" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/screenshots/chores-overdue-dark.png" alt="Overdue chores, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/screenshots/chores-kid-dark.png" alt="One person, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/screenshots/chores-plain-dark.png" alt="Nothing overdue, dark" width="400"> |

| All done | Classic header, done chores hidden | Narrow |
|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/screenshots/chores-done.png" alt="All done" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/screenshots/chores-classic.png" alt="Classic header" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/screenshots/chores-narrow.png" alt="Narrow" width="300"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/screenshots/chores-done-dark.png" alt="All done, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/screenshots/chores-classic-dark.png" alt="Classic header, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/screenshots/chores-narrow-dark.png" alt="Narrow, dark" width="300"> |

**Sweeping animation**: the broom sweeps there and back while chores are left (still with `animations: false`, or when the system asks for reduced motion).

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/screenshots/chores-sweeping.gif" alt="Sweeping animation" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/screenshots/chores-sweeping-dark.gif" alt="Sweeping animation, dark" width="400"> |

**All done animation**: three stars twinkle over the laundry basket once everything is done.

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/screenshots/chores-done.gif" alt="All done animation" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/screenshots/chores-done-dark.gif" alt="All done animation, dark" width="400"> |

### Chores mini

| Overdue | All done | Zoomed in |
|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/screenshots/chores-mini-overdue.png" alt="Mini, overdue" width="320"> | <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/screenshots/chores-mini-done.png" alt="Mini, all done" width="320"> | <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/screenshots/chores-mini-zoom.png" alt="Mini, zoomed in" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/screenshots/chores-mini-overdue-dark.png" alt="Mini, overdue, dark" width="320"> | <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/screenshots/chores-mini-done-dark.png" alt="Mini, all done, dark" width="320"> | <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/screenshots/chores-mini-zoom-dark.png" alt="Mini, zoomed in, dark" width="400"> |

## How it works

- **People**: `people`, else every `person` of the home; a person's to-do list is `todo`, else the list named after their whole name (*Kid 1* → `todo.kid_1`), else after their first name
- **To-do lists**: their items (`todo/item/list`), read again when a list changes and every 5 minutes; an item is kept when it is due today, overdue, undated and not completed, or completed today: due today, or undated and seen open by the card earlier in the day (a to-do list does not say when an item was completed; the day's record is kept in the browser); `+5` at the end of its name gives it 5 points
- **Chore Helper**: every `chore_helper` sensor, due on `next_due_date`, done today when `last_completed` is today
- **Grocy**: the `chores` attribute of its chores sensor, due on `next_estimated_execution_time`, done today when `last_tracked_time` is today, its person from the assigned user's name
- **Refresh**: the to-do lists at first, every 5 minutes, and whenever one of them changes (its count or its last update); Chore Helper and Grocy follow their sensors live; a chore ticked off shows at once, until its source reports it or for 8 seconds
- **State**: *N overdue* when a chore is past its day, else *N left*, *All done*, or *Nothing today*
- **Actions**: `todo.update_item` (completed / needs action), `chore_helper.complete`, `grocy.execute_chore`; a Chore Helper or Grocy chore done today cannot be reopened from the card

## Development

```bash
npm install
npm run build        # stamps the version of package.json into dist/ha-chores-card.js
npm run check        # builds and checks the bundle (run in CI)
npm test             # unit tests
npm run screenshots  # renders the cards with mock chores into screenshots/ (and the GIFs, needs ffmpeg)
```

`dist/` is not committed: `npm run build` creates it locally, CI builds it on every push, and the release workflow attaches the built files to the release, which is where the Marketplace installs them from.

### Releasing

1. Bump `version` in `package.json`
2. Add a `## <version>` section at the top of [CHANGELOG.md](https://github.com/juju35/ha-chores-card/blob/main/CHANGELOG.md)
3. Push to `main`: the **Release** workflow builds the card, creates the tag and the GitHub release with the changelog section as notes, and attaches `ha-chores-card.js` and its translation files

## Translations

The card auto-detects the language from your Home Assistant settings. Currently supported:

| Language | Code |
|---|---|
| English | `en` |
| Français | `fr` |
| Deutsch | `de` |
| Español | `es` |
| Српски | `sr` |
| Srpski (latinica) | `sr-Latn` |
| Italiano | `it` |
| Nederlands | `nl` |
| Português (Portugal) | `pt` |
| Polski | `pl` |
| Română | `ro` |
| Dansk | `da` |
| Svenska | `sv` |
| Български | `bg` |
| Русский | `ru` |
| Українська | `uk` |
| Magyar | `hu` |
| Slovenčina | `sk` |
| Čeština | `cs` |
| Slovenščina | `sl` |
| Latviešu | `lv` |
| Ελληνικά | `el` |

Contributions for additional languages are welcome!

## License

[MIT](https://github.com/juju35/ha-chores-card/blob/main/LICENSE)

## Support

If you find this project useful, you can support its development:

<a href="https://buymeacoffee.com/julienstep9"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" height="50"></a>
