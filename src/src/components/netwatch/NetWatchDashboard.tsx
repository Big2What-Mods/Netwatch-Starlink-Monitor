import { dishModelFor, specForModel } from "../../lib/dishMesh";
import { formatUptime } from "../../lib/format";
import { readRouterLatencyMs } from "@core/telemetry";
import { useDataUsage } from "../../hooks/useDataUsage";
import { TelemetryChart } from "../shared/TelemetryChart";
import { THROUGHPUT_SERIES, LATENCY_SERIES } from "../../lib/statDetails";
import { formatThroughputLabel, formatThroughputTick } from "../../lib/format";
import { canonicalCause, outageEventMeta, type TelemetrySample, type OutageEvent } from "@core/telemetry";
import { formatClockTimeShort, formatEventDuration } from "../../lib/format";
import type { DishStatusJson, DishObstructionMapJson } from "@core/dishClient";
import type { RouterStatusSnapshot } from "../../lib/routerStatusFeed";
import { dishRebootStatus, routerUpdateStatus } from "./firmwareStatus";
import { ObstructionDome } from "../obstruction/ObstructionDome";
import type { DishConnectionState } from "../../hooks/useDishTelemetry";
import type { ObserverLocation } from "../../lib/satellites";
import { useNetWatchWeather } from "../../hooks/useNetWatchWeather";
import { useSystemStats } from "../../hooks/useSystemStats";
import { useEffect, useState } from "react";
import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
} from "lucide-react";

interface NetWatchDashboardProps {
  status: DishStatusJson | null;
  routerSnapshot: RouterStatusSnapshot;
  observerLocation: ObserverLocation | null;
  connectionState: DishConnectionState;
  liveDownlink: { value: string; unit: string };
  liveUplink: { value: string; unit: string };
  obstructionMap: DishObstructionMapJson | null;
  onOpenSatelliteView: () => void;
  chartSamples: TelemetrySample[];
  outageEvents: OutageEvent[];
  windowMinutes: number;
  onOpenSettings: () => void;
  onOpenSpeedTest: () => void;
  onOpenLogs: () => void;
  onOpenFirmware: () => void;
}

