import { useEffect, useState } from "react";
import type { ObserverLocation } from "../lib/satellites";

export interface NetWatchWeather {
  temperatureF: number;
  humidityPercent: number;
  windMph: number;
  weatherCode: number;
  observedAt: string;
}

interface WeatherResponse {
  current?: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
    time: string;
  };
}

const REFRESH_MS = 15 * 60 * 1000;

export function useNetWatchWeather(
  location: ObserverLocation | null,
) {
  const [weather, setWeather] = useState<NetWatchWeather | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latitude = location?.latitudeDeg;
  const longitude = location?.longitudeDeg;

  useEffect(() => {
    if (latitude === undefined || longitude === undefined) {
      setWeather(null);
      setLoading(false);
      setError("Location unavailable");
      return;
    }

    const controller = new AbortController();
    let active = true;

    const load = async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          latitude: String(latitude),
          longitude: String(longitude),
          current:
            "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
          temperature_unit: "fahrenheit",
          wind_speed_unit: "mph",
          timezone: "auto",
        });

        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?${params}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`Weather HTTP ${response.status}`);
        }

        const result = (await response.json()) as WeatherResponse;

        if (!result.current) {
          throw new Error("Weather data unavailable");
        }

        if (!active) return;

        setWeather({
          temperatureF: result.current.temperature_2m,
          humidityPercent: result.current.relative_humidity_2m,
          windMph: result.current.wind_speed_10m,
          weatherCode: result.current.weather_code,
          observedAt: result.current.time,
        });

        setError(null);
      } catch (err) {
        if (!active || controller.signal.aborted) return;
        setError(
          err instanceof Error ? err.message : "Weather unavailable",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    const timer = window.setInterval(() => {
      void load();
    }, REFRESH_MS);

    return () => {
      active = false;
      controller.abort();
      window.clearInterval(timer);
    };
  }, [latitude, longitude]);

  return { weather, loading, error };
}
