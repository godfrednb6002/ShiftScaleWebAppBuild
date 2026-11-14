/**
 * Real-time Weather Service powered by Open-Meteo API
 * https://open-meteo.com/ (Free, No API key required, global coverage)
 */

import type { WeatherCondition } from '../constants/weatherProfiles';

export interface LiveWeatherData {
  temperature: number; // in °C
  humidity: number; // in %
  precipitation: number; // in mm
  windSpeed: number; // in km/h
  weatherCode: number;
  condition: WeatherCondition;
  isLive: boolean;
  timestamp: string;
}

/**
 * Maps WMO (World Meteorological Organization) weather codes to our ShiftScale WeatherCondition profiles.
 * https://open-meteo.com/en/docs
 */
export function mapWmoCodeToCondition(code: number, windSpeed: number, humidity: number): WeatherCondition {
  // If high wind speed is detected (> 28 km/h)
  if (windSpeed >= 28) {
    return 'windy';
  }

  // Thunderstorm / Squall codes
  if (code >= 95 && code <= 99) {
    return 'stormy';
  }

  // Snow / Ice pellets codes
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return 'snowy';
  }

  // Rain / Drizzle / Showers codes
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return 'rainy';
  }

  // Fog / Depositing rime fog
  if (code === 45 || code === 48) {
    return 'foggy';
  }

  // Overcast
  if (code === 3) {
    return 'cloudy';
  }

  // Partly cloudy
  if (code === 2) {
    // If high humidity (> 80%) with warm temperature, consider humid
    if (humidity >= 85) return 'humid';
    return 'partly-cloudy';
  }

  // Clear sky (0) or Mainly clear (1)
  if (code === 0 || code === 1) {
    if (humidity >= 85) return 'humid';
    return 'sunny';
  }

  return 'sunny';
}

/**
 * Fetches real-time weather from Open-Meteo for given coordinates (defaults to Kumasi / Ashanti, Ghana).
 */
export async function fetchLiveWeather(
  lat: number = 6.6885,
  lng: number = -1.6244
): Promise<LiveWeatherData | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const current = data.current;

    if (!current) {
      return null;
    }

    const temperature = Math.round(current.temperature_2m);
    const humidity = Math.round(current.relative_humidity_2m);
    const precipitation = Math.round((current.precipitation || 0) * 10) / 10;
    const windSpeed = Math.round(current.wind_speed_10m || 0);
    const weatherCode = current.weather_code || 0;

    const condition = mapWmoCodeToCondition(weatherCode, windSpeed, humidity);

    return {
      temperature,
      humidity,
      precipitation,
      windSpeed,
      weatherCode,
      condition,
      isLive: true,
      timestamp: current.time || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
