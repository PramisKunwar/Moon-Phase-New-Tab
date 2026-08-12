import { loadSettings, saveSettings } from "./storage.js";

export const QUOTES = [
  { t: "Somewhere, something incredible is waiting to be known.", a: "Carl Sagan" },
  { t: "The cosmos is within us. We are made of star-stuff.", a: "Carl Sagan" },
  { t: "We are a way for the universe to know itself.", a: "Carl Sagan" },
  { t: "For small creatures such as we the vastness is bearable only through love.", a: "Carl Sagan" },
  { t: "The universe is under no obligation to make sense to you.", a: "Neil deGrasse Tyson" },
  { t: "We are all connected — to each other, biologically. To the earth, chemically. To the rest of the universe atomically.", a: "Neil deGrasse Tyson" },
  { t: "The good thing about science is that it's true whether or not you believe in it.", a: "Neil deGrasse Tyson" },
  { t: "I measured the skies, now the shadows I measure.", a: "Johannes Kepler" },
  { t: "Nature uses as little as possible of anything.", a: "Johannes Kepler" },
  { t: "The sun, with all those planets revolving around it, can still ripen a bunch of grapes as if it had nothing else in the universe to do.", a: "Galileo Galilei" },
  { t: "I do not feel obliged to believe that the same God who has endowed us with sense, reason, and intellect has intended us to forgo their use.", a: "Galileo Galilei" },
  { t: "Equipped with his five senses, man explores the universe around him and calls the adventure Science.", a: "Edwin Hubble" },
  { t: "The history of astronomy is a history of receding horizons.", a: "Edwin Hubble" },
  { t: "Astronomy compels the soul to look upwards and leads us from this world to another.", a: "Plato" },
  { t: "Look up at the stars and not down at your feet.", a: "Stephen Hawking" },
  { t: "We are just an advanced breed of monkeys on a minor planet of a very average star.", a: "Stephen Hawking" },
  { t: "That's one small step for man, one giant leap for mankind.", a: "Neil Armstrong" },
  { t: "The Earth is the cradle of humanity, but mankind cannot stay in the cradle forever.", a: "Konstantin Tsiolkovsky" },
];

export async function pickDailyQuote() {
  const settings = await loadSettings();
  const today = new Date().toISOString().slice(0, 10);

  if (settings.quoteHistory && settings.quoteHistory[0]?.date === today) {
    const idx = settings.quoteHistory[0].idx;
    return QUOTES[idx] ?? QUOTES[0];
  }

  const usedIdx = new Set(
    (settings.quoteHistory || []).map((q) => q.idx),
  );

  let pool = QUOTES.map((_, i) => i).filter((i) => !usedIdx.has(i));
  if (pool.length === 0) pool = QUOTES.map((_, i) => i);

  const dateSeed =
    new Date(today).getTime() / (1000 * 60 * 60 * 24);
  const chosen = pool[Math.floor(dateSeed) % pool.length];

  const history = [
    { date: today, idx: chosen },
    ...(settings.quoteHistory || []).slice(0, QUOTES.length - 1),
  ];
  await saveSettings({ quoteHistory: history });
  return QUOTES[chosen];
}
