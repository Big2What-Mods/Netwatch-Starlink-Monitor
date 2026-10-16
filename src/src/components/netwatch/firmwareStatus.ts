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
  // The Starlink proto3 JSON omits false boolean alert flags. DishyLink
  // interprets a missing installPending key in a live router reply as clear.
  // This reports UPDATE installation state, not an unsupported reboot countdown.
  if (snapshot.status.alerts?.installPending === true)
    return pending("Router reports a pending software-update installation; reboot timing is not exposed");
  return { shortLabel: "No update", detail: "Router reports no pending software-update installation; separate reboot requirement is not exposed", color: "#4fe1a2", state: "clear" };
}
