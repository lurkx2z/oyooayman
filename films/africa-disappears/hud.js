/* =====================================================================
   HUD DATA — the top-left readouts and the top-right time tags (one at a time), as functions of time.
   Numbers and sources (see PLAN.md § numbers):
     Africa's population ≈ 1.58 billion (UN World Population Prospects 2024, 2026 value) — the script's "nearly 1.6"
     Africa's area 30.1 million km² (Natural Earth outlines, measured in make-planet.py) ≈ 20 % of Earth's land
     ≈ 30 % of the world's mineral reserves (UNEP / African Development Bank figure the script quotes)
     platinum ≈ 70 % of world mine output from South Africa; cobalt ≈ 75 % from DR Congo; chromium ≈ 40 % from South
       Africa (USGS Mineral Commodity Summaries 2025, 2024 output)
     Suez Canal ≈ 12 % of world trade (Suez Canal Authority / UNCTAD, before the 2024 Red Sea attacks)
     cocoa ≈ 70 % grown in Africa (ICCO)
     the basin: 30.1 M km² × ~4 km ≈ 120 million km³ ≈ 9 % of the oceans' 1.335 billion km³; spread over the
       ~390 M km² of ocean that remains, the sea level falls ≈ 300 m
   ===================================================================== */

const AF_READOUTS = [
  { from: () => afW(2, 'nearly').start - 0.2, until: () => AF.erased - 0.3, label: 'PEOPLE IN AFRICA', value: '1.58 billion', sub: 'GONE IN ONE SECOND' },
  { from: () => AF.erased + 0.6, until: () => AF.mine - 0.2, label: 'LAND ERASED', value: '30.1 M km²', sub: '≈ 20 % OF EARTH\'S LAND' },
  { from: () => afW(5, 'thirty').start - 0.1, until: () => AF.platinum - 0.15, label: 'AFRICA · WORLD MINERAL RESERVES', value: '≈ 30 %', sub: 'PLATINUM · COBALT · CHROMIUM · GOLD' },
  { from: () => AF.platinum, until: () => AF.cobalt - 0.05, label: 'PLATINUM · SOUTH AFRICA', value: '≈ 70 %', sub: 'OF WORLD MINING · CATALYSTS' },
  { from: () => AF.cobalt, until: () => AF.chromium - 0.05, label: 'COBALT · DR CONGO', value: '≈ 75 %', sub: 'OF WORLD MINING · BATTERIES' },
  { from: () => AF.chromium, until: () => AF.battery - 0.1, label: 'CHROMIUM · SOUTH AFRICA', value: '≈ 40 %', sub: 'OF WORLD MINING · STEEL' },
  // over the battery cells: the metal they need
  { from: () => AF.battery + 0.1, until: () => AF.gone - 0.2, label: 'COBALT · DR CONGO', value: '≈ 75 %', sub: 'OF WORLD MINING · BATTERIES' },
  { from: () => AF.prices + 0.15, until: () => AF.oceans - 0.2, label: 'COCOA', value: '≈ 70 %', sub: 'GROWN IN AFRICA' },
  { from: () => afW(13, 'atlantic').start, until: () => AF.ship - 0.2, label: 'SEAWATER TO FILL THE BASIN', value: '≈ 120 M km³', sub: '≈ 9 % OF ALL THE OCEANS' },
  { from: () => AF.coast + 0.5, until: () => AF.earth - 0.15, label: 'SEA LEVEL, WORLDWIDE', value: (t) => `−${Math.round(afSea(t) * 300)} m`, sub: 'FALLING AS THE BASIN FILLS' },
  { from: () => afW(24, 'survive').start, until: () => AF.end - 0.6, label: 'SEA LEVEL, WORLDWIDE', value: '≈ −300 m', sub: 'IF THE BASIN IS ~4 KM DEEP' },
];
const AF_TAGS = [
  // the clock counts from the vanish; the flashbacks to the vanish itself say so, so the jumps read as deliberate
  { from: () => AF.mine + 0.1, until: () => AF.mineGo + 1.4, text: 'SOUTH AFRICA · THE SAME SECOND' },
  { from: () => AF.gone + 0.1, until: () => AF.trade - 0.2, text: 'T + 3 WEEKS' },
  { from: () => AF.port + 0.1, until: () => AF.prices - 0.1, text: 'ROTTERDAM · T + 1 MONTH' },
  { from: () => AF.oceans + 0.2, until: () => AF.surge - 0.1, text: 'MEANWHILE · HOUR 1' },
  { from: () => AF.surge + 0.1, until: () => AF.ship - 0.15, text: 'DAYS 1–2 · TIME-LAPSE' },
  { from: () => AF.forest + 0.1, until: () => AF.wild - 0.15, text: 'CONGO BASIN · THE SAME SECOND' },
  { from: () => AF.wild + 0.1, until: () => AF.flow - 0.2, text: 'TANZANIA · THE SAME SECOND' },
  { from: () => AF.flow + 0.3, until: () => AF.room - 0.2, text: 'ILLUSTRATION · NOT A FORECAST' },
  { from: () => AF.halt + 0.1, until: () => AF.phone - 0.15, text: 'T + 3 MONTHS' },
  { from: () => AF.coast + 0.2, until: () => AF.earth - 0.15, text: 'TIME-LAPSE · AS THE BASIN FILLS' },
];
function afReadoutAt(t) {
  for (const R of AF_READOUTS) {
    const a = R.from(), b = R.until();
    if (t >= a - 0.2 && t <= b + 0.2) {
      const k = StoryHUD.win(t, a, b, 0.2, 0.2);
      if (k <= 0) continue;
      return { a: k, label: R.label, value: typeof R.value === 'function' ? R.value(t) : R.value, sub: R.sub };
    }
  }
  return null;
}
function afTagAt(t) {
  for (const G of AF_TAGS) { const a = G.from(), b = G.until(); const k = StoryHUD.win(t, a, b, 0.15, 0.15); if (k > 0) return { a: k, text: G.text }; }
  return null;
}
