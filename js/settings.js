import { loadSettings, saveSettings, resetSettings, DEFAULTS } from "./storage.js";

export async function initSettings(onSaved) {
  const btn = document.getElementById("settingsBtn");
  const panel = document.getElementById("settingsPanel");
  const backdrop = document.getElementById("settingsBackdrop");
  const closeBtn = document.getElementById("settingsClose");
  const saveBtn = document.getElementById("settingsSave");
  const resetBtn = document.getElementById("settingsReset");

  const el = {
    bgRotation: document.getElementById("setBgRotation"),
    quotes: document.getElementById("setQuotes"),
    time24h: document.getElementById("set24h"),
    engine: document.getElementById("setEngine"),
    useGeo: document.getElementById("setGeo"),
    cityName: document.getElementById("setCityName"),
    cityLat: document.getElementById("setCityLat"),
    cityLon: document.getElementById("setCityLon"),
    tempUnit: document.getElementById("setTempUnit"),
  };

  async function hydrate() {
    const s = await loadSettings();
    el.bgRotation.checked = !!s.bgRotation;
    el.quotes.checked = !!s.quotes;
    el.time24h.checked = !!s.time24h;
    el.engine.value = s.engine || "google";
    el.useGeo.checked = !!s.useGeo;
    el.cityName.value = s.cityName || "";
    el.cityLat.value = s.cityLat ?? "";
    el.cityLon.value = s.cityLon ?? "";
    el.tempUnit.value = s.tempUnit || "c";
  }

  function open() {
    panel.hidden = false;
    backdrop.hidden = false;
    requestAnimationFrame(() => {
      panel.classList.add("open");
      backdrop.classList.add("open");
    });
  }
  function close() {
    panel.classList.remove("open");
    backdrop.classList.remove("open");
    setTimeout(() => {
      panel.hidden = true;
      backdrop.hidden = true;
    }, 400);
  }

  btn.addEventListener("click", async () => {
    await hydrate();
    open();
  });
  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) close();
  });

  saveBtn.addEventListener("click", async () => {
    await saveSettings({
      bgRotation: el.bgRotation.checked,
      quotes: el.quotes.checked,
      time24h: el.time24h.checked,
      engine: el.engine.value,
      useGeo: el.useGeo.checked,
      cityName: el.cityName.value.trim(),
      cityLat: el.cityLat.value === "" ? null : Number(el.cityLat.value),
      cityLon: el.cityLon.value === "" ? null : Number(el.cityLon.value),
      tempUnit: el.tempUnit.value,
    });
    close();
    if (onSaved) await onSaved();
  });

  resetBtn.addEventListener("click", async () => {
    await resetSettings();
    await hydrate();
    if (onSaved) await onSaved();
  });

  await hydrate();
}

export { DEFAULTS };
