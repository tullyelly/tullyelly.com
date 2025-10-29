export async function waitAppReady(baseURL: string): Promise<void> {
  const url = new URL("/api/health", baseURL).toString();
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // ignore errors and retry
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error("App did not become ready in time");
}
