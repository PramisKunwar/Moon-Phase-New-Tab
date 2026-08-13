import { loadSettings } from "./storage.js";
import { computeAll } from "./astro.js";
import { renderMoon } from "./moon.js";
import { pickDailyQuote } from "./quotes.js";
import { pickTodayBackground, applyBackground } from "./backgrounds.js";
import { initSettings } from "./settings.js";
import { resolveLocation } from "./location.js";

const SEARCH_URLS = {
  google: "https://www.google.com/search?q=",
  duckduckgo: "https://duckduckgo.com/?q=",
  bing: "https://www.bing.com/search?q=",
};

function fmtTime(d, h24) {
  if (h24) {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  }
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  const suf = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m}:${s} ${suf}`;
}

function fmtHM(d, h24) {
  if (!d || isNaN(+d)) return "—";
  if (h24) {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const suf = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${suf}`;
}

function startClock(h24) {
  const el = document.getElementById("time");
  const dEl = document.getElementById("date");
  const wEl = document.getElementById("weekday");
  const tick = () => {
    const d = new Date();
    el.textContent = fmtTime(d, h24);
    wEl.textContent = d.toLocaleDateString(undefined, { weekday: "long" });
    dEl.textContent = d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };
  tick();
  clearInterval(window.__clockTick);
  window.__clockTick = setInterval(tick, 1000);
}

function setText(id, txt) {
  const el = document.getElementById(id);
  if (el) el.textContent = txt;
}

async function refreshAll() {
  const settings = await loadSettings();

  startClock(settings.time24h);

  const bgUrl = await pickTodayBackground();
  applyBackground(bgUrl);

  const loc = await resolveLocation(settings);
  const now = new Date();
  const data = computeAll(now, loc.lat, loc.lon);

  const canvas = document.getElementById("moon");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssSize = canvas.getBoundingClientRect().width || 320;
  canvas.width = Math.round(cssSize * dpr);
  canvas.height = Math.round(cssSize * dpr);
  renderMoon(canvas, data.moon.phaseFraction, data.moon.waxing);

  setText("phaseName", data.moon.name);
  setText("illumination", `${Math.round(data.moon.illumination * 100)}% illuminated`);
  setText("moonAge", `${data.moon.age.toFixed(1)} days`);

  const h24 = settings.time24h;
  setText("sunrise", fmtHM(data.sunrise, h24));
  setText("sunset", fmtHM(data.sunset, h24));
  setText("goldenHour", fmtHM(data.goldenHour, h24));
  setText("civilTwilight", fmtHM(data.civilDusk, h24));
  setText("moonrise", fmtHM(data.moonrise, h24));
  setText("moonset", fmtHM(data.moonset, h24));

  setText("locationName", loc.name);
  setText("lat", `${loc.lat.toFixed(3)}°`);
  setText("lon", `${loc.lon.toFixed(3)}°`);

  const qEl = document.getElementById("quote");
  const aEl = document.getElementById("quoteAuthor");
  if (settings.quotes) {
    const q = await pickDailyQuote();
    qEl.textContent = `"${q.t}"`;
    aEl.textContent = q.a;
    qEl.style.display = "";
    aEl.style.display = "";
  } else {
    qEl.style.display = "none";
    aEl.style.display = "none";
  }
}

async function initSearch() {
  const form = document.getElementById("searchForm");
  const input = document.getElementById("searchInput");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    const settings = await loadSettings();
    const base = SEARCH_URLS[settings.engine] || SEARCH_URLS.google;
    window.location.href = base + encodeURIComponent(q);
  });
}

async function main() {
  await refreshAll();
  await initSearch();
  await initSettings(refreshAll);

  window.addEventListener("resize", () => {
    const canvas = document.getElementById("moon");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssSize = canvas.getBoundingClientRect().width || 320;
    canvas.width = Math.round(cssSize * dpr);
    canvas.height = Math.round(cssSize * dpr);
    loadSettings().then((s) => {
      const { moon } = computeAll(new Date(), 0, 0);
      renderMoon(canvas, moon.phaseFraction, moon.waxing);
    });
  });
}

document.addEventListener("DOMContentLoaded", main);
