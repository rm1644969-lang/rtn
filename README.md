# EarnifyBD — Final v10

## Included
- `index.html`
- `admin/admin.html`
- `assets/`
- `modules/live-market-touch.js`
- `modules/aviator.js`
- `vercel.json`

## Games
- Wingo
- Live Market — 1-minute candlestick chart with natural touch/pinch navigation and full 60-second trading
- Aviator-style crash game — two bet slots, betting countdown, rising multiplier, manual/auto cash-out, crash settlement, recent-round history and sound effects

## Live Market settlement rules
- `00–29s`: trade settles at the current candle close.
- `30–59s`: trade settles at the next candle close.
- The UI shows the applicable settlement window and countdown.
- Entry price remains stored for settlement/history but is not shown in the main trading panel.

## Aviator note
The included Aviator game is a client-side simulation for UI/testing. A production real-money deployment should generate rounds and settle balances in a trusted server/cloud function with a verifiable audit trail.

## Fairness note
The demo does not use user betting volume or user-specific targeting to choose outcomes. Admin preview controls are display-only and do not change member settlement.


## Final v12
- Live Market UI polished for mobile and desktop; recent 10 candles remain time-derived so the market does not pause when the screen is closed.
- Live Market settlement remains time-window based: 00-29s -> current candle close; 30-59s -> next candle close.
- Aviator now records cash-out wins and crash losses in My Recent Bets, recovers unsettled past bets when the game is reopened, and shows a 7-second betting progress loader.
- Wingo, Live Market and Aviator continue from the current clock/period when reopened.
- The games remain client-side simulations; production monetary use requires trusted server-side settlement and provider integration.


## Live Market v13 polish
- Removed the upper Recent 10 Candles strip from the member Live Market UI.
- Reworked simulated candles into a continuous deterministic OHLC series: each candle opens at the previous candle close.
- Member and admin simulated direction use the same deterministic boundary-price function for synchronization.
- Chart is larger on mobile and retains a compact trading panel below it.

## v14 Live Market chart fix
- Continuous 1-minute candlesticks with deterministic synthetic history when no full feed is available.
- Sparse Firebase preview candles no longer replace the full chart.
- Current candle updates smoothly from its open to a period-seeded target.
- Mobile chart keeps the compact trading-app layout and recent-trade/history features.


## Live Market v15
- 1-minute candles with smooth fractional-second price movement.
- Live candle is anchored before the right edge to leave chart breathing room.
- Drag/pan and pinch/wheel zoom supported.
- Trade entry points are marked on the candle chart.
- Whole-minute trading: 00–29s trades settle on the current candle close; 30–59s trades settle on the next candle close.
- Admin and member-side simulated market use the same deterministic candle model; no hidden outcome control is added.

## v16 final fixes
- Live Market simulated price animation uses continuous requestAnimationFrame movement and no full-screen loader during trade placement.
- Aviator manual Bet/Cash Out buttons respond on initial pointer contact; first 1–2x rises more gradually, then accelerates.
- Wingo period history backfills recent closed periods on entry so recent results remain visible after being away.
