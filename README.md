# ha-chores-card

[![Marketplace](https://img.shields.io/badge/Marketplace-Custom-41BDF5.svg)](https://www.home-assistant.io/integrations/marketplace/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/juju35/ha-chores-card/blob/main/LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/julienstep9)

<p align="center"><img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/images/icon.svg" alt="Chores Card" width="120"></p>

<p align="center">
  <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/images/donetick.png" alt="Donetick" height="24">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/images/grocy.png" alt="Grocy" height="24">
</p>

A Lovelace card for **household chores**: each person's chores for the day, ticked off with a tap, with points and rewards for the kids.

> [!NOTE]
> This card is being designed: there is no release yet. Watch the repository to know when the first version is out.

| Card | Type | What it shows |
|---|---|---|
| Chores | `custom:chores-card` | Each person's chores for the day, ticked off with a tap, their points and the rewards in reach. |
| Chores mini | `custom:chores-mini-card` | Chores left today and the points on two lines, with a zoom to the full card. |

## Supported integrations

The card reads the chores of these integrations, and any `todo` list with helpers for the points:

| | Integration | What the cards show |
|:---:|---|---|
|  | [Chore Helper](https://github.com/bmcclure/ha-chore-helper) (Marketplace) | Recurring and manual chores with their due date |
| <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/images/donetick.png" alt="Donetick" height="16"> | [Donetick](https://github.com/donetick/donetick-hass-integration) (Marketplace) | Tasks per person, completed with attribution |
| <img src="https://raw.githubusercontent.com/juju35/ha-chores-card/main/images/grocy.png" alt="Grocy" height="16"> | [Grocy](https://github.com/custom-components/grocy) (Marketplace) | Chores and their schedule |
|  | [KidsChores](https://github.com/ad-ha/kidschores-ha) (Marketplace) | Kids' chores, points, rewards and badges |

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

## License

[MIT](https://github.com/juju35/ha-chores-card/blob/main/LICENSE)

## Support

If you find this project useful, you can support its development:

<a href="https://buymeacoffee.com/julienstep9"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" height="50"></a>
