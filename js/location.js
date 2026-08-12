const FALLBACK = {
  name: "Greenwich",
  lat: 51.4779,
  lon: -0.0015,
};

export async function resolveLocation(settings) {
  if (
    settings.cityLat != null &&
    settings.cityLon != null &&
    !Number.isNaN(settings.cityLat) &&
    !Number.isNaN(settings.cityLon)
  ) {
    return {
      name: settings.cityName || "Custom location",
      lat: settings.cityLat,
      lon: settings.cityLon,
    };
  }

  if (settings.useGeo && "geolocation" in navigator) {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          maximumAge: 1000 * 60 * 60,
          timeout: 5000,
          enableHighAccuracy: false,
        });
      });
      return {
        name: "Current location",
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
      };
    } catch {
    }
  }

  return FALLBACK;
}
