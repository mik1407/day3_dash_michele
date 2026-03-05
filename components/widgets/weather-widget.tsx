"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CloudSun,
  MapPin,
  Pencil,
  RefreshCw,
  Thermometer,
  Wind,
  X,
} from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface WeatherData {
  temperature: number;
  windSpeed: number;
  weatherCode: number;
  cityName: string;
}

const DEFAULT_LAT = 41.9028;
const DEFAULT_LON = 12.4964;
const DEFAULT_CITY = "Rome";

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snowfall",
  73: "Moderate snowfall",
  75: "Heavy snowfall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

function describeWeather(code: number): string {
  return WMO_DESCRIPTIONS[code] ?? "Unknown";
}

async function fetchWeather(
  lat: number,
  lon: number,
  cityName: string
): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch weather data");
  const json = await res.json();
  return {
    temperature: json.current.temperature_2m,
    windSpeed: json.current.wind_speed_10m,
    weatherCode: json.current.weather_code,
    cityName,
  };
}

async function geocodeCity(
  name: string
): Promise<{ lat: number; lon: number; displayName: string }> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding failed");
  const json = await res.json();
  if (!json.results?.length) throw new Error(`City "${name}" not found`);
  const r = json.results[0];
  return { lat: r.latitude, lon: r.longitude, displayName: r.name };
}

function getPosition(): Promise<{
  lat: number;
  lon: number;
  cityName: string;
}> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: DEFAULT_LAT, lon: DEFAULT_LON, cityName: DEFAULT_CITY });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          cityName: "Current location",
        }),
      () =>
        resolve({ lat: DEFAULT_LAT, lon: DEFAULT_LON, cityName: DEFAULT_CITY }),
      { timeout: 5000 }
    );
  });
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const coordsRef = useRef({ lat: DEFAULT_LAT, lon: DEFAULT_LON });
  const cityRef = useRef(DEFAULT_CITY);

  const loadWeather = useCallback(
    async (lat: number, lon: number, cityName: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchWeather(lat, lon, cityName);
        coordsRef.current = { lat, lon };
        cityRef.current = cityName;
        setWeather(data);
      } catch {
        setError("Could not load weather data.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    getPosition().then(({ lat, lon, cityName }) =>
      loadWeather(lat, lon, cityName)
    );
  }, [loadWeather]);

  const handleRefresh = useCallback(() => {
    loadWeather(coordsRef.current.lat, coordsRef.current.lon, cityRef.current);
  }, [loadWeather]);

  const handleCitySubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = cityInput.trim();
      if (!trimmed) return;
      setEditing(false);
      setLoading(true);
      setError(null);
      try {
        const { lat, lon, displayName } = await geocodeCity(trimmed);
        await loadWeather(lat, lon, displayName);
      } catch {
        setError(`City "${trimmed}" not found.`);
        setLoading(false);
      }
    },
    [cityInput, loadWeather]
  );

  const openEdit = useCallback(() => {
    setEditing(true);
    setCityInput("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const closeEdit = useCallback(() => {
    setEditing(false);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudSun className="size-5" />
          Weather
        </CardTitle>
        <CardAction className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleRefresh}
            disabled={loading}
            aria-label="Refresh weather"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={editing ? closeEdit : openEdit}
            aria-label="Change city"
          >
            {editing ? <X /> : <Pencil />}
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        {editing && (
          <form onSubmit={handleCitySubmit} className="mb-4 flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Enter city name..."
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
            />
            <Button type="submit" size="sm">
              Go
            </Button>
          </form>
        )}

        {loading && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-28" />
          </div>
        )}

        {error && <p className="text-sm text-muted-foreground">{error}</p>}

        {weather && !loading && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5" />
              <span>{weather.cityName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Thermometer className="size-5 text-muted-foreground" />
              <span className="text-3xl font-bold tabular-nums">
                {weather.temperature}°C
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {describeWeather(weather.weatherCode)}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wind className="size-4" />
              <span>{weather.windSpeed} km/h</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
