// Abandoned-cart job: shared by the cron route, the npm script and the admin dashboard / leads pages.
import { SettingModel } from "@/models/Setting";
import { notifyAbandonedCarts } from "@/server/notifications";
import { sweepAbandonedLeads } from "./lead";

type Defer = (task: () => Promise<unknown>) => void;

/** Marks idle carts abandoned, then emails the admin digest (pages pass `defer: after` so the email doesn't slow them). */
export async function runAbandonedSweep({ now = new Date(), defer }: { now?: Date; defer?: Defer } = {}) {
  const settings = await SettingModel.findOne({ key: "store" }).select("abandonedAfterMinutes").lean();
  const minutes = settings?.abandonedAfterMinutes ?? 60;
  const newlyAbandoned = await sweepAbandonedLeads(minutes, now);
  const digest = () => notifyAbandonedCarts(minutes, now);
  let notified = 0;
  if (defer) defer(digest);
  else notified = (await digest()).sent;
  return { minutes, abandoned: newlyAbandoned.length, notified, leads: newlyAbandoned };
}