function weatherIconFor(code: number) {
  if (code === 0) return Sun;
  if (code === 1 || code === 2) return CloudSun;
  if (code === 3) return Cloud;
  if (code === 45 || code === 48) return CloudFog;
  if ([51, 53, 55, 56, 57].includes(code)) return CloudDrizzle;
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return CloudRain;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return CloudSnow;
  if ([95, 96, 99].includes(code)) return CloudLightning;
  return Cloud;
}
function weatherDescription(code: number): string {
  if (code === 0) return "Clear";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Foggy";
  if (code === 51 || code === 53 || code === 55) return "Drizzle";
  if (code === 56 || code === 57) return "Freezing drizzle";
  if (code === 61 || code === 63 || code === 65) return "Rain";
  if (code === 66 || code === 67) return "Freezing rain";
  if (code === 71 || code === 73 || code === 75 || code === 77) return "Snow";
  if (code === 80 || code === 81 || code === 82) return "Rain showers";
  if (code === 85 || code === 86) return "Snow showers";
  if (code === 95 || code === 96 || code === 99) return "Thunderstorms";
  return "Conditions unavailable";
}
export function NetWatchDashboard({
  status,
  routerSnapshot,
  observerLocation,
  connectionState,
  liveDownlink,
  liveUplink,
  obstructionMap,
  onOpenSatelliteView,
  chartSamples,
  outageEvents,
  windowMinutes,
  onOpenSettings,
  onOpenSpeedTest,
  onOpenLogs,
  onOpenFirmware,
}: NetWatchDashboardProps) {
  const { weather, loading: weatherLoading, error: weatherError } =
    useNetWatchWeather(observerLocation);
  const { data: usage, unavailable: usageUnavailable } = useDataUsage("today", true);
  const usageCoverage = usage ? Math.round(usage.coverage.fraction * 100) : 0;
  const systemStats = useSystemStats();
  const [systemTime, setSystemTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setSystemTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="netwatch-dashboard" style={{ position: "relative", width: 674, height: 787, backgroundImage: "url(/NetWatch_clean_interface_template.png)", backgroundSize: "100% 100%", backgroundRepeat: "no-repeat" }}>
      

      <section
        className="netwatch-connection"
        style={{
          position: "absolute",
          left: 37,
          top: 150,
          width: 275,
          height: 120,
          color: "#ffffff",
          fontSize: 12,
        }}
      >
        <div style={{ color: "#00ff66", fontSize: 19, fontWeight: 700 }}>
          {connectionState.toUpperCase()}
        </div>
        <div>Satellite: {status ? specForModel(dishModelFor(status)).displayName : "—"}</div>
        <div>
          Latency: {readRouterLatencyMs(status?.popPingLatencyMs)?.toFixed(0) ?? "—"} ms
        </div>
        <div>Download: {liveDownlink.value} {liveDownlink.unit}</div>
        <div>Upload: {liveUplink.value} {liveUplink.unit}</div>
        <div>
          Uptime: {status?.deviceState?.uptimeS
            ? formatUptime(Number(status.deviceState.uptimeS))
            : "—"}
        </div>
      </section>

      <section
        className="netwatch-throughput"
        style={{
          position: "absolute",
          left: 23,
          top: 295,
          width: 625,
          height: 90,
          overflow: "hidden",
          WebkitAppRegion: "no-drag",
        } as React.CSSProperties}
      >
        <TelemetryChart
          samples={chartSamples}
          series={THROUGHPUT_SERIES}
          windowMinutes={windowMinutes}
          height={90}
          formatValue={formatThroughputLabel}
          formatTick={formatThroughputTick}
          outageEvents={outageEvents}
        />
      </section>
      <section
        className="netwatch-latency"
        style={{
          position: "absolute",
          left: 32,
          top: 408,
          width: 292,
          height: 55,
          overflow: "hidden",
          WebkitAppRegion: "no-drag",
        } as React.CSSProperties}
      >
        <TelemetryChart
          samples={chartSamples}
          series={LATENCY_SERIES}
          windowMinutes={windowMinutes}
          height={55}
          formatValue={(value) => `${value.toFixed(0)} ms`}
          outageEvents={outageEvents}
        />
      </section>
      <section
        className="netwatch-satellite-preview"
        style={{
          position: "absolute",
          left: 34,
          top: 514,
          width: 148,
          height: 102,
          overflow: "hidden",
          WebkitAppRegion: "no-drag",
        } as React.CSSProperties}
      >
        <ObstructionDome
          obstructionMap={obstructionMap}
          status={status}
        />
        <button
          type="button"
          aria-label="Open full satellite view"
          onClick={onOpenSatelliteView}
          style={{
            position: "absolute",
            inset: 0,
            background: "transparent",
            border: 0,
            cursor: "pointer",
          }}
        />
      </section>
            <section
        className="netwatch-system"
        style={{
          position: "absolute",
          left: 205,
          marginLeft: "5ch",
          top: 535,
          width: 125,
          height: 78,
          color: "#ffffff",
          fontSize: 14,
          lineHeight: "15px",
          overflow: "hidden",
        }}
      >
        <div>TIME: {systemTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}</div>
        <div>CPU: {systemStats?.cpuPercent?.toFixed(0) ?? "N/A"}%</div>
        <div>GPU: {systemStats?.gpuPercent?.toFixed(0) ?? "N/A"}%</div>
        <div>
          RAM: {systemStats?.ramUsedGB?.toFixed(1) ?? "N/A"} /
          {systemStats?.ramTotalGB?.toFixed(0) ?? "N/A"} GB
        </div>
        <div>
          VRAM: {systemStats?.vramUsedGB?.toFixed(1) ?? "N/A"} /
          {systemStats?.vramTotalGB?.toFixed(0) ?? "N/A"} GB
        </div>
      </section>
      <section
        id="netwatch-event-log"
        className="netwatch-event-log"
        style={{
          position: "absolute",
          left: 34,
          top: 663,
          width: 338,
          height: 85,
          overflowY: "auto",
          overflowX: "hidden",
          fontSize: 10,
          color: "#ffffff",
          WebkitAppRegion: "no-drag",
        } as React.CSSProperties}
      >
        {[...outageEvents]
          .sort((a, b) => b.startMs - a.startMs)
          .map((event) => {
            const meta = outageEventMeta(event.cause);
            return (
              <div
                key={`${event.startMs}-${canonicalCause(event.cause)}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "65px 1fr auto",
                  gap: 5,
                  paddingBottom: 3,
                }}
              >
                <span style={{ color: "#00ff66" }}>
                  {formatClockTimeShort(event.startMs)}
                </span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {meta.label}
                </span>
                <span>{formatEventDuration(event.durationMs)}</span>
              </div>
            );
          })}
      </section>
      <section
        className="netwatch-data-usage"
        style={{
          position: "absolute",
          left: 358,
          top: 410,
          width: 278,
          height: 56,
          color: "#ffffff",
          fontSize: 11,
          WebkitAppRegion: "no-drag",
        } as React.CSSProperties}
      >
        {usageUnavailable ? (
          <span>Historian unavailable</span>
        ) : usage ? (
          <>
            <div
              aria-label="Daily data usage history"
              style={{
                position: "absolute",
                left: 180,
                top: 7,
                width: 95,
                height: 43,
                display: "flex",
                alignItems: "flex-end",
                gap: 2,
                overflow: "hidden",
              }}
            >
              {usage.buckets.map((bucket) => {
                const missing = bucket.downGB === null || bucket.upGB === null;
                const total = (bucket.downGB ?? 0) + (bucket.upGB ?? 0);
                const maximum = Math.max(
                  ...usage.buckets.map(
                    (b) => (b.downGB ?? 0) + (b.upGB ?? 0),
                  ),
                  0.000001,
                );
                return (
                  <div
                    key={bucket.t}
                    title={missing ? "No recorded data" : `${total.toFixed(3)} GB`}
                    style={{
                      flex: "1 1 0",
                      minWidth: 1,
                      height: missing ? 2 : `${Math.max(2, (total / maximum) * 100)}%`,
                      background: missing ? "#555555" : "#00c8f8",
                      opacity: missing ? 0.35 : 1,
                    }}
                  />
                );
              })}
            </div>
            <div>Downloaded: {usage.totalDownGB.toFixed(2)} GB</div>
            <div>Uploaded: {usage.totalUpGB.toFixed(2)} GB</div>
            <div>Total: {(usage.totalDownGB + usage.totalUpGB).toFixed(2)} GB</div>
            {usageCoverage < 95 && (
              <div style={{ color: "#ffcc66", fontSize: 9 }}>
                Recorded {usageCoverage}% of today
              </div>
            )}
          </>
        ) : (
          <span>Loading usage...</span>
        )}
      </section>
      <section
        className="netwatch-location"
        style={{
          position: "absolute",
          left: 402,
          top: 163,
          width: 265,
          height: 50,
          color: "#ffffff",
          fontSize: 15,
        }}
      >
        {observerLocation ? (
          <div>
            {Math.abs(observerLocation.latitudeDeg).toFixed(4)}°
            {observerLocation.latitudeDeg >= 0 ? " N" : " S"}
            {" | "}
            {Math.abs(observerLocation.longitudeDeg).toFixed(4)}°
            {observerLocation.longitudeDeg >= 0 ? " E" : " W"}
          </div>
        ) : (
          <div>Location unavailable</div>
        )}
      </section>
      <section
        className="netwatch-weather"
        style={{
          position: "absolute",
          left: 370,
          top: 220,
          width: 265,
          height: 58,
          color: "#ffffff",
          fontSize: 11,
          WebkitAppRegion: "no-drag",
        } as React.CSSProperties}
      >
        {weather && (() => {
          const WeatherIcon = weatherIconFor(weather.weatherCode);
          return (
            <WeatherIcon
              size={42}
              strokeWidth={1.5}
              style={{
                position: "absolute",
                right: 12,
                top: 3,
                color: "#00c8f8",
                pointerEvents: "none",
              }}
            />
          );
        })()}
        {weather ? (
          <>
            <div style={{ fontSize: 19, fontWeight: 700 }}>
              {Math.round(weather.temperatureF)}°F
            </div>
            <div>
              {weatherDescription(weather.weatherCode)}
            </div>
            <div>
              Wind {Math.round(weather.windMph)} mph
              {" | "}
              Humidity {Math.round(weather.humidityPercent)}%
            </div>
            {weatherError && (
              <div style={{ color: "#ffcc66", fontSize: 9 }}>
                Last available reading
              </div>
            )}
          </>
        ) : (
          <div>
            {weatherLoading ? "Loading weather..." : weatherError ?? "Weather unavailable"}
          </div>
        )}
      </section>
      <section
        className="netwatch-firmware"
        style={{
          position: "absolute",
          left: 410,
          top: 655,
          width: 225,
          height: 95,
          color: "#ffffff",
          fontSize: 14,
          overflow: "hidden",
        }}
      >
        <div style={{ color: "#00c8f8", fontWeight: 700, marginBottom: 5, fontSize: 13 }}>
          FIRMWARE & UPDATES
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 6, fontSize: 12 }}>
          {([["DISH", dishRebootStatus(status)], ["ROUTER UPDATE", routerUpdateStatus(routerSnapshot)]] as const).map(([name, state]) => (
            <span key={name} title={state.detail} style={{ whiteSpace: "nowrap" }}>
              {name}: <span style={{ color: state.color }}>{state.shortLabel}</span>
            </span>
          ))}
        </div>
        <button type="button" onClick={onOpenFirmware} style={{ marginTop: 6, width: "100%", border: "1px solid #00c8f8", background: "rgba(0,30,42,.85)", color: "#00c8f8", borderRadius: 4, fontSize: 12, padding: "3px 5px", cursor: "pointer" }}>
          VIEW FIRMWARE DETAILS
        </button>
      </section>
            <nav
        className="netwatch-controls"
        style={{
          position: "absolute",
          left: 400,
          top: 533,
          width: 244,
          height: 90,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 0,
          WebkitAppRegion: "no-drag",
        } as React.CSSProperties}
      >
        {[
          { label: "Speed Test", action: onOpenSpeedTest },
          { label: "Network Map", action: onOpenSatelliteView },
          { label: "Settings", action: onOpenSettings },
          {
            label: "Logs",
            action: onOpenLogs,
          },
        ].map(({ label, action }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            onClick={action}
            style={{
              width: "100%",
              height: "100%",
              opacity: 0,
              cursor: "pointer",
              pointerEvents: "auto",
            }}
          />
        ))}
      </nav>
    </main>
  );
}

























