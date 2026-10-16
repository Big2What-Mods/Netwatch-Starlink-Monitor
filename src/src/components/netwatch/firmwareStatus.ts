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
  const update = status.softwareUpdateState?.toUpperCase();
  const seconds = status.secondsUntilSwupdateRebootPossible;

  // The explicit updater state wins over a stale or contradictory countdown.
  // In particular, REBOOT_REQUIRED must never appear alongside "No reboot".
  if (update === "REBOOT_REQUIRED")
    return pending("Dish reports REBOOT REQUIRED for its software update");
  if (typeof seconds === "number" && Number.isFinite(seconds) && seconds >= 0)
    return pending(`Dish update reboot possible in approximately ${Math.ceil(seconds / 60)} minutes`);
  // FETCHING and other updater phases do not themselves require a reboot.
  // Only a reboot-required state or an actual nonnegative reboot countdown
  // can light the reboot indicator amber.
  if (seconds === -1)
    return clear(update && update !== "IDLE"
      ? `Dish update is ${update.replaceAll("_", " ").toLowerCase()}; no reboot is currently scheduled`
      : "Dish reports no pending software-update reboot");
  if (update && update !== "IDLE" && update !== "UNKNOWN")
    return unknown(`Dish update is ${update.replaceAll("_", " ").toLowerCase()}; reboot requirement not reported`);
  return unknown("Dish did not report a definitive reboot-required state");
}

/** The router exposes update-installation state, not a reboot-required field. */
export function routerUpdateStatus(snapshot: RouterStatusSnapshot): RebootStatus {
  if (snapshot.reachable !== true || !snapshot.status)
    return unknown("Router status unavailable or stale");
  // Starlink proto3 omits false booleans; DishyLink treats absent flags as clear.
  return snapshot.status.alerts?.installPending === true
    ? pending("Router software update installation pending")
    : { shortLabel: "No update", detail: "No router software update installation pending", color: "#4fe1a2", state: "clear" };
}

/** No definitive router reboot requirement is exposed by this API. */
export function routerRebootStatus(snapshot: RouterStatusSnapshot): RebootStatus {
  if (snapshot.reachable !== true || !snapshot.status)
    return unknown("Router status unavailable or stale");
  return unknown(
    snapshot.status.alerts?.installPending === true
      ? "Software update installation pending; router reboot requirement is not separately reported"
      : "No software update pending; router reboot requirement is not separately reported"
  );
}
