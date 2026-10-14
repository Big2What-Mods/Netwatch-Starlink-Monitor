import { OutageLog } from "./components/alerts/OutageLog";
import { NetWatchDashboard } from "./components/netwatch/NetWatchDashboard";
import { useEffect, useMemo } from "react";
import { useDishTelemetry } from "./hooks/useDishTelemetry";
import { useLanPresence } from "./hooks/useLanPresence";
import { AnimatePresence, motion } from "motion/react";
import { useSatellites } from "./hooks/useSatellites";
import { useObserverLocation } from "./hooks/useObserverLocation";
import { usePanelRouting } from "./hooks/usePanelRouting";
import { useOutageNotifications } from "./hooks/useOutageNotifications";
import { useThermalEvents } from "./hooks/useThermalEvents";

import { useOutageHistory, mergeOutages } from "./hooks/useOutageHistory";

import { armAlertSoundOnFirstGesture } from "./lib/alertSound";



import { windowTail } from "./lib/telemetryWindow";
import { SatelliteView } from "./components/satellite/SatelliteView";
import { DishTerminalCard } from "./components/dashboard/DishTerminalCard";
import { DetailsModal } from "./components/ui/details-modal";
import { SpeedTestPanel } from "./components/speed-test/SpeedTestCard";
import { AlignmentPanel } from "./components/alignment/AlignmentCard";
import { DataUsagePanel } from "./components/data-usage/DataUsagePanel";
import { NetworkPanel } from "./components/network/NetworkPanel";
import { AccountPanel } from "./components/account/AccountPanel";
import { SettingsModal } from "./components/settings/SettingsModal";
import { useRouterNetwork } from "./hooks/useRouterNetwork";
import { useRouterUnreachable } from "./hooks/useRouterUnreachable";
import { useLiveReadings } from "./hooks/useLiveReadings";
import { formatThroughput } from "./lib/format";
import { TooltipProvider } from "./components/ui/tooltip";

import { dishModelFor } from "./lib/dishMesh";

