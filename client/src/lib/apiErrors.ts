export class ApiRequestError extends Error {
  readonly code?: string;

  constructor(public readonly status: number, body: string) {
    super(`${status}: ${body}`);
    this.name = "ApiRequestError";
    try {
      const payload = JSON.parse(body);
      if (typeof payload?.code === "string") this.code = payload.code;
    } catch {
      // Non-JSON proxy errors still retain their HTTP status.
    }
  }
}
