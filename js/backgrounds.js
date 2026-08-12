import { loadSettings, saveSettings } from "./storage.js";

const BACKGROUNDS = [
  "backgrounds/bg-1.jpg",
  "backgrounds/bg-2.jpg",
  "backgrounds/bg-3.jpg",
  "backgrounds/bg-4.jpg",
  "backgrounds/bg-5.jpg",
];

export async function pickTodayBackground() {
  const settings = await loadSettings();
  const today = new Date().toISOString().slice(0, 10);

  if (!settings.bgRotation && settings.lastBgIndex >= 0) {
    return BACKGROUNDS[settings.lastBgIndex] ?? BACKGROUNDS[0];
  }

  if (settings.lastBgDate === today && settings.lastBgIndex >= 0) {
    return BACKGROUNDS[settings.lastBgIndex] ?? BACKGROUNDS[0];
  }

  let idx = (settings.lastBgIndex + 1) % BACKGROUNDS.length;
  if (idx < 0) idx = 0;

  await saveSettings({ lastBgIndex: idx, lastBgDate: today });
  return BACKGROUNDS[idx];
}

export function applyBackground(url) {
  const a = document.getElementById("bg-layer");
  const b = document.getElementById("bg-layer-next");
  if (!a || !b) return;

  const img = new Image();
  img.onload = () => {
    const incoming = a.style.opacity === "0" ? a : b;
    const outgoing = incoming === a ? b : a;
    incoming.style.backgroundImage = `url('${url}')`;
    incoming.style.opacity = "1";
    outgoing.style.opacity = "0";
  };
  img.src = url;

  if (!a.style.backgroundImage) {
    a.style.backgroundImage = `url('${url}')`;
    a.style.opacity = "1";
    b.style.opacity = "0";
  }
}
