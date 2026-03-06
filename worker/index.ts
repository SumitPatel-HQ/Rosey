const INTERVAL = 60_000;
const APP_URL =
  process.env.ENGINE_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";
const WORKER_SECRET = process.env.WORKER_SECRET || "";

async function tick() {
  try {
    const res = await fetch(`${APP_URL}/api/engine/run`, {
      method: "POST",
      headers: {
        ...(WORKER_SECRET
          ? { Authorization: `Bearer ${WORKER_SECRET}` }
          : {}),
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Engine tick failed with ${res.status}: ${body}`);
    }
    const data = await res.json();
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] Engine tick: processed=${data.processed ?? 0}, errors=${data.errors ?? 0}`
    );
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Worker error:`, err);
  }
}

console.log(`Worker started. Polling ${APP_URL}/api/engine/run every ${INTERVAL / 1000}s`);
tick();
setInterval(tick, INTERVAL);
