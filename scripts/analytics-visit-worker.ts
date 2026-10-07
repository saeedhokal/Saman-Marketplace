// An independent backend process for the restart/concurrency verification.
import { analyticsStore } from "../server/analytics/store";
import { pool } from "../server/db";
const [userId, platform] = process.argv.slice(2);
if (!userId || !["ios", "android", "web"].includes(platform)) throw new Error("Missing fixture arguments");
try { console.log(JSON.stringify({ inserted: await analyticsStore.recordDailyVisit(userId, platform) })); }
finally { await pool.end(); }