export default function App() {

  const {
    openPanel,
    setOpenPanel,
    settingsTab,
    skyViewOpen,
    setSkyViewOpen,

    openSkyView,
  } = usePanelRouting();
  const windowMinutes = 15;

  const telemetry = useDishTelemetry();
  const { observerLocation, onLocationSaved, onClearLocation } = useObserverLocation(
    telemetry.dishLocation?.lla,
  );
  const lanOnline = useLanPresence(telemetry.status, telemetry.connectionState);
  const satellites = useSatellites(
    observerLocation,
    telemetry.obstructionMap,
    dishModelFor(telemetry.status),
    telemetry.status?.boresightAzimuthDeg ?? 0,
  );
  useOutageNotifications(telemetry);

  const thermalEvents = useThermalEvents();
  const persistedOutages = useOutageHistory();
  const outageEvents = useMemo(
    () => mergeOutages(telemetry.outageEvents, persistedOutages),
    [telemetry.outageEvents, persistedOutages],
  );
  const routerNetwork = useRouterNetwork(openPanel === "network" || openPanel === "settings");
  const routerUnreachable = useRouterUnreachable(
    routerNetwork.routerReachable,
    telemetry.status,
    telemetry.connectionState === "online",
  );

  useEffect(() => armAlertSoundOnFirstGesture(), []);

  const { status, samples } = telemetry;

  useEffect(() => {
    window.dishlink?.reportThroughput?.(
      status?.downlinkThroughputBps ?? 0,
      status?.uplinkThroughputBps ?? 0,
    );
  }, [status]);

  const { nowMs } = useLiveReadings(samples);

  const liveDownlink = formatThroughput(status?.downlinkThroughputBps ?? 0);
  const liveUplink = formatThroughput(status?.uplinkThroughputBps ?? 0);
  const chartSamples = useMemo(
    () => windowTail(samples, windowMinutes, nowMs),
    [samples, windowMinutes, nowMs],
  );

  return (
    <TooltipProvider delayDuration={200}>
      <AnimatePresence initial={false} mode='wait'>
        {!skyViewOpen && (
          <motion.div
            key='dashboard'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <NetWatchDashboard
              status={status}
              observerLocation={observerLocation}
              connectionState={telemetry.connectionState}
              liveDownlink={liveDownlink}
              liveUplink={liveUplink}
              obstructionMap={telemetry.obstructionMap}
              onOpenSatelliteView={openSkyView}
              chartSamples={chartSamples}
              outageEvents={[...outageEvents, ...thermalEvents]}
              windowMinutes={windowMinutes}
              onOpenSettings={() => setOpenPanel("settings")}
              onOpenSpeedTest={() => setOpenPanel("speedtest")}
              onOpenLogs={() => setOpenPanel("logs")}
            />          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded event log */}
      {openPanel === "logs" && (
        <DetailsModal title="Event Log" onClose={() => setOpenPanel(null)} size="wide">
          <OutageLog outageEvents={[...outageEvents, ...thermalEvents]} />
        </DetailsModal>
      )}
      {/* Terminal modal */}
      {openPanel === "terminal" && status && (
        <DetailsModal title='Starlink Dish Terminal' onClose={() => setOpenPanel(null)} size='xxl'>
          <DishTerminalCard status={status} stale={telemetry.stale} expanded />
        </DetailsModal>
      )}
      {/* Speed test modal */}
      {openPanel === "speedtest" && (
        <DetailsModal title='Speed test' onClose={() => setOpenPanel(null)}>
          <SpeedTestPanel samples={samples} status={status} />
        </DetailsModal>
      )}
      {/* Alignment modal */}
      {openPanel === "alignment" && (
        <DetailsModal title='Alignment' onClose={() => setOpenPanel(null)} size='wide'>
          <AlignmentPanel
            status={status}
            stale={telemetry.stale}
            lastStatusAtMs={telemetry.lastStatusAtMs}
            onOpenSkyView={openSkyView}
          />
        </DetailsModal>
      )}
      {/* Data usage modal */}
      {openPanel === "datausage" && (
        <DetailsModal title='Data usage' onClose={() => setOpenPanel(null)} size='wide'>
          <DataUsagePanel />
        </DetailsModal>
      )}
      {/* Account modal */}
      {openPanel === "account" && (
        <DetailsModal title='Starlink account' onClose={() => setOpenPanel(null)} size='wide'>
          <AccountPanel lanOnline={lanOnline} />
        </DetailsModal>
      )}
      {/* Network modal */}
      {openPanel === "network" && (
        <NetworkPanel
          network={routerNetwork}
          unreachable={routerUnreachable}
          onClose={() => setOpenPanel(null)}
        />
      )}
      {/* Settings modal */}
      {openPanel === "settings" && (
        <SettingsModal
          onClose={() => setOpenPanel(null)}
          status={status}
          hardwareVersion={
            telemetry.deviceInfo?.hardwareVersion ?? status?.deviceInfo?.hardwareVersion
          }
          wifiConfig={routerNetwork.wifiConfig}
          clients={routerNetwork.clients}
          initialTab={settingsTab}
          routerReachable={routerNetwork.routerReachable}
          routerViaAccount={routerNetwork.wifiConfigViaAccount}
          routerUnreachable={routerUnreachable}
          onRouterConfigChanged={routerNetwork.refreshConfig}
        />
      )}
      {/* Sky view (full-viewport) */}
      <AnimatePresence>
        {skyViewOpen && (
          <motion.div
            key='skyview'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <SatelliteView
              obstructionMap={telemetry.obstructionMap}
              obstructionStats={status?.obstructionStats}
              status={status}
              stale={telemetry.stale}
              satellites={satellites}
              observerLocation={observerLocation}
              onLocationSaved={onLocationSaved}
              onClearLocation={onClearLocation}
              onClose={() => setSkyViewOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}







