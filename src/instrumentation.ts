export async function register() {
  // Runs once when the Next.js server boots (not in the edge/browser runtime).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { ensureSeed } = await import("@/lib/seed");
      await ensureSeed();
    } catch (error) {
      console.error("[seed-failed]", error instanceof Error ? error.message : error);
    }
  }
}
