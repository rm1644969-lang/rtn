# EarnifyBD — Last Update

## Included
- `index.html`
- `admin/admin.html`
- `assets/`
- `modules/live-market-touch.js`
- `modules/aviator.js`
- `vercel.json`

## Games
- Wingo
- Live Market — 1-minute candlestick chart with touch/pinch zoom and pan
- Aviator-style crash game — supplied Aviator logo, two bet slots, 7-second betting window, 15-second round cycle, manual amount entry, quick amounts, manual/auto cash-out, recent-round history at the top, stable white plane animation, and dedicated takeoff/tick/crash sounds.

## Aviator fixed rules
- Minimum bet: BDT 1 per slot
- Maximum bet: BDT 10,000 per slot
- Maximum simultaneous bets: 2
- Betting window: 7 seconds
- Round cycle: 15 seconds
- Auto cash-out: 1.01x to 100x
- Manual amount entry: whole BDT values from 1 to 10,000
- Quick amounts: 1, 2, 5, 10, 50, 100, 500, 1,000
- Manual cash-out payout: bet amount × cash-out multiplier
- Bets not cashed out before crash are lost
- Crash coefficient is stored in `aviatorRounds/{period}` before/while the round is committed

## Aviator UI/audio changes
- The user-supplied Aviator image is used as the logo asset.
- Recent Rounds is shown only above the game stage.
- The separate fixed-rules box was removed from the player screen.
- The multiplier is bright/legible with a subtle shadow.
- The plane is white and uses a stable SVG shape with a small idle-flight animation.
- Plane position is decorative and remains within the visible flight lane; the multiplier/curve can continue rising without requiring the plane to hit the right edge.
- Takeoff, countdown tick, and crash sound assets are included. Browser audio still requires a user gesture before playback.

## Aviator admin audit
The Admin Game Center includes a read-only Aviator audit panel showing the current round, phase, close timer, next round, and the next committed crash multiplier. The panel deliberately has no crash override/edit control.

## Production note
The included Aviator implementation is a client-side/demo architecture. For real-money deployment, round generation, authoritative settlement, duplicate-bet prevention, payout limits, and provable-fair audit should run on a trusted server/cloud function. The client should never be the final authority on balances or crash outcomes. The visual animation must not be used to misrepresent or conceal the actual game rules or result.

### Aviator UI update
- Recent Rounds is kept as the single history strip at the top of the game.
- The multiplier is displayed in the upper part of the flight stage.
- The plane uses the supplied `assets/aviator.png` branding in the UI and a stable white SVG plane for the live animation.
- The red flight lane is visually contained inside the stage; plane position is a presentation layer and is not used to determine the committed crash result.
- Crash values are shown in Recent Rounds after each completed round.
- Sound assets: takeoff, countdown tick, and crash.
