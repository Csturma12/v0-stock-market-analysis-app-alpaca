// Global API kill switch.
//
// When PAUSED is true, every request to /api/* short-circuits with a 503
// "paused" response BEFORE any external API (Polygon, Unusual Whales, Alpaca,
// Tradier, Finnhub, etc.) is ever contacted.
//
// To RESUME all API calls: set PAUSED to false (or set env API_PAUSED="false").
// To PAUSE again: set PAUSED to true (or set env API_PAUSED="true").
export const PAUSED =
  process.env.API_PAUSED === "false" ? false : true
