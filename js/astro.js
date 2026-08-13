const rad = Math.PI / 180;
const dayMs = 1000 * 60 * 60 * 24;
const J1970 = 2440588;
const J2000 = 2451545;

function toJulian(date) {
  return date.valueOf() / dayMs - 0.5 + J1970;
}
function fromJulian(j) {
  return new Date((j + 0.5 - J1970) * dayMs);
}
function toDays(date) {
  return toJulian(date) - J2000;
}


const SYNODIC = 29.53058867;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0) / 1000;

export function moonInfo(date = new Date()) {
  const now = date.getTime() / 1000;
  const diffDays = (now - KNOWN_NEW_MOON) / 86400;
  const age = ((diffDays % SYNODIC) + SYNODIC) % SYNODIC;
  const phaseFraction = age / SYNODIC; // 0..1

  // Illumination (0..1) — cosine model
  const illumination = (1 - Math.cos(2 * Math.PI * phaseFraction)) / 2;

  const name = phaseName(phaseFraction);
  const waxing = phaseFraction < 0.5;

  return {
    age, 
    phaseFraction, 
    illumination, 
    name,
    waxing,
  };
}

function phaseName(f) {
  if (f < 0.03 || f > 0.97) return "New Moon";
  if (f < 0.22) return "Waxing Crescent";
  if (f < 0.28) return "First Quarter";
  if (f < 0.47) return "Waxing Gibbous";
  if (f < 0.53) return "Full Moon";
  if (f < 0.72) return "Waning Gibbous";
  if (f < 0.78) return "Last Quarter";
  return "Waning Crescent";
}

const e = rad * 23.4397;

function solarMeanAnomaly(d) {
  return rad * (357.5291 + 0.98560028 * d);
}
function eclipticLongitude(M) {
  const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const P = rad * 102.9372;
  return M + C + P + Math.PI;
}
function declination(l, b) {
  return Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
}
function rightAscension(l, b) {
  return Math.atan2(
    Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e),
    Math.cos(l),
  );
}
function siderealTime(d, lw) {
  return rad * (280.16 + 360.9856235 * d) - lw;
}
function altitude(H, phi, dec) {
  return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
}
function sunCoords(d) {
  const M = solarMeanAnomaly(d);
  const L = eclipticLongitude(M);
  return { dec: declination(L, 0), ra: rightAscension(L, 0) };
}

const J0 = 0.0009;
function julianCycle(d, lw) {
  return Math.round(d - J0 - lw / (2 * Math.PI));
}
function approxTransit(Ht, lw, n) {
  return J0 + (Ht + lw) / (2 * Math.PI) + n;
}
function solarTransitJ(ds, M, L) {
  return J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
}
function hourAngle(h, phi, d) {
  return Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d)));
}
function getSetJ(h, lw, phi, dec, n, M, L) {
  const w = hourAngle(h, phi, dec);
  const a = approxTransit(w, lw, n);
  return solarTransitJ(a, M, L);
}

function sunTimes(date, lat, lon) {
  const lw = rad * -lon;
  const phi = rad * lat;
  const d = toDays(date);
  const n = julianCycle(d, lw);
  const ds = approxTransit(0, lw, n);
  const M = solarMeanAnomaly(ds);
  const L = eclipticLongitude(M);
  const dec = declination(L, 0);
  const Jnoon = solarTransitJ(ds, M, L);

  const events = {
    solarNoon: fromJulian(Jnoon),
    nadir: fromJulian(Jnoon - 0.5),
  };

  const angles = [
    ["sunrise", -0.833, "sunset"],
    ["dawnCivil", -6, "duskCivil"],
    ["dawnAstro", -18, "duskAstro"],
    ["goldenHourEnd", 6, "goldenHour"],
  ];

  for (const [morn, angle, eve] of angles) {
    const Jset = getSetJ(angle * rad, lw, phi, dec, n, M, L);
    const Jrise = Jnoon - (Jset - Jnoon);
    events[morn] = fromJulian(Jrise);
    events[eve] = fromJulian(Jset);
  }
  return events;
}

function moonCoords(d) {
  const L = rad * (218.316 + 13.176396 * d);
  const M = rad * (134.963 + 13.064993 * d);
  const F = rad * (93.272 + 13.22935 * d);
  const l = L + rad * 6.289 * Math.sin(M);
  const b = rad * 5.128 * Math.sin(F);
  const dt = 385001 - 20905 * Math.cos(M);
  return { ra: rightAscension(l, b), dec: declination(l, b), dist: dt };
}

function moonTimes(date, lat, lon) {
  const t = new Date(date);
  t.setHours(0, 0, 0, 0);
  const hc = 0.133 * rad;
  let h0 = getMoonAlt(t, lat, lon) - hc;
  let rise, set;
  for (let i = 1; i <= 24; i += 2) {
    const h1 = getMoonAlt(hoursLater(t, i), lat, lon) - hc;
    const h2 = getMoonAlt(hoursLater(t, i + 1), lat, lon) - hc;
    const a = (h0 + h2) / 2 - h1;
    const b = (h2 - h0) / 2;
    const xe = -b / (2 * a);
    const ye = (a * xe + b) * xe + h1;
    const d = b * b - 4 * a * h1;
    let roots = 0;
    let x1 = 0, x2 = 0;
    if (d >= 0) {
      const dx = Math.sqrt(d) / (Math.abs(a) * 2);
      x1 = xe - dx;
      x2 = xe + dx;
      if (Math.abs(x1) <= 1) roots++;
      if (Math.abs(x2) <= 1) roots++;
      if (x1 < -1) x1 = x2;
    }
    if (roots === 1) {
      if (h0 < 0) rise = i + x1;
      else set = i + x1;
    } else if (roots === 2) {
      rise = i + (ye < 0 ? x2 : x1);
      set = i + (ye < 0 ? x1 : x2);
    }
    if (rise && set) break;
    h0 = h2;
  }
  const result = {};
  if (rise) result.rise = hoursLater(t, rise);
  if (set) result.set = hoursLater(t, set);
  return result;
}

function hoursLater(date, h) {
  return new Date(date.valueOf() + (h * dayMs) / 24);
}
function getMoonAlt(date, lat, lon) {
  const lw = rad * -lon;
  const phi = rad * lat;
  const d = toDays(date);
  const c = moonCoords(d);
  const H = siderealTime(d, lw) - c.ra;
  return altitude(H, phi, c.dec);
}

export function computeAll(date, lat, lon) {
  const moon = moonInfo(date);
  const sun = sunTimes(date, lat, lon);
  const moonRS = moonTimes(date, lat, lon);
  return {
    moon,
    sunrise: sun.sunrise,
    sunset: sun.sunset,
    goldenHour: sun.goldenHour,
    goldenHourEnd: sun.goldenHourEnd,
    civilDawn: sun.dawnCivil,
    civilDusk: sun.duskCivil,
    astroDawn: sun.dawnAstro,
    astroDusk: sun.duskAstro,
    moonrise: moonRS.rise,
    moonset: moonRS.set,
  };
}
