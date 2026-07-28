const hasChromeStorage =
  typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync;

export const DEFAULTS = {
  bgRotation: true,
  quotes: true,
  time24h: true,
  engine: "google",
  useGeo: true,
  cityName: "",
  cityLat: null,
  lastBgDate: "",
};

export async function loadSettings() {
  if (hasChromeStorage) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(DEFAULTS, (data) => resolve({ ...DEFAULTS, ...data }));
    });
  }
  try {
    const raw = localStorage.getItem("moonphase.settings");
  } catch {
  }
}

export async function saveSettings(patch) {
  if (hasChromeStorage) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(patch, () => resolve());
    });
  }
  const current = await loadSettings()
  localStorage.setItem(
    "moonphase.settings",
    JSON.stringify({ ...current, ...patch })
  );
}

export async function resetSettings() {
  if (hasChromeStorage) {
    return new Promise((resolve) => {
    });
  }
  localStorage.removeItem("moonphase.settings")
}
