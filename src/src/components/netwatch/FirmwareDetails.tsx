import type { DishStatusJson } from "@core/dishClient";
import { outageEventLabel, type OutageEvent } from "@core/telemetry";
import type { RouterStatusSnapshot } from "../../lib/routerStatusFeed";
import { dishRebootStatus, routerRebootStatus, type RebootStatus } from "./firmwareStatus";
import { formatClockTimeShort } from "../../lib/format";

interface Props {
  dishStatus: DishStatusJson | null;
  routerSnapshot: RouterStatusSnapshot;
  events: OutageEvent[];
}

function History({ events }: { events: OutageEvent[] }) {
  if (!events.length) return <p className="text-sm text-muted-foreground">No recorded software update events.</p>;
  return (
    <div className="thin-scroll max-h-[180px] overflow-y-auto">
      {events.sort((a, b) => b.startMs - a.startMs).map((event, index) => (
        <div key={`${event.startMs}-${event.cause}-${index}`} className="flex gap-3 border-b border-border py-2 text-sm">
          <time className="shrink-0 text-muted-foreground">{formatClockTimeShort(event.startMs)}</time>
          <span>{outageEventLabel(event.cause)}</span>
        </div>
      ))}
    </div>
  );
}

function DeviceSection({ title, version, update, reboot, events }: {
  title: string; version?: string; update: string; reboot: RebootStatus; events: OutageEvent[];
}) {
  return (
    <section className="min-w-0 rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-base font-bold text-foreground">{title}</h3>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Firmware</dt><dd className="break-all">{version || "Unavailable"}</dd>
        <dt className="text-muted-foreground">Update</dt><dd>{update}</dd>
        <dt className="text-muted-foreground">Reboot</dt>
        <dd style={{ color: reboot.color }} title={reboot.detail}>{reboot.shortLabel}</dd>
      </dl>
      <p className="mt-2 text-xs text-muted-foreground">{reboot.detail}</p>
      <h4 className="mb-2 mt-5 text-sm font-semibold">Software update history</h4>
      <History events={events} />
    </section>
  );
}

function isUpdate(event: OutageEvent): boolean {
  return /SOFTWARE_UPDATE|SWUPDATE|SW_UPDATE|FIRMWARE_UPDATE/i.test(event.cause) ||
    /software update|firmware update/i.test(outageEventLabel(event.cause));
}

export function FirmwareDetails({ dishStatus, routerSnapshot, events }: Props) {
  const updates = events.filter(isUpdate);
  const routerEvents = updates.filter((event) => /ROUTER|WIFI/i.test(event.cause) || /router/i.test(outageEventLabel(event.cause)));
  const dishEvents = updates.filter((event) => !routerEvents.includes(event));
  const dishUpdate = dishStatus?.softwareUpdateState?.replaceAll("_", " ") ?? "Unavailable";
  const routerUpdate = routerSnapshot.reachable !== true ? "Unavailable" :
    routerSnapshot.status?.alerts?.installPending === true ? "Installation pending" :
    routerSnapshot.status?.alerts?.installPending === false ? "No install alert" : "Not reported";
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <DeviceSection title="DISH" version={dishStatus?.deviceInfo?.softwareVersion}
        update={dishUpdate} reboot={dishRebootStatus(dishStatus)} events={dishEvents} />
      <DeviceSection title="ROUTER" version={routerSnapshot.reachable === true ? routerSnapshot.status?.deviceInfo?.softwareVersion : undefined}
        update={routerUpdate} reboot={routerRebootStatus(routerSnapshot)} events={routerEvents} />
    </div>
  );
}
