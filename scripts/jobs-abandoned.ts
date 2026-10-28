// npm run jobs:abandoned — run the abandoned-cart sweep once (local dev; production uses Vercel Cron).
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { connectDB, disconnectDB } from "@/server/db";
import { runAbandonedSweep } from "@/server/services/abandoned";

connectDB()
  .then(() => runAbandonedSweep())
  .then(({ minutes, abandoned, notified, leads }) => {
    console.log(`Leads idle > ${minutes} min marked abandoned: ${abandoned} · in admin digest email: ${notified}`);
    for (const l of leads) console.log(`  • ${l.name} ${l.phone} — ৳${l.cartValue} (${l.cartSnapshot.length} items)`);
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(disconnectDB);
