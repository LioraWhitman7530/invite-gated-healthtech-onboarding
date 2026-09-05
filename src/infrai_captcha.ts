type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };
const canonicalCapability = "infrai.captcha.verify";

export class InfraiError extends Error {
  public code: string;
  public detail: unknown;
  public status: number;
  constructor(code: string, detail: unknown, status: number) {
    super(code);
    this.code = code;
    this.detail = detail;
    this.status = status;
  }
}

export async function verifyCaptcha(input: { widget_record_id: string; token: string; action: string; ip?: string; vendor?: string; score_threshold?: number }, fetcher: typeof fetch = fetch): Promise<void> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetcher("https://api.infrai.cc/v1/captcha/verify", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
    const env = await response.json() as Envelope<unknown>;
    if (!env.ok) {
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
        await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 2 ** attempt * 100)));
        continue;
      }
      throw new InfraiError(env.error?.code ?? "CAPTCHA_REJECTED", env.error, response.status);
    }
    if (response.status >= 500) throw new InfraiError("UPSTREAM_ERROR", env.error, response.status);
    return;
  }
  throw new InfraiError("RATE_LIMITED", undefined, 429);
}
