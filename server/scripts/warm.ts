/**
 * warm.ts — Pre-warm the backend before a demo.
 *
 * Pings /api/health (with retries) so the first real request during the demo
 * isn't paying cold-start latency. Run ~5 minutes before judging:
 *
 *   npm run warm                 # uses http://localhost:8080
 *   BASE_URL=https://... npm run warm
 *
 * Exits 0 when the service responds ok:true, 1 otherwise.
 */

interface HealthResponse {
  ok: boolean;
  geminiConfigured?: boolean;
  version?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function warm(
  baseUrl = process.env.BASE_URL ?? "http://localhost:8080",
  attempts = 3,
): Promise<HealthResponse | null> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/health`;
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.ok) {
        const body = (await res.json()) as HealthResponse;
        // eslint-disable-next-line no-console
        console.log(
          `[warm] ok=${body.ok} geminiConfigured=${body.geminiConfigured ?? false} (attempt ${i})`,
        );
        return body;
      }
      // eslint-disable-next-line no-console
      console.warn(`[warm] ${url} -> HTTP ${res.status} (attempt ${i}/${attempts})`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[warm] ${url} unreachable (attempt ${i}/${attempts}):`, (err as Error).message);
    }
    if (i < attempts) await sleep(2000);
  }
  return null;
}

// Run directly: `tsx scripts/warm.ts`
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  warm()
    .then((res) => process.exit(res?.ok ? 0 : 1))
    .catch(() => process.exit(1));
}
