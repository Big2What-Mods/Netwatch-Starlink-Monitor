import type { DishStatusJson } from "@core/dishClient";
import type { RouterStatusSnapshot } from "../../lib/routerStatusFeed";

export interface RebootStatus {
  shortLabel: string;
  detail: string;
  color: string;
  state: "pending" | "clear" | "unknown";
}

const unknown = (detail: string): RebootStatus => ({ shortLabel: "Unknown", detail, color: "#aab6bf", state: "unknown" });
const pending = (detail: string): RebootStatus => ({ shortLabel: "Pending", detail, color: "#ffbf58", state: "pending" });
const clear = (detail: string): RebootStatus => ({ shortLabel: "No reboot", detail, color: "#4fe1a2", state: "clear" });

export function dishRebootStatus(status: DishStatusJson | null): RebootStatus {
  if (!status) return unknown("Dish telemetry unavailable");
  const seconds = status.secondsUntilSwupdateRebootPossible;
  if (typeof seconds === "number" && Number.isFinite(seconds)) {
    if (seconds >= 0) return pending(`Update reboot possible in approximately ${Math.ceil(seconds / 60)} minutes`);
    if (seconds === -1) return clear("Dish reports no pending software-update reboot");
  }
  const update = status.softwareUpdateState?.toUpperCase();
  if (update && update !== "IDLE" && update !== "UNKNOWN") return pending(`Dish software update state: ${update.replaceAll("_", " ")}`);
  return unknown("Dish did not report a reliable reboot-required state");
}

export function routerRebootStatus(snapshot: RouterStatusSnapshot): RebootStatus {
  if (snapshot.reachable !== true || !snapshot.status) return unknown("Router status is unavailable or stale");
  // Router installPending is a real device alert. It is not a reboot countdown;
  // report only that installation is pending, without inventing a reboot time.
  if (snapshot.status.alerts?.installPending === true) return pending("Router reports a pending software-update installation; a reboot may be required");
  if (snapshot.status.alerts && snapshot.status.alerts.installPending === false)
    return unknown("No update-install alert, but router does not expose a definitive reboot-required flag");
  return unknown("Router does not expose a definitive reboot-required state");
}
